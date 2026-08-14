import { expect, test } from '@playwright/test'

const openResumeFromDock = async (page: import('@playwright/test').Page) => {
  await page.goto('/')
  await page.locator('sc-dock button[data-app-id="resume"]').click()
  return page.locator('sc-window', { has: page.locator('sc-resume-app') })
}

test('opens the resume from the dock and expands an occupation', async ({ page }) => {
  const resumeWindow = await openResumeFromDock(page)
  await expect(resumeWindow).toBeVisible()
  const firstOccupation = page.locator('sc-resume-app details.occupation').first()
  await expect(firstOccupation).toHaveJSProperty('open', false)
  await firstOccupation.locator('summary').click()
  await expect(firstOccupation).toHaveJSProperty('open', true)
})

test('the terminal resume command opens the app', async ({ page }) => {
  await page.goto('/')
  const input = page.locator('sc-terminal-app #command-input')
  await input.fill('resume')
  await input.press('Enter')
  await expect(page.locator('sc-resume-app')).toBeVisible()
})

test('case studies open as their own windows', async ({ page }) => {
  await openResumeFromDock(page)
  await page.locator('sc-resume-app .sidebar button[data-section-id="case-studies"]').click()
  await page.locator('sc-resume-app .case-study-opener').first().click()
  await expect(page.locator('sc-case-study-app')).toBeVisible()
  const studyWindow = page.locator('sc-window', { has: page.locator('sc-case-study-app') })
  await expect(studyWindow).toHaveCount(1)
  await expect(page.locator('sc-window')).toHaveCount(3)
})

test('printing hides the desktop and lays out the resume on paper', async ({ page }) => {
  await openResumeFromDock(page)
  await page.evaluate(() => {
    window.print = () => undefined
  })
  await page.locator('sc-resume-app .print-action').click()
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('#print-surface')).toBeVisible()
  await expect(page.locator('sc-desktop')).toBeHidden()
  await expect(page.locator('#print-surface .print-footer')).toContainText('salva.codes')
  await expect(page.locator('#print-surface .print-name')).toContainText('Salvador')
  await expect(page.locator('#print-surface .print-tenure')).not.toHaveCount(0)
  await page.emulateMedia({ media: 'screen' })
})
