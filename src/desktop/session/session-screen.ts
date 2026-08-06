import styles from './session-screen.css?inline'
import type { SessionPhase } from './session-state'

export const SHUTDOWN_FADE_COMPLETE_EVENT = 'shutdown-fade-complete'
export const POWER_ON_REQUESTED_EVENT = 'power-on-requested'
export const BOOT_COMPLETE_EVENT = 'boot-complete'

export const BOOT_LINES: readonly string[] = [
  '[  OK  ] Started Kali Linux Desktop',
  '[  OK  ] Mounted /home/user',
  '[  OK  ] Reached target Graphical Interface'
]

const FADE_MS = 600
const BOOT_LINE_MS = 450
const BOOT_TAIL_MS = 400

const POWER_GLYPH =
  '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M12 3v9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M7 6.5a7 7 0 1 0 10 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'

const sheet = new CSSStyleSheet()
sheet.replaceSync(styles)

export class SessionScreen extends HTMLElement {
  #timers: Array<ReturnType<typeof setTimeout>> = []
  #boot!: HTMLElement

  connectedCallback(): void {
    if (this.shadowRoot) {
      return
    }
    const root = this.attachShadow({ mode: 'open' })
    root.adoptedStyleSheets = [sheet]
    root.innerHTML = `
      <div class="spinner"></div>
      <button type="button" id="power-on" aria-label="Power on">${POWER_GLYPH}</button>
      <pre id="boot"></pre>
    `
    root.querySelector('#power-on')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent(POWER_ON_REQUESTED_EVENT, { bubbles: true, composed: true }))
    })
    this.#boot = root.querySelector('#boot') as HTMLElement
    this.#boot.addEventListener('click', () => this.#finishBoot())
  }

  disconnectedCallback(): void {
    this.#clearTimers()
  }

  set phase(value: SessionPhase) {
    this.#clearTimers()
    this.dataset.phase = value
    if (value === 'shutting-down') {
      this.#after(FADE_MS, () => {
        this.dispatchEvent(new CustomEvent(SHUTDOWN_FADE_COMPLETE_EVENT, { bubbles: true, composed: true }))
      })
      return
    }
    if (value === 'booting') {
      this.#startBoot()
    }
  }

  #startBoot(): void {
    this.#boot.textContent = ''
    BOOT_LINES.forEach((line, index) => {
      this.#after(BOOT_LINE_MS * (index + 1), () => {
        this.#boot.textContent = `${this.#boot.textContent}${line}\n`
      })
    })
    this.#after(BOOT_LINE_MS * BOOT_LINES.length + BOOT_TAIL_MS, () => this.#finishBoot())
  }

  #finishBoot(): void {
    if (this.dataset.phase !== 'booting') {
      return
    }
    this.#clearTimers()
    this.dispatchEvent(new CustomEvent(BOOT_COMPLETE_EVENT, { bubbles: true, composed: true }))
  }

  #after(delay: number, action: () => void): void {
    this.#timers.push(setTimeout(action, delay))
  }

  #clearTimers(): void {
    for (const timer of this.#timers.splice(0)) {
      clearTimeout(timer)
    }
  }
}

customElements.define('sc-session-screen', SessionScreen)
