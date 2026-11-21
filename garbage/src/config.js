/* ------------------------------------------------------------------ *
 * Garbage processing room (垃圾处理场) — dimensions and layout.
 *
 * A 4.32 × 5.40 m service room in the living wing, exactly 4:5, 23.33 ㎡,
 * sitting inside the 5.4 × 5.4 m structural bay the design atlas marks as
 * "A · 垃圾场". The black-brown timber door is on the south wall; the two
 * wheeled industrial bins line the east wall; the rusty rack, the camera
 * and the monitor stack share the north-west corner (the rack sits in the
 * camera's blind spot); bags, cartons and the puddle gather at the west
 * wall.
 *
 * Coordinates: +X east, +Z south, +Y up. The camera starts just inside
 * the door, facing north up the working aisle.
 * ------------------------------------------------------------------ */

export const ROOM = Object.freeze({
  width: 4.32,
  depth: 5.4,
  height: 2.9,
  wallThickness: 0.24,
  eyeHeight: 1.8,
  playerRadius: 0.3,
});

export const HALF_W = ROOM.width / 2;
export const HALF_D = ROOM.depth / 2;

export const START = Object.freeze({
  x: 0.62,
  z: 2.16,
  yaw: 0.1,
  pitch: -0.035,
  fov: 68,
});

export const MOVE = Object.freeze({
  // A cluttered service room: a deliberate walk, Shift for a short burst.
  walkSpeed: 2.4,
  runSpeed: 4.8,
  acceleration: 16.0,
  lookSensitivity: 0.0022,
  pitchLimit: (83 * Math.PI) / 180,
  bobHeight: 0.012,
  bobRunHeight: 0.022,
  bobFrequency: 5.4,
  bobLateral: 0.45,
  stepLength: 0.06,
});

/* Black-brown timber door, 1.02 × 2.12 m. It stays locked: `sceneId` is
 * the reserved corridor hook. Six recessed panels, brass lever, kick
 * plate and a strip of light under the leaf. */
export const DOOR = Object.freeze({
  id: 'door.garbage',
  label: '垃圾处理场门',
  sceneId: 'residence',
  centerX: 0.58,
  width: 1.02,
  height: 2.12,
  wallZ: HALF_D,
  leafWidth: 1.0,
  leafHeight: 2.1,
  leafThickness: 0.062,
  hingeSide: -1,
  leafZ: HALF_D - 0.035,
  underlight: Object.freeze({ height: 0.012, color: 0xd9e6e0 }),
});

/* Yellowed, torn no-smoking pictogram beside the door. Pictogram only:
 * no letters, no numbers, no brand. */
export const SIGN = Object.freeze({
  x: 1.68,
  y: 1.62,
  z: HALF_D - 0.007,
  width: 0.42,
  height: 0.5,
  tilt: 0.014,
  screws: Object.freeze([
    [0.16, 0.2],
    [-0.16, 0.2],
    [0.16, -0.2],
    [-0.16, -0.2],
  ]),
});

export const SWITCH = Object.freeze({
  x: 1.2,
  y: 1.3,
  z: HALF_D - 0.009,
  id: 'light.switch',
  label: '顶灯',
});

/* Two 660 L-class four-wheel bins, one dark green, one near-black.
 * Footprint 1.14 m along the wall × 0.88 m deep, body 1.02 m tall on
 * 0.125 m casters. The lid hinges at the aisle-side edge so it can be
 * raised without hitting the east wall. */
export const BIN_SIZE = Object.freeze({
  width: 1.14,
  depth: 0.88,
  bodyHeight: 1.02,
  bodyBottom: 0.17,
  lidThickness: 0.055,
  wheelRadius: 0.125,
  wheelWidth: 0.055,
});

export const BINS = Object.freeze([
  {
    id: 'bin.a',
    label: '工业垃圾桶 A',
    x: 1.64,
    z: -1.62,
    body: 'binGreen',
    lid: 0.66, // half open, propped by its own liner
    interactive: false,
    liner: true,
    trash: true,
  },
  {
    id: 'bin.b',
    label: '工业垃圾桶 B',
    x: 1.64,
    z: -0.1,
    body: 'binBlack',
    lid: 0,
    interactive: true,
    liner: true,
    trash: true,
  },
]);

/* Rusty four-tier angle rack in the camera's blind spot, against the
 * north wall. */
export const RACK = Object.freeze({
  centerX: -0.78,
  centerZ: -2.49,
  width: 1.58,
  depth: 0.42,
  height: 1.84,
  tiers: Object.freeze([0.12, 0.58, 1.04, 1.5]),
  post: 0.038,
  board: 0.018,
  bays: 2,
});

/* Camera and monitor stack share the north-west ceiling corner. The
 * camera looks south-east across the room; everything directly under it
 * — the rack — is its blind spot. */
export const CAMERA = Object.freeze({
  x: -1.94,
  y: 2.62,
  z: -2.44,
  yaw: -2.44,
  pitch: -0.32,
});

export const MONITOR = Object.freeze({
  crt: Object.freeze({ x: -1.58, y: 2.24, z: -2.47, width: 0.46, height: 0.36, depth: 0.42, yaw: 0.22 }),
  small: Object.freeze({ x: -1.12, y: 2.42, z: -2.56, width: 0.28, height: 0.22, depth: 0.05, yaw: 0.16 }),
  recorder: Object.freeze({ x: -1.58, y: 1.99, z: -2.57, width: 0.34, height: 0.1, depth: 0.24, yaw: 0.22 }),
});

