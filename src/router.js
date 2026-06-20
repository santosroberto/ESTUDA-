import { ROUTES } from './utils/constants.js'

export class Router {
  constructor() {
    this._routes = new Map()
    this._currentRoute = null
    this._currentPage = null
    this._beforeHooks = []
    this._afterHooks = []
    this._onRouteChange = null
  }

  register(path, pageFactory) {
    this._routes.set(path, pageFactory)
  }

  setOnRouteChange(callback) {
    this._onRouteChange = callback
  }

  addBeforeHook(hook) {
    this._beforeHooks.push(hook)
  }

  addAfterHook(hook) {
    this._afterHooks.push(hook)
  }

  navigate(path, params = {}) {
    if (this._currentRoute === path) return
    this._currentRoute = path
    window.location.hash = path
  }

  getCurrentPath() {
    return window.location.hash.slice(1) || '/'
  }

  _extractParams(pattern, path) {
    const patternParts = pattern.split('/')
    const pathParts = path.split('/')
    const params = {}

    patternParts.forEach((part, index) => {
      if (part.startsWith(':')) {
        const paramName = part.slice(1)
        params[paramName] = pathParts[index]
      }
    })

    return params
  }

  _matchRoute(path) {
    for (const [pattern] of this._routes) {
      const patternParts = pattern.split('/')
      const pathParts = path.split('/')

      if (patternParts.length !== pathParts.length) continue

      const match = patternParts.every((part, index) => {
        return part.startsWith(':') || part === pathParts[index]
      })

      if (match) return pattern
    }
    return null
  }

  async _resolveRoute() {
    const path = this.getCurrentPath()
    const matchedPattern = this._matchRoute(path)

    if (!matchedPattern) {
      this.navigate(ROUTES.DASHBOARD)
      return
    }

    const params = this._extractParams(matchedPattern, path)
    const pageFactory = this._routes.get(matchedPattern)

    for (const hook of this._beforeHooks) {
      await hook(path, params)
    }

    if (this._currentPage) {
      this._currentPage.destroy()
    }

    try {
      this._currentPage = pageFactory()
      const content = await this._currentPage.render(params)

      if (this._onRouteChange) {
        this._onRouteChange(path, content)
      }

      await this._currentPage.afterRender()

      for (const hook of this._afterHooks) {
        await hook(path, params, this._currentPage)
      }
    } catch (error) {
      console.error(`[Router] Error loading page "${path}":`, error)
      if (this._onRouteChange) {
        const errorEl = document.createElement('div')
        errorEl.style.cssText = 'padding:var(--space-8);text-align:center'
        errorEl.innerHTML = `
          <p style="color:var(--color-danger);font-weight:600;margin-bottom:var(--space-2)">Erro ao carregar página</p>
          <p style="font-size:var(--text-sm);color:var(--color-text-secondary)">${error.message}</p>
          <button class="btn btn--secondary" style="margin-top:var(--space-4)" onclick="location.reload()">Recarregar</button>
        `
        this._onRouteChange(path, errorEl)
      }
    }
  }

  start() {
    window.addEventListener('hashchange', () => {
      this._resolveRoute().catch((error) => {
        console.error('[Router] Unhandled error:', error)
      })
    })
    this._resolveRoute().catch((error) => {
      console.error('[Router] Unhandled error:', error)
    })
  }
}
