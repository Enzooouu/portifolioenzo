/* =========================================================
   Enzo · portfólio
   ========================================================= */

/* ↓↓↓ TROQUE AQUI: seu número com DDI + DDD, só dígitos (ex.: 5511987654321) ↓↓↓ */
const NUMERO = '5500000000000';
/* ↑↑↑ ---------------------------------------------------------------- ↑↑↑ */

(function () {
  'use strict';

  const root = document.documentElement;
  const LANG_KEY = 'enzo-lang';
  const LANGS = ['pt', 'en'];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  window.__enzoReady = true;

  /* ---------- utilidades ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  const fill = (tpl, data) => tpl.replace(/\{(\w+)\}/g, (_, k) => (data[k] == null ? '' : data[k]));

  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* sem storage, segue a vida */ } }
  };

  const waLink = (text) => 'https://wa.me/' + NUMERO + (text ? '?text=' + encodeURIComponent(text) : '');

  /* =========================================================
     IDIOMA (PT padrão, EN opcional)
     ========================================================= */
  const dictionaries = {};
  let current = 'pt';

  async function loadDict(lang) {
    if (dictionaries[lang]) return dictionaries[lang];
    const res = await fetch('assets/i18n/' + lang + '.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('i18n ' + lang + ' ' + res.status);
    dictionaries[lang] = await res.json();
    return dictionaries[lang];
  }

  function applyDict(dict) {
    $$('[data-i18n]').forEach((el) => {
      const v = get(dict, el.dataset.i18n);
      if (typeof v === 'string') el.textContent = v;
    });
    $$('[data-i18n-html]').forEach((el) => {
      const v = get(dict, el.dataset.i18nHtml);
      if (typeof v === 'string') el.innerHTML = v; // conteúdo vem só dos nossos JSONs
    });
    $$('[data-i18n-attr]').forEach((el) => {
      el.dataset.i18nAttr.split(';').forEach((pair) => {
        const [attr, key] = pair.split(':').map((s) => s.trim());
        const v = get(dict, key);
        if (attr && typeof v === 'string') el.setAttribute(attr, v);
      });
    });

    const meta = dict.meta || {};
    if (meta.title) document.title = meta.title;
    const desc = $('meta[name="description"]');
    if (desc && meta.description) desc.setAttribute('content', meta.description);
  }

  function markLang(lang) {
    current = lang;
    root.lang = lang === 'en' ? 'en' : 'pt-BR';
    $$('[data-lang-toggle] [data-lang]').forEach((s) => s.classList.toggle('is-current', s.dataset.lang === lang));
    updateWhatsAppLinks();
    updateMenuLabel();
  }

  async function setLang(lang, { save = true } = {}) {
    if (!LANGS.includes(lang)) lang = 'pt';
    try {
      const dict = await loadDict(lang);
      applyDict(dict);
    } catch (err) {
      // Sem JSON (ex.: aberto via file://), mantém o texto que está no HTML.
      console.warn('[i18n] não deu para carregar o idioma', lang, err);
      if (lang !== 'pt') return;
    }
    markLang(lang);
    if (save) storage.set(LANG_KEY, lang);
  }

  const t = (key, fallback) => {
    const v = get(dictionaries[current] || {}, key);
    return typeof v === 'string' ? v : fallback;
  };

  $$('[data-lang-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => setLang(current === 'pt' ? 'en' : 'pt'));
  });

  /* =========================================================
     WHATSAPP
     ========================================================= */
  const WA_FALLBACK = {
    default: 'Olá, Enzo! Vi seu site e quero conversar sobre um projeto.',
    quote: 'Olá, Enzo! Quero pedir um orçamento de site.'
  };

  function updateWhatsAppLinks() {
    $$('[data-wa]').forEach((a) => {
      const kind = a.dataset.wa || 'default';
      a.href = waLink(t('wa.' + kind, WA_FALLBACK[kind] || WA_FALLBACK.default));
      a.target = '_blank';
      a.rel = 'noopener';
    });
  }

  /* ---------- formulário → WhatsApp ---------- */
  const form = $('[data-wa-form]');
  if (form) {
    const status = $('[data-form-status]', form);
    const fields = {
      nome: form.elements.nome,
      whatsapp: form.elements.whatsapp,
      mensagem: form.elements.mensagem
    };

    const setError = (name, msg) => {
      const input = fields[name];
      const box = $('[data-error-for="' + name + '"]', form);
      if (msg) {
        input.setAttribute('aria-invalid', 'true');
        box.textContent = msg;
        box.hidden = false;
      } else {
        input.removeAttribute('aria-invalid');
        box.textContent = '';
        box.hidden = true;
      }
    };

    const validate = () => {
      const errors = {};
      const nome = fields.nome.value.trim();
      const msg = fields.mensagem.value.trim();
      const digits = fields.whatsapp.value.replace(/\D/g, '');

      if (!nome) errors.nome = t('form.errors.name', 'Escreva seu nome.');
      if (digits && (digits.length < 10 || digits.length > 13)) {
        errors.whatsapp = t('form.errors.whatsapp', 'Confira o número: use DDD + número.');
      }
      if (!msg) errors.mensagem = t('form.errors.message', 'Escreva sua mensagem.');

      Object.keys(fields).forEach((k) => setError(k, errors[k]));
      return errors;
    };

    Object.values(fields).forEach((input) => {
      input.addEventListener('input', () => {
        if (input.getAttribute('aria-invalid') === 'true') validate();
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      status.textContent = '';
      status.classList.remove('is-error');

      const errors = validate();
      const first = Object.keys(errors)[0];
      if (first) {
        fields[first].focus();
        status.classList.add('is-error');
        status.textContent = t('form.errors.summary', 'Faltou alguma coisa. Confira os campos marcados.');
        return;
      }

      const data = {
        nome: fields.nome.value.trim(),
        whatsapp: fields.whatsapp.value.trim(),
        mensagem: fields.mensagem.value.trim()
      };
      let text = fill(t('wa.form', 'Olá, Enzo! Sou {nome}.\n\n{mensagem}'), data);
      if (data.whatsapp) text += fill(t('wa.formPhone', '\n\nMeu WhatsApp: {whatsapp}'), data);

      const url = waLink(text);
      const win = window.open(url, '_blank');
      if (win) win.opener = null;
      else window.location.href = url; // pop-up bloqueado: abre na mesma aba
      status.textContent = t('form.sent', 'Abrimos o WhatsApp com a sua mensagem. É só tocar em enviar.');
    });
  }

  /* =========================================================
     MENU (celular)
     ========================================================= */
  const header = $('[data-header]');
  const nav = $('[data-nav]');
  const toggle = $('[data-menu-toggle]');

  function updateMenuLabel() {
    if (!toggle) return;
    const open = toggle.getAttribute('aria-expanded') === 'true';
    const label = $('.sr-only', toggle);
    if (label) label.textContent = open ? t('nav.menuClose', 'Fechar menu') : t('nav.menu', 'Abrir menu');
  }

  function setMenu(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    updateMenuLabel();
  }

  if (toggle && nav) {
    toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        toggle.focus();
      }
    });
    document.addEventListener('click', (e) => {
      if (toggle.getAttribute('aria-expanded') === 'true' && !header.contains(e.target)) setMenu(false);
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', (m) => { if (m.matches) setMenu(false); });
  }

  /* cabeçalho com borda depois de rolar */
  const onScroll = () => header && header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* link ativo no menu */
  const navLinks = $$('.nav-list a[href^="#"]');
  const sectionIds = ['inicio', 'servicos', 'projetos', 'processo', 'contato'];
  const linkFor = { processo: 'servicos' }; // "Como trabalho" acende "Serviços"
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = linkFor[entry.target.id] || entry.target.id;
        navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sectionIds.forEach((id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* =========================================================
     ENTRADA AO ROLAR
     ========================================================= */
  const revealEls = $$('[data-reveal]');
  if (!('IntersectionObserver' in window) || reduceMotion.matches) {
    revealEls.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  }

  /* peça do logo: depois de pousar, libera a reação ao mouse */
  const piece = $('.art-piece');
  if (piece) {
    const settle = () => piece.classList.add('is-settled');
    if (reduceMotion.matches) settle();
    else piece.addEventListener('animationend', settle, { once: true });
  }

  /* =========================================================
     BOTÕES MAGNÉTICOS
     ========================================================= */
  function magnetic(el) {
    const label = $('.btn-label', el);
    const pull = el.classList.contains('btn-sm') ? 0.25 : 0.32;
    let frame = 0;

    const move = (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transitionDuration = '.2s, .2s, .2s, .35s';
        el.style.transform = 'translate3d(' + (x * pull).toFixed(2) + 'px,' + (y * pull * 1.2).toFixed(2) + 'px,0)';
        if (label) label.style.transform = 'translate3d(' + (x * pull * 0.45).toFixed(2) + 'px,' + (y * pull * 0.5).toFixed(2) + 'px,0)';
      });
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      el.style.transitionDuration = '';
      el.style.transform = '';
      if (label) label.style.transform = '';
    };

    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', reset);
    el.addEventListener('blur', reset);
  }

  const enableMagnetic = () => finePointer.matches && !reduceMotion.matches;
  if (enableMagnetic()) $$('[data-magnetic]').forEach(magnetic);

  /* =========================================================
     INÍCIO
     ========================================================= */
  const saved = storage.get(LANG_KEY);
  if (saved === 'en') {
    setLang('en', { save: false });
    loadDict('pt').catch(() => {});
  } else {
    markLang('pt');
    loadDict('pt').catch(() => {});
  }
})();
