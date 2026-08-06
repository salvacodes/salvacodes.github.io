import { expect, type Page, test } from '@playwright/test'
import { openDesktopMenu } from './desktop-page'

declare global {
  interface Window {
    __contextMenuDefaultPrevented?: boolean
  }
}

const trackNativeContextMenu = (page: Page) =>
  page.addInitScript(() => {
    window.addEventListener('contextmenu', (event) => {
      setTimeout(() => {
        window.__contextMenuDefaultPrevented = event.defaultPrevented
      }, 0)
    })
  })

test('opens the terminal from the desktop menu', async ({ page }) => {
  await page.goto('/')
  await page.locator('sc-window').getByRole('button', { name: 'Close' }).click()
  await expect(page.locator('sc-window')).toHaveCount(0)

  const menu = await openDesktopMenu(page)
  await menu.getByRole('menuitem', { name: 'Open Terminal' }).click()

  await expect(page.locator('sc-window')).toHaveCount(1)
  await expect(menu).toBeHidden()
})

test('the browser default context menu action is prevented on a menu-owning surface', async ({ page }) => {
  await trackNativeContextMenu(page)
  await page.goto('/')

  await openDesktopMenu(page)

  await expect.poll(() => page.evaluate(() => window.__contextMenuDefaultPrevented)).toBe(true)
})

test('the browser default context menu action is prevented everywhere on the desktop', async ({ page }) => {
  await trackNativeContextMenu(page)
  await page.goto('/')

  await page.locator('sc-top-bar').click({ button: 'right', position: { x: 5, y: 10 } })

  await expect.poll(() => page.evaluate(() => window.__contextMenuDefaultPrevented)).toBe(true)
})
