import { afterEach, expect, it } from 'vitest'
import './tokens.css'

const resolvedToken = (token: string): string => {
  const probe = document.createElement('span')
  probe.style.color = `var(${token})`
  document.body.append(probe)
  const value = getComputedStyle(probe).color
  probe.remove()
  return value
}

const channel = (value: number): number => {
  const srgb = value / 255
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
}

const luminance = (color: string): number => {
  const [red = 0, green = 0, blue = 0] = (color.match(/\d+/g) ?? []).map(Number)
  return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue)
}

const contrast = (foreground: string, background: string): number => {
  const [high = 0, low = 0] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (high + 0.05) / (low + 0.05)
}

afterEach(() => {
  delete document.documentElement.dataset.style
})

it.each(['dark', 'light'])('keeps text readable against the background in the %s style', (style) => {
  document.documentElement.dataset.style = style
  expect(contrast(resolvedToken('--color-text'), resolvedToken('--color-bg'))).toBeGreaterThanOrEqual(4.5)
  expect(contrast(resolvedToken('--color-text-dim'), resolvedToken('--color-bg'))).toBeGreaterThanOrEqual(4.5)
  expect(contrast(resolvedToken('--color-accent'), resolvedToken('--color-bg'))).toBeGreaterThanOrEqual(4.5)
})
