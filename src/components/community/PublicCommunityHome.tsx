"use client";

import React from "react";
import Link from "next/link";
import { ScenePreview } from "@/components/scene/ScenePreview";
import { useAuth } from "@/context/AuthContext";
import { ArrowUpRight, Asterisk, BadgeCheck, EyeOff, Lock, MapPin, ShieldCheck } from "lucide-react";
import { ContextualCTA, NumberedChapter, OversizedChoiceCard, PrimaryAction, SecondaryAction, SectionTitle, Showcase, StorySection } from "@/components/editorial/Editorial";
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
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-14 pt-10 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-20 lg:py-20" aria-labelledby="community-welcome">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-velora-muted">Prague · Sex-positive · 18+</p>
          <h1 id="community-welcome" className="mt-6 font-display text-[clamp(3.5rem,8vw,7rem)] leading-[0.98]">Kinky.<br />Curious.<br /><span className="text-velora-accent">Welcome.</span></h1>
          <p className="mt-7 max-w-lg text-lg leading-relaxed text-velora-ink2 sm:text-xl">Rope, roleplay, open relationships. Or something you haven&apos;t found the words for yet. Say what turns you on. Say what&apos;s off limits.</p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <PrimaryAction href="/register">Join Intimo <ArrowUpRight className="h-5 w-5" aria-hidden /></PrimaryAction>
            <p className="text-sm leading-relaxed text-velora-muted">18+. Free to join.<br />Curiosity is enough.</p>
          </div>
          <a href="#how" className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-velora-accent underline-offset-4 hover:underline">Take a look ↓</a>
        </div>
        <div className="mx-2 rounded-xl bg-velora-accent p-6 text-velora-paper sm:mx-4 sm:rotate-2 sm:p-8" aria-label="Everyone is welcome">
          <div className="flex items-center justify-between border-b border-velora-paper/40 pb-4"><p className="text-xs font-bold uppercase tracking-[0.15em]">Come as you are</p><Asterisk className="h-7 w-7" aria-hidden /></div>
          <div className="relative py-7 sm:py-9">
            <ul className="space-y-1 font-display text-[clamp(2rem,5vw,4rem)] leading-[1.1]"><li>Singles.</li><li>Couples.</li><li>Queer.</li><li>Kink-curious.</li><li className="italic">You.</li></ul>
            <p className="mt-6 inline-block -rotate-6 rounded-md bg-velora-paper px-5 py-4 text-xs font-bold uppercase leading-relaxed tracking-wider text-velora-ink sm:absolute sm:-right-5 sm:bottom-8 sm:mt-0">Ask first.<br />Respect always.</p>
          </div>
          <div className="flex items-center justify-between border-t border-velora-paper/40 pt-5"><p className="text-sm leading-relaxed">Your kink.<br />Your call.</p><ArrowUpRight className="h-9 w-9" aria-hidden /></div>
        </div>
      </section>
      <div className="border-y border-velora-line"><div className="mx-auto flex max-w-7xl flex-wrap gap-x-7 gap-y-3 px-5 py-6 text-sm text-velora-ink2 sm:px-8"><span>Rope.</span><span>Leather.</span><span>Power play.</span><span>Still figuring it out.</span><strong className="text-velora-accent">There&apos;s room for you.</strong></div></div>
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 md:grid-cols-3">
        {[["01", "Own your yes.", "Name your kinks. Leave room for curiosity."], ["02", "Mean your no.", "Hard limits do not need a defence."], ["03", "Ask first.", "Being here does not mean being up for everything."]].map(([number, title, body]) => <div key={number}><span className="text-xs font-semibold text-velora-accent">{number}</span><h2 className="mt-3 text-xl font-bold tracking-tight">{title}</h2><p className="mt-2 text-sm leading-relaxed text-velora-ink2">{body}</p></div>)}
      </div>

      <StorySection tone="sunken" id="journeys">
        <SectionTitle eyebrow="Who catches your eye?" title={<>A little chemistry.<br />See where it goes.</>} />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <OversizedChoiceCard href="/people" eyebrow="People" title="Someone to talk kink with." body="Read what they choose to share. Check their boundaries. Then say hello." cta="Browse people" visual={<PeopleDemo />} />
          <OversizedChoiceCard href="/tonight" eyebrow="Tonight" title="Got something in mind?" body="A drink, a date, a shared curiosity. Say what you want to do and who you want to hear from." cta="See tonight's plans" visual={<PlanDemo />} />
        </div>
      </StorySection>

      <StorySection id="how">
        <SectionTitle eyebrow="Desire has a few ground rules" title="Your yes. Your maybe. Your no." />
        <NumberedChapter index={1} total={4} title="Say the thing." body="The kink you love. The one you are curious about. The thing you will never do. Share as much or as little as you want." visual={<Showcase><DesireDemo /></Showcase>} />
        <NumberedChapter index={2} total={4} reverse title="Kink is not permission." body="Say who can approach you and how. First-message and photo-request limits apply before anything is sent." visual={<Showcase><BoundaryDemo /></Showcase>} />
        <NumberedChapter index={3} total={4} title="Fancy company tonight?" body="Say what you have in mind, when, and who you would like to hear from. Reply only if the invitation is meant for you." visual={<Showcase><PlanDemo /></Showcase>} />
        <NumberedChapter index={4} total={4} reverse title="Looking is by invitation." body="Choose who can open your private photos. Permission to look is not permission to copy or share." visual={<Showcase><PrivateDemo /></Showcase>} />
      </StorySection>

      <StorySection tone="sunken">
        <SectionTitle eyebrow="Some things stay yours" title={<>Your kink.<br />Your business.</>} />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            [MapPin, "A district, not your doorstep.", "Your chosen area is shown. Your exact location is not."],
            [EyeOff, "Choose your audience.", "Keep your profile and photos for members, or choose what to make public."],
            [ShieldCheck, "A no is a no.", "Ask before sending explicit photos. Respect a limit without bargaining."],
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
        {data?.demoContentPresent && <div role="status" className="rounded-2xl bg-velora-accent/10 px-5 py-4 text-sm text-velora-accent"><strong>Staging demo content:</strong> profiles labeled Demo are fictional test records.</div>}
        <ScenePreview />
        {Boolean(data?.profiles.length) && !loading && (
          <section aria-labelledby="new-members">
            <div className="mb-8 flex items-end justify-between gap-4">
              <h2 id="new-members" className="font-display text-4xl text-velora-ink sm:text-5xl">New around here</h2>
              <Link href="/people" className="text-base font-semibold text-velora-accent">View all</Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {data!.profiles.slice(0, 4).map((profile) => (
                <Link key={profile.id} href={`/profile/${profile.id}`} className="rounded-card border border-velora-line bg-velora-surface p-7 transition hover:-translate-y-0.5 hover:border-velora-accent/40">
                  <div className="flex items-center gap-3"><Initials name={profile.displayName} /><div className="min-w-0"><p className="flex items-center gap-1.5 truncate text-lg font-semibold text-velora-ink">{profile.displayName}{profile.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-velora-success" aria-label="Verified" />}</p><p className="text-sm text-velora-muted">{profile.profileType === "COUPLE" ? "Couple" : "Individual"}{profile.age ? ` · ${profile.age}` : ""}</p></div></div>
                  <p className="mt-5 line-clamp-2 text-base text-velora-ink2">{profile.headline || profile.bio || "New to Intimo."}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
        <ContextualCTA title="Curious? Come in." body="You do not need a label, a partner or a list of kinks to belong here." action={<a href="/auth/login?screen_hint=signup" className="inline-flex min-h-14 items-center rounded-full bg-velora-paper px-9 text-base font-semibold text-velora-ink transition hover:bg-velora-surface">Join Intimo</a>} />
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
      <div><p className="mb-3 text-sm text-velora-muted">Love it</p><div className="flex flex-wrap gap-2"><Chip tone="love">Rope</Chip><Chip tone="love">Slow burn</Chip></div></div>
      <div><p className="mb-3 text-sm text-velora-muted">Curious</p><div className="flex flex-wrap gap-2"><Chip tone="curious">Roleplay</Chip><Chip tone="curious">Parties</Chip></div></div>
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
      <p className="mt-3 font-display text-3xl leading-tight text-velora-ink">A drink in Vinohrady. Talk kink. See if we click.</p>
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
          <p className="mt-3 text-xs font-semibold text-velora-success">{presence}</p>
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
