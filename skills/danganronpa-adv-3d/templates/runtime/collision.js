/**
 * 2-D collision world for a circular first-person walker.
 *
 * Boxes are OBBs on the XZ plane; circles are round props. Resolution
 * slides along surfaces and escapes an inside-box centre through the
 * closest face. Three passes handle corners where two boxes overlap.
 */

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

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
    const entry = { x, z, radius, active: true };
    this.circles.push(entry);
    return entry;
  }

  setBox(entry, values) {
    if (!entry) return;
    Object.assign(entry, values);
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

        // World -> box local.
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
          // Centre is inside the box: escape through the closest face.
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

        // Box local -> world.
        position.x += offsetX * cos + offsetZ * sin;
        position.z += -offsetX * sin + offsetZ * cos;
        moved = true;
        corrections += 1;
      }

      for (const circle of this.circles) {
        if (!circle.active) continue;
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
