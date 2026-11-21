# Album visibility — three-audience rollout (21 Nov 2026)

## User-facing options
- **Community**: stored as `MEMBERS_ONLY`, available only to verified active members; may appear in the community feed
- **Private**: stored as `PRIVATE_APPROVED`; access is **per album**, explicitly approved by the owner using an exact verified username; not in feeds
- **Only me**: stored as `PRIVATE`; only the album owner may see it; no requests or other approved viewers

Legacy `FOLLOWERS_ONLY` and `FRIENDS_ONLY` album rows retain their exact prior audiences (they are not remapped into broader access) until the owner confirms conversion. Legacy `PUBLIC` is narrowed to `MEMBERS_ONLY`, not widened. No existing media is deleted.

## Authorization invariants
1. A link from a media object to **any** album takes precedence over the media object's standalone visibility. Every linked album must authorize the current verified viewer.
2. Owners can always view their own albums; everyone else must be active, age-verified, unblocked and covered by the album's scope.
3. A `PRIVATE` album never has approved viewers; `PRIVATE_APPROVED` grants require an explicit `album_id` + `viewer_id` entry and may expire.
4. An old owner-wide `album_access_grants` grant is **not** consulted for private originals or albums after migration.
5. Changing an album away from `PRIVATE_APPROVED` automatically clears all its grants; switching back never resurrects access.
6. An album's title, cover, photo and other metadata must not leak through public media, search, feed or global grant discovery.
7. The public/community album catalog requires authenticated, active adult access and two-way block suppression; the actual photo bytes use the authenticated media route.
8. Files and galleries deny unapproved, removed or not-ready media; media objects owned by other members cannot be attached.

## Migration sequence
1. Snapshot `media_albums`, `media_album_items` and `album_access_grants`; capture counts by visibility and current approvals. Recheck that a given media_id cannot accidentally grant multiple album audiences.
2. Apply `20261121020000_album_visibility_three_options.sql` **before** application deployment. It creates `album_viewer_grants` with RLS and no browser grants, conservatively copies active grants only to legacy `PRIVATE_APPROVED` albums and narrows legacy `PUBLIC` to `MEMBERS_ONLY`.
3. Apply `20261121020100_album_scope_grant_invalidation.sql`. Verify its grant-clearing trigger is installed.
4. Validate privilege boundaries (anon/authenticated must have no CRUD), migrated grant counts, and no approval for `PRIVATE` albums. Run `tests/sql/album-three-audiences.sql` on disposable Postgres via CI; staging was also tested with transactional temporary records.
5. Only after green CI and Vercel preview, merge application PR, verify production READY, test media byte delivery with owner + grantee + stranger + blocked user + expired/revoked grant.
6. Roll back application code **before** considering any schema rollback. Retain the new table and trigger by default to avoid dropping migrated grant evidence. Never revert `MEMBERS_ONLY` to `PUBLIC` automatically. Any destructive rollback or deletion requires a separately reviewed migration and confirmed backup.

## Privacy-first release limitations
This CI suite checks source gates, actual compiled access helper decisions and real PostgreSQL role/migration semantics. It does not replace signed-in, two-member, physical-iPhone testing of private media-byte requests. That remains a release acceptance item and should be explicitly reported until verified.
