# Full-loop E2E (P1-17)

One Playwright spec, `full-loop.spec.ts`, drives two real members through the core loop on a deployed environment:
sign in → desires and boundaries → People → interest and notification → Plan → private photo request and grant → realtime message → block.

It's skipped unless every variable below is set. It refuses to run against intimo.live.

| Variable | Meaning |
| --- | --- |
| `E2E_BASE_URL` | Staging or preview URL, e.g. a Vercel preview deployment |
| `E2E_A_EMAIL`, `E2E_A_PASSWORD` | Test member A: onboarded, adult-verified, with a confirmed email |
| `E2E_B_EMAIL`, `E2E_B_PASSWORD` | Test member B: the same, a different person |

Run it locally with `npm run e2e`, or in GitHub with **Actions → E2E → Run workflow** (it uses repository secrets of the same names).
The spec cleans up after itself (block, interest and Plan), so the same pair can be reused.

Not covered here: registration and onboarding (they need inbox access; see `tests/onboarding*.test.mjs`) and account deletion (irreversible; tested through the privacy request flow).
