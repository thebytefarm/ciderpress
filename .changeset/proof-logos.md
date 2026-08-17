---
'ciderpress': minor
'@ciderpress/config': minor
'@ciderpress/ui': minor
---

Proof strip entries accept logos, not just names

`home.blocks[].names` on a `proof` block now takes either a plain string or
a `ProofLogo`, and the two can be mixed in one strip:

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

`height` defaults to `20`. Set it per logo to optically balance marks whose
aspect ratios differ, and trim each asset's `viewBox` to its artwork first:
padding baked into the file shrinks the mark inside its box, so two logos
set to the same height render at different sizes.

`mono: true` draws a logo as a silhouette in the current text color instead
of its own palette. Use it when a mark's baked colors only read against one
background, since ciderpress ships a light variant for every theme.

Existing string-only configs are unaffected.
