---
'ciderpress': minor
'@ciderpress/cli': minor
'@ciderpress/config': minor
'@ciderpress/ui': minor
---

**Breaking:** reshape `home` into a hero + ordered `blocks[]` array, unify every page visual into one `HomeVisual` union, and add a selectable `tabs` block.

### `home` is now hero + blocks

The named singleton section keys (`home.proof`, `home.features`, `home.showcase`, `home.split`, `home.cta`) and the `home.layout` render-order array are gone. `home` is a special-cased `hero` plus a `blocks` array. Array order is render order, and **any block type may repeat** — multiple splits, multiple tab bands, whatever the page needs.

```ts
home: {
  hero: { tagline: 'Ship faster.' },
  blocks: [
    { type: 'proof', lead: 'used by', names: ['acme'] },
    { type: 'features', items: [/* ... */] },
    { type: 'split', title: 'One config', visual: { type: 'code', code: '// ...', language: 'ts' } },
    { type: 'split', title: 'See it live', reverse: true, visual: { type: 'image', src: '/demo.png' } },
    { type: 'cta', title: 'Ready to ship?' },
  ],
}
```

Each block carries a flat `label` / `title` / `body` heading trio instead of a nested `heading` object. Omitting `home.blocks` still yields the framework default deck (auto features grid + workspace showcase); `blocks: []` renders nothing below the hero.

### Proof strips take logos

A `proof` block's `names` accepts either a plain string or a `ProofLogo`, and the two mix in one strip:

```ts
{
  type: 'proof',
  lead: 'used by',
  names: [
    { src: '/logos/acme.svg', alt: 'Acme', href: 'https://acme.dev', height: 22 },
    'Globex',
  ],
}
```

`height` defaults to `20`. Set it per logo to optically balance marks whose aspect ratios differ, and trim each asset's `viewBox` to its artwork first: padding baked into the file shrinks the mark inside its box, so two logos set to the same height render at different sizes.

`mono: true` draws a logo as a silhouette in the current text colour instead of its own palette. Reach for it when a mark's baked colours only read against one background, since ciderpress ships a light variant for every theme.

### Migration

Every mapping from the old shape to the new one. The `type` field on a visual is **required**, so an un-migrated `visual` or `demo` fails config load rather than degrading.

| Before                                | After                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------- |
| `home.proof: { ... }`                 | `home.blocks: [{ type: 'proof', ... }]`                                 |
| `home.features: { ... }`              | `home.blocks: [{ type: 'features', ... }]`                              |
| `home.showcase: { ... }`              | `home.blocks: [{ type: 'showcase', ... }]`                              |
| `home.split: { ... }`                 | `home.blocks: [{ type: 'split', ... }]`                                 |
| `home.cta: { ... }`                   | `home.blocks: [{ type: 'cta', ... }]`                                   |
| `home.layout: ['proof', 'cta']`       | array order of `home.blocks`                                            |
| `home.split: false`                   | omit the block                                                          |
| `split.visual: { code, language }`    | `visual: { type: 'code', code, language }`                              |
| `hero.demo: { src, alt }`             | `demo: { type: 'image', src, alt }`                                     |
| `hero.demo: { command, lines }`       | `demo: { type: 'terminal', command, lines }`                            |
| `heading: { label, title, subtitle }` | flat `label` / `title` / `body` on the block (`subtitle` is now `body`) |

Hand-authored `index.md` files are not migrated for you — the sync engine skips block compilation when you ship your own home page, so update its frontmatter by hand. Unrecognised top-level home keys (`proof:`, `cta:`, `split:`) are ignored rather than rendered.

There is no replacement for `HomeLayoutEntry`'s `component` escape hatch — arbitrary React sections are no longer part of the home config. Use `beforeHero` / `afterHero` on `HomeLayout`, or a custom page.

### One visual union

`hero.demo` and `split.visual` now take the same `HomeVisual` — a union discriminated on a **required** `type` field:

- `{ type: 'code', code, language? }` — rendered through Rspress's native Shiki `CodeBlockRuntime`, the same pipeline as markdown code fences, instead of a bare unstyled `<pre>`
- `{ type: 'image', src, alt?, width?, height? }` — screenshot or graphic
- `{ type: 'terminal', command, lines, windowTitle? }` — the framework terminal chrome with your own output

Split bands also gain `reverse`, which flips the columns (visual left, copy right).

### New `tabs` block

A strip of selectable tabs driving one panel — click a tab, the panel's copy and visual swap. `orientation: 'vertical'` (default) puts the strip beside the panel; `'horizontal'` runs it above. Built on react-aria-components, so arrow-key navigation and tab/tabpanel ARIA wiring are handled.

A tab's `cta` renders where the axis puts it: horizontal closes the copy column, beside the visual; vertical renders it after the visual, so the button closes the panel instead of splitting the body copy from the visual.

```ts
{
  type: 'tabs',
  label: 'Capabilities',
  title: 'Pick a thread, follow it through.',
  orientation: 'vertical',
  items: [
    {
      label: 'Sync engine',
      icon: 'pixelarticons:reload',
      title: 'Your markdown, left where it is',
      body: 'Ciderpress reads your repo in place.',
      bullets: ['Glob discovery', 'Watch mode on every save'],
      visual: { type: 'terminal', command: 'ciderpress dev', lines: [{ kind: 'ok', text: 'synced 128 pages' }] },
    },
    { label: 'OpenAPI', visual: { type: 'code', code: "openapi: { spec: 'openapi.yaml' }" } },
  ],
}
```

### API changes

Removed from `@ciderpress/config`: `HomeSectionId`, `HomeLayoutEntry`, `DEFAULT_HOME_LAYOUT`, `HomeSectionHeading`, `HomeProofConfig`, `HomeFeaturesConfig`, `HomeShowcaseConfig`, `HomeSplitConfig`, `HomeCtaConfig`, `HomeSplitVisual`, `HomeHeroDemoConfig`, `HomeHeroDemoImage`, `HomeHeroDemoTerminal`, `HomeHeroDemoLine`.

Added to `@ciderpress/config`: `HomeBlock`, `HomeBlockType`, `HomeProofBlock`, `ProofLogo`, `ProofItem`, `HomeFeaturesBlock`, `HomeShowcaseBlock`, `HomeSplitBlock`, `HomeTabsBlock`, `HomeTabItem`, `HomeCtaBlock`, `HomeVisual`, `HomeVisualCode`, `HomeVisualImage`, `HomeVisualTerminal`, `HomeVisualLine`.

Added to `@ciderpress/ui`: `HomeTabs`, `HomeTabsProps`, `HomeTabEntry`, `TabsAction`. `CTA` gains an `eyebrow` prop, and `HomeSplit`'s `visual` prop is now optional — a copy-only split renders full width instead of painting an empty frame.

Hand-authored `index.md` files with `pageType: home` must migrate too: the layout reads `blocks` from frontmatter and no longer honours the old `features` / `featuresHeading` / `proof` / `split` / `cta` keys.
