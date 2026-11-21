import * as THREE from 'three';
import {
  boxGeometry,
  cylinderGeometry,
  roundedBoxGeometry,
  rodGeometry,
  sphereGeometry,
  torusGeometry,
  trs,
  sackGeometry,
  slumpedSackGeometry,
  ropeCoilGeometry,
  hangingCoilGeometries,
  bucketGeometry,
  StaticBuilder,
} from './geometry.js';
import { SHELF, TOOLBOX, WALL, HALF_W, CONTENT_COUNTS } from './config.js';
import { BAY_CENTERS, TIER_TOP } from './shelf.js';

/* ------------------------------------------------------------------ *
 * Everything stored on, under and around the five-tier shelf.
 *
 * Cleaning kit, coiled rope, burlap sacks, cardboard boxes, the repair
 * toolbox, jars of screws, paint tins, newspaper bundles, discarded
 * clothes, broom and mop. Most pieces are merged into the room batch;
 * only the toolbox is a separate group because its lid opens.
 * ------------------------------------------------------------------ */

function addBox(builder, key, w, h, d, x, y, z, ry = 0, options = {}) {
  builder.add(key, boxGeometry(w, h, d), trs(x, y, z, ry), {
    cast: options.cast ?? true,
    receive: options.receive ?? true,
  });
}

function addCyl(builder, key, rt, rb, h, segments, x, y, z, options = {}) {
  builder.add(
    key,
    cylinderGeometry(rt, rb, h, segments),
    trs(x, y, z, options.ry ?? 0, 1, 1, 1, options.rx ?? 0, options.rz ?? 0),
    { cast: options.cast ?? true, receive: options.receive ?? true },
  );
}

function addTorus(builder, key, radius, tube, x, y, z, options = {}) {
  const geometry = new THREE.TorusGeometry(
    radius,
    tube,
    options.radial ?? 5,
    options.tubular ?? 16,
    options.arc ?? Math.PI * 2,
  );
  builder.add(key, geometry, trs(x, y, z, options.ry ?? 0, 1, 1, 1, options.rx ?? 0, options.rz ?? 0), {
    cast: options.cast ?? false,
    receive: options.receive ?? true,
  });
}

function addLabel(builder, x, y, z, width, height, ry = 0) {
  addBox(builder, 'labelPaper', width, height, 0.002, x, y, z, ry, { cast: false });
}

/* --- Cardboard cartons -------------------------------------------- */

function addCarton(builder, x, y, z, w, h, d, ry = 0, dark = false) {
  const key = dark ? 'cardboardDark' : 'cardboard';
  addBox(builder, key, w, h - 0.014, d, x, y + (h - 0.014) / 2, z, ry);
  addBox(builder, key, w + 0.004, 0.014, d + 0.004, x, y + h - 0.007, z, ry);
  addBox(builder, 'cardboardDark', w * 0.16, 0.002, d + 0.008, x, y + h + 0.001, z, ry, { cast: false });
  addBox(builder, 'cardboardDark', w + 0.002, 0.028, 0.04, x, y + h * 0.52, z + d / 2, ry, { cast: false });
  CONTENT_COUNTS.boxes += 1;
}

/* --- Paint tins, jars, bottles and jugs --------------------------- */

function addPaintCan(builder, x, y, z, radius, height, bandKey) {
  addCyl(builder, 'steelShelf', radius, radius, height, 16, x, y + height / 2, z);
  addCyl(builder, bandKey, radius + 0.0015, radius + 0.0015, height * 0.52, 16, x, y + height * 0.42, z);
  addCyl(builder, 'steelPolished', radius * 0.99, radius * 0.99, 0.012, 16, x, y + height + 0.006, z);
  addTorus(builder, 'steelDark', radius, 0.006, x, y + height, z, { rx: Math.PI / 2, tubular: 18 });
  addTorus(builder, 'steelDark', radius * 0.92, 0.0045, x, y + height + 0.002, z, {
    arc: Math.PI,
    radial: 4,
    tubular: 12,
  });
  addLabel(builder, x, y + height * 0.5, z + radius + 0.001, radius * 1.3, height * 0.3);
  CONTENT_COUNTS.paintCans += 1;
}

function addSprayBottle(builder, x, y, z, ry, bodyKey) {
  addCyl(builder, bodyKey, 0.034, 0.034, 0.15, 12, x, y + 0.075, z);
  addCyl(builder, bodyKey, 0.034, 0.022, 0.032, 12, x, y + 0.166, z);
  addCyl(builder, 'plasticGrey', 0.017, 0.017, 0.028, 10, x, y + 0.195, z);
  addBox(builder, bodyKey, 0.075, 0.03, 0.045, x + 0.012, y + 0.222, z, ry);
  addCyl(builder, 'rubber', 0.007, 0.007, 0.03, 8, x + 0.055, y + 0.226, z, { rz: Math.PI / 2 });
  addCyl(builder, 'labelPaper', 0.0345, 0.0345, 0.062, 12, x, y + 0.078, z);
  addBox(builder, 'steelDark', 0.03, 0.014, 0.01, x - 0.018, y + 0.21, z, ry, { cast: false });
  CONTENT_COUNTS.sprayBottles += 1;
}

