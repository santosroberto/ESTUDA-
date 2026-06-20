import { storageService } from '../services/storage-service.js'
import { eventBus } from '../utils/event-bus.js'
import { LS_KEYS } from '../utils/constants.js'
import { getDaysInMonth, getWeekdayName, formatDate } from '../utils/date-utils.js'

const icons = {
  prev: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
  next: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
  empty: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
}

export class CalendarPage {
  constructor() {
    this._elements = {}
    this._sessions = []
    this._subjects = []
    this._currentYear = new Date().getFullYear()
    this._currentMonth = new Date().getMonth()
    this._unsubStorage = null
  }

  async render() {
    const section = document.createElement('section')
    section.className = 'calendar page'
    section.innerHTML = this._buildHTML()
    this._elements.section = section
    this._cacheElements()
    return section
  }

  _buildHTML() {
    return `
      <div class="page__header">
        <h1 class="page__title">Calendário</h1>
      </div>
      <div class="card">
        <div class="calendar__nav">
          <button class="btn btn--icon btn--ghost" id="btn-prev">${icons.prev}</button>
          <h2 class="calendar__title" id="calendar-title"></h2>
          <button class="btn btn--icon btn--ghost" id="btn-next">${icons.next}</button>
        </div>
        <div class="calendar__grid" id="calendar-grid"></div>
        <div class="calendar__legend" id="calendar-legend"></div>
      </div>
      <div class="section" id="calendar-day-detail">
        <div class="section__header">
          <h3 class="section__title" id="day-detail-title">Selecione um dia</h3>
        </div>
        <div id="day-sessions" class="list-group"></div>
      </div>
    `
  }

  _cacheElements() {
    const s = this._elements.section
    this._elements.title = s.querySelector('#calendar-title')
    this._elements.grid = s.querySelector('#calendar-grid')
    this._elements.legend = s.querySelector('#calendar-legend')
    this._elements.btnPrev = s.querySelector('#btn-prev')
    this._elements.btnNext = s.querySelector('#btn-next')
    this._elements.dayDetailTitle = s.querySelector('#day-detail-title')
    this._elements.daySessions = s.querySelector('#day-sessions')
  }

  async afterRender() {
    this._subjects = storageService.findAll(LS_KEYS.SUBJECTS)
    this._sessions = storageService.findAll(LS_KEYS.SESSIONS)
    this._bindEvents()
    this._render()

    this._unsubStorage = eventBus.on('storage:change', () => {
      this._subjects = storageService.findAll(LS_KEYS.SUBJECTS)
      this._sessions = storageService.findAll(LS_KEYS.SESSIONS)
      this._render()
    })
  }

  _bindEvents() {
    this._elements.btnPrev.addEventListener('click', () => {
      this._currentMonth--
      if (this._currentMonth < 0) { this._currentMonth = 11; this._currentYear-- }
      this._render()
    })
    this._elements.btnNext.addEventListener('click', () => {
      this._currentMonth++
      if (this._currentMonth > 11) { this._currentMonth = 0; this._currentYear++ }
      this._render()
    })
  }

  _render() {
    this._renderTitle()
    this._renderGrid()
    this._renderLegend()
    this._renderDayDetail(null)
  }

  _renderTitle() {
    const names = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    this._elements.title.textContent = `${names[this._currentMonth]} ${this._currentYear}`
  }

