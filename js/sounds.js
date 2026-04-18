/* ============================================================
   RecycleRight — Sound Effects (Web Audio API, no external files)
   ============================================================ */

const Sounds = (function () {

  let _ctx     = null;
  let _enabled = localStorage.getItem('rr_sounds') !== 'false';

  function _getCtx() {
    if (!_ctx) {
      try { _ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
    return _ctx;
  }

  function _tone(freq, dur, type = 'sine', vol = 0.22, delay = 0) {
    if (!_enabled) return;
    try {
      const ctx = _getCtx();
      if (!ctx) return;
      // Resume if suspended (browsers require user gesture first)
      if (ctx.state === 'suspended') ctx.resume();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type            = type;
      osc.frequency.value = freq;
      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    } catch (e) {}
  }

  /* Pleasant rising chime */
  function correct() {
    _tone(523, 0.08);
    _tone(659, 0.10, 'sine', 0.22, 0.09);
    _tone(784, 0.18, 'sine', 0.22, 0.18);
  }

  /* Low buzz */
  function wrong() {
    _tone(220, 0.12, 'sawtooth', 0.18);
    _tone(165, 0.22, 'sawtooth', 0.14, 0.10);
  }

  /* Short fanfare */
  function perfect() {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      _tone(f, 0.22, 'sine', 0.2, i * 0.11)
    );
  }

  /* Soft tick for countdown */
  function tick() {
    _tone(880, 0.06, 'sine', 0.12);
  }

  /* Higher tick for "Go!" */
  function go() {
    _tone(1047, 0.18, 'sine', 0.2);
  }

  function toggle() {
    _enabled = !_enabled;
    localStorage.setItem('rr_sounds', String(_enabled));
    _updateToggleBtn();
    return _enabled;
  }

  function _updateToggleBtn() {
    const btn  = document.getElementById('sounds-toggle');
    const icon = document.getElementById('sounds-icon');
    if (!btn || !icon) return;
    icon.className = _enabled ? 'fas fa-volume-high' : 'fas fa-volume-xmark';
    btn.title = _enabled ? 'Sound on' : 'Sound off';
  }

  // Sync button state on load
  document.addEventListener('DOMContentLoaded', _updateToggleBtn);

  return {
    correct, wrong, perfect, tick, go, toggle,
    get enabled() { return _enabled; },
  };

})();

window.Sounds = Sounds;
