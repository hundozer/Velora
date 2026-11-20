import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const s=readFileSync(new URL("../src/components/people/MemberPeople.tsx",import.meta.url),"utf8");

test("mobile PWA header and Stories share one sticky stacking context",()=>{
  assert.match(s,/data-people-mobile-header/);
  assert.match(s,/sticky top-0 z-30 w-full md:static md:z-auto/);
  const wrap=s.indexOf("data-people-mobile-header");
  const header=s.indexOf("<header",wrap);
  const stories=s.indexOf('href="/stories"',header);
  const close=s.indexOf("</div>\n      </div>\n\n      {showIntroductions",stories);
  assert.ok(wrap>=0&&header>wrap&&stories>header&&close>stories,"header and Stories must be within sticky wrapper");
  assert.match(s,/scroll-mt-\[125px\] md:scroll-mt-4/);
});

test("desktop layout remains non-sticky, intro and Everyone destinations remain reachable",()=>{
  assert.match(s,/md:static md:z-auto/);
  assert.match(s,/id={`intro-\$\{index\}`}/);
  assert.match(s,/id="everyone-nearby"/);
  assert.match(s,/scrollToId\(index \+ 1 < introductions.length/);
});
