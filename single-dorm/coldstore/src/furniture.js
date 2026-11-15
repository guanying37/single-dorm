import * as THREE from 'three';
import {
  boxGeometry,
  cylinderGeometry,
  planeGeometry,
  sphereGeometry,
  trs,
  mulberry32,
  StaticBuilder,
} from './geometry.js';
import { ROOM, HALF_W, SHELF } from './config.js';

/* ------------------------------------------------------------------ *
 * Heavy-duty shelving and its contents.
 *
 * Two 4-tier stainless runs, three 1.35 m bays each, with posts, front
 * and back rails, under-shelf reinforcement ribs, end stops and levelling
 * feet. Every shelf is filled with the cold-store kit of trade: stainless
 * food pans under cling film, clear labelled containers, unmarked kraft
 * cartons. The aisle side stays clear of every package.
 * ------------------------------------------------------------------ */

const BAYS = Object.freeze([
  { z0: SHELF.zStart, z1: SHELF.zStart + SHELF.bayLength },
  { z0: SHELF.zStart + SHELF.bayLength, z1: SHELF.zStart + SHELF.bayLength * 2 },
  { z0: SHELF.zStart + SHELF.bayLength * 2, z1: SHELF.zEnd },
].map((bay) => ({ ...bay, zc: (bay.z0 + bay.z1) / 2 })));

const TIERS = SHELF.tiers;
const SUSPENDED_TOP = 1;

const COUNTS = { pans: 0, frozenPans: 0, boxes: 0, cartons: 0, sparePans: 0, labels: 0 }; // the north-west bay keeps its top tier clear for the evaporator

function addBox(builder, key, w, h, d, x, y, z, ry = 0, options = {}) {
  builder.add(key, boxGeometry(w, h, d), trs(x, y, z, ry), {
    cast: options.cast ?? true,
    receive: options.receive ?? true,
  });
}

/* --- Shelving ------------------------------------------------------ */

function buildRun(builder, side) {
  const cx = side * SHELF.centerX;
  const halfD = SHELF.depth / 2;
  const postHalf = SHELF.post / 2;
  const postXs = [cx - halfD + postHalf, cx + halfD - postHalf];
  const postZs = [-2.55, -1.2, 0.15, 1.5];

  // Posts with levelling feet.
  for (const px of postXs) {
    for (const pz of postZs) {
      addBox(builder, 'steel', SHELF.post, SHELF.height, SHELF.post, px, SHELF.height / 2 + 0.02, pz);
      addBox(builder, 'steelDark', SHELF.post + 0.012, 0.03, SHELF.post + 0.012, px, 0.015, pz, 0, {
        cast: false,
      });
      addBox(builder, 'blackPlastic', 0.055, 0.016, 0.055, px, 0.008, pz, 0, { cast: false });
    }
  }

  // Horizontal run braces at the back and ends.
  const runZ0 = postZs[0];
  const runZ1 = postZs[postZs.length - 1];
  for (const y of [0.52, 1.53]) {
    addBox(builder, 'steelDark', 0.03, 0.045, runZ1 - runZ0, cx - halfD + 0.02, y, (runZ0 + runZ1) / 2, 0, {
      cast: false,
    });
  }
  for (const pz of [runZ0, runZ1]) {
    addBox(builder, 'steelDark', SHELF.depth - 0.02, 0.04, 0.03, cx, 1.53, pz, 0, { cast: false });
    addBox(builder, 'steelDark', SHELF.depth - 0.02, 0.04, 0.03, cx, 0.52, pz, 0, { cast: false });
  }

  for (let bayIndex = 0; bayIndex < BAYS.length; bayIndex += 1) {
    const bay = BAYS[bayIndex];
    const bayLen = bay.z1 - bay.z0;
    for (const y of TIERS) {
      // Shelf panel with a folded edge.
      addBox(builder, 'steel', SHELF.depth - 0.035, 0.014, bayLen - 0.02, cx, y, bay.zc, 0, {
        cast: true,
      });
      addBox(builder, 'steelPolished', SHELF.depth - 0.02, 0.022, 0.014, cx, y + 0.012, bay.z0 + 0.01, 0, {
        cast: false,
      });
      addBox(builder, 'steelPolished', SHELF.depth - 0.02, 0.022, 0.014, cx, y + 0.012, bay.z1 - 0.01, 0, {
        cast: false,
      });
      // Front and back rails.
      for (const railX of [cx - halfD + 0.016, cx + halfD - 0.016]) {
        addBox(builder, 'steelDark', 0.028, 0.055, bayLen, railX, y - 0.035, bay.zc, 0, { cast: false });
      }
      // Front anti-slip lip, slightly proud of the shelf edge.
      addBox(builder, 'steelPolished', 0.02, 0.03, bayLen, side < 0 ? cx + halfD - 0.01 : cx - halfD + 0.01, y + 0.016, bay.zc, 0, {
        cast: false,
      });
      // Reinforcement ribs under the panel.
      for (const dz of [-bayLen / 3, 0, bayLen / 3]) {
        addBox(builder, 'steelDark', SHELF.depth - 0.09, 0.03, 0.026, cx, y - 0.022, bay.zc + dz, 0, {
          cast: false,
        });
      }
      // Bay end plates.
      for (const pz of [bay.z0 + 0.012, bay.z1 - 0.012]) {
        addBox(builder, 'steel', SHELF.depth, 0.06, 0.012, cx, y - 0.03, pz, 0, { cast: false });
      }
    }
  }
}

