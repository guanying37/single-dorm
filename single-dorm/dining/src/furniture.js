import * as THREE from 'three';
import { TABLES, TABLE, SIDEBOARD } from './config.js';
import {
  StaticBuilder,
  trs,
  boxGeometry,
  cylinderGeometry,
  sphereGeometry,
  torusGeometry,
  latheGeometry,
  tubeGeometry,
  rodGeometry,
  mergeGeometries,
} from './utils.js';

/* ------------------------------------------------------------------ *
 * Dining furniture.
 *
 * Ten tables, sixty bentwood chairs, sixty full covers, forty flowers
 * and one service sideboard. Everything static is added to the global
 * batch; only the sideboard's two doors and three drawers stay separate
 * because they animate.
 * ------------------------------------------------------------------ */

const TABLE_TOP = TABLE.height; // 0.75
const CLOTH_TOP = 0.764;

/* --- Reusable geometry --------------------------------------------- */

function createChairGeometry() {
  const parts = [];
  const seat = new THREE.CylinderGeometry(0.225, 0.235, 0.035, 24, 1);
  seat.translate(0, TABLE.seatHeight, 0);
  parts.push(seat);

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      parts.push(rodGeometry(
        [sx * 0.155, TABLE.seatHeight - 0.01, sz * 0.155],
        [sx * 0.205, 0, sz * 0.205],
        0.017,
        8,
      ));
    }
  }

  // Bentwood back hoop.
  parts.push(tubeGeometry(
    [
      [-0.19, 0.46, -0.16],
      [-0.21, 0.65, -0.18],
      [-0.16, 0.81, -0.18],
      [-0.08, 0.88, -0.18],
      [0, 0.89, -0.18],
      [0.08, 0.88, -0.18],
      [0.16, 0.81, -0.18],
      [0.21, 0.65, -0.18],
      [0.19, 0.46, -0.16],
    ],
    0.018,
    30,
    6,
  ));

  for (const x of [-0.085, 0, 0.085]) {
    parts.push(rodGeometry([x, 0.46, -0.16], [x * 0.92, 0.86, -0.18], 0.011, 6));
  }

  const ring = torusGeometry(0.215, 0.012, 5, 24);
  ring.rotateX(Math.PI / 2);
  ring.translate(0, TABLE.seatHeight - 0.018, 0);
  parts.push(ring);

  return mergeGeometries(parts);
}

function createTableGeometry() {
  const parts = [];
  const top = boxGeometry(1.78, 0.06, 0.96);
  top.translate(0, TABLE_TOP - 0.03, 0);
  parts.push(top);

  for (const sz of [-1, 1]) {
    const apron = boxGeometry(1.58, 0.1, 0.04);
    apron.translate(0, TABLE_TOP - 0.11, sz * 0.44);
    parts.push(apron);
  }
  for (const sx of [-1, 1]) {
    const apron = boxGeometry(0.04, 0.1, 0.78);
    apron.translate(sx * 0.79, TABLE_TOP - 0.11, 0);
    parts.push(apron);
  }
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = boxGeometry(0.07, 0.7, 0.07);
      leg.translate(sx * 0.78, 0.35, sz * 0.39);
      parts.push(leg);
    }
  }
  for (const sz of [-1, 1]) {
    const rail = boxGeometry(1.5, 0.045, 0.045);
    rail.translate(0, 0.18, sz * 0.39);
    parts.push(rail);
  }
  return mergeGeometries(parts);
}

