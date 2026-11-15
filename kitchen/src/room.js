import * as THREE from 'three';
import {
  boxGeometry,
  cylinderGeometry,
  planeGeometry,
  sphereGeometry,
  torusGeometry,
  tubeGeometry,
  uvScaledPlane,
  trs,
  frustumGeometry,
} from './geometry.js';
import {
  ROOM,
  HALF_W,
  HALF_D,
  PASS,
  DINING_DOOR,
  FREIGHT,
  COLD,
  COOKING,
  CEILING,
} from './config.js';
import { buildServiceDoor } from '../../dining/src/room.js';

/* ------------------------------------------------------------------ *
 * The kitchen shell and ceiling services.
 *
 * White glazed tile wraps the full height. The floor is grey anti-slip
 * quarry tile; the ceiling is a 600 mm aluminium lay-in grid with nine
 * cool-white explosion-proof panels. The pass-through, freight elevator,
 * cold-room door, exhaust hood, duct run, sprinklers, detectors and four
 * cabled dome cameras all live here.
 * ------------------------------------------------------------------ */

const WALL_TILE = 1.2;
const FLOOR_TILE = 1.2;
const CEIL_TILE = 1.2;
const T = 0.001;
const EYE = ROOM.eyeHeight;

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

function wallColliders() {
  return [
    { x: 0, z: -HALF_D - 0.12, hx: HALF_W + 0.2, hz: 0.13 },
    { x: 0, z: HALF_D + 0.12, hx: HALF_W + 0.2, hz: 0.13 },
    { x: -HALF_W - 0.12, z: 0, hx: 0.13, hz: HALF_D + 0.2 },
    { x: HALF_W + 0.12, z: 0, hx: 0.13, hz: HALF_D + 0.2 },
  ];
}

/* --- Pass-through to the dining hall ------------------------------ */

