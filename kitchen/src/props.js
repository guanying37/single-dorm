import * as THREE from 'three';
import {
  boxGeometry,
  cylinderGeometry,
  planeGeometry,
  tubeGeometry,
  trs,
  roundedBoxGeometry,
  crtScreenGeometry,
  StaticBuilder,
} from './geometry.js';
import { PREP } from './config.js';

/* ------------------------------------------------------------------ *
 * Surveillance corner.
 *
 * Two old CRT monitors with thick aged-plastic shells, convex glass,
 * green phosphor flicker and an abstract, unreadable kitchen feed. The
 * static shells are merged per material; only the screen and the moving
 * scan band remain dynamic.
 * ------------------------------------------------------------------ */

function screenMaterial(texture, tint = 0xc3f4c7) {
  return new THREE.MeshBasicMaterial({
    map: texture,
    color: tint,
    toneMapped: false,
    name: 'crt-phosphor',
  });
}

function scanBand(texture, width, height, z) {
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    color: 0xc8ffcf,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    side: THREE.DoubleSide,
    name: 'crt-scan-band',
  });
  const mesh = new THREE.Mesh(planeGeometry(width, height), material);
  mesh.position.set(0, 0, z);
  mesh.renderOrder = 6;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

/* --- Wall monitor ------------------------------------------------- */

function buildWallMonitor(materials, textures) {
  const group = new THREE.Group();
  group.name = 'wall-crt-monitor';
  group.position.set(PREP.wallCrt.x, PREP.wallCrt.y, PREP.wallCrt.z - 0.215);
  group.rotation.y = Math.PI;

  const builder = new StaticBuilder();
  const add = (key, geometry, matrix) => builder.add(key, geometry, matrix, { cast: false, receive: true });

  add('crtBeige', roundedBoxGeometry(0.6, 0.47, 0.4, 0.035, 4), trs(0, 0, 0));
  add('crtBeigeShade', roundedBoxGeometry(0.34, 0.3, 0.18, 0.03, 3), trs(0, -0.01, -0.25));

  // Four chunky bezel bars around the recessed screen.
  for (const bar of [
    { w: 0.6, h: 0.065, d: 0.055, x: 0, y: 0.198, z: 0.202 },
    { w: 0.6, h: 0.075, d: 0.055, x: 0, y: -0.198, z: 0.202 },
    { w: 0.075, h: 0.34, d: 0.055, x: -0.262, y: 0, z: 0.202 },
    { w: 0.075, h: 0.34, d: 0.055, x: 0.262, y: 0, z: 0.202 },
  ]) {
    add('crtBeige', roundedBoxGeometry(bar.w, bar.h, bar.d, 0.015, 3), trs(bar.x, bar.y, bar.z));
  }
  add('blackPlastic', roundedBoxGeometry(0.5, 0.36, 0.03, 0.02, 3), trs(0, 0, 0.215));

  // Top and side vents, control strip and power LED.
  for (let i = 0; i < 6; i += 1) {
    add('crtBeigeShade', boxGeometry(0.045, 0.008, 0.2), trs(-0.18 + i * 0.072, 0.238, -0.02));
  }
  for (let i = 0; i < 5; i += 1) {
    add('crtBeigeShade', boxGeometry(0.008, 0.022, 0.18), trs(0.302, -0.08 + i * 0.04, -0.02));
  }
  add('crtBeigeShade', boxGeometry(0.24, 0.032, 0.012), trs(0, -0.185, 0.232));
  add('fireRed', cylinderGeometry(0.007, 0.007, 0.006, 8), trs(0.095, -0.185, 0.24, 0, 1, 1, 1, Math.PI / 2, 0));
  add('blackPlastic', cylinderGeometry(0.018, 0.018, 0.012, 12), trs(-0.085, -0.185, 0.24, 0, 1, 1, 1, Math.PI / 2, 0));
  add('blackPlastic', cylinderGeometry(0.018, 0.018, 0.012, 12), trs(-0.045, -0.185, 0.24, 0, 1, 1, 1, Math.PI / 2, 0));

  builder.flush(group, materials, 'wall-crt-casing');

  const screen = new THREE.Mesh(
    crtScreenGeometry(0.445, 0.305, 0.026, 26, 18),
    screenMaterial(textures.cctvWall),
  );
  screen.position.set(0, 0.005, 0.232);
  screen.castShadow = false;
  screen.receiveShadow = false;
  screen.name = 'wall-crt-screen';
  group.add(screen);

  const band = scanBand(textures.scanBand, 0.43, 0.3, 0.268);
  group.add(band);

  group.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = true;
  });
  screen.castShadow = false;
  screen.receiveShadow = false;
  band.castShadow = false;
  band.receiveShadow = false;
  return { group, screen, band, phase: 0.2 };
}

