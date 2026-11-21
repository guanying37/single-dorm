import * as THREE from 'three';
import {
  StaticBuilder,
  boxGeometry,
  uvScaledPlane,
  planeGeometry,
  cylinderGeometry,
  sphereGeometry,
  trs,
  mergeGeometries,
} from '../../shared/utils.js';
import {
  SHELL,
  X,
  Z,
  ROOM,
  BOYS,
  GIRLS,
  DORM_DOORS,
  SUITES,
  LIFT,
  STAIR,
  STORAGE,
  GATE,
  LOUNGE_PORTALS,
  CORRIDOR,
  FIXTURES,
} from './config.js';
import { addFace, addWall, addBands, addCasing, addFloor, addCeiling, H, IT, T } from './build.js';
import { buildCore, coreColliders } from './core.js';

/* ------------------------------------------------------------------ *
 * 住宿区 2F 的走廊壳、宿舍门、休息室入口、灯具、光池与拾取体。
 * 湿区在 suites.js，楼梯/电梯/铁栅栏/N 杂物间在 core.js。
 * ------------------------------------------------------------------ */

const MARBLE_TILE = 1.2;
const WALL_TILE = 1.4;

function corridorFloors(builder) {
  addFloor(builder, 'marble', X.west, X.east, Z.corridorNorth, Z.corridorSouth, 0.001, MARBLE_TILE);
  addFloor(builder, 'marble', X.west, X.east, Z.southCorridor, Z.girlsNorth, 0.001, MARBLE_TILE);
  addFloor(builder, 'marble', X.eastCorridorWest, X.eastCorridorEast, Z.corridorSouth, Z.southCorridor, 0.001, MARBLE_TILE);
  // 楼梯厅（南走廊东端）已由南走廊地面覆盖；补一条门槛。
  builder.addBox('marbleTrim', 1.5, 0.012, IT + 0.04, STAIR.doorX, 0.006, STAIR.z0);
  for (const door of [SUITES.male.shower, SUITES.male.wc, SUITES.female.shower, SUITES.female.wc]) {
    builder.addBox('marbleTrim', 1.08, 0.012, IT + 0.04, door.doorX, 0.006, door.doorZ + (door.side === 'north' ? 0.02 : -0.02));
  }
  for (const portal of LOUNGE_PORTALS) {
    builder.addBox('marbleTrim', portal.width + 0.1, 0.012, 0.22, portal.x, 0.006, portal.z + (portal.wall === 'north' ? -0.02 : 0.02));
  }
  for (const door of DORM_DOORS) {
    builder.addBox('marbleTrim', door.width + 0.04, 0.012, 0.14, door.x, 0.006, door.z + (door.wall === 'boys' ? -0.02 : 0.02));
  }
}

function corridorCeilings(builder) {
  addCeiling(builder, 'ceiling', X.west, X.east, Z.corridorNorth, Z.corridorSouth, H, 2.4);
  addCeiling(builder, 'ceiling', X.west, X.east, Z.southCorridor, Z.girlsNorth, H, 2.4);
  addCeiling(builder, 'ceiling', X.eastCorridorWest, X.eastCorridorEast, Z.corridorSouth, Z.southCorridor, H, 2.4);
}

/* --- 预留房间门（只做门，不做门后空间） ---------------------------- */

