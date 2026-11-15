import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 * Cool commercial-kitchen material palette.
 *
 * One material per surface family so the static batcher can collapse the
 * whole room into a handful of draw calls. Stainless gets the procedural
 * brushed map; tile and quarry surfaces get metre-scaled UVs from
 * uvScaledPlane(), so grout joints stay 300 / 600 mm across every wall.
 * ------------------------------------------------------------------ */

export function createMaterials(textures) {
  const std = (options) => new THREE.MeshStandardMaterial(options);

  const wallTile = std({
    map: textures.wallTile,
    bumpMap: textures.wallTile,
    bumpScale: 0.0024,
    color: 0xffffff,
    roughness: 0.27,
    metalness: 0.03,
    envMapIntensity: 0.8,
    name: 'glazed-white-wall-tile',
  });

  const floorTile = std({
    map: textures.floorTile,
    bumpMap: textures.floorTile,
    bumpScale: 0.003,
    color: 0xffffff,
    roughness: 0.5,
    metalness: 0.02,
    envMapIntensity: 0.55,
    name: 'anti-slip-quarry-tile',
  });

  const ceilingPanel = std({
    map: textures.ceilingPanel,
    color: 0xffffff,
    roughness: 0.42,
    metalness: 0.24,
    envMapIntensity: 0.95,
    name: 'aluminium-lay-in-panel',
  });

  const ceilingGrid = std({
    color: 0xc5cdd0,
    roughness: 0.48,
    metalness: 0.38,
    envMapIntensity: 0.75,
    name: 'ceiling-t-grid',
  });

  const steel = std({
    map: textures.steel,
    bumpMap: textures.steel,
    bumpScale: 0.0009,
    color: 0xe0e7ea,
    roughness: 0.3,
    metalness: 0.9,
    envMapIntensity: 1.55,
    name: 'brushed-stainless',
  });

  const steelDark = std({
    map: textures.steel,
    color: 0xa9b3b7,
    roughness: 0.38,
    metalness: 0.82,
    envMapIntensity: 1.25,
    name: 'stainless-shadow',
  });

  const steelPolished = std({
    color: 0xe4ecef,
    roughness: 0.17,
    metalness: 0.96,
    envMapIntensity: 1.4,
    name: 'polished-stainless',
  });

  const galvanized = std({
    map: textures.galvanized,
    color: 0xd2d9dc,
    roughness: 0.46,
    metalness: 0.72,
    envMapIntensity: 0.95,
    name: 'galvanised-duct',
  });

  const castIron = std({
    color: 0x373a39,
    roughness: 0.6,
    metalness: 0.62,
    envMapIntensity: 0.55,
    side: THREE.DoubleSide,
    name: 'cast-iron',
  });

  const steelDouble = std({
    map: textures.steel,
    color: 0xd5dde0,
    roughness: 0.3,
    metalness: 0.9,
    envMapIntensity: 1.2,
    side: THREE.DoubleSide,
    name: 'stainless-bowl',
  });

  const ceramicDouble = std({
    color: 0xf1eee5,
    roughness: 0.28,
    metalness: 0,
    envMapIntensity: 0.55,
    side: THREE.DoubleSide,
    name: 'porcelain-bowl',
  });

  const rubber = std({
    color: 0x15191a,
    roughness: 0.86,
    metalness: 0.02,
    envMapIntensity: 0.16,
    name: 'rubber-seal',
  });

  const blackPlastic = std({
    color: 0x232829,
    roughness: 0.52,
    metalness: 0.12,
    envMapIntensity: 0.36,
    name: 'black-plastic',
  });

  const whitePlastic = std({
    color: 0xdde2e1,
    roughness: 0.5,
    metalness: 0.03,
    envMapIntensity: 0.3,
    name: 'white-plastic',
  });

  const crtBeige = std({
    color: 0xd5cfbd,
    roughness: 0.62,
    metalness: 0.02,
    envMapIntensity: 0.22,
    name: 'aged-crt-beige',
  });

  const crtBeigeShade = std({
    color: 0xb8b09d,
    roughness: 0.7,
    metalness: 0.01,
    envMapIntensity: 0.16,
    name: 'crt-beige-shadow',
  });

  const glass = std({
    color: 0xd8e8ea,
    roughness: 0.06,
    metalness: 0.1,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    envMapIntensity: 1.1,
    side: THREE.DoubleSide,
    name: 'clear-glass',
  });

  const frostedGlass = std({
    color: 0xdfe7e5,
    roughness: 0.36,
    metalness: 0.05,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    envMapIntensity: 0.8,
    side: THREE.DoubleSide,
    name: 'frosted-glass',
  });

  const cuttingRed = std({
    color: 0xb5473d,
    roughness: 0.62,
    metalness: 0,
    envMapIntensity: 0.16,
    name: 'cutting-board-raw-meat',
  });

  const cuttingGreen = std({
    color: 0x4d7655,
    roughness: 0.62,
    metalness: 0,
    envMapIntensity: 0.16,
    name: 'cutting-board-vegetable',
  });

  const cuttingWhite = std({
    color: 0xe4e0d4,
    roughness: 0.6,
    metalness: 0,
    envMapIntensity: 0.2,
    name: 'cutting-board-dairy',
  });

  const warmPlaster = std({
    map: textures.warmPlaster,
    bumpMap: textures.warmPlaster,
    bumpScale: 0.0022,
    color: 0xfff9ef,
    roughness: 0.86,
    metalness: 0,
    envMapIntensity: 0.2,
    name: 'vestibule-warm-plaster',
  });

  const darkWood = std({
    map: textures.darkWood,
    bumpMap: textures.darkWood,
    bumpScale: 0.0024,
    color: 0x9c7c60,
    roughness: 0.6,
    metalness: 0.01,
    envMapIntensity: 0.22,
    name: 'vestibule-dark-oak',
  });

  // The return door deliberately borrows the dining hall's oak language.
  const oak = std({
    map: textures.darkWood,
    bumpMap: textures.darkWood,
    bumpScale: 0.0024,
    color: 0xd9b88d,
    roughness: 0.56,
    metalness: 0.01,
    envMapIntensity: 0.28,
    name: 'dining-door-oak',
  });

  const oakDark = std({
    map: textures.darkWood,
    bumpMap: textures.darkWood,
    bumpScale: 0.0024,
    color: 0x9b7250,
    roughness: 0.56,
    metalness: 0.01,
    envMapIntensity: 0.26,
    name: 'dining-door-oak-dark',
  });

  const brass = std({
    color: 0xb58a4d,
    roughness: 0.29,
    metalness: 0.9,
    envMapIntensity: 1.15,
    name: 'dining-door-brass',
  });

  const trimSteel = std({
    color: 0xd0d8db,
    roughness: 0.34,
    metalness: 0.68,
    envMapIntensity: 1.2,
    name: 'stainless-trim',
  });

  const redPipe = std({
    color: 0x9e332d,
    roughness: 0.48,
    metalness: 0.45,
    envMapIntensity: 0.6,
    name: 'fire-sprinkler-red',
  });

  const hazardYellow = std({
    color: 0xd2ac38,
    roughness: 0.55,
    metalness: 0.18,
    envMapIntensity: 0.3,
    name: 'hazard-yellow',
  });

  const fireRed = std({
    color: 0x9c2c26,
    roughness: 0.44,
    metalness: 0.32,
    envMapIntensity: 0.55,
    name: 'extinguisher-red',
  });

  const ceramic = std({
    color: 0xf1eee5,
    roughness: 0.28,
    metalness: 0,
    envMapIntensity: 0.55,
    name: 'white-porcelain',
  });

  const grease = std({
    color: 0x2b2e2a,
    roughness: 0.7,
    metalness: 0.35,
    envMapIntensity: 0.4,
    name: 'hood-grease-filter',
  });

  const greenBin = std({
    color: 0x3f5b4c,
    roughness: 0.68,
    metalness: 0.04,
    envMapIntensity: 0.18,
    name: 'green-ingredient-bin',
  });

  const blueBin = std({
    color: 0x3e5a70,
    roughness: 0.68,
    metalness: 0.04,
    envMapIntensity: 0.18,
    name: 'blue-ingredient-bin',
  });

  const saltWhite = std({
    color: 0xf1ede2,
    roughness: 0.8,
    metalness: 0,
    envMapIntensity: 0.1,
    name: 'salt-sugar',
  });

  const spiceRed = std({
    color: 0x9e4a32,
    roughness: 0.82,
    metalness: 0,
    envMapIntensity: 0.08,
    name: 'paprika',
  });

  const spiceBrown = std({
    color: 0x6d4a2e,
    roughness: 0.84,
    metalness: 0,
    envMapIntensity: 0.08,
    name: 'spice-brown',
  });

  const herbGreen = std({
    color: 0x5b6b3d,
    roughness: 0.84,
    metalness: 0,
    envMapIntensity: 0.08,
    name: 'dried-herbs',
  });

  const cleaningBlue = std({
    color: 0x2f6f9b,
    roughness: 0.38,
    metalness: 0.04,
    envMapIntensity: 0.3,
    name: 'detergent-blue',
  });

  const floorMat = std({
    color: 0x39423e,
    roughness: 0.92,
    metalness: 0.02,
    envMapIntensity: 0.14,
    name: 'anti-fatigue-floor-mat',
  });

  const safetyOrange = std({
    color: 0xc8682b,
    roughness: 0.62,
    metalness: 0.03,
    envMapIntensity: 0.16,
    name: 'safety-orange',
  });

  const heaterWire = std({
    color: 0x6f2a16,
    emissive: new THREE.Color(0xff6b33),
    emissiveIntensity: 0.72,
    roughness: 0.5,
    metalness: 0.1,
    envMapIntensity: 0.2,
    name: 'anti-condensation-heater',
  });

  const ledWhite = new THREE.MeshBasicMaterial({
    color: 0xeaf7ff,
    toneMapped: false,
    name: 'led-diffuser',
  });

  const warmLamp = new THREE.MeshBasicMaterial({
    color: 0xffc37a,
    toneMapped: false,
    name: 'pass-heat-lamp',
  });

  return {
    wallTile,
    floorTile,
    ceilingPanel,
    ceilingGrid,
    steel,
    steelDark,
    steelPolished,
    galvanized,
    castIron,
    steelDouble,
    ceramicDouble,
    rubber,
    blackPlastic,
    whitePlastic,
    crtBeige,
    crtBeigeShade,
    glass,
    frostedGlass,
    cuttingRed,
    cuttingGreen,
    cuttingWhite,
    warmPlaster,
    darkWood,
    oak,
    oakDark,
    brass,
    frosted: frostedGlass,
    trimSteel,
    redPipe,
    hazardYellow,
    fireRed,
    ceramic,
    grease,
    greenBin,
    blueBin,
    saltWhite,
    spiceRed,
    spiceBrown,
    herbGreen,
    cleaningBlue,
    floorMat,
    safetyOrange,
    heaterWire,
    ledWhite,
    warmLamp,
  };
}
