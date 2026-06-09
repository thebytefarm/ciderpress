import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { lauf, z } from 'laufen'

interface TechEntry {
  readonly key: string
  readonly icon: string
  readonly label: string
}

interface Category {
  readonly name: string
  readonly entries: readonly TechEntry[]
}

interface PageSection {
  readonly heading: string
  readonly categoryNames: readonly string[]
}

interface PageSpec {
  readonly slug: string
  readonly title: string
  readonly description: string
  readonly intro: string
  readonly sections: readonly PageSection[]
  readonly example: string
}

interface ColorSpec {
  readonly name: string
  readonly hex: string
  readonly bg: string
  readonly useCase: string
}

interface IconSetSpec {
  readonly prefix: string
  readonly name: string
  readonly url: string
  readonly bestFor: string
  readonly example: string
}

interface GeneratedFile {
  readonly path: string
  readonly content: string
}

const HEADER = '{/* @auto-generated — do not edit. Regenerate with: lauf run docs */}'

const ICON_COLORS: readonly ColorSpec[] = [
  {
    name: 'purple',
    hex: '#a78bfa',
    bg: 'rgba(167, 139, 250, 0.12)',
    useCase: 'Primary brand, general purpose',
  },
  {
    name: 'blue',
    hex: '#60a5fa',
    bg: 'rgba(96, 165, 250, 0.12)',
    useCase: 'APIs, services, networking',
  },
  {
    name: 'green',
    hex: '#34d399',
    bg: 'rgba(52, 211, 153, 0.12)',
    useCase: 'Databases, data, success states',
  },
  {
    name: 'amber',
    hex: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.12)',
    useCase: 'Warnings, configuration, tooling',
  },
  {
    name: 'red',
    hex: '#f87171',
    bg: 'rgba(248, 113, 113, 0.12)',
    useCase: 'Destructive actions, critical',
  },
  {
    name: 'slate',
    hex: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.12)',
    useCase: 'Neutral, infrastructure',
  },
  {
    name: 'cyan',
    hex: '#0ea5e9',
    bg: 'rgba(14, 165, 233, 0.12)',
    useCase: 'Testing, monitoring, observability',
  },
  {
    name: 'pink',
    hex: '#f472b6',
    bg: 'rgba(244, 114, 182, 0.12)',
    useCase: 'Design, UI, creative tools',
  },
]

const ICON_SETS: readonly IconSetSpec[] = [
  {
    prefix: 'pixelarticons',
    name: 'Pixelarticons',
    url: 'https://pixelarticons.com',
    bestFor: 'Sidebar icons, UI chrome',
    example: 'pixelarticons:book-open',
  },
  {
    prefix: 'devicon',
    name: 'Devicon',
    url: 'https://devicon.dev',
    bestFor: 'Developer tools, colored logos',
    example: 'devicon:typescript',
  },
  {
    prefix: 'simple-icons',
    name: 'Simple Icons',
    url: 'https://simpleicons.org',
    bestFor: 'Brand icons, tech tags (monochrome)',
    example: 'simple-icons:react',
  },
  {
    prefix: 'mdi',
    name: 'Material Design Icons',
    url: 'https://pictogrammers.com/library/mdi/',
    bestFor: 'General-purpose UI icons',
    example: 'mdi:puzzle',
  },
  {
    prefix: 'catppuccin',
    name: 'Catppuccin Icons',
    url: 'https://github.com/catppuccin',
    bestFor: 'File type icons, themed accents',
    example: 'catppuccin:typescript',
  },
  {
    prefix: 'skill-icons',
    name: 'Skill Icons',
    url: 'https://skillicons.dev',
    bestFor: 'Skill badges, colored tech logos',
    example: 'skill-icons:typescript',
  },
  {
    prefix: 'logos',
    name: 'SVG Logos',
    url: 'https://github.com/gilbarbara/logos',
    bestFor: 'Colored brand logos (fallback)',
    example: 'logos:hono',
  },
  {
    prefix: 'vscode-icons',
    name: 'VS Code Icons',
    url: 'https://github.com/vscode-icons/vscode-icons',
    bestFor: 'File type icons',
    example: 'vscode-icons:file-type-shadcn',
  },
  {
    prefix: 'material-icon-theme',
    name: 'Material Icon Theme',
    url: 'https://github.com/material-extensions/vsc-material-icon-theme',
    bestFor: 'Material file/folder icons',
    example: 'material-icon-theme:trigger',
  },
]

