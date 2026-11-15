import * as THREE from 'three';
import {
  boxGeometry,
  cylinderGeometry,
  tubeGeometry,
  trs,
  rodGeometry,
  bowlGeometry,
  roundedBoxGeometry,
} from './geometry.js';
import {
  ISLAND,
  COOKING,
  WASH,
  PREP,
  WEST,
  HALF_W,
  HALF_D,
} from './config.js';

/* ------------------------------------------------------------------ *
 * Equipment and work surfaces.
 *
 * Everything here is static and batched by material. The island and the
 * wok range have deliberately tight colliders in config.js so the camera
 * can never slip through their front edges.
 * ------------------------------------------------------------------ */

function addBox(builder, key, width, height, depth, x, y, z, ry = 0, options = {}) {
  builder.add(key, boxGeometry(width, height, depth), trs(x, y, z, ry), {
    cast: options.cast ?? true,
    receive: options.receive ?? true,
  });
}

function addCylinder(builder, key, rt, rb, height, segments, x, y, z, rx = 0, ry = 0, rz = 0, options = {}) {
  builder.add(key, cylinderGeometry(rt, rb, height, segments), trs(x, y, z, ry, 1, 1, 1, rx, rz), {
    cast: options.cast ?? true,
    receive: options.receive ?? true,
  });
}

function addRounded(builder, key, width, height, depth, radius, x, y, z, ry = 0, options = {}) {
  builder.add(key, roundedBoxGeometry(width, height, depth, radius), trs(x, y, z, ry), {
    cast: options.cast ?? true,
    receive: options.receive ?? true,
  });
}

function addBowl(builder, key, radius, depth, x, y, z, scaleY = 1, rx = 0, ry = 0, rz = 0) {
  builder.add(key, bowlGeometry(radius, depth, 28), trs(x, y, z, ry, 1, scaleY, 1, rx, rz), {
    cast: true,
    receive: true,
  });
}

function arcTorus(radius, tube, radialSegments, tubularSegments, arc) {
  return new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc);
}

/* --- Central island ----------------------------------------------- */

function addIsland(builder, materials) {
  const { x, z, width, depth } = ISLAND;
  const topY = ISLAND.height;

  // Body, toe recess, lower shelf and leveling feet.
  addBox(builder, 'steelDark', width - 0.14, 0.07, depth - 0.12, x, 0.035, z);
  addBox(builder, 'steel', width - 0.1, 0.78, depth - 0.1, x, 0.47, z);
  addBox(builder, 'steelPolished', width + 0.08, 0.05, depth + 0.08, x, topY - 0.025, z);
  addBox(builder, 'steel', width - 0.16, 0.03, depth - 0.16, x, 0.27, z);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addCylinder(builder, 'steelDark', 0.024, 0.024, 0.09, 10, x + sx * (width / 2 - 0.12), 0.045, z + sz * (depth / 2 - 0.1));
    }
  }

  // Doors and drawer faces on both long sides.
  for (const side of [-1, 1]) {
    const faceZ = z + side * (depth / 2 - 0.035);
    for (const offset of [-0.78, 0, 0.78]) {
      addBox(builder, 'steel', 0.7, 0.45, 0.026, x + offset, 0.62, faceZ, 0, { cast: false });
      addBox(builder, 'steelDark', 0.6, 0.35, 0.01, x + offset, 0.62, faceZ + side * 0.018, 0, { cast: false });
      addCylinder(
        builder,
        'steelPolished',
        0.012,
        0.012,
        0.2,
        8,
        x + offset + 0.24,
        0.82,
        faceZ + side * 0.03,
        0,
        0,
        Math.PI / 2,
        { cast: false },
      );
    }
  }
  for (const side of [-1, 1]) {
    addBox(builder, 'steel', 0.03, 0.14, 0.74, x + side * (width / 2 - 0.02), 0.53, z, 0, { cast: false });
  }

  // --- Topside mise en place -------------------------------------

  // Colour-coded cutting boards: red raw meat, green vegetables,
  // white dairy / cooked food.
  addRounded(builder, 'cuttingRed', 0.43, 0.028, 0.34, 0.008, -1.06, topY + 0.014, 0.06, 0.05);
  addRounded(builder, 'cuttingGreen', 0.4, 0.028, 0.31, 0.008, -0.55, topY + 0.014, -0.15, -0.06);
  addRounded(builder, 'cuttingWhite', 0.52, 0.028, 0.39, 0.008, -0.06, topY + 0.014, 0.15, 0.03);

  // Knife rack with four knives.
  addBox(builder, 'steelDark', 0.56, 0.035, 0.17, 0.5, topY + 0.018, 0.08);
  addBox(builder, 'steelPolished', 0.52, 0.028, 0.035, 0.5, topY + 0.04, 0.08);
  for (let i = 0; i < 4; i += 1) {
    const kx = 0.32 + i * 0.12;
    addBox(builder, 'steelPolished', 0.045, 0.008, 0.19, kx, topY + 0.046, 0.08, 0, { cast: false });
    addBox(builder, 'blackPlastic', 0.065, 0.025, 0.026, kx, topY + 0.055, 0.19, 0, { cast: false });
    addBox(builder, 'steelDark', 0.05, 0.012, 0.016, kx, topY + 0.04, 0.005, 0, { cast: false });
  }

  // Six stainless condiment boxes, lids ajar, with colour-coded contents.
  addBox(builder, 'steelDark', 0.66, 0.02, 0.52, 1.09, topY + 0.012, -0.02);
  const spices = ['saltWhite', 'spiceRed', 'spiceBrown', 'herbGreen', 'saltWhite', 'spiceBrown'];
  for (let i = 0; i < 6; i += 1) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const bx = 0.88 + col * 0.22;
    const bz = -0.2 + row * 0.34;
    // Open-top stainless container: four walls, a base and a visible
    // mound of spice. No labels or text.
    addBox(builder, 'steel', 0.18, 0.012, 0.14, bx, topY + 0.012, bz, 0, { cast: false });
    addBox(builder, 'steel', 0.18, 0.11, 0.01, bx, topY + 0.067, bz - 0.065, 0, { cast: false });
    addBox(builder, 'steel', 0.18, 0.11, 0.01, bx, topY + 0.067, bz + 0.065, 0, { cast: false });
    addBox(builder, 'steel', 0.01, 0.11, 0.14, bx - 0.085, topY + 0.067, bz, 0, { cast: false });
    addBox(builder, 'steel', 0.01, 0.11, 0.14, bx + 0.085, topY + 0.067, bz, 0, { cast: false });
    addBox(builder, spices[i], 0.145, 0.03, 0.105, bx, topY + 0.105, bz, 0, { cast: false });
    // Lid leaning against the back rail.
    builder.add(
      'steelPolished',
      boxGeometry(0.18, 0.008, 0.14),
      trs(bx, topY + 0.13, bz + 0.11, 0.08, 1, 1, 1, -0.72, 0),
      { cast: false },
    );
    // Small spoon handle sticking out of the contents.
    addCylinder(builder, 'steelPolished', 0.007, 0.007, 0.13, 8, bx + 0.055, topY + 0.14, bz - 0.03, 0, 0, 0.2, { cast: false });
  }

  // A small stack of clean plates and a folded cloth at the far end.
  for (let i = 0; i < 5; i += 1) {
    addCylinder(builder, 'ceramic', 0.12, 0.11, 0.018, 20, 1.35, topY + 0.012 + i * 0.019, 0.31, 0, 0, 0, { cast: false });
  }
  addBox(builder, 'whitePlastic', 0.26, 0.018, 0.2, 1.27, topY + 0.011, -0.34, 0.1, { cast: false });

  // Lower shelf storage: stock pot, mixing bowl, sheet pan.
  addCylinder(builder, 'steel', 0.17, 0.18, 0.3, 20, -1.05, 0.45, 0);
  addCylinder(builder, 'steelPolished', 0.16, 0.16, 0.012, 20, -1.05, 0.606, 0);
  addBowl(builder, 'steelDouble', 0.2, 0.09, -0.35, 0.29, 0);
  addBox(builder, 'steelDark', 0.62, 0.02, 0.42, 0.6, 0.29, 0);
  addBox(builder, 'steelDark', 0.42, 0.02, 0.32, 0.6, 0.32, 0);
}

