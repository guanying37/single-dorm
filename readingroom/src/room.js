import * as THREE from 'three';
import {
  boxGeometry,
  cylinderGeometry,
  planeGeometry,
  roundedBoxGeometry,
  sphereGeometry,
  torusGeometry,
  tubeGeometry,
  uvScaledPlane,
  trs,
  latheGeometry,
  pendantShadeGeometry,
  StaticBuilder,
} from './geometry.js';
import {
  ROOM,
  HALF_W,
  HALF_D,
  DOOR,
  WINDOW,
  BENCH,
  BEAM,
  PENDANT,
  SWITCH,
  CCTV,
  CAMERAS,
  WINDOW_BOARDS,
  FRAMES,
  FLOOR_INLAY,
  frameMatrix,
} from './config.js';

/* ------------------------------------------------------------------ *
 * 阅览室房间壳：砖墙、三扇木板封死的北窗、南门、木地板与镶嵌、木板
 * 天花与横梁、三盏工业吊灯、角落 CRT 监控、开关和墙面浮雕。
 *
 * 静态几何按材质合并；只有灯泡发光面、开关拨片、CRT 屏幕/扫描带和
 * 监控红灯保持独立，供逐帧更新。
 * ------------------------------------------------------------------ */

const BRICK_TILE = 2.4;
const FLOOR_TILE = 1.6;
const CEILING_TILE = 2.0;

function addPlane(builder, key, width, height, matrix, tile = BRICK_TILE, options = {}) {
  builder.add(key, uvScaledPlane(width, height, tile), matrix, {
    cast: options.cast ?? false,
    receive: options.receive ?? true,
  });
}

function addBox(builder, key, width, height, depth, x, y, z, ry = 0, options = {}) {
  builder.add(key, boxGeometry(width, height, depth), trs(x, y, z, ry), {
    cast: options.cast ?? true,
    receive: options.receive ?? true,
  });
}

function addCylinder(builder, key, top, bottom, height, segments, matrix, options = {}) {
  builder.add(key, cylinderGeometry(top, bottom, height, segments), matrix, {
    cast: options.cast ?? true,
    receive: options.receive ?? true,
  });
}

/* --- 地面：木地板 + 深色镶嵌 --------------------------------------- */

function buildFloor(builder) {
  builder.add(
    'floorWood',
    uvScaledPlane(ROOM.width, ROOM.depth, FLOOR_TILE),
    trs(0, 0, 0, 0, 1, 1, 1, -Math.PI / 2),
    { cast: false, receive: true },
  );

  const { inset, borderWidth, height } = FLOOR_INLAY;
  const zMin = -HALF_D + inset;
  const zMax = HALF_D - inset;
  const xMin = -HALF_W + inset;
  const xMax = HALF_W - inset;
  const y = 0.001;

  // 四周边框：四条带 + 四个 45° 转角方块。
  addBox(builder, 'floorInlay', xMax - xMin, height, borderWidth, 0, y, zMin + borderWidth / 2, 0, { cast: false });
  addBox(builder, 'floorInlay', xMax - xMin, height, borderWidth, 0, y, zMax - borderWidth / 2, 0, { cast: false });
  addBox(builder, 'floorInlay', borderWidth, height, zMax - zMin - borderWidth * 2, xMin + borderWidth / 2, y, 0, 0, {
    cast: false,
  });
  addBox(builder, 'floorInlay', borderWidth, height, zMax - zMin - borderWidth * 2, xMax - borderWidth / 2, y, 0, 0, {
    cast: false,
  });
  for (const [cx, cz] of [
    [xMin + borderWidth / 2, zMin + borderWidth / 2],
    [xMax - borderWidth / 2, zMin + borderWidth / 2],
    [xMin + borderWidth / 2, zMax - borderWidth / 2],
    [xMax - borderWidth / 2, zMax - borderWidth / 2],
  ]) {
    builder.add('floorInlay', boxGeometry(borderWidth, height, borderWidth), trs(cx, y, cz, Math.PI / 4), {
      cast: false,
      receive: true,
    });
  }
}

/* --- 砖墙：北墙开窗，南墙开门 -------------------------------------- */

