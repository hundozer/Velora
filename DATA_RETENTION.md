# Data retention and deletion schedule — technical draft

No automated retention job is currently deployed. Periods below are proposed engineering defaults and require DPO/counsel approval before implementation.

| Data | Proposed lifecycle | Current implementation |
|---|---|---|
| Active account/profile/preferences | Account life | Stored in Supabase; public serializer minimizes output |
| Withdrawn consent | Keep evidence of consent/withdrawal for approved limitation period | Versioned records exist; purge job absent |
| Messages | Account life or user deletion, subject to recipient/legal constraints | Durable API exists; erasure policy/job absent |
| Public/private media | Until owner deletion/account erasure; quarantined evidence separately | Metadata/visibility staged; object deletion worker absent |
| Blocks/connections | Account life | Durable tables; purge job absent |
| Reports/moderation/copyright | Case life plus approved dispute/safety limitation period | Durable cases/events staged; legal-hold policy absent |
| Security/admin audit | Proposed 12 months, access restricted | General logger is not durable; moderation events are staged |
| Rate-limit counters | Minutes | In-process only |
| Deletion request | Deactivate immediately; complete erasure/anonymization within approved SLA | Resumable states exist; worker and completion notice absent |
| Backups | Provider rotation window | Not documented/verified with provider |

Deletion must be idempotent: `ACTIVE → DELETION_REQUESTED → DEACTIVATED → ANONYMIZED/DELETED`, with failure reason, retry count, timestamps and narrowly scoped legal holds. Production rollout requires scheduled jobs, metrics, failure alerts, proof-of-deletion records, object-store cleanup and backup-expiry documentation. Never erase evidence subject to a valid legal hold without authorized review.
