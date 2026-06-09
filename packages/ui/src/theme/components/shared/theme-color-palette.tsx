import {
  BUILT_IN_THEMES,
  isBuiltInTheme,
  resolveDefaultVariant,
  resolveThemeVariants,
} from '@ciderpress/theme'
import type { BuiltInThemeName, ThemeVariant } from '@ciderpress/theme'
import { match, P } from 'massaman/match'
import { useState } from 'react'
import type React from 'react'

import { Accordion } from './accordion.tsx'
import { Color } from './color.tsx'
import { Icon } from './icon.tsx'

export interface ThemeColorPaletteProps {
  /**
   * Built-in theme to render. Accepts any name in `BUILT_IN_THEMES`.
   */
  readonly theme: BuiltInThemeName
  /**
   * Initial variant to render. Defaults to the theme's `defaultVariant`.
   * If the requested variant is not declared by the theme, falls back to
   * the default.
   */
  readonly variant?: ThemeVariant
  /**
   * Title shown on the accordion trigger. Defaults to the theme name.
   */
  readonly title?: string
  /**
   * Description shown below the trigger title.
   */
  readonly description?: string
  /**
   * Whether the palette accordion starts expanded.
   */
  readonly defaultOpen?: boolean
}

interface ColorEntry {
  readonly name: string
  readonly value: string
}

interface ColorGroup {
  readonly heading: string
  readonly colors: readonly ColorEntry[]
}

const VARIANT_LABEL: Readonly<Record<ThemeVariant, string>> = Object.freeze({
  dark: 'Dark',
  light: 'Light',
})

const VARIANT_ICON: Readonly<Record<ThemeVariant, string>> = Object.freeze({
  dark: 'pixelarticons:moon',
  light: 'pixelarticons:sun',
})

/**
 * Collapsible palette display for a built-in theme. Renders every brand,
 * surface, text, border, and semantic color token as a copy-on-click
 * {@link Color} swatch, grouped under a single {@link Accordion}. When the
 * theme declares both `dark` and `light` variants, a sun/moon segmented
 * control inside the panel switches between them in place.
 *
 * @param props - Theme palette configuration
 * @returns React element with the collapsible palette
 */
export function ThemeColorPalette({
  theme,
  variant,
  title,
  description,
  defaultOpen = false,
}: ThemeColorPaletteProps): React.ReactElement | null {
  const themeEntry = match(isBuiltInTheme(theme))
    .with(true, () => BUILT_IN_THEMES[theme])
    .otherwise(() => null)
  if (themeEntry === null) {
    return null
  }

  const variants = resolveThemeVariants(theme)
  const initialVariant = resolveVariant(theme, variant)
  const [activeVariant, setActiveVariant] = useState<ThemeVariant>(initialVariant)

  const tokens = themeEntry.variants[activeVariant]
  if (tokens === undefined) {
    return null
  }

  const groups = buildGroups(tokens)
  const headingText = title ?? theme
  const subtitle =
    description ?? `Brand, surface, text, border, and semantic tokens for the ${theme} theme.`

  const showToggle = variants.length > 1

  return (
    <Accordion
      id={`theme-palette-${theme}`}
      title={headingText}
      description={subtitle}
      icon="pixelarticons:eyedropper"
      defaultOpen={defaultOpen}
    >
      <div className="cp-theme-color-palette">
        {match(showToggle)
          .with(true, () => (
            <div
              className="cp-theme-color-palette__variants"
              role="radiogroup"
              aria-label="Variant"
            >
              {variants.map((v) => {
                const selected = v === activeVariant
                return (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className="cp-theme-color-palette__variant"
                    data-active={selected}
                    onClick={() => setActiveVariant(v)}
                  >
                    <Icon icon={VARIANT_ICON[v]} />
                    <span>{VARIANT_LABEL[v]}</span>
                  </button>
                )
              })}
            </div>
          ))
          .otherwise(() => null)}
        {groups.map((group) => (
          <section key={group.heading} className="cp-theme-color-palette__group">
            <h4 className="cp-theme-color-palette__heading">{group.heading}</h4>
            <div className="cp-theme-color-palette__grid">
              {group.colors.map((c) => (
                <Color key={c.name} value={c.value} name={c.name} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </Accordion>
  )
}

/**
 * Resolve a variant for the requested theme — falls back to the theme's
 * default when the requested variant is unavailable.
 *
 * @private
 * @param theme - Built-in theme identifier
 * @param requested - Variant supplied by the caller (optional)
 * @returns Variant guaranteed to exist on the theme
 */
function resolveVariant(
  theme: BuiltInThemeName,
  requested: ThemeVariant | undefined
): ThemeVariant {
  const fallback = resolveDefaultVariant(theme)
  return match(requested)
    .with(P.nullish, () => fallback)
    .with(P.string, (v) => {
      const exists = BUILT_IN_THEMES[theme].variants[v] !== undefined
      return match(exists)
        .with(true, () => v)
        .otherwise(() => fallback)
    })
    .exhaustive()
}

/**
 * Project a parsed token tree into the grouped layout rendered by the
 * palette accordion.
 *
 * @private
 * @param tokens - Token tree from `BUILT_IN_THEMES[theme].variants[variant]`
 * @returns Ordered list of groups suitable for the swatch grid
 */
function buildGroups(tokens: {
  readonly colors: {
    readonly brand: {
      readonly primary: string
      readonly hover: string
      readonly active: string
      readonly soft: string
      readonly fg: string
      readonly light: string
      readonly lighter: string
    }
    readonly surface: {
      readonly bg: string
      readonly bgAlt: string
      readonly bgElv: string
      readonly bgSoft: string
      readonly homeBg: string
      readonly gutter: string
      readonly codeBlockBg: string
    }
    readonly text: {
      readonly text1: string
      readonly text2: string
      readonly text3: string
    }
    readonly border: {
      readonly border: string
      readonly divider: string
    }
    readonly semantic: {
      readonly success: string
      readonly error: string
      readonly warn: string
      readonly info: string
      readonly muted: string
    }
  }
}): readonly ColorGroup[] {
  const { brand, surface, text, border, semantic } = tokens.colors
  return [
    {
      heading: 'Brand',
      colors: [
        { name: 'primary', value: brand.primary },
        { name: 'hover', value: brand.hover },
        { name: 'active', value: brand.active },
        { name: 'soft', value: brand.soft },
        { name: 'fg (on-brand)', value: brand.fg },
        { name: 'light', value: brand.light },
        { name: 'lighter', value: brand.lighter },
      ],
    },
    {
      heading: 'Surface',
      colors: [
        { name: 'bg', value: surface.bg },
        { name: 'bgAlt', value: surface.bgAlt },
        { name: 'bgElv', value: surface.bgElv },
        { name: 'bgSoft', value: surface.bgSoft },
        { name: 'homeBg', value: surface.homeBg },
        { name: 'gutter', value: surface.gutter },
        { name: 'codeBlockBg', value: surface.codeBlockBg },
      ],
    },
    {
      heading: 'Text',
      colors: [
        { name: 'text1', value: text.text1 },
        { name: 'text2', value: text.text2 },
        { name: 'text3', value: text.text3 },
      ],
    },
    {
      heading: 'Border',
      colors: [
        { name: 'border', value: border.border },
        { name: 'divider', value: border.divider },
      ],
    },
    {
      heading: 'Semantic',
      colors: [
        { name: 'success', value: semantic.success },
        { name: 'error', value: semantic.error },
        { name: 'warn', value: semantic.warn },
        { name: 'info', value: semantic.info },
        { name: 'muted', value: semantic.muted },
      ],
    },
  ]
}
