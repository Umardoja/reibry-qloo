# Qloo live verification — BLOCKED

Checked October 25, 2026, Africa/Lagos. This report records readiness and offline verification, **not live API success**.

## Access prerequisites

Presence-only checks found all six process variables absent:

| Variable | State |
| --- | --- |
| QLOO_API_KEY | Absent |
| QLOO_LIVE_ENABLED | Absent; gate disabled |
| QLOO_RECEIPT_SECRET | Absent |
| NEXT_PUBLIC_SUPABASE_URL | Absent |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Absent |
| SUPABASE_SERVICE_ROLE_KEY | Absent |

The only root environment file is `.env.example`, containing placeholders. No actual credential was inspected, printed, copied or tested. The owner confirmed no disposable Supabase project is identified/approved and restricted this phase to local inspection, documentation and offline tests. No live request or hosted mutation is authorized.

## Event transport decision: pending credential instructions

The requested [hackathon developer guide](https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide) was attempted again and remained inaccessible. The owner independently confirmed the official kit's supported interfaces. Public HTTPS documentation is not evidence that a particular event credential permits raw HTTPS access.

Official evidence reviewed:

- [Qloo kit](https://github.com/qloo/qloo-hackathon-kit): Node 22.19+, harness 0.1.26+, private credential setup.
- [API access](https://github.com/qloo/qloo-hackathon-kit/blob/main/docs/API_ACCESS.md): event-issued credentials/approved gateways; supported harness surfaces are `qloo api`, `qloo exec`, `qloo mcp`, `qloo explore`.
- [CLI integration](https://github.com/qloo/qloo-hackathon-kit/blob/main/starter/cli-workflow/README.md): backend subprocess use, JSON output, search command and `--dry-run`.
- [MCP integration](https://github.com/qloo/qloo-hackathon-kit/blob/main/starter/mcp-client/README.md): local stdio process and backend environment; six result statuses; VM/container deployment, not serverless functions.

**Direct HTTPS authorization: UNVERIFIED.** Existing HTTPS implementation remains intact. No harness was installed, configured or invoked. No transport was selected on the owner's behalf.

## Smallest compatible change if the harness is required

The existing `TasteDependencies.search` and `.insights` functions are already a narrow seam. Keep the UI, workflow schemas, confirmation receipts, ownership checks and persistence unchanged.

The smallest likely adapter is a **server-only CLI adapter using `qloo api`**, because it returns raw endpoint JSON and can reuse the current entity validators. The documented search command shape is `qloo api search --query <reviewed label> --type movie --take 5 --json`; the CLI's short `--type` option must not be confused with the direct HTTP `types` query parameter. Inspect the pinned harness's local help/dry-run output before constructing the Insights command: its exact subcommand/flags were not established by the retrieved starter, so no speculative executable command is supplied here.

Required adapter work after transport approval:

1. Pin an approved harness version at least 0.1.26 and meet Node 22.19+. Resolve the installed executable/entrypoint; launch with an argument array and `shell:false`, never concatenate labels into a shell string. On Windows, resolve the JS entrypoint behind any `.cmd` shim instead of enabling a shell.
2. Supply the key only through a controlled server environment or harness-private configuration; never `--api-key`. Restrict executable/path and working directory. Do not forward unnecessary service-role secrets to the child process.
3. Bound subprocess lifetime, stdout/stderr size and concurrency; terminate the process on deadline. Avoid multiplying application retries by harness retries; verify the harness's request budget first.
4. Parse only expected JSON, reuse schema validation, and translate failures to existing safe error codes. Never log raw stdout/stderr because they may contain input or provider diagnostics.
5. Preserve both external-call authorization gates and use an explicit server transport setting, with **no automatic fallback** to HTTPS on harness error.
6. Run offline adapter contract tests for argument injection, timeout, malformed output, auth/rate-limit failures and returned IDs before an authorized live test.

Alternative: `qloo exec` or MCP workflows return a normalized envelope rather than the current raw endpoint envelope. This needs additional mapping for `ok`, `empty`, `needs_input`, `partial`, `degraded`, and `error`. Never flatten partial/degraded output into unqualified live success or bypass the user's entity confirmation. MCP adds an SDK and process lifecycle; it is a larger change than the CLI endpoint adapter for this deterministic flow. The official MCP guidance rules out deploying that subprocess integration as ordinary serverless functions; a container/VM or separately approved gateway would be needed. Do not assume Vercel is a compatible final backend until transport is settled.

## Read-only smoke script review and fixes

`scripts/verify-qloo.ts` delegates to the offline-testable `scripts/lib/qloo-smoke.ts`.

- Requires literal `--allow-live` and `QLOO_LIVE_ENABLED=true` before transport.
- Missing/placeholder key fails before HTTP.
- Searches only the public title The Matrix, chooses the returned 1999 match or a unique exact title; unresolved ambiguity fails.
- Passes the actual returned entity ID to movie Insights; validates responses through the production adapter.
- Makes at most four HTTP attempts: two operations, one retry each. Eight-second per-attempt timeout; retry delays are bounded. No pagination or bulk harvesting.
- Reports safe endpoint path, HTTP status (null for transport failure), time to response headers, total elapsed time and result counts. No key, query, raw result, user data, password or token is included.
- Exits nonzero for missing authorization, access failure, malformed data, unresolved seed or empty recommendations. Imports no Supabase module and performs no database write.

The previous script lacked per-request HTTP status/count telemetry and selected the first exact-title match. Both defects were corrected; five new deterministic tests exercise the smoke runner with injected synthetic HTTP. Their passing outcome is **not live Qloo evidence**.

After direct-HTTPS permission and explicit live authorization, the intended command remains:

```powershell
node --experimental-strip-types scripts/verify-qloo.ts --allow-live
```

Plain Node does not load Next.js `.env.local`. Supply a secure process environment, or after authorization add `--env-file=.env.local` before the script path. Do not type secret assignments into recorded shell history. A harness-only credential requires the adapter and an equivalent bounded harness smoke test first.

## Evidence ledger

| Level | Result |
| --- | --- |
| Mocked client/workflow/smoke tests | Offline only; current command results in release checklist |
| Real Qloo request | **NOT RUN** |
| Credential accepted / quota confirmed | **NOT VERIFIED** |
| Direct HTTPS event permission | **UNVERIFIED** |
| Authenticated app workflow | **BLOCKED** |
| Public judge-accessible demo | **NOT DEPLOYED** |

Next owner action: obtain the non-secret credential instructions specifying allowed transport, quota and expiration, configure the credential securely, then explicitly authorize a narrowly scoped read-only test. Do not send the credential itself in chat.

Final offline checks: 303/303 tests passed; typecheck, lint and webpack production build exited 0. The gate-only CLI run exited 1 as intended with LIVE_NOT_AUTHORIZED and zero requests. No result in this report establishes live API compatibility. See QLOO_RELEASE_CHECKLIST.md for the initial failures, fixes and full command record.