function buildWalls(builder) {
  const H = ROOM.height;
  const W = WINDOW.width;
  const S = WINDOW.sill;
  const top = WINDOW.top;

  // 北墙：窗下墙、窗上墙、四段窗间墙。
  addPlane(builder, 'brickWall', ROOM.width, S, trs(0, S / 2, -HALF_D));
  addPlane(builder, 'brickWall', ROOM.width, H - top, trs(0, (H + top) / 2, -HALF_D));
  const edges = [-HALF_W];
  for (const center of WINDOW.centers) {
    edges.push(center - W / 2, center + W / 2);
  }
  edges.push(HALF_W);
  for (let i = 0; i < edges.length; i += 2) {
    const x0 = edges[i];
    const x1 = edges[i + 1];
    if (x1 - x0 < 0.001) continue;
    addPlane(builder, 'brickWall', x1 - x0, top - S, trs((x0 + x1) / 2, (S + top) / 2, -HALF_D));
  }

  // 南墙：门两侧 + 门楣。
  const openL = DOOR.centerX - DOOR.width / 2;
  const openR = DOOR.centerX + DOOR.width / 2;
  addPlane(builder, 'brickWall', openL + HALF_W, H, trs(-HALF_W + (openL + HALF_W) / 2, H / 2, HALF_D, Math.PI));
  addPlane(builder, 'brickWall', HALF_W - openR, H, trs(openR + (HALF_W - openR) / 2, H / 2, HALF_D, Math.PI));
  addPlane(builder, 'brickWall', DOOR.width, H - DOOR.height, trs(DOOR.centerX, DOOR.height + (H - DOOR.height) / 2, HALF_D, Math.PI));

  // 东西墙。
  addPlane(builder, 'brickWall', ROOM.depth, H, trs(HALF_W, H / 2, 0, -Math.PI / 2));
  addPlane(builder, 'brickWall', ROOM.depth, H, trs(-HALF_W, H / 2, 0, Math.PI / 2));

  // 门洞与窗洞的砖砌洞口：0.24 m 墙厚，做满四边，避免出现黑洞。
  const reveal = ROOM.wallThickness;
  addBox(builder, 'brickDeep', 0.07, DOOR.height, reveal, openL - 0.035, DOOR.height / 2, HALF_D + reveal / 2, 0, {
    cast: false,
  });
  addBox(builder, 'brickDeep', 0.07, DOOR.height, reveal, openR + 0.035, DOOR.height / 2, HALF_D + reveal / 2, 0, {
    cast: false,
  });
  addBox(builder, 'brickDeep', DOOR.width + 0.14, 0.07, reveal, DOOR.centerX, DOOR.height + 0.035, HALF_D + reveal / 2, 0, {
    cast: false,
  });
  // 门槛：磨亮的黄铜条。
  addBox(builder, 'brassDark', DOOR.width, 0.014, 0.15, DOOR.centerX, 0.007, HALF_D - 0.02, 0, { cast: false });

  const zReveal = -HALF_D - reveal / 2;
  for (const center of WINDOW.centers) {
    const left = center - W / 2;
    const right = center + W / 2;
    // 侧壁、窗顶、窗台下的砖。
    addBox(builder, 'brickDeep', 0.06, top - S, reveal, left - 0.03, (S + top) / 2, zReveal, 0, { cast: false });
    addBox(builder, 'brickDeep', 0.06, top - S, reveal, right + 0.03, (S + top) / 2, zReveal, 0, { cast: false });
    addBox(builder, 'brickDeep', W + 0.12, 0.06, reveal, center, top + 0.03, zReveal, 0, { cast: false });
    addBox(builder, 'brickSill', W + 0.12, 0.06, reveal, center, S - 0.03, zReveal, 0, { cast: false });
  }
}

/* --- 木地板踢脚线与墙面收口 ---------------------------------------- */

function buildSkirting(builder) {
  const h = 0.115;
  const t = 0.022;
  const inset = t / 2;
  addBox(builder, 'skirting', ROOM.width - 0.02, h, t, 0, h / 2, -HALF_D + inset, 0, { cast: false });
  addBox(builder, 'skirting', ROOM.width - 0.02, h, t, 0, h / 2, HALF_D - inset, 0, { cast: false });
  addBox(builder, 'skirting', t, h, ROOM.depth - 0.02, -HALF_W + inset, h / 2, 0, 0, { cast: false });
  addBox(builder, 'skirting', t, h, ROOM.depth - 0.02, HALF_W - inset, h / 2, 0, 0, { cast: false });
  // 顶部圆线脚。
  addBox(builder, 'trimWood', ROOM.width - 0.02, 0.014, t + 0.008, 0, h + 0.007, -HALF_D + inset, 0, { cast: false });
  addBox(builder, 'trimWood', ROOM.width - 0.02, 0.014, t + 0.008, 0, h + 0.007, HALF_D - inset, 0, { cast: false });
  addBox(builder, 'trimWood', t + 0.008, 0.014, ROOM.depth - 0.02, -HALF_W + inset, h + 0.007, 0, 0, { cast: false });
  addBox(builder, 'trimWood', t + 0.008, 0.014, ROOM.depth - 0.02, HALF_W - inset, h + 0.007, 0, 0, { cast: false });
}

/* --- 木板天花、横梁、檐口 ------------------------------------------ */

function buildCeiling(builder) {
  const H = ROOM.height;
  builder.add(
    'ceilingWood',
    uvScaledPlane(ROOM.width, ROOM.depth, CEILING_TILE),
    trs(0, H, 0, 0, 1, 1, 1, Math.PI / 2),
    { cast: false, receive: true },
  );

  // 四道横梁，压在吊灯上方。
  for (const z of BEAM.zs) {
    addBox(builder, 'beamWood', ROOM.width, BEAM.depth, BEAM.width, 0, H - BEAM.depth / 2, z, 0, { cast: false });
    // 梁底一条浅色倒角，避免梁底死黑。
    addBox(builder, 'trimWood', ROOM.width - 0.02, 0.012, BEAM.width + 0.02, 0, H - BEAM.depth - 0.006, z, 0, {
      cast: false,
    });
  }

  // 檐口：一圈胡桃木线脚。
  const h = 0.12;
  const d = 0.09;
  addBox(builder, 'trimWood', ROOM.width, h, d, 0, H - h / 2, -HALF_D + d / 2, 0, { cast: false });
  addBox(builder, 'trimWood', ROOM.width, h, d, 0, H - h / 2, HALF_D - d / 2, 0, { cast: false });
  addBox(builder, 'trimWood', d, h, ROOM.depth, -HALF_W + d / 2, H - h / 2, 0, 0, { cast: false });
  addBox(builder, 'trimWood', d, h, ROOM.depth, HALF_W - d / 2, H - h / 2, 0, 0, { cast: false });
}

/* --- 北窗、玻璃与窗外切片 ------------------------------------------ */

