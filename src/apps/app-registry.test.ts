import { describe, expect, it } from 'vitest'
import { AppRegistry } from './app-registry'

const welcomeApp = {
  id: 'welcome',
  name: 'Welcome',
  iconGlyph: '>_',
  elementTag: 'sc-welcome-app'
}

describe('AppRegistry', () => {
  it('lists registered apps in registration order', () => {
    const registry = new AppRegistry()
    registry.register(welcomeApp)
    registry.register({ ...welcomeApp, id: 'readme', name: 'Readme' })
    expect(registry.list().map((app) => app.id)).toEqual(['welcome', 'readme'])
  })

  it('returns a registered app by id', () => {
    const registry = new AppRegistry()
    registry.register(welcomeApp)
    expect(registry.get('welcome').name).toBe('Welcome')
  })

  it('rejects duplicate ids', () => {
    const registry = new AppRegistry()
    registry.register(welcomeApp)
    expect(() => registry.register(welcomeApp)).toThrowError('App already registered: welcome')
  })

  it('throws for an unknown id', () => {
    const registry = new AppRegistry()
    expect(() => registry.get('nope')).toThrowError('Unknown app: nope')
  })
})

describe('launchable apps', () => {
  it('excludes hidden apps from the launchable list but keeps them retrievable', () => {
    const registry = new AppRegistry()
    registry.register(welcomeApp)
    registry.register({ ...welcomeApp, id: 'case-study', name: 'Case study', hidden: true })
    expect(registry.listLaunchable().map((app) => app.id)).toEqual(['welcome'])
    expect(registry.list().map((app) => app.id)).toEqual(['welcome', 'case-study'])
    expect(registry.get('case-study').name).toBe('Case study')
  })
})
