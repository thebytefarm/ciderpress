/**
 * Zod schemas for ciderpress configuration validation.
 *
 * Theme schemas (`themeColorsSchema`, `themeConfigSchema`) are imported from
 * `@ciderpress/theme` — that package owns the canonical theme surface; redefining
 * them here would create drift. Because `@ciderpress/theme` uses Zod v4, this file
 * also uses the Zod v4 entrypoint (`import { z } from 'zod'`). JSON Schema
 * generation in `packages/config/scripts/generate-schema.ts` uses Zod v4's
 * native `z.toJSONSchema()` accordingly.
 *
 * Recursive schemas (navItemSchema, entrySchema) are annotated with z.ZodType<T>
 * to enforce compile-time consistency between schemas and their TypeScript types.
 * If a schema field is renamed or changed without updating the type (or vice versa),
 * TypeScript will error here.
 *
 * Function fields use z.custom<T> with typed signatures to avoid z.function()'s
 * lossy (...args: unknown[]) => unknown inference, preserving exact call signatures.
 */

import { themeColorsSchema, themeConfigSchema, themeInputEnvelopeSchema } from '@ciderpress/theme'
import { z } from 'zod'

import type {
  AnnouncementConfig,
  CardConfig,
  Frontmatter,
  HomeConfig,
  HomeCtaConfig,
  HomeTrustConfig,
  IconId,
  LogoFn,
  NavItem,
  ResolvedPage,
  Section,
  SiteConfig,
  SiteCtaConfig,
  SiteEditConfig,
  SiteFooterColumn,
  SiteFooterConfig,
  SiteReportConfig,
  SiteSidebarPromoConfig,
} from './types.ts'
import { SOCIAL_LINK_ICONS, SOCIAL_LINK_MODES } from './types.ts'

// z.function() infers to (...args: unknown[]) => unknown, which loses
// parameter and return types. z.custom<T> preserves exact signatures
// while still validating typeof === 'function' at runtime.

const titleTransformSchema = z.custom<(text: string, slug: string) => string>(isFunction)
const sortFnSchema = z.custom<(a: ResolvedPage, b: ResolvedPage) => number>(isFunction)
const contentFnSchema = z.custom<() => string | Promise<string>>(isFunction)
const logoFnSchema = z.custom<LogoFn>(isFunction)
const logoConfigSchema = z.union([z.string(), logoFnSchema])

const frontmatterSchema = z
  .object({
    title: z.string().optional(),
    titleTemplate: z.union([z.string(), z.boolean()]).optional(),
    description: z.string().optional(),
    layout: z.string().optional(),
    sidebar: z.boolean().optional(),
    aside: z.union([z.boolean(), z.literal('left')]).optional(),
    outline: z
      .union([z.literal(false), z.number(), z.tuple([z.number(), z.number()]), z.literal('deep')])
      .optional(),
    navbar: z.boolean().optional(),
    editLink: z.boolean().optional(),
    lastUpdated: z.boolean().optional(),
    footer: z.boolean().optional(),
    pageClass: z.string().optional(),
    head: z.array(z.tuple([z.string(), z.record(z.string(), z.string())])).optional(),
  })
  .strict()

const navItemSchema: z.ZodType<NavItem> = z.lazy(() =>
  z
    .object({
      title: z.string(),
      link: z.string().optional(),
      items: z.array(navItemSchema).optional(),
      activeMatch: z.string().optional(),
    })
    .strict()
)

const titleConfigSchema = z.union([
  z.string(),
  z
    .object({
      from: z.enum(['auto', 'filename', 'heading', 'frontmatter']),
      transform: titleTransformSchema.optional(),
    })
    .strict(),
])

const includeSchema = z.union([z.string(), z.array(z.string())])

const iconIdSchema: z.ZodType<IconId> = z
  .string()
  .refine((v) => v.includes(':')) as z.ZodType<IconId>

const iconImageSchema = z
  .object({
    src: z.string().min(1, 'icon.src must be a non-empty string'),
    alt: z.string().optional(),
  })
  .strict()

const iconConfigSchema = z.union([
  iconIdSchema,
  z.object({ id: iconIdSchema, color: z.string().optional() }).strict(),
  iconImageSchema,
])

