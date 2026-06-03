#!/usr/bin/env node
/**
 * CLI passthrough — re-exports the CLI entry from @zpress/cli.
 * This lets `npx zpress` or the `zpress` bin work from the main package.
 */
// oxlint-disable-next-line eslint-plugin-import/no-unassigned-import -- CLI entry point requires side-effect import
import '@zpress/cli'
