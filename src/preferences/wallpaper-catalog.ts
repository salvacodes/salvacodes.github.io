export type WallpaperId = 'signal' | 'dragon' | 'grid' | 'flat'

export interface WallpaperDefinition {
  id: WallpaperId
  label: string
}

export const WALLPAPERS: readonly WallpaperDefinition[] = [
  { id: 'signal', label: 'Signal' },
  { id: 'dragon', label: 'Dragon' },
  { id: 'grid', label: 'Grid' },
  { id: 'flat', label: 'Flat' }
]

export const DEFAULT_WALLPAPER: WallpaperId = 'signal'

export const isWallpaperId = (value: unknown): value is WallpaperId =>
  typeof value === 'string' && WALLPAPERS.some((wallpaper) => wallpaper.id === value)

export const toWallpaperId = (value: unknown): WallpaperId => (isWallpaperId(value) ? value : DEFAULT_WALLPAPER)
