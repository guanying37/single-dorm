import * as THREE from 'three';
import { PAINTINGS, PAINTING, CLOCKS, CEILING } from './config.js';
import {
  StaticBuilder,
  trs,
  boxGeometry,
  cylinderGeometry,
  planeGeometry,
  sphereGeometry,
  torusGeometry,
  latheGeometry,
  tubeGeometry,
  rodGeometry,
  mulberry32,
} from './utils.js';

/* ------------------------------------------------------------------ *
 * Ceiling equipment, wall paintings, and the two clocks.
 *
 * Paintings are shallow 3-D still lifes rather than bitmaps: the brief
 * forbids drawing artwork, and a relief reads convincingly as a framed
 * food picture from across a 36 m room while remaining replaceable with
 * an art texture later.
 * ------------------------------------------------------------------ */

const DEG = Math.PI / 180;

/* --- Ceiling ------------------------------------------------------- */

function buildCeiling(builder) {
  const fixtureLength = 1.6;
  const fixtureDepth = 0.24;
  for (const z of CEILING.lightRows) {
    for (const x of CEILING.lightColumns) {
      builder.add('fixtureMetal', boxGeometry(fixtureLength, 0.06, fixtureDepth), trs(x, 4.16, z), { cast: false });
      builder.add('ledWhite', boxGeometry(fixtureLength - 0.1, 0.008, fixtureDepth - 0.07), trs(x, 4.126, z), { cast: false, receive: false });
    }
  }

  for (const unit of CEILING.airConditioners) {
    builder.add('acWhite', boxGeometry(0.95, 0.15, 0.95), trs(unit.x, 4.105, unit.z), { cast: false });
    builder.add('acWhite', boxGeometry(0.9, 0.012, 0.9), trs(unit.x, 4.026, unit.z), { cast: false });
    builder.add('black', boxGeometry(0.34, 0.006, 0.34), trs(unit.x, 4.018, unit.z), { cast: false, receive: false });
    for (let i = 0; i < 4; i += 1) {
      const offset = (i - 1.5) * 0.2;
      builder.add('acWhite', boxGeometry(0.82, 0.014, 0.035), trs(unit.x, 4.015, unit.z + offset), { cast: false });
      builder.add('acWhite', boxGeometry(0.035, 0.014, 0.82), trs(unit.x + offset, 4.015, unit.z), { cast: false });
    }
  }

  // Dome cameras: four corners plus a pair over the entrance.
  for (const cam of CEILING.cameras) {
    const yaw = Math.atan2(-cam.x, -cam.z);
    const matrix = new THREE.Matrix4()
      .multiply(trs(cam.x, 4.18, cam.z, yaw))
      .multiply(new THREE.Matrix4().makeRotationX(0.56));
    const local = (geometry, x, y, z, rx = 0, ry = 0, rz = 0) =>
      matrix.clone().multiply(trs(x, y, z, ry, 1, 1, 1, rx, rz));
    builder.add('cameraBody', cylinderGeometry(0.062, 0.062, 0.018, 16), local(null, 0, 0, 0, Math.PI, 0, 0), { cast: false });
    builder.add('cameraBody', boxGeometry(0.03, 0.07, 0.03), local(null, 0, -0.045, 0), { cast: false });
    builder.add('cameraBody', cylinderGeometry(0.042, 0.042, 0.12, 16), local(null, 0, -0.09, 0.055, Math.PI / 2), { cast: false });
    builder.add('dome', sphereGeometry(0.045, 18, 12), local(null, 0, -0.09, 0.125, 0, 0, 0), { cast: false });
    builder.add('dome', torusGeometry(0.028, 0.006, 6, 20), local(null, 0, -0.09, 0.132, 0, 0, 0), { cast: false });
    builder.add('ledRed', sphereGeometry(0.006, 8, 6), local(null, 0.028, -0.06, 0.09), { cast: false, receive: false });
  }
}

/* --- Paintings ----------------------------------------------------- */

function paintingMatrix(painting) {
  const y = PAINTING.centerY;
  if (painting.wall === 'west') return trs(-17.988, y, painting.at, Math.PI / 2);
  if (painting.wall === 'east') return trs(17.988, y, painting.at, -Math.PI / 2);
  if (painting.wall === 'south') return trs(painting.at, y, 10.988, Math.PI);
  return trs(painting.at, y, -10.988, 0);
}

function addReliefPiece(builder, key, geometry, local, matrix) {
  builder.add(key, geometry, matrix.clone().multiply(local), { cast: false, receive: true });
}

function reliefEllipsoid(builder, key, matrix, x, y, z, sx, sy, sz, rz = 0) {
  addReliefPiece(builder, key, sphereGeometry(1, 16, 12), trs(x, y, z, 0, sx, sy, sz, 0, rz), matrix);
}

