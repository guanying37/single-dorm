import * as THREE from 'three';
import {
  boxGeometry,
  cylinderGeometry,
  planeGeometry,
  roundedBoxGeometry,
  trs,
  StaticBuilder,
} from './geometry.js';
import { BINS, BIN_SIZE, CONTENT_COUNTS } from './config.js';

/* ------------------------------------------------------------------ *
 * Two 660 L four-wheel industrial bins.
 *
 * Open-top tapered body (outer shell + dark inner shell), four casters,
 * rim lip, side ribs, end handles, a hazard sticker and a hinged lid. The
 * lid pivots at the aisle-side edge, so it can be raised without fouling
 * the east wall. One lid is half open on a bunched liner; the other is
 * closed and interactive.
 * ------------------------------------------------------------------ */

function addBox(builder, key, w, h, d, x, y, z, ry = 0, options = {}) {
  builder.add(key, boxGeometry(w, h, d), trs(x, y, z, ry), {
    cast: options.cast ?? true,
    receive: options.receive ?? true,
  });
}

function addCyl(builder, key, rt, rb, h, segments, x, y, z, options = {}) {
  builder.add(
    key,
    cylinderGeometry(rt, rb, h, segments),
    trs(x, y, z, options.ry ?? 0, 1, 1, 1, options.rx ?? 0, options.rz ?? 0),
    { cast: options.cast ?? true, receive: options.receive ?? true },
  );
}

/* A tapered box shell with no top face: four sides plus a bottom. The
 * inner variant reverses the winding so the room sees the lining. */
function shellGeometry(bottomWidth, bottomDepth, topWidth, topDepth, height, inset = 0, inner = false) {
  const bx = bottomWidth / 2 - inset;
  const bz = bottomDepth / 2 - inset;
  const tx = topWidth / 2 - inset;
  const tz = topDepth / 2 - inset;
  const y0 = 0;
  const y1 = height - inset * 0.4;
  const b = [
    [-bx, y0, -bz],
    [bx, y0, -bz],
    [bx, y0, bz],
    [-bx, y0, bz],
  ];
  const t = [
    [-tx, y1, -tz],
    [tx, y1, -tz],
    [tx, y1, tz],
    [-tx, y1, tz],
  ];
  const quads = [
    [b[1], b[0], t[0], t[1]], // -z
    [b[2], b[1], t[1], t[2]], // +x
    [b[3], b[2], t[2], t[3]], // +z
    [b[0], b[3], t[3], t[0]], // -x
    [b[0], b[1], b[2], b[3]], // bottom
  ];
  const positions = [];
  const uvs = [];
  for (const quad of quads) {
    const list = inner ? [quad[3], quad[2], quad[1], quad[0]] : quad;
    // Inner bottom face is never seen; skip it to save fill.
    if (inner && quad === quads[4]) continue;
    for (const [x, y, z] of [list[0], list[1], list[2], list[0], list[2], list[3]]) {
      positions.push(x, y, z);
    }
    uvs.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/* The bins are chutes over the incinerator below, not removable containers:
 * the bottom is sealed with a bolted steel cover and there is no inner bin,
 * liner or loose trash inside. Heat slits around the cover hint at the
 * furnace underneath. */
function addIncineratorSeal(builder) {
  const y = 0.56;
  // Rubber gasket frame and the heavy cover plate.
  addBox(builder, 'binTrim', 0.8, 0.03, 1.06, 0, y, 0, 0, { cast: false });
  addBox(builder, 'sealPlate', 0.74, 0.022, 1.0, 0, y + 0.02, 0, 0, { cast: false });
  addBox(builder, 'steelDark', 0.06, 0.026, 0.98, 0, y + 0.04, 0, 0, { cast: false });
  addBox(builder, 'rust', 0.18, 0.004, 0.12, -0.22, y + 0.034, 0.3, 0.3, { cast: false });
  // Perimeter bolts.
  for (const sx of [-1, 1]) {
    for (let i = -1; i <= 1; i += 1) {
      addCyl(builder, 'steelPolished', 0.014, 0.014, 0.008, 8, sx * 0.32, y + 0.04, i * 0.4, { cast: false });
    }
  }
  // Lifting ring and its boss.
  addCyl(builder, 'steelDark', 0.05, 0.06, 0.03, 10, 0, y + 0.045, 0, { cast: false });
  const ring = new THREE.TorusGeometry(0.075, 0.011, 6, 20);
  ring.rotateX(Math.PI / 2);
  builder.add('steelPolished', ring, trs(0, y + 0.075, 0), { cast: false });
  // Hazard pictogram lying on the plate.
  builder.add(
    'hazardSticker',
    planeGeometry(0.16, 0.16),
    trs(-0.16, y + 0.034, -0.2, 0, 1, 1, 1, -Math.PI / 2, 0),
    { cast: false, receive: true },
  );
  // Thin heat slits around the gasket, hinting at the furnace below.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addBox(builder, 'incineratorGlow', 0.2, 0.004, 0.014, sx * 0.31, y + 0.036, sz * 0.46, 0, { cast: false });
      addBox(builder, 'incineratorGlow', 0.014, 0.004, 0.18, sx * 0.41, y + 0.036, sz * 0.25, 0, { cast: false });
    }
  }
}

