"use client";

import { useParams, useRouter } from "next/navigation";
import { ProfileStory } from "@/components/profile/ProfileStory";

/**
 * A member's profile on its own page (direct links, reloads, notifications). From People
 * the same story opens as a sheet over the list instead (app/people/@sheet).
 */
export default function CanonicalProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const back = () => (window.history.length > 1 ? router.back() : router.push("/people"));
  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-velora-surface md:my-6 md:overflow-hidden md:rounded-[28px] md:border md:border-velora-line">
      <ProfileStory id={id} variant="page" onBack={back} />
    </main>
  );
}
