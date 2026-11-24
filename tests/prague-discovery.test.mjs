import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const read=p=>readFile(new URL("../"+p,import.meta.url),"utf8");

test("Tonight Prague discovery uses real existing moderated plan and scene APIs",async()=>{
 const ui=await read("src/components/plans/PragueDiscovery.tsx");
 const tonight=await read("src/app/tonight/page.tsx");
 const plansApi=await read("src/app/api/dating-ads/route.ts");
 assert.match(tonight,/PragueDiscovery plans=\{plans\}/);
 assert.match(ui,/fetch\("\/api\/scene\?limit=60"/);
 assert.match(tonight,/fetch\(\x60\/api\/dating-ads/);
 assert.match(plansApi,/const blocked = new Set/);
 assert.match(plansApi,/age_verification_status/);
 assert.match(plansApi,/areaId: row.area_id \|\| null/);
 assert.match(ui,/view==="list"/);
 assert.match(ui,/view==="map"/);
 assert.match(ui,/value=\{area\}/);
 assert.match(ui,/value=\{window\}/);
});

test("district map shows no individual member location or ungrounded density",async()=>{
 const ui=await read("src/components/plans/PragueDiscovery.tsx");
 assert.match(ui,/authors.size>=3/);
 assert.match(ui,/groups\.get\(p.areaId\)!\.add\(p.authorId\)/);
 assert.match(ui,/PRAGUE = AREAS\.filter/);
 assert.match(ui,/eventAreas/);
 assert.doesNotMatch(ui,/geolocation|getCurrentPosition|watchPosition|navigator\.geolocation/);
 assert.match(ui,/Nothing to map yet/);
 assert.match(ui,/not a street map/);
});

test("Prague discovery roadmap has implementation and privacy acceptance gates",async()=>{
 const roadmap=await read("docs/ROADMAP.md");
 for(const id of ["PD-01","PD-02","PD-03","PD-04","PD-05","PD-06"])assert.match(roadmap,new RegExp(id));
 assert.match(roadmap,/at least three distinct visible authors/);
 const cs=JSON.parse(await read("src/locales/cs/phrases.json"));
 assert.ok(cs["Prague discovery"]);
 assert.ok(cs["Find your kind of night"]);
});
