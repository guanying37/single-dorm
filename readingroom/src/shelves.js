import * as THREE from 'three';
import {
  boxGeometry,
  cylinderGeometry,
  planeGeometry,
  roundedBoxGeometry,
  trs,
  mulberry32,
  StaticBuilder,
} from './geometry.js';
import { HALF_W, SHELF, LADDER, CONTENT_COUNTS } from './config.js';

/* ------------------------------------------------------------------ *
 * 深棕实木书架（6 组 / 10 跨），书脊高低错落，以及收在两跨之间的
 * 木制人字梯。
 *
 * 书架所有板件与书都进入静态批次；书的颜色只有 9 个材质槽，靠宽度、
 * 高度、倾斜、平叠和少量烫金书脊条制造杂而不乱的效果。人字梯是独立
 * 的 Group（两级框架绕顶部铰链开合），不投影。
 * ------------------------------------------------------------------ */

const BOOK_KEYS = [
  'book1',
  'book2',
  'book3',
  'book4',
  'book5',
  'book6',
  'book7',
  'book8',
  'book9',
];

function addBox(builder, key, w, h, d, x, y, z, ry = 0, options = {}) {
  builder.add(key, boxGeometry(w, h, d), trs(x, y, z, ry), {
    cast: options.cast ?? true,
    receive: options.receive ?? true,
  });
}

/* 底边在 y=0 的书，方便让它贴着层板倾斜。 */
function standingBookGeometry(depth, height, width) {
  const geometry = boxGeometry(depth, height, width);
  geometry.translate(0, height / 2, 0);
  return geometry;
}

function addBookSpineBands(builder, book, side, rng) {
  const { centerX, boardTopY, z, depth, height, width } = book;
  // 书脊朝向房间：西侧书架 +X，东侧书架 -X。
  const spineX = centerX + side * (depth / 2) + side * 0.0015;
  const bands = height > 0.25 ? 2 : 1;
  for (let i = 0; i < bands; i += 1) {
    const bandY = boardTopY + height * (0.24 + i * 0.34);
    builder.add('goldFoil', boxGeometry(0.002, 0.012, width * 0.78), trs(spineX, bandY, z), {
      cast: false,
      receive: false,
    });
  }
  void rng;
}

function fillShelfBay(builder, side, bayZ0, bayZ1, boardTopY, rng, counts) {
  let cursor = bayZ0 + 0.025;
  const end = bayZ1 - 0.025;
  const bookCenter = (depth) => side * (HALF_W - 0.005 - depth / 2);

  while (cursor < end - 0.03) {
    const roll = rng();
    // 偶尔留一小段空档，让书架不要像贴图。
    if (roll < 0.05 && cursor > bayZ0 + 0.25) {
      cursor += 0.1 + rng() * 0.16;
      continue;
    }

    if (roll > 0.945 && end - cursor > 0.3) {
      // 平叠的一小摞书。
      const stackCount = 2 + Math.floor(rng() * 3);
      let y = boardTopY;
      let z = cursor + 0.12;
      for (let i = 0; i < stackCount; i += 1) {
        const thickness = 0.026 + rng() * 0.018;
        const depth = 0.17 + rng() * 0.05;
        const width = 0.2 + rng() * 0.06;
        builder.add(
          BOOK_KEYS[Math.floor(rng() * BOOK_KEYS.length)],
          boxGeometry(depth, thickness, width),
          trs(bookCenter(depth), y + thickness / 2, z, (rng() - 0.5) * 0.05),
          { cast: true, receive: true },
        );
        y += thickness + 0.001;
      }
      counts.books += stackCount;
      cursor = z + 0.14;
      // 书摞旁立一个黄铜书立。
      if (rng() > 0.5) {
        addBox(builder, 'brassDark', 0.02, 0.14, 0.11, side * (HALF_W - 0.05), boardTopY + 0.07, cursor - 0.06, 0, {
          cast: false,
        });
      }
      continue;
    }

    // 竖排的一小段书。
    const runLength = 0.24 + rng() * 0.5;
    const chunkEnd = Math.min(end, cursor + runLength);
    let z = cursor;
    while (z < chunkEnd) {
      const width = 0.024 + rng() * 0.028;
      if (z + width > end) break;
      const height = 0.2 + rng() * 0.115;
      const depth = 0.235 + rng() * 0.055;
      const key = BOOK_KEYS[Math.floor(rng() * BOOK_KEYS.length)];
      const centerX = bookCenter(depth);
      // 少量书向一侧微倾，仍然以底边为支点。
      const tilt = rng() < 0.05 ? (rng() < 0.5 ? -1 : 1) * (0.07 + rng() * 0.08) : 0;
      builder.add(key, standingBookGeometry(depth, height, width - 0.002), trs(centerX, boardTopY, z + width / 2, 0, 1, 1, 1, tilt, 0), {
        cast: true,
        receive: true,
      });
      counts.books += 1;
      // 倾斜的书不加书口，避免书口离开书顶。
      if (Math.abs(tilt) < 0.001) {
        builder.add(
          'bookPages',
          boxGeometry(depth * 0.88, 0.005, width * 0.84),
          trs(centerX - side * 0.004, boardTopY + height + 0.002, z + width / 2),
          { cast: false, receive: true },
        );
      }
      if (rng() < 0.12) {
        addBookSpineBands(builder, { centerX, boardTopY, z: z + width / 2, depth, height, width }, side, rng);
        counts.bookBands += 1;
      }
      z += width + 0.002 + rng() * 0.004;
      if (rng() < 0.02 && z > cursor + 0.16) break;
    }
    cursor = z + (rng() < 0.32 ? 0.03 + rng() * 0.08 : 0.004);
    if (rng() < 0.16) {
      addBox(builder, 'brassDark', 0.018, 0.12, 0.1, side * (HALF_W - 0.045), boardTopY + 0.06, cursor + 0.04, 0, {
        cast: false,
      });
      cursor += 0.09;
    }
  }
}

