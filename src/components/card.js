export class Card {
  constructor({ title, subtitle, className, variant } = {}) {
    this.element = null
    this._headerEl = null
    this._bodyEl = null
    this._footerEl = null
    this.props = { title, subtitle, className, variant }
  }

  render() {
    this.element = document.createElement('div')
    const variantClass = this.props.variant ? ` card--${this.props.variant}` : ''
    this.element.className = `card${variantClass} ${this.props.className || ''}`.trim()

    if (this.props.title || this.props.subtitle) {
      this._headerEl = document.createElement('div')
      this._headerEl.className = 'card__header'

      const titleGroup = document.createElement('div')

      if (this.props.title) {
        const titleEl = document.createElement('h3')
        titleEl.className = 'card__title'
        titleEl.textContent = this.props.title
        titleGroup.appendChild(titleEl)
      }

      if (this.props.subtitle) {
        const subEl = document.createElement('p')
        subEl.className = 'card__subtitle'
        subEl.textContent = this.props.subtitle
        titleGroup.appendChild(subEl)
      }

      this._headerEl.appendChild(titleGroup)
      this.element.appendChild(this._headerEl)
    }

    this._bodyEl = document.createElement('div')
    this._bodyEl.className = 'card__body'
    this.element.appendChild(this._bodyEl)

    return this.element
  }

  setBody(content) {
    if (!this._bodyEl) return
    this._bodyEl.innerHTML = ''

    if (typeof content === 'string') {
      this._bodyEl.innerHTML = content
    } else if (content instanceof HTMLElement) {
      this._bodyEl.appendChild(content)
    }
  }

  appendToBody(content) {
    if (!this._bodyEl) return

    if (typeof content === 'string') {
      this._bodyEl.insertAdjacentHTML('beforeend', content)
    } else if (content instanceof HTMLElement) {
      this._bodyEl.appendChild(content)
    }
  }

  setHeaderActions(actionsEl) {
    if (!this._headerEl) return
    this._headerEl.appendChild(actionsEl)
  }

  setFooter(content) {
    if (!this._footerEl) {
      this._footerEl = document.createElement('div')
      this._footerEl.className = 'card__footer'
      this.element.appendChild(this._footerEl)
    }

    this._footerEl.innerHTML = ''

    if (typeof content === 'string') {
      this._footerEl.innerHTML = content
    } else if (content instanceof HTMLElement) {
      this._footerEl.appendChild(content)
    }
  }

  destroy() {
    this.element = null
    this._headerEl = null
    this._bodyEl = null
    this._footerEl = null
  }
}
