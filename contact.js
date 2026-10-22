(() => {
  const $ = s => document.querySelector(s);
  const nav = $('#nav'), menuBtn = $('#menuBtn'), drawer = $('#drawer'), scrim = $('#scrim'),
        closeBtn = $('#closeBtn'), searchBtn = $('#searchBtn'), searchBar = $('#searchBar'), searchInput = $('#searchInput');

  /* 1. Scroll: shadow lagao, neeche scroll par hide, upar scroll par wapas show */
  let lastY = scrollY, ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY;
      nav.classList.toggle('scrolled', y > 10);
      const lock = drawer.classList.contains('open') || !searchBar.hidden;
      nav.classList.toggle('hide', !lock && y > lastY && y > 160);
      lastY = y; ticking = false;
    });
  }, { passive: true });

  /* 2. Drawer (menu) */
  const openMenu = () => {
    drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false');
    scrim.hidden = false; requestAnimationFrame(() => scrim.classList.add('show'));
    menuBtn.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden';
    closeBtn.focus();
  };
  const closeMenu = () => {
    drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true');
    scrim.classList.remove('show'); setTimeout(() => (scrim.hidden = true), 300);
    menuBtn.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
    menuBtn.focus();
  };
  menuBtn.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);
  scrim.addEventListener('click', closeMenu);
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  /* 3. Search bar */
  const toggleSearch = show => {
    searchBar.hidden = !show; searchBtn.setAttribute('aria-expanded', show);
    if (show) searchInput.focus(); else searchBtn.focus();
  };
  searchBtn.addEventListener('click', () => toggleSearch(searchBar.hidden));
  searchBar.addEventListener('submit', e => {
    e.preventDefault();
    const q = searchInput.value.trim();
    if (q) location.href = `search.html?q=${encodeURIComponent(q)}`; // apna search page yahan lagayein
  });

  /* 4. Esc se band karein + outside click se search band */
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (drawer.classList.contains('open')) closeMenu();
    else if (!searchBar.hidden) toggleSearch(false);
  });
  document.addEventListener('click', e => {
    if (!searchBar.hidden && !nav.contains(e.target)) toggleSearch(false);
  });

  /* 5. Active link khud highlight (current page ke naam se) */
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .drawer a').forEach(a => {
    a.toggleAttribute('aria-current', a.getAttribute('href') === page);
  });
})();


