import * as THREE from 'three';
import {
  ROOM,
  HALF_D,
  START,
  COLLIDERS,
  BULB,
  CAMERA,
  SWITCH,
  DOOR,
  TOOLBOX,
} from './config.js';
import { createTextureSet } from './textures.js';
import { createMaterials } from './materials.js';
import { StaticBuilder, planeGeometry, damp, disposeObject } from './geometry.js';
import { buildRoom } from './room.js';
import { buildShelf } from './shelf.js';
import { buildClutter } from './clutter.js';
import { buildProps } from './props.js';
import { CollisionWorld } from '../../dining/src/collision.js';

/* ------------------------------------------------------------------ *
 * Storage room scene.
 *
 * No DOM dependency. Construct with a renderer, add `scene` to the host,
 * call update(dt, elapsed), optionally dispose(). One vertical key light
 * owns every cast shadow; the bare bulb, the louvre bleed, the corridor
 * tube and the camera LEDs are non-shadow fill. The toolbox lid, camera
 * head, switch toggle and dust are the only animated objects.
 * ------------------------------------------------------------------ */

const BULB_ON = new THREE.Color(0xffbe78);
const BULB_OFF = new THREE.Color(0x241b12);

export class StorageScene {
  constructor({ renderer = null, maxAnisotropy = 8 } = {}) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x080705);
    this.root = new THREE.Group();
    this.root.name = 'storage-room';
    this.scene.add(this.root);

    this.textures = createTextureSet(maxAnisotropy);
    this.materials = createMaterials(this.textures);

    this.builder = new StaticBuilder();
    this.room = buildRoom(this.builder, this.materials, this.root);
    buildShelf(this.builder);
    this.clutter = buildClutter(this.builder, this.materials, this.root);
    this.props = buildProps(this.root, this.materials, this.textures);
    this.batches = this.builder.flush(this.root, this.materials, 'storage-static-batches');

    this._setupEnvironment();
    this._setupLights();
    this._setupCollision();
    this._setupContactShadows();
    this._setupCameraLed();
    this._setupInteractables();

    this.elapsed = 0;
    this.lightOn = true;
    this.lightLevel = 1;
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
    this.scene.environmentIntensity = 0.34;
    pmrem.dispose();
  }

  _setupLights() {
    const lights = new THREE.Group();
    lights.name = 'storage-lights';

    const hemisphere = new THREE.HemisphereLight(0xc9d0c8, 0x3a3733, 0.4);
    const ambient = new THREE.AmbientLight(0x9a8e7c, 0.12);
    lights.add(hemisphere, ambient);

    // The only shadow caster. The bare bulb is its visual alibi; the
    // shadow direction stays straight down.
    const key = new THREE.DirectionalLight(0xffdfb0, 0.58);
    key.position.set(0, 5, 0);
    key.target.position.set(0, 0, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -1.7;
    key.shadow.camera.right = 1.7;
    key.shadow.camera.top = 2.9;
    key.shadow.camera.bottom = -2.9;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 7.5;
    key.shadow.camera.up.set(0, 0, 1);
    key.shadow.bias = -0.00034;
    key.shadow.normalBias = 0.022;
    key.shadow.radius = 2.4;
    lights.add(key, key.target);

    const bulb = new THREE.PointLight(0xffc98c, 2.3, 4.6, 2);
    bulb.position.set(BULB.x, BULB.y - 0.22, BULB.z);
    bulb.castShadow = false;
    lights.add(bulb);

    // The corridor beyond the louvres, and its bleed through the vent.
    const corridor = new THREE.PointLight(0xe6f0ec, 1.8, 3.5, 2);
    corridor.position.set(0.2, 2.28, 3.32);
    lights.add(corridor);

    // The caged bulkhead on the far corridor wall.
    const corridorLamp = new THREE.PointLight(0xe4eef2, 1.0, 2.3, 2);
    corridorLamp.position.set(-0.95, 1.68, 3.92);
    lights.add(corridorLamp);

    const vent = new THREE.PointLight(0xd6e6ec, 0.75, 2.2, 2);
    vent.position.set(DOOR.centerX, DOOR.vent.centerY - 0.02, DOOR.wallZ + 0.42);
    lights.add(vent);

    // A weak warm fill near the door, so the leaf, handle and switch read.
    const doorFill = new THREE.PointLight(0xffd7ac, 0.52, 2.8, 2);
    doorFill.position.set(DOOR.centerX - 0.15, 1.4, HALF_D - 0.55);
    lights.add(doorFill);

    // Floor bounce, just enough to keep the bottom of the door off black.
    const floorBounce = new THREE.PointLight(0xffd0a0, 0.18, 1.8, 2);
    floorBounce.position.set(DOOR.centerX, 0.3, HALF_D - 0.5);
    lights.add(floorBounce);

    // A warm wall bounce by the garments and the toolbox stack.
    const garmentFill = new THREE.PointLight(0xffd7ac, 0.34, 2.2, 2);
    garmentFill.position.set(0.72, 1.55, -0.02);
    lights.add(garmentFill);

    // A weak warm bounce in the dead end so the sacks never go black.
    const bounce = new THREE.PointLight(0xffd9a8, 0.3, 3.0, 2);
    bounce.position.set(-0.1, 1.55, -1.55);
    lights.add(bounce);

    this.lights = {
      hemisphere,
      ambient,
      key,
      bulb,
      corridor,
      corridorLamp,
      vent,
      doorFill,
      floorBounce,
      garmentFill,
      bounce,
    };
    this.scene.add(lights);
  }

  _setupCollision() {
    this.collision = new CollisionWorld();
    for (const box of COLLIDERS) this.collision.addBox(box);
  }

  _setupCameraLed() {
    // A tiny red recording dot on the camera head, visible down the aisle.
    this.cameraLedMaterial = new THREE.SpriteMaterial({
      map: this.textures.glow,
      color: 0xff3a26,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const led = new THREE.Sprite(this.cameraLedMaterial);
    led.name = 'storage-camera-recording-led';
    led.position.set(0.033, -0.026, -0.118);
    led.scale.set(0.075, 0.075, 1);
    led.renderOrder = 6;
    this.room.cameraHead.add(led);
    this.cameraLed = led;
  }

  _setupContactShadows() {
    const rects = [
      { x: -0.92, z: -0.3, sx: 0.92, sz: 4.15, o: 0.5 },
      { x: 0.82, z: -1.86, sx: 0.95, sz: 0.8, o: 0.4 },
      { x: 0.96, z: 0.18, sx: 0.62, sz: 0.88, o: 0.36 },
      { x: 0.9, z: 1.75, sx: 0.62, sz: 0.62, o: 0.32 },
      { x: DOOR.centerX, z: HALF_D - 0.16, sx: 1.15, sz: 0.4, o: 0.3 },
      { x: -1.02, z: -2.27, sx: 0.4, sz: 0.4, o: 0.2 },
      { x: 1.02, z: 1.26, sx: 0.34, sz: 0.68, o: 0.24 },
      { x: -0.9, z: 0.16, sx: 0.5, sz: 0.6, o: 0.2 },
    ];
    const geometry = planeGeometry(1, 1);
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
      map: this.textures.contactShadow,
      transparent: true,
      opacity: 0.75,
      color: 0x050504,
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
    instanced.name = 'storage-contact-shadows';
    instanced.frustumCulled = false;
    instanced.userData.opacity = rects.map((rect) => rect.o);
    this.root.add(instanced);
    this.contactShadows = instanced;
  }

  _setupInteractables() {
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
    const toolboxItem = {
      id: TOOLBOX.id,
      label: TOOLBOX.label,
      locked: false,
      portal: false,
      open: false,
      target: 0,
      hitRoots: [this.clutter.toolbox.group],
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
    this.interactives = [doorItem, toolboxItem, switchItem];
    this.interactiveById = new Map();
    this.interactiveMeshes = [];
    this.doorItem = doorItem;
    this.toolboxItem = toolboxItem;
    this.switchItem = switchItem;
    for (const entry of this.interactives) {
      this.interactiveById.set(entry.id, entry);
      for (const hitRoot of entry.hitRoots) {
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
    this.props.update(elapsed);

    // Toolbox lid and tray: hinged at the wall side; the tray rises with
    // the lid so the tools clear the rim.
    const open = Boolean(this.toolboxItem.open);
    const lidTarget = open ? 1.62 : 0;
    this.clutter.toolbox.lid.rotation.z = damp(this.clutter.toolbox.lid.rotation.z, lidTarget, 10, dt);
    this.clutter.toolbox.tray.position.y = damp(this.clutter.toolbox.tray.position.y, open ? 0.075 : 0, 10, dt);

    // Switch toggle sits up when the light is on.
    const toggleTarget = this.switchItem.open ? -0.34 : 0.34;
    this.room.switchToggle.rotation.x = damp(this.room.switchToggle.rotation.x, toggleTarget, 14, dt);

    // Lamp state, with a rare, shallow flicker.
    const targetLevel = this.lightOn ? 1 : 0;
    this.lightLevel = damp(this.lightLevel, targetLevel, 6, dt);
    const flicker = 1 - 0.055 * Math.pow(Math.max(0, Math.sin(elapsed * 0.83 + 1.4)), 26);
    this.lights.bulb.intensity = 2.15 * this.lightLevel * flicker;
    this.lights.key.intensity = 0.18 + 0.4 * this.lightLevel;
    this.lights.hemisphere.intensity = 0.28 + 0.12 * this.lightLevel;
    this.lights.ambient.intensity = 0.08 + 0.04 * this.lightLevel;
    this.lights.doorFill.intensity = 0.26 + 0.26 * this.lightLevel;
    this.lights.floorBounce.intensity = 0.08 + 0.1 * this.lightLevel;
    this.materials.shadeInner.emissiveIntensity = 0.03 * this.lightLevel;
    this.materials.bulbGlass.color.copy(BULB_OFF).lerp(BULB_ON, this.lightLevel);
    this.props.setLightLevel(this.lightLevel);

    // The camera sweeps the aisle at a watchman's pace.
    this.room.cameraHead.rotation.y = CAMERA.yaw + Math.sin(elapsed * 0.11) * 0.16;
    this.room.cameraHead.rotation.x = CAMERA.pitch + Math.sin(elapsed * 0.083 + 2.1) * 0.018;
    const pulse = 0.5 + 0.5 * Math.sin(elapsed * 1.9);
    this.materials.ledRed.color.setHSL(0.015, 1, 0.36 + pulse * 0.22);
    this.cameraLedMaterial.opacity = 0.55 + pulse * 0.4;
  }

  toggleInteractive(id) {
    const item = this.interactiveById.get(id);
    if (!item) return null;
    if (item.locked) return item;
    item.open = !item.open;
    item.target = item.open ? 1 : 0;
    if (id === SWITCH.id) this.lightOn = item.open;
    return item;
  }

  setInteractive(id, value = true) {
    const item = this.interactiveById.get(id);
    if (!item) return null;
    if (item.locked) return item;
    item.open = Boolean(value);
    item.target = item.open ? 1 : 0;
    if (id === SWITCH.id) this.lightOn = item.open;
    if (id === TOOLBOX.id) {
      this.clutter.toolbox.lid.rotation.z = item.open ? 1.62 : 0;
      this.clutter.toolbox.tray.position.y = item.open ? 0.075 : 0;
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

  /* Empirical check of the louvre's one-way promise. Horizontal probes from
   * inside and outside the vent are cast through the scene; a probe that
   * reaches past the door plane counts as a sight line. */
  probeVent() {
    const raycaster = new THREE.Raycaster();
    raycaster.near = 0.02;
    raycaster.far = 4;
    this.root.updateMatrixWorld(true);
    const meshes = [];
    this.root.traverse((object) => {
      if (object.isMesh) meshes.push(object);
    });
    const inside = { rays: 0, seeThrough: 0, samples: [] };
    const outside = { rays: 0, leaks: 0, samples: [] };
    for (let y = 1.42; y <= 1.84; y += 0.02) {
      raycaster.set(new THREE.Vector3(DOOR.centerX, y, 2.0), new THREE.Vector3(0, 0, 1));
      const hit = raycaster.intersectObjects(meshes, false)[0];
      inside.rays += 1;
      if (hit && hit.point.z > DOOR.wallZ + 0.03) {
        inside.seeThrough += 1;
        if (inside.samples.length < 4) inside.samples.push({ y: Number(y.toFixed(2)), hitZ: Number(hit.point.z.toFixed(2)) });
      }

      raycaster.set(new THREE.Vector3(DOOR.centerX, y, 2.9), new THREE.Vector3(0, 0, -1));
      const outHit = raycaster.intersectObjects(meshes, false)[0];
      outside.rays += 1;
      if (outHit && outHit.point.z < DOOR.wallZ - 0.03) {
        outside.leaks += 1;
        if (outside.samples.length < 4) outside.samples.push({ y: Number(y.toFixed(2)), hitZ: Number(outHit.point.z.toFixed(2)) });
      }
    }
    return {
      inside: { rays: inside.rays, seeThrough: inside.seeThrough, samples: inside.samples },
      outside: { rays: outside.rays, leaks: outside.leaks, samples: outside.samples },
      note: 'positive horizontal probes; slats are tilted, so a few grazing angles can still pass',
    };
  }

  getStats() {
    return {
      batches: this.stats.batches,
      triangles: this.stats.triangles,
      colliders: this.stats.colliders,
      interactives: this.interactives.length,
      area: ROOM.width * ROOM.depth,
      contents: this.clutter.counts,
      lightOn: this.lightOn,
    };
  }

  dispose() {
    disposeObject(this.root);
    if (this.cameraLedMaterial) this.cameraLedMaterial.dispose();
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
