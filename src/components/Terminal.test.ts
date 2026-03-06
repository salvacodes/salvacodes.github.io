import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Terminal from './Terminal.vue'

describe('Terminal.vue', () => {
  it('renders the terminal with the title and the content', () => {
    const wrapper = mount(Terminal, {
      props: {
        title: 'Test Title',
        initialX: 123,
        initialY: 456
      },
      slots: {
        default: '<div class="test-content">Hello World</div>'
      },
      global: {
        stubs: {
          useZIndex: true
        }
      }
    })

    expect(wrapper.text()).toContain('Test Title')
    expect(wrapper.text()).toContain('Hello World')
  })

  it('disables dragging on mobile', async () => {
    global.window.innerWidth = 375
    window.dispatchEvent(new Event('resize'))

    const wrapper = mount(Terminal, {
      props: {
        title: 'Test Title'
      }
    })

    await wrapper.vm.$nextTick()

    const dragHandle = wrapper.find('.bg-zinc-800')
    expect(dragHandle.classes()).not.toContain('cursor-grab')
  })

  it('prevents dragging the terminal outside the view', async () => {
    global.window.innerWidth = 1000
    global.window.innerHeight = 1000

    const wrapper = mount(Terminal, {
      props: {
        title: 'Test Title',
        initialX: 100,
        initialY: 100
      }
    })
    Object.defineProperty(wrapper.element, 'offsetWidth', { value: 200 })
    Object.defineProperty(wrapper.element, 'offsetHeight', { value: 150 })
    const testDrag = async (clientX: number, clientY: number, expectedStyle: { left?: string; top?: string }) => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX, clientY }))
      await wrapper.vm.$nextTick()
      const style = (wrapper.element as HTMLElement).style
      expectedStyle.left !== undefined && expect(style.left).toBe(expectedStyle.left)
      expectedStyle.top !== undefined && expect(style.top).toBe(expectedStyle.top)
    }

    const dragHandle = wrapper.find('.bg-zinc-800')
    await dragHandle.trigger('mousedown', { clientX: 110, clientY: 110 })
    await testDrag(-500, 500, { left: '-160px' })
    await testDrag(2000, 500, { left: '960px' })
    await testDrag(500, -500, { top: '0px' })
    await testDrag(500, 2000, { top: '960px' })
    window.dispatchEvent(new MouseEvent('mouseup'))
  })
})
