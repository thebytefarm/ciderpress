import { defineConfig } from 'ciderpress'

const acmeLogoSvg = (color: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 40"><text x="0" y="30" font-family="monospace" font-size="32" font-weight="700" fill="${color}">ACME</text></svg>`

export default defineConfig({
  title: 'Acme Platform',
  description: 'The Acme Monorepo Documentation',
  theme: { themes: ['arcade'] },
  brand: {
    logo: ({ theme }) => ({
      src: `data:image/svg+xml;utf8,${encodeURIComponent(acmeLogoSvg(theme.colors.brand))}`,
      alt: 'Acme Platform',
    }),
  },
  home: {
    hero: {
      tagline: 'Everything you need to build, ship, and scale.',
    },
    features: { truncate: { description: 2 } },
    showcase: { columns: 2, truncate: { title: 1, description: 2 } },
  },
  apps: [
    {
      title: 'Web',
      icon: 'devicon:nextjs',
      description: 'Next.js frontend application',
      tags: ['nextjs', 'react', 'typescript'],
      path: '/apps/web',
      include: 'docs/*.md',
      discover: { sort: 'alpha' },
    },
    {
      title: 'API',
      icon: 'logos:hono',
      description: 'Hono REST API with typed routes',
      tags: ['hono', 'typescript'],
      path: '/apps/api',
      openapi: {
        spec: 'apps/api/openapi.json',
        path: '/apps/api/reference',
        title: 'API Reference',
        sidebarLayout: 'method-path',
      },
    },
  ],
  packages: [
    {
      title: 'UI',
      icon: 'devicon:react',
      description: 'Shared React component library',
      tags: ['react', 'typescript'],
      path: '/packages/ui',
      include: 'docs/*.md',
      discover: { sort: 'alpha' },
    },
    {
      title: 'DB',
      icon: 'devicon:postgresql',
      description: 'Database client and schema definitions',
      tags: ['drizzle', 'postgresql'],
      path: '/packages/db',
      include: 'docs/*.md',
      discover: { sort: 'alpha' },
    },
    {
      title: 'Config',
      icon: 'devicon:typescript',
      description: 'Shared configuration and environment variables',
      tags: ['typescript'],
      path: '/packages/config',
      include: 'docs/*.md',
      discover: { sort: 'alpha' },
    },
  ],
  workspaces: [
    {
      title: 'Integrations',
      description: 'Third-party service connectors',
      icon: 'mdi:puzzle',
      items: [
        {
          title: 'Stripe',
          icon: 'logos:stripe',
          description: 'Payment processing and subscription management',
          tags: ['stripe', 'payments'],
          path: '/integrations/stripe',
          include: 'docs/*.md',
          discover: { sort: 'alpha' },
        },
      ],
    },
    {
      title: 'Infrastructure',
      description: 'Deployment and orchestration tooling',
      icon: 'mdi:server',
      items: [
        {
          title: 'Docker',
          icon: 'logos:docker-icon',
          description: 'Container images and compose configurations',
          tags: ['docker', 'containers'],
          path: '/infrastructure/docker',
          include: 'docs/*.md',
          discover: { sort: 'alpha' },
        },
        {
          title: 'Terraform',
          icon: 'devicon:terraform',
          description: 'Infrastructure-as-code for cloud provisioning',
          tags: ['terraform', 'iac', 'aws'],
          path: '/infrastructure/terraform',
          include: 'docs/*.md',
          discover: { sort: 'alpha' },
        },
      ],
    },
  ],
  pages: [
    {
      title: 'Getting Started',
      path: '/getting-started',
      include: 'docs/getting-started.md',
      icon: 'pixelarticons:speed-fast',
    },
    {
      title: 'Architecture',
      icon: 'pixelarticons:layout-header',
      path: '/architecture',
      include: 'docs/architecture.md',
    },
    {
      title: 'Guides',
      path: '/guides',
      include: 'docs/guides/*.md',
      icon: 'pixelarticons:book-open',
      discover: { sort: 'alpha' },
    },
    {
      title: 'Contributing',
      icon: 'pixelarticons:git-merge',
      pages: [
        {
          title: 'Overview',
          path: '/contributing',
          include: 'contributing/README.md',
        },
        {
          title: { from: 'frontmatter' },
          path: '/contributing/guides',
          include: 'contributing/guides/*.md',
          discover: { sort: 'alpha' },
        },
      ],
    },
    {
      title: 'Reference',
      icon: 'pixelarticons:book-open',
      path: '/references',
      nav: { root: true },
      pages: [
        {
          title: 'API',
          path: '/references/api',
          include: 'docs/references/api/*.md',
          discover: { sort: 'alpha' },
        },
        {
          title: 'CLI',
          path: '/references/cli',
          include: 'docs/references/cli/*.md',
          discover: { sort: 'alpha' },
        },
      ],
    },
    {
      // Agent-file override: `apps/web/docs/CLAUDE.md` is hidden from the
      // `/apps/web` `docs/*.md` glob by the agent-file deny list, but a literal
      // (non-glob) `include` names it directly and is served here on purpose.
      // Kept last so it stays out of the home's first-three feature cards.
      title: 'Agent Guide',
      icon: 'pixelarticons:robot',
      path: '/agent-guide',
      include: 'apps/web/docs/CLAUDE.md',
    },
  ],
  sidebar: {
    top: [
      { text: 'Home', href: '/', icon: 'pixelarticons:home' },
      { text: 'Brand Square', href: '/', icon: 'pixelarticons:speed-fast', variant: 'primary' },
      {
        text: 'Brand Rounded',
        href: '/',
        icon: 'pixelarticons:speed-fast',
        variant: 'primary',
        shape: 'rounded',
      },
      { text: 'Alt Square', href: '/', icon: 'pixelarticons:book-open', variant: 'secondary' },
      {
        text: 'Alt Rounded',
        href: '/',
        icon: 'pixelarticons:book-open',
        variant: 'secondary',
        shape: 'rounded',
      },
    ],
    bottom: [
      { text: 'Ghost (default)', href: '/', icon: 'pixelarticons:home' },
      { text: 'Ghost Rounded', href: '/', icon: 'pixelarticons:home', shape: 'rounded' },
      {
        text: 'GitHub',
        href: 'https://github.com/acme',
        icon: 'pixelarticons:link',
        variant: 'secondary',
      },
    ],
  },
  topbar: {
    nav: [
      { title: 'Getting Started', link: '/getting-started' },
      {
        title: 'Docs',
        items: [
          { title: 'Architecture', link: '/architecture' },
          { title: 'Guides', link: '/guides' },
          { title: 'API Reference', link: '/references/api' },
          { title: 'CLI Reference', link: '/references/cli' },
        ],
      },
      {
        title: 'Products',
        items: [
          { title: 'Web', link: '/apps/web' },
          { title: 'API', link: '/apps/api' },
          { title: 'UI', link: '/packages/ui' },
          { title: 'DB', link: '/packages/db' },
          { title: 'Stripe', link: '/integrations/stripe' },
          { title: 'Docker', link: '/infrastructure/docker' },
        ],
      },
      { title: 'Contributing', link: '/contributing' },
    ],
  },
  socials: [
    { icon: 'github', url: 'https://github.com/acme' },
    { icon: 'discord', url: 'https://discord.gg/acme' },
    { icon: 'x', url: 'https://x.com/acme' },
  ],
  footer: {
    message: 'Built with ciderpress',
    copyright: { company: 'Acme Inc.' },
    socials: true,
  },
})
