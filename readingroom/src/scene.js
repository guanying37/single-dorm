import * as THREE from 'three';
import {
  ROOM,
  START,
  COLLIDERS,
  DOOR,
  SWITCH,
  PENDANT,
  CCTV,
  TABLE,
  BANKER_LAMP,
  LADDER,
  CONTENT_COUNTS,
} from './config.js';
import { createTextureSet } from './textures.js';
import { createMaterials } from './materials.js';
import { StaticBuilder, planeGeometry, damp, disposeObject } from './geometry.js';
import { buildRoom } from './room.js';
import { buildShelves } from './shelves.js';
import { buildFurniture } from './furniture.js';
import { buildProps } from './props.js';
import { CollisionWorld } from '../../dining/src/collision.js';

/* ------------------------------------------------------------------ *
 * 阅览室场景。
 *
 * 不依赖 DOM。用 renderer 构造，把 scene 交给宿主，逐帧 update(dt, t)。
 * 只有一盏垂直向下的方向光投影；三盏吊灯、三盏绿罩阅读灯、书架补光与门口补光，
 * 屏幕与灯具光晕全部是不投影的补光。灯泡、绿玻璃罩、开关、人字梯与
 * 地球仪是仅有的动态物体。
 * ------------------------------------------------------------------ */

const BULB_ON = new THREE.Color(0xffdfab);
const BULB_OFF = new THREE.Color(0x3a2f22);
const LAMP_ON = new THREE.Color(0xfff2cc);
const LAMP_OFF = new THREE.Color(0x5b6b4d);

const LAMP_BATCH_KEYS = ['greenGlass', 'lampBulb', 'lampGlow'];

