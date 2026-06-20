import { POMODORO } from '../utils/constants.js'

const icons = {
  play: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
  pause: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
  reset: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
  skip: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>'
}

export class StudyTimer {
  constructor({ focusDuration, breakDuration, longBreakDuration, sessionsBeforeLongBreak, onPhaseChange, onComplete } = {}) {
    this.element = null
    this._callbacks = { onPhaseChange, onComplete }

    this._focusDuration = focusDuration || POMODORO.DEFAULT_FOCUS
    this._breakDuration = breakDuration || POMODORO.DEFAULT_BREAK
    this._longBreakDuration = longBreakDuration || POMODORO.DEFAULT_LONG_BREAK
    this._sessionsBeforeLongBreak = sessionsBeforeLongBreak || POMODORO.SESSIONS_BEFORE_LONG_BREAK

    this._status = 'idle'
    this._phase = 'foco'
    this._timeLeft = this._focusDuration * 60
    this._totalTime = this._focusDuration * 60
    this._interval = null
    this._cycleCount = 0
    this._elements = {}
    this._audioCtx = null
  }

  setDurations({ focusDuration, breakDuration, longBreakDuration, sessionsBeforeLongBreak } = {}) {
    if (focusDuration !== undefined) this._focusDuration = focusDuration
    if (breakDuration !== undefined) this._breakDuration = breakDuration
    if (longBreakDuration !== undefined) this._longBreakDuration = longBreakDuration
    if (sessionsBeforeLongBreak !== undefined) this._sessionsBeforeLongBreak = sessionsBeforeLongBreak
    if (this._status === 'idle') {
      this._timeLeft = this._focusDuration * 60
      this._totalTime = this._focusDuration * 60
      this._renderDisplay()
    }
  }

  render() {
    this.element = document.createElement('div')
    this.element.className = 'timer'
    this.element.innerHTML = this._buildHTML()
    this._cacheElements()
    this._bindEvents()
    this._renderDisplay()
    return this.element
  }

  _buildHTML() {
    return `
      <div class="timer__phase" id="timer-phase">FOCO</div>
      <div class="timer__display" id="timer-display">25:00</div>
      <div class="timer__controls" id="timer-controls">
        <button class="btn btn--primary btn--lg" id="btn-start" data-action="start">
          ${icons.play} Iniciar
        </button>
        <button class="btn btn--secondary btn--lg" id="btn-reset" data-action="reset" style="display:none">
          ${icons.reset}
        </button>
      </div>
      <div class="timer__sessions" id="timer-sessions">Ciclo 0 / ${this._sessionsBeforeLongBreak}</div>
    `
  }

  _cacheElements() {
    this._elements.phase = this.element.querySelector('#timer-phase')
    this._elements.display = this.element.querySelector('#timer-display')
    this._elements.sessions = this.element.querySelector('#timer-sessions')
    this._elements.btnStart = this.element.querySelector('#btn-start')
    this._elements.btnReset = this.element.querySelector('#btn-reset')
  }

