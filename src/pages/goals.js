import { storageService } from '../services/storage-service.js'
import { statsService } from '../services/stats-service.js'
import { eventBus } from '../utils/event-bus.js'
import { LS_KEYS, ROUTES, GOAL_TYPES, GOAL_TYPE_LABELS } from '../utils/constants.js'
import { getWeekStart, getMonthStart } from '../utils/date-utils.js'

const icons = {
  plus: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  edit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  target: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  empty: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
}

export class GoalsPage {
  constructor() {
    this._elements = {}
    this._goals = []
    this._sessions = []
    this._subjects = []
    this._editingId = null
    this._deleteId = null
    this._deleteConfirmHandler = null
    this._unsubStorage = null
  }

  async render() {
    const section = document.createElement('section')
    section.className = 'goals page'
    section.innerHTML = this._buildHTML()
    this._elements.section = section
    this._cacheElements()
    return section
  }

  _buildHTML() {
    return `
      <div class="page__header">
        <h1 class="page__title">Metas</h1>
        <button class="btn btn--primary" id="btn-new-goal">
          ${icons.plus} Nova Meta
        </button>
      </div>

      <div class="goals__create card" id="goals-create-card" style="display:none">
        <div class="card__header">
          <h3 class="card__title" id="create-title">${icons.target} Nova Meta</h3>
        </div>
        <form id="goal-form" class="settings__form" novalidate>
          <div class="session__form-row">
            <div class="form-field">
              <label class="form-field__label form-field__label--required" for="f-type">Tipo</label>
              <select class="input" id="f-type" required>
                <option value="">Selecione...</option>
                <option value="${GOAL_TYPES.WEEKLY}">${GOAL_TYPE_LABELS[GOAL_TYPES.WEEKLY]}</option>
                <option value="${GOAL_TYPES.MONTHLY}">${GOAL_TYPE_LABELS[GOAL_TYPES.MONTHLY]}</option>
              </select>
            </div>
            <div class="form-field">
              <label class="form-field__label form-field__label--required" for="f-target">Horas Previstas</label>
              <input type="number" class="input" id="f-target" required min="1" max="999" step="0.5" placeholder="Ex: 5">
              <span class="form-field__error" id="f-target-error"></span>
            </div>
          </div>
          <div class="form-field">
            <label class="form-field__label" for="f-subject">Disciplina (opcional)</label>
            <select class="input" id="f-subject">
              <option value="">Todas as disciplinas</option>
            </select>
          </div>
          <div class="modal__footer" style="margin-top:var(--space-4);padding-top:var(--space-4)">
            <button type="button" class="btn btn--secondary" id="create-cancel">Cancelar</button>
            <button type="submit" class="btn btn--primary" id="create-submit">${icons.plus} Criar Meta</button>
          </div>
        </form>
      </div>

      <div class="section">
        <div class="section__header">
          <h2 class="section__title">Suas Metas</h2>
        </div>
        <div id="goals-list" class="goals__grid">
          <div class="skeleton skeleton--card" style="height:10rem"></div>
          <div class="skeleton skeleton--card" style="height:10rem"></div>
        </div>
      </div>

      <div class="modal-overlay" id="edit-modal">
        <div class="modal modal--sm">
          <div class="modal__header">
            <h2 class="modal__title">Editar Meta</h2>
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
            <p class="text-sm text-secondary">Tem certeza que deseja excluir esta meta?</p>
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
    this._elements.createCard = s.querySelector('#goals-create-card')
    this._elements.createTitle = s.querySelector('#create-title')
    this._elements.form = s.querySelector('#goal-form')
    this._elements.fType = s.querySelector('#f-type')
    this._elements.fTarget = s.querySelector('#f-target')
    this._elements.fSubject = s.querySelector('#f-subject')
    this._elements.fTargetError = s.querySelector('#f-target-error')
    this._elements.btnNewGoal = s.querySelector('#btn-new-goal')
    this._elements.createSubmit = s.querySelector('#create-submit')
    this._elements.createCancel = s.querySelector('#create-cancel')
    this._elements.list = s.querySelector('#goals-list')
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
    this._bindEvents()
    this._loadData()

    this._unsubStorage = eventBus.on('storage:change', () => {
      this._subjects = storageService.findAll(LS_KEYS.SUBJECTS)
      this._populateSubjectDropdowns()
      this._loadData()
    })
  }

  _populateSubjectDropdowns() {
    const selects = [this._elements.fSubject]
    selects.forEach((sel) => {
      if (!sel) return
      const current = sel.value
      sel.innerHTML = '<option value="">Todas as disciplinas</option>' +
        this._subjects.map((s) => `<option value="${s.id}" ${s.id === current ? 'selected' : ''}>${this._escape(s.name)}</option>`).join('')
    })
  }

  _bindEvents() {
    this._elements.btnNewGoal.addEventListener('click', () => {
      this._showCreateForm()
    })

    this._elements.createCancel.addEventListener('click', () => {
      this._hideCreateForm()
    })

    this._elements.form.addEventListener('submit', (e) => {
      e.preventDefault()
      if (this._editingId) {
        this._handleEdit()
      } else {
        this._handleCreate()
      }
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
        this._hideCreateForm()
        this._closeEditModal()
        this._closeDeleteModal()
      }
    })
  }

  _showCreateForm() {
    this._editingId = null
    this._elements.createTitle.innerHTML = `${icons.target} Nova Meta`
    this._elements.createSubmit.innerHTML = `${icons.plus} Criar Meta`
    this._elements.form.reset()
    this._elements.fTargetError.textContent = ''
    this._elements.createCard.style.display = 'block'
    this._elements.createCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  _hideCreateForm() {
    this._elements.createCard.style.display = 'none'
    this._elements.form.reset()
    this._elements.fTargetError.textContent = ''
    this._editingId = null
  }

  _handleCreate() {
    const type = this._elements.fType.value
    const targetHours = parseFloat(this._elements.fTarget.value)
    const subjectId = this._elements.fSubject.value || null

    if (!type || !targetHours || targetHours <= 0) {
      this._elements.fTargetError.textContent = 'Informe o tipo e as horas previstas'
      return
    }

    const targetMinutes = Math.round(targetHours * 60)
    const period = this._generatePeriodKey(type)

    storageService.create(LS_KEYS.GOALS, {
      subjectId,
      type,
      target: targetMinutes,
      period
    })

    this._hideCreateForm()
    this._loadData()
  }

  _handleEdit() {
    const body = this._elements.editModalBody
    const type = body.querySelector('#e-type').value
    const targetHours = parseFloat(body.querySelector('#e-target').value)
    const subjectId = body.querySelector('#e-subject').value || null

    if (!type || !targetHours || targetHours <= 0 || !this._editingId) return

    const targetMinutes = Math.round(targetHours * 60)
    const period = this._generatePeriodKey(type)

    storageService.update(LS_KEYS.GOALS, this._editingId, {
      subjectId,
      type,
      target: targetMinutes,
      period
    })

    this._closeEditModal()
    this._loadData()
  }

  _generatePeriodKey(type) {
    const now = new Date()
    if (type === GOAL_TYPES.WEEKLY) {
      const weekStart = getWeekStart(now)
      const year = weekStart.getFullYear()
      const janFirst = new Date(year, 0, 1)
      const days = Math.floor((weekStart - janFirst) / (24 * 60 * 60 * 1000))
      const week = Math.ceil((days + janFirst.getDay() + 1) / 7)
      return `${year}-W${String(week).padStart(2, '0')}`
    }
    const monthStart = getMonthStart(now)
    return `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`
  }

  _loadData() {
    this._goals = storageService.findAll(LS_KEYS.GOALS)
    this._sessions = storageService.findAll(LS_KEYS.SESSIONS)
    this._renderList()
  }

  _renderList() {
    const container = this._elements.list
    if (!container) return

    const enriched = statsService.getAllGoalsProgress(this._sessions, this._goals)

    if (!enriched.length) {
      container.innerHTML = `
        <div class="empty-state" style="padding:var(--space-12);grid-column:1/-1">
          <div class="empty-state__icon" style="width:3rem;height:3rem">${icons.empty}</div>
          <h3 class="empty-state__title" style="font-size:var(--text-sm)">Nenhuma meta criada</h3>
          <p class="empty-state__desc" style="font-size:var(--text-xs)">Crie metas semanais ou mensais para acompanhar seu progresso.</p>
        </div>
      `
      return
    }

    container.innerHTML = enriched.map((g) => this._buildGoalCard(g)).join('')

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

  _buildGoalCard(goal) {
    const typeLabel = GOAL_TYPE_LABELS[goal.type] || goal.type
    const subjectName = goal.subjectId
      ? (this._subjects.find((s) => s.id === goal.subjectId)?.name || 'Todas')
      : 'Todas as disciplinas'

    const currentFormatted = this._formatMinutes(goal.current)
    const targetFormatted = this._formatMinutes(goal.target)

    const barColor = goal.percentage >= 100
      ? 'var(--color-success)'
      : goal.percentage >= 50
        ? 'var(--color-primary)'
        : 'var(--color-warning)'

    return `
      <div class="card goal-card">
        <div class="goal-card__header">
          <div>
            <span class="badge badge--${goal.type === 'semanal' ? 'primary' : 'info'} badge--sm">${typeLabel}</span>
            <span class="text-xs text-tertiary" style="margin-left:var(--space-2)">${this._escape(subjectName)}</span>
          </div>
          <div class="goal-card__actions">
            <button class="btn btn--icon btn--ghost btn--sm" data-action="edit" data-id="${goal.id}" title="Editar">
              ${icons.edit}
            </button>
            <button class="btn btn--icon btn--ghost btn--sm btn--danger-ghost" data-action="delete" data-id="${goal.id}" title="Excluir">
              ${icons.trash}
            </button>
          </div>
        </div>

        <div class="goal-card__body">
          <div class="goal-card__values">
            <div class="goal-card__value goal-card__value--current">${currentFormatted}</div>
            <div class="goal-card__separator">de</div>
            <div class="goal-card__value goal-card__value--target">${targetFormatted}</div>
          </div>
          <div class="goal-card__percentage">${goal.percentage}%</div>
        </div>

        <div class="progress">
          <div class="progress__bar" style="height:0.75rem">
            <div class="progress__fill" style="width:${goal.percentage}%;background:${barColor};border-radius:var(--radius-full)"></div>
          </div>
        </div>

        <div class="goal-card__period text-xs text-tertiary">
          ${this._formatPeriod(goal)}
        </div>
      </div>
    `
  }

  _openEditModal(id) {
    const goal = this._goals.find((g) => g.id === id)
    if (!goal) return

    this._editingId = id
    const targetHours = (goal.target / 60).toFixed(1)

    this._elements.editModalBody.innerHTML = `
      <form id="edit-form" class="settings__form" novalidate>
        <div class="session__form-row">
          <div class="form-field">
            <label class="form-field__label form-field__label--required" for="e-type">Tipo</label>
            <select class="input" id="e-type" required>
              <option value="${GOAL_TYPES.WEEKLY}" ${goal.type === GOAL_TYPES.WEEKLY ? 'selected' : ''}>${GOAL_TYPE_LABELS[GOAL_TYPES.WEEKLY]}</option>
              <option value="${GOAL_TYPES.MONTHLY}" ${goal.type === GOAL_TYPES.MONTHLY ? 'selected' : ''}>${GOAL_TYPE_LABELS[GOAL_TYPES.MONTHLY]}</option>
            </select>
          </div>
          <div class="form-field">
            <label class="form-field__label form-field__label--required" for="e-target">Horas Previstas</label>
            <input type="number" class="input" id="e-target" value="${targetHours}" required min="1" max="999" step="0.5">
          </div>
        </div>
        <div class="form-field">
          <label class="form-field__label" for="e-subject">Disciplina (opcional)</label>
          <select class="input" id="e-subject">
            <option value="">Todas as disciplinas</option>
            ${this._subjects.map((s) =>
              `<option value="${s.id}" ${s.id === goal.subjectId ? 'selected' : ''}>${this._escape(s.name)}</option>`
            ).join('')}
          </select>
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

    form.addEventListener('submit', (e) => {
      e.preventDefault()
      this._handleEdit()
    })
    cancelBtn.addEventListener('click', () => this._closeEditModal())
  }

