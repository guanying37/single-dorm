import * as THREE from 'three';
import { SingleDormScene } from './scene.js';

/* ------------------------------------------------------------------ *
 * Page controller: renderer, first-person look, fullscreen/pointer lock,
 * hover/inspection and the small performance HUD.
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

const captureMode = new URLSearchParams(window.location.search).has('capture');

const state = {
  isFullscreen: false,
  pointerLocked: false,
  pointerLockUnavailable: false,
  frozen: false,
  dragging: false,
  dragMoved: 0,
  dragPointerId: null,
  dragStartTime: 0,
  pointerX: window.innerWidth / 2,
  pointerY: window.innerHeight / 2,
  hasPointerPosition: false,
  hovered: null,
  recenter: null,
  yaw: 0,
  pitch: 0,
  ready: false,
};

let renderer = null;
let dorm = null;
let camera = null;
let raycaster = null;
let hoverDirty = true;
let rafId = 0;
let toastTimer = 0;
let lastFrameTime = performance.now();
let elapsedTime = 0;
let fpsFrames = 0;
let fpsWindowStart = performance.now();
let smoothFps = 60;
let warmupUntil = performance.now() + 2600;
let quality = 1;
let qualityReductions = 0;
let qualityFloor = 0.68;
let statsSnapshot = { calls: 0, triangles: 0 };

const HOME = {
  x: 0.02,
  y: 1.855,
  z: 0.92,
  yaw: -0.19,
  pitch: -0.055,
  fov: 70,
};

const FULLSCREEN_HINT =
  '移动鼠标环顾 · 右键固定/解锁视线 · 中键回正 · E 开关家具 · ESC 退出';

function showToast(message, duration = 2200) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(toastTimer);
  if (duration > 0) {
    toastTimer = window.setTimeout(() => toast.classList.remove('visible'), duration);
  }
}

function updateFullscreenClass() {
  document.body.classList.toggle('is-fullscreen', state.isFullscreen);
  if (state.isFullscreen) {
    interactionMouseHint.style.display = 'none';
    fullscreenButton.setAttribute('aria-pressed', 'true');
  } else {
    interactionMouseHint.style.display = '';
    fullscreenButton.setAttribute('aria-pressed', 'false');
  }
  syncLockHint();
}

function syncLockHint() {
  if (!lockHint) return;
  const visible = state.isFullscreen && !state.pointerLocked;
  lockHint.classList.toggle('visible', visible);
  lockHint.setAttribute('aria-hidden', visible ? 'false' : 'true');
  if (lockHintText) {
    lockHintText.textContent = state.pointerLockUnavailable
      ? '鼠标锁定不可用 · 右键固定视野'
      : '点击画面捕获鼠标 · 360° 环顾 · 右键固定视野';
  }
}

function markHoverDirty() {
  hoverDirty = true;
}

function clampPitch(value) {
  const limit = Math.PI / 2 - 0.075;
  return Math.min(limit, Math.max(-limit, value));
}

function applyView() {
  if (!camera) return;
  // Yaw is intentionally left unbounded. A 2π wrap at a threshold would
  // briefly look like the view has hit an invisible stop, so horizontal
  // rotation is allowed to accumulate without any limit.
  camera.rotation.set(state.pitch, state.yaw, 0);
  markHoverDirty();
}

/**
 * Smoothly ease the camera back to the authored home orientation. The
 * shortest horizontal route is chosen even if yaw has accumulated far
 * beyond a full turn. A new look input cancels the tween immediately.
 */
