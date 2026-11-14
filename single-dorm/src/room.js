import * as THREE from 'three';
import {
  addBox,
  box,
  cylinder,
  cylinderGeometry,
  group,
  makeCable,
  plane,
  roundedBoxMesh,
  roundedSlabGeometry,
  setShadows,
  sphere,
  UNIT_PLANE,
} from './utils.js';

export const ROOM = Object.freeze({
  width: 4.8,
  depth: 5.6,
  height: 2.8,
  halfWidth: 2.4,
  halfDepth: 2.8,
  wallTile: 1.2,
});

function wallpaperPlane(materials, width, height, position, rotationY) {
  const geometry = new THREE.PlaneGeometry(width, height);
  const uv = geometry.attributes.uv;
  // Metric UVs give the wallpaper a constant 1.2 m repeat everywhere.
  for (let i = 0; i < uv.count; i += 1) {
    uv.setXY(i, uv.getX(i) * (width / ROOM.wallTile), uv.getY(i) * (height / ROOM.wallTile));
  }
  uv.needsUpdate = true;
  const mesh = new THREE.Mesh(geometry, materials.wallpaper);
  mesh.position.set(...position);
  mesh.rotation.y = rotationY;
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  return mesh;
}

function makeBaseboards(materials) {
  const g = group('skirting-boards');
  const h = 0.07;
  const t = 0.016;
  const wallOffset = 0.008;
  const north = box(materials.oak, ROOM.width, h, t, 0, h / 2, -ROOM.halfDepth + wallOffset);
  const southLeft = box(materials.oak, 0.5, h, t, -2.15, h / 2, ROOM.halfDepth - wallOffset);
  const southRight = box(materials.oak, 3.3, h, t, 0.75, h / 2, ROOM.halfDepth - wallOffset);
  const east = box(materials.oak, t, h, ROOM.depth - 0.032, ROOM.halfWidth - wallOffset, h / 2, 0);
  const west = box(materials.oak, t, h, ROOM.depth - 0.032, -ROOM.halfWidth + wallOffset, h / 2, 0);
  g.add(north, southLeft, southRight, east, west);

  // White cornice at the ceiling line. Mouldings butt into one another.
  const cH = 0.052;
  const cT = 0.018;
  const cY = ROOM.height - cH / 2;
  const northC = box(materials.ceiling, ROOM.width, cH, cT, 0, cY, -ROOM.halfDepth + wallOffset);
  const southC = box(materials.ceiling, ROOM.width, cH, cT, 0, cY, ROOM.halfDepth - wallOffset);
  const eastC = box(materials.ceiling, cT, cH, ROOM.depth - 0.036, ROOM.halfWidth - wallOffset, cY, 0);
  const westC = box(materials.ceiling, cT, cH, ROOM.depth - 0.036, -ROOM.halfWidth + wallOffset, cY, 0);
  g.add(northC, southC, eastC, westC);
  return g;
}

function panelMoulding(parent, material, centerX, centerY, width, height, bar, depth, faceZ) {
  const groupMoulding = group('door-moulding');
  const verticalH = height;
  const horizontalW = width - bar * 2;
  groupMoulding.add(
    box(material, bar, verticalH, depth, centerX - width / 2 + bar / 2, centerY, faceZ),
    box(material, bar, verticalH, depth, centerX + width / 2 - bar / 2, centerY, faceZ),
    box(material, horizontalW, bar, depth, centerX, centerY + height / 2 - bar / 2, faceZ),
    box(material, horizontalW, bar, depth, centerX, centerY - height / 2 + bar / 2, faceZ),
  );
  parent.add(groupMoulding);
  return groupMoulding;
}

