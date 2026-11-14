import * as THREE from 'three';
import { createTextureSet } from './textures.js';
import { createMaterials } from './materials.js';
import { buildArchitecture, ROOM } from './room.js';
import { buildFurniture } from './furniture.js';
import { damp } from './utils.js';
import { batchStaticMeshes } from './optimize.js';

/* ------------------------------------------------------------------ *
 * SingleDormScene
 *
 * A self-contained scene factory. It makes no network requests at
 * runtime and deliberately exposes a small integration surface so this
 * room can later be dropped into an ADV engine:
 *
 *   const dorm = new SingleDormScene({ renderer });
 *   scene.add(dorm.scene);                 // or use dorm.scene directly
 *   dorm.toggleInteractive('shoe-cabinet-door-left');
 *   dorm.update(dt, elapsed);
 *   dorm.dispose();
 * ------------------------------------------------------------------ */

export class SingleDormScene {
  constructor({ renderer = null, maxAnisotropy = 8, referenceArt = null } = {}) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x17120f);
    this.root = new THREE.Group();
    this.root.name = 'single-dorm-room';
    this.scene.add(this.root);

    this.textures = createTextureSet(maxAnisotropy, referenceArt);
    this.materials = createMaterials(this.textures);

    this.architecture = buildArchitecture(this.materials, this.textures);
    this.root.add(this.architecture.group);

    const furniture = buildFurniture(this.materials, this.textures);
    this.root.add(furniture.group);

    this.interactives = furniture.interactives;
    this.interactiveById = new Map();
    this.interactiveMeshes = [];

    for (const entry of this.interactives) {
      this.interactiveById.set(entry.id, entry);
      entry.hitRoots.forEach((root) => {
        root.traverse((child) => {
          if (!child.isMesh) return;
          child.userData.interactiveId = entry.id;
          this.interactiveMeshes.push(child);
        });
      });
      entry.apply(entry.value);
    }

    this.environmentTarget = null;
    this._setupEnvironment();
    this._setupLights();
    this._addContactShadows();
    this._addAtmosphere();

    // Bake every opaque, static piece of joinery into material batches.
    // Doors and drawers are excluded and remain individually animated.
    this.staticBatch = batchStaticMeshes(this.root);

    // A human eye-level spot in the middle of the clear floor, far from
    // every piece of furniture and every opening door.
    this.cameraHome = Object.freeze({
      position: new THREE.Vector3(0.02, 1.855, 0.92),
      yaw: -0.19,
      pitch: -0.055,
      fov: 70,
    });

    this._shadowDirty = true;
    this._ledTime = 0;
    this.scene.updateMatrixWorld(true);

    if (this.renderer) {
      this.renderer.shadowMap.needsUpdate = true;
    }
  }

  _setupEnvironment() {
    if (!this.renderer || !this.textures.environment) return;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    pmrem.compileEquirectangularShader();
    const target = pmrem.fromEquirectangular(this.textures.environment);
    this.environmentTarget = target;
    this.scene.environment = target.texture;
    this.scene.environmentIntensity = 0.38;
    pmrem.dispose();
  }

  _setupLights() {
    const lights = new THREE.Group();
    lights.name = 'room-lighting';

    const hemisphere = new THREE.HemisphereLight(0xfff2d8, 0x594535, 0.56);
    hemisphere.name = 'warm-sky-fill';
    lights.add(hemisphere);

    // The pendant is the room's visible light source, so it must also be
    // the light that owns the shadows. A gentle side fill adds modelling
    // without casting a second, contradictory set of shadows.
    const fill = new THREE.DirectionalLight(0xffe6cf, 0.28);
    fill.name = 'soft-side-fill';
    fill.position.set(2.2, 3.6, 1.9);
    fill.target.position.set(0, 1.0, -0.3);
    fill.castShadow = false;
    lights.add(fill);
    lights.add(fill.target);

    // One shadow-casting key, placed just under the pendant shade and
    // aimed straight down. Every shadow in the room therefore radiates
    // from the same lamp the player sees. The wide, soft cone still
    // reaches the walls and the room corners.
    const key = new THREE.SpotLight(0xffd2a0, 34, 9.2, 1.07, 0.62, 1.8);
    key.name = 'pendant-shadow-light';
    key.position.set(0, 2.275, 0);
    key.target.position.set(0, 0, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.18;
    key.shadow.camera.far = 6.4;
    key.shadow.bias = -0.00022;
    key.shadow.normalBias = 0.018;
    key.shadow.radius = 3.0;
    lights.add(key);
    lights.add(key.target);

    // The point fill is non-shadowing: it carries the warm glow onto the
    // ceiling and into the corners while the spotlight handles direction.
    const pendant = new THREE.PointLight(0xffca84, 14, 8.5, 2);
    pendant.name = 'pendant-warm-fill';
    pendant.position.set(0, 2.35, 0);
    pendant.castShadow = false;
    lights.add(pendant);

    // A faint, cool spill near the sealed window. It reads as light
    // leaking through the plank joins without needing a real exterior.
    const windowSpill = new THREE.PointLight(0xb8cbc9, 2.6, 3.6, 2);
    windowSpill.name = 'window-spill';
    windowSpill.position.set(0.2, 1.65, -2.28);
    windowSpill.castShadow = false;
    lights.add(windowSpill);
    this.lights = {
      hemisphere,
      fill,
      key,
      pendant,
      windowSpill,
    };
    this.scene.add(lights);
  }

  _addContactShadows() {
    const data = [
      { x: -1.76, z: -1.72, sx: 1.62, sz: 2.22, opacity: 0.34 },
      { x: DESK_X, z: -1.625, sx: 1.02, sz: 1.62, opacity: 0.3 },
      { x: 1.46, z: -1.56, sx: 0.82, sz: 0.86, opacity: 0.28 },
      { x: -2.07, z: 1.14, sx: 0.98, sz: 1.53, opacity: 0.3 },
      { x: 0.38, z: 2.58, sx: 1.18, sz: 0.62, opacity: 0.27 },
      { x: -2.1, z: 2.43, sx: 0.5, sz: 0.5, opacity: 0.22 },
    ];
    const geometry = new THREE.PlaneGeometry(1, 1);
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
      map: this.textures.contactShadow,
      transparent: true,
      opacity: 0.62,
      color: 0x1a100b,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      toneMapped: false,
    });
    const instanced = new THREE.InstancedMesh(geometry, material, data.length);
    const matrix = new THREE.Matrix4();
    data.forEach((entry, index) => {
      matrix.compose(
        new THREE.Vector3(entry.x, 0.003, entry.z),
        new THREE.Quaternion(),
        new THREE.Vector3(entry.sx, 1, entry.sz),
      );
      instanced.setMatrixAt(index, matrix);
    });
    instanced.instanceMatrix.needsUpdate = true;
    instanced.renderOrder = 1;
    instanced.name = 'baked-contact-shadows';
    this.scene.add(instanced);
    this.contactShadows = instanced;
  }

  _addAtmosphere() {
    // A very sparse dust field in the pendant's warm volume. One draw
    // call, no textures, and no shadow contribution.
    const count = 110;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    let seed = 0x1a2b3c;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < count; i += 1) {
      const radius = 0.25 + Math.sqrt(random()) * 1.6;
      const angle = random() * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 0.55 + random() * 1.65;
      positions[i * 3 + 2] = Math.sin(angle) * radius - 0.2;
      seeds[i] = random();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    const material = new THREE.PointsMaterial({
      color: 0xffe5b7,
      map: this.textures.dust,
      alphaTest: 0.01,
      size: 0.011,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      toneMapped: false,
    });
    const dust = new THREE.Points(geometry, material);
    dust.name = 'dust-motes';
    dust.frustumCulled = false;
    this.scene.add(dust);
    this.dust = dust;
  }

  toggleInteractive(id) {
    const item = this.interactiveById.get(id);
    if (!item) return null;
    item.open = !item.open;
    item.target = item.open ? 1 : 0;
    this._shadowDirty = true;
    return item;
  }

  setInteractive(id, open) {
    const item = this.interactiveById.get(id);
    if (!item) return null;
    item.open = Boolean(open);
    item.target = item.open ? 1 : 0;
    this._shadowDirty = true;
    return item;
  }

  setAllInteractives(open) {
    for (const item of this.interactives) {
      item.open = Boolean(open);
      item.target = item.open ? 1 : 0;
    }
    this._shadowDirty = true;
  }

  getInteractiveState() {
    return this.interactives.map((item) => ({
      id: item.id,
      label: item.label,
      open: item.open,
      value: item.value,
    }));
  }

  update(dt, elapsed = 0) {
    let animateShadows = false;

    for (const item of this.interactives) {
      if (Math.abs(item.target - item.value) > 0.0005) {
        item.value = damp(item.value, item.target, 7.2, dt);
        if (Math.abs(item.target - item.value) < 0.002) item.value = item.target;
        item.apply(item.value);
        animateShadows = true;
      }
    }

    if (animateShadows) {
      this._shadowDirty = true;
    }
    if (this._shadowDirty && this.renderer) {
      this.renderer.shadowMap.needsUpdate = true;
      this._shadowDirty = false;
    }

    // A restrained CRT presence: a slow screen shimmer and a recording
    // LED that blinks without re-rendering any shadow maps.
    if (this.materials.screen) {
      this.materials.screen.emissiveIntensity = 0.35 + Math.sin(elapsed * 1.7) * 0.018;
    }
    if (this.materials.ledRed) {
      const pulse = Math.pow(0.5 + 0.5 * Math.sin(elapsed * 3.7), 9);
      this.materials.ledRed.emissiveIntensity = 0.65 + pulse * 2.7;
    }

    if (this.dust) {
      const time = elapsed * 0.035;
      this.dust.rotation.y = time * 0.1;
      this.dust.position.y = Math.sin(time * 0.8) * 0.025;
    }
  }

  dispose() {
    const textures = new Set();
    const materials = new Set();
    const geometries = new Set();
    this.scene.traverse((object) => {
      if (!object.isMesh && !object.isPoints && !object.isSprite) return;
      if (object.geometry) geometries.add(object.geometry);
      const list = Array.isArray(object.material) ? object.material : [object.material];
      list.forEach((material) => {
        if (!material) return;
        materials.add(material);
        Object.values(material).forEach((value) => {
          if (value && value.isTexture) textures.add(value);
        });
      });
    });
    textures.forEach((texture) => texture.dispose());
    materials.forEach((material) => material.dispose());
    geometries.forEach((geometry) => geometry.dispose());
    if (this.environmentTarget) this.environmentTarget.dispose();
    this.scene.clear();
  }
}

const DESK_X = 2.085;
