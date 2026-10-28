import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@ciderpress/internal/user-config': fileURLToPath(
        new URL('./src/theme/lib/user-config-stub.ts', import.meta.url)
      ),
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