const PAGE_SPECS: readonly PageSpec[] = [
  {
    slug: 'languages',
    title: 'Languages',
    description: 'Technology tags for programming languages.',
    intro: 'Programming language tags for workspace cards.',
    sections: [{ heading: 'Languages', categoryNames: ['Languages'] }],
    example: [
      '```ts',
      'packages: [',
      '  {',
      "    title: 'Core',",
      "    icon: 'devicon:typescript',",
      "    description: 'Shared business logic',",
      "    tags: ['typescript'],",
      "    path: '/packages/core',",
      '  },',
      '  {',
      "    title: 'ML Pipeline',",
      "    icon: 'simple-icons:python',",
      "    description: 'Data processing and model training',",
      "    tags: ['python', 'pytorch'],",
      "    path: '/packages/ml',",
      '  },',
      ']',
      '```',
    ].join('\n'),
  },
  {
    slug: 'frameworks',
    title: 'Frameworks',
    description: 'Technology tags for frontend, backend, and mobile frameworks.',
    intro: 'Framework tags for workspace cards, split into frontend, backend, and mobile.',
    sections: [
      { heading: 'Frontend', categoryNames: ['Frontend frameworks'] },
      { heading: 'Backend', categoryNames: ['Backend frameworks'] },
      { heading: 'Mobile', categoryNames: ['Mobile'] },
    ],
    example: [
      '```ts',
      'apps: [',
      '  {',
      "    title: 'Web',",
      "    icon: 'devicon:nextjs',",
      "    description: 'Next.js frontend application',",
      "    tags: ['nextjs', 'react', 'typescript'],",
      "    path: '/apps/web',",
      '  },',
      '  {',
      "    title: 'API',",
      "    icon: 'devicon:hono',",
      "    description: 'Edge-ready REST API',",
      "    tags: ['hono', 'typescript'],",
      "    path: '/apps/api',",
      '  },',
      ']',
      '```',
    ].join('\n'),
  },
  {
    slug: 'databases',
    title: 'Databases',
    description: 'Technology tags for databases and data tools.',
    intro: 'Database and data tool tags for workspace cards.',
    sections: [
      { heading: 'Databases', categoryNames: ['Databases'] },
      { heading: 'ORM and data tools', categoryNames: ['ORM / Data tools'] },
    ],
    example: [
      '```ts',
      'packages: [',
      '  {',
      "    title: 'DB',",
      "    icon: 'devicon:postgresql',",
      "    description: 'Database client and schema definitions',",
      "    tags: ['postgresql', 'prisma'],",
      "    path: '/packages/db',",
      '  },',
      ']',
      '```',
    ].join('\n'),
  },
  {
    slug: 'infrastructure',
    title: 'Infrastructure',
    description:
      'Technology tags for cloud providers, hosting, CI/CD, DevOps, monitoring, message queues, and infrastructure.',
    intro:
      'Cloud, hosting, CI/CD, DevOps, monitoring, message queues, and infrastructure tags for workspace cards.',
    sections: [
      { heading: 'Cloud and hosting', categoryNames: ['Cloud & hosting'] },
      { heading: 'CI/CD and DevOps', categoryNames: ['CI/CD & DevOps'] },
      { heading: 'Monitoring and observability', categoryNames: ['Monitoring & observability'] },
      { heading: 'Message queues', categoryNames: ['Message queues'] },
      { heading: 'Infrastructure', categoryNames: ['Infrastructure'] },
    ],
    example: [
      '```ts',
      'apps: [',
      '  {',
      "    title: 'API',",
      "    icon: 'devicon:hono',",
      "    description: 'Edge API deployed to Cloudflare Workers',",
      "    tags: ['hono', 'cloudflare', 'docker'],",
      "    path: '/apps/api',",
      '  },',
      ']',
      '```',
    ].join('\n'),
  },
  {
    slug: 'tooling',
    title: 'Tooling',
    description: 'Technology tags for build tools, styling, and testing.',
    intro: 'Build tools, styling frameworks, and testing library tags for workspace cards.',
    sections: [
      { heading: 'Build and package tools', categoryNames: ['Build & package tools'] },
      { heading: 'UI and styling', categoryNames: ['UI & styling'] },
      { heading: 'Testing', categoryNames: ['Testing'] },
    ],
    example: [
      '```ts',
      'packages: [',
      '  {',
      "    title: 'UI',",
      "    icon: 'devicon:react',",
      "    description: 'Shared component library',",
      "    tags: ['react', 'tailwindcss', 'storybook', 'vitest'],",
      "    path: '/packages/ui',",
      '  },',
      ']',
      '```',
    ].join('\n'),
  },
  {
    slug: 'integrations',
    title: 'Integrations',
    description: 'Technology tags for auth, AI/ML, CMS, and project-specific tools.',
    intro: 'Auth, AI/ML, CMS, and project-specific tool tags for workspace cards.',
    sections: [
      { heading: 'Auth', categoryNames: ['Auth & integrations'] },
      { heading: 'AI and ML', categoryNames: ['AI / ML'] },
      { heading: 'CMS', categoryNames: ['CMS'] },
      {
        heading: 'Project-specific',
        categoryNames: ['Project-specific (label-only fallback when icon not in any set)'],
      },
    ],
    example: [
      '```ts',
      'packages: [',
      '  {',
      "    title: 'AI',",
      "    icon: 'simple-icons:openai',",
      "    description: 'LLM orchestration and prompt management',",
      "    tags: ['openai', 'ai-sdk', 'typescript'],",
      "    path: '/packages/ai',",
      '  },',
      ']',
      '```',
    ].join('\n'),
  },
]

