import { Router } from './router.js'
import { AppShell } from './components/app-shell.js'
import { DashboardPage } from './pages/dashboard.js'
import { SubjectsPage } from './pages/subjects.js'
import { SubjectDetailPage } from './pages/subject-detail.js'
import { StudySessionPage } from './pages/study-session.js'
import { TasksPage } from './pages/tasks.js'
import { CalendarPage } from './pages/calendar.js'
import { GoalsPage } from './pages/goals.js'
import { PomodoroPage } from './pages/pomodoro.js'
import { AchievementsPage } from './pages/achievements.js'
import { ExportPage } from './pages/export.js'
import { ReportsPage } from './pages/reports.js'
import { SettingsPage } from './pages/settings.js'
import { StudiesPage } from './pages/studies.js'
import { eventBus } from './utils/event-bus.js'
import { runMigrations } from './store/migrations.js'
import { storageService } from './services/storage-service.js'
import { achievementService } from './services/achievement-service.js'
import { ROUTES, APP_NAME, LS_KEYS, GOAL_TYPES, STUDY_CATEGORIES, STUDY_TYPES } from './utils/constants.js'
import { generateId } from './utils/id-generator.js'

class App {
  constructor() {
    this.router = null
    this.shell = null
    this._initialized = false
  }

  async init() {
    if (this._initialized) return
    this._initialized = true

    runMigrations()
    this._seedInitialData()

    this.shell = new AppShell()
    const appRoot = document.getElementById('app')
    appRoot.appendChild(this.shell.render())

    this.router = new Router()
    this._registerRoutes()
    this.router.setOnRouteChange((path, content) => {
      this.shell.setContent(content)
      if (this.shell.sidebar) {
        this.shell.sidebar.setActiveRoute(path)
      }
      if (this.shell.header) {
        this.shell.header.setTitle(this._getPageTitle(path))
      }
    })
    this.router.start()

    achievementService.autoCheck()

    this._registerServiceWorker()
    this._applyTheme()
  }

  _seedInitialData() {
    const existing = storageService.findAll(LS_KEYS.SUBJECTS)
    if (existing.length > 0) return

    const now = new Date()
    const isoNow = now.toISOString()

    const subjectNames = [
      { name: 'Matemática', color: '#6366f1', workload: 120 },
      { name: 'Português', color: '#0ea5e9', workload: 90 },
      { name: 'História', color: '#f59e0b', workload: 80 },
      { name: 'Física', color: '#22c55e', workload: 100 }
    ]

    const subjects = subjectNames.map((s) =>
      storageService.create(LS_KEYS.SUBJECTS, {
        name: s.name, color: s.color, icon: 'book', workload: s.workload
      })
    )

    const dayNames = ['2026-06-15', '2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19']

    const sessionData = [
      { subjectIdx: 0, date: '2026-06-15', duration: 45 },
      { subjectIdx: 1, date: '2026-06-15', duration: 50 },
      { subjectIdx: 2, date: '2026-06-16', duration: 35 },
      { subjectIdx: 3, date: '2026-06-16', duration: 40 },
      { subjectIdx: 0, date: '2026-06-17', duration: 55 },
      { subjectIdx: 1, date: '2026-06-17', duration: 30 },
      { subjectIdx: 2, date: '2026-06-18', duration: 60 },
      { subjectIdx: 3, date: '2026-06-18', duration: 25 },
      { subjectIdx: 0, date: '2026-06-19', duration: 40 },
      { subjectIdx: 1, date: '2026-06-19', duration: 35 }
    ]

    const sessions = sessionData.map((s) => {
      const startH = 14 + Math.floor(Math.random() * 4)
      const startM = Math.floor(Math.random() * 4) * 15
      return {
        subjectId: subjects[s.subjectIdx].id,
        date: s.date,
        startTime: `${s.date}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00`,
        endTime: `${s.date}T${String(startH).padStart(2, '0')}:${String(startM + s.duration).padStart(2, '0')}:00`,
        duration: s.duration,
        notes: '',
        tags: []
      }
    })

    sessions.forEach((s) => {
      storageService.create(LS_KEYS.SESSIONS, s)
    })

    const weekStart = new Date(now)
    const day = weekStart.getDay()
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
    weekStart.setDate(diff)
    weekStart.setHours(0, 0, 0, 0)

    const yearStart = new Date(weekStart.getFullYear(), 0, 1)
    const weekNum = Math.ceil(((weekStart - yearStart) / 86400000 + yearStart.getDay() + 1) / 7)
    const periodKey = `${weekStart.getFullYear()}-W${String(weekNum).padStart(2, '0')}`

    storageService.create(LS_KEYS.GOALS, {
      subjectId: null,
      type: GOAL_TYPES.WEEKLY,
      target: 300,
      period: periodKey
    })

    const monthPeriodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    storageService.create(LS_KEYS.GOALS, {
      subjectId: null,
      type: GOAL_TYPES.MONTHLY,
      target: 1200,
      period: monthPeriodKey
    })

    const studySeeds = [
      { title: 'JavaScript Eloquente', category: 'Programação', type: 'Livro', totalPages: 450, currentPages: 120, status: 'em_andamento', notes: 'Capítulos 1 a 6 concluídos' },
      { title: 'Curso de React Avançado', category: 'Programação', type: 'Curso', totalPages: 40, currentPages: 40, status: 'concluido', notes: 'Certificado emitido' },
      { title: 'Introdução à Psicologia', category: 'Psicologia', type: 'Livro', totalPages: 300, currentPages: 0, status: 'pendente', notes: '' },
      { title: 'Teologia Sistemática', category: 'Teologia', type: 'PDF', totalPages: 200, currentPages: 45, status: 'em_andamento', notes: 'Até o capítulo 3' },
      { title: 'Hábitos Atômicos', category: 'Desenvolvimento Pessoal', type: 'Livro', totalPages: 240, currentPages: 240, status: 'concluido', notes: 'Leitura finalizada em maio' },
      { title: 'Inglês para Devs', category: 'Idiomas', type: 'Curso', totalPages: 60, currentPages: 20, status: 'em_andamento', notes: 'Módulo 2 concluído' }
    ]

    studySeeds.forEach((s) => {
      storageService.create(LS_KEYS.STUDIES, s)
    })
  }

