import React from "react";

// Intimo logo — "The overlap". Two rings (two people); only the overlap is lit:
// chemistry where both say yes. Generated from Plus Jakarta Sans ExtraBold outlines,
// so it never depends on a loaded font. See docs/brand/BRAND.md before changing.
// Colours follow the theme: rings and letters use currentColor, the lit parts use --accent.

const RINGS_VIEWBOX = "-4.0 9.7 161.7 107.1";
const FULL_VIEWBOX = "-5.0 8 480.0 110";
const WORD_VIEWBOX = "181.1 16 294.9 85";
const WORDMARK = "M202.5 100L187.5 100L187.5 45.4L202.5 45.4M223.9 100L208.9 100L208.9 45.4L222.9 45.4L222.9 52Q224.8 48.5 228.3 46.5Q232.5 44.2 238.2 44.2Q244.4 44.2 249 46.8Q253.7 49.4 256.3 54Q258.9 58.7 258.9 64.9L258.9 100L243.9 100L243.9 68.1Q243.9 64.9 242.6 62.6Q241.4 60.3 239.1 59Q236.9 57.7 233.9 57.7Q231 57.7 228.7 59Q226.4 60.3 225.1 62.6Q223.9 64.9 223.9 68.1M291.6 100.6Q281.7 100.6 276.2 95.3Q270.8 89.9 270.8 80.3L270.8 58.4L261.6 58.4L261.6 45.4L262.1 45.4Q266.3 45.4 268.5 43.3Q270.8 41.2 270.8 37L270.8 33L285.8 33L285.8 45.4L298.6 45.4L298.6 58.4L285.8 58.4L285.8 79.3Q285.8 82.1 286.8 84Q287.8 85.8 289.9 86.7Q292 87.6 295.1 87.6Q295.8 87.6 296.7 87.5Q297.6 87.4 298.6 87.3L298.6 100Q297.1 100.2 295.2 100.4Q293.3 100.6 291.6 100.6M317.8 100L302.8 100L302.8 45.4L317.8 45.4M339.2 100L324.2 100L324.2 45.4L338.2 45.4L338.2 52Q339.7 49 342.5 47.2Q347.1 44.2 353.5 44.2Q360.3 44.2 365.5 47.6Q368.5 49.7 370.1 52.5Q372.3 49.3 375.3 47.4Q380.3 44.2 387 44.2Q392.9 44.2 397.4 46.8Q402 49.4 404.6 54Q407.2 58.7 407.2 64.9L407.2 100L392.2 100L392.2 68.1Q392.2 64.9 391 62.6Q389.9 60.3 387.8 59Q385.7 57.7 382.7 57.7Q379.8 57.7 377.6 59Q375.5 60.3 374.3 62.6Q373.2 64.9 373.2 68.1L373.2 100L358.2 100L358.2 68.1Q358.2 64.9 357 62.6Q355.9 60.3 353.8 59Q351.7 57.7 348.7 57.7Q345.8 57.7 343.6 59Q341.5 60.3 340.3 62.6Q339.2 64.9 339.2 68.1M440.7 101.2Q432.6 101.2 425.9 97.5Q419.3 93.8 415.3 87.3Q411.4 80.9 411.4 72.7Q411.4 64.4 415.3 58Q419.3 51.6 425.9 47.9Q432.6 44.2 440.7 44.2Q448.8 44.2 455.4 47.9Q462 51.6 465.9 58Q469.9 64.4 469.9 72.7Q469.9 80.9 465.9 87.3Q462 93.8 455.4 97.5Q448.8 101.2 440.7 101.2M440.7 87.7Q444.8 87.7 447.8 85.8Q450.9 83.9 452.6 80.5Q454.4 77.1 454.4 72.7Q454.4 68.3 452.6 64.9Q450.9 61.6 447.8 59.6Q444.8 57.7 440.7 57.7Q436.6 57.7 433.5 59.6Q430.4 61.6 428.6 64.9Q426.9 68.3 426.9 72.7Q426.9 77.1 428.6 80.5Q430.4 83.9 433.5 85.8Q436.6 87.7 440.7 87.7";

function Rings({ id }: { id: string }) {
  return (
    <>
      <defs><clipPath id={id}><circle cx="49.6" cy="63.3" r="49.6" /></clipPath></defs>
      <circle cx="104.2" cy="63.3" r="49.6" fill="rgb(var(--accent))" clipPath={`url(#${id})`} />
      <circle cx="49.6" cy="63.3" r="45.6" fill="none" stroke="currentColor" strokeWidth="7.9" />
      <circle cx="104.2" cy="63.3" r="45.6" fill="none" stroke="currentColor" strokeWidth="7.9" />
    </>
  );
}

function Wordmark() {
  return (
    <>
      <path d={WORDMARK} fill="currentColor" />
      <circle cx="195.0" cy="25.5" r="8.3" fill="rgb(var(--accent))" />
      <circle cx="310.3" cy="25.5" r="8.3" fill="currentColor" />
    </>
  );
}

/**
 * The Intimo logo. variant: "full" (rings + wordmark, default), "symbol" (rings only),
 * "wordmark" (letters only). Size it with a height class, e.g. className="h-8 w-auto".
 */
export function Logo({ variant = "full", className = "h-8 w-auto", title = "Intimo" }: { variant?: "full" | "symbol" | "wordmark"; className?: string; title?: string }) {
  const id = React.useId().replace(/:/g, "");
  const viewBox = variant === "symbol" ? RINGS_VIEWBOX : variant === "wordmark" ? WORD_VIEWBOX : FULL_VIEWBOX;
  return (
    <svg viewBox={viewBox} className={className} role="img" aria-label={title} xmlns="http://www.w3.org/2000/svg">
      {variant !== "wordmark" && <Rings id={`intimo-overlap-${id}`} />}
      {variant !== "symbol" && <Wordmark />}
    </svg>
  );
}
