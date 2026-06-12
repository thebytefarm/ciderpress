import type { IconColor, ThemeConfig, CiderpressThemeInput } from '@ciderpress/theme'
import type React from 'react'

export type {
  ThemeConfig,
  ThemeName,
  ColorMode,
  ThemeColors,
  IconColor,
  CiderpressThemeInput,
} from '@ciderpress/theme'

/**
 * Installed Iconify icon-set prefixes.
 *
 * Must stay in sync with `@iconify-json/*` packages in root `package.json`.
 */
export type IconPrefix =
  | 'catppuccin'
  | 'devicon'
  | 'logos'
  | 'material-icon-theme'
  | 'mdi'
  | 'pixelarticons'
  | 'simple-icons'
  | 'skill-icons'
  | 'vscode-icons'

/**
 * Iconify icon identifier — `"prefix:name"` where prefix matches an installed set.
 *
 * @example `"devicon:hono"`, `"pixelarticons:device-mobile"`
 * @see https://icon-sets.iconify.design/
 */
export type IconId = `${IconPrefix}:${string}`

/**
 * Image-form icon — points at a static asset (SVG, PNG, …) shipped in
 * the project's `public/` directory or a CDN URL. Use when the brand
 * mark isn't in any installed Iconify set.
 *
 * @example
 * ```ts
 * icon: { src: '/icon.svg', alt: 'maltty' }
 * ```
 */
export interface IconImage {
  /**
   * Absolute path or URL to the image asset. Relative paths resolve
   * against the site root (e.g. `/icon.svg` → `public/icon.svg`).
   */
  readonly src: string
  /**
   * Alt text for screen readers. Defaults to an empty string (decorative).
   */
  readonly alt?: string
}

/**
 * Unified icon configuration.
 *
 * Accepts three forms:
 *
 * - **Iconify id** (`"devicon:hono"`) — string from an installed icon set.
 *   Color defaults to purple. Browse icons at https://icon-sets.iconify.design/
 * - **Iconify object** (`{ id, color }`) — explicit color from the 8-colour palette.
 * - **Image object** (`{ src, alt }`) — static image (SVG/PNG/…) shipped in
 *   the project's `public/` directory or a CDN URL. Bypasses Iconify entirely.
 *
 * For inline React JSX as an icon, use `logo` instead — it accepts a
 * function returning `ReactNode` and re-renders on theme changes.
 *
 * Auto-generated section cards rotate through these colors when an
 * Iconify icon is used:
 * purple → blue → green → amber → cyan → red → pink → slate
 *
 * @example
 * ```ts
 * icon: 'devicon:react'                            // Iconify, purple
 * icon: { id: 'devicon:nextjs', color: 'blue' }    // Iconify, blue
 * icon: { src: '/icon.svg', alt: 'maltty' }        // Static image
 * ```
 */
export type IconConfig = IconId | { readonly id: IconId; readonly color?: IconColor } | IconImage

/**
 * File-system path (absolute or relative).
 */
type FilePath = string

/**
 * All user-project paths derived from a single root directory.
 *
 * Materialised at CLI runtime via `createPaths(dir)` in `@ciderpress/cli` —
 * this interface lives in `@ciderpress/config` so plugins (e.g. `@ciderpress/ui`)
 * can type their inputs without depending on the CLI.
 */
export interface Paths {
  readonly repoRoot: string
  readonly outputRoot: string
  readonly contentDir: string
  readonly publicDir: string
  readonly distDir: string
  readonly cacheDir: string
}

/**
 * URL path segment (e.g. `"/api"`, `"/guides/auth"`).
 */
type UrlPath = string

/**
 * Result type for error handling without exceptions.
 *
 * Success: `[null, value]`
 * Failure: `[error, null]`
 *
 * @example
 * ```ts
 * const [error, value] = loadConfig(path)
 * if (error) return [error, null]
 * ```
 */
export type Result<T, E = Error> = readonly [E, null] | readonly [null, T]

/**
 * Rspress frontmatter fields injectable at build time.
 *
 * Schema: `frontmatterSchema` in schema.ts validates this shape with
 * `.strict()` — unknown keys are rejected at config-load time. To inject
 * custom YAML fields into a page, add them to the source `.md`/`.mdx`
 * frontmatter directly; this type is the typed surface for config-time
 * injection only.
 */
export interface Frontmatter {
  /**
   * Page title — overrides the derived title from heading or filename.
   */
  readonly title?: string
  /**
   * Template applied to the document `<title>` tag. `false` disables
   * the global template for this page.
   */
  readonly titleTemplate?: string | boolean
  /**
   * Page description — used for `<meta name="description">` and as the
   * default OpenGraph description.
   */
  readonly description?: string
  /**
   * Layout to render the page with — defaults to Rspress's `'doc'` layout.
   * Use `'home'` to opt this page into the home-page layout.
   */
  readonly layout?: string
  /**
   * Show the docs sidebar on this page. Defaults to `true` for `doc`
   * layout pages; set `false` to render full-bleed.
   */
  readonly sidebar?: boolean
  /**
   * Show the right-hand table-of-contents aside. `'left'` places it on
   * the left instead. Defaults to `true`.
   */
  readonly aside?: boolean | 'left'
  /**
   * Outline rendering: `false` hides the outline, a number caps the
   * heading depth, a `[min, max]` tuple sets a heading-depth range,
   * `'deep'` includes every heading.
   */
  readonly outline?: false | number | [number, number] | 'deep'
  /**
   * Show the topbar on this page. Defaults to `true`.
   */
  readonly navbar?: boolean
  /**
   * Show the edit-this-page link under the article. Defaults to `true`
   * when `site.edit` is configured.
   */
  readonly editLink?: boolean
  /**
   * Show the "last updated" timestamp under the article. Defaults to
   * `false`.
   */
  readonly lastUpdated?: boolean
  /**
   * Show the site footer on this page. Defaults to `true`.
   */
  readonly footer?: boolean
  /**
   * Extra class name applied to the page wrapper — useful for one-off
   * layout tweaks.
   */
  readonly pageClass?: string
  /**
   * Per-page `<head>` injections — array of `[tagName, attrs]` tuples
   * appended to the document head.
   */
  readonly head?: readonly [string, Record<string, string>][]
}

/**
 * Navigation item for the top nav bar.
 *
 * Schema: `navItemSchema` in schema.ts validates this shape.
 * The schema uses `z.ZodType<NavItem>` to enforce consistency.
 */
export interface NavItem {
  /**
   * Visible label rendered in the topbar.
   */
  readonly title: string
  /**
   * Destination URL — relative path or absolute URL. Required for leaf
   * items; omit when `items` is provided (dropdown parent).
   */
  readonly link?: string
  /**
   * Nested items — when present, this entry renders as a dropdown menu.
   */
  readonly items?: readonly NavItem[]
  /**
   * Regex string matched against the current path to mark this item as
   * active. When omitted, an exact `link` match is used.
   */
  readonly activeMatch?: string
}

