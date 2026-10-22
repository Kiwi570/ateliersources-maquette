// Barre, menu, mode calme, transitions de page, boutons magnétiques, cartes inclinables, formulaires simulés.
import { qs, qsa, estCalme, pointeurFin, ecrireStockage } from './outils.js';
import { defilerVers } from './defilement.js';
import { goutte } from './son.js';

const page = () => location.pathname.split('/').pop().replace('.html', '') || 'index';

export function rideauFermer() {
  const r = qs('.rideau');
  return new Promise((ok) => {
    if (!r || estCalme()) return ok();
    gsap.fromTo(r, { yPercent: 125 }, { yPercent: 0, duration: 0.75, ease: 'power3.inOut', onComplete: ok });
  });
}

function barre() {
  const b = qs('.barre');
  const sombres = qsa('[data-theme="sombre"]');
  let raf = 0;
  const maj = () => {
    raf = 0;
    const y = window.scrollY, h = b.offsetHeight / 2;
    const sombre = sombres.some((s) => { const r = s.getBoundingClientRect(); return r.top <= h && r.bottom >= h; });
    b.classList.toggle('is-sombre', sombre);
    b.classList.toggle('is-fond', y > window.innerHeight * 0.7);

  };
  window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(maj); }, { passive: true });
  maj();
}

function menu() {
  const btn = qs('[data-burger]'), m = qs('#menu');
  if (!btn || !m) return;
  const fermer = () => {
    btn.setAttribute('aria-expanded', 'false'); m.classList.remove('is-ouvert');
    document.documentElement.classList.remove('menu-ouvert');
    setTimeout(() => { if (!m.classList.contains('is-ouvert')) m.hidden = true; }, 800);
  };
  btn.addEventListener('click', () => {
    const ouvrir = btn.getAttribute('aria-expanded') !== 'true';
    if (ouvrir) {
      m.hidden = false; requestAnimationFrame(() => m.classList.add('is-ouvert'));
      btn.setAttribute('aria-expanded', 'true'); document.documentElement.classList.add('menu-ouvert');
      qs('.barre').classList.add('is-sombre');
      if (!estCalme()) gsap.from(qsa('nav a', m), { yPercent: 60, opacity: 0, stagger: 0.05, duration: 0.8, ease: 'power3.out', delay: 0.2 });
    } else fermer();
  });
  m.addEventListener('click', (e) => { if (e.target.closest('a')) fermer(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { fermer(); btn.focus(); } });
}

function calme() {
  qsa('[data-calme]').forEach((b) => {
    b.setAttribute('aria-pressed', String(estCalme()));
    b.addEventListener('click', async () => {
      const vers = !estCalme();
      ecrireStockage('ads-calme', vers ? '1' : '0');
      b.setAttribute('aria-pressed', String(vers));
      sessionStorage && (() => { try { sessionStorage.setItem('ads-retour-y', String(window.scrollY)); } catch (e) {} })();
      await rideauFermer();
      location.reload();
    });
  });
  try {
    const y = sessionStorage.getItem('ads-retour-y');
    if (y) { sessionStorage.removeItem('ads-retour-y'); window.addEventListener('load', () => window.scrollTo(0, Number(y))); }
  } catch (e) {}
}

function liens() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    if (a.hasAttribute('data-a-completer')) { e.preventDefault(); bulle(a, 'Page à compléter avec le client'); return; }
    const href = a.getAttribute('href');
    if (href.startsWith('tel:') || href.startsWith('mailto:') || /^https?:/.test(href)) return;
    const [chemin, ancre] = href.split('#');
    const norm = (c) => c.replace(/^\.?\//, '').replace('.html', '') || 'index';
    const cible = chemin ? norm(chemin) : page();
    const ici = cible === page();
    if (ici && ancre !== undefined) {
      const el = document.getElementById(ancre);
      if (!el) return;
      e.preventDefault();
      const y = el.getBoundingClientRect().top + window.scrollY;
      if (el.matches('input')) { defilerVers(y - window.innerHeight / 2); setTimeout(() => el.focus({ preventScroll: true }), 1100); }
      else {
        defilerVers(y);
        // le focus suit le lien (lien d'évitement, ancres) pour la navigation au clavier
        const cible = el.querySelector('h1, h2') || el;
        if (!cible.hasAttribute('tabindex')) cible.setAttribute('tabindex', '-1');
        cible.focus({ preventScroll: true });
      }
      history.replaceState(null, '', '#' + ancre);
      return;
    }
    if (chemin && (chemin.endsWith('.html') || chemin === './' || chemin === '/')) {
      e.preventDefault();
      goutte(0.7);
      try { sessionStorage.setItem('ads-intro', '1'); } catch (err) {}
      rideauFermer().then(() => { location.href = href; });
    }
  });
  window.addEventListener('pageshow', (e) => { if (e.persisted) gsap.set('.rideau', { yPercent: 125 }); });
}

function bulle(el, texte) {
  const b = document.createElement('span');
  b.className = 'bulle'; b.textContent = texte; b.setAttribute('role', 'status');
  Object.assign(b.style, { position: 'absolute', zIndex: 300, background: 'var(--calcaire)', color: 'var(--profond)', padding: '6px 12px', borderRadius: '999px', fontSize: '.8rem', whiteSpace: 'nowrap' });
  document.body.appendChild(b);
  const r = el.getBoundingClientRect();
  b.style.left = `${r.left + window.scrollX}px`; b.style.top = `${r.top + window.scrollY - 40}px`;
  setTimeout(() => b.remove(), 2200);
}

function magnetiques() {
  if (estCalme() || !pointeurFin()) return;
  qsa('.magnetique').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
    const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - (r.left + r.width / 2)) * 0.28);
      y((e.clientY - (r.top + r.height / 2)) * 0.38);
    });
    el.addEventListener('pointerleave', () => { x(0); y(0); });
  });
  const geant = qs('.btn-geant');
  if (geant) geant.addEventListener('pointerenter', (e) => {
    const r = geant.getBoundingClientRect();
    geant.style.setProperty('--ox', `${e.clientX - r.left}px`); geant.style.setProperty('--oy', `${e.clientY - r.top}px`);
  });
}

function inclinaisons() {
  if (estCalme() || !pointeurFin()) return;
  qsa('.incline').forEach((el) => {
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.8, ease: 'power3.out' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.8, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 9);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 7);
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}

function lettre() {
  qsa('form[data-simule]').forEach((f) => {
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const champ = qs('input[type="email"]', f), retour = qs('.pied-lettre-retour', f);
      if (!champ.value || !champ.checkValidity()) { retour.textContent = 'Indiquez une adresse e-mail valide, par exemple prenom@exemple.fr.'; champ.focus(); return; }
      retour.textContent = 'Inscription simulée : dans le site réel, vous recevriez la lettre d’information.';
      goutte(0.8);
      f.reset();
    });
  });
}

export function initInterface() {
  barre(); menu(); calme(); liens(); magnetiques(); inclinaisons(); lettre();
}
