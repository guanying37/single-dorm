import * as THREE from 'three';
import {
  SHELL,
  START,
  MOVE,
  GATE,
  LOUNGE_PORTALS,
  FIXTURES,
  LIGHTING,
  STAIR,
} from './config.js';
import { createTextureSet } from './textures.js';
import { createMaterials } from './materials.js';
import { StaticBuilder, damp, disposeObject } from '../../shared/utils.js';
import { buildRoom, roomColliders } from './room.js';
import { CollisionWorld } from '../../shared/collision.js';
import { isTabletUnlocked, subscribeTablet } from '../../src/tablet.js';

/* ------------------------------------------------------------------ *
 * 住宿区 2F —— 场景工厂。
 *
 * 走廊/宿舍门/湿区/楼梯/电梯/铁栅栏/休息室入口；学生平板为全局状态，
 * 铁栅栏门由它控制。
 * ------------------------------------------------------------------ */

const NON_CASTING = new Set([
  'static:wallpaper',
  'static:wallpaperDamp',
  'static:marble',
  'static:marbleTrim',
  'static:tileWhite',
  'static:tileMint',
  'static:ceiling',
  'static:ceilingWhite',
  'static:trim',
  'static:fixtureGlow',
  'static:fixtureWarm',
  'static:fixtureDim',
  'static:fixtureFaulty',
  'static:fixtureDead',
  'static:screenGlow',
  'static:warmGlow',
  'static:coolGlow',
  'static:underGlow',
  'static:warmPanel',
  'static:mirror',
  'static:glass',
  'static:showerCurtain',
  'static:fireDoor',
  'static:metal',
  'static:liftSteel',
  'static:brass',
  'static:brassDark',
  'static:black',
  'static:bezel',
  'static:sensor',
  'static:red',
]);

