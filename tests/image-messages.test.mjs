import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFile(path.join(root, file), "utf8");

test("chat photos are only the sender's own MESSAGE uploads, and explicit ones respect boundaries", async () => {
  const route = await read("src/app/api/messages/route.ts");
  assert.match(route, /media\.owner_id !== actor\.actor\.profileId \|\| media\.media_type !== "IMAGE" \|\| media\.upload_status !== "AVAILABLE" \|\| media\.category !== "MESSAGE"/);
  assert.match(route, /if \(media\.content_rating === "EXPLICIT"\) \{[\s\S]*EXPLICIT_MEDIA_IN_CHAT[\s\S]*establishedDecision\(preference, Boolean\(repliedBefore\)\)/);
  assert.match(route, /media_url: mediaId \? `\/api\/media\/\$\{mediaId\}` : null, attachment_type: mediaId \? "IMAGE" : null/);
});

test("chat photos are served only to the recipient of that message, never publicly", async () => {
  const media = await read("src/app/api/media/[id]/route.ts");
  assert.match(media, /\.eq\("media_url", `\/api\/media\/\$\{media\.id\}`\)\.eq\("sender_id", media\.owner_id\)\.eq\("receiver_id", actor\.actor\.profileId\)/);
  assert.match(media, /\(!isChatImage && \(media\.visibility === "PUBLIC" \|\| media\.visibility === "MEMBERS_ONLY"\)\)/);
  assert.match(media, /getPresignedDownloadUrl/);
  const chat = await read("src/components/chat/ChatWindow.tsx");
  assert.match(chat, /uploadFileToR2\(file, "photos", setUploadingPhoto, declaration, "PRIVATE"/);
  assert.match(await read("src/components/chat/ChatPhoto.tsx"), /useState\(mine\)/);
});

test("chat photos stay out of galleries and the proactive review queue", async () => {
  assert.match(await read("src/app/api/private-access/media/route.ts"), /category\.neq\.MESSAGE/);
  assert.match(await read("src/app/api/admin/media/route.ts"), /category\.neq\.MESSAGE/);
  assert.match(await read("src/components/media/AlbumManager.tsx"), /item\.category !== "MESSAGE"/);
});
