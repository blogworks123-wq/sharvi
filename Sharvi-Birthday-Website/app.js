import { countdownAt } from './time.mjs';

if (document.readyState === 'loading') await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
let lenis;
if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
if (window.Lenis && gsap && !reducedMotion) {
  lenis = new window.Lenis({ duration: 1.15, smoothWheel: true, anchors: true, syncTouch: false });
  if (ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

// A single, capped canvas for stars and soft bokeh; no individual DOM particles.
const skyCanvas = $('#sky-canvas');
const skyCtx = skyCanvas.getContext('2d');
let vw = innerWidth, vh = innerHeight, stars = [], skyFrame;
const random = (min, max) => min + Math.random() * (max - min);
function fitCanvas(canvas, width, height, ratio = Math.min(devicePixelRatio || 1, 1.6)) {
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  canvas.getContext('2d')?.setTransform(ratio, 0, 0, ratio, 0, 0);
}
function resizeSky() {
  vw = innerWidth; vh = innerHeight;
  fitCanvas(skyCanvas, vw, vh);
  stars = Array.from({ length: vw < 640 ? 65 : 110 }, () => ({ x: Math.random() * vw, y: Math.random() * vh, r: random(.4, 1.3), a: random(.12, .7), p: random(0, 6.28), speed: random(.2, .8) }));
}
function drawSky(t = 0) {
  if (!skyCtx) return;
  skyCtx.clearRect(0, 0, vw, vh);
  stars.forEach((s, i) => {
    const alpha = s.a * (.6 + .4 * Math.sin(t * .0003 * s.speed + s.p));
    skyCtx.fillStyle = `rgba(221,205,255,${alpha})`;
    const y = reducedMotion ? s.y : (s.y - t * .001 * s.speed + vh * 100) % vh;
    skyCtx.beginPath(); skyCtx.arc(s.x, y, s.r, 0, Math.PI * 2); skyCtx.fill();
    if (i % 18 === 0) {
      const glow = skyCtx.createRadialGradient(s.x, y, 0, s.x, y, 12);
      glow.addColorStop(0, `rgba(204,166,245,${alpha * .12})`); glow.addColorStop(1, 'rgba(204,166,245,0)');
      skyCtx.fillStyle = glow; skyCtx.fillRect(s.x - 12, y - 12, 24, 24);
    }
  });
  if (!reducedMotion && !document.hidden) skyFrame = requestAnimationFrame(drawSky);
}
resizeSky(); drawSky();
let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { resizeSky(); if (reducedMotion) drawSky(); }, 180); });
document.addEventListener('visibilitychange', () => { cancelAnimationFrame(skyFrame); if (!document.hidden) { drawSky(); updateCountdown(); } });

