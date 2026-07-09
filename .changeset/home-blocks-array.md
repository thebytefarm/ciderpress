---
'ciderpress': minor
'@ciderpress/cli': minor
'@ciderpress/config': minor
'@ciderpress/ui': minor
---

**Breaking:** reshape `home` into a hero + ordered `blocks[]` array, and give the split section a real visual union.

The named singleton section keys (`home.proof`, `home.features`, `home.showcase`, `home.split`, `home.cta`) and the `home.layout` render-order array are gone. `home` is now just a special-cased `hero` plus a `blocks` array. Array order is render order, and **any block type may repeat** — so you can have multiple splits.

```ts
home: {
  hero: { tagline: 'Ship faster.' },
  blocks: [
    { type: 'proof', lead: 'used by', names: ['acme'] },
    { type: 'features', items: [/* ... */] },
    { type: 'split', title: 'One config', visual: { code: '// ...', language: 'ts' } },
    { type: 'split', title: 'See it live', reverse: true, visual: { src: '/demo.png' } },
    { type: 'cta', title: 'Ready to ship?' },
  ],
}
```

Split visual changes:

- **Code now highlights.** Split code is rendered through Rspress's native Shiki `CodeBlockRuntime` — the same pipeline as markdown code fences — instead of a bare unstyled `<pre>`.
- **New image variant.** `visual` is a discriminated union: `{ code, language? }` for a highlighted snippet or `{ src, alt?, width?, height? }` for a screenshot/graphic.
- **New `reverse` flag** on split blocks flips the columns (visual left, copy right).

Removed exports: `HomeSectionId`, `HomeLayoutEntry`, `DEFAULT_HOME_LAYOUT`. Added: `HomeBlock`, `HomeBlockType`, `HomeProofBlock`, `HomeFeaturesBlock`, `HomeShowcaseBlock`, `HomeSplitBlock`, `HomeCtaBlock`, `HomeSplitVisualCode`, `HomeSplitVisualImage`. Omitting `home.blocks` still yields the framework default deck (auto features grid + workspace showcase).
