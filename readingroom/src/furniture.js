import * as THREE from 'three';
import {
  boxGeometry,
  cylinderGeometry,
  planeGeometry,
  roundedBoxGeometry,
  sphereGeometry,
  torusGeometry,
  tubeGeometry,
  latheGeometry,
  trs,
  mulberry32,
  bankerShadeGeometry,
  coatHookGeometry,
  StaticBuilder,
} from './geometry.js';
import {
  HALF_W,
  HALF_D,
  TABLE,
  CHAIR,
  BANKER_LAMP,
  BENCH,
  GLOBE,
  COAT_RACK,
  LADDER,
  CONTENT_COUNTS,
} from './config.js';

/* ------------------------------------------------------------------ *
 * 阅览室家具：三张长条阅读桌与木靠背椅、六盏绿玻璃罩阅读灯、窗下
 * 软垫长凳、东北角落地地球仪、西南角衣帽架，以及桌上的摊开书和纸。
 *
 * 家具本体全部进静态批次；地球仪球体单独旋转，表盘/球体用顶点色
 * 画出大陆与经纬线（不是位图，也不是自绘张贴画）。
 * ------------------------------------------------------------------ */

function addBox(builder, key, w, h, d, x, y, z, ry = 0, options = {}) {
  builder.add(key, boxGeometry(w, h, d), trs(x, y, z, ry), {
    cast: options.cast ?? true,
    receive: options.receive ?? true,
  });
}

function addCylinder(builder, key, top, bottom, height, segments, matrix, options = {}) {
  builder.add(key, cylinderGeometry(top, bottom, height, segments), matrix, {
    cast: options.cast ?? true,
    receive: options.receive ?? true,
  });
}

/* --- 阅读桌 -------------------------------------------------------- */

function buildTable(builder, table, rng) {
  const { width, topY, topThickness, legInset } = TABLE;
  const length = table.length;
  const z = table.z;
  const topCenterY = topY - topThickness / 2;

  builder.add('tableWood', roundedBoxGeometry(width, topThickness, length, 0.016, 3), trs(0, topCenterY, z), {
    cast: true,
    receive: true,
  });
  // 桌面下的收边线。
  addBox(builder, 'trimWood', width - 0.05, 0.016, length - 0.05, 0, topY - topThickness - 0.008, z, 0, { cast: false });

  // 望板：四面。
  const apronH = 0.095;
  const apronY = topY - topThickness - 0.01 - apronH / 2;
  addBox(builder, 'tableWood', width - 0.12, apronH, 0.03, 0, apronY, z - length / 2 + 0.075, 0);
  addBox(builder, 'tableWood', width - 0.12, apronH, 0.03, 0, apronY, z + length / 2 - 0.075, 0);
  addBox(builder, 'tableWood', 0.03, apronH, length - 0.15, -width / 2 + 0.075, apronY, z, 0);
  addBox(builder, 'tableWood', 0.03, apronH, length - 0.15, width / 2 - 0.075, apronY, z, 0);

  // 四条方锥腿 + 底部横撑。
  const legY = (topY - topThickness - 0.01 - apronH) / 2;
  const legH = topY - topThickness - 0.01 - apronH;
  const x = width / 2 - legInset;
  const zHalf = length / 2 - legInset;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addCylinder(
        builder,
        'tableWood',
        0.034,
        0.045,
        legH,
        4,
        trs(sx * x, legY, z + sz * zHalf, 0, 1, 1, 1, 0, Math.PI / 4),
      );
      // 铜脚套。
      addBox(builder, 'brassDark', 0.075, 0.03, 0.075, sx * x, 0.016, z + sz * zHalf, 0, { cast: false });
      // 桌面下的角撑。
      addBox(builder, 'tableWood', 0.06, 0.09, 0.06, sx * x, topY - topThickness - apronH - 0.045, z + sz * zHalf, 0, {
        cast: false,
      });
    }
  }
  addBox(builder, 'tableWood', 0.04, 0.045, zHalf * 2 - 0.08, -x, 0.2, z, 0);
  addBox(builder, 'tableWood', 0.04, 0.045, zHalf * 2 - 0.08, x, 0.2, z, 0);
  addBox(builder, 'tableWood', x * 2 - 0.08, 0.045, 0.04, 0, 0.2, z - zHalf, 0);
  addBox(builder, 'tableWood', x * 2 - 0.08, 0.045, 0.04, 0, 0.2, z + zHalf, 0);
  void rng;
}

