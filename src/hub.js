import * as THREE from 'three';
import { SingleDormScene } from './scene.js';
import { DiningHallScene } from '../dining/src/scene.js';
import { FirstPersonControls } from '../dining/src/player.js';
import { START as DINING_START } from '../dining/src/config.js';
import { KitchenScene } from '../kitchen/src/scene.js';
import { KitchenControls } from '../kitchen/src/player.js';
import { START as KITCHEN_START } from '../kitchen/src/config.js';
import { ColdStoreScene } from '../coldstore/src/scene.js';
import { ColdStoreControls } from '../coldstore/src/player.js';
import { START as COLDSTORE_START } from '../coldstore/src/config.js';
import { StorageScene } from '../storage/src/scene.js';
import { StorageControls } from '../storage/src/player.js';
import { START as STORAGE_START } from '../storage/src/config.js';
import { GarbageScene } from '../garbage/src/scene.js';
import { GarbageControls } from '../garbage/src/player.js';
import { START as GARBAGE_START } from '../garbage/src/config.js';
import { LoungeScene } from '../lounge/src/scene.js';
import { LoungeControls } from '../lounge/src/player.js';
import { START as LOUNGE_START } from '../lounge/src/config.js';
import { ReadingRoomScene } from '../readingroom/src/scene.js';
import { ReadingRoomControls } from '../readingroom/src/player.js';
import { START as READINGROOM_START } from '../readingroom/src/config.js';
import { InfirmaryScene } from '../infirmary/src/scene.js';
import { InfirmaryControls } from '../infirmary/src/player.js';
import { START as INFIRMARY_START } from '../infirmary/src/config.js';
import { START as CORRIDOR_START } from '../residence/src/config.js';
import { ResidenceScene } from '../residence/src/scene.js';
import { ResidenceControls } from '../residence/src/player.js';
import { START as RESIDENCE_START } from '../residence/src/config.js';
import {
  getTabletInfo,
  installTabletApi,
  isTabletUnlocked,
  setTabletUnlocked,
  subscribeTablet,
} from './tablet.js';
import { clamp } from '../dining/src/utils.js';

/* ------------------------------------------------------------------ *
 * One page, ten scenes.
 *
 * The dorm scene keeps its fixed eye point and look-only interaction;
 * the dining hall, the restaurant kitchen, the walk-in cold store, the
 * storage room, the garbage processing room, the second-floor lounge,
 * the reading room, the infirmary and the second-floor corridor all use
 * first-person walking controllers. Only one scene is rendered at a
 * time, but all ten stay resident so switching is instant. The kitchen
 * cold-room door and the cold store's own heavy door are a bidirectional
 * portal pair; the other locked doors are hooks for future portals.
 * ------------------------------------------------------------------ */

const canvas = document.getElementById('stage');
const loader = document.getElementById('loader');
const fullscreenButton = document.getElementById('fullscreenButton');
const fpsValue = document.getElementById('fpsValue');
const fpsDot = document.getElementById('fpsDot');
const qualityLabel = document.getElementById('qualityLabel');
const tabletStatus = document.getElementById('tabletStatus');
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
const coldstoreControlsBar = document.getElementById('coldstoreControls');
const storageControlsBar = document.getElementById('storageControls');
const garbageControlsBar = document.getElementById('garbageControls');
const loungeControlsBar = document.getElementById('loungeControls');
const readingroomControlsBar = document.getElementById('readingroomControls');
const infirmaryControlsBar = document.getElementById('infirmaryControls');
const corridorControlsBar = document.getElementById('corridorControls');
const residenceControlsBar = document.getElementById('residenceControls');
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
let coldStoreScene = null;
let coldStoreControls = null;
let storageScene = null;
let storageControls = null;
let garbageScene = null;
let garbageControls = null;
let loungeScene = null;
let loungeControls = null;
let readingroomScene = null;
let readingroomControls = null;
let infirmaryScene = null;
let infirmaryControls = null;
let corridorScene = null;
let corridorControls = null;
let residenceScene = null;
let residenceControls = null;
let raycaster = null;
let dormHome = null;
let dormYaw = 0;
let dormPitch = 0;
let diningView = null;
let kitchenView = null;
let coldstoreView = null;
let storageView = null;
let garbageView = null;
let loungeView = null;
let readingroomView = null;
let infirmaryView = null;
let corridorView = null;
let residenceView = null;
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
  if (state.active === 'coldstore') return coldStoreScene;
  if (state.active === 'storage') return storageScene;
  if (state.active === 'garbage') return garbageScene;
  if (state.active === 'readingroom') return readingroomScene;
  if (state.active === 'lounge') return loungeScene;
  if (state.active === 'infirmary') return infirmaryScene;
  if (state.active === 'corridor') return corridorScene;
  if (state.active === 'residence') return residenceScene;
  return dormScene;
}

function activeMeshes() {
  if (state.active === 'dining') return diningScene.getInteractableMeshes();
  if (state.active === 'kitchen') return kitchenScene.getInteractableMeshes();
  if (state.active === 'coldstore') return coldStoreScene.getInteractableMeshes();
  if (state.active === 'storage') return storageScene.getInteractableMeshes();
  if (state.active === 'garbage') return garbageScene.getInteractableMeshes();
  if (state.active === 'readingroom') return readingroomScene.getInteractableMeshes();
  if (state.active === 'lounge') return loungeScene.getInteractableMeshes();
  if (state.active === 'infirmary') return infirmaryScene.getInteractableMeshes();
  if (state.active === 'corridor') return corridorScene.getInteractableMeshes();
  if (state.active === 'residence') return residenceScene.getInteractableMeshes();
  return dormScene.interactiveMeshes;
}

