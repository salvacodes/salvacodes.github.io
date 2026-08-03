import type { PostLoaders } from './post-model'

export type PostHtmlLoader = (slug: string) => Promise<string | undefined>

export const createPostLoader =
  (loaders: PostLoaders): PostHtmlLoader =>
  async (slug: string): Promise<string | undefined> =>
    (await loaders[slug]?.())?.html