/* --- 木靠背椅 ------------------------------------------------------ */

function buildChair(builder, x, z, ry) {
  const base = trs(x, 0, z, ry);
  const local = (lx, lz) => base.clone().multiply(trs(lx, 0, lz));
  const halfW = CHAIR.width / 2 - 0.03;
  const halfD = CHAIR.depth / 2 - 0.03;

  // 前腿。
  for (const sx of [-1, 1]) {
    addCylinder(builder, 'chairWood', 0.017, 0.021, 0.44, 8, local(sx * halfW, halfD).multiply(trs(0, 0.22, 0)));
  }
  // 后腿延长成靠背立柱。
  for (const sx of [-1, 1]) {
    addCylinder(builder, 'chairWood', 0.016, 0.021, CHAIR.backHeight, 8, local(sx * halfW, -halfD).multiply(trs(0, CHAIR.backHeight / 2, 0)));
  }
  // 座面。
  builder.add(
    'chairWood',
    roundedBoxGeometry(CHAIR.width, 0.038, CHAIR.depth, 0.012, 3),
    base.clone().multiply(trs(0, CHAIR.seatY, 0)),
    { cast: true, receive: true },
  );
  // 靠背横板 + 顶冠。
  for (const y of [0.62, 0.74, 0.86]) {
    builder.add(
      'chairWood',
      roundedBoxGeometry(CHAIR.width - 0.07, 0.05, 0.018, 0.008, 3),
      base.clone().multiply(trs(0, y, -halfD - 0.005)),
      { cast: true, receive: true },
    );
  }
  builder.add(
    'chairWood',
    roundedBoxGeometry(CHAIR.width - 0.03, 0.075, 0.032, 0.012, 3),
    base.clone().multiply(trs(0, CHAIR.backHeight - 0.01, -halfD - 0.008)),
    { cast: true, receive: true },
  );
  // 侧向后撑与踏脚横档。
  for (const sx of [-1, 1]) {
    builder.add('chairWood', boxGeometry(0.022, 0.022, halfD * 2), local(sx * halfW, 0).multiply(trs(0, 0.2, 0)), {
      cast: false,
      receive: true,
    });
  }
  addBox(builder, 'chairWood', halfW * 2, 0.024, 0.022, 0, 0.19, halfD, 0, { cast: false });
  addBox(builder, 'chairWood', halfW * 2, 0.024, 0.022, 0, 0.24, -halfD, 0, { cast: false });
}

/* --- 绿玻璃罩阅读灯 ------------------------------------------------ */

function buildBankerLamp(builder, x, tableZ, ry) {
  const base = trs(x, BANKER_LAMP.tableY, tableZ, ry);
  const { baseWidth, shadeRadius, shadeHeight } = BANKER_LAMP;
  // 底座：黄铜方座 + 深色毛毡垫。
  builder.add('brassDark', roundedBoxGeometry(baseWidth, 0.022, baseWidth, 0.008, 2), base.clone().multiply(trs(0, 0.011, 0)), {
    cast: true,
    receive: true,
  });
  builder.add('cord', boxGeometry(baseWidth - 0.02, 0.006, baseWidth - 0.02), base.clone().multiply(trs(0, 0.003, 0)), {
    cast: false,
  });
  // 灯杆与黄铜节。
  builder.add('brass', cylinderGeometry(0.011, 0.013, 0.235, 10), base.clone().multiply(trs(0, 0.14, 0)), {
    cast: true,
    receive: true,
  });
  builder.add('brass', cylinderGeometry(0.02, 0.02, 0.018, 12), base.clone().multiply(trs(0, 0.26, 0)), {
    cast: false,
  });
  // 绿玻璃罩。
  builder.add(
    'greenGlass',
    bankerShadeGeometry(shadeRadius, shadeHeight, 26),
    base.clone().multiply(trs(0, 0.27, 0)),
    { cast: true, receive: false },
  );
  builder.add('brass', cylinderGeometry(0.018, 0.024, 0.02, 12), base.clone().multiply(trs(0, 0.385, 0)), {
    cast: false,
  });
  builder.add('brass', sphereGeometry(0.013, 10, 8), base.clone().multiply(trs(0, 0.4, 0)), { cast: false });
  // 罩内灯泡。
  builder.add('lampBulb', sphereGeometry(0.026, 12, 10), base.clone().multiply(trs(0, 0.305, 0)), {
    cast: false,
    receive: false,
  });
  // 罩口下方的绿色光晕。
  builder.add(
    'lampGlow',
    planeGeometry(shadeRadius * 2.6, shadeRadius * 2.6),
    base.clone().multiply(trs(0, 0.269, 0, 0, 1, 1, 1, Math.PI / 2, 0)),
    { cast: false, receive: false },
  );
  // 投在桌面上的绿色光池。
  builder.add(
    'lampGlow',
    planeGeometry(shadeRadius * 3.1, shadeRadius * 3.1),
    base.clone().multiply(trs(0, 0.002, 0, 0, 1, 1, 1, -Math.PI / 2, 0)),
    { cast: false, receive: false },
  );
}

