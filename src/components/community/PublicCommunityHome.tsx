import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, LockKeyhole } from "lucide-react";
import { PrimaryAction } from "@/components/editorial/Editorial";
import { editorialPhotos, type EditorialPhotoId } from "@/lib/editorialPhotos";

// Presentation-only examples: no member IDs, profile links, activity or messaging.
const EXAMPLE_PROFILES = [
  { name: "Alex, 32", photo: "roleplay", bio: "Good conversation. Strong chemistry. No guessing games.", interests: ["Friends with benefits", "Dating"] },
  { name: "Nina, 35", photo: "latex-style", bio: "I know what I like. Curious about what we might have in common.", interests: ["Kink curious", "Connection first"] },
  { name: "Eva & Sam, 34 & 36", photo: "club-chemistry", bio: "Exploring together. A drink and an honest conversation to start.", interests: ["Couples", "Exploring"] },
] as const;

function LandingPhoto({ photo, hero = false, className = "" }: { photo: EditorialPhotoId; hero?: boolean; className?: string }) {
  const image = editorialPhotos[photo];
  return <Image src={image.src} alt={image.alt} width={image.width} height={image.height} priority={hero} sizes={hero ? "(min-width: 1024px) 600px, 100vw" : "(min-width: 1024px) 560px, (min-width: 640px) 50vw, 100vw"} className={`${hero ? "h-full min-h-72 w-full object-cover lg:min-h-[32rem]" : "aspect-[4/3] w-full object-cover"} ${className}`} />;
}

function ExploreLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-velora-accent underline decoration-velora-accent/50 underline-offset-4 hover:decoration-velora-accent">{children}<ArrowUpRight className="h-4 w-4" aria-hidden /></Link>;
}

