/* ------------------------------------------------------------------ *
 * Storage room — dimensions and layout.
 *
 * A narrow 2.4 × 4.8 m janitor's store on the ground floor of the
 * living wing: exactly 1:2, 11.52 ㎡. The south wall carries the old
 * steel door with the louvred vent; the west wall is taken by a single
 * five-tier steel shelf run. A short slice of corridor is modelled
 * outside the door so the vent has something real to look at.
 *
 * Coordinates: +X east, +Z south, +Y up. The camera starts just inside
 * the door, facing north up the aisle.
 * ------------------------------------------------------------------ */

export const ROOM = Object.freeze({
  width: 2.4,
  depth: 4.8,
  height: 2.7,
  wallThickness: 0.24,
  eyeHeight: 1.8,
  playerRadius: 0.3,
});

export const HALF_W = ROOM.width / 2;
export const HALF_D = ROOM.depth / 2;

export const START = Object.freeze({
  x: 0.3,
  z: 1.9,
  yaw: 0.03,
  pitch: -0.02,
  fov: 68,
});

export const MOVE = Object.freeze({
  // A cramped store is walked slowly. Shift is a clear boost, not a run
  // through the shelf.
  walkSpeed: 2.0,
  runSpeed: 4.2,
  acceleration: 15.0,
  lookSensitivity: 0.0022,
  pitchLimit: (83 * Math.PI) / 180,
  bobHeight: 0.012,
  bobRunHeight: 0.022,
  bobFrequency: 5.6,
  bobLateral: 0.45,
  stepLength: 0.06,
});

/* The old steel door, 0.90 × 2.06 m. It stays locked: `sceneId` is the
 * reserved corridor hook. The 0.46 × 0.42 m louvred vent is the only
 * opening, and it is the scene's narrative device. */
export const DOOR = Object.freeze({
  id: 'door.storage',
  label: '杂物间门',
  sceneId: 'residence',
  centerX: 0.3,
  width: 0.9,
  height: 2.06,
  wallZ: HALF_D,
  leafWidth: 0.88,
  leafHeight: 2.04,
  leafThickness: 0.055,
  hingeSide: -1, // hinges on the -x jamb, handle on the +x side
  leafZ: HALF_D + 0.045,
  vent: Object.freeze({ width: 0.5, height: 0.44, centerY: 1.63 }),
});

/* Five-tier boltless angle shelving against the west wall.
 * Posts at five z stations make four 0.925 m bays. */
export const SHELF = Object.freeze({
  centerX: -0.92,
  depth: 0.56,
  xBack: -1.2,
  xFront: -0.64,
  zStart: -2.15,
  zEnd: 1.55,
  bays: 4,
  tiers: Object.freeze([0.2, 0.64, 1.08, 1.52, 1.96]),
  height: 2.02,
  post: 0.04,
  board: 0.018,
});

export const BULB = Object.freeze({
  x: 0.1,
  y: 2.34,
  z: 0.35,
  cordTop: ROOM.height,
  shadeY: 2.44,
});

/* Old box camera on the east wall, looking down the aisle at the door. */
export const CAMERA = Object.freeze({
  x: 1.09,
  y: 2.31,
  z: -1.92,
  yaw: 2.94,
  pitch: -0.28,
});

export const SWITCH = Object.freeze({
  x: 0.95,
  y: 1.32,
  z: HALF_D - 0.008,
  id: 'light.switch',
  label: '顶灯',
});

export const DRAIN = Object.freeze({ x: 0.55, z: 0.95, size: 0.34 });

/* Corridor slice behind the door. Never walkable; only seen through the
 * louvres and the under-door gap. */
export const CORRIDOR = Object.freeze({
  width: 2.8,
  halfWidth: 1.4,
  z0: HALF_D,
  z1: HALF_D + 1.7,
  light: Object.freeze({ x: 0.25, y: 2.62, z: 3.3 }),
  extinguisher: Object.freeze({ x: -0.55, y: 0.86, z: HALF_D + 1.66 }),
  board: Object.freeze({ x: 0.78, y: 1.02, z: HALF_D + 1.675 }),
  wetFloor: Object.freeze({ x: 0.52, z: HALF_D + 1.5 }),
});

export const WALL = Object.freeze({
  coatHook: Object.freeze({ x: HALF_W - 0.015, y: 1.74, z: -0.36 }),
  coatHook2: Object.freeze({ x: HALF_W - 0.015, y: 1.74, z: -0.96 }),
  ropeHook: Object.freeze({ x: HALF_W - 0.015, y: 1.78, z: 0.2 }),
  pipeY: 2.5,
});

export const TOOLBOX = Object.freeze({
  id: 'toolbox',
  label: '修理工具箱',
  // Sits on a board across the cardboard-box stack, at working height.
  x: 0.95,
  y: 0.802,
  z: 0.18,
  rotY: Math.PI,
  width: 0.44, // along z
  depth: 0.24, // along x
  height: 0.2,
});

/* Interior footprint of each solid piece. The 0.30 m player circle can
 * pass between the shelf front (x = -0.64) and the east-wall clutter. */
export const COLLIDERS = Object.freeze([
  // Concrete walls.
  { x: 0, z: -HALF_D - 0.12, hx: HALF_W + 0.2, hz: 0.13 },
  { x: 0, z: HALF_D + 0.12, hx: HALF_W + 0.2, hz: 0.13 },
  { x: -HALF_W - 0.12, z: 0, hx: 0.13, hz: HALF_D + 0.2 },
  { x: HALF_W + 0.12, z: 0, hx: 0.13, hz: HALF_D + 0.2 },
  // The five-tier run, including the front lip and end frames.
  { x: SHELF.centerX, z: (SHELF.zStart + SHELF.zEnd) / 2, hx: SHELF.depth / 2 + 0.02, hz: (SHELF.zEnd - SHELF.zStart) / 2 + 0.02 },
  // Door frame and the closed leaf.
  { x: DOOR.centerX, z: HALF_D - 0.02, hx: DOOR.width / 2 + 0.07, hz: 0.09 },
  // Burlap sacks in the north-east corner.
  { x: 0.78, z: -1.9, hx: 0.44, hz: 0.37 },
  // Cardboard box stack against the east wall.
  { x: 0.94, z: 0.18, hx: 0.26, hz: 0.38 },
  // Mop bucket + wringer tucked beside the door, east of the opening.
  { x: 0.9, z: 1.75, hx: 0.27, hz: 0.28 },
  // Broom and mop leaning on the east wall, just inside the door.
  { x: 1.04, z: 1.26, hx: 0.14, hz: 0.36 },
]);

/* Content counts are collected while building and surfaced in stats. */
export const CONTENT_COUNTS = {
  sacks: 0,
  boxes: 0,
  paintCans: 0,
  sprayBottles: 0,
  buckets: 0,
  clothes: 0,
  ropes: 0,
  tools: 0,
  jars: 0,
  papers: 0,
};
