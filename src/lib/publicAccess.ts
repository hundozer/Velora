import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { COMING_SOON } from "@/lib/comingSoon.mjs";

/**
 * While the site is closed (FM-13) the middleware lets signed-in visitors reach /api/public/*.
 * FM-06: of those, only age-checked members may read them; a member still waiting for their
 * check gets the same 404 an anonymous visitor gets. Returns the refusal, or null to continue.
 */
export async function closedSiteRefusal(req: NextRequest): Promise<NextResponse | null> {
  if (!COMING_SOON) return null;
  const actor = await resolveServerActor(req);
  if (actor.status === "authenticated" && hasAdultAccess(actor.actor)) return null;
  return NextResponse.json({ error: "Not found" }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
}