/* --- Food pans, containers and cartons ----------------------------- */

function filmSheet(width, depth) {
  const geometry = new THREE.PlaneGeometry(width, depth, 5, 5);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const u = (position.getX(i) / width + 0.5) * Math.PI;
    const v = (position.getZ(i) / depth + 0.5) * Math.PI;
    position.setY(i, -0.007 * Math.sin(u) * Math.sin(v));
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function addFoodPan(builder, materials, x, y, z, options = {}) {
  const w = options.w ?? 0.34;
  const d = options.d ?? 0.38;
  const h = options.h ?? 0.1;
  const fill = options.fill ?? 'meat';
  const ry = options.ry ?? 0;
  const frozen = Boolean(options.frozen);
  COUNTS.pans += 1;
  if (frozen) COUNTS.frozenPans += 1;

  const mat = new THREE.Matrix4().makeRotationY(ry);
  const place = (key, geometry, lx, ly, lz, opts) => {
    const local = new THREE.Matrix4().makeTranslation(lx, ly, lz);
    const world = new THREE.Matrix4().makeTranslation(x, y, z).multiply(mat).multiply(local);
    builder.add(key, geometry, world, opts ?? {});
  };

  // Pan shell.
  place('traySteel', boxGeometry(w, 0.008, d), 0, 0.004, 0);
  place('traySteel', boxGeometry(w, h, 0.009), 0, h / 2, -d / 2 + 0.0045);
  place('traySteel', boxGeometry(w, h, 0.009), 0, h / 2, d / 2 - 0.0045);
  place('traySteel', boxGeometry(0.009, h, d), -w / 2 + 0.0045, h / 2, 0);
  place('traySteel', boxGeometry(0.009, h, d), w / 2 - 0.0045, h / 2, 0);
  // Rolled rim.
  place('steelPolished', boxGeometry(w + 0.014, 0.012, 0.016), 0, h - 0.004, -d / 2);
  place('steelPolished', boxGeometry(w + 0.014, 0.012, 0.016), 0, h - 0.004, d / 2);
  place('steelPolished', boxGeometry(0.016, 0.012, d + 0.014), -w / 2, h - 0.004, 0);
  place('steelPolished', boxGeometry(0.016, 0.012, d + 0.014), w / 2, h - 0.004, 0);

  // Food surface and a few chunks for silhouette.
  const foodSurface = planeGeometry(w - 0.03, d - 0.03);
  foodSurface.rotateX(-Math.PI / 2);
  place(fill === 'meat' ? 'meat' : 'produce', foodSurface, 0, h - 0.028, 0, {
    cast: false,
    receive: true,
  });
  const rng = mulberry32(Math.round((x + 3) * 971 + (z + 4) * 613));
  const chunks = fill === 'produce' ? 7 + Math.floor(rng() * 4) : 4 + Math.floor(rng() * 3);
  for (let i = 0; i < chunks; i += 1) {
    const cx = (rng() - 0.5) * (w - 0.11);
    const cz = (rng() - 0.5) * (d - 0.11);
    const radius = fill === 'produce' ? 0.024 + rng() * 0.024 : 0.022 + rng() * 0.02;
    place(fill === 'meat' ? 'meat' : 'produce', sphereGeometry(radius, 8, 6), cx, h - 0.06 + rng() * 0.016, cz, {
      cast: false,
      receive: true,
    });
  }

  // Cling film with a slight sag, kept inside the rim.
  place('film', filmSheet(w - 0.006, d - 0.006), 0, h + 0.008, 0, { cast: false, receive: false });
  // A folded film tab on one side.
  place('film', boxGeometry(0.05, 0.004, 0.03), w / 2 - 0.06, h - 0.006, d / 2 + 0.002, {
    cast: false,
    receive: false,
  });

  if (frozen) {
    place('frostPatch', filmSheet(w - 0.02, d - 0.02), 0, h + 0.012, 0, {
      cast: false,
      receive: false,
    });
  }
}

function addFoodBox(builder, materials, x, y, z, options = {}) {
  const w = options.w ?? 0.28;
  const d = options.d ?? 0.24;
  const h = options.h ?? 0.2;
  const ry = options.ry ?? 0;
  const fill = options.fill ?? 'produce';
  COUNTS.boxes += 1;
  COUNTS.labels += 1;
  const mat = new THREE.Matrix4().makeRotationY(ry);
  const place = (key, geometry, lx, ly, lz, opts) => {
    const local = new THREE.Matrix4().makeTranslation(lx, ly, lz);
    const world = new THREE.Matrix4().makeTranslation(x, y, z).multiply(mat).multiply(local);
    builder.add(key, geometry, world, opts ?? {});
  };

  // Clear container.
  place('foodBox', boxGeometry(w, h, d), 0, h / 2 + 0.004, 0);
  place('foodBoxLid', boxGeometry(w + 0.016, 0.014, d + 0.016), 0, h + 0.008, 0);
  place('foodBoxLid', boxGeometry(w - 0.02, 0.008, d - 0.02), 0, h + 0.018, 0);
  // Rim frame and corner posts give the clear box a readable silhouette.
  place('foodBoxLid', boxGeometry(w + 0.022, 0.016, d + 0.022), 0, 0.012, 0, { cast: false });
  place('foodBoxLid', boxGeometry(w + 0.02, 0.012, d + 0.02), 0, h, 0, { cast: false });
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      place('foodBoxLid', boxGeometry(0.016, h, 0.016), sx * (w / 2 - 0.006), h / 2 + 0.012, sz * (d / 2 - 0.006), {
        cast: false,
      });
    }
  }
  // Loose contents, so the clear walls and the label read through the box.
  const rng = mulberry32(Math.round((x + 4) * 733 + (z + 5) * 419));
  for (let i = 0; i < 4; i += 1) {
    const radius = 0.032 + rng() * 0.022;
    place(
      fill === 'meat' ? 'meat' : 'produce',
      sphereGeometry(radius, 8, 6),
      (rng() - 0.5) * (w - 0.11),
      h * 0.3 + rng() * h * 0.28,
      (rng() - 0.5) * (d - 0.11),
      { cast: false, receive: true },
    );
  }
  const facing = options.facing ?? 1;
  const labelGeometry = planeGeometry(0.085, 0.05);
  labelGeometry.rotateY((facing * Math.PI) / 2);
  place('labelPaper', labelGeometry, facing * (w / 2 + 0.003), h * 0.62, 0, {
    cast: false,
    receive: false,
  });
}

