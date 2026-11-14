import * as THREE from 'three';
import { FirstPersonControls } from '../runtime/first-person.js';
import { createDormScene } from './scenes/dorm.js';
import { createDiningScene } from './scenes/dining.js';

/**
 * Two-scene shell.
 *
 * A scene adapter is:
 *   { scene, interactiveMeshes, interactiveById, update(dt, elapsed),
 *     toggleInteractive(id), getInteractiveState(), setInteractive?(id, open) }
 * plus either cameraHome (look-only) or start + collision (walking).
 *
 * Replace the two scene imports with project modules; this shell handles
 * switching, routing, input, pointer lock, fullscreen, FPS and hover.
 */

const canvas = document.getElementById('stage');
const loader = document.getElementById('loader');
const sceneTitle = document.getElementById('sceneTitle');
const sceneEyebrow = document.getElementById('sceneEyebrow');
const dormControlsBar = document.getElementById('dormControls');
const diningControlsBar = document.getElementById('diningControls');
const fpsValue = document.getElementById('fpsValue');
const fpsDot = document.getElementById('fpsDot');
const qualityLabel = document.getElementById('qualityLabel');
const fullscreenButton = document.getElementById('fullscreenButton');
const sceneTabs = Array.from(document.querySelectorAll('.scene-tab'));
const crosshair = document.getElementById('crosshair');
const interactionBadge = document.getElementById('interactionBadge');
const interactionText = document.getElementById('interactionText');
const toast = document.getElementById('toast');
const lockHint = document.getElementById('lockHint');
const lockHintText = document.getElementById('lockHintText');

const params = new URLSearchParams(location.search);
const captureMode = params.has('capture');
if (params.get('hud') === '0') document.body.classList.add('hud-hidden');

const state = {
  active: 'dorm',
  ready: false,
  frozen: false,
  fullscreen: false,
  pointerLocked: false,
  pointerLockUnavailable: false,
  dragging: false,
  dragMoved: 0,
  dragStart: 0,
  pointerX: innerWidth / 2,
  pointerY: innerHeight / 2,
  hasPointerPosition: true,
  hovered: null,
  recenter: null,
};

let renderer;
let camera;
let dorm;
let dining;
let diningControls;
let dormHome;
let dormYaw = 0;
let dormPitch = 0;
let diningView = null;
let raycaster;
let toastTimer = 0;
let lastFrame = performance.now();
let elapsed = 0;
let fpsFrames = 0;
let fpsWindow = lastFrame;
let fps = 60;
let quality = 1;
let qualityCuts = 0;
let warmup = performance.now() + 3200;
let hoverDirty = true;
let lastPointer = { x: 0, y: 0 };

function activeScene() {
  return state.active === 'dining' ? dining : dorm;
}

function activeMeshes() {
  return activeScene().interactiveMeshes || [];
}

function activeItem(id) {
  const map = activeScene().interactiveById;
  return map instanceof Map ? map.get(id) : null;
}

function showToast(text, duration = 2000) {
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  if (duration > 0) toastTimer = setTimeout(() => toast.classList.remove('visible'), duration);
}

function markHoverDirty() {
  hoverDirty = true;
}

function updateProjection() {
  if (!camera || !renderer) return;
  const aspect = innerWidth / Math.max(1, innerHeight);
  const baseFov = state.active === 'dining' ? dining.start.fov || 68 : dormHome.fov || 70;
  camera.aspect = aspect;
  camera.fov = aspect < 0.85 ? 78 : baseFov;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(quality);
  renderer.setSize(innerWidth, innerHeight, false);
}

function applyDormCamera() {
  camera.position.copy(dormHome.position);
  camera.rotation.set(dormPitch, dormYaw, 0, 'YXZ');
}