/* --- Floor monitor ------------------------------------------------ */

function buildFloorMonitor(materials, textures) {
  const group = new THREE.Group();
  group.name = 'floor-crt-monitor';
  group.position.set(PREP.floorCrt.x, 1.42, PREP.floorCrt.z);
  group.rotation.y = -2.16;

  const builder = new StaticBuilder();
  const add = (key, geometry, matrix) => builder.add(key, geometry, matrix, { cast: false, receive: true });

  add('crtBeige', roundedBoxGeometry(0.64, 0.53, 0.5, 0.04, 4), trs(0, 0, 0));
  add('crtBeigeShade', roundedBoxGeometry(0.4, 0.36, 0.2, 0.035, 3), trs(0, -0.01, -0.32));
  for (const bar of [
    { w: 0.64, h: 0.07, d: 0.06, x: 0, y: 0.228, z: 0.252 },
    { w: 0.64, h: 0.09, d: 0.06, x: 0, y: -0.222, z: 0.252 },
    { w: 0.08, h: 0.39, d: 0.06, x: -0.282, y: 0, z: 0.252 },
    { w: 0.08, h: 0.39, d: 0.06, x: 0.282, y: 0, z: 0.252 },
  ]) {
    add('crtBeige', roundedBoxGeometry(bar.w, bar.h, bar.d, 0.015, 3), trs(bar.x, bar.y, bar.z));
  }
  add('blackPlastic', roundedBoxGeometry(0.54, 0.4, 0.03, 0.02, 3), trs(0, 0, 0.268));

  // Top grille, side vents, control flap, knobs and LED.
  for (let i = 0; i < 8; i += 1) {
    add('crtBeigeShade', boxGeometry(0.036, 0.008, 0.12), trs(-0.21 + i * 0.06, 0.268, 0.08));
  }
  for (let i = 0; i < 6; i += 1) {
    add('crtBeigeShade', boxGeometry(0.008, 0.02, 0.24), trs(0.322, -0.1 + i * 0.042, 0));
    add('crtBeigeShade', boxGeometry(0.008, 0.02, 0.24), trs(-0.322, -0.1 + i * 0.042, 0));
  }
  add('crtBeigeShade', boxGeometry(0.28, 0.045, 0.014), trs(0, -0.21, 0.29));
  for (let i = 0; i < 3; i += 1) {
    add('blackPlastic', cylinderGeometry(0.017, 0.017, 0.012, 12), trs(-0.09 + i * 0.055, -0.21, 0.3, 0, 1, 1, 1, Math.PI / 2, 0));
  }
  add('fireRed', cylinderGeometry(0.007, 0.007, 0.006, 8), trs(0.115, -0.21, 0.3, 0, 1, 1, 1, Math.PI / 2, 0));

  builder.flush(group, materials, 'floor-crt-casing');

  const screen = new THREE.Mesh(
    crtScreenGeometry(0.485, 0.345, 0.03, 26, 18),
    screenMaterial(textures.cctvSplit, 0xc8f8cd),
  );
  screen.position.set(0, 0.005, 0.286);
  screen.castShadow = false;
  screen.receiveShadow = false;
  screen.name = 'floor-crt-screen';
  group.add(screen);

  const band = scanBand(textures.scanBand, 0.47, 0.34, 0.328);
  group.add(band);

  group.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = true;
  });
  screen.castShadow = false;
  screen.receiveShadow = false;
  band.castShadow = false;
  band.receiveShadow = false;
  return { group, screen, band, phase: 2.1 };
}

/* --- Static brackets, stands and cables --------------------------- */

