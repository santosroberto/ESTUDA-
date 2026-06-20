import { storageService } from '../services/storage-service.js'
import { statsService } from '../services/stats-service.js'
import { eventBus } from '../utils/event-bus.js'
import { LS_KEYS, ROUTES } from '../utils/constants.js'
import { formatDate, formatTime } from '../utils/date-utils.js'
import { formatDuration } from '../utils/helpers.js'

const icons = {
  back: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
  edit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  clock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  target: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  plus: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  empty: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
}

export class SubjectDetailPage {
  constructor() {
    this._subjectId = null
    this._subject = null
    this._sessions = []
    this._elements = {}
    this._unsubStorage = null
  }

  async render(params = {}) {
    const subjectId = params.id
    this._subjectId = subjectId
    this._subject = storageService.findById(LS_KEYS.SUBJECTS, subjectId)
    this._sessions = storageService.findAll(LS_KEYS.SESSIONS, { subjectId })

    const section = document.createElement('section')
    section.className = 'subject-detail page'

    if (!this._subject) {
      section.innerHTML = `
        <div class="empty-state" style="padding:var(--space-16)">
          <div class="empty-state__icon">${icons.empty}</div>
          <h3 class="empty-state__title">Disciplina não encontrada</h3>
          <p class="empty-state__desc">A disciplina que você procura não existe ou foi removida.</p>
          <div class="empty-state__action">
            <a href="#${ROUTES.SUBJECTS}" class="btn btn--primary">${icons.back} Voltar</a>
          </div>
        </div>
      `
      this._elements.section = section
      return section
    }

    section.innerHTML = this._buildHTML()
    this._elements.section = section
    this._cacheElements()
    return section
  }

  _buildHTML() {
    const subject = this._subject
    const sessions = this._sessions
    const totalMinutes = sessions.reduce((a, s) => a + (s.duration || 0), 0)

    return `
      <div class="subject-detail__header">
        <a href="#${ROUTES.SUBJECTS}" class="btn btn--icon btn--ghost" aria-label="Voltar">
          ${icons.back}
        </a>
        <span class="subject-detail__color-dot" style="background:${subject.color}"></span>
        <h1 class="subject-detail__name">${this._escape(subject.name)}</h1>
      </div>

      <div class="dashboard__stats" style="margin-bottom:var(--space-6)">
        <div class="card">
          <div class="stat">
            <span class="stat__label">Sessões</span>
            <span class="stat__value" style="font-size:var(--text-2xl)">${sessions.length}</span>
          </div>
        </div>
        <div class="card">
          <div class="stat">
            <span class="stat__label">Horas Estudadas</span>
            <span class="stat__value" style="font-size:var(--text-2xl)">${(totalMinutes / 60).toFixed(1)}h</span>
          </div>
        </div>
        <div class="card">
          <div class="stat">
            <span class="stat__label">Total</span>
            <span class="stat__value" style="font-size:var(--text-2xl)">${formatDuration(totalMinutes)}</span>
          </div>
        </div>
        ${subject.workload ? `
        <div class="card">
          <div class="stat">
            <span class="stat__label">Carga Horária</span>
            <span class="stat__value" style="font-size:var(--text-2xl)">${subject.workload}h</span>
            <span class="stat__sublabel">${Math.min(Math.round((totalMinutes / 60 / subject.workload) * 100), 100)}% concluído</span>
          </div>
        </div>
        ` : ''}
      </div>

      <div class="section">
        <div class="section__header">
          <h2 class="section__title">Sessões de Estudo</h2>
          <a href="#${ROUTES.STUDY_SESSION}" class="btn btn--primary btn--sm">
            ${icons.plus} Nova Sessão
          </a>
        </div>
        <div id="session-list">
          ${this._buildSessionList(sessions)}
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

  _buildSessionList(sessions) {
    if (!sessions.length) {
      return `
        <div class="card card--flat" style="padding:var(--space-8)">
          <div class="empty-state" style="padding:0">
            <div class="empty-state__icon" style="width:3rem;height:3rem">${icons.clock}</div>
            <p class="empty-state__title" style="font-size:var(--text-sm)">Nenhuma sessão registrada</p>
            <p class="empty-state__desc" style="font-size:var(--text-xs)">Inicie uma sessão de estudo para esta disciplina.</p>
          </div>
        </div>
      `
    }

    const sorted = [...sessions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return `<div class="list-group">${sorted.map((s) => `
      <div class="list-item" style="cursor:default">
        <span class="status-dot status-dot--primary" style="background:${this._subject.color}"></span>
        <div class="list-item__content">
          <div class="list-item__title">
            ${formatDate(s.date)} — ${formatDuration(s.duration)}
          </div>
          <div class="list-item__subtitle">
            ${s.startTime ? formatTime(s.startTime) : ''}
            ${s.notes ? `· ${this._escape(s.notes)}` : ''}
          </div>
        </div>
        <button class="btn btn--icon btn--ghost btn--sm" data-action="delete" data-id="${s.id}" title="Excluir">
          ${icons.trash}
        </button>
      </div>
    `).join('')}</div>`
  }

  _cacheElements() {
    const s = this._elements.section
    this._elements.sessionList = s.querySelector('#session-list')
    this._elements.deleteModal = s.querySelector('#delete-modal')
    this._elements.deleteDetails = s.querySelector('#delete-details')
    this._elements.deleteConfirm = s.querySelector('#delete-confirm')
    this._elements.deleteCancel = s.querySelector('#delete-cancel')
    this._elements.deleteClose = s.querySelector('#delete-close')
  }

  async afterRender() {
    if (!this._subject) return
    this._bindEvents()
    this._unsubStorage = eventBus.on('storage:change', () => this._reload())
  }

  _bindEvents() {
    this._elements.deleteClose.addEventListener('click', () => this._closeDeleteModal())
    this._elements.deleteCancel.addEventListener('click', () => this._closeDeleteModal())
    this._elements.deleteModal.addEventListener('click', (e) => {
      if (e.target === this._elements.deleteModal) this._closeDeleteModal()
    })
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this._closeDeleteModal()
    })
  }

  _reload() {
    if (!this._subjectId) return
    this._subject = storageService.findById(LS_KEYS.SUBJECTS, this._subjectId)
    this._sessions = storageService.findAll(LS_KEYS.SESSIONS, { subjectId: this._subjectId })
    const list = this._elements.sessionList
    if (list) list.innerHTML = this._buildSessionList(this._sessions)
    this._bindDeleteButtons()
  }

  _bindDeleteButtons() {
    const container = this._elements.sessionList
    if (!container) return
    container.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        this._openDeleteModal(btn.dataset.id)
      })
    })
  }

  _openDeleteModal(id) {
    const session = this._sessions.find((s) => s.id === id)
    if (!session) return
    this._deleteId = id
    this._elements.deleteDetails.textContent = `${formatDate(session.date)} — ${formatDuration(session.duration)}`
    this._elements.deleteModal.classList.add('modal-overlay--open')

    const confirmHandler = () => {
      storageService.delete(LS_KEYS.SESSIONS, id)
      this._closeDeleteModal()
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

  destroy() {
    if (this._unsubStorage) this._unsubStorage()
    this._closeDeleteModal()
    this._elements = {}
  }

  _escape(text) {
    if (!text) return ''
    const d = document.createElement('div')
    d.textContent = text
    return d.innerHTML
  }
}