function reliefDisc(builder, key, matrix, x, y, z, radius, height = 0.012) {
  addReliefPiece(
    builder,
    key,
    cylinderGeometry(radius, radius * 0.97, height, 28),
    trs(x, y, z, 0, 1, 1, 1, Math.PI / 2),
    matrix,
  );
}

function reliefBox(builder, key, matrix, x, y, z, w, h, d, rz = 0) {
  addReliefPiece(builder, key, boxGeometry(w, h, d), trs(x, y, z, 0, 1, 1, 1, 0, rz), matrix);
}

function addFruit(builder, matrix, x, y, colorKey, radius) {
  reliefEllipsoid(builder, colorKey, matrix, x, y, 0.065, radius, radius * 0.92, radius * 0.8);
  reliefEllipsoid(builder, 'greenery', matrix, x + radius * 0.2, y + radius * 0.9, 0.065, 0.02, 0.008, 0.008, 0.6);
  reliefBox(builder, 'greenery', matrix, x + radius * 0.5, y + radius * 1.1, 0.063, 0.012, 0.006, 0.012);
}

function buildRelief(theme, builder, matrix) {
  // Every composition lives inside a 0.62 x 0.42 canvas, sitting on a
  // shallow plate or board.
  if (theme === 'bread') {
    addReliefPiece(builder, 'walnut', boxGeometry(0.42, 0.2, 0.018), trs(0, -0.06, 0.022), matrix);
    reliefEllipsoid(builder, 'bread', matrix, 0, -0.02, 0.052, 0.17, 0.062, 0.05);
    reliefEllipsoid(builder, 'crust', matrix, 0, -0.05, 0.05, 0.17, 0.03, 0.045);
    for (let i = -1; i <= 1; i += 1) {
      reliefBox(builder, 'crust', matrix, i * 0.055, 0.03, 0.075, 0.012, 0.055, 0.006, i * 0.28);
    }
    // Two wheat ears tucked in at the side.
    for (const side of [-1, 1]) {
      reliefBox(builder, 'lemon', matrix, side * 0.2, -0.03, 0.045, 0.006, 0.19, 0.006, side * 0.22);
      for (let i = 0; i < 4; i += 1) {
        reliefEllipsoid(builder, 'lemon', matrix, side * (0.185 + i * 0.006), 0.04 + i * 0.026, 0.05, 0.012, 0.008, 0.006, 0.3);
      }
    }
  } else if (theme === 'fish') {
    reliefDisc(builder, 'ceramic', matrix, 0, -0.05, 0.028, 0.19, 0.014);
    reliefEllipsoid(builder, 'fish', matrix, 0, 0.0, 0.06, 0.18, 0.065, 0.035);
    addReliefPiece(builder, 'fish', cylinderGeometry(0.055, 0.005, 0.02, 4), trs(-0.2, 0, 0.06, 0, 1, 1, 1, Math.PI / 2, Math.PI / 2), matrix);
    reliefDisc(builder, 'clockInk', matrix, 0.15, 0.03, 0.085, 0.008, 0.004);
    for (const side of [-1, 1]) {
      reliefDisc(builder, 'lemon', matrix, side * 0.1, -0.12, 0.045, 0.035, 0.01);
    }
    reliefEllipsoid(builder, 'greenery', matrix, 0.02, 0.11, 0.06, 0.05, 0.008, 0.012, 0.4);
    reliefEllipsoid(builder, 'greenery', matrix, -0.04, 0.105, 0.06, 0.04, 0.008, 0.012, -0.3);
  } else if (theme === 'fruit') {
    reliefDisc(builder, 'ceramic', matrix, 0, -0.07, 0.028, 0.2, 0.014);
    addFruit(builder, matrix, -0.09, -0.03, 'fruitRed', 0.052);
    addFruit(builder, matrix, 0.04, -0.01, 'fruitOrange', 0.05);
    addFruit(builder, matrix, 0.14, -0.06, 'fruitGreen', 0.045);
    // Grapes.
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2;
      reliefEllipsoid(builder, 'wine', matrix, -0.15 + Math.cos(a) * 0.03, -0.1 + Math.sin(a) * 0.03, 0.055, 0.012, 0.012, 0.012);
    }
  } else if (theme === 'wine') {
    addReliefPiece(
      builder,
      'wine',
      latheGeometry(
        [
          [0, 0],
          [0.045, 0],
          [0.047, 0.02],
          [0.045, 0.12],
          [0.022, 0.16],
          [0.018, 0.24],
          [0.021, 0.25],
          [0, 0.25],
        ],
        20,
      ),
      trs(-0.1, -0.15, 0.05),
      matrix,
    );
    addReliefPiece(
      builder,
      'glass',
      latheGeometry(
        [
          [0, 0],
          [0.04, 0],
          [0.045, 0.02],
          [0.04, 0.09],
          [0.045, 0.1],
          [0, 0.1],
        ],
        18,
      ),
      trs(0.12, -0.14, 0.051),
      matrix,
    );
    reliefBox(builder, 'wine', matrix, 0.12, -0.08, 0.051, 0.055, 0.035, 0.055);
    // Cheese wedge and grapes.
    addReliefPiece(
      builder,
      'cheese',
      cylinderGeometry(0.1, 0.1, 0.07, 3),
      trs(0.0, -0.16, 0.06, 0, 1, 1, 1, Math.PI / 2),
      matrix,
    );
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2;
      reliefEllipsoid(builder, 'wine', matrix, 0.13 + Math.cos(a) * 0.028, -0.15 + Math.sin(a) * 0.028, 0.085, 0.012, 0.012, 0.012);
    }
    reliefEllipsoid(builder, 'greenery', matrix, 0.08, 0.02, 0.05, 0.04, 0.007, 0.01, 0.5);
  } else if (theme === 'fowl') {
    reliefDisc(builder, 'ceramic', matrix, 0, -0.07, 0.028, 0.2, 0.014);
    reliefEllipsoid(builder, 'bread', matrix, 0, -0.01, 0.062, 0.13, 0.08, 0.055);
    reliefEllipsoid(builder, 'crust', matrix, 0, 0.045, 0.06, 0.1, 0.025, 0.04);
    for (const side of [-1, 1]) {
      reliefBox(builder, 'crust', matrix, side * 0.1, -0.09, 0.07, 0.02, 0.1, 0.02, side * 0.5);
      reliefEllipsoid(builder, 'bread', matrix, side * 0.14, -0.13, 0.07, 0.03, 0.025, 0.025);
    }
    for (const side of [-1, 1]) {
      reliefEllipsoid(builder, 'greenery', matrix, side * 0.045, 0.11, 0.055, 0.04, 0.008, 0.012, side * 0.5);
    }
  } else if (theme === 'dessert') {
    reliefDisc(builder, 'ceramic', matrix, 0, -0.08, 0.028, 0.19, 0.014);
    reliefBox(builder, 'cream', matrix, 0, -0.055, 0.06, 0.13, 0.07, 0.08);
    reliefBox(builder, 'bread', matrix, 0, -0.02, 0.06, 0.13, 0.012, 0.08);
    reliefBox(builder, 'cream', matrix, 0, 0.01, 0.06, 0.13, 0.035, 0.08);
    reliefBox(builder, 'fruitRed', matrix, 0, 0.035, 0.06, 0.135, 0.012, 0.085);
    for (let i = -1; i <= 1; i += 1) {
      reliefEllipsoid(builder, 'fruitRed', matrix, i * 0.045, 0.065, 0.07, 0.022, 0.02, 0.02);
    }
    reliefEllipsoid(builder, 'greenery', matrix, 0.09, 0.075, 0.06, 0.025, 0.006, 0.01, 0.6);
  } else if (theme === 'soup') {
    addReliefPiece(
      builder,
      'ceramic',
      latheGeometry(
        [
          [0, 0],
          [0.055, 0],
          [0.12, 0.03],
          [0.135, 0.09],
          [0.125, 0.095],
          [0.11, 0.035],
          [0.05, 0.01],
          [0, 0.01],
        ],
        26,
      ),
      trs(0, -0.12, 0.045),
      matrix,
    );
    reliefDisc(builder, 'cream', matrix, 0, -0.02, 0.05, 0.1, 0.006);
    reliefBox(builder, 'steel', matrix, 0.16, 0.02, 0.055, 0.012, 0.19, 0.012, 0.4);
    reliefEllipsoid(builder, 'steel', matrix, 0.205, 0.085, 0.055, 0.03, 0.02, 0.01);
    reliefEllipsoid(builder, 'bread', matrix, -0.15, -0.09, 0.06, 0.07, 0.035, 0.03);
  } else {
    // vegetables
    addReliefPiece(
      builder,
      'ceramic',
      latheGeometry(
        [
          [0, 0],
          [0.06, 0],
          [0.12, 0.03],
          [0.13, 0.08],
          [0.12, 0.085],
          [0.105, 0.03],
          [0.055, 0.01],
          [0, 0.01],
        ],
        26,
      ),
      trs(0, -0.13, 0.04),
      matrix,
    );
    // Carrots.
    for (let i = -1; i <= 1; i += 1) {
      addReliefPiece(
        builder,
        'fruitOrange',
        cylinderGeometry(0.005, 0.03, 0.17, 8),
        trs(i * 0.055, 0.02 + i * 0.01, 0.06, 0, 1, 1, 1, 0, 0.5 * i),
        matrix,
      );
      reliefEllipsoid(builder, 'greenery', matrix, i * 0.055 + 0.01, 0.12 + i * 0.01, 0.06, 0.025, 0.01, 0.01, 0.5);
    }
    reliefEllipsoid(builder, 'fruitRed', matrix, -0.12, -0.07, 0.07, 0.04, 0.035, 0.03);
    reliefEllipsoid(builder, 'fruitGreen', matrix, 0.12, -0.06, 0.07, 0.055, 0.03, 0.02, 0.4);
    reliefEllipsoid(builder, 'greenery', matrix, 0.02, 0.06, 0.065, 0.07, 0.02, 0.02, -0.3);
  }
}

