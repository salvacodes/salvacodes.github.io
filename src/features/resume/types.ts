export interface Link {
  label: string
  url: string
}

export interface Profile {
  name: string
  title: string
  /** The short "whoami" blurb shown up front. */
  bio: string
  location?: string
  links: Link[]
}

export interface SkillGroup {
  category: string
  items: string[]
}

export interface Experience {
  company: string
  role: string
  /** ISO-ish, e.g. '2021-03'. */
  start: string
  /** ISO-ish, or 'present'. */
  end: string | 'present'
  summary: string
  highlights: string[]
}

export interface Certification {
  name: string
  issuer: string
  /** ISO-ish, e.g. '2024-08'. */
  issued: string
  credentialId?: string
  url?: string
}
