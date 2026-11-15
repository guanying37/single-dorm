import * as THREE from 'three';
import { ROOM, START, COLLIDERS, CEILING } from './config.js';
import { createTextureSet } from './textures.js';
import { createMaterials } from './materials.js';
import { StaticBuilder, planeGeometry, disposeObject } from './geometry.js';
import { buildRoom } from './room.js';
import { buildEquipment } from './equipment.js';
import { buildProps } from './props.js';
import { CollisionWorld } from '../../dining/src/collision.js';

/* ------------------------------------------------------------------ *
 * Restaurant kitchen scene.
 *
 * No DOM dependency. Construct with a renderer, add `scene` to the host,
 * call update(dt, elapsed), optionally dispose(). Lighting follows the
 * production rule: a single vertical-down directional light owns every
 * cast shadow; ceiling panels and task lights are non-shadow fill.
 * ------------------------------------------------------------------ */

export class KitchenScene {
  constructor({ renderer = null, maxAnisotropy = 8 } = {}) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a1115);
    this.root = new THREE.Group();
    this.root.name = 'student-dining-kitchen';
    this.scene.add(this.root);

    this.textures = createTextureSet(maxAnisotropy);
    this.materials = createMaterials(this.textures);

    this.builder = new StaticBuilder();
    this.room = buildRoom(this.builder, this.materials);
    if (this.room.doorGroup) this.root.add(this.room.doorGroup);
    if (this.room.coldDoorGroup) this.root.add(this.room.coldDoorGroup);
    this.equipment = buildEquipment(this.builder, this.materials);
    this.props = buildProps(this.builder, this.root, this.materials, this.textures);
    this.batches = this.builder.flush(this.root, this.materials, 'kitchen-static-batches');

    this._setupEnvironment();
    this._setupLights();
    this._setupCollision();
    this._setupContactShadows();
    this._setupFixtureGlow();

    this.interactives = this.room.interactables ?? [];
    this.interactiveById = new Map();
    this.interactiveMeshes = [];
    for (const item of this.interactives) {
      this.interactiveById.set(item.id, item);
      for (const hitRoot of item.hitRoots ?? []) {
        hitRoot.traverse((child) => {
          if (!child.isMesh) return;
          child.userData.interactiveId = item.id;
          this.interactiveMeshes.push(child);
        });
      }
      if (item.apply) item.apply(item.value ?? 0);
    }

    this.elapsed = 0;
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
    };
  }

  _setupEnvironment() {
    if (!this.renderer) return;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    pmrem.compileEquirectangularShader();
    this.environmentTarget = pmrem.fromEquirectangular(this.textures.environment);
    this.scene.environment = this.environmentTarget.texture;
    this.scene.environmentIntensity = 0.65;
    pmrem.dispose();
  }

  _setupLights() {
    const lights = new THREE.Group();
    lights.name = 'kitchen-lights';

    const hemisphere = new THREE.HemisphereLight(0xf0f7ff, 0x5b686e, 0.55);
    const ambient = new THREE.AmbientLight(0xf1f7ff, 0.08);
    lights.add(hemisphere, ambient);

    // The one shadow-casting light: straight down, matching the ceiling
    // panels. Everything below therefore casts a footprint directly under
    // itself instead of a sideways shadow.
    const key = new THREE.DirectionalLight(0xf7fbff, 1.4);
    key.position.set(0, 11, 0);
    key.target.position.set(0, 0, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -8;
    key.shadow.camera.right = 8;
    key.shadow.camera.top = 13;
    key.shadow.camera.bottom = -13;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 24;
    key.shadow.camera.up.set(0, 0, 1);
    key.shadow.bias = -0.00038;
    key.shadow.normalBias = 0.025;
    key.shadow.radius = 3;
    lights.add(key, key.target);

    // Cool non-shadow fill under the ceiling grid, keeping stainless and
    // tile readable in every reachable corner.
    const fills = [];
    for (const [x, z] of [
      [-3.2, -6.0],
      [3.2, -6.0],
      [-3.2, 6.0],
      [3.2, 6.0],
    ]) {
      const point = new THREE.PointLight(0xeaf4ff, 13, 9.8, 2);
      point.position.set(x, 2.92, z);
      point.castShadow = false;
      lights.add(point);
      fills.push(point);
    }

    // Hood task lights.
    const hoodLights = [];
    for (const x of [-4.0, -2.4]) {
      const spot = new THREE.SpotLight(0xf3f9ff, 26, 3.4, 0.9, 0.7, 2);
      spot.position.set(x, 2.06, -10.02);
      spot.target.position.set(x, 0.96, -10.28);
      spot.castShadow = false;
      lights.add(spot, spot.target);
      hoodLights.push(spot);
    }

    // Warm accent in the hand-off vestibule, seen through the pass doors.
    const passLight = new THREE.PointLight(
      this.room.vestibuleLight.color,
      this.room.vestibuleLight.intensity,
      this.room.vestibuleLight.distance,
      2,
    );
    passLight.position.copy(this.room.vestibuleLight.position);
    passLight.castShadow = false;
    lights.add(passLight);

    this.lights = { hemisphere, ambient, key, fills, hoodLights, passLight };
    this.scene.add(lights);
  }

  _setupCollision() {
    this.collision = new CollisionWorld();
    for (const box of this.room.colliders) this.collision.addBox(box);
    for (const box of COLLIDERS) this.collision.addBox(box);
    for (const box of this.equipment.extraColliders) this.collision.addBox(box);
  }

  _setupContactShadows() {
    const rects = [
      { x: 0, z: 0, sx: 3.5, sz: 1.5, o: 0.62 },
      { x: -3.2, z: -10.42, sx: 3.0, sz: 1.2, o: 0.56 },
      { x: -0.9, z: -10.5, sx: 1.2, sz: 1.05, o: 0.5 },
      { x: 0.35, z: -10.45, sx: 1.5, sz: 1.15, o: 0.5 },
      { x: 2.0, z: -10.55, sx: 2.1, sz: 0.95, o: 0.45 },
      { x: -3.2, z: 10.42, sx: 3.55, sz: 1.05, o: 0.52 },
      { x: 0.0, z: 10.48, sx: 2.1, sz: 0.95, o: 0.42 },
      { x: 3.7, z: 10.38, sx: 3.9, sz: 1.1, o: 0.52 },
      { x: -5.5, z: -6.0, sx: 1.05, sz: 2.5, o: 0.4 },
      { x: -5.52, z: -1.5, sx: 1.0, sz: 2.0, o: 0.4 },
      { x: -5.5, z: 6.8, sx: 1.05, sz: 2.5, o: 0.4 },
      { x: 5.3, z: 9.7, sx: 0.75, sz: 0.75, o: 0.4 },
      { x: 4.9, z: 8.5, sx: 0.9, sz: 0.85, o: 0.38 },
      { x: -5.15, z: -10.62, sx: 0.72, sz: 0.62, o: 0.34 },
    ];
    const geometry = planeGeometry(1, 1);
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
      map: this.textures.contactShadow,
      transparent: true,
      opacity: 0.78,
      color: 0x050b0d,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      toneMapped: false,
    });
    const instanced = new THREE.InstancedMesh(geometry, material, rects.length);
    const matrix = new THREE.Matrix4();
    rects.forEach((rect, index) => {
      matrix.compose(
        new THREE.Vector3(rect.x, 0.004, rect.z),
        new THREE.Quaternion(),
        new THREE.Vector3(rect.sx, 1, rect.sz),
      );
      instanced.setMatrixAt(index, matrix);
    });
    instanced.instanceMatrix.needsUpdate = true;
    instanced.renderOrder = 1;
    instanced.name = 'kitchen-contact-shadows';
    instanced.frustumCulled = false;
    this.root.add(instanced);
    this.contactShadows = instanced;
  }

  _setupFixtureGlow() {
    const geometry = planeGeometry(1.05, 1.05);
    geometry.rotateX(Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
      map: this.textures.glow,
      color: 0xe7f5ff,
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const instanced = new THREE.InstancedMesh(geometry, material, CEILING.lights.length);
    const matrix = new THREE.Matrix4();
    let index = 0;
    for (const light of CEILING.lights) {
      matrix.compose(
        new THREE.Vector3(light.x, ROOM.height - 0.075, light.z),
        new THREE.Quaternion(),
        new THREE.Vector3(1, 1, 1),
      );
      instanced.setMatrixAt(index, matrix);
      index += 1;
    }
    instanced.instanceMatrix.needsUpdate = true;
    instanced.name = 'led-fixture-glow';
    instanced.renderOrder = 2;
    instanced.frustumCulled = false;
    this.root.add(instanced);
    this.fixtureGlow = instanced;
  }

  update(dt, elapsed = 0) {
    this.elapsed = elapsed;
    this.props.update(elapsed);

    if (this.materials.heaterWire) {
      this.materials.heaterWire.emissiveIntensity = 0.65 + Math.sin(elapsed * 1.7) * 0.06;
    }
  }

  toggleInteractive(id) {
    const item = this.interactiveById.get(id);
    if (!item) return null;
    return item;
  }

  setInteractive(id, open) {
    return this.interactiveById.get(id) ?? null;
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
      interactives: this.interactives.length,
      area: ROOM.width * ROOM.depth,
    };
  }

  dispose() {
    disposeObject(this.root);
    this.textures.environment?.dispose();
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
