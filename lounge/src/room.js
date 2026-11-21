import * as THREE from 'three';
import {
  ROOM,
  DOORS,
  READERS,
  RELIEF_PANELS,
  DOOR_RELIEF,
  RELIEF,
  LANDING,
  CARPET,
} from './config.js';
import {
  StaticBuilder,
  boxGeometry,
  uvScaledPlane,
  planeGeometry,
  cylinderGeometry,
  sphereGeometry,
  trs,
} from './utils.js';

/* ------------------------------------------------------------------ *
 * 房间壳：地毯、墙裙、跌级天花、三扇门、宿管检测机、门外楼梯厅预留段、
 * 木雕挂板。家具在 furniture.js，灯具 / 挂钟 / 吊扇 / 监控在 decor.js，
 * 桌面棋牌在 games.js。
 * ------------------------------------------------------------------ */

const HALF_L = ROOM.length / 2;
const HALF_D = ROOM.depth / 2;
const HEIGHT = ROOM.height;
const WALL_T = ROOM.wallThickness;
const WAINSCOT_TOP = 1.0;
const BASE_HEIGHT = 0.12;
const TRAY = { halfLength: 15.4, halfDepth: 2.9, lift: 0.14 };

const WALLS = [
  {
    id: 'north',
    at: -HALF_D,
    axis: 'x',
    rotY: 0,
    length: ROOM.length,
    openings: [{ from: -13.05, to: -12.05, height: 2.2, door: 'male' }],
  },
  {
    id: 'south',
    at: HALF_D,
    axis: 'x',
    rotY: Math.PI,
    length: ROOM.length,
    openings: [{ from: -13.05, to: -12.05, height: 2.2, door: 'female' }],
  },
  {
    id: 'west',
    at: -HALF_L,
    axis: 'z',
    rotY: Math.PI / 2,
    length: ROOM.depth,
    openings: [{ from: -1.4, to: 1.4, height: 2.6, door: 'main' }],
  },
  {
    id: 'east',
    at: HALF_L,
    axis: 'z',
    rotY: -Math.PI / 2,
    length: ROOM.depth,
    openings: [],
  },
];

function wallPoint(wall, s, inset = 0) {
  if (wall.axis === 'x') {
    return { x: s, z: wall.at + (wall.id === 'north' ? inset : -inset) };
  }
  return { x: wall.at + (wall.id === 'west' ? inset : -inset), z: s };
}

/** 沿墙放一个盒子：alongLen 沿墙长，depth 沿法线。 */
function addWallBox(builder, key, wall, s, y, alongLen, height, depth, inset = 0, options = {}) {
  const point = wallPoint(wall, s, inset);
  const geometry = wall.axis === 'x'
    ? boxGeometry(alongLen, height, depth)
    : boxGeometry(depth, height, alongLen);
  builder.add(key, geometry, trs(point.x, y, point.z), options);
}

/** 沿墙放一张贴图平面（法线朝房间内）。 */
function addWallPlane(builder, key, wall, s, y, alongLen, height, inset = 0, tile = 1.5, options = {}) {
  const point = wallPoint(wall, s, inset);
  builder.add(key, uvScaledPlane(alongLen, height, tile), trs(point.x, y, point.z, wall.rotY), options);
}

function solidSpans(wall) {
  const spans = [];
  let cursor = -wall.length / 2;
  const openings = [...wall.openings].sort((a, b) => a.from - b.from);
  for (const opening of openings) {
    if (opening.from > cursor + 1e-4) spans.push([cursor, opening.from]);
    cursor = Math.max(cursor, opening.to);
  }
  if (cursor < wall.length / 2 - 1e-4) spans.push([cursor, wall.length / 2]);
  return spans;
}

/* --- 地面 ---------------------------------------------------------- */

