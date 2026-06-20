import { storageService } from '../services/storage-service.js'
import { statsService } from '../services/stats-service.js'
import { Card } from '../components/card.js'
import { Button } from '../components/button.js'
import { ChartWrapper } from '../components/chart.js'
import { eventBus } from '../utils/event-bus.js'
import { formatDate } from '../utils/date-utils.js'
import { LS_KEYS, ROUTES, CHART_COLORS, CHART_COLORS_ALPHA } from '../utils/constants.js'

const icons = {
  sessions: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  hours: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  target: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  streak: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
  activity: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  book: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  check: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  plus: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  empty: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  library: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`
}

export class DashboardPage {
  constructor() {
    this._charts = []
    this._cards = []
    this._progressBars = []
    this._unsubscribers = []
    this._elements = {}
  }

  async render() {
    const section = document.createElement('section')
    section.className = 'dashboard page'
    section.innerHTML = this._buildHTML()
    this._elements.section = section
    this._cacheElements()
    return section
  }

  _buildHTML() {
    return `
      <div class="page__header">
        <h1 class="page__title">Dashboard</h1>
        <div class="page__actions" id="dashboard-actions">
          <button class="btn btn--primary" id="btn-new-session">
            ${icons.plus} Novo Estudo
          </button>
        </div>
      </div>
      <div class="dashboard__stats" id="dashboard-stats">
        ${this._buildStatSkeleton()}
      </div>
      <div id="dashboard-progress"></div>
      <div class="dashboard__charts" id="dashboard-charts">
        <div id="chart-weekly" class="card"><div class="card__body"><div class="skeleton skeleton--card"></div></div></div>
        <div id="chart-subjects" class="card"><div class="card__body"><div class="skeleton skeleton--card"></div></div></div>
      </div>
      <div id="dashboard-recent"></div>
      <div id="dashboard-studies"></div>
    `
  }

  _buildStatSkeleton() {
    return Array(4).fill('').map(() => `
      <div class="card">
        <div class="stat">
          <div class="stat__label"><div class="skeleton skeleton--text" style="width:60%"></div></div>
          <div class="stat__value"><div class="skeleton skeleton--title" style="width:40%"></div></div>
        </div>
      </div>
    `).join('')
  }

  _cacheElements() {
    const s = this._elements.section
    this._elements.stats = s.querySelector('#dashboard-stats')
    this._elements.progress = s.querySelector('#dashboard-progress')
    this._elements.chartWeekly = s.querySelector('#chart-weekly')
    this._elements.chartSubjects = s.querySelector('#chart-subjects')
    this._elements.recent = s.querySelector('#dashboard-recent')
    this._elements.studies = s.querySelector('#dashboard-studies')
    this._elements.btnNewSession = s.querySelector('#btn-new-session')
  }

  async afterRender() {
    this._bindEvents()
    this._loadData()

    this._unsubscribers.push(
      eventBus.on('storage:change', () => this._loadData())
    )
  }

  _bindEvents() {
    const btn = this._elements.btnNewSession
    if (btn) {
      btn.addEventListener('click', () => {
        window.location.hash = ROUTES.STUDY_SESSION
      })
    }
  }

  _loadData() {
    this._destroyCharts()
    this._destroyCards()

    const subjects = storageService.findAll(LS_KEYS.SUBJECTS)
    const sessions = storageService.findAll(LS_KEYS.SESSIONS)
    const tasks = storageService.findAll(LS_KEYS.TASKS)
    const goals = storageService.findAll(LS_KEYS.GOALS)

    const studies = storageService.findAll(LS_KEYS.STUDIES)

    this._renderStats(sessions, subjects, goals)
    this._renderProgress(sessions, subjects)
    this._renderCharts(sessions, subjects)
    this._renderRecent(sessions, subjects)
    this._renderStudies(studies)
  }

  _renderStats(sessions, subjects, goals) {
    const totalSessions = statsService.getTotalSessions(sessions)
    const totalHours = statsService.getTotalStudyHours(sessions)
    const weekly = statsService.getWeeklyGoalProgress(sessions, goals)
    const streak = statsService.getStreak(sessions)

    const container = this._elements.stats
    if (!container) return

    container.innerHTML = `
      <div class="card card--interactive" data-stat="sessions">
        <div class="stat">
          <span class="stat__label">Total de Sessões</span>
          <span class="stat__value">${totalSessions}</span>
          <span class="stat__sublabel">sessões realizadas</span>
        </div>
      </div>
      <div class="card card--interactive" data-stat="hours">
        <div class="stat">
          <span class="stat__label">Horas Estudadas</span>
          <span class="stat__value">${totalHours}h</span>
          <span class="stat__sublabel">${this._formatTotalMinutes(statsService.getTotalStudyTime(sessions))}</span>
        </div>
      </div>
      <div class="card card--interactive" data-stat="goal">
        <div class="stat">
          <span class="stat__label">Meta Semanal</span>
          <span class="stat__value">${weekly.percentage}%</span>
          <span class="stat__sublabel">${this._formatGoal(weekly.current)} de ${this._formatGoal(weekly.target)}</span>
        </div>
      </div>
      <div class="card card--interactive" data-stat="streak">
        <div class="stat">
          <span class="stat__label">Dias Consecutivos</span>
          <span class="stat__value">${streak}</span>
          <span class="stat__sublabel">${streak === 1 ? 'dia' : 'dias'} seguidos</span>
        </div>
      </div>
    `

    container.querySelectorAll('[data-stat]').forEach((el) => {
      el.addEventListener('click', () => {
        const stat = el.dataset.stat
        const routes = {
          sessions: ROUTES.STUDY_SESSION,
          hours: ROUTES.REPORTS,
          goal: ROUTES.SETTINGS,
          streak: ROUTES.CALENDAR
        }
        if (routes[stat]) window.location.hash = routes[stat]
      })
    })
  }

  _renderProgress(sessions, subjects) {
    const container = this._elements.progress
    if (!container) return

    const percentage = statsService.getOverallProgress(subjects, sessions)
    const studiedCount = new Set(sessions.map((s) => s.subjectId)).size

    container.innerHTML = `
      <div class="card">
        <div class="card__header">
          <h3 class="card__title">Progresso Geral</h3>
          <span class="badge badge--${percentage >= 100 ? 'success' : percentage >= 50 ? 'primary' : 'neutral'}">
            ${percentage}%
          </span>
        </div>
        <div class="progress">
          <div class="progress__bar" style="height:0.625rem">
            <div class="progress__fill" style="width:${percentage}%"></div>
          </div>
        </div>
        <p class="text-sm text-secondary mt-2">
          ${studiedCount} de ${subjects.length || 0} matérias com atividade
          ${subjects.length > 0 ? `(${percentage}%)` : ''}
        </p>
      </div>
    `
  }

  _renderCharts(sessions, subjects) {
    this._destroyCharts()
    this._renderWeeklyChart(sessions)
    this._renderSubjectsChart(sessions, subjects)
  }

  _renderWeeklyChart(sessions) {
    const container = this._elements.chartWeekly
    if (!container) return

    const daily = statsService.getDailyActivity(sessions, 7)

    const card = new Card({ title: 'Horas Estudadas', subtitle: 'Últimos 7 dias' })
    const cardEl = card.render()
    this._cards.push(card)

    if (daily.every((d) => d.minutes === 0)) {
      card.setBody(`
        <div class="empty-state" style="padding:var(--space-8)">
          <div class="empty-state__icon" style="width:3rem;height:3rem;opacity:0.3">${icons.activity}</div>
          <p class="empty-state__title" style="font-size:var(--text-sm)">Nenhum estudo registrado</p>
          <p class="empty-state__desc" style="font-size:var(--text-xs)">Inicie uma sessão de estudo para ver o gráfico</p>
        </div>
      `)
    } else {
      const chart = new ChartWrapper({ type: 'bar' })
      const chartEl = chart.render()
      card.setBody(chartEl)

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
      const textColor = isDark ? '#a1a1a6' : '#737373'
      const gridColor = isDark ? '#2e2e2e' : '#e5e5e4'

      chart.create('bar', {
        labels: daily.map((d) => d.dayName),
        datasets: [{
          label: 'Minutos',
          data: daily.map((d) => d.minutes),
          backgroundColor: CHART_COLORS_ALPHA[0],
          borderColor: CHART_COLORS[0],
          borderWidth: 2,
          borderRadius: 4,
          barPercentage: 0.6
        }]
      }, {
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: { color: textColor, font: { size: 11 } }
          },
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { size: 11 } }
          }
        },
        plugins: {
          legend: { display: false }
        }
      })

      this._charts.push(chart)
    }

    container.innerHTML = ''
    container.appendChild(cardEl)
  }

  _renderSubjectsChart(sessions, subjects) {
    const container = this._elements.chartSubjects
    if (!container) return

    const distribution = statsService.getSubjectDistribution(sessions, subjects)

    const card = new Card({ title: 'Distribuição por Matéria', subtitle: 'Total de horas' })
    const cardEl = card.render()
    this._cards.push(card)

    if (!distribution.length) {
      card.setBody(`
        <div class="empty-state" style="padding:var(--space-8)">
          <div class="empty-state__icon" style="width:3rem;height:3rem;opacity:0.3">${icons.book}</div>
          <p class="empty-state__title" style="font-size:var(--text-sm)">Nenhuma matéria registrada</p>
          <p class="empty-state__desc" style="font-size:var(--text-xs)">Adicione matérias para ver a distribuição</p>
        </div>
      `)
    } else {
      const chart = new ChartWrapper({ type: 'doughnut' })
      const chartEl = chart.render()
      card.setBody(chartEl)

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
      const textColor = isDark ? '#a1a1a6' : '#737373'

      chart.create('doughnut', {
        labels: distribution.map((d) => d.subjectName),
        datasets: [{
          data: distribution.map((d) => d.minutes),
          backgroundColor: distribution.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
          borderWidth: 0
        }]
      }, {
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: textColor,
              padding: 12,
              boxWidth: 10,
              font: { size: 11 }
            }
          }
        }
      })

      this._charts.push(chart)
    }

    container.innerHTML = ''
    container.appendChild(cardEl)
  }

  _renderRecent(sessions, subjects) {
    const container = this._elements.recent
    if (!container) return

    const activities = statsService.getRecentActivities(sessions, subjects, 5)

    const card = new Card({ title: 'Atividades Recentes' })
    const cardEl = card.render()
    this._cards.push(card)

    if (!activities.length) {
      card.setBody(`
        <div class="empty-state" style="padding:var(--space-8)">
          <div class="empty-state__icon" style="width:3rem;height:3rem;opacity:0.3">${icons.empty}</div>
          <p class="empty-state__title" style="font-size:var(--text-sm)">Nenhuma atividade ainda</p>
          <p class="empty-state__desc" style="font-size:var(--text-xs)">Comece a estudar para ver seu histórico aqui</p>
          <div class="empty-state__action">
            <button class="btn btn--primary btn--sm" id="btn-empty-study">
              ${icons.plus} Iniciar Estudo
            </button>
          </div>
        </div>
      `)

      container.innerHTML = ''
      container.appendChild(cardEl)

      const emptyBtn = cardEl.querySelector('#btn-empty-study')
      if (emptyBtn) {
        emptyBtn.addEventListener('click', () => {
          window.location.hash = ROUTES.STUDY_SESSION
        })
      }

      return
    }

    const listHtml = activities.map((a) => `
      <div class="list-item">
        <span class="status-dot status-dot--primary" style="background:${a.subjectColor}"></span>
        <div class="list-item__content">
          <div class="list-item__title">${this._escapeHtml(a.subjectName)}</div>
          <div class="list-item__subtitle">
            ${icons.activity}
            ${formatDate(a.date)} — ${this._formatDuration(a.duration)}
            ${a.notes ? '· ' + this._escapeHtml(a.notes) : ''}
          </div>
        </div>
        <span class="badge badge--neutral text-xs">${this._formatDuration(a.duration)}</span>
      </div>
    `).join('')

    card.setBody(`<div class="list-group">${listHtml}</div>`)

    container.innerHTML = ''
    container.appendChild(cardEl)
  }

  _renderStudies(studies) {
    const container = this._elements.studies
    if (!container) return

    const total = statsService.getTotalStudies(studies)
    const completed = statsService.getCompletedStudies(studies)
    const inProgress = statsService.getInProgressStudies(studies)
    const progress = statsService.getOverallStudyProgress(studies)

    if (!total) {
      container.innerHTML = ''
      return
    }

    const recent = statsService.getRecentStudies(studies, 3)

    container.innerHTML = `
      <div class="section">
        <div class="section__header">
          <h2 class="section__title">${icons.library} Materiais de Estudo</h2>
          <a href="#${ROUTES.STUDIES}" class="btn btn--ghost btn--sm">Ver todos</a>
        </div>
        <div class="dashboard__stats" style="margin-bottom:var(--space-4)">
          <div class="card">
            <div class="stat">
              <span class="stat__label">Total</span>
              <span class="stat__value" style="font-size:var(--text-2xl)">${total}</span>
            </div>
          </div>
          <div class="card">
            <div class="stat">
              <span class="stat__label">Em Andamento</span>
              <span class="stat__value" style="font-size:var(--text-2xl);color:var(--color-primary)">${inProgress}</span>
            </div>
          </div>
          <div class="card">
            <div class="stat">
              <span class="stat__label">Concluídos</span>
              <span class="stat__value" style="font-size:var(--text-2xl);color:var(--color-success)">${completed}</span>
            </div>
          </div>
          <div class="card">
            <div class="stat">
              <span class="stat__label">Progresso Geral</span>
              <span class="stat__value" style="font-size:var(--text-2xl)">${progress}%</span>
            </div>
          </div>
        </div>
        <div class="progress">
          <div class="progress__bar" style="height:0.5rem">
            <div class="progress__fill ${progress >= 100 ? 'progress__fill--success' : ''}" style="width:${progress}%"></div>
          </div>
        </div>
        <div class="list-group mt-4">
          ${recent.map((s) => `
            <div class="list-item" style="cursor:default">
              <span class="status-dot status-dot--${s.status === 'concluido' ? 'success' : s.status === 'em_andamento' ? 'primary' : 'neutral'}"></span>
              <div class="list-item__content">
                <div class="list-item__title">${this._escapeHtml(s.title)}</div>
                <div class="list-item__subtitle">${s.category} · ${s.type} · ${s.currentPages}/${s.totalPages}</div>
              </div>
              <span class="badge badge--${s.status === 'concluido' ? 'success' : s.status === 'em_andamento' ? 'primary' : 'neutral'} badge--sm">
                ${s.status === 'concluido' ? 'Concluído' : s.status === 'em_andamento' ? 'Em andamento' : 'Pendente'}
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    `
  }

  _destroyCharts() {
    this._charts.forEach((c) => c.destroy())
    this._charts = []
  }

  _destroyCards() {
    this._cards.forEach((c) => c.destroy())
    this._cards = []
  }

  _unsubscribeAll() {
    this._unsubscribers.forEach((fn) => fn())
    this._unsubscribers = []
  }

  destroy() {
    this._destroyCharts()
    this._destroyCards()
    this._unsubscribeAll()
    this._elements = {}
  }

  _formatDuration(minutes) {
    if (!minutes || minutes === 0) return '0min'
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h === 0) return `${m}min`
    if (m === 0) return `${h}h`
    return `${h}h${m}min`
  }

  _formatTotalMinutes(minutes) {
    if (minutes < 60) return `${minutes} minutos`
    return `${Math.floor(minutes / 60)}h ${minutes % 60}min`
  }

  _formatGoal(minutes) {
    if (!minutes) return '0min'
    return this._formatDuration(minutes)
  }

  _escapeHtml(text) {
    if (!text) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}
