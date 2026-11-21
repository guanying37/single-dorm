import * as THREE from 'three';
import { boxGeometry, cylinderGeometry, torusGeometry, trs, StaticBuilder } from './geometry.js';
import { SHELF } from './config.js';

/* ------------------------------------------------------------------ *
 * Five-tier boltless angle shelving against the west wall.
 *
 * Ten angle-iron posts at five z stations, four 0.925 m bays, five
 * 0.52 m deep boards with front lips, under-board ribs and cross beams.
 * Old galvanised finish with rust freckles at the feet. The contents are
 * built separately in clutter.js so this module stays a clean furniture
 * family that can be reused in any store room.
 * ------------------------------------------------------------------ */

export const BAY_LENGTH = (SHELF.zEnd - SHELF.zStart) / SHELF.bays;
export const BAY_CENTERS = Object.freeze(
  Array.from({ length: SHELF.bays }, (_, i) => SHELF.zStart + BAY_LENGTH * (i + 0.5)),
);
export const TIER_TOP = Object.freeze(SHELF.tiers.map((t) => t + SHELF.board / 2));

const POST_ZS = Object.freeze(
  Array.from({ length: SHELF.bays + 1 }, (_, i) => SHELF.zStart + BAY_LENGTH * i),
);

function addBox(builder, key, w, h, d, x, y, z, ry = 0, options = {}) {
  builder.add(key, boxGeometry(w, h, d), trs(x, y, z, ry), {
    cast: options.cast ?? true,
    receive: options.receive ?? true,
  });
}

export function buildShelf(builder) {
  const xBack = SHELF.xBack;
  const xFront = SHELF.xFront;
  const post = SHELF.post;
  const depth = SHELF.depth;
  const height = SHELF.height;

  // Posts with plastic feet and a boltless clip at every tier.
  for (const px of [xBack + post / 2, xFront - post / 2]) {
    for (const pz of POST_ZS) {
      addBox(builder, 'steelShelf', post, height, post, px, height / 2 + 0.02, pz);
      addBox(builder, 'steelDark', post + 0.012, 0.022, post + 0.012, px, 0.011, pz, 0, { cast: false });
      addBox(builder, 'rubber', post + 0.016, 0.012, post + 0.016, px, 0.004, pz, 0, { cast: false });
      for (const tier of SHELF.tiers) {
        // Clips sit on the aisle-side face of each post.
        const clipX = px > SHELF.centerX ? px + post / 2 + 0.004 : px - post / 2 - 0.004;
        addBox(builder, 'steelDark', 0.006, 0.028, 0.048, clipX, tier - 0.02, pz, 0, { cast: false });
        addBox(builder, 'steelPolished', 0.005, 0.006, 0.036, clipX + (px > SHELF.centerX ? 0.004 : -0.004), tier - 0.008, pz, 0, {
          cast: false,
        });
      }
      // A little rust where the feet meet the floor.
      addBox(builder, 'rust', post + 0.002, 0.09, post + 0.002, px, 0.07, pz, 0, { cast: false });
    }
  }

  // Long rear and front rails at each tier, plus the front anti-slip lip.
  for (const tier of SHELF.tiers) {
    for (const railX of [xBack + 0.018, xFront - 0.018]) {
      addBox(builder, 'steelDark', 0.03, 0.042, SHELF.zEnd - SHELF.zStart, railX, tier - 0.038, (SHELF.zStart + SHELF.zEnd) / 2, 0, {
        cast: false,
      });
    }
    // Front retaining lip, slightly proud of the board edge.
    addBox(
      builder,
      'steelPolished',
      0.012,
      0.034,
      SHELF.zEnd - SHELF.zStart - 0.02,
      xFront + 0.006,
      tier + 0.008,
      (SHELF.zStart + SHELF.zEnd) / 2,
      0,
      { cast: false },
    );
  }

  // Four bays × five boards.
  for (let bay = 0; bay < SHELF.bays; bay += 1) {
    const z0 = SHELF.zStart + BAY_LENGTH * bay + 0.012;
    const z1 = z0 + BAY_LENGTH - 0.024;
    const zc = (z0 + z1) / 2;
    const length = z1 - z0;
    for (const tier of SHELF.tiers) {
      // Board with a folded edge.
      addBox(builder, 'steelShelf', depth - 0.045, SHELF.board, length, SHELF.centerX, tier, zc);
      addBox(builder, 'steelPolished', depth - 0.03, 0.016, 0.012, SHELF.centerX, tier - 0.008, z0 + 0.006, 0, {
        cast: false,
      });
      addBox(builder, 'steelPolished', depth - 0.03, 0.016, 0.012, SHELF.centerX, tier - 0.008, z1 - 0.006, 0, {
        cast: false,
      });
      // Under-board reinforcement ribs.
      for (const dz of [-length / 3, 0, length / 3]) {
        addBox(builder, 'steelDark', depth - 0.1, 0.026, 0.024, SHELF.centerX, tier - 0.026, zc + dz, 0, {
          cast: false,
        });
      }
      // Bay end plates at the posts.
      for (const pz of [z0 + 0.004, z1 - 0.004]) {
        addBox(builder, 'steelDark', depth - 0.02, 0.05, 0.01, SHELF.centerX, tier - 0.028, pz, 0, { cast: false });
      }
    }
    // A diagonal brace at the back of each bay.
    const brace = new THREE.CylinderGeometry(0.012, 0.012, Math.hypot(BAY_LENGTH - 0.15, 1.1), 8);
    const angle = Math.atan2(BAY_LENGTH - 0.15, 1.1);
    builder.add(
      'steelDark',
      brace,
      trs(xBack + 0.055, 0.86, zc, 0, 1, 1, 1, angle, 0),
      { cast: false },
    );
  }

  // Low-level rust runs along the bottom rail.
  for (let i = 0; i < 5; i += 1) {
    addBox(builder, 'rust', 0.012, 0.06 + i * 0.01, 0.04, xFront - 0.005, 0.16, SHELF.zStart + 0.22 + i * 0.72, 0, {
      cast: false,
    });
  }
}

/* A small inventory summary for the scene stats. */
export const SHELF_INFO = Object.freeze({
  tiers: SHELF.tiers.length,
  bays: SHELF.bays,
  boards: SHELF.tiers.length * SHELF.bays,
  posts: POST_ZS.length * 2,
});
