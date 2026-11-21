import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 * Infirmary material palette.
 *
 * The room is carried by four families: white painted plaster, 600 mm
 * white floor tile, brushed stainless and pale-blue fabric. Light oak
 * appears only in the medicine-cabinet drawers and the door. Accents are
 * restricted to the blue curtain/rail, a yellow-red waste bin and a
 * little green pothos, so the room stays clean and clinical.
 * ------------------------------------------------------------------ */

export function createMaterials(textures) {
  const std = (options) => new THREE.MeshStandardMaterial(options);

  const wallPaint = std({
    map: textures.wall,
    bumpMap: textures.wall,
    bumpScale: 0.0035,
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0.0,
    envMapIntensity: 0.32,
    name: 'white-plaster',
  });

  const wallShadow = std({
    map: textures.wall,
    color: 0xdfe5e2,
    roughness: 0.92,
    metalness: 0.0,
    envMapIntensity: 0.24,
    name: 'plaster-reveal',
  });

  const ceilingPaint = std({
    map: textures.ceiling,
    bumpMap: textures.ceiling,
    bumpScale: 0.002,
    color: 0xffffff,
    roughness: 0.95,
    metalness: 0.0,
    envMapIntensity: 0.22,
    name: 'white-ceiling',
  });

  const floorTile = std({
    map: textures.floor,
    bumpMap: textures.floor,
    bumpScale: 0.002,
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.03,
    envMapIntensity: 0.75,
    name: 'white-floor-tile',
  });

  const splashTile = std({
    map: textures.splash,
    bumpMap: textures.splash,
    bumpScale: 0.002,
    color: 0xffffff,
    roughness: 0.24,
    metalness: 0.03,
    envMapIntensity: 0.85,
    name: 'white-splash-tile',
  });

  const cornice = std({
    color: 0xf7f8f5,
    roughness: 0.86,
    metalness: 0.0,
    envMapIntensity: 0.3,
    name: 'white-plaster-cornice',
  });

  const skirting = std({
    color: 0xe9eeeb,
    roughness: 0.7,
    metalness: 0.0,
    envMapIntensity: 0.35,
    name: 'white-skirting',
  });

  const rail = std({
    color: 0xa8cbdc,
    roughness: 0.48,
    metalness: 0.05,
    envMapIntensity: 0.5,
    name: 'pale-blue-bumper-rail',
  });

  const railEnd = std({
    color: 0x8fb8cc,
    roughness: 0.5,
    metalness: 0.05,
    envMapIntensity: 0.45,
    name: 'pale-blue-rail-end',
  });

  const doorPaint = std({
    map: textures.doorPaint,
    bumpMap: textures.doorPaint,
    bumpScale: 0.0016,
    color: 0xffffff,
    roughness: 0.58,
    metalness: 0.02,
    envMapIntensity: 0.5,
    name: 'white-door-paint',
  });

  const doorFrame = std({
    color: 0xf3f5f1,
    roughness: 0.55,
    metalness: 0.02,
    envMapIntensity: 0.55,
    name: 'white-door-frame',
  });

  const steel = std({
    map: textures.steel,
    bumpMap: textures.steel,
    bumpScale: 0.0014,
    color: 0xf0f2f0,
    roughness: 0.38,
    metalness: 0.72,
    envMapIntensity: 0.95,
    name: 'brushed-stainless',
  });

  const steelDark = std({
    map: textures.steel,
    color: 0x9aa29f,
    roughness: 0.46,
    metalness: 0.65,
    envMapIntensity: 0.8,
    name: 'darker-stainless',
  });

  const cabinetSteel = std({
    color: 0xb9c1be,
    roughness: 0.36,
    metalness: 0.72,
    envMapIntensity: 0.95,
    name: 'cabinet-steel',
  });

  const chrome = std({
    color: 0xd3d8d6,
    roughness: 0.13,
    metalness: 0.96,
    envMapIntensity: 1.5,
    name: 'polished-chrome',
  });

  const counterSteel = std({
    color: 0xdde1de,
    roughness: 0.19,
    metalness: 0.94,
    envMapIntensity: 1.2,
    name: 'counter-stainless',
  });

  const basinSteel = std({
    color: 0x3f4b49,
    roughness: 0.45,
    metalness: 0.55,
    envMapIntensity: 0.55,
    name: 'basin-stainless',
  });

  const aluminum = std({
    color: 0xc9cfcd,
    roughness: 0.35,
    metalness: 0.75,
    envMapIntensity: 0.9,
    name: 'anodised-aluminium',
  });

  const wood = std({
    map: textures.wood,
    bumpMap: textures.wood,
    bumpScale: 0.0018,
    color: 0xffffff,
    roughness: 0.7,
    metalness: 0.0,
    envMapIntensity: 0.34,
    name: 'light-oak',
  });

  const woodEdge = std({
    color: 0xb08c5e,
    roughness: 0.74,
    metalness: 0.0,
    envMapIntensity: 0.28,
    name: 'light-oak-edge',
  });

  const bedFrame = std({
    color: 0xf2f3ef,
    roughness: 0.42,
    metalness: 0.16,
    envMapIntensity: 0.65,
    name: 'white-powder-coated-steel',
  });

  const mattress = std({
    color: 0xf4f5f1,
    roughness: 0.82,
    metalness: 0.0,
    envMapIntensity: 0.28,
    name: 'white-mattress',
  });

  const sheet = std({
    color: 0xfbfcf9,
    roughness: 0.92,
    metalness: 0.0,
    envMapIntensity: 0.24,
    name: 'white-bed-sheet',
  });

  const pillow = std({
    color: 0xf8faf6,
    roughness: 0.95,
    metalness: 0.0,
    envMapIntensity: 0.22,
    name: 'white-pillow',
  });

  const blanket = std({
    color: 0xaecfdf,
    roughness: 0.94,
    metalness: 0.0,
    envMapIntensity: 0.2,
    name: 'pale-blue-blanket',
  });

  const curtain = std({
    map: textures.fabric,
    bumpMap: textures.fabric,
    bumpScale: 0.0025,
    color: 0xffffff,
    roughness: 0.96,
    metalness: 0.0,
    envMapIntensity: 0.18,
    side: THREE.DoubleSide,
    name: 'pale-blue-curtain',
  });

  const curtainTrack = std({
    color: 0xbfc6c3,
    roughness: 0.35,
    metalness: 0.7,
    envMapIntensity: 0.8,
    name: 'curtain-track',
  });

  const glass = std({
    color: 0xd4e4e8,
    roughness: 0.09,
    metalness: 0.08,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    envMapIntensity: 0.42,
    side: THREE.DoubleSide,
    name: 'cabinet-glass',
  });

  const glassShelf = std({
    color: 0xdcebed,
    roughness: 0.08,
    metalness: 0.15,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    envMapIntensity: 1.0,
    side: THREE.DoubleSide,
    name: 'glass-shelf',
  });

  const mirror = std({
    color: 0xc6d5d6,
    roughness: 0.035,
    metalness: 1.0,
    envMapIntensity: 1.5,
    name: 'frameless-mirror',
  });

  const bottleWhite = std({
    color: 0xf6f5ee,
    roughness: 0.36,
    metalness: 0.0,
    envMapIntensity: 0.5,
    name: 'white-medicine-bottle',
  });

  const bottleCap = std({
    color: 0xe8ece8,
    roughness: 0.55,
    metalness: 0.04,
    envMapIntensity: 0.4,
    name: 'bottle-cap',
  });

  const jarGlass = std({
    color: 0xd2ddd8,
    roughness: 0.12,
    metalness: 0.05,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    envMapIntensity: 1.1,
    side: THREE.DoubleSide,
    name: 'jar-glass',
  });

  const labelBlue = std({
    map: textures.label,
    color: 0xffffff,
    roughness: 0.82,
    metalness: 0.0,
    envMapIntensity: 0.2,
    name: 'label-blue',
  });

  const labelRed = std({
    map: textures.label,
    color: 0xe8c6be,
    roughness: 0.82,
    metalness: 0.0,
    envMapIntensity: 0.2,
    name: 'label-red',
  });

  const labelGreen = std({
    map: textures.label,
    color: 0xc8dfd3,
    roughness: 0.82,
    metalness: 0.0,
    envMapIntensity: 0.2,
    name: 'label-green',
  });

  const packageWhite = std({
    color: 0xf0f0e8,
    roughness: 0.75,
    metalness: 0.0,
    envMapIntensity: 0.25,
    name: 'white-supply-box',
  });

  const packageKraft = std({
    color: 0xcab38c,
    roughness: 0.9,
    metalness: 0.0,
    envMapIntensity: 0.2,
    name: 'kraft-supply-box',
  });

  const packageBlue = std({
    color: 0x7aa6b7,
    roughness: 0.65,
    metalness: 0.0,
    envMapIntensity: 0.3,
    name: 'blue-supply-pack',
  });

  const opPad = std({
    color: 0xf3f4ef,
    roughness: 0.62,
    metalness: 0.0,
    envMapIntensity: 0.35,
    name: 'operating-pad',
  });

  const opPadBlue = std({
    color: 0x9fc3d2,
    roughness: 0.66,
    metalness: 0.0,
    envMapIntensity: 0.3,
    name: 'operating-pad-blue',
  });

  const wasteYellow = std({
    color: 0xd8aa32,
    roughness: 0.5,
    metalness: 0.02,
    envMapIntensity: 0.4,
    name: 'medical-waste-yellow',
  });

  const wasteRed = std({
    color: 0xa63c35,
    roughness: 0.52,
    metalness: 0.03,
    envMapIntensity: 0.4,
    name: 'medical-waste-red',
  });

  const wasteDark = std({
    color: 0x3a3a35,
    roughness: 0.7,
    metalness: 0.1,
    envMapIntensity: 0.3,
    name: 'waste-dark-plastic',
  });

  const wasteSymbol = std({
    map: textures.wasteSymbol,
    transparent: true,
    color: 0xffffff,
    roughness: 0.7,
    metalness: 0.0,
    envMapIntensity: 0.2,
    side: THREE.DoubleSide,
    name: 'waste-symbol',
  });

  const stoolSeat = std({
    color: 0x2f5d5e,
    roughness: 0.6,
    metalness: 0.02,
    envMapIntensity: 0.35,
    name: 'doctor-stool-seat',
  });

  const rubber = std({
    color: 0x222826,
    roughness: 0.9,
    metalness: 0.02,
    envMapIntensity: 0.15,
    name: 'rubber',
  });

  const plasticWhite = std({
    color: 0xe7eae4,
    roughness: 0.48,
    metalness: 0.02,
    envMapIntensity: 0.4,
    name: 'white-plastic',
  });

  const plasticBlue = std({
    color: 0x6b96a6,
    roughness: 0.5,
    metalness: 0.02,
    envMapIntensity: 0.4,
    name: 'blue-plastic',
  });

  const instrumentSteel = std({
    color: 0xa9aeaa,
    roughness: 0.22,
    metalness: 0.95,
    envMapIntensity: 1.35,
    name: 'instrument-steel',
  });

  const instrumentHandle = std({
    color: 0x3f4a4a,
    roughness: 0.5,
    metalness: 0.25,
    envMapIntensity: 0.5,
    name: 'instrument-handle',
  });

  const plantGreen = std({
    color: 0x387a4c,
    roughness: 0.66,
    metalness: 0.0,
    envMapIntensity: 0.35,
    side: THREE.DoubleSide,
    name: 'pothos-leaf',
  });

  const plantGreenLight = std({
    color: 0x5d9b64,
    roughness: 0.62,
    metalness: 0.0,
    envMapIntensity: 0.35,
    side: THREE.DoubleSide,
    name: 'pothos-leaf-light',
  });

  const plantStem = std({
    color: 0x4b6b43,
    roughness: 0.8,
    metalness: 0.0,
    envMapIntensity: 0.2,
    name: 'pothos-stem',
  });

  const pot = std({
    color: 0xe6e2d8,
    roughness: 0.72,
    metalness: 0.02,
    envMapIntensity: 0.35,
    name: 'ceramic-pot',
  });

  const soil = std({
    color: 0x3b3127,
    roughness: 0.98,
    metalness: 0.0,
    envMapIntensity: 0.1,
    name: 'potting-soil',
  });

  const paper = std({
    color: 0xf4f1e6,
    roughness: 0.9,
    metalness: 0.0,
    envMapIntensity: 0.2,
    side: THREE.DoubleSide,
    name: 'paper',
  });

  const screenBezel = std({
    color: 0x232927,
    roughness: 0.5,
    metalness: 0.2,
    envMapIntensity: 0.4,
    name: 'display-bezel',
  });

  const ledPanel = new THREE.MeshBasicMaterial({
    color: 0xf2f8ff,
    toneMapped: false,
    name: 'ceiling-led-panel',
  });

  const ledPanelRim = std({
    color: 0xe8ece8,
    roughness: 0.4,
    metalness: 0.35,
    envMapIntensity: 0.7,
    name: 'led-fixture-rim',
  });

  const surgicalLens = new THREE.MeshBasicMaterial({
    color: 0xfff6e4,
    toneMapped: false,
    name: 'surgical-lamp-lens',
  });

  const surgicalInner = std({
    color: 0xf2eee4,
    emissive: new THREE.Color(0xffefd2),
    emissiveIntensity: 0.85,
    roughness: 0.5,
    metalness: 0.1,
    envMapIntensity: 0.5,
    side: THREE.DoubleSide,
    name: 'surgical-lamp-inner',
  });

  const displayScreen = new THREE.MeshBasicMaterial({
    map: textures.display,
    color: 0xd8dfda,
    toneMapped: false,
    name: 'wall-display-feed',
  });

  const ledRed = new THREE.MeshBasicMaterial({
    color: 0xff4b36,
    toneMapped: false,
    name: 'recording-led',
  });

  const ledGreen = new THREE.MeshBasicMaterial({
    color: 0x8cf0a6,
    toneMapped: false,
    name: 'power-led',
  });

  const sensorLed = new THREE.MeshBasicMaterial({
    color: 0x9fe8ff,
    toneMapped: false,
    name: 'sensor-led',
  });

  const water = std({
    color: 0xcfe4e8,
    roughness: 0.08,
    metalness: 0.15,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    envMapIntensity: 1.2,
    name: 'basin-water',
  });

  const soapLiquid = std({
    color: 0xd8e8d6,
    roughness: 0.3,
    metalness: 0.0,
    transparent: true,
    opacity: 0.8,
    envMapIntensity: 0.6,
    name: 'soap-liquid',
  });

  return {
    wallPaint,
    wallShadow: wallPaint,
    ceilingPaint,
    floorTile,
    splashTile: floorTile,
    cornice,
    skirting: cornice,
    rail,
    railEnd: rail,
    doorPaint,
    doorFrame: cornice,
    steel,
    steelDark,
    cabinetSteel,
    chrome,
    counterSteel,
    basinSteel,
    mirror,
    aluminum: steel,
    wood,
    woodEdge,
    bedFrame: cornice,
    mattress: mattress,
    sheet: mattress,
    pillow: mattress,
    blanket,
    curtain,
    curtainTrack: steel,
    glass,
    glassShelf: glass,
    jarGlass: glass,
    bottleWhite: mattress,
    bottleCap: cornice,
    labelBlue,
    labelRed,
    labelGreen,
    packageWhite: mattress,
    packageKraft: packageWhite,
    packageBlue,
    opPad: mattress,
    opPadBlue: blanket,
    wasteYellow,
    wasteRed,
    wasteDark,
    wasteSymbol,
    stoolSeat,
    rubber: wasteDark,
    plasticWhite: cornice,
    plasticBlue: steelDark,
    instrumentSteel: chrome,
    instrumentHandle: steelDark,
    plantGreen,
    plantGreenLight,
    plantStem: plantGreen,
    pot,
    soil,
    paper: mattress,
    screenBezel: steelDark,
    ledPanel,
    ledPanelRim: cornice,
    surgicalLens,
    surgicalInner,
    displayScreen,
    ledRed,
    ledGreen,
    sensorLed: ledGreen,
    water,
    soapLiquid,
  };
}
