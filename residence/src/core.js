import * as THREE from 'three';
import {
  StaticBuilder,
  boxGeometry,
  cylinderGeometry,
  sphereGeometry,
  torusGeometry,
  planeGeometry,
  trs,
} from '../../shared/utils.js';
import { LIFT, STAIR, GATE, STORAGE, X } from './config.js';
import { addFace, addWall, addCasing, addFloor, addCeiling, H, IT } from './build.js';

/* ------------------------------------------------------------------ *
 * 右下核心筒“只留门”：电梯门/呼叫面板、楼梯间防火门、N 杂物间门。
 * 门后不建井道、楼梯、货架等空间 —— 后续需要时再补。
 * 铁栅栏 + 平板门是本层唯一的动态门。
 * ------------------------------------------------------------------ */

function buildLift() {
  const { x0, doorZ, doorWidth, doorHeight, frameWidth, frameHeight, callX, callY, callZ } = LIFT;
  const frameX = x0 - 0.01;

  builderBox('metalDark', 0.09, 0.06, frameWidth + 0.1, frameX, frameHeight + 0.03, doorZ);
  for (const side of [-1, 1]) {
    builderBox('metalDark', 0.09, frameHeight + 0.06, 0.06, frameX, frameHeight / 2, doorZ + side * (frameWidth / 2 + 0.02));
  }
  builderBox('black', 0.2, frameHeight, frameWidth, x0 + 0.08, frameHeight / 2, doorZ);
  for (const side of [-1, 1]) {
    builderBox('metal', 0.045, doorHeight, doorWidth / 2, frameX - 0.02, doorHeight / 2, doorZ + side * doorWidth / 4);
    for (const groove of [-0.16, 0.16]) {
      builderBox('metalDark', 0.006, doorHeight - 0.16, 0.012, frameX - 0.05, doorHeight / 2, doorZ + side * doorWidth / 4 + groove);
    }
  }
  builderBox('black', 0.008, doorHeight, 0.012, frameX - 0.05, doorHeight / 2, doorZ);
  for (const side of [-1, 1]) {
    builderBox('metalDark', 0.012, 0.02, doorWidth / 2 - 0.08, frameX - 0.06, 0.12, doorZ + side * doorWidth / 4);
  }

  builderBox('metalDark', 0.045, 0.19, 0.5, frameX - 0.02, 2.58, doorZ);
  builderBox('black', 0.014, 0.13, 0.44, frameX - 0.05, 2.58, doorZ);
  builderBox('ledAmber', 0.004, 0.018, 0.11, frameX - 0.06, 2.58, doorZ);
  builderBox('metalDark', 0.004, 0.018, 0.11, frameX - 0.06, 2.58, doorZ - 0.15);
  builderBox('metalDark', 0.004, 0.018, 0.11, frameX - 0.06, 2.58, doorZ + 0.15);
  activeBuilder.add('ledRed', sphereGeometry(0.008, 6, 5), trs(callX, 2.525, doorZ + 0.21));

  builderBox('metal', 0.04, 0.26, 0.12, callX, callY, callZ);
  builderBox('black', 0.012, 0.2, 0.09, callX - 0.026, callY, callZ);
  activeBuilder.add('brass', cylinderGeometry(0.024, 0.024, 0.018, 12), trs(callX - 0.038, callY + 0.055, callZ, 0, 1, 1, 1, 0, Math.PI / 2));
  activeBuilder.add('metalDark', cylinderGeometry(0.022, 0.022, 0.016, 12), trs(callX - 0.038, callY - 0.035, callZ, 0, 1, 1, 1, 0, Math.PI / 2));
  activeBuilder.add('ledRed', sphereGeometry(0.008, 6, 5), trs(callX - 0.04, callY + 0.105, callZ));
}

