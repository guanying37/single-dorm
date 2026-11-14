import * as THREE from 'three';
import {
  box,
  cylinder,
  group,
  makeCable,
  roundedBoxGeometry,
  roundedBoxMesh,
  roundedRectShape,
  roundedSlabGeometry,
  setShadows,
  sphere,
  UNIT_PLANE,
} from './utils.js';
import { ROOM } from './room.js';

/* All measurements are metres. Named constants make the layout auditable
 * and keep the room at a believable real-world scale. */

const BED = {
  x: -1.76,
  z: -1.72,
  frameW: 1.2,
  frameL: 2.0,
  mattressW: 1.14,
  mattressL: 1.9,
  platformTop: 0.35,
  mattressTop: 0.55,
};

const DESK = {
  x: 2.085,
  z: -1.625,
  topW: 0.61,
  topL: 1.35,
  topY: 0.75,
};

const WARDROBE = {
  x: -2.07,
  z: 1.14,
  widthZ: 1.24,
  depth: 0.6,
  height: 2.1,
};

const SHOE = {
  x: 0.38,
  z: 2.58,
  width: 0.96,
  depth: 0.36,
  height: 1.0,
  legHeight: 0.2,
};

function interactiveDoor({ id, label, pivot, openAngle, hitRoot = pivot }) {
  const entry = {
    id,
    label,
    type: 'hinge',
    open: false,
    target: 0,
    value: 0,
    openAngle,
    pivot,
    hitRoots: [hitRoot],
    apply(value) {
      pivot.rotation.y = openAngle * value;
    },
  };
  pivot.rotation.y = 0;
  return entry;
}

function interactiveDrawer({ id, label, root, closedX, travel }) {
  const entry = {
    id,
    label,
    type: 'drawer',
    open: false,
    target: 0,
    value: 0,
    closedX,
    travel,
    root,
    hitRoots: [root],
    apply(value) {
      root.position.x = closedX + travel * value;
    },
  };
  root.position.x = closedX;
  return entry;
}

/* ------------------------------------------------------------------ *
 * Wall gallery
 * ------------------------------------------------------------------ */

function buildGallery(materials) {
  const g = group('wall-gallery');
  const wallX = ROOM.halfWidth - 0.002;

  const specs = [
    { z: -1.95, kind: 'emblem', frameMaterial: materials.goldFrame, width: 0.54, height: 0.44 },
    { z: -0.25, kind: 'monokuma', frameMaterial: materials.blackFrame, width: 0.54, height: 0.44 },
    { z: 1.45, kind: 'empty', frameMaterial: materials.woodFrame, width: 0.54, height: 0.44 },
  ];

  for (const spec of specs) {
    const holder = group(`gallery-${spec.kind}`);
    holder.position.set(wallX, 1.64, spec.z);
    holder.rotation.y = -Math.PI / 2;

    // Frame ring. The local +Z direction points into the room.
    const frameGeometry = new THREE.ExtrudeGeometry(
      (() => {
        const outer = roundedRectShape(spec.width, spec.height, 0.012);
        const inner = roundedRectShape(spec.width - 0.054, spec.height - 0.054, 0.006);
        outer.holes.push(new THREE.Path(inner.getPoints(28)));
        return outer;
      })(),
      {
        depth: 0.028,
        bevelEnabled: true,
        bevelSegments: 1,
        bevelSize: 0.0025,
        bevelThickness: 0.0025,
        curveSegments: 5,
        steps: 1,
      },
    );
    frameGeometry.computeBoundingBox();
    frameGeometry.translate(0, 0, -frameGeometry.boundingBox.min.z);
    frameGeometry.computeVertexNormals();
    const frame = new THREE.Mesh(frameGeometry, spec.frameMaterial);
    frame.position.z = 0.006;
    frame.castShadow = true;
    frame.receiveShadow = true;
    holder.add(frame);

    if (spec.kind !== 'empty') {
      const matte = new THREE.Mesh(UNIT_PLANE, materials.matteCream);
      matte.scale.set(spec.width - 0.056, spec.height - 0.056, 1);
      matte.position.z = 0.0075;
      matte.receiveShadow = true;
      holder.add(matte);

      const artMap = spec.kind === 'emblem' ? materials.artEmblem : materials.artMonokuma;
      const art = new THREE.Mesh(UNIT_PLANE, artMap);
      const source = artMap.map && artMap.map.image;
      const aspect = source && source.width ? source.width / source.height : 1.28;
      // Fit the supplied reference inside the cream mount without ever
      // stretching or cropping the artwork.
      let artWidth = spec.width - 0.08;
      let artHeight = artWidth / aspect;
      const maxHeight = spec.height - 0.08;
      if (artHeight > maxHeight) {
        artHeight = maxHeight;
        artWidth = artHeight * aspect;
      }
      art.scale.set(artWidth, artHeight, 1);
      art.position.z = 0.009;
      art.castShadow = false;
      art.receiveShadow = true;
      holder.add(art);
    }
    // The empty frame has no backing at all: the patterned wallpaper is
    // visible straight through its opening.

    g.add(holder);
  }

  return g;
}

