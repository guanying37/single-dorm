import * as THREE from 'three';
import { createMaterials as createCorridorMaterials } from '../../shared/materials.js';

/* ------------------------------------------------------------------ *
 * 住宿区 2F 材质 = 走廊的深色木材 / 黑石 / 棕色墙纸 / 金属 / 黄铜，
 * 再补湿区白砖、薄荷砖、陶瓷、镜面、绿色指示灯。
 * ------------------------------------------------------------------ */

export function createMaterials(textures) {
  const base = createCorridorMaterials(textures);
  const std = (options) => new THREE.MeshStandardMaterial(options);

  const tileWhite = std({
    map: textures.tileWhite,
    bumpMap: textures.tileWhite,
    bumpScale: 0.0016,
    color: 0xffffff,
    roughness: 0.4,
    metalness: 0.02,
    envMapIntensity: 0.5,
    name: 'white-ceramic-tile',
  });

  const tileMint = std({
    map: textures.tileMint,
    bumpMap: textures.tileMint,
    bumpScale: 0.0016,
    color: 0xffffff,
    roughness: 0.42,
    metalness: 0.02,
    envMapIntensity: 0.45,
    name: 'mint-ceramic-tile',
  });

  const porcelain = std({
    color: 0xf2f0e9,
    roughness: 0.22,
    metalness: 0.02,
    envMapIntensity: 0.65,
    name: 'porcelain',
  });

  const chrome = std({
    color: 0xd7dade,
    roughness: 0.16,
    metalness: 0.92,
    envMapIntensity: 1.5,
    name: 'polished-chrome',
  });

  const mirror = std({
    color: 0x9fb4b1,
    roughness: 0.08,
    metalness: 0.68,
    envMapIntensity: 1.9,
    name: 'bathroom-mirror',
  });

  const doorSuite = std({
    color: 0x46655b,
    roughness: 0.55,
    metalness: 0.18,
    envMapIntensity: 0.4,
    name: 'mint-painted-suite-door',
  });

  const ceilingWhite = new THREE.MeshBasicMaterial({
    color: 0xd8d2c6,
    name: 'wet-ceiling',
  });

  const frostedWarm = std({
    color: 0x6b4a30,
    emissive: new THREE.Color(0xffb877),
    emissiveIntensity: 0.62,
    roughness: 0.5,
    metalness: 0.05,
    envMapIntensity: 0.3,
    name: 'lounge-door-frosted-warm',
  });

  const ledGreen = std({
    color: 0x1d3a22,
    emissive: new THREE.Color(0x54ff7a),
    emissiveIntensity: 2.0,
    roughness: 0.4,
    metalness: 0,
    name: 'led-green',
  });

  const water = std({
    color: 0x89b8b0,
    roughness: 0.08,
    metalness: 0.1,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    envMapIntensity: 0.8,
    name: 'water-film',
  });

  const showerCurtain = std({
    color: 0xd8e3dc,
    roughness: 0.8,
    metalness: 0,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    side: THREE.DoubleSide,
    envMapIntensity: 0.2,
    name: 'shower-curtain',
  });

  const ceilingWarm = new THREE.MeshBasicMaterial({
    color: 0xd8cbb6,
    name: 'corridor-ceiling',
  });

  return {
    ...base,
    tileWhite,
    tileMint,
    porcelain,
    chrome,
    mirror,
    water,
    doorSuite,
    ceilingWhite,
    frostedWarm,
    ledGreen,
    showerCurtain,
    ceilingWarm,
  };
}