function buildWindows(builder) {
  const frame = WINDOW.frame;
  const z = -HALF_D + 0.01;
  for (const center of WINDOW.centers) {
    const left = center - WINDOW.width / 2;
    const right = center + WINDOW.width / 2;
    const sill = WINDOW.sill;
    const top = WINDOW.top;
    const innerH = top - sill;

    // 窗框：左右边框、上槛、下槛。
    addBox(builder, 'trimWood', frame, innerH, 0.1, left + frame / 2, (sill + top) / 2, z, 0, { cast: false });
    addBox(builder, 'trimWood', frame, innerH, 0.1, right - frame / 2, (sill + top) / 2, z, 0, { cast: false });
    addBox(builder, 'trimWood', WINDOW.width, frame, 0.1, center, top - frame / 2, z, 0, { cast: false });
    addBox(builder, 'trimWood', WINDOW.width, frame, 0.1, center, sill + frame / 2, z, 0, { cast: false });

    // 室内窗台板：45° 收边，挑出墙面 0.07 m。
    addBox(builder, 'trimWood', WINDOW.width + 0.1, 0.055, 0.24, center, sill - 0.028, -HALF_D + 0.1, 0, { cast: false });
    addBox(builder, 'trimWood', WINDOW.width + 0.14, 0.02, 0.06, center, sill - 0.06, -HALF_D + 0.025, 0, { cast: false });
    // 窗外滴水线。
    addBox(builder, 'brickSill', WINDOW.width + 0.12, 0.05, 0.16, center, sill - 0.06, -HALF_D - 0.16, 0, { cast: false });

    // 窗棂：2 × 3 格。
    for (let i = 1; i < WINDOW.panesX; i += 1) {
      const x = left + (WINDOW.width / WINDOW.panesX) * i;
      addBox(builder, 'trimWood', WINDOW.muntin, innerH, 0.055, x, (sill + top) / 2, z - 0.012, 0, { cast: false });
    }
    for (let i = 1; i < WINDOW.panesY; i += 1) {
      const y = sill + (innerH / WINDOW.panesY) * i;
      addBox(builder, 'trimWood', WINDOW.width - frame * 2, WINDOW.muntin, 0.05, center, y, z - 0.012, 0, { cast: false });
    }

    // 玻璃已拆除：窗洞里先压一块近黑的深腔，再从室内钉木板。
    builder.add(
      'windowCavity',
      planeGeometry(WINDOW.width + 0.02, innerH + 0.02),
      trs(center, (sill + top) / 2, -HALF_D + 0.035),
      { cast: false, receive: false },
    );
  }
}

/* --- 封死北窗：横板 + 竖压条 + 斜撑 + 钉子 + 冷光缝 ---------------- */

function buildWindowBoards(builder) {
  const { rows, boardHeight, boardGap, overhang, thickness, brace, batten } = WINDOW_BOARDS;
  const boardKeys = ['boardA', 'boardB', 'boardA', 'boardB', 'boardA', 'boardB'];
  const zBoard = -HALF_D + 0.075;
  const step = boardHeight + boardGap;
  const firstY = WINDOW.sill + boardHeight / 2 + 0.01;

  for (let w = 0; w < WINDOW.centers.length; w += 1) {
    const cx = WINDOW.centers[w];
    const length = WINDOW.width + overhang * 2 - 0.04 + (w % 2) * 0.03;
    const nailCount = [];

    for (let row = 0; row < rows; row += 1) {
      const y = firstY + row * step;
      const h = boardHeight + ((row + w) % 3 === 0 ? 0.012 : -0.006);
      const rz = ((row + w) % 2 === 0 ? 1 : -1) * (0.004 + ((row * 3 + w) % 4) * 0.0018);
      const z = zBoard + (row % 3) * 0.0014;
      builder.add(boardKeys[(row + w) % boardKeys.length], boxGeometry(length, h, thickness), trs(cx, y, z, 0, 1, 1, 1, 0, rz), {
        cast: true,
        receive: true,
      });
      // 两端各一颗钉子；中间再补一颗，像真的钉上去的。
      for (const nx of [-length / 2 + 0.12, length / 2 - 0.12, 0]) {
        nailCount.push({ x: cx + nx, y: y + 0.015, z: z + thickness / 2 + 0.002 });
      }
    }

    // 竖压条。
    const battenLength = rows * step - boardGap + 0.02;
    builder.add(
      'boardB',
      boxGeometry(batten.width, battenLength, batten.thickness),
      trs(cx, WINDOW.sill + boardHeight / 2 + 0.01 + ((rows - 1) * step) / 2, zBoard + 0.045),
      { cast: true, receive: true },
    );
    for (const by of [firstY + 0.06, firstY + (rows - 1) * step - 0.06]) {
      nailCount.push({ x: cx, y: by, z: zBoard + 0.045 + batten.thickness / 2 + 0.002 });
    }

    // 斜撑，左右两扇反向。
    const braceAngle = (w % 2 === 0 ? 1 : -1) * brace.angle;
    builder.add(
      'boardB',
      boxGeometry(brace.length, brace.width, brace.thickness),
      trs(cx + (w % 2 === 0 ? -0.03 : 0.03), WINDOW.sill + 0.83, zBoard + 0.062, 0, 1, 1, 1, 0, braceAngle),
      { cast: true, receive: true },
    );
    for (const t of [-0.44, 0, 0.44]) {
      nailCount.push({
        x: cx + (w % 2 === 0 ? -0.03 : 0.03) + t * brace.length * 0.5 * Math.cos(braceAngle),
        y: WINDOW.sill + 0.83 + t * brace.length * 0.5 * Math.sin(braceAngle),
        z: zBoard + 0.062 + brace.thickness / 2 + 0.002,
      });
    }

    // 所有钉子在同一次合批里。
    for (const nail of nailCount) {
      builder.add(
        'cord',
        cylinderGeometry(0.0125, 0.0115, 0.017, 8),
        trs(nail.x, nail.y, nail.z, 0, 1, 1, 1, Math.PI / 2, 0),
        { cast: false, receive: false },
      );
    }

    // 板缝里的冷光。板子之间留 0.028 m，细缝只透出很弱的一线天光。
    for (let gap = 0; gap < rows - 1; gap += 1) {
      const gy = firstY + boardHeight / 2 + gap * step + boardGap / 2;
      builder.add('seamLight', planeGeometry(WINDOW.width - 0.12, 0.003), trs(cx, gy, -HALF_D + 0.04), {
        cast: false,
        receive: false,
      });
    }
  }
}