function buildPass(builder, materials) {
  const z0 = PASS.centerZ - PASS.width / 2;
  const z1 = PASS.centerZ + PASS.width / 2;

  // Opening jamb covers and header, in stainless so the tiled cut edge
  // is never visible.
  addBox(builder, 'trimSteel', 0.1, PASS.height + 0.04, 0.09, HALF_W - 0.04, PASS.height / 2, z0, 0, { cast: false });
  addBox(builder, 'trimSteel', 0.1, PASS.height + 0.04, 0.09, HALF_W - 0.04, PASS.height / 2, z1, 0, { cast: false });
  addBox(builder, 'trimSteel', 0.1, 0.09, PASS.width + 0.18, HALF_W - 0.04, PASS.height + 0.02, PASS.centerZ, 0, { cast: false });

  // Counter: a single stainless slab running through the wall opening,
  // with a cabinet body on the kitchen side and two outer legs.
  const topWidth = PASS.counterDepthInside + PASS.counterDepthOutside;
  const topCenterX = HALF_W - PASS.counterDepthInside / 2 + PASS.counterDepthOutside / 2;
  addBox(
    builder,
    'steelPolished',
    topWidth,
    0.05,
    PASS.width + 0.28,
    topCenterX,
    PASS.counterY - 0.025,
    PASS.centerZ,
  );
  const innerX = HALF_W - PASS.counterDepthInside;
  const cabinetX = HALF_W - PASS.counterDepthInside / 2 - 0.005;
  const toeX = HALF_W - PASS.counterDepthInside / 2 - 0.02;
  addBox(builder, 'steel', PASS.counterDepthInside - 0.04, 0.86, PASS.width + 0.12, cabinetX, 0.43, PASS.centerZ);
  addBox(builder, 'steelDark', PASS.counterDepthInside - 0.1, 0.1, PASS.width + 0.02, toeX, 0.05, PASS.centerZ);
  addBox(builder, 'rubber', 0.02, 0.08, PASS.width + 0.1, innerX - 0.01, 0.06, PASS.centerZ, 0, { cast: false });
  for (const side of [-1, 1]) {
    addBox(builder, 'steel', 0.02, 0.66, 1.04, innerX - 0.005, 0.47, PASS.centerZ + side * 0.66, 0, { cast: false });
    addBox(builder, 'steelDark', 0.012, 0.55, 0.92, innerX - 0.018, 0.47, PASS.centerZ + side * 0.66, 0, { cast: false });
    addCylinder(
      builder,
      'steelPolished',
      0.012,
      0.012,
      0.22,
      8,
      trs(innerX - 0.032, 0.68, PASS.centerZ + side * 0.22),
      { cast: false },
    );
  }
  const legX = HALF_W + PASS.counterDepthOutside - 0.08;
  for (const z of [z0 + 0.18, z1 - 0.18]) {
    addBox(builder, 'steelDark', 0.06, 0.9, 0.06, legX, 0.45, z);
    addBox(builder, 'steelDark', 0.4, 0.04, 0.4, legX, 0.02, z);
  }

  // Two serving trays and stacked plates on the pass counter.
  for (const z of [PASS.centerZ - 0.62, PASS.centerZ + 0.55]) {
    addBox(builder, 'steelDark', 0.42, 0.025, 0.62, HALF_W - 0.44, PASS.counterY + 0.014, z);
    for (let i = 0; i < 4; i += 1) {
      addCylinder(
        builder,
        'ceramic',
        0.105,
        0.095,
        0.018,
        20,
        trs(HALF_W - 0.43, PASS.counterY + 0.04 + i * 0.019, z + (i % 2 === 0 ? 0.02 : -0.02)),
      );
    }
  }

  // Hot lamps: a small stainless warming shelf inside the pass.
  addBox(builder, 'steel', 0.56, 0.04, 2.3, HALF_W - 0.3, 2.13, PASS.centerZ);
  for (const z of [PASS.centerZ - 0.55, PASS.centerZ + 0.55]) {
    addBox(builder, 'warmLamp', 0.42, 0.012, 0.11, HALF_W - 0.3, 2.1, z, 0, { cast: false, receive: false });
    addBox(builder, 'steelDark', 0.46, 0.025, 0.14, HALF_W - 0.3, 2.12, z, 0, { cast: false });
  }

  /* Double impact doors above the counter. Each leaf is a stainless
   * frame around a clear panel, with push bars, hinges and rubber
   * bumpers. They are closed; the warm vestibule is visible through the
   * glass, so the opening never reads as a black hole. */
  const doorBottom = 0.97;
  const doorHeight = 1.22;
  const leafWidth = 1.16;
  const doorX = HALF_W + 0.045;
  const leafCenters = [PASS.centerZ - leafWidth / 2 - 0.02, PASS.centerZ + leafWidth / 2 + 0.02];
  for (const centerZ of leafCenters) {
    const direction = centerZ < PASS.centerZ ? -1 : 1;
    const leadingZ = centerZ - direction * leafWidth / 2;
    const outerZ = centerZ + direction * leafWidth / 2;
    // Outer frame: two stiles and two rails.
    addBox(builder, 'steelPolished', 0.045, doorHeight, 0.075, doorX, doorBottom + doorHeight / 2, outerZ);
    addBox(builder, 'steelPolished', 0.045, doorHeight, 0.075, doorX, doorBottom + doorHeight / 2, leadingZ);
    addBox(builder, 'steelPolished', 0.045, 0.13, leafWidth, doorX, doorBottom + 0.065, centerZ);
    addBox(builder, 'steelPolished', 0.045, 0.12, leafWidth, doorX, doorBottom + doorHeight - 0.06, centerZ);
    // Solid lower kick panel: the leaf reads as an impact door, not a
    // frameless window floating above the pass counter.
    addBox(builder, 'steelPolished', 0.045, 0.18, leafWidth, doorX, doorBottom + 0.15, centerZ);
    addBox(builder, 'steelDark', 0.05, 0.02, leafWidth - 0.04, doorX, doorBottom + 0.24, centerZ, 0, { cast: false });
    // Clear panel.
    builder.add(
      'glass',
      boxGeometry(0.012, doorHeight - 0.24, leafWidth - 0.15),
      trs(doorX, doorBottom + doorHeight / 2 + 0.005, centerZ),
      { cast: false, receive: false },
    );
    // Push bar on the kitchen face and a rubber leading bumper.
    addCylinder(builder, 'steelPolished', 0.018, 0.018, leafWidth - 0.2, 12, trs(doorX - 0.06, 1.4, centerZ, 0, 1, 1, 1, 0, Math.PI / 2));
    addBox(builder, 'steelDark', 0.06, 0.04, 0.04, doorX - 0.05, 1.4, centerZ - (leafWidth - 0.2) / 2);
    addBox(builder, 'steelDark', 0.06, 0.04, 0.04, doorX - 0.05, 1.4, centerZ + (leafWidth - 0.2) / 2);
    addBox(builder, 'rubber', 0.05, doorHeight - 0.04, 0.035, doorX, doorBottom + doorHeight / 2, leadingZ);
    // Hinges.
    for (const y of [doorBottom + 0.2, doorBottom + doorHeight - 0.2]) {
      addCylinder(builder, 'steelPolished', 0.02, 0.02, 0.12, 10, trs(doorX, y, outerZ, 0, 1, 1, 1, 0, 0));
    }
  }

  /* Warm hand-off vestibule. Warm plaster and dark oak deliberately
   * echo the dining hall so the pass reads as a threshold between two
   * different rooms, not another service corridor. */
  const vx0 = HALF_W;
  const vx1 = HALF_W + PASS.vestibuleDepth;
  const vHalf = PASS.vestibuleWidth / 2;
  const vz0 = PASS.centerZ - vHalf;
  const vz1 = PASS.centerZ + vHalf;
  addPlane(
    builder,
    'darkWood',
    PASS.vestibuleDepth,
    PASS.vestibuleWidth,
    trs((vx0 + vx1) / 2, 0.002, PASS.centerZ, 0, 1, 1, 1, -Math.PI / 2),
    WALL_TILE,
  );
  addPlane(
    builder,
    'warmPlaster',
    PASS.vestibuleDepth,
    PASS.vestibuleHeight,
    trs((vx0 + vx1) / 2, PASS.vestibuleHeight / 2, vz0, Math.PI),
    WALL_TILE,
  );
  addPlane(
    builder,
    'warmPlaster',
    PASS.vestibuleDepth,
    PASS.vestibuleHeight,
    trs((vx0 + vx1) / 2, PASS.vestibuleHeight / 2, vz1),
    WALL_TILE,
  );
  addPlane(
    builder,
    'warmPlaster',
    PASS.vestibuleWidth,
    PASS.vestibuleHeight,
    trs(vx1, PASS.vestibuleHeight / 2, PASS.centerZ, -Math.PI / 2),
    WALL_TILE,
  );
  addPlane(
    builder,
    'warmPlaster',
    PASS.vestibuleDepth,
    PASS.vestibuleWidth,
    trs((vx0 + vx1) / 2, PASS.vestibuleHeight, PASS.centerZ, 0, 1, 1, 1, Math.PI / 2),
    WALL_TILE,
  );

  // Wainscot, chair rail and a warm ceiling panel at the end wall.
  for (const z of [vz0 + 0.008, vz1 - 0.008]) {
    addBox(builder, 'darkWood', PASS.vestibuleDepth - 0.01, 0.94, 0.018, (vx0 + vx1) / 2, 0.47, z, 0, { cast: false });
    addBox(builder, 'trimSteel', PASS.vestibuleDepth - 0.01, 0.035, 0.028, (vx0 + vx1) / 2, 0.955, z, 0, { cast: false });
  }
  addBox(builder, 'darkWood', 0.018, 0.94, PASS.vestibuleWidth - 0.02, vx1 - 0.01, 0.47, PASS.centerZ, 0, { cast: false });
  addBox(builder, 'trimSteel', 0.028, 0.035, PASS.vestibuleWidth - 0.02, vx1 - 0.01, 0.955, PASS.centerZ, 0, { cast: false });
  addBox(builder, 'trimSteel', 0.02, 0.025, PASS.vestibuleWidth - 0.2, vx1 - 0.01, 2.15, PASS.centerZ, 0, { cast: false });
  addBox(builder, 'warmLamp', 0.46, 0.012, 0.46, (vx0 + vx1) / 2 + 0.2, PASS.vestibuleHeight - 0.018, PASS.centerZ, 0, {
    cast: false,
    receive: false,
  });
  addBox(builder, 'trimSteel', 0.54, 0.025, 0.54, (vx0 + vx1) / 2 + 0.2, PASS.vestibuleHeight - 0.006, PASS.centerZ, 0, { cast: false });
  // A slim console ledge at the end: no poster, no lettering.
  addBox(builder, 'darkWood', 0.3, 0.045, 1.1, vx1 - 0.2, 0.98, PASS.centerZ, 0, { cast: false });
  addBox(builder, 'steelPolished', 0.18, 0.02, 0.18, vx1 - 0.28, 1.012, PASS.centerZ - 0.3, 0, { cast: false });
  addCylinder(builder, 'ceramic', 0.075, 0.055, 0.12, 18, trs(vx1 - 0.28, 1.082, PASS.centerZ - 0.3), { cast: false });

  return {
    light: {
      position: new THREE.Vector3((vx0 + vx1) / 2 + 0.15, PASS.vestibuleHeight - 0.1, PASS.centerZ),
      color: 0xffc98a,
      intensity: 2.6,
      distance: 3.6,
    },
  };
}