function buildPaintings(builder) {
  for (const painting of PAINTINGS) {
    const matrix = paintingMatrix(painting);

    // Frame: four bars plus a brass fillet.
    const w = PAINTING.width;
    const h = PAINTING.height;
    const bar = 0.064;
    const depth = PAINTING.depth;
    const frameParts = [
      { w, h: bar, x: 0, y: h / 2 - bar / 2 },
      { w, h: bar, x: 0, y: -h / 2 + bar / 2 },
      { w: bar, h: h - bar * 2, x: -w / 2 + bar / 2, y: 0 },
      { w: bar, h: h - bar * 2, x: w / 2 - bar / 2, y: 0 },
    ];
    for (const part of frameParts) {
      builder.add('oak', boxGeometry(part.w, part.h, depth), matrix.clone().multiply(trs(part.x, part.y, depth / 2)), {
        cast: false,
      });
    }
    for (const side of [-1, 1]) {
      builder.add(
        'brass',
        boxGeometry(w - bar * 2, 0.01, 0.012),
        matrix.clone().multiply(trs(0, side * (h / 2 - bar), depth - 0.002)),
        { cast: false },
      );
      builder.add(
        'brass',
        boxGeometry(0.01, h - bar * 2, 0.012),
        matrix.clone().multiply(trs(side * (w / 2 - bar), 0, depth - 0.002)),
        { cast: false },
      );
    }

    // Mat, shadow gap and linen mount.
    const innerW = w - bar * 2 - 0.05;
    const innerH = h - bar * 2 - 0.05;
    builder.add('clockInk', planeGeometry(innerW + 0.02, innerH + 0.02), matrix.clone().multiply(trs(0, 0, 0.0115)), {
      cast: false,
      receive: false,
    });
    builder.add('matBoard', planeGeometry(innerW, innerH), matrix.clone().multiply(trs(0, 0, 0.014)), {
      cast: false,
      receive: false,
    });
    builder.add('linen', planeGeometry(innerW - 0.07, innerH - 0.07), matrix.clone().multiply(trs(0, 0, 0.02)), {
      cast: false,
      receive: false,
    });
    // Bevelled mount edge: four thin strips standing 2 mm proud.
    for (const side of [-1, 1]) {
      builder.add(
        'matBoard',
        boxGeometry(innerW - 0.06, 0.014, 0.004),
        matrix.clone().multiply(trs(0, side * (innerH / 2 - 0.028), 0.021)),
        { cast: false },
      );
      builder.add(
        'matBoard',
        boxGeometry(0.014, innerH - 0.06, 0.004),
        matrix.clone().multiply(trs(side * (innerW / 2 - 0.028), 0, 0.021)),
        { cast: false },
      );
    }

    const reliefMatrix = matrix
      .clone()
      .multiply(trs(0, 0, 0.02))
      .multiply(new THREE.Matrix4().makeScale(1.22, 1.22, 1));
    buildRelief(painting.theme, builder, reliefMatrix);
  }
}