function addJug(builder, x, y, z, bodyKey) {
  addCyl(builder, bodyKey, 0.072, 0.08, 0.24, 14, x, y + 0.12, z);
  addCyl(builder, bodyKey, 0.072, 0.034, 0.052, 14, x, y + 0.266, z);
  addCyl(builder, 'plasticGrey', 0.034, 0.034, 0.022, 10, x, y + 0.302, z);
  addCyl(builder, 'plasticBlue', 0.038, 0.038, 0.016, 10, x, y + 0.32, z);
  addCyl(builder, 'labelPaper', 0.074, 0.079, 0.08, 14, x, y + 0.12, z);
  addBox(builder, bodyKey, 0.028, 0.11, 0.032, x + 0.082, y + 0.205, z, 0);
}

function addJar(builder, x, y, z, seed = 0) {
  addCyl(builder, 'glassJar', 0.043, 0.043, 0.115, 14, x, y + 0.0575, z);
  addCyl(builder, 'steelDark', 0.045, 0.045, 0.016, 14, x, y + 0.121, z);
  addTorus(builder, 'steelPolished', 0.045, 0.003, x, y + 0.128, z, { rx: Math.PI / 2, tubular: 16 });
  const bolts = 7;
  for (let i = 0; i < bolts; i += 1) {
    const angle = (i / bolts) * Math.PI * 2 + seed;
    addCyl(
      builder,
      'steelDark',
      0.008,
      0.008,
      0.03,
      6,
      x + Math.cos(angle) * 0.022,
      y + 0.03,
      z + Math.sin(angle) * 0.022,
      { rx: Math.PI / 2, ry: angle },
    );
  }
  addLabel(builder, x, y + 0.06, z + 0.043, 0.05, 0.035);
  CONTENT_COUNTS.jars += 1;
}

/* --- Bucket, mop bucket, dustpan and squeegee --------------------- */

function addBucket(builder, x, y, z, topRadius, bottomRadius, height, bodyKey, options = {}) {
  builder.add(bodyKey, bucketGeometry(topRadius, bottomRadius, height, 16), trs(x, y, z), {
    cast: true,
    receive: true,
  });
  addTorus(builder, 'steelPolished', topRadius, 0.006, x, y + height, z, { rx: Math.PI / 2, tubular: 18 });
  if (options.handle !== false) {
    addTorus(builder, 'steelDark', topRadius * 0.96, 0.0045, x, y + height, z, { arc: Math.PI, radial: 4, tubular: 14 });
  }
  if (options.water) {
    addCyl(builder, 'dirtyWater', topRadius * 0.87, topRadius * 0.87, 0.004, 16, x, y + height * 0.72, z, {
      cast: false,
      receive: false,
    });
  }
  if (options.rags) {
    addBox(builder, 'clothCream', topRadius * 1.1, 0.05, topRadius * 1.1, x + 0.01, y + height - 0.03, z, 0.4, {
      cast: false,
    });
  }
  CONTENT_COUNTS.buckets += 1;
}

function addMopBucket(builder, x, z) {
  const baseY = 0.03;
  builder.add('plasticYellow', bucketGeometry(0.26, 0.22, 0.3, 18), trs(x, baseY, z), { cast: true, receive: true });
  addTorus(builder, 'plasticYellow', 0.26, 0.009, x, baseY + 0.3, z, { rx: Math.PI / 2, tubular: 18 });
  addCyl(builder, 'dirtyWater', 0.225, 0.225, 0.004, 16, x, baseY + 0.21, z, { cast: false, receive: false });
  // Wringer on the wall side.
  addBox(builder, 'plasticGrey', 0.24, 0.14, 0.17, x, baseY + 0.36, z + 0.11);
  addBox(builder, 'plasticGrey', 0.2, 0.03, 0.13, x, baseY + 0.44, z + 0.11);
  addCyl(builder, 'steelDark', 0.035, 0.035, 0.22, 10, x, baseY + 0.34, z + 0.11, { rz: Math.PI / 2 });
  // Casters and a pull handle.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addCyl(builder, 'rubber', 0.026, 0.026, 0.018, 8, x + sx * 0.17, 0.016, z + sz * 0.17, { rz: Math.PI / 2 });
    }
  }
  addBox(builder, 'steelPolished', 0.02, 0.03, 0.34, x + 0.25, baseY + 0.33, z - 0.06, 0, { cast: false });
  CONTENT_COUNTS.buckets += 1;
}

function addDustpan(builder, x, y, z, ry) {
  addBox(builder, 'plasticBlue', 0.2, 0.022, 0.26, x, y + 0.012, z, ry);
  addBox(builder, 'plasticBlue', 0.2, 0.11, 0.022, x, y + 0.06, z - 0.12, ry);
  addBox(builder, 'plasticBlue', 0.03, 0.028, 0.12, x, y + 0.11, z - 0.16, ry);
  addBox(builder, 'rubber', 0.2, 0.008, 0.016, x, y + 0.004, z + 0.12, ry, { cast: false });
}

function addSqueegee(builder, x, y, z, ry) {
  addBox(builder, 'woodOld', 0.03, 0.028, 0.34, x, y + 0.014, z, ry);
  addBox(builder, 'rubber', 0.04, 0.02, 0.3, x, y + 0.006, z, ry + Math.PI / 2, { cast: false });
  addBox(builder, 'steelDark', 0.012, 0.014, 0.3, x, y + 0.032, z, ry, { cast: false });
}

