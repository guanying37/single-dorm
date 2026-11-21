import * as THREE from 'three';
import {
  BED,
  CART,
  CABINET,
  OP,
  TRAY,
  STEEL_CAB,
  WASTE,
  STOOL,
  PLANT,
} from './config.js';
import {
  boxGeometry,
  cylinderGeometry,
  roundedBoxGeometry,
  sphereGeometry,
  torusGeometry,
  trs,
  mergeGeometries,
  rodGeometry,
  bottleGeometry,
  kidneyDishGeometry,
  bowlGeometry,
  pothosLeafGeometry,
  starBaseGeometries,
} from './geometry.js';

/* ------------------------------------------------------------------ *
 * Infirmary furniture.
 *
 * Five mobile beds with white bedding, five bedside carts, the medicine
 * cabinet (sliding glass above / three pull-out wooden drawers below),
 * the tall steel supply cabinet, the operating table under a ceiling
 * surgical lamp, the instrument tray stand, the pedal waste bin, the
 * doctor's stool and the pothos in the corner.
 * ------------------------------------------------------------------ */

const BOX = (w, h, d, x, y, z, ry = 0) => {
  const geometry = boxGeometry(w, h, d);
  geometry.applyMatrix4(trs(x, y, z, ry));
  return geometry;
};

const RBOX = (w, h, d, r, x, y, z, ry = 0) => {
  const geometry = roundedBoxGeometry(w, h, d, r);
  geometry.applyMatrix4(trs(x, y, z, ry));
  return geometry;
};

const CYL = (rTop, rBottom, h, x, y, z, seg = 16) => {
  const geometry = cylinderGeometry(rTop, rBottom, h, seg);
  geometry.applyMatrix4(trs(x, y, z));
  return geometry;
};

const WHEEL = (radius, width, x, y, z) => {
  const geometry = torusGeometry(radius, width, 8, 18);
  geometry.rotateY(Math.PI / 2);
  geometry.applyMatrix4(trs(x, y, z));
  return geometry;
};

/* --- Beds --------------------------------------------------------- */

function addBed(builder, z) {
  const cx = BED.centerX;
  const top = BED.frameTop;
  const length = 1.88;
  const width = BED.width - 0.02;

  // Frame and four legs with casters.
  builder.add('bedFrame', RBOX(length, 0.1, width, 0.03, cx, top - 0.05, z));
  builder.add('bedFrame', RBOX(length - 0.1, 0.04, width - 0.12, 0.018, cx, top - 0.115, z));
  for (const dx of [-0.78, 0.78]) {
    for (const dz of [-0.35, 0.35]) {
      builder.add('bedFrame', CYL(0.025, 0.025, 0.26, cx + dx, 0.3, z + dz, 10));
      builder.add('steelDark', WHEEL(0.055, 0.022, cx + dx, 0.065, z + dz));
      builder.add('steelDark', BOX(0.055, 0.012, 0.02, cx + dx, 0.07, z + dz + 0.05));
      // Brake pedal on one caster per end.
      if ((dx > 0 && dz > 0) || (dx < 0 && dz < 0)) {
        builder.add('rubber', BOX(0.045, 0.012, 0.07, cx + dx, 0.09, z + dz + 0.085));
      }
    }
  }

  // Head and foot boards, rounded and slightly proud.
  builder.add('bedFrame', RBOX(0.06, 0.5, width + 0.04, 0.028, -2.37, 0.74, z));
  builder.add('bedFrame', RBOX(0.05, 0.42, width + 0.02, 0.024, -0.585, 0.7, z));
  // A pale-blue inset panel in the headboard.
  builder.add('blanket', RBOX(0.012, 0.32, width - 0.18, 0.014, -2.344, 0.76, z));

  // Mattress, fitted sheet and pillow.
  builder.add('mattress', RBOX(1.78, 0.17, width - 0.04, 0.055, cx, 0.585, z));
  builder.add('sheet', RBOX(1.8, 0.035, width, 0.03, cx, 0.69, z));
  builder.add('pillow', RBOX(0.44, 0.12, 0.62, 0.05, -2.04, 0.755, z, 0.04));
  builder.add('pillow', RBOX(0.4, 0.03, 0.54, 0.02, -2.02, 0.72, z, 0.02));

  // Folded pale-blue blanket across the foot.
  builder.add('blanket', RBOX(0.64, 0.055, width - 0.02, 0.022, -0.94, 0.725, z));
  builder.add('blanket', RBOX(0.32, 0.035, width - 0.06, 0.016, -0.73, 0.745, z));
  // A narrow white turn-down.
  builder.add('sheet', RBOX(0.12, 0.04, width - 0.03, 0.015, -1.28, 0.735, z));

  // Side rails: two horizontal tubes and three posts on each side.
  for (const side of [-1, 1]) {
    const railZ = z + side * (width / 2 + 0.02);
    for (const y of [0.79, 0.9]) {
      builder.add('chrome', rodGeometry([cx - 0.57, y, railZ], [cx + 0.57, y, railZ], 0.011, 8));
    }
    for (const x of [cx - 0.55, cx, cx + 0.55]) {
      builder.add('chrome', rodGeometry([x, 0.73, railZ], [x, 0.9, railZ], 0.009, 7));
    }
  }

  // A small chart clip at the foot, blank paper only.
  builder.add('steelDark', BOX(0.16, 0.012, 0.02, -0.6, 0.68, z + 0.29));
  builder.add('paper', BOX(0.1, 0.012, 0.01, -0.6, 0.7, z + 0.3));
}

