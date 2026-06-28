import type {
  BuiltInThemeName,
  CiderpressThemeInput,
  IconColor,
  ThemeColors,
} from '@ciderpress/theme'
import type React from 'react'

export type {
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
 * Unified icon configuration — applied uniformly across every position
 * that accepts an icon (`brand.icon`, `Page.icon`, `Workspace.icon`,
 * `WorkspaceGroup.icon`, `ButtonConfig.icon`, etc.).
 *
 * Accepts three forms:
 *
 * - **Iconify id** (`"devicon:hono"`) — string from an installed icon set.
 * - **Iconify object** (`{ id, color }`) — explicit color from the 8-colour palette.
 * - **Image object** (`{ src, alt }`) — static image (SVG/PNG/…).
 *
 * @example
 * ```ts
 * icon: 'devicon:react'
 * icon: { id: 'devicon:nextjs', color: 'blue' }
 * icon: { src: '/icon.svg', alt: 'maltty' }
 * ```
 */
export type IconConfig = IconId | { readonly id: IconId; readonly color?: IconColor } | IconImage

/**
 * File-system path (absolute or relative).
 */
type FilePath = string

/**
 * URL path segment (e.g. `"/api"`, `"/guides/auth"`).
 */
type UrlPath = string

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
 * Universal image source.
 *
 * Accepts either a string path/URL or a structured object carrying alt
 * text and explicit dimensions. Used for `brand.favicon`, banner image
 * return values, hero demo images, and anywhere else an image is named
 * in config.
 */
export type ImageSource =
  | string
  | {
      readonly src: string
      readonly alt?: string
      readonly type?: string
      readonly width?: number | string
      readonly height?: number | string
    }

/**
 * Rspress frontmatter fields injectable at build time.
 *
 * Schema: `frontmatterSchema` in schema.ts validates this shape with
 * `.strict()` — unknown keys are rejected at config-load time.
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
   * Show the edit-this-page link under the article.
   */
  readonly editLink?: boolean
  /**
   * Show the "last updated" timestamp under the article. Defaults to `false`.
   */
  readonly lastUpdated?: boolean
  /**
   * Show the site footer on this page. Defaults to `true`.
   */
  readonly footer?: boolean
  /**
   * Extra class name applied to the page wrapper.
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
 * Title configuration — static string or derivation rule for
 * auto-discovered children. Used uniformly on every `title` field that
 * accepts derivation (`Page.title`, `Workspace.title`, …).
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
       */
      readonly transform?: (text: string, slug: string) => string
    }

/**
 * Sort strategy applied when `Page.include` (or `Workspace.include`)
 * auto-discovers children.
 *
 * - `'default'` — frontmatter `order` then alphabetical title
 * - `'alpha'` — alphabetical by title
 * - `'filename'` — alphabetical by source filename
 * - `'none'` — preserve glob-discovery order
 * - Custom comparator — sort by your own rule
 */
export type SortStrategy =
  | 'default'
  | 'alpha'
  | 'filename'
  | 'none'
  | ((a: ResolvedPage, b: ResolvedPage) => number)

/**
 * Card appearance overrides — controls how a `Page` or workspace renders
 * as a card on a parent's auto-generated landing.
 */
