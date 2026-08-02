import { playwright } from '@vitest/browser-playwright'
import { defineConfig, type Plugin } from 'vitest/config'

const contentSecurityPolicy = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'none'",
  "base-uri 'none'",
  "form-action 'none'"
].join('; ')

const injectMetaCsp = (): Plugin => ({
  name: 'inject-meta-csp',
  apply: 'build',
  transformIndexHtml(html) {
    return html.replace(
      '<head>',
      `<head>\n    <meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}">`
    )
  }
})

export default defineConfig({
  plugins: [injectMetaCsp()],
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          attachmentsDir: 'test-results/unit/vitest-attachments',
          include: ['src/**/*.test.ts'],
          exclude: ['src/**/*.browser.test.ts']
        }
      },
      {
        test: {
          name: 'browser',
          attachmentsDir: 'test-results/browser/vitest-attachments',
          include: ['src/**/*.browser.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            screenshotDirectory: 'test-results/screenshots',
            provider: playwright(),
            instances: [{ browser: 'chromium' }]
          }
        }
      }
    ]
  }
})
