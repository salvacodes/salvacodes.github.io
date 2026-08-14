import { afterEach, expect, it } from 'vitest'
import { renderCredentials } from './credentials'
import type { Education, Language } from './resume-model'

const education: Education[] = [
  { institution: 'Universidad Politécnica de Valencia', degree: 'Ingeniería Informática', field: 'Lenguajes e IA' }
]

const languages: Language[] = [
  { name: 'Spanish', level: 'Native' },
  { name: 'English', level: 'Professional working' }
]

const mount = (inputEducation = education, inputLanguages = languages) => {
  const host = document.createElement('div')
  host.append(renderCredentials(inputEducation, inputLanguages))
  document.body.append(host)
  return host
}

afterEach(() => {
  document.body.replaceChildren()
})

it('renders one entry per degree, with institution and field', () => {
  const host = mount()
  const entries = host.querySelectorAll('.education-entry')
  expect(entries).toHaveLength(1)
  expect(entries[0]?.querySelector('.education-degree')?.textContent).toBe('Ingeniería Informática')
  expect(entries[0]?.querySelector('.education-institution')?.textContent).toBe('Universidad Politécnica de Valencia')
  expect(entries[0]?.querySelector('.education-field')?.textContent).toBe('Lenguajes e IA')
})

it('renders one entry per language, with its level', () => {
  const host = mount()
  const entries = host.querySelectorAll('.language-entry')
  expect([...entries].map((entry) => entry.querySelector('.language-name')?.textContent)).toEqual([
    'Spanish',
    'English'
  ])
  expect(entries[1]?.querySelector('.language-level')?.textContent).toBe('Professional working')
})

it('omits a group that has no entries', () => {
  const host = mount([], languages)
  expect(host.querySelector('.education')).toBeNull()
  expect(host.querySelector('.languages')).not.toBeNull()
})
