import * as THREE from 'three';
import { ROOM, CEILING, CLOCK, TABLE, START } from './config.js';
import { createTextureSet } from './textures.js';
import { createMaterials } from './materials.js';
import { StaticBuilder, damp, disposeObject, planeGeometry } from './utils.js';
import { buildRoom, roomColliders } from './room.js';
import { buildDecor } from './decor.js';
import { buildFurniture } from './furniture.js';
import { buildGames } from './games.js';
import { CollisionWorld } from './collision.js';

/* ------------------------------------------------------------------ *
 * 生活区二层休息厅 —— 场景工厂。
 *
 * 负责几何装配、灯光、碰撞、交互与统计；不碰 DOM。宿主页面（同页切换
 * 或独立预览页）只需要 scene / collision / update / toggleInteractive。
 * ------------------------------------------------------------------ */

export class LoungeScene {
  constructor({ renderer = null, maxAnisotropy = 8 } = {}) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x120f12);
    this.root = new THREE.Group();
    this.root.name = 'lounge';
    this.scene.add(this.root);

    this.textures = createTextureSet(maxAnisotropy);
    this.materials = createMaterials(this.textures);

    this.builder = new StaticBuilder();
    this.room = buildRoom(this.builder, this.materials, this.textures);
    this.furniture = buildFurniture(this.builder);
    buildGames(this.builder);
    this.decor = buildDecor(this.builder, this.materials, this.root);

    this.batches = this.builder.flush(this.root, this.materials, 'lounge-static');
    // 房间壳只接收阴影，不参与投影：省下阴影 pass 的绘制，也避免
    // 顶光在墙面上投出自己不该有的硬边。
    const nonCasting = new Set([
      'static:wall',
      'static:ceiling',
      'static:ceilingTray',
      'static:ceilingFascia',
      'static:ceilingBeam',
      'static:trim',
      'static:carpet',
      'static:carpetBorder',
      'static:crystal',
    ]);
    for (const mesh of this.batches.group.children) {
      if (nonCasting.has(mesh.name)) mesh.castShadow = false;
    }
    this.root.add(this.room.root);

    this.interactables = [...this.room.interactables];
    this.interactiveById = new Map();
    this.interactiveMeshes = [];
    for (const item of this.interactables) {
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
    this._prepareReaderLeds();

    this._setupEnvironment();
    this._setupLights();
    this._setupCollision();
    this._setupContactShadows();

    this.clockSeconds = CLOCK.hour * 3600 + CLOCK.minute * 60 + CLOCK.second;
    this.decor.clock.setTime(CLOCK.hour, CLOCK.minute, CLOCK.second);

    this.shadowDirty = true;
    this.elapsed = 0;
    this.scene.updateMatrixWorld(true);
    this.updateDynamicColliders();

    if (this.renderer) this.renderer.shadowMap.needsUpdate = true;

    this.cameraHome = {
      x: START.x,
      y: ROOM.eyeHeight,
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

  _prepareReaderLeds() {
    for (const reader of this.room.readerGroups) {
      reader.red.material = this.materials.ledRed.clone();
      reader.green.material = this.materials.ledGreen.clone();
      reader.item.redMaterial = reader.red.material;
      reader.item.greenMaterial = reader.green.material;
    }
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
    lights.name = 'lounge-lights';

    const hemisphere = new THREE.HemisphereLight(0xfff4e6, 0x7d6a58, 0.56);
    const ambient = new THREE.AmbientLight(0xfff2e2, 0.2);
    lights.add(hemisphere, ambient);

    // 唯一投影主光：垂直向下，影子落在物体脚下。
    const key = new THREE.DirectionalLight(0xfff4e6, 0.98);
    key.position.set(0, 22, 0);
    key.target.position.set(0, 0, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -18;
    key.shadow.camera.right = 18;
    key.shadow.camera.top = 7;
    key.shadow.camera.bottom = -7;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 46;
    key.shadow.camera.up.set(0, 0, 1);
    key.shadow.bias = -0.0003;
    key.shadow.normalBias = 0.028;
    lights.add(key, key.target);

    // 5 盏吊灯只做白色光池，不投影。
    const chandelierSpots = [];
    for (const chandelier of CEILING.chandeliers) {
      const spot = new THREE.SpotLight(0xfff6ea, 132, 11, 1.04, 0.94, 2);
      spot.position.set(chandelier.x, chandelier.y - 0.35, chandelier.z);
      spot.target.position.set(chandelier.x, 0, chandelier.z);
      spot.castShadow = false;
      lights.add(spot, spot.target);
      chandelierSpots.push(spot);
    }

    // 2 台老式吊扇的暖黄光。
    const fanLights = [];
    for (const fan of CEILING.fans) {
      const light = new THREE.PointLight(0xffbf76, 5.8, 7.5, 2);
      light.position.set(fan.x, 2.78, fan.z);
      light.castShadow = false;
      lights.add(light);
      fanLights.push(light);
    }

    // 门外楼梯厅暖光。
    const landing = new THREE.PointLight(0xffc07c, 3.3, 6.2, 2);
    landing.position.copy(this.room.landing.center);
    landing.castShadow = false;
    lights.add(landing);

    this.lights = { hemisphere, ambient, key, chandelierSpots, fanLights, landing };
    this.scene.add(lights);
  }

  _setupCollision() {
    this.collision = new CollisionWorld();
    for (const box of roomColliders()) this.collision.addBox(box);
    for (const collider of this.furniture.colliders) {
      if (collider.shape === 'circle') {
        this.collision.addCircle(collider.x, collider.z, collider.radius);
      } else {
        this.collision.addBox({
          x: collider.x,
          z: collider.z,
          hx: collider.hx,
          hz: collider.hz,
          rot: collider.rot,
        });
      }
    }

    const box = (x, z, hx, hz, rot = 0) => this.collision.addBox({ x, z, hx, hz, rot });
    this.dynamic = {
      left: box(-15.28, -0.7, 0.7, 0.03),
      right: box(-15.28, 0.7, 0.7, 0.03),
    };
  }

  _setupContactShadows() {
    const geometry = planeGeometry(1, 1);
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
      map: this.textures.contactShadow,
      transparent: true,
      opacity: 0.66,
      color: 0x1a0710,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      toneMapped: false,
    });

    const count = 1 + this.furniture.sofas.length + this.furniture.consoles.length;
    const instanced = new THREE.InstancedMesh(geometry, material, count);
    const matrix = new THREE.Matrix4();
    matrix.compose(new THREE.Vector3(TABLE.x, 0.006, TABLE.z), new THREE.Quaternion(), new THREE.Vector3(7.6, 1, 7.6));
    instanced.setMatrixAt(0, matrix);

    let index = 1;
    for (const sofa of this.furniture.sofas) {
      matrix.compose(
        new THREE.Vector3(sofa.x, 0.006, sofa.z),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), sofa.rotY),
        new THREE.Vector3(sofa.width + 0.5, 1, 1.5),
      );
      instanced.setMatrixAt(index, matrix);
      index += 1;
    }
    for (const console of this.furniture.consoles) {
      matrix.compose(
        new THREE.Vector3(console.x, 0.006, console.z),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), console.rotY),
        new THREE.Vector3(1.5, 1, 0.8),
      );
      instanced.setMatrixAt(index, matrix);
      index += 1;
    }
    instanced.instanceMatrix.needsUpdate = true;
    instanced.renderOrder = 1;
    instanced.name = 'contact-shadows';
    instanced.frustumCulled = false;
    this.root.add(instanced);
    this.contactShadows = instanced;
  }

  updateDynamicColliders() {
    const main = this.room.doorGroups.main;
    const leftAngle = main.left.rotation.y;
    const rightAngle = main.right.rotation.y;

    // 左扇：铰链 z=-1.4，几何沿 +Z 生长。
    const left = this.dynamic.left;
    left.x = main.hingeX + Math.sin(leftAngle) * main.halfLeaf;
    left.z = -1.4 + Math.cos(leftAngle) * main.halfLeaf;
    left.rot = Math.PI / 2 - leftAngle;
    left.hx = main.halfLeaf;
    left.hz = main.halfThickness;

    // 右扇：铰链 z=+1.4，几何沿 -Z 生长。
    const right = this.dynamic.right;
    right.x = main.hingeX - Math.sin(rightAngle) * main.halfLeaf;
    right.z = 1.4 - Math.cos(rightAngle) * main.halfLeaf;
    right.rot = rightAngle - Math.PI / 2;
    right.hx = main.halfLeaf;
    right.hz = main.halfThickness;
  }

  toggleInteractive(id) {
    const item = this.interactiveById.get(id);
    if (!item) return null;
    if (item.locked) {
      if (item.flash !== undefined) {
        item.flash = 1;
        if (item.greenMaterial) item.greenMaterial.emissiveIntensity = 0.25;
      }
      if (item.handle) item.jiggle = 1;
      return { locked: true, id, label: item.label, message: item.message, prompt: item.prompt };
    }
    item.open = !item.open;
    item.target = item.open ? 1 : 0;
    return item;
  }

  setInteractive(id, open) {
    const item = this.interactiveById.get(id);
    if (!item || item.locked) return null;
    item.open = Boolean(open);
    item.target = item.open ? 1 : 0;
    if (item.apply) item.apply(item.target);
    this.updateDynamicColliders();
    return item;
  }

  getInteractiveState() {
    return this.interactables.map((item) => ({
      id: item.id,
      label: item.label,
      open: Boolean(item.open),
      locked: Boolean(item.locked),
      message: item.message ?? null,
      value: typeof item.value === 'number' ? Number(item.value.toFixed(3)) : null,
    }));
  }

  getInteractableMeshes() {
    return this.interactiveMeshes;
  }

  setClock(hour, minute, second = 0) {
    this.clockSeconds = ((hour % 24) + 24) % 24 * 3600 + Math.max(0, Math.min(59.999, minute)) * 60 + Math.max(0, Math.min(59.999, second));
    this.decor.clock.setTime(hour, minute, second);
  }

  getClock() {
    return this.decor.clock.getTime();
  }

  update(dt, elapsed = 0) {
    this.elapsed = elapsed;

    for (const item of this.interactables) {
      if (item.locked) {
        if (item.jiggle > 0 && item.handle) {
          item.jiggle = Math.max(0, item.jiggle - dt * 2.6);
          item.handle.rotation.z = Math.sin(elapsed * 46) * 0.12 * item.jiggle;
        }
        if (item.flash > 0) {
          item.flash = Math.max(0, item.flash - dt * 1.6);
          const blink = 0.6 + Math.abs(Math.sin(elapsed * 18)) * 2.6 * item.flash;
          if (item.redMaterial) item.redMaterial.emissiveIntensity = blink;
          if (item.greenMaterial) item.greenMaterial.emissiveIntensity = 0.3 + (1 - item.flash) * 1.7;
          if (item.screen) item.screen.material.opacity = 0.55 + 0.35 * Math.sin(elapsed * 9);
        }
        continue;
      }
      if (!item.apply) continue;
      if (Math.abs(item.target - item.value) > 0.0004) {
        item.value = damp(item.value, item.target, 6.4, dt);
        if (Math.abs(item.target - item.value) < 0.0015) item.value = item.target;
        item.apply(item.value);
      }
    }

    this.updateDynamicColliders();

    // 吊扇转子。
    for (const fan of this.decor.fans) fan.rotor.rotation.y += dt * 2.35;

    // 挂钟连续走秒（可随时 setClock 重新对时）。
    this.clockSeconds += dt;
    const total = this.clockSeconds % 86400;
    this.decor.clock.setTime(Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60);

    // 监控红灯呼吸。
    if (this.materials.ledRed) {
      this.materials.ledRed.emissiveIntensity = 1.6 + Math.pow(0.5 + 0.5 * Math.sin(elapsed * 2.1), 6) * 1.4;
    }

    if (this.shadowDirty && this.renderer) {
      this.renderer.shadowMap.needsUpdate = true;
      this.shadowDirty = false;
    }
  }

  getStats() {
    return {
      batches: this.stats.batches,
      triangles: this.stats.triangles,
      interactives: this.stats.interactives,
      clock: this.getClock(),
    };
  }

  dispose() {
    disposeObject(this.root);
    this.textures.environment?.dispose();
    this.textures.contactShadow?.dispose();
    if (this.environmentTarget) this.environmentTarget.dispose();
    this.scene.clear();
    this.interactiveMeshes.length = 0;
    this.interactables.length = 0;
  }
}
