import { autoGenHeader } from '../lib/auto-gen-header.ts'
import { codeFence, frontmatter } from '../lib/mdx.ts'
import type { ColorSpec, IconSetSpec, PageSpec } from './data.ts'
import { ICON_COLORS, ICON_SETS, MDX_IMPORT_THEME, PAGE_SPECS } from './data.ts'
import type { Category, TechEntry } from './parse.ts'
import { countEntries, findCategories } from './parse.ts'

const HEADER = autoGenHeader({ cmd: 'lauf run docs', style: 'jsx' })

/**
 * Render one technology-reference page (`languages.mdx`, `frameworks.mdx`,
 * etc.). Sections without any matched entries are dropped.
 * @param spec - the page spec describing headings and source categories
 * @param allCategories - every category parsed from `tech-map.ts`
 * @returns the MDX page body, terminated by a newline
 */
export function renderTechPage(spec: PageSpec, allCategories: readonly Category[]): string {
  const sections = spec.sections
    .map((s) => {
      const cats = findCategories(allCategories, s.categoryNames)
      const entries = cats.flatMap((c) => c.entries)
      if (entries.length === 0) {
        return ''
      }
      return `## ${s.heading}\n\n${iconTable(entries)}`
    })
    .filter((s) => s.length > 0)

  return `${frontmatter({ title: spec.title, description: spec.description })}

${MDX_IMPORT_THEME}

${HEADER}

# ${spec.title}

${spec.intro}

${sections.join('\n')}

## Example

${spec.example}
`
}

/**
 * Render the technology overview page that links out to every
 * technology-reference page with a count and a few sample entries.
 * @param allCategories - every category parsed from `tech-map.ts`
 * @returns the MDX page body, terminated by a newline
 */
export function renderTechOverview(allCategories: readonly Category[]): string {
  const pageRows = PAGE_SPECS.map((spec) => {
    const cats = spec.sections.flatMap((s) => findCategories(allCategories, s.categoryNames))
    const count = countEntries(cats)
    const examples = cats
      .slice(0, 3)
      .flatMap((c) => c.entries.slice(0, 1))
      .map((e) => e.label)
      .join(', ')
    return `| [${spec.title}](/reference/technology/${spec.slug}) | ${count} | ${examples}, etc. |`
  }).join('\n')

  const totalCount = countEntries(allCategories)

  return `${frontmatter({ title: 'Technology Tags', description: 'How technology tags map to icons on workspace cards.' })}

${MDX_IMPORT_THEME}

${HEADER}

# Technology Tags

Workspace cards display technology tags — small labels with an icon and name that indicate the tech stack of an app or package. ciderpress ships with a curated map of **${totalCount} technologies** that auto-resolve to the correct icon and display label.

## How it works

Add tag keys to the \`tags\` array on any workspace item:

${codeFence({
  lang: 'ts',
  body: `packages: [
  {
    title: 'API',
    icon: 'devicon:hono',
    description: 'REST API with typed routes',
    tags: ['hono', 'typescript', 'postgresql'],
    path: '/apps/api',
  },
]`,
})}

Each tag key is looked up in the built-in tech map. A match renders the icon and display label (e.g., \`hono\` renders as <Icon icon="simple-icons:hono" width={14} height={14} /> **Hono**). Unrecognized tags render as plain text without an icon.

## Tag categories

Tags are organized into the following categories:

| Category | Count | Covers |
| -------- | ----- | ------ |
${pageRows}

## Adding a new tag

Add an entry to the \`TECH_ICONS\` constant in \`packages/ui/src/theme/icons/tech-map.ts\`:

${codeFence({
  lang: 'ts',
  body: `export const TECH_ICONS = {
  // ...existing entries
  'my-tech': { icon: 'simple-icons:mytech', label: 'My Tech' },
} as const satisfies Record<string, { readonly icon: string; readonly label: string }>`,
})}

Then regenerate these docs:

${codeFence({ lang: 'bash', body: 'lauf run docs' })}

Prefer \`devicon\` for new entries — it provides colored brand logos for most technologies. Fall back to \`logos\`, \`vscode-icons\`, or \`material-icon-theme\` when devicon has no match, and \`simple-icons\` as a last resort (monochrome).
`
}

/**
 * Render the icons reference overview page — the table of supported icon
 * sets plus prose explaining where icons appear across the generated site.
 * @returns the MDX page body, terminated by a newline
 */
