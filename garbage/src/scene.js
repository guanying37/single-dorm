import * as THREE from 'three';
import {
  ROOM,
  HALF_D,
  START,
  COLLIDERS,
  LAMPS,
  CAMERA,
  MONITOR,
  SWITCH,
  DOOR,
  CONTENT_COUNTS,
} from './config.js';
import { createTextureSet } from './textures.js';
import { createMaterials } from './materials.js';
import { StaticBuilder, planeGeometry, damp, disposeObject } from './geometry.js';
import { buildRoom } from './room.js';
import { buildRack } from './rack.js';
import { buildBins } from './bins.js';
import { buildClutter } from './clutter.js';
import { buildProps } from './props.js';
import { CollisionWorld } from '../../dining/src/collision.js';

/* ------------------------------------------------------------------ *
 * Garbage processing room scene.
 *
 * No DOM dependency. Construct with a renderer, add `scene` to the host,
 * call update(dt, elapsed), optionally dispose(). One vertical key light
 * owns every cast shadow; the tungsten pendants, the flickering batten,
 * the monitor stack and the corridor strip under the door are all
 * non-shadow fill. Animated: the bin lid, the camera head, the switch
 * toggle, the failing tube, the CRT scan bars, the recording LED and the
 * dust.
 * ------------------------------------------------------------------ */

const BULB_ON = new THREE.Color(0xffc684);
const BULB_OFF = new THREE.Color(0x241b12);
const TUBE_ON = new THREE.Color(0xd6e4dc);
const TUBE_DIM = new THREE.Color(0x4a5350);

