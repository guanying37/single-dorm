import * as THREE from 'three';
import {
  boxGeometry,
  cylinderGeometry,
  frustumGeometry,
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
  EVAP,
  CEILING,
  WALL,
  DRAIN,
} from './config.js';

/* ------------------------------------------------------------------ *
 * Cold-store shell: deck, insulated panel walls, PU ceiling, the heavy
 * door leaf, the wall CRT bracket, the pointer hygrothermometer, the two
 * frost-covered LED fixtures, the evaporator, the ceiling camera, the
 * temperature sensor, the garment rail and the cleaning gear.
 *
 * Static geometry is merged per material by StaticBuilder. Only the door
 * leaf (so it can be picked as the exit portal), the CRT glass, the fan
 * blades and the camera head stay as separate objects.
 * ------------------------------------------------------------------ */

const SIDE_W = 0.9; // vertical panel module
const CEIL_TILE = 1.2;

function addPlane(builder, key, width, height, matrix, tile = SIDE_W, options = {}) {
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

/* --- Floor deck and perimeter drain -------------------------------- */

function buildFloor(builder) {
  const ch = DRAIN.width;
  const deckW = ROOM.width - ch * 2;
  const deckD = ROOM.depth - ch * 2;
  const deckY = 0.05;

  addPlane(builder, 'floorDeck', deckW, deckD, trs(0, deckY, 0, 0, 1, 1, 1, -Math.PI / 2), 0.6, {
    receive: true,
  });

  // Recessed channel floor, four strips.
  addPlane(builder, 'floorTrench', ROOM.width, ch, trs(0, 0.002, -HALF_D + ch / 2, 0, 1, 1, 1, -Math.PI / 2), 0.6);
  addPlane(builder, 'floorTrench', ROOM.width, ch, trs(0, 0.002, HALF_D - ch / 2, 0, 1, 1, 1, -Math.PI / 2), 0.6);
  addPlane(builder, 'floorTrench', ch, deckD, trs(-HALF_W + ch / 2, 0.002, 0, 0, 1, 1, 1, -Math.PI / 2), 0.6);
  addPlane(builder, 'floorTrench', ch, deckD, trs(HALF_W - ch / 2, 0.002, 0, 0, 1, 1, 1, -Math.PI / 2), 0.6);

  // Stainless angle between deck and channel.
  addBox(builder, 'steelPolished', deckW, 0.052, 0.018, 0, 0.026, -HALF_D + ch, 0, { cast: false });
  addBox(builder, 'steelPolished', deckW, 0.052, 0.018, 0, 0.026, HALF_D - ch, 0, { cast: false });
  addBox(builder, 'steelPolished', 0.018, 0.052, deckD, -HALF_W + ch, 0.026, 0, 0, { cast: false });
  addBox(builder, 'steelPolished', 0.018, 0.052, deckD, HALF_W - ch, 0.026, 0, 0, { cast: false });

  // Grate bars across the channel.
  const step = 0.14;
  const countX = Math.floor(deckW / step);
  const countZ = Math.floor(deckD / step);
  for (let i = 0; i < countX; i += 1) {
    const x = -deckW / 2 + 0.06 + i * step;
    for (const z of [-HALF_D + ch / 2, HALF_D - ch / 2]) {
      addBox(builder, 'steelDark', 0.022, 0.014, ch - 0.008, x, 0.046, z, 0, { cast: false });
    }
  }
  for (let i = 0; i < countZ; i += 1) {
    const z = -deckD / 2 + 0.06 + i * step;
    for (const x of [-HALF_W + ch / 2, HALF_W - ch / 2]) {
      addBox(builder, 'steelDark', ch - 0.008, 0.014, 0.022, x, 0.046, z, 0, { cast: false });
    }
  }

  // Stainless threshold bridging the channel under the door.
  addBox(builder, 'steelPolished', DOOR.width + 0.1, 0.016, 0.2, DOOR.centerX, 0.052, HALF_D - 0.115, 0, {
    cast: false,
  });
  for (let i = 0; i < 8; i += 1) {
    addBox(builder, 'steelDark', DOOR.width + 0.06, 0.008, 0.022, DOOR.centerX, 0.06, HALF_D - 0.2 + i * 0.028, 0, {
      cast: false,
    });
  }

  // Floor drain sump at the south-west channel corner.
  addBox(builder, 'steelDark', 0.34, 0.006, 0.34, -HALF_W + 0.09, 0.006, 2.52, 0, { cast: false });
  addCylinder(builder, 'steelPolished', 0.05, 0.05, 0.008, 16, trs(-HALF_W + 0.09, 0.012, 2.52), {
    cast: false,
  });
  for (let i = 0; i < 5; i += 1) {
    addBox(builder, 'blackPlastic', 0.3, 0.004, 0.012, -HALF_W + 0.09, 0.013, 2.4 + i * 0.055, 0, {
      cast: false,
    });
  }

  // Frost rime in front of the door: the coldest, wettest spot in the room.
  addBox(builder, 'frostPatch', 0.9, 0.008, 0.16, DOOR.centerX - 0.05, 0.052, HALF_D - 0.3, 0, {
    cast: false,
    receive: false,
  });
  addBox(builder, 'frostPatch', 0.28, 0.008, 0.1, DOOR.centerX + 0.42, 0.052, HALF_D - 0.48, 0, {
    cast: false,
    receive: false,
  });
}

/* --- Panel walls and ceiling --------------------------------------- */

function addVerticalSeam(builder, x, z, face) {
  const h = ROOM.height - 0.12;
  const cy = ROOM.height / 2 - 0.02;
  if (face === 'z') {
    const dir = z < 0 ? 1 : -1;
    addBox(builder, 'panelCore', 0.03, h, 0.002, x, cy, z, 0, { cast: false });
    addBox(builder, 'panelSeam', 0.016, h, 0.012, x, cy, z + dir * 0.005, 0, { cast: false });
  } else {
    const dir = x < 0 ? 1 : -1;
    addBox(builder, 'panelCore', 0.002, h, 0.03, x, cy, z, 0, { cast: false });
    addBox(builder, 'panelSeam', 0.012, h, 0.016, x + dir * 0.005, cy, z, 0, { cast: false });
  }
}

function buildShell(builder) {
  const H = ROOM.height;

  // North wall (facing +Z).
  addPlane(builder, 'panelWhite', ROOM.width, H, trs(0, H / 2, -HALF_D), SIDE_W);
  // South wall, split around the door opening.
  const openL = DOOR.centerX - DOOR.width / 2;
  const openR = DOOR.centerX + DOOR.width / 2;
  const westW = openL + HALF_W;
  const eastW = HALF_W - openR;
  addPlane(builder, 'panelWhite', westW, H, trs(-HALF_W + westW / 2, H / 2, HALF_D, Math.PI), SIDE_W);
  addPlane(builder, 'panelWhite', eastW, H, trs(openR + eastW / 2, H / 2, HALF_D, Math.PI), SIDE_W);
  addPlane(
    builder,
    'panelWhite',
    DOOR.width,
    H - DOOR.height,
    trs(DOOR.centerX, DOOR.height + (H - DOOR.height) / 2, HALF_D, Math.PI),
    SIDE_W,
  );
  // East and west walls.
  addPlane(builder, 'panelWhite', ROOM.depth, H, trs(HALF_W, H / 2, 0, -Math.PI / 2), SIDE_W);
  addPlane(builder, 'panelWhite', ROOM.depth, H, trs(-HALF_W, H / 2, 0, Math.PI / 2), SIDE_W);

  // Silicone joints, aligned with the 0.9 m panel module.
  for (const x of [-HALF_W + SIDE_W, -HALF_W + SIDE_W * 2]) {
    addVerticalSeam(builder, x, -HALF_D + 0.005, 'z');
  }
  addVerticalSeam(builder, -HALF_W + SIDE_W, HALF_D - 0.005, 'z');
  for (let i = 1; i <= 5; i += 1) {
    const z = -HALF_D + SIDE_W * i;
    addVerticalSeam(builder, -HALF_W + 0.005, z, 'x');
    addVerticalSeam(builder, HALF_W - 0.005, z, 'x');
  }

  // Aluminium corner posts.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addBox(
        builder,
        'steelPolished',
        0.045,
        H - 0.02,
        0.045,
        sx * (HALF_W - 0.0225),
        H / 2,
        sz * (HALF_D - 0.0225),
        0,
        { cast: false },
      );
    }
  }

  // Stainless base cove, covering the deck/wall joint.
  const coveH = 0.1;
  const coveD = 0.014;
  addBox(builder, 'steel', ROOM.width - 0.02, coveH, coveD, 0, coveH / 2 + 0.04, -HALF_D + coveD / 2, 0, {
    cast: false,
  });
  addBox(
    builder,
    'steel',
    westW,
    coveH,
    coveD,
    -HALF_W + westW / 2,
    coveH / 2 + 0.04,
    HALF_D - coveD / 2,
    0,
    { cast: false },
  );
  addBox(
    builder,
    'steel',
    eastW,
    coveH,
    coveD,
    openR + eastW / 2,
    coveH / 2 + 0.04,
    HALF_D - coveD / 2,
    0,
    { cast: false },
  );
  addBox(builder, 'steel', coveD, coveH, ROOM.depth - 0.02, -HALF_W + coveD / 2, coveH / 2 + 0.04, 0, 0, {
    cast: false,
  });
  addBox(builder, 'steel', coveD, coveH, ROOM.depth - 0.02, HALF_W - coveD / 2, coveH / 2 + 0.04, 0, 0, {
    cast: false,
  });

  // PU panel ceiling, facing down.
  addPlane(builder, 'ceilingPU', ROOM.width, ROOM.depth, trs(0, H, 0, 0, 1, 1, 1, Math.PI / 2), CEIL_TILE, {
    receive: true,
  });
  // Ceiling joints: thin aluminium battens.
  for (const z of [-1.4, 0, 1.4]) {
    addBox(builder, 'steelDark', ROOM.width - 0.02, 0.012, 0.04, 0, H - 0.006, z, 0, { cast: false });
  }
  addBox(builder, 'steelDark', 0.04, 0.012, ROOM.depth - 0.02, 0, H - 0.006, 0, 0, { cast: false });
  // Ceiling perimeter trim.
  for (const sz of [-1, 1]) {
    addBox(builder, 'steelPolished', ROOM.width, 0.05, 0.045, 0, H - 0.025, sz * (HALF_D - 0.0225), 0, {
      cast: false,
    });
  }
  for (const sx of [-1, 1]) {
    addBox(builder, 'steelPolished', 0.045, 0.05, ROOM.depth, sx * (HALF_W - 0.0225), H - 0.025, 0, 0, {
      cast: false,
    });
  }
}

