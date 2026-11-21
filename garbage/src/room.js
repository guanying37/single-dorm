import * as THREE from 'three';
import {
  boxGeometry,
  cylinderGeometry,
  planeGeometry,
  roundedBoxGeometry,
  torusGeometry,
  tubeGeometry,
  uvScaledPlane,
  crtScreenGeometry,
  mergeGeometries,
  trs,
  StaticBuilder,
  mulberry32,
} from './geometry.js';
import {
  ROOM,
  HALF_W,
  HALF_D,
  DOOR,
  SIGN,
  SWITCH,
  CAMERA,
  MONITOR,
  LAMPS,
  MESH,
  PUDDLE,
  DRAIN,
  WALL,
  CONTENT_COUNTS,
} from './config.js';

/* ------------------------------------------------------------------ *
 * Garbage-room shell: stained cement floor with a floor drain and a dark
 * puddle, dirty white plaster walls, painted ceiling, the black-brown
 * timber door, the CCTV corner (camera + two monitors + recorder), two
 * tungsten pendants, one flickering batten, one dead batten, rusted wire
 * mesh and cobwebs, the warning sign, conduit and a rusted pipe.
 *
 * Static geometry is merged per material by StaticBuilder. Only the door
 * leaf group, the camera head, the switch toggle and the door-underlight
 * glow stay separate.
 * ------------------------------------------------------------------ */

const WALL_TILE = 2.4;

