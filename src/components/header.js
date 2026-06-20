const menuIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`

export class Header {
  constructor({ onMenuToggle, onSync } = {}) {
    this.element = null
    this._titleEl = null
    this.callbacks = { onMenuToggle, onSync }
  }

  render(title) {
    this.element = document.createElement('header')
    this.element.className = 'header'

    const left = document.createElement('div')
    left.className = 'header__left'

    const menuBtn = document.createElement('button')
    menuBtn.className = 'header__menu-btn btn btn--icon btn--ghost'
    menuBtn.innerHTML = menuIcon
    menuBtn.setAttribute('aria-label', 'Abrir menu')
    if (this.callbacks.onMenuToggle) {
      menuBtn.addEventListener('click', this.callbacks.onMenuToggle)
    }
    left.appendChild(menuBtn)

    this._titleEl = document.createElement('h1')
    this._titleEl.className = 'header__title'
    this._titleEl.textContent = title || 'Dashboard'
    left.appendChild(this._titleEl)

    this.element.appendChild(left)

    const right = document.createElement('div')
    right.className = 'header__right'
    this.element.appendChild(right)

    return this.element
  }

  setTitle(title) {
    if (this._titleEl) {
      this._titleEl.textContent = title
    }
  }

  destroy() {
    this.element = null
    this._titleEl = null
  }
}
