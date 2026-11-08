/* ════════════════════════════════════════════════════════════════════════════
   Wraith Core · the loading screen

   Data: window.nuiHandoverData from server/main.lua
     wl_name     the player's name (the welcome line is hidden without one)
     wl_discord_name / wl_discord_avatar   his Discord name and picture (w_connector's join, 2.0.6);
                 the name wins over wl_name, the picture sits beside the welcome line
     wl_locale   'ar' | 'en'   (wl_dir follows)
     wl_strings  the flat screen.* strings of that language
     wl_tips     the tips.* strings as a list
     wl_contact  Config.ContactEmail ('' hides it)
     wl_plates   Config.Plates: plate ids in playing order (optional)
   Events: the loadscreen events of the Cfx runtime (loadProgress, startInitFunction,
   startInitFunctionOrder, initFunctionInvoking, initFunctionInvoked, endInitFunction,
   startDataFileEntries, onDataFileEntry, performMapLoadFunction, endDataFileEntries), plus two
   of ours sent by client/main.lua with SendLoadingScreenMessage:
     wl_ready    the client scripts are running: the rest of the wait is the character selection
     wl_exit     the screen is about to be shut down: fade to ink and fade the music out

   ?dev=1 replays a realistic event sequence with fake handover data, so the page can be designed
   in a normal browser (serve the resource folder over http, or allow file access):
     ?dev=1&lang=ar|en&name=Arthur   language and name (name= empty hides the welcome line)
     &plate=tetons|3  &tip=2          the plate and the tip to open on
     &at=12                           fast-forward the replay to 12 s
     &speed=2  &exit=20  &static=1    replay speed, send wl_exit at 20 s, freeze all motion
     &contact=owner@example.com       show the contact line
   ════════════════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const BRAND_LATIN = 'RED RIVER';
  const BRAND_ARABIC = 'ريد ريفر';

  const PLATE_EVERY = 16000;   // a new plate starts developing every 16 s
  const PLATE_XFADE = 2400;    // the incoming plate develops over 2.4 s
  const BOOT_DEVELOP = 1800;   // the first plate develops over 1.8 s
  const CAPTION_AT = 1200;     // the caption swaps 1.2 s into the crossfade
  const TIP_EVERY = 9000;
  const IDLE_AFTER = 4000;     // no event for 4 s: the red tick breathes

  const Q = new URLSearchParams(location.search);
  const DEV = Q.get('dev') === '1';
  const root = document.documentElement;
  let exiting = false;         // wl_exit arrived: every timer stops, the page fades to ink
  const $ = (id) => document.getElementById(id);
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));
  const clamp01 = (v) => Math.min(1, Math.max(0, Number(v) || 0));
  const pad2 = (n) => String(n).padStart(2, '0');

  // ── the dev harness: fake handover data ─────────────────────────────────────
  if (DEV && !window.nuiHandoverData) {
    const l = Q.get('lang') === 'ar' ? 'ar' : 'en';
    window.nuiHandoverData = {
      wl_name: Q.has('name') ? Q.get('name') : 'Stranger',
      wl_discord_name: Q.get('discord') || undefined,
      wl_discord_avatar: Q.get('avatar') || undefined,
      wl_server: 'Wraith Core RedM',
      wl_locale: l,
      wl_dir: l === 'ar' ? 'rtl' : 'ltr',
      wl_strings: null,
      wl_tips: null,
      wl_build: '1491',
      wl_contact: Q.get('contact') || '',
      wl_plates: null,
    };
  }

  const H = window.nuiHandoverData || {};
  const lang = H.wl_locale === 'ar' ? 'ar' : 'en';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  root.lang = lang;
  root.dir = dir;
  if (Q.get('static') === '1') root.classList.add('is-static');
  if (typeof H.wl_server === 'string' && H.wl_server) document.title = H.wl_server;

  // ── strings ──────────────────────────────────────────────────────────────────
  let S = {};
  const str = (key, fallback = '') => (typeof S[key] === 'string' && S[key] !== '' ? S[key] : fallback);

  const flatten = (obj, prefix = '', out = {}) => {
    Object.keys(obj || {}).forEach((key) => {
      const full = prefix ? `${prefix}.${key}` : key;
      if (obj[key] && typeof obj[key] === 'object') flatten(obj[key], full, out);
      else out[full] = obj[key];
    });
    return out;
  };

  // XHR rather than fetch: it also reads a local file when the harness is opened from disk
  const getJSON = (url) => new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open('GET', url);
    x.onload = () => { try { resolve(JSON.parse(x.responseText)); } catch (e) { reject(e); } };
    x.onerror = reject;
    x.send();
  });

  async function loadStrings() {
    if (H.wl_strings && typeof H.wl_strings === 'object' && Object.keys(H.wl_strings).length) {
      return flatten(H.wl_strings);
    }
    // no handover strings (the dev harness, or an old server script): the locale files,
    // English underneath so a missing key falls back like the Lua dictionary does
    let en = {};
    try { en = flatten(await getJSON('../locales/en.json')); } catch (_) { /* keep empty */ }
    if (lang === 'en') return en;
    try { return Object.assign(en, flatten(await getJSON(`../locales/${lang}.json`))); } catch (_) { return en; }
  }

  // ── small renderers ──────────────────────────────────────────────────────────
  const ROMAN = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  const roman = (n) => {
    let out = '';
    for (const [v, s] of ROMAN) while (n >= v) { out += s; n -= v; }
    return out;
  };

  /** A template with one %s, the value wrapped in <bdi> (never parsed as HTML). */
  function fillTemplate(el, template, value) {
    const at = template.indexOf('%s');
    const bdi = document.createElement('bdi');
    bdi.textContent = value;
    if (at < 0) { el.replaceChildren(document.createTextNode(template)); return; }
    el.replaceChildren(
      document.createTextNode(template.slice(0, at)),
      bdi,
      document.createTextNode(template.slice(at + 2)),
    );
  }

  function renderWelcome() {
    const el = $('welcome');
    // 2.0.6: the Discord name (w_connector hands it over at the join) before the RedM account name,
    // which is often a random one. The Cfx colour codes (^1 .. ^9) some players keep in their names are not shown.
    const pick = (v) => (typeof v === 'string' ? v.replace(/\^\d/g, '').trim() : '');
    const raw = pick(H.wl_discord_name) || pick(H.wl_name);
    const template = str('screen.welcome');
    if (!raw || !template) { el.hidden = true; return; }
    fillTemplate(el, template, shortName(raw));
    // his Discord picture beside the line (only Discord's own image host is accepted)
    const avatar = typeof H.wl_discord_avatar === 'string' && /^https:\/\/cdn\.discordapp\.com\/avatars\//.test(H.wl_discord_avatar)
      ? H.wl_discord_avatar : '';
    if (avatar) {
      const img = document.createElement('img');
      img.className = 'welcome-avatar';
      img.alt = '';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      img.addEventListener('error', () => img.remove());
      img.src = avatar;
      el.prepend(img);
    }
    el.classList.toggle('has-avatar', !!avatar);
    el.hidden = false;
  }

  /** Names over 24 characters end in an ellipsis, cut after the last whole word when one ends
   *  past the middle ("Maximilian Bartholomew…", not "Maximilian Bartholomew F…"). */
  function shortName(raw) {
    const MAX = 24;
    const chars = Array.from(raw.replace(/\s+/g, ' '));
    if (chars.length <= MAX) return chars.join('');
    let cut = chars.slice(0, MAX);
    const space = cut.lastIndexOf(' ');
    if (chars[MAX] !== ' ' && space >= MAX / 2) cut = cut.slice(0, space);
    return `${cut.join('').replace(/[\s,.;:،-]+$/u, '')}…`;
  }

  function renderStatic() {
    $('wm-primary').textContent = lang === 'ar' ? BRAND_ARABIC : BRAND_LATIN;
    $('wm-second').textContent = lang === 'ar' ? BRAND_LATIN : BRAND_ARABIC;
    $('wm-second').lang = lang === 'ar' ? 'en' : 'ar';
    $('wordmark').setAttribute('aria-label', BRAND_LATIN);
    $('tagline').textContent = str('screen.headline');
    $('tip-label').textContent = str('screen.tip_label');
    $('progress').setAttribute('aria-label', str('screen.progress_label'));
    // 2026-11-04 (owner): no "not approved by Rockstar Games" line on the loading screen
    const contact = typeof H.wl_contact === 'string' ? H.wl_contact.trim() : '';
    if (contact) {
      fillTemplate($('contact'), str('screen.contact', '%s'), contact);
      $('contact').querySelector('bdi')?.setAttribute('dir', 'ltr');
      $('contact').hidden = false;
    }
    renderWelcome();
    renderStatus(true);
  }

  // ── the plates ───────────────────────────────────────────────────────────────
  const platesEl = $('plates');
  let plates = [];
  let platePos = 0;
  let plateSeq = 0;
  const layers = [];
  const loaded = new Map();

  function pickPlates() {
    let all = Array.isArray(window.WL_PLATES) ? window.WL_PLATES.slice() : [];
    if (Array.isArray(H.wl_plates) && H.wl_plates.length) {
      const byId = new Map(all.map((p) => [p.id, p]));
      const ordered = H.wl_plates.map((id) => byId.get(id)).filter(Boolean);
      if (ordered.length) all = ordered;
    }
    const fit = all.filter((p) => !Array.isArray(p.dirs) || p.dirs.includes(dir));
    return fit.length ? fit : all;
  }

  function preload(plate) {
    if (!loaded.has(plate.file)) {
      loaded.set(plate.file, new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const decoded = img.decode ? img.decode().catch(() => {}) : Promise.resolve();
          decoded.then(() => resolve(true));
        };
        img.onerror = () => resolve(false);
        img.src = plate.file;
      }));
    }
    return loaded.get(plate.file);
  }

  function mountPlate(plate, develop) {
    const el = document.createElement('div');
    el.className = plateSeq++ % 2 ? 'plate alt' : 'plate';
    el.style.backgroundImage = `url("${plate.file}")`;
    if (plate.focus) {
      el.style.backgroundPosition = plate.focus;
      el.style.transformOrigin = plate.focus;
    }
    el.style.setProperty('--develop', `${develop}ms`);
    platesEl.appendChild(el);
    layers.push(el);
    while (layers.length > 2) layers.shift().remove();
  }

  function renderCaption() {
    const plate = plates[platePos];
    if (!plate) return;
    $('cap-no').textContent = `${roman(platePos + 1)} / ${roman(plates.length)}`;
    $('cap-title').textContent = str(`screen.plates.${plate.id}.title`, lang === 'ar' ? plate.title_ar : plate.title_en);
    $('cap-credit').textContent = str(`screen.plates.${plate.id}.credit`, plate.credit);
  }

  function swapCaption() {
    const body = $('cap-body');
    body.classList.add('is-out');
    setTimeout(() => { renderCaption(); body.classList.remove('is-out'); }, 300);
  }

  let plateTimer = 0;
  function scheduleNextPlate() {
    clearTimeout(plateTimer);
    if (plates.length < 2 || exiting) return;
    plateTimer = setTimeout(async () => {
      let next = (platePos + 1) % plates.length;
      // a plate that fails to load is dropped from the rotation
      while (plates.length > 1 && !(await preload(plates[next]))) {
        plates.splice(next, 1);
        if (next >= plates.length) next = 0;
      }
      if (exiting || plates.length < 2) return;
      platePos = next;
      mountPlate(plates[platePos], PLATE_XFADE);
      setTimeout(() => { while (layers.length > 1) layers.shift().remove(); }, PLATE_XFADE + 150);
      setTimeout(swapCaption, CAPTION_AT);
      // preload the one after during the hold
      setTimeout(() => preload(plates[(platePos + 1) % plates.length]), PLATE_XFADE + 500);
      scheduleNextPlate();
    }, PLATE_EVERY);
  }

  // ── the tips ─────────────────────────────────────────────────────────────────
  let tips = [];
  let tipPos = 0;
  let tipTimer = 0;
  let tipSwap = 0;

  /** "Press [ESC] to ..." -> text and <kbd> nodes (never parsed as HTML). Keys written side by
   *  side ("[←] [→]") are kept on one line. */
  function tipNodes(text) {
    const parts = [];
    const re = /\[([^\[\]]{1,16})\]/g;
    let last = 0;
    let m;
    while ((m = re.exec(text))) {
      if (m.index > last) parts.push(text.slice(last, m.index));
      const kbd = document.createElement('kbd');
      kbd.textContent = m[1];
      if (/^[←-⇿]+$/.test(m[1])) kbd.className = 'is-arrow';
      parts.push(kbd);
      last = re.lastIndex;
    }
    if (last < text.length) parts.push(text.slice(last));
    const frag = document.createDocumentFragment();
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (typeof part !== 'string' && typeof parts[i + 1] === 'string' && !parts[i + 1].trim() && parts[i + 2] instanceof Node) {
        const group = document.createElement('span');
        group.className = 'keys';
        group.append(part, parts[i + 1], parts[i + 2]);
        frag.append(group);
        i += 2;
      } else {
        frag.append(part);
      }
    }
    return frag;
  }

  function paintTip() {
    $('tip-text').replaceChildren(tipNodes(tips[tipPos]));
    $('tip-count').textContent = `${pad2(tipPos + 1)} / ${pad2(tips.length)}`;
  }

  function restartTipTimer() {
    clearInterval(tipTimer);
    if (tips.length > 1 && !exiting) tipTimer = setInterval(() => stepTip(1, false), TIP_EVERY);
  }

  function stepTip(delta, manual) {
    if (tips.length < 2) return;
    tipPos = (tipPos + delta + tips.length) % tips.length;
    const el = $('tip-text');
    el.classList.remove('is-pre');
    el.classList.add('is-out');
    clearTimeout(tipSwap);
    tipSwap = setTimeout(() => {
      el.classList.remove('is-out');
      el.classList.add('is-pre');
      paintTip();
      void el.offsetWidth; // commit the start position before easing in
      el.classList.remove('is-pre');
    }, 320);
    if (manual) restartTipTimer();
  }

  function startTips() {
    tips = Array.isArray(H.wl_tips) && H.wl_tips.length
      ? H.wl_tips.filter((t) => typeof t === 'string' && t)
      : Object.keys(S).filter((k) => k.startsWith('tips.')).sort().map((k) => S[k]).filter((t) => typeof t === 'string' && t);
    $('tip').hidden = !tips.length;
    if (!tips.length) return;
    const asked = parseInt(Q.get('tip'), 10);
    tipPos = DEV && asked > 0 ? (asked - 1) % tips.length : Math.floor(Math.random() * tips.length);
    paintTip();
    restartTipTimer();
  }

  // ── progress: honest, monotonic, from the full event set ────────────────────
  // Each phase owns a slice of the bar; inside a slice the bar moves with the real per-step
  // counts (init function idx/count, data file entries), and the game's own loadFraction can
  // only push it further. Nothing creeps on a timer.
  const PHASES = ['connecting', 'resources', 'map', 'data', 'scripts', 'session', 'finishing', 'ready'];
  const FLOOR = { connecting: 0, resources: .04, map: .12, data: .28, scripts: .70, session: .84, finishing: .96, ready: 1 };
  const INIT_PHASE = {
    INIT_CORE: 'resources',
    INIT_BEFORE_MAP_LOADED: 'map',
    INIT_AFTER_MAP_LOADED: 'scripts',
    INIT_SESSION: 'session',
  };
  let rank = 0;
  let sub = 0;
  let fraction = 0;
  let shown = 0;
  let order = { type: '', count: 0 };
  let dataFiles = { count: 0, entries: 0, mapLoads: 0 };
  let lastEvent = performance.now();
  let statusSwap = 0;
  let readyPending = false;

  const phase = () => PHASES[rank];

  function renderStatus(immediate) {
    const el = $('status');
    const text = str(`screen.phase.${phase()}`);
    if (immediate || !el.textContent) { el.textContent = text; return; }
    if (el.textContent === text) return;
    el.classList.add('is-out');
    clearTimeout(statusSwap);
    statusSwap = setTimeout(() => { el.textContent = str(`screen.phase.${phase()}`); el.classList.remove('is-out'); }, 240);
  }

  function toPhase(name) {
    const r = PHASES.indexOf(name);
    if (r <= rank) return;
    rank = r;
    sub = 0;
    renderStatus(false);
  }

  function renderProgress() {
    const name = phase();
    const floor = FLOOR[name];
    const span = (FLOOR[PHASES[rank + 1]] ?? 1) - floor;
    let value = Math.max(fraction, floor + span * clamp01(sub));
    if (name !== 'ready') value = Math.min(value, .99); // 100 is kept for the handover to the selection
    if (value <= shown) return;
    shown = value;
    const pct = Math.floor(shown * 100 + 1e-6);
    $('pct').textContent = String(pct);
    $('progress').style.setProperty('--p', shown.toFixed(4));
    $('progress').setAttribute('aria-valuenow', String(pct));
  }

  function onLoadEvent(d) {
    switch (d.eventName) {
      case 'loadProgress':
        fraction = Math.max(fraction, clamp01(d.loadFraction));
        if (fraction > 0) toPhase('resources');
        break;
      case 'startInitFunction':
        if (INIT_PHASE[d.type]) toPhase(INIT_PHASE[d.type]);
        break;
      case 'startInitFunctionOrder':
        if (INIT_PHASE[d.type]) toPhase(INIT_PHASE[d.type]);
        order = { type: d.type, count: Number(d.count) || 0 };
        break;
      case 'initFunctionInvoking':
        if (order.count > 0 && INIT_PHASE[d.type] === phase()) sub = Math.max(sub, (Number(d.idx) || 0) / order.count);
        break;
      case 'initFunctionInvoked':
        break;
      case 'endInitFunction':
        if (INIT_PHASE[d.type] === phase()) sub = 1;
        if (d.type === 'INIT_SESSION') toPhase(readyPending ? 'ready' : 'finishing');
        break;
      case 'startDataFileEntries':
        toPhase('data');
        dataFiles = { count: Number(d.count) || 0, entries: 0, mapLoads: 0 };
        break;
      case 'onDataFileEntry':
        dataFiles.entries++;
        if (phase() === 'data' && dataFiles.count > 0) sub = Math.max(sub, dataFiles.entries / dataFiles.count);
        break;
      case 'performMapLoadFunction':
        dataFiles.mapLoads++;
        if (phase() === 'data' && dataFiles.count > 0) sub = Math.max(sub, dataFiles.mapLoads / dataFiles.count);
        break;
      case 'endDataFileEntries':
        if (phase() === 'data') sub = 1;
        break;
      case 'wl_ready':
        // the client scripts run; if the game is still in its session init, 100% waits for the
        // end of it, or for 4 s without any loading event
        if (rank >= PHASES.indexOf('finishing')) toPhase('ready');
        else if (!readyPending) {
          readyPending = true;
          const settle = () => {
            if (performance.now() - lastEvent < IDLE_AFTER) { setTimeout(settle, 1000); return; }
            toPhase('ready');
            renderProgress();
          };
          setTimeout(settle, IDLE_AFTER);
        }
        break;
      case 'wl_exit':
        exit();
        return;
      default:
        return; // onLogLine and anything else: not shown
    }
    lastEvent = performance.now();
    $('load').classList.remove('is-idle');
    renderProgress();
  }

  window.addEventListener('message', (event) => {
    let d = event.data;
    // SendLoadingScreenMessage hands over a JSON string; accept it parsed or not
    if (typeof d === 'string') { try { d = JSON.parse(d); } catch (_) { return; } }
    if (!d || typeof d !== 'object' || typeof d.eventName !== 'string') return;
    try { onLoadEvent(d); } catch (e) { if (DEV) console.error(e); }
  });

  setInterval(() => {
    if (!exiting) $('load').classList.toggle('is-idle', performance.now() - lastEvent > IDLE_AFTER);
  }, 500);

  // ── music: real recordings, 01 -> 02 -> 03 looped with a crossfade ──────────
  const Music = (() => {
    const TRACKS = ['music/01_long_trail.ogg', 'music/02_estellita_waltz_1908.ogg', 'music/03_mazurka_harmonica_1939.ogg'];
    const XFADE = 2500;
    const FADE_IN = 2500;
    const FADE_OFF = 600;
    const STORE = 'w_loading.music';
    const pref = { on: true, vol: .25 };
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (saved && typeof saved.on === 'boolean') pref.on = saved.on;
      if (saved && Number.isFinite(saved.vol)) pref.vol = clamp01(saved.vol);
    } catch (_) { /* no storage: defaults */ }
    const save = () => { try { localStorage.setItem(STORE, JSON.stringify(pref)); } catch (_) { /* ignore */ } };

    const els = [new Audio(), new Audio()];
    els.forEach((a) => { a.preload = 'auto'; a.volume = 0; });
    const level = { master: 0, mix0: 1, mix1: 0 };
    let active = 0;
    let track = 0;
    let playing = false;  // audible (or fading in)
    let blocked = false;  // play() was refused: waiting for a gesture
    let crossing = false;
    let tweens = [];

    const apply = () => {
      els[0].volume = clamp01(pref.vol * level.master * level.mix0);
      els[1].volume = clamp01(pref.vol * level.master * level.mix1);
    };
    function tween(key, to, ms, done) {
      tweens = tweens.filter((t) => t.key !== key);
      tweens.push({ key, from: level[key], to, t0: performance.now(), ms: Math.max(1, ms), done });
    }
    setInterval(() => {
      const now = performance.now();
      tweens = tweens.filter((t) => {
        const k = Math.min(1, (now - t.t0) / t.ms);
        level[t.key] = t.from + (t.to - t.from) * k;
        if (k < 1) return true;
        if (t.done) t.done();
        return false;
      });
      apply();
      // start the next track XFADE before the end of this one
      const a = els[active];
      if (playing && !crossing && a.duration && Number.isFinite(a.duration) && a.duration - a.currentTime <= XFADE / 1000) next();
    }, 50);

    function load(i, t) {
      els[i].src = TRACKS[t];
      els[i].dataset.track = String(t);
    }

    function next() {
      crossing = true;
      const from = active;
      const to = 1 - active;
      track = (track + 1) % TRACKS.length;
      load(to, track);
      level[`mix${to}`] = 0;
      els[to].play().catch(() => {});
      tween(`mix${to}`, 1, XFADE);
      tween(`mix${from}`, 0, XFADE, () => { els[from].pause(); crossing = false; });
      active = to;
    }
    els.forEach((a, i) => {
      a.addEventListener('ended', () => { if (i === active && playing && !crossing) next(); });
      a.addEventListener('error', () => { if (i === active && playing && !crossing) next(); });
    });

    function start() {
      const a = els[active];
      if (!a.dataset.track) load(active, track);
      level[`mix${active}`] = 1;
      const p = a.play();
      Promise.resolve(p).then(() => {
        playing = true;
        blocked = false;
        tween('master', 1, FADE_IN);
        render();
      }).catch(() => {
        playing = false;
        blocked = true;
        render();
      });
    }

    function stop(ms, then) {
      playing = false;
      tween('master', 0, ms, () => { els.forEach((a) => a.pause()); if (then) then(); });
    }

    function toggle() {
      if (blocked || (pref.on && !playing)) { pref.on = true; start(); }
      else if (pref.on) { pref.on = false; stop(FADE_OFF); }
      else { pref.on = true; start(); }
      save();
      render();
    }

    function render() {
      const on = pref.on && !blocked;
      $('music-state').textContent = str(on ? 'screen.audio.on' : 'screen.audio.off');
      $('music').classList.toggle('is-off', !on);
      $('music-toggle').setAttribute('aria-pressed', String(on));
      const vol = $('music-vol');
      vol.value = String(pref.vol);
      vol.style.setProperty('--v', `${Math.round(pref.vol * 100)}%`);
    }

    function init() {
      $('music-label').textContent = str('screen.audio.title');
      $('music-vol').setAttribute('aria-label', str('screen.audio.volume'));
      $('music-toggle').addEventListener('click', toggle);
      $('music-vol').addEventListener('input', (e) => {
        pref.vol = clamp01(e.target.value);
        save();
        apply();
        render();
      });
      // play() refused (no gesture yet): the first click or key anywhere starts it, unless that
      // gesture is the music control itself (which does it on its own)
      const retry = (e) => {
        if (!blocked || !pref.on) return;
        if (e.target && e.target.closest && e.target.closest('#music')) return;
        if (e.code === 'KeyM') return;
        start();
      };
      window.addEventListener('pointerdown', retry, true);
      window.addEventListener('keydown', retry, true);
      render();
      if (pref.on) start();
    }

    return { init, toggle, fadeOut: (ms) => stop(ms) };
  })();

  // ── keys: M toggles the music, the arrows step through the tips ─────────────
  window.addEventListener('keydown', (e) => {
    if (e.repeat || exiting) return;
    if (e.code === 'KeyM') { Music.toggle(); return; }
    if (e.target && e.target.id === 'music-vol') return; // the arrows move the slider there
    if (e.key === 'ArrowRight') stepTip(dir === 'rtl' ? -1 : 1, true);
    else if (e.key === 'ArrowLeft') stepTip(dir === 'rtl' ? 1 : -1, true);
  });

  // ── exit: the type to ink in 300 ms, the plate in 700 ms, the music out ─────
  function exit() {
    if (exiting) return;
    exiting = true;
    clearTimeout(plateTimer);
    clearInterval(tipTimer);
    root.classList.add('is-exit');
    Music.fadeOut(700);
  }

  // ── the dev harness: a realistic event sequence ─────────────────────────────
  function devSequence() {
    const out = [];
    let t = 300;
    const at = (dt, e) => { t += dt; out.push([t, e]); };
    const initType = (type, orders) => {
      at(250, { eventName: 'startInitFunction', type });
      orders.forEach((count, o) => {
        at(120, { eventName: 'startInitFunctionOrder', type, order: o + 1, count });
        for (let i = 1; i <= count; i++) {
          at(70, { eventName: 'initFunctionInvoking', type, name: `fn_${o}_${i}`, idx: i });
          at(40, { eventName: 'initFunctionInvoked', type, name: `fn_${o}_${i}` });
        }
      });
      at(120, { eventName: 'endInitFunction', type });
    };
    at(0, { eventName: 'loadProgress', loadFraction: .01 });
    at(900, { eventName: 'loadProgress', loadFraction: .05 });
    initType('INIT_BEFORE_MAP_LOADED', [6, 9]);
    at(200, { eventName: 'loadProgress', loadFraction: .22 });
    const files = 180;
    at(300, { eventName: 'startDataFileEntries', count: files });
    for (let i = 1; i <= files; i++) {
      at(45, { eventName: 'onDataFileEntry', type: 'DLC_ITYP_REQUEST', isNew: true, name: `platform:/data/file_${i}.meta` });
      if (i % 6 === 0) at(10, { eventName: 'performMapLoadFunction', idx: i / 6 });
      if (i % 20 === 0) at(0, { eventName: 'loadProgress', loadFraction: .22 + .45 * (i / files) });
    }
    at(300, { eventName: 'endDataFileEntries' });
    initType('INIT_AFTER_MAP_LOADED', [8, 12]);
    at(200, { eventName: 'loadProgress', loadFraction: .8 });
    initType('INIT_SESSION', [5, 10, 6]);
    at(400, { eventName: 'loadProgress', loadFraction: 1 });
    at(1500, { eventName: 'wl_ready' });
    return out;
  }

  function devReplay() {
    const speed = Math.max(.1, Number(Q.get('speed')) || 1);
    const skip = Math.max(0, Number(Q.get('at')) || 0) * 1000;
    const post = (e) => window.postMessage(e, '*');
    devSequence().forEach(([t, e]) => {
      if (t <= skip) onLoadEvent(e);
      else setTimeout(() => post(e), (t - skip) / speed);
    });
    const exitAt = Number(Q.get('exit'));
    if (exitAt > 0) setTimeout(() => post({ eventName: 'wl_exit' }), exitAt * 1000);
  }

  // ── boot ─────────────────────────────────────────────────────────────────────
  /** Ask for every face this language draws with, by name and with a sample of its script, so
   *  the type is revealed in its own faces (document.fonts.ready alone resolves before layout
   *  has requested anything). A face that fails simply leaves its fallback. */
  function loadFonts() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const AR = 'ريد ريفر ١٢٣', EN = 'RED RIVER 0123';
    const faces = lang === 'ar'
      ? [['1em "Lalezar"', AR], ['1em "Amiri"', AR], ['1em "Amiri"', EN], ['1em "Aref Ruqaa"', AR],
        ['700 1em "Tajawal"', AR], ['400 1em "Tajawal"', AR], ['1em "RDR Lino"', EN], ['1em "RDR Catalogue"', EN]]
      : [['1em "RDR Lino"', EN], ['1em "Hapna Slab"', EN], ['1em "RDR Catalogue"', EN], ['1em "Lalezar"', AR]];
    return Promise.all(faces.map(([font, text]) => document.fonts.load(font, text).catch(() => null)));
  }

  async function boot() {
    S = await loadStrings();
    renderStatic();

    plates = pickPlates();
    const asked = Q.get('plate');
    let start = Math.floor(Math.random() * Math.max(1, plates.length));
    if (DEV && asked) {
      const byId = plates.findIndex((p) => p.id === asked);
      const byNo = parseInt(asked, 10) - 1;
      if (byId >= 0) start = byId;
      else if (byNo >= 0 && byNo < plates.length) start = byNo;
    }
    platePos = start;

    const fontsReady = loadFonts();
    const firstReady = (async () => {
      // a plate that fails to load is dropped; the next one opens instead
      while (plates.length && !(await preload(plates[platePos]))) {
        plates.splice(platePos, 1);
        if (platePos >= plates.length) platePos = 0;
      }
    })();
    await Promise.race([Promise.all([firstReady, fontsReady]), wait(2500)]);
    const first = plates[platePos];

    if (first) {
      mountPlate(first, BOOT_DEVELOP);
      renderCaption();
      if (plates.length > 1) preload(plates[(platePos + 1) % plates.length]);
    }
    root.classList.add('is-ready');
    scheduleNextPlate();
    startTips();
    Music.init();
    if (DEV) devReplay();
  }

  boot();
})();
