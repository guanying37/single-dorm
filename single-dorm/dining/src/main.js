import * as THREE from 'three';
import { START, INTERACTION } from './config.js';
import { DiningHallScene } from './scene.js';
import { FirstPersonControls } from './player.js';

/* ------------------------------------------------------------------ *
 * Page controller for the dining-hall preview.
 *
 * Renderer, first-person input, fullscreen / pointer lock, hover and
 * interaction prompts, FPS readout and the small embed API.
 * ------------------------------------------------------------------ */

const canvas = document.getElementById('stage');
const loader = document.getElementById('loader');
const fullscreenButton = document.getElementById('fullscreenButton');
const fpsValue = document.getElementById('fpsValue');
const fpsDot = document.getElementById('fpsDot');
const qualityLabel = document.getElementById('qualityLabel');
const interactionBadge = document.getElementById('interactionBadge');
const interactionText = document.getElementById('interactionText');
const interactionMouseHint = document.getElementById('interactionMouseHint');
const crosshair = document.getElementById('crosshair');
const toast = document.getElementById('toast');
const lockHint = document.getElementById('lockHint');
const lockHintText = document.getElementById('lockHintText');

const params = new URLSearchParams(window.location.search);
const captureMode = params.has('capture');
const hideHud = params.get('hud') === '0';

if (hideHud) document.body.classList.add('hud-hidden');

const state = {
  isFullscreen: false,
  pointerLocked: false,
  pointerLockUnavailable: false,
  frozen: false,
  dragging: false,
  dragButton: -1,
  dragMoved: 0,
  dragStartTime: 0,
  pointerX: window.innerWidth / 2,
  pointerY: window.innerHeight / 2,
  hasPointerPosition: true,
  hovered: null,
  ready: false,
};

let renderer = null;
let hall = null;
let camera = null;
let controls = null;
let raycaster = null;
let hoverDirty = true;
let rafId = 0;
let toastTimer = 0;
let lastFrameTime = performance.now();
let elapsedTime = 0;
let fpsFrames = 0;
let fpsWindowStart = performance.now();
let smoothFps = 60;
let quality = 1;
let qualityReductions = 0;
let qualityFloor = 0.7;
let warmupUntil = performance.now() + 3200;
let statsSnapshot = { calls: 0, triangles: 0 };
let lastPointerClient = { x: 0, y: 0 };

const HOME = {
  x: START.x,
  z: START.z,
  yaw: START.yaw,
  pitch: START.pitch,
  fov: START.fov,
};

const FULLSCREEN_HINT = '移动鼠标环顾 · 左键/右键固定视线 · 中键回正 · E 互动 · ESC 退出';
const LOCK_FALLBACK = '点击画面捕获鼠标 · 右键固定视野 · 中键回正';

function showToast(message, duration = 2200) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(toastTimer);
  if (duration > 0) {
    toastTimer = window.setTimeout(() => toast.classList.remove('visible'), duration);
  }
}

function markHoverDirty() {
  hoverDirty = true;
}

function updateFullscreenClass() {
  document.body.classList.toggle('is-fullscreen', state.isFullscreen);
  if (fullscreenButton) fullscreenButton.setAttribute('aria-pressed', state.isFullscreen ? 'true' : 'false');
  if (interactionMouseHint) interactionMouseHint.style.display = state.isFullscreen ? 'none' : '';
  syncLockHint();
  updateProjection();
}

function syncLockHint() {
  if (!lockHint) return;
  const visible = state.isFullscreen && !state.pointerLocked;
  lockHint.classList.toggle('visible', visible);
  lockHint.setAttribute('aria-hidden', visible ? 'false' : 'true');
  if (lockHintText) {
    lockHintText.textContent = state.pointerLockUnavailable
      ? '鼠标锁定不可用 · 按住左键拖动环顾'
      : LOCK_FALLBACK;
  }
}

