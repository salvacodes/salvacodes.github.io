import { expect, it, vi } from 'vitest'
import { SessionState } from './session-state'

it('starts running', () => {
  expect(new SessionState().phase).toBe('running')
})

it('walks the full power cycle', () => {
  const session = new SessionState()
  session.requestShutdown()
  expect(session.phase).toBe('confirming')
  session.confirm()
  expect(session.phase).toBe('shutting-down')
  session.finishShutdown()
  expect(session.phase).toBe('off')
  session.powerOn()
  expect(session.phase).toBe('booting')
  session.finishBoot()
  expect(session.phase).toBe('running')
})

it('returns to running when the confirmation is cancelled', () => {
  const session = new SessionState()
  session.requestShutdown()
  session.cancel()
  expect(session.phase).toBe('running')
})

it('ignores a confirm that was never requested', () => {
  const session = new SessionState()
  session.confirm()
  expect(session.phase).toBe('running')
})

it('ignores a second shutdown request while confirming', () => {
  const session = new SessionState()
  session.requestShutdown()
  session.requestShutdown()
  expect(session.phase).toBe('confirming')
})

it('ignores power on while it is still running', () => {
  const session = new SessionState()
  session.powerOn()
  expect(session.phase).toBe('running')
})

it('ignores finish boot when it is not booting', () => {
  const session = new SessionState()
  session.finishBoot()
  expect(session.phase).toBe('running')
})

it('notifies subscribers on every accepted transition', () => {
  const session = new SessionState()
  const listener = vi.fn()
  session.subscribe(listener)
  session.requestShutdown()
  session.cancel()
  expect(listener).toHaveBeenCalledTimes(2)
})

it('does not notify on a rejected transition', () => {
  const session = new SessionState()
  const listener = vi.fn()
  session.subscribe(listener)
  session.confirm()
  expect(listener).not.toHaveBeenCalled()
})

it('stops notifying after unsubscribe', () => {
  const session = new SessionState()
  const listener = vi.fn()
  session.subscribe(listener)()
  session.requestShutdown()
  expect(listener).not.toHaveBeenCalled()
})
