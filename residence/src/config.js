/* ------------------------------------------------------------------ *
 * 住宿区 2F — 尺寸与平面坐标的唯一事实来源。
 *
 * 依据设计图集 A-02「住宿区 2F 平面」，并按用户修正：
 *   - 中央 M 宿舍大厅认定为「休息室」（现有休息室场景）；
 *   - 右下角楼梯间，电梯在楼梯间上方；
 *   - 男生淋浴/男厕所门朝北侧男生走廊，女生淋浴/女厕所门朝南侧女生走廊；
 *   - 删除洗衣房、东南女生储物、右侧屋面设备平台；
 *   - 男生最右与女生最右之间是铁栅栏 + 中间铁门，用学生平板打开；
 *   - 右上角 N 杂物间保留。
 *
 * 坐标系沿用图集：X 0..56.4（西→东），Z 0..30.4（北→南），
 * 单位 m，1F 楼面为 y = 0。所有构建器只读这里的数字。
 * ------------------------------------------------------------------ */

const DEG = Math.PI / 180;

export const SHELL = Object.freeze({
  width: 56.4,
  depth: 30.4,
  height: 3.2,
  wall: 0.30,
  innerWall: 0.12,
  eyeHeight: 1.8,
  playerRadius: 0.30,
});

export const X = Object.freeze({
  west: 0.3,
  east: 56.1,
  suiteEast: 9.42,
  innerEast: 49.44,
  eastCorridorWest: 49.5,
  eastCorridorEast: 51.9,
  boysEnd: 49.5,
  girlsEnd: 39.66,
  gateWest: 49.5,
  gateEast: 51.9,
  liftWest: 51.9,
  liftEast: 56.1,
  stairWest: 51.9,
  stairEast: 56.1,
  storageWest: 51.9,
  storageEast: 56.1,
});

export const Z = Object.freeze({
  north: 0.3,
  boysSouth: 5.9,
  corridorNorth: 5.9,
  corridorSouth: 8.3,
  innerNorth: 8.3,
  innerSouth: 22.1,
  southCorridor: 22.1,
  girlsNorth: 24.5,
  south: 30.1,
  gate: 15.5,
  liftNorth: 16.0,
  liftSouth: 21.3,
  stairNorth: 24.5,
  storageSouth: 5.9,
});

export const ROOM = Object.freeze({
  width: 4.8,
  depth: 5.6,
  module: 4.92,
  doorWidth: 0.9,
  doorHeight: 2.1,
  eyeHeight: 1.8,
  playerRadius: 0.3,
});

export const CORRIDOR = Object.freeze({
  width: 2.4,
  height: 3.0,
  north: { x0: X.west, x1: X.east, z0: Z.corridorNorth, z1: Z.corridorSouth },
  south: { x0: X.west, x1: X.east, z0: Z.southCorridor, z1: Z.girlsNorth },
  east: { x0: X.eastCorridorWest, x1: X.eastCorridorEast, z0: Z.corridorSouth, z1: Z.girlsNorth },
});

export const BOYS = Object.freeze(
  Array.from({ length: 10 }, (_, index) => {
    const x0 = X.west + index * ROOM.module;
    return Object.freeze({
      id: `room.b${String(index + 1).padStart(2, '0')}`,
      index,
      x0,
      x1: x0 + ROOM.width,
      z0: Z.north,
      z1: Z.boysSouth,
      doorX: x0 + ROOM.width / 2,
      doorZ: Z.boysSouth,
    });
  }),
);

export const GIRLS = Object.freeze(
  Array.from({ length: 8 }, (_, index) => {
    const x0 = X.west + index * ROOM.module;
    return Object.freeze({
      id: `room.g${String(index + 1).padStart(2, '0')}`,
      index,
      x0,
      x1: x0 + ROOM.width,
      z0: Z.girlsNorth,
      z1: Z.south,
      doorX: x0 + ROOM.width / 2,
      doorZ: Z.girlsNorth,
    });
  }),
);