function addCarton(builder, materials, x, y, z, options = {}) {
  const w = options.w ?? 0.32;
  const ry = options.ry ?? 0;
  const height = options.height ?? 0.26;
  const depth = options.depth ?? 0.34;
  const facing = options.facing ?? 1;
  const shade = options.shade ? 'cardboardDark' : 'cardboard';
  COUNTS.cartons += 1;
  COUNTS.labels += 1;
  const mat = new THREE.Matrix4().makeRotationY(ry);
  const place = (key, geometry, lx, ly, lz, opts) => {
    const local = new THREE.Matrix4().makeTranslation(lx, ly, lz);
    const world = new THREE.Matrix4().makeTranslation(x, y, z).multiply(mat).multiply(local);
    builder.add(key, geometry, world, opts ?? {});
  };

  place(shade, boxGeometry(w, height, depth), 0, height / 2, 0);
  // Lid folds.
  place(shade, boxGeometry(w + 0.008, 0.012, depth + 0.008), 0, height + 0.006, 0, { cast: false });
  place('cardboard', boxGeometry(0.05, 0.013, depth + 0.01), w / 2 - 0.05, height + 0.013, 0, {
    cast: false,
  });
  place('cardboard', boxGeometry(w, 0.013, 0.03), 0, height + 0.013, -depth / 2 + 0.02, {
    cast: false,
  });
  // Packing tape and a blank label (no characters).
  const labelGeometry = planeGeometry(0.05, 0.07);
  labelGeometry.rotateY((facing * Math.PI) / 2);
  place('labelPaper', labelGeometry, facing * (w / 2 + 0.002), height * 0.44, 0, {
    cast: false,
    receive: false,
  });
  place('panelSeam', boxGeometry(0.06, 0.002, depth + 0.002), -w / 4, height + 0.001, 0, {
    cast: false,
    receive: false,
  });
}