/* --- 桌面道具 ------------------------------------------------------ */

function buildOpenBook(builder, x, y, z, ry, rng) {
  const base = trs(x, y, z, ry);
  const coverKey = ['book1', 'book2', 'book3', 'book7'][Math.floor(rng() * 4)];
  // 封面 / 封底。
  builder.add(coverKey, boxGeometry(0.3, 0.008, 0.22), base.clone().multiply(trs(0, 0.004, 0)), { cast: false });
  for (const side of [-1, 1]) {
    builder.add(
      'paper',
      boxGeometry(0.13, 0.012, 0.2),
      base.clone().multiply(trs(side * 0.075, 0.014, 0.005, 0, 1, 1, 1, 0, side * 0.05)),
      { cast: false },
    );
    builder.add(
      'paper',
      boxGeometry(0.12, 0.006, 0.19),
      base.clone().multiply(trs(side * 0.072, 0.022, 0.005, 0, 1, 1, 1, 0, side * 0.07)),
      { cast: false, receive: false },
    );
  }
  // 书签。
  builder.add('goldFoil', boxGeometry(0.012, 0.002, 0.16), base.clone().multiply(trs(0.02, 0.026, 0.01, 0.12)), {
    cast: false,
    receive: false,
  });
}

function buildTableProps(builder, table, rng) {
  const y = TABLE.topY;
  const z = table.z;
  // 一本摊开的书 + 一摞合起的书 + 一张纸和铅笔。
  buildOpenBook(builder, 0.11, y, z + 0.28, 0.16 + rng() * 0.1, rng);
  let stackY = y;
  for (let i = 0; i < 2; i += 1) {
    const thickness = 0.032 + rng() * 0.012;
    const depth = 0.2 + rng() * 0.03;
    const width = 0.27 + rng() * 0.04;
    builder.add(
      ['book4', 'book5', 'book9', 'book2'][Math.floor(rng() * 4)],
      roundedBoxGeometry(width, thickness, depth, 0.004, 2),
      trs(-0.2 + (rng() - 0.5) * 0.02, stackY + thickness / 2, z - 0.35 + i * 0.01, (rng() - 0.5) * 0.12),
      { cast: false, receive: true },
    );
    stackY += thickness;
  }
  // 纸与铅笔。
  builder.add('paper', planeGeometry(0.21, 0.29), trs(0.24, y + 0.002, z - 0.18, 0.2, 1, 1, 1, -Math.PI / 2), {
    cast: false,
    receive: true,
  });
  addCylinder(builder, 'book5', 0.005, 0.005, 0.15, 6, trs(0.2, y + 0.012, z - 0.1, 0.9, 1, 1, 1, 0, Math.PI / 2), {
    cast: false,
  });
}

/* --- 窗下软垫长凳 -------------------------------------------------- */

