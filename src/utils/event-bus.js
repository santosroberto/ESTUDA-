export class EventBus {
  constructor() {
    this._listeners = new Map()
  }

  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set())
    }
    this._listeners.get(event).add(callback)
    return () => this.off(event, callback)
  }

  off(event, callback) {
    const callbacks = this._listeners.get(event)
    if (callbacks) {
      callbacks.delete(callback)
    }
  }

  emit(event, data) {
    const callbacks = this._listeners.get(event)
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(`EventBus error on "${event}":`, error)
        }
      })
    }
  }

  once(event, callback) {
    const wrapper = (data) => {
      callback(data)
      this.off(event, wrapper)
    }
    this.on(event, wrapper)
  }

  clear() {
    this._listeners.clear()
  }
}

export const eventBus = new EventBus()
