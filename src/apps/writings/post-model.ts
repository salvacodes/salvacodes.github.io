export interface PostSummary {
  slug: string
  title: string
  date: string
  displayDate: string
  summary: string
  tags: string[]
  readingMinutes: number
}

export interface PostModule {
  html: string
}

export type PostLoaders = Record<string, () => Promise<PostModule>>