function buildFacilityDoor(builder, { x, z, normal }) {
  // 门叶贴走廊面；门后只放一块黑背板，不建淋浴/厕所内部。
  const faceZ = z + normal * 0.03;
  const width = 1.0;
  const height = 2.2;
  builder.addBox('doorSuite', width - 0.03, height - 0.02, 0.05, x, height / 2, faceZ);
  builder.addBox('doorSuite', width - 0.2, 0.62, 0.012, x, 0.55, faceZ + normal * 0.035);
  builder.addBox('doorSuite', width - 0.2, 0.54, 0.012, x, 1.42, faceZ + normal * 0.035);
  builder.addBox('metalDark', width - 0.26, 0.34, 0.018, x, 1.78, faceZ + normal * 0.04);
  builder.addBox('glass', width - 0.34, 0.24, 0.01, x, 1.78, faceZ + normal * 0.048, 0, { cast: false });
  builder.addBox('black', width - 0.3, 0.2, 0.012, x, 1.78, faceZ + normal * 0.02);
  for (const side of [-1, 1]) {
    builder.addBox('metalDark', 0.035, 0.34, 0.02, x + side * (width / 2 - 0.14), 1.78, faceZ + normal * 0.045);
  }
  builder.add('chrome', cylinderGeometry(0.026, 0.026, 0.05, 10), trs(x + 0.32, 1.03, faceZ + normal * 0.05, 0, 1, 1, 1, Math.PI / 2, 0));
  builder.add('chrome', boxGeometry(0.13, 0.026, 0.035), trs(x + 0.26, 1.03, faceZ + normal * 0.075));
  builder.addBox('brassDark', 0.3, 0.09, 0.014, x, 1.94, faceZ + normal * 0.03);
  builder.addBox('metalDark', width - 0.06, 0.2, 0.02, x, 0.14, faceZ + normal * 0.035);
  builder.addBox('black', width + 0.08, height + 0.08, 0.03, x, height / 2, z - normal * 0.09);
  builder.addBox('underGlow', width - 0.16, 0.008, 0.02, x, 0.008, z + normal * 0.06);
}

function buildFacilityDoors(builder) {
  for (const door of [SUITES.male.shower, SUITES.male.wc]) {
    buildFacilityDoor(builder, { x: door.doorX, z: door.doorZ, normal: -1 });
  }
  for (const door of [SUITES.female.shower, SUITES.female.wc]) {
    buildFacilityDoor(builder, { x: door.doorX, z: door.doorZ, normal: 1 });
  }
}

/* --- 走廊墙体 ------------------------------------------------------ */

function buildNorthCorridorWalls(builder) {
  const boyOpenings = BOYS.map((room) => ({ from: room.doorX - 0.45, to: room.doorX + 0.45, height: 2.1 }));
  const allNorthOpenings = [
    ...boyOpenings,
    { from: STORAGE.doorX - 0.5, to: STORAGE.doorX + 0.5, height: 2.2 },
  ];

  // 北走廊北墙：男生宿舍（10 扇）+ 东段实墙 + N 杂物间门。
  addWall(builder, {
    key: 'wallpaper',
    axis: 'x',
    at: Z.corridorNorth,
    from: X.west,
    to: X.east,
    rotY: 0,
    openings: allNorthOpenings,
    tile: WALL_TILE,
  });
  addBands(builder, {
    axis: 'x',
    at: Z.corridorNorth,
    from: X.west,
    to: X.east,
    normal: 1,
    openings: allNorthOpenings,
  });

  // 北走廊南墙：男淋浴/男厕所两扇门（都朝北走廊） + 休息室门（视觉） + 东段实墙。
  const maleDoors = [
    { from: SUITES.male.shower.doorX - 0.5, to: SUITES.male.shower.doorX + 0.5, height: 2.2 },
    { from: SUITES.male.wc.doorX - 0.5, to: SUITES.male.wc.doorX + 0.5, height: 2.2 },
  ];
  addWall(builder, {
    key: 'wallpaper',
    axis: 'x',
    at: Z.corridorSouth,
    from: X.west,
    to: X.innerEast,
    rotY: Math.PI,
    openings: maleDoors,
    tile: WALL_TILE,
  });
  addWall(builder, {
    key: 'wallpaper',
    axis: 'x',
    at: Z.corridorSouth,
    from: X.eastCorridorEast,
    to: X.east,
    rotY: Math.PI,
    tile: WALL_TILE,
  });
  const lounge = LOUNGE_PORTALS[0];
  const loungeOpening = { from: lounge.x - lounge.width / 2, to: lounge.x + lounge.width / 2, height: lounge.height };
  addBands(builder, {
    axis: 'x',
    at: Z.corridorSouth,
    from: X.west,
    to: X.innerEast,
    normal: -1,
    openings: [...maleDoors, loungeOpening],
  });
  addBands(builder, {
    axis: 'x',
    at: Z.corridorSouth,
    from: X.eastCorridorEast,
    to: X.east,
    normal: -1,
  });

  for (const door of maleDoors) {
    addCasing(builder, {
      axis: 'x',
      at: Z.corridorSouth,
      center: (door.from + door.to) / 2,
      width: 1.0,
      height: 2.2,
      normal: -1,
      casingKey: 'doorSuite',
      thickness: 0.06,
      proud: 0.025,
    });
  }
  buildFacilityDoors(builder);
  addCasing(builder, {
    axis: 'x',
    at: Z.corridorNorth,
    center: STORAGE.doorX,
    width: 1.0,
    height: 2.2,
    normal: 1,
    casingKey: 'metalDark',
    thickness: 0.07,
    proud: 0.03,
  });

  // 西端 / 东端封墙。
  addWall(builder, { key: 'wallpaper', axis: 'z', at: X.west, from: Z.corridorNorth, to: Z.corridorSouth, rotY: Math.PI / 2, tile: WALL_TILE });
  addBands(builder, { axis: 'z', at: X.west, from: Z.corridorNorth, to: Z.corridorSouth, normal: 1 });
  addWall(builder, { key: 'wallpaper', axis: 'z', at: X.east, from: Z.corridorNorth, to: Z.corridorSouth, rotY: -Math.PI / 2, tile: WALL_TILE });
  addBands(builder, { axis: 'z', at: X.east, from: Z.corridorNorth, to: Z.corridorSouth, normal: -1 });
}