/* ------------------------------------------------------------------ *
 * Bed and bedding
 * ------------------------------------------------------------------ */

function deformSoftTop(geometry, amplitude, frequencyA, frequencyB, phase = 0) {
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  const topLimit = 0.001;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    if (y > topLimit) {
      const weight = Math.min(1, (y - topLimit) / 0.035);
      const wave =
        Math.sin(x * frequencyA + z * 2.2 + phase) * 0.55 +
        Math.sin(z * frequencyB - x * 4.8 + phase * 0.7) * 0.45;
      position.setY(i, y + amplitude * weight * wave);
    }
  }
  position.needsUpdate = true;
  if (normal) geometry.computeVertexNormals();
  geometry.computeBoundingBox();
}

function makeNotebook(materials, { width, depth, thickness, coverMaterial, x, y, z, yaw = 0, label = false }) {
  const g = group('notebook');
  g.position.set(x, y, z);
  g.rotation.y = yaw;
  const cover = 0.006;
  const pageH = thickness - cover * 2;

  const bottomCover = roundedBoxMesh(coverMaterial, width, cover, depth, 2, 0.006);
  bottomCover.position.y = cover / 2;
  const pages = box(materials.paper, width - 0.009, pageH, depth - 0.01, 0, cover + pageH / 2, 0);
  pages.castShadow = false;
  const topCover = roundedBoxMesh(coverMaterial, width, cover, depth, 2, 0.006);
  topCover.position.y = cover + pageH + cover / 2;

  g.add(bottomCover, pages, topCover);

  let paperLabel = null;
  if (label) {
    paperLabel = box(materials.matteCream, width * 0.34, 0.0015, depth * 0.22, 0, cover + pageH + cover + 0.0008, -depth * 0.13, {
      cast: false,
    });
    g.add(paperLabel);
  }

  // Thin ribbon marker peeking from the foot of the book.
  const ribbon = box(materials.bookRust, width * 0.035, 0.0015, depth * 0.24, width * 0.35, cover + pageH + cover + 0.001, depth * 0.28, {
    cast: false,
  });
  g.add(ribbon);

  setShadows(g, true, true);
  pages.castShadow = false;
  if (paperLabel) paperLabel.castShadow = false;
  ribbon.castShadow = false;
  return g;
}

