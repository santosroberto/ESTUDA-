import { storageService } from './storage-service.js'
import { statsService } from './stats-service.js'
import { LS_KEYS, APP_NAME, GOAL_TYPE_LABELS, SESSION_CATEGORY_LABELS } from '../utils/constants.js'
import { formatDate } from '../utils/date-utils.js'

export class ExportService {
  generatePDF({ includeStudies, includeSessions, includeGoals, includeStats } = {}) {
    const { jsPDF } = window.jspdf
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const margin = 18
    const contentW = pageW - margin * 2
    const lineH = 6

    const primary = '#4f46e5'
    const gray = '#6b7280'
    const lightGray = '#f3f4f6'

    let y = margin

    const addHeader = () => {
      doc.setFillColor(primary)
      doc.rect(0, 0, pageW, 32, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(20)
      doc.setFont(undefined, 'bold')
      doc.text(APP_NAME, margin, 16)
      doc.setFontSize(9)
      doc.setFont(undefined, 'normal')
      doc.text(`Relatório gerado em ${formatDate(new Date().toISOString())}`, margin, 24)
    }

    const addSectionTitle = (title) => {
      if (y > 260) {
        doc.addPage()
        y = margin
      }
      y += 4
      doc.setFillColor(lightGray)
      doc.rect(margin, y, contentW, 10, 'F')
      doc.setTextColor(primary)
      doc.setFontSize(12)
      doc.setFont(undefined, 'bold')
      doc.text(title, margin + 3, y + 7)
      y += 14
    }

    const addBodyText = (label, value) => {
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      doc.setTextColor(gray)
      const labelW = doc.getTextWidth(label + ': ')
      doc.text(label + ': ', margin, y)
      doc.setTextColor(51, 51, 51)
      doc.setFont(undefined, 'bold')
      doc.text(String(value), margin + labelW, y)
      y += lineH
    }

    addHeader()
    y = 38

    if (includeStats) {
      addSectionTitle('Estatísticas Resumidas')
      const sessions = storageService.findAll(LS_KEYS.SESSIONS)
      const subjects = storageService.findAll(LS_KEYS.SUBJECTS)
      const goals = storageService.findAll(LS_KEYS.GOALS)
      const studies = storageService.findAll(LS_KEYS.STUDIES)

      const totalSessions = statsService.getTotalSessions(sessions)
      const totalHours = statsService.getTotalStudyHours(sessions)
      const streak = statsService.getStreak(sessions)
      const weeklyGoal = statsService.getWeeklyGoalProgress(sessions, goals)

      addBodyText('Total de sessões', totalSessions)
      addBodyText('Horas estudadas', `${totalHours}h`)
      addBodyText('Seqüência atual', `${streak} ${streak === 1 ? 'dia' : 'dias'}`)
      addBodyText('Meta semanal', `${weeklyGoal.percentage}% (${this._fmtMin(weeklyGoal.current)} / ${this._fmtMin(weeklyGoal.target)})`)
      addBodyText('Disciplinas', subjects.length)
      addBodyText('Materiais', studies.length)
    }

    if (includeStudies) {
      addSectionTitle('Materiais de Estudo')
      const studies = storageService.findAll(LS_KEYS.STUDIES)
      if (studies.length) {
        const rows = studies.map((s) => [
          this._trunc(s.title, 35),
          s.category,
          s.type,
          `${s.currentPages}/${s.totalPages}`,
          this._studyStatusLabel(s.status)
        ])
        doc.autoTable({
          startY: y,
          head: [['Título', 'Categoria', 'Tipo', 'Progresso', 'Status']],
          body: rows,
          margin: { left: margin, right: margin },
          headStyles: { fillColor: [79, 70, 229], fontSize: 8, halign: 'left' },
          bodyStyles: { fontSize: 7 },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 28 },
            2: { cellWidth: 20 },
            3: { cellWidth: 22 },
            4: { cellWidth: 22 }
          },
          theme: 'striped'
        })
        y = doc.lastAutoTable.finalY + 8
      } else {
        addBodyText('Nenhum material cadastrado.', '')
      }
    }

    if (includeSessions) {
      addSectionTitle('Sessões de Estudo')
      const sessions = storageService.findAll(LS_KEYS.SESSIONS)
      const subjects = storageService.findAll(LS_KEYS.SUBJECTS)
      if (sessions.length) {
        const sorted = [...sessions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        const rows = sorted.map((s) => {
          const subj = subjects.find((x) => x.id === s.subjectId)
          return [
            formatDate(s.date),
            subj ? subj.name : '—',
            this._fmtMin(s.duration),
            SESSION_CATEGORY_LABELS[s.category] || '—',
            this._trunc(s.notes || '', 30)
          ]
        })
        doc.autoTable({
          startY: y,
          head: [['Data', 'Disciplina', 'Duração', 'Categoria', 'Observações']],
          body: rows,
          margin: { left: margin, right: margin },
          headStyles: { fillColor: [79, 70, 229], fontSize: 8, halign: 'left' },
          bodyStyles: { fontSize: 7 },
          columnStyles: {
            0: { cellWidth: 24 },
            1: { cellWidth: 30 },
            2: { cellWidth: 18 },
            3: { cellWidth: 22 },
            4: { cellWidth: 58 }
          },
          theme: 'striped'
        })
        y = doc.lastAutoTable.finalY + 8
      } else {
        addBodyText('Nenhuma sessão registrada.', '')
      }
    }

    if (includeGoals) {
      addSectionTitle('Metas')
      const goals = storageService.findAll(LS_KEYS.GOALS)
      const sessions = storageService.findAll(LS_KEYS.SESSIONS)
      if (goals.length) {
        const enriched = statsService.getAllGoalsProgress(sessions, goals)
        const rows = enriched.map((g) => [
          GOAL_TYPE_LABELS[g.type] || g.type,
          g.period,
          this._fmtMin(g.target),
          this._fmtMin(g.current),
          `${g.percentage}%`
        ])
        doc.autoTable({
          startY: y,
          head: [['Tipo', 'Período', 'Previsto', 'Realizado', '%']],
          body: rows,
          margin: { left: margin, right: margin },
          headStyles: { fillColor: [79, 70, 229], fontSize: 8, halign: 'left' },
          bodyStyles: { fontSize: 7 },
          columnStyles: {
            0: { cellWidth: 24 },
            1: { cellWidth: 40 },
            2: { cellWidth: 24 },
            3: { cellWidth: 24 },
            4: { cellWidth: 20 }
          },
          theme: 'striped'
        })
        y = doc.lastAutoTable.finalY + 8
      } else {
        addBodyText('Nenhuma meta cadastrada.', '')
      }
    }

    if (y > 270) doc.addPage()
    doc.setFontSize(7)
    doc.setTextColor(gray)
    doc.text(`Gerado por ${APP_NAME} v1.0.0`, margin, doc.internal.pageSize.getHeight() - 10)

    doc.save(`${APP_NAME.toLowerCase().replace(/[^a-z]/g, '_')}_relatorio_${this._dateStamp()}.pdf`)
  }

