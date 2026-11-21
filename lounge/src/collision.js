import { clamp } from './utils.js';

/* ------------------------------------------------------------------ *
 * 圆形玩家 vs 轴对齐 / 朝向盒子的二维碰撞。
 *
 * 墙、沙发、条案、椅子、门扇都以盒子表示，圆桌用圆形表示。玩家是
 * 半径 0.30 m 的圆，解算时沿表面滑动，墙角和桌角不会把镜头卡死。
 * ------------------------------------------------------------------ */

export class CollisionWorld {
  constructor() {
    this.boxes = [];
    this.circles = [];
  }

  addBox(box) {
    const entry = {
      x: 0,
      z: 0,
      hx: 0.5,
      hz: 0.5,
      rot: 0,
      active: true,
      ...box,
    };
    this.boxes.push(entry);
    return entry;
  }

  addCircle(x, z, radius) {
    const entry = { x, z, radius };
    this.circles.push(entry);
    return entry;
  }

  resolve(position, radius) {
    let corrections = 0;
    for (let pass = 0; pass < 3; pass += 1) {
      let moved = false;

      for (const box of this.boxes) {
        if (!box.active) continue;
        const cos = Math.cos(box.rot);
        const sin = Math.sin(box.rot);
        const dx = position.x - box.x;
        const dz = position.z - box.z;
        const localX = dx * cos - dz * sin;
        const localZ = dx * sin + dz * cos;

        const nearestX = clamp(localX, -box.hx, box.hx);
        const nearestZ = clamp(localZ, -box.hz, box.hz);
        let offsetX = localX - nearestX;
        let offsetZ = localZ - nearestZ;
        const distanceSq = offsetX * offsetX + offsetZ * offsetZ;

        if (distanceSq >= radius * radius) continue;

        if (distanceSq > 1e-8) {
          const distance = Math.sqrt(distanceSq);
          const push = (radius - distance) / distance;
          offsetX *= push;
          offsetZ *= push;
        } else {
          const penX = box.hx - Math.abs(localX);
          const penZ = box.hz - Math.abs(localZ);
          if (penX < penZ) {
            offsetX = (localX >= 0 ? 1 : -1) * (penX + radius);
            offsetZ = 0;
          } else {
            offsetX = 0;
            offsetZ = (localZ >= 0 ? 1 : -1) * (penZ + radius);
          }
        }

        position.x += offsetX * cos + offsetZ * sin;
        position.z += -offsetX * sin + offsetZ * cos;
        moved = true;
        corrections += 1;
      }

      for (const circle of this.circles) {
        const dx = position.x - circle.x;
        const dz = position.z - circle.z;
        const minDistance = radius + circle.radius;
        const distanceSq = dx * dx + dz * dz;
        if (distanceSq >= minDistance * minDistance || distanceSq < 1e-9) continue;
        const distance = Math.sqrt(distanceSq);
        const push = (minDistance - distance) / distance;
        position.x += dx * push;
        position.z += dz * push;
        moved = true;
        corrections += 1;
      }

      if (!moved) break;
    }
    return corrections;
  }
}
