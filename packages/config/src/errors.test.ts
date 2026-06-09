import { describe, it, expect } from 'vitest'
import { z, ZodError } from 'zod'

import { configError, configErrorFromZod } from './errors.ts'

describe('configError()', () => {
  it('should return object with _tag ConfigError', () => {
    const result = configError('not_found', 'Config not found')
    expect(result._tag).toBe('ConfigError')
  })

  it('should return object with correct type', () => {
    const result = configError('parse_error', 'Parse failed')
    expect(result.type).toBe('parse_error')
  })

  it('should return object with correct message', () => {
    const result = configError('validation_failed', 'Validation failed')
    expect(result.message).toBe('Validation failed')
  })

  it('should return object with no errors property', () => {
    const result = configError('not_found', 'Config not found')
    expect(result.errors).toBeUndefined()
  })
})

describe('configErrorFromZod()', () => {
  it('should return object with _tag ConfigError', () => {
    const parseResult = z.string().safeParse(123)
    expect(parseResult.success).toBe(false)
    if (parseResult.success) {
      return
    }
    const result = configErrorFromZod(parseResult.error)
    expect(result._tag).toBe('ConfigError')
  })

  it('should return type validation_failed', () => {
    const parseResult = z.string().safeParse(123)
    expect(parseResult.success).toBe(false)
    if (parseResult.success) {
      return
    }
    const result = configErrorFromZod(parseResult.error)
    expect(result.type).toBe('validation_failed')
  })

  it('should return message Configuration validation failed', () => {
    const parseResult = z.string().safeParse(123)
    expect(parseResult.success).toBe(false)
    if (parseResult.success) {
      return
    }
    const result = configErrorFromZod(parseResult.error)
    expect(result.message).toBe('Configuration validation failed')
  })

  it('should map ZodError issues to errors array with path and message', () => {
    const parseResult = z.object({ name: z.string() }).safeParse({ name: 123 })
    expect(parseResult.success).toBe(false)
    if (parseResult.success) {
      return
    }
    const result = configErrorFromZod(parseResult.error)
    expect(result.errors).toBeDefined()
    expect(result.errors).toHaveLength(1)
    if (result.errors) {
      expect(result.errors[0]).toMatchObject({
        path: ['name'],
        message: expect.any(String),
      })
    }
  })

  it('should drop symbol path segments when mapping issues', () => {
    // Construct a `ZodError` with a synthetic issue whose path contains a
    // `symbol` segment — covers the `(p): p is string | number` filter that
    // `safeParse` paths normally never exercise.
    const symbolKey = Symbol('hidden')
    const syntheticError = new ZodError([
      {
        code: 'custom',
        path: ['outer', symbolKey, 0, 'leaf'],
        message: 'symbol path segment must be filtered',
        input: undefined,
      },
    ])
    const result = configErrorFromZod(syntheticError)
    expect(result.errors).toBeDefined()
    if (result.errors) {
      expect(result.errors[0]).toMatchObject({
        path: ['outer', 0, 'leaf'],
        message: 'symbol path segment must be filtered',
      })
    }
  })
})
