import * as THREE from 'three';
import {
  boxGeometry,
  cylinderGeometry,
  rodGeometry,
  trs,
  slumpedSackGeometry,
  ropeCoilGeometry,
  bucketGeometry,
  StaticBuilder,
  mulberry32,
} from './geometry.js';
import {
  BAGS,
  CARTONS,
  CLEANING,
  RACK,
  CONTENT_COUNTS,
} from './config.js';
import { TIER_TOP } from './rack.js';

/* ------------------------------------------------------------------ *
 * Loose contents of the garbage room.
 *
 * On the rack: paint tins, jars, bottles, a broken drill, hammer,
 * wrench, saw blade, screwdrivers, folded tarp, rope, an open carton and
 * rags. On the floor: black bags, cartons, the leaning broom and tin
 * dustpan, and swept debris. Everything is static and merged; only the
 * bags and cartons carry collision through the room colliders.
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
  const geometry = new THREE.TorusGeometry(radius, tube, options.radial ?? 5, options.tubular ?? 14, options.arc ?? Math.PI * 2);
  builder.add(key, geometry, trs(x, y, z, options.ry ?? 0, 1, 1, 1, options.rx ?? 0, options.rz ?? 0), {
    cast: false,
    receive: true,
  });
}

/* --- Cartons ------------------------------------------------------ */

function addCarton(builder, x, y, z, w, h, d, ry = 0, dark = false, open = false) {
  const key = dark ? 'cardboardDark' : 'cardboard';
  if (!open) {
    addBox(builder, key, w, h - 0.012, d, x, y + (h - 0.012) / 2, z, ry);
    addBox(builder, key, w + 0.006, 0.014, d + 0.006, x, y + h - 0.006, z, ry, { cast: false });
    addBox(builder, 'cardboardDark', w * 0.14, 0.002, d + 0.01, x, y + h + 0.002, z, ry, { cast: false });
    addBox(builder, 'cardboardDark', w + 0.004, 0.026, 0.038, x, y + h * 0.52, z + d / 2, ry, { cast: false });
    CONTENT_COUNTS.boxes += 1;
    return;
  }
  // Open carton: four thin walls, an oily bottom and out-turned flaps.
  const t = 0.012;
  addBox(builder, key, w, 0.016, d, x, y + 0.008, z, ry, { cast: false });
  addBox(builder, key, w, h, t, x, y + h / 2, z - d / 2 + t / 2, ry);
  addBox(builder, key, w, h, t, x, y + h / 2, z + d / 2 - t / 2, ry);
  addBox(builder, key, t, h, d - t * 2, x - w / 2 + t / 2, y + h / 2, z, ry);
  addBox(builder, key, t, h, d - t * 2, x + w / 2 - t / 2, y + h / 2, z, ry);
  const flap = (fx, fz, rotY, rotX) => {
    addBox(builder, key, w * 0.48, 0.008, d * 0.5, fx, y + h + 0.03, fz, rotY, { cast: false });
  };
  flap(x - w * 0.25, z - d / 2 - 0.02, ry + 0.5);
  flap(x + w * 0.25, z - d / 2 - 0.02, ry - 0.5);
  flap(x - w * 0.25, z + d / 2 + 0.02, ry - 0.5);
  flap(x + w * 0.25, z + d / 2 + 0.02, ry + 0.5);
  // Paper filling visible over the rim.
  for (let i = 0; i < 4; i += 1) {
    builder.add(
      'paperOld',
      new THREE.IcosahedronGeometry(0.05 + i * 0.008, 0),
      trs(x - 0.08 + i * 0.05, y + h - 0.02, z - 0.02 + (i % 2) * 0.06, i * 0.7, 1, 0.55, 1),
      { cast: false },
    );
  }
  CONTENT_COUNTS.papers += 4;
  CONTENT_COUNTS.boxes += 1;
}

/* --- Tins, jars and bottles --------------------------------------- */

