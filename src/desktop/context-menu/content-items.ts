import type { MenuEntry } from './context-menu-model'

type SelectionCapableRoot = ShadowRoot & { getSelection?: () => Selection | null }

export const readSelection = (root: ShadowRoot): string =>
  ((root as SelectionCapableRoot).getSelection?.() ?? document.getSelection())?.toString().trim() ?? ''

const OFFERABLE_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:'])

const writeClipboard = (text: string): void => {
  void navigator.clipboard.writeText(text).catch(() => undefined)
}

const hasOfferableProtocol = (href: string): boolean => {
  try {
    return OFFERABLE_LINK_PROTOCOLS.has(new URL(href, document.baseURI).protocol)
  } catch {
    return false
  }
}

const offerableAnchor = (target: Element | null): HTMLAnchorElement | null => {
  const closestAnchor = target?.closest('a[href]') ?? null
  if (!(closestAnchor instanceof HTMLAnchorElement) || !hasOfferableProtocol(closestAnchor.href)) {
    return null
  }
  return closestAnchor
}

const linkItems = (anchor: HTMLAnchorElement): MenuEntry[] => [
  {
    id: 'open-link',
    label: 'Open Link in New Tab',
    perform: () => {
      window.open(anchor.href, '_blank', 'noopener')
    }
  },
  { id: 'copy-link', label: 'Copy Link Address', perform: () => writeClipboard(anchor.href) }
]

export const standardContentItems = (target: Element | null, selectionText: string): MenuEntry[] => {
  const anchor = offerableAnchor(target)
  return [
    {
      id: 'copy',
      label: 'Copy',
      disabled: selectionText.length === 0,
      perform: () => writeClipboard(selectionText)
    },
    ...(anchor ? linkItems(anchor) : []),
    { id: 'paste', label: 'Paste', disabled: true }
  ]
}
