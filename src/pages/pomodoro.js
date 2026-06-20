import { storageService } from '../services/storage-service.js'
import { StudyTimer } from '../components/study-timer.js'
import { eventBus } from '../utils/event-bus.js'
import { LS_KEYS, POMODORO } from '../utils/constants.js'
import { formatDate, formatTime } from '../utils/date-utils.js'

const icons = {
  clock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  settings: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  history: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  empty: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
}

export class PomodoroPage {
  constructor() {
    this._elements = {}
    this._timer = null
    this._cycles = []
    this._subjects = []
    this._unsubStorage = null
  }

  async render() {
    const section = document.createElement('section')
    section.className = 'pomodoro page'
    section.innerHTML = this._buildHTML()
    this._elements.section = section
    this._cacheElements()
    return section
  }

  _buildHTML() {
    return `
      <div class="page__header">
        <h1 class="page__title">Pomodoro</h1>
      </div>

      <div class="pomodoro__layout">
        <div class="pomodoro__main">
          <div class="card">
            <div id="pomodoro-timer"></div>
          </div>

          <div class="card pomodoro__settings" id="pomodoro-settings">
            <div class="card__header">
              <h3 class="card__title">${icons.settings} Configurações</h3>
            </div>
            <form id="pomodoro-config" class="settings__form">
              <div class="session__form-row">
                <div class="form-field">
                  <label class="form-field__label" for="p-focus">Foco (min)</label>
                  <input type="number" class="input" id="p-focus" value="${POMODORO.DEFAULT_FOCUS}" min="1" max="120">
                </div>
                <div class="form-field">
                  <label class="form-field__label" for="p-break">Pausa curta (min)</label>
                  <input type="number" class="input" id="p-break" value="${POMODORO.DEFAULT_BREAK}" min="1" max="60">
                </div>
              </div>
              <div class="session__form-row">
                <div class="form-field">
                  <label class="form-field__label" for="p-long-break">Pausa longa (min)</label>
                  <input type="number" class="input" id="p-long-break" value="${POMODORO.DEFAULT_LONG_BREAK}" min="1" max="120">
                </div>
                <div class="form-field">
                  <label class="form-field__label" for="p-sessions">Ciclos até pausa longa</label>
                  <input type="number" class="input" id="p-sessions" value="${POMODORO.SESSIONS_BEFORE_LONG_BREAK}" min="1" max="10">
                </div>
              </div>
              <div class="form-field">
                <label class="form-field__label" for="p-subject">Disciplina (opcional)</label>
                <select class="input" id="p-subject">
                  <option value="">Sem disciplina</option>
                </select>
              </div>
              <div class="session__form-row">
                <div class="form-field" style="justify-content:flex-end">
                  <button type="submit" class="btn btn--primary btn--sm">Aplicar</button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div class="pomodoro__history">
          <div class="card">
            <div class="card__header">
              <h3 class="card__title">${icons.history} Ciclos Concluídos</h3>
            </div>
            <div id="pomodoro-cycles-list" class="pomodoro__cycles-list">
              <div class="skeleton skeleton--card" style="height:4rem"></div>
              <div class="skeleton skeleton--card" style="height:4rem"></div>
            </div>
          </div>
        </div>
      </div>
    `
  }

  _cacheElements() {
    const s = this._elements.section
    this._elements.timerContainer = s.querySelector('#pomodoro-timer')
    this._elements.configForm = s.querySelector('#pomodoro-config')
    this._elements.pFocus = s.querySelector('#p-focus')
    this._elements.pBreak = s.querySelector('#p-break')
    this._elements.pLongBreak = s.querySelector('#p-long-break')
    this._elements.pSessions = s.querySelector('#p-sessions')
    this._elements.pSubject = s.querySelector('#p-subject')
    this._elements.cyclesList = s.querySelector('#pomodoro-cycles-list')
  }

  async afterRender() {
    this._subjects = storageService.findAll(LS_KEYS.SUBJECTS)
    this._populateSubjectDropdown()

    this._timer = new StudyTimer({
      onComplete: (data) => this._onCycleComplete(data),
      onPhaseChange: () => {}
    })
    this._timer.element = this._timer.render()
    this._elements.timerContainer.appendChild(this._timer.element)

    this._bindEvents()
    this._loadCycles()

    this._unsubStorage = eventBus.on('storage:change', () => {
      this._subjects = storageService.findAll(LS_KEYS.SUBJECTS)
      this._populateSubjectDropdown()
    })
  }

  _populateSubjectDropdown() {
    const sel = this._elements.pSubject
    if (!sel) return
    sel.innerHTML = '<option value="">Sem disciplina</option>' +
      this._subjects.map((s) => `<option value="${s.id}">${this._escape(s.name)}</option>`).join('')
  }

  _bindEvents() {
    this._elements.configForm.addEventListener('submit', (e) => {
      e.preventDefault()
      this._applySettings()
    })
  }

