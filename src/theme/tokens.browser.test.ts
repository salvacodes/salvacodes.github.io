import { afterEach, expect, it } from 'vitest'
import './tokens.css'

const expectRootTokensDefined = (tokenNames: string[]) => {
  const rootStyle = getComputedStyle(document.documentElement)
  for (const tokenName of tokenNames) {
    expect(rootStyle.getPropertyValue(tokenName).trim(), `${tokenName} should be defined`).not.toBe('')
  }
}

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

it('exposes the kali gnome design tokens on the document root', () => {
  expectRootTokensDefined([
    '--color-bg',
    '--color-surface',
    '--color-surface-raised',
    '--color-accent',
    '--color-accent-soft',
    '--color-text',
    '--color-text-dim',
    '--color-border',
    '--font-ui',
    '--font-mono',
    '--top-bar-height',
    '--title-bar-height'
  ])
})

it('exposes the matrix terminal design tokens on the document root', () => {
  expectRootTokensDefined([
    '--color-terminal-bg',
    '--color-terminal-green',
    '--color-terminal-text',
    '--color-terminal-dim'
  ])
})

it('exposes the wallpaper design tokens on the document root', () => {
  expectRootTokensDefined([
    '--wallpaper-glow-a',
    '--wallpaper-glow-b',
    '--wallpaper-gradient-from',
    '--wallpaper-gradient-to'
  ])
})

it.each(['dark', 'light'])('keeps text readable against the background in the %s style', (style) => {
  document.documentElement.dataset.style = style
  expect(contrast(resolvedToken('--color-text'), resolvedToken('--color-bg'))).toBeGreaterThanOrEqual(4.5)
  expect(contrast(resolvedToken('--color-text-dim'), resolvedToken('--color-bg'))).toBeGreaterThanOrEqual(4.5)
  expect(contrast(resolvedToken('--color-accent'), resolvedToken('--color-bg'))).toBeGreaterThanOrEqual(4.5)
})

it('exposes a destructive accent for the power off action', () => {
  expectRootTokensDefined(['--color-destructive'])
})

it('gives the two styles genuinely different backgrounds', () => {
  document.documentElement.dataset.style = 'dark'
  const dark = resolvedToken('--color-bg')
  document.documentElement.dataset.style = 'light'
  expect(resolvedToken('--color-bg')).not.toBe(dark)
})

it('keeps the terminal palette out of the light style', () => {
  document.documentElement.dataset.style = 'dark'
  const darkTerminal = resolvedToken('--color-terminal-bg')
  document.documentElement.dataset.style = 'light'
  expect(resolvedToken('--color-terminal-bg')).toBe(darkTerminal)
})