/* --- Broom and mop ------------------------------------------------ */

function addBroom(builder, baseX, baseZ) {
  const top = [1.165, 1.54, baseZ];
  const low = [baseX + 0.02, 0.22, baseZ];
  builder.add('woodOld', rodGeometry(low, top, 0.013, 8), null, { cast: true, receive: true });
  addBox(builder, 'woodDark', 0.1, 0.055, 0.27, baseX, 0.175, baseZ, 0, { cast: true });
  const bristles = 18;
  for (let i = 0; i < bristles; i += 1) {
    const z = baseZ - 0.13 + (i / (bristles - 1)) * 0.26;
    const length = 0.13 + (i % 3) * 0.008;
    builder.add(
      'bristle',
      boxGeometry(0.012, length, 0.01),
      trs(baseX + 0.02 + (i % 2) * 0.012, 0.09, z, 0, 1, 1, 1, 0, 0.08),
      { cast: false },
    );
  }
  addBox(builder, 'steelDark', 0.06, 0.04, 0.08, baseX + 0.02, 0.21, baseZ, 0, { cast: false });
}

function addMop(builder, baseX, baseZ) {
  const top = [1.16, 1.52, baseZ];
  const low = [baseX + 0.02, 0.36, baseZ];
  builder.add('woodOld', rodGeometry(low, top, 0.013, 8), null, { cast: true, receive: true });
  addCyl(builder, 'steelDark', 0.026, 0.026, 0.08, 10, baseX + 0.02, 0.35, baseZ);
  const strands = 26;
  for (let i = 0; i < strands; i += 1) {
    const angle = (i / strands) * Math.PI * 2;
    const radius = 0.06 + (i % 4) * 0.018;
    const endX = baseX + 0.02 + Math.cos(angle) * radius;
    const endZ = baseZ + Math.sin(angle) * radius;
    builder.add(
      'mopYarn',
      rodGeometry([baseX + 0.02 + Math.cos(angle) * 0.03, 0.32, baseZ + Math.sin(angle) * 0.03], [endX, 0.02, endZ], 0.0065, 5),
      null,
      { cast: false, receive: true },
    );
  }
}

/* --- Clothes, sacks, rope and paper ------------------------------- */

function addClothesPile(builder, x, y, z) {
  const stack = [
    { key: 'clothOlive', h: 0.065, ry: 0.12, dz: 0.0 },
    { key: 'clothBrown', h: 0.055, ry: -0.18, dz: 0.01 },
    { key: 'clothCream', h: 0.07, ry: 0.06, dz: -0.01 },
  ];
  let height = 0;
  for (const piece of stack) {
    addBox(builder, piece.key, 0.25, piece.h, 0.34, x, y + height + piece.h / 2, z + piece.dz, piece.ry);
    addBox(builder, piece.key, 0.26, 0.006, 0.12, x, y + height + piece.h, z + piece.dz, piece.ry, {
      cast: false,
    });
    height += piece.h;
    CONTENT_COUNTS.clothes += 1;
  }
  // A red scarf draped over the pile, with one end hanging off the shelf.
  addBox(builder, 'clothScarf', 0.16, 0.03, 0.28, x + 0.03, y + height + 0.015, z + 0.02, 0.2);
  addBox(builder, 'clothScarf', 0.12, 0.26, 0.03, x + 0.08, y + height - 0.11, z + 0.17, 0.2);
  addBox(builder, 'clothScarf', 0.1, 0.1, 0.024, x + 0.09, y + height - 0.26, z + 0.19, 0.28);
  CONTENT_COUNTS.clothes += 1;
}

