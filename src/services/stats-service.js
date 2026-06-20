import { getWeekStart, getMonthStart, getMonthEnd, addDays, today } from '../utils/date-utils.js'

export class StatsService {
  getTotalSessions(sessions) {
    return sessions.length
  }

  getTotalStudyTime(sessions) {
    return sessions.reduce((acc, s) => acc + (s.duration || 0), 0)
  }

  getTotalStudyHours(sessions) {
    const minutes = this.getTotalStudyTime(sessions)
    return Math.round((minutes / 60) * 10) / 10
  }

  getWeeklyMinutes(sessions) {
    const weekStart = getWeekStart()
    const weekEnd = addDays(weekStart, 7)

    return sessions
      .filter((s) => {
        const d = new Date(s.date)
        return d >= weekStart && d < weekEnd
      })
      .reduce((acc, s) => acc + (s.duration || 0), 0)
  }

  getWeeklyGoalProgress(sessions, goals) {
    const weekStart = getWeekStart()
    const periodKey = this._getPeriodKey(weekStart)

    const weeklyGoal = goals.find(
      (g) => g.type === 'semanal' && g.period === periodKey
    )

    if (!weeklyGoal) return { current: 0, target: 0, percentage: 0 }

    const current = this.getWeeklyMinutes(sessions)
    const target = weeklyGoal.target
    const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0

    return { current, target, percentage }
  }

  getMonthlyMinutes(sessions) {
    const monthStart = getMonthStart()
    const monthEnd = getMonthEnd()
    const endOfMonth = addDays(monthEnd, 1)

    return sessions
      .filter((s) => {
        const d = new Date(s.date)
        return d >= monthStart && d < endOfMonth
      })
      .reduce((acc, s) => acc + (s.duration || 0), 0)
  }

  getMonthlyGoalProgress(sessions, goals) {
    const monthStart = getMonthStart()
    const periodKey = this._getMonthPeriodKey(monthStart)

    const monthlyGoal = goals.find(
      (g) => g.type === 'mensal' && g.period === periodKey
    )

    if (!monthlyGoal) return { current: 0, target: 0, percentage: 0 }

    const current = this.getMonthlyMinutes(sessions)
    const target = monthlyGoal.target
    const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0

    return { current, target, percentage }
  }

  getAllGoalsProgress(sessions, goals) {
    return goals.map((g) => {
      const current = g.type === 'semanal'
        ? this.getWeeklyMinutes(sessions)
        : this.getMonthlyMinutes(sessions)
      const target = g.target
      const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0
      return { ...g, current, percentage }
    }).sort((a, b) => {
      const order = { semanal: 0, mensal: 1 }
      return (order[a.type] || 0) - (order[b.type] || 0)
    })
  }

  getOverallProgress(subjects, sessions) {
    if (!subjects.length) return 0

    const subjectsWithActivity = new Set(sessions.map((s) => s.subjectId))
    return Math.round((subjectsWithActivity.size / subjects.length) * 100)
  }

  getStreak(sessions) {
    if (!sessions.length) return 0

    const studyDays = new Set(
      sessions.map((s) => s.date.split('T')[0])
    )

    let streak = 0
    let checkDate = today()

    while (studyDays.has(checkDate)) {
      streak++
      const d = new Date(checkDate)
      d.setDate(d.getDate() - 1)
      checkDate = d.toISOString().split('T')[0]
    }

    return streak
  }

  getRecentActivities(sessions, subjects, limit = 5) {
    const sorted = [...sessions].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )

