import type { PreferenceStorage } from '../preferences/preference-storage'

export const fakePreferenceStorage = (initial: Record<string, string> = {}): PreferenceStorage => {
  const entries = new Map(Object.entries(initial))
  return {
    read: (key) => entries.get(key),
    write: (key, value) => {
      entries.set(key, value)
    }
  }
}