function buildWindowBench(builder) {
  const width = BENCH.x1 - BENCH.x0;
  const depth = BENCH.z1 - BENCH.z0;
  const cx = (BENCH.x0 + BENCH.x1) / 2;
  const cz = (BENCH.z0 + BENCH.z1) / 2;
  const seatY = BENCH.seatY;

  // 端板。
  addBox(builder, 'trimWood', depth - 0.03, seatY - 0.03, 0.045, BENCH.x0 + 0.023, (seatY - 0.03) / 2, cz, 0);
  addBox(builder, 'trimWood', depth - 0.03, seatY - 0.03, 0.045, BENCH.x1 - 0.023, (seatY - 0.03) / 2, cz, 0);
  // 前脸横档与竖条。
  addBox(builder, 'trimWood', width - 0.07, 0.06, 0.03, cx, seatY - 0.055, BENCH.z1 - 0.035, 0);
  addBox(builder, 'trimWood', width - 0.07, 0.045, 0.03, cx, 0.06, BENCH.z1 - 0.035, 0);
  for (let i = 0; i < 9; i += 1) {
    const x = BENCH.x0 + 0.12 + (i * (width - 0.24)) / 8;
    addBox(builder, 'shelfWood', 0.045, seatY - 0.12, 0.026, x, (seatY - 0.1) / 2, BENCH.z1 - 0.035, 0, { cast: false });
  }
  // 座面框。
  addBox(builder, 'trimWood', width, 0.05, depth - 0.02, cx, seatY - 0.045, cz);

  // 坐垫：深绿绒面，压三条缝。
  builder.add(
    'cushionGreen',
    roundedBoxGeometry(width - 0.06, BENCH.cushion, depth - 0.06, 0.05, 4),
    trs(cx, seatY + BENCH.cushion / 2 - 0.005, cz - 0.01),
    { cast: true, receive: true },
  );
  for (let i = 0; i < 3; i += 1) {
    addBox(builder, 'trimWood', 0.018, 0.008, 0.05, cx, seatY + BENCH.cushion + 0.001, cz - 0.01 + (i - 1) * (depth / 2.6), 0, {
      cast: false,
    });
  }
  // 靠墙的三只抱枕。
  const pillows = [
    { x: BENCH.x0 + 0.36, material: 'cushionCream', ry: 0.06 },
    { x: cx, material: 'cushionGreen', ry: -0.05 },
    { x: BENCH.x1 - 0.36, material: 'cushionOxblood', ry: 0.04 },
  ];
  for (const pillow of pillows) {
    builder.add(
      pillow.material,
      roundedBoxGeometry(0.4, 0.32, 0.16, 0.06, 4),
      trs(pillow.x, seatY + 0.25, BENCH.z0 + 0.14, pillow.ry, 1, 1, 1, -0.16, 0),
      { cast: true, receive: true },
    );
    // 中间的一颗布包扣。
    builder.add('brass', sphereGeometry(0.014, 8, 6), trs(pillow.x, seatY + 0.25, BENCH.z0 + 0.225, 0, 1, 1, 0.4), {
      cast: false,
    });
  }

  // 长凳下的小书堆。
  for (let i = 0; i < 3; i += 1) {
    builder.add(
      ['book1', 'book3', 'book6'][i],
      boxGeometry(0.18, 0.03, 0.24),
      trs(BENCH.x1 - 0.3, 0.03 + i * 0.032, BENCH.z0 + 0.2, 0.08),
      { cast: false, receive: true },
    );
  }
}

/* --- 落地地球仪 ---------------------------------------------------- */

const CONTINENTS = [
  // [经度, 纬度, 角半径(弧度), 权重]
  [15, 52, 0.34, 1.0],
  [70, 55, 0.36, 0.95],
  [100, 45, 0.3, 0.9],
  [30, 30, 0.24, 0.8],
  [80, 22, 0.2, 0.8],
  [10, 8, 0.23, 0.95],
  [25, -12, 0.22, 0.9],
  [18, -28, 0.18, 0.75],
  [-100, 45, 0.32, 0.95],
  [-95, 30, 0.24, 0.85],
  [-110, 60, 0.22, 0.6],
  [-60, -6, 0.22, 0.85],
  [-65, -28, 0.18, 0.8],
  [-70, -45, 0.13, 0.6],
  [135, -25, 0.2, 0.9],
  [150, -30, 0.15, 0.7],
  [-42, 72, 0.16, 0.7],
  [80, 5, 0.06, 0.3],
  [47, -20, 0.07, 0.35],
  [138, 36, 0.06, 0.3],
  [175, -42, 0.07, 0.35],
  [-75, 20, 0.06, 0.3],
];