/* --- 一组书架 ------------------------------------------------------ */

function buildShelfRun(builder, run, rng, counts) {
  const side = run.side;
  const wallX = side * (HALF_W - 0.004);
  const frontX = side * (HALF_W - SHELF.depth);
  const midX = (wallX + frontX) / 2;
  const depth = Math.abs(frontX - wallX);
  const length = run.z1 - run.z0;
  const centerZ = (run.z0 + run.z1) / 2;
  const modules = Math.max(1, Math.round(length / SHELF.moduleWidth));
  const moduleWidth = length / modules;
  const bodyHeight = SHELF.height - SHELF.plinth;

  // 背板：一块整板，贴在墙前。
  builder.add(
    'shelfBack',
    planeGeometry(length, SHELF.height - 0.04),
    trs(wallX - side * 0.002, (SHELF.height - 0.04) / 2 + 0.03, centerZ, side > 0 ? -Math.PI / 2 : Math.PI / 2),
    { cast: false, receive: true },
  );

  // 底座与踢脚。
  addBox(builder, 'shelfWood', depth, SHELF.plinth, length, midX, SHELF.plinth / 2, centerZ, 0);
  addBox(builder, 'shelfWood', depth - 0.04, 0.05, length - 0.04, midX + side * 0.018, SHELF.plinth - 0.025, centerZ, 0, {
    cast: false,
  });

  // 两侧与中间立板。
  const dividers = [];
  for (let i = 0; i <= modules; i += 1) {
    dividers.push(run.z0 + i * moduleWidth);
  }
  for (const z of dividers) {
    const isEnd = Math.abs(z - run.z0) < 0.001 || Math.abs(z - run.z1) < 0.001;
    addBox(
      builder,
      'shelfWood',
      depth,
      bodyHeight + 0.02,
      isEnd ? SHELF.side : 0.032,
      midX,
      SHELF.plinth + bodyHeight / 2,
      z,
      0,
    );
    if (!isEnd) {
      addBox(builder, 'brassDark', 0.004, bodyHeight - 0.08, 0.012, frontX - side * 0.002, SHELF.plinth + bodyHeight / 2, z, 0, {
        cast: false,
      });
    }
  }

  // 六层层板；最上一层是顶板。
  for (let i = 0; i < SHELF.boardsY.length; i += 1) {
    const y = SHELF.boardsY[i];
    const isTop = i === SHELF.boardsY.length - 1;
    addBox(builder, 'shelfWood', depth + (isTop ? 0.024 : 0.008), SHELF.board, length - 0.004, midX, y, centerZ, 0);
    addBox(builder, 'trimWood', 0.012, 0.026, length - 0.006, frontX - side * 0.006, y + 0.014, centerZ, 0, {
      cast: false,
    });
  }

  // 顶部檐口（朝房间挑出一点）。
  addBox(builder, 'trimWood', depth + 0.05, SHELF.crown, length + 0.04, midX + side * 0.008, SHELF.height + SHELF.crown / 2 - 0.012, centerZ, 0);
  addBox(builder, 'trimWood', 0.028, 0.05, length + 0.02, frontX - side * 0.014, SHELF.height - 0.035, centerZ, 0, {
    cast: false,
  });

  // 每跨填 5 层书。
  for (let bay = 0; bay < modules; bay += 1) {
    const z0 = dividers[bay] + (bay === 0 ? SHELF.side : 0.016);
    const z1 = dividers[bay + 1] - (bay === modules - 1 ? SHELF.side : 0.016);
    for (let row = 0; row < SHELF.boardsY.length - 1; row += 1) {
      const boardTop = SHELF.boardsY[row] + SHELF.board / 2 + 0.001;
      fillShelfBay(builder, side, z0, z1, boardTop, rng, counts);
    }
  }
}

