import * as THREE from 'three';
import { TABLE } from './config.js';
import {
  boxGeometry,
  cylinderGeometry,
  sphereGeometry,
  latheGeometry,
  trs,
} from './utils.js';

/* ------------------------------------------------------------------ *
 * 桌面棋牌：两副进行中的国际象棋、一副跳棋、一组摊开的纸牌与筹码。
 *
 * 全部由几何体构成，不使用文字贴图；棋子按棋局摆放，纸牌只画抽象花色
 * 图形（小红方块 / 黑梅花点），不出现数字或字母。
 * ------------------------------------------------------------------ */

const TOP = TABLE.topY + 0.006;

function stationMatrix(angle, radius = 1.5, extraRot = 0) {
  return trs(
    TABLE.x + Math.cos(angle) * radius,
    TOP,
    TABLE.z + Math.sin(angle) * radius,
    -angle + Math.PI / 2 + extraRot,
  );
}

function squareBoard(add, size, { frame = 'walnut', light = 'boardLight', dark = 'boardInlay', darkSquares = true }) {
  const cell = size / 8;
  const frameSize = size + 0.07;
  add(frame, boxGeometry(frameSize, 0.022, frameSize), trs(0, 0.011, 0));
  add('walnutDark', boxGeometry(frameSize + 0.02, 0.012, frameSize + 0.02), trs(0, 0.004, 0));
  add(light, boxGeometry(size, 0.012, size), trs(0, 0.026, 0));
  if (darkSquares) {
    for (let f = 0; f < 8; f += 1) {
      for (let r = 0; r < 8; r += 1) {
        if ((f + r) % 2 === 0) continue;
        add(dark, boxGeometry(cell - 0.001, 0.004, cell - 0.001), trs((f - 3.5) * cell, 0.032, (r - 3.5) * cell));
      }
    }
  }
  return cell;
}

/* --- 棋子 ---------------------------------------------------------- */

const PIECE_PROFILE = [
  [0.0135, 0.0],
  [0.0145, 0.005],
  [0.011, 0.009],
  [0.007, 0.014],
  [0.0105, 0.02],
  [0.0095, 0.027],
  [0.0065, 0.034],
];

function addChessPiece(add, key, x, z, scale = 1) {
  add(key, latheGeometry(PIECE_PROFILE, 12), trs(x, 0.034, z, 0, scale, scale, scale));
  add(key, sphereGeometry(0.008, 10, 8), trs(x, 0.034 + 0.036 * scale, z, 0, scale, scale, scale));
}

const CHESS_A = [
  ['b', 6, 0, 1], ['c', 6, 0, 2], ['d', 6, 0, 3], ['e', 6, 0, 1.15],
  ['f', 6, 0, 2], ['g', 6, 0, 1], ['d', 5, 0, 1], ['e', 5, 0, 1],
  ['c', 5, 0, 1], ['f', 5, 0, 1],
  ['b', 1, 1, 1], ['c', 1, 1, 2], ['d', 1, 1, 3], ['e', 1, 1, 1.2],
  ['f', 1, 1, 2], ['g', 1, 1, 1], ['d', 2, 1, 1], ['e', 3, 1, 1],
  ['c', 2, 1, 1], ['f', 2, 1, 1],
];

const CHESS_B = [
  ['b', 1, 1, 1], ['c', 1, 1, 2], ['d', 1, 1, 3], ['e', 1, 1, 1.15],
  ['f', 1, 1, 2], ['g', 1, 1, 1], ['c', 2, 1, 1], ['e', 2, 1, 1],
  ['b', 3, 1, 1], ['g', 3, 1, 1],
  ['b', 6, 0, 1], ['c', 6, 0, 2], ['d', 6, 0, 3], ['e', 6, 0, 1],
  ['f', 6, 0, 2], ['g', 6, 0, 1], ['d', 5, 0, 1], ['e', 4, 0, 1],
  ['c', 5, 0, 1], ['f', 5, 0, 1],
];

function buildChess(add, layout) {
  const cell = squareBoard(add, 0.58, { frame: 'walnut', light: 'boardLight', dark: 'boardInlay' });
  for (const [file, rank, color, scale] of layout) {
    const x = (file.charCodeAt(0) - 97 - 3.5) * cell;
    const z = (rank - 3.5) * cell;
    addChessPiece(add, color ? 'chessEbony' : 'chessIvory', x, z, scale);
  }
}

/* --- 跳棋 ---------------------------------------------------------- */

function buildCheckers(add) {
  const size = 0.5;
  const cell = squareBoard(add, size, { frame: 'walnut', light: 'boardLight', dark: 'boardInlay' });
  const piece = (x, z, key, stack = 1) => {
    for (let i = 0; i < stack; i += 1) {
      add(key, cylinderGeometry(0.021, 0.021, 0.008, 18), trs(x, 0.038 + i * 0.009, z));
      add('walnutDark', cylinderGeometry(0.0215, 0.0215, 0.002, 18), trs(x, 0.033 + i * 0.009, z));
    }
  };

  // 进行中的局面：红方压到黑方半场，黑方还有两枚王棋。
  const reds = [[1, 1], [3, 3], [5, 1], [2, 4], [4, 2], [6, 4], [0, 2], [4, 4], [6, 0], [2, 0], [5, 3], [1, 5]];
  const blacks = [[0, 7], [2, 7], [4, 7], [6, 7], [1, 6], [3, 6], [5, 6], [0, 5], [2, 5], [6, 5], [3, 2], [5, 2]];
  for (const [f, r] of reds) piece((f - 3.5) * cell, (r - 3.5) * cell, 'checkerRed');
  for (const [f, r] of blacks) piece((f - 3.5) * cell, (r - 3.5) * cell, 'checkerBlack', 1 + (r < 3 ? 1 : 0));
}