function updateProjection() {
  if (!camera || !renderer) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspect = width / Math.max(1, height);
  camera.aspect = aspect;
  camera.fov = aspect < 0.85 ? 78 : HOME.fov;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(quality);
  renderer.setSize(width, height, false);
}

function applyView() {
  markHoverDirty();
}

function isVisible(object) {
  let pointer = object;
  while (pointer) {
    if (!pointer.visible) return false;
    pointer = pointer.parent;
  }
  return true;
}

function pickAt(clientX, clientY) {
  if (!hall || !camera || !raycaster) return null;
  camera.updateMatrixWorld(true);
  let ndcX;
  let ndcY;
  if (state.isFullscreen) {
    ndcX = 0;
    ndcY = 0;
  } else {
    ndcX = (clientX / window.innerWidth) * 2 - 1;
    ndcY = -(clientY / window.innerHeight) * 2 + 1;
  }
  raycaster.setFromCamera({ x: ndcX, y: ndcY }, camera);
  const hits = raycaster.intersectObjects(hall.getInteractableMeshes(), false);
  for (const hit of hits) {
    if (!isVisible(hit.object)) continue;
    if (hit.distance > INTERACTION.range + 0.3) continue;
    const item = hall.interactiveById.get(hit.object.userData.interactiveId);
    if (item) return item;
  }
  return null;
}

function setPromptItem(item) {
  state.hovered = item;
  if (!interactionBadge || !interactionText) return;
  if (item) {
    if (item.locked) {
      interactionText.textContent = `${item.label} · 暂未开放`;
      crosshair.classList.remove('has-target');
      document.body.classList.remove('can-interact');
    } else {
      const verb = item.target > 0.5 ? '关闭' : '打开';
      interactionText.textContent = `${verb}${item.label}`;
      crosshair.classList.add('has-target');
      document.body.classList.add('can-interact');
    }
    interactionBadge.classList.add('visible');
  } else {
    interactionBadge.classList.remove('visible');
    crosshair.classList.remove('has-target');
    document.body.classList.remove('can-interact');
  }
}

function refreshHover() {
  if (!hall) return;
  hoverDirty = false;
  if (state.dragging) {
    setPromptItem(null);
    return;
  }
  if (!state.isFullscreen && !state.hasPointerPosition) {
    setPromptItem(null);
    return;
  }
  const item = pickAt(state.pointerX, state.pointerY);
  if (item) {
    setPromptItem(item);
  } else {
    setPromptItem(null);
  }
}

function lockResultMessage(item) {
  if (item?.sceneId === 'kitchen') return '后厨 · 暂未开放（已预留入口）';
  if (item?.sceneId === 'restroom') return '卫生间 · 暂未开放（已预留入口）';
  return `${item?.label ?? '该区域'} · 暂未开放`;
}

function toggleHovered() {
  if (!state.hovered || !hall) return false;
  const item = state.hovered;
  const result = hall.toggleInteractive(item.id);
  if (result?.locked) {
    showToast(lockResultMessage(result), 2400);
  } else {
    showToast(`${item.open ? '已打开' : '已关闭'}${item.label}`, 1100);
  }
  markHoverDirty();
  return true;
}

function setFrozen(value, announce = false) {
  state.frozen = Boolean(value);
  controls.setFrozen(state.frozen);
  document.body.classList.toggle('is-view-frozen', state.frozen);
  if (announce) showToast(state.frozen ? '视线已固定 · 右键解锁' : '视线已解锁', 1200);
  markHoverDirty();
}

function recenterView() {
  const moved = controls.recenter();
  if (moved) showToast('视野回正', 700);
  markHoverDirty();
}

