export class Button {
  constructor({ label, variant, size, icon, onClick, disabled, className, type } = {}) {
    this.element = null
    this.props = { label, variant, size, icon, onClick, disabled, className, type }
    this._boundClick = null
  }

  render() {
    this.element = document.createElement('button')

    const variant = this.props.variant || 'primary'
    const size = this.props.size ? ` btn--${this.props.size}` : ''
    const extra = this.props.className ? ` ${this.props.className}` : ''

    this.element.className = `btn btn--${variant}${size}${extra}`

    if (this.props.type) {
      this.element.type = this.props.type
    }

    if (this.props.icon && this.props.label) {
      this.element.innerHTML = `${this.props.icon} ${this.props.label}`
    } else if (this.props.icon) {
      this.element.innerHTML = this.props.icon
    } else if (this.props.label) {
      this.element.textContent = this.props.label
    }

    if (this.props.disabled) {
      this.element.disabled = true
    }

    if (this.props.onClick) {
      this._boundClick = this.props.onClick
      this.element.addEventListener('click', this._boundClick)
    }

    return this.element
  }

  setDisabled(disabled) {
    if (this.element) {
      this.element.disabled = disabled
    }
    this.props.disabled = disabled
  }

  setLabel(label) {
    if (this.element) {
      if (this.props.icon) {
        this.element.innerHTML = `${this.props.icon} ${label}`
      } else {
        this.element.textContent = label
      }
    }
    this.props.label = label
  }

  setOnClick(handler) {
    if (this.element && this._boundClick) {
      this.element.removeEventListener('click', this._boundClick)
    }
    this._boundClick = handler
    if (this.element && handler) {
      this.element.addEventListener('click', handler)
    }
  }

  destroy() {
    if (this.element && this._boundClick) {
      this.element.removeEventListener('click', this._boundClick)
    }
    this.element = null
    this._boundClick = null
  }
}
