import { storageService } from './storage-service.js'
import { statsService } from './stats-service.js'
import { LS_KEYS, ACHIEVEMENTS } from '../utils/constants.js'
import { eventBus } from '../utils/event-bus.js'

const ACHIEVEMENT_ICONS = {
  star: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  clock: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  fire: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 13.98c0 5.37 3.58 9.35 8 9.35s8-3.98 8-9.35c0-4.48-2.88-9.33-6.5-13.31z"/></svg>',
  book: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  award: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>'
}

export class AchievementService {
  getIcon(id) {
    const def = ACHIEVEMENTS.find((a) => a.id === id)
    return ACHIEVEMENT_ICONS[def?.icon] || ACHIEVEMENT_ICONS.star
  }

  getAll(sessions, studies) {
    const unlocked = this._getUnlocked()
    const streak = statsService.getStreak(sessions)
    const unlockedSet = new Set(unlocked.map((u) => u.id))

    return ACHIEVEMENTS.map((def) => {
      const isUnlocked = unlockedSet.has(def.id)
      const unlockedEntry = unlocked.find((u) => u.id === def.id)

      let progress
      try {
        progress = def.progress(sessions, streak, studies)
      } catch {
        progress = { current: 0, max: 1 }
      }

      return {
        ...def,
        unlocked: isUnlocked,
        unlockedAt: unlockedEntry ? unlockedEntry.unlockedAt : null,
        progress
      }
    })
  }

  checkAndUnlock(sessions, studies) {
    const unlocked = this._getUnlocked()
    const unlockedSet = new Set(unlocked.map((u) => u.id))
    const streak = statsService.getStreak(sessions)
    const newlyUnlocked = []

    ACHIEVEMENTS.forEach((def) => {
      if (unlockedSet.has(def.id)) return
      let met = false
      try {
        met = def.check(sessions, streak, studies)
      } catch {
        met = false
      }
      if (met) {
        const entry = { id: def.id, unlockedAt: new Date().toISOString() }
        storageService.create(LS_KEYS.ACHIEVEMENTS, entry)
        newlyUnlocked.push(def)
      }
    })

    return newlyUnlocked
  }

  autoCheck() {
    const sessions = storageService.findAll(LS_KEYS.SESSIONS)
    const studies = storageService.findAll(LS_KEYS.STUDIES)
    return this.checkAndUnlock(sessions, studies)
  }

  _getUnlocked() {
    return storageService.findAll(LS_KEYS.ACHIEVEMENTS)
  }
}

export const achievementService = new AchievementService()
