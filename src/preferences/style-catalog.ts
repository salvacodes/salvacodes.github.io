export type DesktopStyle = 'dark' | 'light'

export const DESKTOP_STYLES: readonly DesktopStyle[] = ['dark', 'light']

export const DEFAULT_STYLE: DesktopStyle = 'dark'

export const isDesktopStyle = (value: unknown): value is DesktopStyle =>
  typeof value === 'string' && DESKTOP_STYLES.includes(value as DesktopStyle)

export const toDesktopStyle = (value: unknown, fallback: DesktopStyle = DEFAULT_STYLE): DesktopStyle =>
  isDesktopStyle(value) ? value : fallback