function parseTechMap(source: string): readonly Category[] {
  const lines = source.split('\n')

  const categoryBoundaries = lines
    .map((line, i) => ({ match: line.match(/\/\/\s*--\s*(.+?)\s*--/), index: i }))
    .filter((entry): entry is { match: RegExpMatchArray; index: number } => entry.match !== null)
    .map(({ match, index }) => ({ name: match[1], startIndex: index }))

  return categoryBoundaries.map((boundary, i) => {
    const endIndex = (() => {
      const next = categoryBoundaries[i + 1]
      if (next !== undefined) {
        return next.startIndex
      }
      return lines.length
    })()
    const entries = lines
      .slice(boundary.startIndex + 1, endIndex)
      .map((line) =>
        line.match(/^\s*'?([^':\s]+)'?\s*:\s*\{\s*icon:\s*'([^']+)',\s*label:\s*'([^']+)'/)
      )
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => ({ key: m[1], icon: m[2], label: m[3] }))
    return { name: boundary.name, entries }
  })
}

function findCategories(
  categories: readonly Category[],
  names: readonly string[]
): readonly Category[] {
  return names.flatMap((name) => {
    const found = categories.find((c) => c.name === name)
    if (found === undefined) {
      return []
    }
    return [found]
  })
}

function countEntries(categories: readonly Category[]): number {
  return categories.reduce((sum, c) => sum + c.entries.length, 0)
}

const mdxImport = "import { Icon, TechIconTable } from '@ciderpress/ui/theme'"

function frontmatter(title: string, description: string): string {
  return ['---', `title: ${title}`, `description: ${description}`, '---'].join('\n')
}

function iconTable(entries: readonly TechEntry[]): string {
  const json = JSON.stringify(entries.map((e) => ({ tag: e.key, icon: e.icon, label: e.label })))
  return `<TechIconTable entries={${json}} />`
}