function addJacket(builder) {
  const hx = 1.085;
  const hz = WALL.coatHook.z;
  const world = new THREE.Matrix4().makeRotationY(0.42);
  world.setPosition(hx, 0, hz);
  const part = (key, geometry, local, options = {}) => {
    builder.add(key, geometry, new THREE.Matrix4().multiplyMatrices(world, local), {
      cast: options.cast ?? true,
      receive: true,
    });
  };
  const at = (x, y, z, ry = 0, rx = 0, rz = 0) => trs(x, y, z, ry, 1, 1, 1, rx, rz);

  // Wire hanger, visible above the collar.
  builder.add('chrome', rodGeometry([1.165, 1.735, hz], [hx, 1.71, hz], 0.005, 6), null, {
    cast: false,
    receive: false,
  });
  builder.add('chrome', rodGeometry([hx, 1.71, hz - 0.19], [hx, 1.71, hz + 0.19], 0.005, 6), null, {
    cast: false,
    receive: false,
  });

  // A tapered shoulder over a straight torso; the sleeves and hem break
  // the box silhouette, so it reads as a hanging jacket rather than a
  // cabinet. Details sit just proud of the front face.
  part('clothJacket', boxGeometry(0.14, 0.54, 0.34), at(0, 1.41, 0));
  part('clothJacket', boxGeometry(0.17, 0.09, 0.42), at(0, 1.65, 0));
  part('clothJacket', boxGeometry(0.1, 0.05, 0.13), at(0, 1.7, -0.07, -0.5));
  part('clothJacket', boxGeometry(0.1, 0.05, 0.13), at(0, 1.7, 0.07, 0.5));
  // Sleeves hang below the hem, with a clear gap from the torso.
  for (const side of [-1, 1]) {
    part('clothJacket', boxGeometry(0.1, 0.54, 0.1), at(0, 1.36, side * 0.25, 0, -side * 0.06));
    part('clothJacket', boxGeometry(0.095, 0.06, 0.095), at(0, 1.07, side * 0.265, 0, -side * 0.06));
    part('clothBrown', boxGeometry(0.1, 0.012, 0.1), at(0, 1.04, side * 0.268, 0, -side * 0.06));
  }
  // Open front: dark lining, placket and brass buttons.
  part('clothBrown', boxGeometry(0.012, 0.42, 0.1), at(-0.074, 1.4, 0));
  for (const z of [-0.06, 0.06]) {
    part('clothJacket', boxGeometry(0.01, 0.44, 0.025), at(-0.078, 1.4, z));
  }
  for (let i = 0; i < 3; i += 1) {
    part('brass', cylinderGeometry(0.008, 0.008, 0.005, 8), at(-0.083, 1.53 - i * 0.13, 0.03, 0, 0, Math.PI / 2));
  }
  // Creases and patch pockets.
  for (const z of [-0.14, -0.02, 0.11]) {
    part('clothBrown', boxGeometry(0.006, 0.34, 0.012), at(-0.073, 1.34, z), { cast: false });
  }
  for (const side of [-1, 1]) {
    part('clothBrown', boxGeometry(0.008, 0.09, 0.09), at(-0.074, 1.27, side * 0.11), { cast: false });
  }
  part('clothJacket', boxGeometry(0.15, 0.022, 0.32), at(0, 1.135, 0));
  CONTENT_COUNTS.clothes += 1;
}

function addWorkCoat(builder) {
  const hx = 1.09;
  const hz = WALL.coatHook2.z;
  const world = new THREE.Matrix4().makeRotationY(-0.32);
  world.setPosition(hx, 0, hz);
  const part = (key, geometry, local, options = {}) => {
    builder.add(key, geometry, new THREE.Matrix4().multiplyMatrices(world, local), {
      cast: options.cast ?? true,
      receive: true,
    });
  };
  const at = (x, y, z, ry = 0, rx = 0, rz = 0) => trs(x, y, z, ry, 1, 1, 1, rx, rz);

  builder.add('chrome', rodGeometry([1.165, 1.735, hz], [hx, 1.71, hz], 0.005, 6), null, {
    cast: false,
    receive: false,
  });
  builder.add('chrome', rodGeometry([hx, 1.71, hz - 0.19], [hx, 1.71, hz + 0.19], 0.005, 6), null, {
    cast: false,
    receive: false,
  });

  // Long work coat: wide skirt, narrow shoulders.
  part('clothCream', boxGeometry(0.155, 0.78, 0.35), at(0, 1.25, 0));
  part('clothCream', boxGeometry(0.16, 0.08, 0.4), at(0, 1.65, 0));
  part('clothCream', boxGeometry(0.09, 0.05, 0.13), at(0, 1.69, -0.07, -0.5));
  part('clothCream', boxGeometry(0.09, 0.05, 0.13), at(0, 1.69, 0.07, 0.5));
  for (const side of [-1, 1]) {
    part('clothCream', boxGeometry(0.095, 0.6, 0.1), at(0, 1.24, side * 0.24, 0, -side * 0.05));
    part('clothCream', boxGeometry(0.09, 0.06, 0.095), at(0, 0.93, side * 0.255, 0, -side * 0.05));
  }
  // Front placket, belt and pockets.
  part('clothBrown', boxGeometry(0.01, 0.72, 0.026), at(-0.081, 1.26, 0));
  for (let i = 0; i < 4; i += 1) {
    part('brass', cylinderGeometry(0.0075, 0.0075, 0.005, 8), at(-0.087, 1.52 - i * 0.17, 0.03, 0, 0, Math.PI / 2));
  }
  part('clothBrown', boxGeometry(0.175, 0.035, 0.37), at(0, 1.16, 0), { cast: false });
  part('clothBrown', boxGeometry(0.03, 0.3, 0.06), at(-0.09, 1.0, 0.08), { cast: false });
  part('clothBrown', boxGeometry(0.03, 0.22, 0.06), at(-0.09, 0.94, 0.12), { cast: false });
  for (const side of [-1, 1]) {
    part('clothBrown', boxGeometry(0.008, 0.1, 0.12), at(-0.082, 1.02, side * 0.1), { cast: false });
  }
  for (const z of [-0.13, 0.02, 0.14]) {
    part('clothBrown', boxGeometry(0.006, 0.55, 0.012), at(-0.081, 1.2, z), { cast: false });
  }
  // A faded red scarf around the collar, one tail hanging at the front.
  part('clothScarf', boxGeometry(0.1, 0.05, 0.2), at(-0.02, 1.675, 0));
  part('clothScarf', boxGeometry(0.045, 0.3, 0.06), at(-0.1, 1.5, 0.06));
  part('clothScarf', boxGeometry(0.04, 0.08, 0.05), at(-0.1, 1.34, 0.06));
  CONTENT_COUNTS.clothes += 1;
}