function buildFloor(builder, materials, textures) {
  textures.carpet.repeat.set(ROOM.length / CARPET.tile, ROOM.depth / CARPET.tile);

  const floor = new THREE.Mesh(planeGeometry(ROOM.length, ROOM.depth), materials.carpet);
  floor.rotation.x = -Math.PI / 2;
  floor.name = 'carpet';
  floor.receiveShadow = true;

  const inset = CARPET.borderInset;
  const width = CARPET.borderWidth;
  const longLength = ROOM.length - inset * 2 - width;
  const shortLength = ROOM.depth - inset * 2 - width;
  const strips = [
    { w: longLength, d: width, x: 0, z: -(HALF_D - inset - width / 2) },
    { w: longLength, d: width, x: 0, z: HALF_D - inset - width / 2 },
    { w: width, d: shortLength, x: -(HALF_L - inset - width / 2), z: 0 },
    { w: width, d: shortLength, x: HALF_L - inset - width / 2, z: 0 },
  ];
  for (const strip of strips) {
    builder.add(
      'carpetBorder',
      uvScaledPlane(strip.w, strip.d, 0.6),
      trs(strip.x, 0.004, strip.z, 0, 1, 1, 1, -Math.PI / 2),
      { cast: false },
    );
  }

  builder.addBox('brass', 0.1, 0.014, 2.9, -HALF_L + 0.07, 0.007, 0);
  return floor;
}

/* --- 天花 ---------------------------------------------------------- */

function buildCeiling(builder) {
  const trayY = HEIGHT + TRAY.lift;
  const band = HALF_D - TRAY.halfDepth;

  const addDownPlane = (key, width, depth, x, z, y) => {
    builder.add(key, uvScaledPlane(width, depth, 2.2), trs(x, y, z, 0, 1, 1, 1, Math.PI / 2));
  };

  addDownPlane('ceiling', ROOM.length, band, 0, -(TRAY.halfDepth + band / 2), HEIGHT);
  addDownPlane('ceiling', ROOM.length, band, 0, TRAY.halfDepth + band / 2, HEIGHT);
  addDownPlane('ceiling', HALF_L - TRAY.halfLength, TRAY.halfDepth * 2, -(TRAY.halfLength + (HALF_L - TRAY.halfLength) / 2), 0, HEIGHT);
  addDownPlane('ceiling', HALF_L - TRAY.halfLength, TRAY.halfDepth * 2, TRAY.halfLength + (HALF_L - TRAY.halfLength) / 2, 0, HEIGHT);

  addDownPlane('ceilingTray', TRAY.halfLength * 2, TRAY.halfDepth * 2, 0, 0, trayY);

  builder.add('ceilingFascia', planeGeometry(TRAY.halfLength * 2, TRAY.lift), trs(0, HEIGHT + TRAY.lift / 2, -TRAY.halfDepth));
  builder.add('ceilingFascia', planeGeometry(TRAY.halfLength * 2, TRAY.lift), trs(0, HEIGHT + TRAY.lift / 2, TRAY.halfDepth, Math.PI));
  builder.add('ceilingFascia', planeGeometry(TRAY.halfDepth * 2, TRAY.lift), trs(-TRAY.halfLength, HEIGHT + TRAY.lift / 2, 0, Math.PI / 2));
  builder.add('ceilingFascia', planeGeometry(TRAY.halfDepth * 2, TRAY.lift), trs(TRAY.halfLength, HEIGHT + TRAY.lift / 2, 0, -Math.PI / 2));

  // 灯槽内 4 道横梁，给 31.7 m 长的白顶做节奏。
  for (const x of [-9.51, -3.17, 3.17, 9.51]) {
    builder.add('ceilingBeam', boxGeometry(0.24, 0.14, TRAY.halfDepth * 2), trs(x, HEIGHT + 0.07, 0));
  }

  for (const wall of WALLS) {
    addWallBox(builder, 'trim', wall, 0, HEIGHT - 0.045, wall.length, 0.07, 0.07, 0.035);
    addWallBox(builder, 'trim', wall, 0, HEIGHT - 0.012, wall.length, 0.028, 0.035, 0.075);
  }
}

/* --- 墙面与墙裙 ---------------------------------------------------- */