function addPlane(builder, key, width, height, matrix, tile = WALL_TILE, options = {}) {
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

function addCyl(builder, key, radiusTop, radiusBottom, height, segments, x, y, z, options = {}) {
  builder.add(
    key,
    cylinderGeometry(radiusTop, radiusBottom, height, segments),
    trs(x, y, z, options.ry ?? 0, 1, 1, 1, options.rx ?? 0, options.rz ?? 0),
    { cast: options.cast ?? true, receive: options.receive ?? true },
  );
}

function addTube(builder, key, points, radius, tubular = 16, radial = 5, options = {}) {
  builder.add(key, tubeGeometry(points, radius, tubular, radial), null, {
    cast: options.cast ?? false,
    receive: options.receive ?? true,
  });
}

function transferBuckets(source, target, matrix) {
  for (const [key, bucket] of source.buckets) {
    for (const geometry of bucket.geometries) {
      target.add(key, geometry, matrix, {
        cast: bucket.castShadow,
        receive: bucket.receiveShadow,
      });
      geometry.dispose();
    }
  }
  source.buckets.clear();
}

/* --- Floor, drain, puddle and settled dirt ------------------------- */

function buildFloor(builder) {
  // One non-repeating map across the whole 4.32 × 5.40 m slab.
  builder.add(
    'floorConcrete',
    planeGeometry(ROOM.width, ROOM.depth),
    trs(0, 0, 0, 0, 1, 1, 1, -Math.PI / 2),
    { cast: false, receive: true },
  );

  // Floor drain with a cast grate and a ring of dark silt.
  const { x, z, size } = DRAIN;
  addBox(builder, 'wallPaintDark', size + 0.1, 0.006, size + 0.1, x, 0.002, z, 0, { cast: false });
  addBox(builder, 'wallPaintDark', size, 0.008, size, x, 0.003, z, 0, { cast: false });
  for (let i = 0; i < 7; i += 1) {
    addBox(builder, 'steelDark', size - 0.05, 0.01, 0.016, x, 0.009, z - size / 2 + 0.045 + i * 0.043, 0, {
      cast: false,
    });
  }
  addBox(builder, 'steelDark', size + 0.06, 0.012, 0.03, x, 0.006, z - size / 2 - 0.015, 0, { cast: false });
  addBox(builder, 'steelDark', size + 0.06, 0.012, 0.03, x, 0.006, z + size / 2 + 0.015, 0, { cast: false });
  addBox(builder, 'steelDark', 0.03, 0.012, size + 0.06, x - size / 2 - 0.015, 0.006, z, 0, { cast: false });
  addBox(builder, 'steelDark', 0.03, 0.012, size + 0.06, x + size / 2 + 0.015, 0.006, z, 0, { cast: false });

  // Damp skirting line where the cement meets the plaster.
  const skirting = 0.035;
  addBox(builder, 'wallPaintDark', ROOM.width, skirting, 0.012, 0, skirting / 2, -HALF_D + 0.006, 0, { cast: false });
  addBox(builder, 'wallPaintDark', ROOM.width, skirting, 0.012, 0, skirting / 2, HALF_D - 0.006, 0, { cast: false });
  addBox(builder, 'wallPaintDark', 0.012, skirting, ROOM.depth, -HALF_W + 0.006, skirting / 2, 0, 0, { cast: false });
  addBox(builder, 'wallPaintDark', 0.012, skirting, ROOM.depth, HALF_W - 0.006, skirting / 2, 0, 0, { cast: false });

  // Leachate stains and tyre marks between the bins and the drain.
  for (const [cx, cz, rx, rz, ry] of [
    [1.06, -0.86, 0.24, 0.42, 0.2],
    [0.72, 0.34, 0.34, 0.18, -0.5],
    [1.34, 0.52, 0.18, 0.26, 0.9],
  ]) {
    builder.add(
      'wallPaintDark',
      new THREE.CircleGeometry(1, 18),
      trs(cx, 0.0022, cz, ry, rx, 1, rz, -Math.PI / 2, 0),
      { cast: false, receive: true },
    );
  }
  // Two dark wheel tracks in front of the bins.
  for (const offset of [-0.18, 0.18]) {
    addBox(builder, 'binTrim', 0.06, 0.003, 1.3, 1.12, 0.0025, -0.55 + offset * 0.2, 0, { cast: false });
  }

  // Crumpled paper, scraps and dust in the corners.
  const rng = mulberry32(0x9a71c3);
  for (const [px, pz, radius, ry] of [
    [0.18, 1.62, 0.055, 0.5],
    [-0.94, 0.18, 0.045, 1.7],
    [1.02, 1.44, 0.04, 2.6],
    [-0.42, -2.06, 0.05, 0.9],
    [0.66, -0.7, 0.035, 1.2],
  ]) {
    builder.add('paperOld', new THREE.IcosahedronGeometry(radius, 0), trs(px, radius * 0.68, pz, ry, 1, 0.72, 1), {
      cast: false,
      receive: true,
    });
  }
  for (const [px, pz, radius, squash] of [
    [-2.04, -2.6, 0.12, 0.8],
    [2.02, -2.58, 0.1, 0.7],
    [-2.08, 2.56, 0.11, 0.8],
    [1.98, 2.32, 0.08, 0.65],
    [-2.06, 0.12, 0.07, 0.6],
    [0.4, -2.62, 0.09, 0.7],
  ]) {
    builder.add(
      'wallPaintDark',
      new THREE.SphereGeometry(radius, 10, 6),
      trs(px, radius * squash * 0.35, pz, 0, 1, squash * 0.35, 1),
      { cast: false, receive: true },
    );
  }
  // Small splinters and a broken bag tag near the bags.
  for (let i = 0; i < 7; i += 1) {
    const px = -1.9 + rng() * 1.0;
    const pz = 1.3 + rng() * 1.2;
    addBox(builder, 'woodDark', 0.04 + rng() * 0.1, 0.01, 0.014, px, 0.006, pz, rng() * Math.PI, {
      cast: false,
    });
  }
}

/* --- Puddle ------------------------------------------------------- */

function buildPuddle(materials, root) {
  // Main pool plus three droplets, merged into one draw call.
  const decals = [
    { x: PUDDLE.x, z: PUDDLE.z, w: PUDDLE.width, d: PUDDLE.depth, rot: PUDDLE.rotation },
    { x: PUDDLE.x - 0.18, z: PUDDLE.z + 0.62, w: PUDDLE.width * 0.19, d: PUDDLE.depth * 0.19, rot: 0.6 },
    { x: PUDDLE.x + 0.42, z: PUDDLE.z + 0.36, w: PUDDLE.width * 0.13, d: PUDDLE.depth * 0.13, rot: 1.8 },
    { x: PUDDLE.x + 0.7, z: PUDDLE.z + 0.56, w: PUDDLE.width * 0.1, d: PUDDLE.depth * 0.1, rot: 0.2 },
  ];
  const geometries = decals.map((decal) => {
    const geometry = planeGeometry(1, 1);
    const transform = new THREE.Object3D();
    transform.position.set(decal.x, 0.0065, decal.z);
    transform.rotation.set(-Math.PI / 2, 0, decal.rot);
    transform.scale.set(decal.w, decal.d, 1);
    transform.updateMatrix();
    geometry.applyMatrix4(transform.matrix);
    return geometry;
  });
  const merged = mergeGeometries(geometries);
  geometries.forEach((geometry) => geometry.dispose());
  const mesh = new THREE.Mesh(merged, materials.puddle);
  mesh.name = 'garbage-puddle';
  mesh.receiveShadow = true;
  mesh.renderOrder = 2;
  root.add(mesh);
  return mesh;
}

/* --- Dirty plaster shell ------------------------------------------ */

function buildShell(builder) {
  const H = ROOM.height;

  addPlane(builder, 'wallPaint', ROOM.width, H, trs(0, H / 2, -HALF_D));
  const openL = DOOR.centerX - DOOR.width / 2;
  const openR = DOOR.centerX + DOOR.width / 2;
  const westW = openL + HALF_W;
  const eastW = HALF_W - openR;
  addPlane(builder, 'wallPaint', westW, H, trs(-HALF_W + westW / 2, H / 2, HALF_D, Math.PI));
  addPlane(builder, 'wallPaint', eastW, H, trs(openR + eastW / 2, H / 2, HALF_D, Math.PI));
  addPlane(
    builder,
    'wallPaint',
    DOOR.width,
    H - DOOR.height,
    trs(DOOR.centerX, DOOR.height + (H - DOOR.height) / 2, HALF_D, Math.PI),
  );
  addPlane(builder, 'wallPaint', ROOM.depth, H, trs(HALF_W, H / 2, 0, -Math.PI / 2));
  addPlane(builder, 'wallPaint', ROOM.depth, H, trs(-HALF_W, H / 2, 0, Math.PI / 2));

  // Painted soffit.
  addPlane(builder, 'ceilingPaint', ROOM.width, ROOM.depth, trs(0, H, 0, 0, 1, 1, 1, Math.PI / 2), 2.0, {
    receive: true,
  });

  // A shallow shadow line at the wall/ceiling junction.
  const nib = 0.04;
  addBox(builder, 'wallPaintDark', ROOM.width, nib, 0.02, 0, H - nib / 2, -HALF_D + 0.011, 0, { cast: false });
  addBox(builder, 'wallPaintDark', ROOM.width, nib, 0.02, 0, H - nib / 2, HALF_D - 0.011, 0, { cast: false });
  addBox(builder, 'wallPaintDark', 0.02, nib, ROOM.depth, -HALF_W + 0.011, H - nib / 2, 0, 0, { cast: false });
  addBox(builder, 'wallPaintDark', 0.02, nib, ROOM.depth, HALF_W - 0.011, H - nib / 2, 0, 0, { cast: false });

  // Door reveal: the wall is 0.24 m thick, so the opening reads as a real
  // hole rather than a slit in a card.
  const revealD = ROOM.wallThickness;
  addBox(builder, 'wallPaintDark', 0.06, DOOR.height, revealD, openL - 0.03, DOOR.height / 2, HALF_D + revealD / 2, 0, {
    cast: false,
  });
  addBox(builder, 'wallPaintDark', 0.06, DOOR.height, revealD, openR + 0.03, DOOR.height / 2, HALF_D + revealD / 2, 0, {
    cast: false,
  });
  addBox(builder, 'wallPaintDark', DOOR.width + 0.12, 0.06, revealD, DOOR.centerX, DOOR.height + 0.03, HALF_D + revealD / 2, 0, {
    cast: false,
  });

  // A low cast-iron vent on the west wall, its slots packed with dust.
  addBox(builder, 'rust', 0.018, 0.26, 0.38, -HALF_W + 0.01, 0.46, 1.14, 0, { cast: false });
  addBox(builder, 'wallPaintDark', 0.006, 0.2, 0.32, -HALF_W + 0.021, 0.46, 1.14, 0, { cast: false });
  for (let i = 0; i < 6; i += 1) {
    addBox(builder, 'steelDark', 0.009, 0.014, 0.3, -HALF_W + 0.026, 0.39 + i * 0.026, 1.14, 0, { cast: false });
  }
  for (const sy of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addCyl(builder, 'rust', 0.006, 0.006, 0.006, 6, -HALF_W + 0.022, 0.46 + sy * 0.11, 1.14 + sz * 0.16, {
        rz: Math.PI / 2,
        cast: false,
      });
    }
  }
}

