import { command } from '@kidd-cli/core'
import { screen } from '@kidd-cli/core/ui'
import { z } from 'zod'

import { runDevHeadless } from '../lib/dev-headless.ts'
import { DevScreen } from '../screens/dev-screen.tsx'

const devOptions = z.object({
  quiet: z.boolean().optional().default(false),
  clean: z.boolean().optional().default(false),
  port: z.number().optional(),
  theme: z.string().optional(),
  colorMode: z.enum(['dark', 'light']).optional(),
  vscode: z.boolean().optional().default(false),
  headless: z.boolean().optional().default(false),
})

/**
 * Detected at module load by scanning `process.argv`. When `--headless`
 * is present the command is registered as a plain handler (no Ink/TUI);
 * otherwise the full DevScreen fullscreen TUI is rendered.
 *
 * Argv inspection is the cleanest way to swap registration shape under
 * kidd-cli's auto-discovery model — by the time the command file is
 * imported, `process.argv` already reflects the user's invocation.
 */
const isHeadless = process.argv.includes('--headless')

/**
 * Registers the `dev` CLI command to sync, watch, and start a live dev server.
 *
 * Default invocation renders an Ink TUI (`DevScreen`). Pass `--headless`
 * to run without the TUI — useful for CI, nodemon, Docker, or any
 * non-interactive parent process where raw-mode stdin isn't available.
 */
export default defineDevCommand()

/**
 * Build the command registration — headless path uses a plain handler,
 * default path uses the Ink TUI screen.
 *
 * @private
 * @returns Registration accepted by kidd-cli's command auto-discovery
 */
function defineDevCommand() {
  if (isHeadless) {
    return command({
      name: 'dev',
      description: 'Run sync + watcher and start Rspress dev server',
      options: devOptions,
      handler: async (ctx) => {
        await runDevHeadless(ctx.args)
      },
    })
  }
  return screen({
    name: 'dev',
    description: 'Run sync + watcher and start Rspress dev server',
    exit: 'manual',
    fullscreen: true,
    options: devOptions,
    render: DevScreen,
  })
}
