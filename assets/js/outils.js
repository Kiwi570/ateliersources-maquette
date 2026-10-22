// Outils partagés
export const qs = (s, el = document) => el.querySelector(s);
export const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;

const racine = document.documentElement;
export const estCalme = () => racine.classList.contains('is-calme');
export const pointeurFin = () => matchMedia('(pointer: fine) and (hover: hover)').matches;
export const largeur = () => window.innerWidth;
export const estMobile = () => window.innerWidth < 900;

export function lireStockage(cle) {
  try { return localStorage.getItem(cle); } catch (e) { return null; }
}
export function ecrireStockage(cle, val) {
  try { localStorage.setItem(cle, val); } catch (e) { /* stockage indisponible */ }
}

// Petit bus d'événements pour relier les modules (son, saisons…)
const cibles = {};
export const bus = {
  on(n, f) { (cibles[n] = cibles[n] || []).push(f); },
  emit(n, d) { (cibles[n] || []).forEach((f) => f(d)); },
};
