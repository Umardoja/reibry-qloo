# REIBRY Taste submission gate

> Current owner-confirmed transport and environment gates supersede the preliminary setup guidance below; see [QLOO_LIVE_VERIFICATION.md](QLOO_LIVE_VERIFICATION.md) and [QLOO_RELEASE_CHECKLIST.md](QLOO_RELEASE_CHECKLIST.md).

Deadline supplied by the owner: **October 31, 2026, 04:45 Africa/Lagos**. This agrees with the official rules' October 30, 23:45 Eastern deadline. No submission or publication was performed.

## Current decision: not ready for public submission

The focused feature is implemented. Live Qloo access, the full authenticated workflow and public judge access remain unverified.

Before public deployment:

1. Securely configure an event-issued Qloo key, random receipt-signing secret and a separate local/test Supabase instance. Never use historical/production credentials for this validation.
2. Apply the supplied migrations to that explicitly local/test instance; run the complete foundation migrations and test with disposable users A/B and synthetic Memories. Verify account profile editing, cross-user isolation, confirmation/cancel, repeated save, Plan details and reload through the actual app.
3. Obtain explicit authorization for live Qloo calls. Only then set `QLOO_LIVE_ENABLED=true` and run the read-only smoke script with `--allow-live`. Check Search type URNs, credential scope, quotas and actual response shape. Record results separately from fixtures. The requested event developer-guide page was inaccessible; reconfirm event-specific requirements with the key instructions.
4. Exercise the real end-to-end flow with synthetic data, including ambiguous searches, errors, keyboards and mobile widths. Confirm no synthetic fixture is mistaken for live output.
5. Review event data-retention terms, add a deployment-appropriate quota/rate-limit strategy, verify service-role isolation, and complete normal release/security checks. The current request bounds and transient retries are not a global quota limiter.
6. Resolve license/attribution and sanitized public-source requirements. Obtain explicit owner authorization for committing, publishing a repository, applying hosted migrations and deploying. None is authorized by this task.

## Live smoke test, prepared but NOT RUN

After explicit authorization and secure shell/environment configuration:

```powershell
node --experimental-strip-types scripts/verify-qloo.ts --allow-live
```

The script also requires `QLOO_LIVE_ENABLED=true` and `QLOO_API_KEY`. It searches for The Matrix, uses an actual returned matching entity ID, requests movie recommendations and checks validated nonempty results. It reports only counts, safe status and elapsed time; failures exit nonzero. No Memory, account, database write or secret output is involved. Do not confuse this read-only API check with the full authenticated workflow.

## Devpost artifacts

The [official event rules](https://qloo.devpost.com/rules) require a functional demo link, a public repository with an open-source license and setup instructions, a project description, and judge testing access (including disposable credentials if private). Explain the substantial Qloo addition to the existing REIBRY project. Submission materials must be in English or include translation. Recheck the live submission form for any additional required fields.

Prepare these artifacts without publishing until authorized:

- Product description: saved inspiration -> confirmed cultural interests -> new movie discovery -> approved Ready Pack follow-through.
- Architecture explanation identifying Qloo's role in the bounded Home agent and showing the confirmation boundaries.
- Sanitized request/result walkthrough using actual evidence only after live validation.
- Short demo recording and screenshots containing no keys or personal data; show selection, ambiguous matching, Qloo attribution, save confirmation and reload.
- Reproducible setup, known limitations, test results, license and REIBRY attribution.
- Functional demo URL and public source URL, created only after separate approval.

The [Qloo submission guide](https://github.com/qloo/qloo-hackathon-kit/blob/main/docs/SUBMISSION.md) also recommends a problem statement, workflow rationale, redacted evidence, safe demo media, clean setup steps and known limitations. Do not claim a required video length that the retrieved rules do not specify.

## A–G assessment

**A. Is Qloo integrated into the REIBRY agent architecture?** Yes: bounded Home routing/tool registration and a shared resolve/discover/save state machine with server authorization. It is not a verified live integration yet.

**B. Is the UI functional locally?** Implemented, compiled and served successfully in a local production HTTP smoke test. Interactive authenticated verification remains blocked on local/test Supabase configuration; live recommendations remain disabled without approved access.

**C. Do all existing and new tests pass?** Yes: 298/298 tests passed; typecheck, lint, production build and diff check passed. Local database regression execution passed separately.

**D. Has a REAL Qloo API request succeeded?** No. None was made.

**E. Is Ready Pack persistence implemented safely?** Yes: separate provenance-aware external items, server-only atomic RPC, composite ownership FK, RLS, confirmation receipts and idempotency. SQL behavior passed locally; the Supabase app integration still needs verification.

**F. What must happen before public deployment?** Complete the gates above, including live access, disposable-account end-to-end testing, quota/data handling, license/artifacts and explicit deployment authorization.

**G. Next smallest action?** Configure a separate local/test Supabase instance and securely obtain/configure the event-issued Qloo key; then explicitly authorize the read-only synthetic smoke test. Do not paste the key into chat.



