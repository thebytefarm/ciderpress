import { CiderpressLogo, defineConfig } from 'ciderpress'
import { createElement } from 'react'

export default defineConfig({
  title: 'ciderpress',
  description: 'Beautiful Docs, Zero Effort',
  version: 'v1.0',
  theme: {
    themes: ['honeycrisp'],
  },
  brand: {
    // Inline SVG wordmark that inherits `var(--rp-c-brand)` via
    // `fill="currentColor"` — retints automatically when the user flips
    // theme or variant without a re-render or sync rebuild. Replaces the
    // auto-generated `/logo.svg`, which bakes a single brand hex at sync
    // time and can't read the live CSS context once loaded via `<img>`.
    logo: () => createElement(CiderpressLogo),
  },
  editLink: { repo: 'thebytefarm/ciderpress', branch: 'main', directory: 'docs' },
  reportLink: { repo: 'thebytefarm/ciderpress' },
  topbar: {
    nav: [
      { title: 'Getting Started', link: '/getting-started/introduction' },
      { title: 'Concepts', link: '/concepts/content' },
      { title: 'Guides', link: '/guides/deploying-to-vercel' },
      { title: 'Framework', link: '/framework/overview' },
      { title: 'Reference', link: '/reference/configuration' },
    ],
    cta: { text: 'Get started →', href: '/getting-started/quick-start' },
  },
  sidebar: {
    top: [
      { text: 'Home', href: '/', icon: 'pixelarticons:home' },
      { text: 'Changelog', href: '/changelog', icon: 'pixelarticons:notes' },
    ],
    bottom: [
      { text: 'Examples', href: '/examples', icon: 'pixelarticons:app-windows' },
      { text: 'Contributing', href: '/contributing', icon: 'pixelarticons:git-merge' },
    ],
    promo: {
      title: 'Ship docs that stay in sync',
      body: 'Pull docs from your codebase and keep them green automatically.',
      cta: { text: 'Try ciderpress →', href: '/getting-started/quick-start' },
    },
  },
  home: {
    hero: {
      label: '★ open source · v0.5 · MIT',
      tagline:
        'An opinionated documentation framework for monorepos. No restructuring, no plugins, no theme wiring — just point it at your markdown.',
      actions: [
        {
          variant: 'primary',
          text: 'Introduction',
          href: '/getting-started/introduction',
        },
        { variant: 'secondary', text: 'Quick Start', href: '/getting-started/quick-start' },
      ],
    },
    // Ordered landing bands. Array order is render order; any block type
    // may repeat (e.g. multiple `split`s).
    blocks: [
      {
        type: 'proof',
        lead: 'used by',
        names: ['maltty', 'viteval', 'massaman', 'marxml'],
      },
      {
        type: 'features',
        truncate: { description: 2 },
        items: [
          {
            title: 'Zero Effort',
            description:
              'No restructuring, no plugins, no theme wiring. Point it at markdown and ship.',
            icon: 'pixelarticons:speed-fast',
          },
          {
            title: 'Your Structure',
            description:
              'Config maps to how you already organize markdown. The tool fits your docs.',
            icon: 'pixelarticons:layout',
          },
          {
            title: 'AI-Friendly',
            description:
              'Auto llms.txt generation, raw markdown served as text/markdown, and glob discovery that picks up new files without config changes.',
            icon: 'pixelarticons:robot',
          },
          {
            title: 'Monorepo Native',
            description:
              'First-class workspace support with sidebar islands and auto-generated landing pages.',
            icon: 'pixelarticons:git-merge',
          },
          {
            title: 'VSCode Extension',
            description: 'Preview your docs site directly inside VS Code as you write.',
            icon: 'simple-icons:visualstudiocode',
          },
          {
            title: 'OpenAPI Support',
            description:
              'Drop in an OpenAPI spec and get interactive API reference pages with try-it-out requests.',
            icon: 'simple-icons:openapiinitiative',
          },
        ],
      },
      { type: 'showcase' },
      {
        type: 'split',
        label: 'Configuration',
        title: 'One file. Validated. Type-safe.',
        body: 'Define your docs site in ciderpress.config.ts. Zod validates at boot — no surprises in prod.',
        bullets: [
          'Type-safe config with full IntelliSense',
          'Hot-reloads on every save',
          'Composable presets for OpenAPI, blog, changelog',
          'First-class i18n out of the box',
        ],
        cta: { variant: 'primary', text: 'Read the docs', href: '/getting-started/quick-start' },
        visual: {
          type: 'code',
          language: 'ts',
          code: `import { defineConfig } from 'ciderpress'

export default defineConfig({
  title: 'Acme Docs',
  pages: [
    { title: 'Guides', include: 'docs/guides/*.md' },
  ],
  theme: { themes: ['mulled'] },
})`,
        },
      },
      {
        type: 'tabs',
        label: 'Capabilities',
        title: 'Pick a thread, follow it through.',
        body: 'Every band below is one config block away.',
        orientation: 'vertical',
        items: [
          {
            label: 'Sync engine',
            icon: { id: 'pixelarticons:reload', color: 'green' },
            title: 'Your markdown, left where it is',
            body: 'Ciderpress reads your repo in place — no copying, no restructuring. Globs pick up new files without a config change.',
            bullets: ['Glob discovery', 'Frontmatter inheritance', 'Watch mode on every save'],
            visual: {
              type: 'terminal',
              windowTitle: 'ciderpress dev',
              command: 'ciderpress dev',
              lines: [
                { kind: 'ok', text: 'synced 128 pages from 6 workspaces' },
                { kind: 'info', text: 'sidebar + nav generated' },
                { kind: 'cmt', text: 'watching for changes…' },
                { kind: 'ok', text: 'ready at http://localhost:3000' },
              ],
            },
          },
          {
            label: 'OpenAPI',
            icon: { id: 'simple-icons:openapiinitiative', color: 'blue' },
            title: 'Specs become reference pages',
            body: 'Point a page at a spec file and get interactive endpoint docs with try-it-out requests.',
            bullets: ['Schema-aware examples', 'Grouped by tag or path'],
            visual: {
              type: 'code',
              language: 'ts',
              code: `pages: [
  {
    title: 'API',
    path: '/api',
    openapi: { spec: 'openapi.yaml', path: '/api' },
  },
]`,
            },
          },
          {
            label: 'Themes',
            icon: { id: 'pixelarticons:paint-bucket', color: 'purple' },
            title: 'Six themes, zero wiring',
            body: 'Swap the whole palette with one key. Light and dark are generated together, so contrast holds either way.',
            cta: { variant: 'secondary', text: 'Browse themes', href: '/concepts/themes' },
            visual: {
              type: 'code',
              language: 'ts',
              code: `theme: {
  themes: ['mulled', 'orchard', 'press'],
  defaultVariant: 'dark',
}`,
            },
          },
          {
            label: 'AI-ready',
            icon: { id: 'pixelarticons:robot', color: 'amber' },
            title: 'Built for agents as well as people',
            body: 'Every site ships an llms.txt index and serves raw markdown at the same URL, so agents read the source instead of scraping HTML.',
            bullets: ['Auto llms.txt', 'text/markdown responses', 'Copy-as-markdown on every page'],
            visual: {
              type: 'terminal',
              windowTitle: 'curl',
              command: 'curl -H "Accept: text/markdown" https://ciderpress.dev/guides/setup',
              lines: [
                { kind: 'cmt', text: '# Setup' },
                { kind: 'cmt', text: 'Install the CLI and point it at your docs.' },
                { kind: 'ok', text: '200 · text/markdown' },
              ],
            },
          },
        ],
      },
      {
        type: 'cta',
        title: 'Ship the docs your team deserves.',
        body: 'One CLI. Three minutes. Production-ready.',
        actions: [
          { variant: 'primary', text: 'Get started', href: '/getting-started/quick-start' },
          {
            variant: 'secondary',
            text: 'Star on GitHub →',
            href: 'https://github.com/thebytefarm/ciderpress',
          },
        ],
      },
    ],
  },
  packages: [
    {
      title: 'ciderpress',
      icon: { id: 'pixelarticons:archive', color: 'purple' },
      description:
        'Documentation framework powered by Rspress with a config-driven information architecture',
      tags: ['typescript', 'node'],
      path: '/packages/ciderpress',
      pages: [
        {
          title: 'Overview',
          path: '/packages/ciderpress',
          include: 'packages/ciderpress/README.md',
        },
        {
          title: 'Changelog',
          path: '/packages/ciderpress/changelog',
          include: 'packages/ciderpress/CHANGELOG.md',
        },
      ],
    },
    {
      title: '@ciderpress/cli',
      icon: { id: 'pixelarticons:terminal', color: 'green' },
      description: 'CLI for building and serving ciderpress documentation sites',
      tags: ['typescript', 'node'],
      path: '/packages/cli',
      pages: [
        { title: 'Overview', path: '/packages/cli', include: 'packages/cli/README.md' },
        {
          title: 'Changelog',
          path: '/packages/cli/changelog',
          include: 'packages/cli/CHANGELOG.md',
        },
      ],
    },
    {
      title: '@ciderpress/config',
      icon: { id: 'pixelarticons:sliders', color: 'amber' },
      description: 'Configuration loading and validation for ciderpress',
      tags: ['typescript', 'zod'],
      path: '/packages/config',
      pages: [
        { title: 'Overview', path: '/packages/config', include: 'packages/config/README.md' },
        {
          title: 'Changelog',
          path: '/packages/config/changelog',
          include: 'packages/config/CHANGELOG.md',
        },
      ],
    },
    {
      title: '@ciderpress/ui',
      icon: { id: 'pixelarticons:paint-bucket', color: 'pink' },
      description: 'Rspress plugin, theme components, and styles for ciderpress',
      tags: ['typescript', 'react'],
      path: '/packages/ui',
      pages: [
        { title: 'Overview', path: '/packages/ui', include: 'packages/ui/README.md' },
        {
          title: 'Changelog',
          path: '/packages/ui/changelog',
          include: 'packages/ui/CHANGELOG.md',
        },
      ],
    },
    {
      title: '@ciderpress/theme',
      icon: { id: 'pixelarticons:mood-happy', color: 'cyan' },
      description: 'Theme types and definitions for ciderpress',
      tags: ['typescript'],
      path: '/packages/theme',
      pages: [
        { title: 'Overview', path: '/packages/theme', include: 'packages/theme/README.md' },
        {
          title: 'Changelog',
          path: '/packages/theme/changelog',
          include: 'packages/theme/CHANGELOG.md',
        },
      ],
    },
    {
      title: '@ciderpress/templates',
      icon: { id: 'pixelarticons:note', color: 'slate' },
      description:
        'Documentation templates SDK — built-in templates, extensions, and custom registrations',
      tags: ['typescript', 'liquid'],
      path: '/packages/templates',
    },
  ],
  pages: [
    {
      title: 'Changelog',
      path: '/changelog',
      include: 'CHANGELOG.md',
      nav: { hidden: true },
    },
    // Petstore OpenAPI integration — mounts the spec under /petstore. Top-level
    // `openapi` is gone in the new public API; each spec lives on a Page node.
    {
      title: 'Petstore API',
      path: '/petstore',
      nav: { hidden: true },
      openapi: { spec: 'docs/examples/petstore.json', path: '/petstore', title: 'Petstore API' },
    },
    // Examples directory page. The MDX is auto-regenerated by
    // `scripts/build.lauf.ts` on every `pnpm docs:build`, so adding a
    // new example dir picks up automatically. The individual example
    // sites live at `/examples/<name>/` and are served as static files
    // copied by the orchestrator — Rspress only owns the index here.
    {
      title: 'Examples',
      path: '/examples',
      include: 'docs/examples/index.mdx',
      icon: 'pixelarticons:app-windows',
      // Surfaced via the sidebar bottom links (next to Contributing), not as a
      // top-level section in the main sidebar tree.
      nav: { hidden: true },
    },
    {
      title: 'Getting Started',
      description: 'Set up ciderpress and ship your first documentation site in minutes.',
      icon: 'pixelarticons:speed-fast',
      path: '/getting-started',
      landing: true,
      pages: [
        {
          title: 'Introduction',
          description: 'What ciderpress is, why it exists, and what it gives you out of the box.',
          path: '/getting-started/introduction',
          include: 'docs/getting-started/introduction.mdx',
        },
        {
          title: 'Quick Start',
          description: 'Install ciderpress and create your first documentation site in minutes.',
          path: '/getting-started/quick-start',
          include: 'docs/getting-started/quick-start.md',
        },
      ],
    },
    {
      title: 'Concepts',
      description: 'Core ideas behind how ciderpress organizes and renders documentation.',
      icon: 'pixelarticons:book-open',
      path: '/concepts',
      landing: true,
      pages: [
        {
          title: 'Content',
          description: 'How sections and pages define your information architecture.',
          path: '/concepts/content',
          include: 'docs/concepts/content.md',
        },
        {
          title: 'Navigation',
          description: 'How the top nav bar and auto-generated landing pages control discovery.',
          path: '/concepts/navigation',
          include: 'docs/concepts/navigation.md',
        },
        {
          title: 'Workspaces',
          description: 'Monorepo support with standalone sidebars and landing page cards.',
          path: '/concepts/workspaces',
          include: 'docs/concepts/workspaces.md',
        },
        {
          title: 'Themes',
          description: 'Built-in themes, color modes, and color token overrides.',
          path: '/concepts/themes',
          include: 'docs/concepts/themes.mdx',
        },
        {
          title: 'LLM Output',
          description: 'Structured text output for LLMs, AI agents, and programmatic consumers.',
          path: '/concepts/llm-output',
          include: 'docs/concepts/llm-output.md',
        },
      ],
    },
    {
      title: 'Guides',
      description: 'Step-by-step instructions for deploying and configuring your site.',
      icon: 'pixelarticons:bookmark',
      path: '/guides',
      landing: true,
      pages: [
        {
          title: 'Deploy to Vercel',
          description: 'Build and deploy your ciderpress site to Vercel static hosting.',
          path: '/guides/deploying-to-vercel',
          include: 'docs/guides/deploying-to-vercel.md',
        },
        {
          title: 'Deploy to GitHub Pages',
          description: 'Build and deploy your ciderpress site with GitHub Actions.',
          path: '/guides/deploying-to-github-pages',
          include: 'docs/guides/deploying-to-github-pages.md',
        },
        {
          title: 'Using portless.sh',
          description:
            'Run the dev server behind portless for stable HTTPS hostnames instead of localhost.',
          path: '/guides/using-portless',
          include: 'docs/guides/using-portless.md',
        },
      ],
    },
    {
      title: 'Framework',
      description: 'An opinionated approach to documentation organization, inspired by Diataxis.',
      icon: 'pixelarticons:notes',
      path: '/framework',
      landing: true,
      pages: [
        {
          title: 'Overview',
          description: 'Why documentation needs structure and how ciderpress maps to Diataxis.',
          path: '/framework/overview',
          include: 'docs/framework/overview.md',
        },
        {
          title: 'Types',
          description: 'The seven documentation types and when to use each one.',
          path: '/framework/types',
          include: 'docs/framework/types.md',
        },
        {
          title: 'Recommended',
          description: 'The recommended section layout for a ciderpress documentation site.',
          path: '/framework/recommended',
          include: 'docs/framework/recommended.md',
        },
        {
          title: 'Templates',
          description: 'Starter templates for each documentation type.',
          path: '/framework/templates',
          include: 'docs/framework/templates.md',
          pages: [
            {
              title: 'Concept',
              description: 'Copy-paste template for concept (explanation) documentation.',
              path: '/framework/templates/concept',
              include: 'docs/framework/templates/concept.md',
            },
            {
              title: 'Guide',
              description: 'Copy-paste template for how-to guide documentation.',
              path: '/framework/templates/guide',
              include: 'docs/framework/templates/guide.md',
            },
          ],
        },
        {
          title: 'Scaling',
          description: 'How to evolve your documentation structure as your project grows.',
          path: '/framework/scaling',
          include: 'docs/framework/scaling.md',
        },
      ],
    },
    {
      title: 'Reference',
      description: 'Technical reference for every ciderpress API surface.',
      icon: 'pixelarticons:list-box',
      path: '/reference',
      landing: true,
      discover: {
        sort: (a, b) => {
          if (a.title === 'Configuration') {
            return -1
          }
          if (b.title === 'Configuration') {
            return 1
          }
          return a.title.localeCompare(b.title)
        },
      },
      pages: [
        {
          title: 'Configuration',
          description: 'Complete reference for all ciderpress.config.ts fields and entry shapes.',
          path: '/reference/configuration',
          include: 'docs/references/configuration.md',
        },
        {
          title: 'CLI Commands',
          description: 'All ciderpress CLI commands, flags, and behavior.',
          path: '/reference/cli',
          include: 'docs/references/cli.md',
        },
        {
          title: 'Frontmatter Fields',
          description: 'Every frontmatter field supported by ciderpress pages.',
          path: '/reference/frontmatter',
          include: 'docs/references/frontmatter.md',
        },
        {
          title: 'Markdown Syntax',
          description: 'Every core CommonMark and GFM element ciderpress renders, shown live.',
          path: '/reference/markdown',
          include: 'docs/references/markdown.mdx',
        },
        {
          title: 'Badges & Statuses',
          description: 'Label pages with badges and a named status registry.',
          path: '/reference/badges',
          include: 'docs/references/badges.md',
        },
        {
          title: 'VSCode Extension',
          description: 'Preview your ciderpress docs site directly inside VS Code.',
          path: '/reference/vscode-extension',
          include: 'docs/references/vscode-extension.md',
        },
        {
          title: 'OpenAPI',
          description: 'Generate interactive API reference pages from an OpenAPI spec.',
          path: '/reference/openapi',
          include: 'docs/references/openapi.mdx',
        },
        {
          title: 'Built-ins',
          description: 'Components, diagrams, and markdown extensions included out of the box.',
          path: '/reference/built-ins',
          discover: { sort: 'none' },
          pages: [
            // Layout & Structure
            {
              title: 'Accordion',
              description: 'Expandable disclosure sections for progressive content reveal.',
              path: '/reference/built-ins/accordion',
              include: 'docs/references/built-ins/accordion.mdx',
            },
            {
              title: 'Cards',
              description: 'Card components for landing pages, feature grids, and indexes.',
              path: '/reference/built-ins/cards',
              include: 'docs/references/built-ins/cards.mdx',
            },
            {
              title: 'Columns',
              description: 'Responsive grid layout for side-by-side content.',
              path: '/reference/built-ins/columns',
              include: 'docs/references/built-ins/columns.mdx',
            },
            {
              title: 'Field',
              description: 'Structured parameter and field documentation with nesting.',
              path: '/reference/built-ins/field',
              include: 'docs/references/built-ins/field.mdx',
            },
            {
              title: 'Frame',
              description: 'Media wrapper for images and videos with captions.',
              path: '/reference/built-ins/frame',
              include: 'docs/references/built-ins/frame.mdx',
            },
            {
              title: 'Steps',
              description: 'Vertical timeline stepper for sequential instructions.',
              path: '/reference/built-ins/steps',
              include: 'docs/references/built-ins/steps.mdx',
            },
            // Window Chrome
            {
              title: 'Desktop Window',
              description: 'macOS-style window chrome that all window components build on.',
              path: '/reference/built-ins/desktop-window',
              include: 'docs/references/built-ins/desktop-window.mdx',
            },
            {
              title: 'Browser Window',
              description: 'Wrap content in a fake browser chrome frame.',
              path: '/reference/built-ins/browser-window',
              include: 'docs/references/built-ins/browser-window.mdx',
            },
            {
              title: 'IDE Window',
              description: 'Editor-style window with file tabs for code blocks.',
              path: '/reference/built-ins/ide-window',
              include: 'docs/references/built-ins/ide-window.mdx',
            },
            {
              title: 'Terminal Window',
              description: 'Render terminal sessions with commands, outputs, and colored text.',
              path: '/reference/built-ins/terminal-window',
              include: 'docs/references/built-ins/terminal-window.mdx',
            },
            // Inline Elements
            {
              title: 'Badge',
              description: 'Inline labels with semantic variants and custom colors.',
              path: '/reference/built-ins/badge',
              include: 'docs/references/built-ins/status-badge.mdx',
            },
            {
              title: 'Color',
              description: 'Color swatch display with click-to-copy.',
              path: '/reference/built-ins/color',
              include: 'docs/references/built-ins/color.mdx',
            },
            {
              title: 'Tooltip',
              description: 'Hover-to-reveal definitions for inline contextual help.',
              path: '/reference/built-ins/tooltip',
              include: 'docs/references/built-ins/tooltip.mdx',
            },
            // Code & Prompts
            {
              title: 'Code Blocks',
              description: 'Syntax highlighting, line numbers, diffs, and code block features.',
              path: '/reference/built-ins/code-blocks',
              include: 'docs/references/built-ins/code-blocks.md',
            },
            {
              title: 'Prompt',
              description: 'Copyable AI prompt blocks with sparkle icon.',
              path: '/reference/built-ins/prompt',
              include: 'docs/references/built-ins/prompt.mdx',
            },
            // Diagrams & Visualizations
            {
              title: 'File Tree',
              description: 'Render interactive file tree visualizations.',
              path: '/reference/built-ins/file-tree',
              include: 'docs/references/built-ins/file-tree.md',
            },
            {
              title: 'Mermaid Diagrams',
              description: 'Render diagrams from text using Mermaid fenced code blocks.',
              path: '/reference/built-ins/mermaid',
              include: 'docs/references/built-ins/mermaid.md',
            },
            // Markdown Extensions
            {
              title: 'Math (KaTeX)',
              description: 'Render LaTeX math expressions inline and in blocks.',
              path: '/reference/built-ins/math',
              include: 'docs/references/built-ins/math.md',
            },
            {
              title: 'Superscript & Subscript',
              description: 'Inline superscript and subscript syntax.',
              path: '/reference/built-ins/superscript-subscript',
              include: 'docs/references/built-ins/superscript-subscript.md',
            },
          ],
        },
        {
          title: 'Icons',
          description: 'Supported icon sets and color options.',
          path: '/reference/icons',
          pages: [
            {
              title: 'Overview',
              description: 'Supported icon sets and how to use them across your site.',
              path: '/reference/icons/overview',
              include: 'docs/references/icons/overview.mdx',
            },
            {
              title: 'Colors',
              description: 'Available icon color classes for workspace and feature cards.',
              path: '/reference/icons/colors',
              include: 'docs/references/icons/colors.mdx',
            },
          ],
        },
        {
          title: 'Tags',
          description: 'Technology tag definitions for workspace cards.',
          path: '/reference/technology',
          pages: [
            {
              title: 'Overview',
              description: 'How technology tags map to icons on workspace cards.',
              path: '/reference/technology/overview',
              include: 'docs/references/technology/overview.mdx',
            },
            {
              title: 'Languages',
              description: 'Tags for programming languages.',
              path: '/reference/technology/languages',
              include: 'docs/references/technology/languages.mdx',
            },
            {
              title: 'Frameworks',
              description: 'Tags for frontend, backend, and mobile frameworks.',
              path: '/reference/technology/frameworks',
              include: 'docs/references/technology/frameworks.mdx',
            },
            {
              title: 'Databases',
              description: 'Tags for databases and data tools.',
              path: '/reference/technology/databases',
              include: 'docs/references/technology/databases.mdx',
            },
            {
              title: 'Infrastructure',
              description: 'Tags for cloud, hosting, CI/CD, and DevOps.',
              path: '/reference/technology/infrastructure',
              include: 'docs/references/technology/infrastructure.mdx',
            },
            {
              title: 'Tooling',
              description: 'Tags for build tools, styling, and testing.',
              path: '/reference/technology/tooling',
              include: 'docs/references/technology/tooling.mdx',
            },
            {
              title: 'Integrations',
              description: 'Tags for auth, AI/ML, CMS, and project-specific tools.',
              path: '/reference/technology/integrations',
              include: 'docs/references/technology/integrations.mdx',
            },
          ],
        },
      ],
    },
    {
      title: 'Packages',
      icon: 'pixelarticons:archive',
      path: '/packages',
      nav: { island: true },
      discover: {
        sort: (a, b) => {
          const order = ['ciderpress', '@ciderpress/cli', '@ciderpress/config', '@ciderpress/core']
          const aIdx = order.indexOf(a.title)
          const bIdx = order.indexOf(b.title)
          if (aIdx !== -1 && bIdx !== -1) {
            return aIdx - bIdx
          }
          if (aIdx !== -1) {
            return -1
          }
          if (bIdx !== -1) {
            return 1
          }
          return a.title.localeCompare(b.title)
        },
      },
      pages: [
        {
          title: 'ciderpress',
          path: '/packages/ciderpress',
          pages: [
            {
              title: 'Overview',
              path: '/packages/ciderpress',
              include: 'packages/ciderpress/README.md',
            },
            {
              title: 'Changelog',
              path: '/packages/ciderpress/changelog',
              include: 'packages/ciderpress/CHANGELOG.md',
            },
          ],
        },
        {
          title: '@ciderpress/cli',
          path: '/packages/cli',
          pages: [
            { title: 'Overview', path: '/packages/cli', include: 'packages/cli/README.md' },
            {
              title: 'Changelog',
              path: '/packages/cli/changelog',
              include: 'packages/cli/CHANGELOG.md',
            },
          ],
        },
        {
          title: '@ciderpress/config',
          path: '/packages/config',
          pages: [
            {
              title: 'Overview',
              path: '/packages/config',
              include: 'packages/config/README.md',
            },
            {
              title: 'Changelog',
              path: '/packages/config/changelog',
              include: 'packages/config/CHANGELOG.md',
            },
          ],
        },
        {
          title: '@ciderpress/ui',
          path: '/packages/ui',
          pages: [
            { title: 'Overview', path: '/packages/ui', include: 'packages/ui/README.md' },
            {
              title: 'Changelog',
              path: '/packages/ui/changelog',
              include: 'packages/ui/CHANGELOG.md',
            },
          ],
        },
        {
          title: '@ciderpress/theme',
          path: '/packages/theme',
          pages: [
            { title: 'Overview', path: '/packages/theme', include: 'packages/theme/README.md' },
            {
              title: 'Changelog',
              path: '/packages/theme/changelog',
              include: 'packages/theme/CHANGELOG.md',
            },
          ],
        },
        {
          title: '@ciderpress/templates',
          path: '/packages/templates',
          pages: [
            {
              title: 'Overview',
              path: '/packages/templates',
              include: 'packages/templates/README.md',
            },
          ],
        },
      ],
    },
    {
      title: 'Contributing',
      icon: 'pixelarticons:git-merge',
      path: '/contributing',
      nav: { island: true },
      pages: [
        {
          title: 'Overview',
          path: '/contributing',
          include: 'contributing/README.md',
        },
        {
          title: { from: 'heading' },
          path: '/contributing/concepts',
          include: 'contributing/concepts/*.md',
          discover: { sort: 'alpha' },
        },
        {
          title: { from: 'heading' },
          path: '/contributing/concepts/engine',
          include: 'contributing/concepts/engine/*.md',
          discover: { sort: 'alpha' },
        },
        {
          title: { from: 'heading' },
          path: '/contributing/references',
          include: 'contributing/references/*.md',
          discover: { sort: 'alpha' },
        },
        {
          title: { from: 'heading' },
          path: '/contributing/guides',
          include: 'contributing/guides/*.md',
          discover: { sort: 'alpha' },
        },
        {
          title: 'Standards',
          pages: [
            {
              title: { from: 'heading' },
              path: '/contributing/standards/typescript',
              include: 'contributing/standards/typescript/*.md',
              discover: { sort: 'alpha' },
            },
            {
              title: { from: 'heading' },
              path: '/contributing/standards/git',
              include: 'contributing/standards/git-*.md',
              discover: { sort: 'alpha' },
            },
            {
              title: { from: 'heading' },
              path: '/contributing/standards/documentation',
              include: 'contributing/standards/documentation/*.md',
              discover: { sort: 'alpha' },
            },
          ],
        },
      ],
    },
  ],
  socials: [
    { icon: 'github', url: 'https://github.com/thebytefarm/ciderpress' },
    { icon: 'npm', url: 'https://www.npmjs.com/package/ciderpress' },
  ],
  footer: {
    message: 'Built with ciderpress',
    copyright: true,
    tagline: 'powered by ciderpress',
    socials: true,
    columns: [
      {
        heading: 'Docs',
        links: [
          { text: 'Quickstart', href: '/getting-started/quick-start' },
          { text: 'Guides', href: '/guides' },
          { text: 'Reference', href: '/reference/configuration' },
        ],
      },
      {
        heading: 'Community',
        links: [
          { text: 'GitHub', href: 'https://github.com/thebytefarm/ciderpress' },
          { text: 'npm', href: 'https://www.npmjs.com/package/ciderpress' },
        ],
      },
    ],
  },
})
