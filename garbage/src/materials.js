import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 * Garbage-processing-room material palette.
 *
 * Four families carry the room: dirty painted plaster, stained cement,
 * black bin plastic and rusted steel. The bins, bags and monitors are the
 * only saturated objects, so the room reads as grey-brown with a green
 * glow from the corner.
 * ------------------------------------------------------------------ */

export function createMaterials(textures) {
  const std = (options) => new THREE.MeshStandardMaterial(options);

  const wallPaint = std({
    map: textures.wallPaint,
    bumpMap: textures.wallPaint,
    bumpScale: 0.008,
    color: 0xffffff,
    roughness: 0.94,
    metalness: 0.0,
    envMapIntensity: 0.16,
    name: 'dirty-white-plaster',
  });

  const wallPaintDark = std({
    map: textures.wallPaint,
    color: 0x77705f,
    roughness: 0.96,
    metalness: 0.0,
    envMapIntensity: 0.1,
    name: 'plaster-reveal',
  });

  const ceilingPaint = std({
    map: textures.ceilingPaint,
    bumpMap: textures.ceilingPaint,
    bumpScale: 0.007,
    color: 0xffffff,
    roughness: 0.97,
    metalness: 0.0,
    envMapIntensity: 0.1,
    name: 'yellowed-ceiling-paint',
  });

  const floorConcrete = std({
    map: textures.floorConcrete,
    bumpMap: textures.floorConcrete,
    bumpScale: 0.012,
    color: 0xc8c3b6,
    roughness: 0.87,
    metalness: 0.0,
    envMapIntensity: 0.18,
    name: 'stained-cement-floor',
  });

  const binGreen = std({
    map: textures.steel,
    bumpMap: textures.steel,
    bumpScale: 0.0016,
    color: 0x486451,
    roughness: 0.48,
    metalness: 0.22,
    envMapIntensity: 0.7,
    name: 'industrial-bin-green',
  });

  const binBlack = std({
    map: textures.steel,
    bumpMap: textures.steel,
    bumpScale: 0.0016,
    color: 0x333833,
    roughness: 0.44,
    metalness: 0.24,
    envMapIntensity: 0.75,
    name: 'industrial-bin-black',
  });

  const binGreenLid = std({
    map: textures.steel,
    color: 0x496853,
    roughness: 0.46,
    metalness: 0.2,
    envMapIntensity: 0.62,
    name: 'bin-green-lid',
  });

  const binBlackLid = std({
    map: textures.steel,
    color: 0x343a34,
    roughness: 0.44,
    metalness: 0.24,
    envMapIntensity: 0.68,
    name: 'bin-black-lid',
  });

  const binTrim = std({
    color: 0x141614,
    roughness: 0.72,
    metalness: 0.05,
    envMapIntensity: 0.2,
    name: 'bin-rubber-trim',
  });

  const bagBlack = std({
    map: textures.bagPlastic,
    bumpMap: textures.bagPlastic,
    bumpScale: 0.006,
    color: 0xffffff,
    roughness: 0.36,
    metalness: 0.06,
    envMapIntensity: 1.0,
    name: 'black-bin-liner',
  });

  const bagBlackDull = std({
    map: textures.bagPlastic,
    color: 0xb9bdbe,
    roughness: 0.42,
    metalness: 0.05,
    envMapIntensity: 0.75,
    name: 'dusty-black-liner',
  });

  const rackRust = std({
    map: textures.rust,
    bumpMap: textures.rust,
    bumpScale: 0.0032,
    color: 0xa08063,
    roughness: 0.86,
    metalness: 0.28,
    envMapIntensity: 0.4,
    name: 'rusted-angle-rack',
  });

  const steelShelf = std({
    map: textures.steel,
    bumpMap: textures.steel,
    bumpScale: 0.0016,
    color: 0xc9cbc4,
    roughness: 0.52,
    metalness: 0.55,
    envMapIntensity: 0.7,
    name: 'old-galvanised-steel',
  });

  const steelDark = std({
    map: textures.steel,
    bumpMap: textures.steel,
    bumpScale: 0.0012,
    color: 0x6c706c,
    roughness: 0.6,
    metalness: 0.55,
    envMapIntensity: 0.55,
    name: 'dark-steel',
  });

  const steelPolished = std({
    color: 0xb2b4ad,
    roughness: 0.32,
    metalness: 0.86,
    envMapIntensity: 1.1,
    name: 'worn-chrome',
  });

  const chrome = std({
    color: 0xc1c3bc,
    roughness: 0.24,
    metalness: 0.94,
    envMapIntensity: 1.25,
    name: 'chrome',
  });

  const rust = std({
    map: textures.rust,
    bumpMap: textures.rust,
    bumpScale: 0.003,
    color: 0xc8a184,
    roughness: 0.9,
    metalness: 0.18,
    envMapIntensity: 0.3,
    name: 'rusted-iron',
  });

  const wireMesh = std({
    map: textures.rust,
    color: 0x8b6a4e,
    roughness: 0.9,
    metalness: 0.25,
    envMapIntensity: 0.25,
    name: 'rusty-wire-mesh',
  });

  const woodDoor = std({
    map: textures.wood,
    bumpMap: textures.wood,
    bumpScale: 0.003,
    color: 0x60402e,
    roughness: 0.56,
    metalness: 0.04,
    envMapIntensity: 0.4,
    name: 'black-brown-door-timber',
  });

  const woodDoorInset = std({
    map: textures.wood,
    bumpMap: textures.wood,
    bumpScale: 0.002,
    color: 0x4c3024,
    roughness: 0.55,
    metalness: 0.04,
    envMapIntensity: 0.4,
    name: 'door-recessed-panel',
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
    color: 0x9f8f76,
    roughness: 0.97,
    metalness: 0.0,
    envMapIntensity: 0.14,
    name: 'wet-kraft-carton',
  });

  const burlap = std({
    map: textures.burlap,
    bumpMap: textures.burlap,
    bumpScale: 0.005,
    color: 0xbfae8d,
    roughness: 0.97,
    metalness: 0.0,
    envMapIntensity: 0.14,
    name: 'jute-sack',
  });

  const clothRag = std({
    map: textures.cloth,
    color: 0x8a8068,
    roughness: 1.0,
    metalness: 0.0,
    envMapIntensity: 0.1,
    name: 'dirty-work-rag',
  });

  const clothDark = std({
    map: textures.cloth,
    color: 0x53493d,
    roughness: 1.0,
    metalness: 0.0,
    envMapIntensity: 0.08,
    name: 'dark-rag',
  });

  const clothCream = std({
    map: textures.cloth,
    color: 0xcabf9f,
    roughness: 0.98,
    metalness: 0.0,
    envMapIntensity: 0.12,
    name: 'faded-cream-cloth',
  });

  const clothTarpaulin = std({
    map: textures.cloth,
    bumpMap: textures.cloth,
    bumpScale: 0.002,
    color: 0x5d6a5b,
    roughness: 0.9,
    metalness: 0.02,
    envMapIntensity: 0.18,
    name: 'folded-tarpaulin',
  });

  const ropeJute = std({
    map: textures.rope,
    bumpMap: textures.rope,
    bumpScale: 0.0025,
    color: 0xb8a582,
    roughness: 0.92,
    metalness: 0.0,
    envMapIntensity: 0.14,
    name: 'jute-rope',
  });

  const bristle = std({
    color: 0x9c8457,
    roughness: 0.96,
    metalness: 0.0,
    envMapIntensity: 0.1,
    name: 'broom-bristle',
  });

  const mopYarn = std({
    color: 0x8b8471,
    roughness: 0.98,
    metalness: 0.0,
    envMapIntensity: 0.1,
    name: 'grey-mop-yarn',
  });

  const paperOld = std({
    map: textures.paper,
    color: 0xd8cbb0,
    roughness: 0.94,
    metalness: 0.0,
    envMapIntensity: 0.16,
    side: THREE.DoubleSide,
    name: 'yellowed-paper',
  });

  const paperBlank = std({
    map: textures.paper,
    color: 0xe4dcc8,
    roughness: 0.9,
    metalness: 0.0,
    envMapIntensity: 0.18,
    side: THREE.DoubleSide,
    name: 'blank-paper',
  });

  const labelPaper = std({
    map: textures.label,
    color: 0xb3a68b,
    roughness: 0.8,
    metalness: 0.0,
    envMapIntensity: 0.2,
    side: THREE.DoubleSide,
    name: 'blank-label',
  });

  const plasticYellow = std({
    color: 0xa58c3c,
    roughness: 0.6,
    metalness: 0.02,
    envMapIntensity: 0.3,
    name: 'yellow-plastic',
  });

  const plasticGrey = std({
    color: 0x7d817a,
    roughness: 0.62,
    metalness: 0.02,
    envMapIntensity: 0.3,
    name: 'grey-plastic',
  });

  const plasticBlue = std({
    color: 0x3a515c,
    roughness: 0.58,
    metalness: 0.02,
    envMapIntensity: 0.35,
    name: 'blue-plastic',
  });

  const plasticWhite = std({
    color: 0xcac6b9,
    roughness: 0.57,
    metalness: 0.02,
    envMapIntensity: 0.3,
    name: 'white-plastic',
  });

  const metalTools = std({
    color: 0x91958f,
    roughness: 0.36,
    metalness: 0.88,
    envMapIntensity: 1.0,
    name: 'tool-steel',
  });

  const brass = std({
    color: 0x9d7f4e,
    roughness: 0.34,
    metalness: 0.88,
    envMapIntensity: 1.0,
    name: 'brass',
  });

  const paintRed = std({
    color: 0x7d3730,
    roughness: 0.54,
    metalness: 0.2,
    envMapIntensity: 0.4,
    name: 'valve-wheel-red',
  });

  const paintBlue = std({
    color: 0x355764,
    roughness: 0.52,
    metalness: 0.22,
    envMapIntensity: 0.45,
    name: 'paint-tin-blue',
  });

  const dirtyWater = std({
    color: 0x2a332c,
    roughness: 0.1,
    metalness: 0.2,
    envMapIntensity: 1.0,
    name: 'dirty-water',
  });

  const warningSign = std({
    map: textures.warningSign,
    color: 0xffffff,
    roughness: 0.82,
    metalness: 0.02,
    envMapIntensity: 0.2,
    transparent: true,
    alphaTest: 0.28,
    side: THREE.DoubleSide,
    name: 'no-smoking-warning-sign',
  });

  const hazardSticker = std({
    map: textures.hazardSticker,
    color: 0xffffff,
    roughness: 0.6,
    metalness: 0.03,
    envMapIntensity: 0.3,
    transparent: true,
    alphaTest: 0.3,
    side: THREE.DoubleSide,
    name: 'bin-hazard-sticker',
  });

  const crtPlastic = std({
    color: 0x8d8a7b,
    roughness: 0.72,
    metalness: 0.04,
    envMapIntensity: 0.3,
    name: 'old-monitor-plastic',
  });

  const crtDark = std({
    color: 0x24261f,
    roughness: 0.6,
    metalness: 0.16,
    envMapIntensity: 0.3,
    name: 'monitor-dark-housing',
  });

  const crtFeed = new THREE.MeshBasicMaterial({
    map: textures.crtFeed,
    color: 0xffffff,
    toneMapped: false,
    name: 'cctv-quad-feed',
  });

  const crtFeedSmall = new THREE.MeshBasicMaterial({
    map: textures.crtFeed,
    color: 0xffffff,
    toneMapped: false,
    name: 'cctv-small-feed',
  });

  const sealPlate = std({
    color: 0x8c8b81,
    emissive: new THREE.Color(0x24180f),
    emissiveIntensity: 0.55,
    roughness: 0.5,
    metalness: 0.55,
    envMapIntensity: 0.6,
    name: 'incinerator-seal-plate',
  });

  const incineratorGlow = new THREE.MeshBasicMaterial({
    color: 0xff7a2a,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    name: 'incinerator-heat-slit',
  });

  const puddle = new THREE.MeshPhysicalMaterial({    map: textures.puddle,
    color: 0xffffff,
    roughness: 0.08,
    metalness: 0.1,
    envMapIntensity: 1.1,
    clearcoat: 0.65,
    clearcoatRoughness: 0.06,
    transparent: true,
    depthWrite: false,
    alphaTest: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    name: 'dark-liquid-puddle',
  });

  const webThread = new THREE.MeshBasicMaterial({
    color: 0xb3ac9a,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    toneMapped: true,
    name: 'cobweb-thread',
  });

  const bulbGlass = new THREE.MeshBasicMaterial({
    color: 0xffe3b0,
    toneMapped: false,
    name: 'bulb-glass',
  });

  const shadeMetal = std({
    color: 0x4a4d3f,
    roughness: 0.62,
    metalness: 0.5,
    envMapIntensity: 0.45,
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

  const fluorescentLens = new THREE.MeshBasicMaterial({
    color: 0xd6e4dc,
    toneMapped: false,
    name: 'flickering-tube-lens',
  });

  const deadLens = std({
    color: 0x3b403a,
    roughness: 0.34,
    metalness: 0.24,
    envMapIntensity: 0.5,
    transparent: true,
    opacity: 0.72,
    name: 'dead-tube-glass',
  });

  const switchPlate = std({
    color: 0xcec8b8,
    roughness: 0.64,
    metalness: 0.04,
    envMapIntensity: 0.25,
    name: 'switch-plate',
  });

  const switchNub = std({
    color: 0xe3ddc9,
    roughness: 0.52,
    metalness: 0.04,
    envMapIntensity: 0.35,
    name: 'switch-nub',
  });

  const conduitMetal = std({
    map: textures.steel,
    color: 0x91968e,
    roughness: 0.54,
    metalness: 0.4,
    envMapIntensity: 0.5,
    name: 'conduit-steel',
  });

  const junctionBox = std({
    color: 0x696d65,
    roughness: 0.7,
    metalness: 0.22,
    envMapIntensity: 0.3,
    name: 'junction-box',
  });

  const cordRubber = std({
    color: 0x1b1917,
    roughness: 0.92,
    metalness: 0.0,
    envMapIntensity: 0.1,
    name: 'lamp-cord',
  });

  const rubber = std({
    color: 0x181a18,
    roughness: 0.9,
    metalness: 0.02,
    envMapIntensity: 0.14,
    name: 'rubber',
  });

  const cameraPlastic = std({
    color: 0xa19f92,
    roughness: 0.64,
    metalness: 0.04,
    envMapIntensity: 0.3,
    name: 'camera-plastic',
  });

  const cameraShade = std({
    color: 0x64665d,
    roughness: 0.6,
    metalness: 0.2,
    envMapIntensity: 0.4,
    name: 'camera-shade',
  });

  const cameraLens = std({
    color: 0x0a0f12,
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

  const crtLed = new THREE.MeshBasicMaterial({
    color: 0x79d78c,
    toneMapped: false,
    name: 'screen-led',
  });

  return {
    wallPaint,
    wallPaintDark,
    ceilingPaint,
    floorConcrete,
    binGreen,
    binBlack,
    binGreenLid,
    binBlackLid,
    binTrim,
    bagBlack,
    bagBlackDull,
    rackRust,
    steelShelf,
    steelDark,
    steelPolished,
    chrome,
    rust,
    wireMesh,
    woodDoor,
    woodDoorInset,
    woodOld,
    woodDark,
    cardboard,
    cardboardDark,
    burlap,
    clothRag,
    clothDark,
    clothCream,
    clothTarpaulin,
    ropeJute,
    bristle,
    mopYarn,
    paperOld,
    paperBlank,
    labelPaper,
    plasticYellow,
    plasticGrey,
    plasticBlue,
    plasticWhite,
    metalTools,
    brass,
    paintRed,
    paintBlue,
    dirtyWater,
    warningSign,
    hazardSticker,
    sealPlate,
    incineratorGlow,
    crtPlastic,
    crtDark,
    crtFeed,
    crtFeedSmall,
    puddle,
    webThread,
    bulbGlass,
    shadeMetal,
    shadeInner,
    fluorescentLens,
    deadLens,
    switchPlate,
    switchNub,
    conduitMetal,
    junctionBox,
    cordRubber,
    rubber,
    cameraPlastic,
    cameraShade,
    cameraLens,
    ledRed,
    ledGreen,
    crtLed,
  };
}
