import { redirect } from "next/navigation";
import { resolveServerActor } from "@/lib/auth/serverActor";

export const dynamic = "force-dynamic";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const result = await resolveServerActor();
  if (result.status === "unauthenticated") redirect("/auth/login?returnTo=%2Fonboarding");
  if (result.status === "unavailable") redirect("/login?error=authorization_unavailable");
  if (result.status === "authenticated") {
    if (result.actor.accountStatus !== "ACTIVE") redirect("/account-restricted");
    // Already-provisioned members resume at the server-verified age-check stage.
    // A declared birthday or an uploaded profile photo does not grant access.
    redirect(result.actor.ageVerificationStatus === "AGE_VERIFIED" ? "/dashboard" : "/verify-age");
  }
  if (!result.identity.emailVerified) redirect("/verify-email");
  return children;
}
