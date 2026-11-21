import * as THREE from 'three';
import { GarbageScene } from './scene.js';
import { GarbageControls } from './player.js';
import { START, SWITCH } from './config.js';

/* ------------------------------------------------------------------ *
 * Standalone garbage-room preview.
 *
 * A self-contained page for screenshots and QA: renderer, first-person
 * controls, pointer lock, hover prompt, E to interact, FPS readout. The
 * combined hub page uses the same scene and control classes.
 * ------------------------------------------------------------------ */

const params = new URLSearchParams(window.location.search);
const captureMode = params.has('capture');
const hideHud = params.get('hud') === '0';
const canvas = document.getElementById('stage');
const hud = document.getElementById('hud');
const fpsValue = document.getElementById('fps');
const prompt = document.getElementById('prompt');
const promptText = document.getElementById('promptText');
const toast = document.getElementById('toast');
const loader = document.getElementById('loader');
if (hideHud) hud.classList.add('is-hidden');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
  stencil: false,
  preserveDrawingBuffer: captureMode,
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.96;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.setPixelRatio(captureMode ? Math.min(1.25, window.devicePixelRatio || 1) : Math.min(1.5, Math.max(1, window.devicePixelRatio || 1)));
renderer.setSize(window.innerWidth, window.innerHeight, false);

const camera = new THREE.PerspectiveCamera(START.fov, window.innerWidth / Math.max(1, window.innerHeight), 0.03, 20);
camera.rotation.order = 'YXZ';

const scene = new GarbageScene({ renderer, maxAnisotropy: renderer.capabilities.getMaxAnisotropy() });
const controls = new GarbageControls(camera, scene.collision);
controls.attach(window);
controls.setView({ x: START.x, z: START.z, yaw: START.yaw, pitch: START.pitch });
scene.scene.updateMatrixWorld(true);
renderer.shadowMap.needsUpdate = true;

const raycaster = new THREE.Raycaster();
raycaster.near = 0.02;
raycaster.far = 3.8;
const center = new THREE.Vector2(0, 0);
let hovered = null;
let pointerLocked = false;
let frozen = false;
let dragging = false;
let dragX = 0;
let dragY = 0;
let toastTimer = 0;
let lastFrame = performance.now();
let elapsed = 0;
let fpsFrames = 0;
let fpsStart = performance.now();
let smoothFps = 60;
let hoverDirty = true;

function showToast(text, duration = 1800) {
  toast.textContent = text;
  toast.classList.add('visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('visible'), duration);
}

function setPrompt(item) {
  hovered = item;
  if (!item) {
    prompt.classList.remove('visible');
    return;
  }
  let label;
  if (item.locked) label = `${item.label} · 暂未开放（预留走廊切换）`;
  else label = `${item.open ? '关闭' : '打开'}${item.label}`;
  promptText.textContent = label;
  prompt.classList.add('visible');
}

function pick() {
  raycaster.setFromCamera(center, camera);
  const hits = raycaster.intersectObjects(scene.getInteractableMeshes(), false);
  if (!hits.length) return null;
  return scene.interactiveById.get(hits[0].object.userData.interactiveId) ?? null;
}

function interact() {
  if (!hovered) return;
  const result = scene.toggleInteractive(hovered.id);
  if (!result) return;
  if (result.locked) {
    showToast(`${result.label} · 暂未开放（预留走廊切换）`, 2200);
  } else {
    showToast(`${result.open ? '已打开' : '已关闭'}${result.label}`, 1100);
  }
  hoverDirty = true;
}

canvas.addEventListener('click', () => {
  if (!pointerLocked) {
    canvas.requestPointerLock?.();
    return;
  }
  interact();
});

document.addEventListener('pointerlockchange', () => {
  pointerLocked = document.pointerLockElement === canvas;
});

window.addEventListener('mousemove', (event) => {
  if (pointerLocked && !frozen) {
    controls.look(event.movementX, event.movementY);
    hoverDirty = true;
    return;
  }
  if (dragging) {
    controls.look(event.clientX - dragX, event.clientY - dragY);
    dragX = event.clientX;
    dragY = event.clientY;
    hoverDirty = true;
  }
});

canvas.addEventListener('pointerdown', (event) => {
  if (event.button === 0 && !pointerLocked) {
    dragging = true;
    dragX = event.clientX;
    dragY = event.clientY;
  }
});
window.addEventListener('pointerup', () => {
  dragging = false;
});
window.addEventListener('contextmenu', (event) => event.preventDefault());
window.addEventListener('mousedown', (event) => {
  if (event.button === 1) {
    event.preventDefault();
    controls.recenter();
  }
  if (event.button === 2) {
    frozen = !frozen;
    controls.setFrozen(frozen);
    showToast(frozen ? '视线已固定 · 右键解锁' : '视线已解锁', 1000);
  }
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyE') {
    event.preventDefault();
    interact();
  }
  if (event.code === 'Escape' && document.pointerLockElement) document.exitPointerLock();
});

