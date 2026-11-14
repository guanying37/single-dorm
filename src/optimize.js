import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 * Static-mesh batching.
 *
 * The room has lots of small pieces of joinery, which is good for the
 * eye but expensive to submit. Once the scene is assembled, every
 * opaque mesh that never animates is baked into a handful of buffers
 * grouped by material and shadow behaviour. Animated doors and drawers
 * are explicitly excluded by their userData tag. The visible result is
 * identical; the draw-call and state-change cost is much lower.
 * ------------------------------------------------------------------ */

const REQUIRED_ATTRIBUTES = ['position', 'normal', 'uv'];

function isEligible(mesh) {
  if (!mesh || !mesh.isMesh || mesh.isInstancedMesh) return false;
  if (mesh.userData && mesh.userData.interactiveId) return false;
  if (!mesh.visible || !mesh.geometry) return false;
  if (Array.isArray(mesh.material)) return false;
  const material = mesh.material;
  if (!material || material.transparent || material.depthWrite === false) return false;
  if (mesh.renderOrder !== 0) return false;
  // No vertex colors, tangents, morphs, skinning or custom attributes in
  // this scene. Bail out safely if that assumption ever changes.
  for (const name of Object.keys(mesh.geometry.attributes)) {
    if (!REQUIRED_ATTRIBUTES.includes(name) && name !== 'uv1') return false;
  }
  for (const name of REQUIRED_ATTRIBUTES) {
    if (!mesh.geometry.attributes[name]) return false;
  }
  return true;
}

function mergeBuffers(geometries) {
  let vertexCount = 0;
  for (const geometry of geometries) vertexCount += geometry.attributes.position.count;
  const merged = new THREE.BufferGeometry();
  for (const name of REQUIRED_ATTRIBUTES) {
    const itemSize = geometries[0].attributes[name].itemSize;
    const data = new Float32Array(vertexCount * itemSize);
    let offset = 0;
    for (const geometry of geometries) {
      const attribute = geometry.attributes[name];
      data.set(attribute.array, offset);
      offset += attribute.count * itemSize;
    }
    merged.setAttribute(name, new THREE.BufferAttribute(data, itemSize));
  }
  merged.computeBoundingBox();
  merged.computeBoundingSphere();
  return merged;
}

/**
 * Merge eligible static meshes below `root` by material + shadow flags.
 * Returns a small report useful for perf logging.
 */
export function batchStaticMeshes(root) {
  root.updateMatrixWorld(true);

  const buckets = new Map();
  root.traverse((mesh) => {
    if (!isEligible(mesh)) return;
    const key = `${mesh.material.uuid}|${mesh.castShadow ? 1 : 0}|${mesh.receiveShadow ? 1 : 0}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        material: mesh.material,
        castShadow: mesh.castShadow,
        receiveShadow: mesh.receiveShadow,
        meshes: [],
      };
      buckets.set(key, bucket);
    }
    bucket.meshes.push(mesh);
  });

  const mergedGroup = new THREE.Group();
  mergedGroup.name = 'batched-static-meshes';
  let batches = 0;
  let sourceMeshes = 0;

  for (const bucket of buckets.values()) {
    if (bucket.meshes.length < 2) continue;
    const prepared = [];
    for (const mesh of bucket.meshes) {
      try {
        const source = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
        source.applyMatrix4(mesh.matrixWorld);
        source.clearGroups();
        prepared.push(source);
      } catch {
        prepared.length = 0;
        break;
      }
    }
    if (!prepared.length) continue;

    // Only merge if all prepared geometries have the same attribute layout.
    let compatible = true;
    for (const geometry of prepared) {
      for (const name of REQUIRED_ATTRIBUTES) {
        if (!geometry.attributes[name]) {
          compatible = false;
          break;
        }
      }
      if (!compatible) break;
    }
    if (!compatible) {
      prepared.forEach((geometry) => geometry.dispose());
      continue;
    }

    let mergedGeometry;
    try {
      mergedGeometry = mergeBuffers(prepared);
    } catch {
      prepared.forEach((geometry) => geometry.dispose());
      continue;
    }
    prepared.forEach((geometry) => geometry.dispose());

    const mergedMesh = new THREE.Mesh(mergedGeometry, bucket.material);
    mergedMesh.castShadow = bucket.castShadow;
    mergedMesh.receiveShadow = bucket.receiveShadow;
    mergedMesh.name = `batch:${bucket.material.name || bucket.material.type}`;
    mergedMesh.matrixAutoUpdate = false;
    mergedMesh.updateMatrix();
    mergedGroup.add(mergedMesh);
    batches += 1;
    sourceMeshes += bucket.meshes.length;

    for (const mesh of bucket.meshes) {
      if (mesh.parent) mesh.parent.remove(mesh);
    }
  }

  if (mergedGroup.children.length) root.add(mergedGroup);
  return { batches, sourceMeshes };
}