async function tryPointerLock(userInitiated = false) {
  if (!canvas) return false;
  if (document.pointerLockElement === canvas) return true;
  try {
    const result = canvas.requestPointerLock();
    if (result && typeof result.catch === 'function') {
      await result.catch(() => {
        if (userInitiated) {
          state.pointerLockUnavailable = true;
          showToast('未捕获鼠标：按住左键仍可拖动环顾。', 2600);
        }
        syncLockHint();
      });
    }
    const locked = document.pointerLockElement === canvas;
    if (userInitiated && !locked) state.pointerLockUnavailable = true;
    if (locked) state.pointerLockUnavailable = false;
    syncLockHint();
    return locked;
  } catch {
    if (userInitiated) {
      state.pointerLockUnavailable = true;
      showToast('未捕获鼠标：按住左键仍可拖动环顾。', 2600);
    }
    syncLockHint();
    return false;
  }
}

async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    if (!document.fullscreenEnabled) {
      showToast('当前环境不允许网页全屏，可尝试按 F11。', 3000);
      return;
    }
    try {
      const lockAttempt = tryPointerLock(false);
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      state.isFullscreen = Boolean(document.fullscreenElement);
      updateFullscreenClass();
      await lockAttempt;
      if (!state.pointerLocked) await tryPointerLock(false);
    } catch {
      if (document.pointerLockElement) document.exitPointerLock();
      showToast('浏览器未允许全屏，可尝试按 F11。', 3000);
    }
  } else {
    try {
      await document.exitFullscreen();
    } catch {
      // Already leaving.
    }
  }
}

function onFullscreenChange() {
  state.isFullscreen = Boolean(document.fullscreenElement);
  updateFullscreenClass();
  if (state.isFullscreen) {
    setFrozen(false);
    state.pointerLockUnavailable = false;
    markHoverDirty();
    showToast(FULLSCREEN_HINT, 5200);
  } else {
    setFrozen(false);
    state.pointerLockUnavailable = false;
    if (document.pointerLockElement) document.exitPointerLock();
    document.body.classList.remove('can-interact');
    markHoverDirty();
  }
  syncLockHint();
}

function onPointerLockChange() {
  state.pointerLocked = document.pointerLockElement === canvas;
  state.hasPointerPosition = true;
  if (state.pointerLocked) {
    state.pointerLockUnavailable = false;
    state.pointerX = window.innerWidth / 2;
    state.pointerY = window.innerHeight / 2;
  } else if (state.isFullscreen) {
    setFrozen(false);
  }
  syncLockHint();
  markHoverDirty();
}

function onPointerDown(event) {
  if (!hall) return;
  if (event.button === 1) {
    event.preventDefault();
    recenterView();
    return;
  }

  if (state.isFullscreen) {
    if (event.button === 2) {
      event.preventDefault();
      setFrozen(!state.frozen, true);
      if (!state.pointerLocked) tryPointerLock(true);
      return;
    }
    if (event.button !== 0) return;
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    if (!state.pointerLocked && !state.pointerLockUnavailable) {
      tryPointerLock(true);
    } else {
      // Fallback drag look when the browser refuses pointer lock.
      state.dragging = true;
      state.dragButton = 0;
      state.dragMoved = 0;
      state.dragStartTime = performance.now();
      lastPointerClient = { x: event.clientX, y: event.clientY };
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // Not critical.
      }
    }
    markHoverDirty();
    return;
  }

  if (event.button === 2) {
    event.preventDefault();
    setFrozen(!state.frozen, true);
    return;
  }
  if (event.button !== 0) return;
  event.preventDefault();
  state.dragging = true;
  state.dragButton = 0;
  state.dragMoved = 0;
  state.dragStartTime = performance.now();
  state.pointerX = event.clientX;
  state.pointerY = event.clientY;
  state.hasPointerPosition = true;
  lastPointerClient = { x: event.clientX, y: event.clientY };
  try {
    canvas.setPointerCapture(event.pointerId);
  } catch {
    // Fine.
  }
  document.body.classList.add('is-dragging');
  markHoverDirty();
}

