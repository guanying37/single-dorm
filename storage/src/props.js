import * as THREE from 'three';
import { planeGeometry, mulberry32 } from './geometry.js';
import { BULB, DOOR, ROOM } from './config.js';

/* ------------------------------------------------------------------ *
 * Non-structural atmosphere: the louvre light comb on the floor, the
 * cool bleed around the vent, the warm halo around the bare bulb and a
 * slow layer of dust motes. Nothing here casts a shadow.
 * ------------------------------------------------------------------ */

function createDustMotes(texture, count = 120) {
  const rng = mulberry32(0x5eed11);
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const speeds = new Float32Array(count);
  const radii = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    // Motes cluster in the warm pool under the bare bulb.
    positions[i * 3] = 0.1 + (rng() - 0.5) * 1.8;
    positions[i * 3 + 1] = 0.9 + rng() * 1.7;
    positions[i * 3 + 2] = 0.35 + (rng() - 0.5) * 3.0;
    phases[i] = rng() * Math.PI * 2;
    speeds[i] = 0.05 + rng() * 0.11;
    radii[i] = 0.05 + rng() * 0.16;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    map: texture,
    color: 0xffe6bc,
    size: 0.015,
    transparent: true,
    opacity: 0.26,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  points.name = 'storage-dust-motes';
  points.frustumCulled = false;
  points.renderOrder = 4;

  return {
    points,
    update(elapsed) {
      const array = geometry.attributes.position.array;
      for (let i = 0; i < count; i += 1) {
        const phase = phases[i];
        const speed = speeds[i];
        const radius = radii[i];
        array[i * 3] += Math.sin(elapsed * speed + phase) * 0.0006;
        array[i * 3 + 1] += Math.sin(elapsed * speed * 0.7 + phase * 1.7) * 0.00042;
        array[i * 3 + 2] += Math.cos(elapsed * speed * 0.8 + phase) * 0.0006;
        array[i * 3] = Math.max(-1.15, Math.min(1.15, array[i * 3]));
        array[i * 3 + 1] = Math.max(0.2, Math.min(2.6, array[i * 3 + 1]));
        array[i * 3 + 2] = Math.max(-2.35, Math.min(2.35, array[i * 3 + 2]));
        array[i * 3] += Math.sin(elapsed * 0.09 + radius * 40) * 0.00012;
      }
      geometry.attributes.position.needsUpdate = true;
    },
  };
}

function addGlowSprite(root, texture, position, scale, opacity) {
  const material = new THREE.SpriteMaterial({
    map: texture,
    color: 0xffe0ae,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.name = 'storage-bulb-halo';
  sprite.position.set(position.x, position.y, position.z);
  sprite.scale.set(scale, scale, 1);
  sprite.renderOrder = 5;
  root.add(sprite);
  return sprite;
}

export function buildProps(root, materials, textures) {
  // The comb of light the louvres throw onto the concrete just inside
  // the door. Additive, so it reads on the stained floor without a light.
  const combGeometry = planeGeometry(1.55, 1.2);
  combGeometry.rotateX(-Math.PI / 2);
  const comb = new THREE.Mesh(combGeometry, materials.louverLight);
  comb.name = 'storage-louvre-light-comb';
  comb.position.set(DOOR.centerX, 0.006, 1.66);
  comb.renderOrder = 2;
  comb.receiveShadow = false;
  root.add(comb);

  // A thin bleed under the door.
  const seepGeometry = planeGeometry(0.92, 0.13);
  seepGeometry.rotateX(-Math.PI / 2);
  const seep = new THREE.Mesh(seepGeometry, materials.ventGlow);
  seep.position.set(DOOR.centerX, 0.005, 2.29);
  seep.renderOrder = 2;
  root.add(seep);

  const halo = addGlowSprite(root, textures.glow, BULB, 0.72, 0.5);
  const dust = createDustMotes(textures.dust, 120);
  root.add(dust.points);

  // Soft wall shadows behind the two hanging garments.
  const wallShadowMaterial = new THREE.MeshBasicMaterial({
    map: textures.contactShadow,
    color: 0x050504,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    toneMapped: false,
  });
  for (const z of [-0.36, -0.96]) {
    const geometry = planeGeometry(0.58, 1.08);
    const shadow = new THREE.Mesh(geometry, wallShadowMaterial);
    shadow.position.set(1.193, 1.32, z);
    shadow.rotation.y = -Math.PI / 2;
    shadow.renderOrder = 1;
    root.add(shadow);
  }

  let lightLevel = 1;

  return {
    comb,
    seep,
    halo,
    dust,
    update(elapsed) {
      dust.update(elapsed);
      // A very slow breathing in the halo keeps it from looking printed on.
      halo.material.opacity = (0.42 + Math.sin(elapsed * 0.7) * 0.03) * lightLevel;
    },
    setLightLevel(level) {
      lightLevel = level;
      comb.material.opacity = 0.14 + 0.32 * (1 - level * 0.45);
      seep.material.opacity = 0.08 + 0.14 * (1 - level * 0.5);
    },
  };
}