window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = Math.max(1, window.innerHeight);
  const aspect = width / height;
  camera.aspect = aspect;
  camera.fov = aspect < 0.85 ? 78 : START.fov;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(captureMode ? Math.min(1.25, window.devicePixelRatio || 1) : Math.min(1.5, Math.max(1, window.devicePixelRatio || 1)));
  renderer.setSize(width, height, false);
});

function applyCaptureView() {
  if (!captureMode) return;
  const number = (name, fallback) => {
    const raw = params.get(name);
    if (raw === null) return fallback;
    const value = Number(raw);
    return Number.isFinite(value) ? value : fallback;
  };
  const toRad = (degrees) => (degrees * Math.PI) / 180;
  controls.setView({
    x: number('x', START.x),
    z: number('z', START.z),
    yaw: toRad(number('yaw', (START.yaw * 180) / Math.PI)),
    pitch: toRad(number('pitch', (START.pitch * 180) / Math.PI)),
  });
  const open = params.get('open');
  if (open) {
    for (const id of open.split(',')) scene.setInteractive(id.trim(), true);
  }
  if (params.get('light') === 'off') {
    scene.setInteractive(SWITCH.id, false);
    scene.lightLevel = 0;
  }
  if (params.get('lid') === 'open') scene.setInteractive('bin.b', true);
  if (params.get('lid') === 'closed') scene.setInteractive('bin.b', false);
  scene.update(0.016, performance.now() / 1000);
}

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  elapsed += dt;

  controls.update(dt);
  scene.update(dt, elapsed);
  if (controls.getSpeed() > 0.02) hoverDirty = true;
  if (hoverDirty) {
    hoverDirty = false;
    setPrompt(pick());
  }

  renderer.render(scene.scene, camera);

  fpsFrames += 1;
  const span = now - fpsStart;
  if (span >= 500) {
    smoothFps = (fpsFrames * 1000) / span;
    if (fpsValue) fpsValue.textContent = String(Math.round(smoothFps));
    fpsFrames = 0;
    fpsStart = now;
  }
}

applyCaptureView();
if (!hideHud) fpsValue.textContent = '--';
loader.classList.add('is-hidden');
renderer.render(scene.scene, camera);
requestAnimationFrame(animate);

window.__GARBAGE_PREVIEW__ = {
  scene,
  camera,
  renderer,
  controls,
  setView: (view) => controls.setView(view),
  getView: () => controls.getView(),
  toggle: (id) => scene.toggleInteractive(id),
  setInteractive: (id, value) => scene.setInteractive(id, value),
  getStats: () => ({
    ...scene.getStats(),
    render: { ...renderer.info.render },
    memory: { ...renderer.info.memory },
    fps: Number(smoothFps.toFixed(1)),
    blind: scene.probeBlindSpot(),
  }),
  raycast: (ndcX, ndcY) => {
    const caster = new THREE.Raycaster();
    caster.setFromCamera({ x: ndcX, y: ndcY }, camera);
    return caster
      .intersectObjects(scene.scene.children, true)
      .filter((hit) => !hit.object.isPoints && !hit.object.isSprite)
      .slice(0, 8)
      .map((hit) => ({
      name: hit.object.name,
      material: hit.object.material?.name ?? null,
      distance: Number(hit.distance.toFixed(2)),
      point: { x: Number(hit.point.x.toFixed(2)), y: Number(hit.point.y.toFixed(2)), z: Number(hit.point.z.toFixed(2)) },
    }));
  },
  ready: true,
};
window.__GARBAGE_READY__ = true;