function buildBed(materials) {
  const root = group('single-bed');
  root.position.set(BED.x, 0, BED.z);

  // Frame and turned feet.
  for (const x of [-0.52, 0.52]) {
    for (const z of [-0.87, 0.9]) {
      const foot = cylinder(materials.lightOak, 0.029, 0.023, 0.25, x, 0.125, z, { segments: 10 });
      const collar = cylinder(materials.lightOak, 0.037, 0.031, 0.036, x, 0.229, z, { segments: 10 });
      root.add(foot, collar);
    }
  }

  const platform = roundedBoxMesh(materials.lightOak, BED.frameW, 0.1, 1.93, 2, 0.02);
  platform.position.set(0, 0.3, 0.025);
  root.add(platform);

  // Headboard, kept clear of the wall and skirting.
  const headboard = roundedBoxMesh(materials.lightOak, 1.18, 0.79, 0.045, 3, 0.028);
  headboard.position.set(0, 0.75, -0.975);
  const headboardInset = roundedBoxMesh(materials.duvet, 1.02, 0.44, 0.034, 3, 0.035);
  headboardInset.position.set(0, 0.84, -0.955);
  root.add(headboard, headboardInset);
  const headCap = roundedBoxMesh(materials.oak, 1.2, 0.045, 0.055, 2, 0.012);
  headCap.position.set(0, 1.155, -0.975);
  root.add(headCap);

  // Mattress.
  const mattress = roundedBoxMesh(materials.mattress, BED.mattressW, 0.2, BED.mattressL, 4, 0.065);
  mattress.position.set(0, 0.45, 0.005);
  root.add(mattress);

  // Flat white under-sheet, showing between pillow and duvet.
  const sheetGeometry = roundedSlabGeometry(1.16, 1.92, 0.014, 0.055, 0.004, 6);
  const sheet = new THREE.Mesh(sheetGeometry, materials.whiteSheet);
  sheet.position.set(0, 0.55, 0.005);
  sheet.receiveShadow = true;
  sheet.castShadow = false;
  root.add(sheet);

  // Neat duvet with a soft, subtly irregular top. The deformation is small
  // enough that the folded sheet above never penetrates it.
  const duvetWidth = 1.14;
  const duvetLength = 1.5;
  const duvetGeo = roundedBoxGeometry(duvetWidth, 0.078, duvetLength, 4, 0.043);
  deformSoftTop(duvetGeo, 0.006, 11.5, 16.0, 1.7);
  const duvet = new THREE.Mesh(duvetGeo, materials.duvet);
  duvet.position.set(0, 0.607, 0.17);
  duvet.castShadow = true;
  duvet.receiveShadow = true;
  root.add(duvet);

  // Crisp turn-down of the white sheet across the head of the duvet.
  const foldedSheet = roundedBoxMesh(materials.whiteSheet, 1.155, 0.028, 0.18, 2, 0.012);
  foldedSheet.position.set(0, 0.669, -0.49);
  foldedSheet.rotation.x = -0.018;
  root.add(foldedSheet);

  // Two white pillows with a soft puff and a little asymmetry.
  const pillowGeo = roundedBoxGeometry(0.52, 0.15, 0.33, 4, 0.06);
  const pillowPosition = pillowGeo.attributes.position;
  for (let i = 0; i < pillowPosition.count; i += 1) {
    const x = pillowPosition.getX(i);
    const y = pillowPosition.getY(i);
    const z = pillowPosition.getZ(i);
    if (y > 0.012) {
      const puff = Math.max(0, 1 - (x * x) / 0.075 - (z * z) / 0.045);
      const dent = 0.008 * Math.max(0, 1 - (x * x) / 0.012);
      pillowPosition.setY(i, y + 0.022 * puff - dent);
    }
  }
  pillowPosition.needsUpdate = true;
  pillowGeo.computeVertexNormals();
  for (const [x, z, yaw] of [[-0.27, -0.755, 0.025], [0.27, -0.75, -0.035]]) {
    const pillow = new THREE.Mesh(pillowGeo, materials.pillow);
    pillow.position.set(x, 0.644, z);
    pillow.rotation.y = yaw;
    pillow.castShadow = true;
    pillow.receiveShadow = true;
    root.add(pillow);
  }

  // A neatly folded rust throw across the foot of the bed.
  const throwMainGeo = roundedSlabGeometry(1.17, 0.34, 0.032, 0.034, 0.006, 5);
  const throwMain = new THREE.Mesh(throwMainGeo, materials.throwRust);
  throwMain.position.set(0, 0.655, 0.665);
  throwMain.rotation.y = 0.012;
  throwMain.castShadow = true;
  throwMain.receiveShadow = true;
  root.add(throwMain);

  const throwStripe = roundedSlabGeometry(1.15, 0.033, 0.006, 0.012, 0.002, 4);
  const stripe = new THREE.Mesh(throwStripe, materials.throwStripe);
  stripe.position.set(0, 0.6885, 0.57);
  stripe.rotation.y = 0.012;
  stripe.castShadow = false;
  stripe.receiveShadow = true;
  root.add(stripe);

  setShadows(root, true, true);
  sheet.castShadow = false;
  foldedSheet.castShadow = true;
  root.traverse((child) => {
    if (child.isMesh && child.material === materials.whiteSheet) child.castShadow = false;
  });
  return root;
}

/* ------------------------------------------------------------------ *
 * Desk and its props
 * ------------------------------------------------------------------ */

