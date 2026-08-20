import { redirect } from "next/navigation";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { currentEmailVerification } from "@/lib/auth0/emailVerification";

export const dynamic = "force-dynamic";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const result = await resolveServerActor();
  if (result.status === "unauthenticated") redirect("/auth/login?returnTo=%2Fonboarding");
  if (result.status === "unavailable") redirect("/login?error=authorization_unavailable");
  if (result.status === "authenticated") {
    redirect(result.actor.accountStatus === "ACTIVE" ? "/dashboard" : "/account-restricted");
  }
  if (!(await currentEmailVerification(result.identity))) redirect("/verify-email");
  return children;
}
