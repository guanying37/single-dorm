import * as THREE from 'three';
import { InfirmaryScene } from './scene.js';
import { InfirmaryControls } from './player.js';
import { START } from './config.js';

/* Standalone preview for the infirmary. The combined hub page is the
 * primary entry point; this page keeps a self-contained viewer so the
 * room can be opened and captured on its own. */

const params = new URLSearchParams(window.location.search);
const captureMode = params.has('capture');
if (params.get('hud') === '0') document.body.classList.add('hud-hidden');

const canvas = document.getElementById('stage');
const loader = document.getElementById('loader');
const fpsValue = document.getElementById('fpsValue');
const fpsDot = document.getElementById('fpsDot');
const qualityLabel = document.getElementById('qualityLabel');
const interactionBadge = document.getElementById('interactionBadge');
const interactionText = document.getElementById('interactionText');
const toast = document.getElementById('toast');
const crosshair = document.getElementById('crosshair');
const fullscreenButton = document.getElementById('fullscreenButton');
const lockHintText = document.getElementById('lockHintText');

if (lockHintText) lockHintText.textContent = '按住左键拖动环顾 · 右键固定视野 · 中键回正';

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: captureMode,
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.96;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.setPixelRatio(Math.min(1.25, window.devicePixelRatio || 1));
renderer.setSize(window.innerWidth, window.innerHeight, false);

const camera = new THREE.PerspectiveCamera(START.fov, window.innerWidth / Math.max(1, window.innerHeight), 0.03, 30);
camera.rotation.order = 'YXZ';

const infirmary = new InfirmaryScene({
  renderer,
  maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
});
const controls = new InfirmaryControls(camera, infirmary.collision);
controls.attach(window);
renderer.shadowMap.needsUpdate = true;

const raycaster = new THREE.Raycaster();
raycaster.near = 0.02;
raycaster.far = 4.0;

let hovered = null;
let dragging = false;
let dragMoved = 0;
let lastX = 0;
let lastY = 0;
let pointerX = window.innerWidth / 2;
let pointerY = window.innerHeight / 2;
let toastTimer = 0;
let fpsFrames = 0;
let fpsStart = performance.now();
let smoothFps = 60;
let frozen = false;

function showToast(message, duration = 1600) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('visible'), duration);
}

function isVisible(object) {
  let pointer = object;
  while (pointer) {
    if (!pointer.visible) return false;
    pointer = pointer.parent;
  }
  return true;
}

function pick(clientX, clientY) {
  const ndcX = (clientX / window.innerWidth) * 2 - 1;
  const ndcY = -(clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera({ x: ndcX, y: ndcY }, camera);
  const hits = raycaster.intersectObjects(infirmary.getInteractableMeshes(), false);
  for (const hit of hits) {
    if (!isVisible(hit.object)) continue;
    if (hit.distance > 3.9) continue;
    const item = infirmary.interactiveById.get(hit.object.userData.interactiveId);
    if (item) return item;
  }
  return null;
}

function setHovered(item) {
  hovered = item;
  if (!interactionBadge || !interactionText) return;
  if (item) {
    if (item.locked) {
      interactionText.textContent = `${item.label} · 暂未开放（预留走廊切换）`;
      crosshair.classList.remove('has-target');
    } else {
      const verb = item.target > 0.5 ? '关闭' : '打开';
      interactionText.textContent = `${verb}${item.label}`;
      crosshair.classList.add('has-target');
    }
    interactionBadge.classList.add('visible');
  } else {
    interactionBadge.classList.remove('visible');
    crosshair.classList.remove('has-target');
  }
}

function refreshHover() {
  if (dragging) {
    setHovered(null);
    return;
  }
  setHovered(pick(pointerX, pointerY));
}

function toggleHovered() {
  if (!hovered) return false;
  const result = infirmary.toggleInteractive(hovered.id);
  if (!result) return false;
  if (result.locked) showToast(`${result.label} · 暂未开放（预留走廊切换）`, 2200);
  else showToast(`${result.open ? '已打开' : '已关闭'}${result.label}`, 1000);
  refreshHover();
  return true;
}

function setFrozen(value) {
  frozen = Boolean(value);
  controls.setFrozen(frozen);
  document.body.classList.toggle('is-view-frozen', frozen);
  if (value) showToast('视线已固定', 900);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspect = width / Math.max(1, height);
  camera.aspect = aspect;
  camera.fov = aspect < 0.85 ? 78 : START.fov;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(1.25, window.devicePixelRatio || 1));
  renderer.setSize(width, height, false);
}

