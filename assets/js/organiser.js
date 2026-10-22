// Page « Organiser un stage » : pratiques, maison en coupe, matériel, parcours, témoins, demande de disponibilité.
import { qs, qsa, estCalme } from './outils.js';
import { goutte } from './son.js';

function pratiques() {
  const ul = qs('[data-pratiques]');
  if (!ul || estCalme()) return;
  const lis = qsa('li', ul);
  gsap.from(lis, {
    x: () => gsap.utils.random(-140, 140), y: () => gsap.utils.random(-80, 80), rotation: () => gsap.utils.random(-14, 14),
    opacity: 0, duration: 1.8, ease: 'elastic.out(0.6, 0.5)', stagger: { each: 0.06, from: 'random' },
    scrollTrigger: { trigger: ul, start: 'top 82%', once: true },
  });
}

function coupe() {
  const sec = qs('.coupe');
  if (!sec) return;
  const svg = qs('.coupe-svg', sec);
  const pieces = qsa('.piece', svg), onglets = qsa('.coupe-boutons [data-piece]', sec), fiches = qsa('[data-fiche]', sec);
  const activer = (nom, focus) => {
    pieces.forEach((p) => p.classList.toggle('is-active', p.dataset.piece === nom));
    onglets.forEach((b) => { const on = b.dataset.piece === nom; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
    fiches.forEach((f) => {
      const on = f.dataset.fiche === nom;
      if (on && f.hidden) {
        f.hidden = false; f.classList.add('is-active');
        if (!estCalme()) {
          gsap.fromTo(qs('img', f), { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', duration: 1, ease: 'power3.out' });
          gsap.from(qs('div', f), { y: 18, opacity: 0, duration: 0.7, ease: 'power3.out' });
        }
      } else if (!on) { f.hidden = true; f.classList.remove('is-active'); }
    });
  };
  pieces.forEach((p) => p.addEventListener('click', () => { activer(p.dataset.piece); goutte(0.5); }));
  onglets.forEach((b, i) => {
    b.id = 'onglet-' + b.dataset.piece;
    const f = fiches.find((x) => x.dataset.fiche === b.dataset.piece);
    if (f) { f.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', 'fiche-' + b.dataset.piece); f.id = 'fiche-' + b.dataset.piece; }
    b.addEventListener('click', () => activer(b.dataset.piece));
    b.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const n = onglets[(i + (e.key === 'ArrowRight' ? 1 : -1) + onglets.length) % onglets.length];
        activer(n.dataset.piece, true);
      }
    });
  });
  activer('pratique');
  if (estCalme()) return;
  // la maison se dessine trait par trait, puis les cotes et les pièces apparaissent
  const traits = qsa('.trait path', svg);
  traits.forEach((p) => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
  const cotes = qsa('.cotes > *', svg), textes = qsa('.piece text', svg);
  const tl = gsap.timeline({ scrollTrigger: { trigger: svg, start: 'top 75%', once: true } });
  tl.to(traits, { strokeDashoffset: 0, duration: 1.1, stagger: 0.12, ease: 'power2.inOut' })
    .from(cotes, { opacity: 0, duration: 0.6, stagger: 0.05 }, '-=0.4')
    .from(textes, { opacity: 0, y: 8, duration: 0.6, stagger: 0.06 }, '-=0.4')
    .fromTo(qsa('.piece.is-active path, .piece.is-active rect', svg), { fillOpacity: 0 }, { fillOpacity: 0.55, duration: 0.8 }, '-=0.3');
}

function icones() {
  const ul = qs('[data-icones]');
  if (!ul || estCalme()) return;
  const formes = qsa('svg > *', ul);
  formes.forEach((p) => { const L = p.getTotalLength ? p.getTotalLength() : 200; p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
  gsap.to(formes, { strokeDashoffset: 0, duration: 1.4, stagger: 0.04, ease: 'power2.inOut', scrollTrigger: { trigger: ul, start: 'top 80%', once: true } });
  gsap.from(qsa('li', ul), { y: 14, opacity: 0, duration: 0.8, stagger: 0.06, scrollTrigger: { trigger: ul, start: 'top 80%', once: true } });
}

function parcours() {
  const p = qs('.parcours-fil path');
  if (!p || estCalme()) return;
  p.setAttribute('pathLength', '1');
  p.style.strokeDasharray = '1'; p.style.strokeDashoffset = '1';
  gsap.to(p, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.etapes', start: 'top 70%', end: 'bottom 60%', scrub: 1 } });
}

function flux() {
  const f = qs('[data-flux]');
  if (!f) return;
  qsa('.temoin', f).forEach((t) => { const c = t.cloneNode(true); c.setAttribute('aria-hidden', 'true'); f.appendChild(c); });
}

/* ---------- Demande de disponibilité ---------- */
function formulaire() {
  const form = qs('[data-formulaire]');
  if (!form) return;
  const pas = qsa('.pas', form), num = qs('.demande-etape-num'), err = qs('.form-erreur', form);
  const bPrec = qs('[data-prec]', form), bSuiv = qs('[data-suiv]', form), bEnv = qs('[data-envoyer]', form);
  const eau = qs('.rp-eau'), L = eau.getTotalLength();
  eau.style.strokeDasharray = L;
  let n = 1;
  const choix = { arrivee: null, depart: null };

  const montrer = (k, dir = 1, focus = true) => {
    pas.forEach((p) => { p.hidden = Number(p.dataset.pas) !== k; p.classList.toggle('is-active', Number(p.dataset.pas) === k); });
    n = k;
    num.textContent = `Étape ${k} sur 5`;
    bPrec.hidden = k === 1; bSuiv.hidden = k === 5; bEnv.hidden = k !== 5;
    eau.style.strokeDashoffset = String(L * (1 - k / 5));
    err.textContent = '';
    if (k === 5) recap();
    const p = pas[k - 1];
    if (!focus) return;
    if (!estCalme()) gsap.from(p, { x: 30 * dir, opacity: 0, duration: 0.6, ease: 'power3.out' });
    const leg = qs('legend', p);
    if (leg) { leg.tabIndex = -1; leg.focus({ preventScroll: true }); }
  };

  const valider = (k) => {
    const p = pas[k - 1];
    if (k === 1 && !qs('input[name="pratique"]:checked', p)) return 'Choisissez le type de stage.';
    if (k === 2 && (!choix.arrivee || !choix.depart)) return 'Choisissez un jour d’arrivée puis un jour de départ.';
    if (k === 4 && !qs('input[name="formule"]:checked', p)) return 'Choisissez une formule.';
    if (k === 5) {
      const nom = qs('[name="nom"]', p), mail = qs('[name="email"]', p);
      if (!nom.value.trim()) { nom.focus(); return 'Indiquez votre prénom et votre nom.'; }
      if (!mail.value || !mail.checkValidity()) { mail.focus(); return 'Indiquez une adresse e-mail valide, par exemple prenom@exemple.fr.'; }
    }
    return '';
  };

  bSuiv.addEventListener('click', () => {
    const e = valider(n);
    if (e) { err.textContent = e; return; }
    montrer(n + 1, 1); goutte(0.5);
  });
  bPrec.addEventListener('click', () => montrer(n - 1, -1));
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const e = valider(5);
    if (e) { err.textContent = e; return; }
    goutte(1);
    const carte = form.closest('.demande-carte'), merci = qs('.merci', carte);
    form.hidden = true; qs('.riviere-progres', carte).hidden = true; num.hidden = true; qs('.demande-intro', carte).hidden = true;
    merci.hidden = false; merci.focus();
    if (!estCalme()) gsap.from(merci, { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' });
  });

  // effectif
  const eff = qs('[data-effectif]', form), sortie = qs('[data-effectif-sortie]', form), aide = qs('[data-effectif-aide]', form);
  const majEff = () => {
    const v = Number(eff.value);
    sortie.textContent = String(v);
    const hors = v < 8 || v > 15;
    aide.textContent = hors ? 'En dessous de 8 ou au-delà de 15 personnes, étudions votre projet ensemble : précisez-le à l’étape suivante.' : 'La maison accueille des groupes de 8 à 15 personnes.';
    aide.classList.toggle('is-alerte', hors);
  };
  eff.addEventListener('input', majEff); majEff();

  // calendrier
  const cal = qs('[data-calendrier]', form), grille = qs('.cal-jours', cal), titre = qs('.cal-mois', cal), resume = qs('.cal-resume', form);
  const auj = new Date(); auj.setHours(0, 0, 0, 0);
  let vue = new Date(auj.getFullYear(), auj.getMonth(), 1);
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const lisible = (d) => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const dessiner = () => {
    titre.textContent = vue.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    let h = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'].map((j) => `<span class="cal-jsem" aria-hidden="true">${j}</span>`).join('');
    const premier = (vue.getDay() + 6) % 7, nb = new Date(vue.getFullYear(), vue.getMonth() + 1, 0).getDate();
    for (let i = 0; i < premier; i++) h += '<span></span>';
    for (let j = 1; j <= nb; j++) {
      const d = new Date(vue.getFullYear(), vue.getMonth(), j);
      const cls = [];
      if (choix.arrivee && +d === +choix.arrivee) cls.push('is-debut');
      if (choix.depart && +d === +choix.depart) cls.push('is-fin');
      if (choix.arrivee && choix.depart && d > choix.arrivee && d < choix.depart) cls.push('is-plage');
      h += `<button type="button" data-jour="${iso(d)}" class="${cls.join(' ')}" ${d < auj ? 'disabled' : ''} aria-label="${lisible(d)}" aria-pressed="${cls.length ? 'true' : 'false'}">${j}</button>`;
    }
    grille.innerHTML = h;
    qs('[data-cal="-1"]', cal).disabled = vue <= new Date(auj.getFullYear(), auj.getMonth(), 1);
  };
  grille.addEventListener('click', (e) => {
    const b = e.target.closest('[data-jour]');
    if (!b) return;
    const d = new Date(b.dataset.jour + 'T00:00:00');
    if (!choix.arrivee || choix.depart || d <= choix.arrivee) { choix.arrivee = d; choix.depart = null; }
    else choix.depart = d;
    qs('[name="arrivee"]', form).value = choix.arrivee ? iso(choix.arrivee) : '';
    qs('[name="depart"]', form).value = choix.depart ? iso(choix.depart) : '';
    if (choix.arrivee && choix.depart) {
      const nuits = Math.round((choix.depart - choix.arrivee) / 86400000);
      resume.textContent = `Du ${lisible(choix.arrivee)} au ${lisible(choix.depart)} : ${nuits} nuit${nuits > 1 ? 's' : ''}.`;
    } else resume.textContent = `Arrivée le ${lisible(choix.arrivee)}. Choisissez maintenant le jour de départ.`;
    const focusJour = b.dataset.jour;
    dessiner();
    const nb = qs(`[data-jour="${focusJour}"]`, grille); nb && nb.focus();
  });
  qsa('[data-cal]', cal).forEach((b) => b.addEventListener('click', () => { vue = new Date(vue.getFullYear(), vue.getMonth() + Number(b.dataset.cal), 1); dessiner(); }));
  dessiner();

  function recap() {
    const fd = new FormData(form);
    const lignes = [
      ['Stage', [fd.get('pratique'), fd.get('intitule')].filter(Boolean).join(' : ')],
      ['Dates', choix.arrivee && choix.depart ? `${choix.arrivee.toLocaleDateString('fr-FR')} au ${choix.depart.toLocaleDateString('fr-FR')}` : ''],
      ['Groupe', `${fd.get('effectif')} personnes`],
      ['Formule', fd.get('formule') || ''],
      ['Options', fd.getAll('options').join(', ') || 'aucune'],
    ];
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    qs('[data-recap]', form).innerHTML = `<dl>${lignes.map(([a, b]) => `<dt>${a}</dt><dd>${esc(b)}</dd>`).join('')}</dl>`;
  }
  montrer(1, 1, false);
}

export function initOrganiser() {
  pratiques(); coupe(); icones(); parcours(); flux(); formulaire();
}