function buildSouthCorridorWalls(builder) {
  const girlOpenings = GIRLS.map((room) => ({ from: room.doorX - 0.45, to: room.doorX + 0.45, height: 2.1 }));
  const stairOpening = { from: STAIR.doorX - STAIR.doorWidth / 2, to: STAIR.doorX + STAIR.doorWidth / 2, height: STAIR.doorHeight };
  const allSouthOpenings = [...girlOpenings, stairOpening];

  // 南走廊南墙：女生宿舍（8 扇）+ 东段实墙 + 右下楼梯间门。
  addWall(builder, {
    key: 'wallpaper',
    axis: 'x',
    at: Z.girlsNorth,
    from: X.west,
    to: X.east,
    rotY: Math.PI,
    openings: allSouthOpenings,
    tile: WALL_TILE,
  });
  addBands(builder, {
    axis: 'x',
    at: Z.girlsNorth,
    from: X.west,
    to: X.east,
    normal: -1,
    openings: allSouthOpenings,
  });
  addCasing(builder, {
    axis: 'x',
    at: Z.girlsNorth,
    center: STAIR.doorX,
    width: STAIR.doorWidth,
    height: STAIR.doorHeight,
    normal: -1,
    casingKey: 'metalDark',
    thickness: 0.08,
    proud: 0.035,
  });

  // 南走廊北墙：女淋浴/女厕所两扇门（都朝南走廊） + 休息室门（视觉） + 东端实墙；49.44–51.9 与东走廊相接。
  const femaleDoors = [
    { from: SUITES.female.shower.doorX - 0.5, to: SUITES.female.shower.doorX + 0.5, height: 2.2 },
    { from: SUITES.female.wc.doorX - 0.5, to: SUITES.female.wc.doorX + 0.5, height: 2.2 },
  ];
  addWall(builder, {
    key: 'wallpaper',
    axis: 'x',
    at: Z.innerSouth,
    from: X.west,
    to: X.innerEast,
    rotY: 0,
    openings: femaleDoors,
    tile: WALL_TILE,
  });
  addWall(builder, {
    key: 'wallpaper',
    axis: 'x',
    at: Z.innerSouth,
    from: X.eastCorridorEast,
    to: X.east,
    rotY: 0,
    tile: WALL_TILE,
  });
  addBands(builder, {
    axis: 'x',
    at: Z.innerSouth,
    from: X.west,
    to: X.innerEast,
    normal: 1,
    openings: [...femaleDoors],
  });
  addBands(builder, {
    axis: 'x',
    at: Z.innerSouth,
    from: X.eastCorridorEast,
    to: X.east,
    normal: 1,
  });
  for (const door of femaleDoors) {
    addCasing(builder, {
      axis: 'x',
      at: Z.innerSouth,
      center: (door.from + door.to) / 2,
      width: 1.0,
      height: 2.2,
      normal: 1,
      casingKey: 'doorSuite',
      thickness: 0.06,
      proud: 0.025,
    });
  }

  // 西端 / 东端封墙。
  addWall(builder, { key: 'wallpaper', axis: 'z', at: X.west, from: Z.southCorridor, to: Z.girlsNorth, rotY: Math.PI / 2, tile: WALL_TILE });
  addBands(builder, { axis: 'z', at: X.west, from: Z.southCorridor, to: Z.girlsNorth, normal: 1 });
  addWall(builder, { key: 'wallpaper', axis: 'z', at: X.east, from: Z.southCorridor, to: Z.girlsNorth, rotY: -Math.PI / 2, tile: WALL_TILE });
  addBands(builder, { axis: 'z', at: X.east, from: Z.southCorridor, to: Z.girlsNorth, normal: -1 });
}