/* --- Wok range ---------------------------------------------------- */

function addRange(builder, materials) {
  const range = COOKING.range;
  const { x, z, width, depth } = range;
  const topY = range.height;

  addBox(builder, 'steel', width, 0.79, depth, x, 0.41, z);
  addBox(builder, 'steelPolished', width + 0.02, 0.06, depth + 0.02, x, topY - 0.03, z);
  addBox(builder, 'steelDark', width - 0.1, 0.09, depth - 0.12, x, 0.045, z);
  addBox(builder, 'steelDark', width, 0.32, 0.05, x, topY + 0.16, z - depth / 2 + 0.025);

  // Empty cast-iron wok rings. The pots are intentionally absent so
  // nothing intersects the range top or the hood.
  for (const wx of [x - 0.75, x + 0.75]) {
    addCylinder(builder, 'castIron', 0.32, 0.34, 0.035, 28, wx, topY + 0.018, z - 0.02);
    addCylinder(builder, 'steelDark', 0.28, 0.28, 0.012, 28, wx, topY + 0.04, z - 0.02);
    // Grate bars.
    for (let i = 0; i < 3; i += 1) {
      addBox(builder, 'castIron', 0.58, 0.018, 0.03, wx, topY + 0.065, z - 0.2 + i * 0.18);
    }
  }

  // Front controls, kick plate, blower box and foot rail.
  addBox(builder, 'steelDark', width - 0.12, 0.22, 0.03, x, 0.68, z + depth / 2 - 0.025);
  for (let i = 0; i < 4; i += 1) {
    addCylinder(builder, 'blackPlastic', 0.026, 0.026, 0.03, 16, x - 0.9 + i * 0.6, 0.68, z + depth / 2 - 0.005, Math.PI / 2, 0, 0);
    addBox(builder, 'fireRed', 0.012, 0.03, 0.012, x - 0.9 + i * 0.6, 0.71, z + depth / 2 + 0.012, 0, { cast: false });
  }
  addBox(builder, 'steel', width - 0.2, 0.15, 0.03, x, 0.42, z + depth / 2 - 0.02, 0, { cast: false });
  for (let i = 0; i < 4; i += 1) {
    addBox(builder, 'blackPlastic', width - 0.28, 0.012, 0.02, x, 0.39 + i * 0.04, z + depth / 2 - 0.002, 0, { cast: false });
  }
  addCylinder(builder, 'steelPolished', 0.02, 0.02, width - 0.08, 10, x, 0.17, z + depth / 2 + 0.05, 0, 0, Math.PI / 2);

  // Blower housing and fan grille on the lower front-left of the range.
  const blowerX = x - width / 2 + 0.34;
  const blowerZ = z + depth / 2 - 0.006;
  addBox(builder, 'steelDark', 0.34, 0.26, 0.1, blowerX, 0.34, blowerZ, 0, { cast: false });
  addCylinder(builder, 'blackPlastic', 0.095, 0.095, 0.02, 20, blowerX, 0.34, blowerZ + 0.06, Math.PI / 2, 0, 0, { cast: false });
  for (let i = 0; i < 3; i += 1) {
    addBox(builder, 'steelDark', 0.17, 0.012, 0.014, blowerX, 0.34 - 0.035 + i * 0.035, blowerZ + 0.073, 0, { cast: false });
  }

  // Twin swing faucets over the woks.
  for (const wx of [x - 0.75, x + 0.75]) {
    builder.add(
      'steelPolished',
      tubeGeometry(
        [
          [wx, topY + 0.02, z - depth / 2 + 0.12],
          [wx, topY + 0.26, z - depth / 2 + 0.12],
          [wx, topY + 0.32, z - depth / 2 + 0.24],
          [wx, topY + 0.27, z - depth / 2 + 0.36],
        ],
        0.018,
        18,
        8,
      ),
      trs(0, 0, 0),
    );
    addCylinder(builder, 'blackPlastic', 0.014, 0.02, 0.09, 10, wx, topY + 0.27, z - depth / 2 + 0.37);
    addCylinder(builder, 'steelPolished', 0.035, 0.035, 0.025, 14, wx + 0.12, topY + 0.18, z - depth / 2 + 0.12, 0, 0, Math.PI / 2);
  }
}

/* --- Steamer ------------------------------------------------------ */