/* --- Heavy insulated door ------------------------------------------ *
 * Frame, flange and heater trace are merged with the shell. The leaf is
 * flushed into its own group so the portal can be picked on the real
 * geometry (no invisible proxy box). */

function buildDoorFrame(builder) {
  const z = DOOR.wallZ;
  const cx = DOOR.centerX;
  const half = DOOR.width / 2;

  // Wide stainless flange around the opening (inner face).
  addBox(builder, 'steel', 0.2, DOOR.height + 0.24, 0.02, cx - half - 0.1, (DOOR.height + 0.24) / 2, z - 0.012, 0, {
    cast: false,
  });
  addBox(builder, 'steel', 0.2, DOOR.height + 0.24, 0.02, cx + half + 0.1, (DOOR.height + 0.24) / 2, z - 0.012, 0, {
    cast: false,
  });
  addBox(builder, 'steel', DOOR.width + 0.4, 0.2, 0.02, cx, DOOR.height + 0.14, z - 0.012, 0, { cast: false });

  // Frame jambs and head, 0.17 deep into the opening.
  addBox(builder, 'steelPolished', 0.11, DOOR.height, 0.17, cx - half - 0.055, DOOR.height / 2, z - 0.04);
  addBox(builder, 'steelPolished', 0.11, DOOR.height, 0.17, cx + half + 0.055, DOOR.height / 2, z - 0.04);
  addBox(builder, 'steelPolished', DOOR.width + 0.22, 0.11, 0.17, cx, DOOR.height + 0.055, z - 0.04);
  addBox(builder, 'steelDark', DOOR.width + 0.3, 0.05, 0.2, cx, 0.025, z - 0.05, 0, { cast: false });

  // Opening reveal, so no gap reads as a hole behind the leaf.
  addBox(builder, 'panelCore', 0.02, DOOR.height, 0.16, cx - half + 0.01, DOOR.height / 2, z - 0.08, 0, {
    cast: false,
  });
  addBox(builder, 'panelCore', 0.02, DOOR.height, 0.16, cx + half - 0.01, DOOR.height / 2, z - 0.08, 0, {
    cast: false,
  });
  addBox(builder, 'panelCore', DOOR.width, 0.02, 0.16, cx, DOOR.height - 0.01, z - 0.08, 0, { cast: false });

  // Anti-condensation heater trace on the inside flange, plus its LED.
  addBox(builder, 'heaterWire', 0.012, DOOR.height - 0.08, 0.008, cx - half - 0.13, DOOR.height / 2 - 0.02, z - 0.026, 0, {
    cast: false,
    receive: false,
  });
  addBox(builder, 'heaterWire', 0.012, DOOR.height - 0.08, 0.008, cx + half + 0.13, DOOR.height / 2 - 0.02, z - 0.026, 0, {
    cast: false,
    receive: false,
  });
  addBox(builder, 'heaterWire', DOOR.width + 0.28, 0.012, 0.008, cx, DOOR.height + 0.2, z - 0.026, 0, {
    cast: false,
    receive: false,
  });
  addCylinder(
    builder,
    'ledGreen',
    0.009,
    0.009,
    0.008,
    10,
    trs(cx + half + 0.1, 1.86, z - 0.03, 0, 1, 1, 1, Math.PI / 2, 0),
    { cast: false, receive: false },
  );
}