/* --- Bedside carts ------------------------------------------------ */

function addCart(builder, z, index) {
  const x = CART.x;
  const w = CART.width;
  const d = CART.depth;
  const h = CART.height;

  // Top tray with a raised lip.
  builder.add('plasticWhite', RBOX(w, 0.035, d, 0.012, x, h - 0.018, z));
  for (const side of [-1, 1]) {
    builder.add('steelDark', BOX(w, 0.03, 0.012, x, h + 0.005, z + side * (d / 2 - 0.006)));
    builder.add('steelDark', BOX(0.012, 0.03, d, x + side * (w / 2 - 0.006), h + 0.005, z));
  }
  // Lower shelf.
  builder.add('plasticWhite', RBOX(w - 0.03, 0.022, d - 0.02, 0.008, x, 0.3, z));
  // Four legs, casters and a push handle on the aisle side.
  for (const dx of [-1, 1]) {
    for (const dz of [-1, 1]) {
      builder.add('steelDark', CYL(0.012, 0.012, h - 0.12, x + dx * (w / 2 - 0.035), (h - 0.12) / 2 + 0.06, z + dz * (d / 2 - 0.035), 8));
      builder.add('rubber', WHEEL(0.032, 0.014, x + dx * (w / 2 - 0.035), 0.045, z + dz * (d / 2 - 0.035)));
    }
  }
  const handleX = x + w / 2 + 0.03;
  builder.add('chrome', rodGeometry([handleX, 0.56, z - d / 2 + 0.04], [handleX, 0.82, z - d / 2 + 0.04], 0.01, 7));
  builder.add('chrome', rodGeometry([handleX, 0.56, z + d / 2 - 0.04], [handleX, 0.82, z + d / 2 - 0.04], 0.01, 7));
  builder.add('chrome', rodGeometry([handleX, 0.82, z - d / 2 + 0.04], [handleX, 0.82, z + d / 2 - 0.04], 0.01, 7));

  // Personal items, varied per bed.
  const variant = index % 5;
  if (variant !== 1) {
    // Water cup.
    builder.add('plasticWhite', CYL(0.035, 0.03, 0.105, x + 0.08, h + 0.07, z - 0.06, 12));
    builder.add('water', CYL(0.028, 0.028, 0.012, x + 0.08, h + 0.1, z - 0.06, 12));
    builder.add('chrome', torusGeometry(0.025, 0.006, 5, 12), trs(x + 0.115, h + 0.075, z - 0.06, 0, 1, 1, 1, 0, Math.PI / 2));
  }
  if (variant === 0 || variant === 3) {
    // Tissue box.
    builder.add('paper', RBOX(0.14, 0.07, 0.12, 0.012, x - 0.02, h + 0.055, z + 0.09, 0.1));
    builder.add('packageBlue', BOX(0.06, 0.012, 0.005, x - 0.02, h + 0.088, z + 0.09));
  }
  if (variant === 2 || variant === 4) {
    // Folded towel.
    builder.add('blanket', RBOX(0.17, 0.035, 0.12, 0.012, x - 0.03, h + 0.04, z + 0.07, -0.05));
    builder.add('sheet', RBOX(0.15, 0.018, 0.1, 0.008, x - 0.03, h + 0.066, z + 0.07, -0.05));
  }
  if (variant === 1 || variant === 2) {
    // Kidney dish.
    const dish = kidneyDishGeometry(0.16, 0.1, 0.018);
    dish.applyMatrix4(trs(x - 0.04, h + 0.01, z - 0.02, 0.3));
    builder.add('steel', dish);
  }
}

/* --- Medicine cabinet -------------------------------------------- */

function addBottles(builder, counts) {
  const shelfY = [1.12, 1.35, 1.58, 1.81];
  const zStart = 0.63;
  const zStep = 0.17;
  for (let shelf = 0; shelf < 3; shelf += 1) {
    const y = shelfY[shelf] + 0.015;
    for (let i = 0; i < 7; i += 1) {
      const z = zStart + i * zStep;
      const radius = 0.025 + ((i + shelf) % 3) * 0.004;
      const height = 0.12 + ((i * 2 + shelf) % 4) * 0.022;
      const bottle = bottleGeometry(radius, height);
      bottle.applyMatrix4(trs(2.27 + ((i + shelf) % 2) * 0.05, y, z));
      builder.add('bottleWhite', bottle);
      builder.add('bottleCap', CYL(radius * 0.7, radius * 0.7, 0.022, 2.27 + ((i + shelf) % 2) * 0.05, y + height + 0.011, z, 10));
      const labelKey = ['labelBlue', 'labelRed', 'labelGreen'][(i + shelf) % 3];
      builder.add(labelKey, CYL(radius + 0.0008, radius + 0.0008, height * 0.3, 2.27 + ((i + shelf) % 2) * 0.05, y + height * 0.44, z, 14));
      counts.bottles += 1;
    }
    // One glass jar per shelf.
    const jarZ = zStart + 7 * zStep + 0.03;
    builder.add('jarGlass', CYL(0.042, 0.04, 0.12, 2.3, y + 0.06, jarZ, 14));
    builder.add('steel', CYL(0.043, 0.043, 0.012, 2.3, y + 0.126, jarZ, 14));
    counts.jars += 1;
  }
}

