# REIBRY Taste browser E2E results

Date: October 25, 2026, Africa/Lagos.

**Authenticated browser E2E: BLOCKED / NOT RUN.** No disposable Supabase project or accounts are approved. All Supabase variables are absent. Docker's Linux engine pipe is unavailable; the standalone local PostgreSQL installation has no pgvector extension. The previously tested temporary PostgreSQL cluster is not Supabase Auth/PostgREST. No browser authentication, persisted browser reload or judge access is claimed.

The owner's latest authorization permits local inspection, documentation and offline tests only. No hosted migrations, account provisioning or live Qloo calls were attempted. There is no fixture fallback in the runtime app and no fabricated authentication success.

## What is already covered offline

Production workflow tests cover preference/match/save confirmation, signed receipt integrity/expiry/user binding, owner Memory revalidation, invalid entity rejection and provider failure. Previous disposable PostgreSQL execution verified RLS, cross-user Memory/pack rejection, atomic rollback, idempotent saves and owner reads. That is narrower than current full Supabase/browser verification. The previous production HTTP smoke established page serving and fail-closed unconfigured API behavior, not user interaction.

## Exact browser runbook once the environment is approved

Use Playwright or an equivalent browser tool against loopback/staging specifically approved for testing. Provision two fresh non-admin users A and B; use private test credentials, no personal accounts. Do not retain browser traces, storage-state files, network headers or screenshots containing credentials/tokens. Prefer assertions and redacted scenario summaries. Test screenshot content must be synthetic.

Choose and label the run:

- **FIXTURE-DRIVEN:** retain real disposable Supabase authentication and persistence; inject synthetic Qloo responses in a test-only server transport harness. Do not merely intercept `/api/taste` in the browser and call that backend E2E. No such harness is currently enabled. Keep it outside production configuration and block all external Qloo traffic. Every report and screenshot must state fixture-driven.
- **LIVE QLOO:** only after transport compatibility, secure configuration and explicit authorization. Use synthetic Memories with public film/artist labels. Capture safe request-status/count evidence separately.

| # | Action | Required assertion | Current result |
| --- | --- | --- | --- |
| 1 | Sign in as A via `/auth` | Real authenticated session; no bypass | BLOCKED |
| 2 | Capture two text Memories: “The Matrix” and “Daft Punk” | Both owned by A; source content synthetic | BLOCKED |
| 3 | Open `/taste` | Both Memories available; no B content | BLOCKED |
| 4 | Select both | Checkbox selection alone makes no external call/write | BLOCKED |
| 5 | Review labels; select Movie / Music artist; confirm | Only reviewed labels sent | BLOCKED |
| 6 | Resolve entities | IDs/types valid; empty/ambiguous responses shown honestly | BLOCKED |
| 7 | Select correct matches, then confirm | No Insights call before match confirmation | BLOCKED |
| 8 | Retrieve movies | Attribution, IDs and response-supported metadata; no Memory relabeling | BLOCKED |
| 9 | Choose one recommendation | Proposal only; database row count unchanged | BLOCKED |
| 10 | Confirm save | Exactly one external discovery; no Qloo ID in Memory FK | BLOCKED |
| 11 | Open linked Ready Pack | Selected movie under separate Qloo section | BLOCKED |
| 12–13 | Reload page and reopen Taste | Same persisted ID/provenance, not browser-only state | BLOCKED |
| 14 | Repeat same save while receipt valid | Same pack/item count; no duplicate Plan | BLOCKED |
| 15 | Choose another film then Cancel | No new discovery; no mutation on cancellation | BLOCKED |
| 16 | Sign out A; sign in B | No A Memories/discoveries; replay A receipt rejected | BLOCKED |
| 17 | Exercise failure states | See matrix below | BLOCKED |
| 18 | 390×844 viewport and keyboard-only flow | No horizontal overflow; labels/focus order; Enter/Space actions; errors announced | BLOCKED |

Failure-state matrix: zero search results; zero Insights entities; unauthenticated API request; expired signed receipt; tampered receipt; receipt from A submitted as B; Qloo 401/403/429/5xx/timeout; missing persistence configuration; inactive destination pack. Assert that failures never invent recommendations or persist choices. Use injected HTTP failures and a test clock/receipt factory for deterministic expiry; do not edit client receipt timestamps and mistake signature failure for expiry coverage.

## Evidence needed to change status to PASS

Record test environment identifier (non-secret), transport mode, date, app build revision/digest, browser/version, viewport, test counts, exact scenario failures, redacted persistence counts and fixture/live label. A live smoke success alone cannot satisfy this matrix. A frontend-only mocked session cannot satisfy real authentication or RLS. A public demo is a separate gate after private E2E passes.

Release-pass offline result: 303/303 unit/protocol/workflow tests passed, with typecheck, lint and production build passing. These checks do not change any BLOCKED browser scenario above.
