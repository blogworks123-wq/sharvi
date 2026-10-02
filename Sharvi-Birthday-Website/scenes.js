import * as THREE from './vendor/three.module.js';

function makeScene(canvas, cameraPosition, lookAt, reduced) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
  camera.position.set(...cameraPosition); camera.lookAt(...lookAt);
  scene.add(new THREE.AmbientLight(0xc4afd8, 1.25));
  const key = new THREE.DirectionalLight(0xffe3f1, 3.5); key.position.set(-3, 6, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0x927dff, 3); rim.position.set(5, 3, -4); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xb5cbff, 1.6); fill.position.set(4, 2, 5); scene.add(fill);
  function resize() { const r = canvas.getBoundingClientRect(); if (!r.width || !r.height) return; renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); renderer.render(scene, camera); }
  new ResizeObserver(resize).observe(canvas);
  let frame, visible = false, stopped = false, update = () => {}, last = 0;
  function tick(now) { if (!visible || stopped || document.hidden) return; const delta = Math.min((now - (last || now)) / 1000, .05); last = now; update(now / 1000, delta); renderer.render(scene, camera); frame = requestAnimationFrame(tick); }
  function run() { cancelAnimationFrame(frame); last = 0; if (visible && !stopped && !document.hidden) frame = requestAnimationFrame(tick); }
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; run(); }, { threshold: .01 }).observe(canvas);
  document.addEventListener('visibilitychange', run);
  return { renderer, scene, camera, resize, setUpdate(fn) { update = fn; }, start() { stopped = false; visible = true; resize(); run(); }, stop() { stopped = true; cancelAnimationFrame(frame); }, reduced };
}
function mesh(geometry, material, x = 0, y = 0, z = 0) { const object = new THREE.Mesh(geometry, material); object.position.set(x, y, z); return object; }
function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const ctx = c.getContext('2d'); const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32); gradient.addColorStop(0, 'rgba(255,255,255,1)'); gradient.addColorStop(.12, 'rgba(255,245,225,.6)'); gradient.addColorStop(.4, 'rgba(255,235,220,.15)'); gradient.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export function createCake(canvas, reduced = false) {
  const ctx = makeScene(canvas, [5.5, 4.5, 8.2], [0, 1.02, 0], reduced);
  const group = new THREE.Group(); ctx.scene.add(group);
  const cakeMaterial = new THREE.MeshPhysicalMaterial({ color: 0xc8a7d8, roughness: .44, metalness: .02, clearcoat: .22 });
  const topMaterial = new THREE.MeshPhysicalMaterial({ color: 0xeedcf4, roughness: .5, clearcoat: .16 });
  const plateMaterial = new THREE.MeshPhysicalMaterial({ color: 0xa998c4, metalness: .5, roughness: .18, clearcoat: 1 });
  group.add(mesh(new THREE.CylinderGeometry(1.88, 1.7, .1, 96), plateMaterial, 0, .1));
  group.add(mesh(new THREE.CylinderGeometry(1.52, 1.55, 1.12, 96), cakeMaterial, 0, .72));
  group.add(mesh(new THREE.CylinderGeometry(1.52, 1.53, .15, 96), topMaterial, 0, 1.29));
  const trimMaterial = new THREE.MeshPhysicalMaterial({ color: 0xc9abce, metalness: .25, roughness: .3 });
  for (const height of [.22, .27, 1.29]) { const trim = mesh(new THREE.TorusGeometry(1.53, .016, 8, 96), trimMaterial, 0, height); trim.rotation.x = Math.PI / 2; group.add(trim); }
  // Light, vertical frosting texture catches the rim light without busy decoration.
  for (let i = 0; i < 72; i++) { const angle = i / 72 * Math.PI * 2; const ridge = mesh(new THREE.CylinderGeometry(.008, .008, .91, 5), cakeMaterial, Math.sin(angle) * 1.534, .74, Math.cos(angle) * 1.534); group.add(ridge); }
  const texture = glowTexture(), candles = [], smoke = [];
  const warm = new THREE.PointLight(0xffca83, 1.5, 5, 2); warm.position.set(0, 2.5, 0); ctx.scene.add(warm);
  const flameMaterial = new THREE.MeshBasicMaterial({ color: 0xffd197 });
  const coreMaterial = new THREE.MeshBasicMaterial({ color: 0xfff4d4 });
  for (let i = 0; i < 15; i++) {
    const outer = i < 10, radius = outer ? 1.1 : .52, a = (outer ? i / 10 : (i - 10) / 5) * Math.PI * 2 + .18;
    const x = Math.cos(a) * radius, z = Math.sin(a) * radius, height = .6 + (i % 3) * .03;
    const candleMaterial = new THREE.MeshPhysicalMaterial({ color: i % 2 ? 0xc6a2ce : 0xf2e5f5, roughness: .36, clearcoat: .25 });
    group.add(mesh(new THREE.CylinderGeometry(.026, .03, height, 12), candleMaterial, x, 1.37 + height / 2, z));
    group.add(mesh(new THREE.CylinderGeometry(.005, .005, .036, 6), new THREE.MeshBasicMaterial({ color: 0x44314c }), x, 1.37 + height + .015, z));
    const flameGroup = new THREE.Group(); flameGroup.position.set(x, 1.4 + height, z); group.add(flameGroup);
    const flame = mesh(new THREE.SphereGeometry(1, 12, 10), flameMaterial, 0, .07); flame.scale.set(.037, .105, .037); flameGroup.add(flame);
    const core = mesh(new THREE.SphereGeometry(1, 8, 8), coreMaterial, 0, .038); core.scale.set(.017, .055, .017); flameGroup.add(core);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, color: 0xffb466, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false })); glow.scale.set(.5, .5, 1); glow.position.y = .055; flameGroup.add(glow);
    candles.push({ flameGroup, glow, phase: i * 1.76, x, z, y: 1.4 + height, extinct: false });
    const smokeSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, color: 0xd0c5e3, transparent: true, opacity: 0, depthWrite: false })); smokeSprite.scale.set(.07, .2, 1); group.add(smokeSprite); smoke.push(smokeSprite);
  }
  const positions = new Float32Array(70 * 3);
  for (let i = 0; i < 70; i++) { positions[i * 3] = (Math.random() - .5) * 7; positions[i * 3 + 1] = Math.random() * 4; positions[i * 3 + 2] = -2 + Math.random() * 3; }
  const starGeometry = new THREE.BufferGeometry(); starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const starMaterial = new THREE.PointsMaterial({ size: .025, color: 0xeacdfd, transparent: true, opacity: 0, sizeAttenuation: true, depthWrite: false });
  ctx.scene.add(new THREE.Points(starGeometry, starMaterial));
  let blowAt = null, rotation = 0;
  canvas.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && !reduced) { const b = canvas.getBoundingClientRect(); rotation = (e.clientX - b.left - b.width / 2) / b.width * .3; } }, { passive: true });
  canvas.addEventListener('pointerleave', () => rotation = 0);
  ctx.setUpdate(time => {
    group.rotation.y += (rotation - group.rotation.y) * .04;
    if (!reduced) group.position.y = Math.sin(time * .7) * .025;
    candles.forEach((c, i) => {
      if (blowAt === null) { if (!reduced) { c.flameGroup.scale.y = 1 + Math.sin(time * 7 + c.phase) * .15; c.flameGroup.rotation.z = Math.sin(time * 5 + c.phase) * .075; c.glow.material.opacity = .42 + Math.sin(time * 7 + c.phase) * .08; } }
      else {
        const elapsed = time - blowAt - (reduced ? 0 : i * .065), scale = 1 - clamp(elapsed / .4, 0, 1);
        c.flameGroup.scale.setScalar(scale); c.glow.material.opacity = scale * .5;
        if (!reduced && elapsed > .3 && elapsed < 2.4) { const age = elapsed - .3; smoke[i].position.set(c.x + Math.sin(age * 3 + i) * .035, c.y + age * .3, c.z); smoke[i].scale.set(.1 + age * .15, .2 + age * .28, 1); smoke[i].material.opacity = Math.sin(age / 2.1 * Math.PI) * .22; } else smoke[i].material.opacity = 0;
      }
    });
    if (blowAt !== null) { const elapsed = time - blowAt; warm.intensity = 1.5 * (1 - clamp(elapsed / 2, 0, 1)); starMaterial.opacity = clamp((elapsed - .3) / 2, 0, .75); }
  });
  ctx.resize();
  return { extinguish() { blowAt = performance.now() / 1000; }, stop: ctx.stop };
}