/* --- 木制人字梯 ---------------------------------------------------- */

function buildLadderFrame(materials, { steps, back }) {
  const group = new THREE.Group();
  const builder = new StaticBuilder();
  const { width, height } = LADDER;
  const halfW = width / 2 - 0.02;
  const railX = 0.024;
  const railZ = 0.032;

  // 两根侧框：从顶部铰链向下 1.72 m。
  for (const z of [-halfW, halfW]) {
    builder.add('ladderWood', roundedBoxGeometry(railX * 2, height, railZ, 0.007, 2), trs(0, -height / 2, z), {
      cast: true,
      receive: true,
    });
  }

  if (steps) {
    // 踏面：4 级。
    for (let i = 0; i < 4; i += 1) {
      const y = -0.28 - i * 0.35;
      builder.add('ladderWood', boxGeometry(0.095, 0.028, width - 0.05), trs(0.012, y, 0), { cast: true, receive: true });
      builder.add('brassDark', boxGeometry(0.012, 0.008, width - 0.06), trs(0.058, y + 0.013, 0), {
        cast: false,
        receive: false,
      });
    }
    // 顶部小平台与铜条。
    builder.add('ladderWood', boxGeometry(0.24, 0.032, width + 0.02), trs(-0.02, -0.06, 0), { cast: true, receive: true });
    builder.add('brassDark', boxGeometry(0.022, 0.006, width), trs(0.088, -0.045, 0), { cast: false, receive: false });
  } else {
    for (const y of [-0.42, -0.86, -1.28]) {
      builder.add('ladderWood', boxGeometry(0.05, 0.026, width - 0.05), trs(0, y, 0), { cast: true, receive: true });
    }
  }

  // 铰链铜箍。
  for (const z of [-halfW, halfW]) {
    builder.add('brassDark', cylinderGeometry(0.017, 0.017, 0.05, 10), trs(0, -0.03, z, 0, 1, 1, 1, Math.PI / 2, 0), {
      cast: false,
    });
  }

  builder.flush(group, materials, back ? 'ladder-back-frame' : 'ladder-front-frame');
  return group;
}

function buildLadder(materials) {
  const group = new THREE.Group();
  group.name = 'wooden-stepladder';
  group.position.set(LADDER.x, LADDER.height, LADDER.z);

  const front = buildLadderFrame(materials, { steps: true, back: false });
  const back = buildLadderFrame(materials, { steps: false, back: true });
  front.name = 'stepladder-front';
  back.name = 'stepladder-back';

  const hingeBuilder = new StaticBuilder();
  hingeBuilder.add(
    'brass',
    cylinderGeometry(0.012, 0.012, LADDER.width, 10),
    trs(0, -0.025, 0, 0, 1, 1, 1, Math.PI / 2, 0),
    { cast: false, receive: false },
  );
  hingeBuilder.flush(group, materials, 'stepladder-hinge');

  group.add(front, back);
  group.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = false;
  });
  return { group, front, back };
}

/* --- 组装 ---------------------------------------------------------- */

export function buildShelves(builder, materials) {
  const rng = mulberry32(0x9e5b17);
  const counts = { books: 0, bookBands: 0, shelving: 0 };
  for (const run of SHELF.runs) buildShelfRun(builder, run, rng, counts);
  counts.shelving = SHELF.runs.length;
  CONTENT_COUNTS.books = counts.books;
  const ladder = buildLadder(materials);
  return { ladder, counts };
}
