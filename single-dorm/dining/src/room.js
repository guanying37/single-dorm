import * as THREE from 'three';
import { HALL, DOORS } from './config.js';
import {
  StaticBuilder,
  trs,
  boxGeometry,
  cylinderGeometry,
  planeGeometry,
  uvScaledPlane,
  sphereGeometry,
  torusGeometry,
  tubeGeometry,
} from './utils.js';

/* ------------------------------------------------------------------ *
 * The shell: floor, border inlay, plaster walls with three openings,
 * baseboards, crown, oak casings, the double entrance and its corridor
 * stub, and the two service doors.
 *
 * Door leaves are never merged into the static batch — they animate.
 * ------------------------------------------------------------------ */

const HALF_W = HALL.width / 2;
const HALF_D = HALL.depth / 2;
const WALL_T = HALL.wallThickness;
const T = 0.001;

function addPlane(builder, key, width, height, matrix, options = {}) {
  builder.add(key, uvScaledPlane(width, height, options.tile ?? 2), matrix, {
    cast: options.cast ?? false,
    receive: options.receive ?? true,
  });
}

function addBox(builder, key, width, height, depth, x, y, z, ry = 0, options = {}) {
  builder.add(key, boxGeometry(width, height, depth), trs(x, y, z, ry), {
    cast: options.cast ?? true,
    receive: options.receive ?? true,
  });
}

/* --- Door leaf builders -------------------------------------------- */

function buildPanelLeaf(materials, { width, height, thickness, direction = 1 }) {
  const group = new THREE.Group();
  const builder = new StaticBuilder();
  const halfT = thickness / 2;
  const xCenter = direction * (width / 2);

  builder.add('oak', boxGeometry(width, height, thickness), trs(xCenter, height / 2, 0));

  // Two recessed panels per face, expressed as a raised frame: the panel
  // itself is the base slab, the moulding stands 12 mm proud.
  const panels = [
    { y0: 0.2, y1: 1.16 },
    { y0: 1.42, y1: 2.36 },
  ];
  const inset = 0.14;
  const frame = 0.048;
  for (const face of [-1, 1]) {
    const z = face * (halfT + 0.006);
    for (const panel of panels) {
      const ph = panel.y1 - panel.y0;
      const pw = width - inset * 2;
      const xIn = direction * (inset + frame / 2);
      const xOut = direction * (width - inset - frame / 2);
      builder.add('oakDark', boxGeometry(frame, ph, 0.012), trs(xIn, (panel.y0 + panel.y1) / 2, z));
      builder.add('oakDark', boxGeometry(frame, ph, 0.012), trs(xOut, (panel.y0 + panel.y1) / 2, z));
      builder.add('oakDark', boxGeometry(pw + frame * 2, frame, 0.012), trs(xCenter, panel.y0, z));
      builder.add('oakDark', boxGeometry(pw + frame * 2, frame, 0.012), trs(xCenter, panel.y1, z));
    }
  }

  // Hinges.
  for (const y of [0.35, 1.3, 2.25]) {
    const hinge = cylinderGeometry(0.012, 0.012, 0.11, 8);
    builder.add('brass', hinge, trs(direction * 0.03, y, 0));
  }

  // Lever handles on both faces.
  for (const face of [-1, 1]) {
    const z = face * (halfT + 0.018);
    const rosette = cylinderGeometry(0.034, 0.034, 0.024, 16);
    builder.add('brass', rosette, trs(direction * 1.2, 1.04, face * (halfT + 0.012), 0, 1, 1, 1, Math.PI / 2));
    builder.add('brass', boxGeometry(0.11, 0.018, 0.018), trs(direction * 1.145, 1.04, z));
    builder.add('brass', cylinderGeometry(0.011, 0.011, 0.055, 8), trs(direction * 1.2, 1.04, z, 0, 1, 1, 1, Math.PI / 2));
  }

  builder.flush(group, materials, 'door-leaf');
  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = false;
      child.receiveShadow = true;
    }
  });
  return group;
}

