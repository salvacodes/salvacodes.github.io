import { expect, test } from '@playwright/test'

const openPowerDialog = async (page: import('@playwright/test').Page): Promise<void> => {
  await page.goto('/')
  await page.locator('sc-top-bar #status').click()
  await page.locator('sc-quick-settings [data-action-id="power"]').click()
}

test('cancelling the shutdown leaves the desktop running', async ({ page }) => {
  await openPowerDialog(page)
  await expect(page.locator('sc-shutdown-dialog [role="alertdialog"]')).toBeVisible()
  await page.locator('sc-shutdown-dialog #cancel').click()
  await expect(page.locator('sc-shutdown-dialog [role="alertdialog"]')).toBeHidden()
  await expect(page.locator('sc-window')).toHaveCount(1)
})

test('powers off, boots back up and restores the terminal', async ({ page }) => {
  await openPowerDialog(page)
  await page.locator('sc-shutdown-dialog #confirm').click()
  await expect(page.locator('sc-window')).toHaveCount(0)
  const powerOn = page.locator('sc-session-screen #power-on')
  await expect(powerOn).toBeVisible()
  await powerOn.click()
  await page.locator('sc-session-screen #boot').click()
  await expect(page.locator('sc-session-screen')).toBeHidden()
  await expect(page.locator('sc-window')).toHaveCount(1)
  await expect(page.locator('sc-window #title')).toHaveText('user@salva.codes: ~')
})

test('the desktop behind the powered off screen cannot be reached', async ({ page }) => {
  await openPowerDialog(page)
  await page.locator('sc-shutdown-dialog #confirm').click()
  await expect(page.locator('sc-session-screen #power-on')).toBeVisible()
  await page.locator('sc-top-bar #activities').click({ force: true })
  await expect(page.locator('sc-overview')).toBeHidden()
  await page.locator('sc-top-bar #status').click({ force: true })
  await expect(page.locator('sc-quick-settings .panel')).toBeHidden()
  await expect(page.locator('sc-top-bar #status')).toHaveAttribute('aria-expanded', 'false')
})

test('a reload after powering off returns a working desktop', async ({ page }) => {
  await openPowerDialog(page)
  await page.locator('sc-shutdown-dialog #confirm').click()
  await expect(page.locator('sc-session-screen #power-on')).toBeVisible()
  await page.reload()
  await expect(page.locator('sc-session-screen')).toBeHidden()
  await expect(page.locator('sc-window')).toHaveCount(1)
})