/* --- Potted plants ------------------------------------------------- */

const PLANT_POSITIONS = Object.freeze([
  { x: -16.35, z: -9.25 },
  { x: 16.35, z: -9.25 },
  { x: -16.35, z: 9.25 },
  { x: 16.35, z: 9.25 },
  { x: -3.35, z: 9.72 },
  { x: 3.35, z: 9.72 },
  { x: -3.6, z: -10.0 },
  { x: 3.6, z: -10.0 },
]);

function buildPlants(builder, materials) {
  const random = mulberry32(0x9e3779b9);
  for (const plant of PLANT_POSITIONS) {
    const base = trs(plant.x, 0, plant.z);

    const pot = latheGeometry(
      [
        [0, 0],
        [0.28, 0],
        [0.3, 0.02],
        [0.27, 0.46],
        [0.3, 0.53],
        [0.31, 0.56],
        [0.285, 0.56],
        [0.27, 0.52],
        [0.245, 0.46],
        [0, 0.44],
      ],
      24,
    );
    builder.add('planter', pot, base, { cast: true, receive: true });
    builder.add('soil', cylinderGeometry(0.255, 0.255, 0.02, 20), base.clone().multiply(trs(0, 0.5, 0)), {
      cast: false,
      receive: true,
    });

    // Trunk and a real branch hierarchy. Every leaf is attached to a
    // secondary twig by a short woody stem, so nothing floats.
    builder.add(
      'plantWood',
      tubeGeometry(
        [
          [0, 0.48, 0],
          [0.035, 0.9, 0.025],
          [0.0, 1.28, 0],
        ],
        0.036,
        14,
        10,
      ),
      base,
      { cast: false, receive: true },
    );
    builder.add(
      'plantWood',
      tubeGeometry(
        [
          [0.0, 1.24, 0],
          [-0.035, 1.55, -0.02],
          [0.02, 2.0, 0.03],
        ],
        0.024,
        14,
        10,
      ),
      base,
      { cast: false, receive: true },
    );

    const leafGeometry = sphereGeometry(1, 10, 6);
    leafGeometry.scale(0.115, 0.008, 0.06);
    leafGeometry.translate(0.115, 0, 0);

    const addLeaf = (origin, yaw, pitch, droop, scale, key) => {
      const matrix = base
        .clone()
        .multiply(trs(origin[0], origin[1], origin[2], yaw))
        .multiply(new THREE.Matrix4().makeRotationX(pitch))
        .multiply(new THREE.Matrix4().makeRotationZ(droop))
        .multiply(new THREE.Matrix4().makeScale(scale, 1, scale));
      builder.add(key, leafGeometry, matrix, { cast: true, receive: true });
    };

    const primaryCount = 5;
    const primaryBranches = [];
    for (let b = 0; b < primaryCount; b += 1) {
      const angle = (b / primaryCount) * Math.PI * 2 + 0.35 + random() * 0.35;
      const startY = 1.2 + random() * 0.5;
      const reach = 0.64 + random() * 0.26;
      const start = [0, startY, 0];
      const end = [
        Math.cos(angle) * reach,
        2.0 + random() * 0.42,
        Math.sin(angle) * reach,
      ];
      const mid = [
        (start[0] + end[0]) * 0.5 + Math.cos(angle + 0.9) * 0.05,
        (start[1] + end[1]) * 0.5 + 0.07,
        (start[2] + end[2]) * 0.5 + Math.sin(angle + 0.9) * 0.05,
      ];
      builder.add('plantWood', tubeGeometry([start, mid, end], 0.019, 12, 5), base, {
        cast: false,
        receive: true,
      });
      primaryBranches.push({ start, mid, end, angle });

      // Three leaves right at the branch tip.
      for (let tipLeaf = 0; tipLeaf < 3; tipLeaf += 1) {
        const origin = [
          end[0] + (random() - 0.5) * 0.12,
          end[1] + (random() - 0.2) * 0.1,
          end[2] + (random() - 0.5) * 0.12,
        ];
        const stem = rodGeometry(end, origin, 0.005, 5);
        builder.add('plantWood', stem, base, { cast: false, receive: true });
        const yaw = Math.atan2(origin[2], origin[0]) + (random() - 0.5) * 0.7;
        const pitch = -0.2 + (random() - 0.5) * 1.1;
        addLeaf(origin, yaw, pitch, -0.12 - random() * 0.3, 0.9 + random() * 0.3, tipLeaf === 0 ? 'leafLight' : 'leaf');
      }
    }

    for (const branch of primaryBranches) {
      // A little foliage lower on the primary branch closes the gap
      // between the bare trunk and the crown.
      for (const t of [0.3, 0.52]) {
        const point = [
          branch.start[0] + (branch.end[0] - branch.start[0]) * t,
          branch.start[1] + (branch.end[1] - branch.start[1]) * t,
          branch.start[2] + (branch.end[2] - branch.start[2]) * t,
        ];
        const origin = [
          point[0] + Math.cos(branch.angle) * (0.1 + random() * 0.1),
          point[1] - 0.04 + random() * 0.1,
          point[2] + Math.sin(branch.angle) * (0.1 + random() * 0.1),
        ];
        builder.add('plantWood', rodGeometry(point, origin, 0.005, 4), base, { cast: false, receive: true });
        const pitch = -0.2 + (random() - 0.5) * 1.2;
        addLeaf(
          origin,
          branch.angle + (random() - 0.5) * 0.8,
          pitch,
          -0.1 - random() * 0.35,
          0.9 + random() * 0.3,
          'leaf',
        );
      }

      for (let k = 0; k < 4; k += 1) {
        const t = 0.44 + k * 0.145;
        const basePoint = [
          branch.start[0] + (branch.end[0] - branch.start[0]) * t,
          branch.start[1] + (branch.end[1] - branch.start[1]) * t,
          branch.start[2] + (branch.end[2] - branch.start[2]) * t,
        ];
        const twigAngle = branch.angle + (k - 1.5) * 0.52 + (random() - 0.5) * 0.3;
        const length = 0.22 + random() * 0.16;
        const twigEnd = [
          basePoint[0] + Math.cos(twigAngle) * length,
          basePoint[1] + 0.1 + random() * 0.16,
          basePoint[2] + Math.sin(twigAngle) * length,
        ];
        const twigMid = [
          (basePoint[0] + twigEnd[0]) / 2 + Math.cos(twigAngle + 1.2) * 0.03,
          (basePoint[1] + twigEnd[1]) / 2 + 0.04,
          (basePoint[2] + twigEnd[2]) / 2 + Math.sin(twigAngle + 1.2) * 0.03,
        ];
        builder.add('plantWood', tubeGeometry([basePoint, twigMid, twigEnd], 0.012, 8, 5), base, {
          cast: false,
          receive: true,
        });

        for (let l = 0; l < 5; l += 1) {
          const u = 0.46 + l * 0.13;
          const point = [
            basePoint[0] + (twigEnd[0] - basePoint[0]) * u,
            basePoint[1] + (twigEnd[1] - basePoint[1]) * u,
            basePoint[2] + (twigEnd[2] - basePoint[2]) * u,
          ];
          const origin = [
            point[0] + (random() - 0.5) * 0.11,
            point[1] + (random() - 0.25) * 0.08,
            point[2] + (random() - 0.5) * 0.11,
          ];
          const stem = rodGeometry(point, origin, 0.005, 4);
          builder.add('plantWood', stem, base, { cast: false, receive: true });
          const yaw = Math.atan2(origin[2], origin[0]) + (random() - 0.5) * 0.8;
          const pitch = -0.2 + (random() - 0.5) * 1.2;
          addLeaf(origin, yaw, pitch, -0.1 - random() * 0.35, 0.95 + random() * 0.35, l === 1 ? 'leafLight' : 'leaf');
        }
      }
    }
  }
}