function addPaintCan(builder, x, y, z, radius, height, bandKey) {
  addCyl(builder, 'steelShelf', radius, radius, height, 14, x, y + height / 2, z);
  addCyl(builder, bandKey, radius + 0.0015, radius + 0.0015, height * 0.5, 14, x, y + height * 0.4, z);
  addCyl(builder, 'rust', radius * 0.98, radius * 0.98, 0.012, 14, x, y + height + 0.005, z);
  addTorus(builder, 'steelDark', radius, 0.005, x, y + height, z, { rx: Math.PI / 2 });
  addTorus(builder, 'steelDark', radius * 0.9, 0.004, x, y + height + 0.002, z, {
    arc: Math.PI,
    radial: 4,
    tubular: 12,
  });
  addBox(builder, 'labelPaper', radius * 1.2, height * 0.3, 0.002, x, y + height * 0.5, z + radius + 0.001, 0, {
    cast: false,
  });
  CONTENT_COUNTS.paintCans += 1;
}

function addJar(builder, x, y, z, seed = 0) {
  addCyl(builder, 'deadLens', 0.042, 0.042, 0.115, 12, x, y + 0.0575, z);
  addCyl(builder, 'steelDark', 0.044, 0.044, 0.016, 12, x, y + 0.121, z);
  const rng = mulberry32(0x2a4b + seed);
  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2;
    addCyl(builder, 'steelDark', 0.007, 0.007, 0.024, 6, x + Math.cos(angle) * 0.018, y + 0.03, z + Math.sin(angle) * 0.018, {
      rx: Math.PI / 2,
      ry: angle,
    });
  }
  addBox(builder, 'labelPaper', 0.05, 0.035, 0.002, x, y + 0.06, z + 0.042, rng() * 0.6, { cast: false });
  CONTENT_COUNTS.jars += 1;
}

function addBottle(builder, x, y, z, height, key, ry = 0) {
  addCyl(builder, key, 0.033, 0.036, height, 12, x, y + height / 2, z, { ry });
  addCyl(builder, key, 0.014, 0.03, height * 0.22, 12, x, y + height + height * 0.1, z, { ry });
  addCyl(builder, 'steelDark', 0.016, 0.016, 0.02, 10, x, y + height + height * 0.21, z, { ry });
  CONTENT_COUNTS.bottles += 1;
}

function addSprayBottle(builder, x, y, z, ry, key) {
  addCyl(builder, key, 0.034, 0.034, 0.15, 12, x, y + 0.075, z);
  addCyl(builder, key, 0.034, 0.022, 0.032, 12, x, y + 0.166, z);
  addCyl(builder, 'plasticGrey', 0.017, 0.017, 0.028, 10, x, y + 0.195, z);
  addBox(builder, 'plasticGrey', 0.075, 0.03, 0.045, x + 0.012, y + 0.222, z, ry);
  addCyl(builder, 'rubber', 0.006, 0.006, 0.03, 8, x + 0.055, y + 0.226, z, { rz: Math.PI / 2 });
  addBox(builder, 'labelPaper', 0.05, 0.06, 0.002, x, y + 0.08, z + 0.034, 0, { cast: false });
}

/* --- Tools -------------------------------------------------------- */

function addDrill(builder, x, y, z, ry) {
  // Body, gear housing, chuck, bit, side handle, trigger — dead battery.
  addBox(builder, 'binBlack', 0.26, 0.07, 0.075, x, y + 0.045, z, ry);
  addCyl(builder, 'steelDark', 0.035, 0.038, 0.07, 12, x + 0.17, y + 0.045, z, { rx: 0, rz: Math.PI / 2, ry });
  addCyl(builder, 'metalTools', 0.012, 0.012, 0.11, 8, x + 0.26, y + 0.045, z, { rz: Math.PI / 2, ry });
  addBox(builder, 'binBlack', 0.05, 0.09, 0.055, x - 0.03, y - 0.01, z, ry);
  addBox(builder, 'steelDark', 0.02, 0.05, 0.05, x + 0.02, y - 0.03, z, ry);
  addBox(builder, 'rubber', 0.03, 0.02, 0.02, x + 0.03, y - 0.06, z, ry);
  addCyl(builder, 'steelDark', 0.006, 0.006, 0.09, 6, x + 0.05, y + 0.115, z, { rx: Math.PI / 2, ry });
  CONTENT_COUNTS.tools += 1;
}

