export class EmptyState {
  constructor({ icon, title, description, actionLabel, onAction } = {}) {
    this.element = null
    this.props = { icon, title, description, actionLabel, onAction }
    this._actionBtn = null
  }

  render() {
    this.element = document.createElement('div')
    this.element.className = 'empty-state'

    if (this.props.icon) {
      const iconEl = document.createElement('div')
      iconEl.className = 'empty-state__icon'
      iconEl.innerHTML = this.props.icon
      this.element.appendChild(iconEl)
    }

    if (this.props.title) {
      const titleEl = document.createElement('h3')
      titleEl.className = 'empty-state__title'
      titleEl.textContent = this.props.title
      this.element.appendChild(titleEl)
    }

    if (this.props.description) {
      const descEl = document.createElement('p')
      descEl.className = 'empty-state__desc'
      descEl.textContent = this.props.description
      this.element.appendChild(descEl)
    }

    if (this.props.actionLabel) {
      const actionWrapper = document.createElement('div')
      actionWrapper.className = 'empty-state__action'

      this._actionBtn = document.createElement('button')
      this._actionBtn.className = 'btn btn--primary'
      this._actionBtn.textContent = this.props.actionLabel

      if (this.props.onAction) {
        this._actionBtn.addEventListener('click', this.props.onAction)
      }

      actionWrapper.appendChild(this._actionBtn)
      this.element.appendChild(actionWrapper)
    }

    return this.element
  }

  destroy() {
    if (this._actionBtn && this.props.onAction) {
      this._actionBtn.removeEventListener('click', this.props.onAction)
    }
    this.element = null
    this._actionBtn = null
  }
}