export function createGift(canvas, reduced = false) {
  const ctx = makeScene(canvas, [4, 3.1, 6], [0, .25, 0], reduced);
  const group = new THREE.Group(); ctx.scene.add(group);
  const boxMaterial = new THREE.MeshPhysicalMaterial({ color: 0x9164b0, roughness: .23, metalness: .13, clearcoat: 1, transparent: true, opacity: .88 });
  const bandMaterial = new THREE.MeshPhysicalMaterial({ color: 0xe5b8d4, roughness: .28, metalness: .4, clearcoat: .9 });
  const base = mesh(new THREE.BoxGeometry(1.6, 1.35, 1.6), boxMaterial, 0, -.2); group.add(base);
  const edgeLines = new THREE.LineSegments(new THREE.EdgesGeometry(base.geometry), new THREE.LineBasicMaterial({ color: 0xdebcf3, transparent: true, opacity: .5 })); edgeLines.position.copy(base.position); group.add(edgeLines);
  group.add(mesh(new THREE.BoxGeometry(.15, 1.36, 1.615), bandMaterial, 0, -.2)); group.add(mesh(new THREE.BoxGeometry(1.615, 1.36, .15), bandMaterial, 0, -.2));
  const lid = new THREE.Group(); lid.position.y = .57; group.add(lid);
  lid.add(mesh(new THREE.BoxGeometry(1.7, .2, 1.7), boxMaterial));
  lid.add(mesh(new THREE.BoxGeometry(.15, .21, 1.71), bandMaterial)); lid.add(mesh(new THREE.BoxGeometry(1.71, .21, .15), bandMaterial));
  for (const side of [-1, 1]) {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, .13, 0), new THREE.Vector3(side * .4, .58, -.05), new THREE.Vector3(side * .6, .32, 0), new THREE.Vector3(0, .15, .02)]);
    lid.add(mesh(new THREE.TubeGeometry(curve, 32, .055, 8, false), bandMaterial));
  }
  const insideGlow = new THREE.PointLight(0xf6d5ff, 0, 6, 2); insideGlow.position.y = .3; group.add(insideGlow);
  const texture = glowTexture();
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, color: 0xf2caff, blending: THREE.AdditiveBlending, transparent: true, opacity: 0, depthWrite: false })); halo.scale.set(4, 4, 1); halo.position.y = .4; group.add(halo);
  const particles = Array.from({ length: 60 }, () => ({ x: (Math.random() - .5) * 2, y: Math.random() * 2, z: (Math.random() - .5) * 2 }));
  const positions = new Float32Array(particles.length * 3), geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ size: .032, color: 0xf8d6ff, transparent: true, opacity: 0, depthWrite: false }); group.add(new THREE.Points(geometry, material));
  let startedAt = performance.now() / 1000;
  ctx.setUpdate(time => {
    const elapsed = time - startedAt, progress = reduced ? 1 : clamp((elapsed - .6) / 1.2, 0, 1), eased = 1 - Math.pow(1 - progress, 3);
    group.rotation.y = reduced ? .2 : Math.sin(time * .6) * .2;
    group.position.y = reduced ? 0 : Math.sin(time * 1.2) * .055;
    lid.position.y = .57 + eased * 1.3; lid.rotation.z = -eased * .15; lid.rotation.x = -eased * .13;
    halo.material.opacity = eased * .45; insideGlow.intensity = eased * 2; material.opacity = eased * .8;
    for (let i = 0; i < particles.length; i++) { const p = particles[i]; positions[i * 3] = p.x * eased; positions[i * 3 + 1] = .3 + (p.y + (reduced ? 0 : elapsed * .25)) % 2.8 * eased; positions[i * 3 + 2] = p.z * eased; }
    geometry.attributes.position.needsUpdate = true;
  });
  ctx.resize();
  return { open() { startedAt = performance.now() / 1000; ctx.start(); }, stop: ctx.stop };
}
