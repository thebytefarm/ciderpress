import { spawn } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'

import type { Logger } from 'laufen'
import { lauf, z } from 'laufen'
import { attempt, isOk } from 'massaman/control'

interface ExampleMeta {
  readonly slug: string
  readonly pkg: string
  readonly title: string
  readonly description: string
  readonly theme: string | null
  readonly tagline: string | null
  readonly absPath: string
  readonly mountBase: string
}

export default lauf({
  description: 'Build the root docs site + all examples and merge under /examples/<name>/',
  args: {
    skipExamples: z.boolean().default(false).describe('Skip example builds (root only)'),
    skipRoot: z.boolean().default(false).describe('Skip the root docs build (examples + merge only)'),
    verbose: z.boolean().default(false).describe('Enable verbose logging'),
  },
  async run(ctx) {
    const root = ctx.dirs.root
    const examplesDir = join(root, 'examples')
    const examples = discoverExamples(examplesDir)

    if (examples.length === 0) {
      ctx.logger.warn('No examples discovered under examples/')
    } else if (ctx.args.verbose) {
      examples.map((e) => ctx.logger.info(`example: ${e.slug} (${e.pkg}) → ${e.mountBase}`))
    }

    ctx.spinner.start('Generating examples landing page')
    writeLandingMdx({ root, examples })
    ctx.spinner.stop(`Wrote docs/examples/index.mdx (${examples.length} card${examples.length === 1 ? '' : 's'})`)

    // Rspress only forwards `base` to Rspack's `assetPrefix` when
    // `NODE_ENV === 'production'`. Force it so example asset URLs
    // (`/static/js/...`) get the mount prefix.
    process.env.NODE_ENV = 'production'

    if (!ctx.args.skipRoot) {
      ctx.spinner.start('Building root docs site')
      const rootResult = await runRootBuild({ cwd: root, logger: ctx.logger })
      if (rootResult !== 0) {
        ctx.spinner.stop('Root docs build failed')
        return rootResult
      }
      ctx.spinner.stop('Built root docs site')
    }

    if (ctx.args.skipExamples || examples.length === 0) {
      return 0
    }

    ctx.spinner.start(`Building ${examples.length} example site${examples.length === 1 ? '' : 's'}`)
    const exampleResults = await Promise.all(
      examples.map((example) =>
        runBuild({
          pkg: example.pkg,
          cwd: root,
          env: { CIDERPRESS_BASE: example.mountBase },
          logger: ctx.logger,
        })
      )
    )
    const failedExamples = exampleResults
      .map((code, i) => ({ code, example: examples[i] }))
      .filter((r) => r.code !== 0)
    if (failedExamples.length > 0) {
      ctx.spinner.stop(`Failed to build ${failedExamples.length} example site(s)`)
      failedExamples.map((r) => ctx.logger.error(`build failed: ${r.example.slug}`))
      return 1
    }
    ctx.spinner.stop(`Built ${examples.length} example site${examples.length === 1 ? '' : 's'}`)

    ctx.spinner.start('Merging example dists into root dist')
    const mergeFailures = examples.flatMap((example) => {
      const result = attempt(() => mergeExampleDist({ root, example }))
      if (!isOk(result)) {
        return [{ example, error: result.error }]
      }
      return []
    })
    if (mergeFailures.length > 0) {
      ctx.spinner.stop(`Failed to merge ${mergeFailures.length} example dist(s)`)
      mergeFailures.map((f) => ctx.logger.error(`merge failed: ${f.example.slug} — ${f.error.message}`))
      return 1
    }
    ctx.spinner.stop(`Merged ${examples.length} example dist${examples.length === 1 ? '' : 's'} into .ciderpress/dist/examples/`)
  },
})

/**
 * Walk `examples/` and return one descriptor per directory that holds a
 * `ciderpress.config.*` plus a workspace `package.json`.
 *
 * @private
 * @param dir - Absolute path to the examples root directory
 * @returns Ordered (alpha-by-slug) list of discovered examples
 */