/* --- Return door to the dining hall ------------------------------- */

function buildDiningReturnDoor(builder, materials) {
  const z = DINING_DOOR.centerZ;
  const half = DINING_DOOR.width / 2;
  const faceX = DINING_DOOR.wallX - 0.045;

  // Oak casing around the tile opening, deliberately matching the dining
  // hall's service door rather than the kitchen's stainless equipment.
  addBox(builder, 'oak', 0.09, DINING_DOOR.height + 0.12, 0.08, faceX, (DINING_DOOR.height + 0.12) / 2, z - half - 0.045);
  addBox(builder, 'oak', 0.09, DINING_DOOR.height + 0.12, 0.08, faceX, (DINING_DOOR.height + 0.12) / 2, z + half + 0.045);
  addBox(builder, 'oak', 0.09, 0.12, DINING_DOOR.width + 0.18, faceX, DINING_DOOR.height + 0.06, z);
  addBox(builder, 'brass', 0.1, 0.012, DINING_DOOR.width + 0.12, DINING_DOOR.wallX - 0.035, 0.006, z, 0, { cast: false });

  // Mirrored hinge: hingeDirection -1 puts the pull on the opposite side
  // from the dining hall's kitchen door.
  const door = buildServiceDoor(materials, {
    width: DINING_DOOR.width,
    height: DINING_DOOR.height,
    hingeDirection: -1,
  });
  door.group.position.set(DINING_DOOR.wallX - 0.03, 0.02, z + half - 0.02);
  door.group.rotation.y = -Math.PI / 2;

  const item = {
    id: DINING_DOOR.id,
    label: DINING_DOOR.label,
    sceneId: DINING_DOOR.sceneId,
    portal: true,
    open: false,
    value: 0,
    target: 0,
    hitRoots: [door.group],
  };

  return { group: door.group, item };
}

