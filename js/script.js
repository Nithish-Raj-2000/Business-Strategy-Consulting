/* ============================================================
   STACKLY Consulting — script.js
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Sticky header ---------- */
  const head = $('.site-head');
  if (head) {
    const onScroll = () => head.classList.toggle('scrolled', window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile nav ---------- */
  const navToggle = $('.nav-toggle');
  const mainNav = $('.main-nav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const open = mainNav.classList.toggle('open');
      navToggle.textContent = open ? '✕' : '☰';
      navToggle.setAttribute('aria-expanded', open);
    });
    $$('.main-nav a').forEach(a => a.addEventListener('click', () => {
      mainNav.classList.remove('open');
      navToggle.textContent = '☰';
    }));
  }

  /* ---------- Constellation canvas (heroes / brand panels) ---------- */
  $$('.hero-canvas').forEach(cv => {
    if (reduced) return;
    const ctx = cv.getContext('2d');
    let w, h, pts = [], raf;
    const N = () => Math.min(70, Math.floor(w / 18));
    function size() {
      const r = cv.parentElement.getBoundingClientRect();
      w = cv.width = r.width; h = cv.height = r.height;
      pts = Array.from({ length: N() }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
        r: Math.random() * 1.6 + .6
      }));
    }
    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(191,230,207,.55)';
        ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
        if (d < 130 * 130) {
          ctx.strokeStyle = 'rgba(47,163,107,' + (0.16 * (1 - d / (130 * 130))).toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      raf = requestAnimationFrame(tick);
    }
    size(); tick();
    window.addEventListener('resize', () => { cancelAnimationFrame(raf); size(); tick(); });
  });

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .14 });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---------- Counters ---------- */
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, end = parseFloat(el.dataset.count), dur = 1600, t0 = performance.now();
    const dec = (String(el.dataset.count).split('.')[1] || '').length;
    (function step(t) {
      const p = Math.min((t - t0) / dur, 1), ease = 1 - Math.pow(1 - p, 3);
      el.textContent = (end * ease).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = end.toFixed(dec);
    })(t0);
    cio.unobserve(el);
  }), { threshold: .5 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---------- Bar fills (dashboards) ---------- */
  const bio = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.style.width = e.target.dataset.w + '%'; bio.unobserve(e.target); }
  }), { threshold: .4 });
  $$('.bar-fill').forEach(el => bio.observe(el));

  /* ---------- Tilt cards ---------- */
  if (!reduced) $$('[data-tilt]').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const rx = ((e.clientY - r.top) / r.height - .5) * -8;
      const ry = ((e.clientX - r.left) / r.width - .5) * 8;
      card.style.transform = 'perspective(700px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-8px)';
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });

  /* ---------- Testimonial slider ---------- */
  const slides = $$('.testi-slide');
  if (slides.length) {
    const dotsWrap = $('.testi-ctrl');
    let cur = 0, timer;
    slides.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
      d.addEventListener('click', () => go(i));
      dotsWrap.appendChild(d);
    });
    const dots = $$('.dot', dotsWrap);
    function go(i) {
      slides[cur].classList.remove('active'); dots[cur].classList.remove('active');
      cur = (i + slides.length) % slides.length;
      slides[cur].classList.add('active'); dots[cur].classList.add('active');
      restart();
    }
    function restart() { clearInterval(timer); timer = setInterval(() => go(cur + 1), 6500); }
    const prev = $('.testi-prev'), next = $('.testi-next');
    if (prev) prev.addEventListener('click', () => go(cur - 1));
    if (next) next.addEventListener('click', () => go(cur + 1));
    restart();
  }

  /* ---------- Filter tabs (case studies) ---------- */
  const tabs = $$('[data-filter]');
  if (tabs.length) {
    tabs.forEach(btn => btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      $$('[data-cat]').forEach(card => {
        const show = f === 'all' || card.dataset.cat === f;
        card.style.display = show ? '' : 'none';
        if (show) { card.classList.remove('in'); void card.offsetWidth; card.classList.add('in'); }
      });
    }));
  }

  /* ---------- Validation ---------- */
  /* domain must end in a real suffix — gmail.com, company.co, company.co.in, … */
  const EMAIL_RX = /^[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+(?:com|co|in|net|org|edu|gov|io|ai|dev|app|me|biz|info|us|uk|ca|au|de|fr|sg|ae|nz)$/i;
  const EMAIL_MSG = 'Enter a valid email — e.g. name@gmail.com, name@company.co or name@company.co.in.';

  const RX = {
    name: /^[A-Za-z][A-Za-z\s.'-]{2,49}$/,
    email: EMAIL_RX,
    phone: /^\d{10}$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/,
    loginpass: /^.{6,}$/,
    company: /^[A-Za-z][A-Za-z\s.,&'-]{1,59}$/,
    subject: /^[A-Za-z][A-Za-z\s.,'’!?-]{2,59}$/,
    message: /^[\s\S]{10,600}$/
  };
  const MSG = {
    name: 'Enter 3–50 letters (spaces, dots, hyphens allowed).',
    email: EMAIL_MSG,
    phone: 'Enter exactly 10 digits.',
    password: 'Min 8 chars with upper, lower, number & symbol.',
    loginpass: 'Enter your password (at least 6 characters).',
    company: 'Letters only — 2–60 characters, no numbers.',
    subject: 'Letters only — 3–60 characters, no numbers.',
    message: 'Message must be 10–600 characters.',
    confirm: 'Passwords do not match.'
  };
  const OK = {
    name: 'Looks good.', email: 'Valid email.', phone: 'Valid number.',
    password: 'Strong password.', loginpass: 'Looks good.', company: 'Looks good.',
    subject: 'Looks good.', message: 'Looks good.', confirm: 'Passwords match.'
  };
  function checkField(input) {
    const kind = input.dataset.validate;
    const field = input.closest('.form-field');
    const msg = field && field.querySelector('.field-msg');
    let valid;
    if (kind === 'confirm') {
      const other = $(input.dataset.match);
      valid = input.value.length > 0 && other && input.value === other.value;
    } else valid = RX[kind] && RX[kind].test(input.value.trim());
    if (field) {
      field.classList.toggle('ok', valid);
      field.classList.toggle('err', !valid);
      if (msg) msg.textContent = valid ? OK[kind] : MSG[kind];
    }
    return valid;
  }
  $$('[data-validate]').forEach(inp => {
    /* phone accepts digits only, capped at 10 */
    if (inp.dataset.validate === 'phone') {
      inp.addEventListener('input', () => {
        const cleaned = inp.value.replace(/\D/g, '').slice(0, 10);
        if (cleaned !== inp.value) inp.value = cleaned;
      });
    }
    /* company + subject reject digits as they are typed */
    if (inp.dataset.validate === 'company' || inp.dataset.validate === 'subject') {
      inp.addEventListener('input', () => {
        const cleaned = inp.value.replace(/\d/g, '');
        if (cleaned !== inp.value) {
          const at = inp.selectionStart - 1;
          inp.value = cleaned;
          inp.setSelectionRange(at, at);
        }
      });
    }
    inp.addEventListener('input', () => checkField(inp));
    inp.addEventListener('blur', () => { if (inp.value) checkField(inp); });
  });
  /* consent checkboxes (terms & conditions) */
  function checkConsent(box) {
    const field = box.closest('.terms-field');
    const msg = field && field.querySelector('.field-msg');
    const ok = box.checked;
    if (field) field.classList.toggle('err', !ok);
    if (msg) msg.textContent = ok ? '' : 'Please accept the Terms of Engagement to continue.';
    return ok;
  }
  $$('[data-require-check]').forEach(box => box.addEventListener('change', () => checkConsent(box)));

  function validateForm(form) {
    let all = true;
    $$('[data-validate]', form).forEach(inp => { if (!checkField(inp)) all = false; });
    $$('[data-require-check]', form).forEach(box => { if (!checkConsent(box)) all = false; });
    return all;
  }

  /* ---------- Password toggles ---------- */
  $$('.toggle-pass').forEach(btn => btn.addEventListener('click', () => {
    const inp = btn.parentElement.querySelector('input');
    const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    btn.textContent = show ? '🙈' : '👁';
  }));

  /* ---------- Auth: role routing ---------- */
  function role(form) {
    const r = $('input[name="role"]:checked', form);
    return r ? r.value : null;
  }
  /* ---------- Accounts + session ----------
     Front-end demo store: signup registers an account, login verifies it.
     There is no backend here, so treat none of this as real security. */
  const ACCOUNTS_KEY = 'stackly.accounts';
  const PROFILE_KEY = 'stackly.user';
  const SIGNUP_FLAG = 'stackly.justSignedUp';

  function readAccounts() {
    try {
      const list = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch (err) { return []; }
  }
  function writeAccounts(list) {
    try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list)); return true; } catch (err) { return false; }
  }
  const normMail = m => String(m || '').trim().toLowerCase();
  function findAccount(mail) {
    const key = normMail(mail);
    return readAccounts().filter(a => normMail(a.email) === key)[0] || null;
  }
  /* passwords are never kept in the clear — a demo digest, not real hashing */
  function digest(pass) {
    const s = String(pass);
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return 'v1.' + h.toString(36) + '.' + s.length;
  }

  /* ---------- Signed-in session (written by login only) ---------- */
  function readProfile() {
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'); } catch (err) { return null; }
  }
  function writeProfile(p) {
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch (err) { /* storage blocked */ }
  }
  function clearProfile() {
    try { localStorage.removeItem(PROFILE_KEY); } catch (err) { /* storage blocked */ }
  }
  function titleCase(s) {
    return String(s || '').replace(/[._\-]+/g, ' ').replace(/\s+/g, ' ').trim()
      .replace(/\b[a-z]/g, c => c.toUpperCase());
  }
  function nameFromEmail(mail) { return titleCase(String(mail || '').split('@')[0]) || 'Team Member'; }
  function initialsOf(name, mail) {
    const parts = String(name || nameFromEmail(mail)).trim().split(/\s+/);
    const i = (parts[0] || '')[0] + ((parts[1] || '')[0] || '');
    return (i || 'ST').toUpperCase();
  }

  /* success notes hold for 5s then fade out; errors stay until they're fixed */
  const STATUS_HOLD = 5000, STATUS_FADE = 350;
  function stopHold(el) {
    if (!el) return;
    clearTimeout(el._holdTimer);
    clearTimeout(el._fadeTimer);
    el.classList.remove('is-fading');
  }
  function holdThenClear(el) {
    stopHold(el);
    el._holdTimer = setTimeout(() => {
      el.classList.add('is-fading');
      el._fadeTimer = setTimeout(() => {
        el.textContent = '';
        el.className = 'form-status nl-msg';
      }, STATUS_FADE);
    }, STATUS_HOLD);
  }

  function authFlow(form, opts) {
    if (!form) return;
    const btn = $('button[type="submit"]', form);
    const status = $('.form-status', form);
    const setStatus = (text, cls) => {
      if (!status) return;
      stopHold(status);
      status.textContent = text;
      status.className = 'form-status nl-msg' + (cls ? ' ' + cls : '');
      if (cls === 'ok') holdThenClear(status);
    };

    /* re-check the confirm field whenever the password changes */
    const pass = $('[data-validate="password"]', form);
    const confirm = $('[data-validate="confirm"]', form);
    if (pass && confirm) pass.addEventListener('input', () => { if (confirm.value) checkField(confirm); });

    /* picking a role clears any role warning */
    $$('input[name="role"]', form).forEach(r => r.addEventListener('change', () => {
      const msg = $('.role-msg', form);
      if (msg) { msg.textContent = ''; msg.classList.remove('err'); }
    }));

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (btn && btn.disabled) return;

      const chosen = role(form);
      if (!chosen) {
        const msg = $('.role-msg', form);
        if (msg) { msg.textContent = 'Choose Client or Admin to continue.'; msg.classList.add('err'); }
        setStatus('Select a role before continuing.', 'err');
        return;
      }
      if (!validateForm(form)) {
        setStatus(opts.invalid, 'err');
        const firstBad = $('.form-field.err [data-validate]', form) || $('.terms-field.err [data-require-check]', form);
        if (firstBad) firstBad.focus();
        return;
      }

      const val = sel => { const el = $(sel, form); return el ? el.value.trim() : ''; };
      const res = opts.submit({
        role: chosen,
        email: val('[data-validate="email"]'),
        name: val('[data-validate="name"]'),
        phone: val('[data-validate="phone"]'),
        pass: val('[data-validate="password"]') || val('[data-validate="loginpass"]')
      });

      /* the account itself was rejected — flag the offending field, stay put */
      if (!res.ok) {
        setStatus(res.message, 'err');
        if (res.roleMsg) {
          const rm = $('.role-msg', form);
          if (rm) { rm.textContent = res.roleMsg; rm.classList.add('err'); }
          return;
        }
        const bad = res.focus && $(res.focus, form);
        if (bad) {
          const field = bad.closest('.form-field');
          if (field) {
            field.classList.add('err');
            field.classList.remove('ok');
            const m = $('.field-msg', field);
            if (m && res.fieldMsg) m.textContent = res.fieldMsg;
          }
          bad.focus();
        }
        return;
      }

      const label = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.textContent = opts.working; }
      setStatus(res.message, 'ok');

      setTimeout(() => {
        try {
          window.location.href = res.target;
        } catch (err) {
          if (btn) { btn.disabled = false; btn.innerHTML = label; }
          setStatus('Something went wrong — please try again.', 'err');
        }
      }, opts.delay);
    });
  }

  /* Login: the account must exist, and the password + role must match it. */
  authFlow($('#loginForm'), {
    invalid: 'Check the highlighted fields, then sign in again.',
    working: 'Signing you in…',
    delay: 800,
    submit(d) {
      const acc = findAccount(d.email);
      if (!acc) return {
        ok: false,
        message: 'No account found for that email — create one first.',
        focus: '[data-validate="email"]',
        fieldMsg: 'No account is registered with this email.'
      };
      if (acc.pass !== digest(d.pass)) return {
        ok: false,
        message: 'That password does not match our records.',
        focus: '[data-validate="loginpass"]',
        fieldMsg: 'Incorrect password.'
      };
      if (acc.role !== d.role) return {
        ok: false,
        message: 'This email is registered as ' + (acc.role === 'admin' ? 'an Admin' : 'a Client') + ' — pick that role to sign in.',
        roleMsg: 'Sign in as ' + (acc.role === 'admin' ? 'Admin' : 'Client') + ' for this account.'
      };
      /* verified — open the session the dashboards read */
      writeProfile({ name: acc.name, email: acc.email, phone: acc.phone || '', role: acc.role, at: Date.now() });
      return {
        ok: true,
        message: '✓ Credentials verified — opening your workspace…',
        target: acc.role === 'admin' ? 'admin-dashboard.html' : 'client-dashboard.html'
      };
    }
  });

  /* Signup: registers the account and hands off to login — it never signs you in. */
  authFlow($('#signupForm'), {
    invalid: 'Check the highlighted fields to create your account.',
    working: 'Creating your account…',
    delay: 900,
    submit(d) {
      if (findAccount(d.email)) return {
        ok: false,
        message: 'That email is already registered — log in instead.',
        focus: '[data-validate="email"]',
        fieldMsg: 'This email already has an account.'
      };
      const list = readAccounts();
      list.push({
        name: d.name || nameFromEmail(d.email),
        email: d.email,
        phone: d.phone || '',
        role: d.role,
        pass: digest(d.pass),
        created: new Date().toISOString()
      });
      if (!writeAccounts(list)) return {
        ok: false,
        message: 'Your browser is blocking storage — enable it to create an account.'
      };
      clearProfile();                                   /* signing up ≠ signing in */
      try { sessionStorage.setItem(SIGNUP_FLAG, d.email); } catch (err) { /* ignore */ }
      return { ok: true, message: '✓ Account created — log in to open your workspace.', target: 'login.html' };
    }
  });

  /* Arriving at login straight from signup: prefill the account we just made. */
  const loginForm = $('#loginForm');
  if (loginForm) {
    let justMade = null;
    try {
      justMade = sessionStorage.getItem(SIGNUP_FLAG);
      sessionStorage.removeItem(SIGNUP_FLAG);
    } catch (err) { /* ignore */ }
    if (justMade) {
      const mail = $('[data-validate="email"]', loginForm);
      if (mail) mail.value = justMade;
      const acc = findAccount(justMade);
      const pick = acc && $('input[name="role"][value="' + acc.role + '"]', loginForm);
      if (pick) pick.checked = true;
      const st = $('.form-status', loginForm);
      if (st) {
        st.textContent = '✓ Account created — sign in to open your workspace.';
        st.className = 'form-status nl-msg ok';
        holdThenClear(st);
      }
      const pass = $('[data-validate="loginpass"]', loginForm);
      if (pass) pass.focus();
    }
  }

  /* ---------- Contact form ---------- */
  const contactForm = $('#contactForm');
  if (contactForm) {
    const status = $('.form-status', contactForm);
    const submitBtn = $('button[type="submit"]', contactForm);
    let statusTimer = null;

    const setStatus = (text, cls) => {
      if (!status) return;
      clearTimeout(statusTimer);
      status.textContent = text;
      status.className = 'form-status nl-msg' + (cls ? ' ' + cls : '');
    };
    const clearFields = () => {
      $$('.form-field', contactForm).forEach(f => f.classList.remove('ok', 'err'));
      $$('.field-msg', contactForm).forEach(m => m.textContent = '');
    };

    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      if (submitBtn && submitBtn.disabled) return;

      if (!validateForm(contactForm)) {
        setStatus('Please fix the highlighted fields before sending.', 'err');
        const firstBad = $('.form-field.err [data-validate]', contactForm);
        if (firstBad) firstBad.focus();
        return;
      }

      /* all valid — simulate sending */
      setStatus('');
      const label = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

      setTimeout(() => {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = label; }
        contactForm.reset();
        clearFields();
        setStatus('✓ Message sent — our strategy desk replies within one business day.', 'ok');
        /* success message clears itself after 5s */
        statusTimer = setTimeout(() => setStatus(''), 5000);
      }, 900);
    });
  }

  /* ---------- Newsletter ---------- */
  const NL_EMAIL = EMAIL_RX;      /* same strict rule as the contact form */
  const NL_MSG = EMAIL_MSG;
  const NL_HOLD = 4000;           /* success message clears after 4s */

  $$('.nl-form').forEach(form => {
    const inp = $('input', form);
    const btn = $('button', form);
    const msg = form.parentElement.querySelector('.nl-msg');
    if (!inp || !btn) return;
    if (msg) { msg.setAttribute('aria-live', 'polite'); msg.setAttribute('role', 'status'); }
    form.setAttribute('novalidate', '');

    let clearTimer = null;
    const say = (text, cls) => {
      if (!msg) return;
      clearTimeout(clearTimer);
      msg.textContent = text;
      msg.className = 'nl-msg' + (cls ? ' ' + cls : '');
    };
    const state = cls => { form.classList.remove('err', 'ok'); if (cls) form.classList.add(cls); };

    /* live feedback while typing — clears the error as soon as it's valid */
    inp.addEventListener('input', () => {
      const val = inp.value.trim();
      if (!val) { state(null); say(''); return; }
      if (NL_EMAIL.test(val)) { state('ok'); say(''); return; }
      const showingErr = form.classList.contains('err');
      state(showingErr ? 'err' : null);
      if (showingErr) say(NL_MSG, 'err');
    });
    inp.addEventListener('blur', () => {
      const val = inp.value.trim();
      if (val && !NL_EMAIL.test(val)) { state('err'); say(NL_MSG, 'err'); }
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (btn.disabled) return;
      const val = inp.value.trim();

      if (!val) { state('err'); say('Please enter your work email to subscribe.', 'err'); inp.focus(); return; }
      if (!NL_EMAIL.test(val)) { state('err'); say(NL_MSG, 'err'); inp.focus(); return; }

      /* valid — simulate the subscribe request */
      state('ok'); say('');
      const label = btn.innerHTML;
      btn.disabled = true;
      btn.textContent = 'Subscribing…';

      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = label;
        inp.value = '';
        state(null);
        say('✓ Subscribed — the next Monday Briefing lands in your inbox.', 'ok');
        clearTimer = setTimeout(() => say(''), NL_HOLD);
      }, 900);
    });
  });

  /* ---------- Touch feedback: :hover never fires on tap ----------
     Adds .tap for ~500ms so cards/buttons show the same reaction a
     mouse gets. Paired with the `.tap` rules in the stylesheet.     */
  const touchCapable = window.matchMedia('(hover:none)').matches ||
    window.matchMedia('(pointer:coarse)').matches ||
    navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  if (touchCapable) {
    const TAPPABLE = [
      '.svc-card', '.case-card', '.ins-card', '.team-card', '.price-card', '.proc-card',
      '.stat-glass', '.stat-card', '.info-card', '.info-tile', '.faq', '.dash-panel',
      '.btn', '.icon-btn', '.avatar', '.nav-toggle', '.toggle-pass',
      '.foot-social a', '.foot-contact li', '.foot-col a', '.dash-nav a',
      '.hero-proof .pr', '.role-pick label', '.terms-check', '.marquee-track span',
      '.testi-arrows button', '.tabs button', '.map-open', '.link'
    ].join(',');

    const release = el => {
      clearTimeout(el._tapTimer);
      el._tapTimer = setTimeout(() => el.classList.remove('tap'), 500);
    };
    document.addEventListener('pointerdown', e => {
      const el = e.target.closest && e.target.closest(TAPPABLE);
      if (!el) return;
      clearTimeout(el._tapTimer);
      el.classList.add('tap');
    }, { passive: true });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev =>
      document.addEventListener(ev, e => {
        const el = e.target.closest && e.target.closest(TAPPABLE);
        if (el) release(el);
      }, { passive: true })
    );
  }

  /* ---------- Dashboard: gate on the session, then greet ---------- */
  const dashRoot = $('.dash-body');
  if (dashRoot) {
    const p = readProfile();
    const needs = /admin-dashboard/i.test(location.pathname) ? 'admin' : 'client';
    if (!p || !p.email) {
      /* no session — the dashboards are reachable through login only */
      location.replace('login.html');
    } else if (p.role !== needs) {
      /* signed in, wrong workspace — bounce to the one this account owns */
      location.replace(p.role === 'admin' ? 'admin-dashboard.html' : 'client-dashboard.html');
    } else {
      const first = String(p.name).trim().split(/\s+/)[0];
      const ini = initialsOf(p.name, p.email);

      const nameEl = $('.side-id-text b');
      if (nameEl) { nameEl.textContent = p.name; nameEl.title = p.name; }
      const mailEl = $('.side-mail');
      if (mailEl) { mailEl.textContent = p.email; mailEl.title = p.email; }
      $$('.side-avatar, .dash-user .avatar').forEach(el => el.textContent = ini);

      const title = $('[data-title]');
      if (title) {
        const greet = /good morning/i.test(title.textContent) ? 'Good morning, ' : 'Welcome back, ';
        const span = document.createElement('span');
        span.textContent = first;
        title.textContent = greet;
        title.appendChild(span);
      }
      const welcome = $('.dash-welcome');
      if (welcome) {
        const wb = $('b', welcome), ws = $('span', welcome);
        if (wb) wb.textContent = (/good morning/i.test(wb.textContent) ? 'Good morning, ' : 'Welcome back, ') + first;
        if (ws) ws.textContent = p.email;
      }
      /* client settings form mirrors the account on file */
      const sn = $('#stName'); if (sn) sn.value = p.name;
      const sm = $('#stMail'); if (sm) sm.value = p.email;
      const sp = $('#stPhone'); if (sp && p.phone) sp.value = p.phone;
    }
  }

  /* ---------- Logout: end the session before leaving ---------- */
  $$('.logout').forEach(a => a.addEventListener('click', () => clearProfile()));

  /* ---------- Dashboard sidebar ---------- */
  const dashToggle = $('.dash-menu-toggle'), dashSide = $('.dash-side'), sideClose = $('.side-close');
  if (dashToggle && dashSide) {
    const closeSide = () => dashSide.classList.remove('open');
    dashToggle.addEventListener('click', () => dashSide.classList.toggle('open'));
    if (sideClose) sideClose.addEventListener('click', closeSide);
    document.addEventListener('click', e => {
      if (window.innerWidth <= 900 && dashSide.classList.contains('open') &&
        !dashSide.contains(e.target) && !dashToggle.contains(e.target)) closeSide();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSide(); });
  }

  /* ---------- Dashboard panels (sidebar nav → in-page views) ---------- */
  const views = $$('.dash-view');
  if (views.length) {
    const navLinks = $$('.dash-nav a[data-view]');
    const title = $('[data-title]');
    const welcome = $('.dash-welcome');

    /* replay the count-up + bar fills each time a view is shown */
    function animate(view) {
      $$('[data-count]', view).forEach(el => {
        const end = parseFloat(el.dataset.count), dur = 1100, t0 = performance.now();
        const dec = (String(el.dataset.count).split('.')[1] || '').length;
        (function step(t) {
          const p = Math.min((t - t0) / dur, 1), ease = 1 - Math.pow(1 - p, 3);
          el.textContent = (end * ease).toFixed(dec);
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = end.toFixed(dec);
        })(t0);
      });
      $$('.bar-fill', view).forEach(el => {
        el.style.width = '0%';
        requestAnimationFrame(() => { el.style.width = el.dataset.w + '%'; });
      });
    }

    function show(name, push) {
      const target = views.find(v => v.dataset.panel === name);
      if (!target) return false;
      views.forEach(v => { v.hidden = v !== target; });
      navLinks.forEach(a => a.classList.toggle('active', a.dataset.view === name));

      const link = navLinks.find(a => a.dataset.view === name);
      if (link && title) {
        const label = link.textContent.replace(/^[^\w]+/, '').trim();
        title.innerHTML = name === 'overview'
          ? title.dataset.home || title.innerHTML
          : label + ' <span>· ' + (title.dataset.owner || '') + '</span>';
      }
      if (welcome) welcome.hidden = name !== 'overview';

      if (push !== false && history.replaceState) history.replaceState(null, '', '#' + name);
      target.classList.add('view-in');
      setTimeout(() => target.classList.remove('view-in'), 420);
      animate(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    }

    if (title) {
      title.dataset.home = title.innerHTML;
      const owner = $('.side-id-text b');
      title.dataset.owner = owner ? owner.textContent.trim() : '';
    }

    navLinks.forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      show(a.dataset.view);
      if (dashSide) dashSide.classList.remove('open');
    }));

    /* deep link support: client-dashboard.html#invoices */
    const start = (location.hash || '').replace('#', '');
    if (start) show(start, false);
  }
})();
