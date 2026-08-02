import { expect, it } from 'vitest'
import './tokens.css'

const expectRootTokensDefined = (tokenNames: string[]) => {
  const rootStyle = getComputedStyle(document.documentElement)
  for (const tokenName of tokenNames) {
    expect(rootStyle.getPropertyValue(tokenName).trim(), `${tokenName} should be defined`).not.toBe('')
  }
}

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
