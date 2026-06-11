// Slowly-rotating galaxy used as the home-page background.
// three.js is loaded from a CDN via the import map in index.html.
import * as THREE from 'three';

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

// ── Point-cloud forms (face-on spiral arms, bulge, halo) ──
function spiral(count, radius) {
  const pos = new Float32Array(count * 3);
  const arms = 2, twist = 6.0, bulge = Math.floor(count * 0.16);
  for (let i = 0; i < count; i++) {
    if (i < bulge) {
      const t = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      const cr = radius * 0.16 * Math.cbrt(Math.random());
      pos[i * 3] = cr * Math.sin(ph) * Math.cos(t);
      pos[i * 3 + 1] = cr * Math.sin(ph) * Math.sin(t);
      pos[i * 3 + 2] = cr * Math.cos(ph) * 0.7;
    } else {
      const rr = Math.pow(Math.random(), 0.6), r = radius * rr;
      const armAngle = (i % arms) * (Math.PI * 2 / arms);
      const scatter = (Math.random() - 0.5) * (0.6 - 0.4 * rr);
      const th = armAngle + rr * twist + scatter;
      pos[i * 3] = r * Math.cos(th);
      pos[i * 3 + 1] = r * Math.sin(th);
      pos[i * 3 + 2] = (Math.random() - 0.5) * radius * 0.05 * (1 - rr * 0.5);
    }
  }
  return pos;
}
function sphere(count, radius) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    const cr = radius * Math.cbrt(Math.random());
    pos[i * 3] = cr * Math.sin(ph) * Math.cos(t);
    pos[i * 3 + 1] = cr * Math.sin(ph) * Math.sin(t);
    pos[i * 3 + 2] = cr * Math.cos(ph);
  }
  return pos;
}
function starfield(count, spread) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spread;
    pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
    pos[i * 3 + 2] = (Math.random() - 0.5) * spread - spread * 0.2;
  }
  return pos;
}

function points(pos, colorHex, size, opacity, tex) {
  const n = pos.length / 3;
  const colors = new Float32Array(n * 3);
  const base = new THREE.Color(colorHex), c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    c.copy(base).offsetHSL(0, 0, (Math.random() - 0.5) * 0.12);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    map: tex, size, sizeAttenuation: true, vertexColors: true,
    blending: THREE.AdditiveBlending, transparent: true, opacity, depthWrite: false,
  });
  return new THREE.Points(geo, mat);
}

const host = document.getElementById('galaxy-bg');
if (host) {
  let w = window.innerWidth, h = window.innerHeight;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 6000);
  camera.position.set(0, 70, 560);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  host.appendChild(renderer.domElement);

  const tex = glowTexture();

  // Distant starfield (barely moves) for depth.
  const stars = points(starfield(2500, 2600), '#9fb6e8', 1.6, 0.5, tex);
  scene.add(stars);

  // The galaxy itself, tilted for a 3/4 view and slowly rotating.
  const galaxy = new THREE.Group();
  galaxy.add(points(spiral(42000, 230), '#8ea2ff', 2.2, 0.85, tex));   // arms
  galaxy.add(points(sphere(9000, 34), '#ffe7ad', 2.6, 0.95, tex));     // warm core
  galaxy.add(points(sphere(8000, 250), '#6a5cff', 2.0, 0.32, tex));    // halo
  galaxy.rotation.x = -0.62;
  galaxy.position.set(40, -10, 0);
  scene.add(galaxy);

  (function animate() {
    galaxy.rotation.y += 0.0006;
    stars.rotation.y += 0.00012;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  })();

  window.addEventListener('resize', () => {
    w = window.innerWidth; h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
}
