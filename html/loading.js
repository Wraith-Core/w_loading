(() => {
  const H = window.nuiHandoverData || {};
  const lang = H.wl_locale === 'ar' ? 'ar' : 'en';
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  const $ = (id) => document.getElementById(id);
  let strings = {}, tips = [], tipIndex = 0, tipTimer, tipFade;
  let phase = 'connecting', progress = 0;
  const stages = { connecting: 0, resources: 0, map: 1, session: 1, data: 1, scripts: 1, finishing: 2, ready: 2 };
  const str = (key) => typeof strings[key] === 'string' ? strings[key] : '';
  const flatten = (obj, prefix = '', out = {}) => {
    Object.keys(obj || {}).forEach((key) => {
      const full = prefix ? `${prefix}.${key}` : key;
      if (obj[key] && typeof obj[key] === 'object') flatten(obj[key], full, out);
      else out[full] = obj[key];
    });
    return out;
  };
  function renderPhase() {
    $('st').textContent = str(`screen.phase.${phase}`);
    document.querySelectorAll('[data-step]').forEach((node) => {
      const index = Number(node.dataset.step);
      node.classList.toggle('is-current', index === stages[phase]);
      node.classList.toggle('is-done', index < stages[phase]);
      if (index === stages[phase]) node.setAttribute('aria-current', 'step');
      else node.removeAttribute('aria-current');
    });
  }
  function setPhase(next) {
    if (!(next in stages) || stages[next] < stages[phase]) return;
    phase = next; renderPhase();
  }
  function setProgress(fraction) {
    const value = Number(fraction);
    if (!Number.isFinite(value)) return;
    progress = Math.max(progress, Math.min(1, Math.max(0, value)));
    const pct = Math.round(progress * 100);
    $('pct').textContent = String(pct);
    $('bar').style.width = `${pct}%`;
    $('progress').setAttribute('aria-valuenow', String(pct));
    if (pct === 100) setPhase('ready');
    else if (pct > 0 && phase === 'connecting') setPhase('resources');
  }
  window.addEventListener('message', (event) => {
    const d = event.data || {};
    switch (d.eventName) {
      case 'loadProgress': setProgress(d.loadFraction); break;
      case 'startInitFunction':
        if (d.type === 'INIT_BEFORE_MAP_LOADED') setPhase('map');
        else if (d.type === 'INIT_AFTER_MAP_LOADED') setPhase('data');
        else if (d.type === 'INIT_SESSION') setPhase('session');
        break;
      case 'startDataFileEntries': setPhase('data'); break;
      case 'performMapLoadFunction': setPhase('map'); break;
      case 'initFunctionInvoking': if (d.type === 'INIT_SESSION') setPhase('scripts'); break;
      case 'endDataFileEntries': setPhase('finishing'); break;
    }
  });
  function showTip() {
    if (!tips.length) return;
    $('tip-text').textContent = tips[tipIndex % tips.length];
    $('tip-count').textContent = `${String(tipIndex % tips.length + 1).padStart(2, '0')} / ${String(tips.length).padStart(2, '0')}`;
  }
  function render() {
    const staticLabels = { eyebrow:'eyebrow', headline:'headline', intro:'intro', edition:'edition', 'progress-label':'progress_label', 'tip-label':'tip_label' };
    Object.entries(staticLabels).forEach(([id, key]) => { $(id).textContent = str(`screen.${key}`); });
    $('welcome').textContent = H.wl_name ? str('screen.welcome').replace('%s', String(H.wl_name)) : '';
    $('server').textContent = H.wl_server || 'REDM';
    for (let i = 0; i < 3; i++) $(`step-${i}`).textContent = str(`screen.steps.${i}`);
    $('progress').setAttribute('aria-label', str('screen.progress_label'));
    renderPhase(); clearInterval(tipTimer); clearTimeout(tipFade);
    $('tip').hidden = !tips.length; showTip();
    if (tips.length > 1) tipTimer = setInterval(() => {
      $('tip').classList.add('fade');
      tipFade = setTimeout(() => { tipIndex++; showTip(); $('tip').classList.remove('fade'); }, 240);
    }, 9000);
    setupAudioPlayer();
  }

  // The existing procedural soundtrack is self-contained. No missing MP3/OGG
  // requests, and the same gain node now obeys both the slider and pause button.
  let audioInitialized = false;
  function setupAudioPlayer() {
    if (audioInitialized) return;
    audioInitialized = true;
    const toggle = $('audio-toggle'), icon = $('audio-icon');
    const status = $('audio-status'), volume = $('audio-volume');
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    $('audio-title').textContent = str('screen.audio.title');
    volume.setAttribute('aria-label', str('screen.audio.volume'));
    let ctx, master, timer, playing = false, wanted = false, disposed = false;
    let noteIndex = 0;
    const notes = [130.81, 164.81, 196, 246.94, 329.63, 392];
    const level = () => Math.min(1, Math.max(0, Number(volume.value) || 0));
    function updateState(value) {
      playing = value;
      icon.textContent = value ? '❚❚' : '▶';
      const label = str(value ? 'screen.audio.pause' : 'screen.audio.play');
      toggle.setAttribute('aria-label', label);
      toggle.setAttribute('aria-pressed', String(value));
      toggle.title = label;
      status.textContent = str(value ? (level() === 0 ? 'screen.audio.muted' : 'screen.audio.playing') : 'screen.audio.paused');
    }
    function strum() {
      if (!ctx || ctx.state !== 'running' || !wanted) return;
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(notes[noteIndex++ % notes.length], ctx.currentTime);
      gain.gain.setValueAtTime(.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.35, ctx.currentTime + .15);
      gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + 3.2);
      osc.connect(gain); gain.connect(master);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      osc.start(); osc.stop(ctx.currentTime + 3.5);
    }
    function stopTimer() { clearInterval(timer); timer = undefined; }
    async function play(fromInteraction) {
      if (!AudioContext || disposed) return;
      wanted = true;
      toggle.disabled = true;
      try {
        if (!ctx) {
          ctx = new AudioContext(); master = ctx.createGain();
          master.gain.setValueAtTime(level() * .15, ctx.currentTime);
          master.connect(ctx.destination);
        }
        if (ctx.state === 'suspended' && fromInteraction) await ctx.resume();
        if (disposed || !wanted) return;
        const running = ctx.state === 'running';
        if (running && !timer) { strum(); timer = setInterval(strum, 3800); }
        updateState(running);
      } catch (_) { wanted = false; stopTimer(); updateState(false); }
      finally { if (!disposed) toggle.disabled = false; }
    }
    function pause() {
      wanted = false; stopTimer();
      if (ctx) ctx.suspend().catch(() => {});
      updateState(false);
    }
    toggle.addEventListener('click', () => playing ? pause() : play(true));
    volume.addEventListener('input', () => {
      if (ctx && master) master.gain.setValueAtTime(level() * .15, ctx.currentTime);
      updateState(playing);
    });
    updateState(false);
    if (AudioContext) play(false);
    else { toggle.disabled = true; volume.disabled = true; status.textContent = str('screen.audio.unavailable'); }
    window.addEventListener('pagehide', () => {
      disposed = true; wanted = false; stopTimer();
      if (ctx) ctx.close().catch(() => {});
    }, { once: true });
  }

  function apply(data) {
    strings = flatten(data);
    tips = Array.isArray(H.wl_tips) ? H.wl_tips.filter((v) => typeof v === 'string') : Object.keys(strings).filter((k) => k.startsWith('tips.')).sort().map((k) => strings[k]);
    render();
  }
  if (H.wl_strings && Object.keys(H.wl_strings).length) apply(H.wl_strings);
  else fetch(`../locales/${lang}.json`).then((r) => { if (!r.ok) throw Error('locale'); return r.json(); }).then(apply)
    .catch(() => fetch('../locales/en.json').then((r) => r.json()).then(apply).catch(() => {}));
  window.addEventListener('pagehide', () => { clearInterval(tipTimer); clearTimeout(tipFade); });
})();
