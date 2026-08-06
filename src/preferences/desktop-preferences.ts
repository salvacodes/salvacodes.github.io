import { defaultPreferenceStorage, type PreferenceStorage } from './preference-storage'
import { type DesktopStyle, toDesktopStyle } from './style-catalog'
import { toWallpaperId, type WallpaperId } from './wallpaper-catalog'

export const STYLE_KEY = 'salvacodes.style'
export const WALLPAPER_KEY = 'salvacodes.wallpaper'

export interface DesktopPreferences {
  getStyle(): DesktopStyle
  setStyle(style: DesktopStyle): void
  getWallpaper(): WallpaperId
  setWallpaper(wallpaper: WallpaperId): void
  subscribe(listener: () => void): () => void
  applyTo(root: HTMLElement): void
}

export interface DesktopPreferencesOptions {
  storage: PreferenceStorage
  prefersLight?: () => boolean
}

export const createDesktopPreferences = ({ storage, prefersLight }: DesktopPreferencesOptions): DesktopPreferences => {
  const systemStyle: DesktopStyle = prefersLight?.() ? 'light' : 'dark'
  let style = toDesktopStyle(storage.read(STYLE_KEY), systemStyle)
  let wallpaper = toWallpaperId(storage.read(WALLPAPER_KEY))
  const listeners = new Set<() => void>()
  let root: HTMLElement | undefined

  const apply = (): void => {
    if (!root) {
      return
    }
    root.dataset.style = style
    root.dataset.wallpaper = wallpaper
  }

  const notify = (): void => {
    apply()
    for (const listener of listeners) {
      listener()
    }
  }

  return {
    getStyle: () => style,
    getWallpaper: () => wallpaper,
    setStyle(next) {
      if (next === style) {
        return
      }
      style = next
      storage.write(STYLE_KEY, next)
      notify()
    },
    setWallpaper(next) {
      if (next === wallpaper) {
        return
      }
      wallpaper = next
      storage.write(WALLPAPER_KEY, next)
      notify()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    applyTo(next) {
      root = next
      apply()
    }
  }
}

export const desktopPreferences = createDesktopPreferences({
  storage: defaultPreferenceStorage,
  prefersLight: () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: light)').matches
})
