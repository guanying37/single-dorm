/* ------------------------------------------------------------------ *
 * 阅览室 — 尺寸、陈设与碰撞的唯一事实来源。
 *
 * 生活区 1F 北侧 F 阅览室：6.25 × 10.00 m，比例严格 5 : 8，62.5 ㎡，
 * 净高 3.30 m。北墙三扇窗已被木板完全封死，南墙一扇 1.0 × 2.2 m
 * 的门接 2.4 m 主走廊（锁定，预留 `sceneId: corridor`）。
 *
 * 坐标：+X 向东，+Z 向南，+Y 向上，原点在房间中心。玩家从南门进入，
 * 第一眼是中间一排阅读桌、三盏吊灯与北窗。所有构建器只读这里的数字。
 * ------------------------------------------------------------------ */

const DEG = Math.PI / 180;

export const ROOM = Object.freeze({
  width: 6.25,
  depth: 10.0,
  height: 3.3,
  wallThickness: 0.24,
  eyeHeight: 1.8,
  playerRadius: 0.3,
  area: 62.5,
});

export const HALF_W = ROOM.width / 2; // 3.125
export const HALF_D = ROOM.depth / 2; // 5.0

/* 门口起点：南门内 0.7 m，面向北，略偏东。 */
export const START = Object.freeze({
  x: -1.45,
  z: 4.3,
  yaw: -0.08,
  pitch: -0.03,
  fov: 68,
});

export const MOVE = Object.freeze({
  walkSpeed: 2.6,
  runSpeed: 5.4,
  acceleration: 16.0,
  lookSensitivity: 0.0022,
  pitchLimit: 83 * DEG,
  bobHeight: 0.013,
  bobRunHeight: 0.021,
  bobFrequency: 6.2,
  bobLateral: 0.35,
  stepLength: 0.06,
});

/* 南墙：0.98 × 2.18 m 实木门扇，西侧合页，黄铜执手。锁着。 */
export const DOOR = Object.freeze({
  id: 'door.readingroom',
  label: '阅览室门',
  sceneId: 'residence',
  centerX: -1.5,
  width: 1.0,
  height: 2.2,
  leafWidth: 0.98,
  leafHeight: 2.18,
  leafThickness: 0.05,
  hingeSide: -1,
  wallZ: HALF_D,
  leafZ: HALF_D - 0.036,
});

/* 北墙三扇窗：1.42 × 1.62 m，窗台 0.92 m，窗顶 2.54 m。 */
export const WINDOW = Object.freeze({
  width: 1.42,
  height: 1.62,
  sill: 0.92,
  top: 2.54,
  centers: Object.freeze([-1.66, 0, 1.66]),
  frame: 0.085,
  muntin: 0.03,
  panesX: 2,
  panesY: 3,
  glassZ: -HALF_D - 0.075,
  wallZ: -HALF_D,
});

/* 窗下软垫长凳（飘窗式）：2.45 × 0.52 m，坐面 0.45 m。 */
export const BENCH = Object.freeze({
  x0: -1.9,
  x1: 0.55,
  z0: -HALF_D,
  z1: -HALF_D + 0.52,
  seatY: 0.45,
  cushion: 0.1,
});

/* 深棕实木书架：0.34 m 深、2.36 m 高，1.2 m 一跨；6 组共 10 跨。 */
export const SHELF = Object.freeze({
  depth: 0.34,
  height: 2.36,
  board: 0.03,
  side: 0.045,
  plinth: 0.11,
  crown: 0.07,
  moduleWidth: 1.2,
  boardsY: Object.freeze([0.12, 0.56, 1.0, 1.44, 1.88, 2.32]),
  runs: Object.freeze([
    Object.freeze({ id: 'west.north', side: -1, z0: -4.35, z1: -1.95 }),
    Object.freeze({ id: 'west.mid', side: -1, z0: -1.35, z1: 1.05 }),
    Object.freeze({ id: 'west.south', side: -1, z0: 1.65, z1: 2.85 }),
    Object.freeze({ id: 'east.north', side: 1, z0: -3.75, z1: -1.35 }),
    Object.freeze({ id: 'east.mid', side: 1, z0: -0.75, z1: 1.65 }),
    Object.freeze({ id: 'east.south', side: 1, z0: 2.25, z1: 3.45 }),
  ]),
});