function buildEastCorridorWalls(builder) {
  // 西墙：整面实墙（M 大厅/核心筒），放铁栅栏读卡器。
  addWall(builder, {
    key: 'wallpaper',
    axis: 'z',
    at: X.innerEast,
    from: Z.corridorSouth,
    to: Z.southCorridor,
    rotY: Math.PI / 2,
    tile: WALL_TILE,
  });
  addBands(builder, { axis: 'z', at: X.innerEast, from: Z.corridorSouth, to: Z.southCorridor, normal: 1 });

  // 东墙：8.3–22.1，电梯门洞；22.1–24.5 与南走廊/楼梯厅相接，不设墙。
  const liftOpening = {
    from: LIFT.doorZ - LIFT.frameWidth / 2,
    to: LIFT.doorZ + LIFT.frameWidth / 2,
    height: LIFT.frameHeight,
  };
  addWall(builder, {
    key: 'wallpaper',
    axis: 'z',
    at: X.eastCorridorEast,
    from: Z.corridorSouth,
    to: Z.innerSouth,
    rotY: -Math.PI / 2,
    openings: [liftOpening],
    tile: WALL_TILE,
  });
  addBands(builder, {
    axis: 'z',
    at: X.eastCorridorEast,
    from: Z.corridorSouth,
    to: Z.innerSouth,
    normal: -1,
    openings: [liftOpening],
  });
  addCasing(builder, {
    axis: 'z',
    at: X.eastCorridorEast,
    center: LIFT.doorZ,
    width: LIFT.frameWidth,
    height: LIFT.frameHeight,
    normal: -1,
    casingKey: 'metalDark',
    thickness: 0.08,
    proud: 0.035,
  });
}

/* --- 宿舍门 -------------------------------------------------------- */