export interface CardConfig {
  /**
   * Card icon. Defaults to a rotating color based on the parent's position.
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
    readonly src: string
    readonly alt: string
  }
}

/**
 * Unified button vocabulary — replaces the legacy `HeroAction.theme` /
 * `SidebarLink.style` shapes. Used everywhere a button appears in config
 * (hero actions, CTA bands, sidebar top/bottom links, topbar CTA).
 */
export interface ButtonConfig {
  /**
   * Visible label rendered inside the button.
   */
  readonly text: string
  /**
   * Destination URL — relative path or absolute URL.
   */
  readonly href: string
  /**
   * Visual treatment. Defaults to `'primary'` for hero actions and
   * `'ghost'` for sidebar links.
   */
  readonly variant?: 'primary' | 'secondary' | 'ghost'
  /**
   * Button shape. Defaults to `'rounded'`.
   */
  readonly shape?: 'square' | 'rounded' | 'circle'
  /**
   * Optional icon rendered to the left of the label.
   */
  readonly icon?: IconConfig
}

/**
 * A single node in the information architecture tree — replaces the
 * legacy `Section` interface and renames `items` → `pages`, `frontmatter`
 * → `defaults`, and groups navigation / discovery options under `nav`
 * and `discover` sub-objects.
 *
 * **Source**: declare exactly one of `include`, `content`, or `pages`.
 */
export interface Page {
  /**
   * Display title — static string or a derivation rule for
   * auto-discovered children.
   */
  readonly title: TitleConfig
  /**
   * One-line description used on this page's auto-generated landing card
   * and OG meta.
   */
  readonly description?: string
  /**
   * URL path this page mounts at (e.g. `/guides`). Omit for a sidebar-only
   * grouping node.
   */
  readonly path?: string
  /**
   * Icon rendered on the page's card and (when configured) in the sidebar.
   */
  readonly icon?: IconConfig
  /**
   * File path or glob string(s); children auto-discovered.
   */
  readonly include?: string | readonly string[]
  /**
   * Inline Markdown/MDX string, or async generator.
   */
  readonly content?: string | (() => string | Promise<string>)
  /**
   * Explicit child nodes (was `items` on the legacy `Section` interface).
   */
  readonly pages?: readonly Page[]
  /**
   * Sidebar navigation behavior for this page (and its subtree).
   */
  readonly nav?: {
    /**
     * Hide this page (and children) from the sidebar entirely.
     */
    readonly hidden?: boolean
    /**
     * Show as a collapsible group in the sidebar. Defaults to `true`.
     */
    readonly collapsible?: boolean
    /**
     * Render as a sidebar island — children appear only when the user is
     * inside this branch (was `standalone` on the legacy `Section`).
     */
    readonly island?: boolean
    /**
     * Mark as a sidebar root — only one root can be active at a time;
     * the topbar treats it as the active workspace.
     */
    readonly root?: boolean
  }
  /**
   * Render an auto-generated landing page at this `path` listing children
   * as cards. Defaults to `true` for pages with children.
   */
  readonly landing?: boolean
  /**
   * Card appearance overrides — controls how this page appears as a card
   * on a parent's landing.
   */
  readonly card?: CardConfig
  /**
   * Default values merged into every child page's frontmatter (was
   * `frontmatter` on the legacy `Section` interface). Per-file
   * frontmatter wins on conflict.
   */
  readonly defaults?: Frontmatter
  /**
   * Glob-discovery options — ignored unless `include` is a glob.
   */
  readonly discover?: {
    /**
     * Sort strategy for discovered children.
     */
    readonly sort?: SortStrategy
    /**
     * Recurse into subdirectories. Defaults to `true`.
     */
    readonly recursive?: boolean
    /**
     * Glob patterns ignored during discovery (was `exclude` on the legacy
     * `Section` interface; renamed for gitignore vocabulary alignment).
     */
    readonly ignore?: readonly string[]
    /**
     * Filename treated as the page's own content instead of generating a
     * landing page (was `entryFile`).
     */
    readonly indexFile?: string
  }
  /**
   * Per-page OpenAPI integration — generates API operation pages under
   * this page's `path`.
   */
  readonly openapi?: OpenAPISpec
}

/**
 * Workspace item representing an app or package in the monorepo.
 *
 * Mirrors {@link Page}'s discovery surface — `pages`, `discover.*`, and
 * `defaults` carry the same semantics on a Workspace as on a Page. The
 * extra Workspace-only fields (`description`, `tags`, `badge`) drive
 * card rendering on the home showcase and landing pages.
 */
export interface Workspace {
  /**
   * Workspace display name (e.g. `'API'`, `'@acme/sdk'`). Accepts the
   * uniform {@link TitleConfig} shape.
   */
  readonly title: TitleConfig
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
    readonly src: string
    readonly alt: string
  }
  /**
   * URL path the workspace mounts under (e.g. `'/apps/api'`).
   */
  readonly path: string
  /**
   * Glob pattern(s) that source content from the file system, resolved
   * relative to the workspace's base path (derived from `path`).
   */
  readonly include?: string | readonly string[]
  /**
   * Explicit child pages — overrides `include`-based auto-discovery
   * when both are set. Same shape as {@link Page} children.
   */
  readonly pages?: readonly Page[]
  /**
   * Default frontmatter merged into every child page discovered or
   * declared under this workspace. Per-file frontmatter wins on conflict.
   */
  readonly defaults?: Frontmatter
  /**
   * Glob-discovery options — ignored unless `include` is a glob. Same
   * shape as {@link Page.discover}.
   */
  readonly discover?: {
    /**
     * Sort strategy for discovered children.
     */
    readonly sort?: SortStrategy
    /**
     * Recurse into subdirectories. Defaults to `true`.
     */
    readonly recursive?: boolean
    /**
     * Glob patterns ignored during discovery.
     */
    readonly ignore?: readonly string[]
    /**
     * Filename treated as the workspace's own landing-page content
     * instead of generating an auto-landing.
     */
    readonly indexFile?: string
  }
  /**
   * Per-workspace OpenAPI integration.
   */
  readonly openapi?: OpenAPISpec
}

