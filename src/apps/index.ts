import { AppRegistry } from './app-registry'
import './terminal/terminal-app'

export const createAppRegistry = (): AppRegistry => {
  const registry = new AppRegistry()
  registry.register({
    id: 'terminal',
    name: 'Terminal',
    iconGlyph: '>_',
    elementTag: 'sc-terminal-app',
    windowTitle: 'user@salva.codes: ~',
    initialSize: { width: 640, height: 420 }
  })
  registry.register({
    id: 'readme',
    name: 'Readme',
    iconGlyph: '#',
    elementTag: 'sc-terminal-app',
    initialSize: { width: 560, height: 380 }
  })
  return registry
}