function discoverExamples(dir: string): readonly ExampleMeta[] {
  if (!existsSync(dir)) {
    return []
  }
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => join(dir, e.name))
    .flatMap((path) => {
      const slug = basename(path)
      const configPath = findConfigPath(path)
      if (configPath === null) {
        return []
      }
      const pkgPath = join(path, 'package.json')
      if (!existsSync(pkgPath)) {
        return []
      }
      const pkgResult = attempt(
        () =>
          JSON.parse(readFileSync(pkgPath, 'utf8')) as {
            name?: string
            scripts?: Record<string, string>
          }
      )
      if (!isOk(pkgResult) || typeof pkgResult.value.name !== 'string') {
        return []
      }
      // Skip examples that don't implement docs:build — adding the
      // script is the contract for opting in.
      const scripts = pkgResult.value.scripts
      if (scripts === undefined || scripts['docs:build'] === undefined) {
        return []
      }
      const source = readFileSync(configPath, 'utf8')
      return [
        {
          slug,
          pkg: pkgResult.value.name,
          title: extractStringField(source, 'title') ?? slug,
          description: extractStringField(source, 'description') ?? '',
          tagline: extractStringField(source, 'tagline'),
          theme: extractThemeName(source),
          absPath: path,
          mountBase: `/examples/${slug}/`,
        },
      ]
    })
    .sort((a, b) => a.slug.localeCompare(b.slug))
}

/**
 * Probe a directory for a Ciderpress config file in any supported
 * extension. Mirrors the loader's resolution order.
 *
 * @private
 * @param dir - Absolute path to the example directory
 * @returns Absolute path to the discovered config, or `null` when none
 */
function findConfigPath(dir: string): string | null {
  const extensions = ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs', 'json', 'jsonc', 'yml', 'yaml']
  const found = extensions
    .map((ext) => join(dir, `ciderpress.config.${ext}`))
    .find((p) => existsSync(p))
  return found ?? null
}

/**
 * Read a top-level string field (e.g. `title`, `description`) from a
 * Ciderpress TS/JS config source. Uses a regex against the literal
 * source rather than evaluating the module so React-pulling configs
 * still parse from Node without resolving the React graph.
 *
 * @private
 * @param source - Raw config source
 * @param field - Field name to look up
 * @returns The string literal value, or `null` when absent
 */