/* --- Clocks -------------------------------------------------------- */

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const STROKES = {
  I: [{ x: 0, y: 0, w: 0.005, h: 0.038, r: 0 }],
  V: [
    { x: -0.007, y: -0.004, w: 0.005, h: 0.042, r: 0.34 },
    { x: 0.007, y: -0.004, w: 0.005, h: 0.042, r: -0.34 },
  ],
  X: [
    { x: 0, y: 0, w: 0.005, h: 0.046, r: 0.62 },
    { x: 0, y: 0, w: 0.005, h: 0.046, r: -0.62 },
  ],
};

function addNumeral(builder, hourIndex, radius, centerY, z) {
  const text = ROMAN[(hourIndex + 11) % 12]; // 1..12
  const angle = ((hourIndex % 12) * Math.PI) / 6;
  const cx = Math.sin(angle) * radius;
  const cy = centerY + Math.cos(angle) * radius;
  const spacing = 0.015;
  const chars = text.split('');
  chars.forEach((character, index) => {
    const offsetX = (index - (chars.length - 1) / 2) * spacing;
    for (const stroke of STROKES[character]) {
      builder.add(
        'clockInk',
        boxGeometry(stroke.w, stroke.h, 0.004),
        trs(cx + offsetX + stroke.x, cy + stroke.y, z, 0, 1, 1, 1, 0, stroke.r),
      );
    }
  });
}

