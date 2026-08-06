import { expect, type Page, test } from '@playwright/test'

const windowTitled = (page: Page, title: string) =>
  page.locator('sc-window').filter({ has: page.getByRole('heading', { name: title, exact: true }) })

test('launches from the activities overview', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Activities' }).click()
  await page.locator('sc-overview').getByRole('button', { name: 'Writings' }).click()

  await expect(windowTitled(page, 'Writings')).toBeVisible()
  await expect(page.locator('sc-overview')).not.toHaveAttribute('open', '')
})

test('minimize hides the window and the dock restores it', async ({ page }) => {
  await page.goto('/')
  const window = page.locator('sc-window')

  await window.getByRole('button', { name: 'Minimize' }).click()
  await expect(window).toBeHidden()

  await page.getByTitle('Terminal').click()
  await expect(window).toBeVisible()
})

test('clicking a background window raises it', async ({ page }) => {
  await page.goto('/')
  await page.getByTitle('Writings').click()
  await page.getByTitle('Terminal').click()

  const zIndexOf = async (title: string) =>
    Number(await windowTitled(page, title).evaluate((element) => element.style.zIndex))

  expect(await zIndexOf('user@salva.codes: ~')).toBeGreaterThan(await zIndexOf('Writings'))

  await windowTitled(page, 'Writings').click({ position: { x: 20, y: 20 } })

  expect(await zIndexOf('Writings')).toBeGreaterThan(await zIndexOf('user@salva.codes: ~'))
})
