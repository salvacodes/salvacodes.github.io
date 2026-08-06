import { beforeAll, describe, expect, it } from 'vitest'
import { SETTINGS_ICON_MARKUP } from './settings-icon'

const CANVAS_SIZE = 64
const VIEWBOX_SIZE = 24
const center = CANVAS_SIZE / 2
const toPixels = (viewBoxUnits: number) => (viewBoxUnits * CANVAS_SIZE) / VIEWBOX_SIZE

const renderGlyph = async () => {
  const svg = new DOMParser()
    .parseFromString(SETTINGS_ICON_MARKUP, 'image/svg+xml')
    .querySelector('svg') as SVGSVGElement
  svg.setAttribute('width', String(CANVAS_SIZE))
  svg.setAttribute('height', String(CANVAS_SIZE))

  const image = new Image()
  const drawn = new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('the glyph markup did not render'))
  })
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`
  await drawn

  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_SIZE
  canvas.height = CANVAS_SIZE
  const context = canvas.getContext('2d') as CanvasRenderingContext2D
  context.drawImage(image, 0, 0, CANVAS_SIZE, CANVAS_SIZE)
  return context.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE)
}

const isInked = (pixels: ImageData, x: number, y: number) => {
  const alpha = pixels.data[(Math.round(y) * CANVAS_SIZE + Math.round(x)) * 4 + 3] ?? 0
  return alpha > 128
}

const sampleRing = (pixels: ImageData, viewBoxRadius: number, samples = 720) => {
  const radius = toPixels(viewBoxRadius)
  return Array.from({ length: samples }, (_, step) => {
    const angle = (step / samples) * Math.PI * 2
    return isInked(pixels, center + radius * Math.cos(angle), center + radius * Math.sin(angle))
  })
}

const countRuns = (ring: boolean[]) =>
  ring.filter((inked, index) => inked && !ring[(index - 1 + ring.length) % ring.length]).length

describe('the settings glyph', () => {
  let pixels: ImageData

  beforeAll(async () => {
    pixels = await renderGlyph()
  })

  it('is a solid body rather than a thin outline', () => {
    expect(sampleRing(pixels, 6).every(Boolean)).toBe(true)
  })

  it('is punched out at the centre like the gnome gear', () => {
    expect(isInked(pixels, center, center)).toBe(false)
    expect(sampleRing(pixels, 1.5).some(Boolean)).toBe(false)
  })

  it('carries eight teeth', () => {
    expect(countRuns(sampleRing(pixels, 9.9))).toBe(8)
  })

  it('leaves the corners of the viewbox clear', () => {
    expect(isInked(pixels, 1, 1)).toBe(false)
    expect(isInked(pixels, CANVAS_SIZE - 2, CANVAS_SIZE - 2)).toBe(false)
  })
})
