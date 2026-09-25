/* ════════════════════════════════════════════════════════════════════════════
   Wraith Core · the loading curtain (client/main.lua drives it with SendNUIMessage)
     { action = 'show', serverName, text, sub?, locale, dir }   raise it / update its lines
     { action = 'hide' }                                         lower it
     { action = 'setLocale', locale, dir }                       switch the language
   ?dev=1&lang=ar|en&text=...&sub=... shows it in a normal browser.
   ════════════════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const BRAND_LATIN = 'WRAITH CORE';
  const BRAND_ARABIC = 'ريث كور';
  const root = document.documentElement;
  const curtain = document.getElementById('curtain');
  const text = document.getElementById('text');
  const sub = document.getElementById('sub');
  const primary = document.getElementById('c-primary');
  const second = document.getElementById('c-second');

  function setLocale(d) {
    if (!d || !d.locale) return;
    const ar = d.locale === 'ar';
    root.lang = ar ? 'ar' : 'en';
    root.dir = d.dir === 'rtl' || d.dir === 'ltr' ? d.dir : (ar ? 'rtl' : 'ltr');
    primary.textContent = ar ? BRAND_ARABIC : BRAND_LATIN;
    second.textContent = ar ? BRAND_LATIN : BRAND_ARABIC;
    second.lang = ar ? 'en' : 'ar';
  }
  setLocale({ locale: 'en' });

  // fetch the faces now, while the curtain is down, so its first raise never waits on them
  if (document.fonts && document.fonts.load) {
    [['1em "RDR Lino"', 'WRAITH CORE'], ['1em "Hapna Slab"', 'Loading'], ['1em "Lalezar"', BRAND_ARABIC],
      ['700 1em "Tajawal"', 'جارٍ'], ['1em "Amiri"', 'جارٍ']]
      .forEach(([font, sample]) => document.fonts.load(font, sample).catch(() => null));
  }

  function show(d) {
    setLocale(d);
    text.textContent = typeof d.text === 'string' ? d.text : '';
    sub.textContent = typeof d.sub === 'string' ? d.sub : '';
    if (typeof d.serverName === 'string' && d.serverName) curtain.setAttribute('aria-label', d.serverName);
    curtain.classList.add('on');
    curtain.setAttribute('aria-hidden', 'false');
  }

  function hide() {
    curtain.classList.remove('on');
    curtain.setAttribute('aria-hidden', 'true');
  }

  window.addEventListener('message', (event) => {
    const d = event.data || {};
    if (d.action === 'show') show(d);
    else if (d.action === 'hide') hide();
    else if (d.action === 'setLocale') setLocale(d);
  });

  // the dev harness
  const Q = new URLSearchParams(location.search);
  if (Q.get('dev') === '1') {
    const ar = Q.get('lang') === 'ar';
    if (Q.get('bg') !== 'none') document.body.style.setProperty('background', '#3a352c', 'important');
    show({
      locale: ar ? 'ar' : 'en',
      dir: ar ? 'rtl' : 'ltr',
      serverName: 'Wraith Core RedM',
      text: Q.get('text') || (ar ? 'جارٍ تجهيز شخصياتك' : 'Preparing your characters'),
      sub: Q.get('sub') || '',
    });
    if (Q.get('hide') === '1') hide();
  }
})();
