# Photo Stories and aura rings

Based on merged main `0390217b2d389e5e5424297dcc2cfb84d8bd2585`. Owner approved photo Stories and Instagram-like profile rings. This slice adds photo publishing, audience choice, 24-hour viewing expiry, viewer, reporting, private message entry and owner deletion. Video, audio and Plan attachments are deferred.

Audience choices: friends (default), selected people (up to 20), or eligible signed-in adults. Profile visibility, account status, media review and blocks remain additional restrictions. Only approved, processed, non-explicit story photos are shown to other members. Authors can preview pending stories. Review does not restart the 24-hour clock. Captions are copied into media review details at publication.

Story photos stay category STORY and visibility PRIVATE. A database guard prevents repurposing them. Generic media delivery, album attachment/read and private-photo access listings/counts exclude story objects; story delivery checks authorization/expiry every time and proxies sanitized image bytes without reusable storage URLs or untouched-upload fallback.

Bright Intimo accent aura means unseen authorized stories; muted means all viewed. No authorized active story means no ring. People, introductions, profile and message avatars use separate keyboard-accessible story controls; names remain profile links. Summaries are batched, identity-scoped, not persisted and no-store. Rings refresh on focus/events and every 30 seconds, and clear at expiry. Already-rendered state may lag external blocking/moderation until refresh; every new image request rechecks current authorization.

Tables and RPCs are service-only with RLS enabled and anon/authenticated direct access revoked. Active-story cap is ten per owner. Read/view history is private; author viewer lists are not introduced. Exports include the owner's stories and their own viewing markers. Erasure removes story/view rows. The protected retention runner also cleans expired/abandoned story photos in bounded batches, honoring legal holds and retrying storage failures. Expiry immediately stops delivery; physical deletion depends on retention execution and is not claimed to occur at the exact 24-hour instant.

## Migration and live verification

CLI originally generated `20261025033730_private_photo_stories.sql`. Staging's official tool application assigned `20261025034408`, name `private_photo_stories`; the source was renamed to match that actual receipt. Raw SQL MD5 `a2f5d19dd1ce62ccd5869be54ec1f06b`. No ledger repair or invented receipt. This identifier follows its existing base/media/friendship/auth prerequisites; later future-dated unrelated migrations are already installed in both environments. Production must receive the reviewed SQL before application merge; inspect and reconcile the actual receipt rather than repeat the earlier history mismatch.

Actual staging roles passed the rollback fixture covering pending review, selected/friends/member audiences, excluded summaries, viewed markers, both block directions, profile visibility/discovery hiding, inactive/non-adult readers, moderation removal, repurpose denial, deletion, expiry, cascades and direct anon/authenticated denial. Two raw test calls returned ambiguous invalid/expired requestState errors; no pass was claimed. Ledger/objects and zero fixtures were independently checked before switching to an exception-wrapped test that explicitly returned PASS while rolling back all fixtures. Baseline remains two legacy profiles and five media objects.

Current local results: 250 tests, typecheck and lint passed before the latest isolation changes. Final responsive browser, CI/build and actual Auth/R2 acceptance results remain in progress; no production feature migration or customer-journey claim yet.

Follow-up author guard: CLI generated `20261025042359_story_author_adult_guard.sql`; actual staging receipt `20261025042415`, SQL MD5 `e3f65987526523a8677d63b7615bc753`. Source renamed to the actual receipt. This replaces the visibility function to recheck author adulthood after publication too, preserving its service-only grants. Both migrations must precede application activation.

Responsive Chromium rehearsal passed at 390/1440px: unread/viewed/absent rings, separate profile navigation, viewer/media load, default friends audience, mandatory publication consent, upload payload and unavailable denial. API data were synthetic. Screenshots were visually inspected. Local test/typecheck/lint/build passed; real staging acceptance remains pending.
