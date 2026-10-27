import assert from "node:assert/strict";
import test from "node:test";
import { runQlooSmoke } from "../scripts/lib/qloo-smoke.ts";
import { movie, recommendation } from "./fixtures/qloo.ts";
const env = { QLOO_API_KEY: "synthetic-secret-never-print", QLOO_LIVE_ENABLED: "true" };
const seed = { ...movie, name: "The Matrix", properties: { release_year: 1999 } };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
test("smoke requires both explicit gates before transport", async () => {
  let calls = 0;
  const http = (async () => { calls++; return reply({}); }) as typeof fetch;
  for (const [args, settings] of [[[], env], [["--allow-live"], { ...env, QLOO_LIVE_ENABLED: "false" }]] as const) {
    const result = await runQlooSmoke([...args], settings, http);
    assert.equal(result.code, "LIVE_NOT_AUTHORIZED");
  }
  assert.equal(calls, 0);
});
test("synthetic transport verifies actual returned seed, status metrics and redaction; NOT live evidence", async () => {
  const result = await runQlooSmoke(["--allow-live"], env, async (input, init) => {
    const url = new URL(String(input)); assert.equal(init?.method, undefined);
    assert.equal(url.origin, "https://hackathon.api.qloo.com");
    if (url.pathname === "/search") { assert.equal(url.searchParams.get("query"), "The Matrix"); return reply({ results: [seed] }); }
    assert.equal(url.searchParams.get("signal.interests.entities"), seed.entity_id);
    return reply({ results: { entities: [recommendation] } });
  });
  assert.equal(result.status, "passed"); assert.equal(result.requestCount, 2);
  assert.deepEqual(result.requests.map(r => r.httpStatus), [200, 200]);
  assert.equal(result.recommendationCount, 1);
  assert.ok(result.elapsedMs >= 0);
  assert.doesNotMatch(JSON.stringify(result), /synthetic-secret|entity_id|The Matrix/);
});
test("missing key, malformed data and failed access are safe failures", async () => {
  const missing = await runQlooSmoke(["--allow-live"], { QLOO_LIVE_ENABLED: "true" }, async () => { throw new Error("must not call"); });
  assert.equal(missing.code, "QLOO_NOT_CONFIGURED"); assert.equal(missing.requestCount, 0);
  const denied = await runQlooSmoke(["--allow-live"], env, async () => reply({ error: env.QLOO_API_KEY }, 403));
  assert.equal(denied.code, "QLOO_ACCESS_DENIED"); assert.equal(denied.requests[0].httpStatus, 403);
  const malformed = await runQlooSmoke(["--allow-live"], env, async () => reply({ results: [{}] }));
  assert.equal(malformed.code, "QLOO_MALFORMED_RESPONSE");
  assert.doesNotMatch(JSON.stringify([missing, denied, malformed]), /synthetic-secret/);
});
test("smoke never exceeds four HTTP attempts and empty recommendations fail", async () => {
  let calls = 0;
  const result = await runQlooSmoke(["--allow-live"], env, async () => { calls++; return calls === 1 || calls === 3 ? reply({}, 503) : calls === 2 ? reply({ results: [seed] }) : reply({ results: { entities: [] } }); });
  assert.equal(result.code, "NO_RECOMMENDATIONS"); assert.equal(calls, 4);
});
test("smoke does not silently choose an ambiguous public seed", async () => {
  const result = await runQlooSmoke(["--allow-live"], env, async () => reply({ results: [{ ...seed, properties: {} }, { ...seed, entity_id: recommendation.entity_id, properties: {} }] }));
  assert.equal(result.code, "PUBLIC_SEED_NOT_RESOLVED"); assert.equal(result.requestCount, 1);
});