/**
 * Title configuration — static or derived from source files.
 *
 * Schema: `titleConfigSchema` in schema.ts validates this shape.
 *
 * **Static title**:
 * ```ts
 * title: "Getting Started"
 * ```
 *
 * **Derived title**:
 * ```ts
 * title: { from: 'auto', transform: (text, slug) => text.toUpperCase() }
 * ```
 */
export type TitleConfig =
  | string
  | {
      /**
       * Title derivation strategy for auto-discovered children.
       * - `"auto"` (default) — frontmatter > heading > filename fallback chain
       * - `"filename"` — kebab-to-title from filename only
       * - `"heading"` — first `# heading` in the file only
       * - `"frontmatter"` — `title` field from YAML frontmatter only
       */
      readonly from: 'auto' | 'filename' | 'heading' | 'frontmatter'
      /**
       * Transform function applied after derivation.
       * @param text - The derived title
       * @param slug - The filename slug (without extension)
       * @returns Transformed title for sidebar display
       */
      readonly transform?: (text: string, slug: string) => string
    }

/**
 * Controls how an entry appears as a card on its parent section's
 * auto-generated landing page.
 *
 * Schema: `cardConfigSchema` in schema.ts validates this shape.
 * A compile-time guard in schema.ts ensures these stay in sync.
 *
 * @example
 * ```ts
 * card: {
 *   icon: 'devicon:hono',
 *   scope: 'apps/',
 *   description: 'Hono REST API with RPC-typed routes',
 *   tags: ['Hono', 'REST', 'Serverless'],
 *   badge: { src: '/logos/vercel.svg', alt: 'Vercel' },
 * }
 * ```
 */
export interface CardConfig {
  /**
   * Card icon — Iconify id or `{ id, color }` object. Defaults to a
   * rotating color based on the parent section's position.
   */
  readonly icon?: IconConfig
  /**
   * Scope label (e.g. `'apps/'`, `'packages/'`) rendered above the
   * card title as a small kicker.
   */
  readonly scope?: string
  /**
   * One-line description rendered under the card title.
   */
  readonly description?: string
  /**
   * Tag chips rendered below the description.
   */
  readonly tags?: readonly string[]
  /**
   * Logo badge rendered in the card's top-right corner.
   */
  readonly badge?: {
    /**
     * URL to the badge image (typically an SVG logo).
     */
    readonly src: string
    /**
     * Alt text for the badge image.
     */
    readonly alt: string
  }
}

/**
 * A single call-to-action button on the home page hero.
 *
 * Schema: `heroActionSchema` in schema.ts validates this shape.
 */
export interface HeroAction {
  /**
   * Visual treatment — `'brand'` is the primary filled button,
   * `'alt'` is the secondary outline button.
   */
  readonly theme: 'brand' | 'alt'
  /**
   * Button label.
   */
  readonly text: string
  /**
   * Destination URL — relative path or absolute URL.
   */
  readonly link: string
}

/**
 * A persistent link rendered above or below the sidebar nav tree.
 *
 * Schema: `sidebarLinkSchema` in schema.ts validates this shape.
 */
export interface SidebarLink {
  /**
   * Visible label rendered in the sidebar.
   */
  readonly text: string
  /**
   * Destination URL — relative path or absolute URL.
   */
  readonly link: string
  /**
   * Optional icon rendered to the left of the label.
   */
  readonly icon?: IconConfig
  /**
   * Button style — `'brand'` is filled, `'alt'` is outline, `'ghost'`
   * is text-only. Defaults to `'ghost'`.
   */
  readonly style?: 'brand' | 'alt' | 'ghost'
  /**
   * Button shape — `'square'`, `'rounded'`, or `'circle'`. Defaults
   * to `'rounded'`.
   */
  readonly shape?: 'square' | 'rounded' | 'circle'
}

/**
 * Sidebar configuration.
 *
 * Schema: `sidebarConfigSchema` in schema.ts validates this shape.
 *
 * @example
 * ```ts
 * sidebar: {
 *   above: [
 *     { text: 'Home', link: '/', icon: 'pixelarticons:home' },
 *   ],
 *   below: [
 *     { text: 'GitHub', link: 'https://github.com/...', icon: 'pixelarticons:github' },
 *     { text: 'Discord', link: 'https://discord.gg/...', icon: 'pixelarticons:message' },
 *   ],
 * }
 * ```
 */
export interface SidebarConfig {
  /**
   * Persistent links rendered above the sidebar nav tree.
   */
  readonly above?: readonly SidebarLink[]
  /**
   * Persistent links rendered below the sidebar nav tree.
   */
  readonly below?: readonly SidebarLink[]
}

/**
 * A single node in the information architecture (sidebar/nav tree).
 *
 * Schema: `entrySchema` in schema.ts validates this shape.
 * The schema uses `z.ZodType<Section>` to enforce consistency.
 *
 * **Page — explicit file**:
 * ```ts
 * { title: 'Architecture', path: '/architecture', include: 'docs/architecture.md' }
 * ```
 *
 * **Page — inline/generated content**:
 * ```ts
 * { title: 'Overview', path: '/api/overview', content: '# API Overview\n...' }
 * ```
 *
 * **Section — explicit children**:
 * ```ts
 * { title: 'Guides', items: [ ... ] }
 * ```
 *
 * **Section — auto-discovered from glob**:
 * ```ts
 * { title: 'Guides', path: '/guides', include: 'docs/guides/*.md' }
 * ```
 */