/* Ceiling services. Two dim tungsten pendants, one flickering cold
 * batten above the rack, one dead batten hanging askew above the bins. */
export const LAMPS = Object.freeze({
  main: Object.freeze({ x: 0.02, y: 2.52, z: -0.42, shadeY: 2.62, cordTop: ROOM.height }),
  door: Object.freeze({ x: 0.95, y: 2.6, z: 1.62 }),
  flicker: Object.freeze({ x: -0.62, y: 2.83, z: -2.3, length: 1.18 }),
  dead: Object.freeze({ x: 1.6, y: 2.82, z: -0.12, length: 1.08 }),
});

/* Rusty wire mesh tacked across two ceiling corners, with slack. */
export const MESH = Object.freeze({
  panels: Object.freeze([
    { x: -HALF_W + 0.02, z: -HALF_D + 0.02, size: 1.28, drop: 0.62, ry: 0.2, sag: 0.075, cols: 10, rows: 7 },
    { x: HALF_W - 0.03, z: HALF_D - 0.03, size: 0.98, drop: 0.46, ry: -0.32, sag: 0.055, cols: 8, rows: 5 },
    { x: HALF_W - 0.04, z: -HALF_D + 0.04, size: 0.7, drop: 0.34, ry: 0.7, sag: 0.04, cols: 6, rows: 5 },
  ]),
});

/* Dark liquid along the west wall, with a long trail toward the drain. */
export const PUDDLE = Object.freeze({
  x: -1.48,
  z: 0.52,
  width: 1.45,
  depth: 1.02,
  rotation: 0.24,
});

export const DRAIN = Object.freeze({ x: 0.2, z: 1.12, size: 0.36 });

/* Broom and tin dustpan leaning on the east wall south of the bins. */
export const CLEANING = Object.freeze({
  broom: Object.freeze({ baseX: 1.86, baseZ: 1.62, topX: 2.11, topY: 1.46, topZ: 1.7 }),
  dustpan: Object.freeze({ x: 1.9, z: 1.96, ry: -0.28 }),
  debris: Object.freeze({ x: 1.72, z: 1.86 }),
});

/* Black bags and cartons in the south-west corner. */
export const BAGS = Object.freeze([
  { x: -1.7, z: 1.5, half: 0.29, height: 0.86, ry: 0.3, seed: 1.2, open: false },
  { x: -1.88, z: 1.92, half: 0.24, height: 0.62, ry: 1.1, seed: 2.7, open: false, slumped: true },
  { x: -1.44, z: 2.16, half: 0.3, height: 0.6, ry: 2.0, seed: 4.1, open: true },
  { x: -1.17, z: 1.86, half: 0.2, height: 0.58, ry: -0.6, seed: 5.4, open: false },
  { x: -1.92, z: 0.92, half: 0.22, height: 0.5, ry: 0.9, seed: 6.2, open: false, slumped: true },
  { x: 0.24, z: -2.36, half: 0.19, height: 0.54, ry: 1.7, seed: 7.7, open: false },
]);

export const CARTONS = Object.freeze([
  { x: -0.95, z: 2.34, w: 0.52, h: 0.34, d: 0.4, ry: 0.08, dark: false, open: true },
  { x: -1.86, z: 2.3, w: 0.44, h: 0.28, d: 0.34, ry: -0.14, dark: true, open: false },
  { x: -0.42, z: 2.38, w: 0.32, h: 0.26, d: 0.28, ry: 0.3, dark: true, open: false },
  { x: -1.85, z: -1.9, w: 0.44, h: 0.32, d: 0.38, ry: 0.55, dark: false, open: false },
]);

export const WALL = Object.freeze({
  pipeY: 2.62,
  conduitY: 2.72,
});

/* Interior footprint of each solid piece. The 0.30 m player circle can
 * pass between the bin fronts (x = 1.20) and the bag pile (x = -1.04). */
export const COLLIDERS = Object.freeze([
  // Dirty plaster walls.
  { x: 0, z: -HALF_D - 0.12, hx: HALF_W + 0.2, hz: 0.13 },
  { x: 0, z: HALF_D + 0.12, hx: HALF_W + 0.2, hz: 0.13 },
  { x: -HALF_W - 0.12, z: 0, hx: 0.13, hz: HALF_D + 0.2 },
  { x: HALF_W + 0.12, z: 0, hx: 0.13, hz: HALF_D + 0.2 },
  // The two wheeled bins.
  { x: 1.64, z: -1.62, hx: 0.47, hz: 0.6 },
  { x: 1.64, z: -0.1, hx: 0.47, hz: 0.6 },
  // The rack against the north wall.
  { x: -0.78, z: -2.49, hx: 0.81, hz: 0.23 },
  // Black bag pile in the south-west corner.
  { x: -1.68, z: 1.88, hx: 0.58, hz: 0.62 },
  // Carton row along the south wall, west of the door.
  { x: -0.88, z: 2.4, hx: 0.42, hz: 0.26 },
  // Broom and tin dustpan leaning on the east wall.
  { x: 1.95, z: 1.76, hx: 0.14, hz: 0.42 },
  // Door frame and the closed leaf.
  { x: DOOR.centerX, z: HALF_D - 0.02, hx: DOOR.width / 2 + 0.07, hz: 0.09 },
]);

/* Content counts are collected while building and surfaced in stats. */
export const CONTENT_COUNTS = {
  bins: 0,
  bags: 0,
  boxes: 0,
  paintCans: 0,
  jars: 0,
  bottles: 0,
  tools: 0,
  rags: 0,
  papers: 0,
  webs: 0,
};