function buildWalls(builder) {
  for (const wall of WALLS) {
    for (const [from, to] of solidSpans(wall)) {
      const length = to - from;
      if (length < 0.02) continue;
      const center = (from + to) / 2;

      addWallPlane(builder, 'wall', wall, center, HEIGHT / 2, length, HEIGHT, 0, 1.5);

      addWallPlane(
        builder,
        'oak',
        wall,
        center,
        BASE_HEIGHT + (WAINSCOT_TOP - BASE_HEIGHT) / 2 - 0.01,
        length,
        WAINSCOT_TOP - BASE_HEIGHT - 0.02,
        0.012,
        1.1,
      );

      const bays = Math.max(1, Math.floor(length / 1.15));
      for (let i = 0; i < bays; i += 1) {
        const s = from + (length * (i + 0.5)) / bays;
        addWallBox(builder, 'oak', wall, s, BASE_HEIGHT + (WAINSCOT_TOP - BASE_HEIGHT) / 2 - 0.01, 0.055, WAINSCOT_TOP - BASE_HEIGHT - 0.02, 0.026, 0.022);
      }

      addWallBox(builder, 'oakDark', wall, center, WAINSCOT_TOP - 0.012, length, 0.042, 0.038, 0.028);
      addWallBox(builder, 'oakDark', wall, center, WAINSCOT_TOP - 0.048, length, 0.008, 0.008, 0.018);
      addWallBox(builder, 'oakDark', wall, center, BASE_HEIGHT / 2, length, BASE_HEIGHT, 0.032, 0.016);
    }

    for (const opening of wall.openings) {
      const length = opening.to - opening.from;
      const center = (opening.from + opening.to) / 2;
      const height = HEIGHT - opening.height;
      addWallPlane(builder, 'wall', wall, center, opening.height + height / 2, length, height, 0, 1.5);
    }
  }
}

function buildDoorCasing(builder, wall, opening, { bar = 0.1, proud = 0.035 } = {}) {
  const { from, to, height } = opening;
  const width = to - from;
  const center = (from + to) / 2;
  const jamb = WALL_T + 0.02;

  // 门洞侧壁与过梁（填满墙厚）。
  for (const side of [-1, 1]) {
    const s = center + side * (width / 2 - 0.015);
    const point = wallPoint(wall, s, -WALL_T / 2);
    if (wall.axis === 'x') {
      builder.add('oak', boxGeometry(0.03, height, jamb), trs(point.x, height / 2, point.z));
    } else {
      builder.add('oak', boxGeometry(jamb, height, 0.03), trs(point.x, height / 2, point.z));
    }
  }
  const headPoint = wallPoint(wall, center, -WALL_T / 2);
  builder.add(
    'oak',
    wall.axis === 'x' ? boxGeometry(width, 0.03, jamb) : boxGeometry(jamb, 0.03, width),
    trs(headPoint.x, height - 0.015, headPoint.z),
  );

  // 室内侧门套。
  for (const side of [-1, 1]) {
    const s = center + side * (width / 2 + bar / 2);
    const point = wallPoint(wall, s, proud / 2);
    if (wall.axis === 'x') {
      builder.add('oak', boxGeometry(bar, height + bar, proud), trs(point.x, (height + bar) / 2, point.z));
    } else {
      builder.add('oak', boxGeometry(proud, height + bar, bar), trs(point.x, (height + bar) / 2, point.z));
    }
  }
  const topPoint = wallPoint(wall, center, proud / 2);
  builder.add(
    'oak',
    wall.axis === 'x'
      ? boxGeometry(width + bar * 2, bar, proud)
      : boxGeometry(proud, bar, width + bar * 2),
    trs(topPoint.x, height + bar / 2, topPoint.z),
  );
}

/* --- 大门双扇 ------------------------------------------------------ */

