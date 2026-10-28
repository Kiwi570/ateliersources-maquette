// Point d'entrée : ouverture orchestrée, puis modules communs et propres à chaque page.
import { qs, qsa, estCalme } from './outils.js?v=20261028-2';
import { initDefilement } from './defilement.js?v=20261028-2';
import { initSon } from './son.js?v=20261028-2';
import { initInterface } from './interface.js?v=20261028-2';
import { initCurseur } from './curseur.js?v=20261028-2';
import { initEau } from './eau.js?v=20261028-2';
import { initRiviere } from './riviere.js?v=20261028-2';
import { initAnimations, initAnimationsCalmes } from './animations.js?v=20261028-2';
import { initAccueil } from './accueil.js?v=20261028-2';
import { initOrganiser } from './organiser.js?v=20261028-2';

// Filet de sécurité : si une bibliothèque manque ou qu'un module échoue, le voile d'ouverture se retire
// et la page reste entièrement lisible.
const libererVoile = () => { const v = qs('.intro'); if (v) v.classList.add('is-fini'); };
if (!window.gsap || !window.ScrollTrigger || !window.SplitText) {
  libererVoile();
  document.documentElement.classList.add('is-calme');
  throw new Error('Bibliothèques d\u2019animation indisponibles : version statique affichée.');
}
const securiser = (nom, f) => { try { return f(); } catch (e) { console.error(`[${nom}]`, e); return null; } };

gsap.registerPlugin(ScrollTrigger, SplitText);
gsap.config({ nullTargetWarn: false });
if (history.scrollRestoration) history.scrollRestoration = 'manual';

const calme = estCalme();
const pageNom = document.body.dataset.page;

securiser('interface', initInterface);
securiser('son', initSon);
securiser('defilement', initDefilement);
securiser('curseur', initCurseur);
const eau = securiser('eau', initEau);
securiser('animations', initAnimations);
if (calme) securiser('calme', initAnimationsCalmes);
if (pageNom === 'accueil') securiser('accueil', initAccueil);
if (pageNom === 'organiser') securiser('organiser', initOrganiser);

function ouverture() {
  const intro = qs('.intro');
  const titre = qs('.ouverture-titre');
  const autres = qsa('.ouverture-lieu, .ouverture-texte, .ouverture-actions, .ouverture-suite');
  const fin = () => {
    intro && intro.classList.add('is-fini');
    securiser('riviere', initRiviere);
    ScrollTrigger.refresh();
    if (location.hash) { const el = document.getElementById(location.hash.slice(1)); if (el) setTimeout(() => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY), 60); }
  };
  if (calme) { if (eau) eau.montrer(); fin(); return; }
  if (!titre) {
    // page sans ouverture (mentions légales) : le voile se retire simplement
    gsap.to(intro, { yPercent: -100, duration: 0.8, ease: 'power3.inOut', onComplete: fin });
    return;
  }

  let deja = false;
  try { deja = sessionStorage.getItem('ads-intro') === '1'; sessionStorage.setItem('ads-intro', '1'); } catch (e) {}
  const longue = pageNom === 'accueil' && !deja && !location.hash;

  const split = SplitText.create(titre, { type: 'lines', mask: 'lines' });
  gsap.set(split.lines, { yPercent: 115 });
  gsap.set(autres, { opacity: 0, y: 24 });
  gsap.set('.barre', { yPercent: -100 });

  const tl = gsap.timeline({ onComplete: fin });
  // un geste du visiteur (molette, toucher, touche, clic) accélère l'ouverture
  const presser = () => { if (tl.progress() < 1) tl.timeScale(4); retirer(); };
  const evts = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
  const retirer = () => evts.forEach((n) => window.removeEventListener(n, presser));
  evts.forEach((n) => window.addEventListener(n, presser, { passive: true }));
  if (longue) {
    const g = qs('.intro-goutte'), ondes = qsa('.intro-onde'), logo = qs('.intro-logo');
    tl.to(g, { attr: { cy: 200 }, duration: 0.5, ease: 'power2.in' })
      .to(g, { attr: { r: 0 }, duration: 0.12 })
      .fromTo(ondes, { attr: { r: 2 }, opacity: 0.9 }, { attr: { r: 300 }, opacity: 0, duration: 0.9, stagger: 0.16, ease: 'power2.out' }, '<')
      .fromTo(logo, { opacity: 0, scale: 0.94, filter: 'blur(10px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out' }, '<0.05')
      .to(logo, { opacity: 0, y: -10, duration: 0.35, ease: 'power2.in' })
      .to(intro, { opacity: 0, duration: 0.45, onComplete: () => intro.classList.add('is-fini') }, '<0.1')
      .add(() => eau && eau.ouvrir(1.5), '<');
  } else {
    tl.to(intro, { yPercent: -100, duration: 0.8, ease: 'power3.inOut', onComplete: () => intro.classList.add('is-fini') })
      .add(() => eau && eau.ouvrir(1.2), 0.1);
  }
  // le titre monte en même temps que le voile s'efface (lisible avant 2,5 s, intro longue comprise)
  tl.to(split.lines, { yPercent: 0, duration: 1.2, stagger: 0.09, ease: 'expo.out' }, longue ? '<' : '-=0.45')
    .to(autres, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out' }, '<0.25')
    .to('.barre', { yPercent: 0, duration: 0.9, ease: 'power3.out' }, '<');
}

// L'ouverture démarre quand les polices sont prêtes (titres découpés au bon endroit), au plus tard après 1,2 s
Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((ok) => setTimeout(ok, 1200))])
  .then(ouverture)
  .catch((e) => { console.error('[ouverture]', e); libererVoile(); gsap.set(['.barre', '.ouverture-titre', '.ouverture-lieu', '.ouverture-texte', '.ouverture-actions'], { clearProps: 'all' }); });
window.addEventListener('load', () => ScrollTrigger.refresh());
