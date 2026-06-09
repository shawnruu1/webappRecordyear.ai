# RecordYear brand marks

Circular seal + Playfair Display wordmark. The seal reads as *proof / permanence / certification* — the argument the site already makes ("Where's the proof?"). All type is **outlined to vector paths**, so the files carry no font dependency and render identically everywhere.

## Palette

| Token | Hex | Use |
|---|---|---|
| Ink | `#171310` | wordmark on cream |
| Cream | `#EFE9DE` | wordmark on dark |
| Gold (light bg) | `#B0823A` | seal on cream |
| Gold (dark bg) | `#C99A47` | seal on dark (brighter to hold on black) |
| Warm black | `#15110D` | dark tiles / favicon disc |

Gold stays an accent — it lives in the seal only. The wordmark is solid ink/cream, matching the nav.

## Files

Lockup (seal + wordmark):
- `recordyear-lockup-cream.svg` — full color, for cream / light backgrounds
- `recordyear-lockup-dark.svg` — full color, for the dark sections
- `recordyear-lockup-mono-black.svg` — single-ink black
- `recordyear-lockup-mono-cream.svg` — single-ink cream (on dark)

Seal mark only:
- `recordyear-seal-cream.svg`, `recordyear-seal-dark.svg`
- `recordyear-seal-mono-black.svg`, `recordyear-seal-mono-cream.svg`

Favicon (single serif `R`, legible at 16px):
- `recordyear-favicon.svg` — dark disc, gold R (primary)
- `recordyear-favicon-light.svg` — cream disc, ink R

App icon (rounded tile, 512):
- `recordyear-app-icon-dark.svg`, `recordyear-app-icon-cream.svg`

## Notes

- Type: Playfair Display (wordmark 800, monograms 700) — same family as `lib/marketingFonts.ts`, outlined.
- Clear space: keep at least the seal's radius of padding around the lockup.
- Below ~24px wide, use the favicon (`R`), not the `RY` seal — the inner ring + monogram muddy at tab size.
