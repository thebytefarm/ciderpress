import { defineConfig } from 'ciderpress'

/**
 * Inline SVG glyph for the FOUC loader. Inlined as a string literal so
 * the config remains browser-bundleable (Rspack pulls
 * `ciderpress.config.ts` into the client graph via the
 * `@ciderpress/internal/user-config` alias so function-form fields like
 * `logo` can run at render time — `node:fs` / `node:url` would break
 * that bundle).
 */
const LOADER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="brewing">' +
  '<circle cx="32" cy="32" r="28" fill="none" stroke="#f59e0b" stroke-width="6" ' +
  'stroke-linecap="round" stroke-dasharray="120 60">' +
  '<animateTransform attributeName="transform" type="rotate" from="0 32 32" ' +
  'to="360 32 32" dur="1.4s" repeatCount="indefinite"/>' +
  '</circle></svg>'

/**
 * Full white-label acceptance config. Every brand surface that ciderpress
 * paints by default is overridden here so the rendered site carries zero
 * framework branding — no wordmark, no pixel-apple favicon, no apple
 * loader animation.
 *
 * The config exercises:
 *   - `logo`     — string path to a custom wordmark SVG.
 *   - `favicon`  — custom tab mark; suppresses the runtime favicon retinting.
 *   - `icon`     — `{ src, alt }` chip rendered before the logo (two-slot
 *                  brand identity).
 *   - `loader`   — inline SVG with a custom label, replacing the apple
 *                  loader; `maxDisplayMs` caps the forced-dismiss fallback.
 *   - `theme`    — amber preset to match the maltty palette.
 */
export default defineConfig({
  title: 'maltty',
  description: 'Hand-crafted brewing kits',
  tagline: 'Recipes, equipment, and care manuals — all in one place.',

  // Wordmark logo. Rendered by `<HeaderLogo />` inside `cp-header-logo`.
  logo: '/logo.svg',

  // Tab mark. Setting this suppresses the runtime favicon retinting that
  // otherwise swaps `<link rel="icon">` to a themed pixel-apple data URI.
  favicon: '/favicon.svg',

  // Topbar icon chip — image form. Rendered by `<HeaderIcon />` immediately
  // before `<HeaderLogo />` so the header reads "[m] maltty".
  icon: { src: '/icon.svg', alt: 'maltty mark' },

  // Custom FOUC loader. Inline SVG content + brewing-themed label.
  // `maxDisplayMs` is the forced-dismiss budget; the inline head-script
  // flips `data-cp-ready` at this point even if the React bundle stalls.
  loader: {
    content: LOADER_SVG,
    label: 'brewing',
    minDisplayMs: 150,
    maxDisplayMs: 4000,
  },

  theme: { name: 'amber' },

  // White-label the home page: suppress the framework's hardcoded
  // HeroDemo (terminal showing `pnpm ciderpress dev`) and HomeSplit
  // (the "Acme Docs" sample config block), and replace the features
  // section heading with brand-aligned copy.
  home: {
    heroDemo: false,
    split: false,
    features: {
      columns: 2,
      heading: {
        title: 'What you get',
        subtitle: 'Three things every kit ships with — guaranteed.',
      },
    },
  },

  // Hero CTA + supporting features (replaces the framework's defaults).
  actions: [{ theme: 'brand', text: 'Browse recipes', link: '/recipes' }],
  features: [
    {
      title: 'Curated recipes',
      description: 'Hand-picked by our roastmasters.',
      icon: 'pixelarticons:edit',
      link: '/recipes',
    },
    {
      title: 'Care manuals',
      description: 'Keep your equipment in fighting shape.',
      icon: 'pixelarticons:tools',
    },
  ],

  sections: [
    {
      title: 'Welcome',
      path: '/welcome',
      include: 'docs/welcome.md',
      icon: 'pixelarticons:home',
    },
    {
      title: 'Recipes',
      path: '/recipes',
      include: 'docs/recipes.md',
      icon: 'pixelarticons:edit',
    },
  ],

  nav: [
    { title: 'Welcome', link: '/welcome' },
    { title: 'Recipes', link: '/recipes' },
  ],

  footer: {
    message: 'Brewed with care',
    copyright: 'Copyright © 2026 maltty',
  },
})
