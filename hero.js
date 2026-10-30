// The hero: a 3D phone showing the real app, behind slabs of frosted glass
// that refract it and a giant KOSH wordmark, lit like the app's pearl world.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';

const canvas = document.getElementById('stage');
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  document.documentElement.classList.add('no-webgl');
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe4e3e0);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
camera.position.set(0, 0, 10);

scene.add(new THREE.AmbientLight(0xffffff, 0.45));
const key = new THREE.DirectionalLight(0xffffff, 1.7);
key.position.set(-4, 6, 7);
scene.add(key);

// ── backdrop: pearl clouds, the refracted light, and the giant wordmark
await document.fonts.load('300px Michroma').catch(() => {});
const bd = document.createElement('canvas');
bd.width = 2400; bd.height = 1350;
const g = bd.getContext('2d');
function paintBackdrop() {
  g.fillStyle = '#e4e3e0'; g.fillRect(0, 0, bd.width, bd.height);
  for (const [x, y, r, c] of [[.12, .1, .5, '#f6f5f2'], [.9, .35, .45, '#cfcecb'], [.32, .7, .55, '#eeedea'], [.8, .95, .5, '#d2d1cd']]) {
    const gr = g.createRadialGradient(x * bd.width, y * bd.height, 0, x * bd.width, y * bd.height, r * bd.width);
    gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(228,227,224,0)');
    g.fillStyle = gr; g.fillRect(0, 0, bd.width, bd.height);
  }
  g.save();
  g.translate(bd.width * .55, 0); g.rotate(-.42);
  const band = g.createLinearGradient(-120, 0, 120, 0);
  [['rgba(255,214,160,0)', 0], ['rgba(255,214,160,.35)', .25], ['rgba(255,170,200,.32)', .42], ['rgba(180,165,255,.3)', .6], ['rgba(150,215,255,.3)', .78], ['rgba(150,215,255,0)', 1]].forEach(([c, s]) => band.addColorStop(s, c));
  g.fillStyle = band; g.filter = 'blur(10px)'; g.fillRect(-120, -400, 240, 3000);
  g.restore();
  g.filter = 'none';
  g.font = `${bd.height * .42}px Michroma`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = 'rgba(28,27,26,.085)';
  g.fillText('KOSH', bd.width / 2, bd.height * .44);
}
paintBackdrop();
const bdTex = new THREE.CanvasTexture(bd);
bdTex.colorSpace = THREE.SRGBColorSpace;
const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: bdTex, toneMapped: false }));
backdrop.position.z = -4;
scene.add(backdrop);

// ── the phone
const phone = new THREE.Group();
const W = 1.72, H = 3.72, D = .2;
const body = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 8, .26), new THREE.MeshPhysicalMaterial({ color: 0xd8d6d2, metalness: 1, roughness: .3, clearcoat: .7, clearcoatRoughness: .2 }));
phone.add(body);
const screens = ['home', 'adviser', 'wallet', 'family', 'news'].map((n) => {
  const im = new Image(); im.src = `img/${n}.jpg`; return im;
});
await Promise.all(screens.map((im) => im.decode().catch(() => {})));
const sc = document.createElement('canvas');
sc.width = 540; sc.height = 1168;
const sg = sc.getContext('2d');
if (!sg.roundRect) sg.roundRect = function (x, y, w, h) { this.rect(x, y, w, h); }; // older Safari
function paintScreen(a, b, f) {
  // opaque, corners in the body's colour: transparent meshes are left out of
  // the glass's refraction pass, which made the glass show the dark body
  sg.fillStyle = '#cfcdc9'; sg.fillRect(0, 0, sc.width, sc.height);
  sg.save();
  sg.beginPath(); sg.roundRect(0, 0, sc.width, sc.height, 56); sg.clip();
  sg.globalAlpha = 1; sg.drawImage(a, 0, 0, sc.width, sc.height);
  if (b && f > 0) { sg.globalAlpha = f; sg.drawImage(b, 0, 0, sc.width, sc.height); }
  sg.globalAlpha = 1;
  sg.fillStyle = '#0d0d0d'; sg.beginPath(); sg.roundRect(sc.width / 2 - 70, 16, 140, 34, 17); sg.fill();
  sg.restore();
}
paintScreen(screens[0]);
const scTex = new THREE.CanvasTexture(sc);
scTex.colorSpace = THREE.SRGBColorSpace;
scTex.anisotropy = 8;
const screen = new THREE.Mesh(new THREE.PlaneGeometry(W - .1, H - .1), new THREE.MeshBasicMaterial({ map: scTex, toneMapped: false }));
screen.position.z = D / 2 + .002;
phone.add(screen);
// a glassy reflection over the screen
const glint = new THREE.Mesh(new THREE.PlaneGeometry(W - .1, H - .1), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .08, roughness: .05, metalness: 0, clearcoat: 1 }));
glint.position.z = D / 2 + .004;
phone.add(glint);
scene.add(phone);

// soft contact shadow behind
const sh = document.createElement('canvas'); sh.width = sh.height = 256;
const shg = sh.getContext('2d');
const sgr = shg.createRadialGradient(128, 128, 0, 128, 128, 128);
sgr.addColorStop(0, 'rgba(50,40,30,.32)'); sgr.addColorStop(1, 'rgba(50,40,30,0)');
shg.fillStyle = sgr; shg.fillRect(0, 0, 256, 256);
const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 5.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sh), transparent: true, depthWrite: false }));
shadow.position.set(.5, -.5, -1.2);
scene.add(shadow);

