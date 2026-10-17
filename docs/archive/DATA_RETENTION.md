# Data retention and deletion schedule — technical draft

An authenticated, resumable retention worker and durable execution evidence are implemented in the repository but are not deployed or scheduled. Periods below remain proposed engineering defaults and require DPO/counsel approval before production activation.

| Data | Proposed lifecycle | Current implementation |
|---|---|---|
| Active account/profile/preferences | Account life | Stored in Supabase; public serializer minimizes output |
| Withdrawn consent | Keep evidence of consent/withdrawal for approved limitation period | Versioned records exist; purge job absent |
| Messages | Account life or user deletion, subject to recipient/legal constraints | Durable API exists; erasure policy/job absent |
| Public/private media | Until owner deletion/account erasure; quarantined evidence separately | Worker deletes R2 objects before database metadata and fails closed if object deletion fails |
| Blocks/connections | Account life | Durable tables; purge job absent |
| Reports/moderation/copyright | Case life plus approved dispute/safety limitation period | Durable cases/events staged; legal-hold policy absent |
| Security/admin audit | Proposed 12 months, access restricted | General logger is not durable; moderation events are staged |
| Rate-limit counters | Minutes | In-process only |
| Deletion request | Deactivate immediately; complete erasure/anonymization within approved SLA | 30-day candidate worker, active-hold skip, profile anonymization, durable evidence and completion notice implemented; scheduling unconfigured |
| Backups | Provider rotation window | Not documented/verified with provider |

Deletion is implemented as the resumable lifecycle `ACTIVE → DELETION_REQUESTED → DEACTIVATED → ANONYMIZATION_IN_PROGRESS → DELETED`. The worker removes owned content/interactions, deletes R2 objects before metadata, pseudonymizes retained participant messages, minimizes the profile, completes the privacy request, and appends run evidence. Active legal holds skip processing. Production rollout still requires migration application, a server-only scheduler secret, an approved schedule, alerts/monitoring, operator runbook validation and provider backup-expiry documentation. Never erase evidence subject to a valid legal hold without authorized review.

The worker endpoint is `POST /api/internal/retention/run` with `Authorization: Bearer <INTIMO_RETENTION_CRON_SECRET>`. It intentionally returns 404 for missing or invalid authorization. Do not expose the secret to browsers or schedule the route until migration `20260815_retention_execution.sql` is applied and the proposed 30-day period is approved.
