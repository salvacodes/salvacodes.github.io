import { expect, it } from 'vitest'
import '../../theme/tokens.css'
import './terminal-app'

const mountTerminal = () => {
  const app = document.createElement('sc-terminal-app')
  document.body.append(app)
  return app
}

const inputOf = (app: HTMLElement): HTMLInputElement =>
  app.shadowRoot!.querySelector<HTMLInputElement>('#command-input')!

const run = (app: HTMLElement, line: string) => {
  const input = inputOf(app)
  input.value = line
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
}

const cleanup = () => {
  for (const app of document.querySelectorAll('sc-terminal-app')) {
    app.remove()
  }
}

const press = (app: HTMLElement, key: string) =>
  inputOf(app).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))

const resolveRootColorToken = (tokenName: string): string => {
  expect(getComputedStyle(document.documentElement).getPropertyValue(tokenName).trim()).not.toBe('')
  const probe = document.createElement('div')
  probe.style.color = `var(${tokenName})`
  document.body.append(probe)
  const resolvedColor = getComputedStyle(probe).color
  probe.remove()
  return resolvedColor
}

it('boots with the motd scrollback and a live prompt', () => {
  const app = mountTerminal()
  const shadowText = app.shadowRoot?.textContent ?? ''
  expect(shadowText).toContain('user@salva.codes:~$')
  expect(shadowText).toContain('Salva — cyber security engineering lead')
  expect(shadowText).toContain('zero-dependency desktop')
  expect(inputOf(app)).not.toBeNull()
  cleanup()
})

it('executes a typed command and appends its output', () => {
  const app = mountTerminal()
  run(app, 'echo hello desktop')
  const shadowText = app.shadowRoot?.textContent ?? ''
  expect(shadowText).toContain('user@salva.codes:~$ echo hello desktop')
  expect(shadowText).toContain('hello desktop')
  expect(inputOf(app).value).toBe('')
  cleanup()
})

it('renders unknown commands as bash errors', () => {
  const app = mountTerminal()
  run(app, 'hack the-planet')
  expect(app.shadowRoot?.textContent).toContain('bash: hack: command not found')
  cleanup()
})

it('renders user input as text, never as markup', () => {
  const app = mountTerminal()
  run(app, 'echo <img src=x onerror=alert(1)>')
  expect(app.shadowRoot?.querySelector('img')).toBeNull()
  cleanup()
})

it('clear wipes the scrollback', () => {
  const app = mountTerminal()
  run(app, 'clear')
  expect(app.shadowRoot!.querySelector('#scrollback')!.childElementCount).toBe(0)
  cleanup()
})

it('clicking the terminal focuses the input', () => {
  const app = mountTerminal()
  inputOf(app).blur()
  app.dispatchEvent(new PointerEvent('click', { bubbles: true }))
  expect(app.shadowRoot?.activeElement).toBe(inputOf(app))
  cleanup()
})

it('renders consecutive lines without blank gaps, like a real terminal', () => {
  const app = mountTerminal()
  const lines = app.shadowRoot!.querySelectorAll('#scrollback > div')
  const firstLine = lines[0]!.getBoundingClientRect()
  const secondLine = lines[1]!.getBoundingClientRect()
  expect(secondLine.top - firstLine.top).toBeLessThan(firstLine.height * 1.5)
  cleanup()
})

it('renders the prompt with the terminal green token', () => {
  const app = mountTerminal()
  const prompt = app.shadowRoot!.querySelector('.prompt')!
  expect(getComputedStyle(prompt).color).toBe(resolveRootColorToken('--color-terminal-green'))
  cleanup()
})

it('arrow-up recalls previous commands, newest first', () => {
  const app = mountTerminal()
  run(app, 'whoami')
  run(app, 'echo two')
  press(app, 'ArrowUp')
  expect(inputOf(app).value).toBe('echo two')
  press(app, 'ArrowUp')
  expect(inputOf(app).value).toBe('whoami')
  cleanup()
})

it('arrow-down walks back toward a fresh prompt', () => {
  const app = mountTerminal()
  run(app, 'whoami')
  run(app, 'echo two')
  press(app, 'ArrowUp')
  press(app, 'ArrowUp')
  press(app, 'ArrowDown')
  expect(inputOf(app).value).toBe('echo two')
  press(app, 'ArrowDown')
  expect(inputOf(app).value).toBe('')
  cleanup()
})

it('blank lines are not recorded in history', () => {
  const app = mountTerminal()
  run(app, 'whoami')
  run(app, '   ')
  press(app, 'ArrowUp')
  expect(inputOf(app).value).toBe('whoami')
  cleanup()
})
