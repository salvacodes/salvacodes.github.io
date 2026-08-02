import styles from './context-menu-layer.css?inline'
import { isSeparator, type MenuAction, type MenuEntry, placeMenu } from './context-menu-model'
import type { ContextMenuDetail } from './context-menu-request'

const sheet = new CSSStyleSheet()
sheet.replaceSync(styles)

export class ContextMenuLayer extends HTMLElement {
  #menu!: HTMLElement
  #returnFocusTo: HTMLElement | null = null
  #outsidePointerListener = (event: Event): void => {
    if (event.composedPath().includes(this.#menu)) {
      return
    }
    this.close()
  }
  #dismissListener = (): void => this.close()

  connectedCallback(): void {
    if (this.shadowRoot) {
      return
    }
    const root = this.attachShadow({ mode: 'open' })
    root.adoptedStyleSheets = [sheet]
    this.#menu = document.createElement('div')
    this.#menu.setAttribute('role', 'menu')
    this.#menu.hidden = true
    this.#menu.addEventListener('keydown', (event) => this.#onKeydown(event))
    this.#menu.addEventListener('pointermove', (event) => this.#focusItemUnderPointer(event))
    root.append(this.#menu)
  }

  disconnectedCallback(): void {
    this.close()
  }

  get isOpen(): boolean {
    return !this.#menu.hidden
  }

  open(detail: ContextMenuDetail, returnFocusTo: HTMLElement | null = null): void {
    this.#stopListening()
    this.#returnFocusTo = returnFocusTo
    this.#menu.replaceChildren(...detail.entries.map((entry) => this.#renderEntry(entry)))
    this.#menu.hidden = false
    const { width, height } = this.#menu.getBoundingClientRect()
    const position = placeMenu(
      detail.anchor,
      { width, height },
      { width: window.innerWidth, height: window.innerHeight }
    )
    this.#menu.style.left = `${position.x}px`
    this.#menu.style.top = `${position.y}px`
    this.#items()[0]?.focus()
    window.addEventListener('pointerdown', this.#outsidePointerListener, true)
    window.addEventListener('resize', this.#dismissListener)
    window.addEventListener('blur', this.#dismissListener)
  }

  close(): void {
    if (!this.isOpen) {
      return
    }
    this.#menu.hidden = true
    this.#menu.replaceChildren()
    this.#stopListening()
    this.#returnFocusTo?.focus()
    this.#returnFocusTo = null
  }

  #stopListening(): void {
    window.removeEventListener('pointerdown', this.#outsidePointerListener, true)
    window.removeEventListener('resize', this.#dismissListener)
    window.removeEventListener('blur', this.#dismissListener)
  }

  #onKeydown(event: KeyboardEvent): void {
    const navigation: Record<string, (index: number, count: number) => number> = {
      ArrowDown: (index) => index + 1,
      ArrowUp: (index) => index - 1,
      Home: () => 0,
      End: (_index, count) => count - 1
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      this.close()
      return
    }
    const move = navigation[event.key]
    if (!move) {
      return
    }
    event.preventDefault()
    const items = this.#items()
    const currentIndex = items.indexOf(this.shadowRoot?.activeElement as HTMLElement)
    this.#focusAt(move(currentIndex, items.length), items)
  }

  #focusItemUnderPointer(event: PointerEvent): void {
    const target = event.target
    if (!(target instanceof HTMLElement)) {
      return
    }
    target.closest<HTMLElement>('[role="menuitem"]')?.focus()
  }

  #focusAt(index: number, items: HTMLElement[]): void {
    if (items.length === 0) {
      return
    }
    items[(index + items.length) % items.length]?.focus()
  }

  #items(): HTMLElement[] {
    return [...this.#menu.querySelectorAll<HTMLElement>('[role="menuitem"]')]
  }

  #renderEntry(entry: MenuEntry): HTMLElement {
    if (isSeparator(entry)) {
      const separator = document.createElement('div')
      separator.className = 'separator'
      separator.setAttribute('role', 'separator')
      return separator
    }
    return this.#renderAction(entry)
  }

  #renderAction(action: MenuAction): HTMLElement {
    const item = document.createElement('button')
    item.type = 'button'
    item.className = 'item'
    item.dataset.itemId = action.id
    item.setAttribute('role', 'menuitem')
    item.tabIndex = -1
    item.textContent = action.label
    if (action.disabled) {
      item.setAttribute('aria-disabled', 'true')
    }
    item.addEventListener('click', () => {
      if (action.disabled) {
        return
      }
      this.close()
      action.perform?.()
    })
    return item
  }
}

customElements.define('sc-context-menu', ContextMenuLayer)
