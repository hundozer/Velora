import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFile(path.join(root, file), "utf8");

test("realtime subscribes only to the member's own messages and re-reads through the API", async () => {
  const hook = await read("src/lib/messaging/useMessageRealtime.ts");
  assert.match(hook, /filter: `receiver_id=eq\.\$\{profileId\}`/);
  assert.match(hook, /filter: `sender_id=eq\.\$\{profileId\}`/);
  assert.match(hook, /removeChannel\(channel\)/);
  assert.doesNotMatch(hook, /\.from\("direct_messages"\)/);
  const page = await read("src/app/messages/page.tsx");
  assert.match(page, /useMessageRealtime\(profile\?\.id/);
  assert.match(page, /window\.setInterval\(syncConversations, 60_000\)/);
});

test("conversation list hides blocked or inactive peers and flags requests", async () => {
  const route = await read("src/app/api/messages/route.ts");
  assert.match(route, /\.in\("id", peerIds\)\.eq\("account_status", "ACTIVE"\)/);
  assert.match(route, /if \(!profile \|\| blockedPeers\.has\(id\)\) return \[\];/);
  assert.match(route, /isRequest: !repliedIn\.has\(row\.conversation_id\)/);
});

test("inbox splits Inbox / Unread / Requests and refreshes the open thread on events", async () => {
  const chat = await read("src/components/chat/ChatWindow.tsx");
  assert.match(chat, /folder === "REQUESTS" \? c\.isRequest : !c\.isRequest/);
  assert.match(chat, /\}, \[activeConversation, threadVersion\]\);/);
  assert.match(chat, /Message request: you haven&apos;t replied yet/);
});
