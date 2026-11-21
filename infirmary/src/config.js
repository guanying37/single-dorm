/* ------------------------------------------------------------------ *
 * Infirmary — dimensions, layout and interaction anchors.
 *
 * A 5.0 × 8.0 m clinic (width : depth = 5 : 8) on the ground floor of
 * the living wing. The white door sits on the south wall near the east
 * side; walking in, the sink and steel cabinet are on the right, five
 * mobile beds line the west wall behind pale-blue privacy curtains, and
 * the treatment / operating table occupies the east centre under a
 * ceiling-mounted surgical lamp.
 *
 * Coordinates: +X east, +Z south, +Y up, 1 unit = 1 m.
 * ------------------------------------------------------------------ */

export const ROOM = Object.freeze({
  width: 5.0,
  depth: 8.0,
  height: 3.0,
  wallThickness: 0.2,
  eyeHeight: 1.8,
  playerRadius: 0.3,
  area: 40.0,
  ratio: '5 : 8（宽 : 深）',
});

export const HALF_W = ROOM.width / 2; // 2.5
export const HALF_D = ROOM.depth / 2; // 4.0

export const START = Object.freeze({
  x: 1.15,
  z: 3.48,
  yaw: 0.0,
  pitch: -0.02,
  fov: 68,
});

export const MOVE = Object.freeze({
  walkSpeed: 2.2,
  runSpeed: 4.4,
  acceleration: 15.0,
  lookSensitivity: 0.0022,
  pitchLimit: (83 * Math.PI) / 180,
  bobHeight: 0.012,
  bobRunHeight: 0.022,
  bobFrequency: 5.6,
  bobLateral: 0.45,
  stepLength: 0.06,
});

/* White painted timber door in the south wall. Hinged on the east jamb,
 * kept locked: `sceneId` reserves the corridor hook. */
export const DOOR = Object.freeze({
  id: 'door.infirmary',
  label: '医务室门',
  sceneId: 'residence',
  centerX: 1.15,
  width: 0.95,
  height: 2.18,
  wallZ: HALF_D,
  hingeSide: 1,
  leafZ: HALF_D - 0.045,
});

/* Five mobile beds, heads on the west wall, feet into the room. The
 * five-tier curtain track runs parallel to the beds in the gaps. */
export const BED = Object.freeze({
  headX: -2.46,
  footX: -0.51,
  centerX: -1.485,
  length: 1.95,
  width: 0.92,
  mattressTop: 0.66,
  frameTop: 0.5,
  centersZ: Object.freeze([-3.15, -1.6, -0.05, 1.5, 3.05]),
});

/* Curtain dividers sit just south of each bed, leaving a clear slot for
 * the bedside cart. The last divider closes off the bed row from the
 * entrance. */
export const CURTAIN = Object.freeze({
  dividersZ: Object.freeze([-2.6, -1.05, 0.5, 2.05, 3.6]),
  trackX0: -2.48,
  trackX1: -0.42,
  trackY: 2.66,
  panelHeight: 2.38,
  panelWidth: 1.03,
  bottomY: 0.28,
});

/* Small rolling bedside tables at the head of every bed. */
export const CART = Object.freeze({
  x: -2.02,
  z: Object.freeze([-3.78, -2.28, -0.73, 0.82, 2.37]),
  width: 0.36,
  depth: 0.34,
  height: 0.72,
});

/* Medicine cabinet on the east wall: 1.5 m wide, 2.0 m high. Upper
 * three glass shelves behind sliding glass; lower three pull-out wooden
 * drawers with boxed supplies. */
export const CABINET = Object.freeze({
  id: 'cabinet',
  backX: HALF_W - 0.02,
  frontX: 2.1,
  centerX: 2.29,
  z: 1.3,
  width: 1.5,
  depth: 0.4,
  height: 2.0,
  toeKick: 0.1,
  lowerTop: 1.08,
  upperTop: 1.98,
  glassDoorId: 'cabinet.glass',
  drawerIds: Object.freeze(['cabinet.drawer.1', 'cabinet.drawer.2', 'cabinet.drawer.3']),
  drawerHeight: 0.3,
  drawerOpen: 0.3,
});

/* Hand basin and steel base cabinet immediately right of the door. */
export const SINK = Object.freeze({
  x0: 1.94,
  x1: HALF_W,
  z0: 2.9,
  z1: 3.78,
  topY: 0.9,
  centerZ: 3.34,
  basin: Object.freeze({ x: 2.23, z: 3.34, widthX: 0.42, widthZ: 0.34, depth: 0.18 }),
  mirror: Object.freeze({ x: HALF_W - 0.008, y: 1.62, z: 3.34, width: 0.78, height: 0.7 }),
  soap: Object.freeze({ x: HALF_W - 0.04, y: 2.12, z: 3.34 }),
});