function createCoverGeometry() {
  const ceramic = [];
  const steel = [];
  const wood = [];

  const plate = cylinderGeometry(0.12, 0.117, 0.018, 32);
  plate.translate(0, 0.009, 0);
  ceramic.push(plate);
  const rim = torusGeometry(0.112, 0.005, 5, 32);
  rim.rotateX(Math.PI / 2);
  rim.translate(0, 0.018, 0);
  ceramic.push(rim);

  const bowl = latheGeometry(
    [
      [0, 0.018],
      [0.03, 0.018],
      [0.052, 0.028],
      [0.058, 0.055],
      [0.054, 0.068],
      [0.048, 0.068],
      [0.05, 0.055],
      [0.043, 0.032],
      [0, 0.026],
    ],
    24,
  );
  ceramic.push(bowl);

  // Fork (left of the plate).
  const forkX = 0.19;
  const forkHandle = boxGeometry(0.012, 0.004, 0.12);
  forkHandle.translate(forkX, 0.024, 0.02);
  steel.push(forkHandle);
  const forkNeck = boxGeometry(0.03, 0.004, 0.03);
  forkNeck.translate(forkX, 0.024, 0.085);
  steel.push(forkNeck);
  for (let i = -1; i <= 1; i += 1) {
    const tine = boxGeometry(0.004, 0.003, 0.045);
    tine.translate(forkX + i * 0.009, 0.024, 0.114);
    steel.push(tine);
  }

  // Spoon (right of the plate).
  const spoonX = -0.19;
  const spoonHandle = boxGeometry(0.012, 0.004, 0.11);
  spoonHandle.translate(spoonX, 0.024, 0.015);
  steel.push(spoonHandle);
  const spoonBowl = sphereGeometry(1, 14, 8);
  spoonBowl.scale(0.026, 0.008, 0.038);
  spoonBowl.translate(spoonX, 0.024, 0.095);
  steel.push(spoonBowl);

  // Chopsticks and rest, further right.
  for (const offset of [0, 0.02]) {
    const stick = cylinderGeometry(0.0035, 0.0045, 0.24, 6);
    stick.rotateX(Math.PI / 2);
    stick.translate(-0.25 + offset * 0.4, 0.016 + offset * 0.002, 0.01);
    wood.push(stick);
  }
  const rest = boxGeometry(0.04, 0.012, 0.014);
  rest.translate(-0.238, 0.01, -0.1);
  wood.push(rest);

  return {
    ceramic: mergeGeometries(ceramic),
    steel: mergeGeometries(steel),
    wood: mergeGeometries(wood),
  };
}

/* --- Flowers ------------------------------------------------------- */

function createPetalGeometry() {
  const geometry = sphereGeometry(1, 12, 8);
  geometry.scale(0.011, 0.005, 0.025);
  geometry.translate(0, 0, 0.018);
  return geometry;
}

function createLeafGeometry() {
  const geometry = sphereGeometry(1, 10, 6);
  geometry.scale(0.042, 0.003, 0.016);
  geometry.translate(0.04, 0, 0);
  return geometry;
}

function addBouquet(builder, tableMatrix, variant) {
  const vaseMatrix = tableMatrix.clone().multiply(trs(0, CLOTH_TOP, 0));
  const vaseProfile = latheGeometry(
    [
      [0, 0],
      [0.046, 0],
      [0.056, 0.018],
      [0.053, 0.07],
      [0.037, 0.13],
      [0.03, 0.18],
      [0.038, 0.208],
      [0.033, 0.208],
      [0.027, 0.18],
    ],
    24,
  );
  builder.add('ceramic', vaseProfile, vaseMatrix, { cast: true, receive: true });

  const counts = [3, 4, 5];
  const count = counts[variant % counts.length];
  const colors = ['petalCream', 'petalBlush', 'petalYellow', 'petalCream', 'petalBlush'];
  const petalGeometry = createPetalGeometry();
  const leafGeometry = createLeafGeometry();

  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + variant * 0.9;
    const radius = count === 3 ? 0.06 : 0.08 + (i % 2) * 0.035;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 0.34 + 0.045 * ((i + variant) % 3);
    const center = tableMatrix.clone().multiply(trs(x, CLOTH_TOP + y, z));

    const start = new THREE.Vector3(0, CLOTH_TOP + 0.2, 0);
    const end = new THREE.Vector3(x, CLOTH_TOP + y - 0.014, z);
    const mid = new THREE.Vector3(
      x * 0.35 + Math.sin(angle * 1.7) * 0.02,
      CLOTH_TOP + 0.2 + (y - 0.2) * 0.55,
      z * 0.35 + Math.cos(angle * 1.3) * 0.02,
    );
    const stem = tubeGeometry(
      [
        [start.x, start.y, start.z],
        [mid.x, mid.y, mid.z],
        [end.x, end.y, end.z],
      ],
      0.0042,
      12,
      5,
    );
    builder.add('greenery', stem, tableMatrix, { cast: false, receive: true });

    const colorKey = colors[(i + variant) % colors.length];
    for (let p = 0; p < 5; p += 1) {
      const a = (p / 5) * Math.PI * 2 + angle * 0.4;
      const matrix = center
        .clone()
        .multiply(new THREE.Matrix4().makeRotationY(a))
        .multiply(new THREE.Matrix4().makeRotationX(-0.16));
      builder.add(colorKey, petalGeometry, matrix, { cast: false, receive: true });
    }

    builder.add('flowerCenter', sphereGeometry(0.013, 12, 8), center.clone().multiply(trs(0, 0.003, 0)), {
      cast: false,
      receive: true,
    });
    for (let s = 0; s < 5; s += 1) {
      const a = (s / 5) * Math.PI * 2 + 0.4;
      const stamen = center.clone().multiply(trs(Math.cos(a) * 0.013, 0.014, Math.sin(a) * 0.013));
      builder.add('flowerCenter', sphereGeometry(0.0038, 6, 4), stamen, { cast: false, receive: true });
    }

    // A single leaf on alternate stems.
    if (i % 2 === 0) {
      const leafMatrix = tableMatrix
        .clone()
        .multiply(trs(x * 0.55, CLOTH_TOP + y * 0.68, z * 0.55))
        .multiply(new THREE.Matrix4().makeRotationY(angle + Math.PI / 2))
        .multiply(new THREE.Matrix4().makeRotationZ(0.2));
      builder.add('greenery', leafGeometry, leafMatrix, { cast: false, receive: true });
    }
  }
}