function buildDormDoor(builder, door) {
  const isBoys = door.wall === 'boys';
  const normal = isBoys ? 1 : -1; // 朝走廊
  const wallZ = door.z;
  const faceZ = wallZ + normal * 0.057;
  const leafZ = wallZ + normal * 0.03;
  const width = door.width;
  const height = door.height;

  builder.addBox('wood', width - 0.02, height - 0.02, 0.05, door.x, height / 2, leafZ);
  for (const panel of [
    { y: 0.92, h: 0.66 },
    { y: 1.68, h: 0.48 },
  ]) {
    builder.addBox('woodDark', width - 0.16, panel.h, 0.012, door.x, panel.y, faceZ + normal * 0.006);
    builder.addBox('wood', width - 0.24, panel.h - 0.05, 0.008, door.x, panel.y, faceZ + normal * 0.012);
  }
  for (const zz of [-width / 2 + 0.08, width / 2 - 0.08]) {
    builder.addBox('woodDark', 0.09, height - 0.22, 0.01, door.x + zz, height / 2, faceZ + normal * 0.008);
  }
  for (const yy of [0.18, height - 0.12]) {
    builder.addBox('woodDark', width - 0.14, 0.12, 0.01, door.x, yy, faceZ + normal * 0.008);
  }
  builder.add('brass', cylinderGeometry(0.028, 0.028, 0.05, 12), trs(door.x + 0.31, 1.03, faceZ + normal * 0.025, 0, 1, 1, 1, Math.PI / 2, 0));
  builder.add('brass', boxGeometry(0.13, 0.028, 0.036), trs(door.x + 0.25, 1.03, faceZ + normal * 0.05));
  builder.add('brassDark', boxGeometry(0.06, 0.09, 0.014), trs(door.x + 0.31, 1.55, faceZ + normal * 0.016));
  builder.add('black', cylinderGeometry(0.013, 0.013, 0.02, 8), trs(door.x + 0.31, 1.68, faceZ + normal * 0.014, 0, 1, 1, 1, Math.PI / 2, 0));
  for (const hy of [0.32, 1.05, 1.78]) {
    builder.add('metalDark', boxGeometry(0.03, 0.1, 0.014), trs(door.x - width / 2 + 0.03, hy, faceZ + normal * 0.004));
  }
  // 门洞背板（房间未建，关门后看不到；防止斜看穿帮）。
  builder.addBox('black', width, height, 0.02, door.x, height / 2, wallZ - normal * 0.07);

  addCasing(builder, {
    axis: 'x',
    at: wallZ,
    center: door.x,
    width,
    height,
    normal,
    casingKey: 'woodDark',
    thickness: 0.07,
    proud: 0.03,
  });
}

/* --- 休息室入口 ---------------------------------------------------- */

