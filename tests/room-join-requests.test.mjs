import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("pending room requests never grant access to room messages", () => {
  const migration = read("supabase/migrations/20261121000000_room_join_requests.sql");
  const access = read("src/lib/rooms/access.ts");
  assert.match(migration, /create table public\.room_join_requests/);
  assert.match(migration, /status text not null default 'PENDING'/);
  assert.match(migration, /if p_action = 'APPROVE' then\s*insert into public\.room_members/);
  assert.match(migration, /alter table public\.room_join_requests enable row level security/);
  assert.match(migration, /revoke all on public\.room_join_requests from public, anon, authenticated/);
  assert.match(migration, /language plpgsql security invoker/);
  assert.match(migration, /revoke all on function public\.intimo_room_join_action\(text,uuid,text,uuid\) from public, anon, authenticated/);
  assert.match(access, /from\("room_members"\)/);
  assert.doesNotMatch(access, /room_join_requests/);
});

test("room request API verifies actor and scopes owner review and decisions", () => {
  const api = read("src/app/api/rooms/[id]/requests/route.ts");
  assert.match(api, /roomActor\(req\)/);
  assert.match(api, /auth\.room\.creator_id === me/);
  assert.match(api, /room_join_requests/);
  assert.match(api, /\.eq\("requester_id", me\)/);
  assert.match(api, /ownerAction && \(auth\.room\.creator_id !== auth\.actor\.profileId/);
  assert.match(api, /rpc\("intimo_room_join_action"/);
  assert.match(api, /checkRateLimit/);
});

test("room screens expose request and owner moderation controls without leaked messages", () => {
  const room = read("src/app/rooms/[id]/page.tsx");
  const settings = read("src/app/rooms/[id]/settings/page.tsx");
  const panel = read("src/components/rooms/RoomJoinRequestPanel.tsx");
  const review = read("src/components/rooms/RoomPendingRequests.tsx");
  assert.match(room, /<RoomJoinRequestPanel roomId=\{id\} \/>/);
  assert.match(room, /response\.status === 403/);
  assert.match(room, /accessDenied \? null/);
  assert.match(settings, /<RoomPendingRequests roomId=\{id\} \/>/);
  assert.match(panel, /"REQUEST" \| "CANCEL"/);
  assert.match(review, /"APPROVE" \| "DECLINE"/);
});
