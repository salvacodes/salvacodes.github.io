import { expect, test } from '@playwright/test'

const openTerminal = async (page: import('@playwright/test').Page) => {
  await page.goto('/')
  await page.locator('sc-dock button[data-app-id="terminal"]').click()
  return page.locator('sc-window')
}

test('dragging the title bar moves the window', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop-only scenario')
  const window = await openTerminal(page)
  const before = (await window.boundingBox())!
  const titleBar = window.locator('#title-bar')
  await titleBar.hover()
  const start = (await titleBar.boundingBox())!
  await page.mouse.down()
  await page.mouse.move(start.x + start.width / 2 + 220, start.y + start.height / 2 + 140, {
    steps: 8
  })
  await page.mouse.up()
  const after = (await window.boundingBox())!
  expect(after.x).toBeGreaterThan(before.x + 100)
  expect(after.y).toBeGreaterThan(before.y + 60)
})

test('dragging the south-east handle resizes the window', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop-only scenario')
  const window = await openTerminal(page)
  const before = (await window.boundingBox())!
  await page.mouse.move(before.x + before.width - 2, before.y + before.height - 2)
  await page.mouse.down()
  await page.mouse.move(before.x + before.width + 120, before.y + before.height + 90, { steps: 8 })
  await page.mouse.up()
  const after = (await window.boundingBox())!
  expect(after.width).toBeGreaterThan(before.width + 100)
  expect(after.height).toBeGreaterThan(before.height + 70)
})

test('double-clicking the title bar maximizes and restores', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop-only scenario')
  const window = await openTerminal(page)
  const before = (await window.boundingBox())!
  await window.locator('#title-bar').dblclick()
  const viewport = page.viewportSize()!
  const maximized = (await window.boundingBox())!
  expect(maximized.width).toBe(viewport.width)
  await window.locator('#title-bar').dblclick()
  const restored = (await window.boundingBox())!
  expect(restored.width).toBe(before.width)
})

test('windows cannot be dragged above the top bar', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop-only scenario')
  const window = await openTerminal(page)
  const before = (await window.boundingBox())!
  await window.locator('#title-bar').hover()
  await page.mouse.down()
  await page.mouse.move(before.x, 0, { steps: 8 })
  await page.mouse.up()
  const after = (await window.boundingBox())!
  expect(after.y).toBeGreaterThanOrEqual(32)
})

test('compact viewports get maximized immovable windows', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile-only scenario')
  await page.goto('/')
  await page.locator('sc-dock button[data-app-id="terminal"]').click()
  const window = page.locator('sc-window')
  await expect(window).toHaveAttribute('compact', '')
  await expect(window).toHaveAttribute('maximized', '')
  await expect(window.locator('#minimize')).toBeHidden()
  await expect(window.locator('#maximize')).toBeHidden()
})
