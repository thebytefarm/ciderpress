import { codeFence } from '../lib/mdx.ts'

/**
 * One swatch entry on the icon-colors reference page.
 */
export interface ColorSpec {
  readonly name: string
  readonly hex: string
  readonly bg: string
  readonly useCase: string
}

/**
 * One row in the supported-icon-sets table on the icon overview page.
 */
export interface IconSetSpec {
  readonly prefix: string
  readonly name: string
  readonly url: string
  readonly bestFor: string
  readonly example: string
}

/**
 * One heading on a technology-reference page, with the source category
 * names it pulls entries from.
 */
export interface PageSection {
  readonly heading: string
  readonly categoryNames: readonly string[]
}

/**
 * Spec for one technology-reference page (`languages.mdx`, `frameworks.mdx`,
 * etc.). `sections` map source categories from `TECH_ICONS` to rendered
 * headings; `example` is an MDX code block shown at the bottom.
 */
export interface PageSpec {
  readonly slug: string
  readonly title: string
  readonly description: string
  readonly intro: string
  readonly sections: readonly PageSection[]
  readonly example: string
}

/**
 * MDX import line every generated docs page needs at the top.
 */
export const MDX_IMPORT_THEME = "import { Icon, TechIconTable } from '@ciderpress/ui/theme'"

/**
 * Swatches shown on `docs/references/icons/colors.mdx`.
 */
export const ICON_COLORS: readonly ColorSpec[] = [
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

/**
 * Supported icon sets shown on `docs/references/icons/overview.mdx`.
 */
export const ICON_SETS: readonly IconSetSpec[] = [
  {
    prefix: 'pixelarticons',
    name: 'Pixelarticons',
    url: 'https://pixelarticons.com',
    bestFor: 'Sidebar icons, UI chrome',
    example: 'pixelarticons:book-open',
  },
  {
    prefix: 'pixel',
    name: 'Pixel Icons',
    url: 'https://icon-sets.iconify.design/pixel/',
    bestFor: 'Social/brand glyphs, pixel-art UI',
    example: 'pixel:slack',
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

/**
 * One technology-reference page per entry. Examples use {@link codeFence}
 * so no backtick escaping is needed in the source.
 */
export const PAGE_SPECS: readonly PageSpec[] = [
  {
    slug: 'languages',
    title: 'Languages',
    description: 'Technology tags for programming languages.',
    intro: 'Programming language tags for workspace cards.',
    sections: [{ heading: 'Languages', categoryNames: ['Languages'] }],
    example: codeFence({
      lang: 'ts',
      body: `packages: [
  {
    title: 'Core',
    icon: 'devicon:typescript',
    description: 'Shared business logic',
    tags: ['typescript'],
    path: '/packages/core',
  },
  {
    title: 'ML Pipeline',
    icon: 'simple-icons:python',
    description: 'Data processing and model training',
    tags: ['python', 'pytorch'],
    path: '/packages/ml',
  },
]`,
    }),
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
    example: codeFence({
      lang: 'ts',
      body: `apps: [
  {
    title: 'Web',
    icon: 'devicon:nextjs',
    description: 'Next.js frontend application',
    tags: ['nextjs', 'react', 'typescript'],
    path: '/apps/web',
  },
  {
    title: 'API',
    icon: 'devicon:hono',
    description: 'Edge-ready REST API',
    tags: ['hono', 'typescript'],
    path: '/apps/api',
  },
]`,
    }),
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
    example: codeFence({
      lang: 'ts',
      body: `packages: [
  {
    title: 'DB',
    icon: 'devicon:postgresql',
    description: 'Database client and schema definitions',
    tags: ['postgresql', 'prisma'],
    path: '/packages/db',
  },
]`,
    }),
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
    example: codeFence({
      lang: 'ts',
      body: `apps: [
  {
    title: 'API',
    icon: 'devicon:hono',
    description: 'Edge API deployed to Cloudflare Workers',
    tags: ['hono', 'cloudflare', 'docker'],
    path: '/apps/api',
  },
]`,
    }),
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
    example: codeFence({
      lang: 'ts',
      body: `packages: [
  {
    title: 'UI',
    icon: 'devicon:react',
    description: 'Shared component library',
    tags: ['react', 'tailwindcss', 'storybook', 'vitest'],
    path: '/packages/ui',
  },
]`,
    }),
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
    example: codeFence({
      lang: 'ts',
      body: `packages: [
  {
    title: 'AI',
    icon: 'simple-icons:openai',
    description: 'LLM orchestration and prompt management',
    tags: ['openai', 'ai-sdk', 'typescript'],
    path: '/packages/ai',
  },
]`,
    }),
  },
]
