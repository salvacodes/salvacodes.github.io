import { expect, test } from '@playwright/test'
import { openTerminalWindow, titleBarOf } from './desktop-page'

test('dragging the title bar moves the window', async ({ page }) => {
  const window = await openTerminalWindow(page)
  const before = (await window.boundingBox())!
  const titleBar = titleBarOf(window)

  await titleBar.hover()
  const start = (await titleBar.boundingBox())!
  await page.mouse.down()
  await page.mouse.move(start.x + start.width / 2 + 220, start.y + start.height / 2 + 140, { steps: 8 })
  await page.mouse.up()

  const after = (await window.boundingBox())!
  expect(after.x).toBeGreaterThan(before.x + 100)
  expect(after.y).toBeGreaterThan(before.y + 60)
})

test('double-clicking the title bar maximizes and restores', async ({ page }) => {
  const window = await openTerminalWindow(page)
  const before = (await window.boundingBox())!

  await titleBarOf(window).dblclick()
  expect((await window.boundingBox())!.width).toBe(page.viewportSize()!.width)

  await titleBarOf(window).dblclick()
  expect((await window.boundingBox())!.width).toBe(before.width)
})

test('windows cannot be dragged above the top bar', async ({ page }) => {
  const window = await openTerminalWindow(page)
  const before = (await window.boundingBox())!
  const topBarHeight = (await page.locator('sc-top-bar').boundingBox())!.height

  await titleBarOf(window).hover()
  await page.mouse.down()
  await page.mouse.move(before.x, 0, { steps: 8 })
  await page.mouse.up()

  expect((await window.boundingBox())!.y).toBeGreaterThanOrEqual(topBarHeight)
})