/* --- Black-brown timber door -------------------------------------- */

function buildDoorFrame(builder) {
  const { centerX, width, height, wallZ } = DOOR;
  const half = width / 2;
  const z = wallZ - 0.02;

  // Stained oak architrave.
  addBox(builder, 'woodDark', 0.07, height + 0.09, 0.034, centerX - half - 0.035, (height + 0.09) / 2, z);
  addBox(builder, 'woodDark', 0.07, height + 0.09, 0.034, centerX + half + 0.035, (height + 0.09) / 2, z);
  addBox(builder, 'woodDark', width + 0.14, 0.08, 0.034, centerX, height + 0.04, z);
  // Inner jamb lining.
  addBox(builder, 'woodDoorInset', 0.03, height, 0.2, centerX - half + 0.015, height / 2, z + 0.02, 0, { cast: false });
  addBox(builder, 'woodDoorInset', 0.03, height, 0.2, centerX + half - 0.015, height / 2, z + 0.02, 0, { cast: false });
  addBox(builder, 'woodDoorInset', width, 0.03, 0.2, centerX, height - 0.015, z + 0.02, 0, { cast: false });
  // Threshold stone and a worn brass strip.
  addBox(builder, 'wallPaintDark', width + 0.12, 0.02, 0.2, centerX, 0.01, wallZ + 0.06, 0, { cast: false });
  addBox(builder, 'brass', width - 0.06, 0.006, 0.04, centerX, 0.022, wallZ + 0.015, 0, { cast: false });
  // Screws in the architrave.
  for (let i = 0; i < 5; i += 1) {
    for (const side of [-1, 1]) {
      addCyl(
        builder,
        'brass',
        0.006,
        0.006,
        0.004,
        6,
        centerX + side * (half + 0.035),
        0.28 + i * 0.4,
        z - 0.018,
        { rx: Math.PI / 2, cast: false },
      );
    }
  }
  // A dark back panel behind the leaf: the corridor is not modelled, and
  // no void may show through the gap.
  addBox(builder, 'binTrim', width + 0.02, height + 0.02, 0.02, centerX, height / 2, wallZ + 0.16, 0, {
    cast: false,
    receive: false,
  });
}

function buildDoorLeaf(materials) {
  const group = new THREE.Group();
  group.name = 'garbage-door-leaf';
  const builder = new StaticBuilder();
  const { centerX, leafWidth, leafHeight, leafThickness, leafZ } = DOOR;
  const half = leafWidth / 2;
  const halfT = leafThickness / 2;
  const y0 = 0.018;
  const yc = y0 + leafHeight / 2;
  const faceRoom = leafZ - halfT;

  // Leaf core.
  addBox(builder, 'woodDoor', leafWidth, leafHeight, leafThickness, centerX, yc, leafZ);

  // Six recessed panels: applied mouldings around darker insets.
  const panelW = 0.34;
  const panelH = 0.5;
  for (const px of [centerX - 0.235, centerX + 0.235]) {
    for (const py of [0.42, 1.04, 1.66]) {
      addBox(builder, 'woodDoorInset', panelW, panelH, 0.008, px, py, faceRoom - 0.002, 0, { cast: false });
      // Raised moulding: two vertical and two horizontal strips.
      for (const sx of [-1, 1]) {
        addBox(builder, 'woodDoor', 0.028, panelH + 0.056, 0.012, px + sx * (panelW / 2 + 0.014), py, faceRoom - 0.006, 0, {
          cast: false,
        });
      }
      for (const sy of [-1, 1]) {
        addBox(builder, 'woodDoor', panelW + 0.056, 0.028, 0.012, px, py + sy * (panelH / 2 + 0.014), faceRoom - 0.006, 0, {
          cast: false,
        });
      }
      // A darker shadow line inside the moulding.
      addBox(builder, 'binTrim', panelW + 0.008, 0.006, 0.004, px, py + panelH / 2 - 0.006, faceRoom - 0.011, 0, {
        cast: false,
      });
    }
  }

  // Bottom kick plate: scuffed brass.
  addBox(builder, 'brass', leafWidth - 0.16, 0.16, 0.008, centerX, 0.13, faceRoom - 0.004, 0, { cast: false });
  for (let i = 0; i < 5; i += 1) {
    addCyl(builder, 'steelDark', 0.007, 0.007, 0.004, 6, centerX - 0.32 + i * 0.16, 0.13, faceRoom - 0.012, {
      rx: Math.PI / 2,
      cast: false,
    });
  }

  // Hinges on the west edge.
  for (const y of [0.34, 1.05, 1.76]) {
    addCyl(builder, 'brass', 0.018, 0.018, 0.12, 10, centerX - half - 0.004, y, leafZ, { cast: false });
    addBox(builder, 'brass', 0.08, 0.07, 0.014, centerX - half + 0.04, y, faceRoom - 0.004, 0, { cast: false });
    addBox(builder, 'brass', 0.08, 0.07, 0.014, centerX - half + 0.04, y, leafZ + halfT + 0.004, 0, { cast: false });
  }

  // Lever handle, backplate, escutcheon and a peephole.
  const handleX = centerX + half - 0.11;
  addBox(builder, 'brass', 0.06, 0.2, 0.014, handleX, 1.03, faceRoom - 0.008, 0, { cast: false });
  addBox(builder, 'brass', 0.045, 0.045, 0.016, handleX, 1.09, faceRoom - 0.02, 0, { cast: false });
  addCyl(builder, 'brass', 0.014, 0.014, 0.09, 10, handleX - 0.06, 1.09, faceRoom - 0.055, { rx: 0, rz: Math.PI / 2, cast: false });
  addCyl(builder, 'brass', 0.014, 0.014, 0.05, 10, handleX - 0.105, 1.09, faceRoom - 0.08, { rx: Math.PI / 2, cast: false });
  addCyl(builder, 'steelDark', 0.022, 0.022, 0.012, 12, handleX, 0.94, faceRoom - 0.008, { rx: Math.PI / 2, cast: false });
  addBox(builder, 'steelDark', 0.008, 0.026, 0.006, handleX, 0.94, faceRoom - 0.016, 0, { cast: false });
  addCyl(builder, 'brass', 0.022, 0.022, 0.012, 14, centerX + 0.02, 1.58, faceRoom - 0.008, { rx: Math.PI / 2, cast: false });
  addCyl(builder, 'cameraLens', 0.011, 0.011, 0.004, 10, centerX + 0.02, 1.58, faceRoom - 0.014, { rx: Math.PI / 2, cast: false });
  // Chain and a small brass slide bolt at the top.
  addCyl(builder, 'steelDark', 0.006, 0.006, 0.18, 6, centerX - 0.18, 1.86, faceRoom - 0.02, { rx: Math.PI / 2, cast: false });
  addBox(builder, 'brass', 0.1, 0.035, 0.018, centerX - 0.18, 1.95, faceRoom - 0.012, 0, { cast: false });

  builder.flush(group, materials, 'garbage-door-leaf');
  group.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = true;
  });

  // A cold strip of corridor light under the leaf.
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xa9c3b8,
    transparent: true,
    opacity: 0.26,
    toneMapped: false,
    depthWrite: false,
  });
  const underlight = new THREE.Mesh(planeGeometry(leafWidth - 0.12, 0.07), glowMaterial);
  underlight.name = 'garbage-door-underlight';
  underlight.rotation.x = -Math.PI / 2;
  underlight.position.set(centerX, 0.004, DOOR.wallZ - 0.07);
  underlight.renderOrder = 3;
  group.add(underlight);
  return { group, underlight, underlightMaterial: glowMaterial };
}

