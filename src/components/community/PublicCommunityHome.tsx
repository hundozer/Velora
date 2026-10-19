"use client";

import React from "react";
import Link from "next/link";
import { ScenePreview } from "@/components/scene/ScenePreview";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { BadgeCheck, EyeOff, Lock, Mail, MapPin, ShieldCheck } from "lucide-react";
import { ContextualCTA, EditorialHero, NumberedChapter, OversizedChoiceCard, PrimaryAction, SecondaryAction, SectionTitle, Showcase, StorySection } from "@/components/editorial/Editorial";
import { MemberActivityFeed } from "@/components/community/MemberActivityFeed";

interface PublicProfile {
  id: string;
  displayName: string;
  age?: number;
  location?: string;
  headline?: string;
  bio?: string;
  profileType: "COUPLE" | "INDIVIDUAL";
  verified: boolean;
  recentlyActive: boolean;
  isDemo: boolean;
}
interface PublicDatingAd {
  id: string;
  authorId: string;
  authorName: string;
  verified: boolean;
  title: string;
  category: string;
  location?: string;
  ageRange: string;
}

interface CommunityResponse {
  profiles: PublicProfile[];
  datingAds: PublicDatingAd[];
  pagination: { total: number };
  demoContentPresent: boolean;
}

function Initials({ name }: { name: string }) {
  const initials = name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-velora-accent/10 font-display text-xl text-velora-accent">
      {initials || "I"}
    </div>
  );
}

