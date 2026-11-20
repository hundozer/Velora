import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/components/people/MemberPeople.tsx", import.meta.url),"utf8");

test("iPhone installed app reserves the top safe area inside the sticky header",()=>{
  assert.ok(source.includes('sticky top-0 z-30 w-full pt-[env(safe-area-inset-top)]'));
  assert.ok(source.includes('md:static md:z-auto md:pt-0'));
  assert.ok(source.includes('bg-velora-night'));
  assert.ok(source.includes('data-people-mobile-header'));
});

test("anchor offsets and Everyone heading fit between persistent bars",()=>{
  assert.ok(source.includes('scroll-mt-[calc(8rem+env(safe-area-inset-top))]'));
  assert.ok(source.includes('text-[clamp(2.75rem,11vw,4.75rem)]'));
  assert.ok(source.includes('md:text-[clamp(3.25rem,8vw,6.25rem)]'));
  assert.match(source,/id="everyone-nearby"/);
});
