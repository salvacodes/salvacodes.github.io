import { expect, type Page, test } from '@playwright/test'

const POST_TITLE = 'How this site is built'
const POST_PATH = '/writing/how-this-site-is-built/'

const openWritingsFromDock = async (page: Page) => {
  await page.goto('/')
  await page.getByTitle('Writings').click()
  return page.locator('sc-window').filter({ has: page.locator('sc-writings-app') })
}

const openPostFromList = (page: Page) =>
  page
    .locator('sc-writings-app')
    .getByRole('button', { name: new RegExp(POST_TITLE) })
    .click()

test('a post link opens the desktop with the post already open', async ({ page }) => {
  const pageErrors: Error[] = []
  page.on('pageerror', (error) => pageErrors.push(error))

  await page.goto(POST_PATH)

  await expect(page.locator('sc-writings-app')).toContainText(POST_TITLE)
  await expect(page.locator('sc-writings-app')).toContainText('Zero runtime dependencies')
  await expect(page.locator('#prerendered-article')).toHaveCount(0)
  expect(pageErrors).toEqual([])
})

test('the post is described for search results and link previews', async ({ page }) => {
  await page.goto(POST_PATH)

  await expect(page).toHaveTitle(new RegExp(POST_TITLE))
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://salva.codes${POST_PATH}`)
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article')
})

test('opening a post from the list moves the address bar', async ({ page }) => {
  await openWritingsFromDock(page)

  await openPostFromList(page)

  await expect(page).toHaveURL(POST_PATH)
})

test('going back leaves the post without leaving the desktop', async ({ page }) => {
  await openWritingsFromDock(page)
  await openPostFromList(page)
  await expect(page).toHaveURL(POST_PATH)

  await page.goBack()

  await expect(page).toHaveURL('/')
  await expect(page.locator('sc-desktop')).toHaveCount(1)
})

test('closing the window returns the address to the desktop', async ({ page }) => {
  const writingsWindow = await openWritingsFromDock(page)
  await openPostFromList(page)
  await expect(page).toHaveURL(POST_PATH)

  await writingsWindow.getByRole('button', { name: 'Close' }).click()

  await expect(page).toHaveURL('/')
})

test('the terminal opens a post by name', async ({ page }) => {
  await page.goto('/')
  const terminal = page.locator('sc-terminal-app')

  await terminal.click()
  await page.keyboard.type('writing how-this-site-is-built')
  await page.keyboard.press('Enter')

  await expect(page.locator('sc-writings-app')).toContainText(POST_TITLE)
  await expect(page).toHaveURL('/')
})

test('the feed carries the published posts', async ({ page }) => {
  const response = await page.request.get('/feed.xml')

  expect(response.headers()['content-type']).toContain('xml')
  const feed = await response.text()
  expect(feed).toContain(`<title>${POST_TITLE}</title>`)
  expect(feed).not.toContain('Leaving delivery for security')
})
