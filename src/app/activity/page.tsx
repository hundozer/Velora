"use client";

import { useTranslation } from "@/context/LanguageContext";
import React from "react";
import Link from "next/link";
import { UsersRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BehindTheDoorLanding } from "@/components/landing/BehindTheDoorLanding";
import { PersonTile, type Person } from "@/components/people/PersonTile";

type Entry = Person & { when: string };
type Tab = "MUTUAL" | "INTERESTED" | "VISITORS";

/** Activity (P1-08): mutual interest, who's interested in you, and who visited. */
export default function ActivityPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = React.useState<{ visitors: Entry[]; interestedInYou: Entry[]; mutual: Entry[]; browseInvisibly: boolean } | null>(null);
  const [tab, setTab] = React.useState<Tab>("MUTUAL");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!user) return;
    fetch("/api/activity", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Activity could not be loaded.");
        setData(payload);
        // Open on the most rewarding non-empty tab.
        setTab(payload.mutual?.length ? "MUTUAL" : payload.interestedInYou?.length ? "INTERESTED" : "VISITORS");
      })
      .catch((cause) => setError(cause.message));
  }, [user]);

  if (!user) return <BehindTheDoorLanding />;

  const tabs: { id: Tab; label: string; items: Entry[] }[] = data ? [
    { id: "MUTUAL", label: "Both interested", items: data.mutual },
    { id: "INTERESTED", label: "Interested in you", items: data.interestedInYou },
    { id: "VISITORS", label: "Visitors", items: data.visitors },
  ] : [];
  const current = tabs.find((item) => item.id === tab);

  return (
    <main className="intimo-member-page intimo-grain mx-auto min-h-[70vh] max-w-5xl space-y-8 px-5 pb-24 pt-10 sm:px-8">
      <header>
        <p className="intimo-member-kicker">{t("Activity")}</p>
        <h1 className="intimo-member-heading mt-3">{t("Who's noticed you")}</h1>
        <Link href="/connections" className="intimo-member-secondary mt-6 gap-2 px-5 text-sm"><UsersRound className="h-4 w-4" />{t("Connections & requests")}</Link>
      </header>
      {error && <p role="alert" className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-velora-danger">{t(error)}</p>}
      {!data ? (
        <p className="text-sm text-velora-textMuted">{t("Loading…")}</p>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label={t("Activity")}>
            {tabs.map((item) => (
              <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={`intimo-member-tab min-h-12 shrink-0 px-4 font-semibold transition ${tab === item.id ? "border-velora-warm text-velora-ink" : "hover:text-velora-ink"}`}>
                {t(item.label)}{item.items.length > 0 ? ` · ${item.items.length}` : ""}
              </button>
            ))}
          </div>
          {current && current.items.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {current.items.map((person) => (
                <div key={person.id} className="space-y-1">
                  <PersonTile person={person} />
                  <p className="px-1 text-[11px] text-velora-textMuted">{person.when}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="intimo-member-panel px-7 py-12 text-left">
              {tab === "VISITORS" && data.browseInvisibly ? (
                <p className="text-sm text-velora-textSecondary">{t("You browse invisibly, so visitors are hidden for you too. Change it in")}{" "}<Link href="/settings" className="text-velora-accent underline">{t("Settings → Privacy")}</Link>.</p>
              ) : (
                <>
                  <h2 className="intimo-member-subheading text-velora-ink">{tab === "MUTUAL" ? t("No matches yet") : tab === "INTERESTED" ? t("Nobody yet") : t("No visitors yet")}</h2>
                  <p className="mt-2 text-sm text-velora-textSecondary">{t("A photo, your desires and a plan for tonight get you noticed faster.")}</p>
                  <div className="mt-4 flex justify-center gap-4 text-sm font-semibold"><Link href="/people" className="text-velora-accent underline">{t("Find people")}</Link><Link href="/tonight/new" className="text-velora-accent underline">{t("Post a plan")}</Link></div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