/**
 * Custom workspace category grouping apps/packages.
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
   * Icon shown next to the group title — uniform {@link IconConfig}
   * shape, matching every other icon position.
   */
  readonly icon: IconConfig
  /**
   * Workspaces grouped under this category. Rendered as cards in the
   * order provided.
   */
  readonly items: readonly Workspace[]
  /**
   * Optional URL the group title links to.
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
 * Configuration for OpenAPI spec integration (renamed from the legacy
 * `OpenAPIConfig`).
 */
export interface OpenAPISpec {
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
 * Explicit feature card for the home page features grid.
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
 * Section heading shown above a home-page block (features, showcase,
 * etc.). The legacy `eyebrow` field is renamed to `label` to drop design
 * jargon.
 */
export interface HomeSectionHeading {
  /**
   * Small uppercase kicker rendered above the title (was `eyebrow`).
   */
  readonly label?: string
  /**
   * Heading title — replaces the framework default.
   */
  readonly title?: string
  /**
   * Optional supporting sentence rendered under the title.
   */
  readonly subtitle?: string
}

/**
 * Home hero block — label, tagline, actions, and optional demo visual.
 */
export interface HomeHeroConfig {
  /**
   * Small label above the title (was `eyebrow`).
   */
  readonly label?: string
  /**
   * Marketing line under the title.
   */
  readonly tagline?: string
  /**
   * Hero call-to-action buttons.
   */
  readonly actions?: readonly ButtonConfig[]
  /**
   * Visual rendered next to the hero copy.
   */
  readonly demo?: false | HomeHeroDemoConfig
}

/**
 * "Used by" / "Trusted by" strip on the home hero (was `HomeTrustConfig`
 * — renamed to drop ambiguous jargon).
 */
export interface HomeProofConfig {
  /**
   * Lead phrase rendered before the names (e.g. `'used by'`, `'powering
   * teams at'`).
   */
  readonly lead?: string
  /**
   * Company / team names rendered as a comma-separated list after the lead.
   */
  readonly names?: readonly string[]
}

/**
 * Home features block — grid + cards combined into one config (today's
 * top-level `features` list lives under `items` here).
 */
export interface HomeFeaturesConfig {
  /**
   * Feature cards rendered in the grid (was top-level `features`).
   * Optional — omit to customize only the grid layout / heading without
   * supplying cards (renders an empty grid).
   */
  readonly items?: readonly Feature[]
  /**
   * Number of columns in the grid at desktop widths (1–4). Smaller
   * breakpoints automatically reduce this.
   */
  readonly columns?: 1 | 2 | 3 | 4
  /**
   * Line-clamp limits for card text.
   */
  readonly truncate?: TruncateConfig
  /**
   * Heading rendered above the grid.
   */
  readonly heading?: HomeSectionHeading
}

/**
 * Generalized card grid for the second home-page block (was
 * `home.workspaces`). Source defaults to the apps + packages +
 * workspaces collection but can be overridden with arbitrary page paths.
 */
export interface HomeShowcaseConfig {
  /**
   * Number of columns in the grid at desktop widths (1–4).
   */
  readonly columns?: 1 | 2 | 3 | 4
  /**
   * Line-clamp limits for card text.
   */
  readonly truncate?: TruncateConfig
  /**
   * Heading rendered above the grid.
   */
  readonly heading?: HomeSectionHeading
  /**
   * Card source.
   *
   * - omit → auto-collect from top-level `apps` + `packages` + `workspaces`
   * - `'workspaces'` → same as omit, explicit
   * - `string[]` → explicit list of page paths
   *   (e.g. `['/products/cli', '/products/api']`)
   */
  readonly source?: 'workspaces' | readonly string[]
}

/**
 * Image-form home hero demo — `<img>` painted inside the demo container.
 */
export interface HomeHeroDemoImage {
  /**
   * Absolute path or URL to the image asset.
   */
  readonly src: string
  /**
   * Alt text for screen readers.
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
 * Single line in a structured {@link HomeHeroDemoTerminal}.
 */
export interface HomeHeroDemoLine {
  /**
   * Line style:
   * - `'ok'`   — success marker
   * - `'info'` — informational marker
   * - `'cmt'`  — comment / hint line
   * - `'err'`  — error / warning marker
   */
  readonly kind: 'ok' | 'info' | 'cmt' | 'err'
  /**
   * Line text. Renders verbatim with the prefix glyph in front.
   */
  readonly text: string
}

/**
 * Structured terminal-form home hero demo — keeps the framework's
 * terminal chrome but uses the supplied command + output lines.
 */
export interface HomeHeroDemoTerminal {
  /**
   * Title shown in the fake window's title bar.
   */
  readonly windowTitle?: string
  /**
   * Command rendered after the `$ ` prompt at the top of the output.
   */
  readonly command: string
  /**
   * Output lines rendered below the command.
   */
  readonly lines: readonly HomeHeroDemoLine[]
}

/**
 * Home hero demo block — the visual rendered next to the hero copy
 * (was `HeroDemoConfig`).
 */
export type HomeHeroDemoConfig = HomeHeroDemoImage | HomeHeroDemoTerminal

/**
 * Visual paired with a {@link HomeSplitConfig} copy column.
 */
export interface HomeSplitVisual {
  /**
   * Code snippet rendered as a syntax-highlighted preview.
   */
  readonly code: string
  /**
   * Language identifier for syntax highlighting. Defaults to `'ts'`.
   */
  readonly language?: string
}

/**
 * "Show and tell" Split block — title + bullets + visual sample (was
 * `SplitConfig`).
 */
export interface HomeSplitConfig {
  /**
   * Small label rendered above the title (was `eyebrow`).
   */
  readonly label?: string
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
  readonly cta?: ButtonConfig
  /**
   * Visual rendered in the right column.
   */
  readonly visual?: HomeSplitVisual
}

/**
 * Final CTA band on the home page — title, optional subtitle, and
 * action buttons.
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
   * Action buttons rendered below the subtitle.
   */
  readonly actions?: readonly ButtonConfig[]
}

/**
 * Identifier for one of the built-in home-page sections (`trust` →
 * `proof`, `workspaces` → `showcase`).
 */
export type HomeSectionId = 'hero' | 'proof' | 'features' | 'showcase' | 'split' | 'cta'

/**
 * Default render order for `home.layout` when the field is omitted.
 */
export const DEFAULT_HOME_LAYOUT: readonly HomeSectionId[] = Object.freeze([
  'hero',
  'proof',
  'features',
  'showcase',
  'split',
  'cta',
])

/**
 * Home layout entry — bare section id, future-extensible object, or a
 * custom component (inline or path string).
 */
export type HomeLayoutEntry =
  | HomeSectionId
  | { readonly sectionId: HomeSectionId }
  | { readonly component: React.ComponentType<{ readonly paths: Paths }> }
  | { readonly component: string }

/**
 * Home page configuration — hero, proof strip, features grid, showcase
 * grid, split block, and final CTA. Every block is optional; the
 * `layout` field controls render order.
 */
export interface HomeConfig {
  /**
   * Hero block — label, tagline, actions, and optional demo. Optional —
   * the framework renders sensible defaults from the site title and
   * `brand.banner` when omitted.
   */
  readonly hero?: HomeHeroConfig
  /**
   * "Used by / Trusted by" strip rendered between the hero and the
   * features grid.
   */
  readonly proof?: HomeProofConfig
  /**
   * Features grid block — cards + grid layout combined.
   */
  readonly features?: HomeFeaturesConfig
  /**
   * Generalized card grid (was `home.workspaces`).
   */
  readonly showcase?: HomeShowcaseConfig
  /**
   * "Show and tell" Split section.
   */
  readonly split?: false | HomeSplitConfig
  /**
   * Final CTA band rendered just above the footer.
   */
  readonly cta?: HomeCtaConfig
  /**
   * Render order for home-page sections. Accepts bare ids, objects
   * carrying a `sectionId`, or custom React components (inline or path).
   */
  readonly layout?: readonly HomeLayoutEntry[]
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
 */
export type SocialLinkIcon = (typeof SOCIAL_LINK_ICONS)[number]

/**
 * A social link rendered in the topbar (and optionally in the footer).
 *
 * Wrapped to drop Rspress's `mode` / `content` discriminator — every
 * link is now `{ icon, url, label? }`.
 *
 * @example
 * ```ts
 * socials: [
 *   { icon: 'github', url: 'https://github.com/acme' },
 *   { icon: 'discord', url: 'https://discord.gg/acme' },
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
   * Destination URL.
   */
  readonly url: string
  /**
   * Optional accessible label for screen readers.
   */
  readonly label?: string
}

/**
 * Announcement banner rendered above the topbar.
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
     * Destination URL for the CTA.
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
 * Sidebar promo card rendered at the bottom of the docs sidebar (was
 * `SiteSidebarPromoConfig`).
 */
export interface SidebarPromo {
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
     * Destination URL for the CTA.
     */
    readonly href: string
  }
}

