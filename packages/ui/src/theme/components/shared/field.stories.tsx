import type { Story } from '@ladle/react'

import { Field, FieldGroup } from './field.tsx'

const meta = {
  title: 'Forms / Field',
}

export default meta

/**
 * Required field with a type pill.
 *
 * @returns Required field
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Required: Story = () => (
  <Field name="title" type="string" required>
    The site title displayed in the navbar and document `&lt;title&gt;`.
  </Field>
)

/**
 * Optional field — default badge state.
 *
 * @returns Optional field
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Optional: Story = () => (
  <Field name="base" type="string">
    Base path for the deployed site, e.g. `'/docs/'`.
  </Field>
)

/**
 * Deprecated field — name is struck through, badge swaps for
 * `deprecated`.
 *
 * @returns Deprecated field
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Deprecated: Story = () => (
  <Field name="legacyTheme" type="string" deprecated>
    Use `theme` instead. Will be removed in 2.0.
  </Field>
)

/**
 * Field with a default value rendered below the header row.
 *
 * @returns Field with default value
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const WithDefault: Story = () => (
  <Field
    name="theme"
    type="'mulled' | 'honeycrisp' | 'grannysmith' | 'amber' | 'midnight' | 'arcade'"
    defaultValue="'mulled'"
  >
    Built-in theme palette applied to the site.
  </Field>
)

/**
 * Multiple fields wrapped in a static group (titled section with
 * bottom border).
 *
 * @returns Field group with three fields
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Grouped: Story = () => (
  <FieldGroup title="Site config">
    <Field name="title" type="string" required>
      The site title.
    </Field>
    <Field name="description" type="string">
      Meta description used for SEO and link previews.
    </Field>
    <Field name="base" type="string" defaultValue="'/'">
      Base path for the deployed site.
    </Field>
  </FieldGroup>
)

/**
 * Expandable group — collapsible panel with chevron trigger.
 *
 * @returns Expandable field group
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Expandable: Story = () => (
  <FieldGroup title="Advanced options" expandable>
    <Field name="markdown.toc.level" type="number[]" defaultValue="[2, 3]">
      Heading levels included in the table of contents.
    </Field>
    <Field name="search" type="'local' | false" defaultValue="'local'">
      Search provider. Set to `false` to disable the in-page search panel.
    </Field>
  </FieldGroup>
)