function buildGlassPanel(materials, width, height, cx, cy, cz, offsetZ) {
  const group = new THREE.Group();
  group.name = 'cabinet-glass-panel';
  const frameGeoms = [];
  const bar = 0.018;
  frameGeoms.push(BOX(0.018, height, bar, 0, 0, -width / 2));
  frameGeoms.push(BOX(0.018, height, bar, 0, 0, width / 2));
  frameGeoms.push(BOX(0.018, bar, width, 0, height / 2, 0));
  frameGeoms.push(BOX(0.018, bar, width, 0, -height / 2, 0));
  // A vertical pull on the inner edge.
  frameGeoms.push(BOX(0.024, 0.22, 0.022, -0.006, 0, offsetZ));
  const frame = new THREE.Mesh(mergeGeometries(frameGeoms), materials.aluminum);
  frame.name = 'glass-panel-frame';
  frame.castShadow = false;
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(width - bar, height - bar), materials.glass);
  pane.rotation.y = -Math.PI / 2;
  pane.position.x = -0.002;
  pane.name = 'glass-pane';
  pane.castShadow = false;
  pane.renderOrder = 2;
  group.add(frame, pane);
  group.position.set(cx, cy, cz);
  return group;
}

function buildDrawer(materials, index, y) {
  const group = new THREE.Group();
  group.name = `cabinet-drawer-${index + 1}`;
  const width = CABINET.width - 0.06;
  const height = CABINET.drawerHeight - 0.02;

  // Front.
  const front = new THREE.Mesh(
    RBOX(0.026, height, width, 0.008, -0.013, 0, 0),
    materials.wood,
  );
  front.name = `drawer-${index + 1}-front`;
  front.castShadow = false;
  group.add(front);

  // A simple stainless bar pull.
  const handle = new THREE.Mesh(BOX(0.022, 0.02, 0.18, -0.036, 0.085, 0), materials.chrome);
  handle.name = `drawer-${index + 1}-handle`;
  handle.castShadow = false;
  group.add(handle);

  // Drawer box.
  const boxGeoms = [];
  boxGeoms.push(BOX(0.34, 0.016, width - 0.04, 0.18, -height / 2 + 0.012, 0));
  boxGeoms.push(BOX(0.34, height - 0.04, 0.016, 0.18, 0.005, -(width / 2 - 0.02)));
  boxGeoms.push(BOX(0.34, height - 0.04, 0.016, 0.18, 0.005, width / 2 - 0.02));
  boxGeoms.push(BOX(0.016, height - 0.04, width - 0.04, 0.345, 0.005, 0));
  const boxMesh = new THREE.Mesh(mergeGeometries(boxGeoms), materials.plasticWhite);
  boxMesh.name = `drawer-${index + 1}-box`;
  boxMesh.castShadow = false;
  group.add(boxMesh);

  // Rectangular supply packages inside. Two material groups so the
  // drawer reads as stocked without adding draw calls.
  const whiteGeoms = [];
  const blueGeoms = [];
  for (let i = 0; i < 4; i += 1) {
    const z = -0.46 + i * 0.3;
    const w = 0.2 + (i % 2) * 0.05;
    const h = 0.07 + (i % 3) * 0.018;
    const d = 0.24;
    const yLocal = -height / 2 + 0.03 + h / 2;
    const xLocal = 0.13 + (i % 2) * 0.04;
    const target = i % 2 === 0 ? blueGeoms : whiteGeoms;
    target.push(BOX(w, h, d, xLocal, yLocal, z, (i - 1.5) * 0.03));
    target.push(BOX(w * 0.45, 0.004, d * 0.5, xLocal, yLocal + h / 2 + 0.002, z, (i - 1.5) * 0.03));
  }
  for (const [geoms, material, name] of [
    [whiteGeoms, materials.packageWhite, 'package-white'],
    [blueGeoms, materials.packageBlue, 'package-blue'],
  ]) {
    if (!geoms.length) continue;
    const mesh = new THREE.Mesh(mergeGeometries(geoms), material);
    mesh.name = name;
    mesh.castShadow = false;
    group.add(mesh);
  }

  group.position.set(CABINET.frontX - 0.002, y, CABINET.z);
  return group;
}

