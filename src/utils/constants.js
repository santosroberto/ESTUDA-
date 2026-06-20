export const APP_NAME = 'Estuda+'
export const APP_VERSION = '1.0.0'
export const SCHEMA_VERSION = 1

export const LS_PREFIX = 'estudaplus_'

export const LS_KEYS = {
  SUBJECTS: `${LS_PREFIX}subjects`,
  SESSIONS: `${LS_PREFIX}sessions`,
  TASKS: `${LS_PREFIX}tasks`,
  GOALS: `${LS_PREFIX}goals`,
  SETTINGS: `${LS_PREFIX}settings`,
  STUDIES: `${LS_PREFIX}studies`,
  POMODORO_CYCLES: `${LS_PREFIX}pomodoro_cycles`,
  ACHIEVEMENTS: `${LS_PREFIX}achievements`,
  SCHEMA_VERSION: `${LS_PREFIX}schema_version`
}

export const ROUTES = {
  DASHBOARD: '/',
  STUDIES: '/estudos',
  SUBJECTS: '/disciplinas',
  SUBJECT_DETAIL: '/disciplinas/:id',
  STUDY_SESSION: '/estudar',
  TASKS: '/tarefas',
  CALENDAR: '/calendario',
  GOALS: '/metas',
  POMODORO: '/pomodoro',
  ACHIEVEMENTS: '/conquistas',
  EXPORT: '/exportar',
  REPORTS: '/relatorios',
  SETTINGS: '/configuracoes'
}

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
}

export const PRIORITIES = {
  LOW: 'baixa',
  MEDIUM: 'media',
  HIGH: 'alta'
}

export const TASK_STATUS = {
  PENDING: 'pendente',
  IN_PROGRESS: 'em_andamento',
  COMPLETED: 'concluida'
}

export const GOAL_TYPES = {
  WEEKLY: 'semanal',
  MONTHLY: 'mensal'
}

export const GOAL_TYPE_LABELS = {
  semanal: 'Semanal',
  mensal: 'Mensal'
}

export const STUDY_CATEGORIES = [
  'Programação',
  'Psicologia',
  'Teologia',
  'Desenvolvimento Pessoal',
  'Idiomas',
  'Outros'
]

export const STUDY_TYPES = ['Livro', 'Curso', 'Vídeo', 'PDF']

export const STUDY_STATUS = {
  PENDING: 'pendente',
  IN_PROGRESS: 'em_andamento',
  COMPLETED: 'concluido'
}

export const SESSION_CATEGORIES = [
  { value: 'estudo', label: 'Estudo' },
  { value: 'revisao', label: 'Revisão' },
  { value: 'exercicio', label: 'Exercício' },
  { value: 'leitura', label: 'Leitura' },
  { value: 'projeto', label: 'Projeto' }
]

export const SESSION_CATEGORY_LABELS = {
  estudo: 'Estudo',
  revisao: 'Revisão',
  exercicio: 'Exercício',
  leitura: 'Leitura',
  projeto: 'Projeto'
}

export const POMODORO = {
  DEFAULT_FOCUS: 25,
  DEFAULT_BREAK: 5,
  DEFAULT_LONG_BREAK: 15,
  SESSIONS_BEFORE_LONG_BREAK: 4
}

export const CHART_COLORS = [
  '#6366f1', '#0ea5e9', '#22c55e', '#f59e0b',
  '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6'
]

export const CHART_COLORS_ALPHA = CHART_COLORS.map((c) => c + '33')

export const ACHIEVEMENTS = [
  {
    id: 'first_session',
    title: 'Primeiro Estudo',
    desc: 'Complete sua primeira sessão de estudo',
    icon: 'star',
    category: 'sessions',
    check: (sessions) => sessions.length >= 1,
    progress: (sessions) => ({ current: Math.min(sessions.length, 1), max: 1 })
  },
  {
    id: 'hours_10',
    title: '10 Horas Estudadas',
    desc: 'Acumule 10 horas de estudo',
    icon: 'clock',
    category: 'hours',
    check: (sessions) => Math.floor(sessions.reduce((a, s) => a + (s.duration || 0), 0) / 60) >= 10,
    progress: (sessions) => {
      const hours = Math.floor(sessions.reduce((a, s) => a + (s.duration || 0), 0) / 60)
      return { current: Math.min(hours, 10), max: 10 }
    }
  },
  {
    id: 'hours_50',
    title: '50 Horas Estudadas',
    desc: 'Acumule 50 horas de estudo',
    icon: 'clock',
    category: 'hours',
    check: (sessions) => Math.floor(sessions.reduce((a, s) => a + (s.duration || 0), 0) / 60) >= 50,
    progress: (sessions) => {
      const hours = Math.floor(sessions.reduce((a, s) => a + (s.duration || 0), 0) / 60)
      return { current: Math.min(hours, 50), max: 50 }
    }
  },
  {
    id: 'hours_100',
    title: '100 Horas Estudadas',
    desc: 'Acumule 100 horas de estudo',
    icon: 'clock',
    category: 'hours',
    check: (sessions) => Math.floor(sessions.reduce((a, s) => a + (s.duration || 0), 0) / 60) >= 100,
    progress: (sessions) => {
      const hours = Math.floor(sessions.reduce((a, s) => a + (s.duration || 0), 0) / 60)
      return { current: Math.min(hours, 100), max: 100 }
    }
  },
  {
    id: 'streak_7',
    title: '7 Dias Consecutivos',
    desc: 'Estude por 7 dias seguidos',
    icon: 'fire',
    category: 'streak',
    check: (_sessions, streak) => streak >= 7,
    progress: (_sessions, streak) => ({ current: Math.min(streak, 7), max: 7 })
  },
  {
    id: 'streak_30',
    title: '30 Dias Consecutivos',
    desc: 'Estude por 30 dias seguidos',
    icon: 'fire',
    category: 'streak',
    check: (_sessions, streak) => streak >= 30,
    progress: (_sessions, streak) => ({ current: Math.min(streak, 30), max: 30 })
  },
  {
    id: 'first_book',
    title: 'Primeiro Livro',
    desc: 'Conclua seu primeiro livro de estudo',
    icon: 'book',
    category: 'studies',
    check: (_sessions, _streak, studies) => studies.filter((s) => s.type === 'Livro' && s.status === 'concluido').length >= 1,
    progress: (_sessions, _streak, studies) => {
      const done = studies.filter((s) => s.type === 'Livro' && s.status === 'concluido').length
      return { current: Math.min(done, 1), max: 1 }
    }
  },
  {
    id: 'first_course',
    title: 'Primeiro Curso',
    desc: 'Conclua seu primeiro curso',
    icon: 'award',
    category: 'studies',
    check: (_sessions, _streak, studies) => studies.filter((s) => s.type === 'Curso' && s.status === 'concluido').length >= 1,
    progress: (_sessions, _streak, studies) => {
      const done = studies.filter((s) => s.type === 'Curso' && s.status === 'concluido').length
      return { current: Math.min(done, 1), max: 1 }
    }
  }
]