/* 三张 2.4 / 2.4 / 1.8 m 的长条阅读桌，长轴沿 Z，居中 x = 0。 */
export const TABLE = Object.freeze({
  width: 0.95,
  topY: 0.76,
  topThickness: 0.055,
  legInset: 0.13,
  chairOffset: 0.635,
  list: Object.freeze([
    Object.freeze({ id: 'table.north', z: -2.55, length: 2.4, chairZ: Object.freeze([-0.6, 0.6]) }),
    Object.freeze({ id: 'table.mid', z: 0.25, length: 2.4, chairZ: Object.freeze([-0.6, 0.6]) }),
    Object.freeze({ id: 'table.south', z: 2.95, length: 1.8, chairZ: Object.freeze([0]) }),
  ]),
});

export const CHAIR = Object.freeze({
  width: 0.46,
  depth: 0.44,
  seatY: 0.45,
  backHeight: 0.96,
});

/* 绿玻璃罩阅读灯：黄铜灯杆 + 绿玻璃半球罩，每桌两盏。 */
export const BANKER_LAMP = Object.freeze({
  id: 'lamp.tables',
  label: '阅读桌绿灯',
  baseWidth: 0.17,
  shadeRadius: 0.19,
  shadeHeight: 0.1,
  tableY: TABLE.topY + TABLE.topThickness,
  offset: 0.85,
});

/* 三盏复古工业吊灯：木质锥形灯罩 + 黄铜灯座，吊在每张桌子上方。 */
export const PENDANT = Object.freeze({
  x: 0,
  zs: Object.freeze([-2.55, 0.25, 2.95]),
  shadeBottom: 2.44,
  shadeTop: 2.7,
  shadeRadius: 0.3,
});

/* 天花板横梁。 */
export const BEAM = Object.freeze({
  zs: Object.freeze([-3.45, -1.15, 1.15, 3.45]),
  width: 0.16,
  depth: 0.2,
});

/* 门东侧的吊灯开关。 */
export const SWITCH = Object.freeze({
  id: 'light.switch',
  label: '吊灯',
  x: -0.55,
  y: 1.28,
  z: HALF_D - 0.012,
});

/* 可移动木制人字梯：收在两组书架之间的 0.6 m 缺口里。 */
export const LADDER = Object.freeze({
  id: 'ladder',
  label: '木制人字梯',
  x: -2.45,
  z: 1.35,
  height: 1.72,
  width: 0.46,
  foldedAngle: 0.055,
  openAngle: 0.185,
  shift: 0.16,
});

/* 东北角的大型落地地球仪。 */
/* 东北角的大型落地地球仪。底座与球体共用同一个 x/z，确保立柱真的落在球下。 */
export const GLOBE = Object.freeze({
  x: 2.35,
  z: -4.3,
  baseRadius: 0.38,
  sphereRadius: 0.29,
  centerY: 1.02,
  tilt: 23.5 * DEG,
});

/* 西南角的复古落地衣帽架。 */
export const COAT_RACK = Object.freeze({
  x: -2.72,
  z: 4.52,
  height: 1.82,
  baseRadius: 0.31,
});

/* 挂在天花板角落的监控显示屏（CRT + 云台支架）。 */
export const CCTV = Object.freeze({
  x: 2.86,
  y: 2.62,
  z: 4.6,
  yaw: -2.32,
  pitch: -0.34,
  screenWidth: 0.34,
  screenHeight: 0.25,
});

/* 新增的两台监控摄像：一台在西北吊顶角俯看全室，一台在门上方看阅读区。
 * yaw/pitch 已按目标点预先算好，机位在 buildCameras 中直接使用。 */
export const CAMERAS = Object.freeze([
  Object.freeze({ id: 'camera.nw', x: -2.82, y: 2.78, z: -4.70, yaw: -2.705, pitch: -0.205 }),
  Object.freeze({ id: 'camera.door', x: -0.55, y: 2.52, z: 4.82, yaw: -0.051, pitch: -0.219 }),
]);

/* 封窗木板：每扇窗 6 块横板 + 1 根斜撑 + 1 根竖压条 + 钉子。 */
export const WINDOW_BOARDS = Object.freeze({
  rows: 6,
  boardHeight: 0.265,
  boardGap: 0.006,
  overhang: 0.1,
  thickness: 0.028,
  brace: Object.freeze({ width: 0.16, length: 1.48, thickness: 0.026, angle: 0.14 }),
  batten: Object.freeze({ width: 0.07, thickness: 0.024 }),
});