function buildServiceDoor(materials, { width, height, hingeDirection = 1 }) {
  const group = new THREE.Group();
  const builder = new StaticBuilder();
  const thickness = 0.05;
  const leafWidth = width - 0.04;
  const xCenter = hingeDirection * (leafWidth / 2);

  builder.add('oak', boxGeometry(leafWidth, height - 0.04, thickness), trs(xCenter, (height - 0.04) / 2, 0));

  const glassHeight = 0.78;
  const glassWidth = leafWidth - 0.34;
  const glassY = height - 0.48;
  for (const face of [-1, 1]) {
    builder.add(
      'frosted',
      boxGeometry(glassWidth, glassHeight, 0.008),
      trs(xCenter, glassY, face * (thickness / 2 + 0.001)),
    );
    builder.add(
      'oakDark',
      boxGeometry(glassWidth + 0.07, 0.035, 0.014),
      trs(xCenter, glassY + glassHeight / 2 + 0.017, face * (thickness / 2 + 0.006)),
    );
    builder.add(
      'oakDark',
      boxGeometry(glassWidth + 0.07, 0.035, 0.014),
      trs(xCenter, glassY - glassHeight / 2 - 0.017, face * (thickness / 2 + 0.006)),
    );
    builder.add(
      'oakDark',
      boxGeometry(0.035, glassHeight, 0.014),
      trs(xCenter - glassWidth / 2 - 0.017, glassY, face * (thickness / 2 + 0.006)),
    );
    builder.add(
      'oakDark',
      boxGeometry(0.035, glassHeight, 0.014),
      trs(xCenter + glassWidth / 2 + 0.017, glassY, face * (thickness / 2 + 0.006)),
    );
  }

  builder.flush(group, materials, 'service-door-leaf');
  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = false;
      child.receiveShadow = true;
    }
  });

  const handle = new THREE.Group();
  const handleBuilder = new StaticBuilder();
  const knobX = hingeDirection * (leafWidth - 0.1);
  handleBuilder.add(
    'brass',
    sphereGeometry(0.032, 16, 12),
    trs(0, 0, thickness / 2 + 0.045, 0, 1, 1, 0.8),
  );
  handleBuilder.add(
    'brass',
    cylinderGeometry(0.014, 0.014, 0.075, 10),
    trs(0, 0, thickness / 2 + 0.012, 0, 1, 1, 1, Math.PI / 2),
  );
  handleBuilder.add('brass', boxGeometry(0.06, 0.012, 0.06), trs(0, 0, thickness / 2 + 0.002));
  handleBuilder.flush(handle, materials, 'service-door-handle');
  handle.position.set(knobX, 1.05, 0);
  group.add(handle);
  return { group, handle };
}

/* --- Main build ---------------------------------------------------- */

