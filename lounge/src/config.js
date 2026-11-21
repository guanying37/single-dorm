/* ------------------------------------------------------------------ *
 * 生活区二层休息厅 — 尺寸、陈设与机位的唯一事实来源。
 *
 * 31.7 × 10.0 m（≈ 19 : 6），净高 3.6 m。原点在房间中心，+X 向东
 * （大门在 -X 端），+Z 向南。所有构建器只读这里的数字，不硬编码。
 * ------------------------------------------------------------------ */

const DEG = Math.PI / 180;

export const ROOM = Object.freeze({
  length: 31.7,
  depth: 10.0,
  height: 3.6,
  wallThickness: 0.26,
  eyeHeight: 1.8,
  playerRadius: 0.3,
});

/* 入场点：大门内 4 m，面向圆桌与东端挂钟。 */
export const START = Object.freeze({
  x: -10.6,
  z: 0.7,
  yaw: -87.5 * DEG,
  pitch: -1.2 * DEG,
  fov: 68,
});

export const MOVE = Object.freeze({
  walkSpeed: 5.2,
  runSpeed: 11.0,
  acceleration: 18.0,
  lookSensitivity: 0.0022,
  pitchLimit: 83 * DEG,
  bobHeight: 0.014,
  bobRoll: 0.0025,
  bobFrequency: 6.4,
});

export const INTERACTION = Object.freeze({ range: 3.8 });

export const CLOCK = Object.freeze({ hour: 10, minute: 10, second: 32 });

/* --- 中央圆桌 ------------------------------------------------------ */

export const TABLE = Object.freeze({
  x: 0,
  z: 0,
  diameter: 5.0,
  radius: 2.5,
  topY: 0.75,
  clothDrop: 0.30,
  legCount: 8,
  legRadius: 2.06,
});

export const CHAIR = Object.freeze({
  count: 14,
  ringRadius: 2.92,
  width: 0.55,
  depth: 0.56,
  seatY: 0.46,
  backTop: 1.02,
  coverDrop: 0.46,
});

export const CHAIRS = Object.freeze(
  Array.from({ length: CHAIR.count }, (_, index) => {
    const theta = ((index + 0.5) / CHAIR.count) * Math.PI * 2;
    return Object.freeze({
      id: `chair.${index + 1}`,
      theta,
      x: Math.cos(theta) * CHAIR.ringRadius,
      z: Math.sin(theta) * CHAIR.ringRadius,
      rotY: -(theta + Math.PI / 2),
    });
  }),
);

/* --- 沿墙沙发 / 条案 ---------------------------------------------- */

export const SOFA = Object.freeze({
  width: 2.3,
  depth: 0.92,
  height: 0.86,
  seatHeight: 0.44,
});

const LONG_SOFA_X = [-9.55, -6.25, -2.95, 0.35, 3.65, 6.95, 10.25, 13.55];
const LONG_CONSOLE_X = [-7.9, -4.6, -1.3, 2.0, 5.3, 8.6, 11.9];
const WALL_GAP = 0.05;

export const SOFAS = Object.freeze([
  ...LONG_SOFA_X.map((x, index) =>
    Object.freeze({
      id: `sofa.n${index + 1}`,
      x,
      z: -(ROOM.depth / 2 - WALL_GAP - SOFA.depth / 2),
      rotY: 0,
      width: SOFA.width,
      seats: 3,
      wall: 'north',
    }),
  ),
  ...LONG_SOFA_X.map((x, index) =>
    Object.freeze({
      id: `sofa.s${index + 1}`,
      x,
      z: ROOM.depth / 2 - WALL_GAP - SOFA.depth / 2,
      rotY: Math.PI,
      width: SOFA.width,
      seats: 3,
      wall: 'south',
    }),
  ),
  Object.freeze({
    id: 'sofa.e1',
    x: ROOM.length / 2 - WALL_GAP - SOFA.depth / 2,
    z: 0,
    rotY: -Math.PI / 2,
    width: SOFA.width,
    seats: 3,
    wall: 'east',
  }),
  Object.freeze({
    id: 'sofa.w1',
    x: -(ROOM.length / 2 - WALL_GAP - SOFA.depth / 2),
    z: -2.9,
    rotY: Math.PI / 2,
    width: 1.7,
    seats: 2,
    wall: 'west',
  }),
  Object.freeze({
    id: 'sofa.w2',
    x: -(ROOM.length / 2 - WALL_GAP - SOFA.depth / 2),
    z: 2.9,
    rotY: Math.PI / 2,
    width: 1.7,
    seats: 2,
    wall: 'west',
  }),
]);

export const CONSOLE = Object.freeze({ width: 1.1, depth: 0.42, height: 0.8 });

export const CONSOLES = Object.freeze([
  ...LONG_CONSOLE_X.map((x, index) =>
    Object.freeze({
      id: `console.n${index + 1}`,
      x,
      z: -(ROOM.depth / 2 - WALL_GAP - CONSOLE.depth / 2),
      rotY: 0,
      carving: index % 5,
    }),
  ),
  ...LONG_CONSOLE_X.map((x, index) =>
    Object.freeze({
      id: `console.s${index + 1}`,
      x,
      z: ROOM.depth / 2 - WALL_GAP - CONSOLE.depth / 2,
      rotY: Math.PI,
      carving: (index + 2) % 5,
    }),
  ),
  Object.freeze({
    id: 'console.e1',
    x: ROOM.length / 2 - WALL_GAP - CONSOLE.depth / 2,
    z: -3.05,
    rotY: -Math.PI / 2,
    carving: 1,
  }),
  Object.freeze({
    id: 'console.e2',
    x: ROOM.length / 2 - WALL_GAP - CONSOLE.depth / 2,
    z: 3.05,
    rotY: -Math.PI / 2,
    carving: 3,
  }),
]);