function resetView() {
  if (!camera) return;
  const twoPi = Math.PI * 2;
  let deltaYaw = HOME.yaw - state.yaw;
  deltaYaw = ((deltaYaw + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
  const deltaPitch = HOME.pitch - state.pitch;

  if (Math.abs(deltaYaw) < 0.0005 && Math.abs(deltaPitch) < 0.0005) {
    state.yaw = HOME.yaw;
    state.pitch = HOME.pitch;
    state.recenter = null;
    applyView();
    showToast('视野已回正', 1000);
    return;
  }

  state.recenter = {
    elapsed: 0,
    duration: 0.68,
    startYaw: state.yaw,
    startPitch: state.pitch,
    deltaYaw,
    deltaPitch,
  };
}

function updateViewReset(dt) {
  const recenter = state.recenter;
  if (!recenter) return;
  recenter.elapsed = Math.min(recenter.duration, recenter.elapsed + dt);
  const t = recenter.elapsed / recenter.duration;
  // A soft cubic ease-in-out. The lens does not overshoot.
  const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  state.yaw = recenter.startYaw + recenter.deltaYaw * eased;
  state.pitch = recenter.startPitch + recenter.deltaPitch * eased;
  applyView();
  if (t >= 1) {
    state.yaw = HOME.yaw;
    state.pitch = HOME.pitch;
    state.recenter = null;
    applyView();
    showToast('视野已回正', 900);
  }
}

function look(deltaX, deltaY, sensitivity) {
  if (state.frozen) return;
  // Manual look always takes priority over an in-flight recenter tween.
  state.recenter = null;
  state.yaw -= deltaX * sensitivity;
  state.pitch = clampPitch(state.pitch - deltaY * sensitivity);
  applyView();
}

function setView(yaw, pitch) {
  state.recenter = null;
  state.yaw = yaw;
  state.pitch = clampPitch(pitch);
  applyView();
}

function getView() {
  return { yaw: state.yaw, pitch: state.pitch, position: camera ? camera.position.clone() : null };
}

function updateProjection() {
  if (!camera || !renderer) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspect = width / Math.max(1, height);
  camera.aspect = aspect;
  // A little extra breathing room in portrait without ever inverting.
  camera.fov = aspect < 0.85 ? 78 : HOME.fov;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(quality);
  renderer.setSize(width, height, false);
}

function isVisibleInteractiveMesh(object) {
  let pointer = object;
  while (pointer) {
    if (!pointer.visible) return false;
    pointer = pointer.parent;
  }
  return true;
}

function raycastAt(clientX, clientY) {
  if (!dorm || !camera || !raycaster) return null;
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
  const hits = raycaster.intersectObjects(dorm.interactiveMeshes, false);
  for (const hit of hits) {
    if (!isVisibleInteractiveMesh(hit.object)) continue;
    const item = dorm.interactiveById.get(hit.object.userData.interactiveId);
    if (item) return item;
  }
  return null;
}

function setPromptItem(item) {
  state.hovered = item;
  if (item) {
    const verb = item.target > 0.5 ? '关闭' : '打开';
    interactionText.textContent = `${verb}${item.label}`;
    interactionBadge.classList.add('visible');
    crosshair.classList.add('has-target');
    if (!state.isFullscreen) document.body.classList.add('can-interact');
    if (state.isFullscreen) interactionMouseHint.style.display = 'none';
  } else {
    interactionBadge.classList.remove('visible');
    crosshair.classList.remove('has-target');
    document.body.classList.remove('can-interact');
  }
}

function refreshHover() {
  if (!dorm) return;
  hoverDirty = false;
  if (state.dragging) {
    setPromptItem(null);
    return;
  }
  if (!state.isFullscreen && !state.hasPointerPosition) {
    setPromptItem(null);
    return;
  }
  const item = raycastAt(state.pointerX, state.pointerY);
  setPromptItem(item);
}

function toggleHovered() {
  if (!state.hovered || !dorm) return false;
  const item = state.hovered;
  dorm.toggleInteractive(item.id);
  const verb = item.open ? '关闭' : '打开';
  interactionText.textContent = `${verb}${item.label}`;
  // Doors and drawers animate over the next frames; refresh as they move.
  markHoverDirty();
  return true;
}

async function tryPointerLock(userInitiated = false, allowOutsideFullscreen = false) {
  if (!canvas) return false;
  if (!allowOutsideFullscreen && !state.isFullscreen) return false;
  if (document.pointerLockElement === canvas) {
    state.pointerLockUnavailable = false;
    syncLockHint();
    return true;
  }
  try {
    const result = canvas.requestPointerLock();
    if (result && typeof result.catch === 'function') {
      await result.catch(() => {
        if (userInitiated) state.pointerLockUnavailable = true;
        if (userInitiated) {
          showToast('未捕获鼠标：点击画面重试；右键仍可固定/解锁视线。', 3000);
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
      showToast('未捕获鼠标：点击画面重试；右键仍可固定/解锁视线。', 3000);
    }
    syncLockHint();
    return false;
  }
}

function setFrozen(value, announce = false) {
  state.frozen = Boolean(value);
  document.body.classList.toggle('is-view-frozen', state.frozen);
  if (announce) {
    showToast(state.frozen ? '视线已固定 · 右键解锁' : '视线已解锁', 1400);
  }
}

async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    if (!document.fullscreenEnabled) {
      showToast('当前环境不允许网页全屏，请在新标签页打开预览。', 3200);
      return;
    }
    let fullscreenPromise;
    try {
      // Ask for the pointer while the click is still live, then start
      // fullscreen with the same activation. Calling this first avoids the
      // browser consuming the gesture for the fullscreen transition and
      // silently declining pointer lock. The hint remains as a fallback.
      const lockAttempt = tryPointerLock(false, true);
      fullscreenPromise = document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      await fullscreenPromise;
      if (!state.isFullscreen) {
        state.isFullscreen = Boolean(document.fullscreenElement);
        updateFullscreenClass();
      }
      await lockAttempt;
      if (!state.pointerLocked) await tryPointerLock(false);
      syncLockHint();
    } catch {
      if (document.pointerLockElement) document.exitPointerLock();
      showToast('浏览器未允许全屏，可尝试按 F11 或在新标签页打开。', 3200);
      return;
    }
  } else {
    try {
      await document.exitFullscreen();
    } catch {
      // Browser may already be leaving fullscreen.
    }
  }
}

function onFullscreenChange() {
  state.isFullscreen = Boolean(document.fullscreenElement);
  state.recenter = null;
  updateFullscreenClass();
  if (state.isFullscreen) {
    setFrozen(false);
    state.pointerLockUnavailable = false;
    state.hasPointerPosition = false;
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
  updateProjection();
}

function onPointerLockChange() {
  state.pointerLocked = document.pointerLockElement === canvas;
  state.hasPointerPosition = true;
  if (state.pointerLocked) {
    state.pointerLockUnavailable = false;
  } else if (state.isFullscreen) {
    setFrozen(false);
  }
  syncLockHint();
  markHoverDirty();
}

function onCanvasPointerDown(event) {
  if (!dorm) return;

  if (state.isFullscreen) {
    if (event.button !== 0 && event.button !== 2) return;
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    if (event.button === 2) {
      // Right-click is the dedicated "fix / release view" action.
      setFrozen(!state.frozen, true);
      if (!state.pointerLocked && !state.pointerLockUnavailable) tryPointerLock(true);
    } else if (!state.pointerLocked && !state.pointerLockUnavailable) {
      // A regular click acquires the pointer; it no longer freezes the view.
      tryPointerLock(true);
    }
    markHoverDirty();
    return;
  }

  if (event.button !== 0) return;
  event.preventDefault();
  state.recenter = null;
  state.dragging = true;
  state.dragPointerId = event.pointerId;
  state.dragMoved = 0;
  state.dragStartTime = performance.now();
  state.pointerX = event.clientX;
  state.pointerY = event.clientY;
  state.hasPointerPosition = true;
  try {
    canvas.setPointerCapture(event.pointerId);
  } catch {
    // Pointer capture is a convenience, not a requirement.
  }
  document.body.classList.add('is-dragging');
  markHoverDirty();
}

function onPointerMove(event) {
  if (state.isFullscreen) return;
  state.pointerX = event.clientX;
  state.pointerY = event.clientY;
  state.hasPointerPosition = true;

  if (state.dragging) {
    // Use coalesced pointer deltas when possible for a smooth drag.
    const dx = event.movementX || 0;
    const dy = event.movementY || 0;
    const useMovement = dx !== 0 || dy !== 0;
    const fallbackDx = event.clientX - (state.lastClientX ?? event.clientX);
    const fallbackDy = event.clientY - (state.lastClientY ?? event.clientY);
    const deltaX = useMovement ? dx : fallbackDx;
    const deltaY = useMovement ? dy : fallbackDy;
    state.lastClientX = event.clientX;
    state.lastClientY = event.clientY;
    state.dragMoved += Math.abs(deltaX) + Math.abs(deltaY);
    if (state.dragMoved > 3) {
      look(deltaX, deltaY, 0.0031);
    }
    setPromptItem(null);
    markHoverDirty();
    return;
  }

  markHoverDirty();
}

function onPointerUp(event) {
  if (state.isFullscreen || !state.dragging) return;
  const wasDragging = state.dragging;
  state.dragging = false;
  state.dragPointerId = null;
  state.lastClientX = undefined;
  state.lastClientY = undefined;
  document.body.classList.remove('is-dragging');
  if (wasDragging) {
    try {
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    } catch {
      // Ignore pointers that were already released.
    }
    const clickDuration = performance.now() - state.dragStartTime;
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    if (state.dragMoved < 5 && clickDuration < 750) {
      const item = raycastAt(event.clientX, event.clientY);
      if (item) {
        dorm.toggleInteractive(item.id);
        setPromptItem(item);
        markHoverDirty();
      } else {
        refreshHover();
      }
    } else {
      refreshHover();
    }
  }
}

function onPointerCancel() {
  state.dragging = false;
  state.dragPointerId = null;
  document.body.classList.remove('is-dragging');
  markHoverDirty();
}

function onFreeLook(event) {
  if (!state.isFullscreen || state.frozen) return;
  const movementX = event.movementX || 0;
  const movementY = event.movementY || 0;
  if (movementX === 0 && movementY === 0) return;
  look(movementX, movementY, state.pointerLocked ? 0.00215 : 0.0019);
}

function onKeyDown(event) {
  if (event.code === 'KeyE' && !event.repeat) {
    if (toggleHovered()) event.preventDefault();
    return;
  }
  if (event.key === 'F11') {
    if (event.repeat) return;
    // Let the browser perform its native F11 behaviour. If the page never
    // left its previous fullscreen state, fall back to the Fullscreen API.
    const wasFullscreen = Boolean(document.fullscreenElement);
    window.setTimeout(() => {
      if (Boolean(document.fullscreenElement) === wasFullscreen) {
        toggleFullscreen();
      }
    }, 120);
  }
}

function onBeforeUnload() {
  if (document.pointerLockElement) document.exitPointerLock();
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

function updateFps(now) {
  fpsFrames += 1;
  const elapsed = now - fpsWindowStart;
  if (elapsed < 500) return;
  const measured = (fpsFrames * 1000) / elapsed;
  smoothFps = smoothFps * 0.55 + measured * 0.45;
  const display = Math.max(0, Math.min(999, Math.round(smoothFps)));
  fpsValue.textContent = String(display);
  fpsDot.classList.toggle('warn', display < 52 && display >= 33);
  fpsDot.classList.toggle('bad', display < 33);

  // Temporary, invisible-to-the-user resolution scaling when a slow GPU
  // is detected. The scene itself never loses any geometry or interaction.
  if (!captureMode && now > warmupUntil && smoothFps < 44 && qualityReductions < 4) {
    quality = Math.max(qualityFloor, quality - 0.14);
    qualityReductions += 1;
    warmupUntil = now + 2600;
    qualityLabel.textContent = '自适应';
    updateProjection();
  } else if (!captureMode && now > warmupUntil && smoothFps >= 58 && qualityLabel.textContent === '自适应') {
    qualityLabel.textContent = '实时';
  }

  fpsFrames = 0;
  fpsWindowStart = now;
}

function animate(now) {
  rafId = requestAnimationFrame(animate);
  const dt = Math.min(0.05, Math.max(0, (now - lastFrameTime) / 1000));
  lastFrameTime = now;
  elapsedTime += dt;

  updateViewReset(dt);

  if (dorm) {
    dorm.update(dt, elapsedTime);
  }
  if (hoverDirty) refreshHover();

  renderer.render(dorm.scene, camera);
  updateFps(now);

  if (!statsSnapshot.calls && elapsedTime > 0.25) {
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
  canvas.addEventListener('pointerdown', onCanvasPointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerCancel);
  window.addEventListener('mousemove', onFreeLook);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', updateProjection);
  window.addEventListener('beforeunload', onBeforeUnload);
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('pointerlockchange', onPointerLockChange);
  document.addEventListener('contextmenu', (event) => {
    if (event.target === canvas || state.isFullscreen || state.pointerLocked) {
      event.preventDefault();
    }
  });
  document.addEventListener('mousedown', (event) => {
    if (event.button === 1) {
      event.preventDefault();
      resetView();
    }
  });
  document.addEventListener('auxclick', (event) => {
    if (event.button === 1) event.preventDefault();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !state.isFullscreen && state.dragging) {
      onPointerCancel();
    }
  });

  fullscreenButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleFullscreen();
  });
}

function loadArtImage(url) {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => {
      console.warn('Reference artwork could not be loaded:', url);
      resolve(null);
    };
    image.src = url;
  });
}

function initialResolution() {
  const dpr = window.devicePixelRatio || 1;
  return Math.min(1.6, Math.max(1, dpr));
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
      // Only used for deterministic documentation screenshots. Normal
      // playback does not pay the preserveDrawingBuffer cost.
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
  quality = captureMode ? Math.min(1.25, initialResolution()) : initialResolution();
  renderer.setPixelRatio(quality);
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const [crestImage, monokumaImage] = await Promise.all([
    loadArtImage('./assets/art/crest.webp'),
    loadArtImage('./assets/art/monokuma.webp'),
  ]);

  try {
    dorm = new SingleDormScene({
      renderer,
      maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
      referenceArt: { crestImage, monokumaImage },
    });
  } catch (error) {
    console.error(error);
    loader.innerHTML = '<div class="loader-inner"><p class="loader-title">场景构建失败</p><p class="loader-subtitle">请打开控制台查看详细错误</p></div>';
    return;
  }

  dorm.scene.background = new THREE.Color(0x100d0a);

  camera = new THREE.PerspectiveCamera(HOME.fov, window.innerWidth / window.innerHeight, 0.035, 45);
  camera.rotation.order = 'YXZ';
  camera.position.set(HOME.x, HOME.y, HOME.z);
  state.yaw = HOME.yaw;
  state.pitch = HOME.pitch;
  camera.rotation.set(state.pitch, state.yaw, 0);

  raycaster = new THREE.Raycaster();
  raycaster.far = 12;

  updateProjection();
  attachEvents();
  canvas.focus({ preventScroll: true });

  // Compile shaders before the first visible frame. It costs a little at
  // load time and prevents hitches when turning toward darker corners.
  try {
    renderer.compile(dorm.scene, camera);
  } catch (error) {
    console.warn('Shader precompile skipped:', error);
  }

  // First frame while the loader is still solid.
  renderer.render(dorm.scene, camera);
  state.ready = true;
  lastFrameTime = performance.now();
  fpsWindowStart = lastFrameTime;
  warmupUntil = lastFrameTime + 2800;
  qualityLabel.textContent = '实时';

  // Prime the hover test so fullscreen users get a prompt immediately.
  refreshHover();

  loader.classList.add('is-hidden');
  setTimeout(() => {
    loader.setAttribute('aria-hidden', 'true');
  }, 780);

  // A compact test/integration surface. Nothing in the scene is coupled
  // to the DOM, so a game can reuse dorm.scene and dorm.update() directly.
  window.__DORM_PREVIEW__ = {
    scene: dorm.scene,
    camera,
    renderer,
    dorm,
    setView,
    getView,
    resetView,
    toggleInteraction: (id) => dorm.toggleInteractive(id),
    setInteraction: (id, open) => dorm.setInteractive(id, open),
    getInteractives: () => dorm.getInteractiveState(),
    getStats: () => ({ ...statsSnapshot, quality, fps: smoothFps }),
    isReady: () => state.ready,
  };
  window.__DORM_READY__ = true;
  window.__DORM_CAPTURE_MODE__ = captureMode;

  requestAnimationFrame(animate);
}

boot();

// Keep the entry point's exports useful for a future bundler.
export { state as viewerState, setView, getView, resetView };