/* 墙面装裱的复古地图 / 风景浅浮雕。不要文字，不要位图。 */
export const FRAMES = Object.freeze([
  Object.freeze({ id: 'frame.map.entry', wall: 'south', at: 0.05, y: 1.92, w: 0.95, h: 0.62, theme: 'map' }),
  Object.freeze({ id: 'frame.land.entry', wall: 'south', at: 1.72, y: 1.9, w: 0.85, h: 0.6, theme: 'landscape' }),
  Object.freeze({ id: 'frame.map.door', wall: 'south', at: DOOR.centerX, y: 2.78, w: 0.9, h: 0.48, theme: 'map' }),
  Object.freeze({ id: 'frame.land.east', wall: 'east', at: -2.55, y: 2.82, w: 1.02, h: 0.52, theme: 'landscape' }),
  Object.freeze({ id: 'frame.map.west', wall: 'west', at: -0.15, y: 2.82, w: 1.02, h: 0.52, theme: 'map' }),
]);

/* 地面深色木镶嵌：四周一圈边框（朝房间内收，不被书架压住）。 */
export const FLOOR_INLAY = Object.freeze({
  inset: 0.55,
  borderWidth: 0.16,
  height: 0.006,
});

export function frameMatrix(frame) {
  if (frame.wall === 'south') return { x: frame.at, y: frame.y, z: HALF_D - 0.008, ry: Math.PI };
  if (frame.wall === 'east') return { x: HALF_W - 0.008, y: frame.y, z: frame.at, ry: -Math.PI / 2 };
  return { x: -HALF_W + 0.008, y: frame.y, z: frame.at, ry: Math.PI / 2 };
}

/* --- 碰撞体 -------------------------------------------------------- *
 * 墙 AABB + 家具 OBB（轴对齐）。桌子只挡桌板，椅子独立，因此玩家可以
 * 走到桌边，也可以从椅子之间穿过；不设整块桌位的碰撞盒。
 * ------------------------------------------------------------------ */

function buildColliders() {
  const list = [];
  // 四面墙。
  list.push({ x: 0, z: -HALF_D - 0.12, hx: HALF_W + 0.2, hz: 0.13 });
  list.push({ x: 0, z: HALF_D + 0.12, hx: HALF_W + 0.2, hz: 0.13 });
  list.push({ x: -HALF_W - 0.12, z: 0, hx: 0.13, hz: HALF_D + 0.2 });
  list.push({ x: HALF_W + 0.12, z: 0, hx: 0.13, hz: HALF_D + 0.2 });
  // 门框与门扇。
  list.push({ x: DOOR.centerX, z: HALF_D - 0.02, hx: DOOR.width / 2 + 0.07, hz: 0.09 });
  // 六组书架。
  for (const run of SHELF.runs) {
    list.push({
      x: run.side * (HALF_W - SHELF.depth / 2),
      z: (run.z0 + run.z1) / 2,
      hx: SHELF.depth / 2 + 0.02,
      hz: (run.z1 - run.z0) / 2 + 0.02,
    });
  }
  // 窗下长凳。
  list.push({
    x: (BENCH.x0 + BENCH.x1) / 2,
    z: (BENCH.z0 + BENCH.z1) / 2,
    hx: (BENCH.x1 - BENCH.x0) / 2,
    hz: (BENCH.z1 - BENCH.z0) / 2,
  });
  // 地球仪、衣帽架、人字梯。
  list.push({ x: GLOBE.x, z: GLOBE.z, hx: GLOBE.baseRadius + 0.03, hz: GLOBE.baseRadius + 0.03 });
  list.push({ x: COAT_RACK.x, z: COAT_RACK.z, hx: COAT_RACK.baseRadius, hz: COAT_RACK.baseRadius });
  list.push({ x: LADDER.x, z: LADDER.z, hx: 0.42, hz: 0.3 });
  // 桌面（只挡桌板）。
  for (const table of TABLE.list) {
    list.push({ x: 0, z: table.z, hx: TABLE.width / 2 + 0.03, hz: table.length / 2 + 0.03 });
    // 椅子各自独立（椅子旋转 90°，宽深互换）。
    for (const side of [-1, 1]) {
      for (const chairZ of table.chairZ) {
        list.push({
          x: side * TABLE.chairOffset,
          z: table.z + chairZ,
          hx: CHAIR.depth / 2 + 0.015,
          hz: CHAIR.width / 2 + 0.015,
        });
      }
    }
  }
  return list;
}

export const COLLIDERS = Object.freeze(buildColliders());

/* 内容计数：构建时累加，验收时回报。 */
export const CONTENT_COUNTS = {
  shelfRuns: SHELF.runs.length,
  shelfModules: 10,
  books: 0,
  tables: TABLE.list.length,
  chairs: 0,
  bankerLamps: 0,
  pendants: PENDANT.zs.length,
  frames: FRAMES.length,
  cameras: CAMERAS.length,
  windowBoards: WINDOW_BOARDS.rows * WINDOW.centers.length,
};