function buildDoor(materials) {
  const g = group('brown-door-assembly');
  const centerX = -1.35;
  const doorW = 0.92;
  const doorH = 2.08;
  const zWall = ROOM.halfDepth;
  const casingW = 0.07;
  const casingDepth = 0.03;
  const casingFrontZ = zWall - 0.055;
  const leafH = 2.055;

  // Threshold.
  g.add(box(materials.darkWood, doorW + 0.12, 0.018, 0.09, centerX, 0.009, zWall - 0.05));

  // Door leaf.
  const leaf = roundedBoxMesh(materials.doorWood, doorW, leafH, 0.042, 2, 0.008);
  leaf.position.set(centerX, 0.018 + leafH / 2, zWall - 0.025);
  leaf.castShadow = true;
  leaf.receiveShadow = true;
  g.add(leaf);

  // Applied panel mouldings (two tall panels, classic old dormitory door).
  const faceZ = zWall - 0.048;
  panelMoulding(g, materials.darkWood, centerX, 1.55, 0.6, 0.68, 0.02, 0.008, faceZ);
  panelMoulding(g, materials.darkWood, centerX, 0.60, 0.6, 0.66, 0.02, 0.008, faceZ);

  // Casing. Header and sill pieces butt cleanly into the verticals.
  const outerW = doorW + casingW * 2;
  const outerH = doorH + casingW;
  const leftJambX = centerX - doorW / 2 - casingW / 2;
  const rightJambX = centerX + doorW / 2 + casingW / 2;
  g.add(
    box(materials.darkWood, casingW, doorH - 0.15, casingDepth, leftJambX, 0.15 + (doorH - 0.15) / 2, casingFrontZ + casingDepth / 2),
    box(materials.darkWood, casingW, doorH - 0.15, casingDepth, rightJambX, 0.15 + (doorH - 0.15) / 2, casingFrontZ + casingDepth / 2),
    box(materials.darkWood, outerW, casingW, casingDepth, centerX, doorH + casingW / 2, casingFrontZ + casingDepth / 2),
    // A small plinth block on each side of the threshold.
    box(materials.darkWood, casingW + 0.025, 0.15, casingDepth + 0.018, leftJambX, 0.075, casingFrontZ + casingDepth / 2 - 0.005),
    box(materials.darkWood, casingW + 0.025, 0.15, casingDepth + 0.018, rightJambX, 0.075, casingFrontZ + casingDepth / 2 - 0.005),
  );

  // Hinges (left side, as viewed from inside the room).
  for (const y of [0.38, 1.1, 1.84]) {
    const hinge = cylinder(materials.agedBrass, 0.013, 0.013, 0.075, centerX - doorW / 2 + 0.008, y, faceZ + 0.004, {
      segments: 8, cast: false,
    });
    g.add(hinge);
  }

  // Handle rose, lever and a small keyhole escutcheon.
  const handleX = centerX + 0.36;
  const handleY = 1.03;
  const rose = cylinder(materials.brass, 0.034, 0.034, 0.015, handleX, handleY, faceZ - 0.006, {
    rotation: [Math.PI / 2, 0, 0], segments: 16,
  });
  const neck = cylinder(materials.brass, 0.013, 0.013, 0.028, handleX, handleY, faceZ - 0.028, {
    rotation: [Math.PI / 2, 0, 0], segments: 10,
  });
  const lever = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.105, 4, 8), materials.brass);
  lever.position.set(handleX - 0.045, handleY, faceZ - 0.046);
  lever.rotation.z = Math.PI / 2;
  lever.castShadow = false;
  lever.receiveShadow = false;
  const escutcheon = cylinder(materials.brass, 0.022, 0.022, 0.008, handleX, handleY - 0.115, faceZ - 0.004, {
    rotation: [Math.PI / 2, 0, 0], segments: 12,
  });
  const keyhole = box(materials.blackMetal, 0.008, 0.026, 0.01, handleX, handleY - 0.115, faceZ - 0.01, {
    cast: false,
  });
  g.add(rose, neck, lever, escutcheon, keyhole);

  setShadows(g, true, true);
  leaf.castShadow = true;
  return g;
}