export class ResidenceScene {
  constructor({ renderer = null, maxAnisotropy = 8 } = {}) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060606);
    this.root = new THREE.Group();
    this.root.name = 'residence';
    this.scene.add(this.root);

    this.textures = createTextureSet(maxAnisotropy);
    this.materials = createMaterials(this.textures);

    this.builder = new StaticBuilder();
    this.room = buildRoom(this.builder, this.materials);
    this.batches = this.builder.flush(this.root, this.materials, 'residence-static');
    for (const mesh of this.batches.group.children) {
      if (NON_CASTING.has(mesh.name)) mesh.castShadow = false;
    }

    this.root.add(this.room.hits);
    this.root.add(this.room.gate.group, this.room.gate.reader, this.room.stairDoor.group);
    this.room.gate.group.traverse((child) => {
      if (child.isMesh) child.castShadow = false;
    });
    this.room.stairDoor.group.traverse((child) => {
      if (child.isMesh) child.castShadow = false;
    });

    this.room.gate.led.material = this.materials.ledGreen.clone();
    this._prepareInteractables();
    this._syncTablet();
    this.unsubscribeTablet = subscribeTablet(() => {
      this._syncTablet();
      this.updateDynamicColliders();
    });

    this._setupEnvironment();
    this._setupLights();
    this._setupCollision();

    this.shadowDirty = true;
    this.elapsed = 0;
    this.scene.updateMatrixWorld(true);
    this.updateDynamicColliders();

    if (this.renderer) renderer.shadowMap.needsUpdate = true;

    this.cameraHome = {
      x: START.x,
      y: SHELL.eyeHeight,
      z: START.z,
      yaw: START.yaw,
      pitch: START.pitch,
      fov: START.fov,
    };
    this.stats = {
      batches: this.batches.group.children.length,
      triangles: this.batches.triangles,
      interactives: this.interactables.length,
    };
  }

  _prepareInteractables() {
    const items = [...this.room.interactables];
    if (this.room.stairDoor) items.push(this.room.stairDoor.item);

    const gateItem = {
      id: GATE.id,
      label: GATE.label,
      open: false,
      value: 0,
      target: 0,
      locked: false,
      requiresTablet: true,
      message: GATE.message,
      prompt: '需刷学生平板',
      hitRoots: [this.room.gate.group],
      apply(value) {
        this.gateGroup.rotation.y = -value * GATE.openAngle;
      },
      gateGroup: this.room.gate.group,
    };
    gateItem.apply = (value) => {
      this.room.gate.group.rotation.y = -value * GATE.openAngle;
    };
    items.push(gateItem);

    for (const proxy of this.room.proxies) {
      const item = {
        id: proxy.id,
        label: proxy.label,
        locked: proxy.locked,
        portal: Boolean(proxy.portal),
        sceneId: proxy.sceneId,
        message: proxy.message,
        prompt: proxy.prompt,
        open: false,
        value: 0,
        target: 0,
        hitRoots: [proxy.mesh],
        apply() {},
      };
      items.push(item);
    }

    this.interactables = items;
    this.interactiveById = new Map();
    this.interactiveMeshes = [];
    for (const item of items) {
      this.interactiveById.set(item.id, item);
      if (!item.hitRoots) continue;
      for (const hitRoot of item.hitRoots) {
        hitRoot.traverse((child) => {
          if (!child.isMesh) return;
          child.userData.interactiveId = item.id;
          this.interactiveMeshes.push(child);
        });
      }
      if (item.apply) item.apply(item.value ?? 0);
    }
  }

  _syncTablet() {
    const unlocked = isTabletUnlocked();
    const led = this.room.gate.led;
    if (led?.material) {
      led.material.color.setHex(unlocked ? 0x1d3a22 : 0x3a1512);
      led.material.emissive.setHex(unlocked ? 0x54ff7a : 0xff3a2a);
      led.material.emissiveIntensity = unlocked ? 2.2 : 1.6;
    }
    const gate = this.interactiveById?.get(GATE.id);
    if (gate) {
      gate.locked = false;
      gate.requiresTablet = true;
      if (!unlocked && gate.open) {
        gate.open = false;
        gate.target = 0;
      }
    }
    this.tabletUnlocked = unlocked;
  }

  _setupEnvironment() {
    if (!this.renderer) return;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    pmrem.compileEquirectangularShader();
    this.environmentTarget = pmrem.fromEquirectangular(this.textures.environment);
    this.scene.environment = this.environmentTarget.texture;
    this.scene.environmentIntensity = 0.52;
    pmrem.dispose();
  }

  _setupLights() {
    const lights = new THREE.Group();
    lights.name = 'residence-lights';
    const hemisphere = new THREE.HemisphereLight(0x8e7a62, 0x0d0b09, LIGHTING.hemisphere);
    const ambient = new THREE.AmbientLight(0xffd9b4, LIGHTING.ambient);
    lights.add(hemisphere, ambient);

    const key = new THREE.DirectionalLight(0xffe8cc, LIGHTING.keyIntensity);
    key.position.set(28, 32, 15);
    key.target.position.set(28, 0, 15);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -30;
    key.shadow.camera.right = 30;
    key.shadow.camera.top = 18;
    key.shadow.camera.bottom = -18;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 64;
    key.shadow.camera.up.set(0, 0, 1);
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.035;
    lights.add(key, key.target);

    for (const fixture of FIXTURES) {
      const isCool = fixture.kind === 'cool';
      const isStair = fixture.id === 'light.stair';
      const isLift = fixture.id === 'light.lift';
      const intensity = isStair
        ? LIGHTING.stairFixture
        : isLift
          ? LIGHTING.liftFixture
          : isCool
            ? LIGHTING.wetFixture
            : LIGHTING.corridorFixture;
      const distance = isCool ? LIGHTING.wetDistance : LIGHTING.corridorDistance;
      const light = new THREE.PointLight(isCool ? 0xd8f0ec : 0xffcf9e, intensity, distance, 2);
      light.position.set(fixture.x, isCool ? 2.75 : 2.95, fixture.z);
      light.castShadow = false;
      lights.add(light);
    }

    // 休息室门洞的暖光、铁栅栏门顶光、湿区更衣室的补光。
    const accents = [
      { x: 10.2, y: 2.25, z: 7.7, color: 0xffb877, intensity: 3.4, distance: 5.0 },
      { x: 50.7, y: 2.4, z: 14.55, color: 0xffc998, intensity: 3.6, distance: 5.5 },
      { x: 54.0, y: 2.35, z: 25.6, color: 0xffc998, intensity: 3.2, distance: 4.6 },
    ];
    for (const accent of accents) {
      const light = new THREE.PointLight(accent.color, accent.intensity, accent.distance, 2);
      light.position.set(accent.x, accent.y, accent.z);
      lights.add(light);
    }

    this.lights = { hemisphere, ambient, key };
    this.scene.add(lights);
  }

  _setupCollision() {
    this.collision = new CollisionWorld();
    for (const box of roomColliders()) this.collision.addBox(box);
    this.gateCollider = this.collision.addBox({
      x: GATE.x0 + (GATE.width - GATE.gateWidth) / 2 + GATE.gateWidth / 2,
      z: GATE.z,
      hx: GATE.gateWidth / 2,
      hz: 0.03,
      rot: 0,
    });
    this.stairDoorCollider = this.collision.addBox({
      x: STAIR.doorX,
      z: STAIR.z0 + 0.06,
      hx: STAIR.doorWidth / 2,
      hz: 0.03,
      rot: 0,
    });
    this.updateDynamicColliders();
  }

  updateDynamicColliders() {
    const gate = this.interactiveById?.get(GATE.id);
    if (gate && this.gateCollider) {
      const angle = -gate.value * GATE.openAngle;
      const hingeX = GATE.x0 + (GATE.width - GATE.gateWidth) / 2;
      this.gateCollider.x = hingeX + Math.cos(angle) * (GATE.gateWidth / 2);
      this.gateCollider.z = GATE.z - Math.sin(angle) * (GATE.gateWidth / 2);
      this.gateCollider.rot = angle;
    }
    const stair = this.room.stairDoor?.item;
    if (stair && this.stairDoorCollider) {
      const angle = -stair.value * STAIR.openAngle;
      const hingeX = STAIR.doorX - STAIR.doorWidth / 2;
      this.stairDoorCollider.x = hingeX + Math.cos(angle) * (STAIR.doorWidth / 2);
      this.stairDoorCollider.z = STAIR.z0 + 0.06 - Math.sin(angle) * (STAIR.doorWidth / 2);
      this.stairDoorCollider.rot = angle;
    }
  }

  toggleInteractive(id) {
    const item = this.interactiveById.get(id);
    if (!item) return null;
    if (item.sceneId === 'lounge') {
      return { sceneId: 'lounge', label: item.label, portal: true };
    }
    if (item.requiresTablet && !isTabletUnlocked()) {
      if (id === GATE.id) item.flash = 1;
      return { locked: true, tablet: true, id, label: item.label, message: GATE.message, prompt: '需刷学生平板' };
    }
    if (item.locked) {
      return { locked: true, id, label: item.label, message: item.message, prompt: item.prompt };
    }
    item.open = !item.open;
    item.target = item.open ? 1 : 0;
    return item;
  }

  setInteractive(id, open) {
    const item = this.interactiveById.get(id);
    if (!item || item.locked || item.portal) return null;
    item.open = Boolean(open);
    item.target = item.open ? 1 : 0;
    item.value = item.target;
    if (item.apply) item.apply(item.value);
    this.updateDynamicColliders();
    return item;
  }

  getInteractiveState() {
    return this.interactables.map((item) => ({
      id: item.id,
      label: item.label,
      open: Boolean(item.open),
      locked: Boolean(item.locked),
      requiresTablet: Boolean(item.requiresTablet),
      portal: Boolean(item.portal),
      sceneId: item.sceneId ?? null,
      value: typeof item.value === 'number' ? Number(item.value.toFixed(3)) : null,
    }));
  }

  getInteractableMeshes() {
    return this.interactiveMeshes;
  }

  getStats() {
    return {
      batches: this.stats.batches,
      triangles: this.stats.triangles,
      interactives: this.stats.interactives,
      tabletUnlocked: isTabletUnlocked(),
      gateOpen: Boolean(this.interactiveById.get(GATE.id)?.open),
    };
  }

  update(dt, elapsed = 0) {
    this.elapsed = elapsed;
    for (const item of this.interactables) {
      if (!item.apply) continue;
      if (Math.abs(item.target - item.value) > 0.0004) {
        item.value = damp(item.value, item.target, 5.6, dt);
        if (Math.abs(item.target - item.value) < 0.0015) item.value = item.target;
        item.apply(item.value);
        this.updateDynamicColliders();
      }
    }

    if (this.shadowDirty && this.renderer) {
      this.renderer.shadowMap.needsUpdate = true;
      this.shadowDirty = false;
    }
  }

  dispose() {
    this.unsubscribeTablet?.();
    disposeObject(this.root);
    this.textures.environment?.dispose();
    if (this.environmentTarget) this.environmentTarget.dispose();
    this.scene.clear();
    this.interactiveMeshes.length = 0;
    this.interactables.length = 0;
  }
}
