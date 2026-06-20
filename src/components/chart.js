export class ChartWrapper {
  constructor({ type, data, options } = {}) {
    this.element = null
    this.props = { type, data, options }
    this._canvas = null
    this._chartInstance = null
    this._id = 'chart-' + Math.random().toString(36).substring(2, 9)
  }

  render() {
    this.element = document.createElement('div')
    this.element.className = 'chart-wrapper'

    this._canvas = document.createElement('canvas')
    this._canvas.id = this._id
    this.element.appendChild(this._canvas)

    return this.element
  }

  create(type, data, options = {}) {
    if (!window.Chart) return

    this._destroyInstance()

    const ctx = this._canvas.getContext('2d')
    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 16,
            font: { size: 12 }
          }
        }
      }
    }

    const mergedOptions = this._mergeDeep(defaultOptions, options)

    this._chartInstance = new window.Chart(ctx, {
      type,
      data,
      options: mergedOptions
    })
  }

  update(data, options) {
    if (this._chartInstance) {
      if (data) this._chartInstance.data = data
      if (options) this._chartInstance.options = this._mergeDeep(this._chartInstance.options, options)
      this._chartInstance.update()
    }
  }

  resize() {
    if (this._chartInstance) {
      this._chartInstance.resize()
    }
  }

  _destroyInstance() {
    if (this._chartInstance) {
      this._chartInstance.destroy()
      this._chartInstance = null
    }
  }

  destroy() {
    this._destroyInstance()
    this._canvas = null
    this.element = null
  }

  _mergeDeep(target, source) {
    const output = { ...target }
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        output[key] = this._mergeDeep(target[key] || {}, source[key])
      } else {
        output[key] = source[key]
      }
    }
    return output
  }
}
