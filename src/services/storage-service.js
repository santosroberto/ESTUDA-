import { LocalStorage } from '../store/local-storage.js'
import { LS_KEYS } from '../utils/constants.js'
import { eventBus } from '../utils/event-bus.js'
import { generateId } from '../utils/id-generator.js'
import { now } from '../utils/date-utils.js'

export class StorageService {
  constructor() {
    this._cache = new Map()
  }

  _loadFromStorage(key) {
    if (!this._cache.has(key)) {
      const data = LocalStorage.getItem(key)
      this._cache.set(key, data || [])
    }
    return this._cache.get(key)
  }

  _saveToStorage(key, data) {
    this._cache.set(key, data)
    LocalStorage.setItem(key, data)
  }

  findAll(entityKey, filters = {}) {
    const items = this._loadFromStorage(entityKey)
    if (Object.keys(filters).length === 0) return [...items]
    return items.filter((item) =>
      Object.entries(filters).every(([key, value]) => item[key] === value)
    )
  }

  findById(entityKey, id) {
    const items = this._loadFromStorage(entityKey)
    return items.find((item) => item.id === id) || null
  }

  create(entityKey, data) {
    const items = this._loadFromStorage(entityKey)
    const newItem = { ...data, id: generateId(), createdAt: now() }
    items.push(newItem)
    this._saveToStorage(entityKey, items)
    eventBus.emit(`${entityKey}:created`, newItem)
    eventBus.emit('storage:change', { key: entityKey, action: 'create', item: newItem })
    return newItem
  }

  update(entityKey, id, data) {
    const items = this._loadFromStorage(entityKey)
    const index = items.findIndex((item) => item.id === id)
    if (index === -1) return null
    const updated = { ...items[index], ...data, updatedAt: now() }
    items[index] = updated
    this._saveToStorage(entityKey, items)
    eventBus.emit(`${entityKey}:updated`, updated)
    eventBus.emit('storage:change', { key: entityKey, action: 'update', item: updated })
    return updated
  }

  delete(entityKey, id) {
    const items = this._loadFromStorage(entityKey)
    const index = items.findIndex((item) => item.id === id)
    if (index === -1) return false
    const removed = items.splice(index, 1)[0]
    this._saveToStorage(entityKey, items)
    eventBus.emit(`${entityKey}:deleted`, removed)
    eventBus.emit('storage:change', { key: entityKey, action: 'delete', item: removed })
    return true
  }

  getSettings() {
    return LocalStorage.getItem(LS_KEYS.SETTINGS)
  }

  updateSettings(settings) {
    LocalStorage.setItem(LS_KEYS.SETTINGS, settings)
    eventBus.emit('settings:updated', settings)
    return settings
  }
}

export const storageService = new StorageService()
