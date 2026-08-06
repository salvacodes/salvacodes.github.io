import './theme/tokens.css'
import './desktop/print.css'
import { desktopPreferences } from './preferences/desktop-preferences'
import './desktop/desktop-shell'

desktopPreferences.applyTo(document.documentElement)
document.getElementById('prerendered-article')?.remove()
document.body.append(document.createElement('sc-desktop'))
