const icons = {
  close: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  download: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  share: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>'
}

export class InstallPrompt {
  constructor() {
    this.element = null
    this._dismissed = false
    this._handleInstallReady = null
    this._deferredPrompt = null
  }

  render() {
    this.element = document.createElement('div')
    this.element.className = 'install-prompt'
    this.element.style.cssText = `
      position:fixed;bottom:var(--space-4);left:var(--space-4);right:var(--space-4);
      max-width:24rem;margin:0 auto;
      background:var(--color-surface-raised, var(--color-surface));
      border:1px solid var(--color-border);
      border-radius:var(--radius-xl);
      box-shadow:var(--shadow-lg);
      padding:var(--space-4) var(--space-5);
      display:none;
      z-index:var(--z-toast, 999);
      animation: toast-in var(--duration-250, 250ms) var(--ease-out, ease-out);
    `
    this.element.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:var(--space-3)">
        <div style="flex-shrink:0;width:2.5rem;height:2.5rem;display:flex;align-items:center;justify-content:center;background:var(--color-primary-50);border-radius:var(--radius-lg);color:var(--color-primary)">
          ${icons.download}
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:var(--text-sm);font-weight:var(--font-semibold);color:var(--color-text);margin-bottom:var(--space-0_5)">Instalar Estuda+</div>
          <div style="font-size:var(--text-xs);color:var(--color-text-secondary);line-height:var(--leading-relaxed)">
            Instale o app para acessar seus estudos mesmo offline.
          </div>
        </div>
        <button id="install-close" style="flex-shrink:0;width:1.75rem;height:1.75rem;display:flex;align-items:center;justify-content:center;border-radius:var(--radius-full);color:var(--color-text-tertiary);border:none;background:none;cursor:pointer" aria-label="Fechar">
          ${icons.close}
        </button>
      </div>
      <div style="display:flex;gap:var(--space-2);margin-top:var(--space-3)">
        <button id="install-btn" class="btn btn--primary btn--sm" style="flex:1">${icons.download} Instalar</button>
        <button id="install-later" class="btn btn--secondary btn--sm" style="flex:1">Agora não</button>
      </div>
    `

    this._bindEvents()
    this._checkPlatform()
    this._listenForInstall()
    return this.element
  }

  _bindEvents() {
    this.element.querySelector('#install-close').addEventListener('click', () => this.dismiss())
    this.element.querySelector('#install-later').addEventListener('click', () => this.dismiss())
    this.element.querySelector('#install-btn').addEventListener('click', () => this._doInstall())
  }

  _checkPlatform() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches

    if (isStandalone) return

    if (isIOS && !window.navigator.standalone) {
      this._showIOS()
    }
  }

  _listenForInstall() {
    this._handleInstallReady = (e) => {
      this._deferredPrompt = e.detail.prompt
      this.show()
    }
    window.addEventListener('app:install-ready', this._handleInstallReady)
  }

  _showIOS() {
    if (this._dismissed || localStorage.getItem('estudaplus_install_dismissed')) return
    const btn = this.element.querySelector('#install-btn')
    btn.innerHTML = `${icons.share} Como instalar`
    btn.onclick = () => {
      this._showIOSInstructions()
    }
    setTimeout(() => this.show(), 2000)
  }

  _showIOSInstructions() {
    const existing = document.querySelector('.install-ios-modal')
    if (existing) return
    const overlay = document.createElement('div')
    overlay.className = 'install-ios-modal modal-overlay'
    overlay.style.cssText = 'position:fixed;inset:0;background:var(--color-surface-overlay);display:flex;align-items:center;justify-content:center;z-index:var(--z-modal, 1000);padding:var(--space-4)'
    overlay.innerHTML = `
      <div class="modal modal--sm" style="max-width:22rem;text-align:center">
        <div style="font-size:2rem;margin-bottom:var(--space-3)">📲</div>
        <h3 style="font-size:var(--text-base);font-weight:var(--font-semibold);color:var(--color-text);margin-bottom:var(--space-2)">Instalar no iPhone/iPad</h3>
        <ol style="text-align:left;font-size:var(--text-sm);color:var(--color-text-secondary);line-height:var(--leading-relaxed);padding-left:var(--space-5)">
          <li style="margin-bottom:var(--space-2)">Toque no botão <strong>Compartilhar</strong> <span style="font-size:1.2rem">⎙</span> na barra inferior do Safari</li>
          <li style="margin-bottom:var(--space-2)">Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong></li>
          <li>Toque em <strong>"Adicionar"</strong> no canto superior direito</li>
        </ol>
        <div style="margin-top:var(--space-4)">
          <button class="btn btn--primary" id="ios-close">Entendi</button>
        </div>
      </div>
    `
    overlay.querySelector('#ios-close').addEventListener('click', () => overlay.remove())
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove() })
    document.body.appendChild(overlay)
  }

  async _doInstall() {
    if (this._deferredPrompt) {
      this._deferredPrompt.prompt()
      const choice = await this._deferredPrompt.userChoice
      this._deferredPrompt = null
      if (choice.outcome === 'accepted') {
        this.dismiss()
        localStorage.setItem('estudaplus_install_dismissed', 'true')
      }
    } else {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
      if (isIOS) this._showIOSInstructions()
    }
  }

  show() {
    if (this._dismissed || localStorage.getItem('estudaplus_install_dismissed')) return
    this.element.style.display = 'block'
  }

  dismiss() {
    this._dismissed = true
    this.element.style.display = 'none'
    localStorage.setItem('estudaplus_install_dismissed', 'true')
  }

  destroy() {
    if (this._handleInstallReady) {
      window.removeEventListener('app:install-ready', this._handleInstallReady)
    }
    this.element = null
  }
}
