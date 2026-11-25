// Context is explicit, non-identifying and allowlisted. No external return URLs.
import { isPragueArea } from "./areas.mjs";
const WINDOWS = new Set(["all", "now", "tonight", "upcoming"]);
const VIEWS = new Set(["list", "map"]);

export function parseTonightDiscovery(search) {
 const params = new URLSearchParams(typeof search === "string" ? search : "");
 const area = params.get("area") || "";
 const when = params.get("when") || "all";
 const view = params.get("view") || "list";
 return {
  area: isPragueArea(area) ? area : "",
  when: WINDOWS.has(when) ? when : "all",
  view: VIEWS.has(view) ? view : "list",
 };
}
export function tonightDiscoveryHref(input) {
 const parsed = parseTonightDiscovery(new URLSearchParams(input).toString());
 const q = new URLSearchParams();
 if (parsed.area) q.set("area", parsed.area);
 if (parsed.when !== "all") q.set("when", parsed.when);
 if (parsed.view !== "list") q.set("view", parsed.view);
 return q.size ? `/tonight?${q.toString()}` : "/tonight";
}
export function discoveryPlanHref(id, input) {
 const back = tonightDiscoveryHref(input);
 const url = new URLSearchParams();
 if (back !== "/tonight") {
  const filters = new URL(back, "https://intimo.invalid").searchParams;
  for (const [key, val] of filters) url.set(key,val);
 }
 return `/tonight/invitation/${encodeURIComponent(id)}${url.size ? "?" + url : ""}`;
}