function activeItem(id) {
  if (state.active === 'dining') return diningScene.interactiveById.get(id);
  if (state.active === 'kitchen') return kitchenScene.interactiveById.get(id);
  if (state.active === 'coldstore') return coldStoreScene.interactiveById.get(id);
  if (state.active === 'storage') return storageScene.interactiveById.get(id);
  if (state.active === 'garbage') return garbageScene.interactiveById.get(id);
  if (state.active === 'readingroom') return readingroomScene.interactiveById.get(id);
  if (state.active === 'lounge') return loungeScene.interactiveById.get(id);
  if (state.active === 'infirmary') return infirmaryScene.interactiveById.get(id);
  if (state.active === 'corridor') return corridorScene.interactiveById.get(id);
  if (state.active === 'residence') return residenceScene.interactiveById.get(id);
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

function syncTabletUI() {
  const info = getTabletInfo();
  if (tabletStatus) {
    tabletStatus.textContent = info.unlocked ? '平板 · 已解锁' : '平板 · 未解锁';
    tabletStatus.style.color = info.unlocked ? 'rgba(146, 214, 166, 0.92)' : 'rgba(214, 148, 148, 0.92)';
    tabletStatus.title = info.unlocked ? '学生平板已验证：可开启铁栅栏门' : '学生平板未验证：铁栅栏门锁定';
  }
  markHoverDirty();
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
      : state.active === 'coldstore'
        ? COLDSTORE_START.fov
        : state.active === 'storage'
          ? STORAGE_START.fov
          : state.active === 'garbage'
            ? GARBAGE_START.fov
            : state.active === 'readingroom'
              ? READINGROOM_START.fov
              : state.active === 'lounge'
                ? LOUNGE_START.fov
                : state.active === 'infirmary'
                  ? INFIRMARY_START.fov
                  : state.active === 'corridor'
                    ? CORRIDOR_START.fov
                    : state.active === 'residence'
                      ? RESIDENCE_START.fov
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
  const next = name === 'dining'
    ? 'dining'
    : name === 'kitchen'
      ? 'kitchen'
      : name === 'coldstore'
        ? 'coldstore'
        : name === 'storage'
          ? 'storage'
          : name === 'garbage'
            ? 'garbage'
            : name === 'readingroom'
              ? 'readingroom'
              : name === 'lounge'
                ? 'lounge'
                : name === 'infirmary'
                  ? 'infirmary'
                  : name === 'corridor'
                    ? 'residence'
                    : name === 'residence'
                      ? 'residence'
                      : 'dorm';
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
  if (coldStoreControls) {
    if (state.active === 'coldstore') coldstoreView = coldStoreControls.getView();
    coldStoreControls.enabled = false;
    coldStoreControls.keys.clear();
  }
  if (storageControls) {
    if (state.active === 'storage') storageView = storageControls.getView();
    storageControls.enabled = false;
    storageControls.keys.clear();
  }
  if (garbageControls) {
    if (state.active === 'garbage') garbageView = garbageControls.getView();
    garbageControls.enabled = false;
    garbageControls.keys.clear();
  }
  if (readingroomControls) {
    if (state.active === 'readingroom') readingroomView = readingroomControls.getView();
    readingroomControls.enabled = false;
    readingroomControls.keys.clear();
  }
  if (loungeControls) {
    if (state.active === 'lounge') loungeView = loungeControls.getView();
    loungeControls.enabled = false;
    loungeControls.keys.clear();
  }
  if (infirmaryControls) {
    if (state.active === 'infirmary') infirmaryView = infirmaryControls.getView();
    infirmaryControls.enabled = false;
    infirmaryControls.keys.clear();
  }
  if (corridorControls) {
    if (state.active === 'corridor') corridorView = corridorControls.getView();
    corridorControls.enabled = false;
    corridorControls.keys.clear();
  }
  if (residenceControls) {
    if (state.active === 'residence') residenceView = residenceControls.getView();
    residenceControls.enabled = false;
    residenceControls.keys.clear();
  }

  state.active = next;
  state.recenter = null;
  state.frozen = false;
  if (resetView) {
    if (next === 'dining') diningView = null;
    else if (next === 'kitchen') kitchenView = null;
    else if (next === 'coldstore') coldstoreView = null;
    else if (next === 'storage') storageView = null;
    else if (next === 'garbage') garbageView = null;
    else if (next === 'readingroom') readingroomView = null;
    else if (next === 'lounge') loungeView = null;
    else if (next === 'infirmary') infirmaryView = null;
    else if (next === 'corridor') corridorView = null;
    else if (next === 'residence') residenceView = null;
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
  } else if (next === 'coldstore') {
    camera.near = 0.03;
    camera.far = 20;
    camera.fov = COLDSTORE_START.fov;
    camera.updateProjectionMatrix();
    coldStoreControls.enabled = true;
    coldStoreControls.keys.clear();
    const view = coldstoreView || {
      x: COLDSTORE_START.x,
      z: COLDSTORE_START.z,
      yaw: COLDSTORE_START.yaw,
      pitch: COLDSTORE_START.pitch,
    };
    coldStoreControls.setView(view);
  } else if (next === 'storage') {
    camera.near = 0.03;
    camera.far = 20;
    camera.fov = STORAGE_START.fov;
    camera.updateProjectionMatrix();
    storageControls.enabled = true;
    storageControls.keys.clear();
    const view = storageView || {
      x: STORAGE_START.x,
      z: STORAGE_START.z,
      yaw: STORAGE_START.yaw,
      pitch: STORAGE_START.pitch,
    };
    storageControls.setView(view);
  } else if (next === 'garbage') {
    camera.near = 0.03;
    camera.far = 20;
    camera.fov = GARBAGE_START.fov;
    camera.updateProjectionMatrix();
    garbageControls.enabled = true;
    garbageControls.keys.clear();
    const view = garbageView || {
      x: GARBAGE_START.x,
      z: GARBAGE_START.z,
      yaw: GARBAGE_START.yaw,
      pitch: GARBAGE_START.pitch,
    };
    garbageControls.setView(view);
  } else if (next === 'readingroom') {
    camera.near = 0.03;
    camera.far = 26;
    camera.fov = READINGROOM_START.fov;
    camera.updateProjectionMatrix();
    readingroomControls.enabled = true;
    readingroomControls.keys.clear();
    const view = readingroomView || {
      x: READINGROOM_START.x,
      z: READINGROOM_START.z,
      yaw: READINGROOM_START.yaw,
      pitch: READINGROOM_START.pitch,
    };
    readingroomControls.setView(view);
  } else if (next === 'lounge') {
    camera.near = 0.04;
    camera.far = 80;
    camera.fov = LOUNGE_START.fov;
    camera.updateProjectionMatrix();
    loungeControls.enabled = true;
    loungeControls.keys.clear();
    const view = loungeView || {
      x: LOUNGE_START.x,
      z: LOUNGE_START.z,
      yaw: LOUNGE_START.yaw,
      pitch: LOUNGE_START.pitch,
    };
    loungeControls.setView(view);
  } else if (next === 'infirmary') {
    camera.near = 0.03;
    camera.far = 26;
    camera.fov = INFIRMARY_START.fov;
    camera.updateProjectionMatrix();
    infirmaryControls.enabled = true;
    infirmaryControls.keys.clear();
    const view = infirmaryView || {
      x: INFIRMARY_START.x,
      z: INFIRMARY_START.z,
      yaw: INFIRMARY_START.yaw,
      pitch: INFIRMARY_START.pitch,
    };
    infirmaryControls.setView(view);
  } else if (next === 'corridor') {
    camera.near = 0.03;
    camera.far = 60;
    camera.fov = CORRIDOR_START.fov;
    camera.updateProjectionMatrix();
    corridorControls.enabled = true;
    corridorControls.keys.clear();
    const view = corridorView || {
      x: CORRIDOR_START.x,
      z: CORRIDOR_START.z,
      yaw: CORRIDOR_START.yaw,
      pitch: CORRIDOR_START.pitch,
    };
    corridorControls.setView(view);
  } else if (next === 'residence') {
    camera.near = 0.03;
    camera.far = 70;
    camera.fov = RESIDENCE_START.fov;
    camera.updateProjectionMatrix();
    residenceControls.enabled = true;
    residenceControls.keys.clear();
    const view = residenceView || {
      x: RESIDENCE_START.x,
      z: RESIDENCE_START.z,
      yaw: RESIDENCE_START.yaw,
      pitch: RESIDENCE_START.pitch,
    };
    residenceControls.setView(view);
  } else {
    camera.near = 0.035;
    camera.far = 45;
    camera.fov = dormHome.fov;
    camera.updateProjectionMatrix();
    applyDormCamera();
  }

  updateProjection();
  if (renderer) {
    renderer.toneMappingExposure = next === 'kitchen'
      ? 0.96
      : next === 'coldstore'
        ? 0.85
        : next === 'storage'
          ? 0.9
          : next === 'garbage'
            ? 0.96
            : next === 'readingroom'
              ? 1.16
              : next === 'lounge'
                ? 1.04
                : next === 'infirmary'
                  ? 0.96
                  : next === 'corridor'
                    ? 1.06
                    : next === 'residence'
                      ? 1.08
                      : 1.02;
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
    const hash = next === 'dining'
      ? '#dining'
      : next === 'kitchen'
        ? '#kitchen'
        : next === 'coldstore'
          ? '#coldstore'
          : next === 'storage'
            ? '#storage'
            : next === 'garbage'
              ? '#garbage'
              : next === 'readingroom'
                ? '#readingroom'
                : next === 'lounge'
                  ? '#lounge'
                  : next === 'infirmary'
                    ? '#infirmary'
                    : next === 'corridor'
                      ? '#corridor'
                      : next === 'residence'
                        ? '#residence'
                        : '#dorm';
    try {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
    } catch {
      // Hash-only updates can be blocked in exotic embeds; no matter.
    }
  }
  if (window.__PREVIEW__) window.__PREVIEW__.scene = activeScene().scene;
}

/* Door-specific spawn points just inside each portal, facing into the
 * destination room with a level pitch. The cold store and the kitchen
 * share two doors, so the kitchen has a second spawn for the return
 * trip. */
const DOOR_SPAWNS = Object.freeze({
  // Dining kitchen door is on the east wall, south end, close to the main entrance.
  dining: { x: 16.7, z: 6.3, yaw: Math.PI / 2, pitch: 0 },
  kitchen: { x: 4.7, z: -7.0, yaw: Math.PI / 2, pitch: 0 },
  // Just south of the kitchen cold-room door, facing back into the room.
  kitchenFromCold: { x: 4.6, z: -10.15, yaw: Math.PI, pitch: 0 },
  // Just inside the cold-store door, facing up the single aisle.
  coldstore: { x: COLDSTORE_START.x, z: 2.3, yaw: 0, pitch: -0.02 },
  // Just inside the storage door, facing the five-tier shelf.
  storage: { x: STORAGE_START.x, z: STORAGE_START.z, yaw: STORAGE_START.yaw, pitch: STORAGE_START.pitch },
  // Just inside the garbage-room door, facing the working aisle.
  garbage: { x: GARBAGE_START.x, z: GARBAGE_START.z, yaw: GARBAGE_START.yaw, pitch: GARBAGE_START.pitch },
  // Just inside the reading-room door, facing the reading tables.
  readingroom: { x: READINGROOM_START.x, z: READINGROOM_START.z, yaw: READINGROOM_START.yaw, pitch: READINGROOM_START.pitch },
  // Just inside the infirmary door, facing the bed row.
  infirmary: { x: INFIRMARY_START.x, z: INFIRMARY_START.z, yaw: INFIRMARY_START.yaw, pitch: INFIRMARY_START.pitch },
  // South end of the corridor, facing the stairwell.
  corridor: { x: CORRIDOR_START.x, z: CORRIDOR_START.z, yaw: CORRIDOR_START.yaw, pitch: CORRIDOR_START.pitch },
  // North corridor of the residence floor, facing east.
  residence: { x: RESIDENCE_START.x, z: RESIDENCE_START.z, yaw: RESIDENCE_START.yaw, pitch: RESIDENCE_START.pitch },
  // Entrance into the lounge from the residence portal: stand on the
  // lounge's own west landing, facing its actual 2.8 m main door.
  loungeFromResidence: { x: -17.2, z: 0, yaw: -Math.PI / 2, pitch: (-1.2 * Math.PI) / 180 },
});

function transitionToScene(next, label, spawnOverride = null) {
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
  if (coldStoreControls) {
    coldStoreControls.enabled = false;
    coldStoreControls.keys.clear();
  }
  if (storageControls) {
    storageControls.enabled = false;
    storageControls.keys.clear();
  }
  if (garbageControls) {
    garbageControls.enabled = false;
    garbageControls.keys.clear();
  }
  if (readingroomControls) {
    readingroomControls.enabled = false;
    readingroomControls.keys.clear();
  }
  if (infirmaryControls) {
    infirmaryControls.enabled = false;
    infirmaryControls.keys.clear();
  }
  if (corridorControls) {
    corridorControls.enabled = false;
    corridorControls.keys.clear();
  }
  if (residenceControls) {
    residenceControls.enabled = false;
    residenceControls.keys.clear();
  }
  if (sceneTransitionTitle) sceneTransitionTitle.textContent = label;
  if (sceneTransition) {
    sceneTransition.classList.add('is-active');
    sceneTransition.setAttribute('aria-hidden', 'false');
  }

  window.setTimeout(() => {
    setScene(next, { resetView: true });
    const spawn = spawnOverride || DOOR_SPAWNS[next];
    if (spawn) setView(spawn);
    if (diningControls) {
      diningControls.enabled = false;
      diningControls.keys.clear();
    }
    if (kitchenControls) {
      kitchenControls.enabled = false;
      kitchenControls.keys.clear();
    }
    if (coldStoreControls) {
      coldStoreControls.enabled = false;
      coldStoreControls.keys.clear();
    }
    if (storageControls) {
      storageControls.enabled = false;
      storageControls.keys.clear();
    }
    if (garbageControls) {
      garbageControls.enabled = false;
      garbageControls.keys.clear();
    }
    if (readingroomControls) {
      readingroomControls.enabled = false;
      readingroomControls.keys.clear();
    }
    if (infirmaryControls) {
      infirmaryControls.enabled = false;
      infirmaryControls.keys.clear();
    }
    if (corridorControls) {
      corridorControls.enabled = false;
      corridorControls.keys.clear();
    }
    if (residenceControls) {
      residenceControls.enabled = false;
      residenceControls.keys.clear();
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
        if (state.active === 'coldstore' && coldStoreControls) coldStoreControls.enabled = true;
        if (state.active === 'storage' && storageControls) storageControls.enabled = true;
        if (state.active === 'garbage' && garbageControls) garbageControls.enabled = true;
        if (state.active === 'readingroom' && readingroomControls) readingroomControls.enabled = true;
        if (state.active === 'infirmary' && infirmaryControls) infirmaryControls.enabled = true;
        if (state.active === 'corridor' && corridorControls) corridorControls.enabled = true;
        if (state.active === 'residence' && residenceControls) residenceControls.enabled = true;
        markHoverDirty();
      }, 360);
    }, 500);
  }, 420);
}

