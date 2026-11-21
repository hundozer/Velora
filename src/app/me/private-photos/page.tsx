import { redirect } from "next/navigation";
export default function LegacyPrivatePhotoAccess() {
  // Global private-photo grants were replaced by album-specific approvals.
  redirect("/albums/manage");
}
