import type { Locator, Page } from '@playwright/test'

export const openTerminalWindow = async (page: Page): Promise<Locator> => {
  await page.goto('/')
  await page.getByTitle('Terminal').click()
  return page.locator('sc-window')
}

export const titleBarOf = (window: Locator): Locator => window.locator('header')

export const desktopMenu = (page: Page): Locator => page.getByRole('menu')

export const openDesktopMenu = async (page: Page): Promise<Locator> => {
  await page.locator('sc-wallpaper').click({ button: 'right', position: { x: 200, y: 300 } })
  return desktopMenu(page)
}