function buildLoungePortal(builder, portal) {
  const isNorth = portal.wall === 'north';
  const normal = isNorth ? -1 : 1; // 朝走廊
  const faceZ = portal.z + normal * 0.012;
  const leafW = portal.width / 2;
  const height = portal.height;

  for (const side of [-1, 1]) {
    const center = portal.x + side * leafW / 2;
    // 门框：下裙板、中横档、上横档、两侧竖梃。
    builder.addBox('wood', leafW, 1.05, 0.06, center, 0.525, faceZ);
    builder.addBox('wood', leafW, 0.15, 0.06, center, 1.125, faceZ);
    builder.addBox('wood', leafW, 0.15, 0.06, center, height - 0.075, faceZ);
    for (const zz of [-leafW / 2 + 0.075, leafW / 2 - 0.075]) {
      builder.addBox('wood', 0.15, 1.05, 0.06, center + zz, 1.725, faceZ);
    }
    builder.addBox('woodDark', leafW - 0.32, 0.68, 0.012, center, 0.55, faceZ + normal * 0.035);
    builder.addBox('wood', leafW - 0.42, 0.6, 0.008, center, 0.55, faceZ + normal * 0.042);
    builder.addBox('frostedWarm', leafW - 0.3, 1.04, 0.014, center, 1.74, faceZ + normal * 0.03, 0, { cast: false });
    for (const zz of [-leafW / 2 + 0.32, 0, leafW / 2 - 0.32]) {
      builder.addBox('woodDark', 0.032, 1.04, 0.02, center + zz, 1.74, faceZ + normal * 0.04);
    }
    builder.addBox('woodDark', leafW - 0.3, 0.032, 0.02, center, 1.74, faceZ + normal * 0.04);
    builder.addBox('woodDark', leafW - 0.3, 0.032, 0.02, center, 1.48, faceZ + normal * 0.04);
    builder.add('warmPanel', planeGeometry(leafW - 0.34, 0.96), trs(center, 1.74, faceZ + normal * 0.01, isNorth ? Math.PI : 0));
    builder.add('brass', cylinderGeometry(0.026, 0.026, 0.62, 10), trs(center + side * (leafW / 2 - 0.2), 1.1, faceZ + normal * 0.09));
    builder.add('brassDark', boxGeometry(0.06, 0.7, 0.02), trs(center + side * (leafW / 2 - 0.2), 1.1, faceZ + normal * 0.065));
    builder.add('brass', cylinderGeometry(0.021, 0.021, leafW - 0.34, 10), trs(center, 1.02, faceZ + normal * 0.07, 0, 1, 1, 1, 0, Math.PI / 2));
    builder.add('brassDark', boxGeometry(0.016, 0.09, 0.04), trs(center + side * (leafW / 2 - 0.11), 1.0, faceZ + normal * 0.045));
    builder.addBox('brassDark', leafW - 0.34, 0.16, 0.012, center, 0.18, faceZ + normal * 0.035);
  }
  builder.addBox('black', 0.012, height - 0.05, 0.012, portal.x, height / 2, faceZ - normal * 0.012);
  builder.addBox('brassDark', 0.5, 0.16, 0.05, portal.x, height + 0.12, faceZ + normal * 0.01);

  addCasing(builder, {
    axis: 'x',
    at: portal.z,
    center: portal.x,
    width: portal.width,
    height,
    normal,
    casingKey: 'wood',
    thickness: 0.12,
    proud: 0.045,
  });
}

/* --- 灯具 / 光池 --------------------------------------------------- */

function buildFixtures(builder) {
  for (const fixture of FIXTURES) {
    const alongZ = Math.abs(fixture.x - 50.7) < 0.6 && fixture.z > 10;
    const length = alongZ ? 2.0 : 2.2;
    const width = 0.22;
    builder.addBox('metalDark', alongZ ? width : length, 0.06, alongZ ? length : width, fixture.x, H - 0.05, fixture.z);
    builder.add(
      'fixtureGlow',
      uvScaledPlane(alongZ ? 0.12 : length - 0.12, alongZ ? length - 0.12 : 0.12, 1),
      trs(fixture.x, H - 0.085, fixture.z, 0, 1, 1, 1, Math.PI / 2),
      { cast: false },
    );
    for (const side of [-1, 1]) {
      builder.add('metalDark', cylinderGeometry(0.006, 0.006, 0.05, 5), trs(
        fixture.x + (alongZ ? 0 : side * (length / 2 - 0.1)),
        H - 0.085,
        fixture.z + (alongZ ? side * (length / 2 - 0.1) : 0),
      ));
    }
  }

  // 电梯厅小灯（门内空间不建）。
  builder.addBox('metalDark', 0.36, 0.04, 0.16, 50.7, H - 0.03, LIFT.doorZ);
  builder.add('fixtureWarm', planeGeometry(0.3, 0.1), trs(50.7, H - 0.055, LIFT.doorZ, 0, 1, 1, 1, Math.PI / 2), { cast: false });

  // 楼梯间顶灯。
  builder.addBox('metalDark', 0.3, 0.05, 0.3, STAIR.doorX, H - 0.04, STAIR.z0 + 1.7);
  builder.add('fixtureWarm', planeGeometry(0.22, 0.22), trs(STAIR.doorX, H - 0.07, STAIR.z0 + 1.7, 0, 1, 1, 1, Math.PI / 2), { cast: false });
}

