// Read-only live smoke test. Run ONLY after explicit user authorization.
import { runQlooSmoke } from "./lib/qloo-smoke.ts";

async function main() {
  const result = await runQlooSmoke(process.argv.slice(2), { QLOO_API_KEY: process.env.QLOO_API_KEY, QLOO_LIVE_ENABLED: process.env.QLOO_LIVE_ENABLED });
  console.info(JSON.stringify(result));
  if (result.status !== "passed") process.exitCode = 1;
}
main().catch(() => { console.error(JSON.stringify({ status: "failed", code: "VALIDATION_FAILED" })); process.exitCode = 1; });