canvas.addEventListener('pointerdown', (event) => {
  if (event.button === 1) {
    event.preventDefault();
    if (controls.recenter()) showToast('视野回正', 700);
    return;
  }
  if (event.button === 2) {
    event.preventDefault();
    setFrozen(!frozen);
    return;
  }
  if (event.button !== 0) return;
  dragging = true;
  dragMoved = 0;
  lastX = event.clientX;
  lastY = event.clientY;
  pointerX = event.clientX;
  pointerY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
  document.body.classList.add('is-dragging');
});

window.addEventListener('pointermove', (event) => {
  pointerX = event.clientX;
  pointerY = event.clientY;
  if (!dragging) {
    refreshHover();
    return;
  }
  const dx = event.movementX || event.clientX - lastX;
  const dy = event.movementY || event.clientY - lastY;
  lastX = event.clientX;
  lastY = event.clientY;
  dragMoved += Math.abs(dx) + Math.abs(dy);
  if (dragMoved > 3) controls.look(dx, dy, 0.0028);
  setHovered(null);
});

window.addEventListener('pointerup', (event) => {
  if (!dragging) return;
  dragging = false;
  document.body.classList.remove('is-dragging');
  try {
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  } catch {
    // Ignore.
  }
  if (dragMoved < 5) {
    const item = pick(event.clientX, event.clientY);
    if (item) {
      hovered = item;
      toggleHovered();
    }
  }
  refreshHover();
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyE' && !event.repeat) {
    if (toggleHovered()) event.preventDefault();
  }
  if (event.key === 'F11') {
    event.preventDefault();
    if (!document.fullscreenElement) document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
    else document.exitFullscreen().catch(() => {});
  }
});

document.addEventListener('contextmenu', (event) => {
  if (event.target === canvas || document.fullscreenElement) event.preventDefault();
});

document.addEventListener('mousedown', (event) => {
  if (event.button === 1) event.preventDefault();
});
document.addEventListener('auxclick', (event) => {
  if (event.button === 1) event.preventDefault();
});

if (fullscreenButton) {
  fullscreenButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!document.fullscreenElement) document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => showToast('浏览器未允许全屏', 1600));
    else document.exitFullscreen().catch(() => {});
  });
}

window.addEventListener('resize', resize);
resize();

let lastFrame = performance.now();
let elapsed = 0;

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  elapsed += dt;
  controls.update(dt);
  infirmary.update(dt, elapsed);
  renderer.render(infirmary.scene, camera);

  if (!dragging && (controls.getSpeed() > 0.02 || elapsed % 0.1 < dt)) refreshHover();
  fpsFrames += 1;
  if (now - fpsStart >= 500) {
    smoothFps = smoothFps * 0.5 + ((fpsFrames * 1000) / (now - fpsStart)) * 0.5;
    fpsFrames = 0;
    fpsStart = now;
    if (fpsValue) fpsValue.textContent = String(Math.round(smoothFps));
    if (fpsDot) fpsDot.classList.toggle('warn', smoothFps < 52 && smoothFps >= 30);
    if (fpsDot) fpsDot.classList.toggle('bad', smoothFps < 30);
  }
}

function getStats() {
  return {
    scene: 'infirmary',
    fps: smoothFps,
    quality: qualityLabel?.textContent ?? '实时',
    renderer: {
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
    },
    memory: renderer.info.memory,
    infirmary: infirmary.getStats(),
    view: controls.getView(),
  };
}

window.__PREVIEW__ = {
  scene: infirmary.scene,
  camera,
  renderer,
  infirmary,
  controls,
  getScene: () => 'infirmary',
  setView: (view = {}) => {
    controls.setView({
      x: typeof view.x === 'number' ? view.x : controls.getView().x,
      z: typeof view.z === 'number' ? view.z : controls.getView().z,
      yaw: typeof view.yaw === 'number' ? view.yaw : controls.getView().yaw,
      pitch: typeof view.pitch === 'number' ? view.pitch : controls.getView().pitch,
    });
    refreshHover();
    return controls.getView();
  },
  getView: () => controls.getView(),
  resetView: () => {
    controls.setView(START);
    refreshHover();
    return controls.getView();
  },
  toggle: (id) => infirmary.toggleInteractive(id),
  setInteractive: (id, value = true) => infirmary.setInteractive(id, value),
  getInteractives: () => infirmary.getInteractiveState(),
  getStats,
  setFrozen,
};

requestAnimationFrame(animate);
renderer.render(infirmary.scene, camera);
loader.classList.add('is-hidden');
window.setTimeout(() => loader.setAttribute('aria-hidden', 'true'), 800);
controls.setView(START);
window.__PREVIEW_READY__ = true;
