import { getCustomMDXComponent } from '@rspress/core/theme'
import { match, P } from 'massaman/match'
import type React from 'react'

import { AdvancedTable } from './advanced-table'
import type { ParsedTable } from './advanced-table.parse'
import { parseRenderedTable } from './advanced-table.parse'

const MIN_ENHANCED_ROWS = 5

/**
 * Drop-in override for the intrinsic markdown `table` element that upgrades
 * plain markdown tables into interactive `<AdvancedTable>`s with sorting,
 * filtering, and pagination.
 *
 * Tables with fewer than `MIN_ENHANCED_ROWS` body rows, or whose structure
 * cannot be parsed, fall back to Rspress's default table rendering so short
 * reference tables stay visually simple.
 *
 * @param props - Standard intrinsic `<table>` props from the MDX renderer
 * @returns Either an interactive table or the default rendered table
 */
export function EnhancedMarkdownTable(props: React.ComponentProps<'table'>): React.ReactElement {
  const { table: OriginalTable } = getCustomMDXComponent()
  const parsed = parseRenderedTable(props.children)

  return match(parsed)
    .with(
      P.when(
        (table): table is ParsedTable => table !== null && table.rows.length >= MIN_ENHANCED_ROWS
      ),
      (table) => <AdvancedTable columns={table.columns} rows={table.rows} />
    )
    .otherwise(() => <OriginalTable {...props} />)
}
