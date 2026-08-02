import type { AppDefinition } from '../../apps/app-registry'
import type { WindowManager } from '../../windowing/window-manager'
import type { MenuEntry } from './context-menu-model'

export const appIconMenuEntries = (app: AppDefinition, manager: WindowManager, activate: () => void): MenuEntry[] => {
  const appWindowIds = manager
    .list()
    .filter((window) => window.appId === app.id)
    .map((window) => window.id)
  return [
    { id: 'open', label: 'Open', perform: activate },
    { id: 'new-window', label: 'New Window', disabled: true },
    { id: 'show-all-windows', label: 'Show All Windows', disabled: true },
    { id: 'pin-to-dash', label: 'Pin to Dash', disabled: true },
    { separator: true },
    {
      id: 'quit',
      label: 'Quit',
      disabled: appWindowIds.length === 0,
      perform: () => {
        for (const id of appWindowIds) {
          manager.close(id)
        }
      }
    }
  ]
}