function buildWindow(materials) {
  const g = group('sealed-window-assembly');
  const cx = 0.2;
  const zWall = -ROOM.halfDepth;
  const openingW = 1.5;
  const openingH = 1.23;
  const sillY = 0.9;
  const topY = sillY + openingH;

  // A deeply recessed, near-black cavity behind the boards. The thin
  // lines visible between planks should read as cold darkness, not wall.
  const cavityMaterial = new THREE.MeshStandardMaterial({
    color: 0x080a09,
    roughness: 0.96,
    metalness: 0.02,
    envMapIntensity: 0.02,
  });
  const cavity = plane(cavityMaterial, openingW - 0.012, openingH - 0.012, cx, sillY + openingH / 2, zWall + 0.012, {
    receive: false,
  });
  g.add(cavity);

  // Sill, side jambs and header: butt-jointed, no overlapping volumes.
  const caseW = 0.075;
  const caseD = 0.05;
  const outerW = openingW + caseW * 2;
  const caseZ = zWall + 0.047;
  g.add(
    // A heavy sill protrudes into the room and holds the lower casing.
    box(materials.darkWood, outerW + 0.07, 0.055, 0.115, cx, sillY - 0.0275, zWall + 0.062),
    box(materials.darkWood, caseW, openingH, caseD, cx - openingW / 2 - caseW / 2, sillY + openingH / 2, caseZ),
    box(materials.darkWood, caseW, openingH, caseD, cx + openingW / 2 + caseW / 2, sillY + openingH / 2, caseZ),
    box(materials.darkWood, outerW, caseW, caseD, cx, topY + caseW / 2, caseZ),
  );

  // Six rough boards, each a slightly different shade. All ends stay
  // inside the opening so the dark casing remains visible around them.
  const boardMaterials = [materials.rawPlank];
  for (const tint of [0xe2d2c0, 0xc6b29a, 0xd7c5b0, 0xb29e87]) {
    const variant = materials.rawPlank.clone();
    variant.color.setHex(tint);
    variant.roughness = 0.9;
    boardMaterials.push(variant);
  }

  const boardHeights = [0.181, 0.184, 0.179, 0.181, 0.183, 0.18];
  const boardLengths = [1.43, 1.4, 1.44, 1.41, 1.43, 1.4];
  const boardCenters = [1.02, 1.218, 1.416, 1.614, 1.812, 2.01];
  const boardZ = zWall + 0.065;
  const boardMeshes = [];
  for (let i = 0; i < 6; i += 1) {
    const board = box(
      boardMaterials[i % boardMaterials.length],
      boardLengths[i], boardHeights[i], 0.026,
      cx + (i % 2 === 0 ? -0.008 : 0.012),
      boardCenters[i],
      boardZ + (i % 3) * 0.0016,
      { rotation: [0, 0, (i - 2.5) * 0.0028] },
    );
    board.castShadow = true;
    board.receiveShadow = true;
    boardMeshes.push(board);
    g.add(board);
  }


  // A diagonal brace across the middle planks, resting just in front of
  // them. It is an additional layer rather than an intersecting solid.
  const braceLength = 1.5;
  const braceAngle = 0.17;
  const braceCenterX = cx - 0.02;
  const braceCenterY = 1.52;
  const braceZ = zWall + 0.095;
  const diagonalMaterial = materials.rawPlank.clone();
  diagonalMaterial.color.setHex(0xcab49b);
  diagonalMaterial.roughness = 0.96;
  const diagonal = box(
    diagonalMaterial, braceLength, 0.16, 0.026,
    braceCenterX, braceCenterY, braceZ,
    { rotation: [0, 0, braceAngle] },
  );
  diagonal.castShadow = true;
  diagonal.receiveShadow = true;
  g.add(diagonal);

  // Wide, slightly rusty nail heads. One instanced draw call.
  const nailGeometry = new THREE.CylinderGeometry(0.0138, 0.0122, 0.018, 10);
  nailGeometry.rotateX(Math.PI / 2);
  const nailMaterial = materials.iron.clone();
  nailMaterial.color.setHex(0x2a2520);
  nailMaterial.roughness = 0.6;
  nailMaterial.metalness = 0.32;
  const nails = new THREE.InstancedMesh(nailGeometry, nailMaterial, 18);
  const matrix = new THREE.Matrix4();
  let nailIndex = 0;
  for (let row = 0; row < 6; row += 1) {
    const xs = [-0.49, cx + (row % 2 === 0 ? 0.02 : -0.02), 0.9];
    for (let col = 0; col < 3; col += 1) {
      const m = new THREE.Matrix4().makeTranslation(
        xs[col],
        boardCenters[row] + (col === 1 ? 0.035 : -0.04),
        boardZ + 0.019 + (row % 3) * 0.0016,
      );
      matrix.copy(m);
      nails.setMatrixAt(nailIndex, matrix);
      nailIndex += 1;
    }
  }
  nails.instanceMatrix.needsUpdate = true;
  nails.castShadow = false;
  nails.receiveShadow = false;
  g.add(nails);
  const diagonalNails = new THREE.InstancedMesh(nailGeometry, nailMaterial, 3);
  for (let i = 0; i < 3; i += 1) {
    const t = (i - 1) * 0.56;
    const nx = braceCenterX + t * braceLength * 0.5 * Math.cos(braceAngle);
    const ny = braceCenterY + t * braceLength * 0.5 * Math.sin(braceAngle) + 0.035;
    const m = new THREE.Matrix4().makeTranslation(nx, ny, braceZ + 0.019);
    diagonalNails.setMatrixAt(i, m);
  }
  diagonalNails.instanceMatrix.needsUpdate = true;
  diagonalNails.castShadow = false;
  diagonalNails.receiveShadow = false;
  g.add(diagonalNails);


  // The weakest slivers of cold exterior light survive between planks.
  const seamGeometry = new THREE.PlaneGeometry(1.36, 0.0055);
  const seamMaterial = new THREE.MeshBasicMaterial({
    color: 0x9eb9bd,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    toneMapped: false,
  });
  const seams = new THREE.InstancedMesh(seamGeometry, seamMaterial, 5);
  for (let i = 0; i < 5; i += 1) {
    const seamY = (boardCenters[i] + boardCenters[i + 1]) / 2;
    const m = new THREE.Matrix4().makeTranslation(cx, seamY, zWall + 0.048);
    seams.setMatrixAt(i, m);
  }
  seams.instanceMatrix.needsUpdate = true;
  seams.renderOrder = 1;
  seams.castShadow = false;
  g.add(seams);

  // Curtain rod, finials and brackets.
  const rodY = 2.31;
  const rodZ = zWall + 0.21;
  const rodLength = 2.5;
  const rod = cylinder(materials.agedBrass, 0.012, 0.012, rodLength, cx, rodY, rodZ, {
    rotation: [0, 0, Math.PI / 2], segments: 12,
  });
  const finialA = sphere(materials.agedBrass, 0.03, cx - rodLength / 2 - 0.013, rodY, rodZ);
  const finialB = sphere(materials.agedBrass, 0.03, cx + rodLength / 2 + 0.013, rodY, rodZ);
  finialA.scale.y *= 1.22;
  finialB.scale.y *= 1.22;
  g.add(rod, finialA, finialB);

  for (const x of [-0.8, 1.2]) {
    const bracketArm = cylinder(materials.agedBrass, 0.008, 0.008, 0.21, x, rodY - 0.009, zWall + 0.105, {
      rotation: [Math.PI / 2, 0, 0], segments: 8,
    });
    const bracketPlate = cylinder(materials.agedBrass, 0.035, 0.035, 0.012, x, rodY - 0.018, zWall + 0.008, {
      rotation: [Math.PI / 2, 0, 0], segments: 12,
    });
    g.add(bracketArm, bracketPlate);
  }

  // Floor-length curtains with genuinely deep folds. Geometry is
  // generated at load time, then never touched again.
  const curtainHeight = 2.22;
  const curtainWidth = 0.62;
  const makeCurtain = (width, height, folds, phase, xCenter) => {
    const cols = 48;
    const rows = 24;
    const positions = [];
    const uvs = [];
    const indices = [];
    for (let r = 0; r <= rows; r += 1) {
      const v = r / rows;
      const y = rodY - 0.045 - v * height;
      for (let c = 0; c <= cols; c += 1) {
        const u = c / cols;
        const gather = 0.95 + 0.05 * v;
        const x = xCenter + (u - 0.5) * width * gather;
        const wave = Math.sin(u * Math.PI * folds * 2 + phase) * (0.038 + v * 0.014);
        const fineFold = Math.sin(u * Math.PI * folds * 7.2 + phase * 1.6) * 0.005;
        const warp = Math.sin(v * Math.PI * 2.1 + u * 5.4) * 0.0025;
        const z = rodZ - 0.007 + wave + fineFold + warp;
        positions.push(x, y, z);
        uvs.push(u, 1 - v);
      }
    }
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const a = r * (cols + 1) + c;
        const b = a + 1;
        const d = a + cols + 1;
        const e = d + 1;
        indices.push(a, d, b, b, d, e);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, materials.curtain);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  const leftCenter = cx - 0.88;
  const rightCenter = cx + 0.84;
  g.add(
    makeCurtain(curtainWidth, curtainHeight, 4.2, 0.9, leftCenter),
    makeCurtain(curtainWidth, curtainHeight, 4.2, 2.15, rightCenter),
  );

  // Curtain rings; the torus inner radius clears the rod.
  const ringGeo = new THREE.TorusGeometry(0.022, 0.0034, 5, 16);
  ringGeo.rotateY(Math.PI / 2);
  const rings = new THREE.InstancedMesh(ringGeo, materials.agedBrass, 20);
  rings.castShadow = false;
  let ringIndex = 0;
  for (const xCenter of [leftCenter, rightCenter]) {
    for (let i = 0; i < 10; i += 1) {
      const x = xCenter - 0.255 + (i / 9) * 0.51;
      const m = new THREE.Matrix4().makeTranslation(x, rodY - 0.014, rodZ);
      rings.setMatrixAt(ringIndex, m);
      ringIndex += 1;
    }
  }
  rings.instanceMatrix.needsUpdate = true;
  g.add(rings);

  setShadows(g, true, true);
  seams.castShadow = false;
  seams.receiveShadow = false;
  nails.castShadow = false;
  rings.castShadow = false;
  cavity.castShadow = false;
  for (const board of boardMeshes) board.castShadow = true;
  g.traverse((child) => {
    if (child.isMesh && child.material === materials.curtain) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return g;
}

function buildPendant(materials, textureSet) {
  const g = group('pendant-lamp');
  const shadeY = 2.3;
  const canopy = cylinder(materials.agedBrass, 0.061, 0.073, 0.035, 0, ROOM.height - 0.019, 0, { segments: 18 });
  const cordBottom = shadeY + 0.253;
  const cordTop = ROOM.height - 0.036;
  const cord = cylinder(materials.darkMetal, 0.0055, 0.0055, cordTop - cordBottom, 0, (cordTop + cordBottom) / 2, 0, {
    segments: 6, cast: false,
  });
  g.add(canopy, cord);

  const profile = [
    new THREE.Vector2(0.028, 0.245),
    new THREE.Vector2(0.052, 0.238),
    new THREE.Vector2(0.095, 0.215),
    new THREE.Vector2(0.14, 0.17),
    new THREE.Vector2(0.183, 0.108),
    new THREE.Vector2(0.215, 0.04),
    new THREE.Vector2(0.223, 0.0),
  ];
  const outerGeo = new THREE.LatheGeometry([...profile].reverse(), 28);
  const outer = new THREE.Mesh(outerGeo, materials.pendantLamp);
  outer.position.set(0, shadeY, 0);
  outer.castShadow = true;
  outer.receiveShadow = true;
  g.add(outer);

  // Warm cream inner shade.
  const innerProfile = profile.map((p) => new THREE.Vector2(p.x * 0.922, p.y));
  const inner = new THREE.Mesh(new THREE.LatheGeometry(innerProfile.slice(0, -1), 24), materials.lampEnamelInner);
  inner.position.set(0, shadeY + 0.004, 0);
  inner.castShadow = false;
  inner.receiveShadow = true;
  g.add(inner);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.222, 0.0045, 6, 32), materials.agedBrass);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, shadeY + 0.002, 0);
  rim.castShadow = false;
  g.add(rim);

  const topCap = cylinder(materials.agedBrass, 0.032, 0.035, 0.014, 0, shadeY + 0.246, 0, {
    segments: 16, cast: false,
  });
  g.add(topCap);

  const bulbMesh = sphere(materials.bulb, 0.038, 0, shadeY + 0.06, 0, { cast: false });
  g.add(bulbMesh);

  const socket = cylinder(materials.darkMetal, 0.019, 0.024, 0.08, 0, shadeY + 0.142, 0, {
    segments: 12, cast: false,
  });
  g.add(socket);

  const glowMaterial = new THREE.SpriteMaterial({
    map: textureSet.glow,
    color: 0xffc878,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const glow = new THREE.Sprite(glowMaterial);
  glow.scale.set(1.05, 1.05, 1);
  glow.position.set(0, shadeY + 0.065, 0);
  glow.renderOrder = 3;
  g.add(glow);

  return { group: g, shadeY };
}

function buildAirConditioner(materials) {
  const g = group('air-conditioner');
  const z = -2.16;
  const body = roundedBoxMesh(materials.airConditioner, 0.225, 0.27, 0.84, 3, 0.035);
  body.position.set(ROOM.halfWidth - 0.115, 2.435, z);
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  // Bottom louver with a dark air gap behind it.
  const gap = box(materials.crtDarkPlastic, 0.026, 0.05, 0.71, ROOM.halfWidth - 0.223, 2.338, z, {
    rotation: [0, 0, -0.16], cast: false,
  });
  const louver = roundedBoxMesh(materials.airConditioner, 0.035, 0.063, 0.72, 2, 0.012);
  louver.position.set(ROOM.halfWidth - 0.255, 2.333, z);
  louver.rotation.z = -0.2;
  louver.castShadow = true;
  louver.receiveShadow = true;
  g.add(gap, louver);

  // Crisp seams and a tiny non-branded indicator lamp.
  const seam = box(materials.crtDarkPlastic, 0.004, 0.006, 0.68, ROOM.halfWidth - 0.23, 2.478, z, {
    cast: false, receive: false,
  });
  const led = sphere(materials.ledGreen, 0.006, ROOM.halfWidth - 0.232, 2.381, z + 0.3, {
    cast: false, receive: false,
  });
  led.scale.multiply(new THREE.Vector3(1.2, 0.55, 1.2));
  g.add(seam, led);

  const bracket = box(materials.crtDarkPlastic, 0.04, 0.08, 0.55, ROOM.halfWidth - 0.02, 2.46, z, {
    cast: false,
  });
  g.add(bracket);

  return g;
}

function buildVent(materials) {
  const g = group('air-vent');
  const cx = 0.35;
  const cy = 2.27;
  const w = 0.6;
  const h = 0.34;
  const frame = 0.032;
  const wallZ = ROOM.halfDepth;

  // Dark throat behind the grille.
  const throatMaterial = new THREE.MeshBasicMaterial({ color: 0x0d0e0d });
  const throat = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.025, h - 0.025), throatMaterial);
  throat.position.set(cx, cy, wallZ - 0.006);
  throat.rotation.y = Math.PI;
  g.add(throat);

  const z = wallZ - 0.016;
  const cream = materials.warmWhitePaint;
  // A proper return flange around the opening.
  g.add(
    box(cream, frame, h, 0.03, cx - w / 2 + frame / 2, cy, z),
    box(cream, frame, h, 0.03, cx + w / 2 - frame / 2, cy, z),
    box(cream, w - frame * 2, frame, 0.03, cx, cy + h / 2 - frame / 2, z),
    box(cream, w - frame * 2, frame, 0.03, cx, cy - h / 2 + frame / 2, z),
  );

  // Real, visible horizontal louver slats in front of the throat.
  const innerW = w - frame * 2 - 0.014;
  const slatGeometry = new THREE.BoxGeometry(innerW, 0.02, 0.013);
  const slats = new THREE.InstancedMesh(slatGeometry, cream, 9);
  for (let i = 0; i < 9; i += 1) {
    const sy = cy - h / 2 + frame + 0.023 + i * 0.0295;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.38, 0, 0));
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(cx, sy, z + 0.017),
      q,
      new THREE.Vector3(1, 1, 1),
    );
    slats.setMatrixAt(i, m);
  }
  slats.instanceMatrix.needsUpdate = true;
  slats.castShadow = false;
  slats.receiveShadow = true;
  g.add(slats);

  // Four visible corner screws.
  for (const sx of [-w / 2 + 0.016, w / 2 - 0.016]) {
    for (const sy of [cy - h / 2 + 0.016, cy + h / 2 - 0.016]) {
      g.add(cylinder(materials.agedBrass, 0.005, 0.005, 0.008, cx + sx, sy, z + 0.018, {
        rotation: [Math.PI / 2, 0, 0], segments: 8, cast: false,
      }));
    }
  }
  return g;
}