  _renderGrid() {
    const grid = this._elements.grid
    const daysInMonth = getDaysInMonth(this._currentYear, this._currentMonth + 1)
    const firstDay = new Date(this._currentYear, this._currentMonth, 1).getDay()

    const sessionMap = {}
    this._sessions.forEach((s) => {
      const d = new Date(s.date)
      if (d.getMonth() === this._currentMonth && d.getFullYear() === this._currentYear) {
        const key = d.getDate()
        if (!sessionMap[key]) sessionMap[key] = []
        sessionMap[key].push(s)
      }
    })

    let html = '<div class="calendar__weekdays">'
    for (let i = 0; i < 7; i++) {
      html += `<div class="calendar__weekday">${getWeekdayName(i)}</div>`
    }
    html += '</div><div class="calendar__days">'

    for (let i = 0; i < firstDay; i++) {
      html += '<div class="calendar__cell calendar__cell--empty"></div>'
    }

    const today = new Date()
    const isCurrentMonth = today.getMonth() === this._currentMonth && today.getFullYear() === this._currentYear

    for (let day = 1; day <= daysInMonth; day++) {
      const sessions = sessionMap[day] || []
      const isToday = isCurrentMonth && today.getDate() === day
      const hasSession = sessions.length > 0
      const totalMin = sessions.reduce((a, s) => a + (s.duration || 0), 0)
      const intensity = hasSession ? Math.min(Math.round((totalMin / 240) * 3), 3) : 0

      html += `
        <div class="calendar__cell ${isToday ? 'calendar__cell--today' : ''} ${hasSession ? 'calendar__cell--has-session' : ''}" data-day="${day}">
          <span class="calendar__day">${day}</span>
          ${hasSession ? `<div class="calendar__dot calendar__dot--${intensity}"></div>` : ''}
          ${hasSession ? `<span class="calendar__minutes">${this._fmtMin(totalMin)}</span>` : ''}
        </div>
      `
    }

    html += '</div>'
    grid.innerHTML = html

    grid.querySelectorAll('.calendar__cell[data-day]').forEach((cell) => {
      cell.addEventListener('click', () => {
        grid.querySelectorAll('.calendar__cell--selected').forEach((el) => el.classList.remove('calendar__cell--selected'))
        cell.classList.add('calendar__cell--selected')
        this._renderDayDetail(parseInt(cell.dataset.day, 10))
      })
    })
  }

  _renderLegend() {
    this._elements.legend.innerHTML = `
      <span class="text-xs text-tertiary">Intensidade:</span>
      <span class="calendar__dot calendar__dot--0"></span><span class="text-xs text-tertiary">Leve</span>
      <span class="calendar__dot calendar__dot--1"></span><span class="text-xs text-tertiary">Médio</span>
      <span class="calendar__dot calendar__dot--2"></span><span class="text-xs text-tertiary">Intenso</span>
      <span class="calendar__dot calendar__dot--3"></span><span class="text-xs text-tertiary">Muito intenso</span>
    `
  }

  _renderDayDetail(day) {
    const container = this._elements.daySessions
    if (!day) {
      this._elements.dayDetailTitle.textContent = 'Selecione um dia'
      container.innerHTML = '<div class="empty-state" style="padding:var(--space-8)"><p class="text-sm text-tertiary">Clique em um dia para ver os detalhes</p></div>'
      return
    }

    const dateStr = `${this._currentYear}-${String(this._currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const daySessions = this._sessions.filter((s) => s.date === dateStr)

    this._elements.dayDetailTitle.textContent = `Sessões — ${formatDate(dateStr)}`

    if (!daySessions.length) {
      container.innerHTML = '<div class="empty-state" style="padding:var(--space-8)"><div class="empty-state__icon" style="width:3rem;height:3rem">' + icons.empty + '</div><p class="text-sm text-tertiary">Nenhuma sessão neste dia</p></div>'
      return
    }

    container.innerHTML = daySessions.map((s) => {
      const subject = this._subjects.find((sub) => sub.id === s.subjectId)
      return `
        <div class="list-item" style="cursor:default">
          <span class="status-dot" style="background:${subject ? subject.color : '#a3a3a3'}"></span>
          <div class="list-item__content">
            <div class="list-item__title">${subject ? subject.name : 'Sem assunto'}</div>
            <div class="list-item__subtitle">${this._fmtMin(s.duration)} ${s.notes ? '· ' + s.notes : ''}</div>
          </div>
          <span class="badge badge--neutral">${this._fmtMin(s.duration)}</span>
        </div>
      `
    }).join('')
  }

  destroy() {
    if (this._unsubStorage) this._unsubStorage()
    this._elements = {}
    this._sessions = []
  }

  _fmtMin(minutes) {
    if (!minutes || minutes === 0) return '0min'
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h === 0) return `${m}min`
    if (m === 0) return `${h}h`
    return `${h}h${m}min`
  }
}