function buildDeskWithProps(materials, textureSet) {
  const root = group('desk-and-props');
  root.position.set(DESK.x, 0, DESK.z);

  // Table top.
  const top = roundedBoxMesh(materials.oak, DESK.topW, 0.045, DESK.topL, 2, 0.012);
  top.position.set(0, DESK.topY - 0.0225, 0);
  root.add(top);

  // Four square legs, each ending exactly under the top.
  const legHeight = DESK.topY - 0.045;
  for (const x of [-0.25, 0.25]) {
    for (const z of [-0.6, 0.6]) {
      const leg = box(materials.oak, 0.046, legHeight, 0.046, x, legHeight / 2, z);
      root.add(leg);
    }
  }

  // Butt-jointed aprons and side stretchers.
  const apronY = legHeight - 0.0275;
  root.add(
    box(materials.oak, 0.018, 0.055, 1.152, -0.25, apronY, 0),
    box(materials.oak, 0.018, 0.055, 1.152, 0.25, apronY, 0),
    box(materials.oak, 0.452, 0.055, 0.018, 0, apronY, -0.6),
    box(materials.oak, 0.452, 0.055, 0.018, 0, apronY, 0.6),
    box(materials.oak, 0.022, 0.024, 1.152, -0.25, 0.16, 0),
    box(materials.oak, 0.022, 0.024, 1.152, 0.25, 0.16, 0),
  );

  // A slim old-school modesty rail at the back.
  root.add(box(materials.oak, 0.016, 0.12, 1.12, 0.252, 0.59, 0));

  // Broken green desk lamp.
  const lamp = group('damaged-desk-lamp');
  lamp.position.set(0.12, DESK.topY, -0.49);
  const lampBase = cylinder(materials.lampEnamel, 0.095, 0.103, 0.027, 0, 0.0135, 0, { segments: 24 });
  const lampBaseTop = roundedBoxMesh(materials.darkMetal, 0.04, 0.023, 0.04, 2, 0.008);
  lampBaseTop.position.set(0.01, 0.036, 0.01);
  lamp.add(lampBase, lampBaseTop);

  const neckCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.01, 0.048, 0.01),
    new THREE.Vector3(0.02, 0.18, 0.015),
    new THREE.Vector3(0.005, 0.29, 0.035),
    new THREE.Vector3(-0.055, 0.33, 0.02),
    new THREE.Vector3(-0.09, 0.315, -0.01),
  ]);
  const neck = new THREE.Mesh(
    new THREE.TubeGeometry(neckCurve, 18, 0.0095, 6, false),
    materials.darkMetal,
  );
  neck.castShadow = true;
  lamp.add(neck);

  const elbow = sphere(materials.agedBrass, 0.027, -0.058, 0.328, 0.019, { cast: true });
  lamp.add(elbow);

  // A shade with a missing wedge reads as damage rather than a clean lamp.
  const shadeGroup = group('broken-shade');
  shadeGroup.position.set(-0.12, 0.295, -0.03);
  shadeGroup.rotation.set(0.32, -0.28, -0.74);
  const shadeGeo = new THREE.CylinderGeometry(0.045, 0.108, 0.12, 20, 1, true, 0.35, 4.76);
  const shade = new THREE.Mesh(shadeGeo, materials.lampEnamel);
  shade.castShadow = true;
  shade.receiveShadow = true;
  shadeGroup.add(shade);
  const shadeInnerGeo = new THREE.CylinderGeometry(0.04, 0.1, 0.11, 18, 1, true, 0.4, 4.66);
  const shadeInner = new THREE.Mesh(shadeInnerGeo, materials.lampEnamelInner);
  shadeInner.position.y = 0.002;
  shadeInner.castShadow = false;
  shadeGroup.add(shadeInner);
  const brokenSocket = cylinder(materials.crtDarkPlastic, 0.023, 0.027, 0.045, 0, 0.035, 0, {
    segments: 10, cast: false,
  });
  shadeGroup.add(brokenSocket);
  lamp.add(shadeGroup);

  // Frayed wire from the damaged head.
  const frayed = makeCable([
    new THREE.Vector3(-0.17, 0.30, -0.015),
    new THREE.Vector3(-0.2, 0.275, 0.015),
    new THREE.Vector3(-0.22, 0.245, 0.005),
  ], 0.0036, materials.darkMetal, 12, 4);
  lamp.add(frayed);

  // Power cord draped off the side of the desk, far away from the cup.
  const cord = makeCable([
    new THREE.Vector3(0.16, 0.007, -0.5),
    new THREE.Vector3(0.265, 0.007, -0.46),
    new THREE.Vector3(0.294, 0.006, -0.12),
    new THREE.Vector3(0.294, 0.004, 0.34),
    new THREE.Vector3(0.29, -0.08, 0.63),
    new THREE.Vector3(0.284, -0.49, 0.69),
  ], 0.0038, materials.crtDarkPlastic, 22, 4);
  cord.castShadow = false;
  lamp.add(cord);

  setShadows(lamp, true, true);
  shadeInner.castShadow = false;
  brokenSocket.castShadow = false;
  frayed.castShadow = false;
  root.add(lamp);

  // Two closed notebooks, one neatly stacked on the other.
  const notebookBottom = makeNotebook(materials, {
    width: 0.21,
    depth: 0.285,
    thickness: 0.019,
    coverMaterial: materials.bookGreen,
    x: -0.055,
    y: DESK.topY,
    z: 0.055,
    yaw: -0.035,
  });
  const notebookTop = makeNotebook(materials, {
    width: 0.19,
    depth: 0.265,
    thickness: 0.016,
    coverMaterial: materials.bookRust,
    x: -0.025,
    y: DESK.topY + 0.019,
    z: 0.025,
    yaw: 0.105,
    label: true,
  });
  root.add(notebookBottom, notebookTop);

  // Wooden pen cup with a painted bird-and-flower surface.
  const cup = group('floral-bird-pen-cup');
  cup.position.set(0.13, DESK.topY, 0.545);
  const cupH = 0.115;
  const outerCupGeo = new THREE.CylinderGeometry(0.053, 0.045, cupH, 24, 1, true);
  const outerCup = new THREE.Mesh(outerCupGeo, materials.penCup);
  outerCup.position.y = cupH / 2;
  outerCup.castShadow = true;
  outerCup.receiveShadow = true;
  const cupBottom = new THREE.Mesh(new THREE.CircleGeometry(0.045, 24), materials.penCup);
  cupBottom.rotation.x = -Math.PI / 2;
  cupBottom.position.y = 0.003;
  const innerGeo = new THREE.CylinderGeometry(0.047, 0.0405, cupH - 0.004, 24, 1, true);
  const cupInner = new THREE.Mesh(innerGeo, materials.interiorWood);
  cupInner.position.y = cupH / 2 + 0.002;
  cupInner.material = materials.interiorWood.clone();
  cupInner.material.side = THREE.BackSide;
  cupInner.material.color.setHex(0x5c4a38);
  const cupFloorMaterial = cupInner.material.clone();
  cupFloorMaterial.side = THREE.DoubleSide;
  const innerBottom = new THREE.Mesh(new THREE.CircleGeometry(0.041, 24), cupFloorMaterial);
  innerBottom.rotation.x = -Math.PI / 2;
  innerBottom.position.y = 0.006;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.0492, 0.0028, 5, 24), materials.penCup);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = cupH;
  rim.castShadow = false;
  cup.add(outerCup, cupBottom, cupInner, innerBottom, rim);
  root.add(cup);

  // Ruler and three signing pens, all passing cleanly through the cup mouth.
  const rulerMat = new THREE.MeshStandardMaterial({
    color: 0xcdb087,
    roughness: 0.52,
    metalness: 0.02,
    envMapIntensity: 0.25,
  });
  const ruler = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.21, 0.004), rulerMat);
  ruler.position.set(-0.012, 0.115, 0.005);
  ruler.rotation.set(0.16, 0.35, 0.18);
  ruler.castShadow = true;
  // Small engraved-looking ticks make the object read as a ruler even
  // though it is only 20 cm and mostly inside the cup.
  for (let i = 0; i < 9; i += 1) {
    const tick = box(materials.crtDarkPlastic, i % 3 === 0 ? 0.012 : 0.0075, 0.0014, 0.0006,
      -0.005, -0.082 + i * 0.0205, 0.0026, { cast: false, receive: false });
    tick.name = 'rulerTick';
    ruler.add(tick);
  }
  cup.add(ruler);

  const penMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x202322, roughness: 0.35, metalness: 0.15 }),
    new THREE.MeshStandardMaterial({ color: 0x6e2b2e, roughness: 0.38, metalness: 0.12 }),
    new THREE.MeshStandardMaterial({ color: 0x263b51, roughness: 0.35, metalness: 0.15 }),
  ];
  const metalMat = materials.agedBrass;
  const penPositions = [
    [0.018, 0.006, 0.12, -0.09],
    [-0.02, 0.016, -0.11, 0.07],
    [0.003, -0.023, 0.045, 0.15],
  ];
  penPositions.forEach(([px, pz, rx, rz], i) => {
    const pen = group('signing-pen');
    pen.position.set(px, 0.008, pz);
    pen.rotation.set(rx, i * 0.7, rz);
    const body = cylinder(penMaterials[i], 0.0042, 0.0044, 0.13, 0, 0.075, 0, {
      segments: 8, cast: false,
    });
    const capTop = cylinder(penMaterials[i], 0.0048, 0.0046, 0.03, 0, 0.155, 0, {
      segments: 8, cast: false,
    });
    const capBand = cylinder(metalMat, 0.0049, 0.0049, 0.007, 0, 0.14, 0, {
      segments: 8, cast: false,
    });
    const button = sphere(penMaterials[i], 0.0036, 0, 0.171, 0, { cast: false, receive: false });
    const clip = box(metalMat, 0.0016, 0.021, 0.0022, 0.0052, 0.145, 0, {
      cast: false, receive: false,
    });
    pen.add(body, capTop, capBand, button, clip);
    cup.add(pen);
  });

  setShadows(cup, true, true);
  cupInner.castShadow = false;
  innerBottom.castShadow = false;
  ruler.castShadow = true;
  // The pens were deliberately castShadow false; keep it that way.
  cup.traverse((child) => {
    if (child.isMesh && child !== outerCup && child !== rim && child !== cupBottom && child !== ruler) {
      child.castShadow = false;
    }
  });

  // A small brass desk tidy / paperweight keeps the top from feeling empty.
  const paperweight = new THREE.Mesh(new THREE.IcosahedronGeometry(0.022, 0), materials.brass);
  paperweight.position.set(-0.16, DESK.topY + 0.022, -0.25);
  paperweight.rotation.set(0.2, 0.4, 0.15);
  paperweight.castShadow = true;
  root.add(paperweight);

  return root;
}