export function renderOverview(): string {
  const setRows = ICON_SETS.map(iconSetRow).join('\n')
  const setLinks = ICON_SETS.map(iconSetLink).join('\n')

  return `${frontmatter({ title: 'Icons', description: 'Supported icon sets and how to use them across your site.' })}

${MDX_IMPORT_THEME}

${HEADER}

# Icons

ciderpress uses [Iconify](https://iconify.design) for all icon rendering. Icons are resolved offline at build time — no external requests are made.

## Format

All icon identifiers use the \`prefix:name\` pattern:

${codeFence({
  lang: '',
  body: `pixelarticons:book-open
devicon:typescript
simple-icons:react`,
})}

The prefix selects the icon set, and the name selects the specific icon within that set.

## Supported icon sets

Nine icon collections are bundled and available out of the box:

<table>
<thead>
<tr>
<th style={{ width: 48, textAlign: 'center' }}></th>
<th>Prefix</th>
<th>Set</th>
<th>Best for</th>
</tr>
</thead>
<tbody>
${setRows}
</tbody>
</table>

## Where icons are used

Icons appear in several places across the generated site:

### Sidebar icon rail

Top-level sections display an icon in the collapsed sidebar rail. Set via the \`icon\` field on a section entry:

${codeFence({
  lang: 'ts',
  body: `{
  title: 'Guides',
  prefix: '/guides',
  from: 'docs/guides/*.md',
  icon: 'pixelarticons:book-open',
}`,
})}

Only top-level sections (depth 0) render icons. Nested sections ignore the \`icon\` field.

### Navigation bar

When using explicit nav items, each top-level item requires an \`icon\`:

${codeFence({
  lang: 'ts',
  body: `nav: [
  { title: 'Guides', link: '/guides', icon: 'pixelarticons:book-open' },
  { title: 'API', link: '/api', icon: 'pixelarticons:terminal' },
]`,
})}

With \`nav: 'auto'\`, icons are inherited from the corresponding section.

### Workspace cards

Workspace items (\`apps\`, \`packages\`, \`workspaces\`) display an icon on their home page card and landing page:

${codeFence({
  lang: 'ts',
  body: `apps: [
  {
    title: 'API',
    icon: 'devicon:hono',
    description: 'REST API with typed routes',
    path: '/apps/api',
  },
]`,
})}

### Feature cards

Home page feature cards can display an icon:

${codeFence({
  lang: 'ts',
  body: `features: [
  {
    title: 'Getting Started',
    description: 'Everything you need to set up and start building.',
    link: '/getting-started',
    icon: 'pixelarticons:speed-fast',
  },
]`,
})}

### Technology tags

Workspace cards display technology tags with auto-resolved icons. See the [Technology Tags](/reference/technology/overview) reference for the full list of supported tag names.

## Validation

Icons are validated at config load time. An icon must:

- Contain exactly one \`:\` separator
- Use a recognized \`prefix\` (one of the nine bundled sets)

Invalid icons produce a config error with type \`invalid_icon\`.

## Browsing icons

To find the right icon, browse each set's catalog:

${setLinks}

Or search across all sets on [icon-sets.iconify.design](https://icon-sets.iconify.design).
`
}

/**
 * Render the icon-colors reference page — a swatch table plus usage
 * examples for the `color` field on workspace and feature card icons.
 * @returns the MDX page body, terminated by a newline
 */
export function renderColors(): string {
  const colorRows = ICON_COLORS.map(colorRow).join('\n')

  return `${frontmatter({ title: 'Icon Colors', description: 'Available icon color classes for workspace and feature cards.' })}

${MDX_IMPORT_THEME}

${HEADER}

# Icon Colors

Workspace cards and feature cards support a \`color\` field inside the \`icon\` object that applies a CSS color class to the icon. This controls the accent color shown behind or around the icon on cards.

## Available colors

<table>
<thead>
<tr>
<th style={{ width: 56 }}>Swatch</th>
<th>Value</th>
<th>CSS Class</th>
<th>Use case</th>
</tr>
</thead>
<tbody>
${colorRows}
</tbody>
</table>

## Usage

Set \`color\` on a workspace item icon:

${codeFence({
  lang: 'ts',
  body: `apps: [
  {
    title: 'API',
    icon: { id: 'devicon:hono', color: 'blue' },
    description: 'REST API with typed routes',
    path: '/apps/api',
  },
]`,
})}

Or on a card config within a section entry:

${codeFence({
  lang: 'ts',
  body: `{
  title: 'API',
  link: '/apps/api',
  card: {
    icon: { id: 'devicon:hono', color: 'blue' },
    description: 'REST API with typed routes',
  },
}`,
})}

## Feature card colors

Feature cards on the home page use the same color values via the \`color\` field on a \`Feature\` icon:

${codeFence({
  lang: 'ts',
  body: `features: [
  {
    title: 'Getting Started',
    icon: { id: 'pixelarticons:speed-fast', color: 'purple' },
    description: 'Set up and start building.',
    link: '/getting-started',
  },
]`,
})}

The CSS class for feature cards follows the pattern \`.cp-card__icon--{color}\`.

## Default behavior

When \`color\` is omitted (or when icon is a plain string like \`'devicon:hono'\`), the icon renders with its native colors (for multi-color icon sets like \`devicon\` and \`skill-icons\`) or inherits \`currentColor\` (for monochrome sets like \`simple-icons\` and \`pixelarticons\`).
`
}

/**
 * Render the `<TechIconTable>` MDX component for a set of tech entries.
 * @param entries - the entries to include in the table
 * @returns the inline MDX expression
 * @private
 */
function iconTable(entries: readonly TechEntry[]): string {
  const json = JSON.stringify(entries.map((e) => ({ tag: e.key, icon: e.icon, label: e.label })))
  return `<TechIconTable entries={${json}} />`
}

/**
 * Render one row of the supported-icon-sets table.
 * @param s - the icon set spec
 * @returns the `<tr>` markup
 * @private
 */
function iconSetRow(s: IconSetSpec): string {
  return `<tr><td style={{ textAlign: 'center' }}><Icon icon="${s.example}" width={20} height={20} /></td><td><code>${s.prefix}</code></td><td><a href="${s.url}">${s.name}</a></td><td>${s.bestFor}</td></tr>`
}

/**
 * Render one entry in the bullet list of icon set catalog links.
 * @param s - the icon set spec
 * @returns the bullet line
 * @private
 */
function iconSetLink(s: IconSetSpec): string {
  return `- **${s.prefix}** — [${s.url.replace('https://', '')}](${s.url})`
}

/**
 * Render one row of the color swatch table.
 * @param c - the color spec
 * @returns the `<tr>` markup
 * @private
 */
function colorRow(c: ColorSpec): string {
  return `<tr><td><div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 4, background: '${c.bg}', color: '${c.hex}' }}><Icon icon="pixelarticons:heart" width={18} height={18} /></div></td><td><code>${c.name}</code></td><td><code>{'.cp-card__icon--${c.name}'}</code></td><td>${c.useCase}</td></tr>`
}
