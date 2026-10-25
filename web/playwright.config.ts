import { defineConfig } from '@playwright/test'

const PORT = 5178
const baseURL = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL,
    channel: 'chrome',
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      // Deterministic agent stream: no LLM cost, no upstream needed.
      command: 'node e2e/mock-api.mjs',
      url: 'http://127.0.0.1:8010/api/ai/health',
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: `npm run dev -- --port ${PORT} --strictPort`,
      url: baseURL,
      reuseExistingServer: true,
      timeout: 60_000,
      env: { BACKEND_URL: 'http://127.0.0.1:8010' },
    },
  ],
})