/* --- Warning sign ------------------------------------------------- */

function buildSign(builder) {
  const { x, y, z, width, height, tilt, screws } = SIGN;

  // The plate is a single alpha-cut plane, so the torn edge is real.
  builder.add('warningSign', planeGeometry(width, height), trs(x, y, z, Math.PI, 1, 1, 1, 0, tilt), {
    cast: false,
    receive: true,
  });
  // Four rusty screws, just proud of the plate.
  for (const [sx, sy] of screws) {
    addCyl(builder, 'rust', 0.008, 0.008, 0.006, 8, x + sx, y + sy, z - 0.004, { rx: Math.PI / 2, cast: false });
  }
}

/* --- Ceiling services --------------------------------------------- */

function buildCeilingServices(builder) {
  const H = ROOM.height;

  // Main pendant: flex, socket, green enamel shade, tungsten bulb.
  const main = LAMPS.main;
  const cordLength = H - main.shadeY - 0.02;
  addCyl(builder, 'cordRubber', 0.005, 0.005, cordLength, 6, main.x, main.shadeY + 0.02 + cordLength / 2, main.z, {
    cast: false,
  });
  addCyl(builder, 'junctionBox', 0.04, 0.04, 0.018, 12, main.x, H - 0.01, main.z, { cast: false });
  addCyl(builder, 'shadeMetal', 0.052, 0.17, 0.1, 22, main.x, main.shadeY, main.z, { cast: false });
  builder.add(
    'shadeInner',
    cylinderGeometry(0.05, 0.165, 0.094, 22, true),
    trs(main.x, main.shadeY - 0.003, main.z),
    { cast: false, receive: false },
  );
  addCyl(builder, 'steelDark', 0.02, 0.02, 0.05, 12, main.x, main.shadeY - 0.062, main.z, { cast: false });
  builder.add(
    'bulbGlass',
    new THREE.SphereGeometry(0.045, 14, 10),
    trs(main.x, main.y, main.z, 0, 1, 1.15, 1),
    { cast: false, receive: false },
  );
  addCyl(builder, 'steelDark', 0.018, 0.02, 0.03, 10, main.x, main.y + 0.05, main.z, { cast: false });

  // Door pendant: a bare bulb inside a wire cage.
  const door = LAMPS.door;
  addCyl(builder, 'cordRubber', 0.005, 0.005, H - door.y - 0.01, 6, door.x, (H + door.y) / 2 - 0.005, door.z, {
    cast: false,
  });
  addCyl(builder, 'junctionBox', 0.035, 0.035, 0.016, 10, door.x, H - 0.008, door.z, { cast: false });
  builder.add(
    'bulbGlass',
    new THREE.SphereGeometry(0.04, 12, 9),
    trs(door.x, door.y, door.z, 0, 1, 1.2, 1),
    { cast: false, receive: false },
  );
  addCyl(builder, 'steelDark', 0.018, 0.02, 0.03, 10, door.x, door.y + 0.048, door.z, { cast: false });
  // Cage: top and bottom rings plus four bent ribs.
  for (const y of [door.y - 0.058, door.y + 0.055]) {
    builder.add('steelDark', torusGeometry(0.066, 0.004, 4, 16), trs(door.x, y, door.z, 0, 1, 1, 1, Math.PI / 2), {
      cast: false,
    });
  }
  for (let i = 0; i < 4; i += 1) {
    const angle = (i / 4) * Math.PI * 2;
    addTube(
      builder,
      'steelDark',
      [
        [door.x + Math.cos(angle) * 0.066, door.y + 0.055, door.z + Math.sin(angle) * 0.066],
        [door.x + Math.cos(angle) * 0.082, door.y, door.z + Math.sin(angle) * 0.082],
        [door.x + Math.cos(angle) * 0.066, door.y - 0.058, door.z + Math.sin(angle) * 0.066],
      ],
      0.0035,
      10,
      5,
      { cast: false },
    );
  }

  // Flickering batten above the rack: housing, diffuser, end caps, two
  // drop rods to the slab.
  const flick = LAMPS.flicker;
  addBox(builder, 'steelDark', flick.length, 0.055, 0.16, flick.x, flick.y, flick.z, 0, { cast: false });
  addBox(builder, 'junctionBox', flick.length - 0.12, 0.03, 0.12, flick.x, flick.y - 0.04, flick.z, 0, { cast: false });
  addBox(builder, 'fluorescentLens', flick.length - 0.16, 0.016, 0.075, flick.x, flick.y - 0.062, flick.z, 0, {
    cast: false,
    receive: false,
  });
  for (const sx of [-1, 1]) {
    addBox(builder, 'steelDark', 0.05, 0.06, 0.14, flick.x + sx * (flick.length / 2 - 0.02), flick.y - 0.002, flick.z, 0, {
      cast: false,
    });
  }
  for (const sx of [-0.42, 0.42]) {
    addCyl(builder, 'conduitMetal', 0.006, 0.006, H - flick.y, 6, flick.x + sx, (H + flick.y) / 2, flick.z, { cast: false });
    addCyl(builder, 'steelDark', 0.014, 0.014, 0.012, 8, flick.x + sx, H - 0.006, flick.z, { cast: false });
  }

  // Dead batten above the bins: one hanger snapped, the tube dark and
  // cracked, the whole fitting tipped a few degrees. Static, so it is
  // folded into the room batches with its tilt baked in.
  const dead = LAMPS.dead;
  const deadBuilder = new StaticBuilder();
  addBox(deadBuilder, 'steelDark', 0.1, 0.045, dead.length, 0, 0, 0, 0, { cast: false });
  addBox(deadBuilder, 'junctionBox', 0.08, 0.026, dead.length - 0.12, 0, -0.035, 0, 0, { cast: false });
  addBox(deadBuilder, 'deadLens', 0.055, 0.012, dead.length - 0.2, 0, -0.052, -0.03, 0, { cast: false });
  addBox(deadBuilder, 'deadLens', 0.055, 0.012, 0.1, 0, -0.052, dead.length / 2 - 0.14, 0.8, { cast: false });
  for (const sz of [-1, 1]) {
    addBox(deadBuilder, 'steelDark', 0.09, 0.05, 0.045, 0, -0.002, sz * (dead.length / 2 - 0.02), 0, { cast: false });
  }
  // The snapped hanger swings free from the north end.
  addCyl(deadBuilder, 'cordRubber', 0.004, 0.004, 0.26, 6, 0, -0.16, -dead.length / 2 + 0.1, { cast: false });
  addCyl(deadBuilder, 'steelDark', 0.018, 0.02, 0.03, 8, 0, -0.28, -dead.length / 2 + 0.1, { cast: false });
  const deadMatrix = new THREE.Matrix4().compose(
    new THREE.Vector3(dead.x, dead.y, dead.z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0.07, 0, 0)),
    new THREE.Vector3(1, 1, 1),
  );
  transferBuckets(deadBuilder, builder, deadMatrix);
}

