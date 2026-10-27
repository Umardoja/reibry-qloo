# Qloo test results

> Historical implementation baseline (298 tests). The later release-verification results are recorded in [QLOO_RELEASE_CHECKLIST.md](QLOO_RELEASE_CHECKLIST.md).

Date: October 25, 2026, Africa/Lagos.

## Verification levels

| Level | Status | Evidence / limit |
| --- | --- | --- |
| A. Mocked API and workflow | Passed | Synthetic HTTP and dependency-injected workflow tests; no real Qloo data |
| Local PostgreSQL persistence | Passed | `tests/qloo-database.sql` on disposable PostgreSQL 18.3 at loopback port 55439; server stopped afterward |
| B. Live Qloo API | NOT RUN | No approved configured key; no live request authorized |
| C. Authenticated full REIBRY workflow | NOT RUN | No local/test Supabase Auth/PostgREST configuration or disposable application accounts |
| D. Public judge-accessible deployment | NOT DONE | Explicitly outside authorization |

## Commands

Final command outcomes are recorded below after completion. The initial 296-test run passed; documentation-driven normalization changes added coverage and exposed one optional-property normalization mismatch, which was corrected before the final run.

- `npm test`: passed, **298/298**, zero failed/skipped/cancelled (262 inherited tests plus 36 added tests).
- `npm run typecheck`: passed (exit 0).
- `npm run lint`: passed (exit 0).
- `npm run build`: passed (exit 0), webpack; 41 static pages generated including Taste.
- `git diff --check`: passed (exit 0). This fresh repository has no tracked baseline; therefore this command alone cannot inspect its untracked implementation files.
- `node --experimental-strip-types scripts/verify-qloo.ts`: exited 1 with `LIVE_NOT_AUTHORIZED`, as intended. It made no HTTP request.
- Local `psql -f tests/qloo-database.sql`: exit 0, `QLOO_DATABASE_TESTS_PASSED`.
- Local production HTTP smoke: passed; `/taste` returned 200, unconfigured `/api/taste` returned 503, foreign-origin POST returned 403. The loopback-only server was stopped afterward. This is not an authenticated browser test.

The original `next build` Turbopack run failed with a compiler-worker connection/startup error in `globals.css`, including outside the sandbox. `npm run build -- --webpack` then completed successfully. The production build script now explicitly selects webpack; the final ordinary `npm run build` validates that configuration.

## Deterministic coverage

Missing keys; correct host/header/parameter encoding; movie and artist lookup; ambiguous matches; unsupported types and unknown parameters; empty signals/duplicates; valid Insights requests; empty results; malformed JSON/schema/type envelopes; documented subtype responses; UUID normalization; safe 401/403/404/429/5xx handling; bounded transient retry and timeout; explicit confirmation at all transitions; signed provenance; tampering, expiry and cross-user receipt rejection; revalidation after Memory deletion; untrusted saved-content labels; no persistence on provider failure; external entity relationships; production mock restrictions; session deadlines; capture preservation on provider configuration failure; bounded Home dispatch.

The SQL execution checks actual grants, role-column protection, ordinary-client RPC denial, server-role save, duplicate avoidance, no external rows in Memory-backed items, cross-user Memory/pack rejection, rollback, owner reload and RLS isolation. Its minimal foundation does not validate unrelated extensions or the complete Supabase migration stack. No hosted migration was run.

Existing capture, retrieval, authentication, source preservation, provider, Home and Ready Pack tests remain in the standard test command. Browser interaction, mobile visual QA, real Auth cookies and full-app reload after live Qloo are not claimed as verified by these unit/SQL checks.

Local command logs are in ignored `.qloo-*.log` files. Tests and fixtures remain in source for reproduction. Source scanning found zero high-confidence credential-pattern matches; only `.env.example` exists in the project root. Presence-only process-environment checks confirmed that QLOO_API_KEY, the Supabase URL and service-role key are absent and live Qloo is disabled. A separate trailing-whitespace scan of new implementation files found zero issues.




