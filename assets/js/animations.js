// Animations communes : titres, révélations, compteurs, parallaxe, défilements horizontaux épinglés.
import { qs, qsa, estCalme } from './outils.js?v=20261028-2';

// aria-label n'est permis que sur les titres : ailleurs, la découpe reste lisible telle quelle
const ariaSplit = (el) => (/^H[1-6]$/.test(el.tagName) ? 'auto' : 'none');

export function decouperTitres() {
  qsa('[data-split]').forEach((el) => {
    if (el.closest('.ouverture')) return; // géré par l'ouverture
    SplitText.create(el, {
      type: 'lines', mask: 'lines', linesClass: 'split-ligne-int', autoSplit: true, aria: ariaSplit(el),
      onSplit(self) {
        return gsap.from(self.lines, {
          yPercent: 110, rotate: 2, duration: 1.2, stagger: 0.09, ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 86%', once: true },
        });
      },
    });
  });
}

function surface() {
  qsa('[data-surface]').forEach((el) => {
    const s = SplitText.create(el, { type: 'words', wordsClass: 'mot', aria: ariaSplit(el) });
    gsap.from(s.words, {
      yPercent: 70, opacity: 0, filter: 'blur(8px)', duration: 1.4, ease: 'power3.out',
      stagger: { each: 0.035, from: 'start' },
      scrollTrigger: { trigger: el, start: 'top 80%', once: true },
    });
  });
}

function compteurs() {
  qsa('[data-compte]').forEach((el) => {
    const fin = Number(el.dataset.compte), milliers = el.hasAttribute('data-milliers');
    const o = { v: 0 };
    const ecrire = () => { const n = Math.round(o.v); el.textContent = milliers && n >= 1000 ? n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : String(n); };
    ecrire();
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: () => {
        el.closest('.chiffre') && el.closest('.chiffre').classList.add('is-vu');
        gsap.to(o, { v: fin, duration: fin > 100 ? 2.2 : 1.6, ease: 'power2.out', onUpdate: ecrire });
      },
    });
  });
}

