// Effet signature : la photo d'ouverture vue sous une eau vive qui se clarifie au défilement.
// Une goutte ouvre la page, le curseur laisse des ronds dans l'eau. Version sans WebGL : la photo seule.
import { Renderer } from './vendor/ogl/core/Renderer.js';
import { Program } from './vendor/ogl/core/Program.js';
import { Mesh } from './vendor/ogl/core/Mesh.js';
import { Texture } from './vendor/ogl/core/Texture.js';
import { Triangle } from './vendor/ogl/extras/Triangle.js';
import { estCalme, estMobile, bus } from './outils.js';
import { goutte } from './son.js';

const vertex = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`;

const fragment = /* glsl */ `
precision highp float;
uniform sampler2D tMap;
uniform vec2 uRes;
uniform vec2 uImg;
uniform vec2 uFocus;
uniform float uZoom;
uniform float uTime;
uniform float uAgite;
uniform float uIntro;
uniform vec4 uRonds[10];
varying vec2 vUv;

vec2 hash(vec2 p) { p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return -1.0 + 2.0 * fract(sin(p) * 43758.5453123); }
float bruit(vec2 p) {
  const float K1 = 0.366025404; const float K2 = 0.211324865;
  vec2 i = floor(p + (p.x + p.y) * K1); vec2 a = p - i + (i.x + i.y) * K2;
  float m = step(a.y, a.x); vec2 o = vec2(m, 1.0 - m);
  vec2 b = a - o + K2; vec2 c = a - 1.0 + 2.0 * K2;
  vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
  vec3 n = h * h * h * h * vec3(dot(a, hash(i)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));
  return dot(n, vec3(70.0));
}
float fbm(vec2 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 3; i++) { v += a * bruit(p); p *= 2.03; a *= 0.5; } return v; }

