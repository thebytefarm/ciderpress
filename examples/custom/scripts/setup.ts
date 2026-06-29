#!/usr/bin/env zx

/**
 * Custom example — portless setup.
 *
 * Verifies the example is ready for portless and registers the static
 * route `acme.localhost -> 127.0.0.1:7174` so the dev server is
 * reachable at https://acme.localhost.
 *
 * What this does:
 *   1. Verifies Node >= 24, portless on PATH.
 *   2. Verifies package.json carries `portless: "acme"` and
 *      ciderpress.config.ts carries `devServer.url` + `devServer.port`.
 *   3. Reads `portless doctor` to confirm the proxy daemon is running
 *      (instructs `portless proxy start` when it isn't — that's the
 *      one step that may sudo-prompt to bind port 443).
 *   4. Registers (or refreshes, idempotently) the alias
 *      `acme.localhost -> 127.0.0.1:7174` via `portless alias acme 7174 --force`.
 *   5. Confirms the alias appears in `portless list`.
 *
 * What this does NOT do:
 *   - `portless trust` (one-time CA install; user runs once per machine).
 *   - `portless proxy start` (sudo-prompts; user runs once per session
 *      or via `portless service install` for boot persistence).
 *
 * Modes:
 *   pnpm setup:portless           — verbose; prints every step.
 *   pnpm setup:portless --quiet   — silent on success, loud on failure.
 *                                   Wired as the `predev` lifecycle hook.
 *
 * NOTE: this script intentionally uses zx instead of laufen. Laufen is
 * being phased out across the repo — new scripts should reach for zx.
 * `zx --install` auto-installs the script's imports (massaman) at
 * runtime so neither lives in examples/custom's devDeps.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { attemptAsync } from 'massaman/control'
import { match } from 'massaman/match'

interface StepResult {
  readonly ok: boolean
  readonly detail?: string
  readonly fix?: string
}

interface Step {
  readonly label: string
  readonly run: () => Promise<StepResult>
}

$.verbose = false

// portless refuses to run under pnpm / npm script wrappers because it
// detects npm_* env vars and assumes it's being launched via `npx` or
// `pnpm dlx`. Cleaning these vars from the inherited env makes portless
// see a plain shell environment.
const PORTLESS_ENV: NodeJS.ProcessEnv = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !key.startsWith('npm_'))
)
const portless$ = $({ env: PORTLESS_ENV })

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const EXAMPLE_DIR = dirname(SCRIPT_DIR)
const REQUIRED_NODE_MAJOR = 24
const REQUIRED_HOSTNAME = 'acme'
const REQUIRED_PORT = 7174
const REQUIRED_URL = `https://${REQUIRED_HOSTNAME}.localhost`
const QUIET = argv.quiet === true

const steps: readonly Step[] = [
  { label: 'Node >= 24', run: checkNode },
  { label: 'portless on PATH', run: checkPortless },
  { label: 'package.json portless: "acme"', run: checkPortlessConfig },
  { label: 'ciderpress.config.ts devServer.{url,port}', run: checkDevServerConfig },
  { label: 'portless proxy running', run: checkProxyRunning },
  { label: `register alias acme.localhost → 127.0.0.1:${REQUIRED_PORT}`, run: registerAlias },
  { label: 'verify alias in portless list', run: verifyAlias },
]

if (!QUIET) {
  console.log(chalk.cyan.bold('\n  ciderpress · custom example · portless setup\n'))
}

const results: { readonly label: string; readonly result: StepResult }[] = []
for (const step of steps) {
  const result = await step.run()
  results.push({ label: step.label, result })
  if (!QUIET) {
    printStep(step.label, result)
  }
  if (!result.ok) {
    break
  }
}

const failed = results.find((r) => !r.result.ok)

if (failed === undefined) {
  if (!QUIET) {
    console.log(chalk.green.bold('\n  Ready.\n'))
    console.log(`  From ${chalk.cyan(EXAMPLE_DIR)}:`)
    console.log(`    ${chalk.cyan('$')} pnpm dev`)
    console.log(`\n  Then open ${chalk.cyan(REQUIRED_URL)} in your browser.\n`)
  }
  process.exit(0)
}

console.log(chalk.red.bold(`\n  ✗ Setup failed at: ${failed.label}\n`))
if (failed.result.detail !== undefined) {
  console.log(chalk.gray(`    ${failed.result.detail}`))
}
if (failed.result.fix !== undefined) {
  console.log(chalk.gray(`    Fix: ${failed.result.fix}`))
}
console.log(
  chalk.yellow(
    `\n  Run \`pnpm setup:portless\` again after fixing, or see /guides/using-portless.\n`
  )
)
process.exit(1)

/**
 * Render a single step line with icon + label + optional detail suffix.
 *
 * @private
 * @param label - Step label
 * @param result - Step outcome
 */
