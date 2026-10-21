# Generated editorial images

The 12 photographic concepts generated during design review are static illustrations, separate from
member uploads, public community records, profile examples and event listings. Each displayed image has
a short editorial caption. Repeated generation notices were removed from the public pages at the owner's
request; this document retains the asset provenance.

The landing page starts with people and chemistry, explicitly including sex partners and dates alongside
kink. About carries the remaining atmospheric photographs. None of these images establishes a real
member's identity, preferences, relationship status or attendance at an event.

## Assets and placements

All assets live in `public/images/editorial/`; `src/lib/editorialPhotos.ts` records native dimensions and alt
text. `EditorialPhoto` uses Next Image responsive sizing, lazy loading and a caption below the photograph.

| File | Page | Native size |
| --- | --- | --- |
| balcony-connection.webp | Landing, opening photo pair | 1672 × 941 |
| shared-chemistry.webp | Landing, opening photo pair | 1672 × 941 |
| latex-style.webp | Landing, desires | 1536 × 1024 |
| collar-and-harness.webp | Landing, boundaries | 1536 × 1024 |
| roleplay.webp | Landing, invitations | 1536 × 1024 |
| sensory-play.webp | Landing, private sharing | 1536 × 1024 |
| boots-and-gloves.webp | Landing, closing photo pair | 1536 × 1024 |
| red-rope.webp | Landing, closing photo pair | 1536 × 1024 |
| club-chemistry.webp | About, opening photo pair | 1536 × 1024 |
| satin-and-lace.webp | About, opening photo pair | 1536 × 1024 |
| leather-detail.webp | About, closing photo pair | 1536 × 1024 |
| rope-and-cuff.webp | About, closing photo pair | 1536 × 1024 |

These are not 4K originals. The generator returned the sizes above despite the requested 4K output for
the last batch. WebP conversion (Sharp, quality 85, default metadata stripping) preserves dimensions;
there is no upscaling. The complete static set is approximately 2.2 MB before responsive delivery.

## Verification

`E2E_BASE_URL=http://localhost:3000 npx playwright test landing-truth --project=ui --trace=off`
checks the landing at 375, 390 and 1440 px and About at 375 and 1440 px. It scrolls every photograph
into view, verifies successful image decoding and checks
for horizontal overflow. Existing age-gate keyboard checks remain in place.

These are fixture-based UI checks, not authenticated member acceptance or new beta-readiness evidence.