/* --- Freight elevator door ---------------------------------------- */

function buildFreightDoor(builder, materials) {
  const z = FREIGHT.centerZ;
  const wallX = -HALF_W;
  const frameX = wallX + 0.06;
  const doorX = wallX + 0.09;

  addBox(builder, 'trimSteel', 0.16, FREIGHT.height + 0.18, 0.12, frameX, FREIGHT.height / 2, z - FREIGHT.width / 2 - 0.05);
  addBox(builder, 'trimSteel', 0.16, FREIGHT.height + 0.18, 0.12, frameX, FREIGHT.height / 2, z + FREIGHT.width / 2 + 0.05);
  addBox(builder, 'trimSteel', 0.16, 0.13, FREIGHT.width + 0.22, frameX, FREIGHT.height + 0.07, z);
  addBox(builder, 'steelDark', 0.16, 0.025, FREIGHT.width + 0.1, doorX - 0.04, 0.012, z, 0, { cast: false });

  const half = FREIGHT.width / 2;
  for (const side of [-1, 1]) {
    const centerZ = z + side * half / 2;
    addBox(builder, 'steel', 0.06, FREIGHT.height - 0.06, half - 0.012, doorX, (FREIGHT.height - 0.06) / 2, centerZ);
    // Recessed vertical ribs.
    for (let i = 0; i < 3; i += 1) {
      addBox(
        builder,
        'steelDark',
        0.012,
        FREIGHT.height - 0.24,
        0.02,
        doorX + 0.035,
        (FREIGHT.height - 0.06) / 2,
        centerZ + (i - 1) * 0.17,
        0,
        { cast: false },
      );
    }
    addBox(builder, 'hazardYellow', 0.012, 0.16, half - 0.08, doorX + 0.037, 0.15, centerZ, 0, { cast: false });
  }
  addBox(builder, 'rubber', 0.04, FREIGHT.height - 0.05, 0.018, doorX + 0.03, FREIGHT.height / 2 - 0.015, z);

  // Call panel and floor-direction indicator (no lettering).
  addBox(builder, 'steelPolished', 0.035, 0.32, 0.16, wallX + 0.03, 1.32, z + FREIGHT.width / 2 + 0.26);
  for (let i = 0; i < 2; i += 1) {
    addCylinder(
      builder,
      i === 0 ? 'hazardYellow' : 'steelDark',
      0.024,
      0.024,
      0.018,
      16,
      trs(wallX + 0.055, 1.38 - i * 0.12, z + FREIGHT.width / 2 + 0.26, 0, 1, 1, 1, 0, Math.PI / 2),
      { cast: false },
    );
  }
  addBox(builder, 'blackPlastic', 0.035, 0.12, 0.48, wallX + 0.03, 2.42, z);
  for (const side of [-1, 1]) {
    addCylinder(
      builder,
      side < 0 ? 'warmLamp' : 'steelDark',
      0.016,
      0.016,
      0.008,
      12,
      trs(wallX + 0.052, 2.42, z + side * 0.11, 0, 1, 1, 1, 0, Math.PI / 2),
      { cast: false, receive: false },
    );
  }
  // A small floor stop / threshold.
  addBox(builder, 'hazardYellow', 0.16, 0.014, FREIGHT.width, doorX - 0.05, 0.007, z, 0, { cast: false });
  for (let i = 0; i < 5; i += 1) {
    addBox(
      builder,
      'blackPlastic',
      0.165,
      0.016,
      0.14,
      doorX - 0.05,
      0.009,
      z - FREIGHT.width / 2 + 0.18 + i * 0.33,
      0,
      { cast: false },
    );
  }
}

/* --- Cold-room door ----------------------------------------------- */

