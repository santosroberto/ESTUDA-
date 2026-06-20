export const subjectSchema = {
  id: { type: 'string', required: true },
  name: { type: 'string', required: true, maxLength: 100 },
  color: { type: 'string', required: true, pattern: '^#[0-9a-fA-F]{6}$' },
  icon: { type: 'string', default: 'book' },
  workload: { type: 'number', default: 0 },
  createdAt: { type: 'string', required: true },
  updatedAt: { type: 'string', required: true }
}

export const sessionSchema = {
  id: { type: 'string', required: true },
  subjectId: { type: 'string', required: true },
  date: { type: 'string', required: true },
  startTime: { type: 'string', required: true },
  endTime: { type: 'string', default: null },
  duration: { type: 'number', default: 0 },
  category: { type: 'string', default: '' },
  notes: { type: 'string', default: '' },
  tags: { type: 'array', default: [] },
  createdAt: { type: 'string', required: true }
}

export const taskSchema = {
  id: { type: 'string', required: true },
  subjectId: { type: 'string', default: null },
  title: { type: 'string', required: true, maxLength: 200 },
  description: { type: 'string', default: '' },
  priority: { type: 'string', default: 'media', enum: ['baixa', 'media', 'alta'] },
  status: { type: 'string', default: 'pendente', enum: ['pendente', 'em_andamento', 'concluida'] },
  dueDate: { type: 'string', default: null },
  createdAt: { type: 'string', required: true },
  completedAt: { type: 'string', default: null }
}

export const goalSchema = {
  id: { type: 'string', required: true },
  subjectId: { type: 'string', default: null },
  type: { type: 'string', required: true, enum: ['semanal', 'mensal'] },
  target: { type: 'number', required: true },
  period: { type: 'string', required: true },
  createdAt: { type: 'string', required: true }
}

export const studySchema = {
  id: { type: 'string', required: true },
  title: { type: 'string', required: true, maxLength: 200 },
  category: { type: 'string', required: true, enum: ['Programação', 'Psicologia', 'Teologia', 'Desenvolvimento Pessoal', 'Idiomas', 'Outros'] },
  type: { type: 'string', required: true, enum: ['Livro', 'Curso', 'Vídeo', 'PDF'] },
  totalPages: { type: 'number', default: 0 },
  currentPages: { type: 'number', default: 0 },
  status: { type: 'string', default: 'pendente', enum: ['pendente', 'em_andamento', 'concluido'] },
  notes: { type: 'string', default: '' },
  createdAt: { type: 'string', required: true },
  updatedAt: { type: 'string', required: true }
}

export const pomodoroCycleSchema = {
  id: { type: 'string', required: true },
  subjectId: { type: 'string', default: null },
  duration: { type: 'number', required: true },
  completedAt: { type: 'string', required: true },
  type: { type: 'string', default: 'foco' }
}

export const achievementSchema = {
  id: { type: 'string', required: true },
  unlockedAt: { type: 'string', required: true }
}

export const settingsSchema = {
  theme: { type: 'string', default: 'light', enum: ['light', 'dark'] },
  pomodoroDuration: { type: 'number', default: 25 },
  breakDuration: { type: 'number', default: 5 },
  longBreakDuration: { type: 'number', default: 15 },
  sessionsBeforeLongBreak: { type: 'number', default: 4 },
  notifications: { type: 'boolean', default: true },
  weekStartDay: { type: 'number', default: 0 }
}

export const defaultSettings = {
  theme: 'light',
  pomodoroDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  notifications: true,
  weekStartDay: 0
}
