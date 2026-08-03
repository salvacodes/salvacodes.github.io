declare module 'virtual:writing-index' {
  import type { PostLoaders, PostSummary } from './post-model'

  export const postSummaries: PostSummary[]
  export const postLoaders: PostLoaders
}
