import { AppRegistry } from './app-registry'
import './resume/case-study-app'
import './resume/resume-app'
import './settings/settings-app'
import { SETTINGS_ICON_MARKUP } from './settings/settings-icon'
import './terminal/terminal-app'
import './writings/writings-app'

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
    id: 'resume',
    name: 'Resume++',
    iconGlyph: 'CV',
    elementTag: 'sc-resume-app',
    windowTitle: 'Resume++',
    initialSize: { width: 880, height: 620 },
    minSize: { width: 420, height: 320 }
  })
  registry.register({
    id: 'writings',
    name: 'Writings',
    iconGlyph: '✎',
    elementTag: 'sc-writings-app',
    windowTitle: 'Writings',
    initialSize: { width: 900, height: 640 },
    minSize: { width: 380, height: 320 }
  })
  registry.register({
    id: 'settings',
    name: 'Settings',
    iconGlyph: '⛭',
    iconSvg: SETTINGS_ICON_MARKUP,
    elementTag: 'sc-settings-app',
    windowTitle: 'Settings',
    initialSize: { width: 800, height: 560 },
    minSize: { width: 420, height: 340 }
  })
  registry.register({
    id: 'case-study',
    name: 'Case study',
    iconGlyph: '§',
    elementTag: 'sc-case-study-app',
    hidden: true,
    initialSize: { width: 620, height: 560 },
    minSize: { width: 360, height: 300 }
  })
  return registry
}
