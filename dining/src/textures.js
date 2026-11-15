import * as THREE from 'three';
import { mulberry32 } from './utils.js';

/* ------------------------------------------------------------------ *
 * Procedural material maps.
 *
 * No bitmaps are shipped or drawn as artwork: every map below is a
 * tileable material surface (plaster, stone, timber grain, gingham,
 * linen). Canvas-generated, no network requests.
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

function addGrain(ctx, width, height, rng, amount = 10) {
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

function softVein(ctx, rng, width, height, color, alpha) {
  const points = 4 + Math.floor(rng() * 3);
  const x0 = rng() * width;
  const y0 = rng() * height;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  for (let i = 0; i < points; i += 1) {
    const nx = x0 + (rng() - 0.5) * width * 0.9;
    const ny = y0 + (rng() - 0.5) * height * 0.9;
    ctx.quadraticCurveTo(
      nx + (rng() - 0.5) * 90,
      ny + (rng() - 0.5) * 90,
      nx,
      ny,
    );
  }
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 0.6 + rng() * 1.6;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function plasterCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f2ece1';
  ctx.fillRect(0, 0, size, size);

  // Broad trowel clouds: very low alpha, large radii.
  for (let i = 0; i < 90; i += 1) {
    const radius = 40 + rng() * 150;
    const gradient = ctx.createRadialGradient(
      rng() * size,
      rng() * size,
      0,
      rng() * size,
      rng() * size,
      radius,
    );
    const light = rng() > 0.45;
    gradient.addColorStop(0, light ? 'rgba(255,250,238,0.055)' : 'rgba(196,182,161,0.05)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  // Fine aggregate.
  for (let i = 0; i < 2600; i += 1) {
    const light = rng() > 0.5;
    ctx.fillStyle = light ? 'rgba(255,252,245,0.18)' : 'rgba(150,136,116,0.12)';
    const radius = 0.4 + rng() * 1.1;
    ctx.beginPath();
    ctx.arc(rng() * size, rng() * size, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  addGrain(ctx, size, size, rng, 5);
  return canvas;
}

function stoneCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  const tile = size / 2; // 2 x 2 tiles per texture; texture spans 1.8 m

  for (let ty = 0; ty < 2; ty += 1) {
    for (let tx = 0; tx < 2; tx += 1) {
      const x = tx * tile;
      const y = ty * tile;
      const warm = 200 + Math.floor(rng() * 14);
      ctx.fillStyle = `rgb(${warm + 14}, ${warm + 6}, ${warm - 12})`;
      ctx.fillRect(x, y, tile, tile);

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, tile, tile);
      ctx.clip();
      for (let i = 0; i < 18; i += 1) {
        softVein(ctx, rng, tile, tile, i % 3 === 0 ? '#f6ecda' : '#a4977f', 0.06 + rng() * 0.05);
      }
      // Fine sediment speckle.
      for (let i = 0; i < 650; i += 1) {
        ctx.fillStyle = rng() > 0.5 ? 'rgba(250,242,227,0.22)' : 'rgba(120,108,90,0.14)';
        ctx.fillRect(x + rng() * tile, y + rng() * tile, 0.7 + rng() * 1.4, 0.7 + rng() * 1.4);
      }
      ctx.restore();
    }
  }

  // Honed-surface micro variation.
  addGrain(ctx, size, size, rng, 7);

  // Grout: dark, narrow, slightly softened.
  ctx.strokeStyle = 'rgba(96,84,68,0.68)';
  ctx.lineWidth = 3;
  for (let i = 0; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * tile, 0);
    ctx.lineTo(i * tile, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * tile);
    ctx.lineTo(size, i * tile);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,248,234,0.18)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * tile + 2, 0);
    ctx.lineTo(i * tile + 2, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * tile + 2);
    ctx.lineTo(size, i * tile + 2);
    ctx.stroke();
  }

  return canvas;
}

function woodCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#b59b7e';
  ctx.fillRect(0, 0, size, size);

  // Vertical cathedral grain.
  for (let i = 0; i < 150; i += 1) {
    const x = rng() * size;
    const width = 0.7 + rng() * 2.6;
    const alpha = 0.025 + rng() * 0.075;
    ctx.strokeStyle = rng() > 0.35 ? `rgba(96,72,48,${alpha})` : `rgba(240,228,210,${alpha})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    for (let y = 0; y <= size; y += 32) {
      ctx.lineTo(x + Math.sin(y * 0.018 + i) * (3 + rng() * 3), y);
    }
    ctx.stroke();
  }

  // A few restrained knots.
  for (let i = 0; i < 3; i += 1) {
    const x = rng() * size;
    const y = rng() * size;
    ctx.strokeStyle = 'rgba(90,66,42,0.13)';
    ctx.lineWidth = 1.4;
    for (let r = 2; r < 13; r += 3) {
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 2.1, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  addGrain(ctx, size, size, rng, 6);
  return canvas;
}

function clothCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  const cell = size / 4; // 4 x 4 checks per tile
  ctx.fillStyle = '#f6edda';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#7e8a68';
  for (let y = 0; y < 4; y += 1) {
    for (let x = 0; x < 4; x += 1) {
      if ((x + y) % 2 === 0) ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }

  // Woven thread structure.
  for (let i = 0; i < size; i += 2) {
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(0, i, size, 1);
    ctx.fillStyle = 'rgba(48,40,28,0.05)';
    ctx.fillRect(i, 0, 1, size);
  }
  addGrain(ctx, size, size, rng, 4);
  return canvas;
}

function linenCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#eee4d0';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < size; i += 2) {
    ctx.fillStyle = 'rgba(255,252,242,0.16)';
    ctx.fillRect(0, i, size, 1);
    ctx.fillStyle = 'rgba(120,101,74,0.055)';
    ctx.fillRect(i, 0, 1, size);
  }
  for (let i = 0; i < 90; i += 1) {
    ctx.fillStyle = 'rgba(150,128,98,0.05)';
    ctx.fillRect(rng() * size, rng() * size, 1 + rng() * 2, 10 + rng() * 40);
  }
  addGrain(ctx, size, size, rng, 4);
  return canvas;
}

function contactShadowCanvas(size) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, 'rgba(20,13,8,0.55)');
  gradient.addColorStop(0.42, 'rgba(20,13,8,0.34)');
  gradient.addColorStop(0.74, 'rgba(20,13,8,0.12)');
  gradient.addColorStop(1, 'rgba(20,13,8,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

function glowCanvas(size) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, 'rgba(255,250,236,0.95)');
  gradient.addColorStop(0.22, 'rgba(255,246,226,0.58)');
  gradient.addColorStop(0.55, 'rgba(255,240,210,0.2)');
  gradient.addColorStop(1, 'rgba(255,236,200,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

function ceilingCanvas(size) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size * 0.5, size * 0.5, 10, size * 0.5, size * 0.5, size * 0.72);
  gradient.addColorStop(0, '#fdfaf3');
  gradient.addColorStop(0.55, '#f7f2e7');
  gradient.addColorStop(1, '#ece5d7');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  // Faint plaster texture so the unlit ceiling still has some tooth.
  const rng = mulberry32(0x0ce111);
  for (let i = 0; i < 1500; i += 1) {
    ctx.fillStyle = rng() > 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(150,138,118,0.03)';
    ctx.fillRect(rng() * size, rng() * size, 1 + rng() * 2, 1 + rng() * 2);
  }
  return canvas;
}

function environmentCanvas() {  const width = 512;
  const height = 256;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#fff8ea');
  sky.addColorStop(0.32, '#efe4cf');
  sky.addColorStop(0.62, '#cdbfa8');
  sky.addColorStop(1, '#574430');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // Ceiling wash: three soft warm bands, enough for believable brass and
  // ceramic highlights without an HDR file.
  const bands = [0.18, 0.5, 0.82];
  bands.forEach((u) => {
    const x = width * u;
    const glow = ctx.createRadialGradient(x, height * 0.06, 2, x, height * 0.06, width * 0.22);
    glow.addColorStop(0, 'rgba(255,250,236,0.95)');
    glow.addColorStop(0.35, 'rgba(255,243,220,0.32)');
    glow.addColorStop(1, 'rgba(255,240,214,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height * 0.55);
  });

  // Faint vertical breaks read as wall bays, not as objects.
  ctx.fillStyle = 'rgba(90,70,48,0.08)';
  [0.08, 0.34, 0.66, 0.92].forEach((u) => {
    ctx.fillRect(width * u, height * 0.25, 4, height * 0.5);
  });
  return canvas;
}

export function createTextureSet(maxAnisotropy = 8) {
  const rng = mulberry32(0x51f0c3);
  const anisotropy = Math.min(8, maxAnisotropy || 8);

  const plaster = makeTexture(plasterCanvas(512, rng), { anisotropy });
  plaster.repeat.set(1, 1);

  const stone = makeTexture(stoneCanvas(1024, rng), { anisotropy });
  stone.repeat.set(1, 1);

  const wood = makeTexture(woodCanvas(512, rng), { anisotropy });
  wood.repeat.set(1, 1);

  const clothCanvasBase = clothCanvas(512, rng);
  const clothTop = makeTexture(clothCanvasBase, { anisotropy });
  clothTop.repeat.set(9.3, 5.3);
  const clothLong = makeTexture(clothCanvasBase, { anisotropy });
  clothLong.repeat.set(9.3, 1.6);
  const clothShort = makeTexture(clothCanvasBase, { anisotropy });
  clothShort.repeat.set(5.3, 1.6);

  const linen = makeTexture(linenCanvas(256, rng), { anisotropy });
  linen.repeat.set(1.6, 1.2);

  const ceiling = makeTexture(ceilingCanvas(512), { anisotropy });
  ceiling.repeat.set(1, 1);

  const contactShadow = new THREE.CanvasTexture(contactShadowCanvas(128));
  contactShadow.colorSpace = THREE.NoColorSpace;
  contactShadow.needsUpdate = true;

  const glow = new THREE.CanvasTexture(glowCanvas(256));
  glow.colorSpace = THREE.SRGBColorSpace;
  glow.needsUpdate = true;

  const environment = new THREE.CanvasTexture(environmentCanvas());
  environment.mapping = THREE.EquirectangularReflectionMapping;
  environment.colorSpace = THREE.SRGBColorSpace;
  environment.needsUpdate = true;

  return {
    plaster,
    stone,
    wood,
    clothTop,
    clothLong,
    clothShort,
    linen,
    ceiling,
    contactShadow,
    glow,
    environment,
  };
}
