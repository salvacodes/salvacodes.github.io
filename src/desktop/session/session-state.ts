export type SessionPhase = 'running' | 'confirming' | 'shutting-down' | 'off' | 'booting'

export class SessionState {
  #phase: SessionPhase = 'running'
  #listeners = new Set<() => void>()

  get phase(): SessionPhase {
    return this.#phase
  }

  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener)
    return () => {
      this.#listeners.delete(listener)
    }
  }

  requestShutdown(): void {
    this.#transition('running', 'confirming')
  }

  cancel(): void {
    this.#transition('confirming', 'running')
  }

  confirm(): void {
    this.#transition('confirming', 'shutting-down')
  }

  finishShutdown(): void {
    this.#transition('shutting-down', 'off')
  }

  powerOn(): void {
    this.#transition('off', 'booting')
  }

  finishBoot(): void {
    this.#transition('booting', 'running')
  }

  #transition(from: SessionPhase, to: SessionPhase): void {
    if (this.#phase !== from) {
      return
    }
    this.#phase = to
    for (const listener of this.#listeners) {
      listener()
    }
  }
}