/* --- Sideboard ----------------------------------------------------- */

function buildSideboardDoor(materials, { left }) {
  const group = new THREE.Group();
  const builder = new StaticBuilder();
  const direction = left ? 1 : -1;
  const width = 1.16;
  const height = 0.7;
  const thickness = 0.026;
  const centerX = direction * (width / 2 - 0.01);

  builder.add('oak', boxGeometry(width, height, thickness), trs(centerX, height / 2, thickness / 2));

  for (const face of [-1, 1]) {
    const z = thickness / 2 + face * 0.008;
    builder.add('oakDark', boxGeometry(width - 0.16, 0.012, 0.012), trs(centerX, 0.12, z));
    builder.add('oakDark', boxGeometry(width - 0.16, 0.012, 0.012), trs(centerX, height - 0.12, z));
    builder.add('oakDark', boxGeometry(0.012, height - 0.2, 0.012), trs(centerX - width / 2 + 0.1, height / 2, z));
    builder.add('oakDark', boxGeometry(0.012, height - 0.2, 0.012), trs(centerX + width / 2 - 0.1, height / 2, z));
    builder.add(
      'brass',
      sphereGeometry(0.018, 12, 8),
      trs(centerX + direction * 0.42, height / 2, thickness + face * 0.022),
    );
  }

  builder.flush(group, materials, 'sideboard-door');
  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = false;
      child.receiveShadow = true;
    }
  });
  return group;
}

function buildDrawer(materials) {
  const group = new THREE.Group();
  const builder = new StaticBuilder();
  const width = 1.12;
  const height = 0.21;
  const depth = 0.42;

  builder.add('oak', boxGeometry(width, height, 0.024), trs(0, 0, 0.012));
  for (const face of [-1, 1]) {
    builder.add('oakDark', boxGeometry(width - 0.1, 0.01, 0.012), trs(0, height / 2 - 0.05, 0.025 + face * 0.002));
  }
  for (const side of [-1, 1]) {
    builder.add('oakDark', boxGeometry(0.012, height - 0.03, depth), trs(side * (width / 2 - 0.01), -0.01, -depth / 2));
  }
  builder.add('oakDark', boxGeometry(width - 0.02, 0.012, depth), trs(0, -height / 2 + 0.02, -depth / 2));
  builder.add('oakDark', boxGeometry(width - 0.02, height - 0.04, 0.012), trs(0, -0.01, -depth + 0.006));

  // A folded napkin or two inside.
  for (let i = 0; i < 2; i += 1) {
    builder.add('linen', boxGeometry(0.22, 0.02, 0.16), trs(-0.18 + i * 0.4, -height / 2 + 0.045, -0.2));
  }

  builder.add('brass', boxGeometry(0.2, 0.014, 0.014), trs(0, 0.03, 0.035));
  for (const side of [-1, 1]) {
    builder.add('brass', cylinderGeometry(0.007, 0.007, 0.03, 8), trs(side * 0.1, 0.03, 0.03, 0, 1, 1, 1, Math.PI / 2));
  }

  builder.flush(group, materials, 'sideboard-drawer');
  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = false;
      child.receiveShadow = true;
    }
  });
  return group;
}

