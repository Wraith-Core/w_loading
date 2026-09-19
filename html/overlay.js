(() => {
  const curtain = document.getElementById('curtain');
  const text = document.getElementById('text');
  const sub = document.getElementById('sub');
  const setLocale = (d) => {
    if (!d.locale) return;
    document.documentElement.lang = d.locale === 'ar' ? 'ar' : 'en';
    document.documentElement.dir = d.locale === 'ar' ? 'rtl' : 'ltr';
  };
  window.addEventListener('message', (event) => {
    const d = event.data || {};
    if (d.action === 'show') {
      setLocale(d);
      text.textContent = typeof d.text === 'string' ? d.text : '';
      sub.textContent = typeof d.sub === 'string' ? d.sub : '';
      if (typeof d.serverName === 'string') document.getElementById('curtain-server').textContent = d.serverName;
      curtain.classList.add('on'); curtain.setAttribute('aria-hidden', 'false');
    } else if (d.action === 'hide') {
      curtain.classList.remove('on'); curtain.setAttribute('aria-hidden', 'true');
    } else if (d.action === 'setLocale') setLocale(d);
  });
})();
