import * as THREE from 'three';
import { TABLE, CHAIRS, SOFAS, CONSOLES } from './config.js';
import {
  boxGeometry,
  roundedBoxGeometry,
  cylinderGeometry,
  sphereGeometry,
  torusGeometry,
  latheGeometry,
  trs,
  mulberry32,
} from './utils.js';

/* ------------------------------------------------------------------ *
 * 家具：Ø5 m 圆桌、14 把高背沙发椅、沿墙灰沙发、胡桃木条案与木雕。
 *
 * 全部静态合批；碰撞体按“桌面圆形 + 椅子独立 OBB + 沙发 / 条案 OBB”
 * 给出，不用整块桌位盒子。
 * ------------------------------------------------------------------ */

function scaleUv(geometry, su, sv) {
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i += 1) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  uv.needsUpdate = true;
  return geometry;
}

/* --- 圆桌 ---------------------------------------------------------- */

function buildTable(builder) {
  const radius = TABLE.radius;
  const topY = TABLE.topY;
  const drop = TABLE.clothDrop;

  const top = new THREE.CircleGeometry(radius, 72);
  top.rotateX(-Math.PI / 2);
  builder.add('clothBlack', top, trs(TABLE.x, topY + 0.004, TABLE.z));

  // 桌布垂边：上口 2.5 m、下摆 2.54 m，UV 沿周向重复 10 次。
  const skirt = new THREE.CylinderGeometry(radius, radius + 0.04, drop, 72, 1, true);
  scaleUv(skirt, 10, 1.4);
  builder.add('clothBlack', skirt, trs(TABLE.x, topY - drop / 2, TABLE.z));

  // 桌沿暗红滚边。
  builder.add('brassDark', new THREE.TorusGeometry(radius + 0.004, 0.008, 6, 72), trs(TABLE.x, topY + 0.002, TABLE.z, 0, 1, 1, 1, Math.PI / 2));

  // 8 条车木腿。
  const legProfile = [
    [0.075, 0.0],
    [0.085, 0.03],
    [0.06, 0.09],
    [0.05, 0.2],
    [0.062, 0.3],
    [0.072, 0.42],
    [0.05, 0.52],
    [0.07, 0.62],
    [0.08, 0.7],
  ];
  for (let i = 0; i < TABLE.legCount; i += 1) {
    const angle = (i / TABLE.legCount) * Math.PI * 2 + Math.PI / 8;
    const x = TABLE.x + Math.cos(angle) * TABLE.legRadius;
    const z = TABLE.z + Math.sin(angle) * TABLE.legRadius;
    builder.add('walnutDark', latheGeometry(legProfile, 14), trs(x, 0.02, z));
  }

  // 桌下横撑，避免“悬浮桌面”的观感。
  for (let i = 0; i < 4; i += 1) {
    const angle = (i / 4) * Math.PI * 2;
    const length = TABLE.legRadius * 2 * Math.cos(Math.PI / 4) * 0.94;
    builder.add(
      'walnutDark',
      boxGeometry(0.07, 0.09, length),
      trs(TABLE.x, 0.22, TABLE.z, angle + Math.PI / 4),
    );
  }
}

/* --- 高背沙发椅 ---------------------------------------------------- */

function buildChair(builder, chair) {
  const base = trs(chair.x, 0, chair.z, chair.rotY);
  const add = (key, geometry, local) => builder.add(key, geometry, new THREE.Matrix4().multiplyMatrices(base, local));

  const width = 0.55;
  const depth = 0.56;

  // 包脚椅套。
  add('linen', roundedBoxGeometry(width, 0.44, depth, 0.06, 2), trs(0, 0.23, 0.01));
  add('linenSeam', boxGeometry(width + 0.012, 0.03, depth + 0.012), trs(0, 0.035, 0.01));
  // 座垫。
  add('linen', roundedBoxGeometry(width - 0.02, 0.1, depth - 0.02, 0.045, 2), trs(0, 0.485, 0.02));
  // 高背。
  add('linen', roundedBoxGeometry(width, 0.62, 0.12, 0.05, 2), trs(0, 0.77, -0.225, 0, 1, 1, 1, -0.05));
  add('linenSeam', boxGeometry(width - 0.06, 0.44, 0.018), trs(0, 0.75, -0.157));
  // 卷头。
  const roll = new THREE.CylinderGeometry(0.058, 0.058, width, 14, 1, false);
  add('linen', roll, trs(0, 1.04, -0.22, 0, 1, 1, 1, 0, Math.PI / 2));
  // 扶手与扶手顶。
  for (const sx of [-1, 1]) {
    add('linen', roundedBoxGeometry(0.085, 0.3, 0.46, 0.035, 2), trs(sx * (width / 2 - 0.042), 0.6, 0.02));
    add('linenSeam', roundedBoxGeometry(0.1, 0.055, 0.48, 0.024, 2), trs(sx * (width / 2 - 0.042), 0.77, 0.02));
  }
  // 滚边。
  for (const sz of [-1, 1]) {
    add('linenSeam', boxGeometry(width + 0.006, 0.016, 0.016), trs(0, 0.44, sz * (depth / 2 - 0.004) + 0.01));
  }
  add('linenSeam', boxGeometry(width + 0.006, 0.016, 0.016), trs(0, 1.0, -0.16));
}

