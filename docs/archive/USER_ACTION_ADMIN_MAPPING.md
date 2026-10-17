# User action ↔ God Mode mapping

The same canonical database record must drive user and administrative behavior. Browser storage is never administrative authority.

| User action/state | Canonical record | User-visible effect | God Mode visibility/action | Immediate propagation requirement | Current status |
|---|---|---|---|---|---|
| Create/update profile | `profiles` | Owned profile and discovery representation | Inspect, restrict discovery/account, reactivate | Discovery/profile APIs filter account state | Partial; mock fallback/local media state remain |
| Upload media | `media_objects`, participant declaration | Authorized media URL | Inspect, hide/remove/restore | Media read endpoint enforces record state | Partial; upload/read real, lifecycle incomplete |
| Follow/favourite | `connections` | Persistent relationship state | Case-bound visibility only | Profile/discovery counts derive from DB | Partial |
| Send message | `direct_messages` | Participant conversation | Case-bound policy/legal access | Blocks/restrictions prevent reads/writes | Partial |
| Block member | `user_blocks` | Mutual discovery/message separation | Review only when justified | Discovery/profile/message endpoints enforce | Implemented; end-to-end retest pending |
| Submit report | moderation case/events | Confirmation and appeal path | Triage, assign, decide, audit | Queue updates from same case | Partial |
| Admin restrict/suspend/ban | `profiles.account_status` plus audit event | Access/features denied with useful message | Reasoned action/restore | All protected APIs enforce canonical state | Partial; full route matrix test pending |
| Verification submission | verification/media records | Actual pending/approved/rejected status | Review/decide | Profile badge derives from canonical status | Partial |
| Privacy request/delete | privacy requests/profile/media | Status and completion result | Authorized processing workflow | All owned data covered | Partial; worker/object cleanup incomplete |
| Community/event/live activity | No production canonical workflow | Hidden | Hidden | N/A | HIDDEN_FOR_MVP |
| Payments/tips/subscriptions | Disabled | Inaccessible | Cannot enable | Middleware/server deny | HIDDEN_FOR_MVP |