/* --- 新增监控摄像：西北吊顶角 + 门上方 ---------------------------- */

function buildCameras(builder) {
  const ceilingY = ROOM.height;
  for (const cam of CAMERAS) {
    const base = new THREE.Matrix4().compose(
      new THREE.Vector3(cam.x, cam.y, cam.z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(cam.pitch, cam.yaw, 0, 'YXZ')),
      new THREE.Vector3(1, 1, 1),
    );
    const add = (key, geometry, local, options = {}) =>
      builder.add(key, geometry, base.clone().multiply(local), {
        cast: options.cast ?? false,
        receive: options.receive ?? true,
      });

    // 黑色塑料机身，镜头朝向局部 -Z。
    add('cord', roundedBoxGeometry(0.15, 0.115, 0.21, 0.014, 3), trs(0, 0, 0));
    add('cord', boxGeometry(0.17, 0.018, 0.235), trs(0, 0.07, -0.015));
    // 镜头筒、黄铜压圈与镜片。
    add('cord', cylinderGeometry(0.037, 0.043, 0.055, 16), trs(0, 0, -0.11, 0, 1, 1, 1, Math.PI / 2, 0));
    add('brass', torusGeometry(0.04, 0.0045, 6, 20), trs(0, 0, -0.138));
    add('cord', cylinderGeometry(0.026, 0.026, 0.012, 16), trs(0, 0, -0.14, 0, 1, 1, 1, Math.PI / 2, 0));
    // 录像红灯。
    add('ledRed', sphereGeometry(0.0085, 8, 6), trs(0.047, -0.036, -0.108), { cast: false, receive: false });

    // 世界坐标的吸顶盘 + 竖杆 + 黄铜万向节，让摄像机确实挂在天花板上。
    const rodBottom = cam.y + 0.075;
    const rodLength = ceilingY - 0.02 - rodBottom;
    builder.add('brassDark', boxGeometry(0.15, 0.018, 0.15), trs(cam.x, ceilingY - 0.01, cam.z), { cast: false });
    builder.add('cord', cylinderGeometry(0.017, 0.017, rodLength, 8), trs(cam.x, rodBottom + rodLength / 2, cam.z), {
      cast: false,
    });
    builder.add('brass', sphereGeometry(0.032, 10, 8), trs(cam.x, rodBottom, cam.z), { cast: false });
  }
}

/* --- 门：砖洞 + 胡桃木门套 + 四块板的实木门扇 --------------------- */

function buildDoor(materials) {
  const group = new THREE.Group();
  group.name = 'readingroom-door';
  const builder = new StaticBuilder();
  const { centerX, leafWidth, leafHeight, leafThickness, leafZ, width, height } = DOOR;
  const half = leafWidth / 2;
  const halfT = leafThickness / 2;

  // 门套：胡桃木贴脸 + 门头线。
  addBox(builder, 'trimWood', 0.066, height + 0.06, 0.12, centerX - half - 0.033, (height + 0.06) / 2, HALF_D - 0.055, 0, {
    cast: false,
  });
  addBox(builder, 'trimWood', 0.066, height + 0.06, 0.12, centerX + half + 0.033, (height + 0.06) / 2, HALF_D - 0.055, 0, {
    cast: false,
  });
  addBox(builder, 'trimWood', width + 0.132, 0.066, 0.12, centerX, height + 0.033, HALF_D - 0.055, 0, { cast: false });

  // 门扇：实木骨架 + 两块凹板。
  const y0 = 0.008;
  const y1 = y0 + leafHeight;
  const stile = 0.105;
  const lowerPanel = { center: 0.278, height: 0.34 };
  const upperPanel = { center: 1.158, height: 1.1 };
  addBox(builder, 'doorOak', leafWidth, leafHeight, leafThickness, centerX, (y0 + y1) / 2, leafZ);
  // 凹板：比门扇表面略退，四周压条略凸。
  for (const panel of [upperPanel, lowerPanel]) {
    addBox(builder, 'doorInset', leafWidth - stile * 2, panel.height, 0.012, centerX, panel.center, leafZ - halfT - 0.004, 0, {
      cast: false,
    });
    for (const side of [-1, 1]) {
      addBox(builder, 'trimWood', leafWidth - stile * 2, 0.016, 0.02, centerX, panel.center + side * (panel.height / 2 + 0.008), leafZ - halfT - 0.01, 0, {
        cast: false,
      });
    }
  }
  // 门芯板两侧竖向压条。
  for (const side of [-1, 1]) {
    addBox(builder, 'trimWood', 0.018, leafHeight - 0.16, 0.012, centerX + side * (half - stile / 2), (y0 + y1) / 2, leafZ - halfT - 0.006, 0, {
      cast: false,
    });
  }
  // 腰档铜条。
  addBox(builder, 'brassDark', leafWidth - 0.04, 0.012, 0.012, centerX, 0.528, leafZ - halfT - 0.01, 0, { cast: false });

  // 合页（西侧）与锁。
  for (const hy of [0.28, 1.08, 1.9]) {
    addCylinder(builder, 'brassDark', 0.016, 0.016, 0.09, 10, trs(centerX - half + 0.004, hy, leafZ - halfT - 0.008, 0, 1, 1, 1, Math.PI / 2, 0), {
      cast: false,
    });
  }
  const handleX = centerX + half - 0.085;
  addCylinder(builder, 'brass', 0.028, 0.028, 0.018, 14, trs(handleX, 1.02, leafZ - halfT - 0.018, 0, 1, 1, 1, Math.PI / 2, 0), {
    cast: false,
  });
  addBox(builder, 'brass', 0.15, 0.026, 0.026, handleX - 0.05, 1.02, leafZ - halfT - 0.04, 0, { cast: false });
  addCylinder(builder, 'brass', 0.018, 0.018, 0.014, 12, trs(handleX - 0.02, 0.95, leafZ - halfT - 0.018, 0, 1, 1, 1, Math.PI / 2, 0), {
    cast: false,
  });
  // 空白黄铜门牌（不刻字）与踢脚铜板。
  addBox(builder, 'brassDark', 0.24, 0.075, 0.008, centerX - 0.18, 1.52, leafZ - halfT - 0.006, 0, { cast: false });
  addBox(builder, 'brassDark', 0.86, 0.15, 0.006, centerX, 0.105, leafZ - halfT - 0.006, 0, { cast: false });
  addBox(builder, 'brassDark', 0.07, 0.17, 0.006, handleX - 0.02, 1.03, leafZ - halfT - 0.006, 0, { cast: false });

  builder.flush(group, materials, 'readingroom-door');
  return group;
}

