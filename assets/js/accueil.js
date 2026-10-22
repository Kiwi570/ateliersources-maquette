// Page d'accueil : saisons, table, carte du village, rituel du sauna, programme, témoignages, ligne de train.
import { qs, qsa, estCalme, estMobile, bus, clamp } from './outils.js';
import { stages } from './donnees/programme.js';
import { goutte } from './son.js';

/* ---------- Toute l'année : été / hiver ---------- */
function saisons() {
  const sec = qs('.saisons');
  if (!sec) return;
  const fondHiver = qs('.saisons-fond-hiver', sec), range = qs('[data-saisons-range]', sec);
  const boutons = qsa('[data-choix]', sec);
  const etat = { t: 0, vague: 0 };
  let visible = false;

  const dessiner = () => {
    const bordX = (1 - etat.t) * 100;
    if (etat.t <= 0.001) { fondHiver.style.clipPath = 'inset(0 0 0 100%)'; return; }
    if (etat.t >= 0.999) { fondHiver.style.clipPath = 'inset(0)'; return; }
    const pts = [];
    const n = 14, amp = 3.2;
    for (let i = 0; i <= n; i++) {
      const y = (i / n) * 100;
      const x = bordX + Math.sin(i * 0.9 + etat.vague) * amp;
      pts.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
    }
    fondHiver.style.clipPath = `polygon(${pts.join(', ')}, 100% 100%, 100% 0%)`;
  };
  const appliquer = (t, depuisRange) => {
    etat.t = clamp(t, 0, 1);
    if (!depuisRange) range.value = String(Math.round(etat.t * 100));
    const hiver = etat.t > 0.5;
    sec.dataset.saison = hiver ? 'hiver' : 'ete';
    boutons.forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.choix === 'hiver') === hiver)));
    range.setAttribute('aria-valuetext', hiver ? 'Hiver' : 'Été');
    bus.emit('saison', etat.t);
    dessiner();
  };
  range.addEventListener('input', () => appliquer(Number(range.value) / 100, true));
  boutons.forEach((b) => b.addEventListener('click', () => {
    const vers = b.dataset.choix === 'hiver' ? 1 : 0;
    if (estCalme()) appliquer(vers); else gsap.to(etat, { t: vers, duration: 1.4, ease: 'power2.inOut', onUpdate: () => appliquer(etat.t) });
    goutte(0.6);
  }));
  appliquer(0);

  // particules : pollen l'été, braises l'hiver
  const cv = qs('.saisons-particules', sec), cx = cv.getContext('2d');
  const parts = [];
  const N = estMobile() ? 34 : 70;
  const taille = () => { const dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = sec.clientWidth * dpr; cv.height = sec.clientHeight * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  taille(); window.addEventListener('resize', taille);
  for (let i = 0; i < N; i++) parts.push({ x: Math.random(), y: Math.random(), v: 0.2 + Math.random() * 0.8, r: 0.6 + Math.random() * 1.8, p: Math.random() * 6.28, braise: i % 2 === 0 });
  const boucle = () => {
    if (!visible) return;
    const w = sec.clientWidth, h = sec.clientHeight;
    cx.clearRect(0, 0, w, h);
    etat.vague += 0.02;
    if (etat.t > 0.001 && etat.t < 0.999) dessiner();
    parts.forEach((q) => {
      q.p += 0.012;
      const hiv = q.braise ? etat.t : 1 - etat.t;
      if (hiv < 0.02) return;
      q.y -= (q.braise ? 0.0016 : 0.0005) * q.v;
      q.x += Math.sin(q.p) * (q.braise ? 0.0007 : 0.0005);
      if (q.y < -0.05) { q.y = 1.05; q.x = Math.random(); }
      const lueur = 0.55 + 0.45 * Math.sin(q.p * 2.2); // scintillement lent (< 1 Hz)
      cx.beginPath();
      cx.arc(q.x * w, q.y * h, q.r * (q.braise ? 1.1 : 1), 0, 6.283);
      cx.fillStyle = q.braise ? `rgba(232, 140, 70, ${0.75 * hiv * lueur})` : `rgba(244, 236, 200, ${0.6 * hiv})`;
      cx.fill();
    });
    requestAnimationFrame(boucle);
  };
  if (!estCalme()) new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) boucle(); }).observe(sec);

  // démonstration : si la saison réelle est froide, la page bascule seule une fois vers l'hiver
  const mois = new Date().getMonth() + 1;
  const froid = mois >= 10 || mois <= 3;
  if (froid && !estCalme()) {
    ScrollTrigger.create({ trigger: sec, start: 'top 35%', once: true, onEnter: () => gsap.to(etat, { t: 1, duration: 2.4, delay: 0.6, ease: 'power2.inOut', onUpdate: () => appliquer(etat.t) }) });
  }
}

