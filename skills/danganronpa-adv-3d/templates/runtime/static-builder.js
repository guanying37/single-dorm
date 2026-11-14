import * as THREE from 'three';

/**
 * Static geometry batching for procedural interiors.
 *
 * Every small prop is added with a material key; at flush time all
 * pieces sharing a key become one indexed BufferGeometry / one Mesh.
 * This is the difference between hundreds of draw calls and dozens.
 */

export function trs(x = 0, y = 0, z = 0, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) {
  const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ'));
  const position = new THREE.Vector3(x, y, z);
  const scale = new THREE.Vector3(sx, sy, sz);
  return new THREE.Matrix4().compose(position, quaternion, scale);
}

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
    const localIndices = geometry.index.array;
    for (let i = 0; i < localIndices.length; i += 1) {
      indices[indexOffset + i] = localIndices[i] + vertexOffset;
    }
    vertexOffset += position.count;
    indexOffset += localIndices.length;
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
      bucket = {
        geometries: [],
        castShadow: options.cast ?? true,
        receiveShadow: options.receive ?? true,
      };
      this.buckets.set(key, bucket);
    }
    bucket.geometries.push(copy);
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
      mesh.castShadow = bucket.castShadow;
      mesh.receiveShadow = bucket.receiveShadow;
      mesh.matrixAutoUpdate = false;
      group.add(mesh);
      triangles += geometry.index ? geometry.index.count / 3 : 0;
      bucket.geometries.forEach((item) => item.dispose());
      bucket.geometries.length = 0;
    }

    parent.add(group);
    return { group, triangles };
  }
}

export function disposeObject(root) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();

  root.traverse((object) => {
    if (!object.isMesh && !object.isPoints) return;
    if (object.geometry) geometries.add(object.geometry);
    const list = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of list) {
      if (!material) continue;
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value && value.isTexture) textures.add(value);
      }
    }
  });

  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
}
