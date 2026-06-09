import type { CiderpressConfig } from './types.ts'

/**
 * Type-safe config helper for ciderpress.config.ts files.
 *
 * Provides type safety and editor autocompletion.
 * Validation is deferred to loadConfig at runtime.
 *
 * @param config - Ciderpress config object
 * @returns The config unchanged
 */
export function defineConfig(config: CiderpressConfig): CiderpressConfig {
  return config
}