/* ---------- Table : pousses qui grandissent ---------- */
function table() {
  const sec = qs('.table');
  if (!sec || estCalme()) return;
  const chemins = qsa('.pousses path, .pousses circle', sec);
  chemins.forEach((p) => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
  gsap.to(chemins, { strokeDashoffset: 0, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: sec, start: 'top 70%', end: 'bottom 60%', scrub: 1 } });
  qsa('.pousse-img', sec).forEach((f, i) => {
    gsap.fromTo(f, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.5, ease: 'power3.out', delay: i * 0.12, scrollTrigger: { trigger: f, start: 'top 88%', once: true } });
    gsap.from(qs('img', f), { yPercent: 12, scale: 1.12, duration: 2, ease: 'power3.out', delay: i * 0.12, scrollTrigger: { trigger: f, start: 'top 88%', once: true } });
  });
}

/* ---------- Village : carte ---------- */
function carte() {
  const sec = qs('.village');
  if (!sec) return;
  const reperes = qsa('[data-repere]', sec), fiches = qsa('[data-fiche]', sec);
  const activer = (nom) => {
    reperes.forEach((r) => { const on = r.dataset.repere === nom; r.classList.toggle('is-active', on); r.setAttribute('aria-pressed', String(on)); });
    fiches.forEach((f) => f.classList.toggle('is-active', f.dataset.fiche === nom));
  };
  reperes.forEach((r) => r.addEventListener('click', () => { activer(r.dataset.repere); goutte(0.5); }));
  if (estCalme()) return;
  const riv = qs('#carte-anglin', sec), lib = qs('.carte-libellule', sec);
  const L = riv.getTotalLength();
  riv.style.strokeDasharray = L; riv.style.strokeDashoffset = L;
  const o = { p: 0 };
  gsap.to(riv, { strokeDashoffset: 0, duration: 2.6, ease: 'power2.inOut', scrollTrigger: { trigger: sec, start: 'top 60%', once: true } });
  gsap.from(reperes, { scale: 0, opacity: 0, duration: 0.8, stagger: 0.18, delay: 1.2, ease: 'back.out(2)', scrollTrigger: { trigger: sec, start: 'top 60%', once: true } });
  gsap.to(o, {
    p: 1, ease: 'none', scrollTrigger: { trigger: '.carte', start: 'top 80%', end: 'bottom 20%', scrub: 1.2 },
    onUpdate: () => {
      const l = o.p * L, a = riv.getPointAtLength(l), b = riv.getPointAtLength(Math.min(L, l + 4));
      const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI + 90;
      lib.setAttribute('transform', `translate(${a.x} ${a.y - 26}) rotate(${ang})`);
    },
  });
}

/* ---------- Sauna : rituel ---------- */
function rituel() {
  const r = qs('[data-rituel]');
  if (!r) return;
  const trace = qs('.rituel-trace', r), g = qs('.rituel-goutte', r), etapes = qsa('.rituel-etapes li', r);
  const L = 2 * Math.PI * 170;
  trace.style.strokeDasharray = L; trace.style.strokeDashoffset = estCalme() ? 0 : L;
  if (estCalme()) return;
  const o = { p: 0 };
  const couleurs = ['#C77A3E', '#7FB2C2', '#2E5B50'];
  gsap.to(o, {
    p: 1, ease: 'none', scrollTrigger: { trigger: r, start: 'top 75%', end: 'bottom 30%', scrub: 1 },
    onUpdate: () => {
      trace.style.strokeDashoffset = String(L * (1 - o.p));
      const a = o.p * Math.PI * 2 - Math.PI / 2;
      g.setAttribute('cx', String(200 + Math.cos(a) * 170)); g.setAttribute('cy', String(200 + Math.sin(a) * 170));
      const i = Math.min(2, Math.floor(o.p * 3));
      g.style.fill = couleurs[i];
      etapes.forEach((e, k) => e.classList.toggle('is-actif', k === i));
    },
  });
  // brume de chaleur sur la photo de la cabine
  const dm = qs('#f-chaleur feDisplacementMap'), turb = qs('#f-chaleur feTurbulence');
  let vis = false, t = 0;
  const vit = () => { if (!vis) return; t += 0.01; turb.setAttribute('baseFrequency', `0.01 ${(0.045 + Math.sin(t) * 0.01).toFixed(4)}`); requestAnimationFrame(vit); };
  ScrollTrigger.create({ trigger: '.sauna-chaleur', start: 'top bottom', end: 'bottom top', onToggle: (s) => { vis = s.isActive; dm.setAttribute('scale', vis ? '7' : '0'); if (vis) vit(); } });
}