/* --- 沙发 ---------------------------------------------------------- */

function buildSofa(builder, sofa) {
  const base = trs(sofa.x, 0, sofa.z, sofa.rotY);
  const add = (key, geometry, local) => builder.add(key, geometry, new THREE.Matrix4().multiplyMatrices(base, local));
  const width = sofa.width;
  const depth = 0.92;
  const seats = sofa.seats;
  const cushionWidth = (width - 0.2) / seats;

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      add('walnutDark', boxGeometry(0.08, 0.1, 0.08), trs(sx * (width / 2 - 0.09), 0.05, sz * (depth / 2 - 0.09)));
    }
  }
  add('sofaFabric', roundedBoxGeometry(width, 0.34, depth, 0.05, 2), trs(0, 0.27, 0));
  for (let i = 0; i < seats; i += 1) {
    const x = -width / 2 + 0.1 + cushionWidth * (i + 0.5);
    add('sofaFabric', roundedBoxGeometry(cushionWidth - 0.03, 0.17, depth - 0.12, 0.05, 3), trs(x, 0.485, 0.03));
  }
  add('sofaFabric', roundedBoxGeometry(width, 0.62, 0.18, 0.05, 2), trs(0, 0.66, -depth / 2 + 0.09));
  for (let i = 0; i < seats; i += 1) {
    const x = -width / 2 + 0.1 + cushionWidth * (i + 0.5);
    add('sofaFabric', roundedBoxGeometry(cushionWidth - 0.04, 0.48, 0.16, 0.05, 3), trs(x, 0.74, -depth / 2 + 0.22, 0, 1, 1, 1, -0.07));
  }
  for (const sx of [-1, 1]) {
    add('sofaFabric', roundedBoxGeometry(0.17, 0.44, depth, 0.05, 2), trs(sx * (width / 2 - 0.085), 0.55, 0));
    add('sofaSeam', roundedBoxGeometry(0.185, 0.04, depth + 0.005, 0.02, 2), trs(sx * (width / 2 - 0.085), 0.785, 0));
  }
  add('sofaSeam', boxGeometry(width - 0.02, 0.014, 0.014), trs(0, 0.41, depth / 2 - 0.02));
  add('sofaSeam', boxGeometry(width - 0.02, 0.014, 0.014), trs(0, 0.41, -depth / 2 + 0.02));
  for (let i = 0; i < seats - 1; i += 1) {
    const x = -width / 2 + 0.1 + cushionWidth * (i + 1);
    add('sofaSeam', boxGeometry(0.014, 0.02, depth - 0.16), trs(x, 0.52, 0.03));
  }
}

/* --- 条案 ---------------------------------------------------------- */

function buildConsole(builder, console) {
  const base = trs(console.x, 0, console.z, console.rotY);
  const add = (key, geometry, local) => builder.add(key, geometry, new THREE.Matrix4().multiplyMatrices(base, local));
  const width = 1.1;
  const depth = 0.42;
  const height = 0.8;

  add('walnut', boxGeometry(width, 0.055, depth), trs(0, height - 0.0275, 0));
  add('walnutDark', boxGeometry(width - 0.08, 0.6, depth - 0.05), trs(0, 0.43, -0.01));
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      add('walnutDark', boxGeometry(0.055, 0.13, 0.055), trs(sx * (width / 2 - 0.06), 0.065, sz * (depth / 2 - 0.06)));
    }
  }
  for (const sx of [-1, 1]) {
    add('walnut', boxGeometry(0.4, 0.42, 0.014), trs(sx * 0.235, 0.44, depth / 2 - 0.023));
    add('walnutDark', boxGeometry(0.34, 0.36, 0.008), trs(sx * 0.235, 0.44, depth / 2 - 0.014));
    add('brass', sphereGeometry(0.014, 10, 8), trs(sx * 0.06, 0.44, depth / 2 + 0.005));
  }
  add('walnutDark', boxGeometry(width - 0.02, 0.03, depth + 0.02), trs(0, height - 0.065, 0));
}

