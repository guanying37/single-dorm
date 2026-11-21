import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/RoundedBoxGeometry.js';

/* ------------------------------------------------------------------ *
 * 几何、矩阵与静态合批工具。
 *
 * 走廊只有墙、门、楼梯、电梯与 5 组监控站，但每个监控站由二三十个
 * 小构件组成（支架、镜头、遮光罩、螺钉、线管、屏幕、指示灯）。所有
 * 静态构件按材质合并成少量 mesh；防火门与开关拨片单独成组。
 * ------------------------------------------------------------------ */

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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
 * 矩阵
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
 * 基础几何（带缓存，避免重复创建）
 * ------------------------------------------------------------------ */

const cache = new Map();

function cached(key, factory) {
  let geometry = cache.get(key);
  if (!geometry) {
    geometry = factory();
    cache.set(key, geometry);
  }
  return geometry;
}

export function boxGeometry(width, height, depth) {
  return cached(`box|${width}|${height}|${depth}`, () => new THREE.BoxGeometry(width, height, depth));
}

export function roundedBoxGeometry(width, height, depth, radius = 0.02, segments = 2) {
  return cached(
    `rbox|${width}|${height}|${depth}|${radius}|${segments}`,
    () => new RoundedBoxGeometry(width, height, depth, segments, Math.min(radius, width / 2, height / 2, depth / 2)),
  );
}

export function cylinderGeometry(radiusTop, radiusBottom, height, segments = 16, openEnded = false) {
  return cached(
    `cyl|${radiusTop}|${radiusBottom}|${height}|${segments}|${openEnded ? 1 : 0}`,
    () => new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments, 1, openEnded),
  );
}

export function sphereGeometry(radius, widthSegments = 16, heightSegments = 12) {
  return cached(
    `sph|${radius}|${widthSegments}|${heightSegments}`,
    () => new THREE.SphereGeometry(radius, widthSegments, heightSegments),
  );
}

export function torusGeometry(radius, tube, radialSegments = 8, tubularSegments = 32) {
  return cached(
    `tor|${radius}|${tube}|${radialSegments}|${tubularSegments}`,
    () => new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments),
  );
}

export function latheGeometry(points, segments = 24) {
  return new THREE.LatheGeometry(points.map(([radius, height]) => new THREE.Vector2(radius, height)), segments);
}

export function planeGeometry(width, height) {
  return new THREE.PlaneGeometry(width, height);
}

/** 平面，UV 以米 / tileSize 计，贴图不拉伸。 */
export function uvScaledPlane(width, height, tileSize = 1.5) {
  const geometry = new THREE.PlaneGeometry(width, height);
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i += 1) {
    uv.setXY(i, (uv.getX(i) * width) / tileSize, (uv.getY(i) * height) / tileSize);
  }
  uv.needsUpdate = true;
  return geometry;
}

/** 圆盘，UV 按半径归一。 */
export function discGeometry(radius, segments = 64) {
  return new THREE.CircleGeometry(radius, segments);
}

export function rodGeometry(from, to, radius, segments = 8) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const direction = new THREE.Vector3().subVectors(b, a);
  const length = direction.length();
  if (length < 1e-6) return new THREE.BufferGeometry();
  const geometry = new THREE.CylinderGeometry(radius, radius, length, segments, 1, false);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  geometry.applyMatrix4(
    new THREE.Matrix4().compose(
      a.clone().add(b).multiplyScalar(0.5),
      quaternion,
      new THREE.Vector3(1, 1, 1),
    ),
  );
  return geometry;
}

/* ------------------------------------------------------------------ *
 * 合并
 * ------------------------------------------------------------------ */

function ensureIndexed(geometry) {
  if (geometry.index) return geometry;
  const count = geometry.attributes.position.count;
  const array = count > 65535 ? new Uint32Array(count) : new Uint16Array(count);
  for (let i = 0; i < count; i += 1) array[i] = i;
  geometry.setIndex(new THREE.BufferAttribute(array, 1));
  return geometry;
}

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
    const local = geometry.index.array;
    for (let i = 0; i < local.length; i += 1) indices[indexOffset + i] = local[i] + vertexOffset;
    vertexOffset += position.count;
    indexOffset += local.length;
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
 * 静态合批
 * ------------------------------------------------------------------ */

export class StaticBuilder {
  constructor() {
    this.buckets = new Map();
  }

  add(key, geometry, matrix = null, options = {}) {
    if (!geometry) return;
    const copy = geometry.clone();
    if (matrix) copy.applyMatrix4(matrix);
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = { geometries: [], cast: options.cast ?? true, receive: options.receive ?? true };
      this.buckets.set(key, bucket);
    }
    bucket.geometries.push(copy);
  }

  /** 盒体快捷方式：addBox(key, w, h, d, x, y, z, ry) */
  addBox(key, width, height, depth, x = 0, y = 0, z = 0, ry = 0, options = {}) {
    this.add(key, boxGeometry(width, height, depth), trs(x, y, z, ry), options);
  }

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
      mesh.castShadow = bucket.cast;
      mesh.receiveShadow = bucket.receive;
      mesh.matrixAutoUpdate = false;
      group.add(mesh);
      triangles += geometry.index ? geometry.index.count / 3 : 0;
      bucket.geometries.forEach((entry) => entry.dispose());
      bucket.geometries.length = 0;
    }
    parent.add(group);
    return { group, triangles };
  }
}

/* ------------------------------------------------------------------ *
 * 释放
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