export function buildRoom(builder, materials) {
  const colliders = [];
  const interactables = [];

  /* Floor ---------------------------------------------------------- */
  builder.add('floor', uvScaledPlane(HALL.width, HALL.depth, 1.8), trs(0, 0, 0, 0, 1, 1, 1, -Math.PI / 2), {
    cast: false,
    receive: true,
  });

  // Inlaid border: 0.3 m band, 0.9 m from the walls.
  const borderPieces = [
    { w: 34.2, d: 0.3, x: 0, z: -9.95 },
    { w: 34.2, d: 0.3, x: 0, z: 9.95 },
    { w: 0.3, d: 19.6, x: -16.95, z: 0 },
    { w: 0.3, d: 19.6, x: 16.95, z: 0 },
  ];
  for (const piece of borderPieces) {
    builder.add(
      'border',
      planeGeometry(piece.w, piece.d),
      trs(piece.x, 0.003, piece.z, 0, 1, 1, 1, -Math.PI / 2),
      { cast: false, receive: true },
    );
  }

  /* Walls ---------------------------------------------------------- */
  addPlane(builder, 'wall', HALL.width, HALL.height, trs(0, HALL.height / 2, -HALF_D + T));

  // South wall: opening 2.8 wide x 2.6 high.
  const mainHalf = DOORS.main.width / 2;
  const southSeg = HALF_W - mainHalf;
  addPlane(builder, 'wall', southSeg, HALL.height, trs(-(mainHalf + southSeg / 2), HALL.height / 2, HALF_D - T, Math.PI));
  addPlane(builder, 'wall', southSeg, HALL.height, trs(mainHalf + southSeg / 2, HALL.height / 2, HALF_D - T, Math.PI));
  addPlane(
    builder,
    'wall',
    DOORS.main.width,
    HALL.height - DOORS.main.height,
    trs(0, DOORS.main.height + (HALL.height - DOORS.main.height) / 2, HALF_D - T, Math.PI),
  );

  // East wall: kitchen opening 1.0 x 2.2 at z=-7.
  const eastZ = DOORS.kitchen.position.z;
  const eastBack = HALF_D + eastZ; // -11 -> -7 = 4
  const eastFront = HALF_D - (eastZ + 0.5); // -6.5 -> 11 = 17.5
  addPlane(
    builder,
    'wall',
    eastBack - 0.5,
    HALL.height,
    trs(HALF_W - T, HALL.height / 2, -HALF_D + (eastBack - 0.5) / 2, -Math.PI / 2),
  );
  addPlane(
    builder,
    'wall',
    eastFront,
    HALL.height,
    trs(HALF_W - T, HALL.height / 2, eastZ + 0.5 + eastFront / 2, -Math.PI / 2),
  );
  addPlane(
    builder,
    'wall',
    1,
    HALL.height - DOORS.kitchen.height,
    trs(HALF_W - T, DOORS.kitchen.height + (HALL.height - DOORS.kitchen.height) / 2, eastZ, -Math.PI / 2),
  );

  // West wall: restroom opening at z=+7.
  const westZ = DOORS.restroom.position.z;
  const westBack = westZ + HALF_D; // 18
  const westFront = HALF_D - (westZ + 0.5); // 3.5
  addPlane(
    builder,
    'wall',
    westBack - 0.5,
    HALL.height,
    trs(-HALF_W + T, HALL.height / 2, -HALF_D + (westBack - 0.5) / 2, Math.PI / 2),
  );
  addPlane(
    builder,
    'wall',
    westFront,
    HALL.height,
    trs(-HALF_W + T, HALL.height / 2, westZ + 0.5 + westFront / 2, Math.PI / 2),
  );
  addPlane(
    builder,
    'wall',
    1,
    HALL.height - DOORS.restroom.height,
    trs(-HALF_W + T, DOORS.restroom.height + (HALL.height - DOORS.restroom.height) / 2, westZ, Math.PI / 2),
  );

  /* Ceiling -------------------------------------------------------- */
  builder.add('ceiling', planeGeometry(HALL.width, HALL.depth), trs(0, HALL.height, 0, 0, 1, 1, 1, Math.PI / 2), {
    cast: false,
    receive: true,
  });

  /* Openings: reveals ---------------------------------------------- */
  addBox(builder, 'wall', 0.03, DOORS.main.height, WALL_T + 0.02, -mainHalf - 0.015, DOORS.main.height / 2, HALF_D + WALL_T / 2, 0, { cast: false });
  addBox(builder, 'wall', 0.03, DOORS.main.height, WALL_T + 0.02, mainHalf + 0.015, DOORS.main.height / 2, HALF_D + WALL_T / 2, 0, { cast: false });
  addBox(builder, 'wall', DOORS.main.width + 0.06, 0.03, WALL_T + 0.02, 0, DOORS.main.height + 0.015, HALF_D + WALL_T / 2, 0, { cast: false });

  addBox(builder, 'wall', WALL_T + 0.02, DOORS.kitchen.height, 0.03, HALF_W + WALL_T / 2, DOORS.kitchen.height / 2, eastZ - 0.515, 0, { cast: false });
  addBox(builder, 'wall', WALL_T + 0.02, DOORS.kitchen.height, 0.03, HALF_W + WALL_T / 2, DOORS.kitchen.height / 2, eastZ + 0.515, 0, { cast: false });
  addBox(builder, 'wall', WALL_T + 0.02, 0.03, 1.06, HALF_W + WALL_T / 2, DOORS.kitchen.height + 0.015, eastZ, 0, { cast: false });

  addBox(builder, 'wall', WALL_T + 0.02, DOORS.restroom.height, 0.03, -HALF_W - WALL_T / 2, DOORS.restroom.height / 2, westZ - 0.515, 0, { cast: false });
  addBox(builder, 'wall', WALL_T + 0.02, DOORS.restroom.height, 0.03, -HALF_W - WALL_T / 2, DOORS.restroom.height / 2, westZ + 0.515, 0, { cast: false });
  addBox(builder, 'wall', WALL_T + 0.02, 0.03, 1.06, -HALF_W - WALL_T / 2, DOORS.restroom.height + 0.015, westZ, 0, { cast: false });

  /* Skirting + crown ----------------------------------------------- */
  const skirtingHeight = 0.15;
  const skirtingDepth = 0.022;
  const addSkirting = (length, x, z, ry) =>
    addBox(builder, 'oak', length, skirtingHeight, skirtingDepth, x, skirtingHeight / 2, z, ry, { cast: false });
  addSkirting(HALL.width, 0, -HALF_D + skirtingDepth / 2, 0);
  addSkirting(mainHalf + HALF_W - 0.02, -(mainHalf + (HALF_W - mainHalf) / 2), HALF_D - skirtingDepth / 2, 0);
  addSkirting(mainHalf + HALF_W - 0.02, mainHalf + (HALF_W - mainHalf) / 2, HALF_D - skirtingDepth / 2, 0);
  addSkirting(4 - 0.5, HALF_W - skirtingDepth / 2, -9.25, -Math.PI / 2);
  addSkirting(17.5 - 0.0, HALF_W - skirtingDepth / 2, 2.25, -Math.PI / 2);
  addSkirting(17.5, -HALF_W + skirtingDepth / 2, -2.25, Math.PI / 2);
  addSkirting(3.5, -HALF_W + skirtingDepth / 2, 9.25, Math.PI / 2);

  const crown = (length, x, z, ry) =>
    addBox(builder, 'trim', length, 0.06, 0.05, x, HALL.height - 0.03, z, ry, { cast: false });
  crown(HALL.width, 0, -HALF_D + 0.025, 0);
  crown(HALL.width, 0, HALF_D - 0.025, 0);
  crown(HALL.depth, -HALF_W + 0.025, 0, Math.PI / 2);
  crown(HALL.depth, HALF_W - 0.025, 0, Math.PI / 2);

  /* Wall articulation ---------------------------------------------- */
  // Shallow pilasters divide the long white walls into bays and give the
  // room a rhythm that a 36 m blank surface otherwise lacks.
  const pilaster = (x, z, ry) => {
    addBox(builder, 'trim', 0.22, 3.72, 0.052, x, 2.01, z, ry, { cast: false });
    addBox(builder, 'trim', 0.3, 0.2, 0.09, x, 0.1, z, ry, { cast: false });
    addBox(builder, 'trim', 0.31, 0.1, 0.095, x, 3.86, z, ry, { cast: false });
  };
  for (const x of [-15, -9, -3, 3, 9, 15]) {
    pilaster(x, -HALF_D + 0.027, 0);
    pilaster(x, HALF_D - 0.027, 0);
  }
  for (const z of [-8.5, 8.5]) {
    pilaster(-HALF_W + 0.027, z, Math.PI / 2);
    pilaster(HALF_W - 0.027, z, Math.PI / 2);
  }

  // Oak chair rail at 1 m, skipping the openings.
  const rail = (length, x, z, ry) =>
    addBox(builder, 'oak', length, 0.04, 0.028, x, 1.0, z, ry, { cast: false });
  rail(HALL.width, 0, -HALF_D + 0.016, 0);
  rail(mainHalf + HALF_W - 0.03, -(mainHalf + (HALF_W - mainHalf) / 2), HALF_D - 0.016, 0);
  rail(mainHalf + HALF_W - 0.03, mainHalf + (HALF_W - mainHalf) / 2, HALF_D - 0.016, 0);
  rail(3.5, HALF_W - 0.016, -9.25, Math.PI / 2);
  rail(17.5, HALF_W - 0.016, 2.25, Math.PI / 2);
  rail(17.5, -HALF_W + 0.016, -2.25, Math.PI / 2);
  rail(3.5, -HALF_W + 0.016, 9.25, Math.PI / 2);

  /* Shallow ceiling tray ------------------------------------------- */
  addBox(builder, 'ceilingBand', HALL.width, 0.12, 0.9, 0, HALL.height - 0.06, -HALF_D + 0.45, 0, { cast: false, receive: false });
  addBox(builder, 'ceilingBand', HALL.width, 0.12, 0.9, 0, HALL.height - 0.06, HALF_D - 0.45, 0, { cast: false, receive: false });
  addBox(builder, 'ceilingBand', 0.9, 0.12, HALL.depth - 1.8, -HALF_W + 0.45, HALL.height - 0.06, 0, 0, { cast: false, receive: false });
  addBox(builder, 'ceilingBand', 0.9, 0.12, HALL.depth - 1.8, HALF_W - 0.45, HALL.height - 0.06, 0, 0, { cast: false, receive: false });

  // A slim shadow line along the inner edge of the tray.
  const trayEdge = (length, x, z, ry) =>
    addBox(builder, 'trim', length, 0.025, 0.025, x, HALL.height - 0.145, z, ry, { cast: false });
  trayEdge(HALL.width - 1.7, 0, -HALF_D + 0.9, 0);
  trayEdge(HALL.width - 1.7, 0, HALF_D - 0.9, 0);
  addBox(builder, 'trim', 0.025, 0.025, HALL.depth - 1.9, -HALF_W + 0.9, HALL.height - 0.145, 0, 0, { cast: false });
  addBox(builder, 'trim', 0.025, 0.025, HALL.depth - 1.9, HALF_W - 0.9, HALL.height - 0.145, 0, 0, { cast: false });

  // Cross beams turn the large ceiling into five bays and catch the eye
  // when the camera looks up. They stop at the perimeter tray.
  for (const z of [-7.5, -2.5, 2.5, 7.5]) {
    addBox(builder, 'ceilingBand', HALL.width - 1.8, 0.16, 0.18, 0, HALL.height - 0.08, z, 0, {
      cast: false,
      receive: false,
    });
  }

  /* Casings -------------------------------------------------------- */
  const casingDepth = 0.045;
  const casingWidth = 0.09;
  const mainCasingZ = HALF_D - casingDepth / 2;
  addBox(builder, 'oak', casingWidth, DOORS.main.height + 0.14, casingDepth, -mainHalf - 0.045, (DOORS.main.height + 0.14) / 2, mainCasingZ);
  addBox(builder, 'oak', casingWidth, DOORS.main.height + 0.14, casingDepth, mainHalf + 0.045, (DOORS.main.height + 0.14) / 2, mainCasingZ);
  addBox(builder, 'oak', DOORS.main.width + 0.18, 0.12, casingDepth, 0, DOORS.main.height + 0.06, mainCasingZ);

  addBox(builder, 'oak', casingDepth, DOORS.kitchen.height + 0.12, casingWidth, HALF_W - casingDepth / 2, (DOORS.kitchen.height + 0.12) / 2, eastZ - 0.545);
  addBox(builder, 'oak', casingDepth, DOORS.kitchen.height + 0.12, casingWidth, HALF_W - casingDepth / 2, (DOORS.kitchen.height + 0.12) / 2, eastZ + 0.545);
  addBox(builder, 'oak', casingDepth, 0.12, DOORS.kitchen.width + 0.18, HALF_W - casingDepth / 2, DOORS.kitchen.height + 0.06, eastZ);

  addBox(builder, 'oak', casingDepth, DOORS.restroom.height + 0.12, casingWidth, -HALF_W + casingDepth / 2, (DOORS.restroom.height + 0.12) / 2, westZ - 0.545);
  addBox(builder, 'oak', casingDepth, DOORS.restroom.height + 0.12, casingWidth, -HALF_W + casingDepth / 2, (DOORS.restroom.height + 0.12) / 2, westZ + 0.545);
  addBox(builder, 'oak', casingDepth, 0.12, DOORS.restroom.width + 0.18, -HALF_W + casingDepth / 2, DOORS.restroom.height + 0.06, westZ);

  /* Entrance threshold --------------------------------------------- */
  builder.add('brass', boxGeometry(DOORS.main.width, 0.012, 0.09), trs(0, 0.006, HALF_D - 0.02), { cast: false, receive: true });

  /* Corridor stub behind the entrance ------------------------------ */
  const stubDepth = 2.7;
  const stubHalfWidth = 1.6;
  builder.add(
    'walnut',
    uvScaledPlane(stubHalfWidth * 2, stubDepth, 1),
    trs(0, 0.001, HALF_D + stubDepth / 2, 0, 1, 1, 1, -Math.PI / 2),
    { cast: false, receive: true },
  );
  addPlane(builder, 'wall', stubDepth, 2.8, trs(-stubHalfWidth, 1.4, HALF_D + stubDepth / 2, Math.PI / 2), { tile: 2 });
  addPlane(builder, 'wall', stubDepth, 2.8, trs(stubHalfWidth, 1.4, HALF_D + stubDepth / 2, -Math.PI / 2), { tile: 2 });
  addPlane(builder, 'wall', stubHalfWidth * 2, 2.8, trs(0, 1.4, HALF_D + stubDepth, Math.PI), { tile: 2 });
  builder.add('ceiling', planeGeometry(stubHalfWidth * 2, stubDepth), trs(0, 2.8, HALF_D + stubDepth / 2, 0, 1, 1, 1, Math.PI / 2), {
    cast: false,
    receive: true,
  });

  // A small warm ceiling lamp in the stub: one emissive disc plus the
  // point light returned to the scene.
  builder.add('ledWhite', cylinderGeometry(0.14, 0.14, 0.012, 20), trs(0, 2.785, HALF_D + 1.15), { cast: false, receive: false });
  builder.add('fixtureMetal', torusGeometry(0.15, 0.012, 6, 24), trs(0, 2.78, HALF_D + 1.15, 0, 1, 1, 1, Math.PI / 2), { cast: false });

  // Runner and a console at the end of the stub. There is deliberately
  // no second door here: a door directly behind the entrance reads as a
  // pointless door-in-a-door, so the corridor ends in a small console
  // and wall light instead.
  const stubEnd = HALF_D + stubDepth;
  builder.add('matBoard', planeGeometry(1.72, 2.42), trs(0, 0.005, HALF_D + 1.3, 0, 1, 1, 1, -Math.PI / 2), {
    cast: false,
    receive: true,
  });
  builder.add('rugRunner', planeGeometry(1.6, 2.3), trs(0, 0.007, HALF_D + 1.3, 0, 1, 1, 1, -Math.PI / 2), {
    cast: false,
    receive: true,
  });

  const consoleZ = stubEnd - 0.2;
  addBox(builder, 'oak', 1.46, 0.05, 0.34, 0, 0.86, consoleZ, 0);
  addBox(builder, 'oakDark', 1.36, 0.03, 0.26, 0, 0.79, consoleZ, 0, { cast: false });
  for (const side of [-1, 1]) {
    addBox(builder, 'oak', 0.055, 0.84, 0.055, side * 0.65, 0.42, consoleZ - 0.12, 0);
    addBox(builder, 'oak', 0.055, 0.84, 0.055, side * 0.65, 0.42, consoleZ + 0.12, 0);
  }
  addBox(builder, 'oakDark', 1.3, 0.05, 0.03, 0, 0.18, consoleZ, 0, { cast: false });
  builder.add('ceramic', cylinderGeometry(0.055, 0.085, 0.24, 20), trs(0.38, 0.995, consoleZ), { cast: true, receive: true });
  builder.add('ceramic', cylinderGeometry(0.075, 0.07, 0.02, 20), trs(0.38, 1.125, consoleZ), { cast: true, receive: true });
  for (let i = 0; i < 3; i += 1) {
    builder.add(
      'greenery',
      tubeGeometry(
        [
          [0.38, 1.13, consoleZ],
          [0.36 + i * 0.02, 1.28 + i * 0.03, consoleZ + (i - 1) * 0.02],
          [0.34 + i * 0.03, 1.4 + i * 0.04, consoleZ + (i - 1) * 0.03],
        ],
        0.004,
        8,
        4,
      ),
      trs(0, 0, 0),
      { cast: false, receive: true },
    );
  }

  // Wall light above the console.
  addBox(builder, 'brass', 0.06, 0.16, 0.025, 0, 2.12, stubEnd - 0.015, 0, { cast: false });
  builder.add('brass', cylinderGeometry(0.012, 0.012, 0.18, 8), trs(0, 2.18, stubEnd - 0.1, 0, 1, 1, 1, Math.PI / 2), {
    cast: false,
  });
  builder.add('frosted', cylinderGeometry(0.1, 0.075, 0.17, 16), trs(0, 2.18, stubEnd - 0.2), { cast: false, receive: true });
  builder.add('ledWhite', cylinderGeometry(0.055, 0.055, 0.01, 16), trs(0, 2.09, stubEnd - 0.2), {
    cast: false,
    receive: false,
  });

  colliders.push(
    { x: 0, z: -HALF_D - 0.13, hx: HALF_W + 0.2, hz: 0.14 },
    { x: -(mainHalf + southSeg / 2), z: HALF_D + 0.13, hx: southSeg / 2, hz: 0.14 },
    { x: mainHalf + southSeg / 2, z: HALF_D + 0.13, hx: southSeg / 2, hz: 0.14 },
    { x: HALF_W + 0.13, z: -9.25, hx: 0.14, hz: 1.75 },
    { x: HALF_W + 0.13, z: 2.25, hx: 0.14, hz: 8.75 },
    { x: -HALF_W - 0.13, z: -2.25, hx: 0.14, hz: 8.75 },
    { x: -HALF_W - 0.13, z: 9.25, hx: 0.14, hz: 1.75 },
    { x: -stubHalfWidth - 0.06, z: HALF_D + stubDepth / 2, hx: 0.06, hz: stubDepth / 2 },
    { x: stubHalfWidth + 0.06, z: HALF_D + stubDepth / 2, hx: 0.06, hz: stubDepth / 2 },
    { x: 0, z: HALF_D + stubDepth + 0.06, hx: stubHalfWidth + 0.1, hz: 0.06 },
    { x: 0, z: stubEnd - 0.2, hx: 0.76, hz: 0.2 },
  );

  // Wall segments around the service openings (thin door blocks live
  // with the door leaf itself).
  colliders.push(
    { x: HALF_W + 0.13, z: eastZ - 0.75, hx: 0.14, hz: 0.25 },
    { x: HALF_W + 0.13, z: eastZ + 0.75, hx: 0.14, hz: 0.25 },
    { x: -HALF_W - 0.13, z: westZ - 0.75, hx: 0.14, hz: 0.25 },
    { x: -HALF_W - 0.13, z: westZ + 0.75, hx: 0.14, hz: 0.25 },
  );

  /* Main double doors ---------------------------------------------- */
  const mainZ = HALF_D - 0.055;
  const leftLeaf = buildPanelLeaf(materials, {
    width: DOORS.main.leaf,
    height: DOORS.main.height,
    thickness: DOORS.main.thickness,
    direction: 1,
  });
  leftLeaf.position.set(-DOORS.main.leaf, 0.005, mainZ);
  leftLeaf.rotation.y = 0;

  // Astragal covering the meeting stile: it also guarantees that a ray
  // through the exact centre of the double door hits a leaf.
  const astragal = new THREE.Mesh(
    boxGeometry(0.1, DOORS.main.height - 0.08, 0.025),
    materials.oakDark,
  );
  astragal.position.set(DOORS.main.leaf - 0.02, DOORS.main.height / 2, 0.045);
  astragal.castShadow = false;
  astragal.receiveShadow = true;
  leftLeaf.add(astragal);

  const rightLeaf = buildPanelLeaf(materials, {
    width: DOORS.main.leaf,
    height: DOORS.main.height,
    thickness: DOORS.main.thickness,
    direction: -1,
  });
  rightLeaf.position.set(DOORS.main.leaf, 0.005, mainZ);
  rightLeaf.rotation.y = 0;

  const doorPivotLeft = new THREE.Group();
  doorPivotLeft.position.copy(leftLeaf.position);
  doorPivotLeft.add(leftLeaf);
  leftLeaf.position.set(0, 0, 0);

  const doorPivotRight = new THREE.Group();
  doorPivotRight.position.copy(rightLeaf.position);
  doorPivotRight.add(rightLeaf);
  rightLeaf.position.set(0, 0, 0);

  const doorState = {
    leftPivot: doorPivotLeft,
    rightPivot: doorPivotRight,
    hingeLeft: { x: doorPivotLeft.position.x, z: doorPivotLeft.position.z },
    hingeRight: { x: doorPivotRight.position.x, z: doorPivotRight.position.z },
    halfLeaf: DOORS.main.leaf / 2,
    halfThickness: DOORS.main.thickness / 2 + 0.02,
    angleLeft: 0,
    angleRight: 0,
    openAngle: DOORS.main.openAngle,
  };

  interactables.push({
    id: DOORS.main.id,
    label: DOORS.main.label,
    open: false,
    value: 0,
    target: 0,
    hitRoots: [leftLeaf, rightLeaf],
    apply(value) {
      const angle = value * doorState.openAngle;
      doorState.angleLeft = angle;
      doorState.angleRight = -angle;
      doorState.leftPivot.rotation.y = angle;
      doorState.rightPivot.rotation.y = -angle;
    },
  });

  /* Service doors (locked, reserved scene hooks) -------------------- */
  const kitchenDoor = buildServiceDoor(materials, { width: DOORS.kitchen.width, height: DOORS.kitchen.height, hingeDirection: 1 });
  kitchenDoor.group.position.set(HALF_W - 0.03, 0.02, eastZ - DOORS.kitchen.width / 2 + 0.02);
  kitchenDoor.group.rotation.y = -Math.PI / 2;

  const restroomDoor = buildServiceDoor(materials, { width: DOORS.restroom.width, height: DOORS.restroom.height, hingeDirection: 1 });
  restroomDoor.group.position.set(-HALF_W + 0.03, 0.02, westZ + DOORS.restroom.width / 2 - 0.02);
  restroomDoor.group.rotation.y = Math.PI / 2;

  interactables.push(
    {
      id: DOORS.kitchen.id,
      label: DOORS.kitchen.label,
      locked: true,
      sceneId: DOORS.kitchen.sceneId,
      hitRoots: [kitchenDoor.group],
      handle: kitchenDoor.handle,
      jiggle: 0,
    },
    {
      id: DOORS.restroom.id,
      label: DOORS.restroom.label,
      locked: true,
      sceneId: DOORS.restroom.sceneId,
      hitRoots: [restroomDoor.group],
      handle: restroomDoor.handle,
      jiggle: 0,
    },
  );

  colliders.push(
    { x: HALF_W + 0.04, z: eastZ, hx: 0.06, hz: 0.5 },
    { x: -HALF_W - 0.04, z: westZ, hx: 0.06, hz: 0.5 },
  );

  return {
    group: null,
    doorState,
    doorGroups: { left: doorPivotLeft, right: doorPivotRight, kitchen: kitchenDoor.group, restroom: restroomDoor.group, kitchenHandle: kitchenDoor.handle, restroomHandle: restroomDoor.handle },
    colliders,
    interactables,
    corridorLight: {
      position: new THREE.Vector3(0, 2.62, HALF_D + 1.15),
      color: 0xffd9a3,
      intensity: 1.9,
      distance: 3.6,
    },
    cameraHome: new THREE.Vector3(0, 2.35, HALF_D + 0.9),
  };
}
