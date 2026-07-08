import { match, P } from 'massaman/match'
import { Children, isValidElement } from 'react'
import type React from 'react'

export type AdvancedTableAlign = 'left' | 'center' | 'right'

export type AdvancedTableSortType = 'text' | 'number'

export interface AdvancedTableColumn {
  /**
   * Header content rendered in the column's `<th>`. May be rich (code, links).
   */
  readonly header: React.ReactNode
  /**
   * Horizontal cell alignment. Defaults to `left`.
   */
  readonly align?: AdvancedTableAlign
  /**
   * Comparison strategy when sorting. `number` parses cell values as floats.
   * Defaults to `text`.
   */
  readonly sortType?: AdvancedTableSortType
}

export interface AdvancedTableRow {
  /**
   * Rendered cell content, parallel to `columns`. May be rich (code, links).
   */
  readonly cells: readonly React.ReactNode[]
  /**
   * Plain-text values used for sorting and filtering, parallel to `cells`.
   */
  readonly values: readonly string[]
}

export interface ParsedTable {
  readonly columns: readonly AdvancedTableColumn[]
  readonly rows: readonly AdvancedTableRow[]
}

/**
 * Parse a rendered markdown `<table>`'s React children into columns and
 * rows for the interactive table. Cell content is preserved as rendered
 * React nodes; plain text is extracted in parallel for sorting and
 * filtering, and numeric columns are auto-detected.
 *
 * @param children - The `children` of a rendered `<table>` element
 * @returns Parsed columns and rows, or null when the shape is unrecognized
 */
export function parseRenderedTable(children: React.ReactNode): ParsedTable | null {
  const sections = elementChildren(children)
  const thead = sections.find((section) => isType(section, 'thead'))
  const tbody = sections.find((section) => isType(section, 'tbody'))
  return match({ thead, tbody })
    .with({ thead: P.nonNullable, tbody: P.nonNullable }, (found) =>
      buildTable(found.thead, found.tbody)
    )
    .otherwise(() => null)
}

/**
 * Recursively reduce a React node to its plain-text content. Used to
 * derive sort and filter keys from rendered cells that may contain
 * formatting such as code spans or links.
 *
 * @param node - React node to flatten
 * @returns Concatenated text content
 */
export function reactNodeToText(node: React.ReactNode): string {
  return match(node)
    .with(P.string, (text) => text)
    .with(P.number, String)
    .with(P.array(P.any), (nodes) => (nodes as React.ReactNode[]).map(reactNodeToText).join(''))
    .with(P.when(isValidElement), (element) => reactNodeToText(childrenOf(element)))
    .otherwise(() => '')
}

/**
 * Build the parsed table from its head and body sections.
 *
 * @private
 * @param thead - The `<thead>` element
 * @param tbody - The `<tbody>` element
 * @returns Parsed columns and rows, or null when the head row is missing
 */
function buildTable(thead: React.ReactElement, tbody: React.ReactElement): ParsedTable | null {
  const [headRow] = elementChildren(childrenOf(thead))
  return match(headRow)
    .with(P.nullish, () => null)
    .otherwise((row) => {
      const headCells = elementChildren(childrenOf(row))
      const rows = elementChildren(childrenOf(tbody)).map(toRow)
      const columns = headCells.map((cell, index) => ({
        header: childrenOf(cell),
        align: alignOf(cell),
        sortType: detectSortType(rows, index),
      }))
      return { columns, rows }
    })
}

/**
 * Convert a body `<tr>` element into a table row, preserving rendered
 * cells and deriving parallel plain-text values.
 *
 * @private
 * @param tr - A `<tr>` element from the table body
 * @returns The row's rendered cells and plain-text values
 */
function toRow(tr: React.ReactElement): AdvancedTableRow {
  const cells = elementChildren(childrenOf(tr))
  return {
    cells: cells.map(childrenOf),
    values: cells.map((cell) => reactNodeToText(childrenOf(cell))),
  }
}

/**
 * Get the valid React element children of a node as an array.
 *
 * @private
 * @param node - React node whose children to collect
 * @returns Array of element children
 */
function elementChildren(node: React.ReactNode): readonly React.ReactElement[] {
  return Children.toArray(node).filter(isValidElement)
}

/**
 * Read a React element's `children` prop.
 *
 * @private
 * @param element - Element to read
 * @returns The element's children
 */
function childrenOf(element: React.ReactElement): React.ReactNode {
  const props = element.props as { children?: React.ReactNode }
  return props.children
}

/**
 * Test whether an element renders the given intrinsic tag name.
 *
 * @private
 * @param element - Element to test
 * @param name - Intrinsic tag name
 * @returns True when the element's type matches the name
 */
function isType(element: React.ReactElement, name: string): boolean {
  return element.type === name
}

/**
 * Resolve a header cell's text alignment from its inline style.
 *
 * @private
 * @param cell - A `<th>` element
 * @returns The alignment, or undefined when unset
 */
function alignOf(cell: React.ReactElement): AdvancedTableAlign | undefined {
  const props = cell.props as { style?: { textAlign?: string } }
  return match(props.style)
    .with({ textAlign: 'center' }, () => 'center' as const)
    .with({ textAlign: 'right' }, () => 'right' as const)
    .with({ textAlign: 'left' }, () => 'left' as const)
    .otherwise(() => undefined)
}

/**
 * Detect whether a column should sort numerically by checking that every
 * non-empty value in the column parses as a number.
 *
 * @private
 * @param rows - Parsed body rows
 * @param index - Column index to inspect
 * @returns `number` when all populated values are numeric, otherwise `text`
 */
function detectSortType(rows: readonly AdvancedTableRow[], index: number): AdvancedTableSortType {
  const values = rows.map((row) => valueAt(row, index)).filter((value) => value.trim() !== '')
  return match(values.length > 0 && values.every(isNumeric))
    .with(true, () => 'number' as const)
    .otherwise(() => 'text' as const)
}

/**
 * Read a row's plain-text value at a column index.
 *
 * @private
 * @param row - Parsed row
 * @param index - Column index
 * @returns The value, or an empty string when absent
 */
function valueAt(row: AdvancedTableRow, index: number): string {
  const { values } = row
  return match(values)
    .with(P.nullish, () => '')
    .otherwise((present) => present[index] ?? '')
}

/**
 * Test whether a value is a parseable number after stripping formatting
 * characters such as thousands separators and units.
 *
 * @private
 * @param value - Plain-text value to test
 * @returns True when the value parses as a finite number
 */
function isNumeric(value: string): boolean {
  const cleaned = value.replaceAll(/[^0-9.eE+-]/g, '')
  return cleaned !== '' && Number.isFinite(Number(cleaned))
}