/* --- Fill patterns ------------------------------------------------- *
 * Each slot is one "cargo" position: two rows across the depth and three
 * along the bay. Some slots stay empty so the run does not read as a
 * texture; the bay nearest the door is picked over. */

function fillRun(builder, materials, side) {
  const cx = side * SHELF.centerX;
  const rowXs = [cx - 0.18, cx + 0.18];
  const facing = -side;
  const rng = mulberry32(side < 0 ? 0x51a7 : 0x2b93);
  const baySeeds = [0.86, 0.78, 0.52];

  for (let bayIndex = 0; bayIndex < BAYS.length; bayIndex += 1) {
    const bay = BAYS[bayIndex];
    const slotZs = [bay.zc - 0.42, bay.zc, bay.zc + 0.42];
    const density = baySeeds[bayIndex];
    for (let tierIndex = 0; tierIndex < TIERS.length; tierIndex += 1) {
      const y = TIERS[tierIndex] + 0.014;
      const clearTop = side < 0 && bayIndex === 0 && tierIndex === TIERS.length - SUSPENDED_TOP;
      if (clearTop) continue;
      for (let row = 0; row < rowXs.length; row += 1) {
        for (let slot = 0; slot < slotZs.length; slot += 1) {
          if (rng() > density) continue;
          const x = rowXs[row];
          const z = slotZs[slot];
          const ry = (rng() - 0.5) * 0.05;
          const roll = rng();
          if (tierIndex === 0) {
            if (roll < 0.72) {
              addCarton(builder, materials, x, y, z, {
                w: 0.31,
                height: 0.24 + rng() * 0.07,
                depth: 0.34,
                ry,
                facing,
                shade: rng() > 0.55,
              });
            } else if (roll < 0.9) {
              addFoodBox(builder, materials, x, y, z, {
                w: 0.3,
                d: 0.32,
                h: 0.22,
                ry,
                facing,
                fill: side < 0 ? 'meat' : 'produce',
              });
            } else {
              addFoodPan(builder, materials, x, y, z, {
                fill: side < 0 ? 'meat' : 'produce',
                ry,
              });
            }
          } else if (tierIndex === 3) {
            if (roll < 0.55) {
              addCarton(builder, materials, x, y, z, {
                w: 0.3,
                height: 0.2 + rng() * 0.06,
                depth: 0.33,
                ry,
                facing,
                shade: rng() > 0.5,
              });
            } else if (roll < 0.86) {
              addFoodBox(builder, materials, x, y, z, {
                w: 0.27,
                d: 0.3,
                h: 0.18,
                ry,
                facing,
                fill: side < 0 ? 'meat' : 'produce',
              });
            }
          } else {
            if (roll < 0.5) {
              addFoodPan(builder, materials, x, y, z, {
                fill: side < 0 ? 'meat' : 'produce',
                ry,
                frozen: side < 0 && bayIndex === 0 && rng() > 0.45,
              });
            } else if (roll < 0.78) {
              addFoodBox(builder, materials, x, y, z, {
                w: 0.28,
                d: 0.31,
                h: 0.2 + rng() * 0.04,
                ry,
                facing,
                fill: side < 0 ? 'meat' : 'produce',
              });
            } else if (roll < 0.92) {
              addCarton(builder, materials, x, y, z, {
                w: 0.28,
                height: 0.2,
                depth: 0.32,
                ry,
                facing,
                shade: rng() > 0.5,
              });
            }
          }
        }
      }
    }
  }
}