// Temporary fireworks, glass-dissolve particles, confetti, and a few quiet balloons.
const fxCanvas = $('#celebration-canvas'), fx = fxCanvas.getContext('2d');
let bits = [], fxFrame = 0, fxLast = 0, fxDeadline = 0;
const palette = ['#e7c7ff', '#ffcce7', '#a8baff', '#f6edff', '#cda8e7'];
function addBurst(x, y, count = 65) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2, force = random(1, 4);
    bits.push({ x, y, vx: Math.cos(angle) * force, vy: Math.sin(angle) * force, life: random(50, 105), maxLife: 105, color: palette[i % 5], size: random(.8, 2), type: 'spark' });
  }
}
function drawEffects(now) {
  const dt = Math.min((now - (fxLast || now)) / 16.67, 2); fxLast = now;
  fx.clearRect(0, 0, vw, vh);
  bits = bits.filter(p => p.life > 0 && p.y < vh + 80);
  for (const p of bits) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    if (p.type === 'spark') { p.vy += .017 * dt; p.vx *= .992; p.vy *= .992; }
    if (p.type === 'confetti') { p.vy += .014 * dt; p.angle += p.spin * dt; }
    fx.globalAlpha = Math.min(1, p.life / 35);
    fx.fillStyle = p.color;
    if (p.type === 'confetti') { fx.save(); fx.translate(p.x, p.y); fx.rotate(p.angle); fx.fillRect(-p.size / 2, -p.size, p.size, p.size * 1.7); fx.restore(); }
    else if (p.type === 'balloon') { fx.globalAlpha *= .25; fx.beginPath(); fx.ellipse(p.x, p.y, 16, 21, -.1, 0, Math.PI * 2); fx.fill(); fx.strokeStyle = p.color; fx.lineWidth = .7; fx.beginPath(); fx.moveTo(p.x, p.y + 21); fx.quadraticCurveTo(p.x + 9, p.y + 45, p.x, p.y + 70); fx.stroke(); }
    else { fx.beginPath(); fx.arc(p.x, p.y, p.size, 0, Math.PI * 2); fx.fill(); }
  }
  fx.globalAlpha = 1;
  if (bits.length && now < fxDeadline && !document.hidden) fxFrame = requestAnimationFrame(drawEffects);
  else { fx.clearRect(0, 0, vw, vh); bits = []; fxFrame = 0; fxLast = 0; }
}
function startEffects() { if (!fx) return; fxDeadline = performance.now() + 12000; if (!fxFrame) { fitCanvas(fxCanvas, vw, vh); fxFrame = requestAnimationFrame(drawEffects); } }
function celebrate(full = true) {
  if (!fx || reducedMotion) return;
  for (let i = 0; i < (full ? 95 : 60); i++) bits.push({ x: random(0, vw), y: random(-vh * .6, -10), vx: random(-.6, .6), vy: random(1, 2.2), life: random(180, 310), size: random(2, 4), color: palette[i % 5], type: 'confetti', angle: Math.random() * 6.28, spin: random(-.04, .04) });
  if (full) {
    for (let i = 0; i < 6; i++) bits.push({ x: random(30, vw - 30), y: vh + random(0, 100), vx: random(-.15, .15), vy: random(-1.3, -.6), life: 650, size: 15, color: palette[i % 5], type: 'balloon' });
    for (let i = 0; i < 5; i++) setTimeout(() => { addBurst(random(vw * .1, vw * .9), random(vh * .1, vh * .5)); startEffects(); }, i * 650);
  }
  addBurst(vw * .5, vh * .3); startEffects();
}
function dissolvePanel() {
  if (reducedMotion || !fx) return;
  const box = $('#countdown-panel').getBoundingClientRect();
  for (let i = 0; i < 140; i++) bits.push({ x: random(box.left, box.right), y: random(box.top, box.bottom), vx: random(-2, 2), vy: random(-2.5, .5), life: random(35, 100), size: random(.5, 1.8), color: palette[i % 5], type: 'spark' });
  startEffects();
}

