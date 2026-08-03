import { postSummaries } from 'virtual:writing-index'
import { readSelection, standardContentItems } from '../../desktop/context-menu/content-items'
import type { MenuEntry, Point } from '../../desktop/context-menu/context-menu-model'
import { requestContextMenu } from '../../desktop/context-menu/context-menu-request'
import { observeLongPress } from '../../desktop/context-menu/long-press'
import { APP_ACTIVATE_EVENT, type AppActivateDetail } from '../app-activation'
import { homeDirectory } from './home-directory'
import styles from './terminal-app.css?inline'
import { TerminalShell } from './terminal-shell'

const sheet = new CSSStyleSheet()
sheet.replaceSync(styles)

const requiredElement = <T extends Element>(root: ParentNode, selector: string): T => {
  const element = root.querySelector<T>(selector)
  if (!element) {
    throw new Error(`Terminal markup is missing "${selector}"`)
  }
  return element
}

const PROMPT = 'user@salva.codes:~$'
const BOOT_COMMANDS = ['whoami', 'cat /etc/motd']

export class TerminalApp extends HTMLElement {
  #shell = new TerminalShell(
    homeDirectory,
    postSummaries.map((summary) => summary.slug)
  )
  #scrollback!: HTMLElement
  #input!: HTMLInputElement
  #history: string[] = []
  #historyIndex = 0

  connectedCallback(): void {
    if (this.shadowRoot) {
      return
    }
    const root = this.attachShadow({ mode: 'open' })
    root.adoptedStyleSheets = [sheet]
    root.innerHTML = `
      <div class="terminal">
        <div id="scrollback"></div>
        <div id="input-line">
          <span class="prompt">${PROMPT}</span>
          <input id="command-input" autocomplete="off" spellcheck="false" aria-label="Terminal input" />
        </div>
      </div>
    `
    this.#scrollback = requiredElement(root, '#scrollback')
    this.#input = requiredElement(root, '#command-input')
    this.addEventListener('click', () => this.#input.focus())
    this.#input.addEventListener('keydown', (event) => this.#onKeydown(event))
    for (const bootCommand of BOOT_COMMANDS) {
      this.#execute(bootCommand)
    }
    this.#input.focus()
    this.addEventListener('contextmenu', (event) => {
      event.preventDefault()
      this.#requestMenu({ x: event.clientX, y: event.clientY }, event.composedPath()[0] as Element | null)
    })
    observeLongPress(this, (point) => this.#requestMenu(point, null))
  }

  #onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.#recordHistory(this.#input.value)
      this.#execute(this.#input.value)
      this.#input.value = ''
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      this.#recallHistory(this.#historyIndex - 1)
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      this.#recallHistory(this.#historyIndex + 1)
    }
  }

  #recordHistory(line: string): void {
    if (line.trim()) {
      this.#history.push(line)
    }
    this.#historyIndex = this.#history.length
  }

  #recallHistory(index: number): void {
    this.#historyIndex = Math.min(Math.max(index, 0), this.#history.length)
    this.#input.value = this.#history[this.#historyIndex] ?? ''
  }

  #execute(line: string): void {
    this.#echoCommand(line)
    const result = this.#shell.run(line)
    if (result.clearScreen) {
      this.#scrollback.replaceChildren()
      return
    }
    for (const outputLine of result.lines) {
      this.#appendOutput(outputLine)
    }
    if (result.openAppId) {
      this.dispatchEvent(
        new CustomEvent<AppActivateDetail>(APP_ACTIVATE_EVENT, {
          bubbles: true,
          composed: true,
          detail: { appId: result.openAppId, params: result.openParams }
        })
      )
    }
    this.scrollTop = this.scrollHeight
  }

  #echoCommand(line: string): void {
    const echoed = document.createElement('div')
    const prompt = document.createElement('span')
    prompt.className = 'prompt'
    prompt.textContent = PROMPT
    echoed.append(prompt, ` ${line}`)
    this.#scrollback.append(echoed)
  }

  #appendOutput(text: string): void {
    const outputLine = document.createElement('div')
    outputLine.className = 'output'
    outputLine.textContent = text
    this.#scrollback.append(outputLine)
  }

  #requestMenu(anchor: Point, target: Element | null): void {
    const root = this.shadowRoot
    if (!root) {
      return
    }
    const entries: MenuEntry[] = [
      ...standardContentItems(target, readSelection(root)),
      { separator: true },
      { id: 'select-all', label: 'Select All', perform: () => this.#selectScrollback() },
      { id: 'clear', label: 'Clear', perform: () => this.#scrollback.replaceChildren() }
    ]
    requestContextMenu(this, { anchor, entries })
  }

  #selectScrollback(): void {
    const range = document.createRange()
    range.selectNodeContents(this.#scrollback)
    const selection = document.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
  }
}

customElements.define('sc-terminal-app', TerminalApp)