/* --- CCTV corner: bracket, camera, monitor stack ------------------ */

function buildCamera(builder, materials, root) {
  const { x, y, z, yaw, pitch } = CAMERA;

  // A corner bracket: plate on the north wall, arm into the room, drop
  // tube and a swivel collar. Static, so it joins the room batches.
  addBox(builder, 'steelDark', 0.16, 0.16, 0.018, x, y + 0.16, -HALF_D + 0.012, 0, { cast: false });
  addBox(builder, 'steelDark', 0.04, 0.04, 0.28, x, y + 0.23, -HALF_D + 0.14, 0, { cast: false });
  addCyl(builder, 'steelDark', 0.018, 0.018, 0.22, 8, x, y + 0.14, -HALF_D + 0.27, { cast: false });
  addCyl(builder, 'steelPolished', 0.026, 0.026, 0.05, 10, x, y + 0.04, z + 0.05, { cast: false });

  const head = new THREE.Group();
  head.name = 'garbage-camera-head';
  head.position.set(x, y, z);
  head.rotation.set(pitch, yaw, 0, 'YXZ');
  const local = new StaticBuilder();
  const add = (key, geometry, matrix, options = {}) =>
    local.add(key, geometry, matrix, { cast: false, receive: true, ...options });

  add('cameraPlastic', roundedBoxGeometry(0.095, 0.085, 0.2, 0.015, 3), trs(0, 0, 0.02));
  add('cameraShade', boxGeometry(0.105, 0.014, 0.218), trs(0, 0.05, 0.02));
  add('cameraShade', boxGeometry(0.085, 0.045, 0.03), trs(0, 0.024, -0.086));
  add('cameraPlastic', cylinderGeometry(0.038, 0.042, 0.032, 16), trs(0, 0, -0.088, 0, 1, 1, 1, Math.PI / 2, 0));
  add('cameraLens', cylinderGeometry(0.03, 0.03, 0.008, 16), trs(0, 0, -0.106, 0, 1, 1, 1, Math.PI / 2, 0), {
    receive: false,
  });
  add('steelDark', cylinderGeometry(0.033, 0.033, 0.006, 16), trs(0, 0, -0.101, 0, 1, 1, 1, Math.PI / 2, 0));
  add('steelDark', boxGeometry(0.038, 0.03, 0.055), trs(0, -0.055, 0.04));
  add('ledRed', cylinderGeometry(0.008, 0.008, 0.006, 8), trs(0.031, -0.024, -0.086, 0, 1, 1, 1, Math.PI / 2, 0), {
    receive: false,
  });
  add('ledGreen', cylinderGeometry(0.005, 0.005, 0.004, 8), trs(-0.031, 0.022, -0.088, 0, 1, 1, 1, Math.PI / 2, 0), {
    receive: false,
  });
  add(
    'cordRubber',
    tubeGeometry(
      [
        [-0.02, 0.045, 0.1],
        [-0.035, 0.115, 0.17],
        [0.02, 0.18, 0.2],
      ],
      0.007,
      12,
      5,
    ),
    trs(0, 0, 0),
  );
  local.flush(head, materials, 'garbage-camera-casing');
  head.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = true;
  });
  root.add(head);
  return head;
}

