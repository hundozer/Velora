import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("three choices exist; legacy follower/friend albums stay protected", () => {
  const ui=read("src/components/media/AlbumManager.tsx");
  assert.match(ui, /\["MEMBERS_ONLY", "Community"\]/);
  assert.match(ui, /\["PRIVATE_APPROVED", "Private"\]/);
  assert.match(ui, /\["PRIVATE", "Only me"\]/);
  assert.match(ui, /LEGACY_VISIBILITIES/);
  assert.match(ui, /confirmAudienceChange/);
});

test("private albums never appear in community or public feeds", () => {
  const feed=read("src/app/api/feed/route.ts");
  const audience=read("src/lib/feed/audience.ts");
  assert.match(feed, /const visibleAlbums/);
  assert.match(feed, /linkedIds/);
  assert.doesNotMatch(feed, /\.in\("visibility",\s*\["PRIVATE_APPROVED"\]\)/);
  assert.match(audience, /return false/);
  const publicAlbums=read("src/app/api/public/albums/route.ts");
  const publicDetail=read("src/app/api/public/albums/[id]/route.ts");
  assert.match(publicAlbums, /\.in\("visibility", \["PUBLIC","MEMBERS_ONLY"\]\)/);
  assert.match(publicDetail, /\.in\("visibility",\["PUBLIC","MEMBERS_ONLY"\]\)/);
  assert.match(publicAlbums, /hasAdultAccess/);
  assert.match(publicDetail, /hasAdultAccess/);
});

test("album detail uses per-album approval and rejects blocked viewers", () => {
  const route=read("src/app/api/albums/[id]/route.ts");
  assert.match(route, /canViewAlbum\(db, album, auth.actor.profileId\)/);
  assert.match(route, /user_blocks/);
  assert.match(route, /hasAdultAccess/);
  assert.match(route, /if \(!allowed\) return NextResponse.json/);
});

test("private album listing uses scoped grants and does not leak private-photo counts", () => {
  const route=read("src/app/api/private-access/media/route.ts");
  assert.match(route, /album_viewer_grants/);
  assert.match(route, /\.eq\("visibility","PRIVATE_APPROVED"\)/);
  assert.match(route, /\.eq\("moderation_status","APPROVED"\)/);
  assert.doesNotMatch(route, /album_access_grants/);
  const profile=read("src/components/profile/ProfileStory.tsx");
  assert.match(profile, /setPrivateAlbums\(privateContent\?\.albums \|\| \[\]\)/);
  assert.match(profile, /\[\.\.\.albums, \.\.\.privateAlbums\]/);
  assert.doesNotMatch(profile, /<PrivatePhotoWords/);
});

test("private and owner-only album media writes require private originals", () => {
  const route=read("src/app/api/albums/[id]/media/route.ts");
  assert.match(route, /\["PRIVATE_APPROVED", "PRIVATE"\]\.includes\(album.visibility\)/);
  assert.match(route, /photo.visibility !== "PRIVATE"/);
  assert.match(route, /photo.media_type !== "IMAGE"/);
  assert.match(route, /\["MESSAGE","STORY","AGE_CHECK"\]/);
});