/* --- 木雕 ---------------------------------------------------------- */

function buildCarving(builder, matrix, variant, scale = 1) {
  const add = (key, geometry, local) => builder.add(key, geometry, new THREE.Matrix4().multiplyMatrices(matrix, local));
  const M = (x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) => trs(x, y, z, ry, sx * scale, sy * scale, sz * scale, rx, rz);

  const carveType = variant % 5;

  // 每件木雕都有独立底座，不直接“长”在条案或桌布上。
  add('walnutDark', cylinderGeometry(0.11, 0.12, 0.035, 18), M(0, 0.0175, 0));

  if (carveType === 0) {
    // 胸像：肩、颈、头、发髻。
    add('walnut', boxGeometry(0.22, 0.06, 0.16), M(0, 0.07, 0));
    add('walnut', roundedBoxGeometry(0.18, 0.16, 0.12, 0.03, 2), M(0, 0.17, 0));
    add('walnutDark', cylinderGeometry(0.045, 0.05, 0.08, 12), M(0, 0.27, 0));
    add('walnut', sphereGeometry(0.07, 16, 12), M(0, 0.35, 0.01, 0, 0.9, 1.08, 0.95));
    add('walnutDark', sphereGeometry(0.055, 14, 10), M(0, 0.39, -0.015, 0, 0.95, 0.7, 0.95));
    add('walnutDark', sphereGeometry(0.02, 10, 8), M(0, 0.34, 0.075));
  } else if (carveType === 1) {
    // 马：躯干、四腿、颈、头、鬃、尾。
    add('walnut', sphereGeometry(0.16, 16, 12), M(0, 0.22, 0, 0, 1.5, 0.9, 0.75));
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        add('walnutDark', cylinderGeometry(0.02, 0.016, 0.16, 8), M(sx * 0.1, 0.1, sz * 0.06));
      }
    }
    add('walnut', cylinderGeometry(0.035, 0.05, 0.16, 10), M(0.19, 0.32, 0, 0, 1, 1, 1, 0, -0.5));
    add('walnutDark', roundedBoxGeometry(0.1, 0.06, 0.06, 0.02, 2), M(0.26, 0.39, 0, 0, 1, 1, 1, 0, -0.25));
    add('walnutDark', boxGeometry(0.02, 0.1, 0.05), M(0.17, 0.38, 0, 0, 1, 1, 1, 0, -0.45));
    add('walnutDark', cylinderGeometry(0.012, 0.02, 0.16, 8), M(-0.22, 0.2, 0, 0, 1, 1, 1, 0, 0.75));
  } else if (carveType === 2) {
    // 鸟：身体、头、喙、双翼、尾。
    add('walnut', sphereGeometry(0.13, 16, 12), M(0, 0.2, 0, 0, 1.35, 0.9, 0.85));
    add('walnut', sphereGeometry(0.06, 12, 10), M(0.15, 0.29, 0));
    add('walnutDark', cylinderGeometry(0.012, 0.03, 0.08, 8), M(0.22, 0.28, 0, 0, 1, 1, 1, 0, -1.4));
    for (const sz of [-1, 1]) {
      add('walnutDark', boxGeometry(0.16, 0.02, 0.08), M(-0.02, 0.24, sz * 0.1, 0, 1, 1, 1, sz * 0.25, -0.2));
    }
    add('walnutDark', boxGeometry(0.16, 0.02, 0.05), M(-0.18, 0.18, 0, 0, 1, 1, 1, 0, 0.35));
    for (const sz of [-1, 1]) {
      add('brassDark', cylinderGeometry(0.008, 0.008, 0.1, 6), M(0.02, 0.1, sz * 0.04));
    }
  } else if (carveType === 3) {
    // 狮：躯干、鬃环、头、四肢、尾。
    add('walnut', sphereGeometry(0.15, 16, 12), M(-0.04, 0.21, 0, 0, 1.55, 0.85, 0.8));
    add('walnutDark', torusGeometry(0.075, 0.03, 8, 18), M(0.19, 0.28, 0, 0, 1, 1, 1, Math.PI / 2));
    add('walnut', sphereGeometry(0.07, 14, 10), M(0.2, 0.28, 0));
    for (const sx of [-1, 1]) {
      add('walnutDark', cylinderGeometry(0.022, 0.02, 0.14, 8), M(-0.02 + sx * 0.08, 0.08, 0.06));
      add('walnutDark', cylinderGeometry(0.022, 0.02, 0.14, 8), M(-0.02 + sx * 0.08, 0.08, -0.06));
    }
    add('walnutDark', cylinderGeometry(0.01, 0.02, 0.18, 8), M(-0.24, 0.22, 0, 0, 1, 1, 1, 0, -0.9));
  } else {
    // 抽象结：三个交错的环。
    add('walnut', torusGeometry(0.11, 0.028, 8, 22), M(0, 0.2, 0, 0, 1, 1, 1, 0.35, 0.2));
    add('walnutDark', torusGeometry(0.095, 0.024, 8, 20), M(0, 0.2, 0, 0, 1, 1, 1, -0.4, 1.1));
    add('walnut', torusGeometry(0.08, 0.02, 8, 18), M(0, 0.2, 0, 0, 1, 1, 1, 1.1, 0.5));
    add('walnutDark', sphereGeometry(0.05, 14, 10), M(0, 0.2, 0));
  }
}