function buildDoorLeaf(materials) {
  const group = new THREE.Group();
  group.name = 'cold-door-leaf';
  const builder = new StaticBuilder();
  const z = DOOR.wallZ;
  const cx = DOOR.centerX;
  const leafHalf = DOOR.leafWidth / 2;
  const leafZ = z + 0.05;
  const leafFace = leafZ - DOOR.leafThickness / 2;

  // Insulated leaf with a raised inner panel.
  addBox(builder, 'steel', DOOR.leafWidth, DOOR.leafHeight, DOOR.leafThickness, cx, DOOR.leafHeight / 2 + 0.02, leafZ);
  addBox(
    builder,
    'steelPolished',
    DOOR.leafWidth - 0.12,
    DOOR.leafHeight - 0.14,
    0.022,
    cx,
    DOOR.leafHeight / 2 + 0.02,
    leafFace - 0.008,
  );
  addBox(
    builder,
    'steelDark',
    DOOR.leafWidth - 0.2,
    DOOR.leafHeight - 0.22,
    0.012,
    cx,
    DOOR.leafHeight / 2 + 0.02,
    leafFace - 0.022,
    0,
    { cast: false },
  );

  // Rubber gasket on the inside face.
  const gasketZ = leafFace - 0.006;
  for (const side of [-1, 1]) {
    addBox(
      builder,
      'rubber',
      0.03,
      DOOR.leafHeight - 0.04,
      0.02,
      cx + side * (leafHalf - 0.02),
      DOOR.leafHeight / 2 + 0.02,
      gasketZ,
    );
  }
  addBox(builder, 'rubber', DOOR.leafWidth - 0.06, 0.03, 0.02, cx, DOOR.leafHeight - 0.02, gasketZ);
  addBox(builder, 'rubber', DOOR.leafWidth - 0.06, 0.03, 0.02, cx, 0.035, gasketZ);

  // Stainless kick plate and a rime of frost where the gasket meets the
  // cold floor.
  addBox(builder, 'steelPolished', DOOR.leafWidth - 0.16, 0.2, 0.014, cx, 0.16, leafFace - 0.008, 0, {
    cast: false,
  });
  addBox(builder, 'frostPatch', DOOR.leafWidth - 0.12, 0.05, 0.008, cx, 0.07, leafFace - 0.014, 0, {
    cast: false,
    receive: false,
  });
  addBox(builder, 'frostPatch', 0.06, 0.34, 0.008, cx - leafHalf + 0.06, 0.26, leafFace - 0.014, 0, {
    cast: false,
    receive: false,
  });
  addBox(builder, 'frostPatch', 0.05, 0.2, 0.008, cx + leafHalf - 0.07, 0.19, leafFace - 0.014, 0, {
    cast: false,
    receive: false,
  });

  // Hinges on the +x jamb.
  for (const y of [0.34, 1.03, 1.72]) {
    addCylinder(builder, 'steelPolished', 0.032, 0.032, 0.2, 14, trs(cx + leafHalf + 0.01, y, leafZ - 0.02));
    addBox(builder, 'steelDark', 0.09, 0.08, 0.05, cx + leafHalf - 0.03, y, leafZ - 0.055, 0, { cast: false });
  }

  // Thick anti-slip handle on the -x side, inside face.
  const handleX = cx - leafHalf + 0.12;
  const handleZ = leafFace - 0.02;
  addBox(builder, 'steelPolished', 0.13, 0.3, 0.024, handleX, 1.02, handleZ, 0, { cast: false });
  addBox(builder, 'blackPlastic', 0.05, 0.2, 0.06, handleX - 0.02, 1.02, handleZ - 0.045);
  addCylinder(
    builder,
    'rubber',
    0.036,
    0.036,
    0.17,
    14,
    trs(handleX, 1.02, handleZ - 0.115, 0, 1, 1, 1, Math.PI / 2, 0),
  );
  for (const y of [0.95, 1.02, 1.09]) {
    addCylinder(
      builder,
      'steelDark',
      0.04,
      0.04,
      0.012,
      14,
      trs(handleX, y, handleZ - 0.115, 0, 1, 1, 1, Math.PI / 2, 0),
      { cast: false },
    );
  }
  addBox(builder, 'steelPolished', 0.1, 0.07, 0.035, handleX - 0.16, 1.02, handleZ - 0.02, 0, { cast: false });

  // Internal emergency release: a red pull bar inside a glowing green
  // frame plate, with an abstract lever emboss and no characters.
  const relX = cx + 0.08;
  const relY = 1.3;
  addBox(builder, 'steelDark', 0.26, 0.18, 0.02, relX, relY, handleZ - 0.004);
  addBox(builder, 'glowGreen', 0.2, 0.06, 0.014, relX, relY - 0.045, handleZ - 0.018, 0, {
    cast: false,
    receive: false,
  });
  addBox(builder, 'warningRed', 0.19, 0.05, 0.035, relX, relY, handleZ - 0.03);
  addBox(builder, 'warningRed', 0.05, 0.035, 0.03, relX + 0.095, relY + 0.005, handleZ - 0.045);
  addBox(builder, 'glowGreen', 0.02, 0.02, 0.008, relX - 0.1, relY + 0.055, handleZ - 0.05, 0, {
    cast: false,
    receive: false,
  });
  for (let i = 0; i < 3; i += 1) {
    addBox(builder, 'steelPolished', 0.008, 0.008, 0.006, relX - 0.04 + i * 0.04, relY + 0.045, handleZ - 0.045, 0, {
      cast: false,
    });
  }

  // Pressure-relief vent in the upper leaf.
  addBox(builder, 'whitePlastic', 0.17, 0.13, 0.022, cx + 0.34, 1.97, handleZ - 0.006, 0, { cast: false });
  for (let i = 0; i < 4; i += 1) {
    addBox(builder, 'blackPlastic', 0.13, 0.014, 0.012, cx + 0.34, 1.925 + i * 0.03, handleZ - 0.018, 0, {
      cast: false,
    });
  }

  builder.flush(group, materials, 'cold-door-leaf');
  group.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = true;
  });
  return group;
}

