import { storageService } from '../services/storage-service.js'
import { eventBus } from '../utils/event-bus.js'
import { LS_KEYS, SESSION_CATEGORIES, SESSION_CATEGORY_LABELS } from '../utils/constants.js'
import { today, now, formatDate, formatTime } from '../utils/date-utils.js'

const icons = {
  plus: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  edit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  clock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  filter: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
  empty: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
}

export class StudySessionPage {
  constructor() {
    this._elements = {}
    this._sessions = []
    this._subjects = []
    this._filteredSessions = []
    this._filters = { subjectId: '', period: 'all' }
    this._editingId = null
    this._formListeners = []
    this._unsubStorage = null
  }

  async render() {
    const section = document.createElement('section')
    section.className = 'session page'
    section.innerHTML = this._buildHTML()
    this._elements.section = section
    this._cacheElements()
    return section
  }

  _buildHTML() {
    return `
      <div class="page__header">
        <h1 class="page__title">Sessões de Estudo</h1>
      </div>

      <div class="card session__form-card" id="session-form-card">
        <div class="card__header">
          <h3 class="card__title" id="form-title">${icons.clock} Nova Sessão</h3>
        </div>
        <form id="session-form" class="session__form" novalidate>
          <div class="session__form-row">
            <div class="form-field">
              <label class="form-field__label form-field__label--required" for="f-date">Data</label>
              <input type="date" class="input" id="f-date" required>
            </div>
            <div class="form-field">
              <label class="form-field__label form-field__label--required" for="f-time">Horário</label>
              <input type="time" class="input" id="f-time" required>
            </div>
          </div>
          <div class="session__form-row">
            <div class="form-field">
              <label class="form-field__label form-field__label--required" for="f-subject">Assunto</label>
              <select class="input" id="f-subject" required>
                <option value="">Selecione...</option>
              </select>
              <span class="form-field__error" id="f-subject-error"></span>
            </div>
            <div class="form-field">
              <label class="form-field__label" for="f-category">Categoria</label>
              <select class="input" id="f-category">
                <option value="">Nenhuma</option>
                ${SESSION_CATEGORIES.map((c) => `<option value="${c.value}">${c.label}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="session__form-row">
            <div class="form-field">
              <label class="form-field__label form-field__label--required" for="f-duration">Duração (minutos)</label>
              <input type="number" class="input" id="f-duration" required min="1" max="1440" placeholder="Ex: 45">
              <span class="form-field__error" id="f-duration-error"></span>
            </div>
            <div class="form-field" style="justify-content:flex-end">
              <label class="form-field__label">&nbsp;</label>
              <button type="submit" class="btn btn--primary" id="btn-submit">
                ${icons.plus} Registrar
              </button>
            </div>
          </div>
          <div class="form-field">
            <label class="form-field__label" for="f-notes">Observações</label>
            <textarea class="input" id="f-notes" rows="2" placeholder="O que estudou hoje?..."></textarea>
          </div>
        </form>
      </div>

      <div class="section">
        <div class="section__header">
          <h2 class="section__title">Histórico</h2>
          <div class="session__filter-group">
            <select class="input input--sm" id="filter-subject">
              <option value="">Todos os assuntos</option>
            </select>
            <select class="input input--sm" id="filter-period">
              <option value="all">Todo período</option>
              <option value="today">Hoje</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mês</option>
            </select>
          </div>
        </div>
        <div id="session-history" class="session__history">
          <div class="skeleton skeleton--card" style="height:4rem"></div>
          <div class="skeleton skeleton--card" style="height:4rem"></div>
          <div class="skeleton skeleton--card" style="height:4rem"></div>
        </div>
      </div>

      <div class="modal-overlay" id="edit-modal">
        <div class="modal modal--sm">
          <div class="modal__header">
            <h2 class="modal__title">Editar Sessão</h2>
            <button class="modal__close" id="edit-close">${icons.close}</button>
          </div>
          <div class="modal__body" id="edit-modal-body"></div>
        </div>
      </div>

      <div class="modal-overlay" id="delete-modal">
        <div class="modal modal--sm">
          <div class="modal__header">
            <h2 class="modal__title">Confirmar Exclusão</h2>
            <button class="modal__close" id="delete-close">${icons.close}</button>
          </div>
          <div class="modal__body">
            <p class="text-sm text-secondary">Tem certeza que deseja excluir esta sessão?</p>
            <p class="text-xs text-tertiary mt-2" id="delete-details"></p>
          </div>
          <div class="modal__footer">
            <button class="btn btn--secondary" id="delete-cancel">Cancelar</button>
            <button class="btn btn--danger" id="delete-confirm">Excluir</button>
          </div>
        </div>
      </div>
    `
  }

  _cacheElements() {
    const s = this._elements.section
    this._elements.form = s.querySelector('#session-form')
    this._elements.formCard = s.querySelector('#session-form-card')
    this._elements.formTitle = s.querySelector('#form-title')
    this._elements.fDate = s.querySelector('#f-date')
    this._elements.fTime = s.querySelector('#f-time')
    this._elements.fSubject = s.querySelector('#f-subject')
    this._elements.fCategory = s.querySelector('#f-category')
    this._elements.fDuration = s.querySelector('#f-duration')
    this._elements.fNotes = s.querySelector('#f-notes')
    this._elements.btnSubmit = s.querySelector('#btn-submit')
    this._elements.subjectError = s.querySelector('#f-subject-error')
    this._elements.durationError = s.querySelector('#f-duration-error')
    this._elements.history = s.querySelector('#session-history')
    this._elements.filterSubject = s.querySelector('#filter-subject')
    this._elements.filterPeriod = s.querySelector('#filter-period')
    this._elements.editModal = s.querySelector('#edit-modal')
    this._elements.editModalBody = s.querySelector('#edit-modal-body')
    this._elements.editClose = s.querySelector('#edit-close')
    this._elements.deleteModal = s.querySelector('#delete-modal')
    this._elements.deleteDetails = s.querySelector('#delete-details')
    this._elements.deleteConfirm = s.querySelector('#delete-confirm')
    this._elements.deleteCancel = s.querySelector('#delete-cancel')
    this._elements.deleteClose = s.querySelector('#delete-close')
  }

  async afterRender() {
    this._subjects = storageService.findAll(LS_KEYS.SUBJECTS)
    this._populateSubjectDropdowns()
    this._setDefaultDateTime()
    this._bindEvents()
    this._loadData()

    this._unsubStorage = eventBus.on('storage:change', () => {
      this._subjects = storageService.findAll(LS_KEYS.SUBJECTS)
      this._populateSubjectDropdowns()
      this._loadData()
    })
  }

  _populateSubjectDropdowns() {
    const renderOptions = (select) => {
      const current = select.value
      const allOption = select === this._elements.filterSubject
        ? '<option value="">Todos os assuntos</option>'
        : '<option value="">Selecione...</option>'
      select.innerHTML = allOption + this._subjects
        .map((s) => `<option value="${s.id}" ${s.id === current ? 'selected' : ''}>${s.name}</option>`)
        .join('')
    }
    renderOptions(this._elements.fSubject)
    renderOptions(this._elements.filterSubject)
  }

  _setDefaultDateTime() {
    this._elements.fDate.value = today()
    const h = String(new Date().getHours()).padStart(2, '0')
    const m = String(new Date().getMinutes()).padStart(2, '0')
    this._elements.fTime.value = `${h}:${m}`
    this._elements.fDuration.value = ''
  }

  _bindEvents() {
    this._elements.form.addEventListener('submit', (e) => {
      e.preventDefault()
      this._handleCreate()
    })

    this._elements.filterSubject.addEventListener('change', () => {
      this._filters.subjectId = this._elements.filterSubject.value
      this._applyFilters()
    })

    this._elements.filterPeriod.addEventListener('change', () => {
      this._filters.period = this._elements.filterPeriod.value
      this._applyFilters()
    })

    this._elements.editClose.addEventListener('click', () => this._closeEditModal())
    this._elements.editModal.addEventListener('click', (e) => {
      if (e.target === this._elements.editModal) this._closeEditModal()
    })

    this._elements.deleteClose.addEventListener('click', () => this._closeDeleteModal())
    this._elements.deleteCancel.addEventListener('click', () => this._closeDeleteModal())
    this._elements.deleteModal.addEventListener('click', (e) => {
      if (e.target === this._elements.deleteModal) this._closeDeleteModal()
    })

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this._closeEditModal()
        this._closeDeleteModal()
      }
    })
  }

  _handleCreate() {
    const data = this._gatherFormData(this._elements.form)
    if (!data) return

    const endTime = this._calcEndTime(data.date, data.startTime, data.duration)
    storageService.create(LS_KEYS.SESSIONS, {
      subjectId: data.subjectId,
      date: data.date,
      startTime: `${data.date}T${data.startTime}:00`,
      endTime,
      duration: data.duration,
      category: data.category,
      notes: data.notes,
      tags: []
    })

    this._resetForm()
    this._loadData()
  }

  _gatherFormData(form) {
    const date = form.querySelector('#f-date')?.value || this._elements.fDate.value
    const startTime = form.querySelector('#f-time')?.value || this._elements.fTime.value
    const subjectId = this._elements.fSubject.value
    const duration = parseInt(this._elements.fDuration.value, 10)
    const category = this._elements.fCategory.value
    const notes = this._elements.fNotes.value.trim()

    let valid = true
    this._clearErrors()

    if (!subjectId) {
      this._elements.subjectError.textContent = 'Selecione um assunto'
      valid = false
    }
    if (!duration || duration < 1) {
      this._elements.durationError.textContent = 'Informe a duração em minutos'
      valid = false
    }

    if (!valid) return null

    return { date, startTime, subjectId, duration, category, notes }
  }

  _calcEndTime(date, startTime, duration) {
    const [h, m] = startTime.split(':').map(Number)
    const start = new Date(date)
    start.setHours(h, m, 0, 0)
    const end = new Date(start.getTime() + duration * 60000)
    return end.toISOString()
  }

  _resetForm() {
    this._elements.fSubject.value = ''
    this._elements.fCategory.value = ''
    this._elements.fDuration.value = ''
    this._elements.fNotes.value = ''
    this._elements.formTitle.innerHTML = `${icons.clock} Nova Sessão`
    this._elements.btnSubmit.innerHTML = `${icons.plus} Registrar`
    this._editingId = null
    this._setDefaultDateTime()
    this._clearErrors()
  }

  _clearErrors() {
    this._elements.subjectError.textContent = ''
    this._elements.durationError.textContent = ''
  }

  _loadData() {
    this._sessions = storageService.findAll(LS_KEYS.SESSIONS)
    this._applyFilters()
  }

  _applyFilters() {
    const { subjectId, period } = this._filters

    this._filteredSessions = this._sessions.filter((s) => {
      if (subjectId && s.subjectId !== subjectId) return false
      if (period === 'today' && s.date !== today()) return false
      if (period === 'week') {
        const weekStart = this._getWeekStart()
        if (new Date(s.date) < weekStart) return false
      }
      if (period === 'month') {
        const d = new Date()
        const sDate = new Date(s.date)
        if (sDate.getMonth() !== d.getMonth() || sDate.getFullYear() !== d.getFullYear()) return false
      }
      return true
    })

    this._filteredSessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    this._renderHistory()
  }

  _renderHistory() {
    const container = this._elements.history
    if (!container) return

    if (!this._filteredSessions.length) {
      container.innerHTML = `
        <div class="empty-state" style="padding:var(--space-12)">
          <div class="empty-state__icon" style="width:3rem;height:3rem">${icons.empty}</div>
          <h3 class="empty-state__title" style="font-size:var(--text-sm)">Nenhuma sessão encontrada</h3>
          <p class="empty-state__desc" style="font-size:var(--text-xs)">
            ${this._sessions.length === 0
              ? 'Registre sua primeira sessão de estudo acima.'
              : 'Nenhuma sessão corresponde aos filtros selecionados.'}
          </p>
        </div>
      `
      return
    }

    const totalMinutes = this._filteredSessions.reduce((a, s) => a + (s.duration || 0), 0)
    const totalHours = Math.floor(totalMinutes / 60)
    const remainingMin = totalMinutes % 60

    container.innerHTML = `
      <div class="session__summary">
        <span class="badge badge--primary">${this._filteredSessions.length} ${this._filteredSessions.length === 1 ? 'sessão' : 'sessões'}</span>
        <span class="badge badge--info">${totalHours > 0 ? `${totalHours}h ` : ''}${remainingMin}min totais</span>
      </div>
      <div class="list-group mt-4">
        ${this._filteredSessions.map((s) => this._buildSessionItem(s)).join('')}
      </div>
    `

    container.querySelectorAll('[data-action="edit"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        this._openEditModal(btn.dataset.id)
      })
    })

    container.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        this._openDeleteModal(btn.dataset.id)
      })
    })
  }

  _buildSessionItem(session) {
    const subject = this._subjects.find((s) => s.id === session.subjectId)
    const subjectName = subject ? subject.name : 'Sem assunto'
    const subjectColor = subject ? subject.color : '#a3a3a3'
    const catLabel = session.category
      ? SESSION_CATEGORY_LABELS[session.category] || session.category
      : null

    return `
      <div class="list-item session-item">
        <span class="status-dot" style="background:${subjectColor};width:0.625rem;height:0.625rem;margin-top:0.25rem"></span>
        <div class="list-item__content">
          <div class="list-item__title" style="display:flex;align-items:center;gap:var(--space-2);flex-wrap:wrap">
            <span>${this._escape(subjectName)}</span>
            <span class="text-xs text-tertiary" style="font-weight:var(--font-normal)">· ${formatDate(session.date)} às ${formatTime(session.startTime)}</span>
          </div>
          <div class="list-item__subtitle" style="display:flex;align-items:center;gap:var(--space-2);flex-wrap:wrap;margin-top:var(--space-1)">
            <span class="badge badge--neutral badge--sm">${this._formatDuration(session.duration)}</span>
            ${catLabel ? `<span class="badge badge--info badge--sm">${catLabel}</span>` : ''}
            ${session.notes ? `<span class="text-xs text-tertiary">· ${this._escape(session.notes)}</span>` : ''}
          </div>
        </div>
        <div class="list-item__meta session-item__actions">
          <button class="btn btn--icon btn--ghost btn--sm" data-action="edit" data-id="${session.id}" title="Editar">
            ${icons.edit}
          </button>
          <button class="btn btn--icon btn--ghost btn--sm btn--danger-ghost" data-action="delete" data-id="${session.id}" title="Excluir">
            ${icons.trash}
          </button>
        </div>
      </div>
    `
  }

  _openEditModal(id) {
    const session = this._sessions.find((s) => s.id === id)
    if (!session) return

    this._editingId = id
    const time = session.startTime ? session.startTime.split('T')[1]?.slice(0, 5) || '00:00' : '00:00'

    this._elements.editModalBody.innerHTML = `
      <form id="edit-form" class="settings__form" novalidate>
        <div class="session__form-row">
          <div class="form-field">
            <label class="form-field__label form-field__label--required" for="e-date">Data</label>
            <input type="date" class="input" id="e-date" value="${session.date}" required>
          </div>
          <div class="form-field">
            <label class="form-field__label form-field__label--required" for="e-time">Horário</label>
            <input type="time" class="input" id="e-time" value="${time}" required>
          </div>
        </div>
        <div class="form-field">
          <label class="form-field__label form-field__label--required" for="e-subject">Assunto</label>
          <select class="input" id="e-subject" required>
            <option value="">Selecione...</option>
            ${this._subjects.map((s) =>
              `<option value="${s.id}" ${s.id === session.subjectId ? 'selected' : ''}>${s.name}</option>`
            ).join('')}
          </select>
        </div>
        <div class="session__form-row">
          <div class="form-field">
            <label class="form-field__label" for="e-category">Categoria</label>
            <select class="input" id="e-category">
              <option value="">Nenhuma</option>
              ${SESSION_CATEGORIES.map((c) =>
                `<option value="${c.value}" ${c.value === session.category ? 'selected' : ''}>${c.label}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-field">
            <label class="form-field__label form-field__label--required" for="e-duration">Duração (min)</label>
            <input type="number" class="input" id="e-duration" value="${session.duration}" required min="1" max="1440">
          </div>
        </div>
        <div class="form-field">
          <label class="form-field__label" for="e-notes">Observações</label>
          <textarea class="input" id="e-notes" rows="2">${this._escape(session.notes || '')}</textarea>
        </div>
        <div class="modal__footer" style="margin-top:var(--space-4);padding-top:var(--space-4)">
          <button type="button" class="btn btn--secondary" id="edit-cancel">Cancelar</button>
          <button type="submit" class="btn btn--primary">Salvar</button>
        </div>
      </form>
    `

    this._elements.editModal.classList.add('modal-overlay--open')

    const form = this._elements.editModalBody.querySelector('#edit-form')
    const cancelBtn = this._elements.editModalBody.querySelector('#edit-cancel')

    const submitHandler = (e) => {
      e.preventDefault()
      this._handleEdit()
    }
    form.addEventListener('submit', submitHandler)

    const cancelHandler = () => this._closeEditModal()
    cancelBtn.addEventListener('click', cancelHandler)
  }

  _handleEdit() {
    const body = this._elements.editModalBody
    const date = body.querySelector('#e-date').value
    const startTime = body.querySelector('#e-time').value
    const subjectId = body.querySelector('#e-subject').value
    const category = body.querySelector('#e-category').value
    const duration = parseInt(body.querySelector('#e-duration').value, 10)
    const notes = body.querySelector('#e-notes').value.trim()

    if (!subjectId || !duration || duration < 1) return
    if (!this._editingId) return

    const endTime = this._calcEndTime(date, startTime, duration)

    storageService.update(LS_KEYS.SESSIONS, this._editingId, {
      subjectId,
      date,
      startTime: `${date}T${startTime}:00`,
      endTime,
      duration,
      category,
      notes
    })

    this._closeEditModal()
    this._loadData()
  }

  _closeEditModal() {
    this._elements.editModal.classList.remove('modal-overlay--open')
    this._elements.editModalBody.innerHTML = ''
    this._editingId = null
  }

  _openDeleteModal(id) {
    const session = this._sessions.find((s) => s.id === id)
    if (!session) return
    this._deleteId = id

    const subject = this._subjects.find((s) => s.id === session.subjectId)
    const name = subject ? subject.name : 'Sem assunto'
    this._elements.deleteDetails.textContent = `${name} · ${formatDate(session.date)} · ${this._formatDuration(session.duration)}`

    this._elements.deleteModal.classList.add('modal-overlay--open')

    const handler = () => {
      storageService.delete(LS_KEYS.SESSIONS, id)
      this._closeDeleteModal()
      this._loadData()
      this._elements.deleteConfirm.removeEventListener('click', handler)
    }
    this._elements.deleteConfirm.addEventListener('click', handler)
    this._deleteConfirmHandler = handler
  }

  _closeDeleteModal() {
    this._elements.deleteModal.classList.remove('modal-overlay--open')
    if (this._deleteConfirmHandler) {
      this._elements.deleteConfirm.removeEventListener('click', this._deleteConfirmHandler)
      this._deleteConfirmHandler = null
    }
    this._deleteId = null
  }

  _getWeekStart() {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  destroy() {
    if (this._unsubStorage) this._unsubStorage()
    this._closeEditModal()
    this._closeDeleteModal()
    this._elements = {}
    this._sessions = []
    this._filteredSessions = []
  }

  _formatDuration(minutes) {
    if (!minutes || minutes === 0) return '0min'
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h === 0) return `${m}min`
    if (m === 0) return `${h}h`
    return `${h}h${m}min`
  }

  _escape(text) {
    if (!text) return ''
    const d = document.createElement('div')
    d.textContent = text
    return d.innerHTML
  }
}