export const DORM_DOORS = Object.freeze([
  ...BOYS.map((room) => Object.freeze({
    id: `door.${room.id}`,
    label: `男生宿舍 ${String(room.index + 1).padStart(2, '0')}`,
    x: room.doorX,
    z: room.doorZ,
    width: ROOM.doorWidth,
    height: ROOM.doorHeight,
    wall: 'boys',
    rotY: 0,
    locked: true,
    message: `男生宿舍 ${String(room.index + 1).padStart(2, '0')} · 暂未开放`,
  })),
  ...GIRLS.map((room) => Object.freeze({
    id: `door.${room.id}`,
    label: `女生宿舍 ${String(room.index + 1).padStart(2, '0')}`,
    x: room.doorX,
    z: room.doorZ,
    width: ROOM.doorWidth,
    height: ROOM.doorHeight,
    wall: 'girls',
    rotY: Math.PI,
    locked: true,
    message: `女生宿舍 ${String(room.index + 1).padStart(2, '0')} · 暂未开放`,
  })),
]);

/* --- 西侧湿区：男/女各一套，主门分别朝北/南走廊 -------------------- */

export const SUITES = Object.freeze({
  male: Object.freeze({
    id: 'suite.male',
    label: '男生淋浴 / 男厕所',
    x0: X.west,
    x1: X.suiteEast,
    z0: Z.innerNorth,      // 8.3
    z1: 15.0,
    shower: Object.freeze({
      id: 'shower.male',
      label: '男生淋浴室',
      x0: 0.3, x1: 4.74, z0: 8.3, z1: 15.0,
      doorX: 2.5, doorZ: 8.3, side: 'north',
      showers: 4,
    }),
    wc: Object.freeze({
      id: 'wc.male',
      label: '男厕所',
      x0: 4.86, x1: 9.42, z0: 8.3, z1: 15.0,
      doorX: 7.14, doorZ: 8.3, side: 'north',
      toilets: 3, urinals: 2,
    }),
    lockers: true,
  }),
  female: Object.freeze({
    id: 'suite.female',
    label: '女生淋浴 / 女厕所',
    x0: X.west,
    x1: X.suiteEast,
    z0: 15.6,
    z1: Z.innerSouth,      // 22.1
    shower: Object.freeze({
      id: 'shower.female',
      label: '女生淋浴室',
      x0: 0.3, x1: 4.74, z0: 15.6, z1: 22.1,
      doorX: 2.5, doorZ: 22.1, side: 'south',
      showers: 4,
    }),
    wc: Object.freeze({
      id: 'wc.female',
      label: '女厕所',
      x0: 4.86, x1: 9.42, z0: 15.6, z1: 22.1,
      doorX: 7.14, doorZ: 22.1, side: 'south',
      toilets: 4, urinals: 0,
    }),
    lockers: false,
  }),
});
/* --- 右下核心筒：楼梯在下，电梯在上 -------------------------------- */

export const STAIR = Object.freeze({
  x0: X.stairWest,
  x1: X.stairEast,
  z0: Z.stairNorth,       // 24.5
  z1: Z.south,            // 30.1
  doorX: 54.0,
  doorZ: Z.stairNorth,
  doorWidth: 1.4,
  doorHeight: 2.2,
  landingDepth: 1.4,
  steps: 8,
  rise: 0.165,
  run: 0.28,
  lowerY: -1.32,
  openAngle: 100 * DEG,
});

export const LIFT = Object.freeze({
  x0: X.liftWest,
  x1: X.liftEast,
  z0: Z.liftNorth,        // 19.3
  z1: Z.liftSouth,        // 24.2
  doorZ: 18.65,
  doorWidth: 1.4,
  doorHeight: 2.2,
  frameWidth: 1.72,
  frameHeight: 2.3,
  callZ: 17.95,
  callX: X.eastCorridorEast - 0.06,
  callY: 1.18,
});

export const STORAGE = Object.freeze({
  id: 'storage.n',
  label: 'N 杂物间',
  x0: X.storageWest,
  x1: X.storageEast,
  z0: Z.north,
  z1: Z.storageSouth,
  doorX: 54.0,
  doorZ: Z.storageSouth,
  width: 1.0,
  height: 2.2,
  locked: true,
  message: 'N 杂物间 · 需管理员钥匙',
});

