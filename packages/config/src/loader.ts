import { loadConfig as c12LoadConfig } from 'c12'
import { attemptAsync } from 'massaman/control'
import { isString } from 'massaman/predicate'

import { configError } from './errors.ts'
import type { ConfigResult } from './errors.ts'
import type { CiderpressConfig } from './types.ts'
import { validateConfig } from './validator.ts'

export interface LoadConfigOptions {
  /**
   * Working directory to search for config files.
   * @default process.cwd()
   */
  readonly cwd?: string
  /**
   * Specific config file path to load.
   */
  readonly configFile?: string
}

/**
 * Load and validate ciderpress config from filesystem.
 *
 * Supports multiple config formats:
 * - ciderpress.config.ts (TypeScript)
 * - ciderpress.config.js/mjs (JavaScript ESM)
 * - ciderpress.config.json/jsonc (JSON with comments)
 * - ciderpress.config.yml/yaml (YAML)
 *
 * @param dirOrOptions - Directory path (string) or LoadConfigOptions object
 * @returns ConfigResult tuple - [null, config] on success or [error, null] on failure
 */
export async function loadConfig(
  dirOrOptions: string | LoadConfigOptions = {}
): Promise<ConfigResult<CiderpressConfig>> {
  const options = resolveOptions(dirOrOptions)
  const { cwd, configFile } = options

  return await loadAndValidateConfig({ cwd, configFile })
}

/**
 * Internal helper to load and validate config with proper error handling.
 *
 * @private
 * @param options - Config loading options with cwd and optional configFile
 * @returns ConfigResult tuple with validated config or error
 */
async function loadAndValidateConfig(
  options: LoadConfigOptions
): Promise<ConfigResult<CiderpressConfig>> {
  const { cwd, configFile } = options
  const searchedCwd = cwd ?? process.cwd()

  const loadResult = await attemptAsync(() =>
    c12LoadConfig<CiderpressConfig>({
      cwd,
      configFile,
      name: 'ciderpress',
      // Supported extensions (c12 handles these automatically)
      // .ts, .mts, .js, .mjs, .json, .jsonc, .yml, .yaml
      rcFile: false,
      packageJson: false,
      globalRc: false,
      dotenv: false,
    })
  )

  if (!loadResult.ok) {
    return [
      configError('parse_error', `Failed to parse config file: ${loadResult.error.message}`, {
        cause: loadResult.error,
      }),
      null,
    ]
  }

  const result = loadResult.value
  const { config, configFile: resolvedFile } = result

  // c12 returns `{ config: {} }` when no file is found — `config` itself is
  // never `null`, so we detect "not found" via the resolved `configFile`.
  if (resolvedFile === undefined) {
    return [
      configError(
        'not_found',
        `Failed to load ciderpress.config — no config file found in ${searchedCwd}`
      ),
      null,
    ]
  }

  if (!config.sections || (Array.isArray(config.sections) && config.sections.length === 0)) {
    return [
      configError('empty_sections', 'Failed to load ciderpress.config — no sections found'),
      null,
    ]
  }

  return validateConfig(config)
}

/**
 * Resolve options from string or object input.
 *
 * @private
 * @param dirOrOptions - Directory path string or options object
 * @returns Normalized LoadConfigOptions
 */
function resolveOptions(dirOrOptions: string | LoadConfigOptions): LoadConfigOptions {
  if (isString(dirOrOptions)) {
    return { cwd: dirOrOptions }
  }
  return dirOrOptions
}
