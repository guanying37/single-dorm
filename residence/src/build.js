import * as THREE from 'three';
import {
  boxGeometry,
  uvScaledPlane,
  planeGeometry,
  cylinderGeometry,
  sphereGeometry,
  trs,
} from '../../shared/utils.js';
import { SHELL } from './config.js';

/* ------------------------------------------------------------------ *
 * 住宿区 2F 的通用墙/地/顶/门套辅助。
 * 坐标沿用图集绝对坐标：X 0..56.4，Z 0..30.4，Y 0..3.2。
 * ------------------------------------------------------------------ */

export const H = SHELL.height;            // 3.2
export const IT = SHELL.innerWall;        // 0.12
export const T = SHELL.wall;              // 0.30
export const BASE = 0.14;
export const DADO = 0.98;
export const CROWN = H - 0.085;

export function solidSpans(from, to, openings = []) {
  const spans = [];
  let cursor = from;
  const sorted = [...openings].sort((a, b) => a.from - b.from);
  for (const opening of sorted) {
    if (opening.from > cursor + 0.001) spans.push([cursor, opening.from]);
    cursor = Math.max(cursor, opening.to);
  }
  if (cursor < to - 0.001) spans.push([cursor, to]);
  return spans;
}

/** 一张墙纸/瓷砖平面。axis='z' 表示墙在恒定 x；axis='x' 表示恒定 z。 */
export function addFace(builder, key, {
  axis,
  at,
  from,
  to,
  y0 = 0,
  y1 = H,
  rotY,
  tile = 1.4,
  options = {},
}) {
  const length = to - from;
  if (length < 0.005) return;
  const height = y1 - y0;
  if (height < 0.005) return;
  const mid = (from + to) / 2;
  const matrix = axis === 'z'
    ? trs(at, (y0 + y1) / 2, mid, rotY)
    : trs(mid, (y0 + y1) / 2, at, rotY);
  builder.add(key, uvScaledPlane(length, height, tile), matrix, options);
}

/** 墙 + 门/窗洞 + 洞上过梁。 */
export function addWall(builder, {
  key,
  axis,
  at,
  from,
  to,
  rotY,
  openings = [],
  y0 = 0,
  y1 = H,
  tile = 1.4,
  options = {},
}) {
  for (const [a, b] of solidSpans(from, to, openings)) {
    addFace(builder, key, { axis, at, from: a, to: b, y0, y1, rotY, tile, options });
  }
  for (const opening of openings) {
    if (opening.height < y1 - 0.005) {
      addFace(builder, key, {
        axis, at, from: opening.from, to: opening.to,
        y0: opening.height, y1, rotY, tile, options,
      });
    }
  }
}

/** 踢脚 / 木扶手线 / 顶角线。normal 指向走廊内部。 */
export function addBands(builder, {
  axis,
  at,
  from,
  to,
  normal,
  openings = [],
  base = true,
  dado = true,
  crown = true,
  baseKey = 'marbleTrim',
  dadoKey = 'trim',
  crownKey = 'trim',
}) {
  const spans = solidSpans(from, to, openings);
  const boxAt = (key, alongLength, height, depth, mid, y) => {
    if (alongLength < 0.02) return;
    if (axis === 'z') {
      builder.addBox(key, depth, height, alongLength, at + normal * (depth / 2), y, mid);
    } else {
      builder.addBox(key, alongLength, height, depth, mid, y, at + normal * (depth / 2));
    }
  };
  if (base) for (const [a, b] of spans) boxAt(baseKey, b - a, BASE, 0.024, (a + b) / 2, BASE / 2);
  if (dado) for (const [a, b] of spans) boxAt(dadoKey, b - a, 0.035, 0.03, (a + b) / 2, DADO);
  if (crown) boxAt(crownKey, to - from, 0.085, 0.038, (from + to) / 2, CROWN + 0.0425);
}

