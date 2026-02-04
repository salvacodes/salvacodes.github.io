import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ComingSoon from './ComingSoon.vue'

describe('ComingSoon.vue', () => {
  it('renders the title and terminal', () => {
    const wrapper = mount(ComingSoon)

    expect(wrapper.text()).toContain('salva.codes')
    expect(wrapper.text()).toContain('System Initializing...')
  })
})
