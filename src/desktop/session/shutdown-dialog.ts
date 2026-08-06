import styles from './shutdown-dialog.css?inline'

export const SHUTDOWN_CONFIRMED_EVENT = 'shutdown-confirmed'
export const SHUTDOWN_CANCELLED_EVENT = 'shutdown-cancelled'
export const SHUTDOWN_COUNTDOWN_SECONDS = 60

const sheet = new CSSStyleSheet()
sheet.replaceSync(styles)

export class ShutdownDialog extends HTMLElement {
  #remaining = SHUTDOWN_COUNTDOWN_SECONDS
  #timer?: ReturnType<typeof setInterval>

  connectedCallback(): void {
    if (this.shadowRoot) {
      return
    }
    const root = this.attachShadow({ mode: 'open' })
    root.adoptedStyleSheets = [sheet]
    root.innerHTML = `
      <div class="scrim"></div>
      <div class="dialog" role="alertdialog" aria-modal="true" aria-label="Power Off" aria-describedby="countdown">
        <h2>Power Off</h2>
        <p id="countdown"></p>
        <div class="buttons">
          <button type="button" id="cancel">Cancel</button>
          <button type="button" id="confirm">Power Off</button>
        </div>
      </div>
    `
    root.querySelector('#cancel')?.addEventListener('click', () => this.#finish(SHUTDOWN_CANCELLED_EVENT))
    root.querySelector('#confirm')?.addEventListener('click', () => this.#finish(SHUTDOWN_CONFIRMED_EVENT))
    root.querySelector('.dialog')?.addEventListener('keydown', (event) => this.#onKeydown(event as KeyboardEvent))
  }

  disconnectedCallback(): void {
    this.#stopCountdown()
  }

  get isOpen(): boolean {
    return this.hasAttribute('open')
  }

  open(): void {
    if (this.isOpen) {
      return
    }
    this.#remaining = SHUTDOWN_COUNTDOWN_SECONDS
    this.#renderCountdown()
    this.toggleAttribute('open', true)
    this.#timer = setInterval(() => this.#tick(), 1000)
    this.shadowRoot?.querySelector<HTMLButtonElement>('#cancel')?.focus()
  }

  close(): void {
    this.toggleAttribute('open', false)
    this.#stopCountdown()
  }

  #tick(): void {
    this.#remaining -= 1
    if (this.#remaining <= 0) {
      this.#finish(SHUTDOWN_CONFIRMED_EVENT)
      return
    }
    this.#renderCountdown()
  }

  #renderCountdown(): void {
    const countdown = this.shadowRoot?.querySelector('#countdown')
    if (countdown) {
      countdown.textContent = `The system will power off automatically in ${this.#remaining} seconds.`
    }
  }

  #stopCountdown(): void {
    clearInterval(this.#timer)
    this.#timer = undefined
  }

  #finish(eventName: string): void {
    this.close()
    this.dispatchEvent(new CustomEvent(eventName, { bubbles: true, composed: true }))
  }

  #onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      this.#finish(SHUTDOWN_CANCELLED_EVENT)
      return
    }
    if (event.key !== 'Tab') {
      return
    }
    event.preventDefault()
    const buttons = [...(this.shadowRoot?.querySelectorAll<HTMLButtonElement>('button') ?? [])]
    const current = buttons.indexOf(this.shadowRoot?.activeElement as HTMLButtonElement)
    const step = event.shiftKey ? -1 : 1
    buttons[(current + step + buttons.length) % buttons.length]?.focus()
  }
}

customElements.define('sc-shutdown-dialog', ShutdownDialog)