  _applySettings() {
    const focus = parseInt(this._elements.pFocus.value, 10) || POMODORO.DEFAULT_FOCUS
    const breakDur = parseInt(this._elements.pBreak.value, 10) || POMODORO.DEFAULT_BREAK
    const longBreak = parseInt(this._elements.pLongBreak.value, 10) || POMODORO.DEFAULT_LONG_BREAK
    const sessions = parseInt(this._elements.pSessions.value, 10) || POMODORO.SESSIONS_BEFORE_LONG_BREAK

    this._timer.setDurations({
      focusDuration: focus,
      breakDuration: breakDur,
      longBreakDuration: longBreak,
      sessionsBeforeLongBreak: sessions
    })
  }

  _onCycleComplete(data) {
    const subjectId = this._elements.pSubject.value || null

    storageService.create(LS_KEYS.POMODORO_CYCLES, {
      subjectId,
      duration: data.duration,
      type: data.type
    })

    if (data.type === 'foco') {
      const now = new Date()
      const startH = now.getHours()
      const startM = now.getMinutes()
      const endM = startM + data.duration
      const endH = startH + Math.floor(endM / 60)
      const finalM = endM % 60

      const dateStr = now.toISOString().split('T')[0]
      const startTime = `${dateStr}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00`
      const endTime = `${dateStr}T${String(endH).padStart(2, '0')}:${String(finalM).padStart(2, '0')}:00`

      storageService.create(LS_KEYS.SESSIONS, {
        subjectId: subjectId || '',
        date: dateStr,
        startTime,
        endTime,
        duration: data.duration,
        category: 'estudo',
        notes: `Ciclo pomodoro #${data.cycleCount}`,
        tags: ['pomodoro']
      })
    }

    this._loadCycles()
  }

  _loadCycles() {
    this._cycles = storageService.findAll(LS_KEYS.POMODORO_CYCLES)
    this._renderCycles()
  }

  _renderCycles() {
    const container = this._elements.cyclesList
    if (!container) return

    const sorted = [...this._cycles].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))

    if (!sorted.length) {
      container.innerHTML = `
        <div class="empty-state" style="padding:var(--space-8)">
          <div class="empty-state__icon" style="width:3rem;height:3rem">${icons.empty}</div>
          <p class="empty-state__title" style="font-size:var(--text-sm)">Nenhum ciclo concluído</p>
          <p class="empty-state__desc" style="font-size:var(--text-xs)">Complete um ciclo pomodoro para vê-lo aqui.</p>
        </div>
      `
      return
    }

    const focusCycles = sorted.filter((c) => c.type === 'foco')
    const totalFocusMinutes = focusCycles.reduce((a, c) => a + (c.duration || 0), 0)
    const totalSessions = storageService.findAll(LS_KEYS.SESSIONS).length

    container.innerHTML = `
      <div class="pomodoro__stats">
        <div class="pomodoro__stat">
          <span class="pomodoro__stat-value">${sorted.length}</span>
          <span class="pomodoro__stat-label">Ciclos</span>
        </div>
        <div class="pomodoro__stat">
          <span class="pomodoro__stat-value">${Math.floor(totalFocusMinutes / 60)}h${totalFocusMinutes % 60}min</span>
          <span class="pomodoro__stat-label">Foco total</span>
        </div>
        <div class="pomodoro__stat">
          <span class="pomodoro__stat-value">${totalSessions}</span>
          <span class="pomodoro__stat-label">Sessões</span>
        </div>
      </div>
      <div class="list-group mt-4">
        ${sorted.slice(0, 20).map((c) => this._buildCycleItem(c)).join('')}
      </div>
    `
  }

  _buildCycleItem(cycle) {
    const phaseLabels = { foco: 'Foco', pausa_curta: 'Pausa', pausa_longa: 'Pausa longa' }
    const phaseLabel = phaseLabels[cycle.type] || cycle.type
    const subjectName = cycle.subjectId
      ? (this._subjects.find((s) => s.id === cycle.subjectId)?.name || '')
      : ''
    const durationLabel = `${cycle.duration}min`

    return `
      <div class="list-item" style="cursor:default">
        <span class="status-dot status-dot--${cycle.type === 'foco' ? 'success' : 'info'}"></span>
        <div class="list-item__content">
          <div class="list-item__title">
            <span class="badge badge--sm badge--${cycle.type === 'foco' ? 'success' : 'info'}">${phaseLabel}</span>
            ${subjectName ? `<span style="margin-left:var(--space-2)">${this._escape(subjectName)}</span>` : ''}
          </div>
          <div class="list-item__subtitle">
            ${formatDate(cycle.completedAt)} às ${formatTime(cycle.completedAt)} · ${durationLabel}
          </div>
        </div>
        <span class="badge badge--neutral badge--sm">${durationLabel}</span>
      </div>
    `
  }

  destroy() {
    if (this._unsubStorage) this._unsubStorage()
    if (this._timer) {
      this._timer.destroy()
      this._timer = null
    }
    this._elements = {}
    this._cycles = []
  }

  _escape(text) {
    if (!text) return ''
    const d = document.createElement('div')
    d.textContent = text
    return d.innerHTML
  }
}
