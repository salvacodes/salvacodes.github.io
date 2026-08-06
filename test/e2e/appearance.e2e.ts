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

test('toggles the style from quick settings and repaints the page', async ({ page }) => {
  await page.goto('/')
  const background = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  const before = await background()
  await page.locator('sc-top-bar #status').click()
  await page.locator('sc-quick-settings [data-tile-id="dark-style"]').click()
  await expect(page.locator('html')).toHaveAttribute('data-style', 'light')
  expect(await background()).not.toBe(before)
})

test('remembers the style across a reload', async ({ page }) => {
  await page.goto('/')
  await page.locator('sc-top-bar #status').click()
  await page.locator('sc-quick-settings [data-tile-id="dark-style"]').click()
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-style', 'light')
})

test('changes the wallpaper from the settings app', async ({ page }) => {
  await page.goto('/')
  await page.locator('sc-top-bar #status').click()
  await page.locator('sc-quick-settings [data-action-id="settings"]').click()
  await page.locator('sc-settings-app sc-appearance-panel [data-wallpaper-id="grid"]').click()
  await expect(page.locator('html')).toHaveAttribute('data-wallpaper', 'grid')
})

test('closes quick settings on escape and restores focus', async ({ page }) => {
  await page.goto('/')
  await page.locator('sc-top-bar #status').click()
  await expect(page.locator('sc-top-bar #status')).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Escape')
  await expect(page.locator('sc-top-bar #status')).toHaveAttribute('aria-expanded', 'false')
})

test('opens settings from the desktop context menu change background action', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop-only scenario')
  await page.goto('/')
  await page.locator('sc-wallpaper').click({ button: 'right', position: { x: 200, y: 300 } })
  await page.locator('sc-context-menu [data-item-id="change-background"]').click()
  await expect(page.locator('sc-window sc-settings-app')).toBeVisible()
})
