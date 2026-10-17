# Age assurance architecture

## Current state

Onboarding requires an adult date-of-birth declaration and records `AGE_DECLARED` separately from email verification. Adult APIs resolve a cryptographically verified Auth0 session to a server profile and reject profiles without an adult-access status. This is a gate, not strong proof of age.

## Required production design

Use a specialist, privacy-preserving age-assurance provider before explicit adult content is publicly launched. Prefer an over-18 result/token rather than identity documents or full birth dates. The server sends a one-time challenge and receives a signed callback; it verifies issuer, signature, audience, nonce, result, method, expiry and replay protection, then stores only provider reference, assurance level/status and timestamps. Raw document/selfie data must remain with the provider unless counsel and the DPIA explicitly approve otherwise.

States: `NOT_STARTED`, `AGE_DECLARED`, `PENDING`, `AGE_VERIFIED`, `FAILED`, `EXPIRED`, `REVIEW_REQUIRED`. Re-check after expiry or material risk signals. Fail closed for discovery, profiles, messaging, connections, dating, reports and media; privacy rights and account deletion remain accessible. Provide accessible retry/support and a legally reviewed appeal route.

## Rollout blockers

Provider selection/DPA/DPIA, localization, callback implementation, fraud/replay tests, retention configuration, existing-user migration and production monitoring are not complete. No repository code or owner action should be described as stronger verification until a provider result is actually verified.
