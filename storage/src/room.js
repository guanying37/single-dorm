import * as THREE from 'three';
import {
  boxGeometry,
  cylinderGeometry,
  planeGeometry,
  roundedBoxGeometry,
  torusGeometry,
  tubeGeometry,
  uvScaledPlane,
  trs,
  StaticBuilder,
} from './geometry.js';
import {
  ROOM,
  HALF_W,
  HALF_D,
  DOOR,
  CORRIDOR,
  BULB,
  CAMERA,
  SWITCH,
  DRAIN,
  WALL,
} from './config.js';

/* ------------------------------------------------------------------ *
 * Storage-room shell: stained concrete floor and drain, raw concrete
 * walls with the door opening, the old steel door with its louvred vent,
 * the corridor slice outside, the ceiling with its bare bulb and conduit,
 * the wall camera and the light switch.
 *
 * Static geometry is merged per material by StaticBuilder. Only the door
 * leaf group, the camera head and the switch toggle stay separate so they
 * can be picked and animated.
 * ------------------------------------------------------------------ */

const WALL_TILE = 2.4;

function addPlane(builder, key, width, height, matrix, tile = WALL_TILE, options = {}) {
  builder.add(key, uvScaledPlane(width, height, tile), matrix, {
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

function addCylinder(builder, key, rt, rb, height, segments, matrix, options = {}) {
  builder.add(key, cylinderGeometry(rt, rb, height, segments), matrix, {
    cast: options.cast ?? true,
    receive: options.receive ?? true,
  });
}

function addTube(builder, key, points, radius, tubular = 20, radial = 6, options = {}) {
  builder.add(key, tubeGeometry(points, radius, tubular, radial), trs(0, 0, 0), {
    cast: options.cast ?? true,
    receive: options.receive ?? true,
  });
}

/* --- Floor, drain and settled debris ------------------------------- */

function buildFloor(builder) {
  // One non-repeating map across the whole 2.4 × 4.8 m slab.
  builder.add('floorConcrete', planeGeometry(ROOM.width, ROOM.depth), trs(0, 0, 0, 0, 1, 1, 1, -Math.PI / 2), {
    cast: false,
    receive: true,
  });

  // A shallow square drain near the middle of the room.
  const { x, z, size } = DRAIN;
  addBox(builder, 'wallConcreteDark', size, 0.008, size, x, 0.002, z, 0, { cast: false });
  addBox(builder, 'steelDark', size + 0.05, 0.012, 0.022, x, 0.005, z - size / 2, 0, { cast: false });
  addBox(builder, 'steelDark', size + 0.05, 0.012, 0.022, x, 0.005, z + size / 2, 0, { cast: false });
  addBox(builder, 'steelDark', 0.022, 0.012, size, x - size / 2, 0.005, z, 0, { cast: false });
  addBox(builder, 'steelDark', 0.022, 0.012, size, x + size / 2, 0.005, z, 0, { cast: false });
  for (let i = 0; i < 7; i += 1) {
    addBox(builder, 'steelDark', size - 0.04, 0.008, 0.012, x, 0.008, z - size / 2 + 0.045 + i * 0.043, 0, {
      cast: false,
    });
  }
  // Dark silt around the grate.
  addBox(builder, 'wallConcreteDark', size + 0.16, 0.003, size + 0.16, x, 0.0015, z, 0, { cast: false });

  // Damp line where the slab meets the walls.
  const skirting = 0.03;
  addBox(builder, 'wallConcreteDark', ROOM.width, skirting, 0.012, 0, skirting / 2, -HALF_D + 0.006, 0, {
    cast: false,
  });
  addBox(builder, 'wallConcreteDark', ROOM.width, skirting, 0.012, 0, skirting / 2, HALF_D - 0.006, 0, {
    cast: false,
  });
  addBox(builder, 'wallConcreteDark', 0.012, skirting, ROOM.depth, -HALF_W + 0.006, skirting / 2, 0, 0, {
    cast: false,
  });
  addBox(builder, 'wallConcreteDark', 0.012, skirting, ROOM.depth, HALF_W - 0.006, skirting / 2, 0, 0, {
    cast: false,
  });

  // Crumpled paper and dust settled in the corners.
  const paperSpots = [
    [0.12, 1.42, 0.05, 0.5],
    [-0.22, -0.42, 0.04, 1.7],
    [0.68, 0.22, 0.035, 2.6],
    [0.34, -1.62, 0.045, 0.9],
  ];
  for (const [px, pz, radius, ry] of paperSpots) {
    const geometry = new THREE.IcosahedronGeometry(radius, 0);
    builder.add('paperOld', geometry, trs(px, radius * 0.72, pz, ry, 1, 0.75, 1), {
      cast: false,
      receive: true,
    });
  }
  const dustSpots = [
    [-1.08, -2.24, 0.13, 0.9],
    [1.06, -2.22, 0.1, 0.7],
    [-1.07, 2.22, 0.11, 0.8],
    [0.92, 2.18, 0.08, 0.65],
    [-1.05, 0.05, 0.07, 0.6],
    [0.2, -2.3, 0.09, 0.7],
  ];
  for (const [px, pz, radius, squash] of dustSpots) {
    const geometry = new THREE.SphereGeometry(radius, 10, 6);
    builder.add('wallConcreteDark', geometry, trs(px, radius * squash * 0.35, pz, 0, 1, squash * 0.35, 1), {
      cast: false,
      receive: true,
    });
  }
  // Small splinters near the shelf.
  for (const [px, pz, ry, length] of [
    [-0.62, 1.12, 0.4, 0.14],
    [-0.7, -0.95, -0.8, 0.1],
    [0.78, 1.15, 1.2, 0.08],
  ]) {
    addBox(builder, 'woodDark', length, 0.012, 0.018, px, 0.008, pz, ry, { cast: false });
  }
}

/* --- Raw concrete shell ------------------------------------------- */

function buildShell(builder) {
  const H = ROOM.height;

  // North wall, facing +Z.
  addPlane(builder, 'wallConcrete', ROOM.width, H, trs(0, H / 2, -HALF_D));
  // South wall, split around the door opening.
  const openL = DOOR.centerX - DOOR.width / 2;
  const openR = DOOR.centerX + DOOR.width / 2;
  const westW = openL + HALF_W;
  const eastW = HALF_W - openR;
  addPlane(builder, 'wallConcrete', westW, H, trs(-HALF_W + westW / 2, H / 2, HALF_D, Math.PI));
  addPlane(builder, 'wallConcrete', eastW, H, trs(openR + eastW / 2, H / 2, HALF_D, Math.PI));
  addPlane(
    builder,
    'wallConcrete',
    DOOR.width,
    H - DOOR.height,
    trs(DOOR.centerX, DOOR.height + (H - DOOR.height) / 2, HALF_D, Math.PI),
  );
  // East and west walls.
  addPlane(builder, 'wallConcrete', ROOM.depth, H, trs(HALF_W, H / 2, 0, -Math.PI / 2));
  addPlane(builder, 'wallConcrete', ROOM.depth, H, trs(-HALF_W, H / 2, 0, Math.PI / 2));

  // Exposed slab ceiling.
  addPlane(builder, 'ceilingConcrete', ROOM.width, ROOM.depth, trs(0, H, 0, 0, 1, 1, 1, Math.PI / 2), 2.0, {
    receive: true,
  });

  // A shallow shadow line at the wall/ceiling junction.
  const nib = 0.035;
  addBox(builder, 'wallConcreteDark', ROOM.width, nib, 0.02, 0, H - nib / 2, -HALF_D + 0.011, 0, { cast: false });
  addBox(builder, 'wallConcreteDark', ROOM.width, nib, 0.02, 0, H - nib / 2, HALF_D - 0.011, 0, { cast: false });
  addBox(builder, 'wallConcreteDark', 0.02, nib, ROOM.depth, -HALF_W + 0.011, H - nib / 2, 0, 0, { cast: false });
  addBox(builder, 'wallConcreteDark', 0.02, nib, ROOM.depth, HALF_W - 0.011, H - nib / 2, 0, 0, { cast: false });

  // Door opening reveal: 0.24 m of wall thickness, so no gap reads as a hole.
  const revealD = ROOM.wallThickness;
  addBox(builder, 'wallConcreteDark', 0.06, DOOR.height, revealD, openL - 0.03, DOOR.height / 2, HALF_D + revealD / 2, 0, {
    cast: false,
  });
  addBox(builder, 'wallConcreteDark', 0.06, DOOR.height, revealD, openR + 0.03, DOOR.height / 2, HALF_D + revealD / 2, 0, {
    cast: false,
  });
  addBox(builder, 'wallConcreteDark', DOOR.width + 0.12, 0.06, revealD, DOOR.centerX, DOOR.height + 0.03, HALF_D + revealD / 2, 0, {
    cast: false,
  });
}

/* --- Corridor slice outside the door ------------------------------ */

function buildCorridor(builder) {
  const { width, halfWidth, z0, z1, light, extinguisher, board } = CORRIDOR;
  const depth = z1 - z0;
  const zc = (z0 + z1) / 2;
  const H = ROOM.height;

  // Floor and ceiling.
  builder.add('corridorFloor', uvScaledPlane(width, depth, 1.2), trs(0, 0.001, zc, 0, 1, 1, 1, -Math.PI / 2), {
    cast: false,
    receive: true,
  });
  addPlane(builder, 'corridorCeiling', width, depth, trs(0, H, zc, 0, 1, 1, 1, Math.PI / 2), 2.0);

  // Far wall: plaster above, deep green dado below.
  addPlane(builder, 'corridorPlaster', width, H - 0.95, trs(0, (H + 0.95) / 2, z1, Math.PI));
  addPlane(builder, 'corridorDado', width, 0.95, trs(0, 0.475, z1, Math.PI));
  addBox(builder, 'corridorDado', width, 0.045, 0.03, 0, 0.97, z1 - 0.018, 0, { cast: false });
  addBox(builder, 'corridorDado', width, 0.1, 0.025, 0, 0.05, z1 - 0.014, 0, { cast: false });

  // Side walls, split the same way.
  for (const side of [-1, 1]) {
    const x = side * halfWidth;
    const ry = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    addPlane(builder, 'corridorPlaster', depth, H - 0.95, trs(x, (H + 0.95) / 2, zc, ry));
    addPlane(builder, 'corridorDado', depth, 0.95, trs(x, 0.475, zc, ry));
    addBox(builder, 'corridorDado', 0.03, 0.045, depth, x - side * 0.018, 0.97, zc, 0, { cast: false });
    addBox(builder, 'corridorDado', 0.025, 0.1, depth, x - side * 0.014, 0.05, zc, 0, { cast: false });
  }

  // The room's exterior wall face fills the corridor corner beside the door.
  addPlane(builder, 'corridorPlaster', halfWidth - HALF_W, H, trs(-(halfWidth + HALF_W) / 2, H / 2, z0 + 0.002, 0), 2.0, {
    receive: true,
  });
  addPlane(builder, 'corridorPlaster', halfWidth - HALF_W, H, trs((halfWidth + HALF_W) / 2, H / 2, z0 + 0.002, 0), 2.0, {
    receive: true,
  });

  // Corridor fluorescent: housing, diffuser and end caps.
  addBox(builder, 'junctionBox', 1.18, 0.07, 0.24, light.x, H - 0.035, light.z, 0, { cast: false });
  addBox(builder, 'corridorCeiling', 1.06, 0.03, 0.18, light.x, H - 0.082, light.z, 0, { cast: false });
  addBox(builder, 'fluorescentLens', 0.98, 0.012, 0.11, light.x, H - 0.101, light.z, 0, { cast: false, receive: false });
  for (const side of [-1, 1]) {
    addBox(builder, 'junctionBox', 0.045, 0.06, 0.2, light.x + side * 0.57, H - 0.07, light.z, 0, { cast: false });
  }

  // Fire-extinguisher cabinet: red steel, dark glazing, chrome handle.
  const { x: ex, y: ey, z: ez } = extinguisher;
  addBox(builder, 'extinguisherRed', 0.4, 0.6, 0.14, ex, ey, ez, 0, { cast: false });
  addBox(builder, 'extinguisherDark', 0.34, 0.48, 0.01, ex, ey - 0.02, ez - 0.072, 0, { cast: false, receive: false });
  addBox(builder, 'extinguisherRed', 0.3, 0.44, 0.008, ex, ey - 0.02, ez - 0.078, 0, { cast: false });
  addBox(builder, 'extinguisherDark', 0.22, 0.34, 0.12, ex, ey - 0.02, ez + 0.005, 0, { cast: false });
  addCylinder(
    builder,
    'extinguisherRed',
    0.075,
    0.075,
    0.34,
    14,
    trs(ex, ey - 0.03, ez + 0.005),
    { cast: false },
  );
  addBox(builder, 'chrome', 0.012, 0.03, 0.012, ex + 0.145, ey - 0.02, ez - 0.085, 0, { cast: false });
  addBox(builder, 'chrome', 0.05, 0.012, 0.012, ex + 0.12, ey - 0.02, ez - 0.085, 0, { cast: false });

  // Notice board with blank papers: no readable text anywhere.
  const { x: bx, y: by, z: bz } = board;
  addBox(builder, 'boardCork', 0.82, 0.62, 0.03, bx, by, bz - 0.02, 0, { cast: false });
  addBox(builder, 'woodDark', 0.88, 0.68, 0.02, bx, by, bz - 0.036, 0, { cast: false });
  for (const [ox, oy, ry, w, h] of [
    [-0.22, 0.1, -0.04, 0.2, 0.26],
    [0.02, -0.06, 0.03, 0.24, 0.2],
    [0.25, 0.12, 0.05, 0.17, 0.22],
  ]) {
    addBox(builder, 'paperBlank', w, h, 0.004, bx + ox, by + oy, bz - 0.04, ry, { cast: false });
    addCylinder(builder, 'brass', 0.008, 0.008, 0.006, 8, trs(bx + ox, by + oy + h / 2 - 0.02, bz - 0.045, 0, 1, 1, 1, Math.PI / 2, 0), {
      cast: false,
    });
  }

  // Caged bulkhead lamp on the far wall: a bright landmark seen through
  // the louvres.
  addBox(builder, 'steelDark', 0.2, 0.28, 0.12, -0.95, 1.72, z1 - 0.06, 0, { cast: false });
  addBox(builder, 'fluorescentLens', 0.12, 0.2, 0.02, -0.95, 1.72, z1 - 0.125, 0, { cast: false, receive: false });
  for (let i = 0; i < 4; i += 1) {
    addBox(builder, 'steelDark', 0.14, 0.012, 0.008, -0.95, 1.63 + i * 0.06, z1 - 0.14, 0, { cast: false });
  }
  for (let i = 0; i < 3; i += 1) {
    addBox(builder, 'steelDark', 0.008, 0.22, 0.008, -1.0 + i * 0.05, 1.72, z1 - 0.14, 0, { cast: false });
  }

  // Corridor conduit and a wall vent grille, glimpsed through the louvres.
  addCylinder(
    builder,
    'conduitMetal',
    0.016,
    0.016,
    width - 0.1,
    8,
    trs(0, H - 0.24, z1 - 0.035, 0, 1, 1, 1, 0, Math.PI / 2),
    { cast: false },
  );
  addBox(builder, 'wallConcreteDark', 0.34, 0.22, 0.015, 0.15, 0.5, z1 - 0.05, 0, { cast: false });
  for (let i = 0; i < 6; i += 1) {
    addBox(builder, 'steelDark', 0.3, 0.012, 0.008, 0.15, 0.42 + i * 0.032, z1 - 0.06, 0, { cast: false });
  }

  // A yellow wet-floor A-frame, standing low enough to be seen through
  // the louvres. No characters, just two blank panels and a hinge bar.
  const wet = CORRIDOR.wetFloor;
  for (const side of [-1, 1]) {
    builder.add(
      'plasticYellow',
      boxGeometry(0.26, 0.6, 0.018),
      trs(wet.x, 0.315, wet.z + side * 0.06, 0, 1, 1, 1, -side * 0.22, 0),
      { cast: false },
    );
    addBox(builder, 'steelDark', 0.26, 0.03, 0.02, wet.x, 0.015, wet.z + side * 0.105, 0, { cast: false });
  }
  addBox(builder, 'steelDark', 0.27, 0.02, 0.02, wet.x, 0.605, wet.z, 0, { cast: false });
}

/* --- Old steel door with the louvred vent ------------------------- */

function buildDoorFrame(builder) {
  const { centerX, width, height, wallZ } = DOOR;
  const half = width / 2;
  const z = wallZ - 0.005;

  // Painted steel architrave and jambs.
  addBox(builder, 'doorFrame', 0.05, height + 0.05, 0.11, centerX - half - 0.025, (height + 0.05) / 2, z);
  addBox(builder, 'doorFrame', 0.05, height + 0.05, 0.11, centerX + half + 0.025, (height + 0.05) / 2, z);
  addBox(builder, 'doorFrame', width + 0.1, 0.05, 0.11, centerX, height + 0.025, z);
  // Inner stop beads, sitting just in front of the closed leaf face.
  const stopZ = wallZ - 0.0;
  addBox(builder, 'doorFrame', 0.022, height, 0.02, centerX - half + 0.011, height / 2, stopZ, 0, {
    cast: false,
  });
  addBox(builder, 'doorFrame', 0.022, height, 0.02, centerX + half - 0.011, height / 2, stopZ, 0, {
    cast: false,
  });
  addBox(builder, 'doorFrame', width, 0.022, 0.02, centerX, height - 0.011, stopZ, 0, { cast: false });
  // Threshold and a worn kick strip.
  addBox(builder, 'steelPolished', width + 0.1, 0.012, 0.16, centerX, 0.006, wallZ + 0.03, 0, { cast: false });
  for (let i = 0; i < 5; i += 1) {
    addBox(builder, 'steelDark', width - 0.04, 0.004, 0.02, centerX, 0.014, wallZ + 0.005 + i * 0.026, 0, {
      cast: false,
    });
  }
  // Screw heads around the frame.
  for (let i = 0; i < 6; i += 1) {
    for (const side of [-1, 1]) {
      addCylinder(
        builder,
        'steelDark',
        0.007,
        0.007,
        0.004,
        8,
        trs(centerX + side * (half + 0.025), 0.3 + i * 0.3, wallZ - 0.062, 0, 1, 1, 1, Math.PI / 2, 0),
        { cast: false },
      );
    }
  }
}

function buildDoorLeaf(materials) {
  const group = new THREE.Group();
  group.name = 'storage-door-leaf';
  const builder = new StaticBuilder();
  const { centerX, leafWidth, leafHeight, leafThickness, leafZ, vent } = DOOR;
  const half = leafWidth / 2;
  const halfT = leafThickness / 2;
  const y0 = 0.012;
  const y1 = y0 + leafHeight;
  const ventTop = vent.centerY + vent.height / 2;
  const ventBottom = vent.centerY - vent.height / 2;

  // The leaf is four solid pieces around a real hole: no fake louvre decal.
  addBox(builder, 'doorPaint', leafWidth, ventBottom - y0, leafThickness, centerX, (y0 + ventBottom) / 2, leafZ);
  addBox(builder, 'doorPaint', leafWidth, y1 - ventTop, leafThickness, centerX, (ventTop + y1) / 2, leafZ);
  addBox(
    builder,
    'doorPaint',
    (leafWidth - vent.width) / 2,
    vent.height,
    leafThickness,
    centerX - vent.width / 2 - (leafWidth - vent.width) / 4,
    vent.centerY,
    leafZ,
  );
  addBox(
    builder,
    'doorPaint',
    (leafWidth - vent.width) / 2,
    vent.height,
    leafThickness,
    centerX + vent.width / 2 + (leafWidth - vent.width) / 4,
    vent.centerY,
    leafZ,
  );

  // Raised panel below the vent, kick plate and screw heads.
  addBox(builder, 'doorPaint', leafWidth - 0.18, 0.98, 0.012, centerX, 0.72, leafZ - halfT - 0.006);
  addBox(builder, 'doorFrame', leafWidth - 0.24, 0.9, 0.004, centerX, 0.72, leafZ - halfT - 0.013, 0, { cast: false });
  addBox(builder, 'steelDark', leafWidth - 0.12, 0.24, 0.008, centerX, 0.16, leafZ - halfT - 0.008, 0, {
    cast: false,
  });
  for (let i = 0; i < 6; i += 1) {
    addCylinder(
      builder,
      'steelPolished',
      0.0055,
      0.0055,
      0.004,
      7,
      trs(centerX - 0.3 + i * 0.12, 0.06, leafZ - halfT - 0.014, 0, 1, 1, 1, Math.PI / 2, 0),
      { cast: false },
    );
  }
  // Panel above the vent: a plain blank plate, no characters.
  addBox(builder, 'doorFrame', 0.2, 0.07, 0.006, centerX, ventTop + 0.105, leafZ - halfT - 0.004, 0, { cast: false });

  // Louvre frame, recessed into the opening.
  const frameW = 0.028;
  addBox(builder, 'louverDark', vent.width + frameW * 2, frameW, 0.1, centerX, ventTop + frameW / 2, leafZ, 0, {
    cast: false,
  });
  addBox(builder, 'louverDark', vent.width + frameW * 2, frameW, 0.1, centerX, ventBottom - frameW / 2, leafZ, 0, {
    cast: false,
  });
  addBox(builder, 'louverDark', frameW, vent.height, 0.1, centerX - vent.width / 2 - frameW / 2, vent.centerY, leafZ, 0, {
    cast: false,
  });
  addBox(builder, 'louverDark', frameW, vent.height, 0.1, centerX + vent.width / 2 + frameW / 2, vent.centerY, leafZ, 0, {
    cast: false,
  });

  // Eight downward-tilted vanes: from inside you look down through the
  // gaps at the corridor floor; from outside the vane faces close the view.
  const vanes = 8;
  const vaneDepth = 0.072;
  const pitch = vent.height / vanes;
  for (let i = 0; i < vanes; i += 1) {
    const y = ventBottom + pitch * (i + 0.5);
    builder.add(
      'louverDark',
      boxGeometry(vent.width + 0.012, 0.009, vaneDepth),
      trs(centerX, y, leafZ + 0.005, 0, 1, 1, 1, 0.5, 0),
      { cast: false },
    );
    // A thin light-catch on the upper lip of each vane.
    builder.add(
      'steelDark',
      boxGeometry(vent.width + 0.004, 0.0025, 0.01),
      trs(centerX, y + 0.009, leafZ + 0.038, 0, 1, 1, 1, 0.5, 0),
      { cast: false },
    );
  }
  // Vent surround proud of the door face on the room side.
  addBox(builder, 'doorFrame', vent.width + 0.08, 0.02, 0.018, centerX, ventTop + 0.04, leafZ - halfT - 0.01, 0, {
    cast: false,
  });
  addBox(builder, 'doorFrame', vent.width + 0.08, 0.02, 0.018, centerX, ventBottom - 0.04, leafZ - halfT - 0.01, 0, {
    cast: false,
  });

  // Hinges on the west edge.
  for (const y of [0.34, 1.04, 1.74]) {
    addCylinder(builder, 'steelPolished', 0.022, 0.022, 0.17, 12, trs(centerX - half - 0.004, y, leafZ - 0.012), {
      cast: false,
    });
    addBox(builder, 'steelDark', 0.09, 0.08, 0.02, centerX - half + 0.038, y, leafZ - halfT - 0.012, 0, {
      cast: false,
    });
  }

  // Lever handle, backplate and lock cylinder on the east side.
  const handleX = centerX + half - 0.1;
  const faceZ = leafZ - halfT - 0.006;
  addBox(builder, 'steelPolished', 0.055, 0.17, 0.012, handleX, 1.03, faceZ, 0, { cast: false });
  addBox(builder, 'chrome', 0.16, 0.022, 0.03, handleX - 0.1, 1.03, faceZ - 0.02, 0, { cast: false });
  addCylinder(
    builder,
    'chrome',
    0.014,
    0.014,
    0.12,
    10,
    trs(handleX - 0.18, 1.03, faceZ - 0.02, 0, 1, 1, 1, 0, Math.PI / 2),
    { cast: false },
  );
  addCylinder(
    builder,
    'brass',
    0.024,
    0.024,
    0.012,
    14,
    trs(handleX, 0.94, faceZ - 0.004, 0, 1, 1, 1, Math.PI / 2, 0),
    { cast: false },
  );
  addBox(builder, 'steelDark', 0.016, 0.03, 0.008, handleX, 0.94, faceZ - 0.012, 0, { cast: false });
  // Rubber bumper and a bottom weather strip.
  addBox(builder, 'rubber', 0.86, 0.018, 0.03, centerX, 0.018, leafZ - 0.02, 0, { cast: false });

  builder.flush(group, materials, 'storage-door-leaf');
  group.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = true;
  });
  return group;
}

/* --- Ceiling: bare bulb, conduit, pipes and dead socket ----------- */

function buildCeilingServices(builder) {
  // Drop cord, socket, enamel shade and bulb.
  const cordLength = BULB.cordTop - BULB.shadeY - 0.02;
  addCylinder(
    builder,
    'cordRubber',
    0.005,
    0.005,
    cordLength,
    6,
    trs(BULB.x, BULB.shadeY + 0.02 + cordLength / 2, BULB.z),
    { cast: false },
  );
  addCylinder(builder, 'junctionBox', 0.036, 0.036, 0.016, 12, trs(BULB.x, BULB.cordTop - 0.008, BULB.z), {
    cast: false,
  });
  addCylinder(builder, 'shadeMetal', 0.05, 0.15, 0.09, 22, trs(BULB.x, BULB.shadeY, BULB.z), {
    cast: false,
  });
  builder.add(
    'shadeInner',
    cylinderGeometry(0.048, 0.146, 0.084, 22, true),
    trs(BULB.x, BULB.shadeY - 0.003, BULB.z),
    { cast: false, receive: false },
  );
  addCylinder(builder, 'steelDark', 0.019, 0.019, 0.05, 12, trs(BULB.x, BULB.shadeY - 0.058, BULB.z), {
    cast: false,
  });
  builder.add(
    'bulbGlass',
    new THREE.SphereGeometry(0.042, 14, 10),
    trs(BULB.x, BULB.y, BULB.z, 0, 1, 1.16, 1),
    { cast: false, receive: false },
  );
  addCylinder(builder, 'steelDark', 0.017, 0.019, 0.028, 10, trs(BULB.x, BULB.y + 0.048, BULB.z), { cast: false });

  // Conduit along the east wall, into the ceiling and down to the switch.
  const conduitY = 2.58;
  addCylinder(
    builder,
    'conduitMetal',
    0.016,
    0.016,
    ROOM.depth - 0.06,
    8,
    trs(HALF_W - 0.036, conduitY, 0, 0, 1, 1, 1, Math.PI / 2, 0),
    { cast: false },
  );
  for (let i = 0; i < 6; i += 1) {
    addBox(builder, 'steelDark', 0.05, 0.05, 0.02, HALF_W - 0.04, conduitY, -2.1 + i * 0.84, 0, { cast: false });
  }
  addBox(builder, 'junctionBox', 0.075, 0.11, 0.11, HALF_W - 0.055, 2.5, 1.86, 0, { cast: false });
  addBox(builder, 'steelDark', 0.06, 0.09, 0.09, HALF_W - 0.06, 2.5, 1.86, 0, { cast: false });
  addCylinder(
    builder,
    'conduitMetal',
    0.014,
    0.014,
    1.24,
    8,
    trs(SWITCH.x, (conduitY + 1.4) / 2, HALF_D - 0.02),
    { cast: false },
  );
  addCylinder(
    builder,
    'conduitMetal',
    0.014,
    0.014,
    0.24,
    8,
    trs((SWITCH.x + HALF_W) / 2, conduitY, HALF_D - 0.02, 0, 1, 1, 1, 0, Math.PI / 2),
    { cast: false },
  );
  addBox(builder, 'steelDark', 0.06, 0.05, 0.02, SWITCH.x, 1.42, HALF_D - 0.025, 0, { cast: false });

  // Rusted water pipe and valve across the north wall.
  addCylinder(
    builder,
    'rust',
    0.03,
    0.03,
    ROOM.width - 0.06,
    10,
    trs(0, WALL.pipeY, -HALF_D + 0.07, 0, 1, 1, 1, 0, Math.PI / 2),
  );
  for (const x of [-0.9, 0, 0.9]) {
    addBox(builder, 'steelDark', 0.05, 0.09, 0.05, x, WALL.pipeY + 0.02, -HALF_D + 0.035, 0, { cast: false });
  }
  // Gate valve: body on the pipe, red handwheel facing the room.
  const valveX = 0.68;
  const valveY = WALL.pipeY + 0.045;
  const valveZ = -HALF_D + 0.115;
  addCylinder(builder, 'rust', 0.045, 0.045, 0.07, 10, trs(valveX, WALL.pipeY + 0.02, -HALF_D + 0.07), {
    cast: false,
  });
  addCylinder(builder, 'brass', 0.014, 0.014, 0.09, 8, trs(valveX, valveY, -HALF_D + 0.075, 0, 1, 1, 1, Math.PI / 2, 0), {
    cast: false,
  });
  builder.add('paintRed', new THREE.TorusGeometry(0.075, 0.01, 6, 18), trs(valveX, valveY, valveZ), {
    cast: false,
  });
  for (let i = 0; i < 3; i += 1) {
    const angle = (i / 3) * Math.PI;
    builder.add('paintRed', boxGeometry(0.15, 0.008, 0.01), trs(valveX, valveY, valveZ, 0, 1, 1, 1, 0, angle), {
      cast: false,
    });
  }
  addCylinder(builder, 'brass', 0.02, 0.02, 0.03, 8, trs(valveX, valveY, valveZ, 0, 1, 1, 1, Math.PI / 2, 0), {
    cast: false,
  });

  // Conduit drop to the wall camera, and a rusted downpipe in the corner.
  addCylinder(
    builder,
    'conduitMetal',
    0.012,
    0.012,
    0.34,
    8,
    trs(HALF_W - 0.032, 2.52, CAMERA.z),
    { cast: false },
  );
  addBox(builder, 'junctionBox', 0.055, 0.075, 0.1, HALF_W - 0.055, 2.55, CAMERA.z, 0, { cast: false });
  addCylinder(
    builder,
    'rust',
    0.028,
    0.03,
    ROOM.height,
    10,
    trs(HALF_W - 0.065, ROOM.height / 2, -HALF_D + 0.085),
  );
  for (const y of [0.35, 1.35, 2.35]) {
    addBox(builder, 'steelDark', 0.06, 0.05, 0.05, HALF_W - 0.04, y, -HALF_D + 0.085, 0, { cast: false });
  }

  addCylinder(
    builder,
    'plasticWhite',
    0.045,
    0.05,
    0.035,
    12,
    trs(-0.86, ROOM.height - 0.02, -1.86),
    { cast: false },
  );
  addCylinder(builder, 'steelDark', 0.026, 0.03, 0.035, 10, trs(-0.86, ROOM.height - 0.055, -1.86), {
    cast: false,
  });
  addCylinder(
    builder,
    'cordRubber',
    0.004,
    0.004,
    0.16,
    6,
    trs(-0.86, ROOM.height - 0.15, -1.86, 0, 1, 1, 1, 0.2, 0.1),
    { cast: false },
  );
}

/* --- Light switch -------------------------------------------------- */

function buildSwitch(materials) {
  const group = new THREE.Group();
  group.name = 'storage-light-switch';
  group.position.set(SWITCH.x, SWITCH.y, SWITCH.z);
  const builder = new StaticBuilder();
  addBox(builder, 'wallPlate', 0.09, 0.13, 0.016, 0, 0, 0, 0, { cast: false });
  addBox(builder, 'steelDark', 0.03, 0.05, 0.004, 0, 0, -0.009, 0, { cast: false });
  for (const sy of [-0.046, 0.046]) {
    addCylinder(builder, 'steelPolished', 0.006, 0.006, 0.003, 8, trs(0, sy, -0.009, 0, 1, 1, 1, Math.PI / 2, 0), {
      cast: false,
    });
  }
  builder.flush(group, materials, 'storage-switch-static');

  const toggle = new THREE.Group();
  toggle.name = 'storage-switch-toggle';
  const nubBuilder = new StaticBuilder();
  addBox(nubBuilder, 'switchNub', 0.024, 0.045, 0.016, 0, 0, 0.008, 0, { cast: false });
  nubBuilder.flush(toggle, materials, 'storage-switch-toggle');
  toggle.position.set(0, 0, -0.012);
  group.add(toggle);
  group.traverse((object) => {
    if (object.isMesh) object.castShadow = false;
  });
  return { group, toggle };
}

/* --- Wall camera --------------------------------------------------- */

function buildCamera(materials, root) {
  const { x, y, z, yaw, pitch } = CAMERA;

  // Bracket: wall plate, stand-off arm, swivel.
  const bracket = new StaticBuilder();
  addBox(bracket, 'steelDark', 0.018, 0.13, 0.13, HALF_W - 0.01, y, z, 0, { cast: false });
  addBox(bracket, 'steelDark', 0.1, 0.032, 0.04, HALF_W - 0.06, y + 0.035, z, 0, { cast: false });
  addCylinder(bracket, 'steelPolished', 0.026, 0.026, 0.05, 10, trs(HALF_W - 0.11, y + 0.01, z), { cast: false });
  bracket.flush(root, materials, 'storage-camera-bracket');

  // Head, built along local -Z.
  const head = new THREE.Group();
  head.name = 'storage-camera-head';
  head.position.set(x, y, z);
  head.rotation.set(pitch, yaw, 0, 'YXZ');
  const local = new StaticBuilder();
  const add = (key, geometry, matrix, options = {}) =>
    local.add(key, geometry, matrix, { cast: false, receive: true, ...options });

  add('cameraPlastic', roundedBoxGeometry(0.105, 0.09, 0.215, 0.016, 3), trs(0, 0, 0.02));
  add('cameraShade', boxGeometry(0.115, 0.014, 0.235), trs(0, 0.054, 0.02));
  add('cameraShade', boxGeometry(0.095, 0.05, 0.03), trs(0, 0.026, -0.09));
  add('cameraPlastic', cylinderGeometry(0.042, 0.046, 0.035, 16), trs(0, 0, -0.094, 0, 1, 1, 1, Math.PI / 2, 0));
  add('cameraLens', cylinderGeometry(0.033, 0.033, 0.008, 16), trs(0, 0, -0.113, 0, 1, 1, 1, Math.PI / 2, 0), {
    receive: false,
  });
  add('steelDark', cylinderGeometry(0.036, 0.036, 0.006, 16), trs(0, 0, -0.108, 0, 1, 1, 1, Math.PI / 2, 0));
  // Mount foot and cable.
  add('steelDark', boxGeometry(0.04, 0.032, 0.06), trs(0, -0.058, 0.04));
  add('ledRed', cylinderGeometry(0.0085, 0.0085, 0.006, 8), trs(0.033, -0.026, -0.09, 0, 1, 1, 1, Math.PI / 2, 0), {
    receive: false,
  });
  add('ledGreen', cylinderGeometry(0.005, 0.005, 0.004, 8), trs(-0.033, 0.024, -0.092, 0, 1, 1, 1, Math.PI / 2, 0), {
    receive: false,
  });
  add(
    'cordRubber',
    tubeGeometry(
      [
        [-0.02, 0.05, 0.1],
        [-0.04, 0.12, 0.17],
        [0.02, 0.19, 0.2],
      ],
      0.008,
      12,
      5,
    ),
    trs(0, 0, 0),
  );
  local.flush(head, materials, 'storage-camera-casing');
  head.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = true;
  });
  root.add(head);
  return head;
}

