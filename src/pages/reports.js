import { storageService } from '../services/storage-service.js'
import { statsService } from '../services/stats-service.js'
import { Card } from '../components/card.js'
import { ChartWrapper } from '../components/chart.js'
import { eventBus } from '../utils/event-bus.js'
import { LS_KEYS, CHART_COLORS, SESSION_CATEGORY_LABELS } from '../utils/constants.js'

const icons = {
  category: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  weekly: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  trend: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  studies: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  target: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  empty: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
}

export class ReportsPage {
  constructor() {
    this._chartInstances = []
    this._cards = []
    this._elements = {}
    this._unsubStorage = null
    this._sessions = []
    this._subjects = []
    this._studies = []
    this._goals = []
  }

  async render() {
    const section = document.createElement('section')
    section.className = 'reports page'
    section.innerHTML = this._buildHTML()
    this._elements.section = section
    this._cacheElements()
    return section
  }

  _buildHTML() {
    return `
      <div class="page__header">
        <h1 class="page__title">Estatísticas</h1>
      </div>

      <div id="reports-grid" class="reports__grid">
        <div id="chart-category" class="card"><div class="card__body"><div class="skeleton skeleton--card" style="height:16rem"></div></div></div>
        <div id="chart-weekly-hours" class="card"><div class="card__body"><div class="skeleton skeleton--card" style="height:16rem"></div></div></div>
        <div id="chart-monthly" class="card"><div class="card__body"><div class="skeleton skeleton--card" style="height:16rem"></div></div></div>
        <div id="chart-studies" class="card"><div class="card__body"><div class="skeleton skeleton--card" style="height:16rem"></div></div></div>
        <div id="chart-goals" class="card"><div class="card__body"><div class="skeleton skeleton--card" style="height:16rem"></div></div></div>
      </div>
    `
  }

  _cacheElements() {
    const s = this._elements.section
    this._elements.grid = s.querySelector('#reports-grid')
    this._elements.chartCategory = s.querySelector('#chart-category')
    this._elements.chartWeekly = s.querySelector('#chart-weekly-hours')
    this._elements.chartMonthly = s.querySelector('#chart-monthly')
    this._elements.chartStudies = s.querySelector('#chart-studies')
    this._elements.chartGoals = s.querySelector('#chart-goals')
  }

  async afterRender() {
    this._loadData()

    this._unsubStorage = eventBus.on('storage:change', () => {
      this._loadData()
    })

    const obs = new ResizeObserver(() => {
      this._chartInstances.forEach((c) => c.resize())
    })
    obs.observe(this._elements.grid)
    this._resizeObserver = obs
  }

  _loadData() {
    this._sessions = storageService.findAll(LS_KEYS.SESSIONS)
    this._subjects = storageService.findAll(LS_KEYS.SUBJECTS)
    this._studies = storageService.findAll(LS_KEYS.STUDIES)
    this._goals = storageService.findAll(LS_KEYS.GOALS)

    this._destroyCharts()
    this._renderCategoryChart()
    this._renderWeeklyChart()
    this._renderMonthlyChart()
    this._renderStudiesChart()
    this._renderGoalsChart()
  }

