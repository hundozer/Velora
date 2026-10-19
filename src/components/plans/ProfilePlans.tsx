"use client";

import React from "react";
import { PlanCard, type Plan } from "@/components/plans/PlanCard";

/** A member's live Plans on their profile (P1-07). Renders nothing when there are none. */
export function ProfilePlans({ profileId }: { profileId: string }) {
  const [plans, setPlans] = React.useState<Plan[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    fetch(`/api/dating-ads?authorId=${encodeURIComponent(profileId)}`, { credentials: "same-origin", cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => { if (!cancelled && payload) setPlans(payload.plans || []); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [profileId]);

  if (plans.length === 0) return null;
  return (
    <section aria-label="Invitations">
      <h2 className="mb-2 font-display text-[34px] leading-tight text-velora-ink">{plans.length === 1 ? "An invitation" : "Invitations"}</h2>
      {plans.map((plan) => <PlanCard key={plan.id} plan={plan} />)}
    </section>
  );
}