  _closeEditModal() {
    this._elements.editModal.classList.remove('modal-overlay--open')
    this._elements.editModalBody.innerHTML = ''
    this._editingId = null
  }

  _openDeleteModal(id) {
    const goal = this._goals.find((g) => g.id === id)
    if (!goal) return
    this._deleteId = id

    const typeLabel = GOAL_TYPE_LABELS[goal.type] || goal.type
    this._elements.deleteDetails.textContent = `${typeLabel} · ${this._formatMinutes(goal.target)}`

    this._elements.deleteModal.classList.add('modal-overlay--open')

    const handler = () => {
      storageService.delete(LS_KEYS.GOALS, id)
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

  destroy() {
    if (this._unsubStorage) this._unsubStorage()
    this._closeEditModal()
    this._closeDeleteModal()
    this._elements = {}
    this._goals = []
    this._sessions = []
  }

  _formatPeriod(goal) {
    if (goal.type === GOAL_TYPES.WEEKLY) {
      const [year, weekStr] = goal.period.split('-W')
      const week = parseInt(weekStr, 10)
      const janFirst = new Date(parseInt(year, 10), 0, 1)
      const start = new Date(janFirst)
      start.setDate(janFirst.getDate() + (week - 1) * 7 - janFirst.getDay() + 1)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      return `${start.toLocaleDateString('pt-BR')} — ${end.toLocaleDateString('pt-BR')}`
    }
    if (goal.type === GOAL_TYPES.MONTHLY) {
      const [year, month] = goal.period.split('-')
      const names = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
      return `${names[parseInt(month, 10) - 1]} de ${year}`
    }
    return goal.period
  }

  _formatMinutes(minutes) {
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