function buildStairDoor(materials) {
  const group = new THREE.Group();
  group.name = 'stair-door';
  group.position.set(STAIR.doorX - STAIR.doorWidth / 2, 0, STAIR.z0 + IT / 2);
  const local = new StaticBuilder();
  const w = STAIR.doorWidth;
  const h = STAIR.doorHeight;
  local.add('fireDoor', boxGeometry(w, h, 0.06), trs(w / 2, h / 2, 0));
  local.add('metalDark', boxGeometry(w - 0.02, 0.22, 0.068), trs(w / 2, 0.12, 0));
  local.add('metalDark', boxGeometry(0.34, 0.62, 0.07), trs(w / 2, 1.55, 0));
  local.add('glass', boxGeometry(0.28, 0.54, 0.076), trs(w / 2, 1.55, 0), { cast: false });
  for (const side of [-1, 1]) {
    local.add('metal', boxGeometry(w - 0.3, 0.045, 0.074), trs(w / 2, 1.02, side * 0.07));
    local.add('metalDark', boxGeometry(0.04, 0.06, 0.1), trs(w / 2 - 0.45, 1.02, side * 0.05));
    local.add('metalDark', boxGeometry(0.04, 0.06, 0.1), trs(w / 2 + 0.45, 1.02, side * 0.05));
  }
  for (const y of [0.3, 1.1, 1.9]) {
    local.add('metalDark', cylinderGeometry(0.022, 0.022, 0.1, 8), trs(0.03, y, 0));
  }
  local.add('metalDark', boxGeometry(0.45, 0.05, 0.07), trs(w - 0.3, h - 0.12, 0.08));
  local.add('brassDark', boxGeometry(0.22, 0.09, 0.008), trs(w - 0.4, 1.62, 0.04));
  local.flush(group, materials, 'stair-door-leaf');

  const item = {
    id: 'door.stair',
    label: '楼梯间防火门',
    open: true,
    value: 1,
    target: 1,
    hitRoots: [group],
    apply(value) {
      group.rotation.y = -value * STAIR.openAngle;
    },
  };
  item.apply(1);
  return { group, item };
}

function buildStairRoom(builder) {
  const {
    x0, x1, z0, z1, doorX, doorWidth, doorHeight,
    landingDepth, steps, rise, run, lowerY,
  } = STAIR;
  const stairWidth = x1 - x0 - 0.2;
  const stairBottom = lowerY - 0.14;
  const firstNoseZ = z0 + landingDepth;

  // 楼梯间一侧的北墙（走廊墙由 room.js 建），门洞 + 下层挡墙。
  addWall(builder, {
    key: 'wallpaperDamp',
    axis: 'x',
    at: z0 + IT,
    from: x0,
    to: x1,
    y0: 0,
    y1: H,
    rotY: 0,
    openings: [{ from: doorX - doorWidth / 2, to: doorX + doorWidth / 2, height: doorHeight }],
  });
  addFace(builder, 'wallpaperDamp', { axis: 'x', at: z0 + IT, from: x0, to: x1, y0: lowerY - 0.14, y1: 0, rotY: 0 });
  addCasing(builder, {
    axis: 'x',
    at: z0 + IT,
    center: doorX,
    width: doorWidth,
    height: doorHeight,
    normal: 1,
    casingKey: 'metalDark',
    thickness: 0.08,
    proud: 0.035,
    wall: IT,
  });

  // 两侧与南侧墙体、上层平台、顶部。
  for (const [axis, at, from, to, rotY] of [
    ['z', x0, z0, z1, Math.PI / 2],
    ['z', x1, z0, z1, -Math.PI / 2],
    ['x', z1, x0, x1, 0],
  ]) {
    addFace(builder, 'wallpaperDamp', { axis, at, from, to, y0: lowerY - 0.14, y1: H, rotY });
  }
  addFloor(builder, 'marble', x0, x1, z0, firstNoseZ, 0.002, 1.2);
  addCeiling(builder, 'ceiling', x0, x1, z0, z1, H, 2.4);

  // 8 级实体踏步，从上层平台边缘向南下 1.32 m。
  for (let i = 0; i < steps; i += 1) {
    const topY = -(i + 1) * rise;
    const noseZ = firstNoseZ + i * run;
    const height = topY - stairBottom;
    builder.add('stoneDark', boxGeometry(stairWidth, height, run), trs((x0 + x1) / 2, (topY + stairBottom) / 2, noseZ + run / 2));
    builder.addBox('metalDark', stairWidth - 0.04, 0.012, 0.02, (x0 + x1) / 2, topY + 0.005, noseZ + 0.01);
  }
  const lastNoseZ = firstNoseZ + steps * run;
  addFloor(builder, 'marble', x0, x1, lastNoseZ, z1, lowerY + 0.001, 1.2);

  // 下层防火门。
  builder.addBox('fireDoor', 1.0, 2.2, 0.055, doorX, lowerY + 1.1, z1 - 0.03);
  builder.addBox('brass', 0.9, 0.045, 0.03, doorX, lowerY + 0.95, z1 - 0.075);
  builder.addBox('underGlow', 0.84, 0.008, 0.02, doorX, lowerY + 0.008, z1 - 0.09);
  builder.addBox('trim', 1.12, 0.03, 0.07, doorX, lowerY + 2.215, z1 - 0.02);
  for (const side of [-1, 1]) {
    builder.addBox('trim', 0.03, 2.2, 0.07, doorX + side * 0.515, lowerY + 1.1, z1 - 0.02);
  }

  // 两侧扶手。
  for (const side of [-1, 1]) {
    const railX = side < 0 ? x0 + 0.09 : x1 - 0.09;
    const top = [railX, 1.0, firstNoseZ + 0.02];
    const bottom = [railX, lowerY + 0.9, lastNoseZ + 0.02];
    const length = Math.hypot(top[1] - bottom[1], top[2] - bottom[2]);
    builder.add('woodDark', cylinderGeometry(0.03, 0.03, length, 8), trs(
      railX,
      (top[1] + bottom[1]) / 2,
      (top[2] + bottom[2]) / 2,
      0, 1, 1, 1,
      Math.atan2(top[1] - bottom[1], top[2] - bottom[2]),
    ));
    for (let i = 0; i <= 3; i += 1) {
      const t = i / 3;
      const z = top[2] + (bottom[2] - top[2]) * t;
      const y = top[1] + (bottom[1] - top[1]) * t;
      builder.add('metalDark', cylinderGeometry(0.012, 0.012, Math.hypot(0.12, 0.04), 6), trs(
        railX - side * 0.06,
        y - 0.04,
        z,
      ));
    }
  }

  // 梯口铁链 + 红色警示牌。
  for (const side of [-1, 1]) {
    const cx = (x0 + x1) / 2 + side * 0.9;
    builder.add('brassDark', cylinderGeometry(0.026, 0.032, 0.95, 10), trs(cx, 0.475, firstNoseZ + 0.02));
    builder.add('brass', sphereGeometry(0.036, 10, 8), trs(cx, 0.96, firstNoseZ + 0.02));
  }
  for (let i = 0; i < 16; i += 1) {
    const t = i / 15;
    const cx = (x0 + x1) / 2 - 0.9 + t * 1.8;
    const sag = Math.sin(t * Math.PI) * 0.14;
    builder.add('metalDark', torusGeometry(0.02, 0.005, 4, 8), trs(cx, 0.86 - sag, firstNoseZ + 0.02, i % 2 ? Math.PI / 2 : 0, 1, 1, 1, 0, Math.PI / 2));
  }
  builder.addBox('red', 0.24, 0.16, 0.008, (x0 + x1) / 2, 0.64, firstNoseZ + 0.03);
  builder.addBox('trim', 0.26, 0.18, 0.006, (x0 + x1) / 2, 0.64, firstNoseZ + 0.024);

  // 下层壁灯。
  builder.addBox('brassDark', 0.06, 0.16, 0.16, x1 - 0.03, lowerY + 1.2, z1 - 0.35);
  builder.add('fixtureWarm', sphereGeometry(0.08, 10, 8), trs(x1 - 0.1, lowerY + 1.2, z1 - 0.35));
}

