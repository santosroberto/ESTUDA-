import { storageService } from '../services/storage-service.js'
import { eventBus } from '../utils/event-bus.js'
import { LS_KEYS, PRIORITIES, TASK_STATUS } from '../utils/constants.js'
import { formatDate, today } from '../utils/date-utils.js'

const icons = {
  plus: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  edit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  check: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  empty: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>'
}

export class TasksPage {
  constructor() {
    this._elements = {}
    this._tasks = []
    this._subjects = []
    this._editingId = null
    this._deleteId = null
    this._deleteConfirmHandler = null
    this._unsubStorage = null
  }

  async render() {
    const section = document.createElement('section')
    section.className = 'tasks page'
    section.innerHTML = this._buildHTML()
    this._elements.section = section
    this._cacheElements()
    return section
  }

  _buildHTML() {
    return `
      <div class="page__header">
        <h1 class="page__title">Tarefas</h1>
        <div class="page__actions">
          <button class="btn btn--primary" id="btn-new-task">
            ${icons.plus} Nova Tarefa
          </button>
        </div>
      </div>

      <div class="tasks__filters">
        <select class="input input--sm" id="filter-status">
          <option value="">Todas</option>
          <option value="pendente">Pendentes</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="concluida">Concluídas</option>
        </select>
        <select class="input input--sm" id="filter-priority">
          <option value="">Todas prioridades</option>
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </select>
      </div>

      <div id="tasks-list" class="tasks__list">
        <div class="skeleton skeleton--card" style="height:4rem"></div>
        <div class="skeleton skeleton--card" style="height:4rem"></div>
      </div>

      <div class="modal-overlay" id="task-modal">
        <div class="modal modal--sm">
          <div class="modal__header">
            <h2 class="modal__title" id="modal-title">Nova Tarefa</h2>
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
    this._elements.list = s.querySelector('#tasks-list')
    this._elements.btnNew = s.querySelector('#btn-new-task')
    this._elements.filterStatus = s.querySelector('#filter-status')
    this._elements.filterPriority = s.querySelector('#filter-priority')
    this._elements.modal = s.querySelector('#task-modal')
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
    this._subjects = storageService.findAll(LS_KEYS.SUBJECTS)
    this._bindEvents()
    this._loadData()

    this._unsubStorage = eventBus.on('storage:change', () => {
      this._subjects = storageService.findAll(LS_KEYS.SUBJECTS)
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
    this._elements.filterStatus.addEventListener('change', () => this._renderList())
    this._elements.filterPriority.addEventListener('change', () => this._renderList())
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { this._closeModal(); this._closeDeleteModal() }
    })
  }

  _loadData() {
    this._tasks = storageService.findAll(LS_KEYS.TASKS)
    this._renderList()
  }

  _renderList() {
    const container = this._elements.list
    if (!container) return

    const statusFilter = this._elements.filterStatus.value
    const priorityFilter = this._elements.filterPriority.value

    let filtered = this._tasks
    if (statusFilter) filtered = filtered.filter((t) => t.status === statusFilter)
    if (priorityFilter) filtered = filtered.filter((t) => t.priority === priorityFilter)

    filtered.sort((a, b) => {
      const order = { alta: 0, media: 1, baixa: 2 }
      return (order[a.priority] || 1) - (order[b.priority] || 1)
    })

    if (!filtered.length) {
      container.innerHTML = `
        <div class="empty-state" style="padding:var(--space-12)">
          <div class="empty-state__icon" style="width:3rem;height:3rem">${icons.empty}</div>
          <h3 class="empty-state__title" style="font-size:var(--text-sm)">
            ${this._tasks.length === 0 ? 'Nenhuma tarefa criada' : 'Nenhuma tarefa encontrada'}
          </h3>
          <p class="empty-state__desc" style="font-size:var(--text-xs)">
            ${this._tasks.length === 0 ? 'Crie tarefas para organizar seus estudos.' : 'Tente ajustar os filtros.'}
          </p>
        </div>
      `
      return
    }

    container.innerHTML = filtered.map((t) => this._buildTaskItem(t)).join('')

    container.querySelectorAll('[data-action="toggle"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        this._toggleTask(btn.dataset.id)
      })
    })
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

  _buildTaskItem(task) {
    const subject = this._subjects.find((s) => s.id === task.subjectId)
    const isCompleted = task.status === 'concluida'
    const priorityColors = { alta: 'var(--color-priority-high)', media: 'var(--color-priority-medium)', baixa: 'var(--color-priority-low)' }

    return `
      <div class="list-item task-item ${isCompleted ? 'task-item--done' : ''}" style="cursor:default">
        <button class="task-item__check" data-action="toggle" data-id="${task.id}"
          style="width:1.25rem;height:1.25rem;border:2px solid ${isCompleted ? 'var(--color-success)' : 'var(--color-border-hover)'};border-radius:var(--radius-full);display:flex;align-items:center;justify-content:center;background:${isCompleted ? 'var(--color-success)' : 'transparent'};cursor:pointer;flex-shrink:0;transition:all var(--duration-150)">
          ${isCompleted ? icons.check.replace('stroke="currentColor"', 'stroke="white"') : ''}
        </button>
        <div class="list-item__content" style="text-decoration:${isCompleted ? 'line-through' : 'none'};opacity:${isCompleted ? 0.6 : 1}">
          <div class="list-item__title">${this._escape(task.title)}</div>
          <div class="list-item__subtitle">
            <span class="status-dot" style="background:${priorityColors[task.priority] || 'var(--color-neutral-400)'};width:0.5rem;height:0.5rem;display:inline-block;border-radius:50%"></span>
            ${task.priority === 'alta' ? 'Alta' : task.priority === 'media' ? 'Média' : 'Baixa'}
            ${subject ? '· ' + this._escape(subject.name) : ''}
            ${task.dueDate ? '· Vence: ' + formatDate(task.dueDate) : ''}
          </div>
        </div>
        <div class="list-item__meta" style="display:flex;gap:var(--space-1)">
          <button class="btn btn--icon btn--ghost btn--sm" data-action="edit" data-id="${task.id}" title="Editar">${icons.edit}</button>
          <button class="btn btn--icon btn--ghost btn--sm btn--danger-ghost" data-action="delete" data-id="${task.id}" title="Excluir">${icons.trash}</button>
        </div>
      </div>
    `
  }

  _toggleTask(id) {
    const task = this._tasks.find((t) => t.id === id)
    if (!task) return
    const isNowCompleted = task.status !== 'concluida'
    storageService.update(LS_KEYS.TASKS, id, {
      status: isNowCompleted ? 'concluida' : 'pendente',
      completedAt: isNowCompleted ? new Date().toISOString() : null
    })
  }

  _openCreateModal() {
    this._editingId = null
    this._elements.modalTitle.textContent = 'Nova Tarefa'
    this._renderForm({ title: '', subjectId: '', priority: 'media', status: 'pendente', dueDate: '', description: '' })
    this._openModal()
  }

  _openEditModal(id) {
    const task = this._tasks.find((t) => t.id === id)
    if (!task) return
    this._editingId = id
    this._elements.modalTitle.textContent = 'Editar Tarefa'
    this._renderForm({
      title: task.title,
      subjectId: task.subjectId || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate || '',
      description: task.description || ''
    })
    this._openModal()
  }

  _renderForm(values) {
    const isEdit = !!this._editingId
    this._elements.modalBody.innerHTML = `
      <form id="task-form" novalidate>
        <div class="form-field">
          <label class="form-field__label form-field__label--required" for="f-title">Título</label>
          <input type="text" class="input" id="f-title" value="${this._escape(values.title)}" required maxlength="200" placeholder="O que precisa ser feito?">
          <span class="form-field__error" id="f-title-error"></span>
        </div>
        <div class="form-field">
          <label class="form-field__label" for="f-subject">Disciplina</label>
          <select class="input" id="f-subject">
            <option value="">Nenhuma</option>
            ${this._subjects.map((s) => `<option value="${s.id}" ${s.id === values.subjectId ? 'selected' : ''}>${this._escape(s.name)}</option>`).join('')}
          </select>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
          <div class="form-field">
            <label class="form-field__label" for="f-priority">Prioridade</label>
            <select class="input" id="f-priority">
              <option value="baixa" ${values.priority === 'baixa' ? 'selected' : ''}>Baixa</option>
              <option value="media" ${values.priority === 'media' ? 'selected' : ''}>Média</option>
              <option value="alta" ${values.priority === 'alta' ? 'selected' : ''}>Alta</option>
            </select>
          </div>
          <div class="form-field">
            <label class="form-field__label" for="f-due">Data de Vencimento</label>
            <input type="date" class="input" id="f-due" value="${values.dueDate}">
          </div>
        </div>
        <div class="form-field">
          <label class="form-field__label" for="f-desc">Descrição</label>
          <textarea class="input" id="f-desc" rows="3" placeholder="Detalhes da tarefa...">${this._escape(values.description)}</textarea>
        </div>
        <div class="modal__footer" style="margin-top:var(--space-4);padding-top:var(--space-4)">
          <button type="button" class="btn btn--secondary" id="form-cancel">Cancelar</button>
          <button type="submit" class="btn btn--primary">${isEdit ? 'Salvar' : 'Criar'}</button>
        </div>
      </form>
    `

    this._elements.modalBody.querySelector('#form-cancel').addEventListener('click', () => this._closeModal())
    this._elements.modalBody.querySelector('#task-form').addEventListener('submit', (e) => {
      e.preventDefault()
      this._handleSubmit()
    })
    setTimeout(() => this._elements.modalBody.querySelector('#f-title')?.focus(), 100)
  }

  _handleSubmit() {
    const body = this._elements.modalBody
    const title = body.querySelector('#f-title').value.trim()
    if (!title) {
      const err = body.querySelector('#f-title-error')
      if (err) err.textContent = 'O título é obrigatório'
      return
    }

    const data = {
      title,
      subjectId: body.querySelector('#f-subject').value || null,
      priority: body.querySelector('#f-priority').value,
      dueDate: body.querySelector('#f-due').value || null,
      description: body.querySelector('#f-desc').value.trim()
    }

    if (this._editingId) {
      storageService.update(LS_KEYS.TASKS, this._editingId, data)
    } else {
      storageService.create(LS_KEYS.TASKS, data)
    }

    this._closeModal()
  }

  _openDeleteModal(id) {
    const task = this._tasks.find((t) => t.id === id)
    if (!task) return
    this._deleteId = id
    this._elements.deleteName.textContent = task.title
    this._elements.deleteModal.classList.add('modal-overlay--open')
    const handler = () => {
      storageService.delete(LS_KEYS.TASKS, id)
      this._closeDeleteModal()
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

  _openModal() { this._elements.modal.classList.add('modal-overlay--open') }

  _closeModal() {
    this._elements.modal.classList.remove('modal-overlay--open')
    this._editingId = null
  }

  destroy() {
    if (this._unsubStorage) this._unsubStorage()
    this._closeDeleteModal()
    this._closeModal()
    this._elements = {}
    this._tasks = []
  }

  _escape(text) {
    if (!text) return ''
    const d = document.createElement('div')
    d.textContent = text
    return d.innerHTML
  }
}
