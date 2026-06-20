import { eventBus } from './utils/event-bus.js'

class State {
  constructor() {
    this._state = {
      subjects: [],
      sessions: [],
      tasks: [],
      goals: [],
      settings: null,
      isLoading: false,
      error: null
    }
    this._initialized = false
  }

  get(key) {
    return this._state[key]
  }

  set(key, value) {
    const prev = this._state[key]
    this._state[key] = value
    eventBus.emit(`state:${key}:changed`, { prev, current: value })
    eventBus.emit('state:changed', { key, prev, current: value })
  }

  subscribe(key, callback) {
    return eventBus.on(`state:${key}:changed`, callback)
  }

  subscribeAny(callback) {
    return eventBus.on('state:changed', callback)
  }

  setLoading(value) {
    this._state.isLoading = value
    eventBus.emit('state:loading', value)
  }

  setError(error) {
    this._state.error = error
    eventBus.emit('state:error', error)
  }

  clearError() {
    this._state.error = null
    eventBus.emit('state:error', null)
  }

  reset() {
    this._state = {
      subjects: [],
      sessions: [],
      tasks: [],
      goals: [],
      settings: null,
      isLoading: false,
      error: null
    }
    eventBus.emit('state:reset')
  }
}

export const appState = new State()