function buildStorageDoor() {
  const { doorX, doorZ, width, height } = STORAGE;
  const leafZ = doorZ + 0.035;
  builderBox('metalDark', width, height, 0.05, doorX, height / 2, leafZ);
  builderBox('metal', width - 0.1, height - 0.16, 0.014, doorX, height / 2, leafZ + 0.032);
  builderBox('metalDark', width - 0.18, 0.08, 0.02, doorX, 1.78, leafZ + 0.045);
  builderBox('metalDark', width - 0.18, 0.08, 0.02, doorX, 0.42, leafZ + 0.045);
  for (let i = 0; i < 3; i += 1) {
    builderBox('black', width - 0.34, 0.018, 0.026, doorX, 1.2 + i * 0.09, leafZ + 0.048);
  }
  activeBuilder.add('brass', cylinderGeometry(0.025, 0.025, 0.05, 10), trs(doorX - 0.32, 1.02, leafZ + 0.07, 0, 1, 1, 1, Math.PI / 2));
  activeBuilder.add('brass', boxGeometry(0.13, 0.026, 0.035), trs(doorX - 0.26, 1.02, leafZ + 0.09));
  builderBox('brassDark', 0.26, 0.11, 0.012, doorX, 1.9, leafZ + 0.045);
  builderBox('black', width + 0.08, height + 0.08, 0.04, doorX, height / 2, doorZ - 0.1);
  builderBox('underGlow', width - 0.14, 0.008, 0.02, doorX, 0.008, doorZ + 0.08);
}