function updateSceneUI() {
  const dining = state.active === 'dining';
  const kitchen = state.active === 'kitchen';
  const coldstore = state.active === 'coldstore';
  const storage = state.active === 'storage';
  const garbage = state.active === 'garbage';
  const readingroom = state.active === 'readingroom';
  const lounge = state.active === 'lounge';
  const infirmary = state.active === 'infirmary';
  const corridor = state.active === 'corridor';
  const residence = state.active === 'residence';
  const title = dining
    ? '学生餐厅'
    : kitchen
      ? '餐厅后厨'
      : coldstore
        ? '冷库储藏室'
        : storage
          ? '杂物间'
          : garbage
            ? '垃圾处理场'
            : readingroom
              ? '阅览室'
              : lounge
                ? '生活区二层休息厅'
                : infirmary
                  ? '医务室'
                  : corridor
                    ? '生活区二层走廊'
                    : residence
                      ? '住宿区 2F'
                      : '单人宿舍';
  const eyebrow = dining
    ? "Hope's Peak · Dining Hall"
    : kitchen
      ? "Hope's Peak · Kitchen"
      : coldstore
        ? "Hope's Peak · Cold Store"
        : storage
          ? "Hope's Peak · Storage Room"
          : garbage
            ? "Hope's Peak · Refuse Yard"
            : readingroom
              ? "Hope's Peak · Reading Room"
              : lounge
                ? "Hope's Peak · Living Area 2F Lounge"
                : infirmary
                  ? "Hope's Peak · Infirmary"
                  : corridor
                    ? "Hope's Peak · Living Area 2F Corridor"
                    : residence
                      ? "Hope's Peak · Residence 2F"
                      : "Hope's Peak · Dormitory";
  if (sceneTitle) sceneTitle.textContent = title;
  if (sceneEyebrow) sceneEyebrow.textContent = eyebrow;
  if (dormControls) dormControls.classList.toggle('is-hidden', dining || kitchen || coldstore || storage || garbage || readingroom || lounge || infirmary || corridor || residence);
  if (diningControlsBar) diningControlsBar.classList.toggle('is-hidden', !dining);
  if (kitchenControlsBar) kitchenControlsBar.classList.toggle('is-hidden', !kitchen);
  if (coldstoreControlsBar) coldstoreControlsBar.classList.toggle('is-hidden', !coldstore);
  if (storageControlsBar) storageControlsBar.classList.toggle('is-hidden', !storage);
  if (garbageControlsBar) garbageControlsBar.classList.toggle('is-hidden', !garbage);
  if (readingroomControlsBar) readingroomControlsBar.classList.toggle('is-hidden', !readingroom);
  if (loungeControlsBar) loungeControlsBar.classList.toggle('is-hidden', !lounge);
  if (infirmaryControlsBar) infirmaryControlsBar.classList.toggle('is-hidden', !infirmary);
  if (corridorControlsBar) corridorControlsBar.classList.toggle('is-hidden', !corridor);
  if (residenceControlsBar) residenceControlsBar.classList.toggle('is-hidden', !residence);
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
  } else if (state.active === 'coldstore') {
    coldStoreControls.look(deltaX, deltaY, sensitivity);
  } else if (state.active === 'storage') {
    storageControls.look(deltaX, deltaY, sensitivity);
  } else if (state.active === 'garbage') {
    garbageControls.look(deltaX, deltaY, sensitivity);
  } else if (state.active === 'readingroom') {
    readingroomControls.look(deltaX, deltaY, sensitivity);
  } else if (state.active === 'lounge') {
    loungeControls.look(deltaX, deltaY, sensitivity);
  } else if (state.active === 'infirmary') {
    infirmaryControls.look(deltaX, deltaY, sensitivity);
  } else if (state.active === 'corridor') {
    corridorControls.look(deltaX, deltaY, sensitivity);
  } else if (state.active === 'residence') {
    residenceControls.look(deltaX, deltaY, sensitivity);
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
  if (state.active === 'coldstore') {
    if (coldStoreControls.recenter()) showToast('视野回正', 700);
    markHoverDirty();
    return;
  }
  if (state.active === 'storage') {
    if (storageControls.recenter()) showToast('视野回正', 700);
    markHoverDirty();
    return;
  }
  if (state.active === 'garbage') {
    if (garbageControls.recenter()) showToast('视野回正', 700);
    markHoverDirty();
    return;
  }
  if (state.active === 'readingroom') {
    if (readingroomControls.recenter()) showToast('视野回正', 700);
    markHoverDirty();
    return;
  }
  if (state.active === 'lounge') {
    if (loungeControls.recenter()) showToast('视野回正', 700);
    markHoverDirty();
    return;
  }
  if (state.active === 'infirmary') {
    if (infirmaryControls.recenter()) showToast('视野回正', 700);
    markHoverDirty();
    return;
  }
  if (state.active === 'corridor') {
    if (corridorControls.recenter()) showToast('视野回正', 700);
    markHoverDirty();
    return;
  }
  if (state.active === 'residence') {
    if (residenceControls.recenter()) showToast('视野回正', 700);
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
  if (coldStoreControls) coldStoreControls.setFrozen(state.frozen);
  if (storageControls) storageControls.setFrozen(state.frozen);
  if (garbageControls) garbageControls.setFrozen(state.frozen);
  if (readingroomControls) readingroomControls.setFrozen(state.frozen);
  if (loungeControls) loungeControls.setFrozen(state.frozen);
  if (infirmaryControls) infirmaryControls.setFrozen(state.frozen);
  if (corridorControls) corridorControls.setFrozen(state.frozen);
  if (residenceControls) residenceControls.setFrozen(state.frozen);
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
  raycaster.far = state.active === 'dining'
    ? 4.2
    : state.active === 'kitchen'
      ? 4.2
      : state.active === 'coldstore'
        ? 3.6
        : state.active === 'storage'
          ? 3.8
          : state.active === 'garbage'
            ? 3.8
            : state.active === 'readingroom'
              ? 4.2
              : state.active === 'lounge'
                ? 3.8
                : state.active === 'infirmary'
                  ? 3.9
                  : state.active === 'corridor'
                    ? 3.4
                    : state.active === 'residence'
                      ? 3.4
                      : 12;
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
    } else if (item.requiresTablet && !isTabletUnlocked()) {
      interactionText.textContent = `${item.label} · 需刷学生平板`;
      crosshair.classList.remove('has-target');
      document.body.classList.remove('can-interact');
    } else if (item.locked) {
      interactionText.textContent = item.prompt ? `${item.label} · ${item.prompt}` : `${item.label} · 暂未开放`;
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
  if (item?.sceneId === 'residence') return `${item?.label ?? '正门'} · 暂未开放（预留 2F 切换）`;
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
    } else if (result?.sceneId === 'coldstore') {
      transitionToScene('coldstore', '冷库储藏室');
    } else {
      return false;
    }
  } else if (state.active === 'coldstore') {
    const result = coldStoreScene.toggleInteractive(item.id);
    if (result?.sceneId === 'kitchen') {
      transitionToScene('kitchen', '餐厅后厨', DOOR_SPAWNS.kitchenFromCold);
    } else {
      return false;
    }
  } else if (state.active === 'lounge') {
    const result = loungeScene.toggleInteractive(item.id);
    if (!result) return false;
    if (result.locked) showToast(result.message || lockResultMessage(result), 2600);
    else showToast(`${result.open ? '已打开' : '已关闭'}${result.label}`, 1100);
  } else if (state.active === 'storage') {
    const result = storageScene.toggleInteractive(item.id);
    if (!result) {
      return false;
    }
    if (result.locked) {
      showToast(lockResultMessage(result), 2400);
    } else {
      showToast(`${result.open ? '已打开' : '已关闭'}${result.label}`, 1100);
    }
  } else if (state.active === 'garbage') {
    const result = garbageScene.toggleInteractive(item.id);
    if (!result) {
      return false;
    }
    if (result.locked) {
      showToast(lockResultMessage(result), 2400);
    } else {
      showToast(`${result.open ? '已打开' : '已关闭'}${result.label}`, 1100);
    }
  } else if (state.active === 'readingroom') {
    const result = readingroomScene.toggleInteractive(item.id);
    if (!result) {
      return false;
    }
    if (result.locked) {
      showToast(lockResultMessage(result), 2400);
    } else {
      showToast(`${result.open ? '已打开' : '已关闭'}${result.label}`, 1100);
    }
  } else if (state.active === 'infirmary') {
    const result = infirmaryScene.toggleInteractive(item.id);
    if (!result) {
      return false;
    }
    if (result.locked) {
      showToast(lockResultMessage(result), 2400);
    } else {
      showToast(`${result.open ? '已打开' : '已关闭'}${result.label}`, 1100);
    }
  } else if (state.active === 'corridor') {
    const result = corridorScene.toggleInteractive(item.id);
    if (!result) {
      return false;
    }
    if (result.locked) {
      showToast(result.message || lockResultMessage(result), 2600);
    } else {
      showToast(`${result.open ? '已打开' : '已关闭'}${result.label}`, 1100);
    }
  } else if (state.active === 'residence') {
    const result = residenceScene.toggleInteractive(item.id);
    if (!result) {
      return false;
    }
    if (result.sceneId === 'lounge') {
      transitionToScene('lounge', '生活区二层休息厅', DOOR_SPAWNS.loungeFromResidence);
    } else if (result.locked) {
      showToast(result.message || lockResultMessage(result), 2600);
    } else {
      showToast(`${result.open ? '已打开' : '已关闭'}${result.label}`, 1100);
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
  } else if (state.active === 'coldstore') {
    coldStoreControls.update(dt);
    coldStoreScene.update(dt, elapsedTime);
    if (coldStoreControls.getSpeed() > 0.02) markHoverDirty();
  } else if (state.active === 'storage') {
    storageControls.update(dt);
    storageScene.update(dt, elapsedTime);
    if (storageControls.getSpeed() > 0.02) markHoverDirty();
  } else if (state.active === 'garbage') {
    garbageControls.update(dt);
    garbageScene.update(dt, elapsedTime);
    if (garbageControls.getSpeed() > 0.02) markHoverDirty();
  } else if (state.active === 'readingroom') {
    readingroomControls.update(dt);
    readingroomScene.update(dt, elapsedTime);
    if (readingroomControls.getSpeed() > 0.02) markHoverDirty();
  } else if (state.active === 'lounge') {
    loungeControls.update(dt);
    loungeScene.update(dt, elapsedTime);
    if (loungeControls.getSpeed() > 0.02) markHoverDirty();
  } else if (state.active === 'infirmary') {
    infirmaryControls.update(dt);
    infirmaryScene.update(dt, elapsedTime);
    if (infirmaryControls.getSpeed() > 0.02) markHoverDirty();
  } else if (state.active === 'corridor') {
    corridorControls.update(dt);
    corridorScene.update(dt, elapsedTime);
    if (corridorControls.getSpeed() > 0.02) markHoverDirty();
  } else if (state.active === 'residence') {
    residenceControls.update(dt);
    residenceScene.update(dt, elapsedTime);
    if (residenceControls.getSpeed() > 0.02) markHoverDirty();
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
  if (state.active === 'coldstore') return coldStoreControls.getView();
  if (state.active === 'storage') return storageControls.getView();
  if (state.active === 'garbage') return garbageControls.getView();
  if (state.active === 'readingroom') return readingroomControls.getView();
  if (state.active === 'lounge') return loungeControls.getView();
  if (state.active === 'infirmary') return infirmaryControls.getView();
  if (state.active === 'corridor') return corridorControls.getView();
  if (state.active === 'residence') return residenceControls.getView();
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
  } else if (state.active === 'coldstore') {
    const current = coldStoreControls.getView();
    coldStoreControls.setView({
      x: typeof view.x === 'number' ? view.x : current.x,
      z: typeof view.z === 'number' ? view.z : current.z,
      yaw: typeof view.yaw === 'number' ? view.yaw : current.yaw,
      pitch: typeof view.pitch === 'number' ? view.pitch : current.pitch,
    });
  } else if (state.active === 'lounge') {
    const current = loungeControls.getView();
    loungeControls.setView({
      x: typeof view.x === 'number' ? view.x : current.x,
      z: typeof view.z === 'number' ? view.z : current.z,
      yaw: typeof view.yaw === 'number' ? view.yaw : current.yaw,
      pitch: typeof view.pitch === 'number' ? view.pitch : current.pitch,
    });
  } else if (state.active === 'storage') {
    const current = storageControls.getView();
    storageControls.setView({
      x: typeof view.x === 'number' ? view.x : current.x,
      z: typeof view.z === 'number' ? view.z : current.z,
      yaw: typeof view.yaw === 'number' ? view.yaw : current.yaw,
      pitch: typeof view.pitch === 'number' ? view.pitch : current.pitch,
    });
  } else if (state.active === 'garbage') {
    const current = garbageControls.getView();
    garbageControls.setView({
      x: typeof view.x === 'number' ? view.x : current.x,
      z: typeof view.z === 'number' ? view.z : current.z,
      yaw: typeof view.yaw === 'number' ? view.yaw : current.yaw,
      pitch: typeof view.pitch === 'number' ? view.pitch : current.pitch,
    });
  } else if (state.active === 'readingroom') {
    const current = readingroomControls.getView();
    readingroomControls.setView({
      x: typeof view.x === 'number' ? view.x : current.x,
      z: typeof view.z === 'number' ? view.z : current.z,
      yaw: typeof view.yaw === 'number' ? view.yaw : current.yaw,
      pitch: typeof view.pitch === 'number' ? view.pitch : current.pitch,
    });
  } else if (state.active === 'infirmary') {
    const current = infirmaryControls.getView();
    infirmaryControls.setView({
      x: typeof view.x === 'number' ? view.x : current.x,
      z: typeof view.z === 'number' ? view.z : current.z,
      yaw: typeof view.yaw === 'number' ? view.yaw : current.yaw,
      pitch: typeof view.pitch === 'number' ? view.pitch : current.pitch,
    });
  } else if (state.active === 'corridor') {
    const current = corridorControls.getView();
    corridorControls.setView({
      x: typeof view.x === 'number' ? view.x : current.x,
      z: typeof view.z === 'number' ? view.z : current.z,
      yaw: typeof view.yaw === 'number' ? view.yaw : current.yaw,
      pitch: typeof view.pitch === 'number' ? view.pitch : current.pitch,
    });
  } else if (state.active === 'residence') {
    const current = residenceControls.getView();
    residenceControls.setView({
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
  } else if (state.active === 'coldstore') {
    coldStoreControls.setView({
      x: COLDSTORE_START.x,
      z: COLDSTORE_START.z,
      yaw: COLDSTORE_START.yaw,
      pitch: COLDSTORE_START.pitch,
    });
  } else if (state.active === 'lounge') {
    loungeControls.setView({
      x: LOUNGE_START.x,
      z: LOUNGE_START.z,
      yaw: LOUNGE_START.yaw,
      pitch: LOUNGE_START.pitch,
    });
  } else if (state.active === 'storage') {
    storageControls.setView({
      x: STORAGE_START.x,
      z: STORAGE_START.z,
      yaw: STORAGE_START.yaw,
      pitch: STORAGE_START.pitch,
    });
  } else if (state.active === 'garbage') {
    garbageControls.setView({
      x: GARBAGE_START.x,
      z: GARBAGE_START.z,
      yaw: GARBAGE_START.yaw,
      pitch: GARBAGE_START.pitch,
    });
  } else if (state.active === 'readingroom') {
    readingroomControls.setView({
      x: READINGROOM_START.x,
      z: READINGROOM_START.z,
      yaw: READINGROOM_START.yaw,
      pitch: READINGROOM_START.pitch,
    });
  } else if (state.active === 'infirmary') {
    infirmaryControls.setView({
      x: INFIRMARY_START.x,
      z: INFIRMARY_START.z,
      yaw: INFIRMARY_START.yaw,
      pitch: INFIRMARY_START.pitch,
    });
  } else if (state.active === 'corridor') {
    corridorControls.setView({
      x: CORRIDOR_START.x,
      z: CORRIDOR_START.z,
      yaw: CORRIDOR_START.yaw,
      pitch: CORRIDOR_START.pitch,
    });
  } else if (state.active === 'residence') {
    residenceControls.setView({
      x: RESIDENCE_START.x,
      z: RESIDENCE_START.z,
      yaw: RESIDENCE_START.yaw,
      pitch: RESIDENCE_START.pitch,
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
  if (state.active === 'coldstore') return coldStoreScene.getInteractiveState();
  if (state.active === 'storage') return storageScene.getInteractiveState();
  if (state.active === 'garbage') return garbageScene.getInteractiveState();
  if (state.active === 'readingroom') return readingroomScene.getInteractiveState();
  if (state.active === 'lounge') return loungeScene.getInteractiveState();
  if (state.active === 'infirmary') return infirmaryScene.getInteractiveState();
  if (state.active === 'corridor') return corridorScene.getInteractiveState();
  if (state.active === 'residence') return residenceScene.getInteractiveState();
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
    coldstore: coldStoreScene.getStats(),
    storage: storageScene.getStats(),
    garbage: garbageScene.getStats(),
    readingroom: readingroomScene.getStats(),
    lounge: loungeScene.getStats(),
    infirmary: infirmaryScene.getStats(),
    corridor: corridorScene.getStats(),
    residence: residenceScene.getStats(),
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
    coldStoreScene = new ColdStoreScene({
      renderer,
      maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
    });
    storageScene = new StorageScene({
      renderer,
      maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
    });
    garbageScene = new GarbageScene({
      renderer,
      maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
    });
    readingroomScene = new ReadingRoomScene({
      renderer,
      maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
    });
    loungeScene = new LoungeScene({
      renderer,
      maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
    });
    infirmaryScene = new InfirmaryScene({
      renderer,
      maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
    });
    corridorScene = null;
    residenceScene = new ResidenceScene({
      renderer,
      maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
    });
    corridorScene = residenceScene;
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

  coldStoreControls = new ColdStoreControls(camera, coldStoreScene.collision);
  coldStoreControls.attach(window);
  coldStoreControls.enabled = false;

  storageControls = new StorageControls(camera, storageScene.collision);
  storageControls.attach(window);
  storageControls.enabled = false;

  garbageControls = new GarbageControls(camera, garbageScene.collision);
  garbageControls.attach(window);
  garbageControls.enabled = false;

  readingroomControls = new ReadingRoomControls(camera, readingroomScene.collision);
  readingroomControls.attach(window);
  readingroomControls.enabled = false;

  loungeControls = new LoungeControls(camera, loungeScene.collision);
  loungeControls.attach(window);
  loungeControls.enabled = false;

  infirmaryControls = new InfirmaryControls(camera, infirmaryScene.collision);
  infirmaryControls.attach(window);
  infirmaryControls.enabled = false;

  corridorScene = residenceScene;

  residenceControls = new ResidenceControls(camera, residenceScene.collision);
  residenceControls.attach(window);
  residenceControls.enabled = false;
  corridorControls = residenceControls;

  raycaster = new THREE.Raycaster();
  raycaster.near = 0.02;

  const requested = params.get('scene') || window.location.hash.replace('#', '');
  const tabletParam = (params.get('tablet') || '').toLowerCase();
  if (tabletParam === '1' || tabletParam === 'true' || tabletParam === 'unlocked') setTabletUnlocked(true);
  else if (tabletParam === '0' || tabletParam === 'false' || tabletParam === 'locked') setTabletUnlocked(false);
  syncTabletUI();
  subscribeTablet((value) => {
    syncTabletUI();
    showToast(value ? '学生平板 · 已解锁' : '学生平板 · 已锁定', 1800);
  });
  state.active = requested === 'dining'
    ? 'dining'
    : requested === 'kitchen'
      ? 'kitchen'
      : requested === 'coldstore'
        ? 'coldstore'
        : requested === 'storage'
          ? 'storage'
          : requested === 'garbage'
            ? 'garbage'
            : requested === 'readingroom'
              ? 'readingroom'
              : requested === 'lounge'
                ? 'lounge'
                : requested === 'infirmary'
                  ? 'infirmary'
                  : requested === 'corridor'
                    ? 'residence'
                    : requested === 'residence'
                      ? 'residence'
                      : 'dorm';
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
    } else if (state.active === 'coldstore') {
      setView({
        x: number('x', COLDSTORE_START.x),
        z: number('z', COLDSTORE_START.z),
        yaw: (number('yaw', (COLDSTORE_START.yaw * 180) / Math.PI) * Math.PI) / 180,
        pitch: (number('pitch', (COLDSTORE_START.pitch * 180) / Math.PI) * Math.PI) / 180,
      });
    } else if (state.active === 'storage') {
      setView({
        x: number('x', STORAGE_START.x),
        z: number('z', STORAGE_START.z),
        yaw: (number('yaw', (STORAGE_START.yaw * 180) / Math.PI) * Math.PI) / 180,
        pitch: (number('pitch', (STORAGE_START.pitch * 180) / Math.PI) * Math.PI) / 180,
      });
    } else if (state.active === 'garbage') {
      setView({
        x: number('x', GARBAGE_START.x),
        z: number('z', GARBAGE_START.z),
        yaw: (number('yaw', (GARBAGE_START.yaw * 180) / Math.PI) * Math.PI) / 180,
        pitch: (number('pitch', (GARBAGE_START.pitch * 180) / Math.PI) * Math.PI) / 180,
      });
    } else if (state.active === 'readingroom') {
      setView({
        x: number('x', READINGROOM_START.x),
        z: number('z', READINGROOM_START.z),
        yaw: (number('yaw', (READINGROOM_START.yaw * 180) / Math.PI) * Math.PI) / 180,
        pitch: (number('pitch', (READINGROOM_START.pitch * 180) / Math.PI) * Math.PI) / 180,
      });
    } else if (state.active === 'lounge') {
      setView({
        x: number('x', LOUNGE_START.x),
        z: number('z', LOUNGE_START.z),
        yaw: (number('yaw', (LOUNGE_START.yaw * 180) / Math.PI) * Math.PI) / 180,
        pitch: (number('pitch', (LOUNGE_START.pitch * 180) / Math.PI) * Math.PI) / 180,
      });
    } else if (state.active === 'infirmary') {
      setView({
        x: number('x', INFIRMARY_START.x),
        z: number('z', INFIRMARY_START.z),
        yaw: (number('yaw', (INFIRMARY_START.yaw * 180) / Math.PI) * Math.PI) / 180,
        pitch: (number('pitch', (INFIRMARY_START.pitch * 180) / Math.PI) * Math.PI) / 180,
      });
    } else if (state.active === 'corridor') {
      setView({
        x: number('x', CORRIDOR_START.x),
        z: number('z', CORRIDOR_START.z),
        yaw: (number('yaw', (CORRIDOR_START.yaw * 180) / Math.PI) * Math.PI) / 180,
        pitch: (number('pitch', (CORRIDOR_START.pitch * 180) / Math.PI) * Math.PI) / 180,
      });
    } else if (state.active === 'residence') {
      setView({
        x: number('x', RESIDENCE_START.x),
        z: number('z', RESIDENCE_START.z),
        yaw: (number('yaw', (RESIDENCE_START.yaw * 180) / Math.PI) * Math.PI) / 180,
        pitch: (number('pitch', (RESIDENCE_START.pitch * 180) / Math.PI) * Math.PI) / 180,
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
        else if (state.active === 'lounge') loungeScene.setInteractive(id.trim(), true);
        else if (state.active === 'storage') storageScene.setInteractive(id.trim(), true);
        else if (state.active === 'garbage') garbageScene.setInteractive(id.trim(), true);
        else if (state.active === 'readingroom') readingroomScene.setInteractive(id.trim(), true);
        else if (state.active === 'infirmary') infirmaryScene.setInteractive(id.trim(), true);
        else if (state.active === 'corridor') corridorScene.setInteractive(id.trim(), true);
        else if (state.active === 'residence') residenceScene.setInteractive(id.trim(), true);
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
  coldStoreScene.scene.updateMatrixWorld(true);
  storageScene.scene.updateMatrixWorld(true);
  garbageScene.scene.updateMatrixWorld(true);
  readingroomScene.scene.updateMatrixWorld(true);
  loungeScene.scene.updateMatrixWorld(true);
  infirmaryScene.scene.updateMatrixWorld(true);
  corridorScene.scene.updateMatrixWorld(true);
  residenceScene.scene.updateMatrixWorld(true);
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

  const tabletApi = installTabletApi(window);
  window.__PREVIEW__ = {
    scene: activeScene().scene,
    camera,
    renderer,
    tablet: tabletApi,
    dorm: dormScene,
    dining: diningScene,
    kitchen: kitchenScene,
    coldstore: coldStoreScene,
    storage: storageScene,
    garbage: garbageScene,
    readingroom: readingroomScene,
    lounge: loungeScene,
    infirmary: infirmaryScene,
    corridor: corridorScene,
    residence: residenceScene,
    kitchenControls,
    coldStoreControls,
    storageControls,
    garbageControls,
    readingroomControls,
    loungeControls,
    infirmaryControls,
    corridorControls,
    residenceControls,
    getScene: () => state.active,
    setScene: (name) => setScene(name),
    setView,
    getView,
    resetView,
    transitionToScene,
    toggle: (id) => {
      if (state.active === 'dining') return diningScene.toggleInteractive(id);
      if (state.active === 'kitchen') return kitchenScene.toggleInteractive(id);
      if (state.active === 'coldstore') return coldStoreScene.toggleInteractive(id);
      if (state.active === 'storage') return storageScene.toggleInteractive(id);
      if (state.active === 'garbage') return garbageScene.toggleInteractive(id);
      if (state.active === 'readingroom') return readingroomScene.toggleInteractive(id);
      if (state.active === 'lounge') return loungeScene.toggleInteractive(id);
      if (state.active === 'infirmary') return infirmaryScene.toggleInteractive(id);
      if (state.active === 'corridor') return corridorScene.toggleInteractive(id);
      if (state.active === 'residence') return residenceScene.toggleInteractive(id);
      return dormScene.toggleInteractive(id);
    },
    setFrozen: (value) => setFrozen(Boolean(value), true),
    setClock: (h, m, s = 0) => (state.active === 'lounge' ? loungeScene.setClock(h, m, s) : diningScene.setClock(h, m, s)),
    getInteractives,
    getStats,
  };
  window.__PREVIEW_READY__ = true;
  window.__DORM_READY__ = true;
  window.__DINING_READY__ = true;
  window.__KITCHEN_READY__ = true;
  window.__COLDSTORE_READY__ = true;
  window.__STORAGE_READY__ = true;
  window.__GARBAGE_READY__ = true;
  window.__READINGROOM_READY__ = true;
  window.__LOUNGE_READY__ = true;
  window.__INFIRMARY_READY__ = true;
  window.__CORRIDOR_READY__ = true;
  window.__RESIDENCE_READY__ = true;
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
    if (requested === 'dining' || requested === 'dorm' || requested === 'kitchen' || requested === 'coldstore' || requested === 'storage' || requested === 'garbage' || requested === 'readingroom' || requested === 'lounge' || requested === 'infirmary' || requested === 'corridor' || requested === 'residence') {
      setScene(requested);
    }
  });
}

boot();