/** 门洞侧壁 + 室内侧门套。 */
export function addCasing(builder, {
  axis,
  at,
  center,
  width,
  height,
  normal,
  casingKey = 'woodDark',
  thickness = 0.07,
  proud = 0.032,
  wall = IT,
}) {
  const wallCenter = at - normal * (wall / 2);
  if (axis === 'z') {
    for (const side of [-1, 1]) {
      builder.addBox(casingKey, wall + 0.01, height, 0.04, wallCenter, height / 2, center + side * (width / 2 - 0.02));
      builder.addBox(casingKey, proud, height + thickness, thickness, at + normal * (proud / 2), (height + thickness) / 2, center + side * (width / 2 + thickness / 2));
    }
    builder.addBox(casingKey, wall + 0.01, 0.04, width, wallCenter, height - 0.02, center);
    builder.addBox(casingKey, proud, thickness, width + thickness * 2, at + normal * (proud / 2), height + thickness / 2, center);
  } else {
    for (const side of [-1, 1]) {
      builder.addBox(casingKey, 0.04, height, wall + 0.01, center + side * (width / 2 - 0.02), height / 2, wallCenter);
      builder.addBox(casingKey, thickness, height + thickness, proud, center + side * (width / 2 + thickness / 2), (height + thickness) / 2, at + normal * (proud / 2));
    }
    builder.addBox(casingKey, width, 0.04, wall + 0.01, center, height - 0.02, wallCenter);
    builder.addBox(casingKey, width + thickness * 2, thickness, proud, center, height + thickness / 2, at + normal * (proud / 2));
  }
}

export function addFloor(builder, key, x0, x1, z0, z1, y = 0.001, tile = 1.2) {
  const width = x1 - x0;
  const depth = z1 - z0;
  if (width <= 0 || depth <= 0) return;
  builder.add(key, uvScaledPlane(width, depth, tile), trs((x0 + x1) / 2, y, (z0 + z1) / 2, 0, 1, 1, 1, -Math.PI / 2), { cast: false });
}

export function addCeiling(builder, key, x0, x1, z0, z1, y = H, tile = 2.4) {
  const width = x1 - x0;
  const depth = z1 - z0;
  if (width <= 0 || depth <= 0) return;
  builder.add(key, uvScaledPlane(width, depth, tile), trs((x0 + x1) / 2, y, (z0 + z1) / 2, 0, 1, 1, 1, Math.PI / 2), { cast: false });
}

/** 门叶（静态/动态通用，局部坐标：pivot 在铰链，门向 +X 生长）。 */
export function buildLeaf(builder, materials, {
  width,
  height,
  thickness = 0.05,
  key = 'wood',
  panelKey = 'woodDark',
  handle = true,
  glass = false,
  local = null,
}) {
  const m = (matrix) => (local ? new THREE.Matrix4().multiplyMatrices(local, matrix) : matrix);
  const add = (matKey, geometry, matrix, options) => builder.add(matKey, geometry, m(matrix), options);
  add(key, boxGeometry(width, height, thickness), trs(width / 2, height / 2, 0));
  for (const panel of [
    { y: height * 0.31, h: height * 0.42 },
    { y: height * 0.73, h: height * 0.2 },
  ]) {
    add(panelKey, boxGeometry(width - 0.2, panel.h, 0.012), trs(width / 2, panel.y, thickness / 2 + 0.006));
    add(panelKey, boxGeometry(width - 0.2, panel.h, 0.012), trs(width / 2, panel.y, -thickness / 2 - 0.006));
  }
  if (glass) {
    add('glass', boxGeometry(width - 0.36, height * 0.32, 0.012), trs(width / 2, height * 0.74, thickness / 2 + 0.008), { cast: false });
  }
  if (handle) {
    add('brass', cylinderGeometry(0.025, 0.025, 0.05, 10), trs(width - 0.16, 1.02, thickness / 2 + 0.03, 0, 1, 1, 1, 0, Math.PI / 2));
    add('brass', boxGeometry(0.035, 0.028, 0.12), trs(width - 0.2, 1.02, thickness / 2 + 0.02));
    add('brassDark', boxGeometry(0.014, 0.09, 0.06), trs(width - 0.27, 1.55, thickness / 2 + 0.026));
    add('black', cylinderGeometry(0.012, 0.012, 0.02, 8), trs(width - 0.3, 1.68, thickness / 2 + 0.024, 0, 1, 1, 1, 0, Math.PI / 2));
  }
  for (const y of [0.32, 1.05, 1.78]) {
    add('metalDark', boxGeometry(0.014, 0.1, 0.03), trs(0.03, y, 0));
  }
}

/** 在墙面放一个不可见拾取体。 */
export function addHitProxy(builder, materials, { id, x, y, z, hx, hy, hz, ry = 0 }) {
  builder.add('hit', boxGeometry(hx * 2, hy * 2, hz * 2), trs(x, y, z, ry), { cast: false, receive: false });
  void id;
  void materials;
}

export { THREE, planeGeometry, cylinderGeometry, sphereGeometry, boxGeometry, trs };