/* --- 三扇门 -------------------------------------------------------- */

export const DOORS = Object.freeze({
  main: Object.freeze({
    id: 'door.main',
    label: '大门',
    wall: 'west',
    width: 2.8,
    height: 2.6,
    leaf: 1.4,
    thickness: 0.055,
    openAngle: 100 * DEG,
    centerZ: 0,
    pivotX: -ROOM.length / 2,
  }),
  male: Object.freeze({
    id: 'door.supervisor.male',
    label: '男生宿管处',
    wall: 'north',
    width: 1.0,
    height: 2.2,
    thickness: 0.05,
    centerX: -12.55,
    locked: true,
    readerId: 'reader.male',
    message: '男生宿管处 · 需刷学生平板',
  }),
  female: Object.freeze({
    id: 'door.supervisor.female',
    label: '女生宿管处',
    wall: 'south',
    width: 1.0,
    height: 2.2,
    thickness: 0.05,
    centerX: -12.55,
    locked: true,
    readerId: 'reader.female',
    message: '女生宿管处 · 需刷学生平板',
  }),
});

export const READERS = Object.freeze([
  Object.freeze({
    id: 'reader.male',
    label: '男生宿管检测器',
    x: -11.72,
    y: 1.32,
    z: -(ROOM.depth / 2 - 0.02),
    rotY: 0,
    doorId: 'door.supervisor.male',
    message: '检测器 · 请刷学生平板（平板尚未接入）',
  }),
  Object.freeze({
    id: 'reader.female',
    label: '女生宿管检测器',
    x: -11.72,
    y: 1.32,
    z: ROOM.depth / 2 - 0.02,
    rotY: Math.PI,
    doorId: 'door.supervisor.female',
    message: '检测器 · 请刷学生平板（平板尚未接入）',
  }),
]);

/* --- 天花 ---------------------------------------------------------- */

const RECESS_LIFT = 0.14;
const RECESS_CEILING_Y = ROOM.height + RECESS_LIFT;

export const CEILING = Object.freeze({
  recess: Object.freeze({ halfLength: 15.4, halfDepth: 2.9, lift: RECESS_LIFT }),
  chandeliers: Object.freeze([
    { id: 'chandelier.1', x: -12.68 },
    { id: 'chandelier.2', x: -6.34 },
    { id: 'chandelier.3', x: 0 },
    { id: 'chandelier.4', x: 6.34 },
    { id: 'chandelier.5', x: 12.68 },
  ].map((entry) => Object.freeze({ ...entry, z: 0, y: RECESS_CEILING_Y }))),
  fans: Object.freeze([
    { id: 'fan.1', x: 0, z: -3.55 },
    { id: 'fan.2', x: 0, z: 3.55 },
  ].map((entry) => Object.freeze({ ...entry, cameraId: `camera.${entry.id}` }))),
  acs: Object.freeze([
    { x: -7.6, z: -3.5 },
    { x: 7.6, z: -3.5 },
    { x: -7.6, z: 3.5 },
    { x: 7.6, z: 3.5 },
  ].map((entry, index) => Object.freeze({ id: `ac.${index + 1}`, ...entry }))),
  cameras: Object.freeze([
    { id: 'camera.fan.1', x: 0, z: -3.55, y: 3.48, kind: 'fan' },
    { id: 'camera.fan.2', x: 0, z: 3.55, y: 3.48, kind: 'fan' },
    { id: 'camera.end.w', x: -14.9, z: 0, y: 3.5, kind: 'ceiling' },
    { id: 'camera.end.e', x: 14.9, z: 0, y: 3.5, kind: 'ceiling' },
  ]),
});

/* --- 墙面陈设 ------------------------------------------------------ */

export const CLOCK_WALL = Object.freeze({
  x: ROOM.length / 2,
  y: 2.55,
  z: 0,
  radius: 0.55,
});

export const RELIEF_PANELS = Object.freeze([
  ...[ -10.5, -5.25, 0, 5.25, 10.5 ].map((x, index) => Object.freeze({
    id: `relief.n${index + 1}`,
    wall: 'north',
    x,
    y: 1.95,
    z: -(ROOM.depth / 2),
    variant: index % 3,
  })),
  ...[ -10.5, -5.25, 0, 5.25, 10.5 ].map((x, index) => Object.freeze({
    id: `relief.s${index + 1}`,
    wall: 'south',
    x,
    y: 1.95,
    z: ROOM.depth / 2,
    variant: (index + 1) % 3,
  })),
]);

export const DOOR_RELIEF = Object.freeze({
  wall: 'west',
  x: -(ROOM.length / 2),
  y: 3.02,
  z: 0,
  width: 2.62,
  height: 0.5,
});

export const RELIEF = Object.freeze({ width: 1.1, height: 0.7, depth: 0.07 });

/* --- 门外楼梯厅预留段 --------------------------------------------- */

export const LANDING = Object.freeze({
  nearX: -(ROOM.length / 2 + ROOM.wallThickness),
  farX: -(ROOM.length / 2 + ROOM.wallThickness + 2.6),
  halfDepth: 3.7,
  height: 3.0,
});

/* --- 地毯 ---------------------------------------------------------- */

export const CARPET = Object.freeze({
  tile: 2.0,
  borderInset: 0.35,
  borderWidth: 0.16,
});

/* 地面黄色条纹在贴图里：每 2.0 m 一道，宽 0.06 m。 */
export const CARPET_STRIPE = Object.freeze({ spacing: 2.0, width: 0.06 });

/* 天花设备与灯光的装饰性参数。 */
export const CHANDELIER = Object.freeze({
  drop: 0.82,
  radius: 0.62,
  arms: 6,
  bulbsPerTier: 6,
});
