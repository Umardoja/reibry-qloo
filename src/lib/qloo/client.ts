// Dependency-injected transport for deterministic HTTP tests. Runtime entry is server.ts.
import { z } from "zod";
import { wireEntitySchema, searchInput, insightsInput } from "./contracts.ts";

export const QLOO_BASE = "https://hackathon.api.qloo.com";
export class QlooError extends Error {
  code: string; status: number;
  constructor(code: string, status = 503) { super(code); this.code = code; this.status = status; }
}
export function createQlooClient(config: { key?: string; timeoutMs?: number; retries?: number; fetch?: typeof fetch; sleep?: (ms: number) => Promise<void> }) {
  const timeout = z.number().int().min(10).max(30000).parse(config.timeoutMs ?? 8000);
  const retries = z.number().int().min(0).max(2).parse(config.retries ?? 1);
  const transport = config.fetch ?? fetch;
  async function request(path: string, parameters: Record<string, string>): Promise<unknown> {
    if (!config.key?.trim() || /^(your_|replace_)/i.test(config.key)) throw new QlooError("QLOO_NOT_CONFIGURED");
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      try {
        const url = new URL(path, QLOO_BASE);
        Object.entries(parameters).forEach(([name, value]) => url.searchParams.set(name, value));
        const response = await transport(url, { headers: { "X-Api-Key": config.key, Accept: "application/json" }, signal: controller.signal, cache: "no-store", redirect: "error" });
        // Entity Search documents 404 as "No results"; Insights does not.
        if (path === "/search" && response.status === 404) { await response.body?.cancel(); return { results: [] }; }
        if (!response.ok) {
          const retryable = response.status === 429 || response.status >= 500;
          if (retryable && attempt < retries) {
            const retryAfter = Number(response.headers.get("retry-after"));
            await response.body?.cancel();
            clearTimeout(timer);
            await (config.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms))))(Math.min(1000, Math.max(100 * (attempt + 1), Number.isFinite(retryAfter) ? retryAfter * 1000 : 0)));
            continue;
          }
          throw new QlooError(response.status === 429 ? "QLOO_RATE_LIMITED" : response.status === 401 || response.status === 403 ? "QLOO_ACCESS_DENIED" : response.status === 404 ? "QLOO_ENDPOINT_UNAVAILABLE" : "QLOO_UNAVAILABLE", response.status === 429 ? 429 : 503);
        }
        try { return await response.json(); } catch { throw new QlooError("QLOO_MALFORMED_RESPONSE", 502); }
      } catch (error) {
        if (error instanceof QlooError) throw error;
        if (attempt === retries) throw new QlooError(controller.signal.aborted ? "QLOO_TIMEOUT" : "QLOO_UNAVAILABLE");
        await (config.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms))))(100 * (attempt + 1));
      } finally { clearTimeout(timer); }
    }
    throw new QlooError("QLOO_UNAVAILABLE");
  }
  return {
    async search(input: z.input<typeof searchInput>) {
      const { query, type } = searchInput.parse(input);
      // Search category is `types`; Insights output category is `filter.type`.
      const raw = await request("/search", { query, types: `urn:entity:${type}`, take: "5" });
      const parsed = z.object({ success: z.literal(true).optional(), results: z.array(wireEntitySchema).max(100) }).safeParse(raw);
      if (!parsed.success) throw new QlooError("QLOO_MALFORMED_RESPONSE", 502);
      return parsed.data.results.filter(entity => entity.types.includes(`urn:entity:${type}`)).slice(0, 5);
    },
    async insights(input: z.input<typeof insightsInput>) {
      const { filterType, entityIds } = insightsInput.parse(input);
      const raw = await request("/v2/insights", { "filter.type": filterType, "signal.interests.entities": entityIds.join(","), take: "8" });
      const parsed = z.object({ success: z.literal(true).optional(), results: z.object({ entities: z.array(wireEntitySchema).max(100) }) }).safeParse(raw);
      if (!parsed.success || parsed.data.results.entities.some(e => !e.types.includes(filterType))) throw new QlooError("QLOO_MALFORMED_RESPONSE", 502);
      return [...new Map(parsed.data.results.entities.filter(e => !entityIds.includes(e.entity_id)).map(e => [e.entity_id, e])).values()].slice(0, 8);
    },
  };
}

