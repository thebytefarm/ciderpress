import { build, context } from 'esbuild'

const isWatch = process.argv.includes('--watch')

/** @type {import('esbuild').BuildOptions} */
const config = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node20',
  sourcemap: true,
}

if (isWatch) {
  const ctx = await context(config)
  await ctx.watch()
  console.log('[ciderpress-vscode] watching for changes...')
} else {
  await build(config)
  console.log('[ciderpress-vscode] build complete')
}
