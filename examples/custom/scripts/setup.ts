#!/usr/bin/env zx

/**
 * Custom example — portless setup check.
 *
 * Verifies the host machine is ready to serve the example behind
 * portless.sh: portless installed, Node >= 24, and the package.json
 * `portless` hostname override matches the configured `devServer.url`.
 *
 * Run with: `pnpm setup` (from this directory)
 *
 * NOTE: this script intentionally uses zx instead of laufen. Laufen is
 * being phased out across the repo — new scripts should reach for zx.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

interface CheckResult {
  readonly ok: boolean
  readonly detail?: string
  readonly fix?: string
}

interface Check {
  readonly label: string
  readonly run: () => Promise<CheckResult>
}

$.verbose = false

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const EXAMPLE_DIR = dirname(SCRIPT_DIR)
const REQUIRED_NODE_MAJOR = 24
const REQUIRED_HOSTNAME = 'acme'
const REQUIRED_URL = `https://${REQUIRED_HOSTNAME}.localhost`

const checks: readonly Check[] = [
  { label: 'Node >= 24', run: checkNode },
  { label: 'portless on PATH', run: checkPortless },
  { label: 'package.json portless: "acme"', run: checkPortlessConfig },
  { label: 'ciderpress.config.ts devServer.url', run: checkDevServerUrl },
]

console.log(chalk.cyan.bold('\n  ciderpress · custom example · portless setup\n'))

const results = await Promise.all(
  checks.map(async (check) => ({ label: check.label, ...(await check.run()) }))
)

for (const result of results) {
  const icon = result.ok ? chalk.green('✓') : chalk.red('✗')
  const suffix = result.detail ? chalk.gray(` — ${result.detail}`) : ''
  console.log(`  ${icon} ${result.label}${suffix}`)
}

const failures = results.filter((r) => !r.ok)

if (failures.length === 0) {
  console.log(chalk.green.bold('\n  All checks passed.\n'))
  console.log(`  Next steps:\n`)
  console.log(`    ${chalk.cyan('$')} cd ${EXAMPLE_DIR}`)
  console.log(`    ${chalk.cyan('$')} portless`)
  console.log(`\n  Then open ${chalk.cyan(REQUIRED_URL)} in your browser.\n`)
  process.exit(0)
}

console.log(chalk.red.bold(`\n  ${failures.length} check(s) failed.\n`))
for (const failure of failures) {
  console.log(chalk.red(`  ✗ ${failure.label}`))
  if (failure.fix) {
    console.log(chalk.gray(`    Fix: ${failure.fix}`))
  }
}
console.log()
process.exit(1)

/**
 * Verify Node.js >= REQUIRED_NODE_MAJOR.
 *
 * @returns Check result with `ok`, optional `detail`, and optional `fix`
 */
async function checkNode(): Promise<CheckResult> {
  const version = process.versions.node
  const major = Number.parseInt(version.split('.')[0] ?? '0', 10)
  if (major >= REQUIRED_NODE_MAJOR) {
    return { ok: true, detail: `v${version}` }
  }
  return {
    ok: false,
    detail: `v${version}`,
    fix: `Upgrade Node to v${REQUIRED_NODE_MAJOR}+ (try \`nvm install ${REQUIRED_NODE_MAJOR}\`)`,
  }
}

/**
 * Verify the `portless` CLI is reachable on PATH.
 *
 * @returns Check result with `ok`, optional `detail`, and optional `fix`
 */
async function checkPortless(): Promise<CheckResult> {
  try {
    const result = await $`which portless`
    return { ok: true, detail: result.stdout.trim() }
  } catch {
    return {
      ok: false,
      fix: `Install with \`npm i -g portless\``,
    }
  }
}

/**
 * Verify the example's package.json carries `portless: "acme"` so portless
 * serves at https://acme.localhost instead of inferring from `name`.
 *
 * @returns Check result with `ok`, optional `detail`, and optional `fix`
 */
async function checkPortlessConfig(): Promise<CheckResult> {
  const pkg = JSON.parse(readFileSync(join(EXAMPLE_DIR, 'package.json'), 'utf8'))
  const value: unknown = pkg.portless
  if (value === REQUIRED_HOSTNAME) {
    return { ok: true }
  }
  if (typeof value === 'object' && value !== null && 'name' in value) {
    const named = (value as { readonly name?: unknown }).name
    if (named === REQUIRED_HOSTNAME) {
      return { ok: true }
    }
  }
  return {
    ok: false,
    detail: value === undefined ? 'missing' : `currently "${JSON.stringify(value)}"`,
    fix: `Set "portless": "${REQUIRED_HOSTNAME}" in package.json`,
  }
}

/**
 * Verify ciderpress.config.ts declares the matching devServer.url so the
 * "ready: …" message and browser auto-open point at the portless host.
 *
 * @returns Check result with `ok`, optional `detail`, and optional `fix`
 */
async function checkDevServerUrl(): Promise<CheckResult> {
  const configPath = join(EXAMPLE_DIR, 'ciderpress.config.ts')
  const source = readFileSync(configPath, 'utf8')
  if (source.includes(`url: '${REQUIRED_URL}'`)) {
    return { ok: true, detail: REQUIRED_URL }
  }
  return {
    ok: false,
    fix: `Set devServer.url to '${REQUIRED_URL}' in ciderpress.config.ts`,
  }
}