const loaderConfigSchema = z
  .object({
    content: z.string().min(1, 'loader.content must be a non-empty string'),
    label: z.string().optional(),
    minDisplayMs: z.number().int().min(0).optional(),
    maxDisplayMs: z.number().int().min(0).optional(),
  })
  .strict()
  .refine(
    (cfg) => {
      const min = cfg.minDisplayMs ?? 150
      const max = cfg.maxDisplayMs ?? 5000
      // Allow some breathing room for the CSS fade transition (200ms) plus
      // a small margin so the forced dismissal doesn't truncate the fade.
      return max >= min + 200
    },
    { message: 'loader.maxDisplayMs must be at least minDisplayMs + 200ms (fade transition)' }
  )

const loaderFieldSchema = z.union([
  z.literal(false),
  z.enum(['apple', 'classic']),
  loaderConfigSchema,
])

const faviconConfigSchema = z.union([
  z.string().min(1, 'favicon path must be a non-empty string'),
  z
    .object({
      src: z.string().min(1, 'favicon.src must be a non-empty string'),
      type: z.string().optional(),
    })
    .strict(),
])

const cardConfigSchema = z
  .object({
    icon: iconConfigSchema.optional(),
    scope: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    badge: z.object({ src: z.string(), alt: z.string() }).strict().optional(),
  })
  .strict()

const entrySchema: z.ZodType<Section> = z.lazy(() =>
  z
    .object({
      title: titleConfigSchema,
      description: z.string().optional(),
      path: z.string().optional(),
      include: includeSchema.optional(),
      content: z.union([z.string(), contentFnSchema]).optional(),
      items: z.array(entrySchema).optional(),
      landing: z.boolean().optional(),
      collapsible: z.boolean().optional(),
      exclude: z.array(z.string()).optional(),
      hidden: z.boolean().optional(),
      frontmatter: frontmatterSchema.optional(),
      sort: z.union([z.enum(['default', 'alpha', 'filename', 'none']), sortFnSchema]).optional(),
      recursive: z.boolean().optional(),
      entryFile: z.string().optional(),
      icon: iconConfigSchema.optional(),
      card: cardConfigSchema.optional(),
      standalone: z.boolean().optional(),
      root: z.boolean().optional(),
    })
    .strict()
)

const openapiConfigSchema = z
  .object({
    spec: z.string(),
    path: z.string(),
    title: z.string().optional(),
    sidebarLayout: z.enum(['method-path', 'title']).optional(),
  })
  .strict()

const workspaceItemSchema = z
  .object({
    title: z.string(),
    icon: iconConfigSchema.optional(),
    description: z.string(),
    tags: z.array(z.string()).optional(),
    badge: z.object({ src: z.string(), alt: z.string() }).strict().optional(),
    path: z.string(),
    include: includeSchema.optional(),
    items: z.array(entrySchema).optional(),
    sort: z.union([z.enum(['default', 'alpha', 'filename', 'none']), sortFnSchema]).optional(),
    exclude: z.array(z.string()).optional(),
    recursive: z.boolean().optional(),
    entryFile: z.string().optional(),
    frontmatter: frontmatterSchema.optional(),
    openapi: openapiConfigSchema.optional(),
  })
  .strict()

const workspaceGroupSchema = z
  .object({
    title: z.string(),
    description: z.string().optional(),
    icon: iconIdSchema,
    items: z.array(workspaceItemSchema).min(1),
    link: z.string().optional(),
  })
  .strict()

const featureSchema = z
  .object({
    title: z.string(),
    description: z.string(),
    link: z.string().optional(),
    icon: iconConfigSchema.optional(),
  })
  .strict()

const sidebarLinkSchema = z
  .object({
    text: z.string(),
    link: z.string(),
    icon: iconConfigSchema.optional(),
    style: z.enum(['brand', 'alt', 'ghost']).optional(),
    shape: z.enum(['square', 'rounded', 'circle']).optional(),
  })
  .strict()

const sidebarConfigSchema = z
  .object({
    above: z.array(sidebarLinkSchema).optional(),
    below: z.array(sidebarLinkSchema).optional(),
  })
  .strict()

const truncateConfigSchema = z
  .object({
    title: z.number().int().min(1).optional(),
    description: z.number().int().min(1).optional(),
  })
  .strict()

// HomeGridConfig (columns + truncate + heading) — defined inline in
// `homeConfigSchema` below via `homeGridConfigWithHeadingSchema`.
// Keeping this no-op stub avoids breaking the schema-as-JSON snapshot
// in unrelated dirs; downstream code should reference the version with
// heading.

const heroActionSchema = z
  .object({
    theme: z.enum(['brand', 'alt']),
    text: z.string(),
    link: z.string(),
  })
  .strict()

