import { PublicCommunityHome } from "@/components/community/PublicCommunityHome";
import { ComingSoonHome } from "@/components/community/ComingSoonHome";
import { HomeExperience } from "@/components/community/HomeExperience";
import { COMING_SOON } from "@/lib/comingSoon.mjs";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

// A cookie is only a display hint. No member data is rendered here; both the
// session endpoint and feed endpoint still verify the caller independently.
// A stale cookie falls back to the same front page as a signed-out visitor.
export default function MemberHomePage() {
  return <HomeExperience hasSessionHint>{COMING_SOON ? <ComingSoonHome /> : <PublicCommunityHome />}</HomeExperience>;
}
