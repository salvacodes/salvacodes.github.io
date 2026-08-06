export interface PreferenceStorage {
  read(key: string): string | undefined
  write(key: string, value: string): void
}

export const createPreferenceStorage = (open: () => Storage | null): PreferenceStorage => ({
  read(key) {
    try {
      return open()?.getItem(key) ?? undefined
    } catch {
      return undefined
    }
  },
  write(key, value) {
    try {
      open()?.setItem(key, value)
    } catch {
      return
    }
  }
})

export const defaultPreferenceStorage = createPreferenceStorage(() =>
  typeof localStorage === 'undefined' ? null : localStorage
)