/**
 * Topbar chrome — navigation, primary CTA, social icons, and an optional
 * announcement banner above the bar.
 */
export interface TopbarConfig {
  /**
   * Topbar navigation. `'auto'` derives top-level entries from
   * `pages`; an explicit array hand-authors the bar.
   */
  readonly nav?: 'auto' | readonly NavItem[]
  /**
   * Primary call-to-action button rendered on the right side of the
   * topbar (and mirrored in the mobile nav).
   */
  readonly cta?: ButtonConfig
  /**
   * Topbar social icons. `true` reuses the root-level `socials` list;
   * pass an array to override.
   */
  readonly socials?: true | readonly SocialLink[]
  /**
   * Announcement banner rendered above the topbar.
   */
  readonly announcement?: AnnouncementConfig
}

/**
 * Sidebar chrome — persistent links above/below the nav tree and an
 * optional promo card at the bottom.
 */
export interface SidebarConfig {
  /**
   * Persistent links rendered above the sidebar nav tree (was `above`).
   */
  readonly top?: readonly ButtonConfig[]
  /**
   * Persistent links rendered below the sidebar nav tree (was `below`).
   */
  readonly bottom?: readonly ButtonConfig[]
  /**
   * Promo card rendered at the bottom of the docs sidebar.
   */
  readonly promo?: SidebarPromo
}

