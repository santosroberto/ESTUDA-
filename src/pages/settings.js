import { storageService } from '../services/storage-service.js'
import { eventBus } from '../utils/event-bus.js'
import { LS_KEYS, THEMES } from '../utils/constants.js'
import { defaultSettings } from '../store/schema.js'

const icons = {
  sun: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
  moon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  clock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  bell: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  trash: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
}

export class SettingsPage {
  constructor() {
    this._elements = {}
    this._settings = null
  }

  async render() {
    const section = document.createElement('section')
    section.className = 'settings page'
    section.innerHTML = this._buildHTML()
    this._elements.section = section
    this._cacheElements()
    return section
  }

  _buildHTML() {
    return `
      <div class="page__header">
        <h1 class="page__title">Configurações</h1>
      </div>

      <div class="settings__section">
        <h2 class="page__section-title">${icons.sun} Aparência</h2>
        <div class="card">
          <div class="settings__row">
            <div>
              <div class="text-sm font-medium">Tema</div>
              <div class="text-xs text-secondary mt-1">Escolha entre claro, escuro ou automático</div>
            </div>
            <select class="input input--sm" id="setting-theme" style="width:auto">
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
            </select>
          </div>
        </div>
      </div>

      <div class="settings__section">
        <h2 class="page__section-title">${icons.clock} Pomodoro</h2>
        <div class="card">
          <div class="settings__row">
            <div>
              <div class="text-sm font-medium">Duração do foco</div>
              <div class="text-xs text-secondary mt-1">Minutos por sessão de foco</div>
            </div>
            <input type="number" class="input input--sm" id="setting-pomodoro" min="1" max="120" style="width:5rem">
          </div>
          <div class="divider"></div>
          <div class="settings__row">
            <div>
              <div class="text-sm font-medium">Pausa curta</div>
              <div class="text-xs text-secondary mt-1">Minutos de descanso entre focos</div>
            </div>
            <input type="number" class="input input--sm" id="setting-break" min="1" max="30" style="width:5rem">
          </div>
          <div class="divider"></div>
          <div class="settings__row">
            <div>
              <div class="text-sm font-medium">Pausa longa</div>
              <div class="text-xs text-secondary mt-1">Minutos de descanso após 4 ciclos</div>
            </div>
            <input type="number" class="input input--sm" id="setting-long-break" min="1" max="60" style="width:5rem">
          </div>
        </div>
      </div>

      <div class="settings__section">
        <h2 class="page__section-title">${icons.bell} Notificações</h2>
        <div class="card">
          <div class="settings__row">
            <div>
              <div class="text-sm font-medium">Notificações sonoras</div>
              <div class="text-xs text-secondary mt-1">Tocar som ao final do Pomodoro</div>
            </div>
            <label class="toggle">
              <input type="checkbox" class="toggle__input" id="setting-notifications">
              <span class="toggle__track"><span class="toggle__thumb"></span></span>
            </label>
          </div>
        </div>
      </div>

      <div class="settings__section">
        <h2 class="page__section-title">${icons.trash} Dados</h2>
        <div class="card">
          <div class="settings__row">
            <div>
              <div class="text-sm font-medium">Limpar todos os dados</div>
              <div class="text-xs text-secondary mt-1">Remove todas as disciplinas, sessões, metas e tarefas</div>
            </div>
            <button class="btn btn--danger btn--sm" id="btn-clear-data">Limpar</button>
          </div>
        </div>
      </div>
    `
  }

  _cacheElements() {
    const s = this._elements.section
    this._elements.theme = s.querySelector('#setting-theme')
    this._elements.pomodoro = s.querySelector('#setting-pomodoro')
    this._elements.break = s.querySelector('#setting-break')
    this._elements.longBreak = s.querySelector('#setting-long-break')
    this._elements.notifications = s.querySelector('#setting-notifications')
    this._elements.btnClear = s.querySelector('#btn-clear-data')
  }

  async afterRender() {
    this._settings = this._loadSettings()
    this._populateForm()
    this._bindEvents()
  }

  _loadSettings() {
    return storageService.getSettings() || { ...defaultSettings }
  }

  _populateForm() {
    this._elements.theme.value = this._settings.theme || 'light'
    this._elements.pomodoro.value = this._settings.pomodoroDuration || 25
    this._elements.break.value = this._settings.breakDuration || 5
    this._elements.longBreak.value = this._settings.longBreakDuration || 15
    this._elements.notifications.checked = this._settings.notifications !== false
  }

  _bindEvents() {
    this._elements.theme.addEventListener('change', () => {
      const theme = this._elements.theme.value
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem('estudaplus_theme', theme)
      this._saveField('theme', theme)
    })

    this._elements.pomodoro.addEventListener('change', () => {
      this._saveField('pomodoroDuration', parseInt(this._elements.pomodoro.value, 10) || 25)
    })

    this._elements.break.addEventListener('change', () => {
      this._saveField('breakDuration', parseInt(this._elements.break.value, 10) || 5)
    })

    this._elements.longBreak.addEventListener('change', () => {
      this._saveField('longBreakDuration', parseInt(this._elements.longBreak.value, 10) || 15)
    })

    this._elements.notifications.addEventListener('change', () => {
      this._saveField('notifications', this._elements.notifications.checked)
    })

    this._elements.btnClear.addEventListener('click', () => {
      if (confirm('Tem certeza? Todos os dados serão perdidos permanentemente.')) {
        const keys = Object.values(LS_KEYS)
        keys.forEach((key) => localStorage.removeItem(key))
        location.reload()
      }
    })
  }

  _saveField(key, value) {
    this._settings[key] = value
    storageService.updateSettings(this._settings)
  }

  destroy() {
    this._elements = {}
  }
}