function renderTechPage(spec: PageSpec, allCategories: readonly Category[]): string {
  const sections = spec.sections
    .map((s) => {
      const cats = findCategories(allCategories, s.categoryNames)
      const entries = cats.flatMap((c) => c.entries)
      if (entries.length === 0) {
        return ''
      }
      return [`## ${s.heading}`, '', iconTable(entries)].join('\n')
    })
    .filter((s) => s.length > 0)

  return [
    frontmatter(spec.title, spec.description),
    '',
    mdxImport,
    '',
    HEADER,
    '',
    `# ${spec.title}`,
    '',
    spec.intro,
    '',
    ...sections,
    '',
    '## Example',
    '',
    spec.example,
    '',
  ].join('\n')
}

function renderOverview(): string {
  const setRows = ICON_SETS.map(
    (s) =>
      `<tr><td style={{ textAlign: 'center' }}><Icon icon="${s.example}" width={20} height={20} /></td><td><code>${s.prefix}</code></td><td><a href="${s.url}">${s.name}</a></td><td>${s.bestFor}</td></tr>`
  )

  return [
    frontmatter('Icons', 'Supported icon sets and how to use them across your site.'),
    '',
    mdxImport,
    '',
    HEADER,
    '',
    '# Icons',
    '',
    'ciderpress uses [Iconify](https://iconify.design) for all icon rendering. Icons are resolved offline at build time — no external requests are made.',
    '',
    '## Format',
    '',
    'All icon identifiers use the `prefix:name` pattern:',
    '',
    '```',
    'pixelarticons:book-open',
    'devicon:typescript',
    'simple-icons:react',
    '```',
    '',
    'The prefix selects the icon set, and the name selects the specific icon within that set.',
    '',
    '## Supported icon sets',
    '',
    'Nine icon collections are bundled and available out of the box:',
    '',
    '<table>',
    '<thead>',
    '<tr>',
    "<th style={{ width: 48, textAlign: 'center' }}></th>",
    '<th>Prefix</th>',
    '<th>Set</th>',
    '<th>Best for</th>',
    '</tr>',
    '</thead>',
    '<tbody>',
    ...setRows,
    '</tbody>',
    '</table>',
    '',
    '## Where icons are used',
    '',
    'Icons appear in several places across the generated site:',
    '',
    '### Sidebar icon rail',
    '',
    'Top-level sections display an icon in the collapsed sidebar rail. Set via the `icon` field on a section entry:',
    '',
    '```ts',
    '{',
    "  title: 'Guides',",
    "  prefix: '/guides',",
    "  from: 'docs/guides/*.md',",
    "  icon: 'pixelarticons:book-open',",
    '}',
    '```',
    '',
    'Only top-level sections (depth 0) render icons. Nested sections ignore the `icon` field.',
    '',
    '### Navigation bar',
    '',
    'When using explicit nav items, each top-level item requires an `icon`:',
    '',
    '```ts',
    'nav: [',
    "  { title: 'Guides', link: '/guides', icon: 'pixelarticons:book-open' },",
    "  { title: 'API', link: '/api', icon: 'pixelarticons:terminal' },",
    ']',
    '```',
    '',
    "With `nav: 'auto'`, icons are inherited from the corresponding section.",
    '',
    '### Workspace cards',
    '',
    'Workspace items (`apps`, `packages`, `workspaces`) display an icon on their home page card and landing page:',
    '',
    '```ts',
    'apps: [',
    '  {',
    "    title: 'API',",
    "    icon: 'devicon:hono',",
    "    description: 'REST API with typed routes',",
    "    path: '/apps/api',",
    '  },',
    ']',
    '```',
    '',
    '### Feature cards',
    '',
    'Home page feature cards can display an icon:',
    '',
    '```ts',
    'features: [',
    '  {',
    "    title: 'Getting Started',",
    "    description: 'Everything you need to set up and start building.',",
    "    link: '/getting-started',",
    "    icon: 'pixelarticons:speed-fast',",
    '  },',
    ']',
    '```',
    '',
    '### Technology tags',
    '',
    'Workspace cards display technology tags with auto-resolved icons. See the [Technology Tags](/reference/technology/overview) reference for the full list of supported tag names.',
    '',
    '## Validation',
    '',
    'Icons are validated at config load time. An icon must:',
    '',
    '- Contain exactly one `:` separator',
    '- Use a recognized `prefix` (one of the nine bundled sets)',
    '',
    'Invalid icons produce a config error with type `invalid_icon`.',
    '',
    '## Browsing icons',
    '',
    "To find the right icon, browse each set's catalog:",
    '',
    ...ICON_SETS.map((s) => `- **${s.prefix}** — [${s.url.replace('https://', '')}](${s.url})`),
    '',
    'Or search across all sets on [icon-sets.iconify.design](https://icon-sets.iconify.design).',
    '',
  ].join('\n')
}