  generateCSV({ includeStudies, includeSessions, includeGoals, includeStats } = {}) {
    const lines = []

    const sep = ';'
    const esc = (v) => {
      if (v == null) return ''
      const s = String(v)
      return s.includes(sep) || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
    }

    lines.push(`# ${APP_NAME} - Exportação de Dados`)
    lines.push(`# Gerado em: ${formatDate(new Date().toISOString())}`)
    lines.push('')

    if (includeStats) {
      const sessions = storageService.findAll(LS_KEYS.SESSIONS)
      const subjects = storageService.findAll(LS_KEYS.SUBJECTS)
      const goals = storageService.findAll(LS_KEYS.GOALS)
      const studies = storageService.findAll(LS_KEYS.STUDIES)

      lines.push('## Estatísticas Resumidas')
      lines.push(`Indicador${sep}Valor`)
      lines.push(`Total de sessões${sep}${statsService.getTotalSessions(sessions)}`)
      lines.push(`Horas estudadas${sep}${statsService.getTotalStudyHours(sessions)}h`)
      lines.push(`Seqüência atual${sep}${statsService.getStreak(sessions)} dias`)
      const wg = statsService.getWeeklyGoalProgress(sessions, goals)
      lines.push(`Meta semanal${sep}${wg.percentage}% (${this._fmtMin(wg.current)} / ${this._fmtMin(wg.target)})`)
      lines.push(`Disciplinas${sep}${subjects.length}`)
      lines.push(`Materiais${sep}${studies.length}`)
      lines.push('')
    }

    if (includeStudies) {
      const studies = storageService.findAll(LS_KEYS.STUDIES)
      lines.push('## Materiais de Estudo')
      lines.push(['Título', 'Categoria', 'Tipo', 'Páginas Atual', 'Páginas Total', 'Status', 'Observações'].map(esc).join(sep))
      studies.forEach((s) => {
        lines.push([s.title, s.category, s.type, s.currentPages, s.totalPages, this._studyStatusLabel(s.status), s.notes || ''].map(esc).join(sep))
      })
      lines.push('')
    }

    if (includeSessions) {
      const sessions = storageService.findAll(LS_KEYS.SESSIONS)
      const subjects = storageService.findAll(LS_KEYS.SUBJECTS)
      const sorted = [...sessions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      lines.push('## Sessões de Estudo')
      lines.push(['Data', 'Disciplina', 'Duração (min)', 'Categoria', 'Observações'].map(esc).join(sep))
      sorted.forEach((s) => {
        const subj = subjects.find((x) => x.id === s.subjectId)
        lines.push([
          s.date,
          subj ? subj.name : '—',
          s.duration || 0,
          SESSION_CATEGORY_LABELS[s.category] || '—',
          s.notes || ''
        ].map(esc).join(sep))
      })
      lines.push('')
    }

    if (includeGoals) {
      const goals = storageService.findAll(LS_KEYS.GOALS)
      const sessions = storageService.findAll(LS_KEYS.SESSIONS)
      const enriched = statsService.getAllGoalsProgress(sessions, goals)
      lines.push('## Metas')
      lines.push(['Tipo', 'Período', 'Previsto (min)', 'Realizado (min)', '%'].map(esc).join(sep))
      enriched.forEach((g) => {
        lines.push([
          GOAL_TYPE_LABELS[g.type] || g.type,
          g.period,
          g.target,
          g.current,
          `${g.percentage}%`
        ].map(esc).join(sep))
      })
      lines.push('')
    }

    const content = lines.join('\n')
    const bom = '\uFEFF'
    const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${APP_NAME.toLowerCase().replace(/[^a-z]/g, '_')}_dados_${this._dateStamp()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  _dateStamp() {
    const d = new Date()
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  }

  _fmtMin(minutes) {
    if (!minutes || minutes === 0) return '0min'
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h === 0) return `${m}min`
    if (m === 0) return `${h}h`
    return `${h}h${m}min`
  }

  _studyStatusLabel(status) {
    const labels = { pendente: 'Pendente', em_andamento: 'Em andamento', concluido: 'Concluído' }
    return labels[status] || status
  }

  _trunc(text, len) {
    if (!text) return ''
    return text.length > len ? text.slice(0, len) + '...' : text
  }
}

export const exportService = new ExportService()