/* --- Wall monitor bracket + cabling -------------------------------- */

function buildMonitorBracket(builder) {
  const { x, y, z } = WALL.crt;
  const wz = HALF_D;

  addBox(builder, 'steelDark', 0.34, 0.32, 0.03, x, y, wz - 0.016, 0, { cast: false });
  addBox(builder, 'steel', 0.08, 0.08, 0.16, x - 0.1, y, wz - 0.1, 0, { cast: false });
  addBox(builder, 'steel', 0.08, 0.08, 0.16, x + 0.1, y, wz - 0.1, 0, { cast: false });
  // Small shelf and recorder below the monitor.
  addBox(builder, 'steel', 0.6, 0.035, 0.28, x, y - 0.34, wz - 0.16, 0, { cast: false });
  for (const side of [-1, 1]) {
    addBox(builder, 'steelDark', 0.035, 0.2, 0.26, x + side * 0.27, y - 0.44, wz - 0.16, 0, { cast: false });
  }
  addBox(builder, 'blackPlastic', 0.42, 0.08, 0.24, x, y - 0.29, wz - 0.17, 0, { cast: false });
  for (let i = 0; i < 4; i += 1) {
    addBox(builder, 'steelDark', 0.28, 0.006, 0.012, x - 0.02, y - 0.27, wz - 0.05 + i * 0.019, 0, { cast: false });
  }
  addCylinder(
    builder,
    'ledGreen',
    0.008,
    0.008,
    0.006,
    8,
    trs(x + 0.15, y - 0.305, wz - 0.055, 0, 1, 1, 1, Math.PI / 2, 0),
    { cast: false, receive: false },
  );
  // Cable from the monitor up the wall and across the ceiling.
  addTube(
    builder,
    'rubber',
    [
      [x - 0.18, y + 0.1, wz - 0.26],
      [x - 0.26, y + 0.26, wz - 0.12],
      [x - 0.28, y + 0.54, wz - 0.04],
      [x - 0.28, ROOM.height - 0.03, wz - 0.03],
      [x + 0.2, ROOM.height - 0.03, wz - 0.22],
    ],
    0.013,
    26,
    6,
    { cast: false },
  );
}

/* --- Pointer hygrothermometer -------------------------------------- */

