import { storageService } from '../services/storage-service.js'
import { eventBus } from '../utils/event-bus.js'
import { LS_KEYS, ROUTES, STUDY_CATEGORIES, STUDY_TYPES } from '../utils/constants.js'
import { formatDate } from '../utils/date-utils.js'
import { now } from '../utils/date-utils.js'

const icons = {
  plus: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  edit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  book: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  minus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>'
}

export class StudiesPage {
  constructor() {
    this._elements = {}
    this._studies = []
    this._filteredStudies = []
    this._filters = { search: '', category: '', type: '', status: '' }
    this._editingId = null
    this._formListeners = []
  }

  async render() {
    const section = document.createElement('section')
    section.className = 'studies page'
    section.innerHTML = this._buildHTML()
    this._elements.section = section
    this._cacheElements()
    return section
  }

  _buildHTML() {
    return `
      <div class="page__header">
        <h1 class="page__title">Materiais de Estudo</h1>
        <div class="page__actions">
          <button class="btn btn--primary" id="btn-new-study">
            ${icons.plus} Novo Estudo
          </button>
        </div>
      </div>

      <div class="studies__filters">
        <div class="studies__search">
          <span class="studies__search-icon">${icons.search}</span>
          <input type="text" class="input studies__search-input" id="search-input"
            placeholder="Pesquisar por título..." autocomplete="off">
        </div>
      </div>

      <div class="studies__chips">
        <div class="studies__chip-group" id="category-chips">
          <button class="chip chip--active" data-value="">Todas</button>
          ${STUDY_CATEGORIES.map((c) => `<button class="chip" data-value="${c}">${c}</button>`).join('')}
        </div>
        <div class="studies__chip-group" id="type-chips">
          <button class="chip chip--active" data-value="">Todos</button>
          ${STUDY_TYPES.map((t) => `<button class="chip" data-value="${t}">${t}</button>`).join('')}
        </div>
      </div>

      <div id="studies-list" class="studies__grid">
        <div class="skeleton skeleton--card" style="height:12rem"></div>
        <div class="skeleton skeleton--card" style="height:12rem"></div>
      </div>

      <div class="modal-overlay" id="study-modal">
        <div class="modal modal--sm">
          <div class="modal__header">
            <h2 class="modal__title" id="modal-title">Novo Material</h2>
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
    this._elements.list = s.querySelector('#studies-list')
    this._elements.searchInput = s.querySelector('#search-input')
    this._elements.categoryChips = s.querySelector('#category-chips')
    this._elements.typeChips = s.querySelector('#type-chips')
    this._elements.btnNew = s.querySelector('#btn-new-study')
    this._elements.modal = s.querySelector('#study-modal')
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

    this._unsubStorage = eventBus.on('storage:change', () => {
      this._loadData()
    })
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

    this._elements.searchInput.addEventListener('input', (e) => {
      this._filters.search = e.target.value.toLowerCase()
      this._applyFilters()
    })

    this._bindChipGroup(this._elements.categoryChips, (value) => {
      this._filters.category = value
      this._applyFilters()
    })

    this._bindChipGroup(this._elements.typeChips, (value) => {
      this._filters.type = value
      this._applyFilters()
    })

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this._closeModal()
        this._closeDeleteModal()
      }
    })
  }

  _bindChipGroup(container, onChange) {
    container.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        container.querySelectorAll('.chip').forEach((c) => c.classList.remove('chip--active'))
        chip.classList.add('chip--active')
        onChange(chip.dataset.value)
      })
    })
  }

  _loadData() {
    this._studies = storageService.findAll(LS_KEYS.STUDIES)
    this._applyFilters()
  }

  _applyFilters() {
    const { search, category, type } = this._filters

    this._filteredStudies = this._studies.filter((s) => {
      if (search && !s.title.toLowerCase().includes(search)) return false
      if (category && s.category !== category) return false
      if (type && s.type !== type) return false
      return true
    })

    this._renderList()
  }

  _renderList() {
    const container = this._elements.list
    if (!container) return

    if (!this._filteredStudies.length) {
      const hasFilters = this._filters.search || this._filters.category || this._filters.type
      const isEmpty = !this._studies.length

      if (isEmpty) {
        container.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1">
            <div class="empty-state__icon">${icons.book}</div>
            <h3 class="empty-state__title">Nenhum material ainda</h3>
            <p class="empty-state__desc">Adicione livros, cursos, vídeos e PDFs para acompanhar seu progresso.</p>
            <div class="empty-state__action">
              <button class="btn btn--primary" id="empty-add">${icons.plus} Novo Material</button>
            </div>
          </div>
        `
        container.querySelector('#empty-add')?.addEventListener('click', () => this._openCreateModal())
      } else {
        container.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1">
            <div class="empty-state__icon">${icons.search}</div>
            <h3 class="empty-state__title">Nenhum resultado</h3>
            <p class="empty-state__desc">Tente ajustar sua busca ou filtros.</p>
          </div>
        `
      }
      return
    }

    container.innerHTML = this._filteredStudies.map((s) => this._buildCard(s)).join('')

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

    container.querySelectorAll('[data-action="progress-minus"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        this._updateProgress(btn.dataset.id, -1)
      })
    })

    container.querySelectorAll('[data-action="progress-plus"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        this._updateProgress(btn.dataset.id, 1)
      })
    })
  }

  _buildCard(s) {
    const progress = s.totalPages > 0
      ? Math.min(Math.round((s.currentPages / s.totalPages) * 100), 100)
      : 0

    const statusLabel = {
      pendente: 'Pendente',
      em_andamento: 'Em Andamento',
      concluido: 'Concluído'
    }

    const statusBadge = {
      pendente: 'neutral',
      em_andamento: 'primary',
      concluido: 'success'
    }

    return `
      <div class="card study-card">
        <div class="study-card__header">
          <div class="study-card__info">
            <h3 class="study-card__title">${this._escape(s.title)}</h3>
            <div class="study-card__meta">
              <span class="badge badge--neutral badge--sm">${s.category}</span>
              <span class="badge badge--info badge--sm">${s.type}</span>
              <span class="badge badge--${statusBadge[s.status]} badge--sm">${statusLabel[s.status]}</span>
            </div>
          </div>
          <div class="study-card__actions">
            <button class="btn btn--icon btn--ghost btn--sm" data-action="edit" data-id="${s.id}" title="Editar">
              ${icons.edit}
            </button>
            <button class="btn btn--icon btn--ghost btn--sm btn--danger-ghost" data-action="delete" data-id="${s.id}" title="Excluir">
              ${icons.trash}
            </button>
          </div>
        </div>

        <div class="study-card__progress">
          <div class="study-card__progress-header">
            <span class="study-card__progress-label">Progresso</span>
            <span class="study-card__progress-value">${s.currentPages} / ${s.totalPages} ${s.type === 'Livro' ? 'páginas' : 'aulas'}</span>
          </div>
          <div class="progress">
            <div class="progress__bar">
              <div class="progress__fill ${progress >= 100 ? 'progress__fill--success' : ''}" style="width:${progress}%"></div>
            </div>
          </div>
        </div>

        <div class="study-card__footer">
          <div class="study-card__controls">
            <button class="btn btn--icon btn--ghost btn--sm" data-action="progress-minus" data-id="${s.id}" ${s.currentPages <= 0 ? 'disabled' : ''} title="Reduzir progresso">
              ${icons.minus}
            </button>
            <span class="study-card__percentage ${progress >= 100 ? 'text-success' : ''}">${progress}%</span>
            <button class="btn btn--icon btn--ghost btn--sm" data-action="progress-plus" data-id="${s.id}" ${s.currentPages >= s.totalPages ? 'disabled' : ''} title="Avançar progresso">
              ${icons.plus}
            </button>
          </div>
          <span class="study-card__date">${formatDate(s.createdAt)}</span>
        </div>

        ${s.notes ? `<div class="study-card__notes">${this._escape(s.notes)}</div>` : ''}
      </div>
    `
  }

  _updateProgress(id, delta) {
    const study = this._studies.find((s) => s.id === id)
    if (!study) return

    const newCurrent = Math.max(0, Math.min(study.totalPages, (study.currentPages || 0) + delta))
    const newStatus = newCurrent >= study.totalPages && study.totalPages > 0
      ? 'concluido'
      : newCurrent > 0 ? 'em_andamento' : 'pendente'

    storageService.update(LS_KEYS.STUDIES, id, {
      currentPages: newCurrent,
      status: newStatus,
      updatedAt: now()
    })
  }

  _openCreateModal() {
    this._editingId = null
    this._elements.modalTitle.textContent = 'Novo Material'
    this._renderForm({
      title: '', category: '', type: '', totalPages: '', currentPages: '0', status: 'pendente', notes: ''
    })
    this._openModal()
  }

  _openEditModal(id) {
    const study = this._studies.find((s) => s.id === id)
    if (!study) return
    this._editingId = id
    this._elements.modalTitle.textContent = 'Editar Material'
    this._renderForm({
      title: study.title,
      category: study.category,
      type: study.type,
      totalPages: String(study.totalPages),
      currentPages: String(study.currentPages),
      status: study.status,
      notes: study.notes || ''
    })
    this._openModal()
  }

  _renderForm(values) {
    const isEdit = !!this._editingId

    this._elements.modalBody.innerHTML = `
      <form id="study-form" class="settings__form" novalidate>
        <div class="form-field">
          <label class="form-field__label form-field__label--required" for="f-title">Título</label>
          <input type="text" class="input" id="f-title" value="${this._escape(values.title)}" required maxlength="200" placeholder="Ex: Curso de JavaScript">
          <span class="form-field__error" id="f-title-error"></span>
        </div>

        <div class="form-field">
          <label class="form-field__label form-field__label--required" for="f-category">Categoria</label>
          <select class="input" id="f-category" required>
            <option value="">Selecione...</option>
            ${STUDY_CATEGORIES.map((c) => `<option value="${c}" ${values.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
          <span class="form-field__error" id="f-category-error"></span>
        </div>

        <div class="form-field">
          <label class="form-field__label form-field__label--required" for="f-type">Tipo</label>
          <select class="input" id="f-type" required>
            <option value="">Selecione...</option>
            ${STUDY_TYPES.map((t) => `<option value="${t}" ${values.type === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
          <span class="form-field__error" id="f-type-error"></span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
          <div class="form-field">
            <label class="form-field__label" for="f-total">Total de ${values.type === 'Livro' ? 'páginas' : 'aulas'}</label>
            <input type="number" class="input" id="f-total" value="${values.totalPages || ''}" min="0" placeholder="Ex: 300">
          </div>
          <div class="form-field">
            <label class="form-field__label" for="f-current">Progresso atual</label>
            <input type="number" class="input" id="f-current" value="${values.currentPages || '0'}" min="0" placeholder="0">
          </div>
        </div>

        <div class="form-field">
          <label class="form-field__label" for="f-status">Status</label>
          <select class="input" id="f-status">
            <option value="pendente" ${values.status === 'pendente' ? 'selected' : ''}>Pendente</option>
            <option value="em_andamento" ${values.status === 'em_andamento' ? 'selected' : ''}>Em Andamento</option>
            <option value="concluido" ${values.status === 'concluido' ? 'selected' : ''}>Concluído</option>
          </select>
        </div>

        <div class="form-field">
          <label class="form-field__label" for="f-notes">Observações</label>
          <textarea class="input" id="f-notes" rows="3" placeholder="Anotações sobre este material...">${this._escape(values.notes)}</textarea>
        </div>

        <div class="modal__footer" style="margin-top:var(--space-4);padding-top:var(--space-4)">
          <button type="button" class="btn btn--secondary" id="form-cancel">Cancelar</button>
          <button type="submit" class="btn btn--primary">${isEdit ? 'Salvar' : 'Criar'}</button>
        </div>
      </form>
    `

    this._cleanFormListeners()

    const form = this._elements.modalBody.querySelector('#study-form')
    const cancelBtn = this._elements.modalBody.querySelector('#form-cancel')

    const submitHandler = (e) => {
      e.preventDefault()
      this._handleSubmit()
    }
    form.addEventListener('submit', submitHandler)
    this._formListeners.push(() => form.removeEventListener('submit', submitHandler))

    const cancelHandler = () => this._closeModal()
    cancelBtn.addEventListener('click', cancelHandler)
    this._formListeners.push(() => cancelBtn.removeEventListener('click', cancelHandler))

    this._elements.modalBody.querySelector('#f-type').addEventListener('change', (e) => {
      const totalLabel = this._elements.modalBody.querySelector('label[for="f-total"]')
      if (totalLabel) {
        totalLabel.textContent = `Total de ${e.target.value === 'Livro' ? 'páginas' : 'aulas'}`
      }
    })

    setTimeout(() => {
      const firstInput = this._elements.modalBody.querySelector('#f-title')
      if (firstInput) firstInput.focus()
    }, 100)
  }

  _handleSubmit() {
    const form = this._elements.modalBody.querySelector('#study-form')
    const data = {
      title: form.querySelector('#f-title').value.trim(),
      category: form.querySelector('#f-category').value,
      type: form.querySelector('#f-type').value,
      totalPages: parseInt(form.querySelector('#f-total').value, 10) || 0,
      currentPages: parseInt(form.querySelector('#f-current').value, 10) || 0,
      status: form.querySelector('#f-status').value,
      notes: form.querySelector('#f-notes').value.trim()
    }

    if (!this._validateForm(data)) return

    data.currentPages = Math.min(data.currentPages, data.totalPages || data.currentPages)

    if (data.totalPages > 0 && data.currentPages >= data.totalPages) {
      data.status = 'concluido'
    } else if (data.currentPages > 0 && data.status === 'pendente') {
      data.status = 'em_andamento'
    }

    if (this._editingId) {
      storageService.update(LS_KEYS.STUDIES, this._editingId, data)
    } else {
      storageService.create(LS_KEYS.STUDIES, data)
    }

    this._closeModal()
  }

  _validateForm(data) {
    let valid = true

    const getErrorEl = (id) => this._elements.modalBody.querySelector(id)
    const clearError = (id) => { const el = getErrorEl(id); if (el) el.textContent = '' }
    const setError = (id, msg) => { const el = getErrorEl(id); if (el) el.textContent = msg; valid = false }

    clearError('#f-title-error')
    clearError('#f-category-error')
    clearError('#f-type-error')

    if (!data.title) setError('#f-title-error', 'O título é obrigatório')
    else if (data.title.length < 2) setError('#f-title-error', 'Mínimo de 2 caracteres')

    if (!data.category) setError('#f-category-error', 'Selecione uma categoria')
    if (!data.type) setError('#f-type-error', 'Selecione um tipo')

    if (data.totalPages < 0) {
      const totalInput = this._elements.modalBody.querySelector('#f-total')
      totalInput.classList.add('input--error')
      valid = false
      setTimeout(() => totalInput.classList.remove('input--error'), 2000)
    }

    if (data.currentPages < 0) {
      valid = false
    }

    return valid
  }

  _openDeleteModal(id) {
    const study = this._studies.find((s) => s.id === id)
    if (!study) return
    this._deleteId = id
    this._elements.deleteName.textContent = study.title
    this._elements.deleteModal.classList.add('modal-overlay--open')

    const confirmHandler = () => {
      storageService.delete(LS_KEYS.STUDIES, id)
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

  _openModal() {
    this._elements.modal.classList.add('modal-overlay--open')
  }

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
    this._studies = []
    this._filteredStudies = []
  }

  _escape(text) {
    if (!text) return ''
    const d = document.createElement('div')
    d.textContent = text
    return d.innerHTML
  }
}