// ── frosted glass slabs that refract everything behind them
const glass = new THREE.MeshPhysicalMaterial({
  color: 0xffffff, metalness: 0, roughness: .16, transmission: 1, thickness: .22, ior: 1.18,
  iridescence: 1, iridescenceIOR: 1.3, iridescenceThicknessRange: [160, 520],
  clearcoat: 1, clearcoatRoughness: .08, specularIntensity: 1, envMapIntensity: 1.25,
  attenuationColor: new THREE.Color(0xfbfaf7), attenuationDistance: 8,
});
const slabs = [
  { w: 2.5, h: 1.25, x: -1.35, y: -1.05, z: 1.1, r: .1 },
  { w: 1.5, h: 1.9, x: 1.45, y: .95, z: .9, r: -.18 },
  { w: 1.1, h: .7, x: -1.15, y: 1.55, z: 1.6, r: .3 },
].map((s) => {
  const m = new THREE.Mesh(new RoundedBoxGeometry(s.w, s.h, .16, 6, .14), glass);
  m.position.set(s.x, s.y, s.z); m.rotation.z = s.r; m.userData = s;
  scene.add(m);
  return m;
});

// ── layout and motion
let mx = 0, my = 0, tmx = 0, tmy = 0;
addEventListener('pointermove', (e) => { tmx = e.clientX / innerWidth - .5; tmy = e.clientY / innerHeight - .5; }, { passive: true });
let wide = true, lay = { x: 1.9, y: 0, s: 1 };
const copyEl = document.querySelector('.hero-copy'), qrEl = document.querySelector('.hero-qr');
// the phone and its glass are fitted into the space the copy leaves free:
// beside it on wide screens, above it on portrait phones and tablets
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  wide = w / h > 1.05;
  const dist = camera.position.z - backdrop.position.z;
  const vh = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const vw = vh * camera.aspect;
  const s = Math.max(vw, vh * bd.width / bd.height);
  backdrop.scale.set(s, s * bd.height / bd.width, 1);
  // pixels per world unit on the phone's own plane (z = 0)
  const ppw = h / (2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  const hr = canvas.getBoundingClientRect(), cr = copyEl.getBoundingClientRect(), qr = qrEl.getBoundingClientRect();
  let L, R, T = 84, B;
  if (wide) { L = cr.right - hr.left + 24; R = w - 24; B = qr.height ? qr.top - hr.top - 14 : h - 30; }
  else { L = 12; R = w - 12; B = cr.top - hr.top - 18; }
  const k = Math.max(.32, Math.min(1, (B - T) / (4.0 * ppw), (R - L) / (3.4 * ppw)));
  lay = { x: ((L + R) / 2 - w / 2) / ppw, y: (h / 2 - (T + B) / 2) / ppw, s: k };
  if (wide && w >= 1300) lay = { x: 1.9, y: 0, s: 1 };   // desktop: the original composition
}
addEventListener('resize', resize);
resize();
document.fonts.ready.then(resize);
new ResizeObserver(resize).observe(copyEl);

let cur = 0, fade = 0, lastSwap = performance.now();
const clock = new THREE.Clock();
let visible = true;
addEventListener('scroll', () => { visible = scrollY < innerHeight * 1.15; }, { passive: true });

function frame() {
  requestAnimationFrame(frame);
  if (!visible) return;
  const t = clock.getElapsedTime();
  mx += (tmx - mx) * .06; my += (tmy - my) * .06;
  const scroll = Math.min(1, scrollY / innerHeight);
  const baseX = lay.x, baseY = lay.y, s = lay.s;
  phone.scale.setScalar(s);
  phone.position.set(baseX + mx * .25, baseY + (still ? 0 : Math.sin(t * .8) * .06) + scroll * 1.2, 0);
  phone.rotation.set(.06 - my * .14 + scroll * .25, -.42 + mx * .45 + (still ? 0 : Math.sin(t * .35) * .05) - scroll * .5, .04);
  shadow.position.set(baseX + (.45 + mx * .1) * s, baseY - .55 * s + scroll * 1.2, -1.2);
  shadow.scale.setScalar(s);
  slabs.forEach((m, i) => {
    const u = m.userData;
    m.position.x = baseX + u.x * s - mx * (.3 + i * .15);
    m.scale.setScalar(s);
    m.position.y = u.y * s + baseY + (still ? 0 : Math.sin(t * .6 + i * 2) * .08) + scroll * (1.6 + i * .3);
    m.rotation.set(-my * .2 + (still ? 0 : Math.sin(t * .5 + i) * .04), mx * .3 + (still ? 0 : Math.cos(t * .4 + i) * .06), u.r);
  });
  key.position.set(-4 + mx * 6, 6 - my * 4, 7);
  // the screen changes every few seconds with a crossfade
  const now = performance.now();
  if (!still && now - lastSwap > 3800) {
    fade = Math.min(1, fade + .045);
    paintScreen(screens[cur], screens[(cur + 1) % screens.length], fade);
    scTex.needsUpdate = true;
    if (fade >= 1) { cur = (cur + 1) % screens.length; fade = 0; lastSwap = now; }
  }
  renderer.render(scene, camera);
}
frame();
window.__heroOk = true;