function globeSurfaceGeometry(radius) {
  const segments = 96;
  const rings = 64;
  const geometry = new THREE.SphereGeometry(radius, segments, rings);
  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const dir = new THREE.Vector3();
  const centers = CONTINENTS.map(([lon, lat, spread, weight]) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = lon * (Math.PI / 180);
    return {
      dir: new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta),
      ),
      spread,
      weight,
    };
  });

  const sea = new THREE.Color(0xb39d72);
  const seaDeep = new THREE.Color(0x9e8760);
  const landLow = new THREE.Color(0x5f7040);
  const landHigh = new THREE.Color(0x7d6f42);
  const coast = new THREE.Color(0x3a2e1e);
  const grid = new THREE.Color(0x6d5838);

  for (let i = 0; i < position.count; i += 1) {
    dir.fromBufferAttribute(position, i).normalize();
    let land = 0;
    for (const center of centers) {
      const angle = Math.acos(THREE.MathUtils.clamp(dir.dot(center.dir), -1, 1));
      const t = angle / center.spread;
      if (t < 2.4) land += center.weight * Math.exp(-t * t * 1.5);
    }
    land = Math.min(1, land);
    const lat = Math.abs((Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1)) * 180) / Math.PI);
    const long = (Math.atan2(dir.z, dir.x) * 180) / Math.PI;

    // 经纬线：每 15°，只在海面上留一条很淡的刻线。
    const latLine = Math.abs((((lat + 7.5) % 15) + 15) % 15 - 7.5) > 7.35 ? 1 : 0;
    const longLine = Math.abs((((long + 7.5) % 15) + 15) % 15 - 7.5) > 7.35 ? 1 : 0;

    let color;
    if (land > 0.32) {
      color = landLow.clone().lerp(landHigh, THREE.MathUtils.clamp(lat / 75, 0, 1) * 0.7);
      if (land < 0.42) color.lerp(coast, 0.55);
    } else {
      color = sea.clone().lerp(seaDeep, THREE.MathUtils.clamp((lat - 20) / 70, 0, 1) * 0.5);
      if ((latLine || longLine) && land < 0.2) color.lerp(grid, 0.3);
    }
    // 极地提亮。
    if (lat > 76) color.lerp(new THREE.Color(0xe2dcc8), 0.55);

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    const displacement = radius * (1 + land * land * 0.032);
    position.setXYZ(i, dir.x * displacement, dir.y * displacement, dir.z * displacement);
  }
  position.needsUpdate = true;
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function buildGlobe(builder, materials, root) {
  const { x, z, baseRadius, sphereRadius, centerY, tilt } = GLOBE;
  const at = (y) => trs(x, y, z);

  // 三条弯脚 + 黄铜脚轮，全部以球体的 x/z 为轴心。
  for (let i = 0; i < 3; i += 1) {
    const angle = (i / 3) * Math.PI * 2 + 0.5;
    const points = [
      new THREE.Vector3(0, 0.13, 0),
      new THREE.Vector3(Math.cos(angle) * 0.16, 0.12, Math.sin(angle) * 0.16),
      new THREE.Vector3(Math.cos(angle) * baseRadius * 0.84, 0.045, Math.sin(angle) * baseRadius * 0.84),
      new THREE.Vector3(Math.cos(angle) * baseRadius, 0.012, Math.sin(angle) * baseRadius),
    ];
    builder.add('tableWood', tubeGeometry(points, 0.03, 18, 7), trs(x, 0, z), { cast: true, receive: true });
    builder.add(
      'brassDark',
      sphereGeometry(0.034, 10, 8),
      trs(x + Math.cos(angle) * baseRadius, 0.036, z + Math.sin(angle) * baseRadius),
      { cast: false },
    );
  }

  // 宽大的木质底盘 + 黄铜圈，让整座地球仪有明确的落地重量。
  builder.add('tableWood', cylinderGeometry(baseRadius * 0.58, baseRadius * 0.66, 0.07, 24), at(0.095), {
    cast: true,
    receive: true,
  });
  builder.add('brass', torusGeometry(baseRadius * 0.6, 0.008, 6, 32), at(0.13).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)), {
    cast: false,
  });

  // 车木立柱：底部粗、腰部收、顶部再放宽承托球体。
  const columnProfile = [
    [0.0, 0.0],
    [0.16, 0.0],
    [0.15, 0.025],
    [0.09, 0.06],
    [0.062, 0.12],
    [0.055, 0.3],
    [0.072, 0.38],
    [0.05, 0.46],
    [0.058, 0.58],
    [0.074, 0.63],
    [0.05, 0.66],
  ];
  builder.add('tableWood', latheGeometry(columnProfile, 24), at(0.12), { cast: true, receive: true });

  // 黄铜承托：一圈铜箍 + 一只托碗 + 一根插销，把子午圈/球体接在立柱上。
  builder.add('brass', cylinderGeometry(0.082, 0.094, 0.055, 18), at(0.735), { cast: false });
  builder.add(
    'brassDark',
    latheGeometry(
      [
        [0.0, 0.0],
        [0.155, 0.0],
        [0.168, 0.018],
        [0.145, 0.05],
        [0.085, 0.072],
        [0.0, 0.078],
      ],
      24,
    ),
    at(centerY - sphereRadius - 0.055),
    { cast: false, receive: false },
  );
  builder.add('brass', cylinderGeometry(0.022, 0.026, 0.075, 14), at(centerY - sphereRadius - 0.015), { cast: false });

  // 黄铜子午圈（随球体倾斜）。
  const ringGroup = new THREE.Group();
  ringGroup.name = 'globe-meridian';
  ringGroup.position.set(x, centerY, z);
  ringGroup.rotation.z = tilt;
  const ringBuilder = new StaticBuilder();
  ringBuilder.add('brass', torusGeometry(sphereRadius + 0.02, 0.013, 8, 64), trs(0, 0, 0), { cast: false, receive: false });
  ringBuilder.add('brassDark', cylinderGeometry(0.01, 0.01, sphereRadius * 2.1, 10), trs(0, 0, 0), { cast: false, receive: false });
  for (const side of [-1, 1]) {
    ringBuilder.add('brass', sphereGeometry(0.024, 10, 8), trs(0, side * (sphereRadius + 0.035), 0), { cast: false });
  }
  ringBuilder.flush(ringGroup, materials, 'globe-meridian');
  root.add(ringGroup);

  // 球体：顶点色大陆 + 缓慢自转。
  const spin = new THREE.Group();
  spin.name = 'globe-spin';
  spin.position.set(x, centerY, z);
  spin.rotation.z = tilt;
  const globeMesh = new THREE.Mesh(globeSurfaceGeometry(sphereRadius), materials.globeSurface);
  globeMesh.name = 'globe-surface';
  globeMesh.castShadow = false;
  globeMesh.receiveShadow = true;
  spin.add(globeMesh);
  root.add(spin);

  return { spin, ringGroup, mesh: globeMesh };
}

