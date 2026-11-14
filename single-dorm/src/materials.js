import * as THREE from 'three';

/* Shared PBR materials. Texture maps are reused; material count is kept
 * low so shader compilation and GPU state changes stay cheap. */

export function createMaterials(textures) {
  const std = (options) => new THREE.MeshStandardMaterial(options);
  const phys = (options) => new THREE.MeshPhysicalMaterial(options);

  const wallpaper = std({
    map: textures.wallpaper,
    bumpMap: textures.wallpaper,
    bumpScale: 0.0035,
    roughness: 0.82,
    metalness: 0,
    envMapIntensity: 0.22,
    color: 0xfffcf1,
  });
  wallpaper.name = 'yellow-wallpaper';

  const floor = std({
    map: textures.floor,
    roughness: 0.36,
    metalness: 0.02,
    envMapIntensity: 0.68,
    color: 0xe8c8a4,
  });
  floor.name = 'smooth-oak-floor';

  const ceiling = std({
    color: 0xf8f6ef,
    roughness: 0.93,
    metalness: 0,
    envMapIntensity: 0.18,
  });

  const whitePaint = std({
    color: 0xece8dd,
    roughness: 0.52,
    metalness: 0.01,
    envMapIntensity: 0.32,
  });

  const warmWhitePaint = std({
    color: 0xf3ede1,
    roughness: 0.58,
    metalness: 0,
    envMapIntensity: 0.28,
  });

  const oak = std({
    map: textures.oak,
    color: 0xc59b71,
    roughness: 0.56,
    metalness: 0,
    envMapIntensity: 0.3,
  });

  const lightOak = std({
    map: textures.oak,
    color: 0xd8b586,
    roughness: 0.48,
    metalness: 0,
    envMapIntensity: 0.36,
  });

  const darkWood = std({
    map: textures.walnut,
    color: 0xae856c,
    roughness: 0.54,
    metalness: 0.02,
    envMapIntensity: 0.32,
  });

  const doorWood = std({
    map: textures.walnut,
    color: 0xb68f78,
    roughness: 0.46,
    metalness: 0.02,
    envMapIntensity: 0.4,
  });

  const interiorWood = std({
    color: 0xd8c6ad,
    roughness: 0.72,
    metalness: 0,
    envMapIntensity: 0.18,
  });

  const rawPlank = std({
    map: textures.weatheredPlank,
    bumpMap: textures.weatheredPlank,
    bumpScale: 0.003,
    color: 0xffffff,
    roughness: 0.95,
    metalness: 0,
    envMapIntensity: 0.08,
  });

  const brass = std({
    color: 0xc39a59,
    roughness: 0.27,
    metalness: 0.92,
    envMapIntensity: 1.3,
  });

  const agedBrass = std({
    color: 0x9b7a47,
    roughness: 0.42,
    metalness: 0.82,
    envMapIntensity: 1.0,
  });

  const darkMetal = std({
    color: 0x2d2d2a,
    roughness: 0.45,
    metalness: 0.62,
    envMapIntensity: 0.7,
  });

  const blackMetal = std({
    color: 0x161716,
    roughness: 0.38,
    metalness: 0.46,
    envMapIntensity: 0.5,
  });

  const iron = std({
    color: 0x3e3a35,
    roughness: 0.58,
    metalness: 0.72,
    envMapIntensity: 0.5,
  });

  const mattress = std({
    color: 0xf2f0e8,
    roughness: 0.92,
    metalness: 0,
    envMapIntensity: 0.2,
  });

  const whiteSheet = std({
    color: 0xfbf8f0,
    roughness: 0.87,
    metalness: 0,
    envMapIntensity: 0.2,
  });

  const duvet = phys({
    color: 0xeee7da,
    roughness: 0.9,
    metalness: 0,
    sheen: 0.4,
    sheenRoughness: 0.84,
    sheenColor: new THREE.Color(0xe8d5b8),
    envMapIntensity: 0.16,
  });

  const pillow = std({
    color: 0xfbf8ee,
    roughness: 0.95,
    metalness: 0,
    envMapIntensity: 0.16,
  });

  const curtain = phys({
    color: 0x602138,
    roughness: 0.8,
    metalness: 0.01,
    sheen: 0.42,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color(0x94425d),
    envMapIntensity: 0.24,
    side: THREE.DoubleSide,
  });

  const rug = std({
    map: textures.rug,
    color: 0xffffff,
    roughness: 0.92,
    metalness: 0,
    envMapIntensity: 0.12,
  });

  const rugEdge = std({
    color: 0x4e181a,
    roughness: 0.95,
    metalness: 0,
  });

  const matteCream = std({
    color: 0xefe5cf,
    roughness: 0.9,
    metalness: 0,
    envMapIntensity: 0.15,
  });

  const artEmblem = std({
    map: textures.emblem,
    emissiveMap: textures.emblem,
    emissive: new THREE.Color(0x7a674b),
    emissiveIntensity: 0.12,
    roughness: 0.78,
    metalness: 0,
    envMapIntensity: 0.2,
  });

  const artMonokuma = std({
    map: textures.monokuma,
    emissiveMap: textures.monokuma,
    emissive: new THREE.Color(0x6d685e),
    emissiveIntensity: 0.1,
    roughness: 0.79,
    metalness: 0,
    envMapIntensity: 0.2,
  });

  const goldFrame = std({
    color: 0xa98243,
    roughness: 0.32,
    metalness: 0.72,
    envMapIntensity: 1.0,
  });

  const blackFrame = std({
    color: 0x1d1a18,
    roughness: 0.42,
    metalness: 0.12,
    envMapIntensity: 0.5,
  });

  const woodFrame = std({
    map: textures.walnut,
    color: 0xc3a184,
    roughness: 0.5,
    metalness: 0.03,
    envMapIntensity: 0.3,
  });

  const paper = std({
    color: 0xf3e8cf,
    roughness: 0.94,
    metalness: 0,
    envMapIntensity: 0.1,
  });

  const bookGreen = std({
    color: 0x30463a,
    roughness: 0.7,
    metalness: 0.02,
    envMapIntensity: 0.2,
  });

  const bookRust = std({
    color: 0x7f3e31,
    roughness: 0.74,
    metalness: 0.02,
    envMapIntensity: 0.2,
  });

  const bookCream = std({
    color: 0xd8cbb3,
    roughness: 0.78,
    metalness: 0,
    envMapIntensity: 0.18,
  });

  const penCup = phys({
    map: textures.penCup,
    color: 0xffffff,
    roughness: 0.26,
    metalness: 0,
    clearcoat: 0.55,
    clearcoatRoughness: 0.2,
    envMapIntensity: 0.75,
  });

  const lampEnamel = std({
    color: 0x374d3d,
    roughness: 0.36,
    metalness: 0.28,
    envMapIntensity: 0.75,
  });

  const lampEnamelInner = std({
    color: 0xd8c9ac,
    roughness: 0.7,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  const bulb = std({
    color: 0xfff2d0,
    emissive: new THREE.Color(0xffce78),
    emissiveIntensity: 1.65,
    roughness: 0.24,
    metalness: 0,
  });

  const screen = std({
    map: textures.crt,
    emissiveMap: textures.crt,
    emissive: new THREE.Color(0x9bc7aa),
    emissiveIntensity: 0.7,
    roughness: 0.3,
    metalness: 0.1,
    envMapIntensity: 0.25,
  });

  const screenGlass = phys({
    color: 0x222b24,
    roughness: 0.12,
    metalness: 0.1,
    transmission: 0.0,
    transparent: true,
    opacity: 0.16,
    envMapIntensity: 0.7,
  });

  const crtPlastic = std({
    color: 0x9a927e,
    roughness: 0.62,
    metalness: 0.03,
    envMapIntensity: 0.3,
  });

  const crtDarkPlastic = std({
    color: 0x2b2a27,
    roughness: 0.62,
    metalness: 0.08,
    envMapIntensity: 0.25,
  });

  const cctvWhite = std({
    color: 0xd9d6c9,
    roughness: 0.48,
    metalness: 0.06,
    envMapIntensity: 0.4,
  });

  const darkGlass = std({
    color: 0x121b1d,
    roughness: 0.16,
    metalness: 0.36,
    envMapIntensity: 0.6,
  });

  const ledRed = std({
    color: 0x7c1818,
    emissive: new THREE.Color(0xff2b2b),
    emissiveIntensity: 2.2,
    roughness: 0.38,
    metalness: 0,
  });

  const ledGreen = std({
    color: 0x23422d,
    emissive: new THREE.Color(0x67e09c),
    emissiveIntensity: 1.1,
    roughness: 0.4,
    metalness: 0,
  });

  const airConditioner = std({
    color: 0xeeece3,
    roughness: 0.4,
    metalness: 0.04,
    envMapIntensity: 0.45,
  });

  const outlet = std({
    color: 0xe9e4d8,
    roughness: 0.46,
    metalness: 0.02,
    envMapIntensity: 0.25,
  });

  const shadowedCeiling = std({
    color: 0xf7f5ed,
    roughness: 0.95,
    metalness: 0,
  });

  const pendantLamp = std({
    color: 0xf0ba43,
    roughness: 0.36,
    metalness: 0.24,
    envMapIntensity: 0.9,
    emissive: new THREE.Color(0xa2600d),
    emissiveIntensity: 0.34,
    side: THREE.DoubleSide,
  });

  const throwRust = phys({
    color: 0x7f4839,
    roughness: 0.92,
    metalness: 0,
    sheen: 0.32,
    sheenRoughness: 0.8,
    sheenColor: new THREE.Color(0xbd7a67),
    envMapIntensity: 0.14,
  });

  const throwStripe = std({
    color: 0xddc9a9,
    roughness: 0.96,
    metalness: 0,
    envMapIntensity: 0.08,
  });

  return {
    wallpaper,
    floor,
    ceiling,
    shadowedCeiling,
    pendantLamp,
    throwRust,
    throwStripe,
    whitePaint,
    warmWhitePaint,
    oak,
    lightOak,
    darkWood,
    doorWood,
    interiorWood,
    rawPlank,
    brass,
    agedBrass,
    darkMetal,
    blackMetal,
    iron,
    mattress,
    whiteSheet,
    duvet,
    pillow,
    curtain,
    rug,
    rugEdge,
    matteCream,
    artEmblem,
    artMonokuma,
    goldFrame,
    blackFrame,
    woodFrame,
    paper,
    bookGreen,
    bookRust,
    bookCream,
    penCup,
    lampEnamel,
    lampEnamelInner,
    bulb,
    screen,
    screenGlass,
    crtPlastic,
    crtDarkPlastic,
    cctvWhite,
    darkGlass,
    ledRed,
    ledGreen,
    airConditioner,
    outlet,
  };
}
