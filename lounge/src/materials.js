import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 * 共享 PBR 调色板。
 *
 * 自然材质骨架 + 少量高饱和点缀：白灰泥、浅橡木墙裙、深胡桃木雕、
 * 黄铜、紫红地毯、暖黄条纹、奶白椅套、灰沙发布、黑桌布。材质只创建
 * 一次，所有构建器复用。
 * ------------------------------------------------------------------ */

export function createMaterials(textures) {
  const std = (options) => new THREE.MeshStandardMaterial(options);
  const phys = (options) => new THREE.MeshPhysicalMaterial(options);

  const wall = std({
    map: textures.plaster,
    bumpMap: textures.plaster,
    bumpScale: 0.003,
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0,
    envMapIntensity: 0.16,
    name: 'warm-white-plaster',
  });

  // 天花用不受光材质，避免顶棚在只有向下主光时发黑。
  const ceiling = new THREE.MeshBasicMaterial({
    map: textures.ceiling,
    color: 0xfbf6ec,
    name: 'ceiling-paint',
  });

  const ceilingTray = new THREE.MeshBasicMaterial({
    map: textures.ceiling,
    color: 0xf8f2e6,
    name: 'ceiling-tray',
  });

  const ceilingFascia = new THREE.MeshBasicMaterial({
    color: 0xe9e0d0,
    name: 'ceiling-tray-fascia',
  });

  const ceilingBeam = new THREE.MeshBasicMaterial({
    color: 0xf3ecdf,
    name: 'ceiling-beam',
  });

  const trim = std({
    color: 0xf0e8da,
    roughness: 0.62,
    metalness: 0,
    envMapIntensity: 0.18,
    name: 'painted-trim',
  });

  const oak = std({
    map: textures.oak,
    bumpMap: textures.oak,
    bumpScale: 0.002,
    color: 0xf4e8d4,
    roughness: 0.6,
    metalness: 0,
    envMapIntensity: 0.24,
    name: 'pale-oak',
  });

  const oakDark = std({
    map: textures.oak,
    bumpMap: textures.oak,
    bumpScale: 0.002,
    color: 0xc9ab84,
    roughness: 0.58,
    metalness: 0,
    envMapIntensity: 0.22,
    name: 'oak-shadow',
  });

  const walnut = std({
    map: textures.walnut,
    bumpMap: textures.walnut,
    bumpScale: 0.0024,
    color: 0xc49c78,
    roughness: 0.5,
    metalness: 0.02,
    envMapIntensity: 0.3,
    name: 'walnut',
  });

  const walnutDark = std({
    map: textures.walnut,
    bumpMap: textures.walnut,
    bumpScale: 0.0024,
    color: 0x967052,
    roughness: 0.48,
    metalness: 0.02,
    envMapIntensity: 0.28,
    name: 'walnut-dark',
  });

  const brass = std({
    color: 0xd2a763,
    roughness: 0.23,
    metalness: 0.92,
    envMapIntensity: 1.8,
    name: 'brushed-brass',
  });

  const brassDark = std({
    color: 0xa47f48,
    roughness: 0.32,
    metalness: 0.88,
    envMapIntensity: 1.5,
    name: 'aged-brass',
  });

  const crystal = phys({
    color: 0xf4f6ff,
    roughness: 0.04,
    metalness: 0,
    transparent: true,
    opacity: 0.44,
    envMapIntensity: 2.6,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    side: THREE.DoubleSide,
    depthWrite: false,
    name: 'crystal-prism',
  });

  const bulbWarmWhite = new THREE.MeshBasicMaterial({
    color: 0xfff4de,
    toneMapped: false,
    name: 'chandelier-bulb',
  });

  const bulbFanWarm = new THREE.MeshBasicMaterial({
    color: 0xffc27a,
    toneMapped: false,
    name: 'fan-bulb',
  });

  const glassFrost = std({
    color: 0xdfe7e6,
    roughness: 0.42,
    metalness: 0.05,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    envMapIntensity: 0.8,
    name: 'frosted-door-glass',
  });

  const clothBlack = std({
    map: textures.clothBlack,
    bumpMap: textures.clothBlack,
    bumpScale: 0.0018,
    color: 0x6f6f77,
    roughness: 0.72,
    metalness: 0,
    envMapIntensity: 0.12,
    side: THREE.DoubleSide,
    name: 'black-tablecloth',
  });

  const linen = std({
    map: textures.linen,
    bumpMap: textures.linen,
    bumpScale: 0.0016,
    color: 0xf6edd9,
    roughness: 0.94,
    metalness: 0,
    envMapIntensity: 0.08,
    name: 'chair-cover-linen',
  });

  const linenSeam = std({
    color: 0xded2ba,
    roughness: 0.9,
    metalness: 0,
    envMapIntensity: 0.08,
    name: 'chair-cover-seam',
  });

  const sofaFabric = std({
    map: textures.sofa,
    bumpMap: textures.sofa,
    bumpScale: 0.002,
    color: 0xf0eee9,
    roughness: 0.95,
    metalness: 0,
    envMapIntensity: 0.1,
    name: 'grey-sofa-wool',
  });

  const sofaSeam = std({
    color: 0x5f5d58,
    roughness: 0.9,
    metalness: 0,
    envMapIntensity: 0.1,
    name: 'sofa-piping',
  });

  const carpet = std({
    map: textures.carpet,
    bumpMap: textures.carpet,
    bumpScale: 0.0016,
    color: 0xffffff,
    roughness: 0.97,
    metalness: 0,
    envMapIntensity: 0.04,
    name: 'wine-carpet',
  });

  const carpetBorder = std({
    map: textures.braid,
    bumpMap: textures.braid,
    bumpScale: 0.0015,
    color: 0xd8b767,
    roughness: 0.86,
    metalness: 0.04,
    envMapIntensity: 0.12,
    name: 'carpet-yellow-border',
  });

  const stone = std({
    map: textures.stone,
    bumpMap: textures.stone,
    bumpScale: 0.0016,
    color: 0xe9e1d3,
    roughness: 0.5,
    metalness: 0.02,
    envMapIntensity: 0.3,
    name: 'landing-terrazzo',
  });

  const matBlack = std({
    color: 0x1d1d1f,
    roughness: 0.48,
    metalness: 0.16,
    envMapIntensity: 0.4,
    name: 'matte-black',
  });

  const iron = std({
    color: 0x454647,
    roughness: 0.5,
    metalness: 0.7,
    envMapIntensity: 0.6,
    name: 'iron',
  });

  const cameraShell = std({
    color: 0xe9e6dc,
    roughness: 0.44,
    metalness: 0.05,
    envMapIntensity: 0.4,
    name: 'camera-shell',
  });

  const dome = std({
    color: 0x171d20,
    roughness: 0.12,
    metalness: 0.35,
    envMapIntensity: 0.85,
    name: 'camera-dome',
  });

  const ledRed = std({
    color: 0x5f1412,
    emissive: new THREE.Color(0xff2f22),
    emissiveIntensity: 2.4,
    roughness: 0.4,
    metalness: 0,
    name: 'led-red',
  });

  const ledGreen = std({
    color: 0x1d3a22,
    emissive: new THREE.Color(0x54ff7a),
    emissiveIntensity: 2.0,
    roughness: 0.4,
    metalness: 0,
    name: 'led-green',
  });

  const screenGlow = new THREE.MeshBasicMaterial({
    color: 0x7fd8ff,
    toneMapped: false,
    transparent: true,
    opacity: 0.75,
    name: 'reader-screen',
  });

  const readerShell = std({
    color: 0x30333a,
    roughness: 0.42,
    metalness: 0.3,
    envMapIntensity: 0.5,
    name: 'card-reader-shell',
  });

  const readerFace = std({
    color: 0x1b1d21,
    roughness: 0.35,
    metalness: 0.25,
    envMapIntensity: 0.5,
    name: 'card-reader-face',
  });

  const clockFace = std({
    color: 0xf7f2e4,
    roughness: 0.5,
    metalness: 0,
    envMapIntensity: 0.35,
    name: 'clock-face',
  });

  const clockInk = std({
    color: 0x27221b,
    roughness: 0.42,
    metalness: 0.1,
    envMapIntensity: 0.3,
    name: 'clock-ink',
  });

  const acWhite = std({
    color: 0xecebe3,
    roughness: 0.44,
    metalness: 0.04,
    envMapIntensity: 0.4,
    name: 'ac-casing',
  });

  const acGrille = std({
    color: 0x9b9c97,
    roughness: 0.6,
    metalness: 0.12,
    envMapIntensity: 0.35,
    name: 'ac-grille',
  });

  const fanBrass = std({
    color: 0x9c7a44,
    roughness: 0.42,
    metalness: 0.7,
    envMapIntensity: 0.9,
    name: 'fan-aged-brass',
  });

  const fanBlade = std({
    map: textures.walnut,
    bumpMap: textures.walnut,
    bumpScale: 0.0022,
    color: 0x8e6749,
    roughness: 0.55,
    metalness: 0.02,
    envMapIntensity: 0.3,
    name: 'fan-walnut-blade',
  });

  const chessIvory = std({
    color: 0xf1e6d0,
    roughness: 0.38,
    metalness: 0.02,
    envMapIntensity: 0.5,
    name: 'chess-ivory',
  });

  const chessEbony = std({
    color: 0x241d18,
    roughness: 0.34,
    metalness: 0.06,
    envMapIntensity: 0.5,
    name: 'chess-ebony',
  });

  const cardFace = std({
    color: 0xf8f3e6,
    roughness: 0.72,
    metalness: 0,
    envMapIntensity: 0.18,
    name: 'playing-card',
  });

  const cardRed = std({
    color: 0x9e2b33,
    roughness: 0.6,
    metalness: 0,
    envMapIntensity: 0.2,
    name: 'card-red',
  });

  const checkerRed = std({
    color: 0x8e2a2c,
    roughness: 0.46,
    metalness: 0.02,
    envMapIntensity: 0.35,
    name: 'checker-red',
  });

  const checkerBlack = std({
    color: 0x26221f,
    roughness: 0.46,
    metalness: 0.02,
    envMapIntensity: 0.35,
    name: 'checker-black',
  });

  const boardInlay = std({
    map: textures.walnut,
    color: 0x7a5b42,
    roughness: 0.44,
    metalness: 0.03,
    envMapIntensity: 0.35,
    name: 'game-board-inlay',
  });

  const boardLight = std({
    color: 0xe3d2b4,
    roughness: 0.42,
    metalness: 0.02,
    envMapIntensity: 0.4,
    name: 'game-board-light',
  });

  const chipIvory = std({
    color: 0xece2cd,
    roughness: 0.5,
    metalness: 0,
    envMapIntensity: 0.3,
    name: 'chip-ivory',
  });

  const chipRed = std({
    color: 0x8f2a33,
    roughness: 0.5,
    metalness: 0,
    envMapIntensity: 0.3,
    name: 'chip-red',
  });

  return {
    wall,
    ceiling,
    ceilingTray,
    ceilingFascia,
    ceilingBeam,
    trim,
    oak,
    oakDark,
    walnut,
    walnutDark,
    brass,
    brassDark,
    crystal,
    bulbWarmWhite,
    bulbFanWarm,
    glassFrost,
    clothBlack,
    linen,
    linenSeam,
    sofaFabric,
    sofaSeam,
    carpet,
    carpetBorder,
    stone,
    matBlack,
    iron,
    cameraShell,
    dome,
    ledRed,
    ledGreen,
    screenGlow,
    readerShell,
    readerFace,
    clockFace,
    clockInk,
    acWhite,
    acGrille,
    fanBrass,
    fanBlade,
    chessIvory,
    chessEbony,
    cardFace,
    cardRed,
    checkerRed,
    checkerBlack,
    boardInlay,
    boardLight,
    chipIvory,
    chipRed,
  };
}
