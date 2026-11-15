import * as THREE from 'three';
import { SingleDormScene } from './scene.js';
import { DiningHallScene } from '../dining/src/scene.js';
import { FirstPersonControls } from '../dining/src/player.js';
import { START as DINING_START } from '../dining/src/config.js';
import { KitchenScene } from '../kitchen/src/scene.js';
import { KitchenControls } from '../kitchen/src/player.js';
import { START as KITCHEN_START } from '../kitchen/src/config.js';
import { clamp } from '../dining/src/utils.js';

/* ------------------------------------------------------------------ *
 * One page, three scenes.
 *
 * The dorm scene keeps its fixed eye point and look-only interaction;
 * the dining hall and the restaurant kitchen both use first-person
 * walking controllers. Only one scene is rendered at a time, but all
 * three stay resident so switching is instant.
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
const sceneTitle = document.getElementById('sceneTitle');
const sceneEyebrow = document.getElementById('sceneEyebrow');
const sceneTransition = document.getElementById('sceneTransition');
const sceneTransitionTitle = document.getElementById('sceneTransitionTitle');
const dormControls = document.getElementById('dormControls');
const diningControlsBar = document.getElementById('diningControls');
const kitchenControlsBar = document.getElementById('kitchenControls');
const sceneTabs = Array.from(document.querySelectorAll('.scene-tab'));

const params = new URLSearchParams(window.location.search);
const captureMode = params.has('capture');
const hideHud = params.get('hud') === '0';
if (hideHud) document.body.classList.add('hud-hidden');

const state = {
  active: 'dorm',
  isFullscreen: false,
  pointerLocked: false,
  pointerLockUnavailable: false,
  frozen: false,
  dragging: false,
  dragMoved: 0,
  dragStartTime: 0,
  pointerX: window.innerWidth / 2,
  pointerY: window.innerHeight / 2,
  hasPointerPosition: true,
  hovered: null,
  ready: false,
  recenter: null,
  transitioning: false,
};

let renderer = null;
let camera = null;
let dormScene = null;
let diningScene = null;
let diningControls = null;
let kitchenScene = null;
let kitchenControls = null;
let raycaster = null;
let dormHome = null;
let dormYaw = 0;
let dormPitch = 0;
let diningView = null;
let kitchenView = null;
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
let hoverDirty = true;
let lastPointerClient = { x: 0, y: 0 };
let statsSnapshot = { calls: 0, triangles: 0 };

const FULLSCREEN_HINT = '移动鼠标环顾 · 右键固定视线 · 中键回正 · E 互动 · ESC 退出';
const LOCK_FALLBACK = '点击画面捕获鼠标 · 右键固定视野 · 中键回正';

function activeScene() {
  if (state.active === 'dining') return diningScene;
  if (state.active === 'kitchen') return kitchenScene;
  return dormScene;
}

function activeMeshes() {
  if (state.active === 'dining') return diningScene.getInteractableMeshes();
  if (state.active === 'kitchen') return kitchenScene.getInteractableMeshes();
  return dormScene.interactiveMeshes;
}

function activeItem(id) {
  if (state.active === 'dining') return diningScene.interactiveById.get(id);
  if (state.active === 'kitchen') return kitchenScene.interactiveById.get(id);
  return dormScene.interactiveById.get(id);
}

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

function updateProjection() {
  if (!camera || !renderer) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspect = width / Math.max(1, height);
  const baseFov = state.active === 'dining'
    ? DINING_START.fov
    : state.active === 'kitchen'
      ? KITCHEN_START.fov
      : dormHome.fov;
  camera.aspect = aspect;
  camera.fov = aspect < 0.85 ? 78 : baseFov;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(quality);
  renderer.setSize(width, height, false);
}

function applyDormCamera() {
  if (!dormHome) return;
  camera.position.copy(dormHome.position);
  camera.rotation.set(dormPitch, dormYaw, 0, 'YXZ');
}

function shortestAngle(delta) {
  const twoPi = Math.PI * 2;
  return ((delta + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
}

function setScene(name, { updateHash = true, resetView = false } = {}) {
  const next = name === 'dining' ? 'dining' : name === 'kitchen' ? 'kitchen' : 'dorm';
  if (state.active === next && state.ready) {
    return;
  }

  if (diningControls) {
    if (state.active === 'dining') diningView = diningControls.getView();
    diningControls.enabled = false;
    diningControls.keys.clear();
  }
  if (kitchenControls) {
    if (state.active === 'kitchen') kitchenView = kitchenControls.getView();
    kitchenControls.enabled = false;
    kitchenControls.keys.clear();
  }

  state.active = next;
  state.recenter = null;
  state.frozen = false;
  if (resetView) {
    if (next === 'dining') diningView = null;
    else if (next === 'kitchen') kitchenView = null;
    else {
      dormYaw = dormHome.yaw;
      dormPitch = dormHome.pitch;
    }
  }
  state.hovered = null;
  state.dragging = false;
  document.body.classList.remove('is-dragging', 'can-interact');
  setFrozen(false);
  setPromptItem(null);

  if (next === 'dining') {
    camera.near = 0.05;
    camera.far = 90;
    camera.fov = DINING_START.fov;
    camera.updateProjectionMatrix();
    diningControls.enabled = true;
    diningControls.keys.clear();
    const view = diningView || {
      x: DINING_START.x,
      z: DINING_START.z,
      yaw: DINING_START.yaw,
      pitch: DINING_START.pitch,
    };
    diningControls.setView(view);
  } else if (next === 'kitchen') {
    camera.near = 0.04;
    camera.far = 60;
    camera.fov = KITCHEN_START.fov;
    camera.updateProjectionMatrix();
    kitchenControls.enabled = true;
    kitchenControls.keys.clear();
    const view = kitchenView || {
      x: KITCHEN_START.x,
      z: KITCHEN_START.z,
      yaw: KITCHEN_START.yaw,
      pitch: KITCHEN_START.pitch,
    };
    kitchenControls.setView(view);
  } else {
    camera.near = 0.035;
    camera.far = 45;
    camera.fov = dormHome.fov;
    camera.updateProjectionMatrix();
    applyDormCamera();
  }

  updateProjection();
  if (renderer) {
    renderer.toneMappingExposure = next === 'kitchen' ? 0.96 : 1.02;
    renderer.shadowMap.needsUpdate = true;
  }
  updateSceneUI();
  statsSnapshot = { calls: 0, triangles: 0, active: next };
  try {
    renderer.compile(activeScene().scene, camera);
  } catch (error) {
    console.warn('Shader precompile skipped:', error);
  }
  markHoverDirty();

  if (updateHash) {
    const hash = next === 'dining' ? '#dining' : next === 'kitchen' ? '#kitchen' : '#dorm';
    try {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
    } catch {
      // Hash-only updates can be blocked in exotic embeds; no matter.
    }
  }
  if (window.__PREVIEW__) window.__PREVIEW__.scene = activeScene().scene;
}

/* Door-specific spawn points just inside each portal, facing into the
 * destination room with a level pitch. */
