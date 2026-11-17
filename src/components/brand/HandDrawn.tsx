import { useId, type ReactNode } from "react";
import { clsx as cn } from "clsx";

/**
 * "Human, not perfect" (docs/brand/BRAND.md §4): lines that wobble and paper with rough edges.
 * Pure SVG, decorative, coloured by theme tokens.
 */

/** SVG ids from useId contain ":", which breaks url(#…) references in some browsers. */
export function useSvgId(prefix: string) {
  return `${prefix}${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

/** A filter that makes a crisp vector line look drawn by hand: a slight wobble and a dry-ink edge. */
export function WobbleFilter({ id, scale = 2.5 }: { id: string; scale?: number }) {
  return (
    <filter id={id} x="-6%" y="-6%" width="112%" height="112%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="4" result="w" />
      <feDisplacementMap in="SourceGraphic" in2="w" scale={scale} xChannelSelector="R" yChannelSelector="G" result="d" />
      <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="9" result="g" />
      <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.7 1.25" result="ga" />
      <feComposite in="d" in2="ga" operator="in" />
    </filter>
  );
}

/** The hand-drawn stroke under a headline. Ember by default: it is part of the view's one warm moment. */
export function HandUnderline({ className }: { className?: string }) {
  const id = useSvgId("hu");
  return (
    <svg viewBox="0 0 200 12" aria-hidden className={cn("block h-3 w-[220px] overflow-visible stroke-velora-warm", className)}>
      <defs><WobbleFilter id={id} /></defs>
      <path filter={`url(#${id})`} d="M 2 8 C 40 3, 80 11, 120 6 C 150 3, 180 9, 198 5" fill="none" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

/** A sheet of paper with rough, torn-looking edges. Content inside is set in print ink. */
export function PaperCard({ children, className }: { children: ReactNode; className?: string }) {
  const id = useSvgId("pc");
  return (
    <div className={cn("relative px-6 py-8 text-velora-printInk sm:px-8 sm:py-9", className)}>
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
        <filter id={id} x="-3%" y="-3%" width="106%" height="106%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <rect x="1.5%" y="1%" width="97%" height="98%" className="fill-velora-cream" filter={`url(#${id})`} />
      </svg>
      <div className="relative">{children}</div>
    </div>
  );
}