/* ---------- Programme ---------- */
function programme() {
  const liste = qs('[data-passes]');
  if (!liste) return;
  const auj = new Date(); auj.setHours(0, 0, 0, 0);
  const d = (s) => new Date(s + 'T00:00:00');
  const fmt = (a, b) => {
    const da = d(a), db = d(b);
    const m = (x) => x.toLocaleDateString('fr-FR', { month: 'short' });
    return da.getMonth() === db.getMonth() ? `${da.getDate()}-${db.getDate()} ${m(db)} ${db.getFullYear()}` : `${da.getDate()} ${m(da)} - ${db.getDate()} ${m(db)} ${db.getFullYear()}`;
  };
  const avenir = stages.filter((s) => d(s.fin) >= auj).sort((a, b) => d(a.debut) - d(b.debut));
  const passes = stages.filter((s) => d(s.fin) < auj).sort((a, b) => d(b.debut) - d(a.debut));
  const zone = qs('[data-a-venir]');
  if (avenir.length && zone) {
    qs('.prochain-vide', zone).innerHTML = avenir.slice(0, 3).map((s) => `<strong>${fmt(s.debut, s.fin)}</strong><br>${s.titre}, avec ${s.avec}`).join('<br><br>');
  }
  let annee = null, html = '';
  passes.forEach((s) => {
    const y = d(s.debut).getFullYear();
    if (y !== annee) { annee = y; html += `<li class="frise-annee">${y}</li>`; }
    html += `<li class="stage"><span class="stage-date">${fmt(s.debut, s.fin)}</span><span class="stage-titre">${s.titre}</span><span class="stage-avec">avec ${s.avec}</span>${s.complet ? '<span class="stage-etat">Était complet</span>' : ''}</li>`;
  });
  liste.innerHTML = html;
  if (!estCalme()) gsap.from(qsa('li', liste), { y: 16, opacity: 0, duration: 0.8, stagger: 0.05, ease: 'power3.out', scrollTrigger: { trigger: liste, start: 'top 80%', once: true } });
}

/* ---------- Témoignages ---------- */
function citations() {
  const zone = qs('[data-citations]');
  if (!zone) return;
  const items = qsa('.citation', zone), compte = qs('.citations-compte');
  let i = 0, minuteur = 0, pause = false;
  const montrer = (n) => {
    i = (n + items.length) % items.length;
    items.forEach((c, k) => { c.classList.toggle('is-active', k === i); c.setAttribute('aria-hidden', String(k !== i)); });
    compte.textContent = `${i + 1} / ${items.length}`;
  };
  const programmer = () => { clearTimeout(minuteur); if (!estCalme() && !pause) minuteur = setTimeout(() => { montrer(i + 1); programmer(); }, 7000); };
  qs('[data-cit-prec]').addEventListener('click', () => { montrer(i - 1); programmer(); });
  qs('[data-cit-suiv]').addEventListener('click', () => { montrer(i + 1); programmer(); });
  const sec = zone.closest('section');
  sec.addEventListener('pointerenter', () => { pause = true; clearTimeout(minuteur); });
  sec.addEventListener('pointerleave', () => { pause = false; programmer(); });
  sec.addEventListener('focusin', () => { pause = true; clearTimeout(minuteur); });
  montrer(0); programmer();
}

/* ---------- Venir : la ligne se trace ---------- */
function ligne() {
  const l = qs('[data-ligne]');
  if (!l || estCalme()) return;
  gsap.fromTo(l, { '--ligne': 0 }, { '--ligne': 1, ease: 'none', scrollTrigger: { trigger: l, start: 'top 75%', end: 'bottom 55%', scrub: 1 } });
  gsap.from(qsa('.ligne-arret', l), { x: -16, opacity: 0, stagger: 0.15, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: l, start: 'top 75%', once: true } });
}

/* ---------- Reflet de la salle ---------- */
function reflet() {
  const r = qs('.reflet');
  if (!r) return;
  const img = qs('.reflet-img', r), eau = qs('.reflet-eau', r);
  const copie = img.cloneNode(); copie.removeAttribute('class'); copie.alt = ''; copie.loading = 'lazy';
  eau.appendChild(copie);
  if (estCalme()) return;
  const turb = qs('#f-reflet feTurbulence');
  let vis = false, t = 0;
  const vit = () => { if (!vis) return; t += 0.012; turb.setAttribute('baseFrequency', `${(0.004 + Math.sin(t) * 0.001).toFixed(4)} ${(0.06 + Math.cos(t * 0.8) * 0.012).toFixed(4)}`); requestAnimationFrame(vit); };
  ScrollTrigger.create({ trigger: r, start: 'top bottom', end: 'bottom top', onToggle: (s) => { vis = s.isActive; if (vis) vit(); } });
  gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: r, start: 'top bottom', end: 'bottom top', scrub: true } });
}

export function initAccueil() {
  saisons(); table(); carte(); rituel(); programme(); citations(); ligne(); reflet();
}