export interface Section {
  /**
   * Display title — either a static string or a derivation rule that
   * produces titles from frontmatter, headings, or filenames.
   */
  readonly title: TitleConfig
  /**
   * One-line description rendered on the auto-generated landing page
   * for this section.
   */
  readonly description?: string
  /**
   * URL path for this section (e.g. `'/guides'`). When omitted, the
   * section is sidebar-only (its children get their own paths).
   */
  readonly path?: string
  /**
   * Glob pattern(s) that source content from the file system. When
   * present, children are auto-discovered. Mutually exclusive with
   * `content` and inline `items` containing `include` chains.
   */
  readonly include?: string | readonly string[]
  /**
   * Inline page content — a string of Markdown/MDX or a function that
   * returns it. Use for generated pages (changelogs, indexes) that
   * don't live on disk.
   */
  readonly content?: string | (() => string | Promise<string>)
  /**
   * Explicit child nodes. Mutually exclusive with `include` (auto-
   * discovery) — pick one source of truth per section.
   */
  readonly items?: readonly Section[]
  /**
   * When `true`, render an auto-generated landing page at this section's
   * `path` listing its children as cards. Defaults to `true` for
   * sections with no `content`.
   */
  readonly landing?: boolean
  /**
   * Show this section as a collapsible group in the sidebar. Defaults
   * to `true`.
   */
  readonly collapsible?: boolean
  /**
   * Glob patterns of files to exclude when `include` is auto-discovering.
   */
  readonly exclude?: readonly string[]
  /**
   * Hide this section (and all its children) from the sidebar.
   * Useful for routes that are linked from content but shouldn't
   * appear in nav.
   */
  readonly hidden?: boolean
  /**
   * Frontmatter merged into every page resolved under this section.
   * Per-file frontmatter takes precedence over these defaults.
   */
  readonly frontmatter?: Frontmatter
  /**
   * Sort strategy applied when `include` auto-discovers children.
   * - `'default'` — frontmatter `order` then alphabetical title
   * - `'alpha'` — alphabetical by title
   * - `'filename'` — alphabetical by source filename
   * - `'none'` — preserve glob-discovery order
   * - Custom comparator — sort by your own rule
   */
  readonly sort?:
    | 'default'
    | 'alpha'
    | 'filename'
    | 'none'
    | ((a: ResolvedPage, b: ResolvedPage) => number)
  /**
   * Recurse into subdirectories when `include` auto-discovers content.
   * Defaults to `true`.
   */
  readonly recursive?: boolean
  /**
   * Filename (relative to the section's directory) treated as the
   * landing page instead of generating one. Common values: `'index.md'`,
   * `'README.md'`.
   */
  readonly entryFile?: string
  /**
   * Icon rendered on the section's card and (when configured) in the
   * sidebar.
   */
  readonly icon?: IconConfig
  /**
   * Card appearance overrides — controls how this entry renders on its
   * parent section's landing page.
   */
  readonly card?: CardConfig
  /**
   * Render this section as a sidebar-rooted island — its children are
   * shown in the sidebar only when the user is inside the section.
   */
  readonly standalone?: boolean
  /**
   * Mark this section as a sidebar root — only one root can be active
   * at a time, and the topbar treats it as the active workspace.
   */
  readonly root?: boolean
}

/**
 * Workspace item representing an app or package in the monorepo.
 *
 * Schema: `workspaceItemSchema` in schema.ts validates this shape.
 *
 * @example
 * ```ts
 * {
 *   title: 'API',
 *   icon: 'devicon:hono',
 *   description: 'Hono REST API serving all client applications',
 *   tags: ['hono', 'react', 'vercel'],
 *   path: '/apps/api',
 *   include: 'docs/*.md',
 *   sort: 'alpha',
 * }
 * ```
 */
export interface Workspace {
  /**
   * Workspace display name (e.g. `'API'`, `'@acme/sdk'`).
   */
  readonly title: string
  /**
   * Icon rendered on the workspace card and landing page.
   */
  readonly icon?: IconConfig
  /**
   * One-line description rendered under the workspace title on cards
   * and the workspace landing page.
   */
  readonly description: string
  /**
   * Tag chips rendered below the description on the workspace card.
   */
  readonly tags?: readonly string[]
  /**
   * Logo badge rendered in the card's top-right corner.
   */
  readonly badge?: {
    /**
     * URL to the badge image (typically an SVG logo).
     */
    readonly src: string
    /**
     * Alt text for the badge image.
     */
    readonly alt: string
  }
  /**
   * URL path the workspace mounts under (e.g. `'/apps/api'`).
   */
  readonly path: string
  /**
   * Glob pattern(s) that source content from the file system. When
   * present, child pages are auto-discovered.
   */
  readonly include?: string | readonly string[]
  /**
   * Explicit child sections — overrides `include`-based auto-discovery
   * when both are set.
   */
  readonly items?: readonly Section[]
  /**
   * Sort strategy applied to auto-discovered children. See `Section.sort`
   * for the strategy values.
   */
  readonly sort?:
    | 'default'
    | 'alpha'
    | 'filename'
    | 'none'
    | ((a: ResolvedPage, b: ResolvedPage) => number)
  /**
   * Glob patterns of files to exclude when `include` is auto-discovering.
   */
  readonly exclude?: readonly string[]
  /**
   * Recurse into subdirectories when `include` auto-discovers content.
   * Defaults to `true`.
   */
  readonly recursive?: boolean
  /**
   * Filename (relative to the workspace's directory) treated as the
   * landing page instead of generating one.
   */
  readonly entryFile?: string
  /**
   * Frontmatter merged into every page under this workspace. Per-file
   * frontmatter wins on conflict.
   */
  readonly frontmatter?: Frontmatter
  /**
   * Per-workspace OpenAPI integration — generates API operation pages
   * under this workspace's `path`.
   */
  readonly openapi?: OpenAPIConfig
}

/**
 * Custom workspace category grouping apps/packages.
 *
 * Schema: `workspaceGroupSchema` in schema.ts validates this shape.
 *
 * @example
 * ```ts
 * {
 *   title: 'Integrations',
 *   description: 'Third-party service connectors',
 *   icon: 'mdi:puzzle',
 *   items: [
 *     { title: 'Stripe', description: 'Payment processing', path: '/integrations/stripe' },
 *   ],
 * }
 * ```
 */
export interface WorkspaceGroup {
  /**
   * Group title — rendered as the section heading on the home page
   * and as the workspace group label in nav.
   */
  readonly title: string
  /**
   * One-line description rendered under the group title.
   */
  readonly description?: string
  /**
   * Icon shown next to the group title (Iconify id only — `{ id, color }`
   * objects are not supported for category icons).
   */
  readonly icon: IconId
  /**
   * Workspaces grouped under this category. Rendered as cards in the
   * order provided.
   */
  readonly items: readonly Workspace[]
  /**
   * Optional URL the group title links to. When omitted, the title is
   * non-interactive.
   */
  readonly link?: string
}

/**
 * A fully resolved page after the sync engine processes the config.
 */
export interface ResolvedPage {
  /**
   * Resolved display title — after title-derivation rules have run.
   */
  readonly title: string
  /**
   * Resolved URL path the page is mounted at.
   */
  readonly link: string
  /**
   * Absolute path to the source file on disk. Absent for inline
   * (generated) pages produced from `content`.
   */
  readonly source?: string
  /**
   * Merged frontmatter — section/workspace defaults plus the page's
   * own frontmatter.
   */
  readonly frontmatter: Frontmatter
}

/**
 * A fully resolved section.
 */
export interface ResolvedSection {
  /**
   * Resolved section title.
   */
  readonly title: string
  /**
   * URL of the section's landing page, if it has one.
   */
  readonly link?: string
  /**
   * Whether this section renders as a collapsible group in the sidebar.
   */
  readonly collapsible?: boolean
  /**
   * Resolved children — pages and nested sections in render order.
   */
  readonly items: readonly (ResolvedPage | ResolvedSection)[]
}

/**
 * Configuration for OpenAPI spec integration.
 */
export interface OpenAPIConfig {
  /**
   * Path to openapi.json relative to repo root.
   */
  readonly spec: FilePath
  /**
   * URL path for API operation pages (e.g., '/api').
   */
  readonly path: UrlPath
  /**
   * Sidebar group title.
   * @default 'API Reference'
   */
  readonly title?: string
  /**
   * How operations appear in the sidebar.
   *
   * - `'method-path'` — shows `GET /users` with method badge and path in code font
   * - `'title'` — shows the operation summary (e.g., "List Users")
   *
   * @default 'method-path'
   */
  readonly sidebarLayout?: 'method-path' | 'title'
}

