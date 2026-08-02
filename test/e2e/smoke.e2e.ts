import { expect, test } from '@playwright/test'

test('the desktop boots without errors', async ({ page }) => {
  const pageErrors: Error[] = []
  page.on('pageerror', (error) => pageErrors.push(error))
  await page.goto('/')
  await expect(page).toHaveTitle('salva.codes')
  await expect(page.locator('sc-top-bar')).toBeVisible()
  await expect(page.locator('sc-window').first()).toBeVisible()
  expect(pageErrors).toEqual([])
})