function addHangingRope(builder, x, y, z, seed) {
  for (const geometry of hangingCoilGeometries(0.135, 0.011, seed)) {
    builder.add('ropeJute', geometry, trs(x, y, z), { cast: false, receive: true });
  }
  CONTENT_COUNTS.ropes += 1;
}

function addRopeCoil(builder, x, y, z, radius, seed) {
  builder.add('ropeJute', ropeCoilGeometry(radius, 0.011, 5, 0.05, seed), trs(x, y + 0.008, z), {
    cast: false,
    receive: true,
  });
  CONTENT_COUNTS.ropes += 1;
}

function addSack(builder, x, y, z, halfWidth, height, ry, seed) {
  builder.add('burlap', sackGeometry(halfWidth, height, seed), trs(x, y, z, ry, 1, 1, 0.86, 0.03, -0.04), {
    cast: true,
    receive: true,
  });
  // A short gathered neck sits on the shoulders of the bag.
  addCyl(builder, 'burlap', halfWidth * 0.34, halfWidth * 0.42, 0.09, 10, x, y + height * 1.02, z, { ry });
  addTorus(builder, 'ropeJute', halfWidth * 0.38, 0.011, x, y + height * 1.055, z, {
    rx: Math.PI / 2,
    ry,
    tubular: 14,
  });
  // A folded-over mouth flap, tilted off the neck. This is what stops the
  // silhouette reading as a jar.
  builder.add(
    'burlap',
    roundedBoxGeometry(halfWidth * 1.05, 0.05, halfWidth * 0.66, 0.02, 2),
    trs(x + halfWidth * 0.16, y + height * 1.095, z, ry + 0.45, 1, 1, 1, 0.5, 0.16),
    { cast: true, receive: true },
  );
  builder.add(
    'ropeJute',
    new THREE.SphereGeometry(0.026, 8, 6),
    trs(x + halfWidth * 0.45, y + height * 1.06, z + halfWidth * 0.24, 0, 1, 1, 1, 0.4, 0.2),
    { cast: false },
  );
  CONTENT_COUNTS.sacks += 1;
}

function addLyingSack(builder, x, y, z, halfWidth, length, ry, seed) {
  // The slumped box starts a little below its origin; lift it onto the
  // surface so no part sinks through the board or the floor.
  builder.add('burlap', slumpedSackGeometry(halfWidth, length, seed), trs(x, y + halfWidth * 0.4, z, ry), {
    cast: true,
    receive: true,
  });
  // A short gathered neck and tie at the end tell the eye which way the
  // sack lies.
  const dirX = Math.sin(ry);
  const dirZ = Math.cos(ry);
  const tipX = x + dirX * length * 0.97;
  const tipZ = z + dirZ * length * 0.97;
  const neckY = y + halfWidth * 0.42;
  builder.add(
    'burlap',
    rodGeometry(
      [tipX - dirX * 0.08, neckY, tipZ - dirZ * 0.08],
      [tipX + dirX * 0.03, neckY, tipZ + dirZ * 0.03],
      halfWidth * 0.35,
      8,
    ),
    null,
    { cast: true, receive: true },
  );
  addTorus(builder, 'ropeJute', halfWidth * 0.38, 0.01, tipX, neckY, tipZ, {
    ry,
    tubular: 12,
  });
  builder.add(
    'burlap',
    roundedBoxGeometry(halfWidth * 0.68, 0.045, halfWidth * 0.44, 0.02, 2),
    trs(tipX, neckY + 0.015, tipZ, ry + 0.35, 1, 1, 1, 0.5, 0.2),
    { cast: false },
  );
  CONTENT_COUNTS.sacks += 1;
}

function addNewspaperBundle(builder, x, y, z) {
  for (let i = 0; i < 5; i += 1) {
    addBox(builder, 'paperOld', 0.27, 0.011, 0.23, x + (i % 2) * 0.005, y + 0.006 + i * 0.011, z, (i - 2) * 0.03);
  }
  addBox(builder, 'rubber', 0.006, 0.062, 0.24, x - 0.08, y + 0.03, z, 0, { cast: false });
  addBox(builder, 'rubber', 0.006, 0.062, 0.24, x + 0.08, y + 0.03, z, 0, { cast: false });
  addBox(builder, 'rubber', 0.28, 0.006, 0.006, x, y + 0.032, z - 0.08, 0, { cast: false });
  addBox(builder, 'rubber', 0.28, 0.006, 0.006, x, y + 0.032, z + 0.08, 0, { cast: false });
  CONTENT_COUNTS.papers += 1;
}

function addGloves(builder, x, y, z) {
  for (const side of [-1, 1]) {
    addBox(builder, 'clothBrown', 0.07, 0.035, 0.12, x + side * 0.07, y + 0.018, z, 0.2);
    addBox(builder, 'clothBrown', 0.028, 0.026, 0.05, x + side * 0.07 - 0.045, y + 0.016, z + 0.02, 0.4);
    for (let i = 0; i < 3; i += 1) {
      addBox(builder, 'clothBrown', 0.012, 0.022, 0.055, x + side * 0.07 + 0.02, y + 0.018, z + 0.045 + i * 0.02, 0.2);
    }
  }
}

