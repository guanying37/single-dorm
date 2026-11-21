import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 * Storage-room material palette.
 *
 * Three families carry the room: raw concrete, old galvanised steel and
 * worn cloth/jute. Everything else is a small prop. One material per
 * surface family so the static batcher collapses the room into a few
 * dozen draw calls.
 * ------------------------------------------------------------------ */

export function createMaterials(textures) {
  const std = (options) => new THREE.MeshStandardMaterial(options);

  const wallConcrete = std({
    map: textures.wallConcrete,
    bumpMap: textures.wallConcrete,
    bumpScale: 0.012,
    color: 0xffffff,
    roughness: 0.96,
    metalness: 0.0,
    envMapIntensity: 0.12,
    name: 'raw-concrete-wall',
  });

  const wallConcreteDark = std({
    map: textures.wallConcrete,
    bumpMap: textures.wallConcrete,
    bumpScale: 0.008,
    color: 0x807b72,
    roughness: 0.98,
    metalness: 0.0,
    envMapIntensity: 0.08,
    name: 'concrete-reveal',
  });

  const ceilingConcrete = std({
    map: textures.ceilingConcrete,
    bumpMap: textures.ceilingConcrete,
    bumpScale: 0.011,
    color: 0xffffff,
    roughness: 0.98,
    metalness: 0.0,
    envMapIntensity: 0.08,
    name: 'concrete-soffit',
  });

  const floorConcrete = std({
    map: textures.floorConcrete,
    bumpMap: textures.floorConcrete,
    bumpScale: 0.014,
    color: 0xffffff,
    roughness: 0.88,
    metalness: 0.0,
    envMapIntensity: 0.14,
    name: 'stained-concrete-floor',
  });

  const steelShelf = std({
    map: textures.steel,
    bumpMap: textures.steel,
    bumpScale: 0.0016,
    color: 0xdadcd4,
    roughness: 0.5,
    metalness: 0.58,
    envMapIntensity: 0.8,
    name: 'old-galvanised-shelf',
  });

  const steelDark = std({
    map: textures.steel,
    bumpMap: textures.steel,
    bumpScale: 0.0012,
    color: 0x707573,
    roughness: 0.6,
    metalness: 0.58,
    envMapIntensity: 0.6,
    name: 'dark-steel',
  });

  const steelPolished = std({
    color: 0xb7b9b2,
    roughness: 0.3,
    metalness: 0.88,
    envMapIntensity: 1.2,
    name: 'worn-chrome',
  });

  const rust = std({
    map: textures.rust,
    bumpMap: textures.rust,
    bumpScale: 0.003,
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0.2,
    envMapIntensity: 0.3,
    name: 'rusted-iron',
  });

  const woodOld = std({
    map: textures.wood,
    bumpMap: textures.wood,
    bumpScale: 0.0025,
    color: 0xffffff,
    roughness: 0.86,
    metalness: 0.0,
    envMapIntensity: 0.25,
    name: 'worn-wood',
  });

  const woodDark = std({
    map: textures.wood,
    color: 0x7c6449,
    roughness: 0.88,
    metalness: 0.0,
    envMapIntensity: 0.2,
    name: 'dark-wood',
  });

  const cardboard = std({
    map: textures.cardboard,
    bumpMap: textures.cardboard,
    bumpScale: 0.002,
    color: 0xffffff,
    roughness: 0.95,
    metalness: 0.0,
    envMapIntensity: 0.2,
    name: 'kraft-carton',
  });

  const cardboardDark = std({
    map: textures.cardboard,
    color: 0xb7a78d,
    roughness: 0.96,
    metalness: 0.0,
    envMapIntensity: 0.16,
    name: 'kraft-carton-shadow',
  });

  const burlap = std({
    map: textures.burlap,
    bumpMap: textures.burlap,
    bumpScale: 0.005,
    color: 0xc9b691,
    roughness: 0.97,
    metalness: 0.0,
    envMapIntensity: 0.14,
    name: 'jute-sack',
  });

  const clothOlive = std({
    map: textures.cloth,
    bumpMap: textures.cloth,
    bumpScale: 0.002,
    color: 0x8a876d,
    roughness: 1.0,
    metalness: 0.0,
    envMapIntensity: 0.12,
    name: 'faded-olive-cloth',
  });

  const clothBrown = std({
    map: textures.cloth,
    color: 0x6d5948,
    roughness: 1.0,
    metalness: 0.0,
    envMapIntensity: 0.1,
    name: 'faded-brown-cloth',
  });

  const clothJacket = std({
    map: textures.cloth,
    bumpMap: textures.cloth,
    bumpScale: 0.002,
    color: 0x5a6b60,
    roughness: 1.0,
    metalness: 0.0,
    envMapIntensity: 0.1,
    name: 'discarded-jacket',
  });

  const clothCream = std({
    map: textures.cloth,
    color: 0xb5a98f,
    roughness: 1.0,
    metalness: 0.0,
    envMapIntensity: 0.12,
    name: 'faded-cream-cloth',
  });

  const clothScarf = std({
    map: textures.cloth,
    color: 0xa84a3f,
    roughness: 0.98,
    metalness: 0.0,
    envMapIntensity: 0.14,
    name: 'faded-red-scarf',
  });

  const ropeJute = std({
    map: textures.rope,
    bumpMap: textures.rope,
    bumpScale: 0.0025,
    color: 0xffffff,
    roughness: 0.92,
    metalness: 0.0,
    envMapIntensity: 0.14,
    name: 'jute-rope',
  });

  const bristle = std({
    color: 0xa98f5f,
    roughness: 0.96,
    metalness: 0.0,
    envMapIntensity: 0.1,
    name: 'broom-bristle',
  });

  const mopYarn = std({
    color: 0x8a8270,
    roughness: 0.98,
    metalness: 0.0,
    envMapIntensity: 0.1,
    name: 'mop-yarn',
  });

  const paperOld = std({
    map: textures.paper,
    color: 0xffffff,
    roughness: 0.94,
    metalness: 0.0,
    envMapIntensity: 0.16,
    side: THREE.DoubleSide,
    name: 'yellowed-paper',
  });

  const doorPaint = std({
    map: textures.doorPaint,
    bumpMap: textures.doorPaint,
    bumpScale: 0.0024,
    color: 0xffffff,
    roughness: 0.78,
    metalness: 0.12,
    envMapIntensity: 0.28,
    name: 'faded-door-paint',
  });

  const doorFrame = std({
    map: textures.steel,
    color: 0x596056,
    roughness: 0.62,
    metalness: 0.42,
    envMapIntensity: 0.45,
    name: 'door-frame-steel',
  });

  const louverDark = std({
    color: 0x252a27,
    roughness: 0.82,
    metalness: 0.12,
    envMapIntensity: 0.2,
    name: 'louvre-vane',
  });

  const chrome = std({
    color: 0xc4c6bf,
    roughness: 0.22,
    metalness: 0.95,
    envMapIntensity: 1.3,
    name: 'chrome',
  });

  const rubber = std({
    color: 0x191c19,
    roughness: 0.9,
    metalness: 0.02,
    envMapIntensity: 0.14,
    name: 'rubber',
  });

  const plasticBlue = std({
    color: 0x405b66,
    roughness: 0.55,
    metalness: 0.02,
    envMapIntensity: 0.4,
    name: 'blue-plastic',
  });

  const plasticGrey = std({
    color: 0x8b8f87,
    roughness: 0.6,
    metalness: 0.02,
    envMapIntensity: 0.35,
    name: 'grey-plastic',
  });

  const plasticYellow = std({
    color: 0xb08f3f,
    roughness: 0.58,
    metalness: 0.02,
    envMapIntensity: 0.35,
    name: 'yellow-plastic',
  });

  const plasticWhite = std({
    color: 0xd5d2c7,
    roughness: 0.55,
    metalness: 0.02,
    envMapIntensity: 0.35,
    name: 'white-plastic',
  });

  const glassJar = std({
    color: 0xcbd4cd,
    roughness: 0.12,
    metalness: 0.04,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    envMapIntensity: 1.1,
    side: THREE.DoubleSide,
    name: 'jar-glass',
  });

  const metalTools = std({
    color: 0x969a96,
    roughness: 0.34,
    metalness: 0.9,
    envMapIntensity: 1.1,
    name: 'tool-steel',
  });

  const brass = std({
    color: 0xa3834e,
    roughness: 0.32,
    metalness: 0.9,
    envMapIntensity: 1.1,
    name: 'brass',
  });

  const paintRed = std({
    color: 0x7c3730,
    roughness: 0.5,
    metalness: 0.22,
    envMapIntensity: 0.45,
    name: 'paint-tin-red',
  });

  const paintBlue = std({
    color: 0x3a596b,
    roughness: 0.5,
    metalness: 0.22,
    envMapIntensity: 0.5,
    name: 'paint-tin-blue',
  });

  const labelPaper = std({
    map: textures.label,
    color: 0xffffff,
    roughness: 0.8,
    metalness: 0.0,
    envMapIntensity: 0.2,
    side: THREE.DoubleSide,
    name: 'blank-label',
  });

  const dirtyWater = std({
    color: 0x2b3631,
    roughness: 0.12,
    metalness: 0.2,
    envMapIntensity: 1.0,
    name: 'dirty-water',
  });

  const bulbGlass = new THREE.MeshBasicMaterial({
    color: 0xffe3b0,
    toneMapped: false,
    name: 'bulb-glass',
  });

  const shadeMetal = std({
    color: 0x4b5148,
    roughness: 0.6,
    metalness: 0.55,
    envMapIntensity: 0.5,
    side: THREE.DoubleSide,
    name: 'enamel-shade',
  });

  const shadeInner = std({
    color: 0x6f6656,
    emissive: new THREE.Color(0x8a5a2a),
    emissiveIntensity: 0.03,
    roughness: 0.7,
    metalness: 0.05,
    envMapIntensity: 0.3,
    side: THREE.BackSide,
    name: 'shade-inner',
  });

  const cordRubber = std({
    color: 0x1c1a17,
    roughness: 0.92,
    metalness: 0.0,
    envMapIntensity: 0.1,
    name: 'lamp-cord',
  });

  const cameraPlastic = std({
    color: 0xa9a79a,
    roughness: 0.64,
    metalness: 0.04,
    envMapIntensity: 0.3,
    name: 'camera-plastic',
  });

  const cameraShade = std({
    color: 0x6d6f66,
    roughness: 0.6,
    metalness: 0.2,
    envMapIntensity: 0.4,
    name: 'camera-shade',
  });

  const cameraLens = std({
    color: 0x0b1013,
    roughness: 0.14,
    metalness: 0.55,
    envMapIntensity: 1.4,
    name: 'camera-lens',
  });

  const ledRed = new THREE.MeshBasicMaterial({
    color: 0xff4a32,
    toneMapped: false,
    name: 'recording-led',
  });

  const ledGreen = new THREE.MeshBasicMaterial({
    color: 0x8fffa8,
    toneMapped: false,
    name: 'power-led',
  });

  const conduitMetal = std({
    map: textures.steel,
    color: 0x7a7e77,
    roughness: 0.56,
    metalness: 0.45,
    envMapIntensity: 0.5,
    name: 'conduit-steel',
  });

  const junctionBox = std({
    color: 0x6e726a,
    roughness: 0.68,
    metalness: 0.25,
    envMapIntensity: 0.35,
    name: 'junction-box',
  });

  const wallPlate = std({
    color: 0xd6d2c4,
    roughness: 0.62,
    metalness: 0.05,
    envMapIntensity: 0.3,
    name: 'switch-plate',
  });

  const switchNub = std({
    color: 0xe8e4d2,
    roughness: 0.5,
    metalness: 0.05,
    envMapIntensity: 0.4,
    name: 'switch-nub',
  });

  const corridorPlaster = std({
    map: textures.wallConcrete,
    color: 0xd8ceb8,
    roughness: 0.92,
    metalness: 0.0,
    envMapIntensity: 0.16,
    name: 'corridor-plaster',
  });

  const corridorDado = std({
    map: textures.wallConcrete,
    color: 0x44584e,
    roughness: 0.74,
    metalness: 0.03,
    envMapIntensity: 0.24,
    name: 'corridor-dado',
  });

  const corridorFloor = std({
    map: textures.floorConcreteTile,
    color: 0xc0bcae,
    roughness: 0.56,
    metalness: 0.03,
    envMapIntensity: 0.35,
    name: 'corridor-vinyl',
  });

  const corridorCeiling = std({
    map: textures.wallConcrete,
    color: 0xc9c2b2,
    roughness: 0.95,
    metalness: 0.0,
    envMapIntensity: 0.12,
    name: 'corridor-ceiling',
  });

  const extinguisherRed = std({
    color: 0x8e2f2c,
    roughness: 0.44,
    metalness: 0.24,
    envMapIntensity: 0.5,
    name: 'extinguisher-cabinet',
  });

  const extinguisherDark = std({
    color: 0x2a2422,
    roughness: 0.6,
    metalness: 0.2,
    envMapIntensity: 0.25,
    name: 'extinguisher-dark',
  });

  const boardCork = std({
    map: textures.cardboard,
    color: 0x9a7b52,
    roughness: 0.95,
    metalness: 0.0,
    envMapIntensity: 0.14,
    name: 'cork-board',
  });

  const paperBlank = std({
    map: textures.paper,
    color: 0xf2ecdc,
    roughness: 0.9,
    metalness: 0.0,
    envMapIntensity: 0.18,
    side: THREE.DoubleSide,
    name: 'notice-paper',
  });

  const fluorescentLens = new THREE.MeshBasicMaterial({
    color: 0xe8f2ee,
    toneMapped: false,
    name: 'corridor-lens',
  });

  const louverLight = new THREE.MeshBasicMaterial({
    map: textures.louverLight,
    color: 0xd8e9ee,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    side: THREE.DoubleSide,
    name: 'louvre-light-comb',
  });

  const ventGlow = new THREE.MeshBasicMaterial({
    map: textures.glow,
    color: 0xcfe4ea,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    side: THREE.DoubleSide,
    name: 'vent-glow',
  });

  return {
    wallConcrete,
    wallConcreteDark,
    ceilingConcrete,
    floorConcrete,
    steelShelf,
    steelDark,
    steelPolished,
    rust,
    woodOld,
    woodDark,
    cardboard,
    cardboardDark,
    burlap,
    clothOlive,
    clothBrown,
    clothJacket,
    clothCream,
    clothScarf,
    ropeJute,
    bristle,
    mopYarn,
    paperOld,
    doorPaint,
    doorFrame,
    louverDark,
    chrome,
    rubber,
    plasticBlue,
    plasticGrey,
    plasticYellow,
    plasticWhite,
    glassJar,
    metalTools,
    brass,
    paintRed,
    paintBlue,
    labelPaper,
    dirtyWater,
    bulbGlass,
    shadeMetal,
    shadeInner,
    cordRubber,
    cameraPlastic,
    cameraShade,
    cameraLens,
    ledRed,
    ledGreen,
    conduitMetal,
    junctionBox,
    wallPlate,
    switchNub,
    corridorPlaster,
    corridorDado,
    corridorFloor,
    corridorCeiling,
    extinguisherRed,
    extinguisherDark,
    boardCork,
    paperBlank,
    fluorescentLens,
    louverLight,
    ventGlow,
  };
}