(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const store = {
    get(k){ try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
    del(k){ try { localStorage.removeItem(k); } catch {} }
  };
  const debounce = (fn, ms = 400) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  /* Toast */
  let tt;
  const toast = (text) => { const t = $('#toast'); t.textContent = text; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 3200); };

  /* Validation rules */
  const rules = {
    name:    v => v.trim().length < 2 ? 'Please enter your name.' : '',
    email:   v => !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? 'Enter a valid email, like name@example.com.' : '',
    message: v => v.trim().length < 10 ? 'Message should be at least 10 characters.' : ''
  };
  const form = $('#contact');
  const setState = (el, err) => {
    const f = el.closest('.field'); if (!f) return !err;
    f.classList.toggle('bad', !!err); f.classList.toggle('good', !err && el.value.trim() !== '');
    f.querySelector('.msg').textContent = err; el.setAttribute('aria-invalid', !!err);
    return !err;
  };
  const check = el => rules[el.name] ? setState(el, rules[el.name](el.value)) : true;

  /* Live validation: only after first blur, so users aren't nagged while typing */
  form.querySelectorAll('input,textarea').forEach(el => {
    let touched = false;
    el.addEventListener('blur', () => { touched = true; check(el); });
    el.addEventListener('input', () => { if (touched) check(el); });
  });

  /* Character counter + auto-grow textarea */
  const msg = $('#message'), count = $('#count');
  msg.addEventListener('input', () => {
    count.textContent = `${msg.value.length}/500`;
    msg.style.height = 'auto'; msg.style.height = Math.max(130, msg.scrollHeight) + 'px';
  });

  /* Auto-save draft (localStorage, with fallback if blocked) */
  const draftEl = $('#draft'), KEY = 'rose-eclat-draft';
  const saveDraft = debounce(() => {
    const d = Object.fromEntries(new FormData(form));
    if (Object.values(d).some(v => v.trim())) { store.set(KEY, d); draftEl.textContent = 'Draft saved on this device'; }
  }, 600);
  form.addEventListener('input', saveDraft);
  const saved = store.get(KEY);
  if (saved) {
    for (const [k, v] of Object.entries(saved)) if (form.elements[k]) form.elements[k].value = v;
    msg.dispatchEvent(new Event('input')); draftEl.textContent = 'We restored your unsent draft';
  }

  /* Ripple on buttons */
  document.addEventListener('click', e => {
    const b = e.target.closest('.btn'); if (!b) return;
    const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height), d = document.createElement('span');
    d.className = 'ripple'; Object.assign(d.style, { width: s + 'px', height: s + 'px', left: e.clientX - r.left - s / 2 + 'px', top: e.clientY - r.top - s / 2 + 'px' });
    b.appendChild(d); setTimeout(() => d.remove(), 600);
  });

  /* Asli submit: Formspree ko form ka data bhejta hai (form ke action URL par) */
  const sendToFormspree = async (formEl, subject) => {
    const data = new FormData(formEl);
    data.append('_subject', subject);
    const res = await fetch(formEl.action, {
      method: 'POST',
      body: data,
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) {
      let detail = '';
      try { detail = (await res.json()).errors?.map(x => x.message).join(', '); } catch {}
      throw new Error(detail || 'Request failed (' + res.status + ')');
    }
  };
  const busy = (btn, on) => { btn.classList.toggle('load', on); btn.disabled = on; };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const fields = [...form.querySelectorAll('input,textarea')];
    const results = fields.map(check);
    if (results.includes(false)) {
      fields.find(el => el.closest('.field').classList.contains('bad')).focus();
      return toast('Please fix the highlighted fields.');
    }
    const btn = form.querySelector('.btn'); busy(btn, true);
    try {
      await sendToFormspree(form, 'New message from Rose Éclat contact form');
      form.reset(); store.del(KEY); count.textContent = '0/500'; msg.style.height = '';
      form.querySelectorAll('.field').forEach(f => f.classList.remove('good', 'bad'));
      draftEl.textContent = ''; toast('Thank you! Your message has been sent.');
    } catch (err) { console.error(err); toast('Could not send. Please check your internet and try again.'); }
    finally { busy(btn, false); }
  });

  /* Newsletter */
  const news = $('#news'), nmail = $('#nmail');
  news.addEventListener('submit', async e => {
    e.preventDefault();
    const ok = rules.email(nmail.value) === '';
    nmail.classList.toggle('bad', !ok);
    if (!ok) { nmail.focus(); return toast('Enter a valid email address.'); }
    const btn = news.querySelector('.btn'); busy(btn, true);
    try {
      await sendToFormspree(news, 'New newsletter subscriber');
      nmail.value = '';
      toast('You’re subscribed. Welcome to Rose Éclat!');
    } catch (err) { console.error(err); toast('Could not subscribe. Please try again.'); }
    finally { busy(btn, false); }
  });
  nmail.addEventListener('input', () => nmail.classList.remove('bad'));

  /* Copy email */
  $('#copyMail').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText('hello@rose-eclat.com'); toast('Email address copied'); }
    catch { toast('Press Ctrl/Cmd + C to copy: hello@rose-eclat.com'); }
  });

  /* Live "open now" status in Karachi time (Mon–Sat, 10:00–19:00) */
  const status = $('#status');
  const updateStatus = () => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Karachi', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    const g = t => parts.find(p => p.type === t).value;
    const mins = (+g('hour') % 24) * 60 + +g('minute'), day = g('weekday');
    const open = day !== 'Sun' && mins >= 600 && mins < 1140;
    status.classList.toggle('open', open);
    status.querySelector('b').textContent = open ? 'Open now' : 'Closed right now';
  };
  updateStatus(); setInterval(updateStatus, 60000);

  /* Hero parallax (skipped for reduced motion) */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bg = $('#heroBg'); let ticking = false;
  if (!reduce) addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { bg.style.transform = `translateY(${Math.min(scrollY, 500) * 0.25}px)`; ticking = false; });
  }, { passive: true });

  /* Theme toggle (remembered, defaults to system) */
  const root = document.documentElement, tbtn = $('#theme');
  const applyTheme = t => { root.dataset.theme = t; tbtn.textContent = t === 'dark' ? 'Light mode' : 'Dark mode'; tbtn.setAttribute('aria-pressed', t === 'dark'); };
  applyTheme(store.get('rose-theme') || 'light');
  tbtn.addEventListener('click', () => { const n = root.dataset.theme === 'dark' ? 'light' : 'dark'; applyTheme(n); store.set('rose-theme', n); });
})();