export class GarbageScene {
  constructor({ renderer = null, maxAnisotropy = 8 } = {}) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070705);
    this.root = new THREE.Group();
    this.root.name = 'garbage-room';
    this.scene.add(this.root);

    this.textures = createTextureSet(maxAnisotropy);
    this.materials = createMaterials(this.textures);

    this.builder = new StaticBuilder();
    this.room = buildRoom(this.builder, this.materials, this.root, this.textures);
    buildRack(this.builder);
    this.bins = buildBins(this.builder, this.materials, this.root);
    this.clutter = buildClutter(this.builder, this.materials, this.root);
    this.props = buildProps(this.root, this.materials, this.textures);
    this.batches = this.builder.flush(this.root, this.materials, 'garbage-static-batches');

    this._setupEnvironment();
    this._setupLights();
    this._setupCollision();
    this._setupContactShadows();
    this._setupCameraLed();
    this._setupInteractables();

    this.elapsed = 0;
    this.lightOn = true;
    this.lightLevel = 1;
    this.flicker = 1;
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
    this.scene.environmentIntensity = 0.3;
    pmrem.dispose();
  }

  _setupLights() {
    const lights = new THREE.Group();
    lights.name = 'garbage-lights';

    const hemisphere = new THREE.HemisphereLight(0xc2c7ba, 0x33302a, 0.5);
    const ambient = new THREE.AmbientLight(0x9a8d78, 0.15);
    lights.add(hemisphere, ambient);

    // The only shadow caster. The main pendant is its visual alibi; the
    // shadow direction stays straight down.
    const key = new THREE.DirectionalLight(0xffd4a2, 0.92);
    key.position.set(0, 5.6, 0);
    key.target.position.set(0, 0, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -2.6;
    key.shadow.camera.right = 2.6;
    key.shadow.camera.top = 3.2;
    key.shadow.camera.bottom = -3.2;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 9;
    key.shadow.camera.up.set(0, 0, 1);
    key.shadow.bias = -0.00032;
    key.shadow.normalBias = 0.024;
    key.shadow.radius = 3;
    lights.add(key, key.target);

    // Main tungsten pendant.
    const mainBulb = new THREE.PointLight(0xffbb7c, 2.8, 5.2, 2);
    mainBulb.position.set(LAMPS.main.x, LAMPS.main.y - 0.16, LAMPS.main.z);
    lights.add(mainBulb);

    // Second, weaker pendant by the door.
    const doorBulb = new THREE.PointLight(0xffc78e, 1.15, 3.4, 2);
    doorBulb.position.set(LAMPS.door.x, LAMPS.door.y - 0.12, LAMPS.door.z);
    lights.add(doorBulb);

    // The failing cold batten above the rack.
    const flickerTube = new THREE.PointLight(0xd8eee6, 1.1, 3.6, 2);
    flickerTube.position.set(LAMPS.flicker.x, LAMPS.flicker.y - 0.12, LAMPS.flicker.z);
    lights.add(flickerTube);

    // Monitor stack green spill: a soft wash, not a hotspot on the wall.
    const monitorGlow = new THREE.PointLight(0x7fcb92, 0.3, 2.8, 2);
    monitorGlow.position.set(MONITOR.crt.x - 0.05, MONITOR.crt.y - 0.12, MONITOR.crt.z + 0.32);
    lights.add(monitorGlow);

    // Cold strip under the door.
    const doorSeep = new THREE.PointLight(0xc2d8d0, 0.78, 2.4, 2);
    doorSeep.position.set(DOOR.centerX, 0.24, HALF_D - 0.32);
    lights.add(doorSeep);

    // Soft bounce so the bins and the bag corner never go black.
    const binBounce = new THREE.PointLight(0xffd4a6, 0.52, 3.4, 2);
    binBounce.position.set(1.25, 1.85, -0.7);
    lights.add(binBounce);
    // Low fill aimed at the bins' vertical faces, which the down key
    // cannot reach.
    const binFrontFill = new THREE.PointLight(0xffd2a4, 0.7, 2.8, 2);
    binFrontFill.position.set(0.45, 1.0, -0.6);
    lights.add(binFrontFill);
    const binRim = new THREE.PointLight(0xcfdcd2, 0.22, 2.2, 2);
    binRim.position.set(1.0, 1.9, 0.5);
    lights.add(binRim);
    const bagBounce = new THREE.PointLight(0xffd0a0, 0.44, 2.8, 2);
    bagBounce.position.set(-1.25, 1.35, 1.75);
    lights.add(bagBounce);
    // A low sheen light to make the puddle read as liquid.
    const puddleSheen = new THREE.PointLight(0xdfe8dd, 0.24, 2.4, 2);
    puddleSheen.position.set(-0.7, 1.1, 0.4);
    lights.add(puddleSheen);
    const rackBounce = new THREE.PointLight(0xffd8b0, 0.46, 2.8, 2);
    rackBounce.position.set(-0.35, 1.4, -1.95);
    lights.add(rackBounce);
    const floorBounce = new THREE.PointLight(0xffcfa0, 0.24, 2.6, 2);
    floorBounce.position.set(0.2, 0.3, 0.9);
    lights.add(floorBounce);
    // A cool, shadowless broad fill in the middle of the room.
    const centerFill = new THREE.PointLight(0xbfd2ca, 0.2, 4.6, 2);
    centerFill.position.set(0, 2.0, 0.9);
    lights.add(centerFill);
    // A warm wash on the door and sign.
    const doorWallFill = new THREE.PointLight(0xffcfa2, 0.38, 2.8, 2);
    doorWallFill.position.set(0.3, 1.65, HALF_D - 0.5);
    lights.add(doorWallFill);
    // Broom and dustpan corner.
    const broomFill = new THREE.PointLight(0xffc796, 0.2, 2.0, 2);
    broomFill.position.set(1.5, 0.85, 1.55);
    lights.add(broomFill);

    this.lights = {
      hemisphere,
      ambient,
      key,
      mainBulb,
      doorBulb,
      flickerTube,
      monitorGlow,
      doorSeep,
      binBounce,
      binFrontFill,
      binRim,
      bagBounce,
      puddleSheen,
      rackBounce,
      floorBounce,
      centerFill,
      doorWallFill,
      broomFill,
    };
    this.scene.add(lights);
  }

  _setupCollision() {
    this.collision = new CollisionWorld();
    for (const box of COLLIDERS) this.collision.addBox(box);
  }

  _setupCameraLed() {
    this.cameraLedMaterial = new THREE.SpriteMaterial({
      map: this.textures.glow,
      color: 0xff3522,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const led = new THREE.Sprite(this.cameraLedMaterial);
    led.name = 'garbage-camera-recording-led';
    led.position.set(0.031, -0.024, -0.104);
    led.scale.set(0.06, 0.06, 1);
    led.renderOrder = 6;
    this.room.cameraHead.add(led);
    this.cameraLed = led;
  }

  _setupContactShadows() {
    const rects = [
      { x: 1.64, z: -1.62, sx: 1.02, sz: 1.28, o: 0.52 },
      { x: 1.64, z: -0.1, sx: 1.02, sz: 1.28, o: 0.52 },
      { x: -0.78, z: -2.5, sx: 1.72, sz: 0.56, o: 0.42 },
      { x: -1.68, z: 1.9, sx: 1.4, sz: 1.32, o: 0.46 },
      { x: -1.1, z: 2.38, sx: 1.1, sz: 0.7, o: 0.34 },
      { x: 1.92, z: 1.78, sx: 0.48, sz: 0.96, o: 0.3 },
      { x: DOOR.centerX, z: HALF_D - 0.14, sx: 1.2, sz: 0.42, o: 0.3 },
      { x: 0.24, z: -2.36, sx: 0.5, sz: 0.5, o: 0.24 },
    ];
    const geometry = planeGeometry(1, 1);
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
      map: this.textures.contactShadow,
      transparent: true,
      opacity: 0.6,
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
    instanced.name = 'garbage-contact-shadows';
    instanced.frustumCulled = false;
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
    const switchItem = {
      id: SWITCH.id,
      label: SWITCH.label,
      locked: false,
      portal: false,
      open: true,
      target: 1,
      hitRoots: [this.room.switchGroup],
    };
    const bin = this.bins.find((entry) => entry.config.interactive);
    const binItem = {
      id: bin ? bin.config.id : 'bin.b',
      label: bin ? bin.config.label : '工业垃圾桶 B',
      locked: false,
      portal: false,
      open: false,
      target: 0,
      hitRoots: bin ? [bin.group] : [],
    };
    this.binItem = binItem;
    this.interactiveBin = bin ?? null;
    this.interactives = [doorItem, switchItem, binItem];
    this.interactiveById = new Map();
    this.interactiveMeshes = [];
    this.doorItem = doorItem;
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

    // Interactive bin lid: hinge at the aisle edge, opens to near vertical.
    if (this.interactiveBin) {
      const target = this.binItem.open ? -1.65 : 0;
      const pivot = this.interactiveBin.lidPivot;
      pivot.rotation.z = damp(pivot.rotation.z, target, 7, dt);
    }

    // Switch toggle sits up when the light is on.
    const toggleTarget = this.switchItem.open ? -0.34 : 0.34;
    this.room.switchToggle.rotation.x = damp(this.room.switchToggle.rotation.x, toggleTarget, 14, dt);

    // Room lamp state.
    const targetLevel = this.lightOn ? 1 : 0;
    this.lightLevel = damp(this.lightLevel, targetLevel, 5.5, dt);

    // The failing batten: long dark pauses with stuttering bursts, driven
    // by three incommensurate sine waves rather than random numbers.
    const t = elapsed * 1.0;
    const burst = Math.max(0, Math.sin(t * 0.61) + Math.sin(t * 1.37 + 1.1) - 1.1);
    const stutter = 0.5 + 0.5 * Math.sin(t * 37.0) * Math.sin(t * 13.0);
    const targetFlicker = Math.min(1, 0.16 + burst * 1.9 * stutter);
    this.flicker = damp(this.flicker, targetFlicker, 18, dt);

    this.lights.key.intensity = 0.2 + 0.72 * this.lightLevel;
    this.lights.mainBulb.intensity = 2.7 * this.lightLevel;
    this.lights.doorBulb.intensity = 0.24 + 0.9 * this.lightLevel;
    this.lights.hemisphere.intensity = 0.34 + 0.16 * this.lightLevel;
    this.lights.ambient.intensity = 0.1 + 0.05 * this.lightLevel;
    this.lights.binBounce.intensity = 0.26 + 0.34 * this.lightLevel;
    this.lights.binFrontFill.intensity = 0.3 + 0.5 * this.lightLevel;
    this.lights.binRim.intensity = 0.12 + 0.14 * this.lightLevel;
    this.lights.bagBounce.intensity = 0.2 + 0.24 * this.lightLevel;
    this.lights.puddleSheen.intensity = 0.12 + 0.14 * this.lightLevel;
    this.lights.rackBounce.intensity = 0.2 + 0.26 * this.lightLevel;
    this.lights.floorBounce.intensity = 0.1 + 0.14 * this.lightLevel;
    this.lights.centerFill.intensity = 0.08 + 0.12 * this.lightLevel;
    this.lights.doorWallFill.intensity = 0.12 + 0.26 * this.lightLevel;
    this.lights.broomFill.intensity = 0.08 + 0.12 * this.lightLevel;

    // Flicker circuit is on its own: independent of the room switch.
    this.lights.flickerTube.intensity = 0.2 + 1.0 * this.flicker;
    this.materials.fluorescentLens.color.copy(TUBE_DIM).lerp(TUBE_ON, this.flicker);
    this.props.setFlicker(this.flicker);

    this.materials.shadeInner.emissiveIntensity = 0.035 * this.lightLevel;
    this.materials.bulbGlass.color.copy(BULB_OFF).lerp(BULB_ON, this.lightLevel);
    this.props.setLightLevel(this.lightLevel);

    // A subtle mains hum on the screens.
    const hum = 0.94 + 0.06 * Math.sin(elapsed * 11.0);
    this.materials.crtFeed.color.setRGB(hum, hum, hum);

    // Camera sweeps the aisle at a watchman's pace; rack stays in its
    // blind spot because the sweep never dips below the lens plane.
    this.room.cameraHead.rotation.y = CAMERA.yaw + Math.sin(elapsed * 0.1) * 0.12;
    this.room.cameraHead.rotation.x = CAMERA.pitch + Math.sin(elapsed * 0.077 + 2.1) * 0.014;
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
    if (id === this.binItem.id && this.interactiveBin) {
      this.interactiveBin.lidPivot.rotation.z = item.open ? -1.65 : 0;
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

  /* Geometric proof that the rack sits in the camera's blind spot: the
   * angle between the camera's optical axis and the vector to the rack is
   * compared with the lens half-angle. */
  probeBlindSpot() {
    const head = this.room.cameraHead;
    head.updateMatrixWorld(true);
    const origin = new THREE.Vector3();
    head.getWorldPosition(origin);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(head.getWorldQuaternion(new THREE.Quaternion()));
    const rackCenter = new THREE.Vector3(-0.78, 1.1, -2.49);
    const toRack = rackCenter.clone().sub(origin);
    const distance = toRack.length();
    const angle = forward.angleTo(toRack.normalize());
    const lensHalfAngle = THREE.MathUtils.degToRad(34);
    return {
      camera: { x: Number(origin.x.toFixed(2)), y: Number(origin.y.toFixed(2)), z: Number(origin.z.toFixed(2)) },
      rack: { x: -0.78, y: 1.1, z: -2.49 },
      distance: Number(distance.toFixed(2)),
      angleDegrees: Number(THREE.MathUtils.radToDeg(angle).toFixed(1)),
      lensHalfAngleDegrees: 34,
      blind: angle > lensHalfAngle,
    };
  }

  getStats() {
    return {
      batches: this.stats.batches,
      triangles: this.stats.triangles,
      colliders: this.stats.colliders,
      interactives: this.interactives.length,
      area: ROOM.width * ROOM.depth,
      contents: { ...CONTENT_COUNTS },
      lightOn: this.lightOn,
      flicker: Number(this.flicker.toFixed(2)),
    };
  }

  dispose() {
    disposeObject(this.root);
    if (this.cameraLedMaterial) this.cameraLedMaterial.dispose();
    if (this.room.doorUnderlightMaterial) this.room.doorUnderlightMaterial.dispose();
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
