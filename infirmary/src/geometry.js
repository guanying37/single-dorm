import * as THREE from 'three';
import {
  StaticBuilder as BaseStaticBuilder,
  mergeGeometries as mergeBufferGeometries,
} from '../../dining/src/utils.js';

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

export {
  roundedBoxGeometry,
  frustumGeometry,
  bowlGeometry,
  crtScreenGeometry,
} from '../../kitchen/src/geometry.js';

/* ------------------------------------------------------------------ *
 * Static batcher variant that merges by material identity rather than
 * by bucket key. The infirmary reuses the same white paint / bedding /
 * steel / glass material under several semantic keys; without this,
 * each key would become its own draw call.
 * ------------------------------------------------------------------ */

export class MaterialStaticBuilder extends BaseStaticBuilder {
  flush(parent, materials, name = 'static') {
    const group = new THREE.Group();
    group.name = name;
    const groups = new Map();
    for (const [key, bucket] of this.buckets) {
      if (!bucket.geometries.length) continue;
      const material = materials[key];
      if (!material) {
        console.warn(`MaterialStaticBuilder: missing material "${key}"`);
        continue;
      }
      let entry = groups.get(material.uuid);
      if (!entry) {
        entry = { material, geometries: [], cast: false, receive: false };
        groups.set(material.uuid, entry);
      }
      entry.geometries.push(...bucket.geometries);
      entry.cast = entry.cast || bucket.castShadow;
      entry.receive = entry.receive || bucket.receiveShadow;
      bucket.geometries.length = 0;
    }
    let triangles = 0;
    for (const entry of groups.values()) {
      const geometry = mergeBufferGeometries(entry.geometries);
      const mesh = new THREE.Mesh(geometry, entry.material);
      mesh.name = `static:${entry.material.name || entry.material.uuid.slice(0, 6)}`;
      mesh.castShadow = entry.cast;
      mesh.receiveShadow = entry.receive;
      mesh.matrixAutoUpdate = false;
      group.add(mesh);
      triangles += geometry.index ? geometry.index.count / 3 : 0;
      entry.geometries.forEach((g) => g.dispose());
    }
    parent.add(group);
    return { group, triangles };
  }
}

/* ------------------------------------------------------------------ *
 * A hanging curtain panel. Vertical pleats are displaced in Z, with a
 * slightly stronger fold near the hem and a soft secondary ripple so the
 * panel never reads as corrugated card. The geometry is centred on the
 * origin; the scene positions it under the track.
 * ------------------------------------------------------------------ */

export function curtainPanelGeometry(width, height, pleats = 7, amplitude = 0.038, segmentsX = 40, segmentsY = 12) {
  const geometry = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);
  const position = geometry.attributes.position;
  const halfW = width / 2;
  const halfH = height / 2;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const u = (x + halfW) / width;
    const v = (y + halfH) / height;
    // The hem opens slightly, the top is gathered tighter.
    const depth = 0.55 + 0.45 * (1 - v);
    const fold = Math.sin(u * Math.PI * 2 * pleats) + 0.22 * Math.sin(u * Math.PI * 2 * pleats * 2 + 0.9);
    position.setZ(i, fold * amplitude * depth);
    // A tiny sag across the width keeps the bottom edge from being ruler-straight.
    position.setY(i, y - Math.sin(u * Math.PI) * 0.006 * (1 - v));
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/* ------------------------------------------------------------------ *
 * Heart-shaped pothos leaf with a shallow fold along the midrib. The
 * base of the leaf is at the origin, the tip points +Y.
 * ------------------------------------------------------------------ */

export function pothosLeafGeometry(width, length) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(-width * 0.52, length * 0.12, -width * 0.58, length * 0.72, 0, length);
  shape.bezierCurveTo(width * 0.58, length * 0.72, width * 0.52, length * 0.12, 0, 0);
  const geometry = new THREE.ShapeGeometry(shape, 10);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const t = Math.max(0, Math.min(1, y / length));
    // Fold up along the midrib, curl the tip, and let the lobes droop.
    position.setZ(i, Math.abs(x) * 0.34 + Math.sin(t * Math.PI) * 0.008 - Math.pow(t, 3) * length * 0.05);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/* A small white medicine bottle: gently shouldered body with a screw cap.
 * Returned centred at its base. */
export function bottleGeometry(radius, height) {
  const profile = [
    [0, 0],
    [radius * 0.92, 0],
    [radius, height * 0.03],
    [radius, height * 0.7],
    [radius * 0.88, height * 0.8],
    [radius * 0.5, height * 0.86],
    [radius * 0.42, height * 0.9],
    [radius * 0.42, height],
    [0, height],
  ];
  return new THREE.LatheGeometry(
    profile.map(([r, h]) => new THREE.Vector2(Math.max(0.0005, r), h)),
    14,
  );
}

/* A shallow kidney dish, opening +Y. */
export function kidneyDishGeometry(length, width, depth) {
  const shape = new THREE.Shape();
  shape.moveTo(-length * 0.5, 0);
  shape.bezierCurveTo(-length * 0.42, width * 0.65, length * 0.14, width * 0.58, length * 0.38, width * 0.24);
  shape.bezierCurveTo(length * 0.56, width * 0.02, length * 0.5, -width * 0.34, length * 0.24, -width * 0.5);
  shape.bezierCurveTo(-length * 0.12, -width * 0.62, -length * 0.46, -width * 0.5, -length * 0.5, 0);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 2, steps: 1, curveSegments: 10 });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, depth, 0);
  geometry.computeVertexNormals();
  return geometry;
}

/* A five-star caster base built from tapered spokes; used by the doctor
 * stool and instrument stand. Returns an array of {geometry, matrix}
 * pairs so the builder can merge them. */
export function starBaseGeometries(radius, legHeight, legWidth = 0.045) {
  const list = [];
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2;
    const geometry = new THREE.BoxGeometry(radius, legHeight, legWidth);
    geometry.translate(radius / 2, 0, 0);
    const matrix = new THREE.Matrix4().makeRotationY(angle);
    list.push({ geometry, matrix });
  }
  return list;
}

/* A surgical-lamp housing: a shallow dish opening downward. */
export function lampDishGeometry(radius, height, segments = 40) {
  const profile = [
    [0, height],
    [radius * 0.2, height * 0.96],
    [radius * 0.55, height * 0.82],
    [radius * 0.86, height * 0.5],
    [radius, height * 0.12],
    [radius, 0],
    [radius * 0.9, 0],
    [radius * 0.88, height * 0.14],
    [radius * 0.55, height * 0.56],
    [radius * 0.24, height * 0.78],
    [0, height * 0.8],
  ];
  return new THREE.LatheGeometry(
    profile.map(([r, h]) => new THREE.Vector2(Math.max(0.0005, r), h)),
    segments,
  );
}
