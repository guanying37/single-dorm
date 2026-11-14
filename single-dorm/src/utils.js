import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/RoundedBoxGeometry.js';

/* ------------------------------------------------------------------ *
 * Shared geometry. Boxes use one unit-cube geometry and per-mesh scale
 * wherever stretching cannot hurt the material. This keeps geometry
 * memory tiny and the renderer uploads low.
 * ------------------------------------------------------------------ */

export const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
export const UNIT_PLANE = new THREE.PlaneGeometry(1, 1);
export const UNIT_SPHERE = new THREE.SphereGeometry(1, 20, 14);

const cylinderCache = new Map();
const roundedBoxCache = new Map();

export function cylinderGeometry(radiusTop, radiusBottom, height, segments = 12, openEnded = false) {
  const key = `${radiusTop}|${radiusBottom}|${height}|${segments}|${openEnded ? 1 : 0}`;
  let geometry = cylinderCache.get(key);
  if (!geometry) {
    geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments, 1, openEnded);
    cylinderCache.set(key, geometry);
  }
  return geometry;
}

export function roundedBoxGeometry(width, height, depth, segments = 2, radius = 0.02) {
  const key = `${width}|${height}|${depth}|${segments}|${radius}`;
  let geometry = roundedBoxCache.get(key);
  if (!geometry) {
    geometry = new RoundedBoxGeometry(width, height, depth, segments, radius);
    roundedBoxCache.set(key, geometry);
  }
  return geometry;
}

export function roundedBoxMesh(material, width, height, depth, segments = 2, radius = 0.02) {
  return new THREE.Mesh(roundedBoxGeometry(width, height, depth, segments, radius), material);
}

/* ------------------------------------------------------------------ *
 * Mesh helpers
 * ------------------------------------------------------------------ */

export function box(material, width, height, depth, x = 0, y = 0, z = 0, options = {}) {
  const mesh = new THREE.Mesh(UNIT_BOX, material);
  mesh.scale.set(width, height, depth);
  mesh.position.set(x, y, z);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  mesh.castShadow = options.cast ?? true;
  mesh.receiveShadow = options.receive ?? true;
  mesh.name = options.name || '';
  return mesh;
}

export function addBox(parent, material, width, height, depth, x, y, z, options = {}) {
  const mesh = box(material, width, height, depth, x, y, z, options);
  parent.add(mesh);
  return mesh;
}

export function plane(material, width, height, x = 0, y = 0, z = 0, options = {}) {
  const mesh = new THREE.Mesh(UNIT_PLANE, material);
  mesh.scale.set(width, height, 1);
  mesh.position.set(x, y, z);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  mesh.castShadow = options.cast ?? false;
  mesh.receiveShadow = options.receive ?? true;
  mesh.name = options.name || '';
  return mesh;
}

export function cylinder(material, radiusTop, radiusBottom, height, x, y, z, options = {}) {
  const mesh = new THREE.Mesh(
    cylinderGeometry(radiusTop, radiusBottom, height, options.segments ?? 12, options.openEnded ?? false),
    material,
  );
  mesh.position.set(x, y, z);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  mesh.castShadow = options.cast ?? true;
  mesh.receiveShadow = options.receive ?? true;
  return mesh;
}

export function sphere(material, radius, x = 0, y = 0, z = 0, options = {}) {
  const mesh = new THREE.Mesh(UNIT_SPHERE, material);
  mesh.scale.setScalar(radius);
  mesh.position.set(x, y, z);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  mesh.castShadow = options.cast ?? true;
  mesh.receiveShadow = options.receive ?? true;
  return mesh;
}

export function setShadows(object, cast = true, receive = true) {
  object.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = cast;
    child.receiveShadow = receive;
  });
  return object;
}

/* ------------------------------------------------------------------ *
 * Rounded shapes / trim
 * ------------------------------------------------------------------ */

export function roundedRectShape(width, height, radius) {
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w, h);
  const shape = new THREE.Shape();
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);
  shape.closePath();
  return shape;
}

/**
 * A flat rounded slab that sits with its lowest point at y=0.
 * Width is X, depth is Z and thickness is Y.
 */
export function roundedSlabGeometry(width, depth, thickness, radius, bevel = 0.008, curveSegments = 5) {
  const shape = roundedRectShape(width, depth, radius);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.001, thickness - bevel * 2),
    bevelEnabled: bevel > 0,
    bevelSegments: 2,
    bevelSize: bevel,
    bevelThickness: bevel,
    curveSegments,
    steps: 1,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox;
  geometry.translate(0, -bb.min.y, 0);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * A closed picture-frame ring. The local +Z axis is the front.
 * The back face sits at z=0.
 */
export function frameRingGeometry(width, height, bar, depth, radius = 0.008, bevel = 0.002) {
  const outer = roundedRectShape(width, height, radius);
  const innerWidth = width - bar * 2;
  const innerHeight = height - bar * 2;
  const inner = roundedRectShape(innerWidth, innerHeight, Math.max(0.004, radius - bar * 0.35));
  const hole = new THREE.Path(inner.getPoints(24));
  outer.holes.push(hole);
  const geometry = new THREE.ExtrudeGeometry(outer, {
    depth: Math.max(0.001, depth - bevel * 2),
    bevelEnabled: bevel > 0,
    bevelSegments: 1,
    bevelSize: bevel,
    bevelThickness: bevel,
    curveSegments: 6,
    steps: 1,
  });
  geometry.computeBoundingBox();
  geometry.translate(0, 0, -geometry.boundingBox.min.z);
  geometry.computeVertexNormals();
  return geometry;
}

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */

export function addMesh(parent, mesh) {
  parent.add(mesh);
  return mesh;
}

export function group(name = '') {
  const g = new THREE.Group();
  g.name = name;
  return g;
}

export function damp(current, target, lambda, dt) {
  return target + (current - target) * Math.exp(-lambda * dt);
}

export function dampAngle(current, target, lambda, dt) {
  let delta = target - current;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return current + delta * (1 - Math.exp(-lambda * dt));
}

export function makeCable(points, radius, material, tubularSegments = 28, radialSegments = 5) {
  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

export function isCoarsePointer() {
  return window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
}