/* --- 复古落地衣帽架 ------------------------------------------------ */

function buildCoatRack(builder, materials) {
  const { x, z, height } = COAT_RACK;
  const group = new THREE.Group();
  group.name = 'coat-rack';
  const local = new StaticBuilder();

  // 三条外撇的弯脚。
  for (let i = 0; i < 3; i += 1) {
    const angle = (i / 3) * Math.PI * 2 + 0.35;
    const points = [
      new THREE.Vector3(0, 0.12, 0),
      new THREE.Vector3(Math.cos(angle) * 0.14, 0.12, Math.sin(angle) * 0.14),
      new THREE.Vector3(Math.cos(angle) * 0.27, 0.03, Math.sin(angle) * 0.27),
      new THREE.Vector3(Math.cos(angle) * 0.3, 0.008, Math.sin(angle) * 0.3),
    ];
    local.add('ladderWood', tubeGeometry(points, 0.022, 16, 6), trs(0, 0, 0), { cast: true, receive: true });
  }
  // 旋转立柱。
  const profile = [
    [0, 0],
    [0.12, 0],
    [0.13, 0.02],
    [0.08, 0.04],
    [0.045, 0.1],
    [0.038, 0.55],
    [0.05, 0.62],
    [0.036, 0.7],
    [0.042, 1.15],
    [0.055, 1.22],
    [0.04, 1.3],
    [0.036, height - 0.18],
    [0.06, height - 0.1],
    [0.05, height - 0.02],
    [0, height],
  ];
  local.add('ladderWood', latheGeometry(profile, 24), trs(0, 0, 0), { cast: true, receive: true });
  local.add('brass', torusGeometry(0.052, 0.008, 6, 24), trs(0, 1.04, 0, 0, 1, 1, 1, Math.PI / 2), { cast: false });

  // 四个黄铜衣帽钩。
  for (let i = 0; i < 4; i += 1) {
    const angle = (i / 4) * Math.PI * 2 + 0.7;
    local.add(
      'brass',
      coatHookGeometry(0.17, 0.075, 0.009),
      trs(0, height - 0.26 - (i % 2) * 0.05, 0, angle),
      { cast: false, receive: false },
    );
  }

  local.flush(group, materials, 'coat-rack-parts');

  // 两只木衣架 + 一只空钩。
  const hangerBuilder = new StaticBuilder();
  const hangers = [
    { angle: 0.7, y: height - 0.25, lean: 0.03 },
    { angle: 0.7 + Math.PI * 1.5, y: height - 0.29, lean: -0.03 },
  ];
  for (const hanger of hangers) {
    const matrix = trs(
      Math.cos(hanger.angle) * 0.15,
      hanger.y,
      Math.sin(hanger.angle) * 0.15,
      -hanger.angle + Math.PI / 2,
      1,
      1,
      1,
      0,
      hanger.lean,
    );
    // 衣架挂钩。
    hangerBuilder.add('brass', coatHookGeometry(0.045, 0.055, 0.005), matrix.clone().multiply(trs(0, 0.03, 0)), {
      cast: false,
      receive: false,
    });
    // 两侧下斜的肩杆 + 横杆，读起来像衣架而不是一块木板。
    for (const side of [-1, 1]) {
      hangerBuilder.add(
        'ladderWood',
        boxGeometry(0.24, 0.016, 0.022),
        matrix.clone().multiply(trs(side * 0.105, -0.052, 0, 0, 1, 1, 1, 0, side * -0.3)),
        { cast: false, receive: false },
      );
    }
    hangerBuilder.add('ladderWood', boxGeometry(0.2, 0.013, 0.02), matrix.clone().multiply(trs(0, -0.15, 0)), {
      cast: false,
      receive: false,
    });
  }
  hangerBuilder.flush(group, materials, 'coat-hangers');
  group.position.set(x, 0, z);
  return group;
}

/* --- 组装 ---------------------------------------------------------- */

export function buildFurniture(builder, materials, root) {
  const rng = mulberry32(0x2f6b41);
  let chairs = 0;
  let lamps = 0;

  for (const table of TABLE.list) {
    buildTable(builder, table, rng);
    for (const side of [-1, 1]) {
      for (const chairZ of table.chairZ) {
        buildChair(builder, side * TABLE.chairOffset, table.z + chairZ, side > 0 ? -Math.PI / 2 : Math.PI / 2);
        chairs += 1;
      }
    }
    const lampSpread = table.length > 2 ? BANKER_LAMP.offset : BANKER_LAMP.offset - 0.3;
    for (const side of [-1, 1]) {
      buildBankerLamp(builder, 0, table.z + side * lampSpread, 0);
      lamps += 1;
    }
    buildTableProps(builder, table, rng);
  }

  buildWindowBench(builder);
  const globe = buildGlobe(builder, materials, root);
  root.add(buildCoatRack(builder, materials));

  CONTENT_COUNTS.chairs = chairs;
  CONTENT_COUNTS.bankerLamps = lamps;
  CONTENT_COUNTS.tables = TABLE.list.length;

  return { globe, counts: { tables: TABLE.list.length, chairs, lamps } };
}


