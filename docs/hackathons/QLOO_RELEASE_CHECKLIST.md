# REIBRY Taste release checklist — NOT READY TO PUBLISH

October 25, 2026, Africa/Lagos. Deadline: October 31, 2026 at 04:45 Africa/Lagos. No commit, push, public repository, hosted migration or deployment has been performed. Owner authorization remains local inspection, documentation and offline tests only.

## Required release gates

- [ ] Event credential obtained privately; supported transport, expiration and quotas documented.
- [ ] Direct HTTPS expressly approved, or harness adapter implemented/tested after transport choice. Current direct permission is UNVERIFIED.
- [ ] Owner explicitly authorizes read-only external Qloo verification; real schema-valid responses recorded safely.
- [ ] Separate `reibry-qloo-test` Supabase instance positively identified and approved.
- [ ] Complete migration stack applied and verified on that instance.
- [ ] Two disposable non-admin accounts; authenticated browser matrix passes.
- [ ] Save/reload/idempotency/cancel/isolation verified through real Auth and PostgREST.
- [ ] Mobile, keyboard and unavailable-state tests pass.
- [ ] Owner adopts an OSI-approved license and confirms inherited source/asset rights.
- [ ] Explicit authorization to publish source and deploy staging; judge-accessible functionality independently verified.

## Exact isolated Supabase setup procedure

**Current phase C: BLOCKED.** No approved project, URL, keys or disposable users exist. The local Docker engine is unavailable; the standalone PostgreSQL installation lacks pgvector. The earlier minimal PostgreSQL test does not demonstrate clean application of the full foundation or real Supabase Auth/PostgREST behavior.

Preferred next environment: a new, empty Supabase development project named `reibry-qloo-test`, never the parent REIBRY project. The owner should:

1. Create the separate project in the Supabase dashboard. Record its name, project reference, organization and intended disposable purpose in a private environment record. Confirm it contains no personal/production data. Do not copy production users, backups, secrets or project-link metadata.
2. Explicitly approve that exact project reference for migrations and disposable-account testing. A matching display name alone is insufficient. Creation/approval is an owner action, not performed here.
3. In a secure editor, configure `.env.local` using only that project's URL, public anon key and server-only service-role key. Generate a fresh random receipt secret of at least 32 characters. Keep Qloo disabled. Do not put keys/passwords in command arguments, transcripts or reports. Confirm all three Supabase values belong to the same approved project.
4. In the SQL editor of the approved project, apply the files below in order, once each. Verify the displayed project reference before every batch. Stop on the first SQL error; do not blindly rerun initial migrations or repair a different database. Record successful migration filenames in the private setup record. If using CLI instead, positively verify its linked reference first; do not reuse historical `.temp` links or run an untargeted `db push`.
5. Run `tests/qloo-supabase-readiness.sql` in that same SQL editor. It is read-only and checks pgvector, tables, profile provisioning, privileges, RLS flags and server-only RPC access. A pass is catalog readiness, not E2E or a full RLS behavior test.
6. Set Auth Site URL to the intended local test origin, e.g. `http://localhost:3000`, and allow `http://localhost:3000/auth/callback`. Provision two new disposable users using test mailboxes; keep their credentials private. Verify trigger-created profiles have role `user`. Do not promote them to admin or use an actual user account.
7. Start the local app in development with `npm run dev -- --webpack`. Use synthetic text capture, development mock AI only, and Qloo disabled until separately authorized. Execute the [E2E runbook](QLOO_E2E_RESULTS.md) with a test-only synthetic Qloo transport first if necessary; label it fixture-driven. A fixture transport must not replace real Auth/PostgREST or become a runtime fallback.