function shortestAngle(delta) {
  const twoPi = Math.PI * 2;
  return ((delta + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
}

function updateUI() {
  const diningActive = state.active === 'dining';
  const adapter = activeScene();
  if (sceneTitle) sceneTitle.textContent = adapter.title || (diningActive ? '餐厅' : '宿舍');
  if (sceneEyebrow) sceneEyebrow.textContent = adapter.eyebrow || (diningActive ? 'ADV · DINING' : 'ADV · DORM');
  if (dormControlsBar) dormControlsBar.classList.toggle('is-hidden', diningActive);
  if (diningControlsBar) diningControlsBar.classList.toggle('is-hidden', !diningActive);
  sceneTabs.forEach((tab) => {
    const on = tab.dataset.scene === state.active;
    tab.classList.toggle('is-active', on);
    tab.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  document.title = adapter.title || (diningActive ? '餐厅' : '宿舍');
}

function setScene(name, { updateHash = true } = {}) {
  const next = name === 'dining' ? 'dining' : 'dorm';
  if (state.active === next && state.ready) return;

  if (state.active === 'dining' && diningControls) {
    diningView = diningControls.getView();
    diningControls.enabled = false;
    diningControls.keys.clear();
  }

  state.active = next;
  state.hovered = null;
  state.recenter = null;
  state.dragging = false;
  document.body.classList.remove('is-dragging');
  setFrozen(false);
  setPrompt(null);

  if (next === 'dining') {
    camera.near = 0.05;
    camera.far = 90;
    camera.fov = dining.start.fov || 68;
    camera.updateProjectionMatrix();
    diningControls.enabled = true;
    diningControls.keys.clear();
    diningControls.setView(diningView || dining.start);
  } else {
    camera.near = 0.035;
    camera.far = 45;
    camera.fov = dormHome.fov || 70;
    camera.updateProjectionMatrix();
    applyDormCamera();
  }

  updateProjection();
  updateUI();
  if (renderer) renderer.shadowMap.needsUpdate = true;
  try {
    renderer.compile(activeScene().scene, camera);
  } catch (error) {
    console.warn('Shader precompile skipped:', error);
  }
  markHoverDirty();

  if (updateHash) {
    try {
      const hash = next === 'dining' ? '#dining' : '#dorm';
      history.replaceState(null, '', `${location.pathname}${location.search}${hash}`);
    } catch {
      // Ignore exotic embeds.
    }
  }
}

function look(dx, dy, sensitivity) {
  if (state.frozen) return;
  state.recenter = null;
  if (state.active === 'dining') {
    diningControls.look(dx, dy, sensitivity);
  } else {
    dormYaw -= dx * sensitivity;
    dormPitch = Math.max(-1.49, Math.min(1.49, dormPitch - dy * sensitivity));
    applyDormCamera();
  }
  markHoverDirty();
}

function recenter() {
  if (state.active === 'dining') {
    if (diningControls.recenter()) showToast('视野回正', 700);
    markHoverDirty();
    return;
  }
  const deltaYaw = shortestAngle(dormHome.yaw - dormYaw);
  const deltaPitch = dormHome.pitch - dormPitch;
  if (Math.abs(deltaYaw) < 0.001 && Math.abs(deltaPitch) < 0.001) {
    dormYaw = dormHome.yaw;
    dormPitch = dormHome.pitch;
    applyDormCamera();
    return;
  }
  state.recenter = {
    elapsed: 0,
    duration: 0.6,
    startYaw: dormYaw,
    startPitch: dormPitch,
    deltaYaw,
    deltaPitch,
  };
}

function updateDormRecenter(dt) {
  const tween = state.recenter;
  if (!tween) return;
  tween.elapsed = Math.min(tween.duration, tween.elapsed + dt);
  const t = tween.elapsed / tween.duration;
  const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  dormYaw = tween.startYaw + tween.deltaYaw * eased;
  dormPitch = tween.startPitch + tween.deltaPitch * eased;
  applyDormCamera();
  markHoverDirty();
  if (t >= 1) state.recenter = null;
}

function setFrozen(value) {
  state.frozen = Boolean(value);
  if (diningControls) diningControls.setFrozen(state.frozen);
  document.body.classList.toggle('is-view-frozen', state.frozen);
  markHoverDirty();
}

function isVisible(object) {
  let node = object;
  while (node) {
    if (!node.visible) return false;
    node = node.parent;
  }
  return true;
}

function pickAt(x, y) {
  if (!camera || !raycaster) return null;
  camera.updateMatrixWorld(true);
  const ndcX = state.fullscreen ? 0 : (x / innerWidth) * 2 - 1;
  const ndcY = state.fullscreen ? 0 : -(y / innerHeight) * 2 + 1;
  raycaster.far = state.active === 'dining' ? 4.2 : 10;
  raycaster.setFromCamera({ x: ndcX, y: ndcY }, camera);
  const hits = raycaster.intersectObjects(activeMeshes(), false);
  for (const hit of hits) {
    if (!isVisible(hit.object)) continue;
    const item = activeItem(hit.object.userData.interactiveId);
    if (item) return item;
  }
  return null;
}

function setPrompt(item) {
  state.hovered = item;
  if (!interactionBadge || !interactionText) return;
  if (!item) {
    interactionBadge.classList.remove('visible');
    crosshair.classList.remove('has-target');
    return;
  }
  if (item.locked) {
    interactionText.textContent = `${item.label || '区域'} · 暂未开放`;
    crosshair.classList.remove('has-target');
  } else {
    interactionText.textContent = `${item.target > 0.5 ? '关闭' : '打开'}${item.label || ''}`;
    crosshair.classList.add('has-target');
  }
  interactionBadge.classList.add('visible');
}

function refreshHover() {
  hoverDirty = false;
  if (state.dragging) {
    setPrompt(null);
    return;
  }
  if (!state.fullscreen && !state.hasPointerPosition) {
    setPrompt(null);
    return;
  }
  setPrompt(pickAt(state.pointerX, state.pointerY));
}

function toggleHovered() {
  if (!state.hovered) return false;
  const item = state.hovered;
  const result = activeScene().toggleInteractive(item.id);
  if (result?.locked) showToast(`${result.label || '区域'} · 暂未开放`, 2200);
  else if (result) showToast(`${result.open ? '已打开' : '已关闭'}${result.label || ''}`, 1000);
  markHoverDirty();
  return true;
}

/* Fullscreen / pointer lock --------------------------------------- */

function syncLockHint() {
  if (!lockHint) return;
  const visible = state.fullscreen && !state.pointerLocked;
  lockHint.classList.toggle('visible', visible);
  lockHint.setAttribute('aria-hidden', visible ? 'false' : 'true');
  if (lockHintText) {
    lockHintText.textContent = state.pointerLockUnavailable
      ? '鼠标锁定不可用 · 按住左键拖动环顾'
      : '点击画面捕获鼠标 · 右键固定视野 · 中键回正';
  }
}

async function tryPointerLock() {
  if (!canvas) return false;
  if (document.pointerLockElement === canvas) return true;
  try {
    const result = canvas.requestPointerLock();
    if (result && typeof result.catch === 'function') await result.catch(() => {});
  } catch {
    // Fallback below.
  }
  state.pointerLocked = document.pointerLockElement === canvas;
  if (!state.pointerLocked) state.pointerLockUnavailable = true;
  syncLockHint();
  return state.pointerLocked;
}

async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    try {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      await tryPointerLock();
    } catch {
      showToast('浏览器未允许全屏，可尝试按 F11。', 2600);
    }
  } else {
    await document.exitFullscreen().catch(() => {});
  }
}

function onFullscreenChange() {
  state.fullscreen = Boolean(document.fullscreenElement);
  document.body.classList.toggle('is-fullscreen', state.fullscreen);
  if (fullscreenButton) fullscreenButton.setAttribute('aria-pressed', state.fullscreen ? 'true' : 'false');
  if (!state.fullscreen) {
    state.pointerLockUnavailable = false;
    if (document.pointerLockElement) document.exitPointerLock();
    setFrozen(false);
  } else {
    setFrozen(false);
    showToast('移动鼠标环顾 · 右键固定视线 · 中键回正 · E 互动', 4200);
  }
  syncLockHint();
  updateProjection();
}

function onPointerLockChange() {
  state.pointerLocked = document.pointerLockElement === canvas;
  state.hasPointerPosition = true;
  if (state.pointerLocked) {
    state.pointerLockUnavailable = false;
    state.pointerX = innerWidth / 2;
    state.pointerY = innerHeight / 2;
  }
  syncLockHint();
  markHoverDirty();
}

/* Input ----------------------------------------------------------- */

function onPointerDown(event) {
  if (!state.ready) return;
  if (event.button === 1) {
    event.preventDefault();
    recenter();
    return;
  }
  if (state.fullscreen) {
    if (event.button === 2) {
      event.preventDefault();
      setFrozen(!state.frozen);
      if (!state.pointerLocked) tryPointerLock();
      return;
    }
    if (event.button !== 0) return;
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    if (!state.pointerLocked && !state.pointerLockUnavailable) {
      tryPointerLock();
    } else {
      state.dragging = true;
      state.dragMoved = 0;
      state.dragStart = performance.now();
      lastPointer = { x: event.clientX, y: event.clientY };
      canvas.setPointerCapture?.(event.pointerId);
    }
    markHoverDirty();
    return;
  }

  if (event.button === 2) {
    event.preventDefault();
    setFrozen(!state.frozen);
    return;
  }
  if (event.button !== 0) return;
  event.preventDefault();
  state.dragging = true;
  state.dragMoved = 0;
  state.dragStart = performance.now();
  state.pointerX = event.clientX;
  state.pointerY = event.clientY;
  state.hasPointerPosition = true;
  lastPointer = { x: event.clientX, y: event.clientY };
  canvas.setPointerCapture?.(event.pointerId);
  document.body.classList.add('is-dragging');
  markHoverDirty();
}

function onPointerMove(event) {
  state.pointerX = event.clientX;
  state.pointerY = event.clientY;
  state.hasPointerPosition = true;

  if (state.fullscreen && state.pointerLocked) {
    if (!state.frozen) look(event.movementX || 0, event.movementY || 0, 0.00215);
    return;
  }

  if (state.dragging) {
    const dx = event.movementX || event.clientX - lastPointer.x;
    const dy = event.movementY || event.clientY - lastPointer.y;
    lastPointer = { x: event.clientX, y: event.clientY };
    state.dragMoved += Math.abs(dx) + Math.abs(dy);
    if (state.dragMoved > 3) look(dx, dy, state.active === 'dorm' ? 0.0031 : 0.0028);
  }
  markHoverDirty();
}

function endDrag(event) {
  if (!state.dragging) return;
  const moved = state.dragMoved;
  const duration = performance.now() - state.dragStart;
  state.dragging = false;
  document.body.classList.remove('is-dragging');
  if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId);

  if (!state.fullscreen && moved < 5 && duration < 700) {
    const item = pickAt(event.clientX, event.clientY);
    if (item) {
      state.hovered = item;
      toggleHovered();
    }
  }
  markHoverDirty();
}

function onKeyDown(event) {
  if (!state.ready) return;
  if (event.code === 'KeyE' && !event.repeat) {
    if (toggleHovered()) event.preventDefault();
    return;
  }
  if (event.key === 'F11' && !event.repeat) {
    const wasFullscreen = Boolean(document.fullscreenElement);
    setTimeout(() => {
      if (Boolean(document.fullscreenElement) === wasFullscreen) toggleFullscreen();
    }, 120);
  }
}

/* FPS ------------------------------------------------------------- */

function updateFps(now) {
  fpsFrames += 1;
  const span = now - fpsWindow;
  if (span < 500) return;
  const measured = (fpsFrames * 1000) / span;
  fps = fps * 0.55 + measured * 0.45;
  const display = Math.max(0, Math.min(999, Math.round(fps)));
  if (fpsValue) fpsValue.textContent = String(display);
  if (fpsDot) {
    fpsDot.classList.toggle('warn', display < 52 && display >= 30);
    fpsDot.classList.toggle('bad', display < 30);
  }
  if (!captureMode && now > warmup && fps < 44 && qualityCuts < 4) {
    quality = Math.max(0.7, quality - 0.14);
    qualityCuts += 1;
    warmup = now + 3000;
    if (qualityLabel) qualityLabel.textContent = '自适应';
    updateProjection();
  }
  fpsFrames = 0;
  fpsWindow = now;
}

/* Loop ------------------------------------------------------------ */

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  elapsed += dt;

  if (state.active === 'dining') {
    diningControls.update(dt);
    dining.update(dt, elapsed);
    if (diningControls.getSpeed() > 0.02) markHoverDirty();
  } else {
    updateDormRecenter(dt);
    dorm.update(dt, elapsed);
  }

  if (state.fullscreen) markHoverDirty();
  if (hoverDirty) refreshHover();
  renderer.render(activeScene().scene, camera);
  updateFps(now);
}

