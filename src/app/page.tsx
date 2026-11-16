import { PublicCommunityHome } from "@/components/community/PublicCommunityHome";
import { ComingSoonHome } from "@/components/community/ComingSoonHome";
import { HomeExperience } from "@/components/community/HomeExperience";
import { COMING_SOON } from "@/lib/comingSoon.mjs";

export default function HomePage() {
  // Middleware sends cookie-bearing requests to the private loading shell.
  // This public document can be generated once and served from the CDN.
  return <HomeExperience hasSessionHint={false}>{COMING_SOON ? <ComingSoonHome /> : <PublicCommunityHome />}</HomeExperience>;
}
