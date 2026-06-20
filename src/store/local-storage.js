import { LS_KEYS, SCHEMA_VERSION } from '../utils/constants.js'

export class LocalStorage {
  static getItem(key) {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error(`LocalStorage.getItem error [${key}]:`, error)
      return null
    }
  }

  static setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`LocalStorage.setItem error [${key}]:`, error)
      return false
    }
  }

  static removeItem(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`LocalStorage.removeItem error [${key}]:`, error)
      return false
    }
  }

  static getAllKeys() {
    return Object.values(LS_KEYS)
  }

  static clear() {
    try {
      const keys = LocalStorage.getAllKeys()
      keys.forEach((key) => localStorage.removeItem(key))
      return true
    } catch (error) {
      console.error('LocalStorage.clear error:', error)
      return false
    }
  }

  static getSchemaVersion() {
    return LocalStorage.getItem(LS_KEYS.SCHEMA_VERSION) || 0
  }

  static setSchemaVersion(version) {
    return LocalStorage.setItem(LS_KEYS.SCHEMA_VERSION, version)
  }

  static isAvailable() {
    try {
      localStorage.setItem('__storage_test__', '1')
      localStorage.removeItem('__storage_test__')
      return true
    } catch {
      return false
    }
  }
}