function buildSwitchAndOutlets(materials) {
  const g = group('wall-fittings');

  // Light switch to the right of the door.
  const plate = roundedBoxMesh(materials.outlet, 0.075, 0.115, 0.012, 2, 0.006);
  plate.position.set(-0.68, 1.15, ROOM.halfDepth - 0.006);
  plate.castShadow = false;
  const toggle = roundedBoxMesh(materials.whitePaint, 0.019, 0.04, 0.008, 2, 0.003);
  toggle.position.set(-0.68, 1.15, ROOM.halfDepth - 0.016);
  toggle.rotation.x = -0.08;
  toggle.castShadow = false;
  g.add(plate, toggle);

  // Double socket on the east wall, low beside the desk.
  const outlet = roundedBoxMesh(materials.outlet, 0.012, 0.115, 0.075, 2, 0.005);
  outlet.position.set(ROOM.halfWidth - 0.006, 0.31, -0.72);
  outlet.castShadow = false;
  g.add(outlet);
  for (const dz of [-0.019, 0.019]) {
    const slotA = box(materials.blackMetal, 0.003, 0.011, 0.003, ROOM.halfWidth - 0.014, 0.333, -0.72 + dz, {
      cast: false, receive: false,
    });
    const slotB = box(materials.blackMetal, 0.003, 0.011, 0.003, ROOM.halfWidth - 0.014, 0.287, -0.72 + dz, {
      cast: false, receive: false,
    });
    g.add(slotA, slotB);
  }
  return g;
}

