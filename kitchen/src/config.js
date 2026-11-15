/* ------------------------------------------------------------------ *
 * Student dining kitchen — dimensions and layout.
 *
 * The kitchen is a narrow 12 × 22 m service room next to the 36 × 22 m
 * dining hall. Its depth matches the hall, so the return door can sit at
 * the same z = -7 position as the hall's kitchen door. Door, equipment,
 * ceiling services and colliders all read from this file.
 * ------------------------------------------------------------------ */

export const ROOM = Object.freeze({
  width: 12,
  depth: 22,
  height: 3.25,
  wallThickness: 0.24,
  eyeHeight: 1.8,
  playerRadius: 0.3,
});

export const HALF_W = ROOM.width / 2;
export const HALF_D = ROOM.depth / 2;

export const START = Object.freeze({
  x: 2.4,
  z: 4.0,
  yaw: 0.32,
  pitch: -0.03,
  fov: 68,
});

export const MOVE = Object.freeze({
  // The old run speed is now the walking speed. Running is deliberately
  // difficult to steer inside a 12 m-wide room.
  walkSpeed: 5.2,
  runSpeed: 11.0,
  acceleration: 18.0,
  lookSensitivity: 0.0022,
  pitchLimit: (83 * Math.PI) / 180,
  bobHeight: 0.012,
  bobRunHeight: 0.022,
  bobFrequency: 6.3,
  bobLateral: 0.4,
  stepLength: 0.075,
});

export const ISLAND = Object.freeze({
  x: 0,
  z: 0,
  width: 3.0,
  depth: 1.0,
  height: 0.92,
  topThickness: 0.045,
  bodyWidth: 2.9,
  bodyDepth: 0.9,
});

export const PASS = Object.freeze({
  wallX: HALF_W,
  centerZ: 5.5,
  width: 2.4,
  height: 2.2,
  counterY: 0.95,
  counterDepthInside: 0.84,
  counterDepthOutside: 0.56,
  vestibuleDepth: 1.65,
  vestibuleWidth: 3.1,
  vestibuleHeight: 2.6,
});

/* The return door is the dining hall's oak service door, mirrored. Its
 * z matches DOORS.kitchen.position.z in dining/config.js (-7). */
export const DINING_DOOR = Object.freeze({
  id: 'door.dining',
  label: '学生餐厅',
  wallX: HALF_W,
  centerZ: -7.0,
  width: 1.0,
  height: 2.2,
  sceneId: 'dining',
});

export const FREIGHT = Object.freeze({
  wallX: -HALF_W,
  centerZ: 3.0,
  width: 1.7,
  height: 2.2,
});

export const COLD = Object.freeze({
  wallZ: -HALF_D,
  centerX: 4.6,
  width: 1.3,
  height: 2.2,
});

export const COOKING = Object.freeze({
  range: { x: -3.2, z: -10.48, width: 2.6, depth: 0.98, height: 0.88 },
  steamer: { x: -0.9, z: -10.56, width: 0.9, depth: 0.82, height: 1.72 },
  oven: { x: 0.35, z: -10.5, width: 1.15, depth: 0.9, height: 1.5 },
  prep: { x: 2.0, z: -10.6, width: 1.8, depth: 0.7, height: 0.9 },
  hood: { x: -3.2, z: -10.16, width: 3.7, depth: 1.55, bottom: 2.13, top: 2.64 },
});

export const WASH = Object.freeze({
  sink: { x: -3.2, z: 10.46, width: 3.2, depth: 0.78, height: 0.9 },
  dish: { x: 0.0, z: 10.55, width: 1.8, depth: 0.66, height: 0.9 },
});

export const PREP = Object.freeze({
  counter: { x: 3.7, z: 10.46, width: 3.6, depth: 0.82, height: 0.9 },
  display: { x: 3.7, z: 10.35, width: 2.35, depth: 0.55, height: 0.46 },
  wallCrt: { x: 0.0, y: 2.44, z: HALF_D - 0.03 },
  floorCrt: { x: 4.9, y: 0, z: 8.5 },
});

