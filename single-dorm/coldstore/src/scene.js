import * as THREE from 'three';
import { ROOM, HALF_D, START, COLLIDERS, CEILING, WALL, DOOR, EVAP } from './config.js';
import { createTextureSet } from './textures.js';
import { createMaterials } from './materials.js';
import { StaticBuilder, planeGeometry, disposeObject } from './geometry.js';
import { buildRoom } from './room.js';
import { buildShelves, getContentCounts } from './furniture.js';
import { buildProps } from './props.js';
import { CollisionWorld } from '../../dining/src/collision.js';

/* ------------------------------------------------------------------ *
 * Walk-in cold store scene.
 *
 * No DOM dependency. Construct with a renderer, add `scene` to the host,
 * call update(dt, elapsed), optionally dispose(). One vertical key light
 * owns every cast shadow; the LED fixtures, the evaporator glow and the
 * CRT phosphor are non-shadow fill. The evaporator fans and the mist are
 * the only animated geometry.
 * ------------------------------------------------------------------ */

export class ColdStoreScene {
  constructor({ renderer = null, maxAnisotropy = 8 } = {}) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070d10);
    this.root = new THREE.Group();
    this.root.name = 'restaurant-cold-store';
    this.scene.add(this.root);

    this.textures = createTextureSet(maxAnisotropy);
    this.materials = createMaterials(this.textures);

    this.builder = new StaticBuilder();
    this.room = buildRoom(this.builder, this.materials, this.root);
    buildShelves(this.builder, this.materials);
    this.contents = getContentCounts();
    this.props = buildProps(this.root, this.materials, this.textures);
    this.batches = this.builder.flush(this.root, this.materials, 'coldstore-static-batches');

    this._setupEnvironment();
    this._setupLights();
    this._setupCollision();
    this._setupContactShadows();
    this._setupFixtureGlow();
    this._setupInteractables();

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
    this.scene.environmentIntensity = 0.55;
    pmrem.dispose();
  }

  _setupLights() {
    const lights = new THREE.Group();
    lights.name = 'coldstore-lights';

    const hemisphere = new THREE.HemisphereLight(0xe6f2fa, 0x59666b, 0.4);
    const ambient = new THREE.AmbientLight(0xeaf4ff, 0.1);
    lights.add(hemisphere, ambient);

    // The only shadow caster: straight down, matching the ceiling panels.
    // The ceiling plane does not cast, so the key reaches the room.
    const key = new THREE.DirectionalLight(0xf1f9ff, 1.05);
    key.position.set(0, 5, 0);
    key.target.position.set(0, 0, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -1.7;
    key.shadow.camera.right = 1.7;
    key.shadow.camera.top = 3.4;
    key.shadow.camera.bottom = -3.4;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 7.5;
    key.shadow.camera.up.set(0, 0, 1);
    key.shadow.bias = -0.00032;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 2.5;
    lights.add(key, key.target);

    // Non-shadow fill under the two fixtures.
    const fixtures = [];
    for (const light of CEILING.lights) {
      const point = new THREE.PointLight(0xe8f4ff, 2.0, 3.3, 2);
      point.position.set(light.x, 2.28, light.z);
      point.castShadow = false;
      lights.add(point);
      fixtures.push(point);
    }

    // Cold glow out of the evaporator outlet.
    const evaporator = new THREE.PointLight(0xbfe3ff, 1.1, 2.1, 2);
    evaporator.position.set(EVAP.x + 0.24, EVAP.bottom - 0.06, EVAP.z + 0.55);
    lights.add(evaporator);

    // Phosphor green from the wall monitor and the warm heater line.
    const crtGlow = new THREE.PointLight(0x86f0a6, 0.34, 1.25, 2);
    crtGlow.position.set(WALL.crt.x, WALL.crt.y, WALL.crt.z - 0.32);
    lights.add(crtGlow);

    const heaterGlow = new THREE.PointLight(0xff8f52, 0.22, 1.0, 2);
    heaterGlow.position.set(DOOR.centerX - 0.4, 1.55, DOOR.wallZ - 0.28);
    lights.add(heaterGlow);

    // Door-side fill so the landing area never goes black.
    const doorFill = new THREE.PointLight(0xd6e8f2, 0.8, 2.4, 2);
    doorFill.position.set(0.4, 1.9, 2.2);
    lights.add(doorFill);

    this.lights = { hemisphere, ambient, key, fixtures, evaporator, crtGlow, heaterGlow, doorFill };
    this.scene.add(lights);
  }

  _setupCollision() {
    this.collision = new CollisionWorld();
    for (const box of COLLIDERS) this.collision.addBox(box);
  }

  _setupContactShadows() {
    const centerZ = (-2.55 + 1.5) / 2;
    const rects = [
      { x: -0.99, z: centerZ, sx: 0.98, sz: 4.3, o: 0.5 },
      { x: 0.99, z: centerZ, sx: 0.98, sz: 4.3, o: 0.5 },
      { x: DOOR.centerX, z: HALF_D - 0.12, sx: 1.5, sz: 0.5, o: 0.34 },
      { x: WALL.crt.x, z: HALF_D - 0.3, sx: 0.8, sz: 0.42, o: 0.26 },
      { x: -0.6, z: -2.3, sx: 1.1, sz: 0.6, o: 0.22 },
      { x: -0.3, z: -2.55, sx: 1.3, sz: 0.5, o: 0.2 },
    ];
    const geometry = planeGeometry(1, 1);
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
      map: this.textures.contactShadow,
      transparent: true,
      opacity: 0.8,
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
        new THREE.Vector3(rect.x, 0.056, rect.z),
        new THREE.Quaternion(),
        new THREE.Vector3(rect.sx, 1, rect.sz),
      );
      instanced.setMatrixAt(index, matrix);
    });
    instanced.instanceMatrix.needsUpdate = true;
    instanced.renderOrder = 1;
    instanced.name = 'coldstore-contact-shadows';
    instanced.frustumCulled = false;
    this.root.add(instanced);
    this.contactShadows = instanced;
  }

  _setupFixtureGlow() {
    const geometry = planeGeometry(1.0, 0.5);
    geometry.rotateX(Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
      map: this.textures.glow,
      color: 0xdcf3ff,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const instanced = new THREE.InstancedMesh(geometry, material, CEILING.lights.length);
    const matrix = new THREE.Matrix4();
    CEILING.lights.forEach((light, index) => {
      matrix.compose(
        new THREE.Vector3(light.x, ROOM.height - 0.185, light.z),
        new THREE.Quaternion(),
        new THREE.Vector3(1, 1, 1),
      );
      instanced.setMatrixAt(index, matrix);
    });
    instanced.instanceMatrix.needsUpdate = true;
    instanced.name = 'coldstore-led-glow';
    instanced.renderOrder = 2;
    instanced.frustumCulled = false;
    this.root.add(instanced);
    this.fixtureGlow = instanced;
  }

  _setupInteractables() {
    const item = {
      id: DOOR.id,
      label: DOOR.label,
      sceneId: DOOR.sceneId,
      portal: true,
      open: false,
      value: 0,
      target: 0,
      hitRoots: [this.room.doorGroup],
    };
    this.interactives = [item];
    this.interactiveById = new Map();
    this.interactiveMeshes = [];
    for (const entry of this.interactives) {
      this.interactiveById.set(entry.id, entry);
      for (const hitRoot of entry.hitRoots ?? []) {
        hitRoot.traverse((child) => {
          if (!child.isMesh) return;
          child.userData.interactiveId = entry.id;
          this.interactiveMeshes.push(child);
        });
      }
    }
  }

  update(dt, elapsed = 0) {
    this.elapsed = elapsed;
    this.props.update(elapsed, dt);

    if (this.materials.heaterWire) {
      this.materials.heaterWire.emissiveIntensity = 0.27 + Math.sin(elapsed * 1.4) * 0.025;
    }
    for (const fan of this.room.fans) {
      fan.rotation.z += dt * 5.4 * (fan.userData.spin ?? 1);
    }
  }

  toggleInteractive(id) {
    return this.interactiveById.get(id) ?? null;
  }

  setInteractive(id) {
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
      contents: this.contents,
    };
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