/* --- 三盏复古工业吊灯 ---------------------------------------------- */

function buildPendants(builder, materials, root) {
  const pendants = [];
  for (const z of PENDANT.zs) {
    // 灯罩、吊线、吸顶盘都是静态件，直接进主批次。
    addCylinder(builder, 'trimWood', 0.095, 0.1, 0.024, 20, trs(0, ROOM.height - 0.012, z), { cast: false });
    addCylinder(builder, 'brassDark', 0.06, 0.07, 0.03, 18, trs(0, ROOM.height - 0.04, z), { cast: false });
    addCylinder(builder, 'cord', 0.006, 0.006, ROOM.height - 0.02 - 2.72, 8, trs(0, (ROOM.height - 0.02 + 2.72) / 2, z), {
      cast: false,
    });
    builder.add(
      'beamWood',
      pendantShadeGeometry(0.1, PENDANT.shadeRadius, PENDANT.shadeTop - PENDANT.shadeBottom, 30),
      trs(0, PENDANT.shadeBottom, z),
      { cast: true, receive: true },
    );
    builder.add(
      'shadeInner',
      pendantShadeGeometry(0.098, PENDANT.shadeRadius - 0.006, PENDANT.shadeTop - PENDANT.shadeBottom - 0.004, 28),
      trs(0, PENDANT.shadeBottom + 0.002, z),
      { cast: false, receive: false },
    );
    builder.add('brassDark', torusGeometry(PENDANT.shadeRadius, 0.007, 6, 32), trs(0, PENDANT.shadeBottom + 0.004, z, 0, 1, 1, 1, Math.PI / 2), {
      cast: false,
    });
    addCylinder(builder, 'brass', 0.038, 0.045, 0.06, 16, trs(0, 2.72, z), { cast: false });
    addCylinder(builder, 'brassDark', 0.05, 0.055, 0.02, 16, trs(0, 2.755, z), { cast: false });
    for (let i = 0; i < 3; i += 1) {
      const a = (i / 3) * Math.PI * 2;
      addBox(builder, 'brassDark', 0.008, 0.2, 0.008, Math.cos(a) * 0.13, 2.68, z + Math.sin(a) * 0.13, 0, { cast: false });
    }

    // 灯泡与罩口光晕是动态件。
    const group = new THREE.Group();
    group.name = `pendant-${z.toFixed(2)}`;
    group.position.set(PENDANT.x, 0, z);
    const bulb = new THREE.Mesh(sphereGeometry(0.048, 16, 12), materials.bulb);
    bulb.position.set(0, PENDANT.shadeBottom - 0.035, 0);
    bulb.name = 'pendant-bulb';
    bulb.castShadow = false;
    bulb.receiveShadow = false;
    group.add(bulb);

    const glowMaterial = materials.warmGlow.clone();
    glowMaterial.opacity = 0.1;
    const glow = new THREE.Mesh(planeGeometry(PENDANT.shadeRadius * 1.35, PENDANT.shadeRadius * 1.35), glowMaterial);
    glow.position.set(0, PENDANT.shadeBottom - 0.012, 0);
    glow.rotation.x = Math.PI / 2;
    glow.renderOrder = 3;
    glow.castShadow = false;
    glow.receiveShadow = false;
    group.add(glow);

    root.add(group);
    pendants.push({ group, bulb, glow, glowMaterial, z });
  }
  return pendants;
}

/* --- 角落 CRT 监控显示屏 ------------------------------------------- */

