import * as THREE from 'three';
import {
  ROOM,
  HALF_W,
  HALF_D,
  DOOR,
  SINK,
  RAIL,
  WALL_KIT,
  BED,
} from './config.js';
import {
  boxGeometry,
  cylinderGeometry,
  planeGeometry,
  roundedBoxGeometry,
  trs,
  uvScaledPlane,
  mergeGeometries,
  tubeGeometry,
} from './geometry.js';

/* ------------------------------------------------------------------ *
 * Room shell and fixed building services.
 *
 * White plaster walls, 600 mm white floor tile, a plain white ceiling
 * with a minimal plaster cornice, white skirting, the painted timber
 * door, the pale-blue bumper rail behind the beds, six daylight LED
 * panels, the wall-mounted AC + camera + display group, and the hand
 * basin / steel cabinet / mirror / sensor-soap unit on the east wall.
 * ------------------------------------------------------------------ */

const addBox = (builder, key, width, height, depth, x, y, z, options = {}) => {
  builder.add(key, boxGeometry(width, height, depth), trs(x, y, z, options.ry ?? 0), options);
};

const addRound = (builder, key, width, height, depth, radius, x, y, z, options = {}) => {
  builder.add(key, roundedBoxGeometry(width, height, depth, radius), trs(x, y, z, options.ry ?? 0), options);
};