function onPointerMove(event) {
  state.pointerX = event.clientX;
  state.pointerY = event.clientY;
  state.hasPointerPosition = true;

  if (state.isFullscreen) {
    if (state.pointerLocked) {
      if (!state.frozen) {
        controls.look(event.movementX || 0, event.movementY || 0, 0.00215);
        applyView();
      }
      return;
    }
    if (state.dragging) {
      const dx = event.clientX - lastPointerClient.x;
      const dy = event.clientY - lastPointerClient.y;
      lastPointerClient = { x: event.clientX, y: event.clientY };
      state.dragMoved += Math.abs(dx) + Math.abs(dy);
      if (state.dragMoved > 3) controls.look(dx, dy, 0.0026);
      markHoverDirty();
    }
    return;
  }

  if (state.dragging) {
    const dx = event.movementX || event.clientX - lastPointerClient.x;
    const dy = event.movementY || event.clientY - lastPointerClient.y;
    lastPointerClient = { x: event.clientX, y: event.clientY };
    state.dragMoved += Math.abs(dx) + Math.abs(dy);
    if (state.dragMoved > 3) {
      controls.look(dx, dy, 0.0028);
      applyView();
    }
  }
  markHoverDirty();
}

function endDrag(event) {
  if (!state.dragging) return;
  const wasDragging = state.dragging;
  const moved = state.dragMoved;
  const duration = performance.now() - state.dragStartTime;
  state.dragging = false;
  state.dragButton = -1;
  document.body.classList.remove('is-dragging');
  try {
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  } catch {
    // Ignore.
  }
  if (wasDragging && !state.isFullscreen && moved < 5 && duration < 700) {
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    const item = pickAt(event.clientX, event.clientY);
    if (item) {
      state.hovered = item;
      toggleHovered();
    }
  }
  markHoverDirty();
}

function onKeyDown(event) {
  if (!hall) return;
  if (event.code === 'KeyE' && !event.repeat) {
    if (toggleHovered()) event.preventDefault();
    return;
  }
  if (event.key === 'F11') {
    if (event.repeat) return;
    const wasFullscreen = Boolean(document.fullscreenElement);
    window.setTimeout(() => {
      if (Boolean(document.fullscreenElement) === wasFullscreen) toggleFullscreen();
    }, 120);
  }
}

function updateFps(now) {
  fpsFrames += 1;
  const elapsed = now - fpsWindowStart;
  if (elapsed < 500) return;
  const measured = (fpsFrames * 1000) / elapsed;
  smoothFps = smoothFps * 0.55 + measured * 0.45;
  const display = Math.max(0, Math.min(999, Math.round(smoothFps)));
  if (fpsValue) fpsValue.textContent = String(display);
  if (fpsDot) {
    fpsDot.classList.toggle('warn', display < 52 && display >= 30);
    fpsDot.classList.toggle('bad', display < 30);
  }
  if (!captureMode && now > warmupUntil && smoothFps < 44 && qualityReductions < 4) {
    quality = Math.max(qualityFloor, quality - 0.14);
    qualityReductions += 1;
    warmupUntil = now + 3000;
    if (qualityLabel) qualityLabel.textContent = '自适应';
    updateProjection();
  }
  fpsFrames = 0;
  fpsWindowStart = now;
}

function animate(now) {
  rafId = requestAnimationFrame(animate);
  const dt = Math.min(0.05, Math.max(0, (now - lastFrameTime) / 1000));
  lastFrameTime = now;
  elapsedTime += dt;

  controls.update(dt);
  hall.update(dt, elapsedTime);

  if (state.isFullscreen || controls.getSpeed() > 0.02) markHoverDirty();
  if (hoverDirty) refreshHover();

  renderer.render(hall.scene, camera);
  updateFps(now);

  if (!statsSnapshot.calls && elapsedTime > 0.3) {
    statsSnapshot = {
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      textures: renderer.info.memory.textures,
      geometries: renderer.info.memory.geometries,
      quality,
    };
  }
}

function attachEvents() {
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', updateProjection);
  window.addEventListener('beforeunload', () => {
    if (document.pointerLockElement) document.exitPointerLock();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  });
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('pointerlockchange', onPointerLockChange);
  document.addEventListener('contextmenu', (event) => {
    if (event.target === canvas || state.isFullscreen || state.pointerLocked) event.preventDefault();
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
      toggleFullscreen();
    });
  }
}