export function PublicCommunityHome() {
  const { user, isAuthLoading } = useAuth();
  const [data, setData] = React.useState<CommunityResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const controller = new AbortController();
    fetch("/api/public/community?limit=8", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Community unavailable");
        return response.json();
      })
      .then(setData)
      .catch((cause) => {
        if (cause.name !== "AbortError") {
          setData(null);
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  if (isAuthLoading) return <div className="min-h-screen" />;
  if (user) return <MemberActivityFeed />;

  return (
    <div>
      <EditorialHero
        eyebrow="Prague · 18+ · Members only"
        title={<>Find your people.<br /><em className="text-velora-accent">Openly, privately.</em></>}
        lead="A private network for singles and couples in Prague who know what they want — and say so."
        actions={<><PrimaryAction href="/auth/login?screen_hint=signup">Join free</PrimaryAction><SecondaryAction href="#how">See how it works</SecondaryAction></>}
        note="Free · No exact locations · Leave anytime"
        media={
          <div className="relative aspect-[4/5] overflow-hidden rounded-card shadow-card sm:aspect-[5/4] lg:aspect-[4/5]">
            <Image src="/marketing/intimo-community-hero.jpg" alt="Adults talking over drinks in a candle-lit Prague bar" fill priority sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" style={{ objectPosition: "72% center" }} />
            <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-velora-surface/95 p-4 shadow-card backdrop-blur sm:inset-x-6 sm:bottom-6 sm:p-5">
              <p className="mb-1 text-xs text-velora-muted">Illustration · not a live member plan</p>
              <p className="text-sm font-semibold text-velora-ink">An example of a Tonight plan</p>
              <p className="mt-1 text-sm text-velora-ink2">“Drinks tonight, see where it goes.”</p>
            </div>
          </div>
        }
      />

      <StorySection tone="sunken" id="journeys">
        <SectionTitle eyebrow="Two ways in" title={<>Meet someone,<br />or go out tonight.</>} />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <OversizedChoiceCard href="/people" eyebrow="People" title="Meet people who want what you want" body="Profiles show desires and limits up front, so the first message is never a guess." cta="Browse people" visual={<PeopleDemo />} />
          <OversizedChoiceCard href="/tonight" eyebrow="Tonight" title="See who's out tonight" body="Post a plan for tonight or the weekend. It disappears on its own." cta="See tonight's plans" visual={<PlanDemo />} />
        </div>
      </StorySection>

      <StorySection id="how">
        <SectionTitle eyebrow="How it works" title="Four steps. No guesswork." />
        <NumberedChapter index={1} total={4} title="Say what you're into." body="Love it, curious, or a hard limit. Members see what you share — nothing more." visual={<Showcase><DesireDemo /></Showcase>} />
        <NumberedChapter index={2} total={4} reverse title="Set your boundaries." body="Not just shown — enforced. If you only want first messages from couples, that's all you get." visual={<Showcase><BoundaryDemo /></Showcase>} />
        <NumberedChapter index={3} total={4} title="Meet tonight, or whenever." body="Plans expire by themselves. Reply only if the plan is meant for you." visual={<Showcase><PlanDemo /></Showcase>} />
        <NumberedChapter index={4} total={4} reverse title="Share privately." body="Private photos open only for people you approve — once, or until you say stop." visual={<Showcase><PrivateDemo /></Showcase>} />
      </StorySection>

      <StorySection tone="sunken">
        <SectionTitle eyebrow="Discreet by design" title={<>Your privacy is<br />the default.</>} />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            [MapPin, "Area, never position", "Members see your chosen district, never a precise position."],
            [EyeOff, "Members only", "Profiles and photos stay behind sign-in unless you choose otherwise."],
            [Mail, "Quiet emails", "Notifications never contain names, photos or messages."],
          ].map(([Icon, title, body]) => {
            const I = Icon as typeof MapPin;
            return (
              <div key={title as string} className="rounded-card border border-velora-line bg-velora-surface p-8 sm:p-10">
                <I className="h-7 w-7 text-velora-accent" aria-hidden />
                <h3 className="mt-6 font-display text-3xl text-velora-ink">{title as string}</h3>
                <p className="mt-3 text-base leading-relaxed text-velora-ink2">{body as string}</p>
              </div>
            );
          })}
        </div>
      </StorySection>

      <div className="mx-auto max-w-7xl space-y-16 px-5 py-16 sm:px-8">
        {data?.demoContentPresent && <div role="status" className="rounded-2xl bg-sky-100 px-5 py-4 text-sm text-sky-900"><strong>Staging demo content:</strong> profiles labeled Demo are fictional test records.</div>}
        <ScenePreview />
        {Boolean(data?.profiles.length) && !loading && (
          <section aria-labelledby="new-members">
            <div className="mb-8 flex items-end justify-between gap-4">
              <h2 id="new-members" className="font-display text-4xl text-velora-ink sm:text-5xl">New this week</h2>
              <Link href="/people" className="text-base font-semibold text-velora-accent">View all</Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {data!.profiles.slice(0, 4).map((profile) => (
                <Link key={profile.id} href={`/profile/${profile.id}`} className="rounded-card border border-velora-line bg-velora-surface p-7 transition hover:-translate-y-0.5 hover:border-velora-accent/40">
                  <div className="flex items-center gap-3"><Initials name={profile.displayName} /><div className="min-w-0"><p className="flex items-center gap-1.5 truncate text-lg font-semibold text-velora-ink">{profile.displayName}{profile.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-700" aria-label="Verified" />}</p><p className="text-sm text-velora-muted">{profile.profileType === "COUPLE" ? "Couple" : "Individual"}{profile.age ? ` · ${profile.age}` : ""}</p></div></div>
                  <p className="mt-5 line-clamp-2 text-base text-velora-ink2">{profile.headline || profile.bio || "New to Intimo."}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
        <ContextualCTA title="Ready when you are." body="Two minutes to join. You decide what anyone sees." action={<a href="/auth/login?screen_hint=signup" className="inline-flex min-h-14 items-center rounded-full bg-velora-paper px-9 text-base font-semibold text-velora-ink transition hover:bg-velora-surface">Join free</a>} />
        <nav aria-label="Explore" className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-base text-velora-ink2">
          <Link href="/people" className="hover:text-velora-ink">People</Link><Link href="/tonight" className="hover:text-velora-ink">Tonight</Link><Link href="/photos" className="hover:text-velora-ink">Photos</Link><Link href="/videos" className="hover:text-velora-ink">Videos</Link><Link href="/scene" className="hover:text-velora-ink">Prague Scene</Link>
        </nav>
      </div>
    </div>
  );
}

/* Visual demonstrations: show the feature, don't describe it. Static, illustrative content. */

function Chip({ children, tone }: { children: React.ReactNode; tone: "love" | "curious" | "limit" | "plain" }) {
  const tones = { love: "bg-velora-accent text-velora-paper", curious: "border border-velora-accent/40 text-velora-accent", limit: "bg-velora-ink text-velora-paper", plain: "border border-velora-line text-velora-ink2" };
  return <span className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${tones[tone]}`}>{children}</span>;
}

function DesireDemo() {
  return (
    <div className="space-y-5" aria-hidden>
      <div><p className="mb-3 text-sm text-velora-muted">Love it</p><div className="flex flex-wrap gap-2"><Chip tone="love">Sensual massage</Chip><Chip tone="love">Slow burn</Chip></div></div>
      <div><p className="mb-3 text-sm text-velora-muted">Curious</p><div className="flex flex-wrap gap-2"><Chip tone="curious">Couples</Chip><Chip tone="curious">Parties</Chip></div></div>
      <div><p className="mb-3 text-sm text-velora-muted">Hard limit</p><div className="flex flex-wrap gap-2"><Chip tone="limit">Pain play</Chip></div></div>
    </div>
  );
}

function BoundaryDemo() {
  return (
    <div className="space-y-3" aria-hidden>
      {[["First messages from men", "Not interested"], ["First messages from couples", "Welcome"], ["Explicit photos in chat", "Not interested"]].map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-4 rounded-2xl border border-velora-line px-5 py-4"><span className="text-base text-velora-ink">{label}</span><span className="shrink-0 text-sm font-semibold text-velora-accent">{value}</span></div>
      ))}
      <p className="flex items-center gap-2 pt-2 text-sm text-velora-muted"><ShieldCheck className="h-4 w-4 text-velora-accent" />Enforced before a message is sent</p>
    </div>
  );
}

function PlanDemo() {
  return (
    <div className="rounded-2xl border border-velora-line bg-velora-surface p-6" aria-label="Example plan, not a live listing">
      <div className="flex items-center justify-between text-sm"><span className="font-semibold text-velora-accent">Drinks &amp; a date</span><span className="text-velora-muted">Example plan</span></div>
      <p className="mt-3 font-display text-3xl leading-tight text-velora-ink">Wine in Vinohrady, then see where it goes</p>
      <div className="mt-5 flex items-center justify-between"><span className="text-sm text-velora-ink2">Nina &amp; Tom · Praha 2</span><span className="rounded-full bg-velora-accent px-4 py-2 text-sm font-semibold text-velora-paper">Reply</span></div>
    </div>
  );
}

function PeopleDemo() {
  return (
    <div className="flex gap-3" aria-label="Illustrative profiles, not real members">
      {[["Lena", "29 · Praha 7", "Example profile"], ["Marek & Eva", "Couple · Praha 2", "Example profile"]].map(([name, meta, presence]) => (
        <div key={name} className="flex-1 rounded-2xl border border-velora-line bg-velora-surface p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-velora-accent/10 font-display text-xl text-velora-accent">{name[0]}</div>
          <p className="mt-4 text-base font-semibold text-velora-ink">{name}</p>
          <p className="text-sm text-velora-muted">{meta}</p>
          <p className="mt-3 text-xs font-semibold text-emerald-700">{presence}</p>
        </div>
      ))}
    </div>
  );
}

function PrivateDemo() {
  return (
    <div aria-label="Example private photo request">
      <p className="mb-3 text-sm text-velora-muted">Example request</p>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((item) => <div key={item} className="flex aspect-square items-center justify-center rounded-2xl bg-gradient-to-br from-velora-blush to-velora-sunken"><Lock className="h-6 w-6 text-velora-accent/60" /></div>)}
      </div>
      <div className="mt-5 flex items-center justify-between rounded-2xl border border-velora-line px-5 py-4"><span className="text-base text-velora-ink">Lena asked to see your photos</span><span className="shrink-0 rounded-full bg-velora-accent px-4 py-2 text-sm font-semibold text-velora-paper">Allow once</span></div>
    </div>
  );
}
