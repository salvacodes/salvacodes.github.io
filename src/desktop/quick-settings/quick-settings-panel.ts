import { SETTINGS_ICON_MARKUP } from '../../apps/settings/settings-icon'
import { type DesktopPreferences, desktopPreferences } from '../../preferences/desktop-preferences'
import type { DesktopStyle } from '../../preferences/style-catalog'
import { createIconSvg } from '../icon-svg'
import { observePopoverDismissal } from '../popover/popover-dismissal'
import {
  BATTERY_LABEL,
  DARK_STYLE_TILE_ID,
  QUICK_SETTINGS_FOOTER,
  QUICK_SETTINGS_SLIDERS,
  QUICK_SETTINGS_TILES
} from './quick-settings-model'
import styles from './quick-settings-panel.css?inline'

export const QUICK_SETTINGS_ACTION_EVENT = 'quick-settings-action'
export const QUICK_SETTINGS_DISMISSED_EVENT = 'quick-settings-dismissed'

export interface QuickSettingsActionDetail {
  actionId: string
}

const sheet = new CSSStyleSheet()
sheet.replaceSync(styles)

const SLIDER_ICONS: Record<string, string> = {
  volume:
    '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 6h2.5L9.5 3v10L6.5 10H4z" fill="currentColor"/><path d="M11.5 6.2a2.6 2.6 0 0 1 0 3.6" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  brightness:
    '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><circle cx="8" cy="8" r="3" fill="currentColor"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M12.8 3.2l-1.4 1.4M4.6 11.4l-1.4 1.4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>'
}

const ACTION_ICONS: Record<string, string> = {
  settings: SETTINGS_ICON_MARKUP,
  lock: '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><rect x="3.5" y="7" width="9" height="6.5" rx="1.4" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M5.6 7V5.2a2.4 2.4 0 0 1 4.8 0V7" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
  power:
    '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><path d="M8 2v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M4.6 4.6a4.8 4.8 0 1 0 6.8 0" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
}

const CHEVRON = '<span class="chevron" aria-hidden="true">›</span>'

const STYLE_TILE_LABELS: Record<DesktopStyle, string> = { dark: 'Dark Style', light: 'Light Style' }

export class QuickSettingsPanel extends HTMLElement {
  preferences: DesktopPreferences = desktopPreferences
  #panel!: HTMLElement
  #returnFocusTo: HTMLElement | null = null
  #releaseDismissal?: () => void
  #unsubscribe?: () => void

  connectedCallback(): void {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: 'open' })
      root.adoptedStyleSheets = [sheet]
      this.#panel = document.createElement('div')
      this.#panel.className = 'panel'
      this.#panel.setAttribute('role', 'dialog')
      this.#panel.setAttribute('aria-label', 'System menu')
      this.#panel.hidden = true
      this.#panel.addEventListener('keydown', (event) => this.#onKeydown(event))
      root.append(this.#panel)
      this.#render()
    }
    this.#unsubscribe = this.preferences.subscribe(() => this.#reflectStyle())
    this.#reflectStyle()
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.()
    this.#releaseDismissal?.()
  }

  get isOpen(): boolean {
    return !this.#panel.hidden
  }

  open(returnFocusTo: HTMLElement | null = null): void {
    if (this.isOpen) {
      return
    }
    this.#returnFocusTo = returnFocusTo
    this.#panel.hidden = false
    this.#reflectStyle()
    this.#releaseDismissal = observePopoverDismissal({ element: this.#panel, onDismiss: () => this.#dismiss() })
    this.#panel.querySelector<HTMLElement>('.tile:not([aria-disabled="true"])')?.focus()
  }

  close(): void {
    if (!this.isOpen) {
      return
    }
    this.#panel.hidden = true
    this.#releaseDismissal?.()
    this.#releaseDismissal = undefined
    this.#returnFocusTo?.focus()
    this.#returnFocusTo = null
  }

  #dismiss(): void {
    this.close()
    this.dispatchEvent(new CustomEvent(QUICK_SETTINGS_DISMISSED_EVENT, { bubbles: true, composed: true }))
  }

  #onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    this.#dismiss()
  }

  #render(): void {
    this.#panel.replaceChildren(
      ...QUICK_SETTINGS_SLIDERS.map((slider) => this.#renderSlider(slider.id, slider.label, slider.value)),
      this.#renderTiles(),
      this.#renderSeparator(),
      this.#renderFooter()
    )
  }

  #renderSlider(id: string, label: string, value: number): HTMLElement {
    const row = document.createElement('div')
    row.className = 'slider'
    const icon = createIconSvg(SLIDER_ICONS[id] ?? '')
    if (icon) {
      row.append(icon)
    }
    const input = document.createElement('input')
    input.type = 'range'
    input.min = '0'
    input.max = '100'
    input.value = String(value)
    input.disabled = true
    input.setAttribute('aria-label', label)
    row.append(input)
    return row
  }

  #renderTiles(): HTMLElement {
    const grid = document.createElement('div')
    grid.className = 'tiles'
    for (const tile of QUICK_SETTINGS_TILES) {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'tile'
      button.dataset.tileId = tile.id
      const label = document.createElement('span')
      label.className = 'tile-label'
      label.textContent = tile.label
      button.append(label)
      if (tile.hasSubmenu) {
        button.insertAdjacentHTML('beforeend', CHEVRON)
      }
      if (tile.disabled) {
        button.setAttribute('aria-disabled', 'true')
      }
      button.addEventListener('click', () => this.#onTileClick(tile.id, tile.disabled))
      grid.append(button)
    }
    return grid
  }

  #renderSeparator(): HTMLElement {
    const separator = document.createElement('div')
    separator.className = 'separator'
    return separator
  }

  #renderFooter(): HTMLElement {
    const footer = document.createElement('div')
    footer.className = 'footer'
    const battery = document.createElement('span')
    battery.className = 'battery'
    battery.textContent = BATTERY_LABEL
    const actions = document.createElement('div')
    actions.className = 'actions'
    for (const action of QUICK_SETTINGS_FOOTER) {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'action'
      button.dataset.actionId = action.id
      button.title = action.label
      button.setAttribute('aria-label', action.label)
      const icon = createIconSvg(ACTION_ICONS[action.id] ?? '')
      if (icon) {
        button.append(icon)
      }
      if (action.disabled) {
        button.setAttribute('aria-disabled', 'true')
      }
      button.addEventListener('click', () => this.#onActionClick(action.id, action.disabled))
      actions.append(button)
    }
    footer.append(battery, actions)
    return footer
  }

  #onTileClick(tileId: string, disabled: boolean): void {
    if (disabled || tileId !== DARK_STYLE_TILE_ID) {
      return
    }
    this.preferences.setStyle(this.preferences.getStyle() === 'dark' ? 'light' : 'dark')
  }

  #onActionClick(actionId: string, disabled: boolean): void {
    if (disabled) {
      return
    }
    this.close()
    this.dispatchEvent(
      new CustomEvent<QuickSettingsActionDetail>(QUICK_SETTINGS_ACTION_EVENT, {
        bubbles: true,
        composed: true,
        detail: { actionId }
      })
    )
  }

  #reflectStyle(): void {
    const tile = this.shadowRoot?.querySelector<HTMLElement>(`[data-tile-id="${DARK_STYLE_TILE_ID}"]`)
    const style = this.preferences.getStyle()
    tile?.setAttribute('aria-pressed', String(style === 'dark'))
    const label = tile?.querySelector('.tile-label')
    if (label) {
      label.textContent = STYLE_TILE_LABELS[style]
    }
  }
}

customElements.define('sc-quick-settings', QuickSettingsPanel)