function buildChair(materials) {
  const g = group('old-wooden-chair');
  g.position.set(1.46, 0, -1.56);
  g.rotation.y = 0.07;

  const seat = roundedBoxMesh(materials.oak, 0.45, 0.055, 0.44, 3, 0.027);
  seat.position.set(0, 0.4475, 0);
  g.add(seat);

  for (const z of [-0.17, 0.17]) {
    const frontLeg = cylinder(materials.oak, 0.021, 0.0165, 0.42, 0.18, 0.21, z, { segments: 9 });
    const rearPost = cylinder(materials.oak, 0.023, 0.019, 0.95, -0.255, 0.475, z, { segments: 9 });
    const finial = sphere(materials.oak, 0.023, -0.255, 0.972, z, { cast: true });
    finial.scale.y *= 1.25;
    g.add(frontLeg, rearPost, finial);
  }

  // Back rails and spindles butt cleanly into one another.
  const backRailZ = 0.298;
  const lowerRail = roundedBoxMesh(materials.oak, 0.035, 0.06, backRailZ, 2, 0.01);
  lowerRail.position.set(-0.255, 0.65, 0);
  const topRail = roundedBoxMesh(materials.oak, 0.04, 0.07, backRailZ, 2, 0.014);
  topRail.position.set(-0.255, 0.89, 0);
  g.add(lowerRail, topRail);

  for (const z of [-0.1, 0, 0.1]) {
    const spindle = cylinder(materials.oak, 0.008, 0.009, 0.175, -0.255, 0.7675, z, {
      segments: 8, cast: false,
    });
    g.add(spindle);
  }

  // A single front stretcher touching the inner faces of the front legs.
  const crossStretcher = cylinder(materials.oak, 0.009, 0.009, 0.302, 0.18, 0.14, 0, {
    rotation: [Math.PI / 2, 0, 0], segments: 7,
  });
  g.add(crossStretcher);

  setShadows(g, true, true);
  g.traverse((child) => {
    if (child.isMesh) {
      if (child === seat || child === lowerRail || child === topRail) {
        child.castShadow = true;
      }
    }
  });
  return g;
}

