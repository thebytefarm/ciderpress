---
'@ciderpress/theme': patch
'@ciderpress/ui': patch
---

Stop brand accent copy washing out to pink on dark, and fix eyebrow contrast

`**emphasis**` in display copy resolves to `.cp-accent`, which on dark took
`--cp-c-brand-lighter` — the palest rung of the brand ramp. It cleared contrast
by a wide margin (10.43:1 on honeycrisp) but washed the hue out: a light red
reads as pink rather than as the brand.

Dark accents now take `--cp-c-brand-light`, the most saturated rung that still
clears 4.5:1. Every theme gets a more brand-coloured accent — amber `#fcd34d`
→ `#fbbf24`, grannysmith `#bef264` → `#a3e635`, midnight `#bfdbfe` → `#93c5fd`,
arcade `#99ffcc` → `#66ffbb`. Light variants keep `--cp-c-brand-2` and are
unchanged.

Both red themes needed their `light` rung retuned, because red 400 was itself
the salmon being complained about and red 600 missed the bar:

- **honeycrisp** `brand.light` `#f87171` (red 400) → `#ef4444` (red 500)
- **mulled** `brand.light` `#dc2626` (red 600, 4.10:1 — under the bar) →
  `#ef4444` (red 500, 5.26:1)

Both still sit between `primary` and `lighter`, so the ramp ordering holds, and
button hover states still lighten their base.

Separately, the three home eyebrows (`.cp-feature-section-head__eyebrow`,
`.cp-cta__eyebrow`, `.cp-split__eyebrow`) coloured themselves from
`--cp-c-brand-1`. That token is a **fill** colour — tuned to sit behind
`--cp-c-brand-fg`, not to be read as text. At the 11px eyebrow size the 4.5:1
bar applies and it missed in four theme/variant pairs: 2.38:1 on mulled dark,
4.10:1 on honeycrisp dark, 3.07:1 on amber light, 3.09:1 on grannysmith light.
They now follow the same pair as `.cp-accent`.

Every theme/variant pair now clears 4.5:1, the lowest being 4.83:1 on amber
light.
