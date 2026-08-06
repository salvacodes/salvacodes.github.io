import { afterEach, expect, it } from 'vitest'
import { APP_ACTIVATE_EVENT, type AppActivateDetail } from '../apps/app-activation'
import { createDesktopPreferences } from '../preferences/desktop-preferences'
import type { PreferenceStorage } from '../preferences/preference-storage'
import { WALLPAPERS } from '../preferences/wallpaper-catalog'
import type { MenuAction } from './context-menu/context-menu-model'
import { CONTEXT_MENU_EVENT, type ContextMenuDetail } from './context-menu/context-menu-request'
import '../theme/tokens.css'
import './wallpaper'

const mount = (): HTMLElement => {
  const wallpaper = document.createElement('sc-wallpaper')
  document.body.append(wallpaper)
  return wallpaper
}

const resolvedToken = (token: string): string => {
  const probe = document.createElement('span')
  probe.style.color = `var(${token})`
  document.body.append(probe)
  const value = getComputedStyle(probe).color
  probe.remove()
  return value
}

afterEach(() => {
  for (const element of document.querySelectorAll('sc-wallpaper')) {
    element.remove()
  }
})

const fakeStorage = (): PreferenceStorage => {
  const entries = new Map<string, string>()
  return {
    read: (key) => entries.get(key),
    write: (key, value) => {
      entries.set(key, value)
    }
  }
}

const mountWithPreferences = (preferences = createDesktopPreferences({ storage: fakeStorage() })) => {
  const wallpaper = document.createElement('sc-wallpaper') as HTMLElement & { preferences: typeof preferences }
  wallpaper.preferences = preferences
  document.body.append(wallpaper)
  return { wallpaper, preferences }
}

const visibleMotifs = (wallpaper: HTMLElement): string[] =>
  [...(wallpaper.shadowRoot?.querySelectorAll<HTMLElement>('.motif') ?? [])]
    .filter((motif) => getComputedStyle(motif).display !== 'none')
    .map((motif) => motif.dataset.motif ?? '')

it('shows the default wallpaper motif', () => {
  const { wallpaper } = mountWithPreferences()
  expect(visibleMotifs(wallpaper)).toEqual(['signal'])
})

it('shows at most one motif for every wallpaper in the catalog', () => {
  const { wallpaper, preferences } = mountWithPreferences()
  for (const candidate of WALLPAPERS) {
    preferences.setWallpaper(candidate.id)
    expect(visibleMotifs(wallpaper).length).toBeLessThanOrEqual(1)
  }
})

it('swaps the motif when the wallpaper preference changes', () => {
  const { wallpaper, preferences } = mountWithPreferences()
  preferences.setWallpaper('dragon')
  expect(visibleMotifs(wallpaper)).toEqual(['dragon'])
})

it('shows no motif for the flat wallpaper', () => {
  const { wallpaper, preferences } = mountWithPreferences()
  preferences.setWallpaper('flat')
  expect(visibleMotifs(wallpaper)).toEqual([])
})

it('renders the decorative layers and stays out of the accessibility tree', () => {
  const wallpaper = document.createElement('sc-wallpaper')
  document.body.append(wallpaper)
  expect(wallpaper.getAttribute('aria-hidden')).toBe('true')
  expect(wallpaper.shadowRoot?.querySelector('.gradient')).not.toBeNull()
  expect(wallpaper.shadowRoot?.querySelector('svg.motif')).not.toBeNull()
  wallpaper.remove()
})

const openWallpaperMenu = (wallpaper: HTMLElement): ContextMenuDetail => {
  let detail: ContextMenuDetail | undefined
  document.addEventListener(
    CONTEXT_MENU_EVENT,
    (event) => {
      detail = (event as CustomEvent<ContextMenuDetail>).detail
    },
    { once: true }
  )
  wallpaper.dispatchEvent(
    new MouseEvent('contextmenu', { bubbles: true, composed: true, cancelable: true, clientX: 300, clientY: 200 })
  )
  if (!detail) {
    throw new Error('wallpaper dispatched no context menu request')
  }
  return detail
}

it('requests a desktop menu anchored at the pointer', () => {
  const detail = openWallpaperMenu(mount())
  expect(detail.anchor).toEqual({ x: 300, y: 200 })
})

it('offers the desktop actions in gnome order', () => {
  const detail = openWallpaperMenu(mount())
  const labels = detail.entries.map((entry) => ('label' in entry ? entry.label : '---'))
  expect(labels).toEqual([
    'Open Terminal',
    'Change Background…',
    'Display Settings',
    '---',
    'Activities Overview',
    '---',
    'About This Desktop'
  ])
})

it('greys out the actions that have no implementation yet', () => {
  const detail = openWallpaperMenu(mount())
  const disabledIds = detail.entries
    .filter((entry): entry is MenuAction => 'disabled' in entry && Boolean(entry.disabled))
    .map((entry) => entry.id)
  expect(disabledIds).toEqual(['display-settings', 'about'])
})

it('opens settings from change background', () => {
  const wallpaper = mount()
  const detail = openWallpaperMenu(wallpaper)
  let activated: AppActivateDetail | undefined
  document.addEventListener(
    APP_ACTIVATE_EVENT,
    (event) => {
      activated = (event as CustomEvent<AppActivateDetail>).detail
    },
    { once: true }
  )
  const changeBackground = detail.entries.find((entry) => 'id' in entry && entry.id === 'change-background')
  ;(changeBackground as MenuAction).perform?.()
  expect(activated).toEqual({ appId: 'settings' })
})

it('opens the terminal from the desktop menu', () => {
  const wallpaper = mount()
  const detail = openWallpaperMenu(wallpaper)
  let activated: AppActivateDetail | undefined
  document.addEventListener(
    APP_ACTIVATE_EVENT,
    (event) => {
      activated = (event as CustomEvent<AppActivateDetail>).detail
    },
    { once: true }
  )
  const openTerminal = detail.entries.find((entry) => 'id' in entry && entry.id === 'open-terminal')
  ;(openTerminal as MenuAction).perform?.()
  expect(activated).toEqual({ appId: 'terminal' })
})

it('prevents the native menu', () => {
  const wallpaper = mount()
  const event = new MouseEvent('contextmenu', { bubbles: true, composed: true, cancelable: true })
  wallpaper.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(true)
})

it('paints the motif from theme tokens rather than hardcoded colours', () => {
  const { wallpaper } = mountWithPreferences()
  const line = wallpaper.shadowRoot?.querySelector('[data-motif="signal"] .motif-line')
  const node = wallpaper.shadowRoot?.querySelector('[data-motif="signal"] .motif-node')
  const softNode = wallpaper.shadowRoot?.querySelector('[data-motif="signal"] .motif-node-soft')
  expect(getComputedStyle(line as Element).stroke).toBe(resolvedToken('--color-accent'))
  expect(getComputedStyle(node as Element).fill).toBe(resolvedToken('--color-accent'))
  expect(getComputedStyle(node as Element).stroke).toBe(resolvedToken('--color-accent'))
  expect(getComputedStyle(softNode as Element).stroke).toBe(resolvedToken('--color-accent'))
})
