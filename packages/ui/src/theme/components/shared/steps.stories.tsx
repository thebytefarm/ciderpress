import type { Story } from '@ladle/react'

import { Step, Steps } from './steps.tsx'

const meta = {
  title: 'Data Display / Steps',
}

export default meta

/**
 * Default — three numbered steps in the standard h3 title size.
 *
 * @returns Steps with numbered indicators
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Default: Story = () => (
  <Steps>
    <Step title="Install">
      <p>Add Ciderpress to your monorepo:</p>
      <code>pnpm add ciderpress</code>
    </Step>
    <Step title="Configure">
      <p>Create `ciderpress.config.ts` at the repo root and point it at your docs directory.</p>
    </Step>
    <Step title="Run">
      <p>Start the dev server and open the printed URL.</p>
    </Step>
  </Steps>
)

/**
 * Icon indicators — each step's circle is replaced with the supplied
 * Iconify icon instead of a number.
 *
 * @returns Steps with icon indicators
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const WithIcons: Story = () => (
  <Steps>
    <Step title="Author" icon="pixelarticons:edit">
      <p>Write your docs as plain markdown — no special directives required.</p>
    </Step>
    <Step title="Sync" icon="pixelarticons:sync">
      <p>The sync engine mirrors your structure into the Rspress-expected layout.</p>
    </Step>
    <Step title="Ship" icon="pixelarticons:cloud-upload">
      <p>`pnpm cider build` produces a static site ready to deploy anywhere.</p>
    </Step>
  </Steps>
)

/**
 * Smaller title size — useful for nested steps or sidebar callouts.
 *
 * @returns Steps with paragraph-sized titles
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const ParagraphTitles: Story = () => (
  <Steps titleSize="p">
    <Step title="First check">
      <p>Verify Node 24+ is installed.</p>
    </Step>
    <Step title="Second check">
      <p>Confirm pnpm is on a recent version.</p>
    </Step>
  </Steps>
)