const DOOR_SPAWNS = Object.freeze({
  // Dining kitchen door is on the east wall, south end, close to the main entrance.
  dining: { x: 16.7, z: 6.3, yaw: Math.PI / 2, pitch: 0 },
  kitchen: { x: 4.7, z: -7.0, yaw: Math.PI / 2, pitch: 0 },
});

function transitionToScene(next, label) {
  if (!state.ready || state.transitioning || state.active === next) return;
  state.transitioning = true;
  state.recenter = null;
  state.hovered = null;
  state.frozen = false;
  setPromptItem(null);
  if (diningControls) {
    diningControls.enabled = false;
    diningControls.keys.clear();
  }
  if (kitchenControls) {
    kitchenControls.enabled = false;
    kitchenControls.keys.clear();
  }
  if (sceneTransitionTitle) sceneTransitionTitle.textContent = label;
  if (sceneTransition) {
    sceneTransition.classList.add('is-active');
    sceneTransition.setAttribute('aria-hidden', 'false');
  }

  window.setTimeout(() => {
    setScene(next, { resetView: true });
    const spawn = DOOR_SPAWNS[next];
    if (spawn) setView(spawn);
    if (diningControls) {
      diningControls.enabled = false;
      diningControls.keys.clear();
    }
    if (kitchenControls) {
      kitchenControls.enabled = false;
      kitchenControls.keys.clear();
    }

    window.setTimeout(() => {
      if (sceneTransition) {
        sceneTransition.classList.remove('is-active');
        sceneTransition.setAttribute('aria-hidden', 'true');
      }
      window.setTimeout(() => {
        state.transitioning = false;
        if (state.active === 'dining' && diningControls) diningControls.enabled = true;
        if (state.active === 'kitchen' && kitchenControls) kitchenControls.enabled = true;
        markHoverDirty();
      }, 360);
    }, 500);
  }, 420);
}

