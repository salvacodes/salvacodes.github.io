import { page } from 'vitest/browser'
import { APP_ACTIVATE_EVENT, type AppActivateDetail } from '../apps/app-activation'
import type { DesktopShell } from '../desktop/desktop-shell'
import type { QuickSettingsPanel } from '../desktop/quick-settings/quick-settings-panel'
import type { SessionScreen } from '../desktop/session/session-screen'
import { mount } from './mount'
import '../desktop/desktop-shell'
import '../theme/tokens.css'

export interface WindowDriver {
  close(): Promise<void>
  minimize(): Promise<void>
  toggleMaximize(): Promise<void>
  openTitleBarMenu(): void
  isMinimized(): boolean
  isMaximized(): boolean
  isFocused(): boolean
  contains(tag: string): boolean
  attributeOf(tag: string, name: string): string | null
}

export interface DesktopDriver {
  readonly element: DesktopShell
  launch(appName: string): Promise<void>
  activate(detail: AppActivateDetail): void
  surface<T extends HTMLElement>(tag: string): T
  openWindowTitles(): string[]
  window(title: string): WindowDriver
  openDesktopMenu(): void
  menuItemLabels(): string[]
  chooseMenuItem(label: string): Promise<void>
  isMenuOpen(): boolean
  toggleActivities(): Promise<void>
  isOverviewOpen(): boolean
  openSystemMenu(): Promise<void>
  isSystemMenuOpen(): boolean
  isSystemMenuExpanded(): boolean
  chooseSystemMenuAction(label: string): Promise<void>
  sessionPhase(): string | null
  isShutdownDialogOpen(): boolean
  confirmShutdown(): Promise<void>
  cancelShutdown(): Promise<void>
}

const SHUTDOWN_DIALOG = { role: 'alertdialog', name: 'Power Off' } as const

const windowElements = (desktop: DesktopShell): HTMLElement[] => [
  ...(desktop.shadowRoot?.querySelectorAll<HTMLElement>('sc-window') ?? [])
]

const titleOf = (windowElement: HTMLElement): string => windowElement.shadowRoot?.querySelector('h1')?.textContent ?? ''

export const mountDesktop = (): DesktopDriver => {
  const desktop = mount<DesktopShell>('sc-desktop')

  const subComponent = <T extends HTMLElement>(tag: string): T => desktop.shadowRoot?.querySelector(tag) as T

  const windowNamed = (title: string): HTMLElement => {
    const open = windowElements(desktop)
    const found = open.find((element) => titleOf(element) === title)
    if (!found) {
      throw new Error(`no open window titled "${title}" (open: ${open.map(titleOf).join(', ') || 'none'})`)
    }
    return found
  }

  const windowControl = (title: string, label: string) =>
    page.getByRole('dialog', { name: title }).getByRole('button', { name: label })

  const systemMenuButton = () => page.getByRole('button', { name: 'System menu' })

  return {
    element: desktop,

    launch: (appName) => page.getByTitle(appName).click(),

    activate: (detail) => {
      desktop.shadowRoot?.dispatchEvent(
        new CustomEvent<AppActivateDetail>(APP_ACTIVATE_EVENT, { bubbles: true, composed: true, detail })
      )
    },

    surface: subComponent,

    openWindowTitles: () => windowElements(desktop).map(titleOf),

    window: (title) => ({
      close: () => windowControl(title, 'Close').click(),
      minimize: () => windowControl(title, 'Minimize').click(),
      toggleMaximize: () => windowControl(title, 'Maximize').click(),
      openTitleBarMenu: () => {
        windowNamed(title)
          .shadowRoot?.querySelector('header')
          ?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, composed: true, cancelable: true }))
      },
      isMinimized: () => windowNamed(title).hasAttribute('hidden'),
      isMaximized: () => windowNamed(title).hasAttribute('maximized'),
      isFocused: () => windowNamed(title).hasAttribute('focused'),
      contains: (tag) => windowNamed(title).querySelector(tag) !== null,
      attributeOf: (tag, name) => windowNamed(title).querySelector(tag)?.getAttribute(name) ?? null
    }),

    openDesktopMenu: () => {
      subComponent('sc-wallpaper').dispatchEvent(
        new MouseEvent('contextmenu', { bubbles: true, composed: true, cancelable: true, clientX: 300, clientY: 200 })
      )
    },

    menuItemLabels: () =>
      page
        .getByRole('menuitem')
        .elements()
        .map((item) => item.textContent ?? ''),

    chooseMenuItem: (label) => page.getByRole('menuitem', { name: label }).click(),

    isMenuOpen: () => page.getByRole('menu').elements().length > 0,

    toggleActivities: () => page.getByRole('button', { name: 'Activities' }).click(),

    isOverviewOpen: () => subComponent('sc-overview').hasAttribute('open'),

    openSystemMenu: () => systemMenuButton().click(),

    isSystemMenuOpen: () => subComponent<QuickSettingsPanel>('sc-quick-settings').isOpen,

    isSystemMenuExpanded: () => systemMenuButton().element().getAttribute('aria-expanded') === 'true',

    chooseSystemMenuAction: (label) =>
      page.getByRole('dialog', { name: 'System menu' }).getByRole('button', { name: label }).click(),

    sessionPhase: () => subComponent<SessionScreen>('sc-session-screen').getAttribute('data-phase'),

    isShutdownDialogOpen: () =>
      page.getByRole(SHUTDOWN_DIALOG.role, { name: SHUTDOWN_DIALOG.name }).elements().length > 0,

    confirmShutdown: () =>
      page
        .getByRole(SHUTDOWN_DIALOG.role, { name: SHUTDOWN_DIALOG.name })
        .getByRole('button', { name: 'Power Off' })
        .click(),

    cancelShutdown: () =>
      page
        .getByRole(SHUTDOWN_DIALOG.role, { name: SHUTDOWN_DIALOG.name })
        .getByRole('button', { name: 'Cancel' })
        .click()
  }
}