function buildColdDoor(builder, materials) {
  const x = COLD.centerX;
  const z = COLD.wallZ;
  const frameZ = z + 0.075;
  const doorZ = z + 0.125;

  // Heavy frame.
  addBox(builder, 'trimSteel', 0.12, COLD.height + 0.16, 0.18, x - COLD.width / 2 - 0.06, COLD.height / 2, frameZ);
  addBox(builder, 'trimSteel', 0.12, COLD.height + 0.16, 0.18, x + COLD.width / 2 + 0.06, COLD.height / 2, frameZ);
  addBox(builder, 'trimSteel', COLD.width + 0.24, 0.14, 0.18, x, COLD.height + 0.07, frameZ);
  addBox(builder, 'steelDark', COLD.width + 0.26, 0.05, 0.24, x, 0.025, frameZ, 0, { cast: false });

  // Insulated door leaf with a raised outer panel and rubber gasket.
  addBox(builder, 'steel', COLD.width - 0.04, COLD.height - 0.06, 0.12, x, COLD.height / 2, doorZ);
  addBox(builder, 'steelPolished', COLD.width - 0.16, COLD.height - 0.2, 0.025, x, COLD.height / 2, doorZ + 0.072);
  addBox(builder, 'steelDark', COLD.width - 0.22, COLD.height - 0.28, 0.012, x, COLD.height / 2, doorZ + 0.086, 0, { cast: false });
  for (const side of [-1, 1]) {
    addBox(builder, 'rubber', 0.035, COLD.height - 0.08, 0.018, x + side * (COLD.width / 2 - 0.035), COLD.height / 2, doorZ + 0.07);
  }
  addBox(builder, 'rubber', COLD.width - 0.07, 0.035, 0.018, x, 0.055, doorZ + 0.07);
  addBox(builder, 'steel', COLD.width - 0.1, 0.14, 0.03, x, 0.1, doorZ + 0.09, 0, { cast: false });
  addBox(builder, 'rubber', COLD.width - 0.12, 0.02, 0.06, x, 0.012, doorZ - 0.04, 0, { cast: false });

  // Hinges, handle and latch.
  for (const y of [0.38, 1.08, 1.78]) {
    addCylinder(builder, 'steelPolished', 0.038, 0.038, 0.2, 12, trs(x - COLD.width / 2 + 0.02, y, doorZ + 0.085));
    addBox(builder, 'steelDark', 0.1, 0.08, 0.04, x - COLD.width / 2 + 0.08, y, doorZ + 0.075);
  }
  addBox(builder, 'steelPolished', 0.14, 0.26, 0.04, x + COLD.width / 2 - 0.15, 1.02, doorZ + 0.1);
  addBox(builder, 'blackPlastic', 0.23, 0.045, 0.05, x + COLD.width / 2 - 0.28, 1.02, doorZ + 0.13);
  addCylinder(builder, 'rubber', 0.026, 0.026, 0.16, 10, trs(x + COLD.width / 2 - 0.38, 1.02, doorZ + 0.15, 0, 1, 1, 1, 0, Math.PI / 2));
  addBox(builder, 'steelPolished', 0.24, 0.08, 0.03, x, 1.55, doorZ + 0.1, 0, { cast: false });

  // Anti-condensation heater tracing around the frame: a thin warm line
  // that is visible without lighting the room.
  addBox(builder, 'heaterWire', COLD.width + 0.1, 0.009, 0.014, x, 0.18, frameZ + 0.095, 0, { cast: false, receive: false });
  addBox(builder, 'heaterWire', COLD.width + 0.1, 0.009, 0.014, x, COLD.height - 0.1, frameZ + 0.095, 0, { cast: false, receive: false });
  addBox(builder, 'heaterWire', 0.009, COLD.height - 0.28, 0.014, x - COLD.width / 2 - 0.06, COLD.height / 2, frameZ + 0.095, 0, { cast: false, receive: false });
  addBox(builder, 'heaterWire', 0.009, COLD.height - 0.28, 0.014, x + COLD.width / 2 + 0.06, COLD.height / 2, frameZ + 0.095, 0, { cast: false, receive: false });

  // Circular thermometer, deliberately without numerals.
  addCylinder(builder, 'steelPolished', 0.085, 0.085, 0.022, 24, trs(x + COLD.width / 2 + 0.28, 1.78, frameZ + 0.11, 0, 1, 1, 1, Math.PI / 2, 0));
  addCylinder(builder, 'ceramic', 0.068, 0.068, 0.012, 24, trs(x + COLD.width / 2 + 0.28, 1.78, frameZ + 0.14, 0, 1, 1, 1, Math.PI / 2, 0));
  addBox(builder, 'fireRed', 0.006, 0.052, 0.006, x + COLD.width / 2 + 0.28, 1.795, frameZ + 0.148, 0, { cast: false });
  addBox(builder, 'blackPlastic', 0.014, 0.014, 0.018, x + COLD.width / 2 + 0.28, 1.78, frameZ + 0.152, 0, { cast: false });

  // Portal hit proxy to the walk-in cold store. The door leaf itself is
  // welded into the static batch, so a colourless pick volume sits over
  // it: one draw call, no visual footprint, full raycast coverage.
  const hitGroup = new THREE.Group();
  hitGroup.name = 'cold-store-portal-hit';
  const hit = new THREE.Mesh(
    boxGeometry(COLD.width, COLD.height, 0.16),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      colorWrite: false,
      toneMapped: false,
    }),
  );
  hit.position.set(x, COLD.height / 2, doorZ + 0.02);
  hit.name = 'cold-store-portal-volume';
  hitGroup.add(hit);
  hitGroup.updateMatrixWorld(true);

  return {
    group: hitGroup,
    item: {
      id: 'door.coldstore',
      label: '冷库',
      sceneId: 'coldstore',
      portal: true,
      open: false,
      value: 0,
      target: 0,
      hitRoots: [hitGroup],
    },
  };
}