function buildSurveillanceSetup(materials, textureSet) {
  const g = group('crt-and-cctv');
  const wallX = ROOM.halfWidth;
  const zCenter = 2.22;

  // Everything in this local group uses +Z as the direction into the room.
  const rig = group('surveillance-rig');
  rig.position.set(wallX - 0.006, 1.76, zCenter);
  rig.rotation.y = -Math.PI / 2;
  g.add(rig);

  // Slim metal shelf.
  rig.add(box(materials.darkMetal, 0.58, 0.025, 0.35, 0, 0.0125, 0.175));
  rig.add(
    box(materials.darkMetal, 0.025, 0.18, 0.28, -0.23, -0.09, 0.16),
    box(materials.darkMetal, 0.025, 0.18, 0.28, 0.23, -0.09, 0.16),
  );

  // CRT housing: a rounded box with a small rear taper.
  const crt = group('crt-monitor');
  crt.position.set(0, 0.025, 0.0);
  rig.add(crt);
  const body = roundedBoxMesh(materials.crtPlastic, 0.49, 0.31, 0.27, 3, 0.028);
  body.position.set(0, 0.155, 0.155);
  crt.add(body);

  // Recessed dark face, screen and glass.
  const face = box(materials.crtDarkPlastic, 0.46, 0.285, 0.016, 0, 0.158, 0.299);
  crt.add(face);
  const screenMesh = new THREE.Mesh(UNIT_PLANE, materials.screen);
  screenMesh.scale.set(0.33, 0.215, 1);
  screenMesh.position.set(-0.008, 0.165, 0.3072);
  screenMesh.castShadow = false;
  screenMesh.receiveShadow = false;
  crt.add(screenMesh);

  const glass = new THREE.Mesh(UNIT_PLANE, materials.screenGlass);
  glass.scale.set(0.34, 0.225, 1);
  glass.position.set(-0.008, 0.165, 0.3084);
  glass.castShadow = false;
  glass.receiveShadow = false;
  crt.add(glass);

  // Chunky old control knobs and a power LED.
  for (const x of [0.17, 0.205]) {
    const knob = cylinder(materials.crtDarkPlastic, 0.014, 0.014, 0.024, x, 0.045, 0.319, {
      rotation: [Math.PI / 2, 0, 0], segments: 12, cast: false,
    });
    crt.add(knob);
  }
  const led = sphere(materials.ledRed, 0.0045, -0.19, 0.045, 0.312, { cast: false, receive: false });
  led.scale.multiply(new THREE.Vector3(1.2, 0.6, 1.2));
  crt.add(led);

  // Ventilation notches on the right side.
  for (let i = 0; i < 4; i += 1) {
    crt.add(box(materials.crtDarkPlastic, 0.11, 0.006, 0.006, 0.26, 0.225 - i * 0.016, 0.19, {
      cast: false, receive: false,
    }));
  }

  // CRT glow sprite in front of the screen.
  const glowMat = new THREE.SpriteMaterial({
    map: textureSet.crtGlow,
    color: 0xa9d1b4,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(0.72, 0.58, 1);
  glow.position.set(-0.006, 0.165, 0.38);
  glow.renderOrder = 2;
  crt.add(glow);

  // Small cable from the back of the CRT to the wall chase.
  const crtCable = makeCable([
    new THREE.Vector3(wallX - 0.09, 1.73, zCenter + 0.19),
    new THREE.Vector3(wallX - 0.13, 1.55, zCenter + 0.3),
    new THREE.Vector3(wallX - 0.07, 1.52, zCenter + 0.47),
    new THREE.Vector3(wallX - 0.04, 1.63, zCenter + 0.49),
  ], 0.007, materials.darkMetal, 20, 4);
  g.add(crtCable);

  // Four wall-mounted cameras, one centred on each wall and all angled
  // inward. This spreads the network around the room instead of stacking
  // several units in the same ceiling corner, while the overlapping wide
  // views still cover the bed, desk, entry, wardrobe and most of the floor.
  const addWallCamera = (position, target, wall) => {
    const cameraGroup = group('cctv-camera');
    cameraGroup.position.copy(position);
    cameraGroup.lookAt(target);
    g.add(cameraGroup);

    const cameraBody = roundedBoxMesh(materials.cctvWhite, 0.13, 0.115, 0.27, 3, 0.026);
    cameraBody.position.set(0, 0, 0.02);
    cameraBody.castShadow = true;
    cameraGroup.add(cameraBody);

    const visor = box(materials.cctvWhite, 0.155, 0.018, 0.25, 0, 0.067, 0.085);
    visor.rotation.x = 0.075;
    cameraGroup.add(visor);

    const lensBarrel = cylinder(materials.crtDarkPlastic, 0.05, 0.05, 0.065, 0, 0, 0.16, {
      rotation: [Math.PI / 2, 0, 0], segments: 18,
    });
    cameraGroup.add(lensBarrel);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.035, 20), materials.darkGlass);
    lens.position.set(0, 0, 0.194);
    lens.castShadow = false;
    cameraGroup.add(lens);

    // IR halo and red recording lamp.
    const irRing = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.004, 5, 22), materials.crtDarkPlastic);
    irRing.position.set(0, 0, 0.16);
    cameraGroup.add(irRing);
    const recLed = sphere(materials.ledRed, 0.0055, 0.045, 0.04, 0.135, { cast: false, receive: false });
    cameraGroup.add(recLed);

    // Inward direction, wall surface point and a restrained L-bracket.
    const inward = new THREE.Vector3(
      wall === 'east' ? -1 : wall === 'west' ? 1 : 0,
      0,
      wall === 'north' ? 1 : wall === 'south' ? -1 : 0,
    );
    const surface = new THREE.Vector3(
      wall === 'east' ? ROOM.halfWidth : wall === 'west' ? -ROOM.halfWidth : position.x,
      2.6,
      wall === 'north' ? -ROOM.halfDepth : wall === 'south' ? ROOM.halfDepth : position.z,
    );
    const plate = inward.x !== 0
      ? box(materials.darkMetal, 0.016, 0.09, 0.09, surface.x + inward.x * 0.008, 2.6, surface.z, { cast: false })
      : box(materials.darkMetal, 0.09, 0.09, 0.016, surface.x, 2.6, surface.z + inward.z * 0.008, { cast: false });

    const armStart = surface.clone().addScaledVector(inward, 0.008);
    const armEnd = new THREE.Vector3(position.x, 2.6, position.z);
    const armLength = armStart.distanceTo(armEnd);
    const armCenter = armStart.clone().add(armEnd).multiplyScalar(0.5);
    const arm = cylinder(materials.darkMetal, 0.011, 0.011, armLength, armCenter.x, 2.6, armCenter.z, {
      rotation: inward.x !== 0 ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0],
      segments: 8,
      cast: false,
    });

    const jointY = position.y + 0.062;
    const drop = cylinder(materials.darkMetal, 0.009, 0.009, 2.6 - jointY, position.x, (2.6 + jointY) / 2, position.z, {
      segments: 8,
      cast: false,
    });
    const joint = sphere(materials.darkMetal, 0.029, position.x, jointY, position.z, { cast: false, receive: false });

    g.add(plate, arm, drop, joint);
    return cameraGroup;
  };

  const cameraSpecs = [
    // East wall, above the CRT: watches the door and the entry rug.
    [new THREE.Vector3(wallX - 0.21, 2.475, 2.14), new THREE.Vector3(-0.8, 0.8, 2.45), 'east'],
    // North wall, above the sealed window: watches the room centre and entry.
    [new THREE.Vector3(0.22, 2.475, -ROOM.halfDepth + 0.21), new THREE.Vector3(0.05, 0.6, 1.9), 'north'],
    // South wall, above the door: watches the desk, chair and window.
    [new THREE.Vector3(-1.22, 2.475, ROOM.halfDepth - 0.21), new THREE.Vector3(0.9, 0.6, -1.7), 'south'],
    // West wall, above the middle of the bed: watches the desk and east side.
    [new THREE.Vector3(-ROOM.halfWidth + 0.21, 2.475, -0.2), new THREE.Vector3(1.9, 0.7, 0.1), 'west'],
  ];
  const cameraGroups = cameraSpecs.map(([position, target, wall]) => addWallCamera(position, target, wall));

  setShadows(g, true, true);
  screenMesh.castShadow = false;
  glass.castShadow = false;
  glow.castShadow = false;
  crtCable.castShadow = false;
  g.traverse((child) => {
    if (child.isMesh && child.material === materials.ledRed) child.castShadow = false;
  });
  return { group: g, crtLedMaterial: materials.ledRed };
}

