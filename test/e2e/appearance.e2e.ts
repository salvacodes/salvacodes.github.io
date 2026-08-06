import { expect, test } from '@playwright/test'

test.use({ colorScheme: 'dark' })

test('applies the dark style by default', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-style', 'dark')
  await expect(page.locator('html')).toHaveAttribute('data-wallpaper', 'signal')
})

test.describe('on a light operating system', () => {
  test.use({ colorScheme: 'light' })

  test('starts in the light style', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-style', 'light')
  })

  test('honours an explicit dark choice made earlier', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.setItem('salvacodes.style', 'dark'))
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-style', 'dark')
  })
})

test('ignores a stored style that is not in the allowlist', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('salvacodes.style', 'solarized'))
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-style', 'dark')
})

test('repaints the page when the style changes', async ({ page }) => {
  await page.goto('/')
  const background = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  const before = await background()

  await page.getByRole('button', { name: 'System menu' }).click()
  await page.getByRole('button', { name: 'Dark Style' }).click()

  await expect(page.locator('html')).toHaveAttribute('data-style', 'light')
  expect(await background()).not.toBe(before)
})

test('remembers the style across a reload', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'System menu' }).click()
  await page.getByRole('button', { name: 'Dark Style' }).click()

  await page.reload()

  await expect(page.locator('html')).toHaveAttribute('data-style', 'light')
})