/**
 * Explicit feature card for the home page.
 *
 * Schema: `featureSchema` in schema.ts validates this shape.
 *
 * @example
 * ```ts
 * {
 *   title: 'Getting Started',
 *   description: 'Everything you need to set up and start building.',
 *   link: '/getting-started',
 *   icon: 'pixelarticons:speed-fast',
 * }
 * ```
 */
export interface Feature {
  /**
   * Feature card title.
   */
  readonly title: string
  /**
   * Body copy rendered under the title.
   */
  readonly description: string
  /**
   * Destination URL when the card is clickable. Omit for static cards.
   */
  readonly link?: string
  /**
   * Icon rendered above the title.
   */
  readonly icon?: IconConfig
}

/**
 * Text truncation configuration for card content.
 *
 * Values represent the maximum number of visible lines before
 * overflow is clipped with an ellipsis via CSS `line-clamp`.
 */
export interface TruncateConfig {
  /**
   * Maximum visible lines for the card title before truncation.
   */
  readonly title?: number
  /**
   * Maximum visible lines for the card description before truncation.
   */
  readonly description?: number
}

/**
 * Layout and styling options for a card grid section on the home page.
 */
export interface HomeGridConfig {
  /**
   * Number of columns in the grid at desktop widths (1–4). Smaller
   * breakpoints automatically reduce this.
   */
  readonly columns?: 1 | 2 | 3 | 4
  /**
   * Line-clamp limits for card text. When omitted, no truncation is
   * applied.
   */
  readonly truncate?: TruncateConfig
  /**
   * Heading rendered above the grid. Omit to use the framework default
   * (or no heading for the workspaces grid).
   */
  readonly heading?: HomeSectionHeading
}

/**
 * Trust strip on the home hero — short lead followed by a list of names.
 *
 * Schema: `trustConfigSchema` in schema.ts validates this shape.
 *
 * @example
 * ```ts
 * trust: { lead: 'Trusted by teams at', names: ['Acme', 'Globex', 'Initech'] }
 * ```
 */
export interface HomeTrustConfig {
  /**
   * Lead phrase rendered before the names (e.g. `'Trusted by teams at'`).
   */
  readonly lead?: string
  /**
   * Company / team names rendered as a comma-separated list after the lead.
   */
  readonly names?: readonly string[]
}

/**
 * Final CTA band on the home page — title, optional subtitle, and up to two actions.
 *
 * Schema: `ctaConfigSchema` in schema.ts validates this shape.
 *
 * @example
 * ```ts
 * cta: {
 *   title: 'Ready to ship?',
 *   subtitle: 'Install ciderpress and write your first page in five minutes.',
 *   actions: [{ theme: 'brand', text: 'Quick start', link: '/getting-started' }],
 * }
 * ```
 */
export interface HomeCtaConfig {
  /**
   * Headline rendered at the top of the CTA band.
   */
  readonly title?: string
  /**
   * Supporting sentence rendered under the headline.
   */
  readonly subtitle?: string
  /**
   * Up to two action buttons rendered below the subtitle. Schema enforces
   * the two-button cap.
   */
  readonly actions?: readonly HeroAction[]
}

/**
 * Section heading shown above a home-page block (features, workspaces, etc.).
 */
export interface HomeSectionHeading {
  /**
   * Eyebrow kicker rendered above the title (small uppercase label —
   * e.g. "Features", "Apps & Packages").
   */
  readonly eyebrow?: string
  /**
   * Heading title — replaces the framework default (e.g. "Built for
   * the way you ship.").
   */
  readonly title?: string
  /**
   * Optional supporting sentence rendered under the title.
   */
  readonly subtitle?: string
}

/**
 * Grid layout + heading customisation for the home-page features block.
 *
 * Carries the standard {@link HomeGridConfig} fields (`columns`,
 * `truncate`, `heading`) and exists as a separate name purely for
 * documentation clarity — the runtime shape is identical.
 */
export interface HomeFeaturesConfig extends HomeGridConfig {}

/**
 * Hero demo block — the visual rendered next to the hero copy.
 *
 * Three concrete shapes:
 *
 * - **Image** (`{ src, alt? }`) — paint a single image inside the
 *   slot's framed container (rounded corners + brand-soft glow shadow
 *   are preserved). Use for product screenshots, illustration assets,
 *   or marketing GIFs.
 * - **Structured terminal** (`{ windowTitle, command, lines }`) — keep
 *   the framework's terminal-style chrome but render your own commands
 *   and output. Each `lines` entry carries a `kind` discriminating the
 *   visual style of the line (`'ok' | 'info' | 'cmt' | 'err'`).
 *
 * @example
 * ```ts
 * heroDemo: { src: '/cli.svg', alt: 'maltty CLI' }
 *
 * heroDemo: {
 *   windowTitle: '~/code/acme — acme dev',
 *   command: 'acme dev',
 *   lines: [
 *     { kind: 'ok', text: 'edge runtime booting in us-east-1' },
 *     { kind: 'info', text: 'watching ./handlers, ./prisma' },
 *     { kind: 'ok', text: 'ready on http://localhost:4321' },
 *   ],
 * }
 * ```
 */
export type HeroDemoConfig = HeroDemoImage | HeroDemoTerminal

/**
 * Image-form hero demo — `<img>` painted inside the demo container.
 */
export interface HeroDemoImage {
  /**
   * Absolute path or URL to the image asset.
   */
  readonly src: string
  /**
   * Alt text for screen readers. Defaults to empty string (decorative)
   * if omitted.
   */
  readonly alt?: string
  /**
   * Explicit width — defaults to `100%` of the container.
   */
  readonly width?: number | string
  /**
   * Explicit height — defaults to `auto`.
   */
  readonly height?: number | string
}

/**
 * Structured terminal-form hero demo — keeps the framework's terminal
 * chrome but uses the supplied command + output lines.
 */
export interface HeroDemoTerminal {
  /**
   * Title shown in the fake window's title bar (e.g. project path +
   * command). Defaults to the framework default when omitted.
   */
  readonly windowTitle?: string
  /**
   * Command rendered after the `$ ` prompt at the top of the output.
   */
  readonly command: string
  /**
   * Output lines rendered below the command, each tagged with a kind
   * that controls its visual style.
   */
  readonly lines: readonly HeroDemoLine[]
}

/**
 * Single line in a structured `HeroDemoTerminal`.
 */
export interface HeroDemoLine {
  /**
   * Line style:
   * - `'ok'`   — success marker (✓ / ▸)
   * - `'info'` — informational marker (▸)
   * - `'cmt'`  — comment / hint line
   * - `'err'`  — error / warning marker (✗)
   */
  readonly kind: 'ok' | 'info' | 'cmt' | 'err'
  /**
   * Line text. Renders verbatim with the prefix glyph in front.
   */
  readonly text: string
}