function buildMonitors(materials, root, textures) {
  const result = { groups: [], screens: [], leds: [] };

  const makeMonitor = (spec, screenMaterial, wallOffset, isCrt) => {
    const group = new THREE.Group();
    group.name = 'garbage-monitor';
    group.position.set(spec.x, spec.y, spec.z);
    group.rotation.y = Math.PI + spec.yaw;
    const builder = new StaticBuilder();
    const w = spec.width;
    const h = spec.height;
    const d = spec.depth;

    if (isCrt) {
      // CRT shell, bezel, controls, vents and a swollen glass face.
      builder.add('crtPlastic', roundedBoxGeometry(w, h, d * 0.72, 0.03, 3), trs(0, 0, d * 0.05));
      builder.add('crtDark', boxGeometry(w - 0.03, h - 0.03, 0.02), trs(0, 0, -d * 0.33));
      builder.add('crtPlastic', boxGeometry(w - 0.06, h - 0.07, 0.014), trs(0, 0.006, -d * 0.337));
      // Control strip with knobs and a power dot.
      builder.add('crtDark', boxGeometry(w - 0.16, 0.035, 0.012), trs(0, -h / 2 + 0.028, -d * 0.34));
      for (const sx of [-0.035, 0.005]) {
        addCyl(builder, 'steelDark', 0.011, 0.011, 0.014, 8, sx, -h / 2 + 0.028, -d * 0.348, {
          rx: Math.PI / 2,
          cast: false,
        });
      }
      addCyl(builder, 'crtLed', 0.005, 0.005, 0.004, 8, w / 2 - 0.05, -h / 2 + 0.028, -d * 0.348, {
        rx: Math.PI / 2,
        receive: false,
      });
      // Rear bulge, vents and a brand-free label plate.
      builder.add('crtPlastic', roundedBoxGeometry(w * 0.62, h * 0.62, d * 0.3, 0.02, 2), trs(0, -0.02, d * 0.36));
      for (let i = 0; i < 6; i += 1) {
        builder.add('crtDark', boxGeometry(w * 0.5, 0.006, 0.012), trs(0, h / 2 - 0.035 + i * 0.012, d * 0.28));
      }
      builder.add('labelPaper', boxGeometry(0.07, 0.026, 0.003), trs(-w / 2 + 0.09, -0.02, -d * 0.345), {
        cast: false,
      });
      // Tilt foot.
      builder.add('steelDark', boxGeometry(w * 0.5, 0.02, 0.1), trs(0, -h / 2 - 0.008, -d * 0.1));
    } else {
      // Flat panel on a short arm.
      builder.add('crtDark', roundedBoxGeometry(w, h, d, 0.012, 2), trs(0, 0, 0));
      builder.add('crtLed', boxGeometry(0.012, 0.006, 0.004), trs(w / 2 - 0.03, -h / 2 + 0.016, -d / 2 - 0.004), {
        receive: false,
      });
      builder.add('steelDark', cylinderGeometry(0.012, 0.012, 0.12, 8), trs(0, -h / 2 - 0.06, 0.02, 0, 1, 1, 1, 0, 0));
    }

    builder.flush(group, materials, 'garbage-monitor-static');
    // Screen plane gets the live feed material (static builder skips it).
    const screen = new THREE.Mesh(
      isCrt ? crtScreenGeometry(w - 0.1, h - 0.12, 0.014) : planeGeometry(w - 0.04, h - 0.035),
      screenMaterial,
    );
    screen.name = 'garbage-monitor-screen';
    if (isCrt) {
      screen.rotation.y = Math.PI;
      screen.position.set(0, 0.012, -d * 0.345);
    } else {
      screen.rotation.y = Math.PI;
      screen.position.set(0, 0.002, -d / 2 - 0.001);
    }
    group.add(screen);
    result.screens.push(screen);

    // Mounting arm back to the north wall.
    const arm = new StaticBuilder();
    addBox(arm, 'steelDark', 0.04, 0.04, wallOffset, 0, -h / 2 + 0.02, wallOffset / 2 + d * 0.2);
    addBox(arm, 'steelDark', 0.16, 0.14, 0.014, 0, -h / 2 + 0.02, wallOffset + d * 0.2);
    arm.flush(group, materials, 'garbage-monitor-arm');

    group.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = false;
      object.receiveShadow = true;
    });
    root.add(group);
    result.groups.push(group);
    return group;
  };

  makeMonitor(MONITOR.crt, materials.crtFeed, 0.1, true);
  makeMonitor(MONITOR.small, materials.crtFeedSmall, 0.08, false);

  // Recorder deck under the screens: a dark box, LED strip, cable loop.
  const recorder = new THREE.Group();
  recorder.name = 'garbage-recorder';
  recorder.position.set(MONITOR.recorder.x, MONITOR.recorder.y, MONITOR.recorder.z);
  recorder.rotation.y = Math.PI + MONITOR.recorder.yaw;
  const recBuilder = new StaticBuilder();
  addBox(recBuilder, 'crtDark', MONITOR.recorder.width, MONITOR.recorder.height, MONITOR.recorder.depth, 0, 0, 0);
  addBox(recBuilder, 'crtPlastic', 0.09, 0.02, 0.004, -0.06, 0.018, -MONITOR.recorder.depth / 2 - 0.002, 0, { cast: false });
  addCyl(recBuilder, 'ledRed', 0.005, 0.005, 0.004, 8, 0.11, 0.024, -MONITOR.recorder.depth / 2 - 0.003, {
    rx: Math.PI / 2,
    receive: false,
  });
  addCyl(recBuilder, 'ledGreen', 0.004, 0.004, 0.004, 8, 0.13, 0.024, -MONITOR.recorder.depth / 2 - 0.003, {
    rx: Math.PI / 2,
    receive: false,
  });
  for (let i = 0; i < 5; i += 1) {
    addBox(recBuilder, 'crtDark', 0.026, 0.004, 0.002, -0.1 + i * 0.035, -0.03, -MONITOR.recorder.depth / 2 - 0.002, 0, {
      cast: false,
    });
  }
  recBuilder.flush(recorder, materials, 'garbage-recorder-static');
  recorder.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = false;
  });
  root.add(recorder);

  // Loose cable loops from the recorder and camera down the wall.
  const cableBuilder = new StaticBuilder();
  for (const offset of [-0.05, 0.06]) {
    addTube(
      cableBuilder,
      'cordRubber',
      [
        [MONITOR.recorder.x + offset, MONITOR.recorder.y - 0.05, MONITOR.recorder.z + 0.1],
        [MONITOR.recorder.x + offset + 0.08, MONITOR.recorder.y - 0.16, -HALF_D + 0.1],
        [MONITOR.recorder.x + offset + 0.1, 1.2, -HALF_D + 0.06],
        [MONITOR.recorder.x + offset + 0.14, 0.8, -HALF_D + 0.05],
      ],
      0.007,
      18,
      5,
    );
  }
  addBox(cableBuilder, 'junctionBox', 0.22, 0.16, 0.08, MONITOR.recorder.x - 0.2, 1.26, -HALF_D + 0.05, 0, { cast: false });
  cableBuilder.flush(root, materials, 'garbage-cables');

  return result;
}