/**
 * One column of footer links in the site footer grid (was
 * `SiteFooterColumn`).
 */
export interface FooterColumn {
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
     * Destination URL.
     */
    readonly href: string
  }[]
}

/**
 * Footer copyright configuration.
 *
 * - `true` on `FooterConfig.copyright` → auto-generate `© <year> <title>`
 * - `string` on `FooterConfig.copyright` → use the string verbatim
 * - `CopyrightConfig` → structured generation with company / dba / year range
 */
export interface CopyrightConfig {
  /**
   * Legal entity name (e.g. `'Acme Inc.'`).
   */
  readonly company?: string
  /**
   * "Doing business as" name.
   */
  readonly dba?: string
  /**
   * Single year or a range starting from the given year through the
   * current year.
   */
  readonly year?: number | { readonly from: number }
}

/**
 * Unified site footer — merges the legacy top-level `footer` and
 * `site.footer` blocks into one config.
 */
export interface FooterConfig {
  /**
   * Tagline rendered in the footer's left column.
   */
  readonly message?: string
  /**
   * Copyright line. `true` auto-generates from `title` + current year.
   */
  readonly copyright?: true | string | CopyrightConfig
  /**
   * Link columns rendered in the footer grid.
   */
  readonly columns?: readonly FooterColumn[]
  /**
   * Small tagline rendered on the right side of the bottom strip.
   */
  readonly tagline?: string
  /**
   * Character/glyph rendered in the footer's brand block.
   */
  readonly brandMark?: string
  /**
   * Footer social icons. `true` mirrors the root-level `socials` list;
   * pass an array to override.
   */
  readonly socials?: true | readonly SocialLink[]
}