const announcementConfigSchema = z
  .object({
    id: z.string().optional(),
    lead: z.string().optional(),
    message: z.string(),
    cta: z
      .object({
        href: z.string(),
        label: z.string(),
      })
      .strict()
      .optional(),
    persistent: z.boolean().optional(),
  })
  .strict()

const trustConfigSchema = z
  .object({
    lead: z.string().optional(),
    names: z.array(z.string()).optional(),
  })
  .strict()

const ctaConfigSchema = z
  .object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    actions: z.array(heroActionSchema).max(2).optional(),
  })
  .strict()

const homeSectionHeadingSchema = z
  .object({
    eyebrow: z.string().optional(),
    title: z.string().optional(),
    subtitle: z.string().optional(),
  })
  .strict()

const homeGridConfigWithHeadingSchema = z
  .object({
    columns: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
    truncate: truncateConfigSchema.optional(),
    heading: homeSectionHeadingSchema.optional(),
  })
  .strict()

const heroDemoImageSchema = z
  .object({
    src: z.string().min(1, 'heroDemo.src must be a non-empty string'),
    alt: z.string().optional(),
    width: z.union([z.number(), z.string()]).optional(),
    height: z.union([z.number(), z.string()]).optional(),
  })
  .strict()

const heroDemoLineSchema = z
  .object({
    kind: z.enum(['ok', 'info', 'cmt', 'err']),
    text: z.string(),
  })
  .strict()

const heroDemoTerminalSchema = z
  .object({
    windowTitle: z.string().optional(),
    command: z.string().min(1, 'heroDemo.command must be a non-empty string'),
    lines: z.array(heroDemoLineSchema),
  })
  .strict()

const heroDemoConfigSchema = z.union([heroDemoImageSchema, heroDemoTerminalSchema])

const splitVisualSchema = z
  .object({
    code: z.string().min(1, 'split.visual.code must be a non-empty string'),
    language: z.string().optional(),
  })
  .strict()

const splitConfigSchema = z
  .object({
    eyebrow: z.string().optional(),
    title: z.string().min(1, 'split.title is required'),
    body: z.string().optional(),
    bullets: z.array(z.string()).optional(),
    cta: z
      .object({
        text: z.string(),
        link: z.string(),
      })
      .strict()
      .optional(),
    visual: splitVisualSchema.optional(),
  })
  .strict()

const homeConfigSchema = z
  .object({
    features: homeGridConfigWithHeadingSchema.optional(),
    workspaces: homeGridConfigWithHeadingSchema.optional(),
    heroDemo: z.union([z.literal(false), heroDemoConfigSchema]).optional(),
    split: z.union([z.literal(false), splitConfigSchema]).optional(),
    eyebrow: z.string().optional(),
    trust: trustConfigSchema.optional(),
    cta: ctaConfigSchema.optional(),
  })
  .strict()

const siteEditConfigSchema = z
  .object({
    repo: z.string(),
    branch: z.string().optional(),
    directory: z.string().optional(),
    label: z.string().optional(),
  })
  .strict()

const siteReportConfigSchema = z
  .object({
    repo: z.string(),
    label: z.string().optional(),
  })
  .strict()

const siteSidebarPromoConfigSchema = z
  .object({
    title: z.string(),
    body: z.string(),
    cta: z
      .object({
        text: z.string(),
        href: z.string(),
      })
      .strict(),
  })
  .strict()

const siteCtaConfigSchema = z
  .object({
    text: z.string().describe('Visible label on the topbar CTA button.'),
    href: z.string().describe('Destination URL — relative path or absolute URL.'),
  })
  .strict()

const siteFooterColumnSchema = z
  .object({
    heading: z.string(),
    links: z.array(
      z
        .object({
          text: z.string(),
          href: z.string(),
        })
        .strict()
    ),
  })
  .strict()

const siteFooterConfigSchema = z
  .object({
    columns: z.array(siteFooterColumnSchema).optional(),
    tagline: z.string().optional(),
    brandMark: z.string().optional(),
  })
  .strict()

const siteConfigSchema = z
  .object({
    version: z.string().optional(),
    edit: siteEditConfigSchema.optional(),
    report: siteReportConfigSchema.optional(),
    sidebarPromo: siteSidebarPromoConfigSchema.optional(),
    topbarCta: siteCtaConfigSchema.optional(),
    announcement: announcementConfigSchema.optional(),
    footer: siteFooterConfigSchema.optional(),
  })
  .strict()

const socialLinkSchema = z
  .object({
    icon: z.union([z.enum(SOCIAL_LINK_ICONS), z.object({ svg: z.string() }).strict()]),
    mode: z.enum(SOCIAL_LINK_MODES),
    content: z.string(),
  })
  .strict()