function buildGlows(builder) {
  const floorGlow = (key, x, z, width, depth) => {
    builder.add(key, planeGeometry(width, depth), trs(x, 0.006, z, 0, 1, 1, 1, -Math.PI / 2), { cast: false, receive: false });
  };
  for (const fixture of FIXTURES) {
    if (fixture.kind === 'warm') floorGlow('warmGlow', fixture.x, fixture.z, 2.2, 3.0);
    else floorGlow('coolGlow', fixture.x, fixture.z, 2.4, 2.4);
  }
  for (const portal of LOUNGE_PORTALS) {
    floorGlow('warmGlow', portal.x, portal.z + (portal.wall === 'north' ? -0.55 : 0.55), 2.8, 1.6);
  }
  floorGlow('warmGlow', 53.0, 23.3, 2.4, 1.6);
  floorGlow('warmGlow', 50.7, LIFT.doorZ, 1.4, 1.4);
}

/* --- 代理 / 交互物 -------------------------------------------------- */

function addProxy(materials, hits, { id, x, y, z, hx, hy, hz, ry = 0 }) {
  const mesh = new THREE.Mesh(boxGeometry(hx * 2, hy * 2, hz * 2), materials.hit);
  mesh.position.set(x, y, z);
  mesh.rotation.y = ry;
  mesh.name = `hit:${id}`;
  mesh.userData.hitId = id;
  hits.add(mesh);
  return mesh;
}

export function buildRoom(builder, materials) {
  corridorFloors(builder);
  corridorCeilings(builder);
  buildNorthCorridorWalls(builder);
  buildSouthCorridorWalls(builder);
  buildEastCorridorWalls(builder);

  for (const door of DORM_DOORS) buildDormDoor(builder, door);
  for (const portal of LOUNGE_PORTALS) buildLoungePortal(builder, portal);

  buildFixtures(builder);
  buildGlows(builder);
  const core = buildCore(builder, materials);

  const hits = new THREE.Group();
  hits.name = 'residence-hits';
  const proxies = [];

  for (const door of DORM_DOORS) {
    const isBoys = door.wall === 'boys';
    proxies.push({
      id: door.id,
      label: door.label,
      locked: true,
      message: door.message,
      prompt: '暂未开放',
      mesh: addProxy(materials, hits, {
        id: door.id,
        x: door.x,
        y: 1.05,
        z: door.z + (isBoys ? 0.09 : -0.09),
        hx: door.width / 2,
        hy: 1.05,
        hz: 0.04,
      }),
    });
  }
  for (const door of [SUITES.male.shower, SUITES.male.wc, SUITES.female.shower, SUITES.female.wc]) {
    const isNorth = door.side === 'north';
    proxies.push({
      id: `door.${door.id}`,
      label: door.label,
      locked: true,
      message: `${door.label} · 预留空间，暂未开放`,
      prompt: '预留空间',
      mesh: addProxy(materials, hits, {
        id: `door.${door.id}`,
        x: door.doorX,
        y: 1.1,
        z: door.doorZ + (isNorth ? -0.09 : 0.09),
        hx: 0.5,
        hy: 1.1,
        hz: 0.05,
      }),
    });
  }
  proxies.push({
    id: STORAGE.id,
    label: STORAGE.label,
    locked: true,
    message: STORAGE.message,
    prompt: '需管理员钥匙',
    mesh: addProxy(materials, hits, {
      id: STORAGE.id,
      x: STORAGE.doorX,
      y: 1.1,
      z: STORAGE.z1 + 0.06,
      hx: STORAGE.width / 2,
      hy: 1.1,
      hz: 0.05,
    }),
  });
  proxies.push({
    id: 'elevator.call',
    label: '电梯呼叫面板',
    locked: true,
    message: '电梯 · 需管理员刷卡',
    prompt: '需刷卡',
    mesh: addProxy(materials, hits, {
      id: 'elevator.call',
      x: LIFT.callX - 0.04,
      y: LIFT.callY,
      z: LIFT.callZ,
      hx: 0.05,
      hy: 0.14,
      hz: 0.08,
    }),
  });
  for (const portal of LOUNGE_PORTALS) {
    proxies.push({
      id: portal.id,
      label: portal.label,
      locked: false,
      portal: true,
      sceneId: 'lounge',
      message: '进入休息室',
      mesh: addProxy(materials, hits, {
        id: portal.id,
        x: portal.x,
        y: portal.height / 2,
        z: portal.z + (portal.wall === 'north' ? -0.06 : 0.06),
        hx: portal.width / 2,
        hy: portal.height / 2,
        hz: 0.05,
      }),
    });
  }

  // 楼梯间铁链碰撞由 scene 处理；门与栅栏的动态碰撞也在 scene。
  return {
    hits,
    proxies,
    gate: core.gate,
    stairDoor: core.stairDoor,
    interactables: [],
  };
}

