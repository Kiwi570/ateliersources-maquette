// Curseur personnalisé : un anneau qui laisse des ronds dans l'eau en se déplaçant.
import { qs, estCalme, pointeurFin } from './outils.js';

export function initCurseur() {
  if (estCalme() || !pointeurFin()) return;
  const c = qs('.curseur'), label = qs('.curseur-label', c);
  const calque = document.createElement('div');
  calque.className = 'ronds'; calque.setAttribute('aria-hidden', 'true');
  document.body.appendChild(calque);
  document.documentElement.classList.add('a-curseur');
  const x = gsap.quickTo(c, 'x', { duration: 0.18, ease: 'power3.out' });
  const y = gsap.quickTo(c, 'y', { duration: 0.18, ease: 'power3.out' });
  let dernier = { x: -999, y: -999, t: 0 }, n = 0;

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    x(e.clientX); y(e.clientY);
    const now = performance.now();
    const d = Math.hypot(e.clientX - dernier.x, e.clientY - dernier.y);
    if (d > 70 && now - dernier.t > 120 && n < 8 && !e.target.closest('.ouverture, input, textarea, .coupe-svg')) {
      dernier = { x: e.clientX, y: e.clientY, t: now };
      const sombre = e.target.closest('[data-theme="sombre"]');
      const r = document.createElement('span');
      r.className = 'rond';
      r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px';
      if (sombre) r.style.setProperty('--rond', 'rgba(159, 194, 184, .5)');
      calque.appendChild(r); n++;
      gsap.fromTo(r, { scale: 0.4, opacity: 0.9 }, { scale: 9, opacity: 0, duration: 1.6, ease: 'power2.out', onComplete: () => { r.remove(); n--; } });
    }
  }, { passive: true });

  document.addEventListener('pointerover', (e) => {
    const el = e.target.closest('a, button, label.choix, .piece, input[type="range"], [data-curseur]');
    c.classList.toggle('is-lien', !!el);
    const txt = el && el.getAttribute('data-curseur');
    c.classList.toggle('is-label', !!txt);
    label.textContent = txt || '';
  });
  document.addEventListener('pointerleave', () => { c.style.opacity = '0'; });
  document.addEventListener('pointerenter', () => { c.style.opacity = ''; });
}