export function PublicCommunityHome() {
  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <section className="grid items-center gap-8 pb-12 pt-10 lg:grid-cols-2 lg:gap-12 lg:py-16" aria-labelledby="community-welcome">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-velora-accent">Prague · Sex-positive · 18+</p>
          <h1 id="community-welcome" className="mt-5 font-display text-[clamp(3rem,6.5vw,6rem)] leading-[1.02] tracking-tight">Kinky. Curious.<br /><span className="text-velora-accent">Looking for someone?</span></h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-velora-ink2">Sex, dates, friends with benefits, or someone who shares your kink. Find your people, make a plan, and say what you want without guessing games.</p>
          <div className="mt-7"><PrimaryAction href="/register">Join the founding members <ArrowUpRight className="h-5 w-5 shrink-0" aria-hidden /></PrimaryAction></div>
          <p className="mt-4 text-sm leading-relaxed text-velora-muted">18+ · Free to join · Your boundaries, respected.</p>
          <a href="#inside" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-velora-accent underline-offset-4 hover:underline">See what happens inside ↓</a>
        </div>
        <div className="overflow-hidden rounded-xl border border-velora-line"><LandingPhoto photo="balcony-connection" hero /></div>
      </section>

      <nav aria-label="Explore what Intimo does" className="flex flex-wrap gap-2 border-y border-velora-line py-5 text-sm font-semibold">
        {[["Meet people", "#people"], ["Make tonight happen", "#tonight"], ["Share a story", "#stories"], ["Keep photos private", "#private"], ["Find your scene", "#scene"]].map(([label, href]) => <a key={href} href={href} className="inline-flex min-h-11 items-center rounded-full border border-velora-control px-4 text-velora-ink hover:border-velora-accent hover:text-velora-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-velora-accent">{label}</a>)}
      </nav>

      <section id="inside" className="scroll-mt-24 border-t border-velora-line py-14 sm:py-20" aria-labelledby="inside-title">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-velora-accent">More than a profile and a prayer</p>
        <h2 id="inside-title" className="mt-3 max-w-3xl font-display text-[clamp(2.6rem,5vw,4.75rem)] leading-[1.05]">Find the spark. Then do something about it.</h2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-velora-ink2">Intimo is for the first hello, the honest conversation, and whatever you both decide comes next. Here&apos;s what you can actually do.</p>
      </section>

      <section id="people" className="scroll-mt-24 grid overflow-hidden rounded-2xl border border-velora-line bg-velora-surface lg:grid-cols-2" aria-labelledby="people-title">
        <div className="relative min-h-80 overflow-hidden lg:min-h-[32rem]"><LandingPhoto photo="shared-chemistry" className="absolute inset-0 h-full" /></div>
        <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-velora-accent">01 / People</p>
          <h2 id="people-title" className="mt-4 font-display text-4xl leading-tight sm:text-5xl">Meet people who mean what they say.</h2>
          <p className="mt-5 leading-relaxed text-velora-ink2">Browse people in Prague, filter for who you want to meet, and open a profile that goes beyond a face. Put your desires and boundaries in your own words. A first message starts with an actual person, not a swipe.</p>
          <div className="mt-6 flex flex-wrap gap-2" aria-label="Ways to discover people"><span className="rounded-full border border-velora-control px-4 py-2 text-sm">Who I want to meet</span><span className="rounded-full border border-velora-control px-4 py-2 text-sm">Shared interests</span><span className="rounded-full border border-velora-control px-4 py-2 text-sm">Prague area</span></div>
          <ExploreLink href="/people">Explore People</ExploreLink>
        </div>
      </section>

      <section id="tonight" className="mt-8 scroll-mt-24 grid gap-8 overflow-hidden rounded-2xl bg-velora-night p-7 text-velora-onPhoto sm:p-10 lg:grid-cols-2 lg:items-center lg:p-14" aria-labelledby="tonight-title">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-velora-copperLight">02 / Tonight</p><h2 id="tonight-title" className="mt-4 font-display text-4xl leading-tight sm:text-5xl">“Anyone up for tonight?”<br />Now there&apos;s a place to ask.</h2><p className="mt-5 max-w-lg leading-relaxed text-velora-onPhoto/85">Post a plan with a start and end time. Say what you&apos;re in the mood for and who can reply. See other plans and their reply rules before making a move.</p><Link href="/tonight" className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-velora-onPhoto underline underline-offset-4">See Tonight <ArrowUpRight className="h-4 w-4" aria-hidden /></Link></div>
        <div className="relative min-h-80 overflow-hidden rounded-xl border border-velora-onPhoto/20"><div className="absolute inset-0"><LandingPhoto photo="club-chemistry" /></div><div className="absolute inset-0 bg-gradient-to-t from-velora-night via-velora-night/30 to-transparent" /><div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8"><p className="font-display text-6xl text-velora-copperLight">Tonight</p><p className="mt-2 max-w-sm text-sm text-velora-onPhoto/90">A plan has a time, a place to start the conversation, and a choice to reply.</p></div></div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section id="stories" className="scroll-mt-24 overflow-hidden rounded-2xl border border-velora-line bg-velora-surface" aria-labelledby="stories-title"><div className="relative h-64 overflow-hidden"><div className="absolute inset-0"><LandingPhoto photo="roleplay" /></div><div className="absolute inset-0 bg-gradient-to-t from-velora-night/60 to-transparent" /><div className="absolute bottom-5 left-6 flex items-center gap-3 text-velora-onPhoto"><span className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-velora-copperLight bg-velora-night/60 font-display text-3xl" aria-hidden>✦</span><span className="text-sm font-semibold">The aura means there&apos;s a story</span></div></div><div className="p-7 sm:p-9"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-velora-accent">03 / Stories</p><h2 id="stories-title" className="mt-3 font-display text-4xl">A glimpse beyond the bio.</h2><p className="mt-4 leading-relaxed text-velora-ink2">Share a moment for 24 hours. When someone has a story, an aura around their photo lets you know there&apos;s more to see.</p><ExploreLink href="/stories">See Stories</ExploreLink></div></section>
        <section id="private" className="scroll-mt-24 overflow-hidden rounded-2xl border border-velora-line bg-velora-surface" aria-labelledby="private-title"><div className="relative h-64 overflow-hidden"><div className="absolute inset-0"><LandingPhoto photo="satin-and-lace" /></div><div className="absolute bottom-5 left-6 flex items-center gap-3 rounded-full bg-velora-night/90 px-4 py-3 text-sm font-semibold text-velora-onPhoto"><LockKeyhole className="h-5 w-5" aria-hidden />Your photos. Your call.</div></div><div className="p-7 sm:p-9"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-velora-accent">04 / Private albums</p><h2 id="private-title" className="mt-3 font-display text-4xl">Show more when you choose to.</h2><p className="mt-4 leading-relaxed text-velora-ink2">Keep an album private. Someone can request access; you decide whether to grant it and can revoke it later. Say what&apos;s off limits, block, or report when you need to.</p><ExploreLink href="/register">Make your profile</ExploreLink></div></section>
      </div>

      <section id="scene" className="mt-8 scroll-mt-24 grid overflow-hidden rounded-2xl border border-velora-line bg-velora-surface lg:grid-cols-2" aria-labelledby="scene-title"><div className="p-7 sm:p-10 lg:p-14"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-velora-accent">05 / Out in Prague</p><h2 id="scene-title" className="mt-4 font-display text-4xl leading-tight sm:text-5xl">The city is part of the story.</h2><p className="mt-5 leading-relaxed text-velora-ink2">Browse published events in the Prague Scene, or look for a small Guest List gathering when a host has confirmed one. For a Guest List, you send a private note; the host decides, and only accepted guests receive the address.</p><div className="flex flex-wrap gap-x-6"><ExploreLink href="/scene">Explore Prague Scene</ExploreLink><ExploreLink href="/guest-list">See the Guest List</ExploreLink></div><p className="mt-4 text-sm text-velora-muted">Guest Lists appear only when a real gathering is confirmed.</p></div><div className="relative min-h-72 overflow-hidden"><LandingPhoto photo="balcony-connection" className="absolute inset-0 h-full" /></div></section>

      <section className="mt-14 border-t border-velora-line py-12" aria-labelledby="example-profiles-title">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-velora-accent">A look inside</p>
        <h2 id="example-profiles-title" className="mt-3 font-display text-4xl leading-tight tracking-tight sm:text-5xl">More than a face.<br />Something to go on.</h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-velora-ink2">A preview of how profiles work. These are fictional examples, not members.</p>
        <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {EXAMPLE_PROFILES.map(({ name, photo, bio, interests }) => (
            <article key={name} aria-label={`Example profile: ${name}`} className="overflow-hidden rounded-xl border border-velora-line bg-velora-surface">
              <div className="relative">
                <LandingPhoto photo={photo} />
              </div>
              <div className="p-5">
                <h3 className="text-xl font-bold tracking-tight">{name}</h3>
                <p className="mt-1 text-sm text-velora-muted">Prague</p>
                <p className="my-4 text-base leading-relaxed text-velora-ink2">{bio}</p>
                <ul className="flex flex-wrap gap-2" aria-label="Example interests">
                  {interests.map((interest) => <li key={interest} className="rounded-full border border-velora-control px-3 py-2 text-sm text-velora-ink">{interest}</li>)}
                </ul>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-6 text-sm leading-relaxed text-velora-muted">Say what turns you on. Say what&apos;s off limits. Singles, couples, queer and kink-curious adults are welcome.</p>
      </section>

      <section className="flex flex-col items-start justify-between gap-7 border-t border-velora-line py-12 lg:flex-row lg:items-center" aria-labelledby="founding-members-title">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-velora-accent">Let&apos;s start something</p>
          <h2 id="founding-members-title" className="mt-3 font-display text-4xl leading-tight tracking-tight sm:text-5xl">Be part of the first<br />Prague crowd.</h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-velora-ink2">We&apos;re bringing the first members together. Join, build your profile, and help shape the community.</p>
        </div>
        <div><PrimaryAction href="/register">Create your profile <ArrowUpRight className="h-5 w-5 shrink-0" aria-hidden /></PrimaryAction><p className="mt-4 text-sm text-velora-muted">A little curiosity goes a long way.</p></div>
      </section>
      <nav aria-label="Explore" className="flex flex-wrap gap-x-6 gap-y-2 border-t border-velora-line py-6 text-sm text-velora-ink2">
        <Link href="/people" className="inline-flex min-h-11 items-center hover:text-velora-ink">People</Link>
        <Link href="/tonight" className="inline-flex min-h-11 items-center hover:text-velora-ink">Tonight</Link>
        <Link href="/photos" className="inline-flex min-h-11 items-center hover:text-velora-ink">Photos</Link>
        <Link href="/videos" className="inline-flex min-h-11 items-center hover:text-velora-ink">Videos</Link>
        <Link href="/scene" className="inline-flex min-h-11 items-center hover:text-velora-ink">Prague Scene</Link>
      </nav>
    </div>
  );
}
