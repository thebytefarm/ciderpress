import { afterAll, beforeAll, bench, describe } from 'vitest'

import { runCli } from '../helpers/exec.ts'
import type { GeneratedFixture } from '../helpers/fixtures.ts'
import { BENCH_OPTIONS, TIERS, generateFixture } from '../helpers/fixtures.ts'

const fixtures = new Map<string, GeneratedFixture>()

beforeAll(() => {
  TIERS.forEach((tier) => fixtures.set(tier.name, generateFixture({ files: tier.files })))
})

afterAll(() => {
  fixtures.forEach((f) => f.cleanup())
})

describe.each(TIERS)('ciderpress build (cli) — $name (~$files files)', (tier) => {
  bench(
    'build',
    () => {
      const fixture = fixtures.get(tier.name)
      if (fixture) {
        runCli(['build', '--no-check', '--quiet'], fixture.dir)
      }
    },
    BENCH_OPTIONS
  )
})