    return sorted.slice(0, limit).map((s) => {
      const subject = subjects.find((sub) => sub.id === s.subjectId)
      return {
        ...s,
        subjectName: subject ? subject.name : 'Sem matéria',
        subjectColor: subject ? subject.color : '#a3a3a3'
      }
    })
  }

  getDailyActivity(sessions, days = 7) {
    const result = []
    const todayDate = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = addDays(todayDate, -i)
      const dateStr = date.toISOString().split('T')[0]

      const dayMinutes = sessions
        .filter((s) => {
          const sDate = s.date.split('T')[0]
          return sDate === dateStr
        })
        .reduce((acc, s) => acc + (s.duration || 0), 0)

      result.push({
        date: dateStr,
        dayName: this._getDayLabel(date, i),
        minutes: dayMinutes,
        hours: Math.round((dayMinutes / 60) * 10) / 10
      })
    }

    return result
  }

  getSubjectDistribution(sessions, subjects) {
    const grouped = {}
    const totalMinutes = this.getTotalStudyTime(sessions)

    sessions.forEach((s) => {
      const id = s.subjectId
      if (!grouped[id]) grouped[id] = 0
      grouped[id] += s.duration || 0
    })

    return Object.entries(grouped)
      .map(([subjectId, minutes]) => {
        const subject = subjects.find((sub) => sub.id === subjectId)
        return {
          subjectId,
          subjectName: subject ? subject.name : 'Sem matéria',
          color: subject ? subject.color : '#a3a3a3',
          minutes,
          percentage: totalMinutes > 0
            ? Math.round((minutes / totalMinutes) * 100)
            : 0
        }
      })
      .sort((a, b) => b.minutes - a.minutes)
  }

  getCategoryActivity(sessions) {
    const categories = {}
    sessions.forEach((s) => {
      const cat = s.category || 'sem_categoria'
      if (!categories[cat]) categories[cat] = 0
      categories[cat] += s.duration || 0
    })
    return Object.entries(categories)
      .map(([category, minutes]) => ({ category, minutes }))
      .sort((a, b) => b.minutes - a.minutes)
  }

  getWeeklyActivity(sessions, weeksCount = 8) {
    const result = []
    const todayDate = new Date()
    for (let i = weeksCount - 1; i >= 0; i--) {
      const weekStart = new Date(todayDate)
      weekStart.setDate(todayDate.getDate() - todayDate.getDay() + 1 - i * 7)
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = addDays(weekStart, 7)

      const minutes = sessions
        .filter((s) => {
          const d = new Date(s.date)
          return d >= weekStart && d < weekEnd
        })
        .reduce((acc, s) => acc + (s.duration || 0), 0)

      const label = weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      result.push({ label, minutes, hours: Math.round((minutes / 60) * 10) / 10 })
    }
    return result
  }

  getMonthlyActivity(sessions, monthsCount = 6) {
    const result = []
    const todayDate = new Date()

    for (let i = monthsCount - 1; i >= 0; i--) {
      const m = new Date(todayDate.getFullYear(), todayDate.getMonth() - i, 1)
      const monthEnd = new Date(m.getFullYear(), m.getMonth() + 1, 0)
      const endOfMonth = addDays(monthEnd, 1)

      const minutes = sessions
        .filter((s) => {
          const d = new Date(s.date)
          return d >= m && d < endOfMonth
        })
        .reduce((acc, s) => acc + (s.duration || 0), 0)

      const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
      result.push({ label: names[m.getMonth()], minutes, hours: Math.round((minutes / 60) * 10) / 10 })
    }
    return result
  }

  getTotalStudies(studies) {
    return studies.length
  }

  getStudiesByStatus(studies, status) {
    return studies.filter((s) => s.status === status).length
  }

  getCompletedStudies(studies) {
    return this.getStudiesByStatus(studies, 'concluido')
  }

  getInProgressStudies(studies) {
    return this.getStudiesByStatus(studies, 'em_andamento')
  }

  getPendingStudies(studies) {
    return this.getStudiesByStatus(studies, 'pendente')
  }

  getOverallStudyProgress(studies) {
    const total = studies.reduce((acc, s) => acc + (s.totalPages || 0), 0)
    const current = studies.reduce((acc, s) => acc + (s.currentPages || 0), 0)
    if (total === 0) return 0
    return Math.min(Math.round((current / total) * 100), 100)
  }

  getRecentStudies(studies, limit = 3) {
    return [...studies]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, limit)
  }

  _getMonthPeriodKey(date) {
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  _getPeriodKey(date) {
    const d = new Date(date)
    const year = d.getFullYear()
    const janFirst = new Date(year, 0, 1)
    const days = Math.floor((d - janFirst) / (24 * 60 * 60 * 1000))
    const week = Math.ceil((days + janFirst.getDay() + 1) / 7)
    return `${year}-W${String(week).padStart(2, '0')}`
  }

  _getDayLabel(date, daysAgo) {
    if (daysAgo === 0) return 'Hoje'
    if (daysAgo === 1) return 'Ontem'
    const names = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    return names[date.getDay()]
  }
}

export const statsService = new StatsService()