function updateSceneUI() {
  const dining = state.active === 'dining';
  const kitchen = state.active === 'kitchen';
  const title = dining ? '学生餐厅' : kitchen ? '餐厅后厨' : '单人宿舍';
  const eyebrow = dining
    ? "Hope's Peak · Dining Hall"
    : kitchen
      ? "Hope's Peak · Kitchen"
      : "Hope's Peak · Dormitory";
  if (sceneTitle) sceneTitle.textContent = title;
  if (sceneEyebrow) sceneEyebrow.textContent = eyebrow;
  if (dormControls) dormControls.classList.toggle('is-hidden', dining || kitchen);
  if (diningControlsBar) diningControlsBar.classList.toggle('is-hidden', !dining);
  if (kitchenControlsBar) kitchenControlsBar.classList.toggle('is-hidden', !kitchen);
  sceneTabs.forEach((tab) => {
    const active = tab.dataset.scene === state.active;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  document.title = `${title} · 3D 场景预览`;
}

function look(deltaX, deltaY, sensitivity) {
  if (state.frozen || state.transitioning) return;
  state.recenter = null;
  if (state.active === 'dining') {
    diningControls.look(deltaX, deltaY, sensitivity);
  } else if (state.active === 'kitchen') {
    kitchenControls.look(deltaX, deltaY, sensitivity);
  } else {
    dormYaw -= deltaX * sensitivity;
    dormPitch = clamp(dormPitch - deltaY * sensitivity, -Math.PI / 2 + 0.075, Math.PI / 2 - 0.075);
    applyDormCamera();
  }
  markHoverDirty();
}

function recenterView() {
  if (state.transitioning) return;
  if (state.active === 'dining') {
    if (diningControls.recenter()) showToast('视野回正', 700);
    markHoverDirty();
    return;
  }
  if (state.active === 'kitchen') {
    if (kitchenControls.recenter()) showToast('视野回正', 700);
    markHoverDirty();
    return;
  }
  if (!dormHome) return;
  const deltaYaw = shortestAngle(dormHome.yaw - dormYaw);
  const deltaPitch = dormHome.pitch - dormPitch;
  if (Math.abs(deltaYaw) < 0.001 && Math.abs(deltaPitch) < 0.001) {
    dormYaw = dormHome.yaw;
    dormPitch = dormHome.pitch;
    applyDormCamera();
    showToast('视野已回正', 700);
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
  if (t >= 1) {
    dormYaw = dormHome.yaw;
    dormPitch = dormHome.pitch;
    state.recenter = null;
    applyDormCamera();
    showToast('视野已回正', 800);
  }
}

function setFrozen(value, announce = false) {
  state.frozen = Boolean(value);
  if (diningControls) diningControls.setFrozen(state.frozen);
  if (kitchenControls) kitchenControls.setFrozen(state.frozen);
  document.body.classList.toggle('is-view-frozen', state.frozen);
  if (announce) showToast(state.frozen ? '视线已固定 · 右键解锁' : '视线已解锁', 1200);
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
  if (!camera || !raycaster) return null;
  camera.updateMatrixWorld(true);
  const ndcX = state.isFullscreen ? 0 : (clientX / window.innerWidth) * 2 - 1;
  const ndcY = state.isFullscreen ? 0 : -(clientY / window.innerHeight) * 2 + 1;
  raycaster.far = state.active === 'dining' ? 4.2 : state.active === 'kitchen' ? 4.2 : 12;
  raycaster.setFromCamera({ x: ndcX, y: ndcY }, camera);
  const hits = raycaster.intersectObjects(activeMeshes(), false);
  for (const hit of hits) {
    if (!isVisible(hit.object)) continue;
    if (state.active === 'dining' && hit.distance > 3.9) continue;
    const item = activeItem(hit.object.userData.interactiveId);
    if (item) return item;
  }
  return null;
}

function setPromptItem(item) {
  state.hovered = item;
  if (!interactionBadge || !interactionText) return;
  if (item) {
    if (item.portal) {
      const portalLabel = item.label.endsWith('门') ? item.label.slice(0, -1) : item.label;
      interactionText.textContent = `进入${portalLabel}`;
      crosshair.classList.add('has-target');
      if (!state.isFullscreen) document.body.classList.add('can-interact');
    } else if (item.locked) {
      interactionText.textContent = `${item.label} · 暂未开放`;
      crosshair.classList.remove('has-target');
      document.body.classList.remove('can-interact');
    } else {
      const verb = item.target > 0.5 ? '关闭' : '打开';
      interactionText.textContent = `${verb}${item.label}`;
      crosshair.classList.add('has-target');
      if (!state.isFullscreen) document.body.classList.add('can-interact');
    }
    interactionBadge.classList.add('visible');
  } else {
    interactionBadge.classList.remove('visible');
    crosshair.classList.remove('has-target');
    document.body.classList.remove('can-interact');
  }
}

function refreshHover() {
  hoverDirty = false;
  if (state.dragging) {
    setPromptItem(null);
    return;
  }
  if (!state.isFullscreen && !state.hasPointerPosition) {
    setPromptItem(null);
    return;
  }
  setPromptItem(pickAt(state.pointerX, state.pointerY));
}

function lockResultMessage(item) {
  if (item?.sceneId === 'kitchen') return '后厨 · 暂未开放（已预留入口）';
  if (item?.sceneId === 'restroom') return '卫生间 · 暂未开放（已预留入口）';
  if (item?.sceneId === 'corridor') return '正门 · 暂未开放（预留走廊切换）';
  return `${item?.label ?? '该区域'} · 暂未开放`;
}

function toggleHovered() {
  if (!state.hovered) return false;
  const item = state.hovered;
  if (state.active === 'dining') {
    const result = diningScene.toggleInteractive(item.id);
    if (result?.sceneId === 'kitchen') {
      transitionToScene('kitchen', '餐厅后厨');
    } else if (result?.locked) {
      showToast(lockResultMessage(result), 2400);
    } else if (result) {
      showToast(`${result.open ? '已打开' : '已关闭'}${result.label}`, 1100);
    }
  } else if (state.active === 'kitchen') {
    const result = kitchenScene.toggleInteractive(item.id);
    if (result?.sceneId === 'dining') {
      transitionToScene('dining', '学生餐厅');
    } else {
      return false;
    }
  } else {
    const result = dormScene.toggleInteractive(item.id);
    if (result) showToast(`${result.open ? '已打开' : '已关闭'}${result.label}`, 1100);
  }
  markHoverDirty();
  return true;
}

/* --- Fullscreen and pointer lock ---------------------------------- */

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

/* --- Input --------------------------------------------------------- */

function onPointerDown(event) {
  if (!state.ready || state.transitioning) return;
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
      state.dragging = true;
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
      if (!state.frozen) look(event.movementX || 0, event.movementY || 0, 0.00215);
      return;
    }
    if (state.dragging) {
      const dx = event.clientX - lastPointerClient.x;
      const dy = event.clientY - lastPointerClient.y;
      lastPointerClient = { x: event.clientX, y: event.clientY };
      state.dragMoved += Math.abs(dx) + Math.abs(dy);
      if (state.dragMoved > 3) look(dx, dy, 0.0026);
      markHoverDirty();
    }
    return;
  }

  if (state.dragging) {
    const dx = event.movementX || event.clientX - lastPointerClient.x;
    const dy = event.movementY || event.clientY - lastPointerClient.y;
    lastPointerClient = { x: event.clientX, y: event.clientY };
    state.dragMoved += Math.abs(dx) + Math.abs(dy);
    if (state.dragMoved > 3) look(dx, dy, state.active === 'dorm' ? 0.0031 : 0.0028);
  }
  markHoverDirty();
}

function endDrag(event) {
  if (!state.dragging) return;
  const wasDragging = state.dragging;
  const moved = state.dragMoved;
  const duration = performance.now() - state.dragStartTime;
  state.dragging = false;
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
  if (!state.ready || state.transitioning) return;
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

/* --- FPS ----------------------------------------------------------- */

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

/* --- Frame loop ---------------------------------------------------- */

function animate(now) {
  rafId = requestAnimationFrame(animate);
  const dt = Math.min(0.05, Math.max(0, (now - lastFrameTime) / 1000));
  lastFrameTime = now;
  elapsedTime += dt;

  if (state.active === 'dining') {
    diningControls.update(dt);
    diningScene.update(dt, elapsedTime);
    if (diningControls.getSpeed() > 0.02) markHoverDirty();
  } else if (state.active === 'kitchen') {
    kitchenControls.update(dt);
    kitchenScene.update(dt, elapsedTime);
    if (kitchenControls.getSpeed() > 0.02) markHoverDirty();
  } else {
    updateDormRecenter(dt);
    dormScene.update(dt, elapsedTime);
  }

  if (state.isFullscreen) markHoverDirty();
  if (hoverDirty) refreshHover();

  renderer.render(activeScene().scene, camera);
  updateFps(now);

  if (!statsSnapshot.calls || statsSnapshot.active !== state.active || elapsedTime - (statsSnapshot.at || 0) > 1) {
    statsSnapshot = {
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      textures: renderer.info.memory.textures,
      geometries: renderer.info.memory.geometries,
      active: state.active,
      quality,
      at: elapsedTime,
    };
  }
}

/* --- API ----------------------------------------------------------- */

function getView() {
  if (state.active === 'dining') return diningControls.getView();
  if (state.active === 'kitchen') return kitchenControls.getView();
  return {
    x: dormHome.position.x,
    z: dormHome.position.z,
    y: dormHome.position.y,
    yaw: dormYaw,
    pitch: dormPitch,
    frozen: state.frozen,
  };
}

function setView(view = {}) {
  if (state.active === 'dining') {
    const current = diningControls.getView();
    diningControls.setView({
      x: typeof view.x === 'number' ? view.x : current.x,
      z: typeof view.z === 'number' ? view.z : current.z,
      yaw: typeof view.yaw === 'number' ? view.yaw : current.yaw,
      pitch: typeof view.pitch === 'number' ? view.pitch : current.pitch,
    });
  } else if (state.active === 'kitchen') {
    const current = kitchenControls.getView();
    kitchenControls.setView({
      x: typeof view.x === 'number' ? view.x : current.x,
      z: typeof view.z === 'number' ? view.z : current.z,
      yaw: typeof view.yaw === 'number' ? view.yaw : current.yaw,
      pitch: typeof view.pitch === 'number' ? view.pitch : current.pitch,
    });
  } else {
    if (typeof view.yaw === 'number') dormYaw = view.yaw;
    if (typeof view.pitch === 'number') {
      dormPitch = clamp(view.pitch, -Math.PI / 2 + 0.075, Math.PI / 2 - 0.075);
    }
    state.recenter = null;
    applyDormCamera();
  }
  markHoverDirty();
  return getView();
}

function resetView() {
  if (state.active === 'dining') {
    diningControls.setView({
      x: DINING_START.x,
      z: DINING_START.z,
      yaw: DINING_START.yaw,
      pitch: DINING_START.pitch,
    });
  } else if (state.active === 'kitchen') {
    kitchenControls.setView({
      x: KITCHEN_START.x,
      z: KITCHEN_START.z,
      yaw: KITCHEN_START.yaw,
      pitch: KITCHEN_START.pitch,
    });
  } else {
    dormYaw = dormHome.yaw;
    dormPitch = dormHome.pitch;
    state.recenter = null;
    applyDormCamera();
  }
  markHoverDirty();
  return getView();
}

function getInteractives() {
  if (state.active === 'dining') return diningScene.getInteractiveState();
  if (state.active === 'kitchen') return kitchenScene.getInteractiveState();
  return dormScene.getInteractiveState();
}

function getStats() {
  return {
    ...statsSnapshot,
    scene: state.active,
    fps: smoothFps,
    quality,
    renderer: renderer.info.render,
    memory: renderer.info.memory,
    dining: diningScene.getStats(),
    kitchen: kitchenScene.getStats(),
  };
}

/* --- Boot ---------------------------------------------------------- */

function loadImage(url) {
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

async function boot() {
  if (window.location.protocol === 'file:') return;
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
  quality = captureMode
    ? Math.min(1.25, window.devicePixelRatio || 1)
    : Math.min(1.5, Math.max(1, window.devicePixelRatio || 1));
  renderer.setPixelRatio(quality);
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / Math.max(1, window.innerHeight), 0.035, 45);
  camera.rotation.order = 'YXZ';

  const [crestImage, monokumaImage] = await Promise.all([
    loadImage('./assets/art/crest.webp'),
    loadImage('./assets/art/monokuma.webp'),
  ]);

  try {
    dormScene = new SingleDormScene({
      renderer,
      maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
      referenceArt: { crestImage, monokumaImage },
    });
    diningScene = new DiningHallScene({
      renderer,
      maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
    });
    kitchenScene = new KitchenScene({
      renderer,
      maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
    });
  } catch (error) {
    console.error(error);
    loader.innerHTML = '<div class="loader-inner"><p class="loader-title">场景构建失败</p><p class="loader-subtitle">请打开控制台查看详细错误</p></div>';
    return;
  }

  dormScene.scene.background = new THREE.Color(0x100d0a);
  dormHome = {
    position: dormScene.cameraHome.position.clone(),
    yaw: dormScene.cameraHome.yaw,
    pitch: dormScene.cameraHome.pitch,
    fov: dormScene.cameraHome.fov,
  };
  dormYaw = dormHome.yaw;
  dormPitch = dormHome.pitch;

  diningControls = new FirstPersonControls(camera, diningScene.collision);
  diningControls.attach(window);
  diningControls.enabled = false;

  kitchenControls = new KitchenControls(camera, kitchenScene.collision);
  kitchenControls.attach(window);
  kitchenControls.enabled = false;

  raycaster = new THREE.Raycaster();
  raycaster.near = 0.02;

  const requested = params.get('scene') || window.location.hash.replace('#', '');
  state.active = requested === 'dining' ? 'dining' : requested === 'kitchen' ? 'kitchen' : 'dorm';
  setScene(state.active, { updateHash: false });
  state.ready = true;

  if (captureMode) {
    const number = (name, fallback) => {
      const raw = params.get(name);
      if (raw === null) return fallback;
      const value = Number(raw);
      return Number.isFinite(value) ? value : fallback;
    };
    if (state.active === 'dining') {
      setView({
        x: number('x', DINING_START.x),
        z: number('z', DINING_START.z),
        yaw: (number('yaw', (DINING_START.yaw * 180) / Math.PI) * Math.PI) / 180,
        pitch: (number('pitch', (DINING_START.pitch * 180) / Math.PI) * Math.PI) / 180,
      });
    } else if (state.active === 'kitchen') {
      setView({
        x: number('x', KITCHEN_START.x),
        z: number('z', KITCHEN_START.z),
        yaw: (number('yaw', (KITCHEN_START.yaw * 180) / Math.PI) * Math.PI) / 180,
        pitch: (number('pitch', (KITCHEN_START.pitch * 180) / Math.PI) * Math.PI) / 180,
      });
    } else {
      setView({
        yaw: (number('yaw', (dormHome.yaw * 180) / Math.PI) * Math.PI) / 180,
        pitch: (number('pitch', (dormHome.pitch * 180) / Math.PI) * Math.PI) / 180,
      });
    }
    const openList = params.get('open');
    if (openList) {
      openList.split(',').forEach((id) => {
        if (state.active === 'dining') diningScene.setInteractive(id.trim(), true);
        else dormScene.setInteractive(id.trim(), true);
      });
    }
  }

  updateProjection();
  attachEvents();
  updateSceneUI();
  canvas.focus({ preventScroll: true });

  dormScene.scene.updateMatrixWorld(true);
  diningScene.scene.updateMatrixWorld(true);
  kitchenScene.scene.updateMatrixWorld(true);
  try {
    renderer.compile(activeScene().scene, camera);
  } catch (error) {
    console.warn('Shader precompile skipped:', error);
  }

  renderer.render(activeScene().scene, camera);
  state.ready = true;
  lastFrameTime = performance.now();
  fpsWindowStart = lastFrameTime;
  warmupUntil = lastFrameTime + 3200;
  if (qualityLabel) qualityLabel.textContent = '实时';

  loader.classList.add('is-hidden');
  window.setTimeout(() => loader.setAttribute('aria-hidden', 'true'), 800);

  window.__PREVIEW__ = {
    scene: activeScene().scene,
    camera,
    renderer,
    dorm: dormScene,
    dining: diningScene,
    kitchen: kitchenScene,
    kitchenControls,
    getScene: () => state.active,
    setScene: (name) => setScene(name),
    setView,
    getView,
    resetView,
    transitionToScene,
    toggle: (id) => {
      if (state.active === 'dining') return diningScene.toggleInteractive(id);
      if (state.active === 'kitchen') return null;
      return dormScene.toggleInteractive(id);
    },
    setFrozen: (value) => setFrozen(Boolean(value), true),
    setClock: (h, m, s = 0) => diningScene.setClock(h, m, s),
    getInteractives,
    getStats,
  };
  window.__PREVIEW_READY__ = true;
  window.__DORM_READY__ = true;
  window.__DINING_READY__ = true;
  window.__KITCHEN_READY__ = true;
  requestAnimationFrame(animate);
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
  sceneTabs.forEach((tab) => {
    tab.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (state.transitioning) return;
      setScene(tab.dataset.scene);
      markHoverDirty();
    });
  });
  window.addEventListener('hashchange', () => {
    const requested = window.location.hash.replace('#', '');
    if (requested === 'dining' || requested === 'dorm' || requested === 'kitchen') setScene(requested);
  });
}

boot();
