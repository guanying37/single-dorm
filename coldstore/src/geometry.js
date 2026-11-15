import * as THREE from 'three';

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

export { crtScreenGeometry, roundedBoxGeometry, frustumGeometry } from '../../kitchen/src/geometry.js';

/* A shallow tray: open stainless box with a folded rim. Returns the
 * outer shell plus the inner floor plane height so food can sit inside. */
export function trayGeometry(width, depth, height, wall = 0.008) {
  const group = [];
  const halfW = width / 2;
  const halfD = depth / 2;
  // Bottom.
  group.push({ geometry: new THREE.BoxGeometry(width, 0.006, depth), position: [0, 0.003, 0] });
  // Four walls.
  group.push({ geometry: new THREE.BoxGeometry(width, height, wall), position: [0, height / 2, -halfD + wall / 2] });
  group.push({ geometry: new THREE.BoxGeometry(width, height, wall), position: [0, height / 2, halfD - wall / 2] });
  group.push({ geometry: new THREE.BoxGeometry(wall, height, depth), position: [-halfW + wall / 2, height / 2, 0] });
  group.push({ geometry: new THREE.BoxGeometry(wall, height, depth), position: [halfW - wall / 2, height / 2, 0] });
  return group;
}

/* A gentle hanging curve for the garment rail: a catenary-ish sag. */
export function railPoints(x0, x1, y, z, sag = 0.012, steps = 8) {
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    points.push([x, y - Math.sin(t * Math.PI) * sag, z]);
  }
  return points;
}