/* A stack of spare empty pans on the south-east bay keeps the top tier
 * from looking machine-filled. */
function addSparePans(builder, materials) {
  const x = SHELF.centerX + 0.02;
  const z = 0.62;
  const base = TIERS[3] + 0.014;
  for (let i = 0; i < 4; i += 1) {
    COUNTS.sparePans += 1;
    const y = base + i * 0.05;
    builder.add('traySteel', boxGeometry(0.34, 0.008, 0.38), trs(x, y + 0.004, z), { cast: false });
    builder.add('traySteel', boxGeometry(0.34, 0.042, 0.009), trs(x, y + 0.026, z - 0.186), {
      cast: false,
    });
    builder.add('traySteel', boxGeometry(0.34, 0.042, 0.009), trs(x, y + 0.026, z + 0.186), {
      cast: false,
    });
    builder.add('traySteel', boxGeometry(0.009, 0.042, 0.38), trs(x - 0.166, y + 0.026, z), {
      cast: false,
    });
    builder.add('traySteel', boxGeometry(0.009, 0.042, 0.38), trs(x + 0.166, y + 0.026, z), {
      cast: false,
    });
    builder.add('steelPolished', boxGeometry(0.36, 0.012, 0.016), trs(x, y + 0.048, z - 0.186), {
      cast: false,
    });
    builder.add('steelPolished', boxGeometry(0.36, 0.012, 0.016), trs(x, y + 0.048, z + 0.186), {
      cast: false,
    });
  }
}

export function buildShelves(builder, materials) {
  buildRun(builder, -1);
  buildRun(builder, 1);
  fillRun(builder, materials, -1);
  fillRun(builder, materials, 1);
  addSparePans(builder, materials);
}

export function getContentCounts() {
  return { ...COUNTS };
}

export const SHELF_INFO = Object.freeze({
  runs: 2,
  bays: BAYS.length,
  tiers: TIERS.length,
  bayLength: SHELF.bayLength,
  depth: SHELF.depth,
  height: SHELF.height,
  aisle: HALF_W * 2 - SHELF.depth * 2,
  roomArea: ROOM.width * ROOM.depth,
});