/* --- 纸牌与筹码 ---------------------------------------------------- */

function buildCards(add) {
  // 摊开的扇形纸牌。
  const count = 9;
  for (let i = 0; i < count; i += 1) {
    const t = i / (count - 1) - 0.5;
    const x = t * 0.3;
    const z = -0.02 + Math.abs(t) * 0.1;
    const ry = -t * 0.5;
    add('cardFace', boxGeometry(0.063, 0.0012, 0.088), trs(x, 0.001, z, ry));
    const red = i % 2 === 0;
    add(red ? 'cardRed' : 'chessEbony', boxGeometry(0.014, 0.0016, 0.02), trs(x, 0.0018, z, ry));
    add(red ? 'cardRed' : 'chessEbony', boxGeometry(0.007, 0.0016, 0.007), trs(x + 0.018, 0.0018, z + 0.028, ry, 1, 1, 1, 0, Math.PI / 4));
  }

  // 三摞筹码。
  const chips = [
    { x: -0.24, z: 0.14, key: 'chipIvory', count: 5 },
    { x: 0.25, z: 0.1, key: 'chipRed', count: 4 },
    { x: 0.3, z: -0.06, key: 'chipIvory', count: 3 },
  ];
  for (const stack of chips) {
    for (let i = 0; i < stack.count; i += 1) {
      add(stack.key, cylinderGeometry(0.021, 0.021, 0.008, 20), trs(stack.x, 0.004 + i * 0.009, stack.z));
    }
  }

  // 木制牌盒。
  add('walnut', boxGeometry(0.15, 0.028, 0.09), trs(-0.02, 0.014, 0.24));
  add('walnutDark', boxGeometry(0.13, 0.006, 0.07), trs(-0.02, 0.03, 0.24));
  add('brass', sphereGeometry(0.008, 8, 6), trs(-0.02, 0.036, 0.24));
}

/* --- 围棋 ---------------------------------------------------------- */

function buildGo(add) {
  const size = 0.54;
  const cell = size / 18;
  const frame = size + 0.06;

  add('walnutDark', boxGeometry(frame + 0.02, 0.02, frame + 0.02), trs(0, 0.01, 0));
  add('walnut', boxGeometry(frame, 0.04, frame), trs(0, 0.03, 0));
  add('boardLight', boxGeometry(size, 0.012, size), trs(0, 0.052, 0));

  for (let i = 0; i < 19; i += 1) {
    const p = (i - 9) * cell;
    add('matBlack', boxGeometry(0.0025, 0.0012, size), trs(p, 0.059, 0));
    add('matBlack', boxGeometry(size, 0.0012, 0.0025), trs(0, 0.059, p));
  }

  for (const sx of [-1, 0, 1]) {
    for (const sz of [-1, 0, 1]) {
      if (sx === 0 && sz === 0) continue;
      add('matBlack', sphereGeometry(0.006, 6, 4), trs(sx * (size / 2 - 3 * cell), 0.0605, sz * (size / 2 - 3 * cell), 0, 1, 0.32, 1));
    }
  }

  const black = [[5, 6], [6, 6], [6, 7], [7, 5], [7, 7], [8, 6], [8, 7], [9, 6], [5, 8], [4, 7], [7, 9], [9, 8], [10, 7], [8, 9], [6, 9], [9, 9], [5, 5], [10, 8]];
  const white = [[6, 5], [7, 6], [8, 5], [8, 8], [9, 7], [7, 8], [5, 7], [6, 8], [9, 5], [10, 6], [4, 6], [10, 9], [8, 4], [9, 4], [5, 9], [7, 10]];
  const stone = (x, z, key) => {
    add(key, sphereGeometry(0.0115, 10, 8), trs((x - 9) * cell, 0.0625, (z - 9) * cell, 0, 1, 0.38, 1));
  };
  for (const [x, z] of black) stone(x, z, 'chessEbony');
  for (const [x, z] of white) stone(x, z, 'chessIvory');
}

/* --- 组装 ---------------------------------------------------------- */

export function buildGames(builder) {
  const place = (angle, radius, extraRot, build) => {
    const base = stationMatrix(angle, radius, extraRot);
    const add = (key, geometry, local) => builder.add(key, geometry, new THREE.Matrix4().multiplyMatrices(base, local));
    build(add);
  };

  place(0.35, 1.52, 0, (add) => buildChess(add, CHESS_A));
  place(1.6, 1.47, 0.1, (add) => buildCards(add));
  place(2.9, 1.52, 0.08, (add) => buildCheckers(add));
  place(4.2, 1.52, -0.05, (add) => buildChess(add, CHESS_B));
  place(5.5, 1.5, 0.06, (add) => buildGo(add));
}
