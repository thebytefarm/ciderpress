---
'ciderpress': minor
'@ciderpress/cli': minor
'@ciderpress/config': minor
'@ciderpress/ui': minor
---

**Full custom branding.** Six surfaces that previously forced ciderpress's
own branding through are now user-overridable, so a product docs site can
ship with zero ciderpress wordmark or pixel-apple visible.

### Topbar icon chip (new)

`config.icon` now actually renders. The field had a JSDoc claim but no
implementation — `<HeaderIcon />` now paints it as a small chip immediately
before `<HeaderLogo />` inside `cp-header-logo`. Accepts the same
`IconConfig` union as cards: Iconify id, `{ id, color }`, or `{ src, alt }`
for a static asset.

```ts
icon: 'devicon:react'                          // Iconify
icon: { id: 'devicon:nextjs', color: 'blue' }  // Iconify, explicit colour
icon: { src: '/icon.svg', alt: 'maltty' }      // Image
```

Pairs with `logo` for the canonical two-slot brand identity (icon chip +
wordmark) — Stripe / Vercel / Rspress-docs pattern.

### Logo on landing pages

`config.logo` now wires through to the visible header on every page —
including landing pages, where Rspress's nav slot was collapsing the user's
logo to 1×1. `<CiderpressLogo />` remains the fallback when `logo` is omitted.

### Custom loader

`loader` accepts four forms:

- `'apple'` (default) — the ciderpress pixel-apple animation.
- `'classic'` — the legacy dots loader.
- `false` — no loader chrome at all.
- `LoaderConfig` — custom SVG glyph + label + timing.

```ts
loader: {
  content: readFileSync('./assets/loader.svg', 'utf8'),
  label: 'brewing',
  maxDisplayMs: 4000,
}
```

A fallback dismissal timer in the inline head script guarantees the loader
disappears even when the React bundle never hydrates (static dist over plain
http with no service worker).

### User favicon wins

Setting `config.favicon` now disables the runtime favicon retinting that
swapped `<link rel="icon">` to a themed pixel-apple data URI. The user's
asset stays put. `favicon` also accepts `{ src }` in object form for
forward compatibility with future per-link metadata.

### Image-form icons

`IconConfig` now accepts `{ src, alt }` alongside Iconify identifiers.
Image icons render as `<img>` in workspace cards, section cards, feature
cards, sidebar links, and the top-level topbar mark.

```ts
icon: { src: '/icon.svg', alt: 'maltty' }
```

For inline React JSX, keep using `logo: ({ theme }) => <YourMark />` —
that path already supports ReactNode and re-renders on theme changes.

### Security hardening

The custom-loader CSS builder hex-escapes `<` characters in both `label`
and asset-URL `content`, so a payload containing `</style>` can never
break out of the inline `<style>` tag injected in `<head>`. The inline-SVG
content path was already safe via `encodeURIComponent`. The JSX-prop
escaper in the sync engine now also escapes backslash, blocking
trailing-backslash escape sequences in image-form icon `src`/`alt`.

### Loader timer correctness

- `minDisplayMs` + `maxDisplayMs` are cross-field validated: `max` must
  be at least `min + 200ms` (the CSS fade transition), rejecting configs
  that would dismiss the loader before paint.
- The forced-dismiss fallback is now skipped entirely when `loader: false`
  so user CSS hooked on the `data-cp-ready` dismissal lifecycle stays quiet.
- The React-side duplicate fallback timer was removed — the inline head
  script's timer is the single source of truth.

### Footer brand mark

The site footer's brand chip no longer falls back to the framework
`<CiderpressMark />` apple. When `site.footer.brandMark` is omitted, the
chip renders `<img src="/icon.svg">` — the auto-generated mark derived
from `config.title` at sync time, or the user's `public/icon.svg` when
one is shipped. Any user with a `public/icon.svg` (or who lets
ciderpress generate one) gets a non-apple footer out of the box.

### Icon-config consolidation

`SerializedIcon` and `ResolvedIcon` are now exported from the wrapper
`ciderpress` package so downstream tooling (custom MDX, third-party
themes) can type icon objects without reaching into `@ciderpress/config`.
The `@ciderpress/ui` shared resolver imports `SerializedIcon` directly —
the duplicate `CardIconInput` alias was dropped.