void main() {
  float rs = uRes.x / uRes.y;
  float ri = uImg.x / uImg.y;
  vec2 echelle = rs < ri ? vec2(rs / ri, 1.0) : vec2(1.0, ri / rs);
  vec2 focus = vec2(uFocus.x, 1.0 - uFocus.y);
  vec2 p = vUv * vec2(rs, 1.0);
  float t = uTime;

  // courant de l'eau
  vec2 courant = vec2(fbm(p * 2.2 + vec2(t * 0.06, t * 0.02)), fbm(p * 2.2 + vec2(5.2 - t * 0.03, 1.3 + t * 0.05)));
  float amp = mix(0.0015, 0.024, uAgite);
  vec2 dep = courant * amp;
  float lumiere = 0.0;

  // ronds dans l'eau
  for (int i = 0; i < 10; i++) {
    vec4 r = uRonds[i];
    float age = t - r.z;
    if (r.w > 0.0 && age > 0.0 && age < 3.2) {
      vec2 d = (vUv - r.xy) * vec2(rs, 1.0);
      float dist = length(d);
      float rayon = age * 0.32;
      float onde = sin((dist - rayon) * 70.0) * exp(-pow((dist - rayon) * 9.0, 2.0));
      float f = (1.0 - age / 3.2) * r.w;
      dep += normalize(d + 1e-5) / vec2(rs, 1.0) * onde * f * 0.012;
      lumiere += onde * f * 0.12;
    }
  }

  // goutte d'ouverture : l'image apparaît dans une onde
  vec2 dc = (vUv - vec2(0.5)) * vec2(rs, 1.0);
  float dCentre = length(dc);
  float R = uIntro * (0.6 * max(rs, 1.0) + 0.6);
  float bord = exp(-pow((dCentre - R) * 22.0, 2.0)) * (1.0 - uIntro);
  dep += normalize(dc + 1e-5) / vec2(rs, 1.0) * bord * 0.04;
  float masque = smoothstep(R, R - 0.12, dCentre);

  vec2 uv = (vUv - 0.5) * echelle + 0.5 + (focus - 0.5) * (1.0 - echelle);
  uv = (uv - focus) / uZoom + focus;
  uv = uv * 0.97 + 0.015; // marge pour la déformation
  vec3 col;
  col.r = texture2D(tMap, uv + dep * 1.15).r;
  col.g = texture2D(tMap, uv + dep).g;
  col.b = texture2D(tMap, uv + dep * 0.85).b;

  // reflets de surface
  float caustique = pow(max(0.0, bruit(p * 4.0 + courant * 2.0 + t * 0.08)), 2.0);
  col += vec3(0.62, 0.76, 0.72) * (caustique * 0.22 * uAgite + lumiere);

  vec3 profond = vec3(0.055, 0.149, 0.165);
  col = mix(profond, col, masque);
  col += vec3(0.62, 0.76, 0.72) * bord * 0.5;
  gl_FragColor = vec4(col, 1.0);
}`;

export function initEau() {
  const zone = document.querySelector('[data-eau]');
  if (!zone || estCalme()) return null;
  const canvas = zone.querySelector('.eau-canvas');
  const test = document.createElement('canvas');
  if (!(test.getContext('webgl2') || test.getContext('webgl'))) { document.documentElement.classList.add('sans-webgl'); return null; }
  let renderer;
  try {
    renderer = new Renderer({ canvas, dpr: Math.min(window.devicePixelRatio || 1, estMobile() ? 1 : 1.5), alpha: false, depth: false, powerPreference: 'high-performance' });
  } catch (e) {
    document.documentElement.classList.add('sans-webgl');
    return null;
  }
  const gl = renderer.gl;
  if (!gl) { document.documentElement.classList.add('sans-webgl'); return null; }
  gl.clearColor(0.055, 0.149, 0.165, 1);

  const mobile = estMobile() && window.innerHeight > window.innerWidth;
  const src = mobile ? zone.dataset.srcMobile : zone.dataset.src;
  const focus = (mobile ? zone.dataset.focusMobile : zone.dataset.focus || '0.5 0.5').split(' ').map(Number);

  const texture = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE });
  const ronds = new Array(40).fill(0);
  const program = new Program(gl, {
    vertex, fragment,
    uniforms: {
      tMap: { value: texture },
      uRes: { value: [1, 1] },
      uImg: { value: [16, 9] },
      uFocus: { value: focus },
      uZoom: { value: Number((mobile ? zone.dataset.zoomMobile : zone.dataset.zoom) || 1) },
      uTime: { value: 0 },
      uAgite: { value: 1 },
      uIntro: { value: 0 },
      uRonds: { value: ronds },
    },
  });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

  const etat = { intro: 0, agite: 1, defil: 0, visible: true, t0: performance.now(), pret: false };
  let prochainRond = 0;

  function taille() {
    const r = zone.getBoundingClientRect();
    renderer.setSize(r.width, r.height);
    program.uniforms.uRes.value = [r.width, r.height];
  }
  taille();
  window.addEventListener('resize', taille);

  function ajouterRond(x, y, force) {
    const r = zone.getBoundingClientRect();
    const i = (prochainRond++ % 10) * 4;
    ronds[i] = (x - r.left) / r.width;
    ronds[i + 1] = 1 - (y - r.top) / r.height;
    ronds[i + 2] = program.uniforms.uTime.value;
    ronds[i + 3] = force;
  }

  let dernier = { x: 0, y: 0, t: 0 };
  zone.parentElement.addEventListener('pointermove', (e) => {
    const now = performance.now();
    const dx = e.clientX - dernier.x, dy = e.clientY - dernier.y, d = Math.hypot(dx, dy);
    if (d > 38 && now - dernier.t > 70) {
      ajouterRond(e.clientX, e.clientY, Math.min(1, 0.25 + d / 180));
      dernier = { x: e.clientX, y: e.clientY, t: now };
    }
  });
  zone.parentElement.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button')) return;
    ajouterRond(e.clientX, e.clientY, 1.4);
    goutte(1);
  });

  new IntersectionObserver(([en]) => { etat.visible = en.isIntersecting; if (etat.visible) boucle(); }).observe(zone);

  let raf = 0;
  function boucle() {
    cancelAnimationFrame(raf);
    if (!etat.visible || !etat.pret) return;
    const t = (performance.now() - etat.t0) / 1000;
    program.uniforms.uTime.value = t;
    program.uniforms.uIntro.value = etat.intro;
    // l'eau se calme d'elle-même, puis se clarifie au défilement
    const base = 0.3 + 0.7 * Math.exp(-Math.max(0, t - 1.2) / 2.2);
    program.uniforms.uAgite.value = base * (1 - etat.defil);
    renderer.render({ scene: mesh });
    raf = requestAnimationFrame(boucle);
  }

  const img = new Image();
  img.decoding = 'async';
  img.src = src;
  const pret = img.decode ? img.decode() : new Promise((ok) => { img.onload = ok; });
  const promesse = pret.then(() => {
    texture.image = img;
    program.uniforms.uImg.value = [img.naturalWidth, img.naturalHeight];
    etat.pret = true;
    etat.t0 = performance.now();
    zone.classList.add('is-pret');
    boucle();
  }).catch(() => { document.documentElement.classList.add('sans-webgl'); });

  // défilement : clarification
  if (window.ScrollTrigger) {
    ScrollTrigger.create({
      trigger: zone.parentElement, start: 'top top', end: 'bottom top',
      onUpdate: (s) => { etat.defil = Math.min(1, s.progress * 1.8); },
    });
  }

  return {
    promesse,
    ouvrir(duree = 1.6) {
      return new Promise((ok) => {
        const go = () => {
          ajouterRond(window.innerWidth / 2, zone.getBoundingClientRect().top + zone.offsetHeight / 2, 1.2);
          gsap.to(etat, { intro: 1, duration: duree, ease: 'power2.out', onComplete: ok });
        };
        promesse.then(go);
      });
    },
    montrer() { etat.intro = 1; },
  };
}