/* --- Repair toolbox (the only opening furniture) ------------------ */

function addToolboxTools(builder) {
  // Screwdrivers laid along z on the tray.
  for (let i = 0; i < 4; i += 1) {
    const z = -0.13 + i * 0.085;
    addCyl(builder, 'paintRed', 0.011, 0.011, 0.07, 8, -0.02, 0.135, z, { rx: Math.PI / 2 });
    addCyl(builder, 'metalTools', 0.0035, 0.0035, 0.1, 6, -0.02, 0.135, z + 0.085, { rx: Math.PI / 2 });
    CONTENT_COUNTS.tools += 1;
  }
  // Open-end wrench.
  addCyl(builder, 'metalTools', 0.008, 0.008, 0.19, 6, 0.06, 0.12, -0.1, { rx: Math.PI / 2 });
  addBox(builder, 'metalTools', 0.04, 0.008, 0.045, 0.06, 0.12, -0.01);
  addBox(builder, 'metalTools', 0.035, 0.008, 0.04, 0.06, 0.12, -0.19);
  CONTENT_COUNTS.tools += 1;
  // Hammer.
  addCyl(builder, 'woodOld', 0.008, 0.008, 0.15, 6, 0.05, 0.125, 0.09, { rx: Math.PI / 2 });
  addBox(builder, 'steelDark', 0.03, 0.03, 0.075, 0.05, 0.125, 0.02);
  CONTENT_COUNTS.tools += 1;
  // Pliers.
  addBox(builder, 'metalTools', 0.02, 0.008, 0.13, -0.07, 0.12, 0.13, 0.2);
  addBox(builder, 'metalTools', 0.02, 0.008, 0.13, -0.07, 0.12, 0.09, -0.2);
  addBox(builder, 'rubber', 0.022, 0.012, 0.06, -0.07, 0.12, 0.17, 0.2);
  CONTENT_COUNTS.tools += 1;
  // Tape measure.
  addCyl(builder, 'plasticYellow', 0.035, 0.035, 0.028, 12, 0.06, 0.115, 0.16, { rx: Math.PI / 2 });
  CONTENT_COUNTS.tools += 1;
}

export function buildToolbox(materials) {
  const group = new THREE.Group();
  group.name = 'storage-toolbox';
  group.position.set(TOOLBOX.x, TOOLBOX.y, TOOLBOX.z);
  group.rotation.y = TOOLBOX.rotY;

  const base = new StaticBuilder();
  const w = 0.24;
  const h = 0.16;
  const d = 0.44;
  addBox(base, 'paintRed', w, 0.01, d, 0, 0.005, 0);
  addBox(base, 'paintRed', 0.01, h - 0.01, d, -w / 2 + 0.005, h / 2, 0);
  addBox(base, 'paintRed', 0.01, h - 0.01, d, w / 2 - 0.005, h / 2, 0);
  addBox(base, 'paintRed', w, h - 0.01, 0.01, 0, h / 2, -d / 2 + 0.005);
  addBox(base, 'paintRed', w, h - 0.01, 0.01, 0, h / 2, d / 2 - 0.005);
  addBox(base, 'steelDark', w + 0.012, 0.012, d + 0.012, 0, h - 0.004, 0);
  // Latch keeper and hinge leaves on the body.
  addBox(base, 'steelPolished', 0.018, 0.05, 0.05, w / 2 + 0.002, 0.12, 0);
  for (const z of [-0.15, 0.15]) {
    addCyl(base, 'steelPolished', 0.007, 0.007, 0.055, 8, -w / 2 + 0.002, h / 2, z, { rx: Math.PI / 2 });
  }
  base.flush(group, materials, 'storage-toolbox-base');

  // The tray and tools lift with the lid, cantilever style. Closed they
  // sit below the rim; open they rise above it and become readable.
  const tray = new THREE.Group();
  tray.name = 'storage-toolbox-tray';
  const trayBuilder = new StaticBuilder();
  addBox(trayBuilder, 'steelShelf', w - 0.04, 0.008, d - 0.06, 0, 0.1, 0);
  addToolboxTools(trayBuilder);
  addBox(trayBuilder, 'clothCream', 0.1, 0.04, 0.14, 0.02, 0.11, 0.02, 0.3, { cast: false });
  trayBuilder.flush(tray, materials, 'storage-toolbox-tray');
  group.add(tray);

  const lid = new THREE.Group();
  lid.name = 'storage-toolbox-lid';
  lid.position.set(-w / 2, h, 0);
  const lidBuilder = new StaticBuilder();
  addBox(lidBuilder, 'paintRed', w, 0.012, d, w / 2, 0.006, 0);
  addBox(lidBuilder, 'paintRed', 0.012, 0.028, d, w - 0.006, 0.012, 0);
  addBox(lidBuilder, 'steelDark', w - 0.02, 0.006, 0.02, w / 2, 0.012, -d / 2 + 0.01, 0, { cast: false });
  addBox(lidBuilder, 'steelDark', w - 0.02, 0.006, 0.02, w / 2, 0.012, d / 2 - 0.01, 0, { cast: false });
  // Folding handle across the lid, not a cross.
  addBox(lidBuilder, 'steelDark', 0.012, 0.03, 0.012, w / 2, 0.024, -0.07, 0, { cast: false });
  addBox(lidBuilder, 'steelDark', 0.012, 0.03, 0.012, w / 2, 0.024, 0.07, 0, { cast: false });
  addBox(lidBuilder, 'chrome', 0.016, 0.012, 0.16, w / 2, 0.042, 0, 0, { cast: false });
  addBox(lidBuilder, 'steelPolished', 0.02, 0.055, 0.05, w - 0.012, 0.02, 0, 0, { cast: false });
  lidBuilder.flush(lid, materials, 'storage-toolbox-lid');
  group.add(lid);

  group.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = true;
  });
  return { group, lid, tray };
}