function renderColors(): string {
  const colorRows = ICON_COLORS.map((c) =>
    [
      '<tr>',
      '<td>',
      `<div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 4, background: '${c.bg}', color: '${c.hex}' }}>`,
      `<Icon icon="pixelarticons:heart" width={18} height={18} />`,
      '</div>',
      '</td>',
      `<td><code>${c.name}</code></td>`,
      `<td><code>{'.cp-card__icon--${c.name}'}</code></td>`,
      `<td>${c.useCase}</td>`,
      '</tr>',
    ].join('')
  )

  return [
    frontmatter('Icon Colors', 'Available icon color classes for workspace and feature cards.'),
    '',
    mdxImport,
    '',
    HEADER,
    '',
    '# Icon Colors',
    '',
    'Workspace cards and feature cards support a `color` field inside the `icon` object that applies a CSS color class to the icon. This controls the accent color shown behind or around the icon on cards.',
    '',
    '## Available colors',
    '',
    '<table>',
    '<thead>',
    '<tr>',
    '<th style={{ width: 56 }}>Swatch</th>',
    '<th>Value</th>',
    '<th>CSS Class</th>',
    '<th>Use case</th>',
    '</tr>',
    '</thead>',
    '<tbody>',
    ...colorRows,
    '</tbody>',
    '</table>',
    '',
    '## Usage',
    '',
    'Set `color` on a workspace item icon:',
    '',
    '```ts',
    'apps: [',
    '  {',
    "    title: 'API',",
    "    icon: { id: 'devicon:hono', color: 'blue' },",
    "    description: 'REST API with typed routes',",
    "    path: '/apps/api',",
    '  },',
    ']',
    '```',
    '',
    'Or on a card config within a section entry:',
    '',
    '```ts',
    '{',
    "  title: 'API',",
    "  link: '/apps/api',",
    '  card: {',
    "    icon: { id: 'devicon:hono', color: 'blue' },",
    "    description: 'REST API with typed routes',",
    '  },',
    '}',
    '```',
    '',
    '## Feature card colors',
    '',
    'Feature cards on the home page use the same color values via the `color` field on a `Feature` icon:',
    '',
    '```ts',
    'features: [',
    '  {',
    "    title: 'Getting Started',",
    "    icon: { id: 'pixelarticons:speed-fast', color: 'purple' },",
    "    description: 'Set up and start building.',",
    "    link: '/getting-started',",
    '  },',
    ']',
    '```',
    '',
    'The CSS class for feature cards follows the pattern `.cp-card__icon--{color}`.',
    '',
    '## Default behavior',
    '',
    "When `color` is omitted (or when icon is a plain string like `'devicon:hono'`), the icon renders with its native colors (for multi-color icon sets like `devicon` and `skill-icons`) or inherits `currentColor` (for monochrome sets like `simple-icons` and `pixelarticons`).",
    '',
  ].join('\n')
}

