import * as THREE from 'three';
import {
  ROOM,
  START,
  COLLIDERS,
  BED,
  CART,
  CABINET,
  SINK,
  OP,
  TRAY,
  STEEL_CAB,
  WASTE,
  STOOL,
  PLANT,
  DOOR,
} from './config.js';
import { createTextureSet } from './textures.js';
import { createMaterials } from './materials.js';
import { MaterialStaticBuilder, planeGeometry, damp, disposeObject } from './geometry.js';
import { buildRoom } from './room.js';
import { buildFurniture } from './furniture.js';
import { buildCurtains } from './curtains.js';
import { CollisionWorld } from '../../dining/src/collision.js';

/* ------------------------------------------------------------------ *
 * Infirmary scene.
 *
 * No DOM dependency beyond the procedural canvas textures. Construct
 * with a renderer, add `scene` to the host, call update(dt, elapsed),
 * optionally dispose(). One vertical key light owns every cast shadow;
 * the six ceiling LED panels, the surgical lamp and the small service
 * lights are non-shadow fill. Curtains, cabinet glass, drawers and the
 * waste-bin lid are the only animated objects.
 * ------------------------------------------------------------------ */

export class InfirmaryScene {
  constructor({ renderer = null, maxAnisotropy = 8 } = {}) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xd5dedb);
    this.root = new THREE.Group();
    this.root.name = 'infirmary-room';
    this.scene.add(this.root);

    this.textures = createTextureSet(maxAnisotropy);
    this.materials = createMaterials(this.textures);

    this.builder = new MaterialStaticBuilder();
    this.room = buildRoom(this.builder, this.materials, this.root);
    this.furniture = buildFurniture(this.builder, this.materials, this.root);
    this.curtains = buildCurtains(this.builder, this.materials, this.root);
    this.batches = this.builder.flush(this.root, this.materials, 'infirmary-static-batches');

    this._setupEnvironment();
    this._setupLights();
    this._setupCollision();
    this._setupContactShadows();
    this._setupMirrorReflection();
    this._setupInteractables();

    this.elapsed = 0;
    this.displayPulse = 0;
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
      area: ROOM.width * ROOM.depth,
      beds: this.furniture.counts.beds,
      bottles: this.furniture.counts.bottles,
      jars: this.furniture.counts.jars,
      instruments: this.furniture.counts.instruments,
      packages: this.furniture.counts.packages,
      curtains: this.curtains.length,
    };
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
    lights.name = 'infirmary-lights';

    const hemisphere = new THREE.HemisphereLight(0xe7f1f4, 0x9aa5a0, 0.42);
    const ambient = new THREE.AmbientLight(0xffffff, 0.12);
    lights.add(hemisphere, ambient);

    // The only shadow caster. The six ceiling panels are its visual
    // alibi; the shadow direction stays straight down.
    const key = new THREE.DirectionalLight(0xfff7ea, 1.75);
    key.position.set(0, 6, 0);
    key.target.position.set(0, 0, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -3.4;
    key.shadow.camera.right = 3.4;
    key.shadow.camera.top = 4.9;
    key.shadow.camera.bottom = -4.9;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 8.5;
    key.shadow.camera.up.set(0, 0, 1);
    key.shadow.bias = -0.00022;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 2.2;
    lights.add(key, key.target);

    // Three broad ceiling fills, one per third of the room.
    const ceilingFills = [
      { x: -1.2, z: -2.55 },
      { x: 1.25, z: 0.0 },
      { x: -1.2, z: 2.55 },
    ].map(({ x, z }) => {
      const light = new THREE.PointLight(0xf1f8ff, 1.45, 5.2, 2);
      light.position.set(x, 2.74, z);
      light.castShadow = false;
      lights.add(light);
      return light;
    });

    // The surgical lamp is a warm pool, not a shadow caster.
    const surgical = new THREE.PointLight(0xfff2dc, 2.8, 3.4, 2);
    surgical.position.set(OP.x, 2.2, OP.z);
    surgical.castShadow = false;
    lights.add(surgical);

    // A small cool fill at the basin and mirror so the steel reads.
    const basinFill = new THREE.PointLight(0xeaf5f8, 0.7, 2.6, 2);
    basinFill.position.set(2.26, 1.72, 3.25);
    lights.add(basinFill);

    // North-end bounce by the steel cabinet and pothos.
    const northBounce = new THREE.PointLight(0xf2f7ee, 0.5, 3.0, 2);
    northBounce.position.set(1.9, 1.7, -3.2);
    lights.add(northBounce);

    // A soft lamp inside the medicine cabinet's glass section.
    const cabinetLight = new THREE.PointLight(0xfff7e8, 0.9, 1.5, 2);
    cabinetLight.position.set(2.3, 1.78, CABINET.z);
    lights.add(cabinetLight);

    this.lights = {
      hemisphere,
      ambient,
      key,
      ceilingFills,
      surgical,
      basinFill,
      northBounce,
      cabinetLight,
    };
    this.scene.add(lights);

    // A soft additive halo under the surgical lamp, so it reads as the
    // brightest fixture in the room without bloom.
    const haloMaterial = new THREE.SpriteMaterial({
      map: this.textures.glow,
      color: 0xfff7e8,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const halo = new THREE.Sprite(haloMaterial);
    halo.name = 'surgical-lamp-halo';
    halo.position.set(OP.x, 2.22, OP.z);
    halo.scale.set(1.35, 1.35, 1);
    halo.renderOrder = 5;
    this.root.add(halo);
    this.surgicalHalo = halo;
  }

  _setupCollision() {
    this.collision = new CollisionWorld();
    for (const box of COLLIDERS) this.collision.addBox(box);
  }

  /* Bake the mirror's view of the room once. The mirror is a flat metal
   * plane, so a 128 px cube map is enough to carry the beds, curtains and
   * floor without turning it into a second camera. */
  _setupMirrorReflection() {
    if (!this.renderer || !this.room.mirrorMesh) return;
    const target = new THREE.WebGLCubeRenderTarget(128, {
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
    });
    const cubeCamera = new THREE.CubeCamera(0.04, 12, target);
    cubeCamera.position.set(SINK.mirror.x - 0.08, SINK.mirror.y, SINK.mirror.z);
    this.scene.updateMatrixWorld(true);
    this.room.mirrorMesh.visible = false;
    this.renderer.shadowMap.needsUpdate = true;
    cubeCamera.update(this.renderer, this.scene);
    this.room.mirrorMesh.visible = true;
    const material = this.room.mirrorMesh.material;
    material.envMap = target.texture;
    material.envMapIntensity = 1.35;
    material.needsUpdate = true;
    this.mirrorTarget = target;
    this.mirrorCamera = cubeCamera;
  }

  _setupContactShadows() {    const rects = [
      ...BED.centersZ.map((z) => ({ x: BED.centerX, z, sx: 2.05, sz: 0.98, o: 0.55 })),
      ...CART.z.map((z) => ({ x: CART.x, z, sx: 0.5, sz: 0.48, o: 0.3 })),
      { x: CABINET.centerX, z: CABINET.z, sx: 0.55, sz: 1.6, o: 0.42 },
      { x: (SINK.x0 + SINK.x1) / 2, z: (SINK.z0 + SINK.z1) / 2, sx: 0.68, sz: 1.0, o: 0.42 },
      { x: STEEL_CAB.x, z: STEEL_CAB.z, sx: 0.5, sz: 1.2, o: 0.4 },
      { x: OP.x, z: OP.z, sx: 0.82, sz: 2.0, o: 0.52 },
      { x: TRAY.x, z: TRAY.z, sx: 0.6, sz: 0.55, o: 0.3 },
      { x: STOOL.x, z: STOOL.z, sx: 0.5, sz: 0.5, o: 0.28 },
      { x: WASTE.x, z: WASTE.z, sx: 0.45, sz: 0.45, o: 0.28 },
      { x: PLANT.x, z: PLANT.z, sx: 0.55, sz: 0.55, o: 0.35 },
      { x: DOOR.centerX, z: DOOR.wallZ - 0.16, sx: 1.15, sz: 0.42, o: 0.24 },
    ];
    const geometry = planeGeometry(1, 1);
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
      map: this.textures.contactShadow,
      transparent: true,
      opacity: 0.55,
      color: 0x0a1211,
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
        new THREE.Vector3(rect.x, 0.0035, rect.z),
        new THREE.Quaternion(),
        new THREE.Vector3(rect.sx, 1, rect.sz),
      );
      instanced.setMatrixAt(index, matrix);
    });
    instanced.instanceMatrix.needsUpdate = true;
    instanced.renderOrder = 1;
    instanced.name = 'infirmary-contact-shadows';
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
      prompt: '暂未开放（预留走廊切换）',
      hitRoots: [this.room.doorGroup],
    };

    const curtainItems = this.curtains.map((curtain) => ({
      id: curtain.id,
      label: curtain.label,
      locked: false,
      portal: false,
      open: curtain.open,
      target: curtain.target,
      hitRoots: curtain.panels.map((panel) => panel.mesh),
    }));

    const glassItem = {
      id: CABINET.glassDoorId,
      label: '玻璃柜门',
      locked: false,
      portal: false,
      open: false,
      target: 0,
      hitRoots: [this.furniture.cabinet.panelA, this.furniture.cabinet.panelB],
    };

    const drawerItems = this.furniture.cabinet.drawers.map((drawer, index) => ({
      id: CABINET.drawerIds[index],
      label: '药柜抽屉',
      locked: false,
      portal: false,
      open: false,
      target: 0,
      hitRoots: [drawer],
    }));

    const wasteItem = {
      id: WASTE.id,
      label: WASTE.label,
      locked: false,
      portal: false,
      open: false,
      target: 0,
      hitRoots: [this.furniture.waste.group],
    };

    this.interactives = [doorItem, ...curtainItems, glassItem, ...drawerItems, wasteItem];
    this.interactiveById = new Map();
    this.interactiveMeshes = [];
    this.doorItem = doorItem;
    this.curtainItems = curtainItems;
    this.glassItem = glassItem;
    this.drawerItems = drawerItems;
    this.wasteItem = wasteItem;

    for (const entry of this.interactives) {
      this.interactiveById.set(entry.id, entry);
      for (const hitRoot of entry.hitRoots) {
        if (!hitRoot) {
          console.error('Infirmary: missing hit root for', entry.id);
          continue;
        }
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

    // Curtains: two pleated panels gather at the wall when open.
    for (const curtain of this.curtains) {
      const open = Boolean(curtain.open);
      for (const panel of curtain.panels) {
        const targetX = open ? panel.openX : panel.closedX;
        const targetZ = open ? panel.openZ : panel.closedZ;
        const targetScale = open ? 0.5 : 1;
        panel.mesh.position.x = damp(panel.mesh.position.x, targetX, 8.5, dt);
        panel.mesh.position.z = damp(panel.mesh.position.z, targetZ, 8.5, dt);
        panel.mesh.scale.x = damp(panel.mesh.scale.x, targetScale, 8.5, dt);
      }
    }

    // Cabinet glass slides behind its neighbour.
    const glassClosedZ = CABINET.z - CABINET.width / 4 + 0.005;
    const glassTargetZ = this.glassItem.open ? glassClosedZ + CABINET.width / 2 - 0.015 : glassClosedZ;
    this.furniture.cabinet.panelA.position.z = damp(this.furniture.cabinet.panelA.position.z, glassTargetZ, 9, dt);

    // Three wooden drawers pull out toward the aisle.
    this.furniture.cabinet.drawers.forEach((drawer, index) => {
      const baseX = CABINET.frontX - 0.002;
      const targetX = this.drawerItems[index].open ? baseX - CABINET.drawerOpen : baseX;
      drawer.position.x = damp(drawer.position.x, targetX, 9, dt);
    });

    // Waste-bin lid.
    const lidTarget = this.wasteItem.open ? -1.15 : 0;
    this.furniture.waste.lidGroup.rotation.x = damp(this.furniture.waste.lidGroup.rotation.x, lidTarget, 10, dt);

    // A slow pulse on the camera LED and display, just enough to feel live.
    const pulse = 0.5 + 0.5 * Math.sin(elapsed * 1.7);
    this.materials.ledRed.color.setHSL(0.015, 1, 0.38 + pulse * 0.18);
    this.displayPulse = pulse;
  }

  toggleInteractive(id) {
    const item = this.interactiveById.get(id);
    if (!item) return null;
    if (item.locked) return item;
    item.open = !item.open;
    item.target = item.open ? 1 : 0;
    this._syncState(id, item.open);
    return item;
  }

  setInteractive(id, value = true) {
    const item = this.interactiveById.get(id);
    if (!item) return null;
    if (item.locked) return item;
    item.open = Boolean(value);
    item.target = item.open ? 1 : 0;
    this._syncState(id, item.open);
    return item;
  }

  _syncState(id, open) {
    if (id.startsWith('curtain.')) {
      const curtain = this.curtains.find((entry) => entry.id === id);
      if (curtain) {
        curtain.open = open;
        curtain.target = open ? 1 : 0;
      }
    }
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
      area: this.stats.area,
      interactives: this.interactives.length,
      beds: this.stats.beds,
      bottles: this.stats.bottles,
      jars: this.stats.jars,
      instruments: this.stats.instruments,
      packages: this.stats.packages,
      curtains: this.stats.curtains,
      lightOn: true,
    };
  }

  dispose() {
    disposeObject(this.root);
    if (this.surgicalHalo) this.surgicalHalo.material.dispose();
    if (this.mirrorTarget) this.mirrorTarget.dispose();
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