For an entirely local Supabase stack, the [official CLI instructions](https://supabase.com/docs/guides/local-development/cli/getting-started) require a functioning container runtime on Windows. Once available and separately approved: work from this directory, initialize a unique local project config, assign unused ports, and start that local stack. Do not run `supabase link`; never use `db reset` against an existing project with data. Keep CLI output that may contain keys out of shared logs. This alternative was not initialized here.

### Migration order verified by source dependencies

1. `20260919000000_initial_foundation.sql` — pgvector, profiles, Memories, Life contexts, owner policies and triggers.
2. `20260919000001_integration_additions.sql` — match display metadata.
3. `20260920000002_vector_search.sql` — authenticated vector search function.
4. `20260920000003_capture_deduplication.sql` — owner-scoped capture key.
5. `20260922000000_account_onboarding.sql` — profile backfill and Auth provisioning trigger.
6. `20260923000000_admin_analytics.sql` — profile role and analytics.
7. `20260925000000_ready_packs.sql` — Memory-backed pack tables, composite ownership relationships and RLS.
8. `20260926000000_ready_pack_uniqueness.sql` — one active pack per intention.
9. `20261025000000_profile_privileges.sql` — remove broad profile write privileges; preserve safe column updates.
10. `20261025000001_taste_discoveries.sql` — external discovery table and server-only atomic save RPC.

**Not yet verified:** clean execution of all ten files on full Supabase. Prior successful SQL testing used a minimal synthetic foundation plus migrations 7–10. Do not run `tests/qloo-database.sql` against Supabase: it creates synthetic roles/auth tables and belongs only in an empty disposable standalone PostgreSQL test cluster.

Existing `verify:auth`, `verify:api`, `verify:supabase` and `seed:demo` scripts read configured credentials and are not target-approval mechanisms. They were inspected, not executed here. In particular, `verify:auth` can create users and insert/delete data. Do not invoke them merely because `.env.local` is populated; review and explicitly approve their exact target and effects first.

## Staging deployment checklist — prepare only

- Choose hosting only after transport is settled. A harness subprocess backend needs a supported Node/container/VM environment; do not assume a serverless Next.js deployment supports it.
- Separate staging Auth/database, storage, keys, origin and callback URLs from production REIBRY.
- Ensure Qloo/service-role/receipt secrets remain server-only. No raw request/response, auth-cookie, subprocess-output or key logging.
- Configure quota/rate limits and bounded concurrency appropriate to event access; current retry/request bounds alone do not enforce a shared quota.
- Review Qloo data-use/retention conditions, signed-receipt lifetime and error behavior. Confirm no fixture fallback, invented explanations, or unapproved writes.
- Confirm HTTPS, origin checks, private cache headers, production provider configuration, all migrations and repeat the browser matrix on staging.
- Make judge testing free and usable through the judging period. Prepare disposable accounts with synthetic Memories only; keep credentials in private judge instructions, never public source.
- Obtain explicit publication/deployment approval before creating a repo, adding a remote, committing, pushing, running hosted migrations or deploying.

## Two-minute hands-on judging walkthrough (only after gates pass)

| Time | Judge action | What must be observable |
| --- | --- | --- |
| 0:00–0:20 | Sign in using private disposable judge credentials; open Home/Taste | Clear purpose and synthetic saved inspiration |
| 0:20–0:40 | Select The Matrix / Daft Punk Memories, review labels and types | Explicit preferences; minimal sharing |
| 0:40–1:00 | Resolve and confirm correct entities | Ambiguity handled, real Qloo IDs visible |
| 1:00–1:20 | Inspect movie discoveries | Qloo attribution and supported metadata; distinct from saved Memories |
| 1:20–1:40 | Select a film and confirm destination/save | Proposal before persistence |
| 1:40–2:00 | Open Ready Pack and refresh | Selection and provenance persist; explain separate external relationships |

Use the separate second-user/duplicate/cancel tests as supporting evidence, not claims inferred from the demo. A fixture recording must visibly say fixture-driven and cannot substitute for live evidence.

## Significant improvements relative to the pre-Qloo copy

These additions are documented in the October 25 implementation session, after September 30. The repository has no commits, so do not claim a Git-verifiable historical timeline for inherited REIBRY work.

1. Typed Qloo entity resolution and movie Insights client with bounded errors/retries/timeouts.
2. User-confirmed Memory-to-entity resolution and clearly attributed external recommendations.
3. Bounded Home discovery routing and fixed workflow operations.
4. Signed user/stage-bound receipts and explicit persistence confirmation.
5. Separate provenance-aware discovery storage, owner FK/RLS, server-only atomic save and idempotency.
6. Responsive Taste UI and Plan-detail discovery display.
7. Production mock restrictions, corrected profile privileges and session deadlines, preserving source capture.
8. Synthetic protocol/workflow/security tests and local SQL verification.
9. This release pass: safe smoke HTTP metrics/request cap/ambiguity handling, five regression tests, truthful README, transport compatibility assessment and release/E2E procedures.

Attribution: the original REIBRY team supplied the memory/capture/authentication/planning foundation, Android code, existing providers and design identity. Confirm contributor names, ownership and third-party asset permissions before making source public. Proposed MIT terms are in [QLOO_LICENSE_PROPOSAL.md](QLOO_LICENSE_PROPOSAL.md), not yet adopted.

## Current verification and repository hygiene

Final command outcomes from this release pass: The standard suite includes all 298 baseline tests plus five new smoke tests. No live Qloo command with `--allow-live` was executed.

- `npm test`: PASS, 303/303, zero failures/skips/cancellations.
- `npm run typecheck`: PASS, exit 0.
- `npm run lint`: PASS, exit 0.
- `npm run build`: PASS, exit 0; webpack compilation, TypeScript and generation of 41 static pages completed.
- `node scripts/check-release-hygiene.mjs`: PASS, 491 publishable files (all untracked), 288 text files scanned, zero credential/generated-file findings.
- `git diff --check`: PASS, exit 0; this alone is insufficient because there are zero tracked files. A separate authored-file whitespace scan found zero trailing-whitespace issues.

The scan checks common high-confidence credential patterns and sensitive/generated filenames, and outputs paths/categories only. It is heuristic, not proof of absence of every possible secret. Ignored `.env` files, build/cache/log/database outputs must never be force-added. Review binaries and original design/font/image rights manually. No root license, no public remote and no initial commit exist. The ignored apps/ tree contains only node_modules command shims for api/mobile/worker in the inspected file inventory. Other ignored paths are .next, node_modules, generated Next/TypeScript files, local logs and the earlier disposable PostgreSQL data under supabase/.temp. They remain ignored and preserved; no ignored content was added to the publishable set.

## Exact owner actions next

1. Obtain non-secret event credential instructions confirming final transport, limits and expiry; configure the credential privately. Direct permission remains unverified.
2. Create and explicitly approve the independent `reibry-qloo-test` reference for migration/testing; configure fresh test-only credentials and disposable users.
3. Approve the bounded live verification only after the permitted transport is implemented/configured. No implicit authorization from a key or flag alone.
4. Complete full Auth/PostgREST/browser verification, then review license/attribution and judge credentials.
5. Separately authorize source publication and staging deployment; verify judge-accessible functionality before claiming submission readiness.

The first verification attempt exposed TypeScript errors in the new smoke helper return/environment types; those were corrected. A concurrent build also replaced generated .next/types files during the initial standalone typecheck, causing TS6053 missing-file errors. The final typecheck was run after the build had stopped and passed; build and typecheck must run sequentially when sharing this output directory.

The authorization-gate command (without --allow-live) exited 1 with LIVE_NOT_AUTHORIZED and requestCount 0, as expected. No live smoke command was run. Local PostgreSQL results are inherited baseline evidence, not a new full-stack Supabase execution in this release pass. The read-only Supabase catalog check is prepared but NOT RUN.


## Files changed in this release pass

- `scripts/verify-qloo.ts`, new `scripts/lib/qloo-smoke.ts`, new `tests/qloo-smoke.test.ts`, and `package.json`: smoke verification and regression coverage.
- New `scripts/check-release-hygiene.mjs`: repeatable read-only scan including untracked files.
- New `tests/qloo-supabase-readiness.sql`: read-only catalog assertions, not executed against any target.
- `README.md`, `.env.example`: truthful setup and access guidance.
- New `QLOO_LIVE_VERIFICATION.md`, `QLOO_E2E_RESULTS.md`, `QLOO_RELEASE_CHECKLIST.md`, `QLOO_LICENSE_PROPOSAL.md` under `docs/hackathons/`.
- Prior implementation/test/submission reports: links to the current release status; historical baseline retained.

No runtime Qloo HTTPS client, application workflow, migration, provider or Android implementation changed in this release pass. No harness adapter is selected or installed.

