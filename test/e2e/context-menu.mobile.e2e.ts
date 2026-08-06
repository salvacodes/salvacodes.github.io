import { expect, test } from '@playwright/test'

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

  await expect(page.getByRole('menu')).toBeVisible()
})
