import { expect, test } from '@playwright/test'

test('compact viewports get maximized immovable windows', async ({ page }) => {
  await page.goto('/')
  await page.getByTitle('Terminal').click()
  const window = page.locator('sc-window')

  await expect(window).toHaveAttribute('compact', '')
  await expect(window).toHaveAttribute('maximized', '')
  await expect(window.getByRole('button', { name: 'Minimize' })).toBeHidden()
  await expect(window.getByRole('button', { name: 'Maximize' })).toBeHidden()
})
