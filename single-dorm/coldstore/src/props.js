import * as THREE from 'three';
import {
  boxGeometry,
  cylinderGeometry,
  planeGeometry,
  roundedBoxGeometry,
  crtScreenGeometry,
  trs,
  mulberry32,
  StaticBuilder,
} from './geometry.js';
import { WALL, EVAP, ROOM } from './config.js';

/* ------------------------------------------------------------------ *
 * Dynamic props: the aged grey wall monitor and the slow cold-air
 * particles that sink out of the evaporator and drift down the aisle.
 * The monitor casing is merged; only the phosphor glass and the rolling
 * scan band are updated per frame.
 * ------------------------------------------------------------------ */

function screenMaterial(texture, tint = 0xffffff) {
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
    opacity: 0.1,
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

/* --- Aged grey wall monitor --------------------------------------- */

function buildWallMonitor(materials, textures) {
  const group = new THREE.Group();
  group.name = 'cold-store-wall-crt';
  group.position.set(WALL.crt.x, WALL.crt.y, WALL.crt.z);
  group.rotation.y = Math.PI;

  const builder = new StaticBuilder();
  const add = (key, geometry, matrix) => builder.add(key, geometry, matrix, { cast: false, receive: true });

  // Thick, heavy grey-white shell with a shadowed rear bulge.
  add('crtBeige', roundedBoxGeometry(0.62, 0.5, 0.4, 0.038, 4), trs(0, 0, 0));
  add('crtBeigeShade', roundedBoxGeometry(0.36, 0.32, 0.18, 0.032, 3), trs(0, -0.012, -0.25));

  // Chunky bezel around a recessed convex screen.
  for (const bar of [
    { w: 0.62, h: 0.07, d: 0.06, x: 0, y: 0.212, z: 0.205 },
    { w: 0.62, h: 0.082, d: 0.06, x: 0, y: -0.208, z: 0.205 },
    { w: 0.082, h: 0.36, d: 0.06, x: -0.268, y: 0, z: 0.205 },
    { w: 0.082, h: 0.36, d: 0.06, x: 0.268, y: 0, z: 0.205 },
  ]) {
    add('crtBeige', roundedBoxGeometry(bar.w, bar.h, bar.d, 0.016, 3), trs(bar.x, bar.y, bar.z));
  }
  add('blackPlastic', roundedBoxGeometry(0.51, 0.37, 0.03, 0.02, 3), trs(0, 0, 0.218));

  // Top vents, side grille, control strip, knobs and power LED.
  for (let i = 0; i < 6; i += 1) {
    add('crtBeigeShade', boxGeometry(0.045, 0.008, 0.2), trs(-0.19 + i * 0.075, 0.252, -0.02));
  }
  for (let i = 0; i < 6; i += 1) {
    add('crtBeigeShade', boxGeometry(0.008, 0.022, 0.18), trs(0.312, -0.09 + i * 0.04, -0.02));
  }
  add('crtBeigeShade', boxGeometry(0.25, 0.032, 0.012), trs(0, -0.195, 0.235));
  add('warningRed', cylinderGeometry(0.007, 0.007, 0.006, 8), trs(0.1, -0.195, 0.243, 0, 1, 1, 1, Math.PI / 2, 0));
  add('blackPlastic', cylinderGeometry(0.018, 0.018, 0.012, 12), trs(-0.09, -0.195, 0.243, 0, 1, 1, 1, Math.PI / 2, 0));
  add('blackPlastic', cylinderGeometry(0.018, 0.018, 0.012, 12), trs(-0.045, -0.195, 0.243, 0, 1, 1, 1, Math.PI / 2, 0));
  add('blackPlastic', cylinderGeometry(0.014, 0.014, 0.01, 10), trs(0.155, -0.195, 0.243, 0, 1, 1, 1, Math.PI / 2, 0));

  builder.flush(group, materials, 'cold-crt-casing');

  const screen = new THREE.Mesh(
    crtScreenGeometry(0.45, 0.31, 0.026, 26, 18),
    screenMaterial(textures.cctv),
  );
  screen.position.set(0, 0.004, 0.236);
  screen.castShadow = false;
  screen.receiveShadow = false;
  screen.name = 'cold-crt-screen';
  group.add(screen);

  const band = scanBand(textures.scanBand, 0.43, 0.3, 0.272);
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

  return { group, screen, band, phase: 0.7 };
}

/* --- Cold-air particles -------------------------------------------- *
 * Two additive point clouds: a fine "breath" spilling from the evaporator
 * outlet and a larger, slower haze that hangs in the aisle. Both wrap
 * back to the source, so nothing ever leaves the room. */

function createMist(textures) {
  const makeLayer = (count, size, opacity, bounds, speed) => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);
    const swayX = new Float32Array(count);
    const swayZ = new Float32Array(count);

    const rng = mulberry32(0x9e3779b9);
    const place = (index, fromTop) => {
      const x = bounds.x0 + rng() * (bounds.x1 - bounds.x0);
      const z = bounds.z0 + rng() * (bounds.z1 - bounds.z0);
      const y = fromTop
        ? bounds.y1 - rng() * 0.18
        : bounds.y0 + rng() * (bounds.y1 - bounds.y0);
      positions[index * 3] = x;
      positions[index * 3 + 1] = y;
      positions[index * 3 + 2] = z;
      speeds[index] = speed * (0.55 + rng() * 0.9);
      phases[index] = rng() * Math.PI * 2;
      swayX[index] = (rng() - 0.5) * 0.05;
      swayZ[index] = 0.018 + rng() * 0.05;
    };

    for (let i = 0; i < count; i += 1) place(i, false);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(0, 1.25, 0),
      Math.max(ROOM.width, ROOM.depth) * 0.8,
    );

    const material = new THREE.PointsMaterial({
      size,
      map: textures.mist,
      color: 0xdcf0fb,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      toneMapped: false,
      name: 'cold-mist',
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = 5;
    return { points, positions, speeds, phases, swayX, swayZ, count, bounds, place };
  };

  // Breath right under the evaporator fans.
  const breath = makeLayer(
    230,
    0.04,
    0.13,
    { x0: EVAP.x - EVAP.width / 2 + 0.08, x1: EVAP.x + EVAP.width / 2 - 0.08, z0: -2.42, z1: -1.5, y0: 0.35, y1: 2.02 },
    0.16,
  );
  // Slow haze through the whole aisle.
  const haze = makeLayer(
    140,
    0.08,
    0.055,
    { x0: -0.62, x1: 0.62, z0: -2.3, z1: 2.5, y0: 0.25, y1: 1.9 },
    0.045,
  );

  const update = (dt, elapsed) => {
    for (const layer of [breath, haze]) {
      const { positions, speeds, phases, swayX, swayZ, count, bounds } = layer;
      for (let i = 0; i < count; i += 1) {
        const iy = i * 3 + 1;
        positions[iy] -= speeds[i] * dt;
        positions[i * 3] += Math.sin(elapsed * 0.55 + phases[i]) * swayX[i] * dt;
        positions[i * 3 + 2] += (swayZ[i] + Math.cos(elapsed * 0.42 + phases[i]) * 0.02) * dt;
        if (positions[iy] < bounds.y0 || positions[i * 3 + 2] > bounds.z1) {
          positions[iy] = bounds.y1 - Math.random() * 0.12;
          positions[i * 3] = bounds.x0 + Math.random() * (bounds.x1 - bounds.x0);
          positions[i * 3 + 2] = bounds.z0 + Math.random() * (bounds.z1 - bounds.z0) * 0.6;
        }
      }
      layer.points.geometry.attributes.position.needsUpdate = true;
    }
  };

  return { breath, haze, update };
}

/* --- Assembly ------------------------------------------------------ */

export function buildProps(root, materials, textures) {
  const monitor = buildWallMonitor(materials, textures);
  root.add(monitor.group);

  const mist = createMist(textures);
  root.add(mist.breath.points, mist.haze.points);

  // Small static brackets for the CRT cable tray are in room.js; this is
  // only the flickering feed and the drifting air.
  return {
    monitor,
    mist,
    update(elapsed, dt) {
      const flicker =
        0.92 +
        Math.sin(elapsed * 11.3 + monitor.phase) * 0.026 +
        Math.sin(elapsed * 37.1 + monitor.phase * 2) * 0.012 +
        Math.sin(elapsed * 2.7 + monitor.phase) * 0.012;
      monitor.screen.material.color.setRGB(0.7 * flicker, 0.99 * flicker, 0.74 * flicker);
      monitor.band.position.y = Math.sin(elapsed * 0.7 + monitor.phase) * 0.13;
      monitor.band.material.opacity = 0.065 + Math.max(0, Math.sin(elapsed * 1.9 + monitor.phase)) * 0.05;
      mist.update(dt, elapsed);
    },
  };
}