function buildMainLeaf(local, dir) {
  const w = DOORS.main.leaf;
  const t = DOORS.main.thickness;
  const h = DOORS.main.height;
  const z = (value) => value * dir;

  local.add('oakDark', boxGeometry(t, 0.18, w), trs(0, 0.09, z(w / 2)));
  local.add('oakDark', boxGeometry(t, 0.28, w), trs(0, h - 0.14, z(w / 2)));
  local.add('oakDark', boxGeometry(t, 0.1, w), trs(0, 1.66, z(w / 2)));
  for (const side of [0, 1]) {
    const zz = side ? w - 0.065 : 0.065;
    local.add('oakDark', boxGeometry(t, h, 0.13), trs(0, h / 2, z(zz)));
  }

  for (const side of [-1, 1]) {
    const x = side * (t / 2 + 0.005);
    local.add('oak', boxGeometry(0.014, 1.32, w - 0.36), trs(x, 0.92, z(w / 2)));
    local.add('oakDark', boxGeometry(0.02, 1.42, 0.03), trs(x + side * 0.003, 0.92, z(0.21)));
    local.add('oakDark', boxGeometry(0.02, 1.42, 0.03), trs(x + side * 0.003, 0.92, z(w - 0.21)));
    local.add('oakDark', boxGeometry(0.02, 0.03, w - 0.36), trs(x + side * 0.003, 1.6, z(w / 2)));
    local.add('oakDark', boxGeometry(0.02, 0.03, w - 0.36), trs(x + side * 0.003, 0.24, z(w / 2)));
  }

  local.add('glassFrost', boxGeometry(0.012, 0.6, w - 0.36), trs(0, 2.02, z(w / 2)), { cast: false });
  for (const zz of [0.42, w / 2, w - 0.42]) {
    local.add('oakDark', boxGeometry(t + 0.008, 0.028, 0.032), trs(0, 2.02, z(zz)));
  }
  local.add('oakDark', boxGeometry(t + 0.008, 0.03, w - 0.36), trs(0, 2.02, z(w / 2)));

  for (const side of [-1, 1]) {
    const x = side * (t / 2 + 0.06);
    local.add('brass', cylinderGeometry(0.017, 0.017, w - 0.46, 10), trs(x, 1.04, z(w / 2), 0, 1, 1, 1, Math.PI / 2));
    for (const zz of [0.34, w - 0.34]) {
      local.add('brass', cylinderGeometry(0.013, 0.013, 0.06, 8), trs(side * (t / 2 + 0.032), 1.04, z(zz)));
    }
  }
  local.add('brass', boxGeometry(0.008, 0.16, w - 0.3), trs(t / 2 + 0.009, 0.1, z(w / 2)));

  for (const yy of [0.35, 1.2, 2.1]) {
    local.add('brassDark', boxGeometry(0.02, 0.11, 0.05), trs(0, yy, z(0.014)));
  }
}

function buildDoors(builder, materials) {
  const interactables = [];
  const doorGroups = {};
  const main = DOORS.main;
  const hingeX = -HALF_L - WALL_T / 2;

  const makeLeaf = (name, hingeZ, dir) => {
    const group = new THREE.Group();
    group.name = name;
    group.position.set(hingeX, 0, hingeZ);
    const local = new StaticBuilder();
    buildMainLeaf(local, dir);
    local.flush(group, materials, name);
    return group;
  };

  const left = makeLeaf('door-main-left', -main.leaf, 1);
  const right = makeLeaf('door-main-right', main.leaf, -1);

  const mainItem = {
    id: main.id,
    label: main.label,
    open: false,
    value: 0,
    target: 0,
    hitRoots: [left, right],
    apply(value) {
      const angle = value * main.openAngle;
      left.rotation.y = angle;
      right.rotation.y = -angle;
    },
  };
  mainItem.apply(0);
  interactables.push(mainItem);
  doorGroups.main = {
    left,
    right,
    item: mainItem,
    hingeX,
    halfLeaf: main.leaf / 2,
    halfThickness: main.thickness / 2,
  };

  for (const key of ['male', 'female']) {
    const door = DOORS[key];
    const wall = WALLS.find((entry) => entry.id === door.wall);
    const group = new THREE.Group();
    const sign = door.wall === 'north' ? 1 : -1;
    group.position.set(door.centerX, 0, wall.at - sign * (WALL_T / 2));
    group.rotation.y = door.wall === 'north' ? 0 : Math.PI;
    group.name = `door-${key}`;

    const local = new StaticBuilder();
    const w = door.width;
    const h = door.height;
    const t = door.thickness;
    local.add('oakDark', boxGeometry(w, h, t), trs(0, h / 2, 0));
    for (const side of [-1, 1]) {
      const zz = side * (t / 2 + 0.004);
      local.add('oak', boxGeometry(w - 0.3, 1.2, 0.012), trs(0, 0.82, zz));
      local.add('oak', boxGeometry(w - 0.3, 0.5, 0.012), trs(0, 1.78, zz));
    }
    local.add('brassDark', boxGeometry(0.23, 0.29, 0.02), trs(0, 1.72, t / 2 + 0.002));
    local.add('glassFrost', boxGeometry(0.19, 0.25, 0.012), trs(0, 1.72, t / 2 + 0.006), { cast: false });
    local.add('brassDark', boxGeometry(0.2, 0.02, 0.02), trs(0, 1.72, t / 2 + 0.012));
    local.add('brass', boxGeometry(0.34, 0.05, 0.03), trs(-0.18, 1.06, t / 2 + 0.02));
    local.add('brass', cylinderGeometry(0.028, 0.028, 0.05, 12), trs(-0.34, 1.06, t / 2 + 0.02, 0, 1, 1, 1, Math.PI / 2));
    local.add('brass', boxGeometry(0.12, 0.28, 0.008), trs(0.34, 1.9, t / 2 + 0.006));
    local.add('brassDark', boxGeometry(w + 0.1, 0.12, 0.012), trs(0, 0.07, -t / 2 - 0.006));
    local.flush(group, materials, `door-${key}-leaf`);

    const handle = new THREE.Group();
    handle.position.set(-0.34, 1.06, t / 2 + 0.02);
    handle.name = `handle-${key}`;
    const handleBuilder = new StaticBuilder();
    handleBuilder.add('brass', cylinderGeometry(0.016, 0.016, 0.17, 10), trs(0.06, 0, 0.02, 0, 1, 1, 1, 0, Math.PI / 2));
    handleBuilder.flush(handle, materials, 'handle');
    group.add(handle);

    // 门外封板：宿管处未建模，门后不能是黑洞。
    const backing = new THREE.Mesh(boxGeometry(w + 0.1, h + 0.04, 0.02), materials.matBlack);
    backing.position.set(0, h / 2, -0.18);
    group.add(backing);

    const item = {
      id: door.id,
      label: door.label,
      locked: true,
      open: false,
      target: 0,
      value: 0,
      message: door.message,
      prompt: '需刷学生平板',
      handle,
      hitRoots: [group],
      apply() {},
    };
    interactables.push(item);
    doorGroups[key] = { group, item, handle };
  }

  for (const wall of WALLS) {
    for (const opening of wall.openings) {
      buildDoorCasing(builder, wall, opening, {
        bar: opening.door === 'main' ? 0.12 : 0.1,
        proud: opening.door === 'main' ? 0.045 : 0.035,
      });
    }
  }

  return { interactables, doorGroups };
}

