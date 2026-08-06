import { expect, it } from 'vitest'
import { createPreferenceStorage } from './preference-storage'

const memoryStorage = (): Storage => {
  const entries = new Map<string, string>()
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => {
      entries.set(key, value)
    },
    removeItem: (key: string) => {
      entries.delete(key)
    },
    clear: () => entries.clear(),
    key: () => null,
    get length() {
      return entries.size
    }
  } as Storage
}

it('reads back what it wrote', () => {
  const source = memoryStorage()
  const storage = createPreferenceStorage(() => source)
  storage.write('salvacodes.style', 'light')
  expect(storage.read('salvacodes.style')).toBe('light')
})

it('returns undefined for a key that was never written', () => {
  const storage = createPreferenceStorage(() => memoryStorage())
  expect(storage.read('salvacodes.style')).toBeUndefined()
})

it('returns undefined when there is no storage at all', () => {
  const storage = createPreferenceStorage(() => null)
  expect(storage.read('salvacodes.style')).toBeUndefined()
})

it('survives a storage that throws when opened', () => {
  const storage = createPreferenceStorage(() => {
    throw new Error('SecurityError')
  })
  expect(storage.read('salvacodes.style')).toBeUndefined()
  expect(() => storage.write('salvacodes.style', 'light')).not.toThrow()
})

it('survives a storage that throws on write', () => {
  const source = {
    getItem: () => null,
    setItem: () => {
      throw new Error('QuotaExceededError')
    }
  } as unknown as Storage
  const storage = createPreferenceStorage(() => source)
  expect(() => storage.write('salvacodes.style', 'light')).not.toThrow()
})