/**
 * "Show and tell" Split block — title + bullets + visual sample.
 *
 * @example
 * ```ts
 * split: {
 *   eyebrow: 'Configuration',
 *   title: 'One file. Validated. Type-safe.',
 *   body: 'Describe your service in code; Zod validates at boot.',
 *   bullets: [
 *     'Type-safe config with full IntelliSense',
 *     'Hot-reloads on every save',
 *   ],
 *   cta: { text: 'Read the docs', link: '/getting-started/configuration' },
 *   visual: {
 *     language: 'ts',
 *     code: "import { defineConfig } from '@acme/sdk'\n\nexport default defineConfig({ ... })",
 *   },
 * }
 * ```
 */
export interface SplitConfig {
  /**
   * Eyebrow kicker above the title.
   */
  readonly eyebrow?: string
  /**
   * Section title — required.
   */
  readonly title: string
  /**
   * Body copy rendered under the title.
   */
  readonly body?: string
  /**
   * Bulleted checkmark list rendered under the body.
   */
  readonly bullets?: readonly string[]
  /**
   * CTA button rendered at the bottom of the copy column.
   */
  readonly cta?: {
    readonly text: string
    readonly link: string
  }
  /**
   * Visual rendered in the right column. Code blocks are syntax-
   * highlighted with the supplied language hint.
   */
  readonly visual?: SplitVisual
}

/**
 * Visual paired with a `SplitConfig` copy column.
 */
export interface SplitVisual {
  /**
   * Code snippet rendered as a syntax-highlighted preview.
   */
  readonly code: string
  /**
   * Language identifier for syntax highlighting (e.g. `'ts'`, `'tsx'`,
   * `'json'`). Defaults to `'ts'`.
   */
  readonly language?: string
}

/**
 * Identifier for one of the built-in home-page sections. Used by
 * `home.layout` to control render order and visibility.
 */
export type HomeSectionId = 'hero' | 'trust' | 'features' | 'split' | 'workspaces' | 'cta'

/**
 * Default render order for `home.layout` when the field is omitted —
 * matches the historical fixed order before `home.layout` was added.
 * Exposed as a `readonly` constant so consumers writing custom
 * layouts can splice in / omit sections without retyping the list.
 */
export const DEFAULT_HOME_LAYOUT: readonly HomeSectionId[] = Object.freeze([
  'hero',
  'trust',
  'features',
  'split',
  'workspaces',
  'cta',
])

/**
 * Home page layout customization.
 *
 * Schema: `homeConfigSchema` in schema.ts validates this shape.
 *
 * @example
 * ```ts
 * home: {
 *   eyebrow: 'v1.0',
 *   heroDemo: false,
 *   split: false,
 *   features: { columns: 3, heading: { title: 'What you get' } },
 *   workspaces: { columns: 2, truncate: { title: 1, description: 2 } },
 *   trust: { lead: 'Used by', names: ['Acme', 'Globex'] },
 *   cta: { title: 'Ready to ship?', actions: [...] },
 *   layout: ['hero', 'cta', 'features', 'workspaces'],
 * }
 * ```
 */
export interface HomeConfig {
  /**
   * Grid + heading config for the home-page features block. Set
   * `heading.title` to replace the framework default copy.
   */
  readonly features?: HomeFeaturesConfig
  /**
   * Grid layout for the auto-generated workspace cards on the home page.
   */
  readonly workspaces?: HomeGridConfig
  /**
   * Hero demo block — the visual rendered next to the hero copy.
   *
   * - omit → framework default (terminal showing `pnpm ciderpress dev`).
   * - `false` → suppress entirely.
   * - `HeroDemoImage` (`{ src, alt }`) → image painted inside the slot.
   * - `HeroDemoTerminal` (`{ command, lines }`) → keep the terminal
   *   chrome but render your own output.
   */
  readonly heroDemo?: false | HeroDemoConfig
  /**
   * "Show and tell" Split section under the features grid.
   *
   * - omit → framework default (Acme Docs sample config).
   * - `false` → suppress entirely.
   * - `SplitConfig` → fully custom eyebrow / title / bullets / cta / visual.
   */
  readonly split?: false | SplitConfig
  /**
   * Eyebrow text shown above the hero title (e.g. version chip).
   */
  readonly eyebrow?: string
  /**
   * Trust strip rendered between the hero and the features grid.
   */
  readonly trust?: HomeTrustConfig
  /**
   * Final CTA band rendered just above the footer.
   */
  readonly cta?: HomeCtaConfig
  /**
   * Render order for the home-page sections. Omit to use the
   * framework default (`hero → trust → features → split → workspaces
   * → cta`); set to an array of section ids to reorder, suppress, or
   * both — sections not listed are not rendered. Duplicate ids are
   * rejected by the schema.
   *
   * For more flexibility (custom sections, JSX layouts), provide an
   * `index.md` in your content tree with `pageType: home` and import
   * components from `@ciderpress/ui/theme`. The sync engine skips the
   * auto-generated home page whenever an explicit `index.md` exists.
   *
   * @example
   * ```ts
   * // Put the CTA above the features grid and drop the trust strip
   * layout: ['hero', 'cta', 'features', 'workspaces']
   * ```
   */
  readonly layout?: readonly HomeSectionId[]
}

/**
 * Built-in social link icon identifiers.
 *
 * Rspress supports these icons out of the box via `virtual-social-links`.
 * Frozen at module load so the schema (`socialLinkSchema`) can derive its
 * `z.enum(...)` from the same array — single source of truth for the
 * enum and the {@link SocialLinkIcon} union below.
 */
export const SOCIAL_LINK_ICONS = Object.freeze([
  'lark',
  'discord',
  'facebook',
  'github',
  'instagram',
  'linkedin',
  'slack',
  'x',
  'youtube',
  'wechat',
  'qq',
  'juejin',
  'zhihu',
  'bilibili',
  'weibo',
  'gitlab',
  'X',
  'bluesky',
  'npm',
] as const)

/**
 * Built-in social link icon identifier.
 *
 * Rspress supports these icons out of the box via `virtual-social-links`.
 */
export type SocialLinkIcon = (typeof SOCIAL_LINK_ICONS)[number]

/**
 * Supported `mode` discriminants on `SocialLink`. See {@link SocialLink} for
 * the per-mode semantics of the `content` field.
 */
export const SOCIAL_LINK_MODES = Object.freeze(['link', 'text', 'img', 'dom'] as const)

/**
 * Render mode for a social link entry.
 */
export type SocialLinkMode = (typeof SOCIAL_LINK_MODES)[number]

/**
 * A social link shown in the navigation bar.
 *
 * Schema: `socialLinkSchema` in schema.ts validates this shape.
 *
 * @example
 * ```ts
 * socialLinks: [
 *   { icon: 'github', mode: 'link', content: 'https://github.com/acme' },
 *   { icon: 'discord', mode: 'link', content: 'https://discord.gg/acme' },
 * ]
 * ```
 */
