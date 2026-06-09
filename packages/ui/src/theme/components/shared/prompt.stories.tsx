import type { Story } from '@ladle/react'

import { Prompt } from './prompt.tsx'

const meta = {
  title: 'Data Display / Prompt',
}

export default meta

const SAMPLE_PROMPT = `You are a senior TypeScript engineer. Review the diff below and flag
correctness issues, edge cases, and missing tests. Be terse and prescriptive
— no praise, no recap.`

/**
 * Default — description, copy action, and an expandable code view of
 * the raw prompt text.
 *
 * @returns Prompt with single Copy action
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Default: Story = () => (
  <Prompt description="Senior TypeScript code review prompt">{SAMPLE_PROMPT}</Prompt>
)

/**
 * Prompt with multiple actions — Copy is primary, the rest live in a
 * dropdown next to it.
 *
 * @returns Prompt with full action set
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const MultipleActions: Story = () => (
  <Prompt
    description="Open this prompt in your tool of choice"
    actions={['copy', 'cursor', 'vscode', 'chatgpt', 'claude']}
  >
    {SAMPLE_PROMPT}
  </Prompt>
)

/**
 * Custom icon — overrides the default `pixelarticons:sparkles`.
 *
 * @returns Prompt with custom icon
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const CustomIcon: Story = () => (
  <Prompt
    icon="pixelarticons:bug"
    description="Reproduce and isolate a flaky test"
    actions={['copy', 'claude']}
  >
    Identify which test is flaky in the attached file, reduce it to a minimal repro, and propose a
    fix that doesn't trade speed for stability.
  </Prompt>
)
