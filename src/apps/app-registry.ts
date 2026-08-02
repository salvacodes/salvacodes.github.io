import type { Size } from '../windowing/window-manager'

export interface AppDefinition {
  id: string
  name: string
  iconGlyph: string
  elementTag: string
  windowTitle?: string
  initialSize?: Size
  minSize?: Size
}

export class AppRegistry {
  #apps = new Map<string, AppDefinition>()

  register(app: AppDefinition): void {
    if (this.#apps.has(app.id)) {
      throw new Error(`App already registered: ${app.id}`)
    }
    this.#apps.set(app.id, app)
  }

  list(): AppDefinition[] {
    return [...this.#apps.values()]
  }

  get(id: string): AppDefinition {
    const app = this.#apps.get(id)
    if (!app) {
      throw new Error(`Unknown app: ${id}`)
    }
    return app
  }
}
