/**
 * ciderpress Rspress theme entry.
 *
 * Re-exports the default Rspress theme and extends it with
 * ciderpress-specific components.
 *
 * Global styles are imported here so Rspress includes them
 * in the site bundle when this theme entry is loaded.
 */

// Rspress sibling CSS for components we shadow below. Re-exporting a ciderpress
// component under the same name (e.g. `CiderpressDocLayout as DocLayout`) lets the
// bundler tree-shake the original Rspress module — and with it the sibling
// `./index.css` side-effect import that ships the base structural styles. Import
// each sibling CSS file directly here so it survives the override.
import '@rspress/core/dist/theme/layout/DocLayout/index.css'
import '@rspress/core/dist/theme/components/HomeFeature/index.css'
import '@rspress/core/dist/theme/components/Sidebar/SidebarDivider.css'
import '@rspress/core/dist/theme/components/Sidebar/SidebarGroup.css'
import '@rspress/core/dist/theme/components/Sidebar/SidebarItem.css'
import '@rspress/core/dist/theme/components/Sidebar/SidebarSectionHeader.css'
import './styles/layers.css'
import './styles/overrides/fonts.css'
import './styles/overrides/tokens.css'
import './styles/overrides/rspress.css'
// Theme color palettes — scoped via [data-cp-theme][data-cp-variant] selectors.
// `mulled.css` ships first because it is `DEFAULT_THEME_NAME` — its rules emit
// the `:root { ... }` FOUC fallback that paints before JS hydrates the
// `data-cp-theme` attribute on `<html>`.
import './styles/themes/mulled.css'
import './styles/themes/honeycrisp.css'
import './styles/themes/grannysmith.css'
import './styles/themes/amber.css'
import './styles/themes/midnight.css'
import './styles/themes/arcade.css'
// arcade-fx.css is intentionally separate from arcade.css:
// arcade.css = color palette tokens, arcade-fx.css = visual effects
// (border trace, neon pulse, CRT scanlines, etc.) scoped to [data-cp-theme='arcade']
import './styles/themes/arcade-fx.css'
import './styles/overrides/details.css'
import './styles/overrides/scrollbar.css'
import './styles/overrides/rail.css'
import './styles/overrides/sidebar.css'
import './styles/overrides/content-footer.css'
import './styles/overrides/home.css'
import './styles/overrides/home-card.css'
import './styles/overrides/section-card.css'
import './styles/overrides/vscode.css'
import './styles/overrides/badge.css'
import './components/announcement/announcement-bar.css'
import './components/ask-ai/ask-ai-button.css'
import './components/content-footer/feedback.css'
import './components/content-footer/meta-actions.css'
import './components/content-footer/page-pager.css'
import './components/sidebar/framework-picker.css'
import './components/sidebar/sidebar-promo.css'
import './components/sidebar/sidebar-toggle.css'
import './components/home/page-rail.css'
import './components/home/hero.css'
import './components/home/hero-demo.css'
import './components/home/trust-strip.css'
import './components/home/split.css'
import './components/home/cta.css'
import './components/nav/ciderpress-docs-bar.css'
import './components/nav/nav-logo.css'
import './components/nav/version-chip.css'
import './components/nav/topbar-cta.css'
import './components/openapi/openapi.css'
import './components/shared/accordion.css'
import './components/shared/advanced-table.css'
import './components/shared/columns.css'
import './components/shared/status-badge.css'
import './components/shared/frame.css'
import './components/shared/tooltip.css'
import './components/shared/prompt.css'
import './components/shared/color.css'
import './components/shared/theme-color-palette.css'
import './components/shared/steps.css'
import './components/shared/field.css'

export * from '@rspress/core/theme-original'

/** @internal Rspress layout override — injects ciderpress nav components via layout slots */
export { Layout } from './components/nav/layout'
/** @internal Rspress doc-layout override — replaces `.rp-doc-layout__menu` with `<CiderpressDocsBar />` */
export { CiderpressDocLayout as DocLayout } from './components/nav/ciderpress-doc-layout'
/** @internal Home page feature block override */
export { HomeFeature } from './components/home/feature'
/** @internal Home page layout override */
export { HomeLayout } from './components/home/layout'
/** @internal Sidebar override — multi-scope filtering for standalone sections */
export { Sidebar } from './components/sidebar/sidebar-scope'