/* --- Ceiling, hood and services ----------------------------------- */

function buildCeiling(builder, materials) {
  // Ceiling plane.
  addPlane(
    builder,
    'ceilingPanel',
    ROOM.width,
    ROOM.depth,
    trs(0, ROOM.height, 0, 0, 1, 1, 1, Math.PI / 2),
    CEIL_TILE,
  );

  // 600 mm T-grid, laid over the seams.
  const bar = 0.014;
  for (let x = -HALF_W; x <= HALF_W + 0.001; x += 0.6) {
    addBox(builder, 'ceilingGrid', bar, 0.02, ROOM.depth, x, ROOM.height - 0.014, 0, 0, { cast: false, receive: false });
  }
  for (let z = -HALF_D; z <= HALF_D + 0.001; z += 0.6) {
    addBox(builder, 'ceilingGrid', ROOM.width, 0.02, bar, 0, ROOM.height - 0.014, z, 0, { cast: false, receive: false });
  }
  addBox(builder, 'ceilingGrid', ROOM.width, 0.035, 0.04, 0, ROOM.height - 0.02, -HALF_D + 0.02, 0, { cast: false });
  addBox(builder, 'ceilingGrid', ROOM.width, 0.035, 0.04, 0, ROOM.height - 0.02, HALF_D - 0.02, 0, { cast: false });
  addBox(builder, 'ceilingGrid', 0.04, 0.035, ROOM.depth, -HALF_W + 0.02, ROOM.height - 0.02, 0, 0, { cast: false });
  addBox(builder, 'ceilingGrid', 0.04, 0.035, ROOM.depth, HALF_W - 0.02, ROOM.height - 0.02, 0, 0, { cast: false });

  // 15 × 600 mm explosion-proof LED panels, evenly distributed over the
  // long 12 × 22 m room.
  for (const light of CEILING.lights) {
    const size = 0.62;
    addBox(builder, 'ceilingGrid', size + 0.06, 0.045, size + 0.06, light.x, ROOM.height - 0.04, light.z, 0, {
      cast: false,
      receive: false,
    });
    for (const side of [-1, 1]) {
      addBox(builder, 'trimSteel', size + 0.02, 0.02, 0.035, light.x, ROOM.height - 0.064, light.z + side * size / 2, 0, {
        cast: false,
        receive: false,
      });
      addBox(builder, 'trimSteel', 0.035, 0.02, size + 0.02, light.x + side * size / 2, ROOM.height - 0.064, light.z, 0, {
        cast: false,
        receive: false,
      });
    }
    builder.add(
      'ledWhite',
      planeGeometry(0.56, 0.56),
      trs(light.x, ROOM.height - 0.068, light.z, 0, 1, 1, 1, Math.PI / 2),
      { cast: false, receive: false },
    );
  }

  /* Exhaust hood over the wok range. */
  const hood = COOKING.hood;
  builder.add(
    'steel',
    frustumGeometry(hood.width, hood.depth, 2.35, 0.92, hood.top - hood.bottom),
    trs(hood.x, hood.bottom, hood.z),
    { cast: true, receive: true },
  );
  addBox(builder, 'steelPolished', hood.width + 0.04, 0.07, hood.depth + 0.04, hood.x, hood.bottom + 0.035, hood.z);
  addBox(builder, 'steelDark', hood.width + 0.06, 0.035, hood.depth + 0.06, hood.x, hood.bottom - 0.015, hood.z, 0, { cast: false });
  addBox(builder, 'steel', 2.42, 0.09, 0.98, hood.x, hood.top + 0.02, hood.z);
  addBox(builder, 'steelDark', 1.48, 0.08, 2.18, hood.x, hood.bottom + 0.12, hood.z, 0, { cast: false });

  // Grease filters: two rows of five, with slim frames.
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      const fx = hood.x - 1.42 + col * 0.71;
      const fz = hood.z - 0.38 + row * 0.72;
      builder.add(
        'grease',
        planeGeometry(0.63, 0.47),
        trs(fx, hood.bottom - 0.03, fz, 0, 1, 1, 1, Math.PI / 2),
        { cast: false, receive: false },
      );
      for (let i = 0; i < 3; i += 1) {
        addBox(builder, 'steelDark', 0.64, 0.012, 0.012, fx, hood.bottom - 0.038, fz - 0.14 + i * 0.14, 0, {
          cast: false,
          receive: false,
        });
      }
    }
  }
  for (const x of [hood.x - 1.15, hood.x + 1.15]) {
    addBox(builder, 'ledWhite', 0.52, 0.012, 0.09, x, hood.bottom - 0.045, hood.z, 0, { cast: false, receive: false });
  }

  // Vertical collar and the main galvanised duct run.
  addBox(builder, 'galvanized', 0.82, 0.62, 0.6, hood.x, (hood.top + 0.51 + ROOM.height) / 2, hood.z);
  addBox(builder, 'galvanized', 0.9, 0.05, 0.68, hood.x, 2.69, hood.z);
  addBox(builder, 'galvanized', 0.86, 0.05, 0.64, hood.x, 3.0, hood.z);
  const ductLength = ROOM.width - 1.2;
  addBox(builder, 'galvanized', ductLength, 0.52, 0.62, 0, 2.98, hood.z - 0.04);
  for (let x = -ductLength / 2 + 0.4; x <= ductLength / 2 - 0.2; x += 1.15) {
    addBox(builder, 'galvanized', 0.06, 0.58, 0.68, x, 2.98, hood.z - 0.04, 0, { cast: false });
  }
  for (let x = -ductLength / 2 + 1.0; x <= ductLength / 2 - 0.8; x += 2.3) {
    addCylinder(builder, 'trimSteel', 0.009, 0.009, 0.28, 6, trs(x, 3.12, hood.z - 0.04), { cast: false });
    addBox(builder, 'trimSteel', 0.04, 0.02, 0.72, x, 3.25, hood.z - 0.04, 0, { cast: false });
  }

  /* Fire sprinkler pipe and pendent heads. */
  const sprinklerRows = [...new Set(CEILING.sprinklers.map((s) => s.z))];
  for (const z of sprinklerRows) {
    addCylinder(builder, 'redPipe', 0.021, 0.021, ROOM.width - 0.8, 10, trs(0, 3.07, z, 0, 1, 1, 1, 0, Math.PI / 2));
    for (const s of CEILING.sprinklers.filter((spr) => spr.z === z)) {
      addCylinder(builder, 'redPipe', 0.012, 0.012, 0.12, 8, trs(s.x, 3.01, z));
      addCylinder(builder, 'trimSteel', 0.036, 0.025, 0.035, 12, trs(s.x, 2.95, z), { cast: false });
      addCylinder(builder, 'fireRed', 0.013, 0.013, 0.055, 8, trs(s.x, 2.92, z), { cast: false });
      addCylinder(builder, 'trimSteel', 0.026, 0.042, 0.012, 12, trs(s.x, 2.885, z), { cast: false });
    }
  }
  addCylinder(builder, 'redPipe', 0.021, 0.021, ROOM.depth - 1.6, 10, trs(0, 3.07, 0, 0, 1, 1, 1, Math.PI / 2, 0));
  for (const z of sprinklerRows) {
    addBox(builder, 'redPipe', 0.04, 0.05, 0.04, 0, 3.07, z);
  }

  /* Smoke detectors. */
  for (const detector of CEILING.detectors) {
    addCylinder(builder, 'whitePlastic', 0.1, 0.1, 0.028, 20, trs(detector.x, ROOM.height - 0.03, detector.z), { cast: false });
    addCylinder(builder, 'steelDark', 0.055, 0.055, 0.014, 16, trs(detector.x, ROOM.height - 0.048, detector.z), { cast: false });
    addCylinder(builder, 'fireRed', 0.008, 0.008, 0.006, 8, trs(detector.x + 0.06, ROOM.height - 0.048, detector.z), {
      cast: false,
      receive: false,
    });
  }

  /* Dome cameras with visible black cable loops. */
  const base = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3(1, 1, 1);
  for (const camera of CEILING.cameras) {
    euler.set(0.34, camera.yaw, 0, 'YXZ');
    quaternion.setFromEuler(euler);
    position.set(camera.x, camera.y, camera.z);
    base.compose(position, quaternion, scale);

    const local = (x, y, z, rx = 0, ry = 0, rz = 0) =>
      new THREE.Matrix4().compose(
        new THREE.Vector3(x, y, z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')),
        scale,
      );
    const addLocal = (key, geometry, matrix) => {
      builder.add(key, geometry, base.clone().multiply(matrix), { cast: false, receive: false });
    };
    addLocal('trimSteel', cylinderGeometry(0.085, 0.085, 0.028, 18), local(0, 0, 0));
    addLocal('blackPlastic', cylinderGeometry(0.062, 0.062, 0.1, 18), local(0, -0.06, 0));
    addLocal('blackPlastic', sphereGeometry(0.078, 18, 10), local(0, -0.1, 0.02, 0, 0, 0));
    addLocal('steelDark', cylinderGeometry(0.04, 0.04, 0.025, 18), local(0, -0.1, 0.09, Math.PI / 2, 0, 0));
    addLocal('blackPlastic', cylinderGeometry(0.028, 0.028, 0.012, 18), local(0, -0.1, 0.105, Math.PI / 2, 0, 0));
    addLocal('fireRed', sphereGeometry(0.007, 8, 6), local(0.045, -0.045, 0.075));

    const cable = tubeGeometry(
      [
        [camera.x + 0.26, ROOM.height - 0.008, camera.z + 0.03],
        [camera.x + 0.18, 3.08, camera.z + 0.08],
        [camera.x + 0.06, 3.0, camera.z + 0.03],
        [camera.x + 0.015, 3.0, camera.z],
      ],
      0.012,
      18,
      6,
    );
    builder.add('rubber', cable, trs(0, 0, 0), { cast: false, receive: false });
    addBox(builder, 'steelDark', 0.11, 0.015, 0.11, camera.x + 0.26, ROOM.height - 0.008, camera.z + 0.03, 0, {
      cast: false,
      receive: false,
    });
  }
}

