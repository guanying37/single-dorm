import * as THREE from 'three';
import { planeGeometry, mulberry32 } from './geometry.js';
import { DOOR, LAMPS, MONITOR, ROOM } from './config.js';

/* ------------------------------------------------------------------ *
 * Atmosphere for the garbage room: dust motes in the pendant light,
 * warm halos around the two tungsten lamps, a weak green bloom from the
 * monitor stack, and a cold pool of corridor light under the door.
 * Nothing here casts a shadow.
 * ------------------------------------------------------------------ */

function createDustMotes(texture, count = 140) {
  const rng = mulberry32(0x0badc0);
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (rng() - 0.5) * ROOM.width * 0.92;
    positions[i * 3 + 1] = 0.5 + rng() * 2.1;
    positions[i * 3 + 2] = (rng() - 0.5) * ROOM.depth * 0.92;
    phases[i] = rng() * Math.PI * 2;
    speeds[i] = 0.05 + rng() * 0.1;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    map: texture,
    color: 0xffe0b0,
    size: 0.017,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  points.name = 'garbage-dust-motes';
  points.frustumCulled = false;
  points.renderOrder = 4;

  return {
    points,
    update(elapsed) {
      const array = geometry.attributes.position.array;
      for (let i = 0; i < count; i += 1) {
        const phase = phases[i];
        const speed = speeds[i];
        array[i * 3] += Math.sin(elapsed * speed + phase) * 0.00055;
        array[i * 3 + 1] += Math.sin(elapsed * speed * 0.7 + phase * 1.7) * 0.0004;
        array[i * 3 + 2] += Math.cos(elapsed * speed * 0.8 + phase) * 0.00055;
        array[i * 3] = Math.max(-2.02, Math.min(2.02, array[i * 3]));
        array[i * 3 + 1] = Math.max(0.15, Math.min(2.8, array[i * 3 + 1]));
        array[i * 3 + 2] = Math.max(-2.56, Math.min(2.56, array[i * 3 + 2]));
      }
      geometry.attributes.position.needsUpdate = true;
    },
  };
}

function addGlowSprite(root, texture, position, scale, opacity, color = 0xffe0ae, name = 'garbage-lamp-halo') {
  const material = new THREE.SpriteMaterial({
    map: texture,
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.name = name;
  sprite.position.set(position.x, position.y, position.z);
  sprite.scale.set(scale, scale, 1);
  sprite.renderOrder = 5;
  root.add(sprite);
  return sprite;
}

export function buildProps(root, materials, textures) {
  // Warm halos for the two tungsten lamps.
  const mainHalo = addGlowSprite(root, textures.glow, LAMPS.main, 0.85, 0.42, 0xffd8a2, 'garbage-main-lamp-halo');
  const doorHalo = addGlowSprite(root, textures.glow, LAMPS.door, 0.5, 0.28, 0xffce9a, 'garbage-door-lamp-halo');

  // Green spill from the monitor stack.
  const monitorHalo = addGlowSprite(
    root,
    textures.glow,
    { x: MONITOR.crt.x - 0.24, y: MONITOR.crt.y - 0.02, z: MONITOR.crt.z + 0.14 },
    0.66,
    0.2,
    0x8fd7a0,
    'garbage-monitor-halo',
  );

  // Cold corridor light leaking under the door, pooling on the cement.
  const poolMaterial = new THREE.MeshBasicMaterial({
    map: textures.glow,
    color: 0xa9c7bd,
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const poolGeometry = planeGeometry(1.2, 0.62);
  poolGeometry.rotateX(-Math.PI / 2);
  const pool = new THREE.Mesh(poolGeometry, poolMaterial);
  pool.name = 'garbage-door-light-pool';
  pool.position.set(DOOR.centerX, 0.0045, DOOR.wallZ - 0.32);
  pool.renderOrder = 2;
  root.add(pool);

  const dust = createDustMotes(textures.dust, 140);
  root.add(dust.points);

  let lightLevel = 1;
  let flickerLevel = 1;

  return {
    mainHalo,
    doorHalo,
    monitorHalo,
    pool,
    dust,
    update(elapsed) {
      dust.update(elapsed);
      // Gentle breathing on the halos keeps them from looking printed on.
      mainHalo.material.opacity = (0.36 + Math.sin(elapsed * 0.7) * 0.03) * lightLevel;
      doorHalo.material.opacity = (0.24 + Math.sin(elapsed * 0.9 + 1.2) * 0.02) * lightLevel;
      monitorHalo.material.opacity = 0.17 + Math.sin(elapsed * 1.4) * 0.012;
      // The cold strip under the door dims a touch with the room light.
      pool.material.opacity = 0.16 + 0.08 * (1 - lightLevel * 0.6);
    },
    setLightLevel(level) {
      lightLevel = level;
    },
    setFlicker(level) {
      flickerLevel = level;
      monitorHalo.material.opacity = 0.17 + 0.03 * flickerLevel;
    },
  };
}
