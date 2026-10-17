import { redirect } from "next/navigation";
import { isAdminActor, resolveServerActor } from "@/lib/auth/serverActor";
import { adminMfaSatisfied } from "@/lib/auth/adminAuthorization";
import { AdminCommandCenter } from "@/components/admin/AdminCommandCenter";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children: _children }: { children: React.ReactNode }) {
  const result = await resolveServerActor();
  if (result.status === "unauthenticated") redirect("/auth/login?returnTo=%2Fadmin");
  if (result.status === "unavailable") redirect("/login?error=authorization_unavailable");
  if (result.status === "unprovisioned") redirect("/onboarding");
  if (!isAdminActor(result.actor)) {
    redirect("/dashboard?error=forbidden");
  }
  if (!adminMfaSatisfied(result.actor)) redirect("/admin-mfa");
  // The legacy admin page remains as migration reference but is intentionally
  // never mounted: it contains browser-only authority and monetization controls.
  return <AdminCommandCenter actor={{ role: result.actor.role, email: result.actor.email || "", mfaAuthenticated: result.actor.mfaAuthenticated }} />;
}