function buildDial(builder) {
  const { x, y, z } = WALL.dial;
  addCylinder(builder, 'brass', 0.115, 0.115, 0.034, 30, trs(x, y, z + 0.005, 0, 1, 1, 1, Math.PI / 2, 0));
  addCylinder(builder, 'dialFace', 0.102, 0.102, 0.014, 30, trs(x, y, z - 0.017, 0, 1, 1, 1, Math.PI / 2, 0));
  // Tick marks only: no numerals anywhere on the dial.
  for (let i = 0; i < 36; i += 1) {
    const angle = (i / 36) * Math.PI * 2;
    const r = 0.078;
    const long = i % 3 === 0;
    addBox(
      builder,
      'blackPlastic',
      0.0045,
      long ? 0.017 : 0.01,
      0.003,
      x + Math.sin(angle) * r,
      y + Math.cos(angle) * r,
      z - 0.025,
      0,
      { cast: false },
    );
  }
  // Red temperature arc and blue humidity arc.
  builder.add(
    'needleRed',
    torusGeometry(0.066, 0.005, 6, 28, Math.PI * 0.6),
    trs(x, y, z - 0.027, 0, 1, 1, 1, 0, Math.PI * 1.08),
    { cast: false },
  );
  builder.add(
    'needleBlue',
    torusGeometry(0.066, 0.005, 6, 28, Math.PI * 0.6),
    trs(x, y, z - 0.027, 0, 1, 1, 1, 0, Math.PI * 0.12),
    { cast: false },
  );
  // Two needles.
  addBox(builder, 'needleRed', 0.007, 0.062, 0.004, x + 0.022, y - 0.019, z - 0.031, 0, { cast: false });
  addBox(builder, 'needleBlue', 0.006, 0.052, 0.004, x - 0.019, y + 0.014, z - 0.034, 0, { cast: false });
  addCylinder(builder, 'brass', 0.008, 0.008, 0.008, 12, trs(x, y, z - 0.034, 0, 1, 1, 1, Math.PI / 2, 0), {
    cast: false,
  });
  addCylinder(builder, 'dialGlass', 0.1, 0.1, 0.004, 30, trs(x, y, z - 0.04, 0, 1, 1, 1, Math.PI / 2, 0), {
    cast: false,
    receive: false,
  });
  // Brass hanging hook.
  addBox(builder, 'brass', 0.012, 0.055, 0.012, x, y + 0.14, z + 0.002, 0, { cast: false });
}

/* --- Frost-covered cold LED fixtures ------------------------------- */

function buildCeilingLights(builder) {
  for (const light of CEILING.lights) {
    const y = ROOM.height;
    addBox(builder, 'steelDark', 0.7, 0.03, 0.36, light.x, y - 0.015, light.z, 0, { cast: false });
    addBox(builder, 'steel', 0.66, 0.075, 0.32, light.x, y - 0.065, light.z);
    addBox(builder, 'steelPolished', 0.6, 0.012, 0.26, light.x, y - 0.105, light.z, 0, { cast: false });
    // Emissive lens behind the clear dust cover.
    addBox(builder, 'coldLens', 0.56, 0.01, 0.22, light.x, y - 0.113, light.z, 0, {
      cast: false,
      receive: false,
    });
    // Transparent dust cover shell.
    addBox(builder, 'dustCover', 0.6, 0.055, 0.26, light.x, y - 0.143, light.z, 0, {
      cast: false,
      receive: false,
    });
    // Condensation frost on the underside of the cover.
    addPlane(
      builder,
      'frostFilm',
      0.58,
      0.24,
      trs(light.x, y - 0.172, light.z, 0, 1, 1, 1, Math.PI / 2),
      0.4,
      { receive: false },
    );
    // Cover retaining clips.
    for (const side of [-1, 1]) {
      addBox(builder, 'steelDark', 0.05, 0.03, 0.03, light.x + side * 0.28, y - 0.152, light.z, 0, {
        cast: false,
      });
    }
    // A frozen drip on one corner.
    addBox(builder, 'frostPatch', 0.05, 0.03, 0.02, light.x + 0.24, y - 0.185, light.z - 0.09, 0, {
      cast: false,
      receive: false,
    });
  }
}

/* --- Ceiling evaporator, refrigerant lines and drain --------------- */

