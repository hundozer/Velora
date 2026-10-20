# Deployment smoke and member acceptance

These are different evidence levels. Neither green CI nor the UI specs proves the member journey.

## Real deployment smoke

`E2E_BASE_URL=https://your-preview.vercel.app npx playwright test --config=playwright.smoke.config.ts`

No backend mocks or member credentials. Checks public DB data, server-generated age cookie, and anonymous rejection by member/admin endpoints. Runs on successful Preview deployment status and supports manual dispatch. Missing database credentials, a paused database, or a protection login fails the smoke. Do not bypass a failure by mocking the backend. A protected Preview needs an authorized automation access arrangement before this workflow can pass; it does not send a bypass secret to arbitrary input URLs.

### Protected Preview CI access

The Preview smoke workflow obtains a short-lived GitHub Actions OIDC token (masked in logs), rather than a shared static bypass secret. In Vercel project `velora`, **Settings → Deployment Protection → Trusted Sources → External Services**, the applied GitHub Actions rule is:

- Issuer: `https://token.actions.githubusercontent.com`
- Audience (`aud`): `https://github.com/hundozer`
- Repository (`repository`): `hundozer/Velora`
- Repository ID (`repository_id`): `1321270415`
- Workflow (`workflow`): `Preview smoke` (the YAML workflow name, not a path).
- Trigger (`event_name`), accepted values: `deployment_status`, `workflow_dispatch`.
- Target environment: **Preview only**.

This access-control rule was explicitly owner-approved, applied and read back on20October2026. Authenticated hosted smoke run39425483193 attempt2 passed1/1; see the readiness report for exact source/target commits and earlier failed attempts. Future changes to its scope require owner approval. Preserve all existing project trust rules and Deployment Protection. GitHub workflow token issuance alone does not establish Vercel authorization. Avoid requiring an assumed `sub` shape: current tokens include immutable account/repository suffixes. Deployment-status tokens also use commit SHAs in `workflow_ref`, while manual tokens use branch refs. The rule therefore verifies immutable repository ID, workflow name and the two intended event types.

`E2E_VERCEL_OIDC_TOKEN` is scoped to HTTPS origins on the project's owning-team deployment hostnames. The smoke never follows redirects, so it cannot forward the header to Vercel login or another origin; traces are disabled. No database/member credential is sent. The HTTP assertions, public database read, anonymous API denials and signed age cookie remain required. The aggregate timeout is120seconds, matching the previously measured full smoke budget.

Inspect each run's steps and token metadata rather than inferring its workflow source: the actual deployment-status run used the repaired workflow at the deployment SHA. Its `workflow_ref` claim ended with that SHA. Manually dispatch on the PR branch for a separate explicit check; automatic deployment-status checks must also pass.

## UI regression tests

`E2E_BASE_URL=http://localhost:3000 npx playwright test --project=ui`

These intercept backend requests. They prove UI behavior only.

## Two-member acceptance on dedicated staging

`npx playwright test --project=member-acceptance`

Required environment:

| Variable | Meaning |
| --- | --- |
| `E2E_BASE_URL` | Non-production HTTPS origin |
| `E2E_ALLOWED_ORIGIN` | Exact origin of the dedicated staging deployment, configured independently from the workflow input |
| `E2E_A_EMAIL`, `E2E_A_PASSWORD` | Dedicated confirmed, onboarded adult fixture A |
| `E2E_B_EMAIL`, `E2E_B_PASSWORD` | Different dedicated confirmed, onboarded adult fixture B |
| `E2E_A_PRIVATE_MEDIA_ID` | An approved, available PRIVATE non-chat photo owned by A |

Workflow uses the `intimo-staging` GitHub environment. Set its variables and secrets above. Staging must have canonical migrations, isolated R2 storage, and test mailboxes. Both fixtures must be discoverable and allow messaging. They must have no prior private-photo denial cooldown. Do not use real member accounts. Production custom domains and known production aliases are rejected before sign-in; never allowlist a new production alias.

Coverage: real sign-in, desires/boundaries, People API and profile, interest/in-app notification, Plan timestamps, actual R2 upload/completion/variant processing/owner delivery, approved private-photo delivery before grant/after grant/after revoke, two-way message arrival within 15 seconds, block and profile denial. Media delivery checks require the privacy fix in PR #83.

Cleanup runs in `finally` and asserts failures. It removes the run's upload, Plan, outgoing interest and block, and revokes private access. Test messages, notices and consent/preferences remain as fixture evidence. This is not a pristine reset; reset/recreate dedicated fixtures when required. Failed cleanup requires inspection before reusing them. Traces can contain test credentials/data; access is restricted by repository permissions and artifacts expire after three days.

