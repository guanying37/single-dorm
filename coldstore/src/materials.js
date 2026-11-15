import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 * Cold-room material palette.
 *
 * Two families carry the scene: white metal-faced insulation panels and
 * brushed stainless. Everything else is small: silicone gaskets, pale
 * blue LED acrylic, aged grey CRT plastic, food, cardboard, cold-weather
 * fabric. One material per surface family so the static batcher can
 * collapse the room into a few dozen draw calls.
 * ------------------------------------------------------------------ */

export function createMaterials(textures) {
  const std = (options) => new THREE.MeshStandardMaterial(options);

  const panelWhite = std({
    map: textures.wallPanel,
    bumpMap: textures.wallPanel,
    bumpScale: 0.0016,
    color: 0xe9efed,
    roughness: 0.4,
    metalness: 0.34,
    envMapIntensity: 0.65,
    name: 'insulation-panel-white',
  });

  const panelSeam = std({
    color: 0x9aa5a4,
    roughness: 0.5,
    metalness: 0.04,
    envMapIntensity: 0.4,
    name: 'silicone-seal-light',
  });

  const panelCore = std({
    color: 0xb9c2c4,
    roughness: 0.6,
    metalness: 0.2,
    envMapIntensity: 0.5,
    name: 'panel-cut-edge',
  });

  const ceilingPU = std({
    map: textures.ceilingPanel,
    bumpMap: textures.ceilingPanel,
    bumpScale: 0.0012,
    color: 0xeef1ea,
    roughness: 0.5,
    metalness: 0.2,
    envMapIntensity: 0.4,
    name: 'pu-ceiling-panel',
  });

  const floorDeck = std({
    map: textures.floorPlate,
    bumpMap: textures.floorPlate,
    bumpScale: 0.0045,
    color: 0xcfd6d8,
    roughness: 0.5,
    metalness: 0.6,
    envMapIntensity: 0.7,
    name: 'aluminium-anti-slip-deck',
  });

  const floorTrench = std({
    color: 0x565f62,
    roughness: 0.62,
    metalness: 0.5,
    envMapIntensity: 0.5,
    name: 'drain-channel',
  });

  const steel = std({
    map: textures.steel,
    bumpMap: textures.steel,
    bumpScale: 0.0008,
    color: 0xe2e8ea,
    roughness: 0.3,
    metalness: 0.92,
    envMapIntensity: 1.4,
    name: 'brushed-stainless',
  });

  const steelDark = std({
    map: textures.steel,
    color: 0xa3adb1,
    roughness: 0.38,
    metalness: 0.84,
    envMapIntensity: 1.15,
    name: 'stainless-shadow',
  });

  const steelPolished = std({
    color: 0xe8f0f2,
    roughness: 0.16,
    metalness: 0.97,
    envMapIntensity: 1.5,
    name: 'polished-stainless',
  });

  const traySteel = std({
    map: textures.steel,
    color: 0xdae2e5,
    roughness: 0.26,
    metalness: 0.95,
    envMapIntensity: 1.35,
    side: THREE.DoubleSide,
    name: 'stainless-food-pan',
  });

  const rubber = std({
    color: 0x14181a,
    roughness: 0.88,
    metalness: 0.02,
    envMapIntensity: 0.14,
    name: 'door-gasket-rubber',
  });

  const heaterWire = std({
    color: 0x6d2a17,
    emissive: new THREE.Color(0xff8a52),
    emissiveIntensity: 0.28,
    roughness: 0.5,
    metalness: 0.1,
    envMapIntensity: 0.2,
    name: 'anti-condensation-heater',
  });

  const coldLens = new THREE.MeshBasicMaterial({
    color: 0xe6f6ff,
    toneMapped: false,
    name: 'cold-led-lens',
  });

  const ledGreen = new THREE.MeshBasicMaterial({
    color: 0x8dffb0,
    toneMapped: false,
    name: 'status-led-green',
  });

  const dustCover = std({
    color: 0xdceaf0,
    roughness: 0.12,
    metalness: 0.06,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    envMapIntensity: 1.3,
    side: THREE.DoubleSide,
    name: 'lamp-dust-cover',
  });

  const frostFilm = std({
    map: textures.frost,
    color: 0xffffff,
    roughness: 0.5,
    metalness: 0,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    envMapIntensity: 0.5,
    side: THREE.DoubleSide,
    name: 'condensation-frost',
  });

  const crtBeige = std({
    color: 0xa9a99f,
    roughness: 0.72,
    metalness: 0.02,
    envMapIntensity: 0.2,
    name: 'aged-crt-grey-plastic',
  });

  const crtBeigeShade = std({
    color: 0x8b8c82,
    roughness: 0.72,
    metalness: 0.01,
    envMapIntensity: 0.16,
    name: 'crt-grey-shadow',
  });

  const blackPlastic = std({
    color: 0x222729,
    roughness: 0.52,
    metalness: 0.14,
    envMapIntensity: 0.34,
    name: 'black-plastic',
  });

  const whitePlastic = std({
    color: 0xe3e7e5,
    roughness: 0.48,
    metalness: 0.03,
    envMapIntensity: 0.3,
    name: 'white-plastic',
  });

  const brass = std({
    color: 0xb08d54,
    roughness: 0.3,
    metalness: 0.9,
    envMapIntensity: 1.2,
    name: 'dial-brass',
  });

  const dialFace = std({
    color: 0xf2ece0,
    roughness: 0.5,
    metalness: 0.02,
    envMapIntensity: 0.35,
    name: 'dial-cream-face',
  });

  const needleRed = std({
    color: 0xa8362c,
    roughness: 0.4,
    metalness: 0.3,
    envMapIntensity: 0.5,
    name: 'needle-red',
  });

  const needleBlue = std({
    color: 0x2f5f86,
    roughness: 0.4,
    metalness: 0.3,
    envMapIntensity: 0.5,
    name: 'needle-blue',
  });

  const dialGlass = std({
    color: 0xdbe8ec,
    roughness: 0.05,
    metalness: 0.08,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    envMapIntensity: 1.3,
    side: THREE.DoubleSide,
    name: 'dial-glass',
  });

  const meat = std({
    map: textures.meat,
    roughness: 0.58,
    metalness: 0.02,
    envMapIntensity: 0.3,
    name: 'raw-meat',
  });

  const produce = std({
    map: textures.produce,
    roughness: 0.78,
    metalness: 0.01,
    envMapIntensity: 0.24,
    name: 'produce',
  });

  const film = std({
    map: textures.film,
    alphaMap: textures.film,
    color: 0xf4fbfc,
    roughness: 0.09,
    metalness: 0.05,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
    envMapIntensity: 1.1,
    side: THREE.DoubleSide,
    name: 'cling-film',
  });

  const foodBox = std({
    color: 0xd9e9ec,
    roughness: 0.3,
    metalness: 0.02,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    envMapIntensity: 0.55,
    side: THREE.DoubleSide,
    name: 'clear-food-container',
  });

  const foodBoxLid = std({
    color: 0xd8e7ea,
    roughness: 0.24,
    metalness: 0.03,
    transparent: true,
    opacity: 0.46,
    depthWrite: false,
    envMapIntensity: 0.6,
    side: THREE.DoubleSide,
    name: 'food-container-lid',
  });

  const cardboard = std({
    map: textures.cardboard,
    roughness: 0.92,
    metalness: 0.01,
    envMapIntensity: 0.16,
    name: 'kraft-carton',
  });

  const cardboardDark = std({
    map: textures.cardboard,
    color: 0xbfae95,
    roughness: 0.92,
    metalness: 0.01,
    envMapIntensity: 0.14,
    name: 'kraft-carton-shadow',
  });

  const labelPaper = std({
    map: textures.label,
    roughness: 0.85,
    metalness: 0,
    envMapIntensity: 0.18,
    side: THREE.DoubleSide,
    name: 'blank-food-label',
  });

  const coatNavy = std({
    color: 0x233146,
    roughness: 0.94,
    metalness: 0.02,
    envMapIntensity: 0.14,
    name: 'heavy-cold-coat',
  });

  const coatNavyDark = std({
    color: 0x1a2433,
    roughness: 0.94,
    metalness: 0.02,
    envMapIntensity: 0.12,
    name: 'heavy-cold-coat-shadow',
  });

  const reflectiveStrip = std({
    color: 0xcdd6d8,
    roughness: 0.42,
    metalness: 0.42,
    envMapIntensity: 1.4,
    name: 'coat-reflective-strip',
  });

  const gloveRubber = std({
    color: 0x1d2225,
    roughness: 0.68,
    metalness: 0.06,
    envMapIntensity: 0.24,
    name: 'insulated-glove',
  });

  const pipeFoam = std({
    color: 0xd9dfd9,
    roughness: 0.78,
    metalness: 0.02,
    envMapIntensity: 0.24,
    name: 'pipe-insulation-foam',
  });

  const copper = std({
    color: 0xa9693f,
    roughness: 0.34,
    metalness: 0.88,
    envMapIntensity: 1.1,
    name: 'copper-line',
  });

  const warningRed = std({
    color: 0xa5342c,
    roughness: 0.42,
    metalness: 0.18,
    envMapIntensity: 0.4,
    name: 'emergency-release-red',
  });

  const glowGreen = std({
    color: 0x9fc9ac,
    emissive: new THREE.Color(0x74ff9e),
    emissiveIntensity: 0.9,
    roughness: 0.5,
    metalness: 0,
    envMapIntensity: 0.2,
    name: 'glow-release-handle',
  });

  const frostPatch = std({
    map: textures.frost,
    color: 0xf4fbff,
    roughness: 0.62,
    metalness: 0,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    envMapIntensity: 0.35,
    side: THREE.DoubleSide,
    name: 'freezer-frost',
  });

  const fanGrille = std({
    map: textures.steel,
    color: 0x9aa4a8,
    roughness: 0.44,
    metalness: 0.86,
    envMapIntensity: 1.05,
    name: 'evaporator-mesh',
  });

  const fanBlade = std({
    color: 0x7d888c,
    roughness: 0.56,
    metalness: 0.2,
    envMapIntensity: 0.36,
    name: 'evaporator-fan',
  });

  const coilCavity = std({
    color: 0x0a0d0e,
    roughness: 0.9,
    metalness: 0.12,
    envMapIntensity: 0.12,
    name: 'evaporator-coil-cavity',
  });

  return {
    panelWhite,
    panelSeam,
    panelCore,
    ceilingPU,
    floorDeck,
    floorTrench,
    steel,
    steelDark,
    steelPolished,
    traySteel,
    rubber,
    heaterWire,
    coldLens,
    ledGreen,
    dustCover,
    frostFilm,
    crtBeige,
    crtBeigeShade,
    blackPlastic,
    whitePlastic,
    brass,
    dialFace,
    needleRed,
    needleBlue,
    dialGlass,
    meat,
    produce,
    film,
    foodBox,
    foodBoxLid,
    cardboard,
    cardboardDark,
    labelPaper,
    coatNavy,
    coatNavyDark,
    reflectiveStrip,
    gloveRubber,
    pipeFoam,
    copper,
    warningRed,
    glowGreen,
    frostPatch,
    fanGrille,
    fanBlade,
    coilCavity,
  };
}