function buildSideboard(builder, materials, root) {
  const group = new THREE.Group();
  group.name = 'sideboard';
  group.position.set(SIDEBOARD.position.x, 0, SIDEBOARD.position.z);
  group.rotation.y = SIDEBOARD.rotationY;
  root.add(group);

  const width = SIDEBOARD.width;
  const depth = SIDEBOARD.depth;
  const height = SIDEBOARD.height;
  const halfWidth = width / 2;
  const halfDepth = depth / 2;

  const addLocal = (key, geometry, local, options = {}) => {
    const world = group.matrixWorld.clone().multiply(local);
    builder.add(key, geometry, world, options);
  };
  group.updateMatrixWorld(true);

  addLocal('oak', boxGeometry(width, 0.04, depth), trs(0, height - 0.02, 0));
  addLocal('oak', boxGeometry(width, 0.08, depth), trs(0, 0.08, 0));
  addLocal('walnut', boxGeometry(width, 0.84, 0.03), trs(0, 0.49, -halfDepth + 0.02));
  for (const side of [-1, 1]) {
    addLocal('oak', boxGeometry(0.04, 0.9, depth), trs(side * (halfWidth - 0.02), 0.5, 0));
    addLocal('walnut', boxGeometry(0.03, 0.8, depth - 0.05), trs(side * 0.6, 0.5, 0));
  }
  for (const side of [-1, 1]) {
    addLocal('oak', boxGeometry(0.03, 0.03, depth - 0.03), trs(side * (halfWidth - 0.035), 0.5, 0));
  }
  // Stone top.
  addLocal('border', boxGeometry(width + 0.04, 0.025, depth + 0.03), trs(0, height + 0.012, 0));
  // Toe kick.
  addLocal('walnut', boxGeometry(width - 0.1, 0.08, 0.02), trs(0, 0.05, halfDepth - 0.01));

  // Shelf items: plates and a ceramic carafe.
  for (const side of [-1, 1]) {
    addLocal('walnut', boxGeometry(1.14, 0.03, depth - 0.08), trs(side * 1.18, 0.52, 0));
    for (let i = 0; i < 5; i += 1) {
      addLocal('ceramic', cylinderGeometry(0.13, 0.125, 0.018, 24), trs(side * 1.18, 0.545 + i * 0.02, 0, 0, 1, 1, 1, 0, 0));
    }
  }
  addLocal(
    'ceramic',
    latheGeometry(
      [
        [0, 0],
        [0.055, 0],
        [0.06, 0.03],
        [0.05, 0.1],
        [0.035, 0.16],
        [0.038, 0.24],
        [0.03, 0.24],
        [0, 0.24],
      ],
      20,
    ),
    trs(0.15, height + 0.025, 0),
  );
  // A small stack of folded napkins on the top.
  for (let i = 0; i < 4; i += 1) {
    addLocal('linen', boxGeometry(0.26, 0.008, 0.2), trs(-0.9, height + 0.03 + i * 0.009, 0.02));
  }

  // Front frame: top rail, bottom rail and stiles close the openings so
  // the sideboard reads as joinery rather than an open shelf.
  addLocal('oak', boxGeometry(width, 0.12, 0.03), trs(0, 0.89, halfDepth - 0.015));
  addLocal('oak', boxGeometry(width, 0.06, 0.03), trs(0, 0.11, halfDepth - 0.015));
  for (const side of [-1, 1]) {
    addLocal('oak', boxGeometry(0.08, 0.7, 0.03), trs(side * 0.6, 0.49, halfDepth - 0.015));
  }

  // Two doors on the outer thirds, three drawers in the centre.
  const leftDoor = buildSideboardDoor(materials, { left: true });
  leftDoor.position.set(-halfWidth + 0.01, 0.14, halfDepth + 0.002);
  group.add(leftDoor);

  const rightDoor = buildSideboardDoor(materials, { left: false });
  rightDoor.position.set(halfWidth - 0.01, 0.14, halfDepth + 0.002);
  group.add(rightDoor);

  const drawers = [];
  for (let i = 0; i < 3; i += 1) {
    const drawer = buildDrawer(materials);
    drawer.position.set(0, 0.245 + i * 0.22, halfDepth - 0.002);
    drawer.userData.closedZ = drawer.position.z;
    group.add(drawer);
    drawers.push(drawer);
  }

  const interactables = [
    {
      id: 'sideboard.door.left',
      label: '餐具柜左门',
      open: false,
      value: 0,
      target: 0,
      hitRoots: [leftDoor],
      apply(value) {
        leftDoor.rotation.y = -value * 1.75;
      },
    },
    {
      id: 'sideboard.door.right',
      label: '餐具柜右门',
      open: false,
      value: 0,
      target: 0,
      hitRoots: [rightDoor],
      apply(value) {
        rightDoor.rotation.y = value * 1.75;
      },
    },
  ];

  drawers.forEach((drawer, index) => {
    interactables.push({
      id: `sideboard.drawer.${index + 1}`,
      label: `餐具柜抽屉 ${index + 1}`,
      open: false,
      value: 0,
      target: 0,
      hitRoots: [drawer],
      apply(value) {
        drawer.position.z = drawer.userData.closedZ + value * 0.34;
      },
    });
  });

  const colliders = [
    { x: SIDEBOARD.position.x, z: SIDEBOARD.position.z, hx: depth / 2, hz: width / 2 },
    { x: SIDEBOARD.position.x + halfDepth + 0.01, z: 1.78, hx: 0.02, hz: 0.58, rot: Math.PI / 2, dynamic: 'leftDoor' },
    { x: SIDEBOARD.position.x + halfDepth + 0.01, z: -1.78, hx: 0.02, hz: 0.58, rot: Math.PI / 2, dynamic: 'rightDoor' },
    { x: SIDEBOARD.position.x + 0.21, z: 0, hx: 0.21, hz: 0.56, dynamic: 'drawer' },
  ];

  return {
    group,
    interactables,
    colliders,
    doors: { left: leftDoor, right: rightDoor },
    drawers,
    halfWidth,
    halfDepth,
  };
}

