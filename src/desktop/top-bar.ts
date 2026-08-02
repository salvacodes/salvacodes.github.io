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
        <div id="status" aria-hidden="true"><span>▲</span><span>◆</span><span>⏻</span></div>
      `
      root.querySelector('#activities')?.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('activities-toggle', { bubbles: true, composed: true }))
      })
    }
    this.#updateClock()
    this.#clockTimer = setInterval(() => this.#updateClock(), CLOCK_REFRESH_MS)
  }

  disconnectedCallback(): void {
    clearInterval(this.#clockTimer)
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
