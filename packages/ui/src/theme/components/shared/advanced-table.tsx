import type {
  Column,
  ColumnDef,
  ColumnFiltersState,
  Header,
  Row,
  SortingState,
} from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { match, P } from 'massaman/match'
import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Dialog, DialogTrigger, Popover } from 'react-aria-components'

import type { AdvancedTableColumn, AdvancedTableRow } from './advanced-table.parse'
import { reactNodeToText } from './advanced-table.parse'
import { Icon } from './icon'

export type {
  AdvancedTableAlign,
  AdvancedTableColumn,
  AdvancedTableRow,
  AdvancedTableSortType,
} from './advanced-table.parse'

const STORAGE_PREFIX = 'cp-advanced-table:'

export interface AdvancedTableProps {
  /**
   * Column definitions in display order.
   */
  readonly columns: readonly AdvancedTableColumn[]
  /**
   * Row data in source order.
   */
  readonly rows: readonly AdvancedTableRow[]
  /**
   * Stable key for persisting sort and per-column filter state to
   * `localStorage`. Defaults to a hash of the headers plus the page path.
   */
  readonly persistKey?: string
}

/**
 * Interactive data table with click-to-sort headers and per-column filter
 * popovers. Sort and filter state persist to `localStorage` and can be
 * cleared from the toolbar or per column. Built on TanStack Table with
 * react-aria popovers for accessibility.
 *
 * @param props - Column definitions, row data, and an optional persist key
 * @returns React element with an interactive table
 */