function buildEvaporator(builder, materials, root) {
  const { x, z, width, depth, height, bottom } = EVAP;
  const cy = bottom + height / 2;
  const frontZ = z + depth / 2;
  const fans = [];

  // Casing.
  addBox(builder, 'steel', width, height, depth, x, cy, z);
  addBox(builder, 'steelDark', width - 0.04, 0.03, depth - 0.04, x, bottom + 0.015, z, 0, { cast: false });
  addBox(builder, 'steelPolished', width + 0.03, 0.025, depth + 0.03, x, bottom + height, z, 0, { cast: false });
  // Hanging brackets to the ceiling.
  for (const side of [-1, 1]) {
    addBox(
      builder,
      'steelDark',
      0.07,
      ROOM.height - (bottom + height) + 0.02,
      0.05,
      x + side * (width / 2 - 0.12),
      (bottom + height + ROOM.height) / 2,
      z - 0.12,
    );
    addBox(
      builder,
      'steelDark',
      0.16,
      0.03,
      0.14,
      x + side * (width / 2 - 0.12),
      ROOM.height - 0.02,
      z - 0.12,
      0,
      { cast: false },
    );
  }

  // Recessed fan bulkhead on the front face.
  addBox(builder, 'steelDark', width - 0.1, height - 0.1, 0.03, x, cy, frontZ - 0.01, 0, { cast: false });

  // Two fan apertures with mesh guards and dark coil cavities.
  for (const side of [-1, 1]) {
    const fx = x + side * 0.22;
    // Deep dark cavity so the running blades read as silhouettes.
    addBox(builder, 'coilCavity', 0.33, 0.33, 0.22, fx, cy, frontZ - 0.13, 0, { cast: false, receive: false });
    addBox(builder, 'steelDark', 0.34, 0.025, 0.03, fx, cy + 0.168, frontZ - 0.02, 0, { cast: false });
    addBox(builder, 'steelDark', 0.34, 0.025, 0.03, fx, cy - 0.168, frontZ - 0.02, 0, { cast: false });
    // Fan motor hub in the middle of the aperture.
    addCylinder(builder, 'steelDark', 0.032, 0.032, 0.04, 14, trs(fx, cy, frontZ - 0.02, 0, 1, 1, 1, Math.PI / 2, 0), {
      cast: false,
    });
    // Finer mesh guard: thin bars that let the cavity read.
    for (let i = 0; i < 9; i += 1) {
      addBox(builder, 'fanGrille', 0.31, 0.005, 0.008, fx, cy - 0.148 + i * 0.037, frontZ + 0.006, 0, {
        cast: false,
        receive: false,
      });
    }
    for (let i = 0; i < 9; i += 1) {
      addBox(builder, 'fanGrille', 0.005, 0.31, 0.008, fx - 0.148 + i * 0.037, cy, frontZ + 0.006, 0, {
        cast: false,
        receive: false,
      });
    }
    // Protective frame around the aperture.
    addBox(builder, 'steelPolished', 0.36, 0.022, 0.026, fx, cy + 0.17, frontZ + 0.008, 0, { cast: false });
    addBox(builder, 'steelPolished', 0.36, 0.022, 0.026, fx, cy - 0.17, frontZ + 0.008, 0, { cast: false });
    addBox(builder, 'steelPolished', 0.022, 0.36, 0.026, fx - 0.175, cy, frontZ + 0.008, 0, { cast: false });
    addBox(builder, 'steelPolished', 0.022, 0.36, 0.026, fx + 0.175, cy, frontZ + 0.008, 0, { cast: false });
    // Frost creeping along the bottom lip of the aperture.
    addBox(builder, 'frostPatch', 0.3, 0.035, 0.01, fx, cy - 0.15, frontZ + 0.014, 0, {
      cast: false,
      receive: false,
    });

    // Fan blades, kept as a small dynamic group behind the mesh.
    const blade = new THREE.Group();
    const bladeBuilder = new StaticBuilder();
    for (let i = 0; i < 5; i += 1) {
      const angle = (i / 5) * Math.PI * 2;
      bladeBuilder.add(
        'fanBlade',
        boxGeometry(0.11, 0.13, 0.006),
        trs(Math.cos(angle) * 0.06, Math.sin(angle) * 0.06, 0, 0, 1, 1, 1, 0, angle),
        { cast: false, receive: false },
      );
    }
    bladeBuilder.add('steelPolished', cylinderGeometry(0.03, 0.03, 0.02, 14), trs(0, 0, 0.008), {
      cast: false,
      receive: false,
    });
    bladeBuilder.flush(blade, materials, 'evaporator-fan');
    blade.position.set(fx, cy, frontZ - 0.055);
    blade.userData.spin = side > 0 ? 1 : -1;
    root.add(blade);
    fans.push(blade);
  }

  // Drip tray and drain spout.
  addBox(builder, 'steelDark', width + 0.02, 0.045, depth + 0.04, x, bottom - 0.02, z, 0, { cast: false });
  addBox(builder, 'rubber', width - 0.08, 0.006, depth - 0.04, x, bottom - 0.001, z, 0, { cast: false });
  addCylinder(builder, 'steelPolished', 0.016, 0.016, 0.08, 12, trs(x - width / 2 + 0.05, bottom - 0.06, z + 0.1), {
    cast: false,
  });
  // Frost patches on the cold casing.
  addBox(builder, 'frostPatch', 0.34, 0.12, 0.01, x - 0.1, bottom + 0.1, frontZ - 0.026, 0, {
    cast: false,
    receive: false,
  });
  addBox(builder, 'frostPatch', 0.2, 0.08, 0.01, x + 0.3, bottom + 0.05, frontZ - 0.026, 0, {
    cast: false,
    receive: false,
  });

  // Insulated refrigerant lines: along the ceiling, then down the west
  // wall tight in the corner so they never cut across the wall CRT.
  const pipeZ = -2.5;
  for (const off of [-0.05, 0.05]) {
    addCylinder(
      builder,
      'pipeFoam',
      0.026,
      0.026,
      0.5,
      12,
      trs(x - width / 2 - 0.02, ROOM.height - 0.1, pipeZ + off, 0, 1, 1, 1, 0, Math.PI / 2),
      { cast: false },
    );
    addTube(
      builder,
      'pipeFoam',
      [
        [x - width / 2 - 0.02, ROOM.height - 0.1, pipeZ + off],
        [-HALF_W + 0.035, ROOM.height - 0.1, pipeZ + off],
        [-HALF_W + 0.035, ROOM.height - 0.1, 2.7],
        [-HALF_W + 0.035, 0.34, 2.7],
        [-HALF_W + 0.035, 0.2, 2.76],
      ],
      0.027,
      26,
      6,
      { cast: false },
    );
  }
  for (let i = 0; i < 5; i += 1) {
    addBox(builder, 'steelDark', 0.07, 0.026, 0.13, -HALF_W + 0.035, ROOM.height - 0.135, -2.0 + i * 1.15, 0, {
      cast: false,
    });
  }
  addBox(builder, 'steelPolished', 0.03, 0.4, 0.3, -HALF_W + 0.012, 0.22, 2.7, 0, { cast: false });

  // Condensation drain hose from the tray down to the floor channel.
  addTube(
    builder,
    'pipeFoam',
    [
      [x - width / 2 + 0.05, bottom - 0.08, z + 0.1],
      [x - width / 2 - 0.06, bottom - 0.5, z - 0.02],
      [-HALF_W + 0.12, 1.44, -2.6],
      [-HALF_W + 0.11, 0.24, -2.7],
      [-HALF_W + 0.1, 0.08, -2.66],
    ],
    0.014,
    24,
    6,
    { cast: false },
  );

  return fans;
}

/* --- Ceiling surveillance camera (defog heated) -------------------- */