const footerConfigSchema = z
  .object({
    message: z.string().optional(),
    copyright: z.string().optional(),
    socials: z.boolean().optional(),
  })
  .strict()

// Each variant's tokens are `unknown` because `defineTheme` validates the
// token tree against `tokensSchema` at factory time — duplicating that
// validation here would produce two diverging error surfaces.
//
// The envelope schema lives in `@ciderpress/theme` so both `defineTheme`
// (factory-time) and `ciderpressConfigSchema` (config-load-time) enforce
// identical invariants from a single source:
//   1. `name` is a valid slug AND not a reserved built-in / `'default'`
//   2. at least one of `variants.dark` / `variants.light` is present
//   3. `defaultVariant`, when provided, points at a declared variant
const ciderpressThemeInputSchema = themeInputEnvelopeSchema

export const ciderpressConfigSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    theme: themeConfigSchema.optional(),
    themes: z.array(ciderpressThemeInputSchema).optional(),
    loader: loaderFieldSchema
      .describe(
        "Inline FOUC loader. `'apple'` (default) is Ciderpress's native pixel-apple animation. `'classic'` is the legacy dots loader. `false` disables the loader. Pass a `LoaderConfig` object for a custom SVG glyph + label."
      )
      .optional(),
    icon: iconConfigSchema.optional(),
    logo: logoConfigSchema.optional(),
    banner: z.string().optional(),
    favicon: faviconConfigSchema.optional(),
    tagline: z.string().optional(),
    apps: z.array(workspaceItemSchema).optional(),
    packages: z.array(workspaceItemSchema).optional(),
    workspaces: z.array(workspaceGroupSchema).optional(),
    features: z.array(featureSchema).optional(),
    actions: z.array(heroActionSchema).max(2).optional(),
    sidebar: sidebarConfigSchema.optional(),
    sections: z.array(entrySchema).min(1, 'config.sections must have at least one entry'),
    nav: z.union([z.literal('auto'), z.array(navItemSchema)]).optional(),
    exclude: z.array(z.string()).optional(),
    home: homeConfigSchema.optional(),
    socialLinks: z.array(socialLinkSchema).optional(),
    footer: footerConfigSchema.optional(),
    openapi: openapiConfigSchema.optional(),
    site: siteConfigSchema.optional(),
  })
  .strict()

export const pathsSchema = z
  .object({
    repoRoot: z.string(),
    outputRoot: z.string(),
    contentDir: z.string(),
    publicDir: z.string(),
    distDir: z.string(),
    cacheDir: z.string(),
  })
  .strict()

// These compile-time assertions ensure non-recursive schemas stay
// in sync with their TypeScript types. If a schema field is added,
// removed, or renamed without updating the type, TypeScript errors.
// Recursive schemas (navItemSchema, entrySchema) are already guarded
// via their z.ZodType<T> annotations above.

// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardFrontmatter: z.ZodType<Frontmatter> = frontmatterSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardCardConfig: z.ZodType<CardConfig> = cardConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardHomeConfig: z.ZodType<HomeConfig> = homeConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardHomeTrustConfig: z.ZodType<HomeTrustConfig> = trustConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardHomeCtaConfig: z.ZodType<HomeCtaConfig> = ctaConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardAnnouncementConfig: z.ZodType<AnnouncementConfig> = announcementConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardSiteEditConfig: z.ZodType<SiteEditConfig> = siteEditConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardSiteReportConfig: z.ZodType<SiteReportConfig> = siteReportConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardSiteSidebarPromoConfig: z.ZodType<SiteSidebarPromoConfig> = siteSidebarPromoConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardSiteCtaConfig: z.ZodType<SiteCtaConfig> = siteCtaConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardSiteFooterColumn: z.ZodType<SiteFooterColumn> = siteFooterColumnSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardSiteFooterConfig: z.ZodType<SiteFooterConfig> = siteFooterConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardSiteConfig: z.ZodType<SiteConfig> = siteConfigSchema

// Re-export theme schemas so they remain reachable via this module for
// downstream consumers and JSON Schema generation tooling.
export { themeColorsSchema, themeConfigSchema }

/**
 * Runtime check for function values. Used by z.custom<T> to validate
 * function-typed config fields while preserving their exact TypeScript signature.
 *
 * @private
 * @param val - Value to check
 * @returns True if the value is a function
 */
function isFunction(val: unknown): boolean {
  return typeof val === 'function'
}
