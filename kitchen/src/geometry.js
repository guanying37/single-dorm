import * as THREE from 'three';
import { RoundedBoxGeometry } from '../../vendor/RoundedBoxGeometry.js';

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

/* A rectangular frustum, used for the exhaust hood canopy and the
 * tapered sink bowls. Duplicated face vertices keep the normals crisp
 * and give every face a usable 0..1 UV set. */
export function frustumGeometry(bottomWidth, bottomDepth, topWidth, topDepth, height) {
  const bx = bottomWidth / 2;
  const bz = bottomDepth / 2;
  const tx = topWidth / 2;
  const tz = topDepth / 2;
  const y0 = 0;
  const y1 = height;

  const positions = [];
  const uvs = [];
  const pushQuad = (a, b, c, d) => {
    for (const [x, y, z] of [a, b, c, a, c, d]) {
      positions.push(x, y, z);
    }
    uvs.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
  };

  const b0 = [-bx, y0, -bz];
  const b1 = [bx, y0, -bz];
  const b2 = [bx, y0, bz];
  const b3 = [-bx, y0, bz];
  const t0 = [-tx, y1, -tz];
  const t1 = [tx, y1, -tz];
  const t2 = [tx, y1, tz];
  const t3 = [-tx, y1, tz];

  pushQuad(b0, b1, t1, t0);
  pushQuad(b1, b2, t2, t1);
  pushQuad(b2, b3, t3, t2);
  pushQuad(b3, b0, t0, t3);
  pushQuad(t0, t1, t2, t3);
  pushQuad(b3, b2, b1, b0);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/* A slightly convex CRT face. The corners fall away just like the
 * shadow-mask glass of an old surveillance monitor. */
export function crtScreenGeometry(width, height, bulge = 0.018, segmentsX = 24, segmentsY = 16) {
  const geometry = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);
  const position = geometry.attributes.position;
  const halfW = width / 2;
  const halfH = height / 2;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i) / halfW;
    const y = position.getY(i) / halfH;
    const bow = (1 - x * x) * (1 - y * y);
    position.setZ(i, Math.max(0, bow) * bulge);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/* A shallow bowl (wok / ladle) whose rim is above its centre and whose
 * opening faces +Y. */
export function bowlGeometry(radius, depth, segments = 28) {
  const points = [];
  const rings = 7;
  for (let i = 0; i <= rings; i += 1) {
    const t = i / rings;
    points.push([
      radius * Math.sin((t * Math.PI) / 2),
      depth * (1 - Math.cos((t * Math.PI) / 2)),
    ]);
  }
  return new THREE.LatheGeometry(
    points.map(([r, h]) => new THREE.Vector2(Math.max(0.0001, r), h)),
    segments,
  );
}

export function roundedBoxGeometry(width, height, depth, radius = 0.02, segments = 3) {
  return new RoundedBoxGeometry(width, height, depth, segments, Math.min(radius, width / 2, height / 2, depth / 2));
}