  _registerRoutes() {
    this.router.register(ROUTES.DASHBOARD, () => new DashboardPage())
    this.router.register(ROUTES.STUDIES, () => new StudiesPage())
    this.router.register(ROUTES.SUBJECTS, () => new SubjectsPage())
    this.router.register(ROUTES.SUBJECT_DETAIL, () => new SubjectDetailPage())
    this.router.register(ROUTES.STUDY_SESSION, () => new StudySessionPage())
    this.router.register(ROUTES.TASKS, () => new TasksPage())
    this.router.register(ROUTES.CALENDAR, () => new CalendarPage())
    this.router.register(ROUTES.GOALS, () => new GoalsPage())
    this.router.register(ROUTES.POMODORO, () => new PomodoroPage())
    this.router.register(ROUTES.ACHIEVEMENTS, () => new AchievementsPage())
    this.router.register(ROUTES.EXPORT, () => new ExportPage())
    this.router.register(ROUTES.REPORTS, () => new ReportsPage())
    this.router.register(ROUTES.SETTINGS, () => new SettingsPage())
  }

  _getPageTitle(path) {
    const titles = {
      [ROUTES.DASHBOARD]: 'Dashboard',
      [ROUTES.STUDIES]: 'Materiais de Estudo',
      [ROUTES.SUBJECTS]: 'Disciplinas',
      [ROUTES.STUDY_SESSION]: 'Estudar',
      [ROUTES.TASKS]: 'Tarefas',
      [ROUTES.CALENDAR]: 'Calendário',
      [ROUTES.GOALS]: 'Metas',
      [ROUTES.POMODORO]: 'Pomodoro',
      [ROUTES.ACHIEVEMENTS]: 'Conquistas',
      [ROUTES.EXPORT]: 'Exportar',
      [ROUTES.REPORTS]: 'Relatórios',
      [ROUTES.SETTINGS]: 'Configurações'
    }
    return titles[path] || 'Estuda+'
  }

  _registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.warn('Service Worker registration failed:', error)
      })
    }
  }

  _applyTheme() {
    const savedTheme = localStorage.getItem('estudaplus_theme') || 'light'
    document.documentElement.setAttribute('data-theme', savedTheme)
  }
}

window.addEventListener('unhandledrejection', (event) => {
  console.error('[App] Unhandled rejection:', event.reason)
})

const app = new App()

document.addEventListener('DOMContentLoaded', () => {
  app.init()
})