function addMounting(builder, materials) {
  const wx = PREP.wallCrt.x;
  const wy = PREP.wallCrt.y;
  const wz = PREP.wallCrt.z;

  builder.add('steelDark', boxGeometry(0.34, 0.34, 0.035), trs(wx, wy, wz - 0.02), { cast: false });
  builder.add('steel', boxGeometry(0.07, 0.07, 0.2), trs(wx - 0.1, wy, wz - 0.13), { cast: false });
  builder.add('steel', boxGeometry(0.07, 0.07, 0.2), trs(wx + 0.1, wy, wz - 0.13), { cast: false });
  // Shelf and small recorder under the monitor.
  builder.add('steel', boxGeometry(0.72, 0.035, 0.3), trs(wx, wy - 0.34, wz - 0.18), { cast: false });
  for (const side of [-1, 1]) {
    builder.add('steelDark', boxGeometry(0.04, 0.2, 0.28), trs(wx + side * 0.32, wy - 0.445, wz - 0.18), { cast: false });
  }
  builder.add('blackPlastic', boxGeometry(0.44, 0.085, 0.26), trs(wx, wy - 0.285, wz - 0.19), { cast: false });
  for (let i = 0; i < 5; i += 1) {
    builder.add('steelDark', boxGeometry(0.31, 0.006, 0.012), trs(wx - 0.02, wy - 0.265, wz - 0.06 + i * 0.018), { cast: false });
  }
  builder.add('fireRed', boxGeometry(0.035, 0.012, 0.008), trs(wx + 0.16, wy - 0.305, wz - 0.055), { cast: false });
  // Cable from the monitor down behind the shelf.
  builder.add(
    'rubber',
    tubeGeometry(
      [
        [wx + 0.18, wy - 0.18, wz - 0.26],
        [wx + 0.26, wy - 0.28, wz - 0.18],
        [wx + 0.26, wy - 0.52, wz - 0.04],
        [wx + 0.26, wy - 0.7, wz - 0.03],
      ],
      0.013,
      18,
      6,
    ),
    trs(0, 0, 0),
    { cast: false },
  );
  builder.add('steelDark', boxGeometry(0.07, 0.12, 0.035), trs(wx + 0.26, wy - 0.75, wz - 0.02), { cast: false });

  // Floor monitor pedestal: weighted plate, column, clamp and cable.
  const fx = PREP.floorCrt.x;
  const fz = PREP.floorCrt.z;
  builder.add('steelDark', boxGeometry(0.54, 0.045, 0.46), trs(fx, 0.023, fz));
  builder.add('steel', boxGeometry(0.42, 0.035, 0.34), trs(fx, 0.062, fz));
  builder.add('steel', cylinderGeometry(0.045, 0.045, 1.02, 12), trs(fx, 0.57, fz));
  builder.add('steelDark', cylinderGeometry(0.12, 0.12, 0.035, 16), trs(fx, 1.08, fz));
  builder.add('steel', boxGeometry(0.3, 0.06, 0.07), trs(fx, 1.1, fz));
  builder.add('rubber', boxGeometry(0.24, 0.02, 0.2), trs(fx, 1.13, fz), { cast: false });
  builder.add(
    'rubber',
    tubeGeometry(
      [
        [fx + 0.22, 1.22, fz + 0.16],
        [fx + 0.28, 0.9, fz + 0.24],
        [fx + 0.24, 0.1, fz + 0.28],
        [fx + 0.15, 0.012, fz + 0.22],
      ],
      0.014,
      20,
      6,
    ),
    trs(0, 0, 0),
    { cast: false },
  );
  builder.add('steelDark', boxGeometry(0.1, 0.03, 0.1), trs(fx + 0.15, 0.015, fz + 0.22), { cast: false });
}

export function buildProps(builder, root, materials, textures) {
  addMounting(builder, materials);

  const wall = buildWallMonitor(materials, textures);
  const floor = buildFloorMonitor(materials, textures);
  root.add(wall.group, floor.group);

  return {
    screens: [wall, floor],
    update(elapsed) {
      for (const entry of this.screens) {
        const flicker =
          0.9 +
          Math.sin(elapsed * 12.7 + entry.phase) * 0.025 +
          Math.sin(elapsed * 41.3 + entry.phase * 2) * 0.012 +
          Math.sin(elapsed * 3.1 + entry.phase) * 0.01;
        entry.screen.material.color.setRGB(0.66 * flicker, 0.98 * flicker, 0.7 * flicker);
        entry.band.position.y = Math.sin(elapsed * 0.85 + entry.phase) * 0.13;
        entry.band.material.opacity = 0.075 + Math.max(0, Math.sin(elapsed * 2.1 + entry.phase)) * 0.05;
      }
    },
  };
}
