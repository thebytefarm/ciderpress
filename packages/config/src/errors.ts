import type { ZodError } from 'zod'

import type { Result } from './types.ts'

export type ConfigErrorType =
  | 'not_found'
  | 'parse_error'
  | 'validation_failed'
  | 'empty_sections'
  | 'missing_field'
  | 'invalid_entry'
  | 'invalid_section'
  | 'invalid_field'
  | 'invalid_icon'
  | 'invalid_theme'
  | 'duplicate_prefix'
  | 'invalid_openapi'
  | 'unknown'

export interface ConfigError {
  readonly _tag: 'ConfigError'
  readonly type: ConfigErrorType
  readonly message: string
  readonly errors?: readonly {
    readonly path: readonly (string | number)[]
    readonly message: string
  }[]
  /**
   * Original error preserved for downstream tooling and debug logs.
   * Populated by `loader.ts` when c12 itself rejects so consumers can
   * surface the underlying parse failure (file path, stack trace, etc.)
   * without losing the typed `ConfigError` envelope.
   */
  readonly cause?: unknown
}

export type ConfigResult<T> = Result<T, ConfigError>

export type ConfigWarningType = 'duplicate_include_prefix'

/**
 * Non-fatal config issue that may cause unexpected behavior.
 */
export interface ConfigWarning {
  readonly _tag: 'ConfigWarning'
  readonly type: ConfigWarningType
  readonly message: string
}

/**
 * Optional fields accepted by {@link configError}.
 */
export interface ConfigErrorOptions {
  /**
   * Original error preserved on the resulting `ConfigError.cause` field.
   */
  readonly cause?: unknown
}

/**
 * Create a ConfigError with the given type and message.
 *
 * @param type - The error type discriminant
 * @param message - Human-readable error message
 * @param options - Optional fields (e.g. `cause` for preserving the original error)
 * @returns A ConfigError object
 */
export function configError(
  type: ConfigErrorType,
  message: string,
  options?: ConfigErrorOptions
): ConfigError {
  if (options === undefined || options.cause === undefined) {
    return {
      _tag: 'ConfigError',
      type,
      message,
    }
  }
  return {
    _tag: 'ConfigError',
    type,
    message,
    cause: options.cause,
  }
}

/**
 * Create a ConfigWarning with the given type and message.
 *
 * @param type - The warning type discriminant
 * @param message - Human-readable warning message
 * @returns A ConfigWarning object
 */
export function configWarning(type: ConfigWarningType, message: string): ConfigWarning {
  return {
    _tag: 'ConfigWarning',
    type,
    message,
  }
}

/**
 * Convert a Zod validation error into a ConfigError.
 *
 * @param zodError - The ZodError produced by a failed safeParse call
 * @returns A ConfigError with type `'validation_failed'` and mapped issue list
 */
export function configErrorFromZod(zodError: ZodError): ConfigError {
  return {
    _tag: 'ConfigError',
    type: 'validation_failed',
    message: 'Configuration validation failed',
    errors: zodError.issues.map((err) => ({
      path: err.path.filter(
        (p): p is string | number => typeof p === 'string' || typeof p === 'number'
      ),
      message: err.message,
    })),
  }
}