function extractStringField(source: string, field: string): string | null {
  const pattern = new RegExp(`\\b${field}\\s*:\\s*(['"\`])((?:\\\\.|(?!\\1).)*)\\1`, 's')
  const match = pattern.exec(source)
  if (match === null) {
    return null
  }
  return match[2].replace(/\\(['"`])/g, '$1')
}

/**
 * Pull the `theme.name` field out of a config source. Same regex-only
 * strategy as {@link extractStringField}.
 *
 * @private
 * @param source - Raw config source
 * @returns Theme name string, or `null` when not declared
 */
function extractThemeName(source: string): string | null {
  const match = /theme\s*:\s*\{\s*[^}]*?\bname\s*:\s*(['"`])([^'"`]+)\1/s.exec(source)
  if (match === null) {
    return null
  }
  return match[2]
}

/**
 * Spawn `pnpm --filter <pkg> docs:build` and resolve with its exit code.
 * `CIDERPRESS_BASE` (when set) wins over the example's config.base.
 *
 * @private
 * @param opts - Build target package, working directory, env overrides
 * @returns Process exit code (0 on success)
 */
function runBuild(opts: {
  readonly pkg: string
  readonly cwd: string
  readonly env: Readonly<Record<string, string>>
  readonly logger: Logger
}): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn('pnpm', ['--filter', opts.pkg, 'docs:build'], {
      cwd: opts.cwd,
      env: { ...process.env, ...opts.env },
      stdio: 'pipe',
    })
    const stderr: string[] = []
    child.stdout.on('data', (chunk) => stderr.push(String(chunk)))
    child.stderr.on('data', (chunk) => stderr.push(String(chunk)))
    child.on('close', (code) => {
      const exit = code ?? 0
      if (exit !== 0) {
        opts.logger.error(`${opts.pkg} build failed:\n${stderr.join('')}`)
      }
      resolve(exit)
    })
  })
}

/**
 * Build the root docs site by invoking the local `ciderpress` CLI
 * directly. Bypasses the `pnpm --filter ciderpress-monorepo docs:build`
 * indirection so this orchestrator can be the implementation of that
 * very script without recursing.
 *
 * @private
 * @param opts - Repo root + logger
 * @returns Process exit code (0 on success)
 */
function runRootBuild(opts: { readonly cwd: string; readonly logger: Logger }): Promise<number> {
  return new Promise((resolve) => {
    const cliPath = join(opts.cwd, 'packages', 'ciderpress', 'dist', 'cli.mjs')
    const child = spawn('node', [cliPath, 'build'], { cwd: opts.cwd, stdio: 'pipe' })
    const stderr: string[] = []
    child.stdout.on('data', (chunk) => stderr.push(String(chunk)))
    child.stderr.on('data', (chunk) => stderr.push(String(chunk)))
    child.on('close', (code) => {
      const exit = code ?? 0
      if (exit !== 0) {
        opts.logger.error(`root build failed:\n${stderr.join('')}`)
      }
      resolve(exit)
    })
  })
}

/**
 * Copy an example's `.ciderpress/dist/` into the root build output at
 * `.ciderpress/dist/examples/<slug>/`. Idempotent — overwrites in place.
 *
 * @private
 * @param opts - Repo root + the example metadata to merge
 */
function mergeExampleDist(opts: { readonly root: string; readonly example: ExampleMeta }): void {
  const src = join(opts.example.absPath, '.ciderpress', 'dist')
  const dst = join(opts.root, '.ciderpress', 'dist', 'examples', opts.example.slug)
  if (!existsSync(src)) {
    throw new Error(`expected ${src} to exist after build`)
  }
  mkdirSync(dst, { recursive: true })
  cpSync(src, dst, { recursive: true, force: true })
}

/**
 * Generate the auto-managed `docs/examples/index.mdx` landing page —
 * one flat card per discovered example, linking to its mount path.
 *
 * @private
 * @param opts - Repo root + the examples to render
 */
function writeLandingMdx(opts: { readonly root: string; readonly examples: readonly ExampleMeta[] }): void {
  const dir = join(opts.root, 'docs', 'examples')
  mkdirSync(dir, { recursive: true })
  const content = renderLandingMdx(opts.examples)
  writeFileSync(join(dir, 'index.mdx'), content)
}

/**
 * Render the examples landing-page MDX from the discovered example
 * list. Output is deterministic — same input always produces the same
 * file.
 *
 * @private
 * @param examples - Discovered examples (already sorted by slug)
 * @returns MDX source for `docs/examples/index.mdx`
 */
function renderLandingMdx(examples: readonly ExampleMeta[]): string {
  const cards = examples
    .map((e) => {
      const desc = e.tagline ?? e.description
      const themeChip = e.theme === null ? '' : ` · **theme**: \`${e.theme}\``
      return `### [${e.title}](${e.mountBase})\n\n${desc}${themeChip}`
    })
    .join('\n\n')

  return `---
title: Examples
description: Live example sites built with ciderpress.
---

{/* @auto-generated — regenerate with: pnpm docs:build */}

# Examples

Each card below links to a full ciderpress site mounted under \`/examples/<name>/\` on this deploy. Source for each example lives in [\`examples/\`](https://github.com/thebytefarm/ciderpress/tree/main/examples).

${cards}
`
}