/* --- 桌面中心雕件 ------------------------------------------------ */

function buildCenterpiece(builder) {
  // 桌面中心：胡桃木大雕件（奔马）＋双层圆底座，不做“只会画轮廓”的贴片。
  const addBase = trs(TABLE.x, TABLE.topY + 0.006, TABLE.z);
  const add = (key, geometry, local) => builder.add(key, geometry, new THREE.Matrix4().multiplyMatrices(addBase, local));

  add('walnutDark', cylinderGeometry(0.34, 0.36, 0.05, 32), trs(0, 0.025, 0));
  add('walnut', cylinderGeometry(0.27, 0.3, 0.055, 32), trs(0, 0.077, 0));
  add('brassDark', torusGeometry(0.305, 0.008, 5, 44), trs(0, 0.052, 0, 0, 1, 1, 1, Math.PI / 2));

  buildCarving(builder, trs(TABLE.x, TABLE.topY + 0.1, TABLE.z, 0.9), 4, 1.95);
}

/* --- 组装 ---------------------------------------------------------- */

export function buildFurniture(builder) {
  const colliders = [];

  buildTable(builder);
  colliders.push({ shape: 'circle', x: TABLE.x, z: TABLE.z, radius: TABLE.radius });

  for (const chair of CHAIRS) {
    buildChair(builder, chair);
    colliders.push({ shape: 'box', x: chair.x, z: chair.z, hx: 0.29, hz: 0.29, rot: -chair.rotY });
  }

  for (const sofa of SOFAS) {
    buildSofa(builder, sofa);
    colliders.push({
      shape: 'box',
      x: sofa.x,
      z: sofa.z,
      hx: sofa.width / 2,
      hz: 0.46,
      rot: -sofa.rotY,
    });
  }

  const rng = mulberry32(0x7a1c);
  for (const console of CONSOLES) {
    buildConsole(builder, console);
    buildCarving(builder, trs(console.x, 0.8, console.z, console.rotY), console.carving, 0.85 + rng() * 0.25);
    colliders.push({
      shape: 'box',
      x: console.x,
      z: console.z,
      hx: 0.55,
      hz: 0.21,
      rot: -console.rotY,
    });
  }

  buildCenterpiece(builder);

  // 桌面两侧的小木雕。
  for (const [index, angle] of [0.95, 3.55].entries()) {
    const radius = 2.0;
    const base = trs(
      TABLE.x + Math.cos(angle) * radius,
      TABLE.topY + 0.006,
      TABLE.z + Math.sin(angle) * radius,
      -angle + Math.PI / 2,
    );
    buildCarving(builder, base, index === 0 ? 2 : 4, 0.8);
  }

  return {
    colliders,
    sofas: SOFAS,
    consoles: CONSOLES,
    centerpiece: new THREE.Vector3(TABLE.x, TABLE.topY, TABLE.z),
  };
}