export const WEST = Object.freeze({
  railZ: -6.0,
  railLength: 2.8,
  prep: { x: -5.54, z: -6.0, width: 2.2, depth: 0.66, height: 0.9 },
  shelf: { x: -5.56, z: -1.5, width: 1.75, depth: 0.56, height: 1.92 },
  prepSouth: { x: -5.54, z: 6.8, width: 2.2, depth: 0.66, height: 0.9 },
});

export const CEILING = Object.freeze({
  panelSize: 0.6,
  lights: Object.freeze([
    { x: -3.8, z: -8.8 },
    { x: 0, z: -8.8 },
    { x: 3.8, z: -8.8 },
    { x: -3.8, z: -4.4 },
    { x: 0, z: -4.4 },
    { x: 3.8, z: -4.4 },
    { x: -3.8, z: 0 },
    { x: 0, z: 0 },
    { x: 3.8, z: 0 },
    { x: -3.8, z: 4.4 },
    { x: 0, z: 4.4 },
    { x: 3.8, z: 4.4 },
    { x: -3.8, z: 8.8 },
    { x: 0, z: 8.8 },
    { x: 3.8, z: 8.8 },
  ]),
  cameras: Object.freeze([
    { id: 'pass', x: 5.55, y: 2.94, z: 4.4, yaw: 0.39 },
    { id: 'cooking', x: -1.0, y: 2.94, z: -9.55, yaw: -1.94 },
    { id: 'wash', x: -4.2, y: 2.94, z: 9.65, yaw: 0.89 },
    { id: 'entrance', x: 5.55, y: 2.94, z: -8.2, yaw: 0.36 },
  ]),
  sprinklers: Object.freeze([
    { x: -4, z: -8 },
    { x: 0, z: -8 },
    { x: 4, z: -8 },
    { x: -4, z: 0 },
    { x: 0, z: 0 },
    { x: 4, z: 0 },
    { x: -4, z: 8 },
    { x: 0, z: 8 },
    { x: 4, z: 8 },
  ]),
  detectors: Object.freeze([
    { x: -2.5, z: -6.0 },
    { x: 2.5, z: 0.0 },
    { x: 0.0, z: 6.0 },
  ]),
});

/* Collision rectangles. Every solid piece of equipment gets its own
 * footprint instead of one giant room blocking box. */
export const COLLIDERS = Object.freeze([
  { x: 0, z: 0, hx: 1.58, hz: 0.58 },
  { x: COOKING.range.x, z: COOKING.range.z, hx: 1.36, hz: 0.56 },
  { x: COOKING.steamer.x, z: COOKING.steamer.z, hx: 0.51, hz: 0.47 },
  { x: COOKING.oven.x, z: COOKING.oven.z, hx: 0.63, hz: 0.51 },
  { x: COOKING.prep.x, z: COOKING.prep.z, hx: 0.95, hz: 0.41 },
  { x: WASH.sink.x, z: WASH.sink.z, hx: 1.66, hz: 0.45 },
  { x: WASH.dish.x, z: WASH.dish.z, hx: 0.95, hz: 0.39 },
  { x: PREP.counter.x, z: PREP.counter.z, hx: 1.86, hz: 0.47 },
  { x: PREP.floorCrt.x, z: PREP.floorCrt.z, hx: 0.42, hz: 0.4 },
  { x: WEST.prep.x, z: WEST.prep.z, hx: 0.4, hz: 1.15 },
  { x: WEST.shelf.x, z: WEST.shelf.z, hx: 0.36, hz: 0.92 },
  { x: WEST.prepSouth.x, z: WEST.prepSouth.z, hx: 0.4, hz: 1.15 },
  { x: PASS.wallX - PASS.counterDepthInside / 2, z: PASS.centerZ, hx: 0.43, hz: 1.36 },
]);