/* --- Rusty wire mesh and cobwebs --------------------------------- */

function buildMeshPanels(builder) {
  for (const panel of MESH.panels) {
    const { x, z, size, ry, sag, cols, rows } = panel;
    const dirX = x < 0 ? 1 : -1;
    const dirZ = z < 0 ? 1 : -1;
    const cos = Math.cos(ry);
    const sin = Math.sin(ry);
    const height = ROOM.height - 0.018;
    const point = (u, v) => {
      const lx = dirX * u * size;
      const lz = dirZ * v * size;
      const px = x + lx * cos - lz * sin;
      const pz = z + lx * sin + lz * cos;
      const y = height - sag * Math.sin(Math.PI * u) * Math.sin(Math.PI * v) - 0.004;
      return [px, y, pz];
    };
    for (let i = 0; i <= cols; i += 1) {
      const u = i / cols;
      const points = [];
      for (let j = 0; j <= rows; j += 1) points.push(point(u, j / rows));
      addTube(builder, 'wireMesh', points, 0.0035, rows * 2, 4, { cast: false });
    }
    for (let j = 0; j <= rows; j += 1) {
      const v = j / rows;
      const points = [];
      for (let i = 0; i <= cols; i += 1) points.push(point(i / cols, v));
      addTube(builder, 'wireMesh', points, 0.0035, cols * 2, 4, { cast: false });
    }
    // Sagging tie wires and a few loose ends hanging from the edge.
    for (let i = 0; i < 4; i += 1) {
      const u = 0.18 + i * 0.22;
      const start = point(u, 0.04);
      const end = point(u, 0.96);
      addTube(
        builder,
        'wireMesh',
        [
          start,
          [(start[0] + end[0]) / 2, start[1] - sag * 1.4, (start[2] + end[2]) / 2],
          end,
        ],
        0.0026,
        8,
        4,
        { cast: false },
      );
    }
    const rng = mulberry32(0x51a3 + Math.round(x * 10) + Math.round(z * 7));
    for (let i = 0; i < 5; i += 1) {
      const u = 0.2 + rng() * 0.7;
      const v = 0.9;
      const start = point(u, v);
      addTube(
        builder,
        'wireMesh',
        [
          start,
          [start[0] + (rng() - 0.5) * 0.16, start[1] - 0.2 - rng() * 0.3, start[2] + (rng() - 0.5) * 0.16],
          [start[0] + (rng() - 0.5) * 0.24, start[1] - 0.34 - rng() * 0.36, start[2] + (rng() - 0.5) * 0.24],
        ],
        0.0022,
        8,
        4,
        { cast: false },
      );
    }
  }
}

function buildWebs(builder) {
  const corners = [
    { x: -HALF_W + 0.03, z: -HALF_D + 0.03, dx: 1, dz: 1, size: 1.0, threads: 7 },
    { x: HALF_W - 0.03, z: -HALF_D + 0.03, dx: -1, dz: 1, size: 0.82, threads: 6 },
    { x: HALF_W - 0.04, z: HALF_D - 0.04, dx: -1, dz: -1, size: 0.9, threads: 6 },
    { x: -HALF_W + 0.04, z: HALF_D - 0.04, dx: 1, dz: -1, size: 0.72, threads: 5 },
  ];
  const rng = mulberry32(0x33c0);
  for (const corner of corners) {
    const { x, z, dx, dz, size, threads } = corner;
    const anchor = [x + dx * 0.02, ROOM.height - 0.03, z + dz * 0.02];
    const ends = [];
    for (let i = 0; i < threads; i += 1) {
      const t = (i + 1) / (threads + 1);
      // Alternate threads along the two walls that form the corner.
      const onXWall = i % 2 === 0;
      const end = onXWall
        ? [x + dx * size * t, ROOM.height - 0.02 - rng() * 0.05, z + dz * 0.03]
        : [x + dx * 0.03, ROOM.height - 0.02 - rng() * 0.05, z + dz * size * t];
      ends.push(end);
      addTube(builder, 'webThread', [anchor, end], 0.0017, 3, 3, { cast: false, receive: false });
    }
    // Two arcs across the fan, sagging toward the corner.
    for (const level of [0.45, 0.78]) {
      const points = [];
      for (let i = 0; i <= 4; i += 1) {
        const t = i / 4;
        const a = ends[Math.floor(t * (threads - 1))];
        const b = ends[Math.ceil(t * (threads - 1))];
        points.push([
          (a[0] + b[0]) / 2 + dx * 0.012,
          ROOM.height - 0.06 - (1 - level) * 0.3 - (i % 2) * 0.012,
          (a[2] + b[2]) / 2 + dz * 0.012,
        ]);
      }
      addTube(builder, 'webThread', points, 0.0014, 8, 3, { cast: false, receive: false });
    }
  }
  // A dense little web over the monitor corner and one in the door head.
  for (const [cx, cy, cz, radius, count] of [
    [MONITOR.crt.x - 0.12, MONITOR.crt.y + 0.22, -HALF_D + 0.02, 0.34, 6],
    [DOOR.centerX - 0.42, DOOR.height + 0.03, HALF_D - 0.02, 0.26, 5],
  ]) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.PI + (i / (count - 1)) * Math.PI * 0.7;
      addTube(
        builder,
        'webThread',
        [
          [cx, cy, cz],
          [cx + Math.cos(angle) * radius, cy - 0.16 - rng() * 0.24, cz + Math.sin(angle) * radius * 0.4],
        ],
        0.0015,
        3,
        3,
        { cast: false, receive: false },
      );
    }
  }
  CONTENT_COUNTS.webs += corners.length + 2;
}