/* --- 宿管检测机 ---------------------------------------------------- */

function buildReaders(builder, materials) {
  const interactables = [];
  const groups = [];

  for (const reader of READERS) {
    const group = new THREE.Group();
    group.position.set(reader.x, reader.y, reader.z);
    group.rotation.y = reader.rotY;
    group.name = reader.id;

    const local = new StaticBuilder();
    local.add('readerShell', boxGeometry(0.17, 0.26, 0.035), trs(0, 0, 0));
    local.add('readerFace', boxGeometry(0.145, 0.225, 0.012), trs(0, 0, 0.024));
    local.add('readerFace', boxGeometry(0.11, 0.016, 0.01), trs(0, -0.062, 0.032));
    local.add('brassDark', boxGeometry(0.112, 0.005, 0.005), trs(0, -0.062, 0.036));
    local.add('dome', sphereGeometry(0.014, 10, 8), trs(0.048, 0.082, 0.032));
    local.add('readerFace', boxGeometry(0.026, 0.012, 0.008), trs(-0.048, 0.068, 0.032));
    local.add('readerFace', boxGeometry(0.026, 0.012, 0.008), trs(-0.048, 0.042, 0.032));
    local.add('brassDark', boxGeometry(0.2, 0.3, 0.014), trs(0, 0, -0.022));
    local.add('brassDark', boxGeometry(0.02, 0.92, 0.02), trs(0, 0.46, -0.02));
    local.add('brassDark', boxGeometry(0.07, 0.05, 0.035), trs(0, 0.9, -0.02));
    local.flush(group, materials, 'reader-body');
    group.traverse((child) => {
      if (child.isMesh) child.castShadow = false;
    });
    group.traverse((child) => { if (child.isMesh) child.castShadow = false; });

    const screen = new THREE.Mesh(boxGeometry(0.09, 0.05, 0.004), materials.screenGlow);
    screen.position.set(0, 0.012, 0.034);
    screen.name = 'reader-screen';
    screen.castShadow = false;
    group.add(screen);

    const red = new THREE.Mesh(boxGeometry(0.016, 0.008, 0.004), materials.ledRed);
    red.position.set(-0.048, 0.068, 0.039);
    red.castShadow = false;
    group.add(red);

    const green = new THREE.Mesh(boxGeometry(0.016, 0.008, 0.004), materials.ledGreen);
    green.position.set(-0.048, 0.042, 0.039);
    green.castShadow = false;
    group.add(green);

    const item = {
      id: reader.id,
      label: reader.label,
      locked: true,
      open: false,
      target: 0,
      value: 0,
      message: reader.message,
      prompt: '刷学生平板',
      hitRoots: [group],
      ledRed: red,
      ledGreen: green,
      screen,
      flash: 0,
      apply() {},
    };
    interactables.push(item);
    groups.push({ group, item, red, green, screen });
  }

  return { interactables, groups };
}

