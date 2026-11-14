import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 * Shared PBR palette.
 *
 * A restrained natural palette: warm white plaster, greige stone, oak,
 * brushed brass, cream ceramic and sage gingham. Materials are created
 * once and reused by every builder so shader compilation stays cheap.
 * ------------------------------------------------------------------ */

export function createMaterials(textures) {
  const std = (options) => new THREE.MeshStandardMaterial(options);

  const wall = std({
    map: textures.plaster,
    bumpMap: textures.plaster,
    bumpScale: 0.0035,
    color: 0xfffdf8,
    roughness: 0.9,
    metalness: 0,
    envMapIntensity: 0.2,
    name: 'walls-warm-plaster',
  });

  const ceiling = new THREE.MeshBasicMaterial({
    map: textures.ceiling,
    color: 0xffffff,
    toneMapped: true,
    name: 'ceiling-paint',
  });

  const ceilingBand = new THREE.MeshBasicMaterial({
    color: 0xded4c3,
    toneMapped: true,
    name: 'ceiling-tray-band',
  });

  const trim = std({
    color: 0xefe6d7,
    roughness: 0.68,
    metalness: 0,
    envMapIntensity: 0.2,
    name: 'crown-and-casings',
  });

  const floor = std({
    map: textures.stone,
    bumpMap: textures.stone,
    bumpScale: 0.0016,
    color: 0xe8dfd1,
    roughness: 0.4,
    metalness: 0.03,
    envMapIntensity: 0.42,
    name: 'honed-stone-floor',
  });

  const border = std({
    color: 0x8c7e69,
    roughness: 0.46,
    metalness: 0.03,
    envMapIntensity: 0.35,
    name: 'floor-border-stone',
  });

  const oak = std({
    map: textures.wood,
    bumpMap: textures.wood,
    bumpScale: 0.0025,
    color: 0xe2d6c6,
    roughness: 0.58,
    metalness: 0,
    envMapIntensity: 0.28,
    name: 'white-oak',
  });

  const oakDark = std({
    map: textures.wood,
    bumpMap: textures.wood,
    bumpScale: 0.0025,
    color: 0xbda382,
    roughness: 0.56,
    metalness: 0,
    envMapIntensity: 0.26,
    name: 'oak-dark',
  });

  const walnut = std({
    map: textures.wood,
    bumpMap: textures.wood,
    bumpScale: 0.0028,
    color: 0x8b6a50,
    roughness: 0.54,
    metalness: 0.02,
    envMapIntensity: 0.26,
    name: 'walnut',
  });

  const brass = std({
    color: 0xb58a4d,
    roughness: 0.29,
    metalness: 0.9,
    envMapIntensity: 1.15,
    name: 'brushed-brass',
  });

  const darkBrass = std({
    color: 0x7d5f36,
    roughness: 0.38,
    metalness: 0.85,
    envMapIntensity: 1,
    name: 'aged-brass',
  });

  const ceramic = std({
    color: 0xf8f4ea,
    roughness: 0.32,
    metalness: 0,
    envMapIntensity: 0.65,
    name: 'cream-ceramic',
  });

  const steel = std({
    color: 0xc3c1ba,
    roughness: 0.27,
    metalness: 0.88,
    envMapIntensity: 1,
    name: 'brushed-steel',
  });

  const glass = std({
    color: 0xdfe7e7,
    roughness: 0.08,
    metalness: 0.1,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    envMapIntensity: 0.9,
    name: 'clock-glass',
  });

  const clothTop = std({
    map: textures.clothTop,
    bumpMap: textures.clothTop,
    bumpScale: 0.0022,
    color: 0xffffff,
    roughness: 0.92,
    metalness: 0,
    envMapIntensity: 0.12,
    name: 'gingham-top',
  });

  const clothLong = std({
    map: textures.clothLong,
    bumpMap: textures.clothLong,
    bumpScale: 0.0022,
    color: 0xffffff,
    roughness: 0.92,
    metalness: 0,
    envMapIntensity: 0.1,
    name: 'gingham-drop-long',
  });

  const clothShort = std({
    map: textures.clothShort,
    bumpMap: textures.clothShort,
    bumpScale: 0.0022,
    color: 0xffffff,
    roughness: 0.92,
    metalness: 0,
    envMapIntensity: 0.1,
    name: 'gingham-drop-short',
  });

  const linen = std({
    map: textures.linen,
    bumpMap: textures.linen,
    bumpScale: 0.0018,
    color: 0xf1e8d6,
    roughness: 0.95,
    metalness: 0,
    envMapIntensity: 0.08,
    name: 'linen',
  });

  const matBoard = std({
    color: 0xe7dcc5,
    roughness: 0.95,
    metalness: 0,
    envMapIntensity: 0.06,
    name: 'mount-board',
  });

  /* --- Flowers ------------------------------------------------------ */

  const greenery = std({
    color: 0x6f7f54,
    roughness: 0.84,
    metalness: 0,
    envMapIntensity: 0.15,
    side: THREE.DoubleSide,
    name: 'flower-stems',
  });

  const petalCream = std({
    color: 0xf2e5d2,
    roughness: 0.72,
    metalness: 0,
    envMapIntensity: 0.2,
    name: 'petal-cream',
  });

  const petalBlush = std({
    color: 0xe3bda9,
    roughness: 0.7,
    metalness: 0,
    envMapIntensity: 0.2,
    name: 'petal-blush',
  });

  const petalYellow = std({
    color: 0xd9b25c,
    roughness: 0.72,
    metalness: 0,
    envMapIntensity: 0.22,
    name: 'petal-ochre',
  });

  const flowerCenter = std({
    color: 0x9c7434,
    roughness: 0.78,
    metalness: 0,
    envMapIntensity: 0.2,
    name: 'flower-centre',
  });

  /* --- Tabletop food relief ---------------------------------------- */

  const bread = std({
    color: 0xc08a4f,
    roughness: 0.8,
    metalness: 0,
    envMapIntensity: 0.12,
    name: 'relief-bread',
  });

  const crust = std({
    color: 0x8b5a2f,
    roughness: 0.82,
    metalness: 0,
    envMapIntensity: 0.12,
    name: 'relief-crust',
  });

  const fish = std({
    color: 0xc7b79b,
    roughness: 0.66,
    metalness: 0.02,
    envMapIntensity: 0.2,
    name: 'relief-fish',
  });

  const lemon = std({
    color: 0xd9b34f,
    roughness: 0.7,
    metalness: 0,
    envMapIntensity: 0.18,
    name: 'relief-lemon',
  });

  const fruitRed = std({
    color: 0xa94b3c,
    roughness: 0.62,
    metalness: 0,
    envMapIntensity: 0.2,
    name: 'relief-fruit-red',
  });

  const fruitOrange = std({
    color: 0xc98a3c,
    roughness: 0.68,
    metalness: 0,
    envMapIntensity: 0.2,
    name: 'relief-fruit-orange',
  });

  const fruitGreen = std({
    color: 0x7f8f55,
    roughness: 0.7,
    metalness: 0,
    envMapIntensity: 0.2,
    name: 'relief-fruit-green',
  });

  const cheese = std({
    color: 0xd8b970,
    roughness: 0.66,
    metalness: 0,
    envMapIntensity: 0.2,
    name: 'relief-cheese',
  });

  const wine = std({
    color: 0x4f2530,
    roughness: 0.38,
    metalness: 0.05,
    envMapIntensity: 0.5,
    name: 'relief-wine',
  });

  const cream = std({
    color: 0xefe0c8,
    roughness: 0.82,
    metalness: 0,
    envMapIntensity: 0.12,
    name: 'relief-cream',
  });

  /* --- Clocks, fixtures, devices ----------------------------------- */

  const swan = std({
    color: 0xf6f1e6,
    roughness: 0.24,
    metalness: 0.02,
    envMapIntensity: 0.85,
    name: 'swan-porcelain',
  });

  const swanBack = std({
    color: 0x9a9b86,
    roughness: 0.82,
    metalness: 0.02,
    envMapIntensity: 0.18,
    name: 'swan-clock-backplate',
  });

  const clockFace = std({
    color: 0xf7f2e5,
    roughness: 0.55,
    metalness: 0,
    envMapIntensity: 0.3,
    name: 'clock-face',
  });

  const clockInk = std({
    color: 0x2b231b,
    roughness: 0.5,
    metalness: 0.1,
    envMapIntensity: 0.3,
    name: 'clock-ink',
  });

  const whitePaint = std({
    color: 0xeee9dd,
    roughness: 0.5,
    metalness: 0.02,
    envMapIntensity: 0.25,
    name: 'white-enamel',
  });

  const black = std({
    color: 0x1c1b19,
    roughness: 0.5,
    metalness: 0.1,
    envMapIntensity: 0.3,
    name: 'matte-black',
  });

  const cameraBody = std({
    color: 0xe7e3d8,
    roughness: 0.45,
    metalness: 0.06,
    envMapIntensity: 0.35,
    name: 'camera-shell',
  });

  const dome = std({
    color: 0x1b2224,
    roughness: 0.14,
    metalness: 0.28,
    envMapIntensity: 0.7,
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

  const ledWhite = new THREE.MeshBasicMaterial({
    color: 0xfff9ec,
    name: 'led-diffuser',
    toneMapped: false,
  });

  const acWhite = std({
    color: 0xeceadf,
    roughness: 0.42,
    metalness: 0.03,
    envMapIntensity: 0.4,
    name: 'ac-casing',
  });

  const fixtureMetal = std({
    color: 0xb7b2a7,
    roughness: 0.38,
    metalness: 0.55,
    envMapIntensity: 0.7,
    name: 'fixture-aluminium',
  });

  const frosted = std({
    color: 0xf0e7d4,
    emissive: new THREE.Color(0xc9a878),
    emissiveIntensity: 0.42,
    roughness: 0.62,
    metalness: 0,
    envMapIntensity: 0.25,
    name: 'frosted-glass',
  });

  const rugRunner = std({
    color: 0x7d4d40,
    roughness: 0.96,
    metalness: 0,
    envMapIntensity: 0.06,
    name: 'corridor-runner',
  });

  const planter = std({
    color: 0x9a6c50,
    roughness: 0.72,
    metalness: 0,
    envMapIntensity: 0.18,
    name: 'terracotta-planter',
  });

  const soil = std({
    color: 0x2f251c,
    roughness: 0.98,
    metalness: 0,
    envMapIntensity: 0.04,
    name: 'planter-soil',
  });

  const leaf = std({
    color: 0x72805a,
    roughness: 0.82,
    metalness: 0,
    envMapIntensity: 0.14,
    name: 'plant-leaf',
  });

  const leafLight = std({
    color: 0x8b966c,
    roughness: 0.84,
    metalness: 0,
    envMapIntensity: 0.14,
    name: 'plant-leaf-light',
  });

  const plantWood = std({
    map: textures.wood,
    bumpMap: textures.wood,
    bumpScale: 0.0028,
    color: 0xb08f70,
    roughness: 0.58,
    metalness: 0.02,
    envMapIntensity: 0.24,
    name: 'plant-wood',
  });

  return {
    wall,
    ceiling,
    ceilingBand,
    trim,
    floor,
    border,
    oak,
    oakDark,
    walnut,
    brass,
    darkBrass,
    ceramic,
    steel,
    glass,
    clothTop,
    clothLong,
    clothShort,
    linen,
    matBoard,
    greenery,
    petalCream,
    petalBlush,
    petalYellow,
    flowerCenter,
    bread,
    crust,
    fish,
    lemon,
    fruitRed,
    fruitOrange,
    fruitGreen,
    cheese,
    wine,
    cream,
    swan,
    swanBack,
    clockFace,
    clockInk,
    whitePaint,
    black,
    cameraBody,
    dome,
    ledRed,
    ledWhite,
    acWhite,
    fixtureMetal,
    frosted,
    rugRunner,
    planter,
    soil,
    leaf,
    leafLight,
    plantWood,
  };
}
