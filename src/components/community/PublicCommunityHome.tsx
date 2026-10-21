import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PrimaryAction } from "@/components/editorial/Editorial";
import { editorialPhotos, type EditorialPhotoId } from "@/lib/editorialPhotos";

const CONNECTIONS = [
  { photo: "balcony-connection", title: "Just chemistry.", body: "A casual connection. Clear intentions." },
  { photo: "latex-style", title: "Something kinky.", body: "Shared turn-ons. Respected limits." },
  { photo: "shared-chemistry", title: "Explore together.", body: "Couples, singles, and room for curiosity." },
] as const;

// Presentation-only examples: no member IDs, profile links, activity or messaging.
const EXAMPLE_PROFILES = [
  { name: "Alex, 32", photo: "roleplay", bio: "Good conversation. Strong chemistry. No guessing games.", interests: ["Friends with benefits", "Dating"] },
  { name: "Nina, 35", photo: "latex-style", bio: "I know what I like. Curious about what we might have in common.", interests: ["Kink curious", "Connection first"] },
  { name: "Eva & Sam, 34 & 36", photo: "club-chemistry", bio: "Exploring together. A drink and an honest conversation to start.", interests: ["Couples", "Exploring"] },
] as const;

function LandingPhoto({ photo, hero = false }: { photo: EditorialPhotoId; hero?: boolean }) {
  const image = editorialPhotos[photo];
  return <Image src={image.src} alt={image.alt} width={image.width} height={image.height} priority={hero} sizes={hero ? "(min-width: 1024px) 600px, 100vw" : "(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"} className={hero ? "h-full min-h-72 w-full object-cover lg:min-h-[32rem]" : "aspect-[4/3] w-full object-cover"} />;
}

export function PublicCommunityHome() {
  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <section className="grid items-center gap-8 pb-12 pt-10 lg:grid-cols-2 lg:gap-12 lg:py-16" aria-labelledby="community-welcome">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-velora-accent">Prague · Sex-positive · 18+</p>
          <h1 id="community-welcome" className="mt-5 font-display text-[clamp(3rem,6.5vw,6rem)] leading-[1.02] tracking-tight">Kinky. Curious.<br /><span className="text-velora-accent">Looking for someone?</span></h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-velora-ink2">Sex, dates, friends with benefits, or someone who shares your kink. Meet adults in Prague who can say what they want.</p>
          <div className="mt-7"><PrimaryAction href="/register">Join the founding members <ArrowUpRight className="h-5 w-5 shrink-0" aria-hidden /></PrimaryAction></div>
          <p className="mt-4 text-sm leading-relaxed text-velora-muted">18+ · Free to join · Your boundaries, respected.</p>
          <a href="#connections" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-velora-accent underline-offset-4 hover:underline">Take a look ↓</a>
        </div>
        <div className="overflow-hidden rounded-xl border border-velora-line"><LandingPhoto photo="balcony-connection" hero /></div>
      </section>

      <section id="connections" className="scroll-mt-24 py-10" aria-labelledby="connections-title">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-velora-accent">Your kind of connection</p>
        <h2 id="connections-title" className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">What brings you here?</h2>
        <div className="mt-7 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {CONNECTIONS.map(({ photo, title, body }) => (
            <article key={title}>
              <div className="overflow-hidden rounded-xl border border-velora-line"><LandingPhoto photo={photo} /></div>
              <h3 className="mt-4 text-2xl font-bold tracking-tight">{title}</h3>
              <p className="mt-2 text-base leading-relaxed text-velora-ink2">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 border-t border-velora-line py-12" aria-labelledby="example-profiles-title">
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
