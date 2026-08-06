export const createIconSvg = (markup: string): SVGElement | null => {
  const parsed = new DOMParser().parseFromString(markup, 'text/html')
  const svg = parsed.body.querySelector('svg')
  return svg ? (document.importNode(svg, true) as SVGElement) : null
}