/* ------------------------------------------------------------------ *
 * Wardrobe
 * ------------------------------------------------------------------ */

function buildWardrobe(materials) {
  const root = group('white-wardrobe');
  const interactives = [];
  root.position.set(WARDROBE.x, 0, WARDROBE.z);

  // Build in local coordinates with the front at +X.
  const front = 0.3;
  const sideZ = WARDROBE.widthZ / 2;
  const bodyBottom = 0.06;
  const topY = 2.1;
  const carcassTop = 2.06;
  const sideThickness = 0.022;
  const innerZ = sideZ - sideThickness;

  // Recessed plinth.
  root.add(box(materials.warmWhitePaint, 0.56, 0.06, 1.18, 0, 0.03, 0, { cast: false }));

  // Two side panels, back panel, and a top cap that sits on the carcass.
  root.add(
    box(materials.whitePaint, 0.6, carcassTop - bodyBottom, sideThickness, 0, bodyBottom + (carcassTop - bodyBottom) / 2, -innerZ - sideThickness / 2),
    box(materials.whitePaint, 0.6, carcassTop - bodyBottom, sideThickness, 0, bodyBottom + (carcassTop - bodyBottom) / 2, innerZ + sideThickness / 2),
    box(materials.warmWhitePaint, 0.015, carcassTop - bodyBottom, innerZ * 2, -0.285, bodyBottom + (carcassTop - bodyBottom) / 2, 0, { cast: false }),
    roundedBoxMesh(materials.whitePaint, 0.65, 0.04, 1.28, 2, 0.012),
  );
  const topCap = root.children[root.children.length - 1];
  topCap.position.set(0, topY - 0.02, 0);

  // Interior floor/ceiling and the fixed divider that forms the drawer bay.
  root.add(
    box(materials.interiorWood, 0.55, 0.025, innerZ * 2, 0, 0.58, 0, { cast: false }),
    box(materials.interiorWood, 0.55, 0.022, innerZ * 2, 0, carcassTop - 0.011, 0, { cast: false }),
    box(materials.interiorWood, 0.55, 0.025, innerZ * 2, 0, 1.99, 0, { cast: false }),
  );

  // Hanging rod with flanges.
  const rod = cylinder(materials.agedBrass, 0.014, 0.014, innerZ * 2 - 0.03, -0.08, 1.75, 0, {
    rotation: [Math.PI / 2, 0, 0], segments: 10,
  });
  root.add(rod);
  for (const z of [-innerZ + 0.01, innerZ - 0.01]) {
    const flange = cylinder(materials.agedBrass, 0.027, 0.027, 0.012, -0.08, 1.75, z, {
      rotation: [Math.PI / 2, 0, 0], segments: 10, cast: false,
    });
    root.add(flange);
  }

  // Fixed rail between the doors and the drawer bank, with a clean
  // 3 mm reveal on each side. This also hides the top edge of the fixed
  // internal divider when viewed from below.
  const drawerTopRail = box(materials.whitePaint, 0.024, 0.028, 1.19, 0.309, 0.566, 0, {
    cast: false,
  });
  root.add(drawerTopRail);

  // Door panels.
  const doorHeight = 1.47;
  const doorCenterY = 0.58 + doorHeight / 2;
  const doorWidth = 0.59;
  const leftHingeZ = -innerZ + 0.004;
  const rightHingeZ = innerZ - 0.004;
  const doorX = front;

  const buildDoor = (side) => {
    const hingeZ = side < 0 ? leftHingeZ : rightHingeZ;
    const pivot = group(side < 0 ? 'wardrobe-left-door' : 'wardrobe-right-door');
    pivot.position.set(doorX, doorCenterY, hingeZ);
    root.add(pivot);

    // The door is flat against the front, moving in +X when swung open.
    const slab = roundedBoxMesh(materials.whitePaint, 0.022, doorHeight, doorWidth, 2, 0.006);
    slab.position.set(0.011, 0, side < 0 ? doorWidth / 2 : -doorWidth / 2);
    pivot.add(slab);

    const inset = roundedBoxMesh(materials.warmWhitePaint, 0.009, 1.19, doorWidth - 0.15, 2, 0.012);
    inset.position.set(0.027, 0.02, side < 0 ? doorWidth / 2 : -doorWidth / 2);
    pivot.add(inset);

    const handleZ = side < 0 ? doorWidth - 0.058 : -doorWidth + 0.058;
    const handle = group('wardrobe-pull');
    handle.position.set(0.029, -0.11, handleZ);
    const pull = roundedBoxMesh(materials.brass, 0.014, 0.23, 0.02, 2, 0.007);
    pull.castShadow = false;
    handle.add(pull);
    pivot.add(handle);

    const interaction = interactiveDoor({
      id: side < 0 ? 'wardrobe-door-left' : 'wardrobe-door-right',
      label: side < 0 ? '衣橱 · 左门' : '衣橱 · 右门',
      pivot,
      openAngle: side < 0 ? 1.84 : -1.84,
    });
    interactives.push(interaction);
    return pivot;
  };

  buildDoor(-1);
  buildDoor(1);

  // Two deep, smooth-running lower drawers. They are below the doors.
  const drawerTravel = 0.34;
  const drawerWidthZ = 1.18;
  const drawerFrontX = front + 0.012;
  for (let i = 0; i < 2; i += 1) {
    const y = i === 0 ? 0.205 : 0.44;
    const height = 0.215;
    const drawer = group(i === 0 ? 'wardrobe-drawer-lower' : 'wardrobe-drawer-upper');
    drawer.position.set(drawerFrontX, y, 0);

    const drawerFront = roundedBoxMesh(materials.whitePaint, 0.025, height, drawerWidthZ, 2, 0.006);
    drawerFront.position.x = 0;
    drawer.add(drawerFront);
    const frontInset = roundedBoxMesh(materials.warmWhitePaint, 0.008, height - 0.055, drawerWidthZ - 0.12, 2, 0.01);
    frontInset.position.x = 0.0165;
    drawer.add(frontInset);

    // The actual drawer box, visible as it slides out.
    const boxWidthX = 0.5;
    const boxHeight = height - 0.04;
    const boxDepthZ = drawerWidthZ - 0.06;
    drawer.add(
      box(materials.interiorWood, boxWidthX, 0.014, boxDepthZ, -0.012 - boxWidthX / 2, -boxHeight / 2 + 0.01, 0, { cast: false }),
      box(materials.interiorWood, boxWidthX, boxHeight - 0.02, 0.014, -0.012 - boxWidthX / 2, 0, -boxDepthZ / 2, { cast: false }),
      box(materials.interiorWood, boxWidthX, boxHeight - 0.02, 0.014, -0.012 - boxWidthX / 2, 0, boxDepthZ / 2, { cast: false }),
      box(materials.interiorWood, 0.014, boxHeight - 0.02, boxDepthZ, -0.012 - boxWidthX, 0, 0, { cast: false }),
    );

    const pull = roundedBoxMesh(materials.brass, 0.018, 0.028, 0.18, 2, 0.005);
    pull.position.set(0.0295, 0, 0);
    pull.castShadow = false;
    drawer.add(pull);

    root.add(drawer);
    interactives.push(interactiveDrawer({
      id: i === 0 ? 'wardrobe-drawer-lower' : 'wardrobe-drawer-upper',
      label: i === 0 ? '衣橱 · 下层抽屉' : '衣橱 · 上层抽屉',
      root: drawer,
      closedX: drawerFrontX,
      travel: drawerTravel,
    }));
  }

  setShadows(root, true, true);
  return { group: root, interactives };
}