function buildMedicineCabinet(builder, materials, root, counts) {
  const { backX, frontX, centerX, z, width, depth, height, toeKick, lowerTop, upperTop } = CABINET;
  const z0 = z - width / 2;
  const z1 = z + width / 2;
  const carcassX0 = backX - depth + 0.02;
  const carcassX1 = backX;

  // Carcass: back, sides, top, bottom, mid rail and toe kick.
  builder.add('plasticWhite', BOX(0.02, height, width, backX - 0.01, height / 2, z));
  for (const side of [-1, 1]) {
    builder.add('plasticWhite', BOX(depth - 0.02, height, 0.02, (carcassX0 + carcassX1) / 2, height / 2, z + side * (width / 2 - 0.01)));
  }
  builder.add('plasticWhite', BOX(depth, 0.03, width, (carcassX0 + carcassX1) / 2, height - 0.015, z));
  builder.add('plasticWhite', BOX(depth, 0.03, width, (carcassX0 + carcassX1) / 2, 0.015, z));
  builder.add('plasticWhite', BOX(depth, 0.035, width, (carcassX0 + carcassX1) / 2, lowerTop, z));
  builder.add('plasticWhite', BOX(depth - 0.04, toeKick, width - 0.04, (carcassX0 + carcassX1) / 2 - 0.02, toeKick / 2, z));
  builder.add('steelDark', BOX(0.01, 0.012, width - 0.08, frontX - 0.03, 0.07, z));

  // Upper interior: white back and three glass shelves.
  builder.add('plasticWhite', BOX(0.012, upperTop - lowerTop, width - 0.06, backX - 0.035, (lowerTop + upperTop) / 2, z));
  const shelfY = [1.13, 1.36, 1.59, 1.82];
  for (const y of shelfY) {
    builder.add('glassShelf', BOX(depth - 0.07, 0.012, width - 0.07, (carcassX0 + carcassX1) / 2, y, z));
    // Thin aluminium shelf clips on both sides.
    for (const side of [-1, 1]) {
      builder.add('aluminum', BOX(0.025, 0.018, 0.02, frontX - 0.03, y - 0.006, z + side * (width / 2 - 0.04)));
    }
  }

  // Lower interior dividers between the three drawers.
  for (const y of [0.12, 0.42, 0.72, 1.02]) {
    builder.add('plasticWhite', BOX(depth - 0.06, 0.018, width - 0.04, (carcassX0 + carcassX1) / 2, y, z));
  }

  // A pale-blue back liner makes the white bottles read through the glass.
  builder.add('blanket', BOX(0.01, upperTop - lowerTop - 0.04, width - 0.08, backX - 0.045, (lowerTop + upperTop) / 2, z));
  // Light-oak outer frame around the glass section.
  const frameX = frontX - 0.012;
  for (const side of [-1, 1]) {
    builder.add('wood', BOX(0.026, upperTop - lowerTop + 0.05, 0.05, frameX, (lowerTop + upperTop) / 2, z + side * (width / 2 - 0.025)));
  }
  builder.add('wood', BOX(0.026, 0.06, width + 0.02, frameX, upperTop + 0.018, z));
  builder.add('wood', BOX(0.026, 0.05, width + 0.02, frameX, lowerTop + 0.018, z));
  builder.add('wood', BOX(0.026, 0.045, width + 0.02, frameX, 0.1, z));

  addBottles(builder, counts);

  // Sliding glass doors: two panels, the west one slides behind the east.
  const doorGroup = new THREE.Group();
  doorGroup.name = 'cabinet-glass-doors';
  const panelWidth = width / 2 - 0.015;
  const panelCY = (1.13 + 1.95) / 2;
  const panelA = buildGlassPanel(materials, panelWidth, 0.82, frontX + 0.004, panelCY, z - width / 4 + 0.005, panelWidth / 2 - 0.02);
  const panelB = buildGlassPanel(materials, panelWidth, 0.82, frontX - 0.014, panelCY, z + width / 4 - 0.005, -panelWidth / 2 + 0.02);
  // Panel A is the moving one; it belongs to the interactive group.
  doorGroup.add(panelA, panelB);
  root.add(doorGroup);

  // Three pull-out wooden drawers.
  const drawers = [];
  for (let i = 0; i < 3; i += 1) {
    const drawer = buildDrawer(materials, i, 0.28 + i * 0.3);
    root.add(drawer);
    drawers.push(drawer);
  }

  // A small stainless kick strip and side scribes.
  builder.add('steelDark', BOX(0.012, 0.02, width, frontX - 0.002, 0.012, z));

  return { doorGroup, panelA, panelB, drawers, counts };
}

/* --- Steel supply cabinet ---------------------------------------- */

function buildSteelCabinet(builder) {
  const { x, z, width, depth, height } = STEEL_CAB;
  const frontX = x - depth / 2;
  const backX = x + depth / 2;
  // Shell: back, sides, top and bottom. The front is filled by two doors.
  builder.add('steelDark', BOX(0.018, height - 0.08, width, backX - 0.012, 0.08 + (height - 0.08) / 2, z));
  for (const side of [-1, 1]) {
    builder.add('cabinetSteel', BOX(depth, height - 0.08, 0.018, x, 0.08 + (height - 0.08) / 2, z + side * (width / 2 - 0.009)));
  }
  builder.add('cabinetSteel', BOX(depth, 0.03, width, x, height - 0.015, z));
  builder.add('cabinetSteel', BOX(depth, 0.03, width, x, 0.085, z));
  builder.add('steelDark', BOX(depth - 0.04, 0.07, width - 0.04, x, 0.035, z));
  // Three internal shelves, glimpsed only if a door is left ajar.
  for (const y of [0.55, 1.0, 1.45]) {
    builder.add('steelDark', BOX(depth - 0.05, 0.016, width - 0.06, x, y, z));
  }
  // Two doors, seams, vent slots and handles on the room-facing side.
  for (const side of [-1, 1]) {
    builder.add('cabinetSteel', BOX(0.018, height - 0.16, width / 2 - 0.014, frontX + 0.009, height / 2 + 0.01, z + side * (width / 4)));
    builder.add('steelDark', BOX(0.012, height - 0.18, 0.01, frontX + 0.001, height / 2 + 0.01, z + side * (width / 2 - 0.025)));
    for (let i = 0; i < 5; i += 1) {
      for (const y of [0.26 + i * 0.05, height - 0.26 - i * 0.05]) {
        builder.add('steelDark', BOX(0.006, 0.014, 0.16, frontX - 0.003, y, z + side * (width / 4)));
      }
    }
    builder.add('chrome', BOX(0.024, 0.16, 0.024, frontX - 0.018, 1.0, z + side * 0.07));
  }
  // Blank label holder.
  builder.add('plasticWhite', BOX(0.006, 0.06, 0.22, frontX - 0.006, 1.42, z));
  builder.add('labelBlue', BOX(0.004, 0.042, 0.18, frontX - 0.01, 1.42, z));
  // Top edge trim.
  builder.add('aluminum', BOX(depth + 0.01, 0.018, width + 0.01, x, height - 0.005, z));
}

