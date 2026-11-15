import * as THREE from 'three';
import { HALL, START, SIDEBOARD, TABLES, CEILING } from './config.js';
import { createTextureSet } from './textures.js';
import { createMaterials } from './materials.js';
import { StaticBuilder, damp, disposeObject, planeGeometry } from './utils.js';
import { buildRoom } from './room.js';
import { buildDecor } from './decor.js';
import { buildFurniture } from './furniture.js';
import { CollisionWorld } from './collision.js';

/* ------------------------------------------------------------------ *
 * Dining hall scene factory.
 *
 * The class owns geometry, lights, interactives and collision, and has
 * no DOM dependency. A host page (or a game engine) can instantiate it,
 * add `scene` to a renderer, and call `update(dt, elapsed)`.
 * ------------------------------------------------------------------ */

export class DiningHallScene {
  constructor({ renderer = null, maxAnisotropy = 8 } = {}) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x171310);
    this.root = new THREE.Group();
    this.root.name = 'dining-hall';
    this.scene.add(this.root);

    this.textures = createTextureSet(maxAnisotropy);
    this.materials = createMaterials(this.textures);

    this.builder = new StaticBuilder();
    this.room = buildRoom(this.builder, this.materials);
    this.root.add(
      this.room.doorGroups.left,
      this.room.doorGroups.right,
      this.room.doorGroups.kitchen,
      this.room.doorGroups.restroom,
    );

    this.decor = buildDecor(this.builder, this.materials, this.root);
    this.furniture = buildFurniture(this.builder, this.materials, this.root);

    this.batches = this.builder.flush(this.root, this.materials, 'static-batches');

    this.interactives = [...this.room.interactables, ...this.furniture.interactables];
    this.interactiveById = new Map();
    this.interactiveMeshes = [];
    for (const item of this.interactives) {
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

    this._setupEnvironment();
    this._setupLights();
    this._setupCollision();
    this._setupContactShadows();
    this._setupFixtureGlow();

    this.shadowDirty = true;
    this.elapsed = 0;
    this.scene.updateMatrixWorld(true);
    this.updateDynamicColliders();

    if (this.renderer) this.renderer.shadowMap.needsUpdate = true;

    this.cameraHome = {
      x: START.x,
      y: HALL.eyeHeight,
      z: START.z,
      yaw: START.yaw,
      pitch: START.pitch,
      fov: START.fov,
    };
    this.stats = {
      tables: this.furniture.tableCount,
      batches: this.batches.group.children.length,
      triangles: this.batches.triangles,
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
    lights.name = 'hall-lights';

    const hemisphere = new THREE.HemisphereLight(0xfff6e8, 0x8a7861, 0.4);
    const ambient = new THREE.AmbientLight(0xfff2e1, 0.16);
    lights.add(hemisphere, ambient);

    // One soft directional key carries the room's shadow language. It
    // points straight down from the ceiling plane so every shadow falls
    // under the object that casts it, matching the visible fixtures.
    const key = new THREE.DirectionalLight(0xfff6ea, 0.72);
    key.position.set(0, 22, 0);
    key.target.position.set(0, 0, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -22;
    key.shadow.camera.right = 22;
    key.shadow.camera.top = 16;
    key.shadow.camera.bottom = -16;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 48;
    key.shadow.camera.up.set(0, 0, 1);
    key.shadow.bias = -0.00035;
    key.shadow.normalBias = 0.03;
    lights.add(key, key.target);

    // Three ceiling spots shape the warm pools over the tables. The
    // directional key owns all cast shadows, so the spots stay
    // non-shadowing and the frame cost stays low.
    const spots = [];
    for (const x of [-11, 0, 11]) {
      const spot = new THREE.SpotLight(0xfff5e8, 185, 14, 1.18, 0.9, 2);
      spot.position.set(x, 4.15, 0);
      spot.target.position.set(x, 0, 0);
      spot.castShadow = false;
      lights.add(spot, spot.target);
      spots.push(spot);
    }

    // Wall washers on the long walls: no shadow maps, just soft scallops
    // that make the white plaster read as a surface rather than a fill.
    const washers = [];
    for (const side of [-1, 1]) {
      for (const x of [-9, 9]) {
        const wash = new THREE.SpotLight(0xfffaf2, 19, 8, 1.05, 0.94, 2);
        wash.position.set(x, 4.03, side * 9.7);
        wash.target.position.set(x, 1.35, side * 10.98);
        wash.castShadow = false;
        lights.add(wash, wash.target);
        washers.push(wash);
      }
    }

    const corridor = new THREE.PointLight(
      this.room.corridorLight.color,
      this.room.corridorLight.intensity,
      this.room.corridorLight.distance,
      2,
    );
    corridor.position.copy(this.room.corridorLight.position);
    lights.add(corridor);

    this.lights = { hemisphere, ambient, spots, washers, corridor, key };
    this.scene.add(lights);
  }

  _setupCollision() {
    this.collision = new CollisionWorld();
    for (const box of this.room.colliders) this.collision.addBox(box);
    for (const box of this.furniture.colliders) {
      if (box.dynamic) continue;
      this.collision.addBox(box);
    }
    for (const plant of this.decor.plants) {
      this.collision.addCircle(plant.x, plant.z, 0.72);
    }

    const box = (x, z, hx, hz, rot = 0) => this.collision.addBox({ x, z, hx, hz, rot });

    // Main door leaves: two oriented boxes updated from the animation.
    this.dynamic = {
      main: [box(-1.37, 10.9, 0.7, 0.05), box(1.37, 10.9, 0.7, 0.05)],
      sideboardDoors: [box(-17.3, 1.2, 0.6, 0.025, Math.PI / 2), box(-17.3, -1.2, 0.6, 0.025, Math.PI / 2)],
      drawers: [box(-17.5, 0, 0.22, 0.56), box(-17.5, 0, 0.22, 0.56), box(-17.5, 0, 0.22, 0.56)],
    };
  }

  _setupContactShadows() {
    const geometry = planeGeometry(1, 1);
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
      map: this.textures.contactShadow,
      transparent: true,
      opacity: 0.72,
      color: 0x1a1109,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      toneMapped: false,
    });

    const count = TABLES.length + 1 + this.decor.plants.length;
    const instanced = new THREE.InstancedMesh(geometry, material, count);
    const matrix = new THREE.Matrix4();
    TABLES.forEach((table, index) => {
      matrix.compose(
        new THREE.Vector3(table.x, 0.004, table.z),
        new THREE.Quaternion(),
        new THREE.Vector3(3.5, 1, 3.1),
      );
      instanced.setMatrixAt(index, matrix);
    });
    matrix.compose(
      new THREE.Vector3(SIDEBOARD.position.x + 0.05, 0.004, SIDEBOARD.position.z),
      new THREE.Quaternion(),
      new THREE.Vector3(1.3, 1, 4.3),
    );
    instanced.setMatrixAt(TABLES.length, matrix);
    this.decor.plants.forEach((plant, index) => {
      matrix.compose(
        new THREE.Vector3(plant.x, 0.004, plant.z),
        new THREE.Quaternion(),
        new THREE.Vector3(1.15, 1, 1.15),
      );
      instanced.setMatrixAt(TABLES.length + 1 + index, matrix);
    });
    instanced.instanceMatrix.needsUpdate = true;
    instanced.renderOrder = 1;
    instanced.name = 'contact-shadows';
    instanced.frustumCulled = false;
    this.root.add(instanced);
    this.contactShadows = instanced;
  }

  _setupFixtureGlow() {
    const geometry = planeGeometry(2.3, 1.0);
    geometry.rotateX(Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
      map: this.textures.glow,
      color: 0xfff3dd,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const count = CEILING.lightRows.length * CEILING.lightColumns.length;
    const instanced = new THREE.InstancedMesh(geometry, material, count);
    const matrix = new THREE.Matrix4();
    let index = 0;
    for (const z of CEILING.lightRows) {
      for (const x of CEILING.lightColumns) {
        matrix.compose(
          new THREE.Vector3(x, 4.108, z),
          new THREE.Quaternion(),
          new THREE.Vector3(1, 1, 1),
        );
        instanced.setMatrixAt(index, matrix);
        index += 1;
      }
    }
    instanced.instanceMatrix.needsUpdate = true;
    instanced.name = 'fixture-glow';
    instanced.frustumCulled = false;
    instanced.renderOrder = 2;
    this.root.add(instanced);
  }

  updateDynamicColliders() {
    const { doorState } = this.room;

    const updateLeaf = (entry, hinge, angle, direction) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const half = doorState.halfLeaf;
      entry.x = hinge.x + direction * cos * half;
      entry.z = hinge.z - direction * sin * half;
      entry.rot = angle;
      entry.hx = half;
      entry.hz = doorState.halfThickness;
    };
    updateLeaf(this.dynamic.main[0], doorState.hingeLeft, doorState.angleLeft, 1);
    updateLeaf(this.dynamic.main[1], doorState.hingeRight, doorState.angleRight, -1);

    const sideboard = this.furniture.sideboard;
    const leftHinge = new THREE.Vector3(-1.79, 0.16, 0.274);
    const rightHinge = new THREE.Vector3(1.79, 0.16, 0.274);
    sideboard.group.updateMatrixWorld(true);
    leftHinge.applyMatrix4(sideboard.group.matrixWorld);
    rightHinge.applyMatrix4(sideboard.group.matrixWorld);

    const updateSideboardDoor = (entry, hinge, door, direction) => {
      const angle = SIDEBOARD.rotationY + door.rotation.y;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const half = 0.58;
      entry.x = hinge.x + direction * cos * half;
      entry.z = hinge.z - direction * sin * half;
      entry.rot = angle;
      entry.hx = half;
      entry.hz = 0.024;
    };
    updateSideboardDoor(this.dynamic.sideboardDoors[0], leftHinge, sideboard.doors.left, 1);
    updateSideboardDoor(this.dynamic.sideboardDoors[1], rightHinge, sideboard.doors.right, -1);

    sideboard.drawers.forEach((drawer, index) => {
      const local = new THREE.Vector3(0, 0.16, drawer.position.z - 0.21);
      local.applyMatrix4(sideboard.group.matrixWorld);
      const entry = this.dynamic.drawers[index];
      entry.x = local.x;
      entry.z = local.z;
      entry.hx = 0.21;
      entry.hz = 0.56;
      entry.rot = 0;
    });
  }

  toggleInteractive(id) {
    const item = this.interactiveById.get(id);
    if (!item) return null;
    if (item.locked) {
      item.jiggle = 1;
      return { locked: true, id, label: item.label, sceneId: item.sceneId };
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
    return item;
  }

  getInteractiveState() {
    return this.interactives.map((item) => ({
      id: item.id,
      label: item.label,
      open: Boolean(item.open),
      locked: Boolean(item.locked),
      value: typeof item.value === 'number' ? Number(item.value.toFixed(3)) : null,
      sceneId: item.sceneId ?? null,
    }));
  }

  getInteractableMeshes() {
    return this.interactiveMeshes;
  }

  setClock(hour, minute, second = 0) {
    this.decor.setTime(hour, minute, second);
  }

  getClock() {
    return this.decor.getTime();
  }

  update(dt, elapsed = 0) {
    this.elapsed = elapsed;

    for (const item of this.interactives) {
      if (item.locked) {
        if (item.jiggle > 0 && item.handle) {
          item.jiggle = Math.max(0, item.jiggle - dt * 2.4);
          item.handle.rotation.z = Math.sin(elapsed * 52) * 0.14 * item.jiggle;
        }
        continue;
      }
      if (!item.apply) continue;
      if (Math.abs(item.target - item.value) > 0.0004) {
        item.value = damp(item.value, item.target, 6.2, dt);
        if (Math.abs(item.target - item.value) < 0.0015) item.value = item.target;
        item.apply(item.value);
      }
    }

    this.updateDynamicColliders();
    this.decor.update(dt, elapsed);

    if (this.materials.ledRed) {
      this.materials.ledRed.emissiveIntensity = 2.2 + Math.pow(0.5 + 0.5 * Math.sin(elapsed * 2.2), 6) * 1.2;
    }

    // Animated doors and drawers are deliberately excluded from the
    // static shadow bake, so the one 2048 shadow map is rendered once.
    if (this.shadowDirty && this.renderer) {
      this.renderer.shadowMap.needsUpdate = true;
      this.shadowDirty = false;
    }
  }

  getStats() {
    return {
      tables: this.stats.tables,
      batches: this.stats.batches,
      triangles: this.stats.triangles,
      interactives: this.interactives.length,
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
    this.interactives.length = 0;
  }
}
