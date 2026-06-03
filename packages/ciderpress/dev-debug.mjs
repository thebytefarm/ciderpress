import { resolve } from 'node:path'

import { dev } from '@rspress/core'
import { loadConfig } from '@ciderpress/config/loader'
import { createRspressConfig } from '@ciderpress/ui/node'

const cwd = resolve(import.meta.dirname, '..', '..')
const [configErr, config] = await loadConfig(cwd)
if (configErr) {
  console.error('config error:', configErr.message)
  process.exit(1)
}
const paths = {
  repoRoot: cwd,
  outputRoot: resolve(cwd, '.ciderpress'),
  contentDir: resolve(cwd, '.ciderpress/content'),
  publicDir: resolve(cwd, '.ciderpress/public'),
  distDir: resolve(cwd, '.ciderpress/dist'),
  cacheDir: resolve(cwd, '.ciderpress/cache'),
}
await dev({
  appDirectory: paths.repoRoot,
  docDirectory: paths.contentDir,
  config: createRspressConfig({ config, paths, logLevel: 'info' }),
  configFilePath: '',
  extraBuilderConfig: { server: { port: 6176, strictPort: false }, dev: { progressBar: false } },
})
console.log('[ready] http://localhost:6176')
await new Promise(() => {})
