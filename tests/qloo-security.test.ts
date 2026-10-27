import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { providerPolicy } from "../src/lib/integration/provider-policy.ts";
import { withDeadline } from "../src/lib/auth/deadline.ts";
import { isTasteDiscoveryIntent, prepareTasteDiscovery } from "../src/lib/agent/taste-tool.ts";
import { homeAgentPlanSchema, homeAgentToolForPlan } from "../src/lib/agent/home-agent.ts";
import { captureProvider } from "../src/lib/capture/source-preservation.ts";
const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
test("provider configuration failure preserves capture without selecting mock analysis", () => {
  assert.equal(captureProvider(() => providerPolicy({ NODE_ENV: "production" })), null);
  assert.equal(captureProvider(() => "real-provider"), "real-provider");
  assert.match(source("src/lib/integration/orchestrator.ts"), /if \(!ai\) return \{ memory: m, metadata: preserved.metadata, duplicate: false \}/);
});
test("production requires explicit real provider and forbids mock fallback", () => {
  for (const AI_PROVIDER of [undefined, "mock", "unknown"]) assert.throws(() => providerPolicy({ NODE_ENV: "production", AI_PROVIDER, AI_ALLOW_MOCK_FALLBACK: "true" }));
  for (const AI_PROVIDER of ["nvidia", "gemini"]) assert.equal(providerPolicy({ NODE_ENV: "production", AI_PROVIDER, AI_ALLOW_MOCK_FALLBACK: "true" }).fallbackEnabled, false);
  assert.equal(providerPolicy({ NODE_ENV: "development", AI_PROVIDER: "nvidia" }).fallbackEnabled, false);
  assert.equal(providerPolicy({ NODE_ENV: "development", AI_PROVIDER: "nvidia", AI_ALLOW_MOCK_FALLBACK: "true" }).fallbackEnabled, true);
});
test("session deadline covers an unresolved operation and allows ordinary sessions", async () => {
  await assert.rejects(withDeadline(new Promise(() => {}), 10), /timed out/);
  assert.equal(await withDeadline(Promise.resolve("user"), 10), "user");
});
test("protected route guard only renders authenticated children", () => {
  assert.match(source("src/components/auth/require-auth.tsx"), /state === "authenticated" \? children/);
  assert.match(source("src/components/auth/auth-session-provider.tsx"), /withDeadline/);
  assert.match(source("src/proxy.ts"), /\/taste\/:path\*/);
});
test("profile migration revokes table privileges including role reinsertion path", () => {
  const sql = source("supabase/migrations/20261025000000_profile_privileges.sql");
  assert.match(sql, /revoke update, insert, delete on public.profiles from authenticated, anon/);
  assert.match(sql, /grant update\(display_name, onboarding_completed_at, updated_at\)/);
});
test("external persistence has owner FK, idempotent uniqueness, lock and server-only RPC", () => {
  const sql = source("supabase/migrations/20261025000001_taste_discoveries.sql");
  assert.match(sql, /foreign key \(ready_pack_id, user_id\) references public.ready_packs\(id, user_id\)/);
  assert.match(sql, /unique \(ready_pack_id, entity_id\)/); assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /on conflict\(ready_pack_id,entity_id\) do nothing/);
  assert.match(sql, /from public, anon, authenticated/); assert.match(sql, /to service_role/);
  assert.match(sql, /user_id = owner_id and id = any\(p_memory_ids\)/);
  assert.doesNotMatch(sql, /insert into public.ready_pack_items/);
});
test("runtime uses server-only Qloo gate, no fixture imports, safe persistence after verification", () => {
  assert.match(source("src/lib/qloo/server.ts"), /import "server-only"/);
  assert.match(source("src/lib/qloo/server.ts"), /QLOO_LIVE_ENABLED !== "true"/);
  assert.match(source("src/lib/qloo/persistence.ts"), /import "server-only"/);
  assert.doesNotMatch(source("src/lib/qloo/client.ts"), /console\.|fixtures/);
  assert.doesNotMatch(source("src/app/taste/page.tsx"), /QLOO_API_KEY|SUPABASE_SERVICE_ROLE_KEY/);
});
test("bounded Home tool prepares confirmation instead of persisting or inventing results", () => {
  assert.equal(isTasteDiscoveryIntent("Movie night is this weekend. Help me discover something based on what I've saved."), true);
  assert.equal(isTasteDiscoveryIntent("Where is my recipe?"), false);
  const prepared = prepareTasteDiscovery([{ id: "owned", title: "A film I enjoyed" }]);
  assert.equal(prepared.requiresPreferenceConfirmation, true); assert.deepEqual(prepared.candidateMemoryIds, ["owned"]);
  const plan = homeAgentPlanSchema.parse({ intent: "DISCOVER_TASTE", tool: "discoverTasteRecommendations", searchQuery: "", requiredConcepts: [], needsClarification: true, reply: "Confirm interests" });
  assert.equal(homeAgentToolForPlan(plan), "discoverTasteRecommendations");
  assert.equal(homeAgentToolForPlan({ ...plan, intent: "SEARCH_MEMORY" }), "none");
});
