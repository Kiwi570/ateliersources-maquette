// Point d'entrée : ouverture orchestrée, puis modules communs et propres à chaque page.
import { qs, qsa, estCalme } from './outils.js';
import { initDefilement } from './defilement.js';
import { initSon } from './son.js';
import { initInterface } from './interface.js';
import { initCurseur } from './curseur.js';
import { initEau } from './eau.js';
import { initRiviere } from './riviere.js';
import { initAnimations, initAnimationsCalmes } from './animations.js';
import { initAccueil } from './accueil.js';
import { initOrganiser } from './organiser.js';

gsap.registerPlugin(ScrollTrigger, SplitText);
gsap.config({ nullTargetWarn: false });
if (history.scrollRestoration) history.scrollRestoration = 'manual';

const calme = estCalme();
const pageNom = document.body.dataset.page;

initInterface();
initSon();
initDefilement();
initCurseur();
const eau = initEau();
initAnimations();
if (calme) initAnimationsCalmes();
if (pageNom === 'accueil') initAccueil();
if (pageNom === 'organiser') initOrganiser();

function ouverture() {
  const intro = qs('.intro');
  const titre = qs('.ouverture-titre');
  const autres = qsa('.ouverture-lieu, .ouverture-texte, .ouverture-actions, .ouverture-suite');
  const fin = () => {
    intro && intro.classList.add('is-fini');
    initRiviere();
    ScrollTrigger.refresh();
    if (location.hash) { const el = document.getElementById(location.hash.slice(1)); if (el) setTimeout(() => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY), 60); }
  };
  if (calme) { if (eau) eau.montrer(); fin(); return; }

  let deja = false;
  try { deja = sessionStorage.getItem('ads-intro') === '1'; sessionStorage.setItem('ads-intro', '1'); } catch (e) {}
  const longue = pageNom === 'accueil' && !deja && !location.hash;

  const split = SplitText.create(titre, { type: 'lines', mask: 'lines' });
  gsap.set(split.lines, { yPercent: 115 });
  gsap.set(autres, { opacity: 0, y: 24 });
  gsap.set('.barre', { yPercent: -100 });

  const tl = gsap.timeline({ onComplete: fin });
  if (longue) {
    const g = qs('.intro-goutte'), ondes = qsa('.intro-onde'), logo = qs('.intro-logo');
    tl.to(g, { attr: { cy: 200 }, duration: 0.5, ease: 'power2.in' })
      .to(g, { attr: { r: 0 }, duration: 0.12 })
      .fromTo(ondes, { attr: { r: 2 }, opacity: 0.9 }, { attr: { r: 300 }, opacity: 0, duration: 1.5, stagger: 0.16, ease: 'power2.out' }, '<')
      .fromTo(logo, { opacity: 0, scale: 0.94, filter: 'blur(10px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out' }, '<0.05')
      .to(logo, { opacity: 0, y: -10, duration: 0.35, ease: 'power2.in' }, '+=0.25')
      .to(intro, { opacity: 0, duration: 0.45, onComplete: () => intro.classList.add('is-fini') }, '<0.1')
      .add(() => eau && eau.ouvrir(1.5), '<');
  } else {
    tl.to(intro, { yPercent: -100, duration: 0.8, ease: 'power3.inOut', onComplete: () => intro.classList.add('is-fini') })
      .add(() => eau && eau.ouvrir(1.2), 0.1);
  }
  tl.to(split.lines, { yPercent: 0, duration: 1.2, stagger: 0.09, ease: 'expo.out' }, longue ? '-=0.35' : '-=0.45')
    .to(autres, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out' }, '<0.25')
    .to('.barre', { yPercent: 0, duration: 0.9, ease: 'power3.out' }, '<');
}

// L'ouverture démarre quand les polices sont prêtes (titres découpés au bon endroit), au plus tard après 1,2 s
Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((ok) => setTimeout(ok, 1200))]).then(ouverture);
window.addEventListener('load', () => ScrollTrigger.refresh());
