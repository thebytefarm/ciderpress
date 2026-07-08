import { describe, expect, it } from 'vitest'

import { buildBuiltInVars, parseVarArgs } from './vars'

describe('parseVarArgs()', () => {
  it('should return empty results when no args are passed', () => {
    expect(parseVarArgs(undefined)).toStrictEqual({ values: {}, invalid: [] })
  })

  it('should parse id=value pairs', () => {
    const { values, invalid } = parseVarArgs(['decision=Use Postgres', 'status=accepted'])
    expect(values).toStrictEqual({ decision: 'Use Postgres', status: 'accepted' })
    expect(invalid).toStrictEqual([])
  })

  it('should split on the first = so values may contain =', () => {
    const { values } = parseVarArgs(['expr=a=b=c'])
    expect(values).toStrictEqual({ expr: 'a=b=c' })
  })

  it('should allow an empty value', () => {
    const { values, invalid } = parseVarArgs(['context='])
    expect(values).toStrictEqual({ context: '' })
    expect(invalid).toStrictEqual([])
  })

  it('should collect entries with no = as invalid', () => {
    const { values, invalid } = parseVarArgs(['decision'])
    expect(values).toStrictEqual({})
    expect(invalid).toStrictEqual(['decision'])
  })

  it('should collect entries with an empty id as invalid', () => {
    const { invalid } = parseVarArgs(['=orphan'])
    expect(invalid).toStrictEqual(['=orphan'])
  })
})

describe('buildBuiltInVars()', () => {
  it('should build title, slug, filename, and an ISO date', () => {
    const result = buildBuiltInVars({
      title: 'Auth',
      slug: 'auth',
      filename: 'auth.md',
      now: new Date('2026-07-08T12:34:56Z'),
    })
    expect(result).toStrictEqual({
      title: 'Auth',
      slug: 'auth',
      filename: 'auth.md',
      date: '2026-07-08',
    })
  })
})