function mergeBuckets(source, target, matrix) {
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

export function buildBins(staticBuilder, materials, root) {
  const result = [];
  const { width, depth, bodyHeight, bodyBottom, lidThickness, wheelRadius, wheelWidth } = BIN_SIZE;
  const topY = bodyBottom + bodyHeight;
  const halfW = width / 2;
  const halfD = depth / 2;

  for (const bin of BINS) {
    const bodyKey = bin.body;
    const lidKey = bin.body === 'binGreen' ? 'binGreenLid' : 'binBlackLid';
    const builder = new StaticBuilder();

    // Open body: outer skin, dark inner skin and a heavy bottom pan.
    builder.add(
      bodyKey,
      shellGeometry(depth - 0.02, width - 0.02, depth, width, bodyHeight),
      trs(0, bodyBottom, 0),
      { cast: true, receive: true },
    );
    builder.add(
      'binTrim',
      shellGeometry(depth - 0.02, width - 0.02, depth, width, bodyHeight, 0.035, true),
      trs(0, bodyBottom + 0.012, 0),
      { cast: false, receive: true },
    );
    addBox(builder, 'binTrim', depth - 0.06, 0.03, width - 0.06, 0, bodyBottom + 0.015, 0, 0, { cast: false });

    // Rim lip: four rails plus a rolled top edge.
    for (const sz of [-1, 1]) {
      addBox(builder, bodyKey, depth + 0.03, 0.05, 0.045, 0, topY - 0.025, sz * halfW, 0);
    }
    for (const sx of [-1, 1]) {
      addBox(builder, bodyKey, 0.045, 0.05, width - 0.02, sx * halfD, topY - 0.025, 0);
    }
    for (const [sx, sz] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ]) {
      addBox(builder, 'binTrim', 0.06, 0.04, 0.06, sx * (halfD - 0.015), topY - 0.02, sz * (halfW - 0.015), 0, {
        cast: false,
      });
    }

    // Side ribs and a reinforce band at mid height.
    for (const sz of [-1, 1]) {
      for (const x of [-0.28, 0, 0.28]) {
        addBox(builder, bodyKey, 0.035, bodyHeight * 0.8, 0.012, x, bodyBottom + bodyHeight * 0.52, sz * (halfW + 0.005), 0, {
          cast: false,
        });
      }
      addBox(builder, bodyKey, depth + 0.01, 0.035, 0.012, 0, bodyBottom + bodyHeight * 0.34, sz * (halfW + 0.005), 0, {
        cast: false,
      });
    }
    for (const sx of [-1, 1]) {
      addBox(builder, bodyKey, 0.012, 0.035, width - 0.06, sx * (halfD + 0.005), bodyBottom + bodyHeight * 0.34, 0, 0, {
        cast: false,
      });
    }

    // End handles: a U-shaped pull bar on each short side.
    for (const sz of [-1, 1]) {
      const z = sz * (halfW + 0.025);
      addBox(builder, 'steelShelf', 0.62, 0.032, 0.032, 0, topY - 0.17, z, 0, { cast: false });
      for (const sx of [-1, 1]) {
        addBox(builder, 'steelShelf', 0.035, 0.06, 0.035, sx * 0.3, topY - 0.17, z - sz * 0.03, 0, {
          cast: false,
        });
        addBox(builder, 'steelDark', 0.05, 0.02, 0.05, sx * 0.3, topY - 0.2, z - sz * 0.05, 0, { cast: false });
      }
    }

    // Chassis, casters, forks and brakes.
    addBox(builder, 'binTrim', depth - 0.12, 0.05, width - 0.12, 0, bodyBottom - 0.02, 0, 0, { cast: false });
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const wx = sx * (halfD - 0.13);
        const wz = sz * (halfW - 0.16);
        addBox(builder, 'steelDark', 0.1, 0.03, 0.1, wx, 0.155, wz, 0, { cast: false });
        for (const s of [-1, 1]) {
          addBox(builder, 'steelDark', 0.012, 0.1, 0.1, wx + s * 0.035, 0.115, wz, 0, { cast: false });
        }
        addCyl(builder, 'rubber', wheelRadius, wheelRadius, wheelWidth, 14, wx, wheelRadius, wz, {
          rx: Math.PI / 2,
          cast: true,
        });
        addCyl(builder, 'steelDark', wheelRadius * 0.42, wheelRadius * 0.42, wheelWidth + 0.006, 10, wx, wheelRadius, wz, {
          rx: Math.PI / 2,
          cast: false,
        });
        addBox(builder, 'steelDark', 0.02, 0.02, 0.08, wx, 0.055, wz + sz * 0.05, 0, { cast: false });
      }
    }

    // Hazard triangle on the aisle face.
    builder.add(
      'hazardSticker',
      planeGeometry(0.19, 0.19),
      trs(-halfD - 0.006, bodyBottom + bodyHeight * 0.55, 0.18, -Math.PI / 2),
      { cast: false, receive: true },
    );
    // A small rusted maker's plate, no words.
    addBox(builder, 'rust', 0.16, 0.08, 0.003, -halfD - 0.004, bodyBottom + bodyHeight * 0.36, -0.2, 0, {
      cast: false,
    });
    for (const sz of [-1, 1]) {
      addCyl(builder, 'steelDark', 0.006, 0.006, 0.004, 6, -halfD - 0.007, bodyBottom + bodyHeight * 0.36, -0.2 + sz * 0.06, {
        rz: Math.PI / 2,
        cast: false,
      });
    }

    // Rust weeping from the wheel mounts.
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        addBox(builder, 'rust', 0.06, 0.1, 0.014, sx * (halfD - 0.06), 0.1, sz * (halfW - 0.04), 0, { cast: false });
      }
    }

    addIncineratorSeal(builder);
    // The body is static: fold it into the room-wide material batches.
    mergeBuckets(builder, staticBuilder, trs(bin.x, 0, bin.z));

    // Only the lid stays a separate group so it can be picked and animated.
    const group = new THREE.Group();
    group.name = `garbage-bin-${bin.id}`;
    group.position.set(bin.x, 0, bin.z);
    root.add(group);
    // Invisible pick volume so the whole bin responds to the reticle even
    // though its body is now part of the merged static batches.
    const pick = new THREE.Mesh(
      boxGeometry(depth, bodyHeight + 0.1, width),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    pick.position.set(0, bodyBottom + bodyHeight / 2, 0);
    pick.name = `garbage-bin-pick-${bin.id}`;
    group.add(pick);

    // Lid: hinged at the aisle-side edge, opening up and over the body.
    const lidPivot = new THREE.Group();
    lidPivot.name = `garbage-bin-lid-${bin.id}`;
    // Hinged at the wall-side edge, so it leans back against the east wall
    // when fully open and never sweeps across the working aisle.
    lidPivot.position.set(halfD - 0.02, topY + 0.012, 0);
    const lidBuilder = new StaticBuilder();
    lidBuilder.add(
      lidKey,
      roundedBoxGeometry(depth * 0.98, lidThickness, width * 1.01, 0.022, 3),
      trs(-depth / 2, lidThickness / 2, 0),
      { cast: false, receive: true },
    );
    // Stiffening ribs across the lid.
    for (const z of [-0.34, 0, 0.34]) {
      addBox(lidBuilder, lidKey, depth * 0.86, 0.014, 0.06, -depth / 2, lidThickness + 0.008, z, 0, { cast: false });
    }
    // Hinge barrel at the wall-side edge.
    addCyl(lidBuilder, 'steelShelf', 0.024, 0.024, width * 0.92, 10, 0, 0.005, 0, {
      rx: Math.PI / 2,
      cast: false,
    });
    lidBuilder.flush(lidPivot, materials, `garbage-bin-lid-stat-${bin.id}`);
    lidPivot.rotation.z = -bin.lid;
    group.add(lidPivot);

    CONTENT_COUNTS.bins += 1;
    result.push({ config: bin, group, lidPivot });
  }
  return result;
}