The standalone suite does not cover new signup/inbox confirmation, onboarding, direct JWT policy probes or account deletion. The opt-in disposable runner below adds several of those checks; signup/inbox confirmation, email delivery/unsubscribe and scheduled erasure remain separate. Do not mark issue #31 complete from this suite alone.

## Actual recovered staging role test

`tests/sql/staging-message-rls.sql` is a rollback-only test for recovered Supabase staging `fuczjjcwtxzzvoxilrme`, executed as database owner via `execute_sql`. It uses real `anon`/`authenticated` roles and the existing `auth.uid()` function with simulated request claims. It does not create roles or replace Supabase tables/functions, unlike the disposable PostgreSQL harness `tests/sql/message-rls.sql` (which must never run in Supabase).

The staging test verifies both block directions, inactive accounts, unrelated/missing identities, anonymous denial, direct write/RPC denial and restrictive-policy behavior alongside a deliberately permissive probe policy. Everything rolls back. Independently check fixture profiles (`rls-%-20261019@example.invalid`), conversation `staging-rollback-20261019`, and policy `staging_rollback_permissive_probe` are absent afterward, including after an ambiguous tool error. A successful SQL-role result is not a real-JWT REST/Realtime or customer-journey result.

## Disposable acceptance from a Preview build

When credentials are intentionally unreadable outside Vercel, `scripts/run-staging-acceptance.mjs` can use them inside an explicitly requested Preview build. It refuses production, another Supabase project, another R2 account/bucket and any target other than the independently inspected Preview hardcoded in the runner. It does not add an application endpoint or run in the default build/CI command.

The runner creates two synthetic, confirmed Auth identities (admin provisioning, **not signup/email-confirmation acceptance**), drives their actual phone-sized login/onboarding/profile-edit screens, checks People/profile-sheet close, seeds an approved private test image containing synthetic EXIF/GPS, then runs the existing `member-acceptance` suite. It additionally checks Plan reply eligibility, direct JWT REST/Realtime message access, reporting, export and self-service deletion. Account deactivation is distinct from scheduled retention/erasure.

Realtime checks require both subscriptions to receive an allowed probe, then observe no blocked probe for four seconds in each block direction. This is a bounded observation, not an unlimited delivery guarantee. The full storage inventory (key, size, ETag and modification timestamp) must equal its pre-run baseline after cleanup; pre-existing files are preserved.

Supply branch-scoped server-only `INTIMO_E2E_BASE_URL` and `INTIMO_E2E_SHARE_URL`; the latter is a temporary authorized Vercel share link on that exact origin, never a source-code value. `e2e/protected-preview.ts` establishes its origin-scoped access cookie for each test context. It does not forward a protection header to R2. Fixture passwords stay in memory and traces are disabled. Failure reporting strips Playwright request call logs (which can include cookies) and URL queries; do not log original request errors or access links.

Deploy by the named branch so Vercel includes its branch-scoped settings, and confirm the resolved commit before accepting results. A raw SHA ref does not inherit those settings. Use a one-off deployment build override, preserving the application's locked dependencies:

```sh
npm install --prefix /tmp/intimo-e2e-browser --no-package-lock @sparticuz/chromium@141.0.0 && INTIMO_E2E_CHROMIUM_MODULE=/tmp/intimo-e2e-browser/node_modules/@sparticuz/chromium/build/cjs/index.cjs node scripts/run-staging-acceptance.mjs && npm run build
```

The browser package is temporary; no application dependency/lockfile is changed. Standard Playwright Chromium lacked libnspr/libnss on Vercel's builder. `PLAYWRIGHT_CHROMIUM_PATH`/`PLAYWRIGHT_CHROMIUM_ARGS` let the existing suite reuse the pinned serverless binary. Web-security-disable and single-process flags are excluded.

Every run attempts all cleanup in `finally`, including after test failures. It recovers ambiguous Auth creations by the run's unique metadata and email prefix, deletes only those identities' records/objects, closes subscriptions/contexts, and verifies absence. Inspect `STAGING_ACCEPTANCE ... cleanup PASS` plus independent SQL counts. A failed cleanup is a blocker, not a pass. A provider outage/hard process kill may prevent `finally`; use the logged synthetic UUIDs and exact run marker for recovery before rerunning. Never cancel a build after fixture creation unless its fixtures have been independently recovered.

`scripts/verify-staging-storage.mjs` is a smaller opt-in staging-only object write/head/read/delete probe with independent head/list cleanup checks. Its default build command is also unchanged. Remove temporary branch access variables after acceptance. Do not apply the staging fixture SQL or runner to production.
