import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("empty saved items offer discovery without manufactured profiles",async()=>{
 const source=await read("src/app/favorites/page.tsx");
 assert.match(source,/Keep the people and posts you want to revisit/);
 assert.match(source,/href="\/people"/);
 assert.match(source,/items\.length \?/);
});
test("connections empty states explain each tab and preserve mutual opt-in",async()=>{
 const source=await read("src/app/connections/page.tsx");
 assert.match(source,/When someone asks to connect/);
 assert.match(source,/Requests you've sent will appear here/);
 assert.match(source,/A connection starts with a mutual yes/);
 assert.match(source,/selected\.length === 0/);
});
test("new guidance is translated",async()=>{
 const cs=JSON.parse(await read("src/locales/cs/phrases.json"));
 for(const key of ["Keep the people and posts you want to revisit.","Explore people","When someone asks to connect, you'll see it here. You choose whether to accept."]) assert.ok(cs[key],key);
});