/* --- Public build --------------------------------------------------- */

export function buildFurniture(builder, materials, root) {
  const colliders = [];
  const interactables = [];

  const chairGeometry = createChairGeometry();
  const tableGeometry = createTableGeometry();
  const cover = createCoverGeometry();

  for (const table of TABLES) {
    const tableMatrix = trs(table.x, 0, table.z);

    builder.add('oak', tableGeometry, tableMatrix, { cast: true, receive: true });

    // Cloth. The top floats 14 mm over the timber; the skirt hangs 32 cm.
    builder.add('clothTop', boxGeometry(1.88, 0.016, 1.08), tableMatrix.clone().multiply(trs(0, CLOTH_TOP - 0.008, 0)), {
      cast: true,
      receive: true,
    });    for (const side of [-1, 1]) {
      builder.add(
        'clothLong',
        boxGeometry(1.88, TABLE.clothDrop, 0.008),
        tableMatrix.clone().multiply(trs(0, CLOTH_TOP - TABLE.clothDrop / 2, side * 0.54)),
        { cast: true, receive: true },
      );
      builder.add(
        'clothShort',
        boxGeometry(0.008, TABLE.clothDrop, 1.08),
        tableMatrix.clone().multiply(trs(side * 0.94, CLOTH_TOP - TABLE.clothDrop / 2, 0)),
        { cast: true, receive: true },
      );
    }

    // Six chairs.
    const chairs = [
      { x: -0.45, z: -0.95, ry: 0 },
      { x: 0.45, z: -0.95, ry: 0 },
      { x: -0.45, z: 0.95, ry: Math.PI },
      { x: 0.45, z: 0.95, ry: Math.PI },
      { x: -1.25, z: 0, ry: Math.PI / 2 },
      { x: 1.25, z: 0, ry: -Math.PI / 2 },
    ];
    for (const chair of chairs) {
      const matrix = tableMatrix.clone().multiply(trs(chair.x, 0, chair.z, chair.ry));
      builder.add('oak', chairGeometry, matrix, { cast: true, receive: true });
    }

    // Covers.
    const covers = [
      { x: -0.45, z: -0.3, ry: 0 },
      { x: 0.45, z: -0.3, ry: 0 },
      { x: -0.45, z: 0.3, ry: Math.PI },
      { x: 0.45, z: 0.3, ry: Math.PI },
      { x: -0.7, z: 0, ry: Math.PI / 2 },
      { x: 0.7, z: 0, ry: -Math.PI / 2 },
    ];
    for (const setting of covers) {
      const matrix = tableMatrix.clone().multiply(trs(setting.x, CLOTH_TOP, setting.z, setting.ry));
      builder.add('ceramic', cover.ceramic, matrix, { cast: true, receive: true });
      builder.add('steel', cover.steel, matrix, { cast: true, receive: true });
      builder.add('oakDark', cover.wood, matrix, { cast: true, receive: true });
    }

    addBouquet(builder, tableMatrix, table.variant);

    colliders.push({ x: table.x, z: table.z, hx: 1.55, hz: 1.45 });
  }

  const sideboard = buildSideboard(builder, materials, root);
  colliders.push(...sideboard.colliders);
  interactables.push(...sideboard.interactables);

  return {
    colliders,
    interactables,
    sideboard,
    tableCount: TABLES.length,
  };
}
