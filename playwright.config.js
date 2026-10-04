import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  workers: 2,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:8090',
    contextOptions: { reducedMotion: 'reduce' },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node scripts/serve.mjs 8090',
    url: 'http://127.0.0.1:8090',
    reuseExistingServer: true,
  },
})
