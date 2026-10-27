import "server-only";
import { saveTasteSelection } from "@/lib/qloo/persistence";
import { z } from "zod";
import { verifiedStore } from "@/lib/integration/orchestrator";
import { QlooError } from "@/lib/qloo/client";
import { qlooClient, qlooReceiptSecret } from "@/lib/qloo/server";
import { discoverTasteRecommendations, TasteValidationError } from "@/lib/qloo/workflow";
import { IntegrationError } from "@/lib/integration/errors";

const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
function failure(error: unknown) {
  const status = error instanceof QlooError ? error.status : error instanceof z.ZodError || error instanceof TasteValidationError ? 400 : error instanceof IntegrationError && error.code === "AUTH_REQUIRED" ? 401 : 503;
  const code = error instanceof QlooError ? error.code : status === 400 ? "INVALID_TASTE_SELECTION" : status === 401 ? "AUTH_REQUIRED" : "TASTE_UNAVAILABLE";
  const message = status === 401 ? "Sign in to explore your taste." : error instanceof TasteValidationError ? error.message : status === 400 ? "Review your selections and try again." : "Taste is unavailable. Qloo access and local database setup must be configured; no recommendations have been invented.";
  return json({ data: null, error: { code, message } }, status);
}
export async function GET() {
  try {
    const { store, client, userId } = await verifiedStore();
    const [page, packs, saved] = await Promise.all([
      store.listMemories({ limit: 50 }), store.list("ready_packs"),
      client.from("ready_pack_discoveries").select("id,ready_pack_id,entity,interests,created_at,provenance").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
    ]);
    return json({ data: { memories: page.items.map(m => ({ id: m.id, title: m.title, category: m.category })), packs: packs.filter(p => p.status === "active" && p.packType === "event").map(p => ({ id: p.id, title: p.title })), saved: saved.data || [], persistenceAvailable: !saved.error, liveEnabled: process.env.QLOO_LIVE_ENABLED === "true" && Boolean(process.env.QLOO_API_KEY) }, error: null });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return json({ error: { message: "Request origin rejected." } }, 403);
    if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: { message: "Use application/json." } }, 415);
    const { store, userId } = await verifiedStore();
    const text = await request.text();
    if (text.length > 110000) return json({ error: { message: "Request too large." } }, 413);
    let input: unknown;
    try { input = JSON.parse(text); } catch { return json({ error: { message: "Invalid JSON." } }, 400); }
    const result = await discoverTasteRecommendations(input, {
      userId, secret: qlooReceiptSecret(),
      ownedMemoryIds: async ids => (await store.getMemories(ids)).filter(m => m.userId === userId).map(m => m.id),
      search: input => qlooClient().search(input), insights: input => qlooClient().insights(input),
      save: async selection => {
        if (selection.readyPackId) {
          const pack = await store.get("ready_packs", selection.readyPackId);
          if (pack.status !== "active" || pack.packType !== "event") throw new TasteValidationError("Choose an active event Ready Pack.");
        }
        return saveTasteSelection(userId, selection);
      },
    });
    return json({ data: result, error: null });
  } catch (error) { return failure(error); }
}