function addSteamer(builder, materials) {
  const s = COOKING.steamer;
  const topY = s.height;
  addBox(builder, 'steel', s.width, topY - 0.08, s.depth, s.x, (topY - 0.08) / 2, s.z);
  addBox(builder, 'steelPolished', s.width + 0.03, 0.05, s.depth + 0.03, s.x, topY - 0.015, s.z);
  addBox(builder, 'steelDark', s.width - 0.08, 0.07, s.depth - 0.1, s.x, 0.035, s.z);
  addBox(builder, 'steelDark', s.width - 0.06, 0.28, 0.04, s.x, topY - 0.45, s.z + s.depth / 2 - 0.02);

  // Three independent steam compartments with glass ports.
  for (let i = 0; i < 3; i += 1) {
    const dy = 0.38 + i * 0.45;
    const front = s.z + s.depth / 2;
    addBox(builder, 'steelPolished', s.width - 0.16, 0.38, 0.045, s.x, dy, front - 0.02);
    addBox(builder, 'frostedGlass', s.width - 0.34, 0.2, 0.012, s.x, dy + 0.03, front + 0.012);
    addBox(builder, 'rubber', s.width - 0.14, 0.018, 0.02, s.x, dy - 0.17, front + 0.002, 0, { cast: false });
    // Hinged left edge and a vertical pull on the right: the front reads
    // as three independent steam compartments, not a symmetrical face.
    for (const sy of [-0.11, 0.11]) {
      addBox(builder, 'steelDark', 0.045, 0.07, 0.035, s.x - s.width / 2 + 0.075, dy + sy, front + 0.025);
    }
    addCylinder(builder, 'steelPolished', 0.012, 0.012, 0.24, 8, s.x + s.width / 2 - 0.14, dy - 0.01, front + 0.05);
    addBox(builder, 'steelDark', 0.05, 0.035, 0.04, s.x + s.width / 2 - 0.14, dy + 0.13, front + 0.035);
    addBox(builder, 'steelDark', 0.05, 0.035, 0.04, s.x + s.width / 2 - 0.14, dy - 0.15, front + 0.035);
  }

  // Pressure gauge, controls and steam vent (no lettering).
  addCylinder(builder, 'steelPolished', 0.07, 0.07, 0.03, 20, s.x + 0.22, 1.6, s.z + s.depth / 2 + 0.03, Math.PI / 2, 0, 0);
  addCylinder(builder, 'ceramic', 0.055, 0.055, 0.012, 20, s.x + 0.22, 1.6, s.z + s.depth / 2 + 0.048, Math.PI / 2, 0, 0);
  addBox(builder, 'fireRed', 0.004, 0.038, 0.004, s.x + 0.22, 1.61, s.z + s.depth / 2 + 0.056, 0, { cast: false });
  // Controls gathered into a vertical side strip so the three doors stay
  // legible as equipment rather than a symmetric face.
  addBox(builder, 'blackPlastic', 0.09, 0.44, 0.025, s.x + s.width / 2 - 0.04, 1.23, s.z + s.depth / 2 + 0.015, 0, { cast: false });
  for (let i = 0; i < 2; i += 1) {
    addCylinder(builder, 'steelPolished', 0.018, 0.018, 0.022, 12, s.x + s.width / 2 - 0.04, 1.34 - i * 0.14, s.z + s.depth / 2 + 0.032, Math.PI / 2, 0, 0);
  }
  addBox(builder, 'fireRed', 0.035, 0.012, 0.008, s.x + s.width / 2 - 0.04, 1.06, s.z + s.depth / 2 + 0.034, 0, { cast: false });
  addBox(builder, 'hazardYellow', 0.09, 0.03, 0.02, s.x - 0.32, 1.58, s.z + s.depth / 2 + 0.04, 0, { cast: false });
  addCylinder(builder, 'steelDark', 0.045, 0.055, 0.13, 14, s.x, topY + 0.075, s.z);
  addCylinder(builder, 'steelPolished', 0.058, 0.058, 0.01, 14, s.x, topY + 0.145, s.z);
  // Sheet pan on top.
  addBox(builder, 'steelDark', 0.58, 0.03, 0.42, s.x, topY + 0.03, s.z - 0.08);
  addBox(builder, 'steelPolished', 0.54, 0.01, 0.38, s.x, topY + 0.05, s.z - 0.08);
  // Side vents.
  for (let i = 0; i < 5; i += 1) {
    addBox(builder, 'blackPlastic', 0.02, 0.012, 0.26, s.x + s.width / 2 + 0.012, 0.25 + i * 0.16, s.z, 0, { cast: false });
  }
}

/* --- Oven --------------------------------------------------------- */

function addOven(builder, materials) {
  const o = COOKING.oven;
  const topY = o.height;
  addBox(builder, 'steel', o.width, topY - 0.1, o.depth, o.x, (topY - 0.1) / 2, o.z);
  addBox(builder, 'steelPolished', o.width + 0.03, 0.06, o.depth + 0.03, o.x, topY - 0.03, o.z);
  addBox(builder, 'steelDark', o.width - 0.08, 0.08, o.depth - 0.1, o.x, 0.04, o.z);
  const frontZ = o.z + o.depth / 2 - 0.015;

  // Two side-hinged doors with dark glass.
  for (const side of [-1, 1]) {
    const dx = o.x + side * 0.29;
    addBox(builder, 'steel', 0.54, 1.04, 0.04, dx, 0.68, frontZ);
    addBox(builder, 'blackPlastic', 0.4, 0.5, 0.012, dx, 0.72, frontZ + 0.025);
    addBox(builder, 'frostedGlass', 0.36, 0.45, 0.01, dx, 0.72, frontZ + 0.034);
    addCylinder(builder, 'steelPolished', 0.015, 0.015, 0.34, 10, dx, 0.9, frontZ + 0.08);
    addBox(builder, 'steelDark', 0.04, 0.05, 0.04, dx, 0.73, frontZ + 0.06);
    addBox(builder, 'steelDark', 0.04, 0.05, 0.04, dx, 1.07, frontZ + 0.06);
    for (const y of [0.3, 1.1]) {
      addCylinder(builder, 'steelPolished', 0.018, 0.018, 0.09, 8, dx + side * 0.28, y, frontZ + 0.02);
    }
  }

  // Control panel and vents. The panel is deliberately kept below the
  // top slab so it cannot z-fight with, or poke through, the oven crown.
  addBox(builder, 'blackPlastic', o.width - 0.12, 0.14, 0.04, o.x, 1.30, frontZ + 0.008);
  for (let i = 0; i < 3; i += 1) {
    addCylinder(builder, 'steelPolished', 0.022, 0.022, 0.03, 14, o.x - 0.3 + i * 0.3, 1.30, frontZ + 0.032, Math.PI / 2, 0, 0);
  }
  addBox(builder, 'fireRed', 0.05, 0.012, 0.008, o.x + 0.44, 1.30, frontZ + 0.032, 0, { cast: false });
  for (let i = 0; i < 4; i += 1) {
    addBox(builder, 'blackPlastic', 0.02, 0.012, 0.3, o.x + o.width / 2 + 0.012, 0.35 + i * 0.18, o.z, 0, { cast: false });
  }
  // Sheet pans on top.
  for (let i = 0; i < 3; i += 1) {
    addBox(builder, 'steelDark', 0.62, 0.018, 0.44, o.x - 0.15, topY + 0.012 + i * 0.02, o.z - 0.06);
  }
  addBox(builder, 'steelPolished', 0.58, 0.012, 0.4, o.x - 0.15, topY + 0.082, o.z - 0.06);
}

/* --- North prep table --------------------------------------------- */

