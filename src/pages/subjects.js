import { storageService } from '../services/storage-service.js'
import { statsService } from '../services/stats-service.js'
import { eventBus } from '../utils/event-bus.js'
import { LS_KEYS, ROUTES } from '../utils/constants.js'
import { formatDuration } from '../utils/helpers.js'

const SUBJECT_COLORS = ['#6366f1', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6']

const icons = {
  plus: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  edit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  clock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  empty: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'
}

export class SubjectsPage {
  constructor() {
    this._elements = {}
    this._subjects = []
    this._sessions = []
    this._editingId = null
    this._formListeners = []
    this._deleteHandler = null
  }

  async render() {
    const section = document.createElement('section')
    section.className = 'subjects page'
    section.innerHTML = this._buildHTML()
    this._elements.section = section
    this._cacheElements()
    return section
  }

  _buildHTML() {
    return `
      <div class="page__header">
        <h1 class="page__title">Disciplinas</h1>
        <div class="page__actions">
          <button class="btn btn--primary" id="btn-new-subject">
            ${icons.plus} Nova Disciplina
          </button>
        </div>
      </div>
      <div class="subjects__grid" id="subjects-list">
        <div class="skeleton skeleton--card" style="height:10rem"></div>
        <div class="skeleton skeleton--card" style="height:10rem"></div>
      </div>

      <div class="modal-overlay" id="subject-modal">
        <div class="modal modal--sm">
          <div class="modal__header">
            <h2 class="modal__title" id="modal-title">Nova Disciplina</h2>
            <button class="modal__close" id="modal-close">${icons.close}</button>
          </div>
          <div class="modal__body" id="modal-body"></div>
        </div>
      </div>

      <div class="modal-overlay" id="delete-modal">
        <div class="modal modal--sm">
          <div class="modal__header">
            <h2 class="modal__title">Confirmar Exclusão</h2>
            <button class="modal__close" id="delete-close">${icons.close}</button>
          </div>
          <div class="modal__body">
            <p class="text-sm text-secondary">Tem certeza que deseja excluir <strong id="delete-name"></strong>?</p>
            <p class="text-xs text-tertiary mt-2">Esta ação não pode ser desfeita.</p>
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
    this._elements.list = s.querySelector('#subjects-list')
    this._elements.btnNew = s.querySelector('#btn-new-subject')
    this._elements.modal = s.querySelector('#subject-modal')
    this._elements.modalTitle = s.querySelector('#modal-title')
    this._elements.modalBody = s.querySelector('#modal-body')
    this._elements.modalClose = s.querySelector('#modal-close')
    this._elements.deleteModal = s.querySelector('#delete-modal')
    this._elements.deleteName = s.querySelector('#delete-name')
    this._elements.deleteConfirm = s.querySelector('#delete-confirm')
    this._elements.deleteCancel = s.querySelector('#delete-cancel')
    this._elements.deleteClose = s.querySelector('#delete-close')
  }

  async afterRender() {
    this._bindEvents()
    this._loadData()
    this._unsubStorage = eventBus.on('storage:change', () => this._loadData())
  }

  _bindEvents() {
    this._elements.btnNew.addEventListener('click', () => this._openCreateModal())
    this._elements.modalClose.addEventListener('click', () => this._closeModal())
    this._elements.modal.addEventListener('click', (e) => {
      if (e.target === this._elements.modal) this._closeModal()
    })
    this._elements.deleteClose.addEventListener('click', () => this._closeDeleteModal())
    this._elements.deleteCancel.addEventListener('click', () => this._closeDeleteModal())
    this._elements.deleteModal.addEventListener('click', (e) => {
      if (e.target === this._elements.deleteModal) this._closeDeleteModal()
    })
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { this._closeModal(); this._closeDeleteModal() }
    })
  }

  _loadData() {
    this._subjects = storageService.findAll(LS_KEYS.SUBJECTS)
    this._sessions = storageService.findAll(LS_KEYS.SESSIONS)
    this._renderList()
  }

  _renderList() {
    const container = this._elements.list
    if (!container) return

    if (!this._subjects.length) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state__icon">${icons.empty}</div>
          <h3 class="empty-state__title">Nenhuma disciplina</h3>
          <p class="empty-state__desc">Adicione disciplinas para organizar seus estudos por matéria.</p>
          <div class="empty-state__action">
            <button class="btn btn--primary" id="empty-add">${icons.plus} Nova Disciplina</button>
          </div>
        </div>
      `
      container.querySelector('#empty-add')?.addEventListener('click', () => this._openCreateModal())
      return
    }

    container.innerHTML = this._subjects.map((s) => this._buildCard(s)).join('')

    container.querySelectorAll('[data-action="edit"]').forEach((btn) => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); this._openEditModal(btn.dataset.id) })
    })

    container.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); this._openDeleteModal(btn.dataset.id) })
    })

    container.querySelectorAll('[data-action="view"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.location.hash = `${ROUTES.SUBJECTS}/${btn.dataset.id}`
      })
    })
  }

  _buildCard(subject) {
    const subjectSessions = this._sessions.filter((s) => s.subjectId === subject.id)
    const sessionCount = subjectSessions.length
    const totalMinutes = subjectSessions.reduce((a, s) => a + (s.duration || 0), 0)

    return `
      <div class="card subject-card" data-action="view" data-id="${subject.id}" style="cursor:pointer">
        <div class="subject-card__color-bar" style="background:${subject.color}"></div>
        <div class="subject-card__name">${this._escape(subject.name)}</div>
        <div class="subject-card__stats">
          <span>${icons.clock} ${sessionCount} ${sessionCount === 1 ? 'sessão' : 'sessões'}</span>
          <span>${formatDuration(totalMinutes)}</span>
          ${subject.workload ? `<span>Meta: ${subject.workload}h</span>` : ''}
        </div>
        <div class="subject-card__actions">
          <button class="btn btn--icon btn--ghost btn--sm" data-action="edit" data-id="${subject.id}" title="Editar">
            ${icons.edit}
          </button>
          <button class="btn btn--icon btn--ghost btn--sm btn--danger-ghost" data-action="delete" data-id="${subject.id}" title="Excluir">
            ${icons.trash}
          </button>
        </div>
      </div>
    `
  }

  _openCreateModal() {
    this._editingId = null
    this._elements.modalTitle.textContent = 'Nova Disciplina'
    this._renderForm({ name: '', color: SUBJECT_COLORS[0], workload: '' })
    this._openModal()
  }

  _openEditModal(id) {
    const subject = this._subjects.find((s) => s.id === id)
    if (!subject) return
    this._editingId = id
    this._elements.modalTitle.textContent = 'Editar Disciplina'
    this._renderForm({
      name: subject.name,
      color: subject.color,
      workload: String(subject.workload || '')
    })
    this._openModal()
  }

  _renderForm(values) {
    const isEdit = !!this._editingId
    this._elements.modalBody.innerHTML = `
      <form id="subject-form" novalidate>
        <div class="form-field">
          <label class="form-field__label form-field__label--required" for="f-name">Nome</label>
          <input type="text" class="input" id="f-name" value="${this._escape(values.name)}" required maxlength="100" placeholder="Ex: Matemática">
          <span class="form-field__error" id="f-name-error"></span>
        </div>

        <div class="form-field">
          <label class="form-field__label">Cor</label>
          <div class="subject-color-picker" style="display:flex;gap:var(--space-2);flex-wrap:wrap">
            ${SUBJECT_COLORS.map((c) => `
              <label class="subject-color-option" style="cursor:pointer">
                <input type="radio" name="color" value="${c}" ${values.color === c ? 'checked' : ''}
                  style="position:absolute;opacity:0;width:0;height:0">
                <span style="display:inline-block;width:2rem;height:2rem;border-radius:var(--radius-full);
                  background:${c};border:2px solid ${values.color === c ? 'var(--color-text)' : 'transparent'};
                  transition:border var(--duration-150)"></span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="form-field">
          <label class="form-field__label" for="f-workload">Carga Horária (horas)</label>
          <input type="number" class="input" id="f-workload" value="${values.workload}" min="0" placeholder="Ex: 60">
        </div>

        <div class="modal__footer" style="margin-top:var(--space-4);padding-top:var(--space-4)">
          <button type="button" class="btn btn--secondary" id="form-cancel">Cancelar</button>
          <button type="submit" class="btn btn--primary">${isEdit ? 'Salvar' : 'Criar'}</button>
        </div>
      </form>
    `

    this._cleanFormListeners()

    const form = this._elements.modalBody.querySelector('#subject-form')
    const cancelBtn = this._elements.modalBody.querySelector('#form-cancel')

    const submitHandler = (e) => {
      e.preventDefault()
      this._handleSubmit()
    }
    form.addEventListener('submit', submitHandler)
    this._formListeners.push(() => form.removeEventListener('submit', submitHandler))
    cancelBtn.addEventListener('click', () => this._closeModal())

    this._elements.modalBody.querySelectorAll('input[name="color"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        this._elements.modalBody.querySelectorAll('.subject-color-option span').forEach((s) => {
          s.style.borderColor = 'transparent'
        })
        if (radio.checked) radio.nextElementSibling.style.borderColor = 'var(--color-text)'
      })
    })

    setTimeout(() => {
      const firstInput = this._elements.modalBody.querySelector('#f-name')
      if (firstInput) firstInput.focus()
    }, 100)
  }

  _handleSubmit() {
    const form = this._elements.modalBody.querySelector('#subject-form')
    const name = form.querySelector('#f-name').value.trim()
    const color = form.querySelector('input[name="color"]:checked')?.value || SUBJECT_COLORS[0]
    const workload = parseInt(form.querySelector('#f-workload').value, 10) || 0

    const errorEl = this._elements.modalBody.querySelector('#f-name-error')
    if (!name) {
      errorEl.textContent = 'O nome é obrigatório'
      return
    }
    if (name.length < 2) {
      errorEl.textContent = 'Mínimo de 2 caracteres'
      return
    }
    errorEl.textContent = ''

    const data = { name, color, icon: 'book', workload }

    if (this._editingId) {
      storageService.update(LS_KEYS.SUBJECTS, this._editingId, data)
    } else {
      const existing = storageService.findAll(LS_KEYS.SUBJECTS, { name })
      if (existing.length > 0) {
        errorEl.textContent = 'Já existe uma disciplina com este nome'
        return
      }
      storageService.create(LS_KEYS.SUBJECTS, data)
    }
    this._closeModal()
  }

  _openDeleteModal(id) {
    const subject = this._subjects.find((s) => s.id === id)
    if (!subject) return
    this._deleteId = id
    this._elements.deleteName.textContent = subject.name
    this._elements.deleteModal.classList.add('modal-overlay--open')

    const confirmHandler = () => {
      storageService.delete(LS_KEYS.SUBJECTS, id)
      this._closeDeleteModal()
      this._elements.deleteConfirm.removeEventListener('click', confirmHandler)
    }
    this._elements.deleteConfirm.addEventListener('click', confirmHandler)
    this._deleteConfirmHandler = confirmHandler
  }

  _closeDeleteModal() {
    this._elements.deleteModal.classList.remove('modal-overlay--open')
    if (this._deleteConfirmHandler) {
      this._elements.deleteConfirm.removeEventListener('click', this._deleteConfirmHandler)
      this._deleteConfirmHandler = null
    }
    this._deleteId = null
  }

  _openModal() { this._elements.modal.classList.add('modal-overlay--open') }

  _closeModal() {
    this._elements.modal.classList.remove('modal-overlay--open')
    this._editingId = null
    this._cleanFormListeners()
  }

  _cleanFormListeners() {
    this._formListeners.forEach((fn) => fn())
    this._formListeners = []
  }

  destroy() {
    if (this._unsubStorage) this._unsubStorage()
    this._closeDeleteModal()
    this._closeModal()
    this._elements = {}
  }

  _escape(text) {
    if (!text) return ''
    const d = document.createElement('div')
    d.textContent = text
    return d.innerHTML
  }
}