/* --- Operating table --------------------------------------------- */

function buildOperatingTable(builder) {
  const { x, z, length, width, topY } = OP;
  // Five-star base with casters.
  for (const { geometry, matrix } of starBaseGeometries(0.34, 0.06, 0.05)) {
    builder.add('steelDark', geometry, matrix.clone().setPosition(x, 0.08, z));
  }
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2;
    builder.add('rubber', WHEEL(0.05, 0.018, x + Math.cos(angle) * 0.33, 0.055, z + Math.sin(angle) * 0.33));
  }
  builder.add('steelDark', CYL(0.16, 0.2, 0.06, x, 0.1, z, 18));
  // Lift column and housing.
  builder.add('chrome', CYL(0.075, 0.085, 0.46, x, 0.36, z, 18));
  builder.add('steel', RBOX(0.2, 0.3, 0.24, 0.02, x, 0.52, z));
  builder.add('steelDark', BOX(0.22, 0.025, 0.26, x, 0.68, z));
  // Table frame.
  builder.add('steel', RBOX(width - 0.02, 0.07, length - 0.08, 0.022, x, 0.74, z));
  // Padded sections: head, torso, legs.
  builder.add('opPad', RBOX(width - 0.04, 0.1, 0.42, 0.035, x, topY - 0.05, z - 0.68));
  builder.add('opPad', RBOX(width - 0.02, 0.12, 0.72, 0.04, x, topY - 0.06, z - 0.06));
  builder.add('opPad', RBOX(width - 0.04, 0.1, 0.52, 0.035, x, topY - 0.05, z + 0.61));
  builder.add('opPadBlue', RBOX(width - 0.1, 0.012, 0.3, 0.02, x, topY + 0.006, z + 0.62));
  // Headrest.
  builder.add('opPad', RBOX(0.32, 0.06, 0.2, 0.025, x, topY + 0.04, z - 0.88));
  // Side rails and posts.
  for (const side of [-1, 1]) {
    const railX = x + side * (width / 2 + 0.045);
    builder.add('chrome', rodGeometry([railX, 0.93, z - 0.86], [railX, 0.93, z + 0.8], 0.014, 8));
    builder.add('chrome', rodGeometry([railX, 0.86, z - 0.86], [railX, 0.93, z - 0.86], 0.011, 7));
    builder.add('chrome', rodGeometry([railX, 0.86, z + 0.8], [railX, 0.93, z + 0.8], 0.011, 7));
    builder.add('chrome', rodGeometry([railX, 0.86, z - 0.02], [railX, 0.93, z - 0.02], 0.011, 7));
  }
  // Control handle at the foot and a small side brake lever.
  builder.add('chrome', rodGeometry([x + 0.24, 0.85, z + 0.99], [x + 0.36, 1.02, z + 1.03], 0.014, 8));
  builder.add('rubber', CYL(0.03, 0.03, 0.09, x + 0.37, 1.05, z + 1.03, 10));
}

/* --- Ceiling surgical lamp --------------------------------------- */

