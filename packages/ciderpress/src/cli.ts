#!/usr/bin/env node
/**
 * CLI passthrough — re-exports the CLI entry from @ciderpress/cli.
 * This lets `npx ciderpress` or the `ciderpress` bin work from the main package.
 */
// oxlint-disable-next-line eslint-plugin-import/no-unassigned-import -- CLI entry point requires side-effect import
import '@ciderpress/cli'
