# Privacy and retention architecture

This document records technical defaults, not legal approval.

- Sensitive fields default to `PRIVATE`; profiles default to `MEMBERS_ONLY`.
- Location output is hidden or city-level. Exact coordinates must not be selected
  by discovery/profile APIs or included in analytics.
- Consent changes are append-only records containing type, draft version,
  timestamp, status and withdrawal time.
- `AGE_DECLARED` records a date-of-birth declaration only. It must never be shown
  as stronger `AGE_VERIFIED` assurance.
- Rights exports are generated server-side for the authenticated profile. The
  export endpoint is rate-limited, audited and `no-store`.
- Deletion is self-authorized through the Auth0 session and requires explicit
  confirmation. A production workflow still needs resumable object cleanup,
  anonymization/legal-hold handling and completion evidence.

Draft retention configuration lives in the `retention_rules` table and requires
legal/operational approval before migration. Scheduled enforcement jobs are not
yet implemented; rows express policy configuration, not proof of deletion.