/* --- Conduit, pipe, switch and small fittings --------------------- */

function buildWallServices(builder) {
  const H = ROOM.height;
  const conduitY = WALL.conduitY;

  // Conduit loop from the switch up the south wall, across to the pendant
  // and on to the flickering batten.
  addCyl(builder, 'conduitMetal', 0.015, 0.015, conduitY - 1.36, 8, SWITCH.x, (conduitY + 1.36) / 2, HALF_D - 0.03, {
    cast: false,
  });
  addBox(builder, 'junctionBox', 0.07, 0.09, 0.06, SWITCH.x, 1.42, HALF_D - 0.035, 0, { cast: false });
  addCyl(builder, 'conduitMetal', 0.015, 0.015, HALF_W * 2 - 0.2, 8, 0, conduitY, HALF_D - 0.03, {
    rz: Math.PI / 2,
    cast: false,
  });
  addCyl(builder, 'conduitMetal', 0.015, 0.015, ROOM.depth - 0.12, 8, 0.06, conduitY, 0, {
    rx: Math.PI / 2,
    cast: false,
  });
  addBox(builder, 'junctionBox', 0.08, 0.08, 0.08, 0.06, conduitY, 0.6, 0, { cast: false });
  for (const z of [-2.2, -0.8, 0.4, 1.6]) {
    addBox(builder, 'steelDark', 0.05, 0.05, 0.02, 0.06, conduitY, z, 0, { cast: false });
  }

  // Rusted water pipe along the north wall with a gate valve.
  addCyl(builder, 'rust', 0.032, 0.032, ROOM.width - 0.6, 10, 0, WALL.pipeY, -HALF_D + 0.08, {
    rz: Math.PI / 2,
    cast: false,
  });
  for (const x of [-1.5, -0.4, 0.7, 1.7]) {
    addBox(builder, 'steelDark', 0.055, 0.1, 0.05, x, WALL.pipeY + 0.02, -HALF_D + 0.04, 0, { cast: false });
  }
  const valveX = 1.28;
  addCyl(builder, 'rust', 0.048, 0.048, 0.075, 10, valveX, WALL.pipeY + 0.02, -HALF_D + 0.08, { cast: false });
  addCyl(builder, 'brass', 0.014, 0.014, 0.1, 8, valveX, WALL.pipeY + 0.06, -HALF_D + 0.08, {
    rz: Math.PI / 2,
    cast: false,
  });
  builder.add('paintRed', new THREE.TorusGeometry(0.08, 0.01, 6, 18), trs(valveX, WALL.pipeY + 0.06, -HALF_D + 0.13), {
    cast: false,
  });
  for (let i = 0; i < 3; i += 1) {
    const angle = (i / 3) * Math.PI;
    builder.add(
      'paintRed',
      boxGeometry(0.16, 0.008, 0.01),
      trs(valveX, WALL.pipeY + 0.06, -HALF_D + 0.13, 0, 1, 1, 1, 0, angle),
      { cast: false },
    );
  }

  // A vertical downpipe in the north-west corner, rusted at the joints.
  addCyl(builder, 'rust', 0.03, 0.034, H, 10, -HALF_W + 0.08, H / 2, -HALF_D + 0.09, { cast: false });
  for (const y of [0.4, 1.2, 2.0, 2.7]) {
    addBox(builder, 'steelDark', 0.07, 0.05, 0.06, -HALF_W + 0.06, y, -HALF_D + 0.09, 0, { cast: false });
  }

  // Sprinkler head on the ceiling near the main pendant.
  addCyl(builder, 'rust', 0.018, 0.014, 0.1, 8, 0.72, H - 0.1, -1.1, { cast: false });
  builder.add('brass', new THREE.SphereGeometry(0.026, 10, 8), trs(0.72, H - 0.16, -1.1), { cast: false });
}

function buildSwitch(materials) {
  const group = new THREE.Group();
  group.name = 'garbage-light-switch';
  group.position.set(SWITCH.x, SWITCH.y, SWITCH.z);
  const builder = new StaticBuilder();
  addBox(builder, 'switchPlate', 0.095, 0.14, 0.016, 0, 0, 0, 0, { cast: false });
  addBox(builder, 'steelDark', 0.032, 0.052, 0.004, 0, 0, -0.009, 0, { cast: false });
  for (const sy of [-0.05, 0.05]) {
    addCyl(builder, 'steelPolished', 0.006, 0.006, 0.003, 8, 0, sy, -0.009, { rx: Math.PI / 2, cast: false });
  }
  builder.flush(group, materials, 'garbage-switch-static');

  const toggle = new THREE.Group();
  toggle.name = 'garbage-switch-toggle';
  const nubBuilder = new StaticBuilder();
  addBox(nubBuilder, 'switchNub', 0.026, 0.048, 0.018, 0, 0, 0.008, 0, { cast: false });
  nubBuilder.flush(toggle, materials, 'garbage-switch-toggle');
  toggle.position.set(0, 0, -0.012);
  group.add(toggle);
  group.traverse((object) => {
    if (object.isMesh) object.castShadow = false;
  });
  return { group, toggle };
}

/* ------------------------------------------------------------------ */

export function buildRoom(builder, materials, root, textures) {
  buildFloor(builder);
  buildShell(builder);
  buildDoorFrame(builder);
  const door = buildDoorLeaf(materials);
  root.add(door.group);
  buildCeilingServices(builder);
  const cameraHead = buildCamera(builder, materials, root);
  const monitors = buildMonitors(materials, root, textures);
  buildSign(builder);
  const switchParts = buildSwitch(materials);
  root.add(switchParts.group);
  buildWallServices(builder);
  buildMeshPanels(builder);
  buildWebs(builder);
  const puddle = buildPuddle(materials, root);
  return {
    doorGroup: door.group,
    doorUnderlight: door.underlight,
    doorUnderlightMaterial: door.underlightMaterial,
    cameraHead,
    monitors,
    switchGroup: switchParts.group,
    switchToggle: switchParts.toggle,
    puddle,
  };
}
