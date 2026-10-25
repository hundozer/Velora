# Prague Room pilot, 25 October 2026

One shared, text-only room for active adult Prague members. It is a pilot for conversation density, not a set of empty topical rooms. Posts are visible for seven days in the room, up to the newest 100; old rows are deleted in bounded batches by the existing retention worker after 30 days. The free-plan scheduler's timing is not guaranteed, so this is a cleanup target rather than an exact deletion promise.

## Access and moderation

The server validates an active adult actor on each read and write and derives the sender ID from the session. It excludes demo, inactive and unlinked profiles from reads and hides both directions of a block. The post endpoint also excludes demo profiles and limits a member to ten posts per minute. Members can remove their own posts and report others to the moderation inbox; a moderator with `community:moderate` and MFA can inspect the recent room and remove posts with an audited reason. Removed text remains visible only to the moderator until retention deletes it, or account erasure cascades from the sender. No room table privileges are granted to `anon` or `authenticated`. The service role is the sole application database route.

The room polls every 15 seconds only while its tab is visible. It has no presence indicator, typing indicator, notifications or images. No fabricated posts are seeded.

## Migration and verification

Source base: `main` at `a3ebeab4d5a9c63526d29fc9bf9e6b497b36b346`. The migration is `20261025182105_prague_room.sql`, matching the Supabase staging migration receipt (`name=prague_room`, `version=20261025182105`). Staging project `fuczjjcwtxzzvoxilrme`: table exists, zero room rows, RLS enabled, no policies and no `anon` or `authenticated` SELECT/INSERT/UPDATE/DELETE grants. `service_role` has all four privileges. The body check is 1–500 characters. This was inspected directly with `supabase_execute_sql` after `supabase_apply_migration` succeeded. The older staging profiles and media were not modified.

Production project `bkdyjdbmtucqvgebqadp`: read-only inspection showed no `room_messages` table or `prague_room` ledger entry. This PR must not be released to production before the exact migration is approved and applied there, because the new room endpoints and existing retention route depend on the table. Do not mark production ready on a green build alone.

Local `npm run check` passed: 259 tests, typecheck, lint and production build. The CI PostgreSQL job runs `tests/sql/prague-room-disposable.sql` in an isolated database to verify database role denial and service access. Live two-member room posting, blocks, reports, removal, retention and erasure have not been exercised yet. No production room acceptance data was created.

## Release order

1. Review the staging receipt, SQL and hosted PostgreSQL CI result.
2. Obtain explicit approval for the exact production migration; apply it and confirm ledger, grants, RLS and production health.
3. Merge and check the deployed room endpoints and an isolated real two-member journey on staging Preview, including cleanup. Do not use production member data for destructive tests.

Add themed rooms only after there is enough actual activity and moderation capacity to keep them useful.
