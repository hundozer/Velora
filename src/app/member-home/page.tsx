import { PublicCommunityHome } from "@/components/community/PublicCommunityHome";
import { HomeExperience } from "@/components/community/HomeExperience";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

// A cookie is only a display hint. No member data is rendered here; both the
// session endpoint and feed endpoint still verify the caller independently.
export default function MemberHomePage() {
  return <HomeExperience hasSessionHint><PublicCommunityHome /></HomeExperience>;
}
