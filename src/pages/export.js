import { exportService } from '../services/export-service.js'

const icons = {
  pdf: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  csv: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="16 13 18 13 18 17 16 17"/><polyline points="12 13 14 13 14 17"/><line x1="8" y1="13" x2="10" y2="17"/><line x1="8" y1="17" x2="10" y2="13"/></svg>',
  download: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  check: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
}

export class ExportPage {
  constructor() {
    this._elements = {}
  }

  async render() {
    const section = document.createElement('section')
    section.className = 'export page'
    section.innerHTML = this._buildHTML()
    this._elements.section = section
    this._cacheElements()
    return section
  }

  _buildHTML() {
    return `
      <div class="page__header">
        <h1 class="page__title">Exportar Dados</h1>
      </div>

      <div class="settings__section" style="max-width:36rem">
        <h3 class="settings__section-title">${icons.download} Conteúdo da Exportação</h3>
        <p class="settings__section-desc">Selecione os dados que deseja incluir no arquivo.</p>

        <div class="export__checks" style="display:flex;flex-direction:column;gap:var(--space-3);margin-bottom:var(--space-6)">
          <label class="checkbox">
            <input type="checkbox" class="checkbox__input" id="exp-stats" checked>
            <span class="checkbox__control"></span>
            <span>Estatísticas resumidas</span>
          </label>
          <label class="checkbox">
            <input type="checkbox" class="checkbox__input" id="exp-studies" checked>
            <span class="checkbox__control"></span>
            <span>Materiais de estudo</span>
          </label>
          <label class="checkbox">
            <input type="checkbox" class="checkbox__input" id="exp-sessions" checked>
            <span class="checkbox__control"></span>
            <span>Sessões de estudo</span>
          </label>
          <label class="checkbox">
            <input type="checkbox" class="checkbox__input" id="exp-goals" checked>
            <span class="checkbox__control"></span>
            <span>Metas</span>
          </label>
        </div>

        <div class="settings__section-title" style="margin-bottom:var(--space-3);font-size:var(--text-base)">Formato</div>
        <div class="export__actions" style="display:flex;gap:var(--space-3);flex-wrap:wrap">
          <button class="btn btn--primary btn--lg" id="btn-export-pdf">
            ${icons.pdf} Exportar PDF
          </button>
          <button class="btn btn--secondary btn--lg" id="btn-export-csv">
            ${icons.csv} Exportar CSV
          </button>
        </div>
        <p class="text-xs text-tertiary mt-4">
          PDF: relatório formatado com tabelas profissionais.
          CSV: dados separados por ponto e vírgula, compatível com Excel e Google Sheets.
        </p>
      </div>
    `
  }

  _cacheElements() {
    const s = this._elements.section
    this._elements.btnPDF = s.querySelector('#btn-export-pdf')
    this._elements.btnCSV = s.querySelector('#btn-export-csv')
    this._elements.chkStats = s.querySelector('#exp-stats')
    this._elements.chkStudies = s.querySelector('#exp-studies')
    this._elements.chkSessions = s.querySelector('#exp-sessions')
    this._elements.chkGoals = s.querySelector('#exp-goals')
  }

  async afterRender() {
    this._elements.btnPDF.addEventListener('click', () => this._export('pdf'))
    this._elements.btnCSV.addEventListener('click', () => this._export('csv'))
  }

  _export(format) {
    const options = {
      includeStats: this._elements.chkStats.checked,
      includeStudies: this._elements.chkStudies.checked,
      includeSessions: this._elements.chkSessions.checked,
      includeGoals: this._elements.chkGoals.checked
    }

    const anySelected = Object.values(options).some(Boolean)
    if (!anySelected) {
      this._elements.btnPDF.closest('.settings__section')?.querySelector('.settings__section-desc')?.classList.add('text-danger')
      return
    }

    if (format === 'pdf') {
      exportService.generatePDF(options)
    } else {
      exportService.generateCSV(options)
    }
  }

  destroy() {
    this._elements = {}
  }
}