export interface SocialLink {
  /**
   * Built-in icon name, or `{ svg }` object carrying a raw inline SVG
   * string for custom icons not in the built-in set.
   */
  readonly icon: SocialLinkIcon | { readonly svg: string }
  /**
   * How `content` is interpreted:
   * - `'link'` — `content` is a URL the icon links to
   * - `'text'` — `content` is rendered as text alongside the icon
   * - `'img'` — `content` is the URL of an image to render
   * - `'dom'` — `content` is a raw HTML fragment to render
   */
  readonly mode: SocialLinkMode
  /**
   * The link href, label, image URL, or HTML — meaning depends on `mode`.
   */
  readonly content: string
}

/**
 * Site footer shown below all page content.
 *
 * Schema: `footerConfigSchema` in schema.ts validates this shape.
 *
 * @example
 * ```ts
 * footer: {
 *   message: 'Built with ciderpress',
 *   copyright: 'Copyright © 2025 Acme Inc.',
 * }
 * ```
 */
export interface FooterConfig {
  /**
   * Tagline rendered in the footer's left column.
   */
  readonly message?: string
  /**
   * Copyright line rendered at the bottom of the footer.
   */
  readonly copyright?: string
  /**
   * When `true`, render `config.socialLinks` icons in the footer.
   * Defaults to `false` so social links only appear in the topbar.
   */
  readonly socials?: boolean
}

/**
 * Announcement banner rendered above the topbar.
 *
 * Schema: `announcementConfigSchema` in schema.ts validates this shape.
 *
 * @example
 * ```ts
 * site: {
 *   announcement: {
 *     id: 'v1-launch',
 *     lead: 'NEW',
 *     message: 'ciderpress 1.0 is out.',
 *     cta: { href: '/changelog', label: 'See changes' },
 *   },
 * }
 * ```
 */
export interface AnnouncementConfig {
  /**
   * Stable id — when present, dismissal persists in localStorage.
   */
  readonly id?: string
  /**
   * Highlighted lead phrase rendered before the message (e.g. "NEW").
   */
  readonly lead?: string
  /**
   * Body text of the announcement.
   */
  readonly message: string
  /**
   * Optional call-to-action link appended after the message.
   */
  readonly cta?: {
    /**
     * Destination URL for the CTA — relative path or absolute URL.
     */
    readonly href: string
    /**
     * Visible label for the CTA link.
     */
    readonly label: string
  }
  /**
   * When `true`, hides the dismiss button.
   */
  readonly persistent?: boolean
}

/**
 * Edit-this-page link configuration. Renders an "Edit on GitHub"-style
 * action under every doc page when set.
 */
export interface SiteEditConfig {
  /**
   * Destination repository (e.g. `'acme/docs'`) or full URL template.
   * The string `{path}` is substituted with the current page's relative path.
   */
  readonly repo: string
  /**
   * Branch to link against. Defaults to `'main'`.
   */
  readonly branch?: string
  /**
   * Subdirectory inside the repo containing the docs. Defaults to repo root.
   */
  readonly directory?: string
  /**
   * Override the visible label. Defaults to `'Edit this page on GitHub'`.
   */
  readonly label?: string
}

/**
 * Report-an-issue link configuration. Renders an action under every doc
 * page when set.
 */
export interface SiteReportConfig {
  /**
   * Destination repository (e.g. `'acme/docs'`) or full URL.
   */
  readonly repo: string
  /**
   * Override the visible label. Defaults to `'Report an issue'`.
   */
  readonly label?: string
}

/**
 * Sidebar promo card rendered at the bottom of the docs sidebar.
 */
export interface SiteSidebarPromoConfig {
  /**
   * Promo card headline.
   */
  readonly title: string
  /**
   * Body copy rendered under the headline.
   */
  readonly body: string
  /**
   * CTA button rendered at the bottom of the promo card.
   */
  readonly cta: {
    /**
     * Visible label on the CTA button.
     */
    readonly text: string
    /**
     * Destination URL for the CTA — relative path or absolute URL.
     */
    readonly href: string
  }
}

/**
 * Call-to-action button rendered on the topbar (and in the mobile nav).
 */
export interface SiteCtaConfig {
  /**
   * Visible label on the topbar CTA button.
   */
  readonly text: string
  /**
   * Destination URL — relative path or absolute URL.
   */
  readonly href: string
}

/**
 * One column of footer links in the site footer grid.
 */
export interface SiteFooterColumn {
  /**
   * Column heading rendered at the top of the column.
   */
  readonly heading: string
  /**
   * Links rendered under the heading, in array order.
   */
  readonly links: readonly {
    /**
     * Visible label for the link.
     */
    readonly text: string
    /**
     * Destination URL — relative path or absolute URL.
     */
    readonly href: string
  }[]
}

/**
 * Extended footer configuration for the column-based site footer.
 * The simple `message` / `copyright` / `socials` fields live on the
 * top-level `footer` config (`FooterConfig`).
 */
export interface SiteFooterConfig {
  /**
   * Link columns rendered in the footer grid. When omitted, the footer
   * renders only the brand block and bottom strip.
   */
  readonly columns?: readonly SiteFooterColumn[]
  /**
   * Small tagline rendered on the right side of the bottom strip.
   */
  readonly tagline?: string
  /**
   * Character/glyph rendered in the footer's brand block. When omitted,
   * the footer falls back to the site's `/icon.svg`.
   */
  readonly brandMark?: string
}

/**
 * Site-level configuration for the chrome that wraps every page —
 * version chip, edit/report links, sidebar promo, topbar CTA,
 * announcement bar, and extended footer columns.
 *
 * Every field is optional; pieces with no config render nothing so a
 * minimal `defineConfig({ sections: [...] })` produces a clean site
 * with no leftover framework branding.
 *
 * @example
 * ```ts
 * site: {
 *   version: 'v1.0',
 *   edit:   { repo: 'acme/docs', branch: 'main' },
 *   report: { repo: 'acme/docs' },
 *   sidebarPromo: {
 *     title: 'Try Acme Cloud',
 *     body:  'Hosted Acme in two clicks.',
 *     cta:   { text: 'Start free', href: 'https://acme.io' },
 *   },
 *   topbarCta: { text: 'Get started →', href: '/getting-started' },
 *   announcement: {
 *     id: 'v1',
 *     lead: 'NEW',
 *     message: 'Acme Docs 1.0 is here.',
 *     cta: { href: '/changelog', label: 'What changed' },
 *   },
 *   footer: {
 *     columns: [
 *       { heading: 'Product', links: [...] },
 *       { heading: 'Community', links: [...] },
 *     ],
 *     tagline: 'Built with ciderpress',
 *   },
 * }
 * ```
 */
