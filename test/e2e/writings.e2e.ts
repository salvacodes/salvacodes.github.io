import { expect, test } from '@playwright/test'

const POST_SLUG = 'how-this-site-is-built'
const POST_PATH = `/writing/${POST_SLUG}/`

const openWritingsFromDock = async (page: import('@playwright/test').Page) => {
  await page.goto('/')
  await page.locator('sc-dock button[data-app-id="writings"]').click()
  return page.locator('sc-window', { has: page.locator('sc-writings-app') })
}

test('a post link opens the desktop with the post already open', async ({ page }) => {
  const pageErrors: Error[] = []
  page.on('pageerror', (error) => pageErrors.push(error))

  await page.goto(POST_PATH)

  await expect(page.locator('sc-writings-app .post-title')).toHaveText('How this site is built')
  await expect(page.locator('sc-writings-app .article-body')).toContainText('Zero runtime dependencies')
  await expect(page.locator('#prerendered-article')).toHaveCount(0)
  expect(pageErrors).toEqual([])
})

test('the post is described for search results and link previews', async ({ page }) => {
  await page.goto(POST_PATH)

  await expect(page).toHaveTitle(/How this site is built/)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://salva.codes${POST_PATH}`)
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article')
})

test.describe('without javascript', () => {
  test.use({ javaScriptEnabled: false })

  test('the post is still readable', async ({ page }) => {
    await page.goto(POST_PATH)

    await expect(page.locator('#prerendered-article h1')).toHaveText('How this site is built')
    await expect(page.locator('#prerendered-article .article-body')).toContainText('Zero runtime dependencies')
    await expect(page.locator('sc-desktop')).toHaveCount(0)
  })

  test('the archive lists the published posts', async ({ page }) => {
    await page.goto('/writing/')

    await expect(page.locator('.archive-entry-title a').first()).toHaveAttribute('href', POST_PATH)
  })

  test('drafts stay out of the published site', async ({ page }) => {
    await page.goto('/writing/')

    await expect(page.locator('#prerendered-article')).not.toContainText('Leaving delivery for security')
  })
})

test('opening a post from the list moves the address bar', async ({ page }) => {
  await openWritingsFromDock(page)

  await page.locator(`sc-writings-app .post-entry[data-slug="${POST_SLUG}"]`).click()

  await expect(page).toHaveURL(POST_PATH)
})

test('going back leaves the post without leaving the desktop', async ({ page }) => {
  await openWritingsFromDock(page)
  await page.locator(`sc-writings-app .post-entry[data-slug="${POST_SLUG}"]`).click()
  await expect(page.locator('sc-writings-app .post-title')).toBeVisible()

  await page.goBack()

  await expect(page).toHaveURL('/')
  await expect(page.locator('sc-writings-app .pane-notice-title')).toHaveText('Writings')
  await expect(page.locator('sc-desktop')).toHaveCount(1)
})

test('closing the window returns the address to the desktop', async ({ page }) => {
  const writingsWindow = await openWritingsFromDock(page)
  await page.locator(`sc-writings-app .post-entry[data-slug="${POST_SLUG}"]`).click()
  await expect(page).toHaveURL(POST_PATH)

  await writingsWindow.locator('button#close').click()

  await expect(page).toHaveURL('/')
})

test('the terminal opens a post by name', async ({ page }) => {
  await page.goto('/')
  const input = page.locator('sc-terminal-app #command-input')

  await input.fill(`writing ${POST_SLUG}`)
  await input.press('Enter')

  await expect(page.locator('sc-writings-app .post-title')).toHaveText('How this site is built')
  await expect(page).toHaveURL('/')
})

test('the feed carries the published posts', async ({ page }) => {
  const response = await page.request.get('/feed.xml')

  expect(response.headers()['content-type']).toContain('xml')
  const feed = await response.text()
  expect(feed).toContain('<title>How this site is built</title>')
  expect(feed).not.toContain('Leaving delivery for security')
})

test('the post page provokes no content security policy violation', async ({ page }) => {
  const refusals: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' && /content security policy|refused to/i.test(message.text())) {
      refusals.push(message.text())
    }
  })

  await page.goto(POST_PATH)
  await expect(page.locator('sc-writings-app .article-body')).toBeVisible()

  expect(refusals).toEqual([])
})

test('the post body in the app is painted with the desktop tokens', async ({ page }) => {
  await page.goto(POST_PATH)
  const code = page.locator('sc-writings-app .article-body pre').first()
  await expect(code).toBeVisible()

  const painted = await code.evaluate((element) => {
    const probe = document.createElement('div')
    probe.style.backgroundColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-terminal-bg')
      .trim()
    document.body.append(probe)
    const token = getComputedStyle(probe).backgroundColor
    probe.remove()
    return { actual: getComputedStyle(element).backgroundColor, token }
  })

  expect(painted.actual).toBe(painted.token)
})

test('the standalone page ships the styles the post body needs', async ({ request }) => {
  const html = await (await request.get(POST_PATH)).text()
  const stylesheet = /<link rel="stylesheet" href="([^"]+)">/.exec(html)?.[1] ?? ''

  const css = await (await request.get(stylesheet)).text()

  expect(css).toContain('.article-body pre')
  expect(css).toContain('#prerendered-article')
})
