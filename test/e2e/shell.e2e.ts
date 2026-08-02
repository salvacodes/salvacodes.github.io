import { expect, test } from '@playwright/test'

test.skip(({ isMobile }) => isMobile, 'desktop-only scenarios')

test('boots straight to the desktop with the terminal window open', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('sc-top-bar')).toBeVisible()
  await expect(page.locator('sc-dock')).toBeVisible()
  const window = page.locator('sc-window')
  await expect(window).toHaveCount(1)
  await expect(window.locator('#title')).toHaveText('user@salva.codes: ~')
})

test('launches the terminal from the dock', async ({ page }) => {
  await page.goto('/')
  await page.locator('sc-dock button[data-app-id="terminal"]').click()
  const window = page.locator('sc-window')
  await expect(window).toHaveCount(1)
  await expect(window.locator('#title')).toHaveText('user@salva.codes: ~')
  await expect(window.locator('sc-terminal-app')).toContainText('user@salva.codes')
})

test('launches from the activities overview', async ({ page }) => {
  await page.goto('/')
  await page.locator('sc-top-bar #activities').click()
  await page.locator('sc-overview button[data-app-id="readme"]').click()
  await expect(page.locator('sc-window', { has: page.locator('#title:text-is("Readme")') })).toBeVisible()
  await expect(page.locator('sc-overview')).not.toHaveAttribute('open', '')
})

test('minimize hides the window and the dock restores it', async ({ page }) => {
  await page.goto('/')
  await page.locator('sc-dock button[data-app-id="terminal"]').click()
  const window = page.locator('sc-window')
  await window.locator('#minimize').click()
  await expect(window).toBeHidden()
  await page.locator('sc-dock button[data-app-id="terminal"]').click()
  await expect(window).toBeVisible()
})

test('clicking a background window raises it', async ({ page }) => {
  await page.goto('/')
  await page.locator('sc-dock button[data-app-id="terminal"]').click()
  await page.locator('sc-dock button[data-app-id="readme"]').click()
  const zIndexOf = async (appTitle: string) =>
    Number(
      await page
        .locator('sc-window', { has: page.locator(`#title:text-is("${appTitle}")`) })
        .evaluate((element) => element.style.zIndex)
    )
  expect(await zIndexOf('Readme')).toBeGreaterThan(await zIndexOf('user@salva.codes: ~'))
  await page
    .locator('sc-window', { has: page.locator('#title:text-is("user@salva.codes: ~")') })
    .click({ position: { x: 200, y: 20 } })
  expect(await zIndexOf('user@salva.codes: ~')).toBeGreaterThan(await zIndexOf('Readme'))
})

test('the terminal executes typed commands', async ({ page }) => {
  await page.goto('/')
  const terminal = page.locator('sc-terminal-app')
  await terminal.click()
  await page.keyboard.type('ls')
  await page.keyboard.press('Enter')
  await expect(terminal).toContainText('about.txt  resume.txt')
  await page.keyboard.type('cat resume.txt')
  await page.keyboard.press('Enter')
  await expect(terminal).toContainText('Salva — Resume')
})