function buildCamera(builder, materials, root) {
  const { x, y, z, yaw, pitch } = CEILING.camera;

  // Static mount: ceiling plate, drop rod, swivel.
  addBox(builder, 'steelDark', 0.11, 0.02, 0.11, x, ROOM.height - 0.012, z, 0, { cast: false });
  addCylinder(builder, 'steelDark', 0.014, 0.014, 0.12, 10, trs(x, ROOM.height - 0.08, z), { cast: false });
  addBox(builder, 'steel', 0.06, 0.05, 0.09, x, y + 0.06, z, 0, { cast: false });

  // Rotating head, built along local -Z.
  const head = new THREE.Group();
  head.position.set(x, y, z);
  head.rotation.set(pitch, yaw, 0, 'YXZ');
  const local = new StaticBuilder();
  const add = (key, geometry, matrix, options = {}) =>
    local.add(key, geometry, matrix, { cast: false, receive: true, ...options });

  add('whitePlastic', roundedBoxGeometry(0.13, 0.13, 0.24, 0.02, 3), trs(0, 0, 0.05));
  add('crtBeige', boxGeometry(0.15, 0.03, 0.2), trs(0, 0.075, 0.06));
  add('steelPolished', cylinderGeometry(0.046, 0.052, 0.06, 18), trs(0, 0, -0.08, 0, 1, 1, 1, Math.PI / 2, 0));
  add('blackPlastic', cylinderGeometry(0.038, 0.038, 0.012, 18), trs(0, 0, -0.112, 0, 1, 1, 1, Math.PI / 2, 0));
  add('steelDark', cylinderGeometry(0.048, 0.048, 0.012, 18), trs(0, 0, -0.118, 0, 1, 1, 1, Math.PI / 2, 0));
  // Defog heater ring around the lens and the status lamp.
  add('heaterWire', torusGeometry(0.053, 0.0045, 6, 20), trs(0, 0, -0.105), { receive: false });
  add('ledGreen', cylinderGeometry(0.007, 0.007, 0.006, 8), trs(0.045, 0.04, -0.05, 0, 1, 1, 1, Math.PI / 2, 0), {
    receive: false,
  });
  // Cable back to the ceiling.
  add(
    'rubber',
    tubeGeometry(
      [
        [0.05, 0.05, 0.14],
        [0.07, 0.1, 0.24],
        [0.02, 0.16, 0.32],
      ],
      0.01,
      12,
      5,
    ),
    trs(0, 0, 0),
  );
  local.flush(head, materials, 'camera-casing');
  head.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = true;
  });
  root.add(head);
  return head;
}

/* --- Temperature sensor -------------------------------------------- */

function buildSensor(builder) {
  const { x, y, z } = CEILING.sensor;
  addBox(builder, 'whitePlastic', 0.14, 0.06, 0.19, x, y - 0.03, z, 0, { cast: false });
  addBox(builder, 'panelSeam', 0.12, 0.008, 0.17, x, y - 0.062, z, 0, { cast: false });
  for (let i = 0; i < 3; i += 1) {
    addBox(builder, 'blackPlastic', 0.09, 0.006, 0.012, x, y - 0.057, z - 0.05 + i * 0.045, 0, { cast: false });
  }
  addCylinder(
    builder,
    'steelPolished',
    0.009,
    0.009,
    0.16,
    10,
    trs(x + 0.09, y - 0.11, z + 0.04, 0, 1, 1, 1, 0, 0.5),
    { cast: false },
  );
  addCylinder(
    builder,
    'ledGreen',
    0.006,
    0.006,
    0.004,
    8,
    trs(x - 0.045, y - 0.062, z + 0.06, 0, 1, 1, 1, Math.PI / 2, 0),
    { cast: false, receive: false },
  );
  // Capillary tube to the evaporator.
  addTube(
    builder,
    'rubber',
    [
      [x + 0.07, y - 0.01, z - 0.08],
      [x - 0.2, ROOM.height - 0.02, z - 0.34],
      [EVAP.x + 0.35, ROOM.height - 0.02, -2.4],
      [EVAP.x + 0.25, EVAP.bottom + EVAP.height + 0.01, -2.34],
    ],
    0.008,
    22,
    5,
    { cast: false },
  );
}

/* --- Garment rail, cold coats and gloves --------------------------- */

