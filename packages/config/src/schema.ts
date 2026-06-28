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
 * Recursive schemas (navItemSchema, pageSchema) are annotated with z.ZodType<T>
 * to enforce compile-time consistency between schemas and their TypeScript types.
 * If a schema field is renamed or changed without updating the type (or vice versa),
 * TypeScript will error here.
 *
 * Function fields use z.custom<T> with typed signatures to avoid z.function()'s
 * lossy (...args: unknown[]) => unknown inference, preserving exact call signatures.
 */

import {
  isBuiltInTheme,
  themeColorsSchema,
  themeConfigSchema,
  themeInputEnvelopeSchema,
} from '@ciderpress/theme'
import type { BuiltInThemeName } from '@ciderpress/theme'
import type { ComponentType } from 'react'
import { z } from 'zod'

import type {
  AnnouncementConfig,
  BannerConfig,
  BannerFn,
  BrandConfig,
  ButtonConfig,
  CardConfig,
  CopyrightConfig,
  DiscoverConfig,
  EditLinkConfig,
  Feature,
  FooterColumn,
  FooterConfig,
  Frontmatter,
  HomeConfig,
  HomeCtaConfig,
  HomeFeaturesConfig,
  HomeHeroConfig,
  HomeHeroDemoConfig,
  HomeHeroDemoImage,
  HomeHeroDemoLine,
  HomeHeroDemoTerminal,
  HomeLayoutEntry,
  HomeProofConfig,
  HomeSectionHeading,
  HomeSectionId,
  HomeShowcaseConfig,
  HomeSplitConfig,
  HomeSplitVisual,
  IconConfig,
  IconId,
  ImageSource,
  LoaderComponentConfig,
  LoaderConfig,
  LoaderStaticConfig,
  LogoConfig,
  LogoFn,
  NavItem,
  OpenAPISpec,
  Page,
  Paths,
  ReportLinkConfig,
  ResolvedPage,
  SidebarConfig,
  SidebarPromo,
  SocialLink,
  SortStrategy,
  ThemeEntry,
  ThemeSettings,
  TitleConfig,
  TopbarConfig,
  TruncateConfig,
  Workspace,
  WorkspaceGroup,
} from './types.ts'
import { SOCIAL_LINK_ICONS } from './types.ts'

// z.function() infers to (...args: unknown[]) => unknown, which loses
// parameter and return types. z.custom<T> preserves exact signatures
// while still validating typeof === 'function' at runtime.

const titleTransformSchema = z.custom<(text: string, slug: string) => string>(isFunction)
const sortFnSchema = z.custom<(a: ResolvedPage, b: ResolvedPage) => number>(isFunction)
const contentFnSchema = z.custom<() => string | Promise<string>>(isFunction)
const logoFnSchema = z.custom<LogoFn>(isFunction)
const bannerFnSchema = z.custom<BannerFn>(isFunction)
const editLinkUrlFnSchema = z.custom<(page: ResolvedPage) => string>(isFunction)
const editLinkOnResolveFnSchema = z.custom<(page: ResolvedPage) => void>(isFunction)
const reportLinkUrlFnSchema = z.custom<(page: ResolvedPage) => string>(isFunction)
const reportLinkOnResolveFnSchema = z.custom<(page: ResolvedPage) => void>(isFunction)
const layoutComponentSchema = z.custom<ComponentType<{ readonly paths: Paths }>>(isFunction)
const loaderComponentSchema = z.custom<ComponentType>(isFunction)

const logoConfigSchema = z.union([z.string(), logoFnSchema])

const bannerConfigSchema = z.union([z.string(), bannerFnSchema])

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

const imageSourceSchema = z.union([
  z.string().min(1),
  z
    .object({
      src: z.string().min(1),
      alt: z.string().optional(),
      type: z.string().optional(),
      width: z.union([z.number(), z.string()]).optional(),
      height: z.union([z.number(), z.string()]).optional(),
    })
    .strict(),
])

const sortStrategySchema = z.union([z.enum(['default', 'alpha', 'filename', 'none']), sortFnSchema])

const LOADER_TIMING_MESSAGE =
  'loader.maxDisplayMs must be at least minDisplayMs + 200ms (fade transition)'

const loaderStaticConfigSchema = z
  .object({
    content: z.string().min(1, 'loader.content must be a non-empty string'),
    label: z.string().optional(),
    minDisplayMs: z.number().int().min(0).optional(),
    maxDisplayMs: z.number().int().min(0).optional(),
  })
  .strict()
  .refine(loaderTimingRule, { message: LOADER_TIMING_MESSAGE })

