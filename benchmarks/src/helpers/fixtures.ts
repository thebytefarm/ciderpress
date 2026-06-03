import fs from 'node:fs'
import path from 'node:path'

import type { BenchOptions } from 'vitest'

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..', '..')

const DIRECTORY_NAMES = [
  'guides',
  'api',
  'tutorials',
  'concepts',
  'reference',
  'architecture',
  'integrations',
  'operations',
  'deployment',
  'security',
  'monitoring',
  'migrations',
  'workflows',
  'plugins',
  'internals',
  'examples',
  'recipes',
  'patterns',
  'troubleshooting',
  'contributing',
] as const

const LOREM_PARAGRAPHS = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
  'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.',
  'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.',
]

/**
 * Shared bench options: 2 iterations, no warmup.
 */
export const BENCH_OPTIONS: BenchOptions = {
  iterations: 2,
  time: 0,
  warmupIterations: 0,
  warmupTime: 0,
}

/**
 * Benchmark tier definition.
 */
export const TIERS = [
  { name: 'medium', files: 50 },
  { name: 'large', files: 150 },
  { name: 'xl', files: 750 },
] as const

/**
 * A generated fixture project with a cleanup function.
 */
export interface GeneratedFixture {
  readonly dir: string
  readonly fileCount: number
  readonly cleanup: () => void
}

/**
 * Options for generating a fixture project.
 */
export interface GenerateFixtureOptions {
  /** Total number of markdown files to generate. */
  readonly files: number
  /** Override the number of sections (default: auto-derived from file count). */
  readonly sections?: number
}

/**
 * Generate a fixture project with deterministic markdown files.
 *
 * Creates a temp directory inside the repo (so workspace deps resolve),
 * writes a ciderpress config and distributes markdown files across sections
 * and subdirectories automatically.
 *
 * Sections default to `clamp(ceil(files / 50), 2, 15)`.
 * Subdirectories per section default to `clamp(ceil(filesPerSection / 10), 1, 10)`.
 * Files are distributed as evenly as possible, with remainders going to earlier groups.
 *
 * @param options - Fixture generation options
 * @returns Object with dir path, file count, and cleanup function
 */
export function generateFixture(options: GenerateFixtureOptions): GeneratedFixture {
  const { files } = options
  const sectionCount = options.sections ?? Math.min(15, Math.max(2, Math.ceil(files / 50)))
  const filesPerSection = Math.ceil(files / sectionCount)
  const dirsPerSection = Math.min(10, Math.max(1, Math.ceil(filesPerSection / 10)))

  const fixturesDir = path.join(REPO_ROOT, '.bench-fixtures')
  fs.mkdirSync(fixturesDir, { recursive: true })
  const dir = fs.mkdtempSync(path.join(fixturesDir, 'bench-'))

  // Build unique section names
  const sectionNames = Array.from({ length: sectionCount }, (_, i) => {
    const base = DIRECTORY_NAMES[i % DIRECTORY_NAMES.length]
    if (i < DIRECTORY_NAMES.length) {
      return base
    }
    return `${base}-${Math.floor(i / DIRECTORY_NAMES.length) + 1}`
  })

  // Write ciderpress.config.ts
  const sectionConfigs = sectionNames
    .map(
      (name) => `    {
      title: '${name.charAt(0).toUpperCase()}${name.slice(1)}',
      path: '/${name}',
      include: '${name}/**/*.md',
      recursive: true,
    }`
    )
    .join(',\n')

  fs.writeFileSync(
    path.join(dir, 'ciderpress.config.ts'),
    `import { defineConfig } from 'ciderpress'

export default defineConfig({
  title: 'Benchmark Fixture',
  sections: [
${sectionConfigs}
  ],
})
`,
    'utf8'
  )

  // Write package.json so workspace deps resolve
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify(
      {
        name: 'bench-fixture',
        private: true,
        type: 'module',
        dependencies: { 'ciderpress': 'workspace:*' },
      },
      null,
      2
    ),
    'utf8'
  )

  // Distribute files across sections, then across directories within each section
  let remaining = files
  let globalIdx = 0

  sectionNames.forEach((section, sectionIdx) => {
    const sectionsLeft = sectionCount - sectionIdx
    const sectionFiles = Math.ceil(remaining / sectionsLeft)
    remaining -= sectionFiles

    // Distribute this section's files across directories
    let sectionRemaining = sectionFiles
    const dirNames = Array.from(
      { length: dirsPerSection },
      (_, i) => `group-${String(i + 1).padStart(2, '0')}`
    )

    dirNames.forEach((dirName, dirIdx) => {
      const dirsLeft = dirsPerSection - dirIdx
      const dirFiles = Math.ceil(sectionRemaining / dirsLeft)
      sectionRemaining -= dirFiles

      const targetDir = path.join(dir, section, dirName)
      fs.mkdirSync(targetDir, { recursive: true })

      Array.from({ length: dirFiles }, (_, fileIdx) => {
        const title = `${section} ${dirName} document ${fileIdx + 1}`
        const slug = `doc-${String(fileIdx + 1).padStart(3, '0')}`
        const para1 = LOREM_PARAGRAPHS[globalIdx % LOREM_PARAGRAPHS.length]
        const para2 = LOREM_PARAGRAPHS[(globalIdx + 1) % LOREM_PARAGRAPHS.length]
        const para3 = LOREM_PARAGRAPHS[(globalIdx + 2) % LOREM_PARAGRAPHS.length]

        const content = `---
title: "${title}"
description: "Documentation for ${section} ${dirName} topic ${fileIdx + 1}"
---

# ${title}

${para1}

## Overview

${para2}

## Details

${para3}

## Configuration

\`\`\`ts
const config = {
  name: '${slug}',
  enabled: true,
  timeout: ${(fileIdx + 1) * 1000},
}
\`\`\`
`
        fs.writeFileSync(path.join(targetDir, `${slug}.md`), content, 'utf8')
        globalIdx += 1
      })
    })
  })

  return {
    dir,
    fileCount: globalIdx,
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
  }
}
