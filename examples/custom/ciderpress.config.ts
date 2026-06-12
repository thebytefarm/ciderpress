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
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="loading">' +
  '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
  '<stop offset="0%" stop-color="#0ea5e9"/>' +
  '<stop offset="100%" stop-color="#6366f1"/>' +
  '</linearGradient></defs>' +
  '<circle cx="32" cy="32" r="26" fill="none" stroke="url(#g)" stroke-width="6" ' +
  'stroke-linecap="round" stroke-dasharray="100 80">' +
  '<animateTransform attributeName="transform" type="rotate" from="0 32 32" ' +
  'to="360 32 32" dur="1.2s" repeatCount="indefinite"/>' +
  '</circle></svg>'

/**
 * Fully custom-branded acceptance config. Every brand surface that ciderpress
 * paints by default is overridden here so the rendered site carries zero
 * framework branding — no wordmark, no pixel-apple favicon, no apple
 * loader animation, no apple in the footer.
 *
 * The site itself is a realistic mid-size product docs site: getting
 * started + guides + API reference + a workspace tree for the dashboard,
 * edge runtime, and SDK.
 */
export default defineConfig({
  title: 'Acme Corp',
  description: 'The operating layer for ambitious internet companies.',
  tagline: 'Ship faster. Integrate deeper. Stay accountable.',

  // Integrated wordmark logo — chevron mark + "Acme Corp" rendered as one
  // SVG. The default single-slot brand pattern. Use `config.icon`
  // instead/additionally only when you have a small mark that's
  // visually distinct from the wordmark (Stripe and Vercel keep it
  // single; some product sites layer a separate chip).
  logo: '/logo.svg',

  // Tab mark. Setting this suppresses the runtime favicon retinting that
  // otherwise swaps `<link rel="icon">` to a themed pixel-apple data URI.
  favicon: '/favicon.svg',

  // Custom FOUC loader. Inline SVG content + brand-aligned label.
  loader: {
    content: LOADER_SVG,
    label: 'loading',
    minDisplayMs: 150,
    maxDisplayMs: 4000,
  },

  theme: { name: 'midnight' },

  // White-label the home page: suppress the framework's hardcoded
  // HeroDemo (terminal showing `pnpm ciderpress dev`) and HomeSplit
  // (the "Acme Docs" sample config block), and replace the features
  // section heading with brand-aligned copy.
  home: {
    heroDemo: false,
    split: false,
    features: {
      columns: 3,
      heading: {
        title: 'What you get on day one',
        subtitle:
          'A typed SDK, an OpenAPI spec, a managed edge runtime, and a control plane — all wired together before you write your first handler.',
      },
    },
  },

  // Hero CTA + supporting features.
  actions: [
    { theme: 'brand', text: 'Quickstart', link: '/getting-started/quickstart' },
    { theme: 'alt', text: 'API reference', link: '/api/overview' },
  ],
  features: [
    {
      title: 'Typed SDK',
      description: 'Generated from your live OpenAPI spec on every deploy. End-to-end inference.',
      icon: 'pixelarticons:script-text',
      link: '/packages/sdk',
    },
    {
      title: 'Managed edge runtime',
      description: '40+ POPs, sub-50ms p99 cold starts, regional pinning, zero-config DR.',
      icon: 'pixelarticons:cloud',
      link: '/apps/edge',
    },
    {
      title: 'Control plane',
      description: 'Audit logs, customer impersonation, feature flags — next to your code.',
      icon: 'pixelarticons:dashboard',
      link: '/apps/dashboard',
    },
    {
      title: 'Webhook delivery',
      description: 'Signed events with 24h retries and a built-in DLQ.',
      icon: 'pixelarticons:notification',
      link: '/guides/webhooks',
    },
    {
      title: 'Observability built in',
      description: 'Structured logs, OpenTelemetry traces, custom metrics — no agent install.',
      icon: 'pixelarticons:chart',
      link: '/guides/observability',
    },
    {
      title: 'Rate limits you control',
      description: 'Token-bucket limiter with per-workspace ceilings and burst behaviour.',
      icon: 'pixelarticons:speed-fast',
      link: '/api/rate-limits',
    },
  ],

  apps: [
    {
      title: 'Dashboard',
      icon: 'devicon:nextjs',
      description: 'Next.js control-plane web app for billing, audit, and webhook ops.',
      tags: ['nextjs', 'react', 'rsc'],
      path: '/apps/dashboard',
      include: 'docs/*.md',
    },
    {
      title: 'Edge Runtime',
      icon: 'pixelarticons:cloud',
      description: 'Managed V8 isolates running your handlers in 40+ regions.',
      tags: ['v8', 'isolates', 'edge'],
      path: '/apps/edge',
      include: 'docs/*.md',
    },
  ],
  packages: [
    {
      title: 'SDK',
      icon: 'devicon:typescript',
      description: 'Strongly-typed TypeScript client generated from the OpenAPI spec.',
      tags: ['typescript', 'openapi'],
      path: '/packages/sdk',
      include: 'docs/*.md',
    },
  ],

  sections: [
    {
      title: 'Getting Started',
      path: '/getting-started',
      include: 'docs/getting-started/*.md',
      icon: 'pixelarticons:speed-fast',
      sort: 'alpha',
    },
    {
      title: 'Guides',
      path: '/guides',
      include: 'docs/guides/*.md',
      icon: 'pixelarticons:article',
      sort: 'alpha',
    },
    {
      title: 'API Reference',
      path: '/api',
      include: 'docs/api/*.md',
      icon: 'pixelarticons:book-open',
      sort: 'alpha',
    },
  ],

  nav: [
    { title: 'Docs', link: '/getting-started/introduction' },
    { title: 'Guides', link: '/guides/authentication' },
    { title: 'API', link: '/api/overview' },
  ],

  footer: {
    message: 'Built for teams who treat their stack as a product.',
    copyright: 'Copyright © 2026 Acme Corp.',
  },

  site: {
    footer: {
      columns: [
        {
          heading: 'Product',
          links: [
            { text: 'Quickstart', href: '/getting-started/quickstart' },
            { text: 'Configuration', href: '/getting-started/configuration' },
            { text: 'API Reference', href: '/api/overview' },
          ],
        },
        {
          heading: 'Apps',
          links: [
            { text: 'Dashboard', href: '/apps/dashboard' },
            { text: 'Edge Runtime', href: '/apps/edge' },
          ],
        },
        {
          heading: 'Resources',
          links: [
            { text: 'Authentication', href: '/guides/authentication' },
            { text: 'Webhooks', href: '/guides/webhooks' },
            { text: 'Observability', href: '/guides/observability' },
          ],
        },
      ],
      tagline: 'v1.0',
    },
  },
})