function addNorthPrep(builder, materials) {
  const p = COOKING.prep;
  const topY = p.height;
  addBox(builder, 'steelPolished', p.width, 0.05, p.depth, p.x, topY - 0.025, p.z);
  addBox(builder, 'steel', p.width - 0.1, 0.12, p.depth - 0.08, p.x, topY - 0.12, p.z);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addBox(builder, 'steelDark', 0.045, topY - 0.06, 0.045, p.x + sx * (p.width / 2 - 0.06), (topY - 0.06) / 2, p.z + sz * (p.depth / 2 - 0.06));
    }
  }
  addBox(builder, 'steel', p.width - 0.08, 0.025, p.depth - 0.08, p.x, 0.24, p.z);
  // Under-counter ingredient bins.
  addBox(builder, 'greenBin', 0.42, 0.3, 0.34, p.x - 0.46, 0.42, p.z);
  addBox(builder, 'blueBin', 0.42, 0.3, 0.34, p.x + 0.02, 0.42, p.z);
  addBox(builder, 'whitePlastic', 0.26, 0.32, 0.28, p.x + 0.46, 0.43, p.z);
  // Topside: board, bowl, sheet pans.
  addRounded(builder, 'cuttingWhite', 0.52, 0.03, 0.38, 0.008, p.x - 0.38, topY + 0.015, p.z + 0.02, 0.04);
  addBowl(builder, 'steelDouble', 0.2, 0.09, p.x + 0.42, topY + 0.032, p.z - 0.06);
  addBox(builder, 'steelDark', 0.5, 0.016, 0.36, p.x + 0.15, topY + 0.01, p.z + 0.18);
  addBox(builder, 'steelPolished', 0.46, 0.008, 0.32, p.x + 0.15, topY + 0.022, p.z + 0.18);

  // Wall shelf with pans and a stock pot.
  const shelfY = 1.93;
  addBox(builder, 'steel', p.width, 0.04, 0.31, p.x, shelfY, p.z - p.depth / 2 + 0.18);
  for (const sx of [-1, 1]) {
    builder.add(
      'steelPolished',
      rodGeometry([p.x + sx * 0.75, shelfY - 0.02, p.z - p.depth / 2 + 0.33], [p.x + sx * 0.75, shelfY - 0.36, p.z - p.depth / 2 + 0.03], 0.01, 6),
      trs(0, 0, 0),
      { cast: false },
    );
  }
  for (let i = 0; i < 3; i += 1) {
    addBox(builder, 'steelDark', 0.64, 0.018, 0.38, p.x - 0.35, shelfY + 0.03 + i * 0.02, p.z - p.depth / 2 + 0.16);
  }
  addCylinder(builder, 'steel', 0.13, 0.14, 0.22, 18, p.x + 0.56, shelfY + 0.13, p.z - p.depth / 2 + 0.17);
  addCylinder(builder, 'steelPolished', 0.12, 0.12, 0.012, 18, p.x + 0.56, shelfY + 0.245, p.z - p.depth / 2 + 0.17);
}

/* --- Triple sink -------------------------------------------------- */