/* --- Wall hooks ---------------------------------------------------- */

function buildHooks(builder) {
  const wallX = HALF_W - 0.006;
  for (const hook of [WALL.coatHook, WALL.coatHook2, WALL.ropeHook]) {
    addBox(builder, 'steelDark', 0.012, 0.1, 0.06, wallX, hook.y, hook.z, 0, { cast: false });
    addTube(
      builder,
      'chrome',
      [
        [wallX - 0.006, hook.y, hook.z],
        [wallX - 0.05, hook.y + 0.005, hook.z],
        [wallX - 0.072, hook.y - 0.04, hook.z],
      ],
      0.008,
      10,
      5,
      { cast: false },
    );
  }
}

/* ------------------------------------------------------------------ */

export function buildRoom(builder, materials, root) {
  buildFloor(builder);
  buildShell(builder);
  buildCorridor(builder);
  buildDoorFrame(builder);
  const doorGroup = buildDoorLeaf(materials);
  root.add(doorGroup);
  buildCeilingServices(builder);
  const switchParts = buildSwitch(materials);
  root.add(switchParts.group);
  const cameraHead = buildCamera(materials, root);
  buildHooks(builder);
  return { doorGroup, cameraHead, switchGroup: switchParts.group, switchToggle: switchParts.toggle };
}
