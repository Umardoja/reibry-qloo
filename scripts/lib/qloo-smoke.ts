import { createQlooClient, QlooError } from "../../src/lib/qloo/client.ts";

type Environment = { QLOO_API_KEY?: string; QLOO_LIVE_ENABLED?: string };
type RequestMetric = { endpoint: "/search" | "/v2/insights"; httpStatus: number | null; elapsedMs: number };
type SmokeReport = { requests: RequestMetric[]; requestCount: number; searchMatches: number; recommendationCount: number; elapsedMs: number } &
  ({ status: "failed"; code: string; provenance?: never } | { status: "passed"; provenance: "qloo-live"; code?: never });
/** No database imports, raw responses, URLs with query strings, or credential output. */
export async function runQlooSmoke(args: string[], env: Environment, transport: typeof fetch = fetch): Promise<SmokeReport> {
  const started = performance.now();
  const requests: RequestMetric[] = [];
  let searchMatches = 0;
  let recommendationCount = 0;
  const report = () => ({ requests, requestCount: requests.length, searchMatches, recommendationCount, elapsedMs: Math.round(performance.now() - started) });
  if (!args.includes("--allow-live") || env.QLOO_LIVE_ENABLED !== "true") return { status: "failed", code: "LIVE_NOT_AUTHORIZED", ...report() };
  const measuredFetch: typeof fetch = async (input, init) => {
    if (requests.length >= 4) throw new Error("Request budget exceeded");
    const endpoint = new URL(String(input)).pathname;
    if (endpoint !== "/search" && endpoint !== "/v2/insights") throw new Error("Unexpected endpoint");
    const requestStarted = performance.now();
    const metric: RequestMetric = { endpoint, httpStatus: null, elapsedMs: 0 };
    requests.push(metric);
    try { const response = await transport(input, init); metric.httpStatus = response.status; return response; }
    finally { metric.elapsedMs = Math.round(performance.now() - requestStarted); }
  };
  try {
    const client = createQlooClient({ key: env.QLOO_API_KEY, retries: 1, timeoutMs: 8000, fetch: measuredFetch });
    const matches = await client.search({ query: "The Matrix", type: "movie" });
    searchMatches = matches.length;
    const exact = matches.filter(entity => entity.name.toLowerCase() === "the matrix");
    const seed = exact.find(entity => String(entity.properties?.release_year) === "1999") ?? (exact.length === 1 ? exact[0] : undefined);
    if (!seed) return { status: "failed", code: "PUBLIC_SEED_NOT_RESOLVED", ...report() };
    const movies = await client.insights({ filterType: "urn:entity:movie", entityIds: [seed.entity_id] });
    recommendationCount = movies.length;
    if (!movies.length) return { status: "failed", code: "NO_RECOMMENDATIONS", ...report() };
    return { status: "passed", provenance: "qloo-live", ...report() };
  } catch (error) {
    return { status: "failed", code: error instanceof QlooError ? error.code : "VALIDATION_FAILED", ...report() };
  }
}
