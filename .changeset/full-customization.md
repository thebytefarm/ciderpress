---
'ciderpress': minor
'@ciderpress/cli': minor
'@ciderpress/config': minor
'@ciderpress/ui': minor
---

**Full custom branding.** Every brand surface on a ciderpress site is
now user-overridable, plus the home page can be reordered and have
sections suppressed without writing custom MDX.

## Topbar icon chip

`config.icon` now actually renders — a small chip painted by
`<HeaderIcon />` immediately before `<HeaderLogo />` inside
`cp-header-logo`. Pair with `logo` for the canonical two-slot identity
(small mark + wordmark). Accepts the same `IconConfig` union as cards.

```ts
defineConfig({
  // Single slot — most sites pick this.
  logo: '/logo.svg',

  // Two-slot pattern — small mark + wordmark.
  icon: { src: '/mark.svg', alt: 'Acme' },
  logo: '/wordmark.svg',
})
```

## Loader

`config.loader` accepts four forms:

```ts
loader: 'apple'                          // default — ciderpress pixel apple
loader: 'classic'                        // legacy dots loader
loader: false                            // no loader at all
loader: {
  content: '<svg>...</svg>',             // inline SVG markup, OR
  // content: '/loader.svg',             // asset path
  label: 'brewing',
  minDisplayMs: 150,
  maxDisplayMs: 4000,
}
```

A fallback dismissal timer in the inline head script guarantees
`data-cp-ready` flips even when the React bundle never hydrates (static
dist over plain http with no service worker). Cross-field validation
rejects configs where `maxDisplayMs < minDisplayMs + 200`.

## Favicon

```ts
favicon: '/favicon.svg'                  // string shorthand
favicon: { src: '/favicon', type: 'image/svg+xml' }   // explicit MIME
```

Setting `favicon` disables the runtime favicon retinting that otherwise
swaps `<link rel="icon">` to a themed pixel-apple data URI. The
optional `type` field emits a second `<link rel="icon" type="...">` so
extension-less URLs still resolve to the right MIME.

## Icons broadened

```ts
icon: 'devicon:react'                          // Iconify (purple default)
icon: { id: 'devicon:nextjs', color: 'blue' }  // Iconify, explicit colour
icon: { src: '/icon.svg', alt: 'maltty' }      // Image — new
```

The image form is honoured on the topbar icon chip, workspace cards,
section cards, feature cards, and sidebar links.

## Home page — section opt-outs and customisation

```ts
home: {
  // Suppress the framework's `pnpm ciderpress dev` terminal demo
  heroDemo: false,

  // Or replace it with an image (dashboard screenshot, product shot, …)
  heroDemo: { src: '/dashboard.svg', alt: 'Acme dashboard' },

  // Or replace it with a structured terminal carrying your own command + output
  heroDemo: {
    windowTitle: '~/code/acme — acme dev',
    command: 'acme dev',
    lines: [
      { kind: 'ok',   text: 'edge runtime ready in us-east-1' },
      { kind: 'info', text: 'watching ./handlers' },
      { kind: 'cmt',  text: 'handlers.ts changed — rebuilt in 8ms' },
      { kind: 'err',  text: 'webhook delivery failed — retrying' },
    ],
  },

  // Suppress the "Acme Docs" sample-config split block
  split: false,

  // Or replace it with your own copy + code preview
  split: {
    eyebrow: 'Configuration',
    title: 'One file. Validated at boot.',
    body: 'Acme services are described in TypeScript; Zod validates on deploy.',
    bullets: ['Typed handlers', 'Schema drift caught early', 'Per-env overrides'],
    cta: { text: 'Read docs', link: '/getting-started/configuration' },
    visual: {
      language: 'ts',
      code: "import { defineConfig } from '@acme/sdk'\n\nexport default defineConfig({ ... })",
    },
  },

  // Override the hardcoded "Features" eyebrow + "Built for the way you ship." title.
  // Same shape applies on `home.workspaces.heading`.
  features: {
    columns: 3,
    heading: {
      eyebrow: 'What you get',
      title: 'Built for the engineers who ship.',
      subtitle: 'Typed SDK, OpenAPI spec, edge runtime — wired together.',
    },
  },
  workspaces: {
    columns: 2,
    heading: { eyebrow: 'Apps & Packages', title: 'Everything in the monorepo.' },
  },
}
```

## Home page — section order

`home.layout` controls render order and visibility. Omit a section
from the array to suppress it. Default is `['hero', 'trust',
'features', 'split', 'workspaces', 'cta']`.

```ts
home: {
  // Push the conversion above the fold; drop the trust strip
  layout: ['hero', 'cta', 'features', 'workspaces', 'split'],
}
```

The schema rejects duplicates and unknown ids.

## Home page — full custom MDX

For full control (custom sections, JSX in arbitrary positions), add a
section that mounts at `/` and write your own MDX. The sync engine
detects an explicit `index.md` and skips the auto-generated home page.
All home components are importable from `@ciderpress/ui/theme`.

```mdx
---
pageType: home
---

import { Hero, FeatureGrid, FeatureCard, PageRail, CTA } from '@ciderpress/ui/theme'

<PageRail>
  <Hero title="Acme Corp" actions={[{ theme: 'brand', text: 'Get started', link: '/start' }]} />
  <MyCustomBand />
  <FeatureGrid>
    <FeatureCard title="One" description="..." />
    <FeatureCard title="Two" description="..." />
  </FeatureGrid>
  <CTA title="Ready?" actions={[{ theme: 'brand', text: 'Sign up', link: '/signup' }]} />
</PageRail>
```

## Footer brand mark

The site footer no longer falls back to the ciderpress apple. When
`site.footer.brandMark` is omitted, the chip renders `<img
src="/icon.svg">` — your custom mark or the auto-generated one derived
from `config.title`.

## Security + correctness

- CSS `</style>` injection blocked in `loader.label` and `loader.content` —
  `<` is hex-escaped (`\3c `) so the byte sequence `</style>` never
  appears in the inline `<style>` tag.
- `escapeJsxProp` now escapes backslash, blocking trailing-backslash
  escapes in image-form icon `src` / `alt`.
- Empty `src: ''` rejected at the schema layer.
- Layouts short-circuit on `import.meta.env.SSG_MD` so the
  Copy-Markdown button no longer pulls topbar logo / search button /
  nav items into every copied page.

## Acme example

The `examples/custom/` directory ships a realistic mid-size product
docs site (Acme Corp) that exercises every new field — custom logo,
favicon, dashboard-style hero demo, custom split, reordered sections,
six feature cards, three workspace items, a three-column footer.
Verified: zero "ciderpress" strings in the rendered HTML.

Run `pnpm example:custom`, `pnpm example:custom:build`, or `pnpm
example:custom:serve`.
