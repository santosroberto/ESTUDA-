import { LocalStorage } from './local-storage.js'
import { LS_KEYS } from '../utils/constants.js'

const migrations = {
  1: (data) => {
    return data
  }
}

export function getCurrentVersion() {
  return Math.max(...Object.keys(migrations).map(Number), 0)
}

export function runMigrations() {
  const currentVersion = LocalStorage.getSchemaVersion()
  const targetVersion = getCurrentVersion()

  if (currentVersion >= targetVersion) return

  for (let version = currentVersion + 1; version <= targetVersion; version++) {
    const migration = migrations[version]
    if (migration) {
      const keys = LocalStorage.getAllKeys()
      keys.forEach((key) => {
        const data = LocalStorage.getItem(key)
        if (data !== null) {
          const migrated = migration(data)
          LocalStorage.setItem(key, migrated)
        }
      })
    }
  }

  LocalStorage.setSchemaVersion(targetVersion)
}
