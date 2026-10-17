# Privacy data map — technical inventory

This inventory is not a record of processing approved by counsel. Canonical runtime persistence is Supabase via server APIs; Prisma and legacy bootstrap schemas are migration references, not an additional authorized runtime.

| Category | Source | Store/processor | Recipients/access | Sensitivity/control |
|---|---|---|---|---|
| Auth subject, email, verification | User/Auth0 | Auth0; subject mapping in Supabase | User; authorized server/admin | Identity; SDK/JWKS verification |
| DOB declaration/age status | User/provider future | Supabase profile | Owner; limited safety/admin | High; never in public serializer |
| Profile, orientation, preferences | User | Supabase | Visibility-qualified members/server | Special-category; explicit consent and minimization required |
| Approximate location | User | Supabase | According to visibility | Sensitive; exact location must not be public |
| Connections/blocks | User actions | Supabase | Participants/server | Private social graph |
| Messages | Participants | Supabase | Conversation participants/server moderation under policy | Confidential; block/participant checks |
| Media/object metadata | User | Supabase + R2 | Owner/entitled users/server | Adult/intimate; signed URLs and declarations |
| Reports/moderation/evidence | Users/reviewers | Supabase | Restricted moderators/legal/safety | Highly sensitive; immutable history/legal holds |
| Consent/privacy requests | User | Supabase | Owner/privacy administrators | Rights evidence |
| Audit/security events | System/admin | memory today; Supabase schema staged | Restricted security/admin | Durable sink still required |
| Transactional email | System | Resend intended | Recipient/authorized support | Provider configuration unverified |
| Payments/monetization | None in free MVP | Disabled | None | `MONETIZATION_ENABLED=false` |

External processor contracts, hosting regions, subprocessors, international transfers, encryption/key ownership, backup periods and deletion attestations must be documented by the owner/DPO before launch. Analytics and marketing must remain off until an approved consent implementation and data map exist.