/* --- Sacks, boxes and carpet on the floor ------------------------ */

function addFloorStores(builder) {
  // Burlap sacks piled in the north-east corner: one leaning, two slumped.
  addSack(builder, 0.93, 0, -2.02, 0.17, 0.64, 0.36, 11);
  addLyingSack(builder, 0.7, 0, -2.02, 0.16, 0.5, 0.18, 37);
  addLyingSack(builder, 0.95, 0, -1.85, 0.15, 0.32, 0.05, 43);

  // Cardboard boxes against the east wall, with a board across the top
  // so the repair toolbox can sit at a usable height.
  addCarton(builder, 0.96, 0, 0.15, 0.3, 0.3, 0.4, 0.08);
  addCarton(builder, 0.95, 0.3, 0.19, 0.28, 0.26, 0.36, -0.16, true);
  addCarton(builder, 1.0, 0.56, 0.13, 0.24, 0.22, 0.3, 0.3);
  addBox(builder, 'woodOld', 0.36, 0.022, 0.52, 0.96, 0.791, 0.18, 0.02);
  addBox(builder, 'clothCream', 0.2, 0.03, 0.16, 0.88, 0.822, -0.05, 0.2, { cast: false });
  addBox(builder, 'paperOld', 0.16, 0.008, 0.2, 0.9, 0.81, -0.07, -0.2, { cast: false });

  // A rolled carpet standing in the north-west corner behind the shelf.
  builder.add('clothBrown', cylinderGeometry(0.115, 0.115, 1.44, 16), trs(-1.02, 0.73, -2.27, 0, 1, 1, 1, -0.03, 0.04), {
    cast: true,
    receive: true,
  });
  addTorus(builder, 'ropeJute', 0.118, 0.008, -1.02, 0.42, -2.27, { rx: Math.PI / 2, tubular: 14 });
  addTorus(builder, 'ropeJute', 0.118, 0.008, -1.02, 1.06, -2.27, { rx: Math.PI / 2, tubular: 14 });
  addCyl(builder, 'clothCream', 0.075, 0.075, 0.004, 12, -1.01, 1.452, -2.27, { cast: false });
}

/* --- Fill the shelf ---------------------------------------------- */