function mosaique() {
  qsa('[data-mosaique]').forEach((m) => {
    const figs = qsa('figure', m);
    const r0 = m.getBoundingClientRect();
    const cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
    const dist = figs.map((f) => { const r = f.getBoundingClientRect(); return Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy); });
    const maxd = Math.max(...dist) || 1;
    const tl = gsap.timeline({ scrollTrigger: { trigger: m, start: 'top 78%', once: true } });
    figs.forEach((f, i) => {
      const d = (dist[i] / maxd) * 0.6;
      tl.fromTo(f, { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', duration: 1.6, ease: 'power3.out' }, d);
      tl.from(qs('img', f), { scale: 1.3, duration: 2, ease: 'power3.out' }, d);
    });
  });
}

function revelations() {
  // images qui montent comme l'eau qui remplit un cadre
  qsa('.moment figure, .etape figure, .formule figure, .pour-qui-photo, .materiel-photo, .acces-photo, .intention-photo .reflet, .sauna-photo, .sauna-photo2, .cfiche.is-active img, .fiche.is-active img').forEach((f) => {
    gsap.fromTo(f, { clipPath: 'polygon(0 100%, 25% 98%, 50% 100%, 75% 98%, 100% 100%, 100% 100%, 0 100%)' }, {
      clipPath: 'polygon(0 -10%, 25% -6%, 50% -10%, 75% -6%, 100% -10%, 100% 100%, 0 100%)', duration: 1.6, ease: 'power3.inOut',
      scrollTrigger: { trigger: f, start: 'top 85%', once: true },
    });
    const img = f.tagName === 'IMG' ? f : qs('img', f);
    if (img) gsap.from(img, { scale: 1.18, duration: 2.2, ease: 'power3.out', scrollTrigger: { trigger: f, start: 'top 85%', once: true } });
  });
  // portraits : révélation en onde circulaire
  qsa('.onde-revele').forEach((f) => {
    gsap.to(f, { clipPath: 'circle(75% at 50% 50%)', duration: 1.8, ease: 'power2.inOut', scrollTrigger: { trigger: f, start: 'top 80%', once: true } });
  });
}

function parallaxes() {
  qsa('[data-parallaxe], .venir-fond img, .prochain-fond img, .demande-fond img, .temoignages-fond img').forEach((img) => {
    const f = Number(img.dataset.parallaxe || 0.1);
    gsap.fromTo(img, { yPercent: -f * 100 }, { yPercent: f * 100, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

function epingles() {
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    qsa('.journee, .chambres').forEach((sec) => {
      const piste = qs('[data-hscroll]', sec);
      sec.classList.add('is-epingle');
      const distance = () => Math.max(0, piste.scrollWidth - window.innerWidth);
      const tw = gsap.to(piste, {
        x: () => -distance(), ease: 'none',
        scrollTrigger: {
          trigger: sec, start: 'top top', end: () => '+=' + distance(), pin: true, scrub: 0.8,
          invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (s) => sec.dispatchEvent(new CustomEvent('avance', { detail: s.progress })),
        },
      });
      return () => { sec.classList.remove('is-epingle'); tw.kill(); gsap.set(piste, { x: 0 }); };
    });
  });
  mm.add('(max-width: 899px)', () => {
    qsa('.journee, .chambres').forEach((sec) => {
      const piste = qs('[data-hscroll]', sec);
      const f = () => sec.dispatchEvent(new CustomEvent('avance', { detail: piste.scrollLeft / Math.max(1, piste.scrollWidth - piste.clientWidth) }));
      piste.addEventListener('scroll', f, { passive: true });
    });
  });
}

function journee() {
  const sec = qs('.journee');
  if (!sec) return;
  const ciel = qs('.journee-ciel', sec), astre = qs('.journee-astre', sec);
  const couleurs = qsa('.moment', sec).map((m) => m.dataset.ciel);
  const melange = gsap.utils.interpolate(couleurs);
  const maj = (p) => {
    ciel.style.setProperty('--ciel', melange(Math.min(1, Math.max(0, p))));
    const w = sec.clientWidth, h = sec.clientHeight;
    const x = w * (0.08 + 0.84 * p), y = h * (0.3 - Math.sin(p * Math.PI) * 0.2);
    astre.style.transform = `translate(${x}px, ${y}px)`;
    astre.style.opacity = String(0.12 + Math.sin(p * Math.PI) * 0.22);
  };
  sec.addEventListener('avance', (e) => maj(e.detail));
  maj(0);
}

function bandes() {
  qsa('[data-bande]').forEach((b) => {
    gsap.fromTo(b, { x: () => window.innerWidth * 0.05 }, { x: () => -(b.scrollWidth - window.innerWidth * 0.9), ease: 'none', scrollTrigger: { trigger: b, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
  });
}

// pistes en défilement natif (mobile, mode calme) : atteignables au clavier quand elles débordent
function pistesClavier() {
  qsa('[data-hscroll]').forEach((p) => {
    const maj = () => {
      const natif = !p.closest('.is-epingle') && p.scrollWidth > p.clientWidth + 1;
      if (natif && !p.hasAttribute('tabindex')) {
        const h = p.closest('section') && p.closest('section').querySelector('h2');
        p.tabIndex = 0; p.setAttribute('role', 'region'); p.setAttribute('aria-label', h ? h.textContent.replace(/\s+/g, ' ').trim() : 'Galerie');
      } else if (!natif && p.hasAttribute('tabindex')) { ['tabindex', 'role', 'aria-label'].forEach((a) => p.removeAttribute(a)); }
    };
    maj(); let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(maj, 200); }, { passive: true });
  });
}

export function initAnimations() {
  journee();
  if (estCalme()) return;
  decouperTitres(); surface(); compteurs(); mosaique(); revelations(); parallaxes(); epingles(); bandes();
  pistesClavier();
}

export function initAnimationsCalmes() {
  pistesClavier();
  // en mode calme : les compteurs affichent leur valeur, les galeries restent en défilement natif
  qsa('[data-compte]').forEach((el) => { if (el.hasAttribute('data-milliers')) el.textContent = '1 000'; });
  qsa('.journee, .chambres').forEach((sec) => {
    const piste = qs('[data-hscroll]', sec);
    piste.addEventListener('scroll', () => sec.dispatchEvent(new CustomEvent('avance', { detail: piste.scrollLeft / Math.max(1, piste.scrollWidth - piste.clientWidth) })), { passive: true });
  });
}
