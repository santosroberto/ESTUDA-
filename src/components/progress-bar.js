export class ProgressBar {
  constructor({ value, max, color, showLabel, size } = {}) {
    this.element = null
    this._barEl = null
    this._labelEl = null
    this._fillEl = null
    this.props = { value: value || 0, max: max || 100, color, showLabel, size }
  }

  render() {
    this.element = document.createElement('div')
    const sizeClass = this.props.size ? ` progress--${this.props.size}` : ''
    this.element.className = `progress${sizeClass}`

    if (this.props.showLabel) {
      this._labelEl = document.createElement('div')
      this._labelEl.className = 'progress__label'
      this.element.appendChild(this._labelEl)
    }

    this._barEl = document.createElement('div')
    this._barEl.className = 'progress__bar'

    this._fillEl = document.createElement('div')
    this._fillEl.className = 'progress__fill'

    if (this.props.color) {
      this._fillEl.style.background = this.props.color
    }

    this._barEl.appendChild(this._fillEl)
    this.element.appendChild(this._barEl)

    this.setProgress(this.props.value, this.props.max)

    return this.element
  }

  setProgress(value, max) {
    const v = value ?? this.props.value ?? 0
    const m = max ?? this.props.max ?? 100
    const percentage = m > 0 ? Math.min(Math.round((v / m) * 100), 100) : 0

    this.props.value = v
    this.props.max = m

    if (this._fillEl) {
      this._fillEl.style.width = `${percentage}%`
    }

    if (this._labelEl) {
      this._labelEl.innerHTML = `
        <span>${this._formatValue(v)} / ${this._formatValue(m)}</span>
        <span class="progress__value">${percentage}%</span>
      `
    }
  }

  setColor(color) {
    if (this._fillEl) {
      this._fillEl.style.background = color
    }
  }

  _formatValue(val) {
    if (val >= 60) {
      const h = Math.floor(val / 60)
      const m = val % 60
      return m > 0 ? `${h}h ${m}min` : `${h}h`
    }
    return `${val}min`
  }

  destroy() {
    this.element = null
    this._barEl = null
    this._fillEl = null
    this._labelEl = null
  }
}