function paintMeshGroup(parts, material, name) {
  const geometry = mergeGeometries(parts);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function buildDoor(materials, root) {
  const group = new THREE.Group();
  group.name = 'infirmary-door';
  const leafWidth = DOOR.width - 0.02;
  const leafHeight = DOOR.height - 0.02;
  const leafZ = DOOR.leafZ;
  const doorPaintParts = [];
  const trimParts = [];
  const steelParts = [];
  const chromeParts = [];
  const symbolParts = [];

  // Leaf body, slightly inset from the frame.
  const leaf = boxGeometry(leafWidth, leafHeight, 0.045);
  leaf.applyMatrix4(trs(DOOR.centerX, leafHeight / 2, leafZ));
  doorPaintParts.push(leaf);

  // Two raised mouldings per face: a top panel and a lower panel.
  const panelFaces = [leafZ - 0.024, leafZ + 0.024];
  const panels = [
    { cy: 1.56, h: 0.78, w: 0.64 },
    { cy: 0.62, h: 0.66, w: 0.64 },
  ];
  for (const faceZ of panelFaces) {
    for (const panel of panels) {
      const bar = 0.035;
      const localZ = faceZ + (faceZ > leafZ ? 0.004 : -0.004);
      // Vertical stiles.
      for (const side of [-1, 1]) {
        const g = boxGeometry(bar, panel.h, 0.012);
        g.applyMatrix4(trs(DOOR.centerX + side * (panel.w / 2), panel.cy, localZ));
        trimParts.push(g);
      }
      // Rails.
      for (const side of [-1, 1]) {
        const g = boxGeometry(panel.w + bar, bar, 0.012);
        g.applyMatrix4(trs(DOOR.centerX, panel.cy + side * ((panel.h - bar) / 2), localZ));
        trimParts.push(g);
      }
    }
  }

  // Three hinges on the east jamb.
  for (const y of [0.34, 1.08, 1.82]) {
    const g = boxGeometry(0.075, 0.11, 0.018);
    g.applyMatrix4(trs(DOOR.centerX + leafWidth / 2 - 0.005, y, leafZ - 0.03));
    steelParts.push(g);
  }

  // Kick plate.
  const kick = boxGeometry(leafWidth - 0.08, 0.14, 0.012);
  kick.applyMatrix4(trs(DOOR.centerX, 0.14, leafZ - 0.026));
  steelParts.push(kick);

  // Lever handle on the west side, both faces.
  const handleX = DOOR.centerX - leafWidth / 2 + 0.1;
  for (const face of [-1, 1]) {
    const rosette = cylinderGeometry(0.042, 0.042, 0.018, 16);
    rosette.rotateX(Math.PI / 2);
    rosette.applyMatrix4(trs(handleX, 1.04, leafZ + face * 0.034));
    chromeParts.push(rosette);
    const stem = cylinderGeometry(0.012, 0.012, 0.07, 10);
    stem.rotateX(Math.PI / 2);
    stem.applyMatrix4(trs(handleX, 1.04, leafZ + face * 0.062));
    chromeParts.push(stem);
    const lever = boxGeometry(0.12, 0.022, 0.022);
    lever.applyMatrix4(trs(handleX - 0.05, 1.02, leafZ + face * 0.09));
    chromeParts.push(lever);
  }

  // Clinic door plate: a blank plaque with a simple green cross, no text.
  const plate = roundedBoxGeometry(0.3, 0.2, 0.012, 0.012);
  plate.applyMatrix4(trs(DOOR.centerX + 0.18, 1.72, leafZ - 0.032));
  trimParts.push(plate);
  for (const [w, h] of [[0.13, 0.035], [0.035, 0.13]]) {
    const g = boxGeometry(w, h, 0.006);
    g.applyMatrix4(trs(DOOR.centerX + 0.18, 1.72, leafZ - 0.04));
    symbolParts.push(g);
  }

  group.add(paintMeshGroup(doorPaintParts, materials.doorPaint, 'door-leaf'));
  group.add(paintMeshGroup(trimParts, materials.doorFrame, 'door-trim'));
  group.add(paintMeshGroup(steelParts, materials.steelDark, 'door-steel'));
  group.add(paintMeshGroup(chromeParts, materials.chrome, 'door-handle'));
  const symbol = new THREE.Mesh(mergeGeometries(symbolParts), new THREE.MeshStandardMaterial({ color: 0x4e8f6c, roughness: 0.6, metalness: 0.05, name: 'door-cross' }));
  symbol.name = 'door-cross';
  symbol.castShadow = false;
  group.add(symbol);
  root.add(group);
  return group;
}

function buildDoorFrame(builder, materials) {
  const jambW = 0.06;
  for (const side of [-1, 1]) {
    addBox(builder, 'doorFrame', jambW, DOOR.height + 0.1, 0.12, DOOR.centerX + side * (DOOR.width / 2 + jambW / 2), (DOOR.height + 0.1) / 2, HALF_D - 0.04);
  }
  addBox(builder, 'doorFrame', DOOR.width + jambW * 2, 0.08, 0.12, DOOR.centerX, DOOR.height + 0.06, HALF_D - 0.04);
  // Architrave on both room faces.
  for (const z of [HALF_D - 0.105, HALF_D + 0.01]) {
    for (const side of [-1, 1]) {
      addBox(builder, 'doorFrame', 0.07, DOOR.height + 0.12, 0.025, DOOR.centerX + side * (DOOR.width / 2 + 0.035), (DOOR.height + 0.12) / 2, z);
    }
    addBox(builder, 'doorFrame', DOOR.width + 0.14, 0.07, 0.025, DOOR.centerX, DOOR.height + 0.09, z);
  }
}

function buildWalls(builder) {
  // North, east, west solids.
  addBox(builder, 'wallPaint', ROOM.width + 0.4, ROOM.height, 0.2, 0, ROOM.height / 2, -HALF_D - 0.1);
  addBox(builder, 'wallPaint', 0.2, ROOM.height, ROOM.depth + 0.4, -HALF_W - 0.1, ROOM.height / 2, 0);
  addBox(builder, 'wallPaint', 0.2, ROOM.height, ROOM.depth + 0.4, HALF_W + 0.1, ROOM.height / 2, 0);

  // South wall broken around the door.
  const leftEdge = DOOR.centerX - DOOR.width / 2;
  const rightEdge = DOOR.centerX + DOOR.width / 2;
  const leftWidth = leftEdge + HALF_W + 0.2;
  const rightWidth = HALF_W + 0.2 - rightEdge;
  addBox(builder, 'wallPaint', leftWidth, ROOM.height, 0.2, -HALF_W - 0.2 + leftWidth / 2, ROOM.height / 2, HALF_D + 0.1);
  addBox(builder, 'wallPaint', rightWidth, ROOM.height, 0.2, rightEdge + rightWidth / 2, ROOM.height / 2, HALF_D + 0.1);
  const headerHeight = ROOM.height - DOOR.height;
  addBox(builder, 'wallPaint', DOOR.width, headerHeight, 0.2, DOOR.centerX, DOOR.height + headerHeight / 2, HALF_D + 0.1);
}

function buildWallTrims(builder) {
  // Skirting: 100 mm high, 18 mm proud, with a clean gap at the door.
  const skirtH = 0.1;
  const skirtT = 0.018;
  addBox(builder, 'skirting', ROOM.width, skirtH, skirtT, 0, skirtH / 2, -HALF_D + skirtT / 2);
  addBox(builder, 'skirting', skirtT, skirtH, ROOM.depth, -HALF_W + skirtT / 2, skirtH / 2, 0);
  addBox(builder, 'skirting', skirtT, skirtH, ROOM.depth, HALF_W - skirtT / 2, skirtH / 2, 0);
  const leftEdge = DOOR.centerX - DOOR.width / 2;
  const rightEdge = DOOR.centerX + DOOR.width / 2;
  addBox(builder, 'skirting', leftEdge + HALF_W, skirtH, skirtT, (-HALF_W + leftEdge) / 2, skirtH / 2, HALF_D - skirtT / 2);
  addBox(builder, 'skirting', HALF_W - rightEdge, skirtH, skirtT, (rightEdge + HALF_W) / 2, skirtH / 2, HALF_D - skirtT / 2);

  // Minimal two-step plaster cornice around all four walls.
  const steps = [
    { h: 0.07, p: 0.1, y: ROOM.height - 0.035 },
    { h: 0.03, p: 0.055, y: ROOM.height - 0.085 },
  ];
  for (const step of steps) {
    addBox(builder, 'cornice', ROOM.width, step.h, step.p, 0, step.y, -HALF_D + step.p / 2);
    addBox(builder, 'cornice', ROOM.width, step.h, step.p, 0, step.y, HALF_D - step.p / 2);
    addBox(builder, 'cornice', step.p, step.h, ROOM.depth, -HALF_W + step.p / 2, step.y, 0);
    addBox(builder, 'cornice', step.p, step.h, ROOM.depth, HALF_W - step.p / 2, step.y, 0);
  }
}

function buildBumperRail(builder) {
  const length = RAIL.z1 - RAIL.z0;
  const zCenter = (RAIL.z0 + RAIL.z1) / 2;
  // Rounded blue rail, a back plate and end caps.
  const railGeometry = cylinderGeometry(RAIL.height / 2, RAIL.height / 2, length, 18);
  railGeometry.rotateX(Math.PI / 2);
  builder.add('rail', railGeometry, trs(-HALF_W + RAIL.depth / 2 + 0.012, RAIL.y, zCenter));
  addBox(builder, 'railEnd', 0.03, RAIL.height + 0.03, 0.08, -HALF_W + 0.025, RAIL.y, RAIL.z0 - 0.02);
  addBox(builder, 'railEnd', 0.03, RAIL.height + 0.03, 0.08, -HALF_W + 0.025, RAIL.y, RAIL.z1 + 0.02);
  // Mounting brackets every 0.9 m.
  for (let z = RAIL.z0 + 0.3; z <= RAIL.z1 - 0.2; z += 0.9) {
    addBox(builder, 'railEnd', 0.055, 0.045, 0.06, -HALF_W + 0.032, RAIL.y, z);
  }
  // A pale blue shadow gap under the rail keeps it visually separate.
  addBox(builder, 'wallShadow', 0.012, 0.012, length, -HALF_W + 0.008, RAIL.y - 0.035, zCenter, { cast: false });
}

function buildCeilingLights(builder) {
  const positions = [];
  for (const x of [-1.25, 1.25]) {
    for (const z of [-2.6, 0, 2.6]) positions.push({ x, z });
  }
  for (const { x, z } of positions) {
    addRound(builder, 'ledPanelRim', 0.34, 0.045, 1.16, 0.02, x, ROOM.height - 0.022, z);
    const panel = planeGeometry(0.27, 1.07);
    panel.rotateX(Math.PI / 2);
    builder.add('ledPanel', panel, trs(x, ROOM.height - 0.048, z), { cast: false, receive: false });
    // Two almost invisible clips at the ends.
    for (const side of [-1, 1]) {
      addBox(builder, 'aluminum', 0.07, 0.012, 0.03, x, ROOM.height - 0.05, z + side * 0.55, { cast: false });
    }
  }
}

function buildWallKit(builder) {
  // Split AC high on the north wall.
  const ac = WALL_KIT.ac;
  addRound(builder, 'plasticWhite', ac.width, ac.height, ac.depth, 0.045, ac.x, ac.y, ac.z);
  // Front grille, slats and a lower outlet louver.
  addBox(builder, 'aluminum', ac.width - 0.12, 0.12, 0.012, ac.x, ac.y + 0.05, ac.z + ac.depth / 2 + 0.006);
  for (let i = 0; i < 14; i += 1) {
    addBox(builder, 'steelDark', ac.width - 0.16, 0.006, 0.006, ac.x, ac.y + 0.11 - i * 0.01, ac.z + ac.depth / 2 + 0.014, { cast: false });
  }
  addBox(builder, 'plasticWhite', ac.width - 0.1, 0.035, 0.02, ac.x, ac.y - 0.115, ac.z + ac.depth / 2 + 0.006);
  addBox(builder, 'ledGreen', 0.018, 0.008, 0.004, ac.x + 0.3, ac.y - 0.02, ac.z + ac.depth / 2 + 0.01, { cast: false });
  // Refrigerant pipe and drain hose.
  const pipe = cylinderGeometry(0.022, 0.022, 0.34, 8);
  pipe.rotateZ(Math.PI / 2);
  builder.add('plasticWhite', pipe, trs(ac.x - 0.5, ac.y + 0.02, ac.z));
  const drain = cylinderGeometry(0.012, 0.012, 0.5, 8);
  drain.rotateX(Math.PI / 2);
  builder.add('plasticWhite', drain, trs(ac.x + 0.32, ac.y - 0.2, ac.z + 0.08));

  // Small wall camera looking down the room.
  const cam = WALL_KIT.camera;
  addRound(builder, 'plasticWhite', 0.11, 0.16, 0.05, 0.02, cam.x, cam.y, -HALF_D + 0.025);
  addBox(builder, 'steelDark', 0.035, 0.035, 0.1, cam.x, cam.y, -HALF_D + 0.075);
  const body = roundedBoxGeometry(0.13, 0.12, 0.24, 0.035);
  body.rotateX(-0.28);
  body.rotateY(-0.12);
  builder.add('plasticWhite', body, trs(cam.x, cam.y - 0.03, -HALF_D + 0.17));
  const lens = cylinderGeometry(0.032, 0.036, 0.02, 16);
  lens.rotateX(Math.PI / 2);
  lens.rotateX(-0.28);
  builder.add('screenBezel', lens, trs(cam.x - 0.012, cam.y - 0.068, -HALF_D + 0.29));
  addBox(builder, 'ledRed', 0.012, 0.012, 0.004, cam.x + 0.035, cam.y - 0.012, -HALF_D + 0.265, { cast: false });

  // Wall display beside the camera, showing an abstract feed.
  const display = WALL_KIT.display;
  addBox(builder, 'screenBezel', display.width, display.height, 0.04, display.x, display.y, -HALF_D + 0.03);
  addBox(builder, 'aluminum', display.width - 0.02, display.height - 0.02, 0.012, display.x, display.y, -HALF_D + 0.053, { cast: false });
  const screen = planeGeometry(display.width - 0.06, display.height - 0.06);
  builder.add('displayScreen', screen, trs(display.x, display.y, -HALF_D + 0.06), { cast: false, receive: false });
  addBox(builder, 'ledGreen', 0.012, 0.008, 0.004, display.x - display.width / 2 + 0.035, display.y - display.height / 2 + 0.025, -HALF_D + 0.062, { cast: false });

  // Light switch plate by the door.
  const sw = WALL_KIT.switch;
  addRound(builder, 'plasticWhite', 0.075, 0.12, 0.012, 0.008, sw.x, sw.y, sw.z);
  addBox(builder, 'plasticWhite', 0.03, 0.045, 0.012, sw.x, sw.y, sw.z - 0.012);
}

function buildBasin(builder, materials, root) {
  const { x0, x1, z0, z1, topY } = SINK;
  const counterTopY = topY + 0.04;
  // Steel base cabinet with two doors and a toe recess.
  addRound(builder, 'cabinetSteel', x1 - x0 - 0.02, topY - 0.1, z1 - z0 - 0.04, 0.012, (x0 + x1) / 2, 0.1 + (topY - 0.1) / 2, (z0 + z1) / 2);
  addBox(builder, 'steelDark', 0.02, 0.1, z1 - z0 - 0.1, x0 + 0.02, 0.05, (z0 + z1) / 2);
  // Door seams and handles on the room-facing side (west).
  addBox(builder, 'steelDark', 0.01, 0.72, 0.012, x0 + 0.005, 0.5, (z0 + z1) / 2);
  for (const z of [(z0 + z1) / 2 - 0.22, (z0 + z1) / 2 + 0.22]) {
    addBox(builder, 'chrome', 0.025, 0.025, 0.14, x0 - 0.012, 0.68, z);
  }

  // Counter top in four slabs, leaving a real opening for the basin.
  const basin = SINK.basin;
  const bx0 = basin.x - basin.widthX / 2;
  const bx1 = basin.x + basin.widthX / 2;
  const bz0 = basin.z - basin.widthZ / 2;
  const bz1 = basin.z + basin.widthZ / 2;
  const topT = 0.04;
  const topYc = topY + topT / 2;
  addBox(builder, 'counterSteel', bx0 - x0, topT, z1 - z0, (x0 + bx0) / 2, topYc, (z0 + z1) / 2);
  addBox(builder, 'counterSteel', x1 - bx1, topT, z1 - z0, (bx1 + x1) / 2, topYc, (z0 + z1) / 2);
  addBox(builder, 'counterSteel', bx1 - bx0, topT, bz0 - z0, basin.x, topYc, (z0 + bz0) / 2);
  addBox(builder, 'counterSteel', bx1 - bx0, topT, z1 - bz1, basin.x, topYc, (bz1 + z1) / 2);

  // Basin: four stainless walls and a bottom plate, visibly recessed.
  const depth = basin.depth;
  const wallT = 0.014;
  const bottomY = counterTopY - depth;
  addBox(builder, 'basinSteel', basin.widthX, depth, wallT, basin.x, bottomY + depth / 2, bz0 + wallT / 2);
  addBox(builder, 'basinSteel', basin.widthX, depth, wallT, basin.x, bottomY + depth / 2, bz1 - wallT / 2);
  addBox(builder, 'basinSteel', wallT, depth, basin.widthZ, bx0 + wallT / 2, bottomY + depth / 2, basin.z);
  addBox(builder, 'basinSteel', wallT, depth, basin.widthZ, bx1 - wallT / 2, bottomY + depth / 2, basin.z);
  addBox(builder, 'basinSteel', basin.widthX, 0.012, basin.widthZ, basin.x, bottomY, basin.z);
  // A slightly proud rim frames the recess and catches the ceiling light.
  for (const side of [-1, 1]) {
    addBox(builder, 'counterSteel', basin.widthX + 0.03, 0.012, 0.022, basin.x, counterTopY + 0.002, basin.z + side * (basin.widthZ / 2 + 0.011));
    addBox(builder, 'counterSteel', 0.022, 0.012, basin.widthZ + 0.03, basin.x + side * (basin.widthX / 2 + 0.011), counterTopY + 0.002, basin.z);
  }
  // Drain at the bottom of the single bowl.
  const drain = cylinderGeometry(0.028, 0.028, 0.008, 16);
  builder.add('chrome', drain, trs(basin.x, bottomY + 0.008, basin.z));
  const drainRing = cylinderGeometry(0.016, 0.016, 0.01, 12);
  builder.add('steelDark', drainRing, trs(basin.x, bottomY + 0.002, basin.z));

  // Gooseneck faucet with a single lever.
  const base = cylinderGeometry(0.035, 0.042, 0.03, 14);
  builder.add('chrome', base, trs(2.4, counterTopY + 0.015, 3.66));
  const neck = tubeGeometry([
    [2.4, counterTopY + 0.02, 3.66],
    [2.4, counterTopY + 0.18, 3.66],
    [2.38, counterTopY + 0.3, 3.6],
    [2.32, counterTopY + 0.32, 3.5],
    [2.28, counterTopY + 0.25, 3.43],
  ], 0.016, 20, 7);
  builder.add('chrome', neck);
  const spout = cylinderGeometry(0.018, 0.014, 0.03, 10);
  builder.add('chrome', spout, trs(2.28, counterTopY + 0.23, 3.43));
  addBox(builder, 'chrome', 0.12, 0.018, 0.022, 2.4, counterTopY + 0.08, 3.7);

  // Soap bottle on the counter.
  const soap = cylinderGeometry(0.035, 0.045, 0.14, 12);
  builder.add('soapLiquid', soap, trs(2.09, counterTopY + 0.07, 3.7));
  const pump = cylinderGeometry(0.012, 0.012, 0.06, 8);
  builder.add('chrome', pump, trs(2.09, counterTopY + 0.17, 3.7));
  addBox(builder, 'chrome', 0.08, 0.012, 0.018, 2.11, counterTopY + 0.2, 3.7);

  // Tile splashback from the counter to the mirror.
  addBox(builder, 'splashTile', 0.016, 0.44, z1 - z0, x1 - 0.008, topY + 0.22, (z0 + z1) / 2);

  // Frameless square mirror, slightly proud of a dark shadow reveal. The
  // mesh is kept separate so the scene can bake a cube reflection once.
  const mirror = SINK.mirror;
  const mirrorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, mirror.height, mirror.width),
    materials.mirror,
  );
  mirrorMesh.name = 'frameless-mirror';
  mirrorMesh.position.set(mirror.x, mirror.y, mirror.z);
  mirrorMesh.castShadow = false;
  mirrorMesh.receiveShadow = false;
  root.add(mirrorMesh);
  addBox(builder, 'steelDark', 0.01, mirror.height + 0.018, mirror.width + 0.018, x1 - 0.004, mirror.y, mirror.z, { cast: false });

  // Wall-mounted sensor soap dispenser above the mirror.
  const soapUnit = SINK.soap;
  addRound(builder, 'plasticWhite', 0.09, 0.22, 0.16, 0.02, soapUnit.x, soapUnit.y, soapUnit.z);
  addBox(builder, 'sensorLed', 0.05, 0.02, 0.004, soapUnit.x - 0.024, soapUnit.y + 0.06, soapUnit.z + 0.082, { cast: false });
  addBox(builder, 'steelDark', 0.025, 0.02, 0.03, soapUnit.x - 0.02, soapUnit.y - 0.11, soapUnit.z + 0.06);
  const tube = cylinderGeometry(0.006, 0.006, 0.06, 6);
  builder.add('soapLiquid', tube, trs(soapUnit.x - 0.02, soapUnit.y - 0.14, soapUnit.z + 0.06));

  return mirrorMesh;
}