export class ReadingRoomScene {
  constructor({ renderer = null, maxAnisotropy = 8 } = {}) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0907);
    this.root = new THREE.Group();
    this.root.name = 'reading-room';
    this.scene.add(this.root);

    this.textures = createTextureSet(maxAnisotropy);
    this.materials = createMaterials(this.textures);

    this.builder = new StaticBuilder();
    this.room = buildRoom(this.builder, this.materials, this.root, this.textures);
    this.shelves = buildShelves(this.builder, this.materials);
    this.root.add(this.shelves.ladder.group);
    this.furniture = buildFurniture(this.builder, this.materials, this.root);
    this.batches = this.builder.flush(this.root, this.materials, 'readingroom-static-batches');
    this.props = buildProps(this.root, this.materials, this.textures);

    this._setupEnvironment();
    this._setupLights();
    this._setupCollision();
    this._setupContactShadows();
    this._setupInteractables();

    this.elapsed = 0;
    this.lightOn = true;
    this.lightLevel = 1;
    this.tableLampsOn = true;
    this.tableLevel = 1;
    this.ladderOpen = false;
    this.scene.updateMatrixWorld(true);
    if (this.renderer) this.renderer.shadowMap.needsUpdate = true;

    this.cameraHome = Object.freeze({
      position: new THREE.Vector3(START.x, ROOM.eyeHeight, START.z),
      x: START.x,
      y: ROOM.eyeHeight,
      z: START.z,
      yaw: START.yaw,
      pitch: START.pitch,
      fov: START.fov,
    });

    this.stats = {
      batches: this.batches.group.children.length,
      triangles: this.batches.triangles,
      colliders: COLLIDERS.length,
    };
  }

  _setupEnvironment() {
    if (!this.renderer) return;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    pmrem.compileEquirectangularShader();
    this.environmentTarget = pmrem.fromEquirectangular(this.textures.environment);
    this.scene.environment = this.environmentTarget.texture;
    this.scene.environmentIntensity = 0.42;
    pmrem.dispose();
  }

  _setupLights() {
    const lights = new THREE.Group();
    lights.name = 'readingroom-lights';

    const hemisphere = new THREE.HemisphereLight(0xe8dcc4, 0x6e5238, 1.0);
    const ambient = new THREE.AmbientLight(0xffe8cc, 0.42);
    lights.add(hemisphere, ambient);

    // 唯一的投影主光，垂直向下；吊灯只是它的视觉解释。
    const key = new THREE.DirectionalLight(0xffe6c4, 1.06);
    key.position.set(0, 6.5, 0);
    key.target.position.set(0, 0, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -3.6;
    key.shadow.camera.right = 3.6;
    key.shadow.camera.top = 5.4;
    key.shadow.camera.bottom = -5.4;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 11;
    key.shadow.camera.up.set(0, 0, 1);
    key.shadow.bias = -0.00038;
    key.shadow.normalBias = 0.024;
    key.shadow.radius = 2.6;
    lights.add(key, key.target);

    // 北窗已完全封死：不设窗光，室内照明全部来自吊灯、桌灯与书架补光。

    const pendants = [];
    for (const z of PENDANT.zs) {
      const point = new THREE.PointLight(0xffc98c, 3.2, 6.8, 2);
      point.position.set(PENDANT.x, PENDANT.shadeBottom - 0.14, z);
      point.castShadow = false;
      lights.add(point);
      pendants.push(point);
    }

    const bankers = [];
    for (const table of TABLE.list) {
      const point = new THREE.PointLight(0xd8ecc0, 1.8, 3.3, 2);
      point.position.set(0, BANKER_LAMP.tableY + 0.32, table.z);
      point.castShadow = false;
      lights.add(point);
      bankers.push(point);
    }

    // 书架走道的低强度暖补光，避免书脊全黑。
    const shelfFills = [];
    for (const [x, z] of [
      [-2.2, -2.6],
      [2.2, -2.4],
      [-2.2, 1.6],
      [2.2, 1.4],
    ]) {
      const fill = new THREE.PointLight(0xffe0b4, 0.7, 3.6, 2);
      fill.position.set(x, 2.25, z);
      fill.castShadow = false;
      lights.add(fill);
      shelfFills.push(fill);
    }

    // 门口/衣帽架角落的暖补光，让入口与衣帽架可读。
    const entryFill = new THREE.PointLight(0xffd9ac, 0.5, 2.9, 2);
    entryFill.position.set(-2.0, 1.72, 4.15);
    entryFill.castShadow = false;
    lights.add(entryFill);

    this.lights = { hemisphere, ambient, key, pendants, bankers, shelfFills, entryFill };
    this.scene.add(lights);
  }

  _setupCollision() {
    this.collision = new CollisionWorld();
    for (const box of COLLIDERS) this.collision.addBox(box);
  }

  _setupContactShadows() {
    const rects = [];
    for (const run of [
      { side: -1, z0: -4.35, z1: -1.95 },
      { side: -1, z0: -1.35, z1: 1.05 },
      { side: -1, z0: 1.65, z1: 2.85 },
      { side: 1, z0: -3.75, z1: -1.35 },
      { side: 1, z0: -0.75, z1: 1.65 },
      { side: 1, z0: 2.25, z1: 3.45 },
    ]) {
      rects.push({
        x: run.side * 2.91,
        z: (run.z0 + run.z1) / 2,
        sx: 0.58,
        sz: run.z1 - run.z0 + 0.1,
        o: 0.42,
      });
    }
    for (const table of TABLE.list) {
      rects.push({ x: 0, z: table.z, sx: 1.15, sz: table.length + 0.16, o: 0.5 });
      for (const side of [-1, 1]) {
        for (const chairZ of table.chairZ) {
          rects.push({ x: side * TABLE.chairOffset, z: table.z + chairZ, sx: 0.6, sz: 0.6, o: 0.3 });
        }
      }
    }
    rects.push({ x: -0.675, z: -4.72, sx: 2.6, sz: 0.75, o: 0.36 });
    rects.push({ x: 2.35, z: -4.3, sx: 0.72, sz: 0.72, o: 0.3 });
    rects.push({ x: -2.72, z: 4.52, sx: 0.72, sz: 0.72, o: 0.3 });
    rects.push({ x: LADDER.x, z: LADDER.z, sx: 0.8, sz: 0.62, o: 0.28 });

    const geometry = planeGeometry(1, 1);
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
      map: this.textures.contactShadow,
      transparent: true,
      opacity: 0.78,
      color: 0x050403,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      toneMapped: false,
    });
    const instanced = new THREE.InstancedMesh(geometry, material, rects.length);
    const matrix = new THREE.Matrix4();
    rects.forEach((rect, index) => {
      matrix.compose(new THREE.Vector3(rect.x, 0.004, rect.z), new THREE.Quaternion(), new THREE.Vector3(rect.sx, 1, rect.sz));
      instanced.setMatrixAt(index, matrix);
    });
    instanced.instanceMatrix.needsUpdate = true;
    instanced.renderOrder = 1;
    instanced.name = 'readingroom-contact-shadows';
    instanced.frustumCulled = false;
    this.root.add(instanced);
    this.contactShadows = instanced;
  }

  _setupInteractables() {
    const batchMeshes = this.batches.group.children;
    const lampMeshes = batchMeshes.filter((mesh) => LAMP_BATCH_KEYS.some((key) => mesh.name === `static:${key}`));

    const doorItem = {
      id: DOOR.id,
      label: DOOR.label,
      sceneId: DOOR.sceneId,
      locked: true,
      portal: false,
      open: false,
      target: 0,
      hitRoots: [this.room.doorGroup],
    };
    const switchItem = {
      id: SWITCH.id,
      label: SWITCH.label,
      locked: false,
      portal: false,
      open: true,
      target: 1,
      hitRoots: [this.room.switchGroup],
    };
    const ladderItem = {
      id: LADDER.id,
      label: LADDER.label,
      locked: false,
      portal: false,
      open: false,
      target: 0,
      hitRoots: [this.shelves.ladder.group],
    };
    const tableLampItem = {
      id: BANKER_LAMP.id,
      label: BANKER_LAMP.label,
      locked: false,
      portal: false,
      open: true,
      target: 1,
      hitRoots: [],
      hitMeshes: lampMeshes,
    };

    this.interactives = [doorItem, switchItem, ladderItem, tableLampItem];
    this.interactiveById = new Map();
    this.interactiveMeshes = [];
    this.doorItem = doorItem;
    this.switchItem = switchItem;
    this.ladderItem = ladderItem;
    this.tableLampItem = tableLampItem;

    for (const entry of this.interactives) {
      this.interactiveById.set(entry.id, entry);
      for (const hitRoot of entry.hitRoots) {
        hitRoot.traverse((child) => {
          if (!child.isMesh) return;
          child.userData.interactiveId = entry.id;
          this.interactiveMeshes.push(child);
        });
      }
      for (const mesh of entry.hitMeshes || []) {
        mesh.userData.interactiveId = entry.id;
        this.interactiveMeshes.push(mesh);
      }
    }

    // 让取景/调试可以直接查桌灯、吊灯与 CRT。
    this.bankerBatchMeshes = lampMeshes;
  }

  update(dt, elapsed = 0) {
    this.elapsed = elapsed;
    this.props.update(elapsed);

    // 人字梯：两级框架绕顶部铰链开合。
    const targetAngle = this.ladderOpen ? LADDER.openAngle : LADDER.foldedAngle;
    this._ladderAngle = damp(this._ladderAngle ?? LADDER.foldedAngle, targetAngle, 9, dt);
    this.shelves.ladder.front.rotation.z = this._ladderAngle;
    this.shelves.ladder.back.rotation.z = -this._ladderAngle;

    // 开关拨片。
    const toggleTarget = this.switchItem.open ? -0.34 : 0.34;
    this.room.switchToggle.rotation.x = damp(this.room.switchToggle.rotation.x, toggleTarget, 14, dt);

    // 吊灯。
    const lightTarget = this.lightOn ? 1 : 0;
    this.lightLevel = damp(this.lightLevel, lightTarget, 6, dt);
    const flicker = 1 - 0.03 * Math.pow(Math.max(0, Math.sin(elapsed * 0.71 + 1.1)), 30);
    for (const pendant of this.lights.pendants) pendant.intensity = 3.2 * this.lightLevel * flicker;
    this.lights.key.intensity = 0.48 + 0.58 * this.lightLevel;
    this.lights.hemisphere.intensity = 0.82 + 0.18 * this.lightLevel;
    this.lights.ambient.intensity = 0.34 + 0.08 * this.lightLevel;
    for (const fill of this.lights.shelfFills) fill.intensity = 0.34 + 0.38 * this.lightLevel;
    this.lights.entryFill.intensity = 0.18 + 0.32 * this.lightLevel;
    this.materials.bulb.color.copy(BULB_OFF).lerp(BULB_ON, this.lightLevel);
    this.materials.shadeInner.emissiveIntensity = 0.1 + 0.36 * this.lightLevel;
    for (const pendant of this.room.pendants) {
      pendant.glowMaterial.opacity = 0.015 + 0.085 * this.lightLevel;
    }
    this.props.setLightLevel(this.lightLevel);

    // 绿罩阅读灯。
    const tableTarget = this.tableLampsOn ? 1 : 0;
    this.tableLevel = damp(this.tableLevel, tableTarget, 7, dt);
    for (const lamp of this.lights.bankers) lamp.intensity = 1.8 * this.tableLevel;
    this.materials.greenGlass.emissiveIntensity = 0.16 + 0.62 * this.tableLevel;
    this.materials.lampBulb.color.copy(LAMP_OFF).lerp(LAMP_ON, this.tableLevel);
    this.materials.lampGlow.opacity = 0.06 + 0.46 * this.tableLevel;
    this.props.setTableLevel(this.tableLevel);

    // CRT 监控：扫描带、屏幕呼吸与录像灯。
    const monitor = this.room.monitor;
    const travel = (elapsed * 0.13) % 1;
    monitor.band.position.y = CCTV.screenHeight * (0.52 - travel);
    monitor.bandMaterial.opacity = 0.09 + 0.07 * Math.sin(elapsed * 1.7);
    const screenFlicker = 0.94 + 0.06 * Math.sin(elapsed * 5.3) + 0.02 * Math.sin(elapsed * 23.7);
    monitor.screen.material.color.setRGB(screenFlicker, screenFlicker, screenFlicker * 0.98);
    const pulse = 0.5 + 0.5 * Math.sin(elapsed * 2.1);
    monitor.ledMaterial.color.setRGB(0.9 + pulse * 0.1, 0.18 + pulse * 0.14, 0.12 + pulse * 0.06);
    // 两台新监控的录像灯共用一个材质，一起呼吸。
    this.materials.ledRed.color.setRGB(0.9 + pulse * 0.1, 0.18 + pulse * 0.14, 0.12 + pulse * 0.06);

    // 地球仪缓慢自转。
    this.furniture.globe.spin.rotation.y = elapsed * 0.055;
  }

  toggleInteractive(id) {
    const item = this.interactiveById.get(id);
    if (!item) return null;
    if (item.locked) return item;
    item.open = !item.open;
    item.target = item.open ? 1 : 0;
    if (id === SWITCH.id) this.lightOn = item.open;
    if (id === BANKER_LAMP.id) this.tableLampsOn = item.open;
    if (id === LADDER.id) this.ladderOpen = item.open;
    return item;
  }

  setInteractive(id, value = true) {
    const item = this.interactiveById.get(id);
    if (!item) return null;
    if (item.locked) return item;
    item.open = Boolean(value);
    item.target = item.open ? 1 : 0;
    if (id === SWITCH.id) this.lightOn = item.open;
    if (id === BANKER_LAMP.id) this.tableLampsOn = item.open;
    if (id === LADDER.id) {
      this.ladderOpen = item.open;
      this._ladderAngle = this.ladderOpen ? LADDER.openAngle : LADDER.foldedAngle;
      this.shelves.ladder.front.rotation.z = this._ladderAngle;
      this.shelves.ladder.back.rotation.z = -this._ladderAngle;
    }
    return item;
  }

  getInteractiveState() {
    return this.interactives.map((item) => ({
      id: item.id,
      label: item.label,
      open: Boolean(item.open),
      locked: Boolean(item.locked),
      portal: Boolean(item.portal),
      sceneId: item.sceneId ?? null,
    }));
  }

  getInteractableMeshes() {
    return this.interactiveMeshes;
  }

  getStats() {
    return {
      batches: this.stats.batches,
      triangles: this.stats.triangles,
      colliders: this.stats.colliders,
      interactives: this.interactives.length,
      area: ROOM.width * ROOM.depth,
      ratio: '5:8',
      contents: { ...CONTENT_COUNTS },
      lightOn: this.lightOn,
      tableLampsOn: this.tableLampsOn,
      ladderOpen: this.ladderOpen,    };
  }

  dispose() {
    disposeObject(this.root);
    for (const texture of Object.values(this.textures)) {
      if (texture && texture.isTexture) texture.dispose();
    }
    if (this.environmentTarget) this.environmentTarget.dispose();
    for (const material of Object.values(this.materials)) {
      if (material && material.dispose) material.dispose();
    }
    this.scene.clear();
  }
}



