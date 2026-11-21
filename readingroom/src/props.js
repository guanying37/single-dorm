import * as THREE from 'three';
import { mulberry32 } from './geometry.js';
import { PENDANT, TABLE, BANKER_LAMP } from './config.js';

/* ------------------------------------------------------------------ *
 * 非结构性的气氛层：180 颗缓慢漂移的尘埃、三盏吊灯灯泡的暖色光晕、
 * 以及 CRT 扫描画面。它们都不投影，也不参与碰撞。
 * ------------------------------------------------------------------ */

function createDustMotes(texture, count = 180) {
  const rng = mulberry32(0x7a31c5);
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    // 一半聚在窗前的光柱里，一半落在吊灯下的暖区。
    const nearWindow = i % 2 === 0;
    if (nearWindow) {
      positions[i * 3] = (rng() - 0.5) * 4.6;
      positions[i * 3 + 1] = 0.5 + rng() * 2.1;
      positions[i * 3 + 2] = -4.9 + rng() * 1.3;
    } else {
      const z = PENDANT.zs[Math.floor(rng() * PENDANT.zs.length)];
      positions[i * 3] = (rng() - 0.5) * 2.8;
      positions[i * 3 + 1] = 0.75 + rng() * 1.5;
      positions[i * 3 + 2] = z + (rng() - 0.5) * 2.0;
    }
    phases[i] = rng() * Math.PI * 2;
    speeds[i] = 0.05 + rng() * 0.1;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    map: texture,
    color: 0xffe8c2,
    size: 0.016,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  points.name = 'readingroom-dust-motes';
  points.frustumCulled = false;
  points.renderOrder = 4;

  return {
    points,
    update(elapsed) {
      const array = geometry.attributes.position.array;
      for (let i = 0; i < count; i += 1) {
        const phase = phases[i];
        const speed = speeds[i];
        array[i * 3] += Math.sin(elapsed * speed + phase) * 0.0007;
        array[i * 3 + 1] += Math.sin(elapsed * speed * 0.7 + phase * 1.7) * 0.0004;
        array[i * 3 + 2] += Math.cos(elapsed * speed * 0.8 + phase) * 0.0006;
        // 慢速回位，尘埃不会漂出房间。
        array[i * 3] = Math.max(-2.9, Math.min(2.9, array[i * 3]));
        array[i * 3 + 1] = Math.max(0.25, Math.min(3.0, array[i * 3 + 1]));
        array[i * 3 + 2] = Math.max(-4.85, Math.min(4.7, array[i * 3 + 2]));
      }
      geometry.attributes.position.needsUpdate = true;
    },
  };
}

function addBulbHalo(root, texture, z) {
  const material = new THREE.SpriteMaterial({
    map: texture,
    color: 0xffdfae,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.name = `pendant-halo-${z.toFixed(2)}`;
  sprite.position.set(PENDANT.x, PENDANT.shadeBottom - 0.07, z);
  sprite.scale.set(0.62, 0.62, 1);
  sprite.renderOrder = 5;
  root.add(sprite);
  return sprite;
}

export function buildProps(root, materials, textures) {
  void materials;
  const dust = createDustMotes(textures.dust, 180);
  root.add(dust.points);

  const halos = PENDANT.zs.map((z) => addBulbHalo(root, textures.glow, z));

  // 阅读桌上的绿罩灯也有很小的一圈绿色光晕；用 Sprite 只给 3 个位置，
  // 避免 6 个透明层叠在桌面同一处。
  const greenHalos = [];
  for (const table of TABLE.list) {
    const material = new THREE.SpriteMaterial({
      map: textures.greenGlow,
      color: 0xc4f0c8,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.name = `banker-halo-${table.z.toFixed(2)}`;
    sprite.position.set(0, BANKER_LAMP.tableY + 0.3, table.z);
    sprite.scale.set(0.9, 0.55, 1);
    sprite.renderOrder = 5;
    root.add(sprite);
    greenHalos.push(sprite);
  }

  let lightLevel = 1;
  let tableLevel = 1;

  return {
    dust,
    halos,
    greenHalos,
    update(elapsed) {
      dust.update(elapsed);
      const breath = 0.94 + Math.sin(elapsed * 0.62) * 0.04;
      for (const halo of halos) halo.material.opacity = (0.04 + 0.34 * lightLevel) * breath;
      for (const halo of greenHalos) halo.material.opacity = (0.03 + 0.24 * tableLevel) * breath;
    },
    setLightLevel(level) {
      lightLevel = level;
    },
    setTableLevel(level) {
      tableLevel = level;
    },
  };
}