/* --- 木雕挂板 ------------------------------------------------------ */

function buildReliefPanel(builder, { x, z, y, rotY, variant, width, height }) {
  const frameMatrix = trs(x, y, z, rotY);
  const add = (key, geometry, localMatrix) => {
    builder.add(key, geometry, new THREE.Matrix4().multiplyMatrices(frameMatrix, localMatrix));
  };

  const border = 0.055;
  add('walnut', boxGeometry(width, border, 0.07), trs(0, height / 2 - border / 2, 0.035));
  add('walnut', boxGeometry(width, border, 0.07), trs(0, -height / 2 + border / 2, 0.035));
  add('walnut', boxGeometry(border, height - border * 2, 0.07), trs(-width / 2 + border / 2, 0, 0.035));
  add('walnut', boxGeometry(border, height - border * 2, 0.07), trs(width / 2 - border / 2, 0, 0.035));
  add('walnutDark', boxGeometry(width - border * 2, height - border * 2, 0.03), trs(0, 0, 0.018));

  const innerW = width - border * 2 - 0.04;
  const innerH = height - border * 2 - 0.04;

  if (variant % 3 === 0) {
    add('walnut', cylinderGeometry(0.075, 0.075, 0.024, 20), trs(0, 0, 0.042, 0, 1, 1, 1, Math.PI / 2));
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2;
      add('walnut', sphereGeometry(0.032, 8, 6), trs(Math.cos(angle) * 0.115, Math.sin(angle) * 0.115, 0.04, 0, 1, 0.55, 1));
    }
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        add('walnutDark', boxGeometry(0.16, 0.02, 0.014), trs(sx * (innerW / 2 - 0.11), sy * (innerH / 2 - 0.06), 0.036, 0, 1, 1, 1, 0, sx * sy * 0.6));
      }
    }
  } else if (variant % 3 === 1) {
    const cols = 4;
    const rows = 2;
    for (let cx = 0; cx < cols; cx += 1) {
      for (let cy = 0; cy < rows; cy += 1) {
        const px = (cx - (cols - 1) / 2) * (innerW / cols);
        const py = (cy - (rows - 1) / 2) * (innerH / rows);
        add('walnut', boxGeometry(0.115, 0.115, 0.018), trs(px, py, 0.036, 0, 1, 1, 1, 0, Math.PI / 4));
        add('walnutDark', boxGeometry(0.05, 0.05, 0.026), trs(px, py, 0.04, 0, 1, 1, 1, 0, Math.PI / 4));
      }
    }
  } else {
    for (let i = 0; i < 11; i += 1) {
      const t = i / 10;
      const angle = -0.9 + t * 1.8;
      add('walnut', boxGeometry(0.035, innerH * 0.7, 0.016), trs(Math.sin(angle) * 0.06, -0.015, 0.036, 0, 1, 1, 1, 0, -angle * 0.55));
    }
    add('walnutDark', cylinderGeometry(0.04, 0.04, 0.026, 14), trs(0, -innerH / 2 + 0.05, 0.044, 0, 1, 1, 1, Math.PI / 2));
  }
}

