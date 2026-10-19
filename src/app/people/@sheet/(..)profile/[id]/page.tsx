"use client";

import { useParams } from "next/navigation";
import { ProfileSheet } from "@/components/profile/ProfileSheet";

/** /profile/[id] opened from People: the profile slides up over the list, which stays put. */
export default function InterceptedProfile() {
  const { id } = useParams<{ id: string }>();
  return <ProfileSheet id={id} />;
}
