import { defineConfig } from '@zpress/kit'

export default defineConfig({
  title: 'Acme Platform',
  description: 'The Acme Monorepo Documentation',
  tagline: 'Everything you need to build, ship, and scale.',
  home: {
    features: { truncate: { description: 2 } },
    workspaces: { columns: 2, truncate: { title: 1, description: 2 } },
  },
  apps: [
    {
      title: 'Web',
      icon: 'devicon:nextjs',
      description: 'Next.js frontend application',
      tags: ['nextjs', 'react', 'typescript'],
      path: '/apps/web',
      include: 'docs/*.md',
      sort: 'alpha',
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
      sort: 'alpha',
    },
    {
      title: 'DB',
      icon: 'devicon:postgresql',
      description: 'Database client and schema definitions',
      tags: ['drizzle', 'postgresql'],
      path: '/packages/db',
      include: 'docs/*.md',
      sort: 'alpha',
    },
    {
      title: 'Config',
      icon: 'devicon:typescript',
      description: 'Shared configuration and environment variables',
      tags: ['typescript'],
      path: '/packages/config',
      include: 'docs/*.md',
      sort: 'alpha',
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
          sort: 'alpha',
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
          sort: 'alpha',
        },
        {
          title: 'Terraform',
          icon: 'devicon:terraform',
          description: 'Infrastructure-as-code for cloud provisioning',
          tags: ['terraform', 'iac', 'aws'],
          path: '/infrastructure/terraform',
          include: 'docs/*.md',
          sort: 'alpha',
        },
      ],
    },
  ],
  sections: [
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
      sort: 'alpha',
    },
    {
      title: 'Contributing',
      icon: 'pixelarticons:git-merge',
      items: [
        {
          title: 'Overview',
          path: '/contributing',
          include: 'contributing/README.md',
        },
        {
          title: { from: 'frontmatter' },
          path: '/contributing/guides',
          include: 'contributing/guides/*.md',
          sort: 'alpha',
        },
      ],
    },
    {
      title: 'Reference',
      icon: 'pixelarticons:book-open',
      path: '/references',
      root: true,
      items: [
        {
          title: 'API',
          path: '/references/api',
          include: 'docs/references/api/*.md',
          sort: 'alpha',
        },
        {
          title: 'CLI',
          path: '/references/cli',
          include: 'docs/references/cli/*.md',
          sort: 'alpha',
        },
      ],
    },
  ],
  sidebar: {
    above: [
      { text: 'Home', link: '/', icon: 'pixelarticons:home' },
      { text: 'Brand Square', link: '/', icon: 'pixelarticons:speed-fast', style: 'brand' },
      {
        text: 'Brand Rounded',
        link: '/',
        icon: 'pixelarticons:speed-fast',
        style: 'brand',
        shape: 'rounded',
      },
      { text: 'Alt Square', link: '/', icon: 'pixelarticons:book-open', style: 'alt' },
      {
        text: 'Alt Rounded',
        link: '/',
        icon: 'pixelarticons:book-open',
        style: 'alt',
        shape: 'rounded',
      },
    ],
    below: [
      { text: 'Ghost (default)', link: '/', icon: 'pixelarticons:home' },
      { text: 'Ghost Rounded', link: '/', icon: 'pixelarticons:home', shape: 'rounded' },
      { text: 'GitHub', link: 'https://github.com/acme', icon: 'pixelarticons:link', style: 'alt' },
    ],
  },
  nav: 'auto',
  socialLinks: [
    { icon: 'github', mode: 'link', content: 'https://github.com/acme' },
    { icon: 'discord', mode: 'link', content: 'https://discord.gg/acme' },
    { icon: 'x', mode: 'link', content: 'https://x.com/acme' },
  ],
  footer: {
    message: 'Built with zpress',
    copyright: 'Copyright © 2025 Acme Inc.',
    socials: true,
  },
})