function addHammer(builder, x, y, z, ry) {
  addBox(builder, 'woodOld', 0.03, 0.03, 0.26, x, y + 0.02, z, ry);
  addBox(builder, 'metalTools', 0.055, 0.05, 0.11, x, y + 0.02, z - 0.15, ry);
  addBox(builder, 'steelDark', 0.07, 0.018, 0.03, x, y + 0.02, z - 0.15, ry, { cast: false });
  CONTENT_COUNTS.tools += 1;
}

function addWrench(builder, x, y, z, ry) {
  addBox(builder, 'metalTools', 0.026, 0.008, 0.24, x, y + 0.004, z, ry);
  addBox(builder, 'metalTools', 0.05, 0.008, 0.045, x, y + 0.004, z - 0.13, ry);
  addBox(builder, 'metalTools', 0.05, 0.008, 0.045, x, y + 0.004, z + 0.13, ry);
  addBox(builder, 'binTrim', 0.018, 0.01, 0.03, x, y + 0.004, z - 0.14, ry, { cast: false });
  CONTENT_COUNTS.tools += 1;
}

function addSawBlade(builder, x, y, z, ry, radius = 0.14) {
  addCyl(builder, 'steelShelf', radius, radius, 0.004, 24, x, y + radius, z, { rx: Math.PI / 2, ry });
  addCyl(builder, 'rust', radius * 0.2, radius * 0.2, 0.008, 12, x, y + radius, z, { rx: Math.PI / 2, ry });
  for (let i = 0; i < 18; i += 1) {
    const angle = (i / 18) * Math.PI * 2;
    const px = x + Math.cos(angle) * (radius + 0.008);
    const py = y + radius + Math.sin(angle) * (radius + 0.008);
    addBox(builder, 'rust', 0.014, 0.02, 0.006, px, py, z, 0, { cast: false });
  }
  CONTENT_COUNTS.tools += 1;
}

function addScrewdriver(builder, x, y, z, ry, hiltKey, length = 0.2) {
  addCyl(builder, hiltKey, 0.017, 0.014, 0.09, 8, x, y + 0.018, z, { rx: Math.PI / 2, ry });
  addCyl(builder, 'metalTools', 0.005, 0.005, length, 7, x, y + 0.014, z, { rx: Math.PI / 2, ry });
  CONTENT_COUNTS.tools += 1;
}

/* --- Soft goods --------------------------------------------------- */

function addRag(builder, x, y, z, key = 'clothRag', scale = 1, ry = 0) {
  for (let i = 0; i < 3; i += 1) {
    builder.add(
      key,
      new THREE.IcosahedronGeometry(0.055 * scale, 0),
      trs(x + i * 0.035, y + 0.018 * scale, z + (i % 2) * 0.03, ry + i * 0.6, 1.2, 0.42, 1.05),
      { cast: false },
    );
  }
  CONTENT_COUNTS.rags += 1;
}

function addTarp(builder, x, y, z, ry) {
  for (let i = 0; i < 3; i += 1) {
    addBox(builder, 'clothTarpaulin', 0.42 - i * 0.04, 0.05, 0.3 - i * 0.02, x, y + 0.025 + i * 0.05, z, ry + i * 0.08);
  }
  addBox(builder, 'clothTarpaulin', 0.3, 0.03, 0.18, x + 0.03, y + 0.17, z - 0.02, ry + 0.3, { cast: false });
  addTorus(builder, 'ropeJute', 0.1, 0.012, x - 0.06, y + 0.2, z + 0.04, { rx: Math.PI / 2, ry });
}

function addRopeCoil(builder, x, y, z, radius, ry, seed) {
  builder.add('ropeJute', ropeCoilGeometry(radius, 0.014, 5, 0.05, seed), trs(x, y, z, ry), {
    cast: true,
    receive: true,
  });
  addBox(builder, 'ropeJute', 0.03, 0.02, 0.16, x + radius * 0.4, y + 0.04, z + radius * 0.9, ry, { cast: false });
}

/* --- Bags --------------------------------------------------------- */

