import { redirect } from "next/navigation";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { currentEmailVerification } from "@/lib/auth0/emailVerification";

export const dynamic = "force-dynamic";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const result = await resolveServerActor();
  if (result.status === "unauthenticated") redirect("/auth/login?returnTo=%2Fsettings");
  if (result.status === "unavailable") redirect("/login?error=authorization_unavailable");
  if (result.status === "unprovisioned") {
    redirect((await currentEmailVerification(result.identity)) ? "/onboarding" : "/verify-email");
  }
  if (result.actor.accountStatus !== "ACTIVE") redirect("/account-restricted");
  return children;
}
