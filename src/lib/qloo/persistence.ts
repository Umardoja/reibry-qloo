import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { QlooEntity } from "./contracts";

/** Elevated client is limited to this atomic RPC, after session + receipt verification. */
export async function saveTasteSelection(userId: string, selection: { readyPackId: string | null; entity: QlooEntity; interests: QlooEntity[]; memoryIds: string[] }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || key.startsWith("your_")) throw new Error("Taste persistence is not configured");
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.rpc("save_taste_selection", { p_user_id: userId, p_pack_id: selection.readyPackId, p_entity: selection.entity, p_interests: selection.interests, p_memory_ids: selection.memoryIds });
  if (error || typeof data !== "string") throw new Error("Taste persistence unavailable");
  return data;
}