function buildSurgicalLamp(builder) {
  const x = OP.x;
  const z = OP.z;
  const ceilingY = 2.99;
  // Ceiling rose, drop tube and first joint.
  builder.add('plasticWhite', CYL(0.16, 0.17, 0.045, x, ceilingY - 0.022, z, 24));
  builder.add('steel', CYL(0.026, 0.026, 0.2, x, ceilingY - 0.14, z, 12));
  builder.add('chrome', sphereGeometry(0.048, 16, 12), trs(x, 2.79, z));
  // Two articulated arms.
  builder.add('steel', rodGeometry([x, 2.79, z], [x - 0.2, 2.68, z + 0.1], 0.033, 9));
  builder.add('chrome', sphereGeometry(0.045, 16, 12), trs(x - 0.22, 2.66, z + 0.11));
  builder.add('steel', rodGeometry([x - 0.22, 2.66, z + 0.11], [x, 2.48, z], 0.032, 9));
  builder.add('chrome', sphereGeometry(0.04, 16, 12), trs(x, 2.46, z));

  // Lamp housing: a shallow conical shell opening down.
  const housingY = 2.28;
  const housing = new THREE.CylinderGeometry(0.24, 0.4, 0.18, 32, 1, true);
  housing.translate(0, housingY + 0.09, 0);
  housing.applyMatrix4(trs(x, 0, z));
  builder.add('plasticWhite', housing, null, { cast: true, receive: true });
  builder.add('steel', torusGeometry(0.395, 0.018, 8, 40), trs(x, housingY + 0.005, z, 0, 1, 1, 1, Math.PI / 2));
  // Emissive inner disc and six lens rings.
  builder.add('surgicalInner', CYL(0.365, 0.365, 0.008, x, housingY + 0.012, z, 32), null, { cast: false, receive: false });
  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2 + 0.2;
    const lx = x + Math.cos(angle) * 0.2;
    const lz = z + Math.sin(angle) * 0.2;
    builder.add('surgicalLens', CYL(0.062, 0.062, 0.012, lx, housingY + 0.001, lz, 20), null, { cast: false, receive: false });
    builder.add('steel', torusGeometry(0.065, 0.007, 6, 18), trs(lx, housingY + 0.006, lz, 0, 1, 1, 1, Math.PI / 2));
  }
  // Central handle and a small status light.
  builder.add('chrome', torusGeometry(0.09, 0.012, 7, 20), trs(x, housingY - 0.11, z, 0, 1, 1, 1, Math.PI / 2));
  builder.add('chrome', rodGeometry([x, housingY - 0.11, z], [x, housingY - 0.02, z], 0.012, 8));
  builder.add('ledGreen', CYL(0.012, 0.012, 0.006, x + 0.3, housingY + 0.14, z, 10), null, { cast: false, receive: false });
}

/* --- Instrument tray stand --------------------------------------- */

function addInstruments(builder) {
  const y = TRAY.topY + 0.012;
  const x = TRAY.x;
  const z = TRAY.z;
  // Scalpel.
  builder.add('instrumentHandle', BOX(0.16, 0.008, 0.018, x - 0.12, y + 0.006, z - 0.09));
  builder.add('instrumentSteel', BOX(0.05, 0.003, 0.014, x - 0.015, y + 0.007, z - 0.09, 0.1));
  // Forceps, two arms meeting at a hinge.
  builder.add('instrumentSteel', BOX(0.15, 0.004, 0.008, x - 0.09, y + 0.007, z + 0.01, 0.08));
  builder.add('instrumentSteel', BOX(0.15, 0.004, 0.008, x - 0.09, y + 0.007, z + 0.04, -0.08));
  builder.add('instrumentSteel', CYL(0.008, 0.008, 0.012, x - 0.16, y + 0.007, z + 0.025, 8));
  // Scissors: two crossed blades and two finger rings.
  builder.add('instrumentSteel', BOX(0.11, 0.003, 0.008, x + 0.07, y + 0.007, z - 0.06, 0.5));
  builder.add('instrumentSteel', BOX(0.11, 0.003, 0.008, x + 0.07, y + 0.007, z - 0.06, -0.5));
  for (const side of [-1, 1]) {
    builder.add('instrumentSteel', torusGeometry(0.017, 0.004, 5, 12), trs(x + 0.14, y + 0.007, z - 0.06 + side * 0.03, 0, 1, 1, 1, Math.PI / 2));
  }
  // Haemostat.
  builder.add('instrumentSteel', BOX(0.13, 0.004, 0.007, x + 0.05, y + 0.008, z + 0.09, 0.15));
  builder.add('instrumentSteel', BOX(0.13, 0.004, 0.007, x + 0.05, y + 0.008, z + 0.11, -0.15));
  builder.add('instrumentHandle', torusGeometry(0.02, 0.005, 5, 12), trs(x - 0.015, y + 0.008, z + 0.1, 0, 1, 1, 1, Math.PI / 2));
  // Syringe.
  builder.add('plasticWhite', CYL(0.012, 0.012, 0.09, x + 0.16, y + 0.018, z + 0.06, 10));
  builder.add('instrumentSteel', CYL(0.003, 0.003, 0.05, x + 0.16, y + 0.025, z + 0.12, 6));
  builder.add('instrumentHandle', CYL(0.016, 0.016, 0.008, x + 0.16, y + 0.065, z + 0.06, 10));
  // Small bowl and gauze.
  builder.add('instrumentSteel', bowlGeometry(0.07, 0.028, 24), trs(x - 0.19, y + 0.005, z + 0.1));
  builder.add('paper', RBOX(0.07, 0.012, 0.07, 0.004, x + 0.17, y + 0.008, z - 0.16, 0.2));
  builder.add('paper', RBOX(0.055, 0.01, 0.055, 0.004, x + 0.1, y + 0.007, z - 0.14, -0.3));
  // A spare scalpel blade packet.
  builder.add('packageBlue', BOX(0.09, 0.006, 0.06, x - 0.01, y + 0.006, z + 0.16, 0.4));
}

