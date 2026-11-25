import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {parseTonightDiscovery,tonightDiscoveryHref,discoveryPlanHref} from "../src/lib/tonightDiscovery.mjs";
const read=p=>readFile(new URL("../"+p,import.meta.url),"utf8");

test("Tonight filters survive navigation without external return destinations",()=>{
 const input={area:"praha-7",when:"tonight",view:"map"};
 const back=tonightDiscoveryHref(input);
 assert.equal(back,"/tonight?area=praha-7&when=tonight&view=map");
 assert.deepEqual(parseTonightDiscovery(back.split("?")[1]),input);
 const plan=discoveryPlanHref("a-valid-id",input);
 assert.equal(plan,"/tonight/invitation/a-valid-id?area=praha-7&when=tonight&view=map");
 assert.equal(tonightDiscoveryHref({area:"javascript:alert(1)",when:"all",view:"bad"}),"/tonight");
 assert.deepEqual(parseTonightDiscovery("?area=private-home&when=now&view=map"),{area:"",when:"now",view:"map"});
 assert.equal(discoveryPlanHref("something", {area:"",when:"all",view:"list"}),"/tonight/invitation/something");
});
test("Discovery cannot plot private plans, display a live user count, or request location",async()=>{
 const ui=await read("src/components/plans/PragueDiscovery.tsx");
 assert.doesNotMatch(ui,/mapPlans|authors.size|density\s*\?/);
 assert.doesNotMatch(ui,/(?:navigator\.)?geolocation\s*\.|getCurrentPosition\s*\(|watchPosition\s*\(/);
 assert.match(ui,/eventAreas\.includes\(a.id\)/);
 assert.match(ui,/if\(!hasEvent\)return null/);
 assert.match(ui,/fetch\("\/api\/scene\?limit=60"/);
 assert.match(ui,/discoveryPlanHref\(p.id,context\)/);
 assert.match(ui,/plan\.eligibilityText|p\.eligibilityText/);
});
test("An invitation can return to filtered discovery and existing Messages enforces plan eligibility",async()=>{
 const detail=await read("src/app/tonight/invitation/[id]/page.tsx");
 const messages=await read("src/app/api/messages/route.ts");
 const chat=await read("src/components/chat/ChatWindow.tsx");
 assert.match(detail,/setBackHref\(tonightDiscoveryHref\(parseTonightDiscovery/);
 assert.match(detail,/href=\{backHref\}/);
 assert.match(detail,/!plan\.canReply/);
 assert.match(detail,/View the linked public event/);
 assert.match(messages,/planReplyEligibility/);
 assert.match(messages,/datingAdId/);
 assert.match(chat,/context\.plan/);
 assert.match(chat,/openersFor/);
});