function buildCoatRack(materials) {
  const g = group('coat-rack');
  g.position.set(-2.1, 0, 2.43);

  const base = cylinder(materials.darkWood, 0.17, 0.19, 0.035, 0, 0.0175, 0, { segments: 18 });
  const baseRing = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.01, 6, 24), materials.agedBrass);
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.set(0, 0.036, 0);
  baseRing.castShadow = false;
  g.add(base, baseRing);

  // Turned central column.
  const profile = [
    new THREE.Vector2(0.042, 0.035),
    new THREE.Vector2(0.034, 0.14),
    new THREE.Vector2(0.027, 0.45),
    new THREE.Vector2(0.03, 0.94),
    new THREE.Vector2(0.025, 1.34),
    new THREE.Vector2(0.035, 1.55),
    new THREE.Vector2(0.02, 1.68),
    new THREE.Vector2(0.034, 1.72),
    new THREE.Vector2(0.018, 1.8),
  ];
  const column = new THREE.Mesh(new THREE.LatheGeometry(profile, 14), materials.darkWood);
  column.castShadow = true;
  column.receiveShadow = true;
  g.add(column);

  // Four substantial turned pegs, alternating around the column. They
  // read as a real hat-and-coat stand even at a distance.
  const pegHeights = [1.24, 1.37, 1.5, 1.63];
  const pegAngles = [0.55, 2.05, 3.6, 5.1];
  for (let i = 0; i < 4; i += 1) {
    const angle = pegAngles[i];
    const holder = new THREE.Group();
    holder.position.set(0, pegHeights[i], 0);
    holder.rotation.y = -angle;

    const collar = cylinder(materials.darkWood, 0.027, 0.032, 0.035, 0, 0, 0.033, {
      rotation: [Math.PI / 2, 0, 0], segments: 10,
    });
    const peg = cylinder(materials.darkWood, 0.0125, 0.019, 0.19, 0, 0.012, 0.12, {
      rotation: [Math.PI / 2 - 0.13, 0, 0], segments: 10,
    });
    const cap = sphere(materials.agedBrass, 0.021, 0, 0.024, 0.216);
    cap.scale.multiply(new THREE.Vector3(1, 0.88, 1.1));
    holder.add(collar, peg, cap);
    g.add(holder);
  }

  const hookMaterial = materials.agedBrass;
  const finial = sphere(hookMaterial, 0.035, 0, 1.82, 0);
  finial.scale.y *= 1.25;
  g.add(finial);

  setShadows(g, true, true);
  return g;
}

