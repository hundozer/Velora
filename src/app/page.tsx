import { PublicCommunityHome } from "@/components/community/PublicCommunityHome";
import { HomeExperience } from "@/components/community/HomeExperience";

export default function HomePage() {
  // Middleware sends cookie-bearing requests to the private loading shell.
  // This public document can be generated once and served from the CDN.
  return <HomeExperience hasSessionHint={false}><PublicCommunityHome /></HomeExperience>;
}