function bagGeometry(half, height, seed, open = false) {
  const points = [];
  const rings = 13;
  for (let i = 0; i <= rings; i += 1) {
    const t = i / rings;
    let radius;
    if (open) {
      // Open mouth: a bag that has been torn wide at the top.
      radius = 0.3 + 0.74 * Math.sin(Math.PI * Math.min(1, t * 1.06));
      if (t > 0.86) radius = Math.max(radius, 0.72 + (t - 0.86) * 0.6);
    } else {
      // Tied bag: full belly, gathered neck, closed top.
      radius = 0.3 + 0.74 * Math.sin(Math.PI * Math.pow(t, 0.84));
      if (t > 0.78) radius *= 1 - ((t - 0.78) / 0.22) * 0.62;
    }
    points.push(new THREE.Vector2(Math.max(0.004, radius * half), t * height));
  }
  if (!open) points.push(new THREE.Vector2(0.002, height));
  const geometry = new THREE.LatheGeometry(points, 20);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    let x = position.getX(i);
    let y = position.getY(i);
    let z = position.getZ(i);
    const t = Math.max(0, Math.min(1, y / height));
    const angle = Math.atan2(z, x);
    const radial = 1 + 0.075 * Math.sin(angle * 3 + seed * 1.7) + 0.035 * Math.sin(angle * 5 - t * 3.4 + seed);
    x *= radial;
    z *= radial * 0.9;
    x += t * t * half * (0.28 + Math.sin(seed) * 0.12);
    y += Math.sin(angle * 2 + seed) * height * 0.008;
    position.setXYZ(i, x, y, z);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function addBag(builder, bag) {
  const { x, z, half, height, ry, seed, open, slumped } = bag;
  if (slumped) {
    builder.add('bagBlack', slumpedSackGeometry(half, height * 1.55, seed), trs(x, 0.02, z, ry, 1, 1, 1, 0, 0.05), {
      cast: true,
      receive: true,
    });
    addCyl(builder, 'bagBlack', 0.012, 0.045, 0.08, 7, x + Math.cos(ry) * 0.08, 0.16, z + Math.sin(ry) * 0.08, {
      rz: Math.PI / 2,
      ry,
      cast: false,
    });
    addTorus(builder, 'bagBlack', 0.05, 0.01, x + Math.cos(ry) * 0.05, 0.14, z + Math.sin(ry) * 0.05, {
      rx: Math.PI / 2,
      cast: false,
    });
  } else if (!open) {
    const tilt = (seed % 1) * 0.08 - 0.04;
    builder.add('bagBlack', bagGeometry(half, height, seed), trs(x, 0.008, z, ry, 1, 0.98, 0.92, tilt, tilt * 0.7), {
      cast: true,
      receive: true,
    });
    // The tied neck, a short collar and two floppy ears.
    const neckX = x + half * (0.28 + Math.sin(seed) * 0.12) + 0.02;
    addCyl(builder, 'bagBlack', 0.026, 0.045, 0.07, 9, neckX, height * 0.95, z - 0.02, { rx: 0.2, cast: false });
    addTorus(builder, 'bagBlack', 0.038, 0.01, neckX, height * 0.96, z - 0.02, { rx: Math.PI / 2, cast: false });
    for (const side of [-1, 1]) {
      addCyl(builder, 'bagBlack', 0.008, 0.022, 0.065, 7, neckX + side * 0.04, height * 0.99, z + side * 0.025, {
        rx: 1.2,
        ry: side * 0.6,
        cast: false,
      });
    }
  } else {
    // An open bag: a torn mouth, a dark void and trash on the floor.
    builder.add('bagBlack', bagGeometry(half, height, seed, true), trs(x, 0.008, z, ry, 1, 1, 0.92), {
      cast: true,
      receive: true,
    });
    builder.add('binTrim', new THREE.CircleGeometry(half * 0.7, 16), trs(x, height * 0.7, z, ry, 1, 1, 0.78, -Math.PI / 2), {
      cast: false,
      receive: false,
    });
    // Three rolled-over flaps, unevenly placed.
    for (const [angle, scale, lift] of [
      [0.4, 1.0, 0.02],
      [2.3, 0.8, -0.01],
      [4.2, 1.15, 0.015],
    ]) {
      builder.add(
        'bagBlack',
        new THREE.SphereGeometry(0.07 * scale, 9, 6),
        trs(
          x + Math.cos(angle + seed) * half * 0.94,
          height * 0.72 + lift,
          z + Math.sin(angle + seed) * half * 0.8,
          angle,
          1.8,
          0.55,
          1.0,
        ),
        { cast: false },
      );
    }
    // Trash poking out of the mouth.
    for (let i = 0; i < 3; i += 1) {
      builder.add(
        'paperOld',
        new THREE.IcosahedronGeometry(0.05 + i * 0.01, 0),
        trs(x - 0.05 + i * 0.06, height * 0.64 + i * 0.02, z + 0.03 - i * 0.02, i * 0.8, 1, 0.7, 1),
        { cast: false },
      );
    }
    CONTENT_COUNTS.papers += 3;
    addCyl(builder, 'steelShelf', 0.028, 0.028, 0.1, 10, x + 0.1, height * 0.64, z + 0.08, {
      rx: Math.PI / 2,
      ry: 0.4,
      cast: false,
    });
    // Spilled bottles and paper.
    addCyl(builder, 'plasticBlue', 0.026, 0.026, 0.17, 10, x + 0.28, 0.09, z + 0.12, { rz: Math.PI / 2, ry: 0.7 });
    for (let i = 0; i < 4; i += 1) {
      builder.add(
        'paperOld',
        new THREE.IcosahedronGeometry(0.045 + i * 0.01, 0),
        trs(x + 0.2 + i * 0.1, 0.03, z + 0.24 + i * 0.04, i, 1, 0.6, 1),
        { cast: false },
      );
    }
  }
  CONTENT_COUNTS.bags += 1;
}

/* --- Broom and tin dustpan ---------------------------------------- */

function addBroomLean(builder) {
  const { baseX, baseZ, topX, topY, topZ } = CLEANING.broom;
  addBox(builder, 'steelDark', 0.05, 0.06, 0.05, topX, topY - 0.02, topZ, 0, { cast: false });
  builder.add('woodOld', rodGeometry([baseX, 0.22, baseZ], [topX, topY, topZ], 0.013, 8), null, {
    cast: true,
    receive: true,
  });
  // Head block follows the lean.
  const dx = topX - baseX;
  const dy = topY - 0.22;
  const lean = Math.atan2(dx, dy);
  builder.add(
    'woodDark',
    boxGeometry(0.11, 0.12, 0.31),
    trs(baseX + 0.04, 0.18, baseZ, 0, 1, 1, 1, 0, -lean * 0.35),
    { cast: true, receive: true },
  );
  addTorus(builder, 'steelDark', 0.06, 0.005, baseX + 0.04, 0.24, baseZ, { rx: Math.PI / 2, cast: false });
  addBox(builder, 'clothCream', 0.12, 0.045, 0.33, baseX + 0.04, 0.15, baseZ, 0, { cast: false });
  // Splayed bristles: three rows, uneven lengths.
  for (let i = 0; i < 32; i += 1) {
    const z = baseZ - 0.145 + (i / 31) * 0.29;
    const row = i % 3;
    const length = 0.14 + row * 0.014;
    builder.add(
      'bristle',
      boxGeometry(0.013, length, 0.009),
      trs(baseX + 0.055 + row * 0.022, 0.068, z, 0, 1, 1, 1, 0, -0.14 - row * 0.04),
      { cast: false },
    );
  }
  addBox(builder, 'clothRag', 0.08, 0.05, 0.06, baseX + 0.04, 0.2, baseZ + 0.02, 0, { cast: false });

  // Swept debris under the no-smoking sign.
  for (let i = 0; i < 6; i += 1) {
    builder.add(
      'wallPaintDark',
      new THREE.SphereGeometry(0.03 + (i % 3) * 0.012, 8, 5),
      trs(baseX - 0.22 + i * 0.05, 0.012, baseZ - 0.18 + (i % 2) * 0.08, 0, 1.3, 0.3, 1.1),
      { cast: false },
    );
  }
}

function buildDustpan(materials) {
  const group = new THREE.Group();
  group.name = 'garbage-tin-dustpan';
  group.position.set(CLEANING.dustpan.x, 0, CLEANING.dustpan.z);
  group.rotation.y = CLEANING.dustpan.ry;
  const builder = new StaticBuilder();
  // Dented tin pan, tilted up on its back edge.
  builder.add('steelShelf', boxGeometry(0.26, 0.016, 0.3), trs(0, 0.05, 0, 0, 1, 1, 1, 0.18, 0), {
    cast: true,
    receive: true,
  });
  addBox(builder, 'steelShelf', 0.26, 0.07, 0.014, 0, 0.085, -0.15, 0, { cast: false });
  addBox(builder, 'steelShelf', 0.014, 0.06, 0.3, -0.13, 0.085, 0, 0, { cast: false });
  addBox(builder, 'steelShelf', 0.014, 0.06, 0.3, 0.13, 0.085, 0, 0, { cast: false });
  addBox(builder, 'rust', 0.26, 0.012, 0.02, 0, 0.03, 0.15, 0, { cast: false });
  addBox(builder, 'binTrim', 0.25, 0.006, 0.03, 0, 0.014, 0.16, 0, { cast: false });
  // Long handle leaning to the wall.
  builder.add('steelShelf', rodGeometry([0, 0.11, -0.14], [0.13, 0.96, -0.08], 0.011, 8), null, {
    cast: true,
    receive: true,
  });
  addBox(builder, 'steelDark', 0.03, 0.03, 0.06, 0.13, 0.96, -0.08, 0, { cast: false });
  builder.flush(group, materials, 'garbage-dustpan');
  group.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
  });
  return group;
}