export function AdvancedTable({
  columns,
  rows,
  persistKey,
}: AdvancedTableProps): React.ReactElement {
  const storageKey = useMemo(() => resolveStorageKey(persistKey, columns), [persistKey, columns])
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [hydrated, setHydrated] = useState(false)
  const tableRef = useRef<HTMLTableElement>(null)
  const [columnWidths, setColumnWidths] = useState<readonly number[] | null>(null)

  // Lock the natural column widths from the first (unfiltered) render so
  // sorting and filtering never reflow the table. Percentages keep it
  // responsive. Runs before filters are restored, so widths reflect the
  // full data set.
  useEffect(() => {
    const el = tableRef.current
    if (el === null || columnWidths !== null) {
      return
    }
    const headerCells = [...el.querySelectorAll('thead th')]
    const total = el.getBoundingClientRect().width
    if (total === 0 || headerCells.length === 0) {
      return
    }
    setColumnWidths(headerCells.map((cell) => (cell.getBoundingClientRect().width / total) * 100))
  }, [columnWidths])

  useEffect(() => {
    const saved = loadState(storageKey)
    setSorting(saved.sorting)
    setColumnFilters(saved.columnFilters)
    setHydrated(true)
  }, [storageKey])

  useEffect(() => {
    if (hydrated) {
      saveState(storageKey, { sorting, columnFilters })
    }
  }, [hydrated, storageKey, sorting, columnFilters])

  const columnDefs = useMemo(() => columns.map(toColumnDef), [columns])

  const table = useReactTable({
    data: rows as AdvancedTableRow[],
    columns: columnDefs,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  function clearAll(): void {
    table.resetSorting()
    table.resetColumnFilters()
  }

  const hasState = sorting.length > 0 || columnFilters.length > 0
  const bodyRows = table.getRowModel().rows

  return (
    <div className="cp-advanced-table">
      {match(hasState)
        .with(true, () => (
          <div className="cp-advanced-table__toolbar">
            <button type="button" className="cp-advanced-table__clear" onClick={clearAll}>
              <Icon icon="pixelarticons:close" />
              <span>Clear all</span>
            </button>
          </div>
        ))
        .otherwise(() => null)}
      <div className="cp-advanced-table__scroll">
        <table
          ref={tableRef}
          className="cp-advanced-table__table"
          style={tableLayoutStyle(columnWidths)}
        >
          {match(columnWidths)
            .with(P.nonNullable, (widths) => (
              <colgroup>
                {widths.map((width, index) => (
                  <col key={index} style={{ width: `${width}%` }} />
                ))}
              </colgroup>
            ))
            .otherwise(() => null)}
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <HeaderCell
                    key={header.id}
                    header={header}
                    column={columns[Number(header.column.id)]}
                  />
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {match(bodyRows.length)
              .with(0, () => (
                <tr>
                  <td className="cp-advanced-table__empty" colSpan={columns.length}>
                    No matching rows
                  </td>
                </tr>
              ))
              .otherwise(() =>
                bodyRows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} style={alignStyle(columns[Number(cell.column.id)])}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface HeaderCellProps {
  readonly header: Header<AdvancedTableRow, unknown>
  readonly column: AdvancedTableColumn | undefined
}

/**
 * A header cell with a sort button and a per-column filter popover trigger.
 *
 * @private
 * @param props - The TanStack header and its source column definition
 * @returns React element for a `<th>`
 */
function HeaderCell({ header, column }: HeaderCellProps): React.ReactElement {
  const sortDir = header.column.getIsSorted()
  const filterValue = header.column.getFilterValue()
  const isFiltered = filterValue !== undefined && filterValue !== ''
  const ariaSort = match(sortDir)
    .with('asc', () => 'ascending' as const)
    .with('desc', () => 'descending' as const)
    .otherwise(() => 'none' as const)

  return (
    <th style={alignStyle(column)} scope="col" aria-sort={ariaSort}>
      <div className="cp-advanced-table__header">
        <button
          type="button"
          className="cp-advanced-table__sort"
          onClick={header.column.getToggleSortingHandler()}
        >
          <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
          <span className="cp-advanced-table__sort-icon" data-active={sortDir !== false}>
            <Icon icon={sortIcon(sortDir)} />
          </span>
        </button>
        <ColumnFilter column={header.column} active={isFiltered} />
      </div>
    </th>
  )
}

interface ColumnFilterProps {
  readonly column: Column<AdvancedTableRow, unknown>
  readonly active: boolean
}

/**
 * Filter icon that opens a popover with a text-contains input and a clear
 * action, scoped to a single column.
 *
 * @private
 * @param props - The TanStack column and whether it currently has a filter
 * @returns React element with the filter trigger and popover
 */
function ColumnFilter({ column, active }: ColumnFilterProps): React.ReactElement {
  const value = column.getFilterValue()
  const text = match(value)
    .with(P.string, (current) => current)
    .otherwise(() => '')

  function handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const next = event.target.value
    column.setFilterValue(
      match(next)
        .with('', () => undefined)
        .otherwise((query) => query)
    )
  }

  return (
    <DialogTrigger>
      <Button
        className="cp-advanced-table__filter-trigger"
        data-active={active}
        aria-label="Filter column"
      >
        <Icon icon="pixelarticons:search" />
      </Button>
      <Popover className="cp-advanced-table__filter-popover" placement="bottom start">
        <Dialog className="cp-advanced-table__filter-dialog" aria-label="Column filter">
          <input
            type="text"
            className="cp-advanced-table__filter-input"
            placeholder="Contains…"
            value={text}
            onChange={handleChange}
          />
          <div className="cp-advanced-table__filter-actions">
            <button
              type="button"
              className="cp-advanced-table__filter-clear"
              onClick={() => column.setFilterValue(undefined)}
            >
              Clear
            </button>
          </div>
        </Dialog>
      </Popover>
    </DialogTrigger>
  )
}

/**
 * Build a TanStack column definition from an AdvancedTable column, wiring
 * the plain-text accessor for sorting/filtering and the rich cell renderer.
 *
 * @private
 * @param column - Source column definition
 * @param index - Column index, used as the stable column id
 * @returns TanStack column definition
 */
function toColumnDef(column: AdvancedTableColumn, index: number): ColumnDef<AdvancedTableRow> {
  const sortType = column.sortType ?? 'text'
  return {
    id: String(index),
    header: () => column.header,
    accessorFn: (row) => valueAtIndex(row, index),
    cell: (ctx) => ctx.row.original.cells[index],
    enableSorting: true,
    enableColumnFilter: true,
    filterFn: 'includesString',
    sortingFn: match(sortType)
      .with('number', () => numericSortingFn)
      .otherwise(() => 'text' as const),
  }
}

/**
 * Compare two rows numerically for the given column, sorting values that do
 * not parse as numbers last.
 *
 * @private
 * @param rowA - First row
 * @param rowB - Second row
 * @param columnId - Column being sorted
 * @returns Standard comparator result
 */
function numericSortingFn(
  rowA: Row<AdvancedTableRow>,
  rowB: Row<AdvancedTableRow>,
  columnId: string
): number {
  return (
    numericValue(String(rowA.getValue(columnId))) - numericValue(String(rowB.getValue(columnId)))
  )
}

/**
 * Parse a numeric value, returning Infinity when unparseable so it sorts last.
 *
 * @private
 * @param raw - Plain-text cell value
 * @returns The parsed number, or Infinity
 */
function numericValue(raw: string): number {
  const cleaned = raw.replaceAll(/[^0-9.eE+-]/g, '')
  const parsed = Number(cleaned)
  return match(cleaned === '' || Number.isNaN(parsed))
    .with(true, () => Number.POSITIVE_INFINITY)
    .otherwise(() => parsed)
}

/**
 * Read a row's plain-text value at a column index.
 *
 * @private
 * @param row - Row data
 * @param index - Column index
 * @returns The value, or an empty string when absent
 */
function valueAtIndex(row: AdvancedTableRow, index: number): string {
  return row.values[index] ?? ''
}

/**
 * Pick the sort indicator icon for a header.
 *
 * @private
 * @param sortDir - Current sort direction, or false when unsorted
 * @returns Iconify icon id
 */
function sortIcon(sortDir: false | 'asc' | 'desc'): string {
  return match(sortDir)
    .with('asc', () => 'pixelarticons:chevron-up')
    .with('desc', () => 'pixelarticons:chevron-down')
    .otherwise(() => 'pixelarticons:chevrons-vertical')
}

/**
 * Resolve the inline text-align style for a column.
 *
 * @private
 * @param column - Column definition (may be undefined for ragged rows)
 * @returns CSS properties with the resolved alignment
 */
function alignStyle(column: AdvancedTableColumn | undefined): React.CSSProperties {
  return match(column)
    .with(P.nonNullable, (c) => ({ textAlign: c.align ?? 'left' }))
    .otherwise((): React.CSSProperties => ({ textAlign: 'left' }))
}

/**
 * Resolve the table layout style, switching to fixed layout once column
 * widths are locked so filtering never reflows the table.
 *
 * @private
 * @param columnWidths - Locked column width percentages, or null before measure
 * @returns CSS properties for the table element
 */
function tableLayoutStyle(columnWidths: readonly number[] | null): React.CSSProperties {
  return match(columnWidths)
    .with(P.nullish, (): React.CSSProperties => ({}))
    .otherwise((): React.CSSProperties => ({ tableLayout: 'fixed' }))
}

interface PersistedState {
  readonly sorting: SortingState
  readonly columnFilters: ColumnFiltersState
}

const EMPTY_STATE: PersistedState = { sorting: [], columnFilters: [] }

/**
 * Resolve the localStorage key for a table, defaulting to a hash of the
 * column headers combined with the current page path.
 *
 * @private
 * @param persistKey - Explicit key, when provided
 * @param columns - Column definitions used to derive a default key
 * @returns The storage key
 */
function resolveStorageKey(
  persistKey: string | undefined,
  columns: readonly AdvancedTableColumn[]
): string {
  return match(persistKey)
    .with(P.string, (key) => key)
    .otherwise(
      () => `${currentPath()}#${hashText(columns.map((c) => reactNodeToText(c.header)).join('|'))}`
    )
}

/**
 * Read the current page path, or an empty string during SSR.
 *
 * @private
 * @returns The pathname, or an empty string
 */
function currentPath(): string {
  return match(globalThis.location)
    .with(P.nullish, () => '')
    .otherwise((loc) => loc.pathname)
}

/**
 * Compute a short, stable, non-cryptographic hash of a string.
 *
 * @private
 * @param text - Text to hash
 * @returns Base-36 hash string
 */
function hashText(text: string): string {
  return [...text]
    .reduce((acc, char) => (acc * 31 + (char.codePointAt(0) ?? 0)) % 1_000_000_007, 7)
    .toString(36)
}

/**
 * Load persisted sort and filter state from localStorage.
 *
 * @private
 * @param key - Storage key
 * @returns The persisted state, or empty state when absent or invalid
 */
function loadState(key: string): PersistedState {
  return match(readStorage(key))
    .with(P.nullish, () => EMPTY_STATE)
    .otherwise(parseState)
}

/**
 * Persist sort and filter state, removing the entry when both are empty.
 *
 * @private
 * @param key - Storage key
 * @param state - State to persist
 */
function saveState(key: string, state: PersistedState): void {
  match(globalThis.localStorage)
    .with(P.nullish, () => undefined)
    .otherwise((storage) => {
      try {
        match(state.sorting.length === 0 && state.columnFilters.length === 0)
          .with(true, () => storage.removeItem(STORAGE_PREFIX + key))
          .otherwise(() => storage.setItem(STORAGE_PREFIX + key, JSON.stringify(state)))
      } catch {
        // Ignore quota / privacy-mode write failures.
      }
    })
}

/**
 * Read a raw persisted value, guarding against SSR and privacy-mode errors.
 *
 * @private
 * @param key - Storage key
 * @returns The raw string, or null when unavailable
 */
function readStorage(key: string): string | null {
  return match(globalThis.localStorage)
    .with(P.nullish, () => null)
    .otherwise((storage) => {
      try {
        return storage.getItem(STORAGE_PREFIX + key)
      } catch {
        return null
      }
    })
}

/**
 * Parse persisted JSON into validated state, tolerating malformed input.
 *
 * @private
 * @param raw - Raw JSON string
 * @returns The parsed state, or empty state on failure
 */
function parseState(raw: string): PersistedState {
  const data = safeParse(raw)
  return {
    sorting: asArray(data.sorting) as SortingState,
    columnFilters: asArray(data.columnFilters) as ColumnFiltersState,
  }
}

/**
 * Parse JSON without throwing.
 *
 * @private
 * @param raw - Raw JSON string
 * @returns The parsed object, or an empty object on failure
 */
function safeParse(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {}
  }
}

/**
 * Coerce a value to an array, returning an empty array for non-arrays.
 *
 * @private
 * @param value - Value to coerce
 * @returns The array, or an empty array
 */
function asArray(value: unknown): readonly unknown[] {
  return match(value)
    .with(P.array(P.any), (items) => items)
    .otherwise(() => [])
}
