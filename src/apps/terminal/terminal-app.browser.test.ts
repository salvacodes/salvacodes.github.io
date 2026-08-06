import { expect, it } from 'vitest'
import '../../theme/tokens.css'
import { CONTEXT_MENU_EVENT, type ContextMenuDetail } from '../../desktop/context-menu/context-menu-request'
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

it('dispatches an app-activate request when a command opens an app', () => {
  const app = mountTerminal()
  const events: CustomEvent[] = []
  document.addEventListener('app-activate', (event) => events.push(event as CustomEvent), { once: true })
  run(app, 'resume')
  expect(events).toHaveLength(1)
  expect(events[0]?.detail.appId).toBe('resume')
  cleanup()
})

it('offers the shared content actions plus the terminal ones', () => {
  const app = mountTerminal()
  let detail: ContextMenuDetail | undefined
  document.addEventListener(
    CONTEXT_MENU_EVENT,
    (event) => {
      detail = (event as CustomEvent<ContextMenuDetail>).detail
    },
    { once: true }
  )
  app.dispatchEvent(
    new MouseEvent('contextmenu', { bubbles: true, composed: true, cancelable: true, clientX: 12, clientY: 34 })
  )
  expect(detail?.anchor).toEqual({ x: 12, y: 34 })
  expect(detail?.entries.map((entry) => ('label' in entry ? entry.label : '---'))).toEqual([
    'Copy',
    'Paste',
    '---',
    'Select All',
    'Clear'
  ])
  cleanup()
})

it('clears the scrollback from the menu', () => {
  const app = mountTerminal()
  let detail: ContextMenuDetail | undefined
  document.addEventListener(
    CONTEXT_MENU_EVENT,
    (event) => {
      detail = (event as CustomEvent<ContextMenuDetail>).detail
    },
    { once: true }
  )
  app.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, composed: true, cancelable: true }))
  const clear = detail?.entries.find((entry) => 'id' in entry && entry.id === 'clear')
  expect(app.shadowRoot?.querySelector('#scrollback')?.childElementCount).toBeGreaterThan(0)
  if (clear && 'perform' in clear) {
    clear.perform?.()
  }
  expect(app.shadowRoot?.querySelector('#scrollback')?.childElementCount).toBe(0)
  cleanup()
})

it('detects a link right-clicked inside the shadow scrollback', () => {
  const app = mountTerminal()
  const anchor = document.createElement('a')
  anchor.href = 'https://example.test/repo'
  app.shadowRoot?.querySelector('#scrollback')?.append(anchor)
  let detail: ContextMenuDetail | undefined
  document.addEventListener(
    CONTEXT_MENU_EVENT,
    (event) => {
      detail = (event as CustomEvent<ContextMenuDetail>).detail
    },
    { once: true }
  )
  anchor.dispatchEvent(
    new MouseEvent('contextmenu', { bubbles: true, composed: true, cancelable: true, clientX: 5, clientY: 6 })
  )
  expect(detail?.entries.filter((entry) => 'id' in entry).map((entry) => ('id' in entry ? entry.id : ''))).toEqual(
    expect.arrayContaining(['open-link', 'copy-link'])
  )
  cleanup()
})