  _renderCategoryChart() {
    const container = this._elements.chartCategory
    if (!container) return

    const data = statsService.getCategoryActivity(this._sessions)
    const totalMinutes = data.reduce((a, d) => a + d.minutes, 0)

    const card = new Card({ title: 'Horas por Categoria', subtitle: 'Distribuição por tipo de estudo' })
    this._cards.push(card)

    if (!data.length || totalMinutes === 0) {
      card.setBody(this._emptyEl('Nenhuma sessão registrada', 'Registre sessões com categorias para ver a distribuição.'))
      this._mountCard(container, card)
      return
    }

    const catColors = {
      estudo: '#6366f1',
      revisao: '#0ea5e9',
      exercicio: '#22c55e',
      leitura: '#f59e0b',
      projeto: '#ef4444',
      sem_categoria: '#a3a3a3'
    }

    const labels = data.map((d) => SESSION_CATEGORY_LABELS[d.category] || (d.category === 'sem_categoria' ? 'Sem categoria' : d.category))
    const values = data.map((d) => Math.round((d.minutes / 60) * 10) / 10)
    const colors = data.map((d) => catColors[d.category] || '#a3a3a3')

    const chartEl = this._createChart(container, 'doughnut', {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderWidth: 0
      }]
    }, {
      cutout: '55%',
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12, font: { size: 11 } } }
      }
    })

    card.setBody(chartEl)
    this._mountCard(container, card)
  }

  _renderWeeklyChart() {
    const container = this._elements.chartWeekly
    if (!container) return

    const data = statsService.getWeeklyActivity(this._sessions, 8)

    const card = new Card({ title: 'Horas por Semana', subtitle: 'Últimas 8 semanas' })
    this._cards.push(card)

    if (!data.length || data.every((d) => d.minutes === 0)) {
      card.setBody(this._emptyEl('Nenhum dado semanal', 'Estude ao longo das semanas para ver o gráfico.'))
      this._mountCard(container, card)
      return
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    const textColor = isDark ? '#a1a1a6' : '#737373'
    const gridColor = isDark ? '#2e2e2e' : '#e5e5e4'

    const chartEl = this._createChart(container, 'bar', {
      labels: data.map((d) => d.label),
      datasets: [{
        label: 'Horas',
        data: data.map((d) => d.hours),
        backgroundColor: CHART_COLORS.map((c) => c + '33'),
        borderColor: CHART_COLORS[0],
        borderWidth: 2,
        borderRadius: 4,
        barPercentage: 0.6
      }]
    }, {
      scales: {
        y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
        x: { grid: { display: false }, ticks: { color: textColor, font: { size: 11 } } }
      },
      plugins: { legend: { display: false } }
    })

    card.setBody(chartEl)
    this._mountCard(container, card)
  }

  _renderMonthlyChart() {
    const container = this._elements.chartMonthly
    if (!container) return

    const data = statsService.getMonthlyActivity(this._sessions, 6)

    const card = new Card({ title: 'Evolução Mensal', subtitle: 'Últimos 6 meses' })
    this._cards.push(card)

    if (!data.length || data.every((d) => d.minutes === 0)) {
      card.setBody(this._emptyEl('Nenhum dado mensal', 'Estude ao longo dos meses para ver a evolução.'))
      this._mountCard(container, card)
      return
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    const textColor = isDark ? '#a1a1a6' : '#737373'
    const gridColor = isDark ? '#2e2e2e' : '#e5e5e4'

    const chartEl = this._createChart(container, 'line', {
      labels: data.map((d) => d.label),
      datasets: [{
        label: 'Horas',
        data: data.map((d) => d.hours),
        borderColor: CHART_COLORS[1],
        backgroundColor: CHART_COLORS[1] + '1a',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: CHART_COLORS[1],
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2
      }]
    }, {
      scales: {
        y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
        x: { grid: { display: false }, ticks: { color: textColor, font: { size: 11 } } }
      },
      plugins: { legend: { display: false } }
    })

    card.setBody(chartEl)
    this._mountCard(container, card)
  }

  _renderStudiesChart() {
    const container = this._elements.chartStudies
    if (!container) return

    const total = statsService.getTotalStudies(this._studies)
    const completed = statsService.getCompletedStudies(this._studies)
    const inProgress = statsService.getInProgressStudies(this._studies)
    const pending = statsService.getPendingStudies(this._studies)
    const progress = statsService.getOverallStudyProgress(this._studies)

    const card = new Card({ title: 'Estudos Concluídos', subtitle: 'Progresso dos materiais de estudo' })
    this._cards.push(card)

    if (!total) {
      card.setBody(this._emptyEl('Nenhum material cadastrado', 'Adicione materiais de estudo para ver o progresso.'))
      this._mountCard(container, card)
      return
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    const textColor = isDark ? '#a1a1a6' : '#737373'

    const chartEl = this._createChart(container, 'bar', {
      labels: ['Pendente', 'Em Andamento', 'Concluído'],
      datasets: [{
        label: 'Materiais',
        data: [pending, inProgress, completed],
        backgroundColor: ['#f59e0b33', '#6366f133', '#22c55e33'],
        borderColor: ['#f59e0b', '#6366f1', '#22c55e'],
        borderWidth: 2,
        borderRadius: 4,
        barPercentage: 0.5
      }]
    }, {
      indexAxis: 'y',
      scales: {
        x: { beginAtZero: true, ticks: { color: textColor, stepSize: 1, font: { size: 11 } }, grid: { color: isDark ? '#2e2e2e' : '#e5e5e4' } },
        y: { grid: { display: false }, ticks: { color: textColor, font: { size: 11 } } }
      },
      plugins: { legend: { display: false } }
    })

    const body = document.createElement('div')
    body.appendChild(chartEl)
    body.insertAdjacentHTML('beforeend', `
      <div style="display:flex;justify-content:space-around;padding:var(--space-4) 0 0;border-top:1px solid var(--color-divider);margin-top:var(--space-4);text-align:center;gap:var(--space-2)">
        <div>
          <div style="font-size:var(--text-lg);font-weight:var(--font-bold);color:var(--color-text)">${total}</div>
          <div style="font-size:var(--text-xs);color:var(--color-text-tertiary)">Total</div>
        </div>
        <div>
          <div style="font-size:var(--text-lg);font-weight:var(--font-bold);color:var(--color-primary)">${inProgress}</div>
          <div style="font-size:var(--text-xs);color:var(--color-text-tertiary)">Em andamento</div>
        </div>
        <div>
          <div style="font-size:var(--text-lg);font-weight:var(--font-bold);color:var(--color-success)">${completed}</div>
          <div style="font-size:var(--text-xs);color:var(--color-text-tertiary)">Concluídos</div>
        </div>
        <div>
          <div style="font-size:var(--text-lg);font-weight:var(--font-bold);color:var(--color-text)">${progress}%</div>
          <div style="font-size:var(--text-xs);color:var(--color-text-tertiary)">Progresso</div>
        </div>
      </div>
    `)

    card.setBody(body)
    this._mountCard(container, card)
  }

  _renderGoalsChart() {
    const container = this._elements.chartGoals
    if (!container) return

    const enriched = statsService.getAllGoalsProgress(this._sessions, this._goals)

    const card = new Card({ title: 'Progresso das Metas', subtitle: 'Acompanhamento semanal e mensal' })
    this._cards.push(card)

    if (!enriched.length) {
      card.setBody(this._emptyEl('Nenhuma meta criada', 'Crie metas para acompanhar seu progresso.'))
      this._mountCard(container, card)
      return
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    const textColor = isDark ? '#a1a1a6' : '#737373'
    const gridColor = isDark ? '#2e2e2e' : '#e5e5e4'

    const typeOrder = { semanal: 0, mensal: 1 }
    const sorted = [...enriched].sort((a, b) => (typeOrder[a.type] || 0) - (typeOrder[b.type] || 0))

    const labels = sorted.map((g) => g.type === 'semanal' ? 'Semanal' : 'Mensal')
    const currentHours = sorted.map((g) => Math.round((g.current / 60) * 10) / 10)
    const targetHours = sorted.map((g) => Math.round((g.target / 60) * 10) / 10)

    const chartEl = this._createChart(container, 'bar', {
      labels,
      datasets: [
        {
          label: 'Realizado',
          data: currentHours,
          backgroundColor: '#22c55e33',
          borderColor: '#22c55e',
          borderWidth: 2,
          borderRadius: 4,
          barPercentage: 0.7
        },
        {
          label: 'Previsto',
          data: targetHours,
          backgroundColor: '#6366f133',
          borderColor: '#6366f1',
          borderWidth: 2,
          borderRadius: 4,
          barPercentage: 0.7
        }
      ]
    }, {
      scales: {
        y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
        x: { grid: { display: false }, ticks: { color: textColor, font: { size: 11 } } }
      },
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12, font: { size: 11 }, color: textColor } }
      }
    })

    const body = document.createElement('div')
    body.appendChild(chartEl)

    body.insertAdjacentHTML('beforeend', `
      <div style="display:flex;flex-direction:column;gap:var(--space-3);padding-top:var(--space-4);margin-top:var(--space-4);border-top:1px solid var(--color-divider)">
        ${sorted.map((g) => {
          const pct = g.percentage
          const barColor = pct >= 100 ? 'var(--color-success)' : pct >= 50 ? 'var(--color-primary)' : 'var(--color-warning)'
          return `
            <div>
              <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);margin-bottom:var(--space-1)">
                <span style="color:var(--color-text)">${g.type === 'semanal' ? 'Semanal' : 'Mensal'} ${g.subjectId ? '· ' + (this._subjects.find(s => s.id === g.subjectId)?.name || '') : ''}</span>
                <span style="color:var(--color-text-secondary);font-weight:var(--font-medium)">${this._formatMinutes(g.current)} / ${this._formatMinutes(g.target)} (${pct}%)</span>
              </div>
              <div class="progress"><div class="progress__bar" style="height:0.5rem"><div class="progress__fill" style="width:${pct}%;background:${barColor}"></div></div></div>
            </div>
          `
        }).join('')}
      </div>
    `)

    card.setBody(body)
    this._mountCard(container, card)
  }

  _createChart(container, type, data, options = {}) {
    const chart = new ChartWrapper()
    const chartEl = chart.render()
    chart.create(type, data, options)
    this._chartInstances.push(chart)
    return chartEl
  }

  _mountCard(container, card) {
    container.innerHTML = ''
    container.appendChild(card.render())
  }

  _emptyEl(title, desc) {
    const div = document.createElement('div')
    div.className = 'empty-state'
    div.style.padding = 'var(--space-8)'
    div.innerHTML = `
      <div class="empty-state__icon" style="width:3rem;height:3rem;opacity:0.3">${icons.empty}</div>
      <p class="empty-state__title" style="font-size:var(--text-sm)">${title}</p>
      <p class="empty-state__desc" style="font-size:var(--text-xs)">${desc}</p>
    `
    return div
  }

  _destroyCharts() {
    this._chartInstances.forEach((c) => c.destroy())
    this._chartInstances = []
    this._cards.forEach((c) => c.destroy())
    this._cards = []
  }

  destroy() {
    if (this._unsubStorage) this._unsubStorage()
    if (this._resizeObserver) this._resizeObserver.disconnect()
    this._destroyCharts()
    this._elements = {}
    this._sessions = []
    this._subjects = []
    this._studies = []
    this._goals = []
  }

  _formatMinutes(minutes) {
    if (!minutes || minutes === 0) return '0min'
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h === 0) return `${m}min`
    if (m === 0) return `${h}h`
    return `${h}h${m}min`
  }
}
