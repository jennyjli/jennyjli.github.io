// Self-contained strange-attractor particle scenes for the projects page.
// three.js is loaded from a CDN via the import map in projects.html.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function glowTexture() {
  const size = 64, c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d'), h = size / 2;
  const g = ctx.createRadialGradient(h, h, 0, h, h, h);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.3)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

function lorenz(count, radius) {
  const pos = new Float32Array(count * 3);
  const sigma = 10, rho = 28, beta = 8 / 3, dt = 0.005;
  let x = 0.1, y = 0, z = 0;
  for (let k = 0; k < 1500; k++) {
    const dx = sigma * (y - x), dy = x * (rho - z) - y, dz = x * y - beta * z;
    x += dx * dt; y += dy * dt; z += dz * dt;
  }
  const s = radius / 26;
  for (let i = 0; i < count; i++) {
    const dx = sigma * (y - x), dy = x * (rho - z) - y, dz = x * y - beta * z;
    x += dx * dt; y += dy * dt; z += dz * dt;
    const j = (Math.random() - 0.5) * radius * 0.006;
    pos[i * 3] = x * s + j; pos[i * 3 + 1] = (z - 25) * s + j; pos[i * 3 + 2] = y * s + j;
  }
  return pos;
}

function aizawa(count, radius) {
  const pos = new Float32Array(count * 3);
  const a = 0.95, b = 0.7, c = 0.6, d = 3.5, e = 0.25, f = 0.1, dt = 0.01;
  let x = 0.1, y = 0, z = 0;
  const step = () => {
    const dx = (z - b) * x - d * y;
    const dy = d * x + (z - b) * y;
    const dz = c + a * z - (z * z * z) / 3 - (x * x + y * y) * (1 + e * z) + f * z * x * x * x;
    x += dx * dt; y += dy * dt; z += dz * dt;
  };
  for (let k = 0; k < 2000; k++) step();
  const s = radius / 1.6;
  for (let i = 0; i < count; i++) {
    step();
    pos[i * 3] = x * s; pos[i * 3 + 1] = (z - 0.9) * s; pos[i * 3 + 2] = y * s;
  }
  return pos;
}

function initAttractor(id, kind, colorHex, camPos) {
  const el = document.getElementById(id);
  if (!el) return;
  let w = el.clientWidth, h = el.clientHeight || 360;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#05060a');
  const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 5000);
  camera.position.set(camPos[0], camPos[1], camPos[2]);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  el.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.7;

  const count = 60000;
  const pos = kind === 'lorenz' ? lorenz(count, 150) : aizawa(count, 150);
  const colors = new Float32Array(count * 3);
  const base = new THREE.Color(colorHex), g = new THREE.Color();
  for (let i = 0; i < count; i++) {
    g.copy(base).offsetHSL(0.6 * (i / count) - 0.3, 0, 0);
    colors[i * 3] = g.r; colors[i * 3 + 1] = g.g; colors[i * 3 + 2] = g.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    map: glowTexture(), size: 2.1, sizeAttenuation: true, vertexColors: true,
    blending: THREE.AdditiveBlending, transparent: true, opacity: 0.9, depthWrite: false,
  });
  scene.add(new THREE.Points(geo, mat));

  (function animate() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  })();

  window.addEventListener('resize', () => {
    w = el.clientWidth; h = el.clientHeight || 360;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
}

initAttractor('lattice-lorenz', 'lorenz', '#22d3ee', [70, 30, 470]);
initAttractor('lattice-aizawa', 'aizawa', '#a78bfa', [0, 40, 430]);
