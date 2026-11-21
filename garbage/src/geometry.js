import * as THREE from 'three';
import { mulberry32 } from '../../dining/src/utils.js';
import { roundedBoxGeometry } from '../../kitchen/src/geometry.js';

export {
  clamp,
  damp,
  easeInOutCubic,
  mulberry32,
  trs,
  boxGeometry,
  planeGeometry,
  uvScaledPlane,
  cylinderGeometry,
  sphereGeometry,
  torusGeometry,
  latheGeometry,
  tubeGeometry,
  rodGeometry,
  mergeGeometries,
  StaticBuilder,
  disposeObject,
} from '../../dining/src/utils.js';

export { crtScreenGeometry, roundedBoxGeometry, frustumGeometry, bowlGeometry } from '../../kitchen/src/geometry.js';

/* ------------------------------------------------------------------ *
 * A filled burlap sack: a rounded, slightly lumpy bag whose upper part
 * gathers into a tied neck. A rounded box (rather than a lathe) keeps a
 * flat bottom and a bag-like silhouette instead of a pot.
 * ------------------------------------------------------------------ */

export function sackGeometry(halfWidth, height, seed = 0) {
  const geometry = roundedBoxGeometry(halfWidth * 2, height, halfWidth * 1.7, halfWidth * 0.32, 3);
  geometry.translate(0, height / 2, 0);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    let x = position.getX(i);
    let y = position.getY(i);
    let z = position.getZ(i);
    const t = Math.max(0, Math.min(1, y / height));
    const angle = Math.atan2(z, x);
    // Only the last fifth gathers in; the body stays broad like a full sack.
    const pinch = t > 0.8 ? 1 - ((t - 0.8) / 0.2) * 0.2 : 1;
    const wobble = 1 + 0.055 * Math.sin(angle * 3 + seed * 0.7) + 0.028 * Math.sin(angle * 7 - t * 5.2);
    x *= pinch * wobble;
    z *= pinch * wobble;
    // A little slump toward one side as the sack fills out.
    x += Math.sin(t * Math.PI) * halfWidth * 0.035;
    y += Math.sin(angle * 2 + seed) * height * 0.004 * (t > 0.15 ? 1 : 0);
    position.setXYZ(i, x, y, z);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/* A flattened sack lying on its side, with a little slump. */
export function slumpedSackGeometry(halfWidth, length, seed = 0) {
  const geometry = sackGeometry(halfWidth, length, seed);
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, halfWidth * 0.62, 0);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const y = position.getY(i);
    if (y < 0) continue;
    // Press the underside flat-ish against the floor, but keep the bag volume.
    position.setY(i, y * (0.9 - Math.min(0.3, y * 0.55)));
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/* ------------------------------------------------------------------ *
 * A coiled rope lying flat: a slightly wandering helix with a loose
 * tail, built as one tube. `height` is the stack height.
 * ------------------------------------------------------------------ */

export function ropeCoilGeometry(radius, tube, turns = 5, height = 0.05, seed = 0) {
  const rng = mulberry32(seed);
  const points = [];
  const count = Math.max(40, Math.round(turns * 22));
  for (let i = 0; i <= count; i += 1) {
    const t = i / count;
    const angle = t * turns * Math.PI * 2;
    const wobble = 1 + Math.sin(angle * 0.7 + seed) * 0.035 + (rng() - 0.5) * 0.012;
    const r = radius * wobble * (0.94 + 0.06 * t);
    points.push(new THREE.Vector3(Math.cos(angle) * r, 0.008 + t * height, Math.sin(angle) * r));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, count * 2, tube, 5, false);
}

/* A vertical coil hanging from a hook: three offset rings plus a tail.
 * Returned in local space, centred on the hook point. */
export function hangingCoilGeometries(radius, tube, seed = 0) {
  const rng = mulberry32(seed);
  const list = [];
  for (let i = 0; i < 4; i += 1) {
    const ring = new THREE.TorusGeometry(radius * (0.96 + i * 0.012), tube, 5, 22);
    ring.rotateY(Math.PI / 2);
    ring.translate((i - 1.5) * tube * 1.6, -radius * (1 - i * 0.05), 0);
    // A small local rotation gives the coil some hand-wound looseness.
    const matrix = new THREE.Matrix4().makeRotationX((rng() - 0.5) * 0.06);
    ring.applyMatrix4(matrix);
    list.push(ring);
  }
  const tail = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(tube * 2, -radius * 1.9, 0),
      new THREE.Vector3(radius * 0.42, -radius * 2.05, radius * 0.16),
      new THREE.Vector3(radius * 0.62, -radius * 2.5, radius * 0.2),
    ]),
    12,
    tube,
    5,
    false,
  );
  list.push(tail);
  return list;
}

/* A crockery / bucket profile: straight-ish body, rolled rim. Lathe
 * profile is closed at the bottom so the bucket reads solid from any
 * angle. */
export function bucketGeometry(topRadius, bottomRadius, height, segments = 16) {
  const profile = [
    [0, 0],
    [bottomRadius * 0.92, 0],
    [bottomRadius, height * 0.04],
    [bottomRadius * 1.01, height * 0.2],
    [topRadius * 0.96, height * 0.86],
    [topRadius, height * 0.94],
    [topRadius * 1.02, height],
    [topRadius * 0.93, height],
    [topRadius * 0.92, height * 0.93],
    [bottomRadius * 0.9, height * 0.06],
    [0, height * 0.05],
  ];
  return new THREE.LatheGeometry(
    profile.map(([r, h]) => new THREE.Vector2(Math.max(0.0005, r), h)),
    segments,
  );
}

/* A short length of split-loom / corrugated conduit. */
export function conduitGeometry(radius, height, segments = 8) {
  const geometry = new THREE.CylinderGeometry(radius, radius, height, segments, Math.max(2, Math.round(height * 10)), true);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const y = position.getY(i) * 12; // ring index
    const x = position.getX(i);
    const z = position.getZ(i);
    const angle = Math.atan2(z, x);
    const ridge = 1 + 0.055 * Math.sin(angle * 2 + y * 2.2);
    position.setX(i, x * ridge);
    position.setZ(i, z * ridge);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}
