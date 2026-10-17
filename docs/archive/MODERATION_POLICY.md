# Moderation and notice/action policy — engineering draft

**REQUIRES LEGAL REVIEW BEFORE PRODUCTION USE.**

Reports accept a resource type/id, structured reason and description. Suspected minors, CSAM, NCII and exploitation/trafficking are critical: preserve relevant evidence securely, restrict access where justified, escalate to a trained reviewer, avoid unnecessary copying, and follow the legally approved emergency/law-enforcement procedure. A report alone must not automatically establish guilt.

Each case requires an immutable history: receipt, priority, assignment, evidence references, provisional restriction, decision, policy/legal basis, content/account action, user notice, appeal and final resolution. The repository stages `moderation_events` for append-only history; case/event writes still need a transactional database function.

Appeals should be time-bounded, reasoned and reviewed independently where practicable. Notices must explain the action and appeal channel without exposing reporters or compromising safety/investigations. Reviewer access is least privilege and must use MFA; that enforcement is a launch blocker. Operational SLAs, on-call ownership, trusted flagger/regulator interfaces and transparency reporting require legal/operations approval.