  _bindEvents() {
    this.element.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]')
      if (!btn) return
      const action = btn.dataset.action
      if (action === 'start') this._toggleStart()
      if (action === 'reset') this.reset()
    })
  }

  _toggleStart() {
    if (this._status === 'idle' || this._status === 'paused') {
      this.start()
    } else if (this._status === 'running') {
      this.pause()
    }
  }

  start() {
    if (this._status === 'running') return

    if (this._status === 'idle') {
      this._timeLeft = this._getPhaseDuration() * 60
      this._totalTime = this._timeLeft
    }

    this._status = 'running'
    this._renderControls()

    this._interval = setInterval(() => {
      this._timeLeft--
      this._renderDisplay()

      if (this._timeLeft <= 0) {
        this._completePhase()
      }
    }, 1000)
  }

  pause() {
    if (this._status !== 'running') return
    this._status = 'paused'
    this._clearInterval()
    this._renderControls()
  }

  resume() {
    this.start()
  }

  reset() {
    this._clearInterval()
    this._status = 'idle'
    this._phase = 'foco'
    this._cycleCount = 0
    this._timeLeft = this._focusDuration * 60
    this._totalTime = this._timeLeft
    this._renderDisplay()
    this._renderPhase()
    this._renderSessions()
    this._renderControls()
  }

  skip() {
    this._completePhase()
  }

  _completePhase() {
    this._clearInterval()
    this._playSound()

    if (this._phase === 'foco') {
      this._cycleCount++
      if (this._callbacks.onComplete) {
        this._callbacks.onComplete({
          type: 'foco',
          duration: this._getPhaseDuration(),
          cycleCount: this._cycleCount
        })
      }

      const isLongBreak = this._cycleCount % this._sessionsBeforeLongBreak === 0
      this._phase = isLongBreak ? 'pausa_longa' : 'pausa_curta'
    } else {
      this._phase = 'foco'
    }

    this._status = 'idle'
    this._timeLeft = this._getPhaseDuration() * 60
    this._totalTime = this._timeLeft
    this._renderDisplay()
    this._renderPhase()
    this._renderSessions()
    this._renderControls()

    if (this._callbacks.onPhaseChange) {
      this._callbacks.onPhaseChange(this._phase)
    }
  }

  getState() {
    return {
      status: this._status,
      phase: this._phase,
      timeLeft: this._timeLeft,
      elapsed: this._totalTime - this._timeLeft,
      totalTime: this._totalTime,
      cycleCount: this._cycleCount
    }
  }

  _getPhaseDuration() {
    if (this._phase === 'foco') return this._focusDuration
    if (this._phase === 'pausa_longa') return this._longBreakDuration
    return this._breakDuration
  }

  _renderDisplay() {
    if (!this._elements.display) return
    const m = Math.floor(this._timeLeft / 60)
    const s = this._timeLeft % 60
    this._elements.display.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  _renderPhase() {
    if (!this._elements.phase) return
    const labels = { foco: 'FOCO', pausa_curta: 'PAUSA CURTA', pausa_longa: 'PAUSA LONGA' }
    this._elements.phase.textContent = labels[this._phase] || this._phase
  }

  _renderSessions() {
    if (!this._elements.sessions) return
    this._elements.sessions.textContent = `Ciclo ${this._cycleCount} / ${this._sessionsBeforeLongBreak}`
  }

  _renderControls() {
    if (!this._elements.btnStart || !this._elements.btnReset) return

    if (this._status === 'running') {
      this._elements.btnStart.innerHTML = `${icons.pause} Pausar`
      this._elements.btnStart.className = 'btn btn--secondary btn--lg'
      this._elements.btnReset.style.display = ''
    } else if (this._status === 'paused') {
      this._elements.btnStart.innerHTML = `${icons.play} Continuar`
      this._elements.btnStart.className = 'btn btn--primary btn--lg'
      this._elements.btnReset.style.display = ''
    } else {
      this._elements.btnStart.innerHTML = `${icons.play} Iniciar`
      this._elements.btnStart.className = 'btn btn--primary btn--lg'
      this._elements.btnReset.style.display = this._cycleCount > 0 ? '' : 'none'
    }
  }

  _playSound() {
    try {
      if (!this._audioCtx) {
        this._audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      }
      const osc = this._audioCtx.createOscillator()
      const gain = this._audioCtx.createGain()
      osc.connect(gain)
      gain.connect(this._audioCtx.destination)
      osc.frequency.value = 880
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, this._audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, this._audioCtx.currentTime + 0.5)
      osc.start(this._audioCtx.currentTime)
      osc.stop(this._audioCtx.currentTime + 0.5)

      setTimeout(() => {
        const osc2 = this._audioCtx.createOscillator()
        const gain2 = this._audioCtx.createGain()
        osc2.connect(gain2)
        gain2.connect(this._audioCtx.destination)
        osc2.frequency.value = 1108
        osc2.type = 'sine'
        gain2.gain.setValueAtTime(0.3, this._audioCtx.currentTime)
        gain2.gain.exponentialRampToValueAtTime(0.01, this._audioCtx.currentTime + 0.4)
        osc2.start(this._audioCtx.currentTime)
        osc2.stop(this._audioCtx.currentTime + 0.4)
      }, 200)
    } catch (e) {
    }
  }

  _clearInterval() {
    if (this._interval) {
      clearInterval(this._interval)
      this._interval = null
    }
  }

  destroy() {
    this._clearInterval()
    if (this._audioCtx) {
      this._audioCtx.close()
      this._audioCtx = null
    }
    this.element = null
    this._elements = {}
  }
}
