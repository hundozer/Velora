import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Shared community design: oversized surfaces, bold sans-serif headlines,
// numbered chapters and one dominant action per block.

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.22em] text-velora-muted">{children}</p>;
}

/** Page-level opening: one big idea, one primary action. */
export function EditorialHero({ eyebrow, title, lead, actions, media, note }: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  lead?: React.ReactNode;
  actions?: React.ReactNode;
  media?: React.ReactNode;
  note?: React.ReactNode;
}) {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-24 lg:pt-16">
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="mt-5 font-display text-[3.4rem] leading-[0.95] text-velora-ink sm:text-7xl lg:text-[5.5rem]">{title}</h1>
        {lead && <p className="mt-6 max-w-xl text-lg leading-relaxed text-velora-ink2 sm:text-xl">{lead}</p>}
        {actions && <div className="mt-9 flex flex-col gap-3 sm:flex-row">{actions}</div>}
        {note && <p className="mt-5 text-sm text-velora-muted">{note}</p>}
      </div>
      {media && <div>{media}</div>}
    </section>
  );
}

/** A vertical rhythm block. tone="sunken" sets a soft band behind the story. */
export function StorySection({ id, tone = "paper", children, className = "" }: { id?: string; tone?: "paper" | "sunken" | "ink"; children: React.ReactNode; className?: string }) {
  const tones = { paper: "", sunken: "bg-velora-sunken/60", ink: "bg-velora-ink text-velora-paper" };
  return (
    <section id={id} className={`scroll-mt-20 ${tones[tone]} ${className}`}>
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-28">{children}</div>
    </section>
  );
}

export function SectionTitle({ eyebrow, title, lead }: { eyebrow?: React.ReactNode; title: React.ReactNode; lead?: React.ReactNode }) {
  return (
    <div className="max-w-3xl">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="mt-4 font-display text-5xl leading-[1.02] text-velora-ink sm:text-6xl">{title}</h2>
      {lead && <p className="mt-5 text-lg leading-relaxed text-velora-ink2">{lead}</p>}
    </div>
  );
}

/** "01 / 04" chapter: words on one side, a working visual on the other. */
export function NumberedChapter({ index, total, title, body, visual, action, reverse = false }: {
  index: number;
  total: number;
  title: React.ReactNode;
  body: React.ReactNode;
  visual: React.ReactNode;
  action?: React.ReactNode;
  reverse?: boolean;
}) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return (
    <div className="grid items-center gap-10 py-12 lg:grid-cols-2 lg:gap-20 lg:py-20">
      <div className={reverse ? "lg:order-2" : ""}>
        <p className="font-display text-2xl text-velora-muted" aria-label={`Chapter ${index} of ${total}`}><span className="text-velora-accent">{pad(index)}</span> / {pad(total)}</p>
        <h3 className="mt-4 font-display text-5xl leading-[1.02] text-velora-ink sm:text-6xl">{title}</h3>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-velora-ink2">{body}</p>
        {action && <div className="mt-7">{action}</div>}
      </div>
      <div className={reverse ? "lg:order-1" : ""}>{visual}</div>
    </div>
  );
}

/** Soft surface used for visual demonstrations. */
export function Showcase({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-card border border-velora-line bg-velora-surface p-6 shadow-card sm:p-10 ${className}`}>{children}</div>;
}

/** Large, fully clickable card for a main journey. */
export function OversizedChoiceCard({ href, eyebrow, title, body, visual, cta }: {
  href: string;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  body: React.ReactNode;
  visual?: React.ReactNode;
  cta: string;
}) {
  return (
    <Link href={href} className="group flex flex-col overflow-hidden rounded-card border border-velora-line bg-velora-surface shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-velora-accent/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-velora-accent">
      {visual && <div className="border-b border-velora-line bg-velora-sunken/50 p-6 sm:p-8">{visual}</div>}
      <div className="flex flex-1 flex-col p-7 sm:p-10">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h3 className="mt-3 font-display text-4xl leading-tight text-velora-ink sm:text-5xl">{title}</h3>
        <p className="mt-3 flex-1 text-lg leading-relaxed text-velora-ink2">{body}</p>
        <span className="mt-7 inline-flex items-center gap-2 text-base font-semibold text-velora-accent">{cta}<ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" aria-hidden /></span>
      </div>
    </Link>
  );
}

export function PrimaryAction({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-velora-accent px-8 text-base font-semibold text-velora-paper transition hover:bg-velora-accentHover">{children}</a>;
}

export function SecondaryAction({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-velora-ink/15 px-8 text-base font-semibold text-velora-ink transition hover:border-velora-ink/40">{children}</Link>;
}

/** Closing invitation at the end of a story. */
export function ContextualCTA({ title, body, action }: { title: React.ReactNode; body?: React.ReactNode; action: React.ReactNode }) {
  return (
    <div className="rounded-card bg-velora-accent px-7 py-14 text-center text-velora-paper sm:px-16 sm:py-20">
      <h2 className="mx-auto max-w-2xl font-display text-5xl leading-[1.02] sm:text-6xl">{title}</h2>
      {body && <p className="mx-auto mt-5 max-w-lg text-lg text-velora-paper/75">{body}</p>}
      <div className="mt-9 flex justify-center">{action}</div>
    </div>
  );
}

/** What a finished step looks like: calm, confirmed, one next action. */
export function CompletionState({ icon, title, body, action }: { icon?: React.ReactNode; title: React.ReactNode; body?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-5 py-16 text-center">
      {icon && <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-velora-accent/10 text-velora-accent">{icon}</div>}
      <h1 className="mt-6 font-display text-5xl leading-tight text-velora-ink">{title}</h1>
      {body && <p className="mt-4 text-lg text-velora-ink2">{body}</p>}
      {action && <div className="mt-9">{action}</div>}
    </div>
  );
}