const loaderComponentConfigSchema = z
  .object({
    component: loaderComponentSchema,
    label: z.string().optional(),
    minDisplayMs: z.number().int().min(0).optional(),
    maxDisplayMs: z.number().int().min(0).optional(),
  })
  .strict()
  .refine(loaderTimingRule, { message: LOADER_TIMING_MESSAGE })

const loaderConfigSchema = z.union([loaderStaticConfigSchema, loaderComponentConfigSchema])

const loaderFieldSchema = z.union([
  z.literal(false),
  z.enum(['apple', 'classic']),
  loaderConfigSchema,
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

const buttonConfigSchema = z
  .object({
    text: z.string(),
    href: z.string(),
    variant: z.enum(['primary', 'secondary', 'ghost']).optional(),
    shape: z.enum(['square', 'rounded', 'circle']).optional(),
    icon: iconConfigSchema.optional(),
  })
  .strict()

const openAPISpecSchema = z
  .object({
    spec: z.string(),
    path: z.string(),
    title: z.string().optional(),
    sidebarLayout: z.enum(['method-path', 'title']).optional(),
  })
  .strict()

const pageSchema: z.ZodType<Page> = z.lazy(() =>
  z
    .object({
      title: titleConfigSchema,
      description: z.string().optional(),
      path: z.string().optional(),
      icon: iconConfigSchema.optional(),
      include: includeSchema.optional(),
      content: z.union([z.string(), contentFnSchema]).optional(),
      pages: z.array(pageSchema).optional(),
      nav: z
        .object({
          hidden: z.boolean().optional(),
          collapsible: z.boolean().optional(),
          island: z.boolean().optional(),
          root: z.boolean().optional(),
        })
        .strict()
        .optional(),
      landing: z.boolean().optional(),
      card: cardConfigSchema.optional(),
      defaults: frontmatterSchema.optional(),
      discover: z
        .object({
          sort: sortStrategySchema.optional(),
          recursive: z.boolean().optional(),
          ignore: z.array(z.string()).optional(),
          indexFile: z.string().optional(),
        })
        .strict()
        .optional(),
      openapi: openAPISpecSchema.optional(),
    })
    .strict()
)

const workspaceSchema = z
  .object({
    title: titleConfigSchema,
    icon: iconConfigSchema.optional(),
    description: z.string(),
    tags: z.array(z.string()).optional(),
    badge: z.object({ src: z.string(), alt: z.string() }).strict().optional(),
    path: z.string(),
    include: includeSchema.optional(),
    pages: z.array(pageSchema).optional(),
    defaults: frontmatterSchema.optional(),
    discover: z
      .object({
        sort: sortStrategySchema.optional(),
        recursive: z.boolean().optional(),
        ignore: z.array(z.string()).optional(),
        indexFile: z.string().optional(),
      })
      .strict()
      .optional(),
    openapi: openAPISpecSchema.optional(),
  })
  .strict()

const workspaceGroupSchema = z
  .object({
    title: z.string(),
    description: z.string().optional(),
    icon: iconConfigSchema,
    items: z.array(workspaceSchema).min(1),
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

const sidebarPromoSchema = z
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

const sidebarConfigSchema = z
  .object({
    top: z.array(buttonConfigSchema).optional(),
    bottom: z.array(buttonConfigSchema).optional(),
    promo: sidebarPromoSchema.optional(),
  })
  .strict()

const truncateConfigSchema = z
  .object({
    title: z.number().int().min(1).optional(),
    description: z.number().int().min(1).optional(),
  })
  .strict()

const homeSectionHeadingSchema = z
  .object({
    label: z.string().optional(),
    title: z.string().optional(),
    subtitle: z.string().optional(),
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

const homeProofConfigSchema = z
  .object({
    lead: z.string().optional(),
    names: z.array(z.string()).optional(),
  })
  .strict()

const homeCtaConfigSchema = z
  .object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    actions: z.array(buttonConfigSchema).optional(),
  })
  .strict()

const homeHeroDemoImageSchema = z
  .object({
    src: z.string().min(1, 'hero.demo.src must be a non-empty string'),
    alt: z.string().optional(),
    width: z.union([z.number(), z.string()]).optional(),
    height: z.union([z.number(), z.string()]).optional(),
  })
  .strict()

const homeHeroDemoLineSchema = z
  .object({
    kind: z.enum(['ok', 'info', 'cmt', 'err']),
    text: z.string(),
  })
  .strict()

const homeHeroDemoTerminalSchema = z
  .object({
    windowTitle: z.string().optional(),
    command: z.string().min(1, 'hero.demo.command must be a non-empty string'),
    lines: z.array(homeHeroDemoLineSchema),
  })
  .strict()

const homeHeroDemoConfigSchema = z.union([homeHeroDemoImageSchema, homeHeroDemoTerminalSchema])

const homeHeroConfigSchema = z
  .object({
    label: z.string().optional(),
    tagline: z.string().optional(),
    actions: z.array(buttonConfigSchema).optional(),
    demo: z.union([z.literal(false), homeHeroDemoConfigSchema]).optional(),
  })
  .strict()

const homeFeaturesConfigSchema = z
  .object({
    items: z.array(featureSchema).optional(),
    columns: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
    truncate: truncateConfigSchema.optional(),
    heading: homeSectionHeadingSchema.optional(),
  })
  .strict()

const homeShowcaseConfigSchema = z
  .object({
    columns: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
    truncate: truncateConfigSchema.optional(),
    heading: homeSectionHeadingSchema.optional(),
    source: z.union([z.literal('workspaces'), z.array(z.string())]).optional(),
  })
  .strict()

const homeSplitVisualSchema = z
  .object({
    code: z.string().min(1, 'split.visual.code must be a non-empty string'),
    language: z.string().optional(),
  })
  .strict()

const homeSplitConfigSchema = z
  .object({
    label: z.string().optional(),
    title: z.string().min(1, 'split.title is required'),
    body: z.string().optional(),
    bullets: z.array(z.string()).optional(),
    cta: buttonConfigSchema.optional(),
    visual: homeSplitVisualSchema.optional(),
  })
  .strict()

const homeSectionIdSchema = z.enum(['hero', 'proof', 'features', 'showcase', 'split', 'cta'])

const homeLayoutEntrySchema = z.union([
  homeSectionIdSchema,
  z.object({ sectionId: homeSectionIdSchema }).strict(),
  z.object({ component: layoutComponentSchema }).strict(),
  z.object({ component: z.string() }).strict(),
])

const homeConfigSchema = z
  .object({
    hero: homeHeroConfigSchema.optional(),
    proof: homeProofConfigSchema.optional(),
    features: homeFeaturesConfigSchema.optional(),
    showcase: homeShowcaseConfigSchema.optional(),
    split: z.union([z.literal(false), homeSplitConfigSchema]).optional(),
    cta: homeCtaConfigSchema.optional(),
    layout: z
      .array(homeLayoutEntrySchema)
      .refine(
        (entries) => {
          const sectionIds = entries.flatMap((entry) => {
            if (typeof entry === 'string') {
              return [entry]
            }
            if (entry !== null && typeof entry === 'object' && 'sectionId' in entry) {
              return [entry.sectionId]
            }
            return []
          })
          return new Set(sectionIds).size === sectionIds.length
        },
        { message: 'home.layout must not contain duplicate section ids' }
      )
      .meta({ uniqueItems: true })
      .optional(),
  })
  .strict()

const socialLinkSchema = z
  .object({
    icon: z.union([z.enum(SOCIAL_LINK_ICONS), z.object({ svg: z.string() }).strict()]),
    url: z.string(),
    label: z.string().optional(),
  })
  .strict()

const topbarConfigSchema = z
  .object({
    nav: z.union([z.literal('auto'), z.array(navItemSchema)]).optional(),
    cta: buttonConfigSchema.optional(),
    socials: z.union([z.literal(true), z.array(socialLinkSchema)]).optional(),
    announcement: announcementConfigSchema.optional(),
  })
  .strict()

const footerColumnSchema = z
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

const copyrightConfigSchema = z
  .object({
    company: z.string().optional(),
    dba: z.string().optional(),
    year: z.union([z.number(), z.object({ from: z.number() }).strict()]).optional(),
  })
  .strict()

const footerConfigSchema = z
  .object({
    message: z.string().optional(),
    copyright: z.union([z.literal(true), z.string(), copyrightConfigSchema]).optional(),
    columns: z.array(footerColumnSchema).optional(),
    tagline: z.string().optional(),
    brandMark: z.string().optional(),
    socials: z.union([z.literal(true), z.array(socialLinkSchema)]).optional(),
  })
  .strict()

const editLinkConfigSchema = z
  .object({
    repo: z.string().optional(),
    branch: z.string().optional(),
    directory: z.string().optional(),
    label: z.string().optional(),
    url: editLinkUrlFnSchema.optional(),
    onResolve: editLinkOnResolveFnSchema.optional(),
  })
  .strict()

const reportLinkConfigSchema = z
  .object({
    repo: z.string().optional(),
    branch: z.string().optional(),
    directory: z.string().optional(),
    label: z.string().optional(),
    url: reportLinkUrlFnSchema.optional(),
    onResolve: reportLinkOnResolveFnSchema.optional(),
  })
  .strict()

const discoverConfigSchema = z
  .object({
    ignore: z.array(z.string()).optional(),
  })
  .strict()

const brandConfigSchema = z
  .object({
    icon: iconConfigSchema.optional(),
    logo: logoConfigSchema.optional(),
    banner: bannerConfigSchema.optional(),
    favicon: imageSourceSchema.optional(),
    loader: loaderFieldSchema.optional(),
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

// Bare built-in theme name — runtime check via `isBuiltInTheme` (the
// theme package owns the canonical built-in name list). Cast preserves
// the `BuiltInThemeName` literal-union output type so `_guardThemeEntry`
// can assert assignability without a fresh enum tuple here.
const builtInThemeNameSchema = z.string().refine(isBuiltInTheme, {
  message: 'Theme name must be a built-in theme',
}) as unknown as z.ZodType<BuiltInThemeName>

// `{ name, default? }` reference to a built-in theme. Separated from the
// custom-envelope variant because the envelope requires `variants` while
// this form forbids it.
const builtInThemeRefSchema = z
  .object({
    name: builtInThemeNameSchema,
    default: z.boolean().optional(),
  })
  .strict()

// Custom envelope extended with an optional `default: boolean` marker.
// Mirrors `themeInputEnvelopeSchema` in `@ciderpress/theme` but adds the
// `default` field — kept in lockstep with the upstream envelope shape.
// The envelope's `.strict()` would reject `default`, so we reconstruct
// it locally instead of attempting an intersection.
const ciderpressThemeInputWithDefaultSchema = z
  .object({
    name: z.string(),
    variants: z
      .object({
        dark: z.unknown().optional(),
        light: z.unknown().optional(),
      })
      .strict()
      .refine((v) => v.dark !== undefined || v.light !== undefined, {
        message: 'Theme variants must declare at least one of `dark` or `light`',
      }),
    defaultVariant: z.enum(['dark', 'light']).optional(),
    default: z.boolean().optional(),
  })
  .strict()
  .refine(
    (theme) => {
      if (theme.defaultVariant === undefined) {
        return true
      }
      return theme.variants[theme.defaultVariant] !== undefined
    },
    {
      message: '`defaultVariant` must point at a variant declared in `variants`',
      path: ['defaultVariant'],
    }
  )

const themeEntrySchema = z.union([
  builtInThemeNameSchema,
  builtInThemeRefSchema,
  ciderpressThemeInputSchema,
  ciderpressThemeInputWithDefaultSchema,
])

const themeSettingsSchema = z
  .object({
    themes: z.array(themeEntrySchema),
    defaultVariant: z.enum(['light', 'dark', 'system']).optional(),
    themeSwitcher: z.boolean().optional(),
    variantSwitcher: z.boolean().optional(),
    overrides: themeColorsSchema.optional(),
  })
  .strict()

export const ciderpressConfigSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    base: z
      .string()
      .regex(/^\/.*\/$/, 'base must start and end with `/` (e.g. `/examples/simple/`)')
      .optional(),
    version: z.string().optional(),
    brand: brandConfigSchema.optional(),
    theme: themeSettingsSchema.optional(),
    pages: z.array(pageSchema).min(1, 'config.pages must have at least one entry'),
    apps: z.array(workspaceSchema).optional(),
    packages: z.array(workspaceSchema).optional(),
    workspaces: z.array(workspaceGroupSchema).optional(),
    socials: z.array(socialLinkSchema).optional(),
    topbar: topbarConfigSchema.optional(),
    sidebar: sidebarConfigSchema.optional(),
    footer: footerConfigSchema.optional(),
    editLink: z.union([z.literal(false), editLinkConfigSchema]).optional(),
    reportLink: z.union([z.literal(false), reportLinkConfigSchema]).optional(),
    home: homeConfigSchema.optional(),
    discover: discoverConfigSchema.optional(),
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
// Recursive schemas (navItemSchema, pageSchema) are already guarded
// via their z.ZodType<T> annotations above.

// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardFrontmatter: z.ZodType<Frontmatter> = frontmatterSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardCardConfig: z.ZodType<CardConfig> = cardConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardWorkspace: z.ZodType<Workspace> = workspaceSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardWorkspaceGroup: z.ZodType<WorkspaceGroup> = workspaceGroupSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardFeature: z.ZodType<Feature> = featureSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardButtonConfig: z.ZodType<ButtonConfig> = buttonConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardSocialLink: z.ZodType<SocialLink> = socialLinkSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardLogoConfig: z.ZodType<LogoConfig> = logoConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardBannerConfig: z.ZodType<BannerConfig> = bannerConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardLoaderConfig: z.ZodType<LoaderConfig> = loaderConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardLoaderStaticConfig: z.ZodType<LoaderStaticConfig> = loaderStaticConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardLoaderComponentConfig: z.ZodType<LoaderComponentConfig> = loaderComponentConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardImageSource: z.ZodType<ImageSource> = imageSourceSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardIconConfig: z.ZodType<IconConfig> = iconConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardTitleConfig: z.ZodType<TitleConfig> = titleConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardSortStrategy: z.ZodType<SortStrategy> = sortStrategySchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardHomeHeroConfig: z.ZodType<HomeHeroConfig> = homeHeroConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardHomeProofConfig: z.ZodType<HomeProofConfig> = homeProofConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardHomeFeaturesConfig: z.ZodType<HomeFeaturesConfig> = homeFeaturesConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardHomeShowcaseConfig: z.ZodType<HomeShowcaseConfig> = homeShowcaseConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardHomeSplitConfig: z.ZodType<HomeSplitConfig> = homeSplitConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardHomeSplitVisual: z.ZodType<HomeSplitVisual> = homeSplitVisualSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardHomeCtaConfig: z.ZodType<HomeCtaConfig> = homeCtaConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardHomeHeroDemoConfig: z.ZodType<HomeHeroDemoConfig> = homeHeroDemoConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardHomeHeroDemoImage: z.ZodType<HomeHeroDemoImage> = homeHeroDemoImageSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardHomeHeroDemoTerminal: z.ZodType<HomeHeroDemoTerminal> = homeHeroDemoTerminalSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardHomeHeroDemoLine: z.ZodType<HomeHeroDemoLine> = homeHeroDemoLineSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardHomeSectionHeading: z.ZodType<HomeSectionHeading> = homeSectionHeadingSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardHomeLayoutEntry: z.ZodType<HomeLayoutEntry> = homeLayoutEntrySchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardHomeConfig: z.ZodType<HomeConfig> = homeConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardHomeSectionId: z.ZodType<HomeSectionId> = homeSectionIdSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardBrandConfig: z.ZodType<BrandConfig> = brandConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardThemeSettings: z.ZodType<ThemeSettings> = themeSettingsSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardThemeEntry: z.ZodType<ThemeEntry> = themeEntrySchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardTopbarConfig: z.ZodType<TopbarConfig> = topbarConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardSidebarConfig: z.ZodType<SidebarConfig> = sidebarConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardSidebarPromo: z.ZodType<SidebarPromo> = sidebarPromoSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardFooterConfig: z.ZodType<FooterConfig> = footerConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardFooterColumn: z.ZodType<FooterColumn> = footerColumnSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardCopyrightConfig: z.ZodType<CopyrightConfig> = copyrightConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardEditLinkConfig: z.ZodType<EditLinkConfig> = editLinkConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardReportLinkConfig: z.ZodType<ReportLinkConfig> = reportLinkConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardAnnouncementConfig: z.ZodType<AnnouncementConfig> = announcementConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardOpenAPISpec: z.ZodType<OpenAPISpec> = openAPISpecSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardDiscoverConfig: z.ZodType<DiscoverConfig> = discoverConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardTruncateConfig: z.ZodType<TruncateConfig> = truncateConfigSchema

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

/**
 * Loader timing-window guard — the forced-dismiss `maxDisplayMs` must leave
 * at least 200ms of headroom beyond `minDisplayMs` so the CSS fade transition
 * completes without being truncated by the forced dismissal. Shared between
 * the static-glyph and React-component loader variants so the rule lives in
 * one place.
 *
 * @private
 * @param cfg - Loader config carrying optional `minDisplayMs` / `maxDisplayMs`
 * @returns True when the timing window leaves room for the fade transition
 */
function loaderTimingRule(cfg: {
  readonly minDisplayMs?: number
  readonly maxDisplayMs?: number
}): boolean {
  const min = cfg.minDisplayMs ?? 150
  const max = cfg.maxDisplayMs ?? 5000
  return max >= min + 200
}