function buildMonitor(materials, textures) {
  const group = new THREE.Group();
  group.name = 'ceiling-cctv-monitor';
  group.position.set(CCTV.x, CCTV.y, CCTV.z);
  group.rotation.order = 'YXZ';
  group.rotation.y = CCTV.yaw;
  group.rotation.x = CCTV.pitch;

  const builder = new StaticBuilder();

  // 云台：天花板底盘 + 竖杆 + 横臂 + 万向节。
  addBox(builder, 'steelDark', 0.2, 0.02, 0.2, 0.3, ROOM.height - CCTV.y - 0.01, 0, 0, { cast: false });
  addCylinder(builder, 'steelDark', 0.022, 0.022, 0.62, 10, trs(0.3, ROOM.height - CCTV.y - 0.32, 0), { cast: false });
  addBox(builder, 'steelDark', 0.36, 0.032, 0.032, 0.14, ROOM.height - CCTV.y - 0.62, 0, 0, { cast: false });
  addCylinder(builder, 'steelDark', 0.04, 0.04, 0.06, 12, trs(-0.02, ROOM.height - CCTV.y - 0.64, 0, 0, 1, 1, 1, 0, Math.PI / 2), {
    cast: false,
  });

  // CRT 外壳：前宽后窄 + 后部鼓包。
  builder.add('crtBeige', roundedBoxGeometry(0.46, 0.4, 0.36, 0.03, 4), trs(0, 0, 0), { cast: false });
  builder.add('crtShade', roundedBoxGeometry(0.3, 0.26, 0.16, 0.03, 3), trs(0, -0.01, -0.24), { cast: false });

  // 面板边框。
  const bar = [
    { w: 0.46, h: 0.062, x: 0, y: 0.169, z: 0.19 },
    { w: 0.46, h: 0.078, x: 0, y: -0.161, z: 0.19 },
    { w: 0.072, h: 0.29, x: -0.194, y: 0, z: 0.19 },
    { w: 0.072, h: 0.29, x: 0.194, y: 0, z: 0.19 },
  ];
  for (const part of bar) {
    builder.add('crtBeige', roundedBoxGeometry(part.w, part.h, 0.05, 0.014, 3), trs(part.x, part.y, part.z), {
      cast: false,
    });
  }
  builder.add('crtBlack', roundedBoxGeometry(0.35, 0.28, 0.02, 0.014, 3), trs(0, 0, 0.2), { cast: false });

  // 顶部散热槽、侧面格栅、旋钮、电源灯。
  for (let i = 0; i < 5; i += 1) {
    addBox(builder, 'crtShade', 0.034, 0.006, 0.16, -0.14 + i * 0.06, 0.203, -0.01, 0, { cast: false });
  }
  for (let i = 0; i < 5; i += 1) {
    addBox(builder, 'crtShade', 0.006, 0.018, 0.14, 0.234, -0.06 + i * 0.032, -0.01, 0, { cast: false });
  }
  addBox(builder, 'crtShade', 0.2, 0.026, 0.01, 0, -0.152, 0.214, 0, { cast: false });
  addCylinder(builder, 'crtBlack', 0.016, 0.016, 0.01, 12, trs(-0.06, -0.152, 0.218, 0, 1, 1, 1, Math.PI / 2, 0), { cast: false });
  addCylinder(builder, 'crtBlack', 0.016, 0.016, 0.01, 12, trs(-0.015, -0.152, 0.218, 0, 1, 1, 1, Math.PI / 2, 0), { cast: false });
  addCylinder(builder, 'crtBlack', 0.01, 0.01, 0.008, 10, trs(0.115, -0.152, 0.218, 0, 1, 1, 1, Math.PI / 2, 0), { cast: false });

  builder.flush(group, materials, 'cctv-monitor-housing');

  // 屏幕：凸弧玻璃。
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(CCTV.screenWidth, CCTV.screenHeight, 20, 14),
    materials.cctvScreen,
  );
  const position = screen.geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i) / (CCTV.screenWidth / 2);
    const y = position.getY(i) / (CCTV.screenHeight / 2);
    position.setZ(i, Math.max(0, (1 - x * x) * (1 - y * y)) * 0.014);
  }
  position.needsUpdate = true;
  screen.geometry.computeVertexNormals();
  screen.position.set(0, 0, 0.214);
  screen.castShadow = false;
  screen.receiveShadow = false;
  screen.name = 'cctv-screen';
  group.add(screen);

  // 扫描带。
  const bandMaterial = new THREE.MeshBasicMaterial({
    map: textures.scanBand,
    color: 0xffffff,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    name: 'cctv-scan-band',
  });
  const band = new THREE.Mesh(planeGeometry(CCTV.screenWidth * 1.04, CCTV.screenHeight * 0.3), bandMaterial);
  band.position.set(0, 0, 0.23);
  band.renderOrder = 4;
  band.castShadow = false;
  band.receiveShadow = false;
  group.add(band);

  // 录像红灯。
  const ledMaterial = materials.ledRed.clone();
  const led = new THREE.Mesh(sphereGeometry(0.007, 8, 6), ledMaterial);
  led.position.set(0.09, -0.152, 0.222);
  led.castShadow = false;
  led.receiveShadow = false;
  group.add(led);

  group.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = false;
  });
  return { group, screen, band, bandMaterial, led, ledMaterial };
}

/* --- 吊灯开关 ------------------------------------------------------ */

function buildSwitch(materials) {
  const group = new THREE.Group();
  group.name = 'readingroom-light-switch';
  group.position.set(SWITCH.x, SWITCH.y, HALF_D - 0.004);
  const builder = new StaticBuilder();
  // 木底板贴着砖墙，搪瓷面板在它前方，拨片再往前——从室内看不会被底板挡住。
  addBox(builder, 'trimWood', 0.102, 0.142, 0.008, 0, 0, 0.004, 0, { cast: false });
  addBox(builder, 'switchPlate', 0.09, 0.13, 0.012, 0, 0, -0.006, 0, { cast: false });
  builder.flush(group, materials, 'switch-plate');

  const toggle = new THREE.Mesh(roundedBoxGeometry(0.026, 0.05, 0.026, 0.008, 2), materials.switchNub);
  toggle.position.set(0, 0, -0.016);
  toggle.rotation.x = -0.34;
  toggle.castShadow = false;
  toggle.receiveShadow = true;
  toggle.name = 'switch-toggle';
  group.add(toggle);
  return { group, toggle };
}

