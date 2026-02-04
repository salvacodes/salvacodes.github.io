/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config'

export default getViteConfig({
  test: {
    environment: 'happy-dom',
    globals: false,
    clearMocks: true,
    include: ['src/**/*.{test,spec}.{ts,tsx,js,jsx}']
  }
})