function addSink(builder, materials) {
  const s = WASH.sink;
  const topY = s.height;
  const backZ = s.z + s.depth / 2;
  const frontZ = s.z - s.depth / 2;
  const left = s.x - s.width / 2;
  const right = s.x + s.width / 2;

  // Four legs and a lower shelf.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addCylinder(builder, 'steel', 0.025, 0.025, topY - 0.05, 10, s.x + sx * (s.width / 2 - 0.12), (topY - 0.05) / 2, s.z + sz * (s.depth / 2 - 0.1));
    }
  }
  addBox(builder, 'steel', s.width - 0.24, 0.025, s.depth - 0.18, s.x, 0.24, s.z);

  // Drainboards at both ends.
  for (const side of [-1, 1]) {
    const dx = s.x + side * 1.36;
    addBox(builder, 'steelPolished', 0.34, 0.04, s.depth - 0.08, dx, topY - 0.02, s.z);
    for (let i = 0; i < 5; i += 1) {
      addBox(builder, 'steelDark', 0.3, 0.008, 0.018, dx, topY + 0.003, s.z - 0.24 + i * 0.12, 0, { cast: false });
    }
  }

  // Three recessed basins built from a bottom and four walls each.
  const basinWidth = 0.63;
  const basinDepth = 0.57;
  const basinBottom = topY - 0.33;
  const basinZ = s.z;
  const basinCenters = [s.x - 0.68, s.x, s.x + 0.68];
  // Perimeter rim strips. The widths match the real gaps between the
  // two drainboards and the three basin openings.
  addBox(builder, 'steelPolished', s.width, 0.045, 0.14, s.x, topY - 0.02, backZ - 0.07);
  addBox(builder, 'steelPolished', s.width, 0.045, 0.1, s.x, topY - 0.02, frontZ + 0.05);
  for (const gap of [
    { x: left + 0.035, w: 0.07 },
    { x: s.x - 1.0925, w: 0.195 },
    { x: s.x - 0.34, w: 0.05 },
    { x: s.x + 0.34, w: 0.05 },
    { x: s.x + 1.0925, w: 0.195 },
    { x: right - 0.035, w: 0.07 },
  ]) {
    addBox(builder, 'steelPolished', gap.w, 0.045, s.depth - 0.14, gap.x, topY - 0.02, s.z);
  }
  for (const bx of basinCenters) {
    addBox(builder, 'steelDark', basinWidth, 0.025, basinDepth, bx, basinBottom, basinZ, 0, { cast: false });
    addBox(builder, 'steel', 0.025, 0.31, basinDepth, bx - basinWidth / 2, basinBottom + 0.16, basinZ);
    addBox(builder, 'steel', 0.025, 0.31, basinDepth, bx + basinWidth / 2, basinBottom + 0.16, basinZ);
    addBox(builder, 'steel', basinWidth, 0.31, 0.025, bx, basinBottom + 0.16, basinZ - basinDepth / 2);
    addBox(builder, 'steel', basinWidth, 0.31, 0.025, bx, basinBottom + 0.16, basinZ + basinDepth / 2);
    addCylinder(builder, 'steelDark', 0.045, 0.045, 0.012, 12, bx, basinBottom + 0.015, basinZ, 0, 0, 0, { cast: false });
  }

  // Three gooseneck faucets.
  for (const bx of basinCenters) {
    builder.add(
      'steelPolished',
      tubeGeometry(
        [
          [bx, topY + 0.01, backZ - 0.1],
          [bx, topY + 0.32, backZ - 0.1],
          [bx, topY + 0.38, backZ - 0.24],
          [bx, topY + 0.3, backZ - 0.38],
        ],
        0.022,
        18,
        8,
      ),
      trs(0, 0, 0),
    );
    addCylinder(builder, 'steelPolished', 0.032, 0.032, 0.045, 12, bx - 0.15, topY + 0.18, backZ - 0.1, Math.PI / 2, 0, 0);
    addCylinder(builder, 'blackPlastic', 0.018, 0.022, 0.06, 10, bx, topY + 0.26, backZ - 0.39);
  }

  // High-pressure sprayer with a hanging spring hose.
  const sprayerX = right - 0.08;
  addBox(builder, 'steelPolished', 0.16, 0.04, 0.18, sprayerX, topY + 0.01, backZ - 0.16);
  addCylinder(builder, 'steelPolished', 0.024, 0.024, 0.46, 10, sprayerX, topY + 0.25, backZ - 0.16);
  for (let i = 0; i < 5; i += 1) {
    builder.add(
      'rubber',
      arcTorus(0.14 + i * 0.012, 0.012, 8, 24, Math.PI * 1.35),
      trs(sprayerX, topY + 0.14 - i * 0.045, backZ - 0.3, 0, 1, 1, 1, Math.PI / 2, 0),
    );
  }
  builder.add(
    'steelPolished',
    tubeGeometry(
      [
        [sprayerX, topY + 0.42, backZ - 0.16],
        [sprayerX + 0.12, topY + 0.24, backZ - 0.42],
        [sprayerX + 0.04, topY + 0.1, backZ - 0.44],
      ],
      0.016,
      16,
      8,
    ),
    trs(0, 0, 0),
  );
  addCylinder(builder, 'blackPlastic', 0.03, 0.02, 0.13, 12, sprayerX + 0.02, topY + 0.06, backZ - 0.44);

  // Garbage disposal under the centre basin, with visible pipework.
  addCylinder(builder, 'blackPlastic', 0.17, 0.19, 0.3, 20, s.x, 0.49, s.z);
  addCylinder(builder, 'steelDark', 0.19, 0.19, 0.015, 20, s.x, 0.63, s.z);
  addCylinder(builder, 'steelDark', 0.035, 0.035, 0.34, 10, s.x, 0.32, s.z + 0.1, Math.PI / 2, 0, 0);
  for (const side of [-1, 1]) {
    const px = s.x + side * 0.68;
    addCylinder(builder, 'steelDark', 0.026, 0.026, 0.5, 8, px, 0.56, s.z + 0.05);
    addCylinder(builder, 'steelDark', 0.026, 0.026, 0.42, 8, px, 0.76, s.z + 0.05, 0, 0, Math.PI / 2);
  }

  // Wall shelf with cleaning supplies and paper towel.
  addBox(builder, 'steel', 2.7, 0.035, 0.28, s.x, 1.76, backZ - 0.12);
  for (const side of [-1, 1]) {
    builder.add(
      'steelPolished',
      rodGeometry([s.x + side * 1.18, 1.75, backZ - 0.26], [s.x + side * 1.18, 1.48, backZ - 0.02], 0.008, 6),
      trs(0, 0, 0),
      { cast: false },
    );
  }
  for (let i = 0; i < 3; i += 1) {
    addCylinder(builder, 'cleaningBlue', 0.055, 0.06, 0.2 + i * 0.02, 14, s.x - 1.0 + i * 0.22, 1.87, backZ - 0.13);
    addCylinder(builder, 'whitePlastic', 0.02, 0.02, 0.04, 10, s.x - 1.0 + i * 0.22, 1.99, backZ - 0.13);
  }
  addBox(builder, 'whitePlastic', 0.22, 0.2, 0.16, s.x + 0.9, 1.9, backZ - 0.15);
  addBox(builder, 'steelPolished', 0.03, 0.18, 0.28, s.x + 1.22, 1.73, backZ - 0.13);
  // Soap dispensers.
  for (const side of [-1, 1]) {
    addBox(builder, 'whitePlastic', 0.1, 0.18, 0.08, s.x + side * 0.45, 1.5, backZ - 0.04);
    addBox(builder, 'steelDark', 0.04, 0.05, 0.03, s.x + side * 0.45, 1.39, backZ - 0.08, 0, { cast: false });
  }
}

/* --- Dish landing ------------------------------------------------- */

function addDishTable(builder, materials) {
  const d = WASH.dish;
  const topY = d.height;
  addBox(builder, 'steelPolished', d.width, 0.05, d.depth, d.x, topY - 0.025, d.z);
  addBox(builder, 'steel', d.width - 0.1, 0.1, d.depth - 0.08, d.x, topY - 0.12, d.z);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addBox(builder, 'steelDark', 0.045, topY - 0.08, 0.045, d.x + sx * (d.width / 2 - 0.06), (topY - 0.08) / 2, d.z + sz * (d.depth / 2 - 0.06));
    }
  }
  addBox(builder, 'steel', d.width - 0.08, 0.025, d.depth - 0.08, d.x, 0.23, d.z);
  // Dish rack.
  addBox(builder, 'steelDark', 0.52, 0.03, 0.4, d.x - 0.36, topY + 0.015, d.z);
  for (let i = 0; i < 5; i += 1) {
    addBox(builder, 'steel', 0.02, 0.24, 0.4, d.x - 0.58 + i * 0.11, topY + 0.15, d.z);
  }
  for (let i = 0; i < 4; i += 1) {
    addBox(builder, 'steel', 0.52, 0.02, 0.02, d.x - 0.36, topY + 0.08 + i * 0.06, d.z - 0.18 + i * 0.12);
  }
  // Plate stack and tray.
  for (let i = 0; i < 8; i += 1) {
    addCylinder(builder, 'ceramic', 0.14, 0.13, 0.018, 20, d.x + 0.45, topY + 0.012 + i * 0.019, d.z - 0.06, 0, 0, 0, { cast: false });
  }
  addBox(builder, 'steelDark', 0.44, 0.025, 0.34, d.x + 0.32, topY + 0.012, d.z + 0.2);
}

/* --- Heated pass counter ------------------------------------------ */