function buildGate(materials) {
  const { x0, x1, z, height, gateWidth, gateHeight } = GATE;
  const width = x1 - x0;
  const hingeX = x0 + (width - gateWidth) / 2;
  const gateEnd = hingeX + gateWidth;

  for (const [a, b] of [[x0, hingeX], [gateEnd, x1]]) {
    builderBox('metalDark', b - a, 0.05, 0.06, (a + b) / 2, height - 0.04, z);
    builderBox('metalDark', b - a, 0.05, 0.06, (a + b) / 2, 0.06, z);
    builderBox('metalDark', 0.08, height, 0.08, a, height / 2, z);
    builderBox('metalDark', 0.08, height, 0.08, b, height / 2, z);
    for (let x = a + 0.1; x < b - 0.03; x += 0.14) {
      activeBuilder.add('metalDark', cylinderGeometry(0.014, 0.014, height - 0.1, 6), trs(x, height / 2, z));
    }
    activeBuilder.add('metalDark', cylinderGeometry(0.014, 0.014, b - a, 6), trs((a + b) / 2, height * 0.55, z, 0, 1, 1, 1, 0, Math.PI / 2));
  }

  const group = new THREE.Group();
  group.name = 'gate-iron-leaf';
  group.position.set(hingeX, 0, z);
  const leaf = new StaticBuilder();
  const w = gateWidth;
  for (const y of [0.06, height - 0.05]) {
    leaf.add('metalDark', boxGeometry(w, 0.05, 0.05), trs(w / 2, y, 0));
  }
  for (const x of [0.04, w - 0.04]) {
    leaf.add('metalDark', boxGeometry(0.05, gateHeight, 0.05), trs(x, gateHeight / 2, 0));
  }
  for (let x = 0.1; x < w - 0.06; x += 0.13) {
    leaf.add('metalDark', cylinderGeometry(0.013, 0.013, gateHeight - 0.1, 6), trs(x, gateHeight / 2, 0));
  }
  leaf.add('metalDark', cylinderGeometry(0.014, 0.014, w - 0.1, 6), trs(w / 2, gateHeight * 0.55, 0, 0, 1, 1, 1, 0, Math.PI / 2));
  leaf.add('brass', cylinderGeometry(0.028, 0.028, 0.09, 8), trs(w / 2, 1.05, 0.04, 0, 1, 1, 1, 0, Math.PI / 2));
  leaf.add('brass', boxGeometry(0.12, 0.02, 0.02), trs(w / 2, 1.05, 0.07));
  leaf.add('brass', boxGeometry(w - 0.14, 0.035, 0.02), trs(w / 2, 1.02, 0.06));
  leaf.flush(group, materials, 'gate-leaf');

  const reader = new THREE.Group();
  reader.name = 'gate-reader';
  reader.position.set(GATE.reader.x, GATE.reader.y, GATE.reader.z);
  reader.rotation.y = GATE.reader.rotY;
  const readerBuilder = new StaticBuilder();
  readerBuilder.add('black', boxGeometry(0.1, 0.15, 0.014), trs(0, 0, 0));
  readerBuilder.add('metalDark', boxGeometry(0.084, 0.132, 0.006), trs(0, 0, 0.008));
  readerBuilder.add('screenGlow', planeGeometry(0.06, 0.035), trs(0, 0.01, 0.013), { cast: false });
  readerBuilder.flush(reader, materials, 'gate-reader-body');
  const led = new THREE.Mesh(boxGeometry(0.014, 0.014, 0.005), materials.ledDead);
  led.position.set(0.032, 0.058, 0.017);
  led.name = 'gate-reader-led';
  reader.add(led);

  return { group, reader, led, gateWidth, hingeX, gateHeight };
}

let activeBuilder = null;
function builderBox(key, width, height, depth, x, y, z) {
  activeBuilder.addBox(key, width, height, depth, x, y, z);
}

export function buildCore(builder, materials) {
  activeBuilder = builder;
  buildLift();
  buildStairRoom(builder);
  buildStorageDoor();
  const gate = buildGate(materials);
  const stairDoor = buildStairDoor(materials);
  activeBuilder = null;
  return { gate, stairDoor };
}

export function coreColliders() {
  const boxes = [];
  const box = (x, z, hx, hz, rot = 0) => boxes.push({ x, z, hx, hz, rot });
  const gateHinge = GATE.x0 + (GATE.width - GATE.gateWidth) / 2;
  box((GATE.x0 + gateHinge) / 2, GATE.z, (gateHinge - GATE.x0) / 2, 0.06);
  box((gateHinge + GATE.gateWidth + GATE.x1) / 2, GATE.z, (GATE.x1 - gateHinge - GATE.gateWidth) / 2, 0.06);

  // 楼梯间墙体与梯口铁链；北墙门洞两侧。
  const { x0, x1, z0, z1, doorX, doorWidth, landingDepth } = STAIR;
  box(x0 - 0.06, (z0 + z1) / 2, 0.08, (z1 - z0) / 2);
  box(x1 + 0.06, (z0 + z1) / 2, 0.08, (z1 - z0) / 2);
  box((x0 + x1) / 2, z1 + 0.06, (x1 - x0) / 2, 0.08);
  box((x0 + doorX - doorWidth / 2) / 2, z0 + 0.06, (doorX - doorWidth / 2 - x0) / 2, 0.06);
  box((doorX + doorWidth / 2 + x1) / 2, z0 + 0.06, (x1 - doorX - doorWidth / 2) / 2, 0.06);
  box((x0 + x1) / 2, z0 + landingDepth + 0.02, (x1 - x0) / 2, 0.04);
  return boxes;
}

export { buildGate };
