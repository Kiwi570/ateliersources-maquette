// Défilement fluide à la molette (inspiré de Lenis, écrit pour cette maquette).
// Le tactile et le clavier restent natifs ; ScrollTrigger lit le défilement natif.
import { clamp, estCalme, pointeurFin } from './outils.js';

let cible = 0, courant = 0, actif = false, enCours = false, raf = 0;

const max = () => document.documentElement.scrollHeight - window.innerHeight;

function boucle() {
  courant += (cible - courant) * 0.1;
  if (Math.abs(cible - courant) < 0.4) { courant = cible; enCours = false; }
  window.scrollTo(0, courant);
  if (enCours) raf = requestAnimationFrame(boucle);
}

function surMolette(e) {
  if (e.ctrlKey || e.defaultPrevented) return;
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // balayage horizontal (pavé tactile, historique)
  if (e.target.closest && e.target.closest('[data-hscroll]:not(.is-epingle [data-hscroll]), .menu, textarea, select')) return;
  if (document.documentElement.classList.contains('menu-ouvert')) return;
  e.preventDefault();
  let d = e.deltaY;
  if (e.deltaMode === 1) d *= 32; else if (e.deltaMode === 2) d *= window.innerHeight;
  if (!enCours) { courant = window.scrollY; cible = courant; }
  cible = clamp(cible + d, 0, max());
  if (!enCours) { enCours = true; raf = requestAnimationFrame(boucle); }
}

function surDefilement() {
  if (!enCours) { cible = courant = window.scrollY; }
}

export function defilerVers(y, instant = false) {
  y = clamp(y, 0, max());
  if (!actif || instant) { window.scrollTo({ top: y, behavior: instant || estCalme() ? 'auto' : 'smooth' }); return; }
  if (!enCours) { courant = window.scrollY; }
  cible = y; courant = window.scrollY;
  // trajet doux plus lent pour les ancres
  const depart = courant, duree = Math.min(1600, 500 + Math.abs(y - depart) * 0.35), t0 = performance.now();
  cancelAnimationFrame(raf); enCours = true;
  const pas = (t) => {
    const p = Math.min(1, (t - t0) / duree);
    const e = 1 - Math.pow(1 - p, 4);
    courant = depart + (y - depart) * e; cible = courant;
    window.scrollTo(0, courant);
    if (p < 1) raf = requestAnimationFrame(pas); else enCours = false;
  };
  raf = requestAnimationFrame(pas);
}

export function initDefilement() {
  if (estCalme() || !pointeurFin()) return;
  actif = true;
  cible = courant = window.scrollY;
  window.addEventListener('wheel', surMolette, { passive: false });
  window.addEventListener('scroll', surDefilement, { passive: true });
}

export function arreterDefilement() { cancelAnimationFrame(raf); enCours = false; }
