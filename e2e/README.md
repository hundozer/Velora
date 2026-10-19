# Deployment smoke and member acceptance

These are different evidence levels. Neither green CI nor the UI specs proves the member journey.

## Real deployment smoke

`E2E_BASE_URL=https://your-preview.vercel.app npx playwright test --config=playwright.smoke.config.ts`

No backend mocks or member credentials. Checks public DB data, server-generated age cookie, and anonymous rejection by member/admin endpoints. Runs on successful Preview deployment status and supports manual dispatch. Missing database credentials, a paused database, or a protection login fails the smoke. Do not bypass a failure by mocking the backend. A protected Preview needs an authorized automation access arrangement before this workflow can pass; it does not send a bypass secret to arbitrary input URLs.

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

Still separate, unproved acceptance gates: new signup and inbox confirmation, full onboarding/photo display on a phone, email delivery/unsubscribe, actual server RLS attacks with two JWTs, account deletion and scheduled erasure. Do not mark issue #31 complete from this suite alone.
