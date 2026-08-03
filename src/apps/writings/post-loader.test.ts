import { describe, expect, it } from 'vitest'
import { createPostLoader } from './post-loader'

describe('createPostLoader', () => {
  it('loads the body of a known post', async () => {
    const load = createPostLoader({ 'a-post': () => Promise.resolve({ html: '<p>Body.</p>' }) })

    await expect(load('a-post')).resolves.toBe('<p>Body.</p>')
  })

  it('has nothing for a post that was never written', async () => {
    const load = createPostLoader({})

    await expect(load('absent')).resolves.toBeUndefined()
  })

  it('asks for a body only when it is wanted', async () => {
    let asked = 0
    const load = createPostLoader({
      'a-post': () => {
        asked += 1
        return Promise.resolve({ html: '<p>Body.</p>' })
      }
    })

    expect(asked).toBe(0)
    await load('a-post')
    expect(asked).toBe(1)
  })
})