function buildReliefs(builder) {
  const reliefRot = { north: 0, south: Math.PI };
  for (const panel of RELIEF_PANELS) {
    buildReliefPanel(builder, {
      x: panel.x,
      z: panel.z + (panel.wall === 'north' ? 0.08 : -0.08),
      y: panel.y,
      rotY: reliefRot[panel.wall],
      variant: panel.variant,
      width: RELIEF.width,
      height: RELIEF.height,
    });
  }

  // 大门上方：横向木雕日轮。
  const frameMatrix = trs(DOOR_RELIEF.x + 0.075, DOOR_RELIEF.y, DOOR_RELIEF.z, Math.PI / 2);
  const add = (key, geometry, localMatrix) => {
    builder.add(key, geometry, new THREE.Matrix4().multiplyMatrices(frameMatrix, localMatrix));
  };
  const w = DOOR_RELIEF.width;
  const h = DOOR_RELIEF.height;
  add('walnut', boxGeometry(w, 0.06, 0.07), trs(0, h / 2 - 0.03, 0.035));
  add('walnut', boxGeometry(w, 0.06, 0.07), trs(0, -h / 2 + 0.03, 0.035));
  add('walnut', boxGeometry(0.06, h, 0.07), trs(-w / 2 + 0.03, 0, 0.035));
  add('walnut', boxGeometry(0.06, h, 0.07), trs(w / 2 - 0.03, 0, 0.035));
  add('walnutDark', boxGeometry(w - 0.12, h - 0.12, 0.025), trs(0, 0, 0.018));
  for (let i = 0; i < 17; i += 1) {
    const t = i / 16;
    const angle = Math.PI * (0.1 + t * 0.8);
    const rayLength = h * 0.44 + Math.sin(t * Math.PI) * 0.03;
    add(
      'walnut',
      boxGeometry(0.024, rayLength, 0.02),
      trs(Math.cos(angle) * (w * 0.4), Math.sin(angle) * (h * 0.22) - h * 0.1, 0.04, 0, 1, 1, 1, 0, angle - Math.PI / 2),
    );
  }
  add('brassDark', cylinderGeometry(0.055, 0.055, 0.028, 18), trs(-w * 0.4, 0.01, 0.046, 0, 1, 1, 1, Math.PI / 2));
  add('walnut', cylinderGeometry(0.03, 0.03, 0.034, 14), trs(-w * 0.4, 0.01, 0.05, 0, 1, 1, 1, Math.PI / 2));
}

/* --- 门外楼梯厅预留段 ---------------------------------------------- */