export { FeatureCard, FeatureGrid } from './components/home/feature-card'
export type { FeatureCardProps, FeatureItem } from './components/home/feature-card'
export { PageRail } from './components/home/page-rail'
export type { PageRailProps } from './components/home/page-rail'
export { Hero } from './components/home/hero'
export type { HeroProps, HeroAction } from './components/home/hero'
export { HeroDemo } from './components/home/hero-demo'
export { TrustStrip } from './components/home/trust-strip'
export type { TrustStripProps } from './components/home/trust-strip'
export { HomeSplit } from './components/home/split'
export type { SplitProps, SplitAction } from './components/home/split'
export { CTA } from './components/home/cta'
export type { CTAProps } from './components/home/cta'
export { WorkspaceCard } from './components/workspaces/card'
export type { WorkspaceCardProps } from './components/workspaces/card'
export { WorkspaceGrid } from './components/workspaces/grid'
export type { WorkspaceGridProps } from './components/workspaces/grid'
export { SectionCard } from './components/shared/section-card'
export type { SectionCardProps } from './components/shared/section-card'
export { SectionGrid } from './components/shared/section-grid'
export type { SectionGridProps } from './components/shared/section-grid'

export { DesktopWindow } from './components/shared/desktop-window'
export type { DesktopWindowProps, WindowTab } from './components/shared/desktop-window'
export { BrowserWindow } from './components/shared/desktop-window'
export type { BrowserWindowProps, BrowserTab } from './components/shared/desktop-window'
export { IDEWindow } from './components/shared/desktop-window'
export type { IDEWindowProps, IDEFileTab } from './components/shared/desktop-window'
export { TerminalWindow, Command, Output, Line } from './components/shared/desktop-window'
export type {
  TerminalWindowProps,
  TerminalColor,
  TerminalLineConfig,
  CommandProps,
  OutputProps,
  LineProps,
} from './components/shared/desktop-window'

export { Accordion, AccordionGroup } from './components/shared/accordion'
export type { AccordionProps, AccordionGroupProps } from './components/shared/accordion'
export { Columns, Column } from './components/shared/columns'
export type { ColumnsProps, ColumnProps } from './components/shared/columns'
export { Badge } from './components/shared/status-badge'
export type { BadgeProps, BadgeVariant } from './components/shared/status-badge'
export { Frame } from './components/shared/frame'
export type { FrameProps } from './components/shared/frame'
export { Tooltip } from './components/shared/tooltip'
export type { TooltipProps } from './components/shared/tooltip'
export { Prompt } from './components/shared/prompt'
export type { PromptProps, PromptAction } from './components/shared/prompt'
export { Color } from './components/shared/color'
export type { ColorProps } from './components/shared/color'
export { ThemeColorPalette } from './components/shared/theme-color-palette'
export type { ThemeColorPaletteProps } from './components/shared/theme-color-palette'
export { Steps, Step } from './components/shared/steps'
export type { StepsProps, StepProps } from './components/shared/steps'
export { Field, FieldGroup } from './components/shared/field'
export type { FieldProps, FieldGroupProps } from './components/shared/field'

export { OpenAPIOperation } from './components/openapi'
export type { OpenAPIOperationProps } from './components/openapi'
export { OpenAPIOverview } from './components/openapi'
export type { OpenAPIOverviewProps } from './components/openapi'

export { AnnouncementBar } from './components/announcement/announcement-bar'
export type { AnnouncementBarProps } from './components/announcement/announcement-bar'
export { AskAIButton } from './components/ask-ai/ask-ai-button'
export type { AskAIButtonProps } from './components/ask-ai/ask-ai-button'
export { Feedback } from './components/content-footer/feedback'
export type { FeedbackProps } from './components/content-footer/feedback'
export { MetaActions } from './components/content-footer/meta-actions'
export type { MetaAction, MetaActionsProps } from './components/content-footer/meta-actions'
export { PagePager } from './components/content-footer/page-pager'
export type { PagePagerProps, PagerLink } from './components/content-footer/page-pager'
export { FrameworkPicker } from './components/sidebar/framework-picker'
export type { FrameworkPickerProps } from './components/sidebar/framework-picker'
export { SidebarPromo } from './components/sidebar/sidebar-promo'
export type { SidebarPromoProps } from './components/sidebar/sidebar-promo'
export { SidebarToggle } from './components/sidebar/sidebar-toggle'

export { Icon } from './components/shared/icon'
export { TechTag } from './components/shared/tech-tag'
export type { TechTagProps } from './components/shared/tech-tag'
export { TechIconTable } from './components/shared/tech-icon-table'
export type { TechIconEntry, TechIconTableProps } from './components/shared/tech-icon-table'