export function buildRoom(builder, materials) {
  const colliders = wallColliders();
  const interactables = [];

  // Floor.
  addPlane(
    builder,
    'floorTile',
    ROOM.width,
    ROOM.depth,
    trs(0, 0, 0, 0, 1, 1, 1, -Math.PI / 2),
    FLOOR_TILE,
    { receive: true },
  );

  // North and south walls.
  addPlane(builder, 'wallTile', ROOM.width, ROOM.height, trs(0, ROOM.height / 2, -HALF_D + T));
  addPlane(builder, 'wallTile', ROOM.width, ROOM.height, trs(0, ROOM.height / 2, HALF_D - T, Math.PI));

  // West wall, full.
  addPlane(builder, 'wallTile', ROOM.depth, ROOM.height, trs(-HALF_W + T, ROOM.height / 2, 0, Math.PI / 2));

  // East wall around the 2.4 × 2.2 m pass opening.
  const z0 = PASS.centerZ - PASS.width / 2;
  const z1 = PASS.centerZ + PASS.width / 2;
  const northSeg = z0 + HALF_D;
  const southSeg = HALF_D - z1;
  addPlane(
    builder,
    'wallTile',
    northSeg,
    ROOM.height,
    trs(HALF_W - T, ROOM.height / 2, -HALF_D + northSeg / 2, -Math.PI / 2),
  );
  addPlane(
    builder,
    'wallTile',
    southSeg,
    ROOM.height,
    trs(HALF_W - T, ROOM.height / 2, z1 + southSeg / 2, -Math.PI / 2),
  );
  addPlane(
    builder,
    'wallTile',
    PASS.width,
    ROOM.height - PASS.height,
    trs(HALF_W - T, PASS.height + (ROOM.height - PASS.height) / 2, PASS.centerZ, -Math.PI / 2),
  );

  // Stainless cove base.
  const coveH = 0.13;
  const coveD = 0.018;
  addBox(builder, 'steelDark', ROOM.width, coveH, coveD, 0, coveH / 2, -HALF_D + coveD / 2, 0, { cast: false });
  addBox(builder, 'steelDark', ROOM.width, coveH, coveD, 0, coveH / 2, HALF_D - coveD / 2, 0, { cast: false });
  addBox(builder, 'steelDark', coveD, coveH, ROOM.depth, -HALF_W + coveD / 2, coveH / 2, 0, 0, { cast: false });
  addBox(builder, 'steelDark', coveD, coveH, northSeg, HALF_W - coveD / 2, coveH / 2, -HALF_D + northSeg / 2, 0, { cast: false });
  addBox(builder, 'steelDark', coveD, coveH, southSeg, HALF_W - coveD / 2, coveH / 2, z1 + southSeg / 2, 0, { cast: false });

  // Stainless corner guards.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addBox(builder, 'trimSteel', 0.055, 2.4, 0.055, sx * (HALF_W - 0.035), 1.3, sz * (HALF_D - 0.035), 0, { cast: false });
    }
  }

  // Stainless splashback behind the wok range, with a folded top edge.
  addPlane(
    builder,
    'steel',
    COOKING.range.width + 0.24,
    0.92,
    trs(COOKING.range.x, 1.34, -HALF_D + 0.035),
    WALL_TILE,
  );
  addBox(builder, 'steelPolished', COOKING.range.width + 0.28, 0.05, 0.045, COOKING.range.x, 1.82, -HALF_D + 0.06);

  // Floor drains with stainless grates.
  for (const drain of [
    { x: 0.0, z: -2.0 },
    { x: -3.2, z: 9.4 },
    { x: 3.7, z: 9.4 },
  ]) {
    addBox(builder, 'steelDark', 0.5, 0.012, 0.34, drain.x, 0.006, drain.z, 0, { cast: false });
    for (let i = 0; i < 7; i += 1) {
      addBox(builder, 'steel', 0.44, 0.008, 0.018, drain.x, 0.013, drain.z - 0.13 + i * 0.043, 0, { cast: false });
    }
  }

  const pass = buildPass(builder, materials);
  const diningDoor = buildDiningReturnDoor(builder, materials);
  interactables.push(diningDoor.item);
  buildFreightDoor(builder, materials);
  const coldDoor = buildColdDoor(builder, materials);
  interactables.push(coldDoor.item);
  buildCeiling(builder, materials);

  return {
    colliders,
    vestibuleLight: pass.light,
    doorGroup: diningDoor.group,
    coldDoorGroup: coldDoor.group,
    interactables,
  };
}