function addPrepCounter(builder, materials) {
  const p = PREP.counter;
  const topY = p.height;
  addBox(builder, 'steel', p.width, 0.85, p.depth, p.x, 0.45, p.z);
  addBox(builder, 'steelPolished', p.width + 0.02, 0.05, p.depth + 0.02, p.x, topY - 0.025, p.z);
  addBox(builder, 'steelDark', p.width - 0.12, 0.08, p.depth - 0.12, p.x, 0.04, p.z);
  for (const offset of [-1.15, 0, 1.15]) {
    addBox(builder, 'steel', 1.02, 0.48, 0.03, p.x + offset, 0.62, p.z + p.depth / 2 - 0.02, 0, { cast: false });
    addBox(builder, 'steelDark', 0.92, 0.38, 0.012, p.x + offset, 0.62, p.z + p.depth / 2 + 0.006, 0, { cast: false });
    addCylinder(builder, 'steelPolished', 0.012, 0.012, 0.24, 8, p.x + offset + 0.35, 0.8, p.z + p.depth / 2 + 0.02, 0, 0, Math.PI / 2, { cast: false });
  }
  addBox(builder, 'steelDark', p.width - 0.16, 0.12, p.depth - 0.16, p.x, 0.18, p.z, 0, { cast: false });

  // Heated serving table with four pans, glass sneeze guard and heat
  // lamps.
  const display = PREP.display;
  addBox(builder, 'steelPolished', display.width, 0.08, display.depth, display.x, topY + 0.035, display.z);
  const panX = [display.x - 0.89, display.x - 0.3, display.x + 0.3, display.x + 0.89];
  const fill = ['spiceBrown', 'herbGreen', 'saltWhite', 'cuttingRed'];
  panX.forEach((bx, index) => {
    addBox(builder, 'steelDark', 0.5, 0.04, 0.35, bx, topY + 0.09, display.z, 0, { cast: false });
    addBox(builder, 'steelPolished', 0.54, 0.035, 0.39, bx, topY + 0.105, display.z, 0, { cast: false });
    addBox(builder, 'blackPlastic', 0.46, 0.02, 0.31, bx, topY + 0.126, display.z, 0, { cast: false });
    addBox(builder, fill[index], 0.42, 0.012, 0.27, bx, topY + 0.138, display.z, 0, { cast: false });
    // Ladle standing in the pan.
    const lx = bx + 0.12;
    addCylinder(builder, 'steelPolished', 0.008, 0.008, 0.34, 8, lx, topY + 0.3, display.z - 0.04);
    addBowl(builder, 'steelDouble', 0.05, 0.035, lx, topY + 0.16, display.z - 0.04, 1, 0, 0, 0);
    addBox(builder, 'steelPolished', 0.07, 0.018, 0.018, lx + 0.04, topY + 0.46, display.z - 0.04, 0, { cast: false });
  });

  // Glass guard: front, two sides, steel posts and a top rail.
  addBox(builder, 'glass', display.width, 0.42, 0.012, display.x, topY + 0.34, display.z - display.depth / 2 - 0.02, 0, { cast: false, receive: false });
  for (const side of [-1, 1]) {
    addBox(builder, 'glass', 0.012, 0.42, display.depth, display.x + side * display.width / 2, topY + 0.34, display.z, 0, { cast: false, receive: false });
    for (const z of [display.z - display.depth / 2, display.z + display.depth / 2]) {
      addBox(builder, 'steelPolished', 0.035, 0.52, 0.035, display.x + side * display.width / 2, topY + 0.26, z);
    }
  }
  addBox(builder, 'steelPolished', display.width + 0.08, 0.025, 0.035, display.x, topY + 0.52, display.z - display.depth / 2 - 0.02);
  addBox(builder, 'steel', display.width + 0.1, 0.05, display.depth + 0.08, display.x, topY + 0.61, display.z);
  for (const lx of [display.x - 0.7, display.x, display.x + 0.7]) {
    addBox(builder, 'warmLamp', 0.38, 0.012, 0.1, lx, topY + 0.58, display.z, 0, { cast: false, receive: false });
  }
  // Stacked plates at the end.
  for (let i = 0; i < 6; i += 1) {
    addCylinder(builder, 'ceramic', 0.12, 0.11, 0.018, 20, p.x + 1.55, topY + 0.012 + i * 0.019, p.z - 0.2, 0, 0, 0, { cast: false });
  }
}

/* --- West wall rail, table and shelving --------------------------- */

