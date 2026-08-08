# Intimo Product Implementation Matrix

Snapshot: 2026-08-08, after the first public-community implementation slice.

| Feature | User UI | API | Database | Admin | Status |
|---|---|---|---|---|---|
| Public community home | Real profiles, dating summaries, truthful empty states | Minimized paginated public endpoint | Canonical profiles/dating ads | Existing user/content operations | PASS for safe first slice |
| People directory | Search, country, profile type, pagination | Server filtering and deterministic ranking | Profiles | User inspection/restrictions | PASS for basic filters; advanced filters pending |
| Public profile | Minimized guest view | Dedicated allowlisted endpoint | Profiles | User/privacy controls | PASS for summary; public media/activity pending |
| Member profile | Large legacy view | Authenticated profile API | Profiles/media/dating | User/content operations | PARTIAL — needs decomposition and removal of development fixtures |
| Albums/photos | Owner UI exists | Upload/presign/complete protected | Legacy albums plus canonical media objects | Moderation console | PARTIAL — lifecycle/status/visibility consolidation required |
| Videos | Owner UI exists | Upload boundary exists | Legacy videos plus canonical media objects | Moderation console | PARTIAL — processing pipeline not complete |
| Dating classifieds | Browse/create/edit/delete UI exists | Authenticated CRUD; safe public summaries | Dating ads | Content moderation operations | PARTIAL — full public filters/detail/reply/save pending |
| Follow/block/report | UI/API exists in parts | Actor/ownership/rate gates | Connections/blocks/reports | Moderation/user operations | PARTIAL — end-to-end parity audit pending |
| Messaging | Member UI | Participant-authorized API | Direct messages | Access policy is restricted/audited | PARTIAL — conversation durability and attachment audit pending |
| Notifications | Member UI | Not yet fully normalized | Notifications table | Limited | PARTIAL |
| Search | People search implemented | Permission-aware people query | Profiles | N/A | PARTIAL — albums/videos/dating unified search pending |
| Verification | Progressive UI and server state | Auth0/email/internal review controls | Reviews/profile state | Verification console | PARTIAL — external stronger age/identity assurance remains owner/legal work |
| Privacy/settings | Settings UI | Server-owned privacy API | Profile privacy fields/consents | Privacy console | PASS for current settings; ongoing route audit |
| Admin/God Mode | Operational consoles | Server roles, MFA, elevation, audit | Durable admin/audit tables | N/A | PASS for secure foundation; entity parity ongoing |
| Monetization | Inaccessible | Disabled | Legacy compatibility fields only | Feature flag disabled | PASS |
| Mock production activity | Removed from primary surfaces | No synthetic API results | Real rows only | Real metrics | PASS for audited surfaces; repository-wide second audit pending |

Status meanings: PASS = implemented for the stated scope; PARTIAL = usable foundation exists but the master requirement is not complete; FAIL = unsafe or absent; LEGAL REVIEW = owner/counsel decision required.