function printStep(label: string, result: StepResult): void {
  const icon = match(result.ok)
    .with(true, () => chalk.green('✓'))
    .otherwise(() => chalk.red('✗'))
  const suffix = match(result.detail)
    .with(undefined, () => '')
    .otherwise((d) => chalk.gray(` — ${d}`))
  console.log(`  ${icon} ${label}${suffix}`)
}

/**
 * Verify Node.js >= REQUIRED_NODE_MAJOR.
 *
 * @returns Step result
 */
async function checkNode(): Promise<StepResult> {
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
 * @returns Step result
 */
async function checkPortless(): Promise<StepResult> {
  const outcome = await attemptAsync(() => $`which portless`)
  if (!outcome.ok) {
    return {
      ok: false,
      fix: `Install: \`npm i -g portless\` then \`portless trust\` (one-time, sudo-prompts once)`,
    }
  }
  return { ok: true, detail: outcome.value.stdout.trim() }
}

/**
 * Verify the example's package.json carries `portless: "acme"`.
 *
 * @returns Step result
 */
async function checkPortlessConfig(): Promise<StepResult> {
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
 * Verify ciderpress.config.ts declares matching devServer.url + port.
 *
 * @returns Step result
 */
async function checkDevServerConfig(): Promise<StepResult> {
  const configPath = join(EXAMPLE_DIR, 'ciderpress.config.ts')
  const source = readFileSync(configPath, 'utf8')
  const hasUrl = source.includes(`url: '${REQUIRED_URL}'`)
  const hasPort = source.includes(`port: ${REQUIRED_PORT}`)
  if (hasUrl && hasPort) {
    return { ok: true, detail: `url=${REQUIRED_URL} port=${REQUIRED_PORT}` }
  }
  const missing = [
    hasUrl ? null : `url: '${REQUIRED_URL}'`,
    hasPort ? null : `port: ${REQUIRED_PORT}`,
  ].filter((value): value is string => value !== null)
  return {
    ok: false,
    detail: `missing in devServer: ${missing.join(', ')}`,
    fix: `Set both fields under devServer in ciderpress.config.ts`,
  }
}

/**
 * Run `portless doctor` and look for the proxy-not-running warning.
 * doctor exits 0 even when it reports warnings, so we parse stdout.
 *
 * @returns Step result
 */
async function checkProxyRunning(): Promise<StepResult> {
  const outcome = await attemptAsync(() => portless$`portless doctor`)
  if (!outcome.ok) {
    return { ok: false, detail: 'portless doctor failed', fix: outcome.error.message }
  }
  if (outcome.value.stdout.includes('Proxy is not running')) {
    return {
      ok: false,
      detail: 'portless proxy daemon is not running on port 443',
      fix: `\`portless proxy start\` (sudo-prompts once to bind 443) — or \`portless service install\` for boot persistence`,
    }
  }
  return { ok: true, detail: 'proxy responding' }
}

/**
 * Register the static alias via `portless alias --force`. Idempotent —
 * `--force` overwrites an existing entry so re-running this script
 * after a port change just refreshes the route.
 *
 * @returns Step result
 */
async function registerAlias(): Promise<StepResult> {
  const outcome = await attemptAsync(
    () => portless$`portless alias ${REQUIRED_HOSTNAME} ${REQUIRED_PORT} --force`
  )
  if (!outcome.ok) {
    return { ok: false, detail: 'portless alias failed', fix: outcome.error.message }
  }
  return { ok: true, detail: `${REQUIRED_HOSTNAME}.localhost → 127.0.0.1:${REQUIRED_PORT}` }
}

/**
 * Confirm the alias actually appears in `portless list` after registration.
 *
 * @returns Step result
 */
async function verifyAlias(): Promise<StepResult> {
  const outcome = await attemptAsync(() => portless$`portless list`)
  if (!outcome.ok) {
    return { ok: false, detail: 'portless list failed', fix: outcome.error.message }
  }
  const output = outcome.value.stdout
  if (
    output.includes(`${REQUIRED_HOSTNAME}.localhost`) &&
    output.includes(`localhost:${REQUIRED_PORT}`)
  ) {
    return { ok: true, detail: 'visible in portless list' }
  }
  return {
    ok: false,
    detail: `alias not visible in portless list output`,
    fix: `Run \`portless list\` manually — the alias step above may have silently failed`,
  }
}
