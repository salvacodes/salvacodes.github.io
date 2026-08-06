import { expect, test } from '@playwright/test'
import { openTerminalWindow } from './desktop-page'

test('dragging the south-east handle resizes the window', async ({ page }) => {
  const window = await openTerminalWindow(page)
  const before = (await window.boundingBox())!

  await page.mouse.move(before.x + before.width - 2, before.y + before.height - 2)
  await page.mouse.down()
  await page.mouse.move(before.x + before.width + 120, before.y + before.height + 90, { steps: 8 })
  await page.mouse.up()

  const after = (await window.boundingBox())!
  expect(after.width).toBeGreaterThan(before.width + 100)
  expect(after.height).toBeGreaterThan(before.height + 70)
})