function buildMedicalGasPanels(builder) {
  // Small gas outlet plates above each bed head. Two colour-coded sockets
  // each, no labels.
  for (const z of BED.centersZ) {
    addRound(builder, 'plasticWhite', 0.016, 0.15, 0.24, 0.008, -HALF_W + 0.008, 1.53, z);
    for (const [dz, colorKey] of [[-0.055, 'ledGreen'], [0.055, 'plasticBlue']]) {
      const socket = cylinderGeometry(0.023, 0.023, 0.008, 12);
      socket.rotateZ(Math.PI / 2);
      builder.add(colorKey, socket, trs(-HALF_W + 0.018, 1.53, z + dz), { cast: false });
    }
  }
}

export function buildRoom(builder, materials, root) {
  // Floor and ceiling.
  const floor = uvScaledPlane(ROOM.width, ROOM.depth, 1.2);
  floor.rotateX(-Math.PI / 2);
  builder.add('floorTile', floor, trs(0, 0, 0));
  const ceiling = uvScaledPlane(ROOM.width, ROOM.depth, 2.0);
  ceiling.rotateX(Math.PI / 2);
  builder.add('ceilingPaint', ceiling, trs(0, ROOM.height, 0));

  buildWalls(builder);
  buildWallTrims(builder);
  buildBumperRail(builder);
  buildCeilingLights(builder);
  buildWallKit(builder);
  const mirrorMesh = buildBasin(builder, materials, root);
  buildMedicalGasPanels(builder);
  buildDoorFrame(builder, materials);

  const doorGroup = buildDoor(materials, root);

  return {
    doorGroup,
    mirrorMesh,
    lightFixtures: 6,
  };
}
