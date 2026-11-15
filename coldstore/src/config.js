/* ------------------------------------------------------------------ *
 * Walk-in cold store — dimensions and layout.
 *
 * A cramped 2.7 × 5.6 m refrigerated store attached to the north wall
 * of the restaurant kitchen. The depth deliberately matches the single
 * dormitory (5.6 m): the room is the same long box, only narrower and
 * one storey of insulation lower. Two 4-tier stainless shelf runs leave
 * a single 1.26 m aisle, so the circulation is a straight line from the
 * heavy door to the evaporator and back.
 *
 * Coordinates: x to the east, z to the south, y up. The door sits on the
 * south wall, the evaporator hangs in the north-west ceiling corner.
 * ------------------------------------------------------------------ */

export const ROOM = Object.freeze({
  width: 2.7,
  depth: 5.6,
  height: 2.45,
  wallThickness: 0.24,
  eyeHeight: 1.8,
  playerRadius: 0.3,
});

export const HALF_W = ROOM.width / 2;
export const HALF_D = ROOM.depth / 2;

/* Interior face of the insulated panel: 100 mm panel core + 2 mm skin. */
export const PANEL = Object.freeze({
  width: 0.9, // vertical panel module
  thickness: 0.1,
  ceilingThickness: 0.12,
});

export const START = Object.freeze({
  x: 0.26,
  z: 2.3,
  yaw: 0.06,
  pitch: -0.02,
  fov: 70,
});

export const MOVE = Object.freeze({
  // A cold room is walked slowly: the floor is a metal deck, the aisle is
  // 1.26 m and both hands are usually full. Shift is still a clear boost.
  walkSpeed: 1.9,
  runSpeed: 3.9,
  acceleration: 16.0,
  lookSensitivity: 0.0022,
  pitchLimit: (83 * Math.PI) / 180,
  bobHeight: 0.011,
  bobRunHeight: 0.021,
  bobFrequency: 5.4,
  bobLateral: 0.45,
  stepLength: 0.06,
});

/* The heavy insulated door is the same leaf the kitchen sees from the
 * outside (1.3 × 2.2 m). On this side it also carries the internal
 * emergency release and the anti-condensation heater trace. */
export const DOOR = Object.freeze({
  id: 'door.kitchen',
  label: '餐厅后厨',
  sceneId: 'kitchen',
  centerX: 0.5,
  width: 1.3,
  height: 2.2,
  wallZ: HALF_D,
  leafWidth: 1.26,
  leafHeight: 2.1,
  leafThickness: 0.11,
  hingeSide: 1, // hinges on the +x jamb, handle on the -x side
});

export const SHELF = Object.freeze({
  depth: 0.72,
  bays: 3,
  bayLength: 1.35,
  zStart: -2.55,
  zEnd: 1.5,
  tiers: Object.freeze([0.28, 0.78, 1.28, 1.76]),
  height: 1.98,
  post: 0.045,
  // Front face of the shelf run, used by the collider and the aisle width.
  centerX: 0.99,
});

export const AISLE = Object.freeze({
  width: ROOM.width - SHELF.depth * 2,
  clearWidth: ROOM.width - SHELF.depth * 2 - 0.04,
});

export const EVAP = Object.freeze({
  // Ceiling-hung evaporator in the north-west corner, above the end bay.
  x: -0.6,
  z: -2.34,
  width: 0.96,
  depth: 0.46,
  height: 0.42,
  bottom: 1.99,
});

export const CEILING = Object.freeze({
  lights: Object.freeze([
    { id: 'light.north', x: 0, z: -1.2 },
    { id: 'light.south', x: 0, z: 1.3 },
  ]),
  camera: Object.freeze({ x: -0.82, y: 2.3, z: 2.28, yaw: -0.4, pitch: -0.45 }),
  sensor: Object.freeze({ x: 0.62, y: 2.41, z: -1.86 }),
  rail: Object.freeze({ x0: -0.62, x1: 0.62, y: 1.92, z: -2.66 }),
});

export const WALL = Object.freeze({
  crt: Object.freeze({ x: -0.95, y: 1.5, z: HALF_D - 0.2 }),
  dial: Object.freeze({ x: -0.52, y: 1.7, z: HALF_D - 0.035 }),
  control: Object.freeze({ x: HALF_W - 0.035, y: 1.42, z: 2.24 }),
});

/* Drain trench geometry: a 0.16 m channel runs around the deck. */
export const DRAIN = Object.freeze({
  width: 0.16,
  depth: 0.055,
  inset: 0.0,
});

/* Interior footprint of each prop. Every solid piece gets its own box so
 * the 0.30 m player circle can slide along shelf fronts and the door
 * jamb instead of hitting one room-sized blocker. */
const shelfCenterZ = (SHELF.zStart + SHELF.zEnd) / 2;
const shelfHalfZ = (SHELF.zEnd - SHELF.zStart) / 2;

export const COLLIDERS = Object.freeze([
  // Insulated wall panels.
  { x: 0, z: -HALF_D - 0.12, hx: HALF_W + 0.2, hz: 0.13 },
  { x: 0, z: HALF_D + 0.12, hx: HALF_W + 0.2, hz: 0.13 },
  { x: -HALF_W - 0.12, z: 0, hx: 0.13, hz: HALF_D + 0.2 },
  { x: HALF_W + 0.12, z: 0, hx: 0.13, hz: HALF_D + 0.2 },
  // West and east shelf runs, including the front lip and end frames.
  { x: -SHELF.centerX, z: shelfCenterZ, hx: SHELF.depth / 2 + 0.02, hz: shelfHalfZ + 0.02 },
  { x: SHELF.centerX, z: shelfCenterZ, hx: SHELF.depth / 2 + 0.02, hz: shelfHalfZ + 0.02 },
  // Hanging cold-weather garments at the dead end of the aisle.
  { x: 0, z: CEILING.rail.z + 0.04, hx: 0.62, hz: 0.2 },
  // Wall CRT and its bracket shelf.
  { x: WALL.crt.x, z: HALF_D - 0.22, hx: 0.35, hz: 0.22 },
  // Door frame and the closed leaf, which is proud of the panel face.
  { x: DOOR.centerX, z: HALF_D - 0.02, hx: DOOR.width / 2 + 0.07, hz: 0.09 },
]);
