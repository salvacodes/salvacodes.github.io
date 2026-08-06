import { expect, test } from '@playwright/test'

test('every declared icon and the default favicon path resolve', async ({ page, request }) => {
  await page.goto('/')

  const hrefs = await page.evaluate(
    (selector) => [...document.querySelectorAll<HTMLLinkElement>(selector)].map((link) => link.href),
    'link[rel~="icon"], link[rel~="apple-touch-icon"]'
  )

  expect(hrefs.length).toBeGreaterThan(0)

  for (const href of [...hrefs, new URL('/favicon.ico', page.url()).href]) {
    const response = await request.get(href)
    expect(response.status(), href).toBe(200)
    expect((await response.body()).byteLength, href).toBeGreaterThan(0)
  }
})

test('the default favicon stays within its byte budget', async ({ request }) => {
  const response = await request.get('/favicon.ico')
  const bytes = (await response.body()).byteLength

  expect(bytes, 'every browser fetches /favicon.ico by path on first paint').toBeLessThan(20_000)
})

test('the web app manifest is reachable and its icons resolve', async ({ page, request }) => {
  await page.goto('/')

  const manifestHref = await page.evaluate(() => document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.href)
  expect(manifestHref).toBeTruthy()

  const response = await request.get(manifestHref as string)
  expect(response.status()).toBe(200)

  const manifest = (await response.json()) as { icons: { src: string }[] }
  expect(manifest.icons.length).toBeGreaterThan(0)

  for (const icon of manifest.icons) {
    const iconResponse = await request.get(new URL(icon.src, manifestHref).href)
    expect(iconResponse.status(), icon.src).toBe(200)
  }
})

test('the content security policy permits fetching the declared manifest', async ({ page }) => {
  await page.goto('/')

  const policy = await page.evaluate(
    () => document.querySelector<HTMLMetaElement>('meta[http-equiv="Content-Security-Policy"]')?.content
  )
  expect(policy, 'the built page ships a meta CSP').toBeTruthy()

  const manifestSources = (policy as string)
    .split(';')
    .map((directive) => directive.trim().split(/\s+/))
    .find(([name]) => name === 'manifest-src')

  expect(manifestSources, 'manifest-src falls back to default-src none without its own directive').toBeDefined()
  expect(manifestSources?.slice(1)).toContain("'self'")
})