/* --- 碰撞 ---------------------------------------------------------- */

export function roomColliders() {
  const boxes = [];
  const box = (x, z, hx, hz, rot = 0) => boxes.push({ x, z, hx, hz, rot });

  // 北走廊北墙（宿舍门与 N 门全部关闭）。
  box((X.west + X.east) / 2, Z.corridorNorth + 0.06, (X.east - X.west) / 2, 0.06);
  // 北走廊南墙：男淋浴/男厕门全部关闭，整面实墙；49.44–51.9 是东走廊开口。
  box((X.west + X.innerEast) / 2, Z.corridorSouth - 0.06, (X.innerEast - X.west) / 2, 0.06);
  box((X.eastCorridorEast + X.east) / 2, Z.corridorSouth - 0.06, (X.east - X.eastCorridorEast) / 2, 0.06);

  // 南走廊北墙：女淋浴/女厕门关闭，整面实墙；49.44–51.9 是东走廊开口。
  box((X.west + X.innerEast) / 2, Z.innerSouth + 0.06, (X.innerEast - X.west) / 2, 0.06);
  box((X.eastCorridorEast + X.east) / 2, Z.innerSouth + 0.06, (X.east - X.eastCorridorEast) / 2, 0.06);

  // 南走廊南墙：女生门全部关闭；楼梯间门洞留 1.4 m 给动态防火门。
  const stairGap0 = STAIR.doorX - STAIR.doorWidth / 2;
  const stairGap1 = STAIR.doorX + STAIR.doorWidth / 2;
  box((X.west + stairGap0) / 2, Z.girlsNorth + 0.06, (stairGap0 - X.west) / 2, 0.06);
  box((stairGap1 + X.east) / 2, Z.girlsNorth + 0.06, (X.east - stairGap1) / 2, 0.06);

  // 东走廊西墙、东墙（电梯门关闭）。
  box(X.innerEast - 0.06, (Z.corridorSouth + Z.innerSouth) / 2, 0.06, (Z.innerSouth - Z.corridorSouth) / 2);
  box(X.eastCorridorEast + 0.06, (Z.corridorSouth + Z.innerSouth) / 2, 0.06, (Z.innerSouth - Z.corridorSouth) / 2);

  // 西/东端封墙。
  box(X.west - 0.06, (Z.corridorNorth + Z.corridorSouth) / 2, 0.06, (Z.corridorSouth - Z.corridorNorth) / 2);
  box(X.west - 0.06, (Z.southCorridor + Z.girlsNorth) / 2, 0.06, (Z.girlsNorth - Z.southCorridor) / 2);
  box(X.east + 0.06, (Z.corridorNorth + Z.corridorSouth) / 2, 0.06, (Z.corridorSouth - Z.corridorNorth) / 2);
  box(X.east + 0.06, (Z.southCorridor + Z.girlsNorth) / 2, 0.06, (Z.girlsNorth - Z.southCorridor) / 2);

  return [...boxes, ...coreColliders()];
}

export { buildCore, coreColliders };
export { addProxy };
