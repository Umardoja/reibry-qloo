# REIBRY Taste implementation report

> Current access/transport assessment and release work: [QLOO_LIVE_VERIFICATION.md](QLOO_LIVE_VERIFICATION.md) and [QLOO_RELEASE_CHECKLIST.md](QLOO_RELEASE_CHECKLIST.md). This report records the implementation baseline.

Date: October 25, 2026 (Africa/Lagos). Work is confined to `reibry-qloo`. No commit, push, remote, branch switch, deployment, hosted database access, personal Memory access, or live Qloo API request occurred.

## Implemented experience

`/taste` connects user-selected saved Memories to external movie discoveries. Home has an entry card and recognizes movie-night/discovery requests through its bounded tool dispatcher. The dedicated flow performs:

1. Authenticated, owner-scoped retrieval of up to 50 recent Memories, with minimal title/category data returned to the browser.
2. Explicit selection of up to five Memories. The user edits and confirms short movie/music-artist search labels before they leave REIBRY.
3. Qloo entity lookup. Every match requires confirmation; ambiguous matches show names, years, available descriptions/disambiguation and IDs. No automatic first-match selection.
4. Insights movie discovery from the confirmed entity IDs. Seed entities and duplicate results are removed. These are external discoveries, never presented as saved Memories.
5. A proposal naming the selected film and destination Ready Pack. A separate confirmation invokes persistence.
6. Owner-scoped saved selections on reload, and a separate Qloo section on the existing Plan detail page.

The UI includes empty, unavailable, loading and error states, native checkboxes/radios/selects, labeled controls, focus outlines and responsive layouts. The new Movie night Plan has no date; the UI explicitly says so rather than guessing what “this weekend” means. The current Memory picker is limited to 50 recent items; full-library pagination is not part of this slice.

No mock recommendation mode is available in the application. Tests use explicitly synthetic protocol fixtures only. An unconfigured installation displays unavailability and cannot manufacture results.

## API contract and documentation

The three requested `docs.qloo.com` pages were attempted but could not be retrieved in this environment. Official Qloo-owned mirrors supplied the Search, Insights, authentication and response references:

- [Entity Search](https://github.com/qloo/docs-public/blob/main/reference/get-search.md)
- [Insights deep dive](https://github.com/qloo/docs-public/blob/main/reference/insights-api-deep-dive.md)
- [Basic Insights response example](https://github.com/qloo/docs-public/blob/main/reference/basic-insights-use-case.md)
- [Authentication](https://github.com/qloo/docs-public/blob/main/reference/api-onboarding.md)
- [Event access guidance](https://github.com/qloo/qloo-hackathon-kit/blob/main/docs/API_ACCESS.md)

The hackathon host is the user-specified `https://hackathon.api.qloo.com`; authentication uses `X-Api-Key`. Search uses `query`, `types` and `take=5`; application interest names map to entity URNs (`movie` -> `urn:entity:movie`, `artist` -> `urn:entity:artist`). Insights uses `filter.type=urn:entity:movie`, comma-separated `signal.interests.entities`, and `take=8`. Search types and Insights output filters are separate contracts; other input types and arbitrary parameters are rejected. The Search reference describes `types` without enumerating its values; those values and credential-specific behavior still require the authorized live smoke test.

Responses are schema validated. The adapter accepts `types` and the documented `subtype` entity representation, normalizes UUID case, bounds descriptions, and discards unneeded metadata. Missing identity/type fields, false success markers, invalid JSON and invalid movie results fail closed. Search 404 is the documented empty-result case; Insights 404 is unavailable. 401/403 fail safely without retry, 429/5xx/network failures have bounded retries, and AbortController bounds request time. Default: 8 seconds per attempt, one retry; configuration permits at most two retries. Redirects are rejected to avoid forwarding credentials. No request headers, queries, bodies, keys or private Memories are logged by this client.

`QLOO_LIVE_ENABLED=false` is the default. A configured key alone never authorizes a call. `QLOO_API_KEY` and `QLOO_RECEIPT_SECRET` are server-only. The injectable HTTP core has no environment access; only the `server-only` runtime wrapper reads credentials. No live API success is claimed.

## Agent integration and security boundaries

`discoverTasteRecommendations` is a fixed, schema-bounded operation shared by the Taste endpoint and agent tool module. Home recognizes the intention, retrieves only the authenticated user's candidates, and hands off to preference confirmation. Generative planning can select the fixed tool but cannot supply arbitrary database operations. Existing provider implementations are retained; Taste itself does not require an LLM to invent preferences or recommendations.

The resolve/discover/save state machine requires explicit confirmation literals. HMAC-signed receipts bind the authenticated user, Memory IDs, offered entity choices, returned recommendations, workflow stage and a 15-minute expiry. The server validates receipts and reloads Memory ownership before progressing. Client modifications to names, provenance, IDs, stage or user identity are rejected. Signed receipts are integrity protection, not encryption; only minimal user-visible metadata is included.

Saved text is never interpreted as a tool instruction. Only user-reviewed labels enter Qloo. The UI explains the selected signals as request context, not an invented causal explanation of ranking. “New” means externally discovered and not one of the seed entities; REIBRY does not claim a film has never been seen by the user or is absent from every free-text Memory.

## Security baseline: observed and corrected

| Area | Before this change | Result |
| --- | --- | --- |
| Production AI selection | Missing provider selected mock; explicit mock was accepted in production | Production requires NVIDIA or Gemini; unknown/missing/mock fails closed |
| Mock fallback | Enabled unless explicitly false, including production | Only explicit development opt-in; forbidden in production |
| Profile role updates | Table-wide UPDATE grant remained despite column REVOKE | Migration revokes table UPDATE, then grants only profile-edit columns |
| Profile role insertion | Broad INSERT/DELETE allowed delete/reinsert privilege path | Revoked; existing auth trigger remains responsible for creation |
| Session guard | Children only shown for authenticated state; server API ownership checks present | Retained, with 12-second deadline covering native sync, HTTP and JSON; error clears cached identity and offers retry |
| Protected routes | Client guards present; proxy coverage omitted Plans/Taste/settings/admin | Coverage added; API authorization remains authoritative |
| Capture preservation | Original source inserted before AI; analysis failures preserve evidence | Retained; provider-selection failure now returns the already-saved partial capture rather than failing after insertion |
| Environment | Only placeholder `.env.example`; no `.env.local` | Placeholder Qloo configuration added; no credentials copied |

A source-pattern scan found zero files matching the tested private-key/provider-token/JWT patterns. This is a limited heuristic scan, not proof that every possible secret is absent. Android and NVIDIA/Gemini implementations were not modified. The original REIBRY directory was not accessed.

## Persistence design and migration requirements

Two migrations are supplied, not applied to any hosted environment:

- `20261025000000_profile_privileges.sql`
- `20261025000001_taste_discoveries.sql`

`ready_pack_discoveries` holds external entity UUIDs and validated metadata separately from `ready_pack_items.memory_id`. A composite `(ready_pack_id,user_id)` foreign key enforces ownership. Row-level security permits only owner reads. Ordinary authenticated/anonymous clients have no insert/update/delete privileges and cannot execute the save RPC.

After session and receipt verification, the server calls the narrow `save_taste_selection` RPC using an explicitly configured **local/test** Supabase service-role credential. It accepts the verified owner ID from the server, rechecks every selected Memory and pack, serializes per-owner creation with a transaction advisory lock, creates or reuses a Movie night Plan/Ready Pack, and inserts an idempotent selection. The service key never enters the browser. It is not configured or used in this task. The SQL function has an empty search path and qualified table references.

The local PostgreSQL test used a disposable cluster, synthetic identities and a minimal foundation matching the relevant contracts. It applied the original Ready Pack migrations plus the two new migrations, proved privilege/ownership/rollback/idempotency behavior and stopped the cluster. It was not a full Supabase Auth/PostgREST integration test.

## Exact authored/modified files

New:

- `src/lib/qloo/contracts.ts`, `client.ts`, `server.ts`, `receipts.ts`, `workflow.ts`, `persistence.ts`
- `src/lib/agent/taste-tool.ts`
- `src/lib/integration/provider-policy.ts`
- `src/lib/auth/deadline.ts`
- `src/app/api/taste/route.ts`
- `src/app/taste/page.tsx`, `taste.css`
- `src/components/plans/taste-discoveries.tsx`
- The two migrations named above
- `tests/fixtures/qloo.ts`, `tests/qloo.test.ts`, `tests/qloo-security.test.ts`, `tests/qloo-database.sql`
- `scripts/verify-qloo.ts`
- `docs/hackathons/QLOO_IMPLEMENTATION_REPORT.md`, `QLOO_TEST_RESULTS.md`, `QLOO_SUBMISSION_GATE.md`

Modified:

- `.env.example`, `package.json`
- `src/lib/integration/mock.ts`, `src/lib/integration/orchestrator.ts`
- `src/lib/capture/source-preservation.ts`
- `src/lib/auth/service.ts`, `src/components/auth/auth-session-provider.tsx`
- `src/lib/supabase/proxy.ts`, `src/proxy.ts`
- `src/lib/agent/home-agent.ts`, `src/app/api/home/route.ts`
- `src/app/page.tsx`, `src/components/home/home-conversation-provider.tsx`
- `src/components/layout/app-shell.tsx`, `src/app/plans/[id]/page.tsx`
- `tests/account-reliability.test.ts` (updated the source assertion for the equivalent async session flow)

`package.json` includes the new tests and selects Next.js's supported webpack production builder because Turbopack failed to connect to a compiler worker in this environment. Dependency versions and lockfile were not changed. Generated build output, local logs and disposable PostgreSQL files are ignored.

## Readiness

See `QLOO_TEST_RESULTS.md` for actual command results and `QLOO_SUBMISSION_GATE.md` for the release gates. This is a locally implemented feature with deterministic protocol/workflow and local SQL validation. It is not yet a verified live Qloo demo or an authenticated full-app workflow.


