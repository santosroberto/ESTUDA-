import { storageService } from '../services/storage-service.js'
import { achievementService } from '../services/achievement-service.js'
import { eventBus } from '../utils/event-bus.js'
import { LS_KEYS } from '../utils/constants.js'
import { formatDate } from '../utils/date-utils.js'

export class AchievementsPage {
  constructor() {
    this._elements = {}
    this._achievements = []
    this._unsubStorage = null
  }

  async render() {
    const section = document.createElement('section')
    section.className = 'achievements page'
    section.innerHTML = this._buildHTML()
    this._elements.section = section
    this._cacheElements()
    return section
  }

  _buildHTML() {
    return `
      <div class="page__header">
        <h1 class="page__title">Conquistas</h1>
        <span class="text-sm text-tertiary" id="achievements-count"></span>
      </div>
      <div id="achievements-grid" class="achievements__grid">
        ${Array(8).fill('<div class="skeleton skeleton--card" style="height:12rem"></div>').join('')}
      </div>
    `
  }

  _cacheElements() {
    const s = this._elements.section
    this._elements.grid = s.querySelector('#achievements-grid')
    this._elements.count = s.querySelector('#achievements-count')
  }

  async afterRender() {
    this._loadData()

    this._unsubStorage = eventBus.on('storage:change', () => {
      achievementService.autoCheck()
      this._loadData()
    })
  }

  _loadData() {
    const sessions = storageService.findAll(LS_KEYS.SESSIONS)
    const studies = storageService.findAll(LS_KEYS.STUDIES)
    this._achievements = achievementService.getAll(sessions, studies)

    const unlocked = this._achievements.filter((a) => a.unlocked).length
    const total = this._achievements.length
    this._elements.count.textContent = `${unlocked} / ${total} conquistas`

    this._renderGrid()
  }

  _renderGrid() {
    const container = this._elements.grid
    if (!container) return

    const sorted = [...this._achievements].sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
      const pctA = a.progress.max > 0 ? a.progress.current / a.progress.max : 0
      const pctB = b.progress.max > 0 ? b.progress.current / b.progress.max : 0
      return pctB - pctA
    })

    container.innerHTML = sorted.map((a) => this._buildCard(a)).join('')
  }

  _buildCard(achievement) {
    const iconHtml = achievementService.getIcon(achievement.id)
    const pct = achievement.progress.max > 0
      ? Math.min(Math.round((achievement.progress.current / achievement.progress.max) * 100), 100)
      : 0

    return `
      <div class="card achievement-card ${achievement.unlocked ? 'achievement-card--unlocked' : 'achievement-card--locked'}">
        <div class="achievement-card__icon ${achievement.unlocked ? 'achievement-card__icon--unlocked' : ''}">
          ${iconHtml}
        </div>
        <div class="achievement-card__info">
          <h3 class="achievement-card__title">${this._escape(achievement.title)}</h3>
          <p class="achievement-card__desc">${this._escape(achievement.desc)}</p>
        </div>
        ${achievement.unlocked
          ? `<div class="achievement-card__status">
              <span class="badge badge--success badge--sm">Conquistado</span>
              <span class="achievement-card__date">${formatDate(achievement.unlockedAt)}</span>
            </div>`
          : `<div class="achievement-card__progress">
              <div class="progress">
                <div class="progress__label">
                  <span>Progresso</span>
                  <span class="progress__value">${achievement.progress.current} / ${achievement.progress.max}</span>
                </div>
                <div class="progress__bar" style="height:0.5rem">
                  <div class="progress__fill ${pct >= 100 ? 'progress__fill--success' : ''}" style="width:${pct}%"></div>
                </div>
              </div>
              <span class="achievement-card__pct">${pct}%</span>
            </div>`
        }
      </div>
    `
  }

  destroy() {
    if (this._unsubStorage) this._unsubStorage()
    this._elements = {}
    this._achievements = []
  }

  _escape(text) {
    if (!text) return ''
    const d = document.createElement('div')
    d.textContent = text
    return d.innerHTML
  }
}
