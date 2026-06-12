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

  // Tab mark — object form exercises the explicit `type` field. Setting
  // `favicon` suppresses the runtime favicon retinting that otherwise
  // swaps `<link rel="icon">` to a themed pixel-apple data URI.
  favicon: { src: '/favicon.svg', type: 'image/svg+xml' },

  // Custom FOUC loader. Inline SVG content + brand-aligned label.
  loader: {
    content: LOADER_SVG,
    label: 'loading',
    minDisplayMs: 150,
    maxDisplayMs: 4000,
  },

  theme: { name: 'midnight' },

  // Fully custom-branded home page. Exercises every customization
  // surface so the rendered HTML contains zero ciderpress strings and
  // every framework default chunk is replaced with brand-aligned copy.
  home: {
    // Dashboard-style hero demo — image variant. Renders the
    // dashboard.svg preview inside the framework's framed hero slot
    // (rounded corners + brand-soft glow preserved).
    heroDemo: { src: '/dashboard.svg', alt: 'Acme Corp control plane' },
    // Custom Split section. Replaces the framework's "Acme Docs"
    // example with Acme's actual SDK config preview.
    split: {
      eyebrow: 'Type-safe by default',
      title: 'One config. Validated at boot.',
      body: 'Acme services are described by acme.config.ts. The SDK validates against your live database schema on deploy — drift never ships.',
      bullets: [
        'Typed handlers, typed events, typed database',
        'Schema drift caught at typecheck time',
        'Feature flags + audit retention next to code',
        'Per-environment overrides without forking',
      ],
      cta: { text: 'Read configuration', link: '/getting-started/configuration' },
      visual: {
        language: 'ts',
        code: [
          "import { defineConfig } from '@acme/sdk'",
          '',
          'export default defineConfig({',
          "  name: 'billing',",
          "  regions: ['us-east', 'eu-west'],",
          '  database: { pool: { min: 2, max: 16 } },',
          '  flags: {',
          "    invoice_v2: { default: false, owner: 'platform@acme.co' },",
          '  },',
          '})',
        ].join('\n'),
      },
    },
    features: {
      columns: 3,
      heading: {
        eyebrow: 'What you get',
        title: 'Built for the engineers who ship.',
        subtitle:
          'A typed SDK, an OpenAPI spec, a managed edge runtime, and a control plane — all wired together before you write your first handler.',
      },
    },
    workspaces: {
      columns: 2,
      heading: {
        eyebrow: 'Apps & Packages',
        title: 'Everything in the monorepo.',
        subtitle: 'Browse the dashboard app, the edge runtime, and the official SDK.',
      },
    },
    cta: {
      title: 'Ready to ship?',
      subtitle: 'Install the CLI and have a service deployed in under fifteen minutes.',
      actions: [
        { theme: 'brand', text: 'Quickstart', link: '/getting-started/quickstart' },
        { theme: 'alt', text: 'API reference', link: '/api/overview' },
      ],
    },
    // Custom section order — push the CTA up under the hero so the
    // primary conversion sits before any further reading. Trust strip
    // is dropped (we don't have names yet).
    layout: ['hero', 'cta', 'features', 'workspaces', 'split'],
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