function addWestWall(builder, materials) {
  const railX = -HALF_W + 0.17;
  const railY = 1.95;
  const z0 = WEST.railZ - WEST.railLength / 2;
  const z1 = WEST.railZ + WEST.railLength / 2;

  addCylinder(builder, 'steelPolished', 0.018, 0.018, WEST.railLength, 12, railX, railY, WEST.railZ, Math.PI / 2, 0, 0);
  for (const z of [z0 + 0.2, WEST.railZ, z1 - 0.2]) {
    builder.add('steelPolished', rodGeometry([-HALF_W + 0.02, railY, z], [railX, railY, z], 0.012, 8), trs(0, 0, 0));
    addBox(builder, 'steelDark', 0.05, 0.14, 0.05, -HALF_W + 0.03, railY, z, 0, { cast: false });
  }

  // S-hooks.
  const hookZ = [z0 + 0.32, z0 + 0.74, z0 + 1.16, z0 + 1.58, z0 + 2.0, z0 + 2.42];
  for (const z of hookZ) {
    builder.add(
      'steelPolished',
      arcTorus(0.045, 0.007, 6, 16, Math.PI * 1.65),
      trs(railX, railY - 0.07, z, Math.PI / 2),
    );
  }

  // Two hanging woks, a frying pan, a skimmer and a ladle. Their handles
  // reach up to the rail; nothing floats.
  for (const z of [z0 + 0.62, z0 + 1.46]) {
    addBowl(builder, 'castIron', 0.23, 0.1, railX + 0.11, railY - 0.48, z, 1, 0, 0, -Math.PI / 2);
    addCylinder(builder, 'blackPlastic', 0.018, 0.022, 0.36, 10, railX + 0.08, railY - 0.27, z, 0, 0, 0.18);
    builder.add('steelPolished', rodGeometry([railX + 0.06, railY - 0.11, z], [railX, railY - 0.02, z], 0.007, 6), trs(0, 0, 0), { cast: false });
  }
  // Frying pan, bowl facing the room.
  addCylinder(builder, 'castIron', 0.18, 0.18, 0.035, 24, railX + 0.09, railY - 0.5, z0 + 2.12, 0, 0, Math.PI / 2);
  addCylinder(builder, 'castIron', 0.17, 0.17, 0.02, 24, railX + 0.115, railY - 0.5, z0 + 2.12, 0, 0, Math.PI / 2);
  addCylinder(builder, 'blackPlastic', 0.018, 0.022, 0.34, 10, railX + 0.13, railY - 0.29, z0 + 2.12, 0, 0, 0.1);
  // Skimmer: long handle and a perforated disc.
  addCylinder(builder, 'steelPolished', 0.009, 0.009, 0.45, 8, railX + 0.09, railY - 0.3, z0 + 0.28);
  addCylinder(builder, 'steelDark', 0.12, 0.12, 0.012, 20, railX + 0.09, railY - 0.54, z0 + 0.28, 0, 0, Math.PI / 2);
  for (let i = 0; i < 6; i += 1) {
    addBox(builder, 'blackPlastic', 0.006, 0.006, 0.16, railX + 0.1, railY - 0.54, z0 + 0.28 - 0.08 + i * 0.032, 0, { cast: false });
  }
  // Ladle.
  addCylinder(builder, 'steelPolished', 0.009, 0.009, 0.46, 8, railX + 0.1, railY - 0.3, z1 - 0.32);
  addBowl(builder, 'steelDouble', 0.075, 0.045, railX + 0.1, railY - 0.56, z1 - 0.32, 1, 0, 0, 0);

  // Stainless prep table under the rail.
  const p = WEST.prep;
  const topY = p.height;
  addBox(builder, 'steelPolished', p.depth, 0.05, p.width, p.x, topY - 0.025, p.z);
  addBox(builder, 'steel', p.depth - 0.08, 0.12, p.width - 0.1, p.x, topY - 0.12, p.z);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addBox(builder, 'steelDark', 0.045, topY - 0.06, 0.045, p.x + sx * (p.depth / 2 - 0.06), (topY - 0.06) / 2, p.z + sz * (p.width / 2 - 0.06));
    }
  }
  addBox(builder, 'steel', p.depth - 0.08, 0.025, p.width - 0.08, p.x, 0.24, p.z);
  addRounded(builder, 'cuttingWhite', 0.38, 0.03, 0.5, 0.008, p.x + 0.06, topY + 0.015, p.z - 0.52, 0.04);
  addBowl(builder, 'steelDouble', 0.2, 0.09, p.x + 0.02, topY + 0.03, p.z + 0.32);
  addCylinder(builder, 'steel', 0.13, 0.14, 0.22, 18, p.x + 0.02, topY + 0.13, p.z + 0.8);
  addCylinder(builder, 'steelPolished', 0.12, 0.12, 0.012, 18, p.x + 0.02, topY + 0.245, p.z + 0.8);

  // Second west-wall prep table in the long south half of the room.
  const ps = WEST.prepSouth;
  addBox(builder, 'steelPolished', ps.depth, 0.05, ps.width, ps.x, ps.height - 0.025, ps.z);
  addBox(builder, 'steel', ps.depth - 0.08, 0.12, ps.width - 0.1, ps.x, ps.height - 0.12, ps.z);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addBox(builder, 'steelDark', 0.045, ps.height - 0.06, 0.045, ps.x + sx * (ps.depth / 2 - 0.06), (ps.height - 0.06) / 2, ps.z + sz * (ps.width / 2 - 0.06));
    }
  }
  addBox(builder, 'steel', ps.depth - 0.08, 0.025, ps.width - 0.08, ps.x, 0.24, ps.z);
  addRounded(builder, 'cuttingWhite', 0.38, 0.03, 0.5, 0.008, ps.x + 0.04, ps.height + 0.015, ps.z - 0.5, -0.04);
  addBox(builder, 'greenBin', 0.42, 0.28, 0.5, ps.x, 0.5, ps.z + 0.48, 0, { cast: false });

  // Three-tier shelving unit.
  const sh = WEST.shelf;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addCylinder(builder, 'steel', 0.02, 0.02, sh.height, 8, sh.x + sx * (sh.depth / 2 - 0.04), sh.height / 2, sh.z + sz * (sh.width / 2 - 0.04));
    }
  }
  for (const y of [0.34, 0.78, 1.22, 1.72]) {
    addBox(builder, 'steel', sh.depth, 0.03, sh.width, sh.x, y, sh.z);
    addBox(builder, 'steelDark', sh.depth - 0.06, 0.014, 0.026, sh.x, y + 0.02, sh.z - sh.width / 2 + 0.06, 0, { cast: false });
  }
  // Pots, pans and ingredient tubs.
  addCylinder(builder, 'steel', 0.18, 0.19, 0.32, 20, sh.x, 0.51, sh.z - 0.58);
  addCylinder(builder, 'steelPolished', 0.17, 0.17, 0.012, 20, sh.x, 0.675, sh.z - 0.58);
  addCylinder(builder, 'steel', 0.15, 0.16, 0.27, 20, sh.x, 0.48, sh.z - 0.18);
  addCylinder(builder, 'steelPolished', 0.14, 0.14, 0.012, 20, sh.x, 0.62, sh.z - 0.18);
  addBox(builder, 'steelDark', 0.44, 0.025, 0.52, sh.x, 0.8, sh.z + 0.38);
  addBox(builder, 'steelDark', 0.42, 0.025, 0.48, sh.x, 0.84, sh.z + 0.38);
  addBox(builder, 'greenBin', 0.46, 0.3, 0.54, sh.x, 1.39, sh.z + 0.46);
  addBox(builder, 'whitePlastic', 0.46, 0.28, 0.54, sh.x, 1.38, sh.z - 0.5);
  addCylinder(builder, 'steel', 0.16, 0.17, 0.26, 18, sh.x, 1.87, sh.z - 0.15);
  addCylinder(builder, 'steelPolished', 0.15, 0.15, 0.012, 18, sh.x, 2.006, sh.z - 0.15);
}

/* --- Small mechanical details ------------------------------------- */

function addElectricalPanel(builder) {
  const x = HALF_W - 0.09;
  addBox(builder, 'steel', 0.12, 0.52, 0.36, x, 1.5, 0.55);
  addBox(builder, 'steelPolished', 0.02, 0.46, 0.3, x - 0.06, 1.5, 0.55);
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 2; col += 1) {
      addBox(builder, 'blackPlastic', 0.014, 0.09, 0.06, x - 0.08, 1.63 - row * 0.13, 0.47 + col * 0.14, 0, { cast: false });
      addBox(builder, 'fireRed', 0.006, 0.02, 0.03, x - 0.088, 1.66 - row * 0.13, 0.47 + col * 0.14, 0, { cast: false });
    }
  }
}

function addExtinguisher(builder) {
  const x = -HALF_W + 0.25;
  const z = 9.8;
  addBox(builder, 'steelDark', 0.1, 0.06, 0.22, x, 1.28, z);
  addCylinder(builder, 'fireRed', 0.1, 0.1, 0.46, 20, x, 0.98, z);
  addCylinder(builder, 'blackPlastic', 0.052, 0.07, 0.08, 16, x, 1.24, z);
  addBox(builder, 'steelPolished', 0.04, 0.08, 0.05, x, 1.29, z);
  builder.add(
    'rubber',
    tubeGeometry(
      [
        [x + 0.08, 1.25, z],
        [x + 0.18, 1.14, z + 0.03],
        [x + 0.14, 0.95, z + 0.06],
        [x + 0.03, 0.86, z + 0.06],
      ],
      0.014,
      18,
      6,
    ),
    trs(0, 0, 0),
  );
  addCylinder(builder, 'blackPlastic', 0.018, 0.022, 0.1, 10, x + 0.02, 0.8, z + 0.06);
  addBox(builder, 'hazardYellow', 0.06, 0.16, 0.22, x, 0.94, z, 0, { cast: false });
}