/**
 * Edit-this-page link configuration (matches industry vocabulary —
 * VitePress / Nextra `editLink`).
 *
 * Set `editLink` to `false` to disable the link entirely.
 */
export interface EditLinkConfig {
  /**
   * Destination repository (e.g. `'acme/docs'`) or full URL template.
   * The string `{path}` is substituted with the current page's
   * relative path.
   */
  readonly repo?: string
  /**
   * Branch to link against. Defaults to `'main'`.
   */
  readonly branch?: string
  /**
   * Subdirectory inside the repo containing the docs.
   */
  readonly directory?: string
  /**
   * Override the visible label.
   */
  readonly label?: string
  /**
   * Custom URL builder — wins over the auto-generated URL.
   */
  readonly url?: (page: ResolvedPage) => string
  /**
   * Hook called when the link resolves (analytics / telemetry).
   */
  readonly onResolve?: (page: ResolvedPage) => void
}

/**
 * Report-an-issue link configuration. Renders under every doc page.
 *
 * Set `reportLink` to `false` to disable the link entirely.
 */
export interface ReportLinkConfig {
  /**
   * Destination repository or full URL.
   */
  readonly repo?: string
  /**
   * Branch to link against.
   */
  readonly branch?: string
  /**
   * Subdirectory inside the repo.
   */
  readonly directory?: string
  /**
   * Override the visible label.
   */
  readonly label?: string
  /**
   * Custom URL builder.
   */
  readonly url?: (page: ResolvedPage) => string
  /**
   * Hook called when the link resolves.
   */
  readonly onResolve?: (page: ResolvedPage) => void
}

/**
 * Live theme context passed to a `LogoFn` (or `BannerFn`) at render time.
 *
 * Re-derived from `<html>`'s `data-cp-theme` / `data-cp-variant` attributes
 * and the resolved CSS custom properties. Updates when the user switches
 * theme or variant.
 */