/* API / boot ------------------------------------------------------ */

function getView() {
  if (state.active === 'dining') return diningControls.getView();
  return { x: dormHome.position.x, z: dormHome.position.z, y: dormHome.position.y, yaw: dormYaw, pitch: dormPitch };
}

function setView(view = {}) {
  if (state.active === 'dining') {
    diningControls.setView({
      x: typeof view.x === 'number' ? view.x : diningControls.position.x,
      z: typeof view.z === 'number' ? view.z : diningControls.position.z,
      yaw: typeof view.yaw === 'number' ? view.yaw : diningControls.yaw,
      pitch: typeof view.pitch === 'number' ? view.pitch : diningControls.pitch,
    });
  } else {
    if (typeof view.yaw === 'number') dormYaw = view.yaw;
    if (typeof view.pitch === 'number') dormPitch = Math.max(-1.49, Math.min(1.49, view.pitch));
    state.recenter = null;
    applyDormCamera();
  }
  markHoverDirty();
  return getView();
}

function resetView() {
  if (state.active === 'dining') diningControls.setView(dining.start);
  else {
    dormYaw = dormHome.yaw;
    dormPitch = dormHome.pitch;
    applyDormCamera();
  }
  markHoverDirty();
  return getView();
}

function getInteractives() {
  const adapter = activeScene();
  return adapter.getInteractiveState ? adapter.getInteractiveState() : [];
}

