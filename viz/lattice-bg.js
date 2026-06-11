// Rotating 3D "lattice" used as the Projects-page background — a glowing grid
// of nodes + edges, clearly tumbling in 3D (on-theme: the project is "Lattice").
// three.js is loaded from a CDN via the import map in projects.html.
import * as THREE from 'three';

function glowTexture() {
  const size = 64, c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d'), h = size / 2;
  const g = ctx.createRadialGradient(h, h, 0, h, h, h);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.7, 'rgba(255,255,255,0.25)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

const host = document.getElementById('lattice-bg');
if (host) {
  let w = window.innerWidth, h = window.innerHeight;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 6000);
  camera.position.set(0, 0, 840);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  host.appendChild(renderer.domElement);

  // Build an n×n×n grid of nodes.
  const n = 8, spacing = 80, half = ((n - 1) * spacing) / 2;
  const nodes = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      for (let k = 0; k < n; k++)
        nodes.push([i * spacing - half, j * spacing - half, k * spacing - half]);

  const idx = (i, j, k) => (i * n + j) * n + k;

  // Nodes — glowing points.
  const npos = new Float32Array(nodes.length * 3);
  nodes.forEach((p, i) => { npos[i * 3] = p[0]; npos[i * 3 + 1] = p[1]; npos[i * 3 + 2] = p[2]; });
  const ngeo = new THREE.BufferGeometry();
  ngeo.setAttribute('position', new THREE.BufferAttribute(npos, 3));
  const nmat = new THREE.PointsMaterial({
    map: glowTexture(), color: '#9ad8ff', size: 9, sizeAttenuation: true,
    blending: THREE.AdditiveBlending, transparent: true, opacity: 0.8, depthWrite: false,
  });

  // Edges — faint lines to neighbours (these make the rotation obvious).
  const segs = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      for (let k = 0; k < n; k++) {
        const a = nodes[idx(i, j, k)];
        if (i < n - 1) segs.push(...a, ...nodes[idx(i + 1, j, k)]);
        if (j < n - 1) segs.push(...a, ...nodes[idx(i, j + 1, k)]);
        if (k < n - 1) segs.push(...a, ...nodes[idx(i, j, k + 1)]);
      }
  const lgeo = new THREE.BufferGeometry();
  lgeo.setAttribute('position', new THREE.Float32BufferAttribute(segs, 3));
  const lmat = new THREE.LineBasicMaterial({
    color: '#38bdf8', transparent: true, opacity: 0.14,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });

  const group = new THREE.Group();
  group.add(new THREE.Points(ngeo, nmat));
  group.add(new THREE.LineSegments(lgeo, lmat));
  group.rotation.set(0.5, 0.4, 0);
  scene.add(group);

  (function animate() {
    group.rotation.y += 0.0016;   // obvious, steady spin
    group.rotation.x += 0.0005;
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