function setView(view) {
  if (!controls) return null;
  controls.setView(view);
  markHoverDirty();
  return controls.getView();
}

function resetView() {
  return setView({ x: HOME.x, z: HOME.z, yaw: HOME.yaw, pitch: HOME.pitch });
}

function readNumber(name, fallback) {
  const raw = params.get(name);
  if (raw === null) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

async function boot() {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
      preserveDrawingBuffer: captureMode,
    });
  } catch (error) {
    console.error(error);
    loader.innerHTML = '<div class="loader-inner"><p class="loader-title">无法启动 3D 预览</p><p class="loader-subtitle">请确认浏览器已启用 WebGL</p></div>';
    return;
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  quality = captureMode ? Math.min(1.25, window.devicePixelRatio || 1) : Math.min(1.5, Math.max(1, window.devicePixelRatio || 1));
  renderer.setPixelRatio(quality);
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  try {
    hall = new DiningHallScene({
      renderer,
      maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
    });
  } catch (error) {
    console.error(error);
    loader.innerHTML = '<div class="loader-inner"><p class="loader-title">场景构建失败</p><p class="loader-subtitle">请打开控制台查看详细错误</p></div>';
    return;
  }

  camera = new THREE.PerspectiveCamera(HOME.fov, window.innerWidth / Math.max(1, window.innerHeight), 0.05, 90);
  camera.rotation.order = 'YXZ';
  camera.position.set(HOME.x, 1.8, HOME.z);

  controls = new FirstPersonControls(camera, hall.collision);
  controls.attach(window);
  controls.setView({
    x: HOME.x,
    z: HOME.z,
    yaw: HOME.yaw,
    pitch: HOME.pitch,
  });

  raycaster = new THREE.Raycaster();
  raycaster.near = 0.02;
  raycaster.far = INTERACTION.range + 0.5;

  updateProjection();
  attachEvents();

  if (captureMode) {
    const view = {
      x: readNumber('x', HOME.x),
      z: readNumber('z', HOME.z),
      yaw: (readNumber('yaw', 0) * Math.PI) / 180,
      pitch: (readNumber('pitch', (START.pitch * 180) / Math.PI) * Math.PI) / 180,
    };
    controls.setView(view);
    const openList = params.get('open');
    if (openList) {
      openList.split(',').forEach((id) => hall.setInteractive(id.trim(), true));
    }
  }

  hall.scene.updateMatrixWorld(true);
  try {
    renderer.compile(hall.scene, camera);
  } catch (error) {
    console.warn('Shader precompile skipped:', error);
  }

  renderer.render(hall.scene, camera);
  state.ready = true;
  lastFrameTime = performance.now();
  fpsWindowStart = lastFrameTime;
  warmupUntil = lastFrameTime + 3200;
  if (qualityLabel) qualityLabel.textContent = '实时';

  if (loader) {
    loader.classList.add('is-hidden');
    window.setTimeout(() => loader.setAttribute('aria-hidden', 'true'), 800);
  }

  window.__DINING__ = {
    scene: hall.scene,
    camera,
    renderer,
    hall,
    setView,
    getView: () => controls.getView(),
    resetView,
    toggle: (id) => hall.toggleInteractive(id),
    setFrozen: (value) => setFrozen(Boolean(value), true),
    setClock: (h, m, s = 0) => hall.setClock(h, m, s),
    getInteractives: () => hall.getInteractiveState(),
    getStats: () => ({
      ...statsSnapshot,
      ...hall.getStats(),
      quality,
      fps: smoothFps,
      renderer: renderer.info.render,
      memory: renderer.info.memory,
    }),
    dispose: () => hall.dispose(),
  };
  window.__DINING_READY__ = true;

  requestAnimationFrame(animate);
}

boot();

export { state as viewerState, setView, resetView };
