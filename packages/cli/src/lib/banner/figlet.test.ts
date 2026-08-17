import { describe, it, expect } from 'vitest'

import { renderFigletText, renderPixelText } from './figlet'

const ALPHABET = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']
const DIGITS = [...'0123456789']
const SPECIALS = [...' -._']
const SEP = '────────────────────────────────'

describe('renderFigletText (ANSI Shadow)', () => {
  it.each(ALPHABET)('should render letter %s', (letter) => {
    const result = renderFigletText(letter)
    expect(bordered(result.lines)).toMatchSnapshot()
  })

  it.each(DIGITS)('should render digit %s', (digit) => {
    const result = renderFigletText(digit)
    expect(bordered(result.lines)).toMatchSnapshot()
  })

  it.each(SPECIALS)('should render special char %j', (char) => {
    const result = renderFigletText(char)
    expect(bordered(result.lines)).toMatchSnapshot()
  })

  it('should render full word "ciderpress"', () => {
    const result = renderFigletText('ciderpress')
    expect(bordered(result.lines)).toMatchSnapshot()
  })

  it('should return 6 rows', () => {
    const result = renderFigletText('A')
    expect(result.rows).toBe(6)
  })
})

describe('renderPixelText (RubiFont)', () => {
  it.each(ALPHABET)('should render letter %s', (letter) => {
    const result = renderPixelText(letter)
    expect(bordered(result.lines)).toMatchSnapshot()
  })

  it('should render full word "ciderpress"', () => {
    const result = renderPixelText('ciderpress')
    expect(bordered(result.lines)).toMatchSnapshot()
  })

  it('should render a long title', () => {
    const result = renderPixelText('my-long-project')
    expect(bordered(result.lines)).toMatchSnapshot()
  })

  it('should return 4 rows', () => {
    const result = renderPixelText('A')
    expect(result.rows).toBe(4)
  })

  it('should fall back to space for unknown characters', () => {
    const result = renderPixelText('A1B')
    const known = renderPixelText('A B')
    expect(result.lines).toStrictEqual(known.lines)
  })
})

/**
 * Wrap rendered lines with separator borders for readable snapshots.
 *
 * @private
 * @param lines - Rendered glyph rows
 * @returns Bordered string for snapshot comparison
 */
function bordered(lines: readonly string[]): string {
  return [SEP, ...lines, SEP].join('\n')
}