/* --- 墙面装裱地图 / 风景 3D 浅浮雕 -------------------------------- */

function addRelief(builder, key, geometry, matrix, local) {
  builder.add(key, geometry, matrix.clone().multiply(local), { cast: false, receive: true });
}

function buildMapRelief(builder, matrix, innerW, innerH) {
  const z = 0.014;
  const ink = (x, y, w, h, zz = z, rotate = 0) =>
    addRelief(builder, 'mapInk', boxGeometry(w, h, 0.0018), matrix, trs(x, y, zz, rotate));

  // 图框内的一道细墨线。
  ink(0, innerH * 0.42, innerW * 0.86, 0.0022, z + 0.002);
  ink(0, -innerH * 0.42, innerW * 0.86, 0.0022, z + 0.002);
  ink(innerW * 0.43, 0, 0.0022, innerH * 0.84, z + 0.002);
  ink(-innerW * 0.43, 0, 0.0022, innerH * 0.84, z + 0.002);

  // 经纬网在陆地下面，只在空白海面上露出来。
  for (let i = 1; i <= 3; i += 1) {
    ink(-innerW * 0.42 + (innerW * 0.84 * i) / 4, 0, 0.0018, innerH * 0.8, z);
  }
  for (let i = 1; i <= 2; i += 1) {
    ink(0, -innerH * 0.4 + (innerH * 0.8 * i) / 3, innerW * 0.84, 0.0018, z);
  }

  // 三组大陆：每组由几块重叠的扁椭球组成，边缘不规则。
  const continents = [
    {
      color: 'mapLand',
      pieces: [
        [-0.31, 0.13, 0.16, 0.11],
        [-0.26, -0.02, 0.12, 0.09],
        [-0.36, -0.1, 0.08, 0.07],
        [-0.2, 0.2, 0.07, 0.05],
      ],
    },
    {
      color: 'mapLandDark',
      pieces: [
        [0.16, 0.08, 0.15, 0.1],
        [0.24, -0.04, 0.1, 0.09],
        [0.09, -0.12, 0.08, 0.06],
        [0.3, 0.15, 0.07, 0.05],
      ],
    },
    {
      color: 'mapOchre',
      pieces: [
        [0.02, 0.28, 0.05, 0.035],
        [-0.04, 0.23, 0.045, 0.03],
        [0.08, 0.24, 0.035, 0.025],
      ],
    },
  ];
  for (const continent of continents) {
    for (const [x, y, sx, sy] of continent.pieces) {
      // 海岸线：略大的墨色底片。
      addRelief(
        builder,
        'mapInk',
        sphereGeometry(1, 14, 10),
        matrix,
        trs(x * innerW, y * innerH, z + 0.003, 0, sx * innerW * 1.12, sy * innerH * 1.16, 0.006),
      );
      addRelief(
        builder,
        continent.color,
        sphereGeometry(1, 18, 12),
        matrix,
        trs(x * innerW, y * innerH, z + 0.005, 0, sx * innerW, sy * innerH, 0.008),
      );
    }
  }

  // 一串小岛。
  for (let i = 0; i < 7; i += 1) {
    const x = innerW * (-0.38 + i * 0.11);
    const y = -innerH * (0.24 + (i % 3) * 0.045);
    addRelief(
      builder,
      i % 2 ? 'mapOchre' : 'mapLandDark',
      sphereGeometry(1, 10, 8),
      matrix,
      trs(x, y, z + 0.005, 0, innerW * 0.022, innerH * 0.018, 0.005),
    );
  }

  // 罗盘：8 芒星 + 黄铜圈。
  const compassX = innerW * 0.34;
  const compassY = -innerH * 0.3;
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    const length = i % 2 === 0 ? 0.085 : 0.05;
    addRelief(
      builder,
      i % 2 === 0 ? 'brassDark' : 'mapInk',
      boxGeometry(0.0032, innerH * length, 0.0018),
      matrix,
      trs(compassX, compassY, z + 0.007, angle),
    );
  }
  addRelief(
    builder,
    'brassDark',
    torusGeometry(Math.min(innerW, innerH) * 0.048, 0.002, 5, 20),
    matrix,
    trs(compassX, compassY, z + 0.005, 0, 1, 1, 1, 0, 0),
  );

  // 角部图签：一块小 parchment + 两条墨线（没有文字）。
  addRelief(builder, 'parchment', boxGeometry(innerW * 0.24, innerH * 0.16, 0.003), matrix, trs(-innerW * 0.33, -innerH * 0.33, z + 0.004));
  ink(-innerW * 0.33, -innerH * 0.3, innerW * 0.16, 0.0016, z + 0.006);
  ink(-innerW * 0.33, -innerH * 0.35, innerW * 0.09, 0.0016, z + 0.006);
}

