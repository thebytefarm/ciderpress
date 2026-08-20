import { defineConfig } from '@rslib/core'

export default defineConfig({
  lib: [
    {
      format: 'esm',
      bundle: true,
      syntax: 'esnext',
      autoExtension: false,
      dts: false,
      source: {
        entry: {
          index: './src/index.mjs',
          'no-classes': './src/no-classes.mjs',
          'no-dynamic-filesystem-path': './src/no-dynamic-filesystem-path.mjs',
          'no-dynamic-regexp': './src/no-dynamic-regexp.mjs',
          'no-let': './src/no-let.mjs',
          'no-loop-statements': './src/no-loop-statements.mjs',
          'no-this-expressions': './src/no-this-expressions.mjs',
          'no-throw-statements': './src/no-throw-statements.mjs',
        },
      },
      output: {
        filename: { js: '[name].mjs' },
      },
    },
  ],
  output: {
    target: 'node',
    cleanDistPath: true,
  },
})