export interface SiteConfig {
  /**
   * Version label rendered next to the brand in the topbar (e.g. `'v1.0'`).
   * When omitted, no version chip is rendered.
   */
  readonly version?: string
  /**
   * Edit-this-page link rendered under every doc page. Omit to hide.
   */
  readonly edit?: SiteEditConfig
  /**
   * Report-an-issue link rendered under every doc page. Omit to hide.
   */
  readonly report?: SiteReportConfig
  /**
   * Promo card rendered at the bottom of the docs sidebar. Omit to hide.
   */
  readonly sidebarPromo?: SiteSidebarPromoConfig
  /**
   * Topbar call-to-action button (also mirrored in the mobile nav).
   */
  readonly topbarCta?: SiteCtaConfig
  /**
   * Announcement banner rendered above the topbar.
   */
  readonly announcement?: AnnouncementConfig
  /**
   * Extended footer config — link columns and tagline.
   */
  readonly footer?: SiteFooterConfig
}

/**
 * Live theme context passed to a `LogoFn` at render time.
 *
 * Re-derived from `<html>`'s `data-cp-theme` / `data-cp-variant` attributes
 * and the resolved CSS custom properties (`--rp-c-*`). Updates when the user
 * switches theme or variant, so the function re-runs and the logo retints
 * without a page reload.
 */
export interface LogoContext {
  /**
   * Active theme name (e.g. `'mulled'`, `'honeycrisp'`, or a user-defined name).
   */
  readonly name: string
  /**
   * Active variant.
   */
  readonly variant: 'light' | 'dark'
  /**
   * Convenience: `variant === 'dark'`.
   */
  readonly isDark: boolean
  /**
   * Resolved brand and surface colors for the active theme + variant.
   * Each value is the computed CSS color string (hex, rgb, etc.) — safe
   * to embed directly in inline styles or SVG `fill` attributes.
   */
  readonly colors: {
    readonly brand: string
    readonly brandHover: string
    readonly brandSoft: string
    readonly bg: string
    readonly text: string
  }
}

/**
 * Image-props object returned by a `LogoFn` when the function picks an
 * image path based on the active theme. The slot spreads these props onto
 * an internal `<img>` element matching Rspress's logo classes so styling
 * stays consistent.
 *
 * @example
 * ```ts
 * logo: ({ theme }) => ({
 *   src: theme.isDark ? '/logo-dark.svg' : '/logo-light.svg',
 *   alt: 'Acme',
 * })
 * ```
 */
export interface LogoImage {
  readonly src: string
  readonly alt?: string
  readonly width?: number | string
  readonly height?: number | string
}

/**
 * Function form of `logo`. Called at render time with the live theme
 * context; can return either a `LogoImage` (image-props object) or any
 * React node (inline JSX, a custom component, etc.).
 *
 * @example
 * ```tsx
 * import { defineConfig, CiderpressLogo } from 'ciderpress'
 *
 * export default defineConfig({
 *   logo: ({ theme }) => <CiderpressLogo color={theme.colors.brand} />,
 * })
 * ```
 */
export type LogoFn = (params: { readonly theme: LogoContext }) => LogoImage | React.ReactNode

/**
 * Custom FOUC loader configuration.
 *
 * Renders during the brief window before React hydrates. The glyph is
 * painted via critical CSS injected in `<head>`, so `content` must be
 * something the browser can paint without React — an inline SVG string
 * or a path/URL to an image asset.
 *
 * For React JSX-based loading screens, render them inside the page
 * shell (post-hydration) instead — by then the FOUC window is closed
 * and there is nothing left to cover.
 *
 * @example
 * ```ts
 * loader: {
 *   content: readFileSync('./assets/loader.svg', 'utf8'),
 *   label: 'brewing',
 *   maxDisplayMs: 4000,
 * }
 * ```
 */
export interface LoaderConfig {
  /**
   * Loader glyph. Accepts:
   *
   * - **Inline SVG markup** (starts with `<svg`) — encoded as a data URI
   *   and used as the loader's `background-image`.
   * - **Asset path or URL** (`'/loader.svg'`, `'https://…'`) — used
   *   directly as `background-image`.
   */
  readonly content: string
  /**
   * Text label rendered next to the glyph. Defaults to `'loading'`.
   * Pass an empty string to suppress the label entirely.
   */
  readonly label?: string
  /**
   * Minimum time (ms) the loader stays visible before fading out. Keeps
   * the flash from feeling jittery on fast first paints. Defaults to
   * `150`.
   */
  readonly minDisplayMs?: number
  /**
   * Maximum time (ms) before the loader is forcibly dismissed,
   * regardless of React hydration state. Catches the case where the JS
   * bundle never executes (e.g. static dist served over plain http with
   * no service worker). Defaults to `5000`.
   */
  readonly maxDisplayMs?: number
}

/**
 * Favicon configuration. Accepts either:
 *
 * - **String** — absolute path or URL to the favicon asset. Shorthand
 *   for `{ src }`.
 * - **Object** — `{ src, type? }`. The optional `type` is emitted as
 *   an explicit `<link rel="icon" type="...">` attribute alongside
 *   Rspress's auto-generated link, so callers can override the MIME
 *   type when the file extension wouldn't be enough (e.g. an SVG
 *   served without a `.svg` suffix from a CDN).
 *
 * Setting this field disables the runtime favicon retinting that
 * normally swaps `<link rel="icon">` to a themed pixel-apple data-URI.
 */
export type FaviconConfig = string | { readonly src: string; readonly type?: string }

/**
 * Logo configuration accepted on `CiderpressConfig.logo`.
 *
 * - `string` — image path (forwarded to Rspress's `logo` field as-is).
 * - `LogoFn` — function called at render time; receives the live theme
 *   context and returns either a `LogoImage` or a React node.
 *
 * When omitted, the topbar renders the default themed `<CiderpressLogo />`
 * wordmark.
 */
export type LogoConfig = string | LogoFn

/**
 * ciderpress configuration.
 *
 * Schema: `ciderpressConfigSchema` in schema.ts validates this shape.
 * The information architecture tree IS the config — each node defines
 * what it is, where its content comes from, and where it sits in the sidebar.
 */
