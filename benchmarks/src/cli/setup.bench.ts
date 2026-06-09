import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { bench, describe } from 'vitest'

import { runCli } from '../helpers/exec.ts'
import { BENCH_OPTIONS } from '../helpers/fixtures.ts'

describe('ciderpress setup (cli)', () => {
  bench(
    'fresh project',
    () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ciderpress-bench-setup-'))
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        '{"name":"bench-setup","private":true}',
        'utf8'
      )
      try {
        runCli(['setup'], tempDir)
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true })
      }
    },
    BENCH_OPTIONS
  )
})
