---
'ciderpress': minor
'@ciderpress/cli': minor
'@ciderpress/config': minor
'@ciderpress/ui': minor
---

**Full white-label customization.** Five surfaces that previously forced
ciderpress's own branding through are now user-overridable, so a product docs
site can ship with zero ciderpress wordmark or pixel-apple visible.

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
asset stays put. `favicon` also accepts `{ src, type }` for explicit MIME
type when the path doesn't carry a recognised extension.

### Image-form icons

`IconConfig` now accepts `{ src, alt }` alongside Iconify identifiers.
Image icons render as `<img>` in workspace cards, section cards, feature
cards, sidebar links, and the top-level topbar mark.

```ts
icon: { src: '/icon.svg', alt: 'maltty' }
```

For inline React JSX, keep using `logo: ({ theme }) => <YourMark />` —
that path already supports ReactNode and re-renders on theme changes.
