import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://localhost:5174',
    screenshot: 'on',
    trace: 'on',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        // ハンディ端末の設計サイズに合わせる
        viewport: { width: 360, height: 720 },
      },
    },
  ],
  webServer: [
    {
      command: 'npx @stoplight/prism-cli mock openapi/api.yaml --port 4010 --cors',
      url: 'http://localhost:4010/health',
      reuseExistingServer: true,
      timeout: 60000,
    },
    {
      command: 'npx vite --port 5174 --strictPort',
      url: 'http://localhost:5174',
      reuseExistingServer: true,
      timeout: 60000,
    },
  ],
})
