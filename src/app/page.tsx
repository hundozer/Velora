import { cookies } from "next/headers";
import { PublicCommunityHome } from "@/components/community/PublicCommunityHome";
import { HomeExperience } from "@/components/community/HomeExperience";

export default function HomePage() {
  // Recognise the SSR client's session cookie and its numbered chunks, without
  // reading or trusting token contents. This hint never authorises member data.
  const hasSessionHint = cookies().getAll().some(({ name, value }) => value && /^sb-.+-auth-token(?:\.\d+)?$/.test(name));
  return <HomeExperience hasSessionHint={hasSessionHint}><PublicCommunityHome /></HomeExperience>;
}