function addWasteBin(builder) {
  const x = 5.3;
  const z = 9.7;
  addCylinder(builder, 'steelDark', 0.28, 0.25, 0.66, 20, x, 0.33, z);
  addCylinder(builder, 'blackPlastic', 0.29, 0.29, 0.035, 20, x, 0.68, z);
  addBox(builder, 'blackPlastic', 0.16, 0.035, 0.07, x, 0.72, z - 0.25);
  addBox(builder, 'steelPolished', 0.09, 0.035, 0.06, x, 0.08, z + 0.24);
  addBox(builder, 'steelDark', 0.06, 0.018, 0.22, x, 0.04, z + 0.24);
}

/* --- North-wall hand sink, fire blanket and floor mats ------------- */

function addHandSink(builder) {
  const x = -5.15;
  const z = -10.65;
  const topY = 0.94;

  addBox(builder, 'steelPolished', 0.56, 0.05, 0.48, x, topY - 0.025, z);
  addBox(builder, 'steelDark', 0.44, 0.3, 0.36, x, topY - 0.22, z);
  addBox(builder, 'steel', 0.05, 0.55, 0.05, x - 0.24, 0.31, z + 0.16);
  addBox(builder, 'steel', 0.05, 0.55, 0.05, x + 0.24, 0.31, z + 0.16);
  addBox(builder, 'steelDark', 0.44, 0.04, 0.32, x, 0.12, z);
  // Basin and drain.
  addBox(builder, 'steelDark', 0.32, 0.02, 0.25, x, 0.77, z);
  addBox(builder, 'steel', 0.02, 0.16, 0.25, x - 0.16, 0.85, z);
  addBox(builder, 'steel', 0.02, 0.16, 0.25, x + 0.16, 0.85, z);
  addBox(builder, 'steel', 0.32, 0.16, 0.02, x, 0.85, z - 0.125);
  addBox(builder, 'steel', 0.32, 0.16, 0.02, x, 0.85, z + 0.125);
  addCylinder(builder, 'steelDark', 0.032, 0.032, 0.01, 12, x, 0.782, z, 0, 0, 0, { cast: false });
  // Gooseneck faucet and wrist handles.
  builder.add(
    'steelPolished',
    tubeGeometry(
      [
        [x, topY, z - 0.21],
        [x, topY + 0.25, z - 0.21],
        [x, topY + 0.3, z - 0.11],
        [x, topY + 0.22, z - 0.01],
      ],
      0.018,
      18,
      8,
    ),
    trs(0, 0, 0),
  );
  for (const side of [-1, 1]) {
    addCylinder(builder, 'steelPolished', 0.025, 0.025, 0.04, 12, x + side * 0.14, topY + 0.12, z - 0.21, Math.PI / 2, 0, 0);
    addBox(builder, 'blackPlastic', 0.02, 0.05, 0.09, x + side * 0.14, topY + 0.12, z - 0.16, 0, { cast: false });
  }
  // Soap and paper towel above the sink.
  addBox(builder, 'steelPolished', 0.7, 0.035, 0.26, x, 1.53, z - 0.16);
  addBox(builder, 'whitePlastic', 0.17, 0.2, 0.12, x - 0.18, 1.65, z - 0.17);
  addBox(builder, 'steelDark', 0.04, 0.05, 0.03, x - 0.18, 1.54, z - 0.12, 0, { cast: false });
  addBox(builder, 'whitePlastic', 0.28, 0.24, 0.1, x + 0.16, 1.66, z - 0.18);
  addBox(builder, 'whitePlastic', 0.22, 0.16, 0.006, x + 0.16, 1.53, z - 0.12, 0, { cast: false });
  addBox(builder, 'steelPolished', 0.32, 0.03, 0.06, x + 0.16, 1.76, z - 0.17, 0, { cast: false });
  // A small folded towel on the counter.
  addBox(builder, 'whitePlastic', 0.15, 0.018, 0.11, x + 0.19, topY + 0.012, z + 0.08, 0.1, { cast: false });
}

function addFireBlanket(builder) {
  const x = 3.4;
  const z = -HALF_D + 0.035;
  addBox(builder, 'fireRed', 0.3, 0.38, 0.09, x, 1.42, z);
  addBox(builder, 'blackPlastic', 0.32, 0.04, 0.1, x, 1.63, z + 0.005, 0, { cast: false });
  addBox(builder, 'hazardYellow', 0.1, 0.2, 0.012, x, 1.4, z + 0.05, 0, { cast: false });
  addBox(builder, 'steelDark', 0.18, 0.02, 0.02, x, 1.22, z + 0.04, 0, { cast: false });
}

function addSafetyCone(builder) {
  const x = -5.2;
  const z = 8.6;
  addBox(builder, 'blackPlastic', 0.32, 0.035, 0.32, x, 0.018, z);
  addCylinder(builder, 'safetyOrange', 0.028, 0.15, 0.44, 16, x, 0.25, z);
  addCylinder(builder, 'whitePlastic', 0.085, 0.105, 0.06, 16, x, 0.3, z, 0, 0, 0, { cast: false });
  addBox(builder, 'safetyOrange', 0.12, 0.02, 0.02, x, 0.48, z, 0, { cast: false });
}

function addFloorMats(builder) {
  const mats = [
    { x: -3.2, z: -9.2, w: 2.45, d: 0.82 },
    { x: -3.2, z: 9.55, w: 3.0, d: 0.82 },
    { x: 3.7, z: 9.55, w: 2.4, d: 0.8 },
  ];
  for (const mat of mats) {
    addBox(builder, 'floorMat', mat.w + 0.06, 0.008, mat.d + 0.06, mat.x, 0.004, mat.z, 0, { cast: false });
    addBox(builder, 'floorMat', mat.w, 0.014, mat.d, mat.x, 0.011, mat.z, 0, { cast: false });
    // Perforation strips read as a commercial anti-fatigue mat.
    for (let i = 0; i < 7; i += 1) {
      addBox(builder, 'rubber', mat.w - 0.14, 0.003, 0.014, mat.x, 0.019, mat.z - mat.d / 2 + 0.08 + i * (mat.d - 0.16) / 6, 0, { cast: false });
    }
  }
}

export function buildEquipment(builder, materials) {
  addIsland(builder, materials);
  addRange(builder, materials);
  addSteamer(builder, materials);
  addOven(builder, materials);
  addNorthPrep(builder, materials);
  addSink(builder, materials);
  addDishTable(builder, materials);
  addPrepCounter(builder, materials);
  addWestWall(builder, materials);
  addHandSink(builder);
  addFireBlanket(builder);
  addSafetyCone(builder);
  addFloorMats(builder);
  addElectricalPanel(builder);
  addExtinguisher(builder);
  addWasteBin(builder);

  return {
    extraColliders: [
      { x: 5.3, z: 9.7, hx: 0.32, hz: 0.32 },
      { x: -5.15, z: -10.65, hx: 0.34, hz: 0.3 },
    ],
  };
}
