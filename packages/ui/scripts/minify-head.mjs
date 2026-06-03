/**
 * Pre-minify head asset files (CSS/JS) into dist/head/.
 *
 * Runs after rslib build. Uses esbuild (devDep) to minify
 * so the runtime read.ts has no dependency on esbuild.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, extname } from 'node:path'

import { transformSync } from 'esbuild'

const ROOT = new URL('..', import.meta.url).pathname
const SRC = resolve(ROOT, 'src/head')
const DIST = resolve(ROOT, 'dist/head')

const SUPPORTED = new Set(['.css', '.js'])

function minifyEntry(srcPath, distPath) {
  const ext = extname(srcPath)
  const content = readFileSync(srcPath, 'utf8')
  try {
    const { code } = transformSync(content, { loader: ext.slice(1), minify: true })
    writeFileSync(distPath, code)
  } catch (err) {
    process.stderr.write(`[ciderpress] Failed to minify ${srcPath}: ${err.message}\n`)
    process.exit(1)
  }
}

function processDir(src, dist) {
  mkdirSync(dist, { recursive: true })
  readdirSync(src, { withFileTypes: true }).forEach((entry) => {
    const srcPath = resolve(src, entry.name)
    const distPath = resolve(dist, entry.name)
    if (entry.isDirectory()) {
      processDir(srcPath, distPath)
      return
    }
    if (!SUPPORTED.has(extname(entry.name))) {
      return
    }
    minifyEntry(srcPath, distPath)
  })
}

processDir(SRC, DIST)