function buildRug(materials) {
  const g = group('entry-rug');
  const w = 1.25;
  const d = 0.9;
  const cx = -1.27;
  const cz = 2.23;
  // A very shallow solid edge, with the patterned top slightly proud of it.
  const underlay = box(materials.rugEdge, w, 0.005, d, cx, 0.0025, cz, { cast: false, receive: true });
  g.add(underlay);
  const top = plane(materials.rug, w, d, cx, 0.0058, cz, {
    rotation: [-Math.PI / 2, 0, 0],
    cast: false,
    receive: true,
  });
  top.material.polygonOffset = true;
  top.material.polygonOffsetFactor = -1;
  top.material.polygonOffsetUnits = -1;
  g.add(top);
  return g;
}

export function buildArchitecture(materials, textureSet) {
  const root = group('architecture');
  const floors = group('shell');
  root.add(floors);

  // Floor and ceiling.
  const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.width, ROOM.depth), materials.floor);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  floors.add(floorMesh);

  const ceilingMesh = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.width, ROOM.depth), materials.ceiling);
  ceilingMesh.rotation.x = Math.PI / 2;
  ceilingMesh.position.y = ROOM.height;
  ceilingMesh.receiveShadow = true;
  floors.add(ceilingMesh);

  // Wallpaper walls. Each plane is exactly on the interior side of the wall.
  floors.add(
    wallpaperPlane(materials, ROOM.width, ROOM.height, [0, ROOM.height / 2, -ROOM.halfDepth], 0),
    wallpaperPlane(materials, ROOM.width, ROOM.height, [0, ROOM.height / 2, ROOM.halfDepth], Math.PI),
    wallpaperPlane(materials, ROOM.depth, ROOM.height, [-ROOM.halfWidth, ROOM.height / 2, 0], Math.PI / 2),
    wallpaperPlane(materials, ROOM.depth, ROOM.height, [ROOM.halfWidth, ROOM.height / 2, 0], -Math.PI / 2),
  );

  root.add(makeBaseboards(materials));
  root.add(buildDoor(materials));
  root.add(buildWindow(materials));
  root.add(buildAirConditioner(materials));
  root.add(buildVent(materials));
  root.add(buildSwitchAndOutlets(materials));
  const surveillance = buildSurveillanceSetup(materials, textureSet);
  root.add(surveillance.group);
  root.add(buildCoatRack(materials));
  root.add(buildRug(materials));
  const pendant = buildPendant(materials, textureSet);
  root.add(pendant.group);

  return {
    group: root,
    pendant,
    surveillance,
  };
}