function fillShelf(builder) {
  const y0 = TIER_TOP[0];
  const y1 = TIER_TOP[1];
  const y2 = TIER_TOP[2];
  const y3 = TIER_TOP[3];
  const y4 = TIER_TOP[4];
  const bay = BAY_CENTERS;

  // Tier 5 (top): a lying sack, paint tins, carton, basin, rope, papers.
  addLyingSack(builder, -0.95, y4, bay[0] - 0.12, 0.15, 0.42, 0.18, 51);
  addPaintCan(builder, -0.91, y4, -0.94, 0.068, 0.17, 'paintRed');
  addPaintCan(builder, -0.91, y4, -0.78, 0.068, 0.17, 'paintBlue');
  addPaintCan(builder, -0.91, y4, -0.62, 0.062, 0.15, 'plasticYellow');
  addBox(builder, 'clothCream', 0.2, 0.025, 0.16, -0.86, y4 + 0.012, -1.04, 0.2, { cast: false });
  addCarton(builder, -0.94, y4, bay[2] - 0.02, 0.31, 0.25, 0.34, 0.06);
  builder.add('plasticBlue', bucketGeometry(0.13, 0.095, 0.1, 16), trs(-0.82, y4, bay[2] + 0.27), {
    cast: true,
    receive: true,
  });
  addTorus(builder, 'plasticBlue', 0.13, 0.006, -0.82, y4 + 0.1, bay[2] + 0.27, { rx: Math.PI / 2, tubular: 16 });
  addRopeCoil(builder, -0.86, y4, bay[3] - 0.1, 0.12, 61);
  addNewspaperBundle(builder, -0.95, y4, bay[3] + 0.19);

  // Tier 4: lying sack, folded clothes, jars and gloves, carton and rope.
  addLyingSack(builder, -0.92, y3, bay[0] - 0.1, 0.16, 0.46, 0.08, 71);
  addClothesPile(builder, -0.94, y3, bay[1] + 0.02);
  addJar(builder, -1.03, y3, bay[2] - 0.05, 0.4);
  addJar(builder, -1.03, y3, bay[2] + 0.07, 1.1);
  addJar(builder, -0.86, y3, bay[2] + 0.42, 2.2);
  addGloves(builder, -0.84, y3, bay[2] + 0.2);
  addCarton(builder, -0.94, y3, bay[3] + 0.02, 0.32, 0.2, 0.3, -0.08, true);
  addRopeCoil(builder, -0.8, y3, bay[3] + 0.33, 0.1, 83);

  // Tier 3: spray bottles, bucket and rags, the toolbox, dustpan and co.
  addSprayBottle(builder, -0.93, y2, bay[0] - 0.17, 0.1, 'plasticBlue');
  addSprayBottle(builder, -0.93, y2, bay[0] - 0.01, 0.15, 'plasticWhite');
  addSprayBottle(builder, -1.03, y2, bay[0] + 0.16, -0.2, 'plasticYellow');
  addJug(builder, -0.8, y2, bay[0] + 0.35, 'plasticWhite');
  addBucket(builder, -0.95, y2, bay[1] - 0.24, 0.12, 0.09, 0.18, 'plasticGrey', { rags: true });  addBox(builder, 'clothCream', 0.22, 0.03, 0.17, -0.82, y2 + 0.015, bay[1] + 0.08, 0.35);
  addBox(builder, 'clothBrown', 0.18, 0.025, 0.15, -0.86, y2 + 0.04, bay[1] + 0.02, -0.22);
  addBox(builder, 'plasticYellow', 0.09, 0.04, 0.06, -0.99, y2 + 0.02, bay[1] + 0.24, 0.3);
  addBox(builder, 'plasticYellow', 0.07, 0.035, 0.05, -1.0, y2 + 0.02, bay[1] + 0.3, -0.4);
  addDustpan(builder, -0.79, y2, bay[3] - 0.13, 0.35);
  addSqueegee(builder, -0.92, y2, bay[3] + 0.12, 0.12);
  addBox(builder, 'clothCream', 0.2, 0.05, 0.2, -0.95, y2 + 0.025, bay[3] + 0.34, 0.25);

  // Tier 2: buckets, a wooden crate, tarp, paint, mop head.
  addBucket(builder, -0.99, y1, bay[0] - 0.24, 0.13, 0.1, 0.24, 'plasticBlue');
  addBucket(builder, -0.83, y1, bay[0] + 0.06, 0.115, 0.085, 0.21, 'plasticGrey', { rags: true });
  addJug(builder, -1.0, y1, bay[0] + 0.34, 'plasticWhite');
  addBox(builder, 'woodOld', 0.3, 0.02, 0.34, -0.92, y1 + 0.01, bay[1] + 0.02);
  addBox(builder, 'woodOld', 0.3, 0.16, 0.02, -0.92, y1 + 0.09, bay[1] - 0.15);
  addBox(builder, 'woodOld', 0.3, 0.16, 0.02, -0.92, y1 + 0.09, bay[1] + 0.19);
  for (const side of [-1, 1]) {
    addBox(builder, 'woodDark', 0.02, 0.16, 0.32, -0.92 + side * 0.14, y1 + 0.09, bay[1] + 0.02);
  }
  addBox(builder, 'clothBrown', 0.24, 0.04, 0.26, -0.92, y1 + 0.18, bay[1] + 0.02, 0.15);
  addBox(builder, 'plasticWhite', 0.07, 0.18, 0.07, -0.84, y1 + 0.2, bay[1] + 0.08, 0.2);
  addBox(builder, 'clothBrown', 0.42, 0.06, 0.3, -0.92, y1 + 0.03, bay[2] + 0.02, 0.05);
  addBox(builder, 'clothOlive', 0.38, 0.05, 0.27, -0.93, y1 + 0.08, bay[2] + 0.04, -0.07);
  addPaintCan(builder, -0.78, y1, bay[2] + 0.34, 0.062, 0.14, 'paintBlue');
  addBox(builder, 'mopYarn', 0.2, 0.1, 0.22, -0.9, y1 + 0.05, bay[3] - 0.1, 0.2);

  // Tier 1: floor-level stock, intentionally sparse.
  addJug(builder, -0.9, y0, bay[0] - 0.12, 'plasticBlue');
  addBucket(builder, -0.82, y0, bay[0] + 0.2, 0.125, 0.095, 0.22, 'plasticGrey');
  addCarton(builder, -0.93, y0, bay[1], 0.4, 0.26, 0.4, 0.03, true);
  addBox(builder, 'clothBrown', 0.3, 0.04, 0.24, -0.86, y0 + 0.3, bay[1], 0.4, { cast: false });
  addBox(builder, 'woodDark', 0.28, 0.06, 0.28, -0.95, y0 + 0.03, bay[2], 0.1);
  addPaintCan(builder, -0.8, y0, bay[2] + 0.26, 0.06, 0.13, 'paintRed');
  addBox(builder, 'paperOld', 0.24, 0.03, 0.2, -0.9, y0 + 0.015, bay[3] + 0.1, -0.2, { cast: false });
}

/* ------------------------------------------------------------------ */

export function buildClutter(builder, materials, root) {
  fillShelf(builder);
  addFloorStores(builder);
  addJacket(builder);
  addWorkCoat(builder);
  addHangingRope(builder, 1.12, 1.77, WALL.ropeHook.z, 91);
  addBroom(builder, 0.99, 1.12);
  addMop(builder, 0.98, 1.4);
  addMopBucket(builder, 0.9, 1.75);

  const toolbox = buildToolbox(materials);
  root.add(toolbox.group);

  return {
    toolbox,
    counts: CONTENT_COUNTS,
  };
}