function renderTechOverview(allCategories: readonly Category[]): string {
  const pageRows = PAGE_SPECS.map((spec) => {
    const cats = spec.sections.flatMap((s) => findCategories(allCategories, s.categoryNames))
    const count = countEntries(cats)
    const examples = cats
      .slice(0, 3)
      .flatMap((c) => c.entries.slice(0, 1))
      .map((e) => e.label)
      .join(', ')
    return `| [${spec.title}](/reference/technology/${spec.slug}) | ${count} | ${examples}, etc. |`
  })

  const totalCount = countEntries(allCategories)

  return [
    frontmatter('Technology Tags', 'How technology tags map to icons on workspace cards.'),
    '',
    mdxImport,
    '',
    HEADER,
    '',
    '# Technology Tags',
    '',
    `Workspace cards display technology tags — small labels with an icon and name that indicate the tech stack of an app or package. ciderpress ships with a curated map of **${totalCount} technologies** that auto-resolve to the correct icon and display label.`,
    '',
    '## How it works',
    '',
    'Add tag keys to the `tags` array on any workspace item:',
    '',
    '```ts',
    'packages: [',
    '  {',
    "    title: 'API',",
    "    icon: 'devicon:hono',",
    "    description: 'REST API with typed routes',",
    "    tags: ['hono', 'typescript', 'postgresql'],",
    "    path: '/apps/api',",
    '  },',
    ']',
    '```',
    '',
    'Each tag key is looked up in the built-in tech map. A match renders the icon and display label (e.g., `hono` renders as <Icon icon="simple-icons:hono" width={14} height={14} /> **Hono**). Unrecognized tags render as plain text without an icon.',
    '',
    '## Tag categories',
    '',
    'Tags are organized into the following categories:',
    '',
    '| Category | Count | Covers |',
    '| -------- | ----- | ------ |',
    ...pageRows,
    '',
    '## Adding a new tag',
    '',
    'Add an entry to the `TECH_ICONS` constant in `packages/ui/src/theme/icons/tech-map.ts`:',
    '',
    '```ts',
    'export const TECH_ICONS = {',
    '  // ...existing entries',
    "  'my-tech': { icon: 'simple-icons:mytech', label: 'My Tech' },",
    '} as const satisfies Record<string, { readonly icon: string; readonly label: string }>',
    '```',
    '',
    'Then regenerate these docs:',
    '',
    '```bash',
    'lauf run docs',
    '```',
    '',
    'Prefer `devicon` for new entries — it provides colored brand logos for most technologies. Fall back to `logos`, `vscode-icons`, or `material-icon-theme` when devicon has no match, and `simple-icons` as a last resort (monochrome).',
    '',
  ].join('\n')
}

export default lauf({
  description: 'Generate icon reference docs from TECH_ICONS source of truth',
  args: {
    verbose: z.boolean().default(false).describe('Enable verbose logging'),
  },
  run(ctx) {
    const techMapPath = join(ctx.root, 'packages/ui/src/theme/icons/tech-map.ts')

    if (!existsSync(techMapPath)) {
      ctx.logger.error(`Tech map not found: ${techMapPath}`)
      return 1
    }

    ctx.spinner.start('Generating icon reference docs')

    const source = readFileSync(techMapPath, 'utf8')
    const categories = parseTechMap(source)

    if (ctx.args.verbose) {
      ctx.logger.info(
        `Parsed ${categories.length} categories with ${countEntries(categories)} total entries`
      )
    }

    const outDir = join(ctx.root, 'docs/references/icons')
    const techDir = join(ctx.root, 'docs/references/technology')

    mkdirSync(outDir, { recursive: true })
    mkdirSync(techDir, { recursive: true })

    const files: readonly GeneratedFile[] = [
      { path: join(outDir, 'overview.mdx'), content: renderOverview() },
      { path: join(outDir, 'colors.mdx'), content: renderColors() },
      { path: join(techDir, 'overview.mdx'), content: renderTechOverview(categories) },
      ...PAGE_SPECS.map((spec) => ({
        path: join(techDir, `${spec.slug}.mdx`),
        content: renderTechPage(spec, categories),
      })),
    ]

    files.reduce<void>((_, f) => {
      writeFileSync(f.path, f.content)
      if (ctx.args.verbose) {
        ctx.logger.info(`Wrote ${f.path.replace(ctx.root, '.')}`)
      }
    }, undefined as void)

    ctx.spinner.stop(`Generated ${files.length} icon reference docs`)
  },
})
