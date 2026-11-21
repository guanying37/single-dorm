import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 * 共享 PBR 调色板。
 *
 * 走廊的暗色基调：黑色大理石、棕色墙纸、近黑胡桃木、拉丝金属与
 * 黄铜。高饱和色只留给消防设备（暗红）与监控屏幕（青绿），合计
 * 不超过画面的 10%。材质只创建一次，所有构建器复用。
 * ------------------------------------------------------------------ */

export function createMaterials(textures) {
  const std = (options) => new THREE.MeshStandardMaterial(options);

  const wallpaper = std({
    map: textures.wallpaper,
    bumpMap: textures.wallpaper,
    bumpScale: 0.0022,
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0,
    envMapIntensity: 0.12,
    name: 'brown-damask-wallpaper',
  });

  const wallpaperDamp = std({
    map: textures.wallpaper,
    bumpMap: textures.wallpaper,
    bumpScale: 0.0024,
    color: 0xd8c8b8,
    roughness: 0.94,
    metalness: 0,
    envMapIntensity: 0.1,
    name: 'brown-wallpaper-damp',
  });

  const marble = std({
    map: textures.marble,
    bumpMap: textures.marble,
    bumpScale: 0.0016,
    color: 0xffffff,
    roughness: 0.16,
    metalness: 0.05,
    envMapIntensity: 1.15,
    name: 'black-marble-polished',
  });

  const marbleTrim = std({
    map: textures.marble,
    bumpMap: textures.marble,
    bumpScale: 0.0018,
    color: 0xc9c9c9,
    roughness: 0.3,
    metalness: 0.04,
    envMapIntensity: 0.8,
    name: 'black-marble-skirting',
  });

  // 楼梯踏步用无高光的 Lambert：深色石材在近距离斜视时不会因
  // 标准材质的掠射高光而整片泛白，同时仍能被顶灯与壁灯渐进照亮。
  const stoneDark = new THREE.MeshLambertMaterial({
    color: 0x2a2b2e,
    name: 'dark-stone-stair',
  });

  const wood = std({
    map: textures.wood,
    bumpMap: textures.wood,
    bumpScale: 0.0025,
    color: 0xb49476,
    roughness: 0.64,
    metalness: 0.02,
    envMapIntensity: 0.26,
    name: 'dark-walnut-door',
  });

  const woodDark = std({
    map: textures.wood,
    bumpMap: textures.wood,
    bumpScale: 0.0022,
    color: 0x6b5641,
    roughness: 0.6,
    metalness: 0.02,
    envMapIntensity: 0.2,
    name: 'near-black-walnut-frame',
  });

  const trim = std({
    color: 0x241b15,
    roughness: 0.56,
    metalness: 0.06,
    envMapIntensity: 0.25,
    name: 'blackened-trim',
  });

  const metal = std({
    color: 0x8d9195,
    roughness: 0.3,
    metalness: 0.86,
    envMapIntensity: 1.35,
    name: 'brushed-steel',
  });

  const metalDark = std({
    color: 0x35393c,
    roughness: 0.42,
    metalness: 0.76,
    envMapIntensity: 0.7,
    name: 'dark-steel',
  });

  const liftSteel = std({
    color: 0x9fa3a6,
    roughness: 0.32,
    metalness: 0.6,
    envMapIntensity: 1.9,
    name: 'lift-brushed-steel',
  });

  const brass = std({
    color: 0xb08a4f,
    roughness: 0.28,
    metalness: 0.9,
    envMapIntensity: 1.5,
    name: 'warm-brass',
  });

  const brassDark = std({
    color: 0x7d5e32,
    roughness: 0.4,
    metalness: 0.84,
    envMapIntensity: 1.0,
    name: 'aged-brass',
  });

  const black = std({
    color: 0x131313,
    roughness: 0.5,
    metalness: 0.2,
    envMapIntensity: 0.35,
    name: 'matte-black',
  });

  const rubber = std({
    color: 0x141414,
    roughness: 0.92,
    metalness: 0,
    envMapIntensity: 0.08,
    name: 'black-rubber',
  });

  const fireDoor = std({
    color: 0x3b443f,
    roughness: 0.54,
    metalness: 0.42,
    envMapIntensity: 0.45,
    name: 'painted-steel-fire-door',
  });

  const glass = std({
    color: 0x1d2422,
    roughness: 0.18,
    metalness: 0.2,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    envMapIntensity: 1.0,
    name: 'dark-vision-glass',
  });

  const frostedLit = std({
    color: 0x8a6a4a,
    emissive: new THREE.Color(0x6b3a16),
    emissiveIntensity: 0.15,
    roughness: 0.68,
    metalness: 0,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    envMapIntensity: 0.35,
    name: 'lit-frosted-lounge-glass',
  });

  const bezel = std({
    color: 0x1a1b1d,
    roughness: 0.4,
    metalness: 0.3,
    envMapIntensity: 0.5,
    name: 'monitor-bezel',
  });

  const screenA = new THREE.MeshBasicMaterial({
    map: textures.feedA,
    toneMapped: false,
    name: 'feed-a',
  });

  const screenB = new THREE.MeshBasicMaterial({
    map: textures.feedB,
    toneMapped: false,
    name: 'feed-b',
  });

  const screenStatic = new THREE.MeshBasicMaterial({
    map: textures.staticFeed,
    toneMapped: false,
    color: 0x707c78,
    name: 'feed-static',
  });

  const screenDark = new THREE.MeshBasicMaterial({
    map: textures.darkFeed,
    toneMapped: false,
    color: 0x4e5654,
    name: 'feed-dark',
  });

  const screenGlow = new THREE.MeshBasicMaterial({
    color: 0x9fe6d4,
    transparent: true,
    opacity: 0.06,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    name: 'screen-glow',
  });

  const red = std({
    color: 0x8f1f26,
    roughness: 0.46,
    metalness: 0.14,
    envMapIntensity: 0.55,
    name: 'signal-red',
  });

  const pipeRed = std({
    color: 0x5e161b,
    roughness: 0.52,
    metalness: 0.2,
    envMapIntensity: 0.4,
    name: 'sprinkler-pipe-red',
  });

  const paper = std({
    color: 0x8e8574,
    roughness: 0.94,
    metalness: 0,
    envMapIntensity: 0.05,
    name: 'blank-paper',
  });

  const card = std({
    color: 0xb3ac9d,
    roughness: 0.55,
    metalness: 0.03,
    envMapIntensity: 0.3,
    name: 'student-card',
  });

  const sensor = std({
    color: 0xd9d3c6,
    roughness: 0.7,
    metalness: 0.05,
    envMapIntensity: 0.3,
    name: 'sensor-plastic',
  });

  const ceiling = new THREE.MeshBasicMaterial({
    map: textures.ceiling,
    color: 0xb8afa4,
    name: 'ceiling-dark',
  });

  const ceilingChannel = new THREE.MeshBasicMaterial({
    color: 0x0d0c0b,
    name: 'light-channel',
  });

  const fixtureGlow = new THREE.MeshBasicMaterial({
    color: 0xffe2b0,
    toneMapped: false,
    transparent: true,
    opacity: 0.9,
    name: 'fixture-glow',
  });

  const fixtureFaulty = new THREE.MeshBasicMaterial({
    color: 0xffdfa8,
    toneMapped: false,
    transparent: true,
    opacity: 0.9,
    name: 'fixture-faulty',
  });

  const fixtureWarm = new THREE.MeshBasicMaterial({
    color: 0xffd9a6,
    toneMapped: false,
    name: 'fixture-emergency',
  });

  const fixtureDim = new THREE.MeshBasicMaterial({
    color: 0xc49258,
    toneMapped: false,
    transparent: true,
    opacity: 0.9,
    name: 'fixture-dim',
  });

  const fixtureDead = std({
    color: 0x3a332b,
    roughness: 0.7,
    metalness: 0.05,
    envMapIntensity: 0.3,
    name: 'fixture-dead',
  });

  const underGlow = new THREE.MeshBasicMaterial({
    color: 0x7a3f16,
    toneMapped: false,
    name: 'under-door-glow',
  });

  const warmPanel = new THREE.MeshBasicMaterial({
    color: 0x2e1a0b,
    name: 'lounge-backlight',
  });

  // 不可见拾取体：材质不进入渲染队列，但 Raycaster 仍能命中。
  const hit = new THREE.MeshBasicMaterial({ visible: false, name: 'invisible-hit' });

  const ledRed = std({
    color: 0x5f1412,
    emissive: new THREE.Color(0xff2f22),
    emissiveIntensity: 2.4,
    roughness: 0.4,
    metalness: 0,
    name: 'led-red',
  });

  const ledDead = std({
    color: 0x2a0e0c,
    roughness: 0.5,
    metalness: 0,
    envMapIntensity: 0.2,
    name: 'led-dead',
  });

  const ledAmber = new THREE.MeshBasicMaterial({
    color: 0xffb85c,
    toneMapped: false,
    name: 'led-amber',
  });

  const stain = new THREE.MeshBasicMaterial({
    map: textures.stain,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    toneMapped: false,
    color: 0x9c8878,
    name: 'wall-stain',
  });

  const warmGlow = new THREE.MeshBasicMaterial({
    map: textures.glow,
    color: 0xffc78a,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    name: 'warm-floor-glow',
  });

  const coolGlow = new THREE.MeshBasicMaterial({
    map: textures.glow,
    color: 0x86e6d2,
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    name: 'screen-floor-glow',
  });

  const contact = new THREE.MeshBasicMaterial({
    map: textures.contactShadow,
    transparent: true,
    opacity: 0.7,
    color: 0x000000,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    toneMapped: false,
    name: 'contact-shadow',
  });

  return {
    wallpaper,
    wallpaperDamp,
    marble,
    marbleTrim,
    stoneDark,
    wood,
    woodDark,
    trim,
    metal,
    metalDark,
    liftSteel,
    brass,
    brassDark,
    black,
    rubber,
    fireDoor,
    glass,
    frostedLit,
    bezel,
    screenA,
    screenB,
    screenStatic,
    screenDark,
    screenGlow,
    red,
    pipeRed,
    paper,
    card,
    sensor,
    ceiling,
    ceilingChannel,
    fixtureGlow,
    fixtureFaulty,
    fixtureWarm,
    fixtureDim,
    fixtureDead,
    underGlow,
    warmPanel,
    hit,
    ledRed,
    ledDead,
    ledAmber,
    stain,
    warmGlow,
    coolGlow,
    contact,
  };
}
