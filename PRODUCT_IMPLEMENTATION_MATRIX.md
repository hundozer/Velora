# Intimo Product Implementation Matrix

Snapshot: 2026-08-08, after the first public-community implementation slice.

| Feature | User UI | API | Database | Admin | Status |
|---|---|---|---|---|---|
| Public community home | Real profiles, dating summaries, truthful empty states | Minimized paginated public endpoint | Canonical profiles/dating ads | Existing user/content operations | PASS for safe first slice |
| People directory | Search, country, profile type, pagination | Server filtering and deterministic ranking | Profiles | User inspection/restrictions | PASS for basic filters; advanced filters pending |
| Public profile | Minimized guest view | Dedicated allowlisted endpoint | Profiles | User/privacy controls | PASS for summary; public media/activity pending |
| Member profile | Large legacy view | Authenticated profile API | Profiles/media/dating | User/content operations | PARTIAL — needs decomposition and removal of development fixtures |
| Albums/photos | Owner upload UI plus public approved gallery | Upload/presign/complete and public delivery protected | Canonical media lifecycle migration prepared; legacy album migration remains | Audited media decision console | PARTIAL — migration application and album grouping/reorder remain |
| Videos | Owner upload UI plus public approved gallery | Upload boundary and fail-closed processing state | Canonical media lifecycle migration prepared | Cannot approve until READY | PARTIAL — real processing worker/provider not complete |
| Dating classifieds | Browse/create/delete/reactivate/save/reply UI | Owner-derived CRUD; safe public summaries; reply enters durable messages | Dating ads + saved items | Content moderation operations | PARTIAL — dedicated detail route and advanced pagination remain |
| Follow/block/report | UI/API exists in parts | Actor/ownership/rate gates and durable event notifications | Connections/blocks/reports | Moderation/user operations | PARTIAL — full UI parity audit pending |
| Messaging | Member UI; profile/dating entry points use it | Participant-authorized API, real unread counts, durable notifications | Direct messages | Access policy is restricted/audited | PARTIAL — attachments intentionally unavailable; conversation pagination pending |
| Notifications | Durable page and drawer | Owner-derived read/delete API | Notifications table | Event sources are real | PASS for message/follow/favorite events; more lifecycle events pending |
| Search | Unified member search across people/media/dating/posts | Authenticated, block-aware, privacy-filtered deterministic query | Canonical content tables | N/A | PASS for MVP scope; relevance weighting intentionally absent |
| Verification | Private evidence upload and progressive UI | Owner-submitted review plus audited MFA-admin evidence access/decision | Reviews/profile/private media | Durable verification queue and signed evidence access | PARTIAL — external stronger age assurance remains owner/legal work |
| Privacy/settings | Settings UI | Server-owned privacy API | Profile privacy fields/consents | Privacy console | PASS for current settings; ongoing route audit |
| Admin/God Mode | Operational consoles with explicit queue decisions | Server roles, account-active check, MFA, elevation, audit | Durable admin/audit tables | N/A | PASS for secure foundation; user/settings prompt UX still pending |
| Monetization | Inaccessible | Disabled | Legacy compatibility fields only | Feature flag disabled | PASS |
| Mock production activity | Removed from primary surfaces | No synthetic API results | Real rows only | Real metrics | PASS for audited surfaces; repository-wide second audit pending |

Status meanings: PASS = implemented for the stated scope; PARTIAL = usable foundation exists but the master requirement is not complete; FAIL = unsafe or absent; LEGAL REVIEW = owner/counsel decision required.
