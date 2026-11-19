import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import sharp from "sharp";
import {sanitizeDeliveredImage} from "../src/lib/media/variants.mjs";
const read=(p)=>readFileSync(new URL(`../${p}`,import.meta.url),"utf8");

test("viewer watermark changes private image bytes but keeps WebP/no EXIF",async()=>{
 const source=await sharp({create:{width:480,height:280,channels:3,background:"#777777"}}).png().toBuffer();
 const original=await sanitizeDeliveredImage(source);
 const marked=await sanitizeDeliveredImage(source,"Jane <viewer>");
 assert.notDeepEqual(original,marked);
 const info=await sharp(marked).metadata();
 assert.equal(info.format,"webp");
 assert.equal(info.exif,undefined);
});

test("view-once endpoint claims exactly one recipient read before returning bytes",()=>{
 const r=read("src/app/api/messages/view-once/route.ts");
 assert.match(r,/\.eq\("receiver_id",auth\.actor\.profileId\)/);
 assert.match(r,/\.eq\("view_once",true\)/);
 assert.match(r,/\.is\("view_once_opened_at",null\)/);
 assert.match(r,/\.update\(\{view_once_opened_at:new Date\(\)\.toISOString\(\)\}\)/);
 assert.match(r,/if\(claimError \|\| !claimed\)return hidden\(\)/);
 assert.match(r,/await deliverMedia\(media\.object_key,media\.mime_type,undefined,viewer\.display_name\)/);
});

test("ordinary media URL cannot bypass view-once delivery",()=>{
 const media=read("src/app/api/media/[id]/route.ts");
 assert.match(media,/message\?\.view_once !== true/);
 assert.match(media,/viewer\.display_name/);
 assert.match(read("src/app/api/messages/route.ts"),/view_once_opened_at/);
 const sql=read("supabase/migrations/20261119170000_view_once_chat_photos.sql");
 assert.match(sql,/ROLLBACK/);
 assert.match(sql,/view_once boolean NOT NULL DEFAULT false/);
});

test("view-once photo does not preload bytes before recipient opens",()=>{
 const photo=read("src/components/chat/ChatPhoto.tsx");
 assert.match(photo,/if\(viewOnce && !mine\)/);
 assert.match(photo,/fetch\("\/api\/messages\/view-once"/);
 assert.match(photo,/URL\.createObjectURL/);
 assert.match(photo,/URL\.revokeObjectURL/);
 assert.match(photo,/t\("Opened"\)/);
});
