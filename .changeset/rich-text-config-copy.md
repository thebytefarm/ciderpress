---
'@ciderpress/ui': minor
---

Config copy now accepts inline markup — always on, no flag.

Any display string in `ciderpress.config.ts` can carry `**accent**`, `==highlight==`, `*italic*`, `` `code` ``, `[links](/href)`, `<br>`, and a whitelist of inline HTML tags (`a`, `b`, `strong`, `i`, `em`, `code`, `kbd`, `mark`, `sup`, `sub`, `span`, `small`, `u`, `s`, `del`, `ins`) keeping only their `class`, `title`, and `href` attributes.

`**` is the accent — bold _and_ brand-coloured — because a heading is already bold, so weight alone would say nothing there. `==` is a highlight (tinted `<mark>`), matching Obsidian / Typora / markdown-it-mark rather than being redefined. Use `<strong>` for bold without the colour.

Since inline HTML is supported, `<span class="cp-accent">` and `<mark>` are equivalent long forms of the two markers.

```ts
home: {
  hero: { tagline: 'Point it at your `markdown`. <strong>No restructuring.</strong>' },
  blocks: [{ type: 'split', title: 'One config, **validated at boot**' }],
}
```

Markup is parsed into React elements rather than injected as HTML — `dangerouslySetInnerHTML` is never involved, so nothing in a config string can execute. `<script>`, `<style>`, `<iframe>` and friends are dropped with their contents; other unknown tags are unwrapped and their text kept; non-whitelisted attributes (`onclick`, `style`) and links with unsafe schemes are discarded.

The same string is stripped to bare text wherever markup cannot render — `<title>`, `<meta name="description">`, Open Graph tags, and `aria-label`s — so one value serves both surfaces.

Block markdown (lists, headings, blockquotes) is not supported; these fields are single-line display copy.

**Hero title accent.** The headline still auto-accents its trailing half, so existing sites are unchanged. Bold anything in the title and that positional guess steps aside:

```ts
description: 'Beautiful Docs, Zero Effort',    // auto — trailing half
description: 'Beautiful **Docs**, Zero Effort', // explicit — only "Docs"
```

Added exports: `RichText`, `renderRichText`, `toPlainText`, `hasAccentMarker`, and the `.cp-accent` class for theme overrides.