function buildPendulumClock(materials) {
  const group = new THREE.Group();
  group.name = 'pendulum-clock';
  group.position.set(CLOCKS.pendulum.x, CLOCKS.pendulum.y, CLOCKS.pendulum.z);
  group.scale.setScalar(1.12);

  const builder = new StaticBuilder();
  // Case.
  builder.add('walnut', boxGeometry(0.55, 1.15, 0.02), trs(0, 0.575, 0.01), { cast: true });
  builder.add('walnut', boxGeometry(0.05, 1.15, 0.1), trs(-0.25, 0.575, 0.05), { cast: true });
  builder.add('walnut', boxGeometry(0.05, 1.15, 0.1), trs(0.25, 0.575, 0.05), { cast: true });
  builder.add('walnut', boxGeometry(0.62, 0.06, 0.13), trs(0, 0.03, 0.055), { cast: true });
  builder.add('walnut', boxGeometry(0.62, 0.05, 0.13), trs(0, 1.125, 0.055), { cast: true });
  builder.add('walnut', boxGeometry(0.5, 0.035, 0.1), trs(0, 1.155, 0.05), { cast: true });
  builder.add('brass', sphereGeometry(0.028, 12, 8), trs(0, 1.185, 0.05), { cast: false });

  // Face.
  const faceY = 0.79;
  builder.add('clockFace', cylinderGeometry(0.21, 0.21, 0.012, 40), trs(0, faceY, 0.083, 0, 1, 1, 1, Math.PI / 2), {
    cast: false,
    receive: true,
  });
  builder.add('brass', torusGeometry(0.218, 0.017, 8, 40), trs(0, faceY, 0.089), { cast: false });
  builder.add('brass', cylinderGeometry(0.014, 0.014, 0.02, 12), trs(0, faceY, 0.096, 0, 1, 1, 1, Math.PI / 2), {
    cast: false,
  });
  for (let i = 0; i < 12; i += 1) addNumeral(builder, i + 1, 0.155, faceY, 0.091);

  // Pendulum chamber back and glass.
  builder.add('walnut', boxGeometry(0.42, 0.5, 0.012), trs(0, 0.34, 0.02), { cast: false });
  builder.add('brass', boxGeometry(0.36, 0.012, 0.012), trs(0, 0.59, 0.1), { cast: false });
  builder.add('brass', boxGeometry(0.36, 0.012, 0.012), trs(0, 0.09, 0.1), { cast: false });
  builder.add('brass', boxGeometry(0.012, 0.5, 0.012), trs(-0.175, 0.34, 0.1), { cast: false });
  builder.add('brass', boxGeometry(0.012, 0.5, 0.012), trs(0.175, 0.34, 0.1), { cast: false });
  builder.add('glass', planeGeometry(0.34, 0.47), trs(0, 0.34, 0.096), { cast: false, receive: false });
  builder.flush(group, materials, 'pendulum-clock-static');

  const handMaterial = materials.clockInk;
  const handPivot = new THREE.Group();
  handPivot.position.set(0, faceY, 0.098);
  const makeHand = (length, width, material) => {
    const geometry = boxGeometry(width, length, 0.004);
    geometry.translate(0, length / 2, 0);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = false;
    return mesh;
  };
  const hourHand = makeHand(0.1, 0.009, handMaterial);
  const minuteHand = makeHand(0.15, 0.006, handMaterial);
  const secondHand = makeHand(0.165, 0.003, materials.brass);
  handPivot.add(hourHand, minuteHand, secondHand);
  group.add(handPivot);

  const pendulum = new THREE.Group();
  pendulum.position.set(0, 0.56, 0.05);
  const rod = new THREE.Mesh(cylinderGeometry(0.006, 0.006, 0.38, 8), materials.brass);
  rod.position.y = -0.19;
  rod.castShadow = false;
  const bob = new THREE.Mesh(cylinderGeometry(0.055, 0.055, 0.014, 24), materials.brass);
  bob.rotation.x = Math.PI / 2;
  bob.position.set(0, -0.385, 0.006);
  bob.castShadow = false;
  pendulum.add(rod, bob);
  group.add(pendulum);

  return { group, hourHand, minuteHand, secondHand, pendulum, faceY };
}