export interface LogoContext {
  /**
   * Active theme name.
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
 * image path based on the active theme.
 */
export interface LogoImage {
  readonly src: string
  readonly alt?: string
  readonly width?: number | string
  readonly height?: number | string
}

/**
 * Function form of `brand.logo`. Called at render time with the live
 * theme context; returns either a `LogoImage` or any React node.
 */
export type LogoFn = (params: { readonly theme: LogoContext }) => LogoImage | React.ReactNode

/**
 * Logo configuration accepted on `BrandConfig.logo`.
 */
export type LogoConfig = string | LogoFn

/**
 * Function form of `brand.banner`. Called at render time with the live
 * theme context; returns either an image source or any React node.
 */
export type BannerFn = (params: { readonly theme: LogoContext }) => ImageSource | React.ReactNode

/**
 * Banner configuration accepted on `BrandConfig.banner`.
 */
export type BannerConfig = string | BannerFn

/**
 * Static-glyph loader configuration — the historical shape carrying a
 * paintable `content` string (inline SVG or asset path).
 */
export interface LoaderStaticConfig {
  /**
   * Loader glyph — inline SVG markup or asset path/URL.
   */
  readonly content: string
  /**
   * Text label rendered next to the glyph.
   */
  readonly label?: string
  /**
   * Minimum time (ms) the loader stays visible before fading out.
   */
  readonly minDisplayMs?: number
  /**
   * Maximum time (ms) before the loader is forcibly dismissed.
   */
  readonly maxDisplayMs?: number
}

/**
 * Custom React-component loader configuration — paints once React
 * hydrates (pre-hydration falls back to the backdrop only).
 */
export interface LoaderComponentConfig {
  /**
   * Custom React component to render as the loader.
   */
  readonly component: React.ComponentType
  /**
   * Text label rendered next to the component.
   */
  readonly label?: string
  /**
   * Minimum time (ms) the loader stays visible before fading out.
   */
  readonly minDisplayMs?: number
  /**
   * Maximum time (ms) before the loader is forcibly dismissed.
   */
  readonly maxDisplayMs?: number
}

/**
 * Custom FOUC loader configuration. Either a static glyph or a custom
 * React component.
 */
export type LoaderConfig = LoaderStaticConfig | LoaderComponentConfig

/**
 * Brand identity — small chip icon, wordmark logo, hero banner,
 * browser-tab favicon, and FOUC loader. All optional; minimal config
 * produces a clean default site with no ciderpress branding.
 */
export interface BrandConfig {
  /**
   * Small chip rendered immediately before the wordmark in the topbar.
   */
  readonly icon?: IconConfig
  /**
   * Wordmark rendered in the topbar.
   */
  readonly logo?: LogoConfig
  /**
   * Hero background — string path or a function returning an image
   * source or React node.
   */
  readonly banner?: BannerConfig
  /**
   * Browser-tab icon.
   */
  readonly favicon?: ImageSource
  /**
   * Inline FOUC loader.
   *
   * - omit (default) — the `'apple'` preset.
   * - `'apple'` — ciderpress's native pixel-apple animation. Carries
   *   ciderpress branding.
   * - `'classic'` — legacy dots loader.
   * - `false` — no loader.
   * - {@link LoaderConfig} — custom glyph or React component.
   */
  readonly loader?: false | 'apple' | 'classic' | LoaderConfig
}

/**
 * Theme entry on `theme.themes` — bare built-in name, full custom
 * definition, or either with an explicit `default` marker. First entry
 * is the default unless one carries `default: true`.
 */
export type ThemeEntry =
  | BuiltInThemeName
  | CiderpressThemeInput
  | { readonly name: BuiltInThemeName; readonly default?: boolean }
  | (CiderpressThemeInput & { readonly default?: boolean })

/**
 * Theme block — single themes array (first entry is the default
 * unless one is marked), separate switchers for theme vs. variant, and
 * optional cross-theme color overrides.
 */
export interface ThemeSettings {
  /**
   * Themes available on the site. Mix built-in names and custom
   * definitions; the first entry is the default unless one carries
   * `default: true`.
   */
  readonly themes: readonly ThemeEntry[]
  /**
   * Initial variant to render.
   */
  readonly defaultVariant?: 'light' | 'dark' | 'system'
  /**
   * Show the named-theme picker. Defaults to `true` when
   * `themes.length > 1`.
   */
  readonly themeSwitcher?: boolean
  /**
   * Show the light/dark toggle. Defaults to `true`.
   */
  readonly variantSwitcher?: boolean
  /**
   * Override individual color tokens across all themes.
   */
  readonly overrides?: Partial<ThemeColors>
}

/**
 * Cross-cutting discovery options. Today only carries a single
 * `ignore` field for global glob excludes; reserved as an object so
 * future cross-cutting toggles slot in without another top-level field.
 */
export interface DiscoverConfig {
  /**
   * Global glob patterns excluded from every page's auto-discovery.
   */
  readonly ignore?: readonly string[]
}

/**
 * Dev-server configuration — controls how `ciderpress dev` binds and
 * how the dev URL is presented in the terminal and browser auto-open.
 *
 * All fields are optional. CLI flags (`--port`, `--host`, `--url`)
 * override values supplied here.
 *
 * @example Behind portless.sh
 * ```ts
 * devServer: {
 *   url: 'https://docs.acme.localhost',
 * }
 * ```
 */
export interface DevServerConfig {
  /**
   * Externally-visible URL of the dev server. Replaces the default
   * `http://${host}:${port}` in the "ready: …" terminal message and in
   * the browser auto-open target. Useful when running behind a reverse
   * proxy such as `portless.sh` that fronts the dev server with a
   * stable HTTPS hostname. The dev server still binds to `host` /
   * `port` locally — `url` is purely a display + auto-open hint.
   */
  readonly url?: string
  /**
   * Preferred port for the dev server. Defaults to `6174`; ciderpress
   * falls forward through a 5-port range when the preferred port is
   * occupied. CLI `--port` overrides this.
   */
  readonly port?: number
  /**
   * Bind interface for the dev server. Defaults to `'localhost'`. Set
   * to `'0.0.0.0'` to expose the dev server on every network interface
   * (LAN / Docker / VM). CLI `--host` overrides this.
   */
  readonly host?: string
  /**
   * Auto-open the resolved URL in the default browser when the dev
   * server becomes ready. Defaults to `false`.
   */
  readonly open?: boolean
}

/**
 * ciderpress configuration — the public surface for `defineConfig`.
 *
 * Schema: `ciderpressConfigSchema` in schema.ts validates this shape.
 * The information architecture tree (`pages`) IS the config — each node
 * defines what it is, where its content comes from, and where it sits
 * in the sidebar.
 */
export interface CiderpressConfig {
  /**
   * Site title — used as the default `<title>` template suffix and as
   * the brand label in the topbar when no logo is configured.
   */
  readonly title?: string
  /**
   * Site description — used as the default `<meta name="description">`
   * and as the fallback OpenGraph description.
   */
  readonly description?: string
  /**
   * Deployment base path. Must start and end with `/` (e.g.
   * `/examples/simple/`). Defaults to `/`. `CIDERPRESS_BASE` env var
   * wins over this field.
   */
  readonly base?: string
  /**
   * Version label rendered next to the brand in the topbar (e.g. `'v1.0'`).
   */
  readonly version?: string
  /**
   * Brand identity — icon, logo, banner, favicon, and FOUC loader.
   */
  readonly brand?: BrandConfig
  /**
   * Theme selection, switchers, and color overrides.
   */
  readonly theme?: ThemeSettings
  /**
   * Information architecture tree — the single source of truth for
   * pages, sections, sidebars, and URL paths. Required.
   */
  readonly pages: readonly Page[]
  /**
   * Workspace apps — standalone applications and runnable services.
   */
  readonly apps?: readonly Workspace[]
  /**
   * Workspace packages — reusable modules shared across the codebase.
   */
  readonly packages?: readonly Workspace[]
  /**
   * Custom workspace groups — arbitrary named groups of workspace items.
   */
  readonly workspaces?: readonly WorkspaceGroup[]
  /**
   * Social links — single source of truth. Referenced by
   * `topbar.socials` and `footer.socials` via `true`.
   */
  readonly socials?: readonly SocialLink[]
  /**
   * Topbar chrome — navigation, CTA, social icons, announcement.
   */
  readonly topbar?: TopbarConfig
  /**
   * Sidebar chrome — persistent top/bottom links and promo card.
   */
  readonly sidebar?: SidebarConfig
  /**
   * Site footer — message, copyright, columns, tagline, brand mark,
   * social icons.
   */
  readonly footer?: FooterConfig
  /**
   * Edit-this-page link rendered under every doc page. `false` disables
   * the link entirely.
   */
  readonly editLink?: false | EditLinkConfig
  /**
   * Report-an-issue link rendered under every doc page. `false` disables
   * the link entirely.
   */
  readonly reportLink?: false | ReportLinkConfig
  /**
   * Home page configuration — hero, proof, features, showcase, split,
   * cta, and render order.
   */
  readonly home?: HomeConfig
  /**
   * Cross-cutting discovery options (e.g. global ignore globs).
   */
  readonly discover?: DiscoverConfig
  /**
   * Dev-server configuration — host, port, externally-visible URL,
   * and browser auto-open. Applies to `ciderpress dev`; CLI flags
   * override values supplied here.
   */
  readonly devServer?: DevServerConfig
}