/* --- Rack contents ------------------------------------------------ */

function fillRack(builder) {
  const x0 = RACK.centerX - RACK.width / 2;
  const x1 = RACK.centerX + RACK.width / 2;
  const zBack = RACK.centerZ - RACK.depth / 2;
  const zFront = RACK.centerZ + RACK.depth / 2;
  const zMid = RACK.centerZ + 0.02;
  const t0 = TIER_TOP[0];
  const t1 = TIER_TOP[1];
  const t2 = TIER_TOP[2];
  const t3 = TIER_TOP[3];

  // Bottom tier: paint, toolbox, bucket, wire.
  addPaintCan(builder, x0 + 0.22, t0, zMid - 0.04, 0.085, 0.21, 'paintRed');
  addPaintCan(builder, x0 + 0.44, t0, zMid - 0.09, 0.075, 0.18, 'paintBlue');
  addPaintCan(builder, x0 + 0.34, t0, zMid + 0.1, 0.07, 0.15, 'rust');
  addBox(builder, 'steelDark', 0.4, 0.18, 0.2, x0 + 0.95, t0 + 0.09, zMid - 0.02, 0.04);
  addBox(builder, 'steelShelf', 0.38, 0.02, 0.18, x0 + 0.95, t0 + 0.185, zMid - 0.02, 0.04, { cast: false });
  addBox(builder, 'steelPolished', 0.18, 0.03, 0.02, x0 + 0.95, t0 + 0.18, zMid + 0.08, 0.04, { cast: false });
  addBox(builder, 'labelPaper', 0.09, 0.05, 0.002, x0 + 0.92, t0 + 0.11, zFront - 0.03, 0.04, { cast: false });
  builder.add(
    'steelShelf',
    bucketGeometry(0.12, 0.095, 0.22, 14),
    trs(x1 - 0.22, t0, zMid + 0.03, 0.2),
    { cast: true, receive: true },
  );
  addTorus(builder, 'steelDark', 0.12, 0.005, x1 - 0.22, t0 + 0.22, zMid + 0.03, { rx: Math.PI / 2 });
  addRag(builder, x1 - 0.22, t0 + 0.18, zMid + 0.03, 'clothDark', 0.8, 0.4);
  builder.add('rust', ropeCoilGeometry(0.12, 0.013, 3, 0.03, 4.2), trs(x0 + 0.66, t0 + 0.01, zMid + 0.08, 0.2), {
    cast: false,
    receive: true,
  });

  // Second tier: jars, spray, bottles and rags.
  addJar(builder, x0 + 0.2, t1, zMid - 0.04, 1);
  addJar(builder, x0 + 0.36, t1, zMid + 0.06, 2);
  addSprayBottle(builder, x0 + 0.62, t1, zMid - 0.02, 0.4, 'plasticBlue');
  addBottle(builder, x0 + 0.86, t1, zMid + 0.04, 0.24, 'plasticBlue', 0.2);
  addBottle(builder, x0 + 0.98, t1, zMid - 0.08, 0.19, 'deadLens', 0.7);
  addRag(builder, x1 - 0.3, t1, zMid, 'clothRag', 1.1, 0.2);
  addBox(builder, 'cardboardDark', 0.28, 0.04, 0.2, x1 - 0.2, t1 + 0.02, zMid + 0.08, 0.15, { cast: false });

  // Third tier: open carton, drill, hammer, wrench and screws.
  addCarton(builder, x0 + 0.34, t2, zMid, 0.4, 0.24, 0.28, 0.08, false, true);
  addDrill(builder, x0 + 0.95, t2, zMid - 0.02, -0.2);
  addHammer(builder, x0 + 1.16, t2, zMid + 0.05, 0.5);
  addWrench(builder, x0 + 1.3, t2, zMid - 0.08, 1.2);
  addSawBlade(builder, x1 - 0.16, t2, zMid + 0.02, 1.35, 0.13);
  for (const [sx, sy, key] of [
    [0.6, 0.24, 'paintRed'],
    [0.64, 0.22, 'plasticYellow'],
  ]) {
    addScrewdriver(builder, x0 + sx, t2 + sy, zMid + 0.1, 0.3, key, 0.18);
  }
  addJar(builder, x0 + 0.84, t2, zMid + 0.12, 3);

  // Top tier: folded tarp, rope coil and an upturned bucket.
  addTarp(builder, x0 + 0.4, t3, zMid, 0.12);
  addRopeCoil(builder, x0 + 1.02, t3, zMid, 0.15, 0.4, 2.6);
  builder.add(
    'steelShelf',
    bucketGeometry(0.15, 0.12, 0.24, 16),
    trs(x1 - 0.24, t3 + 0.24, zMid, 2.2, 1, -1, 1),
    { cast: true, receive: true },
  );
  addTorus(builder, 'steelDark', 0.15, 0.006, x1 - 0.24, t3, zMid, { rx: Math.PI / 2, cast: false });
  addBox(builder, 'rust', 0.2, 0.004, 0.12, x0 + 0.7, t3 + 0.002, zMid + 0.05, 0.2, { cast: false });
  addBox(builder, 'steelDark', 0.06, 0.06, 0.2, x0 + 0.06, t3 + 0.03, zMid, 0.2, { cast: false });

  // Under the low bottom board only flat items fit; the bucket and sack
  // that used to clip the shelf have been moved/removed.
  addBox(builder, 'clothDark', 0.3, 0.035, 0.22, x0 + 0.72, 0.02, zMid, 0.25, { cast: false });
  addBox(builder, 'clothRag', 0.24, 0.03, 0.18, x0 + 0.5, 0.016, zMid + 0.06, -0.2, { cast: false });
  addBox(builder, 'mopYarn', 0.2, 0.05, 0.26, x0 + 0.72, 0.03, zFront - 0.03, 0.4, { cast: false });
}