function buildLandscapeRelief(builder, matrix, innerW, innerH) {
  const z = 0.016;
  addRelief(builder, 'landscapeSky', boxGeometry(innerW * 0.94, innerH * 0.88, 0.004), matrix, trs(0, 0, z - 0.006));
  // 太阳。
  addRelief(
    builder,
    'landscapeSun',
    cylinderGeometry(innerH * 0.075, innerH * 0.075, 0.004, 20),
    matrix,
    trs(innerW * 0.24, innerH * 0.25, z + 0.001, 0, 1, 1, 1, Math.PI / 2, 0),
  );
  // 远处一排山脊：多个小锥体，而不是一大块圆包。
  for (let i = 0; i < 8; i += 1) {
    const x = -0.42 + i * 0.12;
    const h = innerH * (0.09 + (i % 3) * 0.035);
    addRelief(
      builder,
      'landscapeFar',
      cylinderGeometry(0, innerH * 0.13, h, 5),
      matrix,
      trs(x * innerW, -innerH * 0.16 + h / 2, z + 0.002),
    );
  }
  // 中景丘陵。
  for (const [x, y, sx, sy, color] of [
    [-0.3, -0.2, 0.2, 0.09, 'landscapeHill'],
    [-0.06, -0.24, 0.24, 0.1, 'mapLand'],
    [0.24, -0.21, 0.18, 0.085, 'landscapeHill'],
    [0.38, -0.26, 0.14, 0.07, 'mapLandDark'],
  ]) {
    addRelief(
      builder,
      color,
      sphereGeometry(1, 16, 10),
      matrix,
      trs(x * innerW, y * innerH, z + 0.004, 0, sx * innerW, sy * innerH, 0.01),
    );
  }
  // 近处的树。
  for (const [x, y, s] of [
    [-0.36, -0.3, 0.045],
    [-0.28, -0.33, 0.038],
    [0.28, -0.32, 0.042],
    [0.35, -0.35, 0.034],
    [0.05, -0.36, 0.03],
  ]) {
    addRelief(
      builder,
      'landscapeTree',
      cylinderGeometry(0, innerH * s, innerH * s * 3.4, 7),
      matrix,
      trs(x * innerW, y * innerH, z + 0.007),
    );
    addRelief(builder, 'mapInk', boxGeometry(0.0025, innerH * s * 1.2, 0.0025), matrix, trs(x * innerW, y * innerH - innerH * s * 0.8, z + 0.007));
  }
  // 山脚的河。
  addRelief(builder, 'mapOchre', boxGeometry(innerW * 0.62, innerH * 0.018, 0.003), matrix, trs(innerW * 0.02, -innerH * 0.4, z + 0.008, 0.035));
  addRelief(builder, 'mapOchre', boxGeometry(innerW * 0.24, innerH * 0.015, 0.003), matrix, trs(-innerW * 0.32, -innerH * 0.37, z + 0.007, -0.12));
}

function buildFrames(builder) {
  for (const frame of FRAMES) {
    const placed = frameMatrix(frame);
    const matrix = trs(placed.x, placed.y, placed.z, placed.ry);
    const bar = 0.058;
    const depth = 0.05;
    const w = frame.w;
    const h = frame.h;

    // 外框：四根胡桃木条 + 内圈黄铜细线。
    for (const part of [
      { w, h: bar, x: 0, y: h / 2 - bar / 2 },
      { w, h: bar, x: 0, y: -h / 2 + bar / 2 },
      { w: bar, h: h - bar * 2, x: -w / 2 + bar / 2, y: 0 },
      { w: bar, h: h - bar * 2, x: w / 2 - bar / 2, y: 0 },
    ]) {
      addRelief(builder, 'frameWood', boxGeometry(part.w, part.h, depth), matrix, trs(part.x, part.y, depth / 2));
    }
    for (const side of [-1, 1]) {
      addRelief(builder, 'brassDark', boxGeometry(w - bar * 2, 0.006, 0.008), matrix, trs(0, side * (h / 2 - bar), depth - 0.002));
      addRelief(builder, 'brassDark', boxGeometry(0.006, h - bar * 2, 0.008), matrix, trs(side * (w / 2 - bar), 0, depth - 0.002));
    }

    const innerW = w - bar * 2 - 0.04;
    const innerH = h - bar * 2 - 0.04;
    // 阴影缝、卡纸、纸面。
    addRelief(builder, 'mapInk', planeGeometry(innerW + 0.016, innerH + 0.016), matrix, trs(0, 0, 0.011));
    addRelief(builder, 'matBoard', planeGeometry(innerW, innerH), matrix, trs(0, 0, 0.013));
    addRelief(builder, 'parchment', planeGeometry(innerW - 0.07, innerH - 0.07), matrix, trs(0, 0, 0.015));

    const reliefMatrix = matrix.clone().multiply(trs(0, 0, 0.014));
    if (frame.theme === 'map') buildMapRelief(builder, reliefMatrix, innerW - 0.09, innerH - 0.09);
    else buildLandscapeRelief(builder, reliefMatrix, innerW - 0.09, innerH - 0.09);
  }
}

/* --- 组装 ---------------------------------------------------------- */

export function buildRoom(builder, materials, root, textures) {
  buildFloor(builder);
  buildWalls(builder);
  buildSkirting(builder);
  buildCeiling(builder);
  buildWindows(builder);
  buildWindowBoards(builder);
  buildCameras(builder);
  buildFrames(builder);

  const doorGroup = buildDoor(materials);
  root.add(doorGroup);

  const pendants = buildPendants(builder, materials, root);
  for (const pendant of pendants) root.add(pendant.group);

  const monitor = buildMonitor(materials, textures);
  root.add(monitor.group);

  const switchParts = buildSwitch(materials);
  root.add(switchParts.group);

  return {
    doorGroup,
    pendants,
    monitor,
    switchGroup: switchParts.group,
    switchToggle: switchParts.toggle,
  };
}