function getStats() {
  return {
    scene: state.active,
    fps,
    quality,
    calls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    textures: renderer.info.memory.textures,
    geometries: renderer.info.memory.geometries,
  };
}

function attachEvents() {
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', updateProjection);
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('pointerlockchange', onPointerLockChange);
  document.addEventListener('contextmenu', (event) => {
    if (event.target === canvas || state.fullscreen) event.preventDefault();
  });
  document.addEventListener('mousedown', (event) => {
    if (event.button === 1) event.preventDefault();
  });
  if (fullscreenButton) fullscreenButton.addEventListener('click', toggleFullscreen);
  sceneTabs.forEach((tab) => {
    tab.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      setScene(tab.dataset.scene);
    });
  });
  window.addEventListener('hashchange', () => {
    const requested = location.hash.replace('#', '');
    if (requested === 'dining' || requested === 'dorm') setScene(requested);
  });
}

async function boot() {
  if (location.protocol === 'file:') return;
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
    stencil: false,
    preserveDrawingBuffer: captureMode,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  quality = captureMode ? Math.min(1.25, devicePixelRatio || 1) : Math.min(1.5, Math.max(1, devicePixelRatio || 1));
  renderer.setPixelRatio(quality);
  renderer.setSize(innerWidth, innerHeight, false);

  camera = new THREE.PerspectiveCamera(70, innerWidth / Math.max(1, innerHeight), 0.035, 45);
  camera.rotation.order = 'YXZ';

  dorm = createDormScene({ renderer });
  dining = createDiningScene({ renderer });

  dormHome = {
    position: dorm.cameraHome.position.clone(),
    yaw: dorm.cameraHome.yaw,
    pitch: dorm.cameraHome.pitch,
    fov: dorm.cameraHome.fov,
  };
  dormYaw = dormHome.yaw;
  dormPitch = dormHome.pitch;

  diningControls = new FirstPersonControls(camera, dining.collision, {
    start: dining.start,
    eyeHeight: dining.eyeHeight ?? 1.8,
    radius: dining.playerRadius ?? 0.3,
  });
  diningControls.attach(window);
  diningControls.enabled = false;

  raycaster = new THREE.Raycaster();
  raycaster.near = 0.02;

  const requested = params.get('scene') || location.hash.replace('#', '');
  state.active = requested === 'dining' ? 'dining' : 'dorm';
  setScene(state.active, { updateHash: false });
  state.ready = true;

  if (captureMode) {
    if (state.active === 'dining') {
      const number = (name, fallback) => {
        const raw = params.get(name);
        const value = raw === null ? fallback : Number(raw);
        return Number.isFinite(value) ? value : fallback;
      };
      setView({
        x: number('x', dining.start.x),
        z: number('z', dining.start.z),
        yaw: (number('yaw', (dining.start.yaw * 180) / Math.PI) * Math.PI) / 180,
        pitch: (number('pitch', (dining.start.pitch * 180) / Math.PI) * Math.PI) / 180,
      });
    }
    const open = params.get('open');
    if (open) {
      open.split(',').forEach((id) => {
        const adapter = activeScene();
        if (adapter.setInteractive) adapter.setInteractive(id.trim(), true);
        else adapter.toggleInteractive(id.trim());
      });
    }
  }

  updateProjection();
  attachEvents();
  updateUI();
  canvas.focus({ preventScroll: true });
  dorm.scene.updateMatrixWorld(true);
  dining.scene.updateMatrixWorld(true);
  try {
    renderer.compile(activeScene().scene, camera);
  } catch (error) {
    console.warn('Shader precompile skipped:', error);
  }
  renderer.render(activeScene().scene, camera);
  state.ready = true;
  lastFrame = performance.now();
  fpsWindow = lastFrame;
  warmup = lastFrame + 3200;
  loader?.classList.add('is-hidden');
  setTimeout(() => loader?.setAttribute('aria-hidden', 'true'), 800);

  window.__PREVIEW__ = {
    camera,
    renderer,
    dorm,
    dining,
    getScene: () => state.active,
    setScene,
    getView,
    setView,
    resetView,
    toggle: (id) => activeScene().toggleInteractive(id),
    setFrozen,
    getInteractives,
    getStats,
  };
  window.__PREVIEW_READY__ = true;
  requestAnimationFrame(animate);
}

boot();
