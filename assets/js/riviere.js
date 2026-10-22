// La rivière qui se trace le long de la page au défilement, et la libellule qui vole à sa pointe.
import { qs, qsa, estCalme, estMobile, clamp } from './outils.js';

export function initRiviere() {
  const svg = qs('.riviere');
  const vol = qs('.libellule-vol');
  if (!svg || !vol || estCalme()) return;
  const lit = qs('.riviere-lit', svg), eau = qs('.riviere-eau', svg);
  const sombres = qsa('[data-theme="sombre"]');
  let table = [], L = 1, pos = { x: 0, y: 0, a: 0 }, cible = { x: 0, y: 0, a: 0 };

  function construire() {
    const W = document.documentElement.clientWidth;
    const H = document.documentElement.scrollHeight;
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.style.height = H + 'px';
    const sections = qsa('main > section, .pied').filter((s) => !s.classList.contains('ouverture'));
    const ouverture = qs('.ouverture');
    const mob = estMobile();
    const gauche = mob ? W - 26 : Math.max(18, W * 0.026);
    const droite = mob ? W - 10 : W - Math.max(18, W * 0.026);
    // la rivière longe les marges et ne traverse la page que dans les espaces entre les sections
    const pts = [{ x: mob ? W - 18 : W * 0.86, y: ouverture ? ouverture.offsetHeight - 30 : 0, droit: false }];
    sections.forEach((s, i) => {
      const bloc = s.parentElement.classList.contains('pin-spacer') ? s.parentElement : s;
      const r = bloc.getBoundingClientRect();
      const top = r.top + window.scrollY, bas = top + r.height;
      const pad = Math.min(150, (parseFloat(getComputedStyle(s).paddingTop) || 100) * 0.55);
      const x = i % 2 ? droite : gauche;
      pts.push({ x, y: top + pad, droit: false });
      pts.push({ x, y: bas - pad, droit: true });
    });
    pts.push({ x: W / 2, y: H - 10, droit: false });
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], dy = b.y - a.y;
      if (b.droit) {
        const m = mob ? 4 : 14;
        d += ` C ${a.x + m} ${a.y + dy * 0.33}, ${b.x - m} ${a.y + dy * 0.66}, ${b.x} ${b.y}`;
      } else {
        d += ` C ${a.x} ${a.y + dy * 0.5}, ${b.x} ${b.y - dy * 0.5}, ${b.x} ${b.y}`;
      }
    }
    lit.setAttribute('d', d); eau.setAttribute('d', d);
    L = eau.getTotalLength();
    eau.style.strokeDasharray = `${L} ${L}`;
    // table hauteur -> longueur
    table = [];
    const n = Math.ceil(L / 24);
    for (let i = 0; i <= n; i++) { const l = (i / n) * L; const p = eau.getPointAtLength(l); table.push([p.y, l]); }
    mettreAJour(true);
  }

  function longueurA(y) {
    if (!table.length) return 0;
    if (y <= table[0][0]) return 0;
    let best = 0;
    for (let i = 0; i < table.length; i++) { if (table[i][0] <= y) best = table[i][1]; else if (table[i][0] > y + 400) break; }
    return best;
  }

  function mettreAJour(instant) {
    const tete = window.scrollY + window.innerHeight * 0.62;
    const l = clamp(longueurA(tete), 0, L);
    eau.style.strokeDashoffset = String(L - l);
    lit.style.strokeDasharray = `${L} ${L}`; lit.style.strokeDashoffset = String(L - l);
    const p = eau.getPointAtLength(l), p2 = eau.getPointAtLength(Math.min(L, l + 6));
    cible.x = p.x; cible.y = p.y; cible.a = Math.atan2(p2.y - p.y, p2.x - p.x) * 180 / Math.PI + 90;
    if (instant) Object.assign(pos, cible);
    vol.style.opacity = l > 4 && l < L - 4 ? '1' : '0';
  }

  let t = 0, k = 0;
  // la libellule se pose (disparaît) au-dessus des galeries épinglées et du plan, qui ont leur propre mouvement
  const zonesCalmes = qsa('.journee, .chambres, .village');
  const teinte = () => {
    const y = pos.y - window.scrollY;
    const dans = (s) => { const r = s.getBoundingClientRect(); return r.top < y && r.bottom > y; };
    vol.classList.toggle('sur-sombre', sombres.some(dans));
    vol.classList.toggle('is-posee', zonesCalmes.some(dans));
  };
  gsap.ticker.add(() => {
    t += 0.016;
    if (++k % 8 === 0) teinte();
    pos.x += (cible.x - pos.x) * 0.12; pos.y += (cible.y - pos.y) * 0.12;
    let da = cible.a - pos.a; da = ((da + 540) % 360) - 180; pos.a += da * 0.1;
    const vx = Math.sin(t * 1.7) * 6, vy = Math.cos(t * 2.3) * 5;
    const W = document.documentElement.clientWidth;
    const px = clamp(pos.x + vx, 30, W - 30);
    vol.style.transform = `translate(${px}px, ${pos.y + vy}px) rotate(${pos.a + Math.sin(t * 1.3) * 6}deg)`;
  });

  window.addEventListener('scroll', () => mettreAJour(), { passive: true });
  ScrollTrigger.addEventListener('refresh', construire);
  window.addEventListener('load', () => ScrollTrigger.refresh());
  construire();
}
