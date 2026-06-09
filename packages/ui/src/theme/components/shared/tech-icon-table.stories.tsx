import type { Story } from '@ladle/react'

import { TechIconTable } from './tech-icon-table.tsx'

const meta = {
  title: 'Icons / Tech Icon Table',
}

export default meta

/**
 * Default — table of language icons matching what auto-generated
 * reference docs render.
 *
 * @returns Tech-icon table with 6 entries
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Default: Story = () => (
  <TechIconTable
    entries={[
      { tag: 'typescript', icon: 'devicon:typescript', label: 'TypeScript' },
      { tag: 'javascript', icon: 'devicon:javascript', label: 'JavaScript' },
      { tag: 'python', icon: 'devicon:python', label: 'Python' },
      { tag: 'rust', icon: 'devicon:rust', label: 'Rust' },
      { tag: 'go', icon: 'devicon:go', label: 'Go' },
      { tag: 'java', icon: 'devicon:java', label: 'Java' },
    ]}
  />
)