/* Treatment / operating table under the ceiling surgical lamp, with a
 * stainless instrument tray stand beside it. */
export const OP = Object.freeze({
  x: 0.95,
  z: -1.15,
  length: 1.85,
  width: 0.64,
  topY: 0.85,
});

export const TRAY = Object.freeze({
  x: 1.64,
  z: -1.56,
  topY: 0.96,
  width: 0.58,
  depth: 0.4,
});

/* Tall steel supply cabinet in the north-east corner. */
export const STEEL_CAB = Object.freeze({
  x: HALF_W - 0.2,
  z: -3.0,
  width: 1.1,
  depth: 0.36,
  height: 1.9,
});

export const WASTE = Object.freeze({
  id: 'waste.bin',
  label: '医疗废弃物桶',
  x: 2.18,
  z: 0.27,
  radius: 0.19,
  height: 0.58,
});

export const STOOL = Object.freeze({
  x: 1.62,
  z: 1.38,
  seatY: 0.52,
});

export const PLANT = Object.freeze({
  x: -2.18,
  z: 3.79,
  potRadius: 0.17,
  potHeight: 0.28,
});

/* Wall-mounted split AC, security camera and its display, grouped high
 * on the north wall. */
export const WALL_KIT = Object.freeze({
  ac: Object.freeze({ x: 1.45, y: 2.55, z: -HALF_D + 0.15, width: 0.88, height: 0.3, depth: 0.24 }),
  camera: Object.freeze({ x: 0.2, y: 2.72, z: -HALF_D + 0.1 }),
  display: Object.freeze({ x: 0.64, y: 2.46, z: -HALF_D + 0.04, width: 0.46, height: 0.32 }),
  switch: Object.freeze({ x: 0.35, y: 1.32, z: HALF_D - 0.01 }),
});

/* Pale-blue bumper rail on the west wall, 1.0 m high. */
export const RAIL = Object.freeze({
  y: 1.0,
  height: 0.11,
  depth: 0.05,
  z0: -3.9,
  z1: 3.9,
});

export const CONTENT_COUNTS = {
  beds: 5,
  carts: 5,
  curtains: 5,
  bottles: 0,
  jars: 0,
  packages: 0,
  instruments: 0,
};

/* Static colliders. The four curtain dividers add dynamic boxes at
 * runtime; they are active only while the divider is closed. */
export const COLLIDERS = Object.freeze([
  // Room shell.
  { x: 0, z: -HALF_D - 0.1, hx: HALF_W + 0.3, hz: 0.12 },
  { x: 0, z: HALF_D + 0.1, hx: HALF_W + 0.3, hz: 0.12 },
  { x: -HALF_W - 0.1, z: 0, hx: 0.12, hz: HALF_D + 0.3 },
  { x: HALF_W + 0.1, z: 0, hx: 0.12, hz: HALF_D + 0.3 },
  // Five beds. The exact half-extents keep the 0.63 m gaps between beds
  // walkable with the 0.30 m player circle.
  ...BED.centersZ.map((z) => ({ x: BED.centerX, z, hx: BED.length / 2, hz: BED.width / 2 })),
  // Five bedside carts.
  ...CART.z.map((z) => ({ x: CART.x, z, hx: CART.width / 2, hz: CART.depth / 2 })),
  // Medicine cabinet.
  { x: CABINET.centerX, z: CABINET.z, hx: CABINET.depth / 2 + 0.01, hz: CABINET.width / 2 + 0.01 },
  // Sink counter and steel base.
  { x: (SINK.x0 + SINK.x1) / 2, z: (SINK.z0 + SINK.z1) / 2, hx: (SINK.x1 - SINK.x0) / 2, hz: (SINK.z1 - SINK.z0) / 2 },
  // Tall steel supply cabinet.
  { x: STEEL_CAB.x, z: STEEL_CAB.z, hx: STEEL_CAB.depth / 2 + 0.01, hz: STEEL_CAB.width / 2 + 0.01 },
  // Operating table.
  { x: OP.x, z: OP.z, hx: OP.width / 2 + 0.02, hz: OP.length / 2 + 0.02 },
  // Instrument tray stand.
  { x: TRAY.x, z: TRAY.z, hx: 0.23, hz: 0.2 },
  // Doctor stool.
  { x: STOOL.x, z: STOOL.z, hx: 0.24, hz: 0.24 },
  // Medical waste bin.
  { x: WASTE.x, z: WASTE.z, hx: WASTE.radius + 0.02, hz: WASTE.radius + 0.02 },
  // Potted pothos.
  { x: PLANT.x, z: PLANT.z, hx: 0.22, hz: 0.22 },
]);
