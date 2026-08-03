export const textElement = (tag: string, className: string, text: string): HTMLElement => {
  const element = document.createElement(tag)
  element.className = className
  element.textContent = text
  return element
}
