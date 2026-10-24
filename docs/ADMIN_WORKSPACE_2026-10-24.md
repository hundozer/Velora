# Admin workspace and invitation controls, 24 October 2026

Base: merged main `a13d21477b852f25001a80a3e6e2da3c26474a74` (PR #103). No database migrations or production data changes.

The work inbox combines waiting reports, photos/albums and verification cases. Queue sources are filtered before their bounded database limits. Failed sources remain visibly unavailable, and loaded windows are not presented as total backlog counts. Reviewers select evidence, inspect member context where permitted, and record a reason and review note. Album approval requires all returned photos to be available, processed and approved; the existing server checks remain authoritative. Empty albums cannot pass.

Protected image previews retain the existing MFA/permission gates, audited byte proxy, metadata sanitation and fail-closed behavior. No reusable storage URL or conversation browser is introduced. Destructive decisions retain typed confirmation. Ambiguous action failures require refresh before another decision. Optional member notices use the existing in-app notifications table, after the primary audit; delivery failures do not invite repeating a saved decision. Owner APIs expose explicitly requested changes while withholding general internal moderation notes.

Navigation groups Members, Community, Privacy and Activity, with Settings and Team & access below. Role visibility comes from server-derived permissions; API authorization is unchanged. Privacy completion is explicitly distinguished from executing an export or erasure. Operational checks show failed email jobs and failed media processing, with unavailable counts on query errors. They do not certify worker or storage health. Elevated access retains existing recent-authentication, MFA, owner-only and expiry controls.

The Tonight invitation form now uses labelled activity, day, neighbourhood, start/end and reply-eligibility controls instead of an oversized inline sentence. Time payloads and validation remain unchanged.

## Verification boundary

- `npm test`: 222 tests, including queue normalization/readiness, denial before data access, audited content decisions, optional notification failure and owner-feedback privacy.
- `npm run typecheck`, `npm run lint`, `npm run build`: local checks recorded with the implementation PR.
- `node scripts/verify-admin-workspace.mjs`: Chromium at 390px and 1440px, synthetic intercepted API/image responses. Exercised selection, enlargement/Escape, photo-before-album gating, requested changes, empty albums, source errors, invitation inputs and horizontal overflow. Temporary fixture and its generated route type are removed in cleanup.
- Read-only staging schema inspection confirmed existing notification columns and failed-processing status support. No live member records were changed.

These are component/browser rehearsals and automated API tests, not a live authenticated staging operator/storage journey. No real member photo was approved, no administrator grant changed, and no production fixture was created. Hosted CI and protected Preview smoke results belong to the PR checks. The overall Prague beta decision remains unchanged pending its separate operational acceptance gates.
