import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("new audience is distinct from owner-only PRIVATE, without migrating old albums", () => {
  const ddl = read("supabase/migrations/20261120103000_private_approved_albums.sql");
  assert.match(ddl, /'PRIVATE_APPROVED'/);
  assert.match(ddl, /'PRIVATE'/);
  assert.doesNotMatch(ddl, /UPDATE public\.media_albums/i);
  const ui = read("src/components/media/AlbumManager.tsx");
  assert.match(ui, /\["PRIVATE_APPROVED", "Private — approved people"\]/);
  assert.match(ui, /\["PRIVATE", "Only me"\]/);
});

test("private albums cannot enter community or public feeds", () => {
  const feed = read("src/app/api/feed/route.ts");
  assert.match(feed, /scope === "newest" \? \["PUBLIC", "MEMBERS_ONLY"\]/);
  assert.match(feed, /const visibleAlbums = \(albumRows \|\| \[\]\)\.filter\(row => allowed\(row.visibility, row.owner_id\)\)/);
  const audience = read("src/lib/feed/audience.ts");
  assert.match(audience, /if \(visibility === "FRIENDS_ONLY"\) return friends\.has\(ownerId\)/);
  assert.match(audience, /if \(!\["PUBLIC", "MEMBERS_ONLY", "FOLLOWERS_ONLY", "FRIENDS_ONLY"\]\.includes\(visibility\)\) return false/);
  assert.doesNotMatch(feed, /PRIVATE_APPROVED/);
  const publicAlbums = read("src/app/api/public/albums/route.ts");
  assert.match(publicAlbums, /\.eq\("visibility", "PUBLIC"\)/);
  const publicDetail = read("src/app/api/public/albums/[id]/route.ts");
  assert.match(publicDetail, /\.eq\("visibility","PUBLIC"\)/);
});

test("private album detail requires current grant and hides unauthorized metadata", () => {
  const route = read("src/app/api/albums/[id]/route.ts");
  assert.match(route, /album\.visibility === "PRIVATE_APPROVED"/);
  assert.match(route, /\.eq\("viewer_id", auth\.actor\.profileId\)/);
  assert.match(route, /grantIsActive\(grant\)/);
  assert.match(route, /if \(!allowed\) return NextResponse\.json\(\{ error: "Album not found" \}/);
  assert.match(route, /mediaQuery = mediaQuery\.eq\("visibility", "PRIVATE"\)/);
  assert.match(route, /grantError\) return NextResponse\.json/);
  assert.match(route, /user_blocks/);
  assert.match(route, /hasAdultAccess/);
});

test("private album listing does not reveal titles or covers without grants", () => {
  const route = read("src/app/api/private-access/media/route.ts");
  const grantCheck = route.indexOf("if (!grantIsActive(grant))");
  const albumSelect = route.indexOf('.eq("visibility", "PRIVATE_APPROVED")');
  assert.ok(grantCheck >= 0 && albumSelect > grantCheck, "only after authorization");
  assert.match(route, /\.eq\("moderation_status", "APPROVED"\)/);
  assert.match(route, /safeCovers/);
  const profile = read("src/components/profile/ProfileStory.tsx");
  assert.match(profile, /setPrivateAlbums\(privateContent\?\.albums \|\| \[\]\)/);
  assert.match(profile, /setPrivateAlbums\(\[\]\)/);
  assert.match(profile, /\[\.\.\.albums, \.\.\.privateAlbums\]/);
});

test("album media writes reject non-private content for approved viewers", () => {
  const route = read("src/app/api/albums/[id]/media/route.ts");
  assert.match(route, /album\.visibility === "PRIVATE_APPROVED"/);
  assert.match(route, /photo\.visibility !== "PRIVATE"/);
  assert.match(route, /photo\.media_type !== "IMAGE"/);
  assert.match(route, /\["MESSAGE","STORY","AGE_CHECK"\]/);
});
