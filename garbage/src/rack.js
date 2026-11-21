import * as THREE from 'three';
import { boxGeometry, trs } from './geometry.js';
import { RACK } from './config.js';

/* ------------------------------------------------------------------ *
 * Rusty four-tier angle rack against the north wall.
 *
 * Four angle posts, two 0.77 m bays, four sheet-steel boards with front
 * lips, cross rails, rear diagonal braces and rust freckles at the feet.
 * It sits directly under the corner camera — the blind spot — so the
 * clutter on it is only ever seen by the player, never by the lens.
 * ------------------------------------------------------------------ */

export const BAY_LENGTH = RACK.width / RACK.bays;
export const BAY_CENTERS = Object.freeze(
  Array.from({ length: RACK.bays }, (_, i) => RACK.centerX - RACK.width / 2 + BAY_LENGTH * (i + 0.5)),
);
export const TIER_TOP = Object.freeze(RACK.tiers.map((tier) => tier + RACK.board / 2));

function addBox(builder, key, w, h, d, x, y, z, ry = 0, options = {}) {
  builder.add(key, boxGeometry(w, h, d), trs(x, y, z, ry), {
    cast: options.cast ?? true,
    receive: options.receive ?? true,
  });
}

export function buildRack(builder) {
  const { centerX, centerZ, width, depth, height, post, board, tiers } = RACK;
  const x0 = centerX - width / 2;
  const x1 = centerX + width / 2;
  const z0 = centerZ - depth / 2;
  const z1 = centerZ + depth / 2;

  // Posts, feet and clip plates.
  for (const px of [x0 + post / 2, x1 - post / 2]) {
    for (const pz of [z0 + post / 2, z1 - post / 2]) {
      addBox(builder, 'rackRust', post, height, post, px, height / 2 + 0.02, pz);
      addBox(builder, 'rust', post + 0.008, 0.075, post + 0.008, px, 0.055, pz, 0, { cast: false });
      addBox(builder, 'binTrim', post + 0.012, 0.008, post + 0.012, px, 0.004, pz, 0, { cast: false });
      for (const tier of tiers) {
        addBox(builder, 'steelDark', 0.026, 0.02, 0.044, px, tier - 0.018, pz, 0, { cast: false });
      }
    }
  }

  // Boards, front lips and under-board ribs.
  for (const tier of tiers) {
    for (const px of [x0 + width / 4, x1 - width / 4]) {
      addBox(builder, 'rackRust', width / 2 - 0.035, board, depth - 0.03, px, tier, centerZ);
      // South (aisle-side) retaining lip.
      addBox(builder, 'rackRust', width / 2 - 0.05, 0.035, 0.012, px, tier + 0.012, z1 - 0.008, 0, { cast: false });
      // Under-board ribs.
      for (const dx of [-width / 8, width / 8]) {
        addBox(builder, 'steelDark', 0.024, 0.026, depth - 0.06, px + dx, tier - 0.02, centerZ, 0, { cast: false });
      }
    }
    // Front and rear rails at every tier.
    addBox(builder, 'steelDark', width - 0.06, 0.03, 0.026, centerX, tier - 0.038, z1 - 0.02, 0, { cast: false });
    addBox(builder, 'steelDark', width - 0.06, 0.03, 0.026, centerX, tier - 0.038, z0 + 0.02, 0, { cast: false });
  }

  // Top rail and two rear diagonals.
  addBox(builder, 'rackRust', width - 0.02, 0.04, 0.03, centerX, height + 0.02, z0 + 0.02, 0, { cast: false });
  addBox(builder, 'rackRust', width - 0.02, 0.04, 0.03, centerX, height + 0.02, z1 - 0.02, 0, { cast: false });
  for (const px of [x0 + 0.1, x1 - 0.1]) {
    const length = Math.hypot(depth - 0.1, height - tiers[0]);
    const brace = new THREE.CylinderGeometry(0.011, 0.011, length, 6);
    const angle = Math.atan2(depth - 0.1, height - tiers[0]);
    builder.add('rackRust', brace, trs(px, (height + tiers[0]) / 2, centerZ, 0, 1, 1, 1, angle, 0), { cast: false });
  }

  // Rust blooms where water sits on the boards.
  for (const tier of tiers) {
    for (const px of [x0 + 0.22, centerX + 0.3]) {
      addBox(builder, 'rust', 0.16, 0.002, 0.1, px, tier + board / 2 + 0.001, centerZ + 0.06, 0, { cast: false });
    }
  }
  // A bent hanging bracket on the left post, no load.
  addBox(builder, 'rackRust', 0.025, 0.16, 0.025, x0 - 0.01, height - 0.22, z1 - 0.03, 0, { cast: false });
  addBox(builder, 'steelDark', 0.03, 0.02, 0.12, x0 + 0.03, height - 0.3, z1 - 0.03, 0, { cast: false });
}

export const RACK_INFO = Object.freeze({
  tiers: RACK.tiers.length,
  bays: RACK.bays,
  boards: RACK.tiers.length * RACK.bays,
  posts: 4,
});
