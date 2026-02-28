import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [tsconfigPaths({ projects: ['./tsconfig.json'] }), viteReact()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/__tests__/**/*.{test,spec}.{ts,tsx}'],
    server: {
      deps: {
        // Externalize server-only packages that import Node internals (net, tls, etc.)
        external: [/ioredis/, /convex/, /@anthropic-ai/, /@clerk\/backend/],
      },
    },
  },
})
