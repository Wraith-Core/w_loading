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
    $('build').textContent = H.wl_build ? str('screen.build').replace('%s', String(H.wl_build)) : '';
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

  // ── Western Audio Player ──────────────────────────────────────────────────
  let audioInitialized = false;
  function setupAudioPlayer() {
    if (audioInitialized) return;
    audioInitialized = true;
    const audio = $('loading-audio');
    const toggle = $('audio-toggle');
    const icon = $('audio-icon');
    const status = $('audio-status');
    const volume = $('audio-volume');
    if (!audio || !toggle) return;

    let isPlaying = false;
    let audioCtx = null;
    let synthTimer = null;

    function startSynth() {
      if (audioCtx) return;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        audioCtx = new AudioContext();
        const masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime((Number(volume ? volume.value : 0.4) || 0.4) * 0.15, audioCtx.currentTime);
        masterGain.connect(audioCtx.destination);

        const notes = [130.81, 164.81, 196.00, 246.94, 329.63, 392.00];
        let noteIdx = 0;

        function playStrum() {
          if (!audioCtx || audioCtx.state === 'closed') return;
          const osc = audioCtx.createOscillator();
          const noteGain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(notes[noteIdx % notes.length], audioCtx.currentTime);
          noteIdx++;

          noteGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
          noteGain.gain.exponentialRampToValueAtTime(0.35, audioCtx.currentTime + 0.15);
          noteGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3.2);

          osc.connect(noteGain);
          noteGain.connect(masterGain);
          osc.start();
          osc.stop(audioCtx.currentTime + 3.5);
        }

        playStrum();
        synthTimer = setInterval(playStrum, 3800);
      } catch (e) {}
    }

    function stopSynth() {
      if (synthTimer) { clearInterval(synthTimer); synthTimer = null; }
      if (audioCtx) {
        try { audioCtx.close(); } catch (e) {}
        audioCtx = null;
      }
    }

    function updateState(playing) {
      isPlaying = playing;
      if (icon) icon.textContent = playing ? '❚❚' : '▶';
      if (status) status.textContent = playing ? (lang === 'ar' ? 'عزف الموسيقى' : 'Playing') : (lang === 'ar' ? 'صامت' : 'Paused');
    }

    function tryPlay() {
      audio.volume = Number(volume ? volume.value : 0.4) || 0.4;
      const promise = audio.play();
      if (promise !== undefined) {
        promise.then(() => {
          updateState(true);
        }).catch(() => {
          startSynth();
          updateState(true);
        });
      } else {
        updateState(true);
      }
    }

    function pause() {
      audio.pause();
      stopSynth();
      updateState(false);
    }

    toggle.addEventListener('click', () => {
      if (isPlaying) {
        pause();
      } else {
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        tryPlay();
      }
    });

    if (volume) {
      volume.addEventListener('input', (e) => {
        const val = Number(e.target.value) || 0;
        audio.volume = val;
      });
    }

    tryPlay();
    const resumeOnInteraction = () => {
      if (!isPlaying) tryPlay();
      window.removeEventListener('click', resumeOnInteraction);
      window.removeEventListener('keydown', resumeOnInteraction);
    };
    window.addEventListener('click', resumeOnInteraction, { once: true });
    window.addEventListener('keydown', resumeOnInteraction, { once: true });
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