function buildTrayStand(builder, counts) {
  const { x, z, topY, width, depth } = TRAY;
  for (const { geometry, matrix } of starBaseGeometries(0.28, 0.05, 0.045)) {
    builder.add('steelDark', geometry, matrix.clone().setPosition(x, 0.07, z));
  }
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2;
    builder.add('rubber', WHEEL(0.042, 0.015, x + Math.cos(angle) * 0.27, 0.045, z + Math.sin(angle) * 0.27));
  }
  builder.add('steelDark', CYL(0.15, 0.18, 0.05, x, 0.09, z, 16));
  builder.add('chrome', CYL(0.028, 0.032, topY - 0.12, x, (topY - 0.12) / 2 + 0.09, z, 12));
  builder.add('steel', RBOX(width, 0.035, depth, 0.012, x, topY - 0.017, z));
  // Dark instrument mat, so the steel tools read against the tray.
  builder.add('stoolSeat', RBOX(width - 0.08, 0.006, depth - 0.07, 0.006, x, topY + 0.002, z));
  // Raised rim.
  for (const side of [-1, 1]) {
    builder.add('steel', BOX(width, 0.05, 0.018, x, topY + 0.012, z + side * (depth / 2 - 0.009)));
    builder.add('steel', BOX(0.018, 0.05, depth, x + side * (width / 2 - 0.009), topY + 0.012, z));
  }
  // Lower shelf with a spare tray and a covered instrument roll.
  builder.add('steel', RBOX(width - 0.08, 0.025, depth - 0.06, 0.008, x, 0.58, z));
  builder.add('steel', RBOX(0.3, 0.02, 0.2, 0.006, x - 0.06, 0.6, z + 0.02));
  builder.add('packageBlue', RBOX(0.22, 0.07, 0.14, 0.02, x + 0.06, 0.64, z - 0.02, 0.2));
  addInstruments(builder);
  counts.instruments += 12;
}

/* --- Waste bin, stool -------------------------------------------- */

function buildWasteBin(builder, materials, root) {
  const { x, z, radius, height } = WASTE;
  // Yellow body, dark base and red band are static.
  const body = new THREE.CylinderGeometry(radius, radius * 0.92, height - 0.08, 24, 1, true);
  body.translate(x, 0.04 + (height - 0.08) / 2, z);
  builder.add('wasteYellow', body);
  const bottom = new THREE.CylinderGeometry(radius * 0.92, radius * 0.9, 0.04, 24);
  bottom.translate(x, 0.02, z);
  builder.add('wasteDark', bottom);
  const band = new THREE.CylinderGeometry(radius + 0.002, radius + 0.002, 0.07, 24, 1, true);
  band.translate(x, height - 0.14, z);
  builder.add('wasteRed', band);
  const plaque = new THREE.PlaneGeometry(0.18, 0.18);
  plaque.translate(x, height * 0.54, z + radius + 0.003);
  builder.add('wasteSymbol', plaque, null, { cast: false, receive: false });
  const pedal = new THREE.BoxGeometry(0.13, 0.025, 0.16);
  pedal.translate(x, 0.018, z + radius + 0.05);
  builder.add('wasteDark', pedal, null, { cast: false });
  const link = new THREE.BoxGeometry(0.018, 0.16, 0.018);
  link.translate(x, 0.1, z + radius + 0.02);
  builder.add('steelDark', link);
  // Red bag visible when the lid is open.
  const bag = new THREE.CylinderGeometry(radius * 0.86, radius * 0.8, 0.1, 20);
  bag.translate(x, height - 0.11, z);
  builder.add('wasteRed', bag, null, { cast: false });

  // Hinged lid at the north edge. Open lifts the front.
  const lidGroup = new THREE.Group();
  lidGroup.name = 'waste-bin-lid';
  lidGroup.position.set(x, height - 0.06, z - radius);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.008, radius + 0.008, 0.045, 24), materials.wasteRed);
  lid.position.set(0, 0.02, radius);
  lid.castShadow = false;
  lidGroup.add(lid);
  const lidTop = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.9, radius * 0.9, 0.012, 24), materials.wasteDark);
  lidTop.position.set(0, 0.048, radius);
  lidTop.castShadow = false;
  lidGroup.add(lidTop);
  const lidHandle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.018, 0.03), materials.steelDark);
  lidHandle.position.set(0, 0.045, radius * 2 - 0.01);
  lidHandle.castShadow = false;
  lidGroup.add(lidHandle);
  root.add(lidGroup);
  return { group: lidGroup, lidGroup };
}

function buildStool(builder) {
  const { x, z, seatY } = STOOL;
  for (const { geometry, matrix } of starBaseGeometries(0.26, 0.045, 0.04)) {
    builder.add('steelDark', geometry, matrix.clone().setPosition(x, 0.075, z));
  }
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2;
    builder.add('rubber', WHEEL(0.038, 0.014, x + Math.cos(angle) * 0.25, 0.044, z + Math.sin(angle) * 0.25));
  }
  builder.add('chrome', CYL(0.033, 0.045, seatY - 0.1, x, (seatY - 0.1) / 2 + 0.1, z, 14));
  builder.add('steelDark', CYL(0.06, 0.06, 0.03, x, 0.13, z, 14));
  builder.add('chrome', torusGeometry(0.17, 0.012, 7, 28), trs(x, 0.27, z, 0, 1, 1, 1, Math.PI / 2));
  builder.add('stoolSeat', RBOX(0.34, 0.07, 0.34, 0.13, x, seatY, z));
  builder.add('stoolSeat', RBOX(0.3, 0.035, 0.26, 0.09, x, seatY + 0.045, z));
  builder.add('chrome', BOX(0.1, 0.018, 0.018, x + 0.15, seatY - 0.09, z));
}

