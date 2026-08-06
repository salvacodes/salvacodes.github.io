import styles from './wallpaper-surface.css?inline'

let sheet: CSSStyleSheet

export const wallpaperSurfaceSheet = (): CSSStyleSheet => {
  if (!sheet) {
    sheet = new CSSStyleSheet()
    sheet.replaceSync(styles)
  }
  return sheet
}

export const WALLPAPER_SURFACE_MARKUP = `
  <div class="surface" data-variant="signal">
    <div class="gradient"></div>
    <svg class="motif" data-motif="signal" viewBox="0 0 200 200">
      <path class="motif-line" d="M40 160 L70 100 L100 130 L130 60 L160 90" />
      <path class="motif-line motif-faint" d="M40 160 L100 40 L160 90" />
      <circle class="motif-node" cx="70" cy="100" r="3" />
      <circle class="motif-node" cx="100" cy="130" r="3" />
      <circle class="motif-node" cx="130" cy="60" r="3" />
      <circle class="motif-node motif-node-soft" cx="100" cy="40" r="3" />
      <path class="motif-link" d="M100 40 L100 130" />
    </svg>
    <svg class="motif" data-motif="dragon" viewBox="0 0 200 200">
      <path class="motif-line" d="M30 150 L70 60 L100 110 L130 60 L170 150" />
      <path class="motif-line motif-faint" d="M70 60 L100 20 L130 60" />
      <path class="motif-link" d="M60 150 L100 110 L140 150" />
      <circle class="motif-node" cx="100" cy="110" r="4" />
      <circle class="motif-node motif-node-soft" cx="100" cy="20" r="3" />
    </svg>
    <svg class="motif" data-motif="grid" viewBox="0 0 200 200">
      <path class="motif-line motif-faint" d="M20 100 H180" />
      <path class="motif-line motif-faint" d="M100 20 V180" />
      <circle class="motif-node" cx="100" cy="100" r="4" />
    </svg>
  </div>
`
