import { useSvgId, WobbleFilter } from "@/components/brand/HandDrawn";

/**
 * "Read it twice" (docs/brand/BRAND.md §4): ink on paper, one cool and one warm note.
 * These sketches brief the illustrator; replace them with the final hand-drawn art when it arrives.
 */

const PROFILE = "M 60 20 C 95 22, 112 45, 115 70 C 117 82, 126 92, 138 104 C 141 107, 138 110, 130 111 C 133 116, 135 119, 128 122 C 135 126, 134 132, 126 134 C 124 146, 120 156, 108 162 C 96 168, 88 178, 86 230";
const LIPS = "M 130 111 C 133 116, 135 119, 128 122 C 135 126, 134 132, 126 134 C 122 126, 124 116, 130 111 Z";

function Saint({ hair, strands, eye = false }: { hair: string; strands: string; eye?: boolean }) {
  return (
    <g>
      <path d={`${PROFILE} L 20 230 C 18 200, 10 150, 8 86 C 6 44, 28 16, 60 20 Z`} className="fill-velora-cream" />
      <ellipse cx="100" cy="98" rx="11" ry="6" fill="#D9A3A0" opacity="0.75" />
      <g className="fill-none stroke-velora-printInk" strokeLinecap="round" strokeLinejoin="round">
        <path d={PROFILE} strokeWidth={2} />
        <path d="M 90 63 Q 100 58 111 63" strokeWidth={2.4} />
        <path d="M 92 74 Q 100 80 109 74" strokeWidth={1.8} />
        <path d="M 95 77 L 93 82 M 100 79 L 99 84 M 105 77 L 106 82" strokeWidth={1.2} />
      </g>
      <path d={hair} className="fill-velora-printInk" />
      <path d={strands} className="fill-none stroke-velora-cream" strokeWidth={0.9} strokeLinecap="round" opacity={0.6} />
      <path d={LIPS} className="fill-velora-warm" />
      {eye && <circle cx="88" cy="104" r="1.8" className="fill-velora-printInk" />}
    </g>
  );
}

/** Two saints in profile, eyes closed, almost kissing; their halos overlap like the logo's rings. */
export function SaintsIllustration({ label, className }: { label: string; className?: string }) {
  const wobble = useSvgId("sw");
  const halo = useSvgId("sh");
  return (
    <svg viewBox="0 0 300 260" role="img" aria-label={label} className={className}>
      <defs>
        <WobbleFilter id={wobble} />
        <clipPath id={halo}><circle cx="78" cy="88" r="84" /></clipPath>
      </defs>
      <g filter={`url(#${wobble})`}>
        <circle cx="222" cy="88" r="84" className="fill-velora-accent" clipPath={`url(#${halo})`} />
        <circle cx="78" cy="88" r="84" className="fill-none stroke-velora-printInk" strokeWidth={2} />
        <circle cx="222" cy="88" r="84" className="fill-none stroke-velora-printInk" strokeWidth={2} />
        <Saint
          hair="M 60 20 C 28 16, 6 44, 8 86 C 10 124, 26 146, 22 190 C 40 174, 52 142, 50 118 C 60 100, 70 60, 60 20 Z"
          strands="M 40 30 C 24 50, 20 90, 30 130 M 50 26 C 36 60, 34 100, 40 150 M 28 60 C 18 90, 22 130, 26 170"
        />
        <g transform="translate(300 0) scale(-1 1)">
          <Saint
            hair="M 60 20 C 30 14, 8 38, 10 78 C 12 104, 22 120, 40 126 C 50 112, 54 92, 52 72 C 60 52, 68 34, 60 20 Z"
            strands="M 42 28 C 26 46, 22 76, 28 108 M 52 26 C 40 52, 38 82, 42 116"
            eye
          />
        </g>
      </g>
    </svg>
  );
}