/* --- 铁栅栏与平板门 ------------------------------------------------ */

export const GATE = Object.freeze({
  id: 'gate.iron',
  label: '男 / 女生区铁栅栏门',
  x0: X.gateWest,
  x1: X.gateEast,
  z: Z.gate,
  width: 2.4,
  height: 2.55,
  gateWidth: 1.0,
  gateHeight: 2.2,
  hingeX: X.gateWest + 0.7,
  openAngle: 92 * DEG,
  requiresTablet: true,
  message: '铁栅栏门 · 需刷学生平板',
  reader: Object.freeze({
    id: 'reader.gate',
    x: X.eastCorridorWest + 0.04,
    y: 1.38,
    z: Z.gate - 0.55,
    rotY: Math.PI / 2,
  }),
});

/* --- 休息室入口（M 大厅 = 现有休息室） ----------------------------- */

export const LOUNGE_PORTALS = Object.freeze([
  Object.freeze({
    id: 'portal.lounge',
    label: '休息室',
    x: 10.2,
    z: Z.innerNorth,
    rotY: 0,
    width: 2.8,
    height: 2.6,
    wall: 'north',
  }),
]);
export const TABLET = Object.freeze({
  defaultUnlocked: true,
  readerMessageUnlocked: '学生平板已验证 · 栅栏门可开',
  readerMessageLocked: '请刷学生平板',
});

/* --- 机位 / 移动 --------------------------------------------------- */

export const START = Object.freeze({
  x: 5.6,
  z: 7.1,
  yaw: -90 * DEG,
  pitch: -1.2 * DEG,
  fov: 68,
});

export const MOVE = Object.freeze({
  walkSpeed: 4.6,
  runSpeed: 9.6,
  acceleration: 17.0,
  lookSensitivity: 0.0022,
  pitchLimit: 83 * DEG,
  bobHeight: 0.014,
  bobRoll: 0.0025,
  bobFrequency: 6.2,
});

export const INTERACTION = Object.freeze({ range: 3.4 });

/* --- 灯光 ---------------------------------------------------------- */

export const LIGHTING = Object.freeze({
  exposure: 1.08,
  keyIntensity: 0.92,
  hemisphere: 1.0,
  ambient: 0.38,
  corridorFixture: 10.5,
  corridorDistance: 14,
  wetFixture: 3.5,
  wetDistance: 9,
  stairFixture: 8.5,
  liftFixture: 4.2,
});

export const FIXTURES = Object.freeze([
  // 北走廊
  { id: 'light.n0', x: 2.5, z: 7.1, kind: 'warm' },
  { id: 'light.n1', x: 8.0, z: 7.1, kind: 'warm' },
  { id: 'light.n2', x: 20.0, z: 7.1, kind: 'warm' },
  { id: 'light.n3', x: 32.0, z: 7.1, kind: 'warm' },
  { id: 'light.n4', x: 44.0, z: 7.1, kind: 'warm' },
  { id: 'light.n5', x: 52.5, z: 7.1, kind: 'warm' },
  // 南走廊
  { id: 'light.s0', x: 2.5, z: 23.3, kind: 'warm' },
  { id: 'light.s1', x: 8.0, z: 23.3, kind: 'warm' },
  { id: 'light.s2', x: 20.0, z: 23.3, kind: 'warm' },
  { id: 'light.s3', x: 32.0, z: 23.3, kind: 'warm' },
  { id: 'light.s4', x: 40.0, z: 23.3, kind: 'warm' },
  { id: 'light.s5', x: 52.0, z: 23.3, kind: 'warm' },
  // 东走廊
  { id: 'light.e1', x: 50.7, z: 11.4, kind: 'warm' },
  { id: 'light.e2', x: 50.7, z: 19.6, kind: 'warm' },
  // 核心筒
  { id: 'light.lift', x: 50.7, z: 18.65, kind: 'warm' },
  { id: 'light.stair', x: 54.0, z: 26.2, kind: 'warm' },
]);

export const EXPOSURE = LIGHTING.exposure;
