import { expect, test } from '@playwright/test'

const POST_PATH = '/writing/how-this-site-is-built/'

test.describe('without javascript', () => {
  test.use({ javaScriptEnabled: false })

  test('the post is still readable', async ({ page }) => {
    await page.goto(POST_PATH)

    await expect(page.locator('#prerendered-article h1')).toHaveText('How this site is built')
    await expect(page.locator('#prerendered-article')).toContainText('Zero runtime dependencies')
    await expect(page.locator('sc-desktop')).toHaveCount(0)
  })

  test('the archive lists the published posts', async ({ page }) => {
    await page.goto('/writing/')

    await expect(page.getByRole('link', { name: 'How this site is built' }).first()).toHaveAttribute('href', POST_PATH)
  })

  test('drafts stay out of the published site', async ({ page }) => {
    await page.goto('/writing/')

    await expect(page.locator('#prerendered-article')).not.toContainText('Leaving delivery for security')
  })
})

test('the post page provokes no content security policy violation', async ({ page }) => {
  const refusals: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' && /content security policy|refused to/i.test(message.text())) {
      refusals.push(message.text())
    }
  })

  await page.goto(POST_PATH)
  await expect(page.locator('sc-writings-app')).toBeVisible()

  expect(refusals).toEqual([])
})