function buildGarmentRail(builder) {
  const { x0, x1, y, z } = CEILING.rail;
  addTube(
    builder,
    'steelPolished',
    [
      [x0, y, z],
      [x0 + (x1 - x0) * 0.5, y - 0.012, z],
      [x1, y, z],
    ],
    0.019,
    16,
    8,
    { cast: false },
  );
  for (const side of [-1, 1]) {
    const bx = side < 0 ? x0 : x1;
    addBox(builder, 'steelDark', 0.04, 0.02, 0.16, bx, y + 0.02, z - 0.02, 0, { cast: false });
    addBox(builder, 'steelDark', 0.05, 0.02, 0.05, bx, ROOM.height - 0.01, z - 0.02, 0, { cast: false });
    addBox(builder, 'steelDark', 0.02, ROOM.height - y - 0.02, 0.02, bx, (ROOM.height + y) / 2, z - 0.02, 0, {
      cast: false,
    });
  }

  // Two heavy cold coats on hangers.
  const coats = [
    { x: -0.24, tilt: 0.05, scale: 1.0, tone: 'coatNavy' },
    { x: 0.3, tilt: -0.04, scale: 0.94, tone: 'coatNavyDark' },
  ];
  for (const coat of coats) {
    const cx = coat.x;
    const s = coat.scale;
    // Hook and hanger bar, mostly hidden under the shoulder cap.
    addCylinder(builder, 'steelPolished', 0.006, 0.006, 0.07, 8, trs(cx, y - 0.045, z), { cast: false });

    // Continuous tapered shells instead of stacked slabs: shoulder cap,
    // body and a hood tucked at the back.
    builder.add(
      coat.tone,
      frustumGeometry(0.37 * s, 0.23, 0.29 * s, 0.18, 0.13),
      trs(cx, y - 0.21, z + 0.02, coat.tilt),
      { cast: true },
    );
    builder.add(
      coat.tone,
      frustumGeometry(0.44 * s, 0.28, 0.37 * s, 0.23, 0.8),
      trs(cx, y - 1.02, z + 0.03, coat.tilt),
      { cast: true },
    );
    addBox(builder, coat.tone, 0.24 * s, 0.2, 0.13, cx - 0.01, y - 0.14, z - 0.1, coat.tilt);
    addBox(builder, coat.tone, 0.2 * s, 0.075, 0.13, cx + 0.01, y - 0.115, z + 0.035, coat.tilt);

    // Sleeves hanging just outside the body silhouette, with reflective
    // cuffs and a small shoulder seam.
    for (const side of [-1, 1]) {
      addCylinder(
        builder,
        coat.tone,
        0.057 * s,
        0.047 * s,
        0.62,
        12,
        trs(cx + side * 0.215 * s, y - 0.5, z + 0.012, 0, 1, 1, 1, 0, side * 0.1),
      );
      addCylinder(
        builder,
        coat.tone,
        0.048 * s,
        0.044 * s,
        0.14,
        12,
        trs(cx + side * 0.252 * s, y - 0.86, z + 0.004, 0, 1, 1, 1, 0, side * 0.1),
      );
      addCylinder(
        builder,
        'reflectiveStrip',
        0.051 * s,
        0.051 * s,
        0.03,
        12,
        trs(cx + side * 0.248 * s, y - 0.81, z + 0.004, 0, 1, 1, 1, 0, side * 0.1),
        { cast: false },
      );
      addBox(builder, 'coatNavyDark', 0.03, 0.09, 0.02, cx + side * 0.18 * s, y - 0.24, z + 0.06, coat.tilt, {
        cast: false,
      });
    }
    // One horizontal reflective chest band, a dark zip placket and pockets.
    addBox(builder, 'reflectiveStrip', 0.3 * s, 0.038, 0.012, cx, y - 0.56, z + 0.128, coat.tilt, { cast: false });
    addBox(builder, 'coatNavyDark', 0.022, 0.72, 0.012, cx, y - 0.62, z + 0.13, coat.tilt, { cast: false });
    for (const side of [-1, 1]) {
      addBox(builder, 'coatNavyDark', 0.1, 0.05, 0.012, cx + side * 0.1, y - 0.76, z + 0.134, coat.tilt, {
        cast: false,
      });
    }
  }

  // Two pairs of insulated gloves clipped on the rail ends.
  for (const gx of [-0.56, 0.56]) {
    const dir = gx < 0 ? 1 : -1;
    addCylinder(builder, 'steelPolished', 0.008, 0.008, 0.035, 8, trs(gx, y - 0.022, z + 0.01), { cast: false });
    addBox(builder, 'steelPolished', 0.02, 0.012, 0.05, gx, y - 0.048, z + 0.02, 0, { cast: false });
    // Cuff, palm, four fingers and a thumb.
    addCylinder(builder, 'gloveRubber', 0.042, 0.038, 0.07, 12, trs(gx + dir * 0.004, y - 0.09, z + 0.02, 0, 1, 1, 1, 0.12, dir * 0.18));
    addBox(builder, 'gloveRubber', 0.105, 0.15, 0.055, gx + dir * 0.012, y - 0.19, z + 0.028, dir * 0.14);
    for (let i = 0; i < 4; i += 1) {
      addCylinder(
        builder,
        'gloveRubber',
        0.014,
        0.012,
        0.085,
        8,
        trs(gx + dir * 0.012 - 0.036 + i * 0.024, y - 0.29, z + 0.032, 0, 1, 1, 1, 0, dir * 0.14 + 0.05),
      );
    }
    addCylinder(
      builder,
      'gloveRubber',
      0.017,
      0.015,
      0.075,
      8,
      trs(gx + dir * 0.012 - dir * 0.062, y - 0.2, z + 0.032, 0, 1, 1, 1, 0, dir * 0.6),
    );
    addBox(builder, 'reflectiveStrip', 0.085, 0.014, 0.045, gx + dir * 0.01, y - 0.085, z + 0.02, dir * 0.14, {
      cast: false,
    });
  }
}

/* --- Small wall gear ---------------------------------------------- */

function buildSmallGear(builder) {
  // Heater / thermostat control box on the east wall, south of the shelves.
  const { x, y, z } = WALL.control;
  addBox(builder, 'steel', 0.035, 0.36, 0.26, x, y, z);
  addBox(builder, 'panelSeam', 0.008, 0.32, 0.22, x - 0.019, y, z, 0, { cast: false });
  addBox(builder, 'blackPlastic', 0.006, 0.06, 0.13, x - 0.022, y + 0.1, z, 0, { cast: false });
  addBox(builder, 'ledGreen', 0.006, 0.01, 0.01, x - 0.024, y + 0.1, z + 0.05, 0, {
    cast: false,
    receive: false,
  });
  addCylinder(
    builder,
    'warningRed',
    0.018,
    0.018,
    0.014,
    12,
    trs(x - 0.025, y - 0.02, z, 0, 1, 1, 1, 0, Math.PI / 2),
    { cast: false },
  );
  addCylinder(
    builder,
    'whitePlastic',
    0.018,
    0.018,
    0.014,
    12,
    trs(x - 0.025, y - 0.09, z, 0, 1, 1, 1, 0, Math.PI / 2),
    { cast: false },
  );
  for (let i = 0; i < 6; i += 1) {
    addBox(builder, 'steelDark', 0.006, 0.008, 0.07, x - 0.02, y - 0.14, z - 0.075 + i * 0.03, 0, {
      cast: false,
    });
  }
}

/* --- Assembly ------------------------------------------------------ */

export function buildRoom(builder, materials, root) {
  buildFloor(builder);
  buildShell(builder);
  buildDoorFrame(builder);
  const doorGroup = buildDoorLeaf(materials);
  root.add(doorGroup);
  buildMonitorBracket(builder);
  buildDial(builder);
  buildCeilingLights(builder);
  const fans = buildEvaporator(builder, materials, root);
  buildSensor(builder);
  buildGarmentRail(builder);
  const cameraHead = buildCamera(builder, materials, root);
  buildSmallGear(builder);

  return { doorGroup, fans, cameraHead };
}
