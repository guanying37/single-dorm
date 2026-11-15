import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 * Geometry + math helpers shared by every builder.
 *
 * The hall contains thousands of small pieces (54 chairs, 360 utensils,
 * 40 flowers ...). Every static piece is baked into a few merged buffers
 * grouped by material, so this module owns the merge and batch logic.
 * ------------------------------------------------------------------ */

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function damp(current, target, lambda, dt) {
  return target + (current - target) * Math.exp(-lambda * dt);
}

export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ *
 * Matrix helpers
 * ------------------------------------------------------------------ */

const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();

export function trs(x = 0, y = 0, z = 0, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) {
  _e.set(rx, ry, rz, 'YXZ');
  _q.setFromEuler(_e);
  _p.set(x, y, z);
  _s.set(sx, sy, sz);
  return new THREE.Matrix4().compose(_p, _q, _s);
}

/* ------------------------------------------------------------------ *
 * Primitive geometry
 * ------------------------------------------------------------------ */

export function boxGeometry(width, height, depth) {
  return new THREE.BoxGeometry(width, height, depth);
}

export function planeGeometry(width, height) {
  return new THREE.PlaneGeometry(width, height);
}

/** Plane whose UVs are measured in metres / tileSize, so maps never stretch. */
export function uvScaledPlane(width, height, tileSize = 2) {
  const geometry = new THREE.PlaneGeometry(width, height);
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i += 1) {
    uv.setXY(i, (uv.getX(i) * width) / tileSize, (uv.getY(i) * height) / tileSize);
  }
  uv.needsUpdate = true;
  return geometry;
}

export function cylinderGeometry(radiusTop, radiusBottom, height, segments = 16, openEnded = false) {
  return new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments, 1, openEnded);
}

export function sphereGeometry(radius, widthSegments = 20, heightSegments = 14) {
  return new THREE.SphereGeometry(radius, widthSegments, heightSegments);
}

export function torusGeometry(radius, tube, radialSegments = 8, tubularSegments = 32) {
  return new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
}

export function latheGeometry(points, segments = 32) {
  const profile = points.map(([radius, height]) => new THREE.Vector2(radius, height));
  const geometry = new THREE.LatheGeometry(profile, segments);
  geometry.computeVertexNormals();
  return geometry;
}

export function tubeGeometry(points, radius, tubularSegments = 20, radialSegments = 6) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
}

/** A capsule-ish rod between two points, returned already in world space. */
export function rodGeometry(from, to, radius, segments = 8) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const direction = new THREE.Vector3().subVectors(b, a);
  const length = direction.length();
  if (length < 1e-6) return new THREE.BufferGeometry();
  const geometry = new THREE.CylinderGeometry(radius, radius, length, segments, 1, false);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize(),
  );
  const matrix = new THREE.Matrix4().compose(
    a.clone().add(b).multiplyScalar(0.5),
    quaternion,
    new THREE.Vector3(1, 1, 1),
  );
  geometry.applyMatrix4(matrix);
  return geometry;
}

/* ------------------------------------------------------------------ *
 * Merge
 * ------------------------------------------------------------------ */

function ensureIndexed(geometry) {
  if (geometry.index) return geometry;
  const count = geometry.attributes.position.count;
  const array = count > 65535 ? new Uint32Array(count) : new Uint16Array(count);
  for (let i = 0; i < count; i += 1) array[i] = i;
  geometry.setIndex(new THREE.BufferAttribute(array, 1));
  return geometry;
}

/**
 * Merge indexed geometries. All inputs must expose position/normal/uv;
 * missing normals or uvs are filled with safe defaults. Returns a new
 * BufferGeometry and never mutates the inputs.
 */
export function mergeGeometries(geometries) {
  const list = geometries.filter(Boolean);
  if (!list.length) return new THREE.BufferGeometry();

  let vertexCount = 0;
  let indexCount = 0;
  const prepared = list.map((source) => {
    const geometry = ensureIndexed(source.clone());
    if (!geometry.attributes.normal) geometry.computeVertexNormals();
    if (!geometry.attributes.uv) {
      const count = geometry.attributes.position.count;
      geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
    }
    vertexCount += geometry.attributes.position.count;
    indexCount += geometry.index.count;
    return geometry;
  });

  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const IndexArray = vertexCount > 65535 ? Uint32Array : Uint16Array;
  const indices = new IndexArray(indexCount);

  let vertexOffset = 0;
  let indexOffset = 0;
  for (const geometry of prepared) {
    const { position, normal, uv } = geometry.attributes;
    positions.set(position.array, vertexOffset * 3);
    normals.set(normal.array, vertexOffset * 3);
    uvs.set(uv.array, vertexOffset * 2);
    const indicesLocal = geometry.index.array;
    for (let i = 0; i < indicesLocal.length; i += 1) {
      indices[indexOffset + i] = indicesLocal[i] + vertexOffset;
    }
    vertexOffset += position.count;
    indexOffset += indicesLocal.length;
    geometry.dispose();
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  merged.computeBoundingBox();
  merged.computeBoundingSphere();
  return merged;
}

/* ------------------------------------------------------------------ *
 * Static batcher
 * ------------------------------------------------------------------ */

export class StaticBuilder {
  constructor() {
    this.buckets = new Map();
  }

  /**
   * @param {string} key material key resolved at flush time
   * @param {THREE.BufferGeometry} geometry source geometry (not consumed)
   * @param {THREE.Matrix4|null} matrix local-to-world transform
   */
  add(key, geometry, matrix = null, options = {}) {
    if (!geometry) return;
    const copy = geometry.clone();
    if (matrix) copy.applyMatrix4(matrix);
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = {
        geometries: [],
        castShadow: options.cast ?? true,
        receiveShadow: options.receive ?? true,
      };
      this.buckets.set(key, bucket);
    }
    bucket.geometries.push(copy);
  }

  /** Add a mesh that already carries a world matrix. */
  addMesh(key, mesh, options = {}) {
    mesh.updateMatrix();
    this.add(key, mesh.geometry, mesh.matrix, options);
  }

  flush(parent, materials, name = 'static') {
    const group = new THREE.Group();
    group.name = name;
    let triangles = 0;
    for (const [key, bucket] of this.buckets) {
      if (!bucket.geometries.length) continue;
      const material = materials[key];
      if (!material) {
        console.warn(`StaticBuilder: missing material "${key}"`);
        continue;
      }
      const geometry = mergeGeometries(bucket.geometries);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = `static:${key}`;
      mesh.castShadow = bucket.castShadow;
      mesh.receiveShadow = bucket.receiveShadow;
      mesh.matrixAutoUpdate = false;
      group.add(mesh);
      triangles += geometry.index ? geometry.index.count / 3 : 0;
      bucket.geometries.forEach((g) => g.dispose());
      bucket.geometries.length = 0;
    }
    parent.add(group);
    return { group, triangles };
  }
}

/* ------------------------------------------------------------------ *
 * Small scene helpers
 * ------------------------------------------------------------------ */

export function disposeObject(root) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  root.traverse((object) => {
    if (!object.isMesh && !object.isPoints) return;
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
}
