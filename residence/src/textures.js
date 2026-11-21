import * as THREE from 'three';
import { createTextureSet as createCorridorTextureSet } from '../../shared/textures.js';
import { mulberry32 } from '../../shared/utils.js';

/* ------------------------------------------------------------------ *
 * 住宿区 2F 贴图 = 走廊已有的黑色大理石 / 棕色墙纸 / 深胡桃 / 深钢 /
 * 黄铜 / 屏幕等，再补两张湿区瓷砖（白砖、薄荷砖）。
 * 全部为程序化 Canvas，无外部图片。
 * ------------------------------------------------------------------ */

function createCanvas(width, height = width) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function makeTexture(canvas, { repeat = 1, srgb = true, anisotropy = 4 } = {}) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.anisotropy = anisotropy;
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function addGrain(ctx, width, height, rng, amount = 6) {
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const delta = (rng() - 0.5) * amount;
    data[i] = Math.max(0, Math.min(255, data[i] + delta));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + delta));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + delta));
  }
  ctx.putImageData(image, 0, 0);
}

function tileCanvas(size, rng, { base, grout, accent, cols = 4, glossy = 0.12 } = {}) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = grout;
  ctx.fillRect(0, 0, size, size);

  const cell = size / cols;
  const gap = Math.max(1.4, size * 0.006);
  for (let row = 0; row < cols; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = col * cell + gap / 2;
      const y = row * cell + gap / 2;
      const w = cell - gap;
      const h = cell - gap;
      const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
      gradient.addColorStop(0, base);
      gradient.addColorStop(0.5, accent || base);
      gradient.addColorStop(1, base);
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = `rgba(255,255,255,${0.16 + glossy})`;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
      ctx.fillStyle = `rgba(255,255,255,${0.05 + glossy * 0.3})`;
      ctx.fillRect(x + w * 0.18, y + h * 0.12, w * 0.16, h * 0.04);
    }
  }

  for (let i = 0; i < 90; i += 1) {
    ctx.fillStyle = rng() > 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.03)';
    ctx.fillRect(rng() * size, rng() * size, 1 + rng() * 2, 1 + rng() * 2);
  }

  addGrain(ctx, size, size, rng, 3);
  return canvas;
}

export function createTextureSet(maxAnisotropy = 8) {
  const base = createCorridorTextureSet(maxAnisotropy);
  const rng = mulberry32(0x71c0de);
  const anisotropy = Math.min(8, maxAnisotropy || 8);

  const tileWhite = makeTexture(
    tileCanvas(256, rng, {
      base: '#e7e5dd',
      grout: '#a9a9a2',
      accent: '#f6f4ec',
      cols: 4,
      glossy: 0.1,
    }),
    { anisotropy },
  );

  const tileMint = makeTexture(
    tileCanvas(256, rng, {
      base: '#b9d3c6',
      grout: '#8ba49a',
      accent: '#d3e6db',
      cols: 4,
      glossy: 0.16,
    }),
    { anisotropy },
  );

  return { ...base, tileWhite, tileMint };
}