function buildSwanClock(materials) {
  const group = new THREE.Group();
  group.name = 'swan-clock';
  group.position.set(CLOCKS.swan.x, CLOCKS.swan.y, CLOCKS.swan.z);
  group.rotation.y = -Math.PI / 2;
  group.scale.setScalar(1.05);

  const builder = new StaticBuilder();

  // Oval backplate and gilt frame.
  const backplate = new THREE.CircleGeometry(0.5, 48);
  backplate.scale(1, 1.32, 1);
  builder.add('swanBack', backplate, trs(0, 0, 0.004), { cast: false, receive: false });
  builder.add('brass', torusGeometry(0.5, 0.02, 8, 48), trs(0, 0, 0.018, 0, 1, 1.32), { cast: false });
  builder.add('brass', torusGeometry(0.465, 0.006, 6, 48), trs(0, 0, 0.012, 0, 1, 1.32), { cast: false });

  // Dial.
  const dialY = 0.17;
  builder.add('clockFace', cylinderGeometry(0.2, 0.2, 0.01, 40), trs(0, dialY, 0.03, 0, 1, 1, 1, Math.PI / 2), {
    cast: false,
  });
  builder.add('brass', torusGeometry(0.205, 0.009, 6, 40), trs(0, dialY, 0.037), { cast: false });
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2;
    builder.add(
      'clockInk',
      boxGeometry(0.008, i % 3 === 0 ? 0.03 : 0.018, 0.004),
      trs(Math.sin(angle) * 0.172, dialY + Math.cos(angle) * 0.172, 0.038, 0, 1, 1, 1, 0, -angle),
      { cast: false },
    );
  }

  // Swan body.
  const bodyY = -0.36;
  builder.add('swan', sphereGeometry(1, 24, 16), trs(0, bodyY, 0.075, 0, 0.3, 0.125, 0.1), { cast: false });
  // Raised wings with a scalloped feather edge.
  builder.add('swan', sphereGeometry(1, 20, 12), trs(-0.01, bodyY + 0.055, 0.12, 0, 0.23, 0.075, 0.035, 0, -0.12), {
    cast: false,
  });
  for (let i = -1; i <= 1; i += 1) {
    builder.add(
      'swan',
      sphereGeometry(1, 14, 8),
      trs(-0.13 + (i + 1) * 0.08, bodyY + 0.03, 0.143, 0, 0.075, 0.028, 0.012, 0, -0.25),
      { cast: false },
    );
  }
  // Tail feathers.
  for (let i = 0; i < 3; i += 1) {
    builder.add(
      'swan',
      new THREE.ConeGeometry(0.032, 0.16, 8),
      trs(-0.34, bodyY - 0.02 + i * 0.022, 0.075, 0, 1, 1, 0.55, 0, Math.PI / 2 + i * 0.12),
      { cast: false },
    );
  }

  // S-curved neck, head, beak, eye.
  builder.add(
    'swan',
    tubeGeometry(
      [
        [0.18, bodyY + 0.04, 0.07],
        [0.3, bodyY + 0.2, 0.07],
        [0.3, bodyY + 0.52, 0.075],
        [0.19, bodyY + 0.72, 0.08],
        [0.12, bodyY + 0.8, 0.085],
      ],
      0.032,
      28,
      8,
    ),
    trs(0, 0, 0),
    { cast: false },
  );
  builder.add('swan', sphereGeometry(1, 20, 14), trs(0.1, bodyY + 0.84, 0.09, 0, 0.06, 0.055, 0.058), { cast: false });
  builder.add(
    'fruitOrange',
    new THREE.ConeGeometry(0.028, 0.11, 10),
    trs(0.055, bodyY + 0.845, 0.095, 0, 1, 1, 0.8, 0, Math.PI / 2),
    { cast: false },
  );
  builder.add('black', sphereGeometry(0.009, 8, 6), trs(0.142, bodyY + 0.862, 0.142), { cast: false });

  // Small brass collar.
  builder.add('brass', torusGeometry(0.04, 0.006, 5, 20), trs(0.27, bodyY + 0.22, 0.075, 0, 1, 1, 1, Math.PI / 2, 0.2), {
    cast: false,
  });

  builder.flush(group, materials, 'swan-clock-static');

  const handPivot = new THREE.Group();
  handPivot.position.set(0, dialY, 0.042);
  const makeHand = (length, width, material) => {
    const geometry = boxGeometry(width, length, 0.004);
    geometry.translate(0, length / 2, 0);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = false;
    return mesh;
  };
  const hourHand = makeHand(0.09, 0.009, materials.clockInk);
  const minuteHand = makeHand(0.135, 0.006, materials.clockInk);
  const cap = new THREE.Mesh(cylinderGeometry(0.011, 0.011, 0.012, 12), materials.brass);
  cap.rotation.x = Math.PI / 2;
  handPivot.add(hourHand, minuteHand);
  group.add(handPivot);
  group.add(cap);
  cap.position.set(0, dialY, 0.045);

  return { group, hourHand, minuteHand };
}

