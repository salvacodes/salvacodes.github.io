import styles from './top-bar.css?inline'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const CLOCK_REFRESH_MS = 30_000

let sheet: CSSStyleSheet

const getSheet = (): CSSStyleSheet => {
  if (!sheet) {
    sheet = new CSSStyleSheet()
    sheet.replaceSync(styles)
  }
  return sheet
}

export const formatClock = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${MONTHS[date.getMonth()]} ${date.getDate()} ${hours}:${minutes}`
}

export const SYSTEM_MENU_TOGGLE_EVENT = 'system-menu-toggle'

const STATUS_ICONS = [
  '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><rect x="2" y="4" width="12" height="5" rx="1" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M8 9v3M5 12h6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 6h2.5L9.5 3v10L6.5 10H4z" fill="currentColor"/><path d="M11.5 6.2a2.6 2.6 0 0 1 0 3.6" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><rect x="1.5" y="5" width="11" height="6" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.3"/><rect x="3" y="6.5" width="8" height="3" rx="0.6" fill="currentColor"/><path d="M14 7v2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>'
].join('')

const BaseClass = (typeof HTMLElement !== 'undefined' ? HTMLElement : Object) as typeof HTMLElement

export class TopBar extends BaseClass {
  #clockTimer?: ReturnType<typeof setInterval>

  connectedCallback(): void {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: 'open' })
      root.adoptedStyleSheets = [getSheet()]
      root.innerHTML = `
        <button id="activities">Activities</button>
        <time id="clock"></time>
        <button id="status" aria-haspopup="dialog" aria-expanded="false" aria-label="System menu">${STATUS_ICONS}</button>
      `
      root.querySelector('#activities')?.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('activities-toggle', { bubbles: true, composed: true }))
      })
      root.querySelector('#status')?.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent(SYSTEM_MENU_TOGGLE_EVENT, { bubbles: true, composed: true }))
      })
    }
    this.#updateClock()
    this.#clockTimer = setInterval(() => this.#updateClock(), CLOCK_REFRESH_MS)
  }

  disconnectedCallback(): void {
    clearInterval(this.#clockTimer)
  }

  get statusButton(): HTMLButtonElement {
    const button = this.shadowRoot?.querySelector<HTMLButtonElement>('#status')
    if (!button) {
      throw new Error('top bar has no status button')
    }
    return button
  }

  set systemMenuExpanded(value: boolean) {
    this.statusButton.setAttribute('aria-expanded', String(value))
  }

  #updateClock(): void {
    const clock = this.shadowRoot?.querySelector('#clock')
    if (clock) {
      clock.textContent = formatClock(new Date())
    }
  }
}

if (typeof customElements !== 'undefined') {
  customElements.define('sc-top-bar', TopBar)
}
