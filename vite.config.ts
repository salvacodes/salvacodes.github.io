import { playwright } from '@vitest/browser-playwright'
import { defineConfig, type Plugin } from 'vitest/config'
import { writings } from './src/content-pipeline/writings-plugin'

const contentSecurityPolicy = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "manifest-src 'self'",
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
  plugins: [injectMetaCsp(), writings()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          attachmentsDir: 'test-results/unit/vitest-attachments',
          include: ['src/**/*.test.ts'],
          exclude: ['src/**/*.browser.test.ts']
        }
      },
      {
        extends: true,
        test: {
          name: 'browser',
          attachmentsDir: 'test-results/browser/vitest-attachments',
          include: ['src/**/*.browser.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            screenshotDirectory: 'test-results/screenshots',
            provider: playwright(),
            viewport: { width: 1280, height: 800 },
            instances: [{ browser: 'chromium' }]
          }
        }
      }
    ]
  }
})
