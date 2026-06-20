import { Header } from './header.js'
import { Sidebar } from './sidebar.js'
import { InstallPrompt } from './install-prompt.js'

export class AppShell {
  constructor() {
    this.element = null
    this.header = null
    this.sidebar = null
    this.mainContent = null
    this._headerEl = null
    this._sidebarEl = null
    this._mainEl = null
    this._installPrompt = null
  }

  render() {
    this.element = document.createElement('div')
    this.element.className = 'app-shell'

    // Offline indicator
    const offlineBar = document.createElement('div')
    offlineBar.className = 'offline-bar'
    offlineBar.textContent = 'Você está offline — os dados continuam disponíveis.'
    offlineBar.id = 'offline-bar'
    this.element.appendChild(offlineBar)

    this.sidebar = new Sidebar({ onNavigate: (route) => this._navigate(route) })
    this._sidebarEl = this.sidebar.render()
    this._sidebarEl.className += ' app-shell__sidebar'
    this.element.appendChild(this._sidebarEl)

    this.header = new Header({ onMenuToggle: () => this.sidebar.toggle() })
    this._headerEl = this.header.render('Dashboard')
    this._headerEl.className += ' app-shell__header'
    this.element.appendChild(this._headerEl)

    this._mainEl = document.createElement('main')
    this._mainEl.className = 'app-shell__main'
    this.element.appendChild(this._mainEl)

    // Install prompt
    this._installPrompt = new InstallPrompt()
    this.element.appendChild(this._installPrompt.render())

    return this.element
  }

  setContent(content) {
    if (!this._mainEl) return

    this._mainEl.innerHTML = ''

    if (content instanceof HTMLElement) {
      this._mainEl.appendChild(content)
    } else if (typeof content === 'string') {
      this._mainEl.innerHTML = content
    }
  }

  _navigate(route) {
    window.location.hash = route
    this.sidebar.setActiveRoute(route)
  }

  destroy() {
    if (this.header) this.header.destroy()
    if (this.sidebar) this.sidebar.destroy()
    if (this._installPrompt) this._installPrompt.destroy()
    this.element = null
    this.mainContent = null
  }
}