/* --- Public API ---------------------------------------------------- */

export function buildDecor(builder, materials, root) {
  buildCeiling(builder);
  buildPaintings(builder);
  buildPlants(builder, materials);

  const pendulum = buildPendulumClock(materials);
  const swan = buildSwanClock(materials);
  root.add(pendulum.group, swan.group);

  let seconds = 10 * 3600 + 10 * 60 + 32;

  const applyTime = () => {
    const hourAngle = ((seconds / 3600) % 12) * 30 * DEG;
    const minuteAngle = ((seconds / 60) % 60) * 6 * DEG;
    const secondAngle = (seconds % 60) * 6 * DEG;
    pendulum.hourHand.rotation.z = -hourAngle;
    pendulum.minuteHand.rotation.z = -minuteAngle;
    pendulum.secondHand.rotation.z = -secondAngle;
    swan.hourHand.rotation.z = -hourAngle;
    swan.minuteHand.rotation.z = -minuteAngle;
  };
  applyTime();

  return {
    pendulum,
    swan,
    plants: PLANT_POSITIONS,
    setTime(hour, minute, second = 0) {
      seconds = hour * 3600 + minute * 60 + second;
      applyTime();
    },
    getTime() {
      return {
        hour: Math.floor(seconds / 3600) % 24,
        minute: Math.floor(seconds / 60) % 60,
        second: seconds % 60,
      };
    },
    update(dt, elapsed) {
      seconds += dt;
      const hourAngle = ((seconds / 3600) % 12) * 30 * DEG;
      const minuteAngle = ((seconds / 60) % 60) * 6 * DEG;
      const secondAngle = (seconds % 60) * 6 * DEG;
      pendulum.hourHand.rotation.z = -hourAngle;
      pendulum.minuteHand.rotation.z = -minuteAngle;
      pendulum.secondHand.rotation.z = -secondAngle;
      swan.hourHand.rotation.z = -hourAngle;
      swan.minuteHand.rotation.z = -minuteAngle;
      pendulum.pendulum.rotation.z = Math.sin((elapsed / 2) * Math.PI * 2) * 5 * DEG;
    },
  };
}