let introDone = false, birthdayStarted = false, countdownInterval;
function finishIntro() {
  if (introDone) return; introDone = true;
  const intro = $('#intro');
  if (gsap && !reducedMotion && intro) gsap.to(intro, { opacity: 0, duration: .9, onComplete: () => intro.remove() });
  else intro?.remove();
  if (gsap && !reducedMotion) gsap.from(['.hero-topline', '.hero-name', '.birthday-line', '.hero-date', '.countdown-float', '.countdown-caption', '.scroll-cue'], { y: 24, opacity: 0, filter: 'blur(8px)', stagger: .1, duration: 1.3, ease: 'power3.out', clearProps: 'transform,filter' });
  updateCountdown();
}
$('#skip-intro')?.addEventListener('click', finishIntro);
if (reducedMotion || !gsap) finishIntro();
else {
  const opening = gsap.timeline();
  opening.from('.intro-light', { scale: 0, opacity: 0, duration: 1.2, ease: 'power2.out' }).to('.intro p', { opacity: 1, duration: 1.1 }, .7).to('.intro-light', { scale: 1.5, boxShadow: '0 0 70px 20px #dbc1ff55, 0 0 150px 55px #926dcc22', duration: 1.5 }, .8).call(finishIntro, [], 3.1);
}
function showBirthday() {
  if (birthdayStarted || !introDone) return; birthdayStarted = true; clearInterval(countdownInterval);
  const before = $('#before-birthday'), after = $('#birthday-reveal');
  function reveal() {
    before.hidden = true; after.hidden = false; celebrate();
    if (gsap && !reducedMotion) gsap.from(after.children, { opacity: 0, y: 30, filter: 'blur(12px)', duration: 1.4, stagger: .16, ease: 'power2.out', clearProps: 'filter,transform' });
    ScrollTrigger?.refresh();
  }
  if (gsap && !reducedMotion) gsap.timeline().to('#countdown-panel', { boxShadow: '0 0 100px #ddb1ef77, inset 0 0 60px #eedbff66', borderColor: '#f1d9ffbb', duration: .8, delay: .5 }).call(dissolvePanel).to(before, { opacity: 0, filter: 'blur(16px)', scale: 1.04, duration: .9 }).call(reveal);
  else reveal();
}
function updateCountdown() {
  const values = countdownAt();
  for (const key of ['days', 'hours', 'minutes', 'seconds']) {
    const el = $(`[data-time="${key}"]`), value = String(values[key]).padStart(2, '0');
    if (el.dataset.value === value) continue;
    const previous = el.dataset.value; el.dataset.value = value;
    if (previous && gsap && !reducedMotion && !birthdayStarted && introDone) {
      gsap.killTweensOf(el);
      gsap.to(el, { y: -12, rotateX: 25, opacity: 0, duration: .16, ease: 'power2.in', onComplete: () => { el.textContent = value; gsap.fromTo(el, { y: 12, rotateX: -25, opacity: 0 }, { y: 0, rotateX: 0, opacity: 1, duration: .3, ease: 'power2.out' }); } });
    } else el.textContent = value;
  }
  if (values.complete) showBirthday();
}
updateCountdown(); if (!birthdayStarted) countdownInterval = setInterval(updateCountdown, 250);

