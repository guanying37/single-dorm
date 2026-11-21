import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 * 阅览室几何工具：复用餐厅/后厨的共享构建器，补几件本场景反复用到的
 * 小几何（绿罩灯、木锥灯罩、地球仪陆块贴片、衣帽钩）。
 * ------------------------------------------------------------------ */

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

export { roundedBoxGeometry, frustumGeometry, crtScreenGeometry, bowlGeometry } from '../../kitchen/src/geometry.js';

/* 绿玻璃阅读灯罩：浅半球 + 外翻边，开口朝下。 */
export function bankerShadeGeometry(radius, height, segments = 24) {
  const profile = [
    [radius * 1.02, 0],
    [radius, 0.008],
    [radius * 0.95, 0.022],
    [radius * 0.78, 0.05],
    [radius * 0.5, height * 0.82],
    [radius * 0.24, height * 0.96],
    [0, height],
  ];
  return new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(Math.max(0.0005, r), y)),
    segments,
  );
}

/* 复古工业吊灯的木锥灯罩：外扩的浅锥，带卷边。 */
export function pendantShadeGeometry(topRadius, bottomRadius, height, segments = 28) {
  const profile = [
    [bottomRadius, 0],
    [bottomRadius * 1.012, 0.012],
    [bottomRadius * 0.985, 0.026],
    [bottomRadius * 0.9, height * 0.42],
    [topRadius * 1.25, height * 0.82],
    [topRadius, height * 0.96],
    [topRadius, height],
  ];
  return new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(Math.max(0.0005, r), y)),
    segments,
  );
}

/* 地球仪的一块“陆地”：贴在球面上的扁椭球，中心略埋进球体，
 * 只把顶面留在球外，避免漂浮面片。 */
export function globePatchMatrix(latDeg, lonDeg, radius, sx, sz, thickness = 0.03) {
  const phi = (90 - latDeg) * (Math.PI / 180);
  const theta = lonDeg * (Math.PI / 180);
  const dir = new THREE.Vector3(
    Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta),
  );
  const position = dir.clone().multiplyScalar(radius - thickness * 0.62);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  return new THREE.Matrix4().compose(position, quaternion, new THREE.Vector3(sx, thickness, sz));
}

/* 衣帽钩：从立柱伸出的弯钩，返回一根管子。 */
export function coatHookGeometry(length = 0.16, rise = 0.07, radius = 0.011) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(length * 0.45, rise * 0.15, 0),
    new THREE.Vector3(length * 0.9, rise * 0.55, 0),
    new THREE.Vector3(length * 1.05, rise, 0),
    new THREE.Vector3(length * 0.9, rise * 1.35, 0),
  ]);
  return new THREE.TubeGeometry(curve, 14, radius, 6, false);
}

/* 一个简单的平面浮雕：把一块扁椭球贴在局部 z = thickness 处，
 * 用来做墙挂地图/风景的立体内容（不是位图）。 */
export function reliefEllipsoidMatrix(x, y, z, sx, sy, sz, rotate = 0) {
  return new THREE.Matrix4()
    .makeTranslation(x, y, z)
    .multiply(new THREE.Matrix4().makeRotationZ(rotate))
    .multiply(new THREE.Matrix4().makeScale(sx, sy, sz));
}
