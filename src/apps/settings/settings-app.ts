import './appearance-panel'
import styles from './settings-app.css?inline'

const sheet = new CSSStyleSheet()
sheet.replaceSync(styles)

interface SettingsPanelLink {
  id: string
  label: string
  disabled: boolean
}

const PANELS: readonly SettingsPanelLink[] = [
  { id: 'appearance', label: 'Appearance', disabled: false },
  { id: 'network', label: 'Network', disabled: true },
  { id: 'displays', label: 'Displays', disabled: true },
  { id: 'sound', label: 'Sound', disabled: true },
  { id: 'power', label: 'Power', disabled: true },
  { id: 'about', label: 'About', disabled: true }
]

export class SettingsApp extends HTMLElement {
  connectedCallback(): void {
    if (this.shadowRoot) {
      return
    }
    const root = this.attachShadow({ mode: 'open' })
    root.adoptedStyleSheets = [sheet]
    const nav = document.createElement('nav')
    nav.setAttribute('aria-label', 'Settings panels')
    for (const panel of PANELS) {
      const link = document.createElement('button')
      link.type = 'button'
      link.className = 'panel-link'
      link.dataset.panelId = panel.id
      link.textContent = panel.label
      if (panel.disabled) {
        link.setAttribute('aria-disabled', 'true')
      } else {
        link.setAttribute('aria-current', 'true')
      }
      nav.append(link)
    }
    const content = document.createElement('div')
    content.className = 'content'
    content.append(document.createElement('sc-appearance-panel'))
    root.append(nav, content)
  }
}

customElements.define('sc-settings-app', SettingsApp)