/* --- Pothos ------------------------------------------------------ */

function buildPothos(builder, materials, countTarget) {
  const { x, z, potRadius, potHeight } = { x: PLANT.x, z: PLANT.z, potRadius: PLANT.potRadius, potHeight: PLANT.potHeight };
  const standY = 0.42;
  // Slim white plant stand, so the pothos reads above the bed headboard.
  builder.add('plasticWhite', CYL(0.14, 0.16, standY, x, standY / 2, z, 20));
  builder.add('steelDark', CYL(0.17, 0.17, 0.012, x, 0.012, z, 20));
  builder.add('plasticWhite', CYL(0.16, 0.16, 0.02, x, standY - 0.01, z, 20));
  // White ceramic pot with a rolled rim and saucer.
  const profile = [
    [0, 0],
    [potRadius * 0.72, 0],
    [potRadius * 0.8, potHeight * 0.08],
    [potRadius * 0.96, potHeight * 0.82],
    [potRadius, potHeight * 0.9],
    [potRadius, potHeight],
    [potRadius * 0.9, potHeight],
    [potRadius * 0.88, potHeight * 0.88],
    [potRadius * 0.84, potHeight * 0.25],
    [0, potHeight * 0.12],
  ];
  const pot = new THREE.LatheGeometry(profile.map(([r, h]) => new THREE.Vector2(Math.max(0.0005, r), h)), 24);
  builder.add('pot', pot, trs(x, standY, z));
  builder.add('soil', CYL(potRadius * 0.85, potRadius * 0.85, 0.02, x, standY + potHeight - 0.01, z, 20));
  builder.add('pot', CYL(potRadius * 0.86, potRadius * 0.9, 0.02, x, standY + 0.01, z, 24));

  // Seven vines. Each is a tube with leaves attached exactly at its
  // sampled points, so no leaf floats.
  const rng = (() => {
    let seed = 0x9e3779b9;
    return () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  })();
  let leaves = 0;
  for (let v = 0; v < 9; v += 1) {
    const angle = (v / 9) * Math.PI * 2 + 0.3;
    const reach = 0.16 + (v % 3) * 0.02;
    const height = 0.72 + (v % 4) * 0.16;
    const points = [];
    const steps = 5;
    for (let s = 0; s <= steps; s += 1) {
      const t = s / steps;
      // Vines arch out and up, with a gentle sideways wander.
      const r = reach * Math.sin(t * Math.PI * 0.72);
      const wobble = Math.sin(t * 5 + v) * 0.035;
      points.push([
        x + Math.cos(angle) * (0.06 + r) + Math.cos(angle + 1.3) * wobble,
        standY + potHeight + t * height,
        z + Math.sin(angle) * (0.06 + r) + Math.sin(angle + 1.3) * wobble,
      ]);
    }
    builder.add('plantStem', new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), 10, 0.007, 5, false));
    for (let s = 1; s <= steps; s += 1) {
      const p = points[s];
      const leafCount = s >= 4 ? 2 : 1;
      for (let k = 0; k < leafCount; k += 1) {
        const size = 0.105 + rng() * 0.055;
        const leaf = pothosLeafGeometry(size, size * 1.2);
        const normal = new THREE.Vector3(
          Math.cos(angle + k * 0.8 + 0.1) * (0.6 + rng() * 0.4),
          0.3 + rng() * 0.45,
          Math.sin(angle + k * 0.8 + 0.1) * (0.6 + rng() * 0.4),
        ).normalize();
        const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        // Rotate the leaf's own +Y tip around the normal for variation.
        const spin = new THREE.Quaternion().setFromAxisAngle(normal, rng() * Math.PI * 2);
        quaternion.premultiply(spin);
        const matrix = new THREE.Matrix4().compose(
          new THREE.Vector3(p[0], p[1], p[2]),
          quaternion,
          new THREE.Vector3(1, 1, 1),
        );
        leaf.applyMatrix4(matrix);
        builder.add(leaves % 3 === 0 ? 'plantGreenLight' : 'plantGreen', leaf);
        leaves += 1;
      }
    }
  }
  if (countTarget) countTarget.leaves = leaves;
}

/* ------------------------------------------------------------------ */

export function buildFurniture(builder, materials, root) {
  const counts = { beds: 0, carts: 0, bottles: 0, jars: 0, instruments: 0, packages: 0 };

  for (const z of BED.centersZ) {
    addBed(builder, z);
    counts.beds += 1;
  }
  CART.z.forEach((z, index) => {
    addCart(builder, z, index);
    counts.carts += 1;
  });

  const cabinet = buildMedicineCabinet(builder, materials, root, counts);
  buildSteelCabinet(builder);
  buildOperatingTable(builder);
  buildSurgicalLamp(builder);
  buildTrayStand(builder, counts);
  const waste = buildWasteBin(builder, materials, root);
  buildStool(builder);
  buildPothos(builder, materials, counts);

  counts.packages = 3 * 4;
  return { counts, cabinet, waste };
}
