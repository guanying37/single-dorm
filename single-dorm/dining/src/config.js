/* ------------------------------------------------------------------ *
 * Dining hall — single source of truth for dimensions and layout.
 *
 * Everything that a level designer might reasonably want to tune lives
 * here: hall size, table plan, wall dressing, initial camera, clock time
 * and interaction distances. Geometry code never hard-codes these values.
 * ------------------------------------------------------------------ */

export const HALL = Object.freeze({
  width: 36,
  depth: 22,
  height: 4.2,
  wallThickness: 0.26,
  eyeHeight: 1.8,
  playerRadius: 0.3,
});

export const START = Object.freeze({
  x: 3.5,
  z: 7.4,
  yaw: (10 * Math.PI) / 180,
  pitch: (-4 * Math.PI) / 180,
  fov: 68,
});

export const MOVE = Object.freeze({
  walkSpeed: 2.6,
  runSpeed: 6.2,
  acceleration: 14.0,
  lookSensitivity: 0.0022,
  pitchLimit: Math.PI / 2 - 0.12,
  bobHeight: 0.014,
  bobRoll: 0.0025,
  bobFrequency: 6.4,
});

export const CLOCK = Object.freeze({
  hour: 10,
  minute: 10,
  second: 32,
});

export const INTERACTION = Object.freeze({
  range: 3.4,
});

/* Table plan: two rows of five, 7 m pitch, 6.8 m between rows.
 * Clear gap between clusters is ~3.8 m, well above the 1.5 m brief. */
export const TABLES = Object.freeze([
  { id: 'N1', x: -14, z: -3.4, variant: 0 },
  { id: 'N2', x: -7, z: -3.4, variant: 1 },
  { id: 'N3', x: 0, z: -3.4, variant: 2 },
  { id: 'N4', x: 7, z: -3.4, variant: 0 },
  { id: 'N5', x: 14, z: -3.4, variant: 1 },
  { id: 'S1', x: -14, z: 3.4, variant: 2 },
  { id: 'S2', x: -7, z: 3.4, variant: 0 },
  { id: 'S3', x: 0, z: 3.4, variant: 1 },
  { id: 'S4', x: 7, z: 3.4, variant: 2 },
  { id: 'S5', x: 14, z: 3.4, variant: 0 },
]);

export const TABLE = Object.freeze({
  width: 1.8,
  depth: 1.0,
  height: 0.75,
  clothDrop: 0.32,
  clothTop: 0.762,
  seatRadius: 0.225,
  seatHeight: 0.45,
});

export const DOORS = Object.freeze({
  main: {
    id: 'door.main',
    label: '正门',
    width: 2.8,
    height: 2.6,
    leaf: 1.4,
    thickness: 0.06,
    openAngle: (100 * Math.PI) / 180,
    position: { x: 0, z: 11 },
    wall: 'south',
  },
  kitchen: {
    id: 'door.kitchen',
    label: '后厨门',
    width: 1.0,
    height: 2.2,
    position: { x: 18, z: -7 },
    wall: 'east',
    sceneId: 'kitchen',
  },
  restroom: {
    id: 'door.restroom',
    label: '卫生间门',
    width: 1.0,
    height: 2.2,
    position: { x: -18, z: 7 },
    wall: 'west',
    sceneId: 'restroom',
  },
});

/* Wall dressing. Positions are along the wall in metres. */
export const PAINTINGS = Object.freeze([
  { id: 'bread', wall: 'west', at: -6.4, theme: 'bread' },
  { id: 'wine', wall: 'west', at: -3.0, theme: 'wine' },
  { id: 'fruit', wall: 'west', at: 3.0, theme: 'fruit' },
  { id: 'dessert', wall: 'east', at: 3.4, theme: 'dessert' },
  { id: 'fish', wall: 'south', at: -6.0, theme: 'fish' },
  { id: 'soup', wall: 'south', at: 6.0, theme: 'soup' },
  { id: 'fowl', wall: 'north', at: -7.0, theme: 'fowl' },
  { id: 'vegetables', wall: 'north', at: 7.0, theme: 'vegetables' },
]);

export const PAINTING = Object.freeze({
  width: 0.96,
  height: 0.72,
  depth: 0.07,
  centerY: 1.68,
});

export const SIDEBOARD = Object.freeze({
  id: 'sideboard',
  width: 3.6,
  depth: 0.55,
  height: 0.98,
  position: { x: -17.6, z: 0 },
  rotationY: Math.PI / 2,
});

export const CLOCKS = Object.freeze({
  pendulum: { x: 0, y: 1.7, z: -10.985, height: 1.15, width: 0.55 },
  swan: { x: 17.985, y: 2.08, z: -2.2, width: 1.0, height: 1.36 },
});

export const CEILING = Object.freeze({
  lightRows: [-3.4, 3.4],
  lightColumns: [-14, -7, 0, 7, 14],
  airConditioners: [
    { x: -12, z: 0 },
    { x: 0, z: 0 },
    { x: 12, z: 0 },
  ],
  cameras: [
    { x: -17.1, z: -10.1 },
    { x: 17.1, z: -10.1 },
    { x: -17.1, z: 10.1 },
    { x: 17.1, z: 10.1 },
    { x: -3.6, z: 10.35 },
    { x: 3.6, z: 10.35 },
  ],
});

