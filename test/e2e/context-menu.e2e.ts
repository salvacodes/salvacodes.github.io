import { expect, test } from '@playwright/test'

declare global {
  interface Window {
    __contextMenuDefaultPrevented?: boolean
  }
}

const menu = 'sc-context-menu [role="menu"]'

const trackNativeContextMenu = (page: import('@playwright/test').Page) =>
  page.addInitScript(() => {
    window.addEventListener('contextmenu', (event) => {
      setTimeout(() => {
        window.__contextMenuDefaultPrevented = event.defaultPrevented
      }, 0)
    })
  })

test.describe('pointer context menus', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only scenarios')

  test('right-clicking the desktop opens the desktop menu', async ({ page }) => {
    await page.goto('/')
    await page.locator('sc-wallpaper').click({ button: 'right', position: { x: 200, y: 300 } })
    await expect(page.locator(menu)).toBeVisible()
    await expect(page.locator(`${menu} [data-item-id="open-terminal"]`)).toHaveText('Open Terminal')
    await expect(page.locator(`${menu} [data-item-id="display-settings"]`)).toHaveAttribute('aria-disabled', 'true')
  })

  test('opens the terminal from the desktop menu', async ({ page }) => {
    await page.goto('/')
    await page.locator('sc-window #close').click()
    await expect(page.locator('sc-window')).toHaveCount(0)
    await page.locator('sc-wallpaper').click({ button: 'right', position: { x: 200, y: 300 } })
    await page.locator(`${menu} [data-item-id="open-terminal"]`).click()
    await expect(page.locator('sc-window')).toHaveCount(1)
    await expect(page.locator(menu)).toBeHidden()
  })

  test('closes a window from the title bar menu', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('sc-window')).toHaveCount(1)
    await page.locator('sc-window #title-bar').click({ button: 'right', position: { x: 40, y: 10 } })
    await page.locator(`${menu} [data-item-id="close"]`).click()
    await expect(page.locator('sc-window')).toHaveCount(0)
  })

  test('escape dismisses the menu', async ({ page }) => {
    await page.goto('/')
    await page.locator('sc-wallpaper').click({ button: 'right', position: { x: 200, y: 300 } })
    await expect(page.locator(menu)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator(menu)).toBeHidden()
  })

  test('a disabled entry does nothing and leaves the menu open', async ({ page }) => {
    await page.goto('/')
    await page.locator('sc-wallpaper').click({ button: 'right', position: { x: 200, y: 300 } })
    await page.locator(`${menu} [data-item-id="display-settings"]`).click({ force: true })
    await expect(page.locator(menu)).toBeVisible()
  })

  test('the hovered item is the only highlighted one', async ({ page }) => {
    await page.goto('/')
    await page.locator('sc-wallpaper').click({ button: 'right', position: { x: 200, y: 300 } })
    await page.locator(`${menu} [data-item-id="about"]`).hover()
    const highlighted = await page
      .locator(`${menu} [role="menuitem"]`)
      .evaluateAll((items) =>
        items.filter((item) => item.matches(':hover, :focus')).map((item) => (item as HTMLElement).dataset.itemId)
      )
    expect(highlighted).toEqual(['about'])
  })

  test('right-clicking a dock icon offers the app menu', async ({ page }) => {
    await page.goto('/')
    await page.locator('sc-dock button[data-app-id="resume"]').click({ button: 'right' })
    await expect(page.locator(`${menu} [data-item-id="quit"]`)).toHaveAttribute('aria-disabled', 'true')
  })

  test('the browser default context menu action is prevented on a menu-owning surface', async ({ page }) => {
    await trackNativeContextMenu(page)
    await page.goto('/')
    await page.locator('sc-wallpaper').click({ button: 'right', position: { x: 200, y: 300 } })
    await expect.poll(() => page.evaluate(() => window.__contextMenuDefaultPrevented)).toBe(true)
  })

  test('the browser default context menu action is prevented everywhere on the desktop', async ({ page }) => {
    await trackNativeContextMenu(page)
    await page.goto('/')
    await page.locator('sc-top-bar').click({ button: 'right', position: { x: 5, y: 10 } })
    await expect.poll(() => page.evaluate(() => window.__contextMenuDefaultPrevented)).toBe(true)
  })
})

test.describe('touch context menus', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile-only scenarios')

  test('long-pressing the desktop opens the desktop menu', async ({ page }) => {
    await page.goto('/')
    const wallpaper = page.locator('sc-wallpaper')
    const box = await wallpaper.boundingBox()
    if (!box) {
      throw new Error('wallpaper has no layout box')
    }
    await page.dispatchEvent('sc-wallpaper', 'pointerdown', {
      pointerType: 'touch',
      clientX: box.x + 20,
      clientY: box.y + 20,
      bubbles: true
    })
    await expect(page.locator(menu)).toBeVisible({ timeout: 2000 })
  })
})