/* ------------------------------------------------------------------ *
 * Shoe cabinet
 * ------------------------------------------------------------------ */

function buildShoeCabinet(materials) {
  const root = group('shoe-cabinet');
  const interactives = [];
  root.position.set(SHOE.x, 0, SHOE.z);

  const bodyBottom = SHOE.legHeight;
  const bodyTop = SHOE.height;
  const halfW = SHOE.width / 2;
  const halfD = SHOE.depth / 2;
  const sideT = 0.022;
  const frontZ = -halfD;
  const backZ = halfD;

  // Four black tapered legs: exactly 200 mm of air underneath.
  for (const x of [-0.38, 0.38]) {
    for (const z of [-0.12, 0.12]) {
      const leg = cylinder(materials.blackMetal, 0.017, 0.012, SHOE.legHeight, x, SHOE.legHeight / 2, z, {
        segments: 7,
      });
      const cap = cylinder(materials.agedBrass, 0.013, 0.013, 0.006, x, 0.003, z, {
        segments: 7, cast: false,
      });
      root.add(leg, cap);
    }
  }

  // Carcass: side panels, bottom, top, and back. Butt-jointed with no
  // overlapping volumes.
  const interiorW = SHOE.width - sideT * 2;
  const bodyH = bodyTop - bodyBottom;
  root.add(
    box(materials.oak, sideT, bodyH, SHOE.depth, -halfW + sideT / 2, bodyBottom + bodyH / 2, 0),
    box(materials.oak, sideT, bodyH, SHOE.depth, halfW - sideT / 2, bodyBottom + bodyH / 2, 0),
    box(materials.oak, interiorW, 0.025, SHOE.depth - 0.01, 0, bodyBottom + 0.0125, 0),
    box(materials.oak, interiorW, 0.025, SHOE.depth - 0.01, 0, bodyTop - 0.0125, 0),
    box(materials.interiorWood, interiorW, bodyH - 0.05, 0.014, 0, bodyBottom + bodyH / 2, backZ - 0.007, { cast: false }),
  );

  // Exactly four empty levels, separated by three clean shelves.
  const shelfYs = [0.39, 0.58, 0.77];
  for (const y of shelfYs) {
    root.add(box(materials.interiorWood, interiorW, 0.018, SHOE.depth - 0.035, 0, y, 0, { cast: false }));
  }

  // A narrow face frame to make the open cabinet read as joinery.
  const faceZ = frontZ + 0.009;
  root.add(
    box(materials.oak, 0.016, bodyH - 0.04, 0.018, -halfW + 0.03, bodyBottom + bodyH / 2, faceZ),
    box(materials.oak, 0.016, bodyH - 0.04, 0.018, halfW - 0.03, bodyBottom + bodyH / 2, faceZ),
    box(materials.oak, interiorW - 0.06, 0.016, 0.018, 0, bodyTop - 0.035, faceZ),
    box(materials.oak, interiorW - 0.06, 0.016, 0.018, 0, bodyBottom + 0.035, faceZ),
  );

  // Doors.
  const doorHeight = 0.71;
  const doorWidth = 0.466;
  const doorCenterY = 0.245 + doorHeight / 2;
  const doorZ = frontZ;
  const leftHingeX = -halfW + 0.008;
  const rightHingeX = halfW - 0.008;

  const buildShoeDoor = (side) => {
    const pivot = group(side < 0 ? 'shoe-left-door' : 'shoe-right-door');
    const hingeX = side < 0 ? leftHingeX : rightHingeX;
    pivot.position.set(hingeX, doorCenterY, doorZ);
    root.add(pivot);

    const slab = roundedBoxMesh(materials.warmWhitePaint, doorWidth, doorHeight, 0.021, 2, 0.005);
    slab.position.set(side < 0 ? doorWidth / 2 : -doorWidth / 2, 0, -0.0105);
    pivot.add(slab);

    const inset = roundedBoxMesh(materials.whitePaint, doorWidth - 0.095, doorHeight - 0.1, 0.008, 2, 0.012);
    inset.position.set(side < 0 ? doorWidth / 2 : -doorWidth / 2, 0, -0.025);
    pivot.add(inset);

    const knobX = side < 0 ? doorWidth - 0.043 : -doorWidth + 0.043;
    const knobRose = cylinder(materials.agedBrass, 0.014, 0.014, 0.008, knobX, 0.02, -0.033, {
      rotation: [Math.PI / 2, 0, 0], segments: 10, cast: false,
    });
    const knob = sphere(materials.agedBrass, 0.017, knobX, 0.02, -0.048, { cast: false });
    knob.scale.z *= 0.75;
    pivot.add(knobRose, knob);

    interactives.push(interactiveDoor({
      id: side < 0 ? 'shoe-cabinet-door-left' : 'shoe-cabinet-door-right',
      label: side < 0 ? '鞋柜 · 左门' : '鞋柜 · 右门',
      pivot,
      openAngle: side < 0 ? 1.86 : -1.86,
    }));
    return pivot;
  };

  buildShoeDoor(-1);
  buildShoeDoor(1);

  setShadows(root, true, true);
  return { group: root, interactives };
}

/* ------------------------------------------------------------------ *
 * Public furniture assembly
 * ------------------------------------------------------------------ */

export function buildFurniture(materials, textureSet) {
  const root = group('furniture');
  root.add(buildGallery(materials));
  root.add(buildBed(materials));
  root.add(buildDeskWithProps(materials, textureSet));
  root.add(buildChair(materials));

  const wardrobe = buildWardrobe(materials);
  root.add(wardrobe.group);

  const shoe = buildShoeCabinet(materials);
  root.add(shoe.group);

  return {
    group: root,
    interactives: [...wardrobe.interactives, ...shoe.interactives],
  };
}

