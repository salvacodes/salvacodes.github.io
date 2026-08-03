import type { PostSummary } from './post-model'

export const collectTags = (summaries: PostSummary[]): string[] =>
  [...new Set(summaries.flatMap((summary) => summary.tags))].sort()

export const filterByTag = (summaries: PostSummary[], tag: string | undefined): PostSummary[] =>
  tag ? summaries.filter((summary) => summary.tags.includes(tag)) : summaries