if (gsap && ScrollTrigger && !reducedMotion) {
  $$('.reveal').forEach(el => gsap.from(el, { opacity: 0, y: 38, filter: 'blur(6px)', duration: 1.1, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, clearProps: 'filter,transform' }));
  $$('.wish-card').forEach((el, i) => {
    gsap.from(el, { opacity: 0, y: 65, rotate: i % 2 ? 4 : -4, scale: .96, duration: .9, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 94%', once: true } });
    gsap.to(el, { y: i % 3 === 1 ? -25 : 14, scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom top', scrub: 1.2 } });
  });
  $$('.orbit-word').forEach((el, i) => gsap.fromTo(el, { x: i % 2 ? 12 : -12, y: i % 2 ? -15 : 15 }, { x: i % 2 ? -14 : 14, y: i % 2 ? 18 : -18, ease: 'none', scrollTrigger: { trigger: '.chapter-universe', start: 'top bottom', end: 'bottom top', scrub: 2 } }));
  gsap.to('.hero-watermark', { y: 150, rotate: 18, scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.5 } });
  gsap.to('.sky', { opacity: .18, scrollTrigger: { trigger: '.final-section', start: 'top 80%', end: 'center center', scrub: 1.5 } });
  gsap.from('.before-you-go', { opacity: 0, y: 15, duration: 1, scrollTrigger: { trigger: '.final-section', start: 'top 65%', once: true } });
  gsap.from('.final-message', { opacity: 0, y: 25, filter: 'blur(8px)', duration: 1.8, delay: 1, clearProps: 'filter,transform', scrollTrigger: { trigger: '.final-message', start: 'top 75%', once: true } });
  gsap.to('.scroll-progress', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: .2 } });
}
if (gsap && finePointer && !reducedMotion) {
  const glowX = gsap.quickTo('#mouse-glow', 'left', { duration: .7 }), glowY = gsap.quickTo('#mouse-glow', 'top', { duration: .7 });
  window.addEventListener('pointermove', e => { glowX(e.clientX); glowY(e.clientY); }, { passive: true });
  $$('#countdown-panel, .tilt').forEach(el => {
    el.addEventListener('pointermove', e => { const b = el.getBoundingClientRect(); gsap.to(el, { rotationY: ((e.clientX - b.left) / b.width - .5) * 9, rotationX: -((e.clientY - b.top) / b.height - .5) * 7, transformPerspective: 900, duration: .7, ease: 'power2.out' }); });
    el.addEventListener('pointerleave', () => gsap.to(el, { rotationY: 0, rotationX: 0, duration: .9, ease: 'power2.out' }));
  });
  $$('.magnetic').forEach(el => { el.addEventListener('pointermove', e => { const b = el.getBoundingClientRect(); gsap.to(el, { x: (e.clientX - b.left - b.width / 2) * .13, y: (e.clientY - b.top - b.height / 2) * .2, duration: .5 }); }); el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.5)' })); });
}

// The note opens inline, keeping the full letter available to assistive technology.
$('#open-note').addEventListener('click', () => {
  const button = $('#open-note'); if (button.getAttribute('aria-expanded') === 'true') return;
  button.setAttribute('aria-expanded', 'true'); button.textContent = 'A wish, just for you ✧';
  function openLetter() {
    $('#envelope').hidden = true; $('#birthday-letter').hidden = false;
    if (gsap && !reducedMotion) gsap.from('#birthday-letter', { opacity: 0, y: 35, rotate: -3, duration: 1, ease: 'power3.out' });
    ScrollTrigger?.refresh();
  }
  if (gsap && !reducedMotion) gsap.timeline().to('.envelope-seal', { opacity: 0, scale: .7, duration: .3 }).to('.envelope-flap', { rotateX: -175, duration: .7, ease: 'power2.inOut' }).to('.envelope-preview', { y: -65, duration: .65 }, '-=.2').to('#envelope', { opacity: 0, y: 20, duration: .4 }).call(openLetter);
  else openLetter();
});

// Load the 3D scene only as its section approaches. It renders only on screen.
let cake, scenePromise, giftScene, wishMade = false;
const loadScenes = () => scenePromise ||= import('./scenes.js');
async function ensureCake() {
  if (cake) return cake;
  try { const scene = await loadScenes(); cake ||= scene.createCake($('#cake-canvas'), reducedMotion); return cake; }
  catch { $('#cake-stage').setAttribute('aria-label', 'Fifteen birthday candles'); drawCakeFallback(); return null; }
}
const cakeObserver = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { ensureCake(); cakeObserver.disconnect(); } }, { rootMargin: '400px' }); cakeObserver.observe($('#cake-stage'));
function drawCakeFallback(unlit = false) {
  let canvas = $('#cake-canvas'), ctx;
  try { ctx = canvas.getContext('2d'); } catch {}
  if (!ctx) { const replacement = canvas.cloneNode(); canvas.replaceWith(replacement); canvas = replacement; ctx = canvas.getContext('2d'); }
  if (!ctx) return;
  fitCanvas(canvas, 500, 340); ctx.clearRect(0, 0, 500, 340);
  const gradient = ctx.createLinearGradient(150, 160, 350, 280); gradient.addColorStop(0, '#e8d2f4'); gradient.addColorStop(.5, '#ac86ba'); gradient.addColorStop(1, '#513c73');
  ctx.fillStyle = gradient; ctx.beginPath(); ctx.ellipse(250, 280, 133, 27, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(117, 182, 266, 95); ctx.beginPath(); ctx.ellipse(250, 182, 133, 32, 0, 0, Math.PI * 2); ctx.fillStyle = '#dfc8ef'; ctx.fill();
  for (let i = 0; i < 15; i++) { const angle = i / 15 * Math.PI * 2; const x = 250 + Math.cos(angle) * 92, y = 180 + Math.sin(angle) * 22; ctx.fillStyle = i % 2 ? '#9473b0' : '#eedfea'; ctx.fillRect(x - 2, y - 42, 4, 44); if (!unlit) { ctx.fillStyle = '#ffe9b5'; ctx.shadowColor = '#ffbd64'; ctx.shadowBlur = 16; ctx.beginPath(); ctx.ellipse(x, y - 48, 3, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; } }
}
$('#make-wish').addEventListener('click', async () => {
  if (wishMade) return; wishMade = true;
  const button = $('#make-wish'); button.disabled = true; button.textContent = 'Keep it close…';
  $('#wish').classList.add('wish-made'); $('#wish-instruction').textContent = 'A little hope. A little stardust.';
  const scene = await ensureCake(); if (scene) scene.extinguish(); else drawCakeFallback(true);
  setTimeout(() => {
    button.hidden = true; $('#wish-result').hidden = false; $('#cake-stage').setAttribute('aria-label', 'A birthday cake with fifteen extinguished candles');
    if (gsap && !reducedMotion) gsap.from('#wish-result', { opacity: 0, y: 15, filter: 'blur(8px)', duration: 1.4, clearProps: 'filter,transform' });
    if (!reducedMotion) { const b = $('#wish-result').getBoundingClientRect(); addBurst(vw / 2, b.top - 30, 35); startEffects(); }
    ScrollTrigger?.refresh();
  }, reducedMotion ? 100 : 2700);
});

const dialog = $('#gift-dialog');
function closeGift() { clearTimeout(giftTimeout); dialog.close(); document.body.appendChild(fxCanvas); lenis?.start(); document.body.classList.remove('dialog-open'); giftScene?.stop(); $('#unlock-button').focus({ preventScroll: true }); }
$('#close-gift').addEventListener('click', closeGift); $('#continue-birthday').addEventListener('click', closeGift);
dialog.addEventListener('cancel', e => { e.preventDefault(); closeGift(); });
dialog.addEventListener('click', e => { if (e.target === dialog) { const b = dialog.getBoundingClientRect(); if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) closeGift(); } });
let giftTimeout;
$('#unlock-button').addEventListener('click', async () => {
  clearTimeout(giftTimeout); $('#gift-result').hidden = true; $('#gift-kicker').textContent = 'A LITTLE BIRTHDAY MAGIC'; dialog.showModal(); dialog.appendChild(fxCanvas); document.body.classList.add('dialog-open'); lenis?.stop();
  try { const scene = await loadScenes(); giftScene ||= scene.createGift($('#gift-canvas'), reducedMotion); giftScene.open(); } catch { $('#gift-kicker').textContent = 'YOUR BIRTHDAY SURPRISE'; }
  giftTimeout = setTimeout(() => { if (!dialog.open) return; $('#gift-kicker').textContent = 'CHAPTER FIFTEEN'; $('#gift-result').hidden = false; celebrate(false); if (gsap && !reducedMotion) gsap.from('#gift-result', { opacity: 0, y: 20, duration: .8 }); }, reducedMotion ? 100 : 2100);
});

// Sample the typography into particles, then spring them back to their homes.
const numberCanvas = $('#number-canvas'), numberCtx = numberCanvas.getContext('2d');
let points = [], nw = 0, nh = 0, numberFrame, numberVisible = false, pointer = { x: -9999, y: -9999 }, numberLast = 0;
function createNumber() {
  if (!numberCtx) return;
  const rect = numberCanvas.getBoundingClientRect(); nw = rect.width; nh = rect.height; fitCanvas(numberCanvas, nw, nh);
  const sample = document.createElement('canvas'); sample.width = Math.ceil(nw); sample.height = Math.ceil(nh); const sc = sample.getContext('2d');
  sc.font = `400 ${Math.min(nh * .95, nw * .67)}px Italiana, Georgia, serif`; sc.textAlign = 'center'; sc.textBaseline = 'middle'; sc.fillStyle = 'white'; sc.fillText('15', nw / 2, nh * .5);
  const pixels = sc.getImageData(0, 0, sample.width, sample.height).data; points = []; const step = nw < 500 ? 4 : 5;
  for (let y = 0; y < nh; y += step) for (let x = 0; x < nw; x += step) if (pixels[(Math.floor(y) * sample.width + Math.floor(x)) * 4 + 3] > 90) points.push({ x: x + random(-10, 10), y: y + random(-10, 10), ox: x, oy: y, vx: 0, vy: 0, r: random(.55, 1.35), p: Math.random() * 6.28 });
  $('.particle-stage').classList.add('particle-ready');
}
function drawNumber(now = 0) {
  if (!numberCtx) return; const dt = Math.min((now - (numberLast || now)) / 16.67, 2) || 1; numberLast = now;
  numberCtx.clearRect(0, 0, nw, nh);
  for (const p of points) {
    const dx = p.x - pointer.x, dy = p.y - pointer.y, distance = Math.hypot(dx, dy);
    if (!reducedMotion && distance < 85) { const f = (85 - distance) / 85 * 1.8; p.vx += dx / (distance || 1) * f; p.vy += dy / (distance || 1) * f; }
    p.vx += (p.ox - p.x) * .019 * dt; p.vy += (p.oy - p.y) * .019 * dt; p.vx *= .9; p.vy *= .9; p.x += p.vx * dt; p.y += p.vy * dt;
    const twinkle = .5 + .45 * Math.sin(now * .001 + p.p);
    numberCtx.fillStyle = `rgba(${p.ox < nw / 2 ? '225,198,255' : '245,199,224'},${reducedMotion ? .85 : twinkle})`;
    numberCtx.beginPath(); numberCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2); numberCtx.fill();
  }
  if (numberVisible && !document.hidden && !reducedMotion) numberFrame = requestAnimationFrame(drawNumber);
}
numberCanvas.addEventListener('pointermove', e => { const r = numberCanvas.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; }, { passive: true });
const resetPointer = () => { pointer.x = pointer.y = -9999; };
numberCanvas.addEventListener('pointerleave', resetPointer); numberCanvas.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') resetPointer(); }); numberCanvas.addEventListener('pointercancel', resetPointer);
const numberObserver = new IntersectionObserver(entries => { numberVisible = entries[0].isIntersecting; cancelAnimationFrame(numberFrame); if (numberVisible) { if (!points.length) createNumber(); numberLast = 0; drawNumber(); } }, { threshold: .05 }); numberObserver.observe(numberCanvas);
document.fonts?.ready.then(() => { createNumber(); if (numberVisible && reducedMotion) drawNumber(); ScrollTrigger?.refresh(); });
new ResizeObserver(() => { createNumber(); if (reducedMotion) drawNumber(); }).observe(numberCanvas);
document.addEventListener('visibilitychange', () => { cancelAnimationFrame(numberFrame); if (!document.hidden && numberVisible) { numberLast = 0; drawNumber(); } });

// Audio is strictly opt-in; unavailable audio never pretends to be playing.
const music = $('#birthday-music'), musicButton = $('#music-button');
function setMusicState(playing) { musicButton.classList.toggle('playing', playing); musicButton.setAttribute('aria-pressed', String(playing)); musicButton.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} Her Way by PARTYNEXTDOOR`); $('.music-state').textContent = playing ? 'PAUSE' : 'PLAY'; $('.music-play').textContent = playing ? 'Ⅱ' : '♪'; }
musicButton.addEventListener('click', async () => {
  $('#music-message').hidden = true;
  if (!music.paused) { music.pause(); return; }
  music.volume = .55;
  try { await music.play(); } catch { setMusicState(false); $('#music-message').hidden = false; setTimeout(() => { $('#music-message').hidden = true; }, 5000); }
});
music.addEventListener('play', () => setMusicState(true)); music.addEventListener('pause', () => setMusicState(false)); music.addEventListener('error', () => setMusicState(false));
