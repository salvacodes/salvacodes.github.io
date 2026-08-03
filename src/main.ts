import './theme/tokens.css'
import './desktop/print.css'
import './desktop/desktop-shell'

document.getElementById('prerendered-article')?.remove()
document.body.append(document.createElement('sc-desktop'))