function buildLanding(builder) {
  const near = LANDING.nearX;
  const far = LANDING.farX;
  const depth = near - far;
  const width = LANDING.halfDepth * 2;
  const height = LANDING.height;
  const midX = (near + far) / 2;

  builder.add('stone', uvScaledPlane(depth, width, 1.2), trs(midX, 0.001, 0, 0, 1, 1, 1, -Math.PI / 2), { cast: false });
  builder.add('ceiling', uvScaledPlane(depth, width, 1.5), trs(midX, height, 0, 0, 1, 1, 1, Math.PI / 2));

  builder.add('wall', uvScaledPlane(depth, height, 1.5), trs(midX, height / 2, -LANDING.halfDepth, 0));
  builder.add('wall', uvScaledPlane(depth, height, 1.5), trs(midX, height / 2, LANDING.halfDepth, Math.PI));
  builder.add('wall', uvScaledPlane(width, height, 1.5), trs(far, height / 2, 0, Math.PI / 2));

  const doorHalf = DOORS.main.width / 2;
  builder.add('wall', uvScaledPlane(LANDING.halfDepth - doorHalf, height, 1.5), trs(near, height / 2, -(doorHalf + (LANDING.halfDepth - doorHalf) / 2), -Math.PI / 2));
  builder.add('wall', uvScaledPlane(LANDING.halfDepth - doorHalf, height, 1.5), trs(near, height / 2, doorHalf + (LANDING.halfDepth - doorHalf) / 2, -Math.PI / 2));
  builder.add('wall', uvScaledPlane(doorHalf * 2, height - DOORS.main.height, 1.5), trs(near, DOORS.main.height + (height - DOORS.main.height) / 2, 0, -Math.PI / 2));

  const base = 0.12;
  builder.addBox('oakDark', depth, base, 0.03, midX, base / 2, -LANDING.halfDepth + 0.015);
  builder.addBox('oakDark', depth, base, 0.03, midX, base / 2, LANDING.halfDepth - 0.015);
  builder.addBox('oakDark', 0.03, base, width, far + 0.015, base / 2, 0);

  const consoleX = far + 0.21;
  builder.add('walnut', boxGeometry(0.42, 0.06, 2.1), trs(consoleX, 0.78, 0));
  builder.add('walnutDark', boxGeometry(0.36, 0.66, 2.0), trs(consoleX - 0.02, 0.42, 0));
  for (const zz of [-0.86, 0.86]) {
    builder.add('walnutDark', boxGeometry(0.34, 0.1, 0.1), trs(consoleX - 0.02, 0.06, zz));
  }
  builder.add('brassDark', boxGeometry(0.014, 0.05, 0.4), trs(consoleX + 0.2, 0.73, 0));

  builder.add('brassDark', boxGeometry(0.02, 0.22, 1.1), trs(far + 0.03, 1.12, 0));
  builder.add('brass', boxGeometry(0.012, 0.18, 1.02), trs(far + 0.045, 1.12, 0));

  for (const zz of [-2.5, 2.5]) {
    builder.add('brassDark', boxGeometry(0.05, 0.16, 0.1), trs(far + 0.03, 2.15, zz));
    builder.add('brass', cylinderGeometry(0.012, 0.012, 0.24, 8), trs(far + 0.14, 2.2, zz, 0, 1, 1, 1, 0, Math.PI / 2));
    builder.add('brassDark', cylinderGeometry(0.075, 0.055, 0.14, 14), trs(far + 0.25, 2.26, zz));
    builder.add('bulbWarmWhite', sphereGeometry(0.045, 12, 8), trs(far + 0.25, 2.24, zz));
  }

  builder.add('brassDark', cylinderGeometry(0.16, 0.2, 0.06, 18), trs(midX, height - 0.03, 0));
  builder.add('bulbWarmWhite', sphereGeometry(0.12, 16, 10), trs(midX, height - 0.12, 0, 0, 1, 0.6, 1));

  return { center: new THREE.Vector3(midX, height - 0.35, 0) };
}

/* --- 碰撞体 -------------------------------------------------------- */

export function roomColliders() {
  const colliders = [];
  const box = (x, z, hx, hz, rot = 0) => colliders.push({ x, z, hx, hz, rot });

  box(0, -HALF_D - WALL_T / 2, HALF_L, WALL_T / 2);
  box(0, HALF_D + WALL_T / 2, HALF_L, WALL_T / 2);
  box(HALF_L + WALL_T / 2, 0, WALL_T / 2, HALF_D);
  box(-HALF_L - WALL_T / 2, -(HALF_D + 1.4) / 2, WALL_T / 2, (HALF_D - 1.4) / 2);
  box(-HALF_L - WALL_T / 2, (HALF_D + 1.4) / 2, WALL_T / 2, (HALF_D - 1.4) / 2);
  box(LANDING.farX - WALL_T / 2, 0, WALL_T / 2, LANDING.halfDepth);
  box((LANDING.farX + LANDING.nearX) / 2, -LANDING.halfDepth - WALL_T / 2, (LANDING.nearX - LANDING.farX) / 2, WALL_T / 2);
  box((LANDING.farX + LANDING.nearX) / 2, LANDING.halfDepth + WALL_T / 2, (LANDING.nearX - LANDING.farX) / 2, WALL_T / 2);
  box(LANDING.farX + 0.2, 0, 0.22, 1.1);

  return colliders;
}

/* --- 组装 ---------------------------------------------------------- */

export function buildRoom(builder, materials, textures) {
  const root = new THREE.Group();
  root.name = 'lounge-room';
  root.add(buildFloor(builder, materials, textures));

  buildCeiling(builder);
  buildWalls(builder);
  const doors = buildDoors(builder, materials);
  const readers = buildReaders(builder, materials);
  buildReliefs(builder);
  const landing = buildLanding(builder);

  root.add(doors.doorGroups.main.left, doors.doorGroups.main.right);
  root.add(doors.doorGroups.male.group, doors.doorGroups.female.group);
  for (const reader of readers.groups) root.add(reader.group);

  return {
    root,
    doorGroups: doors.doorGroups,
    interactables: [...doors.interactables, ...readers.interactables],
    readerGroups: readers.groups,
    landing,
  };
}