/* ------------------------------------------------------------------ */

export function buildClutter(builder, materials, root) {
  fillRack(builder);

  for (const carton of CARTONS) {
    addCarton(builder, carton.x, 0, carton.z, carton.w, carton.h, carton.d, carton.ry, carton.dark, carton.open);
  }
  for (const bag of BAGS) addBag(builder, bag);

  addBroomLean(builder);
  const dustpan = buildDustpan(materials);
  root.add(dustpan);

  // A rusted paint tin on the floor beside the rack, lid beside it.
  addPaintCan(builder, -1.02, 0, -2.2, 0.1, 0.24, 'rust');
  builder.add('rust', new THREE.CircleGeometry(0.11, 16), trs(-0.86, 0.006, -2.2, 0.4, 1, 1, 1, -Math.PI / 2, 0), {
    cast: false,
  });
  // A dead mop leaning in the north-west corner.
  builder.add('woodOld', rodGeometry([-1.98, 0.16, -2.3], [-1.82, 1.42, -2.42], 0.012, 8), null, { cast: true });
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2;
    builder.add(
      'clothDark',
      boxGeometry(0.012, 0.16, 0.012),
      trs(-1.98 + Math.cos(angle) * 0.05, 0.08, -2.3 + Math.sin(angle) * 0.05, 0, 1, 1, 1, 0, Math.cos(angle) * 0.3),
      { cast: false },
    );
  }

  return { dustpan, counts: CONTENT_COUNTS };
}
