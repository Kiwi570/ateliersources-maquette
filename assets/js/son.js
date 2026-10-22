// Ambiance sonore générée en direct (aucun fichier audio) : rivière l'été, feu de bois l'hiver.
// Ne démarre qu'après un clic sur « Son ».
import { qsa, bus } from './outils.js';

let ctx = null, maitre = null, gainRiviere = null, gainFeu = null, actif = false, minuterie = 0, saison = 0;

function bruitBrun(ctx, secondes = 4) {
  const n = ctx.sampleRate * secondes, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
  const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; return s;
}
function bruitBlanc(ctx, secondes = 2) {
  const n = ctx.sampleRate * secondes, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function construire() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  maitre = ctx.createGain(); maitre.gain.value = 0; maitre.connect(ctx.destination);

  // Rivière : grondement doux + clapotis modulé
  gainRiviere = ctx.createGain(); gainRiviere.connect(maitre);
  const fond = bruitBrun(ctx), passeBas = ctx.createBiquadFilter();
  passeBas.type = 'lowpass'; passeBas.frequency.value = 420;
  const gFond = ctx.createGain(); gFond.gain.value = 0.55;
  fond.connect(passeBas).connect(gFond).connect(gainRiviere); fond.start();
  const clapotis = bruitBrun(ctx), bande = ctx.createBiquadFilter();
  bande.type = 'bandpass'; bande.frequency.value = 1100; bande.Q.value = 0.6;
  const gClap = ctx.createGain(); gClap.gain.value = 0.18;
  const lfo = ctx.createOscillator(), lfoG = ctx.createGain();
  lfo.frequency.value = 0.23; lfoG.gain.value = 0.1; lfo.connect(lfoG).connect(gClap.gain); lfo.start();
  const lfo2 = ctx.createOscillator(), lfo2G = ctx.createGain();
  lfo2.frequency.value = 0.07; lfo2G.gain.value = 260; lfo2.connect(lfo2G).connect(bande.frequency); lfo2.start();
  clapotis.connect(bande).connect(gClap).connect(gainRiviere); clapotis.start();

  // Feu : souffle grave + crépitements aléatoires
  gainFeu = ctx.createGain(); gainFeu.connect(maitre);
  const souffle = bruitBrun(ctx), pb = ctx.createBiquadFilter();
  pb.type = 'lowpass'; pb.frequency.value = 180;
  const gS = ctx.createGain(); gS.gain.value = 0.7;
  souffle.connect(pb).connect(gS).connect(gainFeu); souffle.start();
  const blanc = bruitBlanc(ctx);
  const crepiter = () => {
    if (!actif) return;
    if (saison > 0.05) {
      const s = ctx.createBufferSource(); s.buffer = blanc;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1400 + Math.random() * 2600;
      const g = ctx.createGain(); const t = ctx.currentTime, v = 0.05 + Math.random() * 0.22;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.015 + Math.random() * 0.05);
      s.connect(hp).connect(g).connect(gainFeu); s.start(t, Math.random() * 1.5, 0.08);
    }
    minuterie = setTimeout(crepiter, 40 + Math.random() * 260);
  };
  crepiter.lancer = crepiter;
  construire.crepiter = crepiter;
  melanger();
}

function melanger() {
  if (!ctx) return;
  const t = ctx.currentTime;
  gainRiviere.gain.setTargetAtTime(0.9 * (1 - saison), t, 0.4);
  gainFeu.gain.setTargetAtTime(0.9 * saison, t, 0.4);
}

export function goutte(force = 1) {
  if (!actif || !ctx) return;
  const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(1100 + Math.random() * 300, t); o.frequency.exponentialRampToValueAtTime(260, t + 0.16);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12 * force, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  o.connect(g).connect(maitre); o.start(t); o.stop(t + 0.35);
}

function basculer(btn) {
  actif = !actif;
  qsa('[data-son]').forEach((b) => b.setAttribute('aria-pressed', String(actif)));
  if (actif) {
    if (!ctx) construire();
    ctx.resume();
    maitre.gain.cancelScheduledValues(ctx.currentTime);
    maitre.gain.setTargetAtTime(0.5, ctx.currentTime, 0.6);
    clearTimeout(minuterie); construire.crepiter && construire.crepiter();
    goutte(0.8);
  } else if (ctx) {
    maitre.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
    clearTimeout(minuterie);
    setTimeout(() => { if (!actif) ctx.suspend(); }, 1200);
  }
}

export function initSon() {
  qsa('[data-son]').forEach((b) => b.addEventListener('click', () => basculer(b)));
  bus.on('saison', (t) => { saison = t; melanger(); });
  document.addEventListener('visibilitychange', () => {
    if (!ctx || !actif) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });
}