export interface CiderpressConfig {
  /**
   * Site title — used as the default `<title>` template suffix and as
   * the brand label in the topbar when no logo is configured.
   */
  readonly title?: string
  /**
   * Site description — used as the default `<meta name="description">`
   * and as fallback OpenGraph description.
   */
  readonly description?: string
  /**
   * Theme selection and customisation — built-in theme name, variant
   * preference, switcher toggle, and color overrides.
   */
  readonly theme?: ThemeConfig
  /**
   * Custom theme definitions registered at config time.
   *
   * Each entry is a `CiderpressThemeInput` (the same shape accepted by
   * `defineTheme`). Registering a theme here makes its `name` selectable
   * via `theme.name` and via the theme switcher. Built-in themes
   * (`mulled`, `honeycrisp`, `grannysmith`, `amber`, `midnight`,
   * `arcade`) remain available regardless of this field.
   *
   * @example
   * ```ts
   * import { defineTheme } from 'ciderpress'
   *
   * export default defineConfig({
   *   themes: [
   *     defineTheme({
   *       name: 'company-brand',
   *       variants: { dark: brandTokens },
   *     }),
   *   ],
   * })
   * ```
   */
  readonly themes?: readonly CiderpressThemeInput[]
  /**
   * Inline FOUC loader.
   *
   * Five forms:
   *   - omit (default) — the `'apple'` preset.
   *   - `'apple'` — Ciderpress's native pixel-apple animation: five
   *     discrete bites, ballerina-spin on the vertical axis, with the
   *     leaf surviving the bites. **Carries ciderpress branding** — use
   *     a custom `LoaderConfig` for white-labelled sites.
   *   - `'classic'` — legacy dots loader cycling `loading`, `loading.`,
   *     `loading..`, `loading...` every 300ms.
   *   - `false` — no loader at all. The page paints whatever's behind
   *     it during the brief FOUC window.
   *   - `LoaderConfig` — custom SVG glyph, optional label, and timing
   *     overrides. See {@link LoaderConfig}.
   *
   * All non-`false` styles share the same backdrop and lifecycle
   * (`cp-loader-fade`, `data-cp-ready`). A `maxDisplayMs` fallback in
   * the inline head script guarantees the loader dismisses even when
   * the React bundle never hydrates (e.g. static dist served over plain
   * http with no service worker).
   */
  readonly loader?: false | 'apple' | 'classic' | LoaderConfig
  /**
   * Brand mark rendered as a small chip immediately before `logo` in the
   * topbar. Use for the canonical two-slot identity (small mark + wordmark
   * logo) seen on Stripe / Vercel / Rspress-style docs sites.
   *
   * Accepts any {@link IconConfig} value:
   * - Iconify id (`"devicon:react"`) — rendered with the `<Icon>` component.
   * - `{ id, color }` — Iconify with explicit colour.
   * - `{ src, alt }` — static image asset (SVG/PNG/…) painted as `<img>`.
   *
   * When omitted, the topbar shows the `logo` slot only. When neither
   * `icon` nor `logo` is set, the framework wordmark fallback appears.
   */
  readonly icon?: IconConfig
  /**
   * Brand logo rendered in the topbar. Three forms:
   *
   * - **omit** — render the auto-generated `/logo.svg` written to the public
   *   dir by the banner module (derived from the project title). Commit your
   *   own `public/logo.svg` to override permanently.
   * - `string` — image path; forwarded to Rspress's `logo` field as-is.
   * - `({ theme }) => LogoImage | ReactNode` — function called at render
   *   time with the live theme context. Return a `LogoImage` (image-props
   *   object) or inline JSX. The function re-runs on theme/variant change.
   *
   * @example
   * ```ts
   * // Image path
   * logo: '/logo.svg'
   *
   * // Theme-aware image swap
   * logo: ({ theme }) => ({
   *   src: theme.isDark ? '/logo-dark.svg' : '/logo-light.svg',
   *   alt: 'Acme',
   * })
   *
   * // Inline JSX with a custom component
   * import { CiderpressLogo } from 'ciderpress'
   * logo: ({ theme }) => <CiderpressLogo />
   * ```
   */
  readonly logo?: LogoConfig
  /**
   * Hero banner image path used on the home page and workspace landing
   * pages. Defaults to `/banner.svg` (auto-generated from the project
   * title at sync time; commit your own `public/banner.svg` to override).
   * Set this to point at a different path — a custom SVG, a PNG, or a
   * CDN URL.
   *
   * @example
   * ```ts
   * banner: '/assets/hero.png'
   * banner: 'https://cdn.example.com/banner.svg'
   * ```
   */
  readonly banner?: string
  /**
   * Favicon image path. Defaults to `/icon.svg` (auto-generated from
   * the project title at sync time; commit your own `public/icon.svg`
   * to override). Distinct from `icon`, which is the inline mark next
   * to the topbar title.
   *
   * Setting this field disables the runtime favicon retinting that
   * swaps `<link rel="icon">` to a themed ciderpress pixel-apple — your
   * asset wins instead.
   *
   * @example
   * ```ts
   * favicon: '/favicon.ico'
   * favicon: '/assets/favicon.svg'
   * favicon: { src: '/favicon.png', type: 'image/png' }
   * ```
   */
  readonly favicon?: FaviconConfig
  /**
   * Short marketing tagline rendered under the site title on the home hero.
   */
  readonly tagline?: string
  /**
   * Primary call-to-action buttons rendered on the home hero. Schema
   * enforces a two-button cap.
   */
  readonly actions?: readonly HeroAction[]
  /**
   * Workspace apps — standalone applications and runnable services (APIs,
   * workers, web apps, and anything that deploys independently).
   * Single source of truth for app metadata used on the home page,
   * landing pages, and introduction page.
   */
  readonly apps?: readonly Workspace[]
  /**
   * Workspace packages — reusable modules shared across the codebase
   * (libraries, utilities, configs, SDKs, and internal tooling).
   * Single source of truth for package metadata used on the home page,
   * landing pages, and introduction page.
   */
  readonly packages?: readonly Workspace[]
  /**
   * Custom workspace groups — arbitrary named groups of workspace items.
   * Each group receives the same card/landing-page treatment as apps and packages.
   * Rendered after apps and packages, in array order.
   */
  readonly workspaces?: readonly WorkspaceGroup[]
  /**
   * Explicit feature cards on the home page. Rendered in array order
   * inside a grid laid out by `home.features`.
   */
  readonly features?: readonly Feature[]
  /**
   * Persistent sidebar links rendered above and below the sidebar
   * nav tree on every doc page.
   */
  readonly sidebar?: SidebarConfig
  /**
   * Information architecture tree — the single source of truth for
   * pages, sections, sidebars, and URL paths. Required.
   */
  readonly sections: readonly Section[]
  /**
   * Topbar navigation:
   * - `'auto'` (default) — derived from `sections` roots
   * - Explicit array — hand-authored nav items
   */
  readonly nav?: 'auto' | readonly NavItem[]
  /**
   * Global glob patterns of files to exclude from auto-discovery in
   * every section and workspace.
   */
  readonly exclude?: readonly string[]
  /**
   * Top-level OpenAPI integration — mounts a single spec at the
   * configured `path`. For multi-spec sites, configure `openapi` on
   * each workspace instead.
   */
  readonly openapi?: OpenAPIConfig
  /**
   * Home page layout customisation — grid columns, truncation, trust
   * strip, eyebrow, and final CTA band.
   */
  readonly home?: HomeConfig
  /**
   * Social links rendered in the topbar (and optionally in the footer
   * when `footer.socials` is `true`).
   */
  readonly socialLinks?: readonly SocialLink[]
  /**
   * Simple site footer — tagline, copyright, and the social-link
   * mirror toggle. Extended footer columns live on `site.footer`.
   */
  readonly footer?: FooterConfig
  /**
   * Site-level chrome configuration — version chip, edit/report links,
   * sidebar promo, topbar CTA, announcement, and extended footer.
   *
   * Every field is optional; pieces with no config render nothing.
   */
  readonly site?: SiteConfig
}
