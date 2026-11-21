import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 * 阅览室材质库。
 *
 * 三个材质族撑起房间：旧红砖、深棕胡桃木、黄铜/绿玻璃；再加书脊布、
 * 绒布坐垫与墙面浮雕用的低饱和矿物色。一个材质键对应一个静态批次，
 * 所以书脊只有 8 个颜色槽，而不是每本书一种颜色。
 * ------------------------------------------------------------------ */

export function createMaterials(textures) {
  const std = (options) => new THREE.MeshStandardMaterial(options);
  const basic = (options) => new THREE.MeshBasicMaterial(options);

  /* --- 房间壳 ------------------------------------------------------ */

  const brickWall = std({
    map: textures.brick,
    bumpMap: textures.brick,
    bumpScale: 0.02,
    color: 0xffffff,
    roughness: 0.95,
    metalness: 0.0,
    envMapIntensity: 0.1,
    name: 'old-brick-wall',
  });

  const brickDeep = std({
    map: textures.brick,
    bumpMap: textures.brick,
    bumpScale: 0.016,
    color: 0x9c8c7a,
    roughness: 0.97,
    metalness: 0.0,
    envMapIntensity: 0.08,
    name: 'brick-reveal',
  });

  const brickSill = std({
    map: textures.brick,
    bumpMap: textures.brick,
    bumpScale: 0.01,
    color: 0xb0a08c,
    roughness: 0.94,
    metalness: 0.0,
    envMapIntensity: 0.1,
    name: 'brick-sill',
  });

  const floorWood = std({
    map: textures.floorWood,
    bumpMap: textures.floorWood,
    bumpScale: 0.012,
    color: 0xd9bb99,
    roughness: 0.52,
    metalness: 0.02,
    envMapIntensity: 0.35,
    name: 'oiled-wood-floor',
  });

  const floorInlay = std({
    map: textures.wood,
    color: 0x4d3220,
    roughness: 0.46,
    metalness: 0.04,
    envMapIntensity: 0.36,
    name: 'floor-inlay-walnut',
  });

  const ceilingWood = std({
    map: textures.ceilingWood,
    bumpMap: textures.ceilingWood,
    bumpScale: 0.01,
    color: 0xffffff,
    roughness: 0.86,
    metalness: 0.0,
    envMapIntensity: 0.14,
    name: 'plank-ceiling',
  });

  const beamWood = std({
    map: textures.wood,
    bumpMap: textures.wood,
    bumpScale: 0.006,
    color: 0x805531,
    roughness: 0.78,
    metalness: 0.0,
    envMapIntensity: 0.24,
    name: 'ceiling-beam',
  });

  const trimWood = std({
    map: textures.wood,
    color: 0x6a4830,
    roughness: 0.7,
    metalness: 0.0,
    envMapIntensity: 0.22,
    name: 'trim-walnut',
  });

  const skirting = std({
    map: textures.wood,
    color: 0x4a2f1d,
    roughness: 0.72,
    metalness: 0.0,
    envMapIntensity: 0.2,
    name: 'skirting-walnut',
  });

  /* --- 家具木料 ---------------------------------------------------- */

  const shelfWood = std({
    map: textures.wood,
    bumpMap: textures.wood,
    bumpScale: 0.004,
    color: 0x7d5432,
    roughness: 0.6,
    metalness: 0.0,
    envMapIntensity: 0.34,
    name: 'dark-rosewood-shelf',
  });

  const shelfBack = std({
    map: textures.wood,
    color: 0x543724,
    roughness: 0.82,
    metalness: 0.0,
    envMapIntensity: 0.2,
    name: 'shelf-back-panel',
  });

  const tableWood = std({
    map: textures.wood,
    bumpMap: textures.wood,
    bumpScale: 0.003,
    color: 0x8a5c36,
    roughness: 0.5,
    metalness: 0.0,
    envMapIntensity: 0.34,
    name: 'reading-table-oak',
  });

  const chairWood = std({
    map: textures.wood,
    bumpMap: textures.wood,
    bumpScale: 0.003,
    color: 0xa3754c,
    roughness: 0.54,
    metalness: 0.0,
    envMapIntensity: 0.34,
    name: 'chair-oak',
  });

  const ladderWood = std({
    map: textures.wood,
    color: 0x9c7048,
    roughness: 0.62,
    metalness: 0.0,
    envMapIntensity: 0.26,
    name: 'stepladder-oak',
  });

  const frameWood = std({
    map: textures.wood,
    color: 0x4b311c,
    roughness: 0.58,
    metalness: 0.0,
    envMapIntensity: 0.3,
    name: 'picture-frame-walnut',
  });

  /* --- 金属与玻璃 -------------------------------------------------- */

  const brass = std({
    color: 0xa9864c,
    roughness: 0.28,
    metalness: 0.92,
    envMapIntensity: 1.15,
    name: 'aged-brass',
  });

  const brassDark = std({
    color: 0x745a32,
    roughness: 0.42,
    metalness: 0.85,
    envMapIntensity: 0.9,
    name: 'tarnished-brass',
  });

  const ironBlack = std({
    color: 0x2b2824,
    roughness: 0.64,
    metalness: 0.55,
    envMapIntensity: 0.5,
    name: 'blackened-iron',
  });

  const steelDark = std({
    color: 0x4c4a44,
    roughness: 0.5,
    metalness: 0.65,
    envMapIntensity: 0.65,
    name: 'dark-steel',
  });

  const greenGlass = std({
    color: 0x2f6b4c,
    emissive: new THREE.Color(0x1f5c3a),
    emissiveIntensity: 0.5,
    roughness: 0.14,
    metalness: 0.06,
    transparent: true,
    opacity: 0.62,
    side: THREE.DoubleSide,
    envMapIntensity: 1.2,
    depthWrite: false,
    name: 'green-banker-glass',
  });

  /* --- 书 ---------------------------------------------------------- */

  const bookCloth = (color, name) =>
    std({
      map: textures.bookCloth,
      color,
      roughness: 0.86,
      metalness: 0.0,
      envMapIntensity: 0.12,
      name,
    });

  const book1 = bookCloth(0x8d3a33, 'book-oxblood');
  const book2 = bookCloth(0x38573d, 'book-forest');
  const book3 = bookCloth(0x334568, 'book-navy');
  const book4 = bookCloth(0xb58434, 'book-ochre');
  const book5 = bookCloth(0x6b4529, 'book-brown');
  const book6 = bookCloth(0xd3c09a, 'book-cream');
  const book7 = bookCloth(0x6b394f, 'book-plum');
  const book8 = bookCloth(0x737a46, 'book-olive');
  const book9 = bookCloth(0x41555a, 'book-slate');

  const bookPages = std({
    map: textures.paper,
    color: 0xdccdaa,
    roughness: 0.92,
    metalness: 0.0,
    envMapIntensity: 0.12,
    name: 'book-page-edges',
  });

  const goldFoil = std({
    color: 0xb08a3e,
    roughness: 0.38,
    metalness: 0.8,
    envMapIntensity: 0.9,
    name: 'book-gold-foil',
  });

  const paper = std({
    map: textures.paper,
    color: 0xefe5cf,
    roughness: 0.9,
    metalness: 0.0,
    envMapIntensity: 0.14,
    side: THREE.DoubleSide,
    name: 'reading-paper',
  });

  const parchment = std({
    map: textures.paper,
    color: 0xdcc9a2,
    roughness: 0.88,
    metalness: 0.0,
    envMapIntensity: 0.14,
    side: THREE.DoubleSide,
    name: 'aged-parchment',
  });

  /* --- 墙面浮雕 ---------------------------------------------------- */

  const mapLand = std({ color: 0x8b9770, roughness: 0.88, metalness: 0.0, envMapIntensity: 0.12, name: 'map-land' });
  const mapLandDark = std({ color: 0x6b7854, roughness: 0.9, metalness: 0.0, envMapIntensity: 0.1, name: 'map-land-dark' });
  const mapOchre = std({ color: 0xb09a68, roughness: 0.9, metalness: 0.0, envMapIntensity: 0.1, name: 'map-desert' });
  const mapInk = std({ color: 0x5a4830, roughness: 0.85, metalness: 0.0, envMapIntensity: 0.08, name: 'map-ink' });
  const matBoard = std({ color: 0xd8ceb8, roughness: 0.92, metalness: 0.0, envMapIntensity: 0.1, name: 'mat-board' });
  const landscapeSky = std({ color: 0xd3c6a8, roughness: 0.92, metalness: 0.0, envMapIntensity: 0.1, name: 'landscape-sky' });
  const landscapeFar = std({ color: 0x8f8b70, roughness: 0.92, metalness: 0.0, envMapIntensity: 0.1, name: 'landscape-far-hills' });
  const landscapeHill = std({ color: 0x757a58, roughness: 0.92, metalness: 0.0, envMapIntensity: 0.1, name: 'landscape-hills' });
  const landscapeSun = std({ color: 0xd2ab6a, roughness: 0.9, metalness: 0.0, envMapIntensity: 0.1, name: 'landscape-sun' });
  const landscapeTree = std({ color: 0x4d5940, roughness: 0.95, metalness: 0.0, envMapIntensity: 0.08, name: 'landscape-trees' });

  /* --- 软装 -------------------------------------------------------- */

  const cushionGreen = std({
    map: textures.cloth,
    bumpMap: textures.cloth,
    bumpScale: 0.003,
    color: 0x5d6b50,
    roughness: 1.0,
    metalness: 0.0,
    envMapIntensity: 0.14,
    name: 'green-velvet-cushion',
  });

  const cushionCream = std({
    map: textures.cloth,
    bumpMap: textures.cloth,
    bumpScale: 0.003,
    color: 0xcbb996,
    roughness: 1.0,
    metalness: 0.0,
    envMapIntensity: 0.14,
    name: 'cream-cushion',
  });

  const cushionOxblood = std({
    map: textures.cloth,
    bumpMap: textures.cloth,
    bumpScale: 0.003,
    color: 0x7d443c,
    roughness: 1.0,
    metalness: 0.0,
    envMapIntensity: 0.14,
    name: 'oxblood-cushion',
  });

  /* --- 地球仪 ------------------------------------------------------ */

  const globeSea = std({
    map: textures.paper,
    color: 0xd8c8a2,
    roughness: 0.42,
    metalness: 0.06,
    envMapIntensity: 0.55,
    name: 'globe-parchment-sea',
  });
  const globeSurface = std({
    vertexColors: true,
    roughness: 0.46,
    metalness: 0.06,
    envMapIntensity: 0.5,
    name: 'globe-land-sea',
  });
  const globeLand = std({ color: 0x7d8a63, roughness: 0.72, metalness: 0.02, envMapIntensity: 0.2, name: 'globe-land' });
  const globeLandDark = std({ color: 0x66724f, roughness: 0.74, metalness: 0.02, envMapIntensity: 0.18, name: 'globe-land-dark' });
  const globeLandDry = std({ color: 0x9a8c60, roughness: 0.74, metalness: 0.02, envMapIntensity: 0.18, name: 'globe-land-dry' });

  /* --- 监控 CRT ---------------------------------------------------- */

  const crtBeige = std({
    color: 0x8b8370,
    roughness: 0.66,
    metalness: 0.05,
    envMapIntensity: 0.32,
    name: 'crt-enclosure',
  });
  const crtShade = std({
    color: 0x625d51,
    roughness: 0.72,
    metalness: 0.05,
    envMapIntensity: 0.26,
    name: 'crt-enclosure-shade',
  });
  const crtBlack = std({
    color: 0x1e1c18,
    roughness: 0.62,
    metalness: 0.1,
    envMapIntensity: 0.3,
    name: 'crt-black-plastic',
  });

  /* --- 门 ---------------------------------------------------------- */

  const doorOak = std({
    map: textures.wood,
    bumpMap: textures.wood,
    bumpScale: 0.004,
    color: 0xb87f4c,
    roughness: 0.5,
    metalness: 0.0,
    envMapIntensity: 0.42,
    name: 'oak-door-leaf',
  });
  const doorInset = std({
    map: textures.wood,
    color: 0x9a6638,
    roughness: 0.56,
    metalness: 0.0,
    envMapIntensity: 0.34,
    name: 'oak-door-panel',
  });

  /* --- 封窗木板 ---------------------------------------------------- */

  const boardA = std({
    map: textures.rawPlank,
    bumpMap: textures.rawPlank,
    bumpScale: 0.009,
    color: 0xe2d9c8,
    roughness: 0.97,
    metalness: 0.0,
    envMapIntensity: 0.08,
    name: 'window-board-a',
  });
  const boardB = std({
    map: textures.rawPlank,
    bumpMap: textures.rawPlank,
    bumpScale: 0.009,
    color: 0xcdc2af,
    roughness: 0.98,
    metalness: 0.0,
    envMapIntensity: 0.07,
    name: 'window-board-b',
  });
  const boardC = std({
    map: textures.rawPlank,
    bumpMap: textures.rawPlank,
    bumpScale: 0.009,
    color: 0xf0e9da,
    roughness: 0.97,
    metalness: 0.0,
    envMapIntensity: 0.08,
    name: 'window-board-c',
  });
  const boardNail = std({
    color: 0x2e2923,
    roughness: 0.55,
    metalness: 0.5,
    envMapIntensity: 0.5,
    name: 'window-board-nail',
  });
  const windowCavity = std({
    color: 0x0a0c0b,
    roughness: 0.99,
    metalness: 0.0,
    envMapIntensity: 0.02,
    name: 'sealed-window-cavity',
  });
  const seamLight = basic({
    color: 0x8ea3a6,
    transparent: true,
    opacity: 0.05,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    side: THREE.DoubleSide,
    name: 'boarded-window-seam',
  });

  /* --- 发光体 ------------------------------------------------------ */

  const bulb = basic({ color: 0xffdfab, toneMapped: false, name: 'pendant-bulb' });
  const lampBulb = basic({ color: 0xfff0c8, toneMapped: false, name: 'banker-bulb' });
  const cctvScreen = basic({ map: textures.cctv, color: 0xffffff, toneMapped: false, name: 'cctv-screen' });
  const ledRed = basic({ color: 0xff3b26, toneMapped: false, name: 'recording-led' });
  const ledGreen = basic({ color: 0x8fffa8, toneMapped: false, name: 'power-led' });
  const warmGlow = basic({
    map: textures.glow,
    color: 0xffd9a0,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    name: 'warm-glow',
  });
  const lampGlow = basic({
    map: textures.greenGlow,
    color: 0xbdf0c4,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    name: 'green-lamp-glow',
  });
  const shadeInner = std({
    color: 0xe8b47a,
    emissive: new THREE.Color(0xffb066),
    emissiveIntensity: 0.4,
    roughness: 0.68,
    metalness: 0.04,
    side: THREE.BackSide,
    envMapIntensity: 0.24,
    name: 'pendant-shade-inner',
  });
  const switchPlate = std({ color: 0xd9d1bf, roughness: 0.5, metalness: 0.06, envMapIntensity: 0.4, name: 'switch-plate' });
  const switchNub = std({ color: 0xefe9d8, roughness: 0.42, metalness: 0.05, envMapIntensity: 0.4, name: 'switch-nub' });
  const cord = std({ color: 0x1d1a16, roughness: 0.92, metalness: 0.0, envMapIntensity: 0.08, name: 'lamp-cord' });

  return {
    brickWall,
    brickDeep,
    brickSill,
    floorWood,
    floorInlay,
    ceilingWood,
    beamWood,
    trimWood,
    skirting,
    shelfWood,
    shelfBack,
    tableWood,
    chairWood,
    ladderWood,
    frameWood,
    brass,
    brassDark,
    ironBlack,
    steelDark,
    greenGlass,
    book1,
    book2,
    book3,
    book4,
    book5,
    book6,
    book7,
    book8,
    book9,
    bookPages,
    goldFoil,
    paper,
    parchment,
    mapLand,
    mapLandDark,
    mapOchre,
    mapInk,
    matBoard,
    landscapeSky,
    landscapeFar,
    landscapeHill,
    landscapeSun,
    landscapeTree,
    cushionGreen,
    cushionCream,
    cushionOxblood,
    globeSea,
    globeSurface,
    globeLand,
    globeLandDark,
    globeLandDry,
    crtBeige,
    crtShade,
    crtBlack,
    doorOak,
    doorInset,
    boardA,
    boardB,
    boardC,
    boardNail,
    windowCavity,
    seamLight,
    bulb,
    lampBulb,
    cctvScreen,
    ledRed,
    ledGreen,
    warmGlow,
    lampGlow,
    shadeInner,
    switchPlate,
    switchNub,
    cord,
  };
}




