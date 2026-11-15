import * as THREE from 'three';
import { mulberry32 } from './geometry.js';

/* ------------------------------------------------------------------ *
 * Procedural kitchen surfaces.
 *
 * Every map is generated in-browser: glazed wall tile, anti-slip quarry
 * tile, aluminium lay-in panels, brushed stainless, galvanised duct,
 * warm corridor plaster, dark vestibule joinery, a cool reflection
 * environment and two abstract CRT surveillance feeds. No bitmaps, no
 * network requests, no readable text.
 * ------------------------------------------------------------------ */

function createCanvas(width, height = width) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function makeTexture(canvas, { repeat = 1, srgb = true, anisotropy = 4, wrap = true } = {}) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = wrap ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  texture.wrapT = wrap ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
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

/* --- Glazed white wall tile: 4 × 4 tiles per 1.2 m map ------------ */

function wallTileCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  const count = 4;
  const tile = size / count;
  ctx.fillStyle = '#8e9698';
  ctx.fillRect(0, 0, size, size);

  for (let ty = 0; ty < count; ty += 1) {
    for (let tx = 0; tx < count; tx += 1) {
      const x = tx * tile + 2;
      const y = ty * tile + 2;
      const w = tile - 4;
      const h = tile - 4;
      const tint = 240 + Math.floor(rng() * 8);
      ctx.fillStyle = `rgb(${tint}, ${tint + 2}, ${tint + 1})`;
      ctx.fillRect(x, y, w, h);

      // A glaze gradient: brighter at the top-left, cooler at the base.
      const glaze = ctx.createLinearGradient(x, y, x + w, y + h);
      glaze.addColorStop(0, 'rgba(255,255,255,0.32)');
      glaze.addColorStop(0.45, 'rgba(255,255,255,0.04)');
      glaze.addColorStop(1, 'rgba(165,181,185,0.12)');
      ctx.fillStyle = glaze;
      ctx.fillRect(x, y, w, h);

      // Cushioned edge highlight.
      ctx.strokeStyle = 'rgba(255,255,255,0.38)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x + 1, y + h - 1);
      ctx.lineTo(x + 1, y + 1);
      ctx.lineTo(x + w - 1, y + 1);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(122,138,142,0.24)';
      ctx.beginPath();
      ctx.moveTo(x + 1, y + h - 1);
      ctx.lineTo(x + w - 1, y + h - 1);
      ctx.lineTo(x + w - 1, y + 1);
      ctx.stroke();

      // Fine craze / cleaning marks.
      for (let i = 0; i < 5; i += 1) {
        ctx.strokeStyle = `rgba(140,155,158,${0.02 + rng() * 0.03})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        const sx = x + rng() * w;
        const sy = y + rng() * h;
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + (rng() - 0.5) * 26, sy + (rng() - 0.5) * 18);
        ctx.stroke();
      }
    }
  }
  addGrain(ctx, size, size, rng, 4);
  return canvas;
}

/* --- Anti-slip quarry floor: 300 mm tiles ------------------------- */

function floorTileCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  const count = 4;
  const tile = size / count;
  ctx.fillStyle = '#5d686b';
  ctx.fillRect(0, 0, size, size);

  for (let ty = 0; ty < count; ty += 1) {
    for (let tx = 0; tx < count; tx += 1) {
      const x = tx * tile + 2;
      const y = ty * tile + 2;
      const w = tile - 4;
      const h = tile - 4;
      const shade = 84 + Math.floor(rng() * 13);
      ctx.fillStyle = `rgb(${shade}, ${shade + 7}, ${shade + 9})`;
      ctx.fillRect(x, y, w, h);

      // Slightly mottled clay body.
      for (let i = 0; i < 30; i += 1) {
        ctx.fillStyle = rng() > 0.5 ? 'rgba(210,222,224,0.035)' : 'rgba(26,35,38,0.05)';
        ctx.beginPath();
        ctx.arc(x + rng() * w, y + rng() * h, 1 + rng() * 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Anti-slip studs in a 6 × 6 grid.
      for (let sy = 0; sy < 6; sy += 1) {
        for (let sx = 0; sx < 6; sx += 1) {
          const px = x + (sx + 0.5) * (w / 6);
          const py = y + (sy + 0.5) * (h / 6);
          ctx.fillStyle = 'rgba(38,48,51,0.22)';
          ctx.beginPath();
          ctx.arc(px, py + 0.7, 1.7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(226,236,238,0.14)';
          ctx.beginPath();
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.strokeStyle = 'rgba(225,235,236,0.11)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    }
  }
  addGrain(ctx, size, size, rng, 7);
  return canvas;
}

/* --- 600 × 600 aluminium lay-in ceiling -------------------------- */

function ceilingCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  const count = 2;
  const panel = size / count;
  ctx.fillStyle = '#aab2b5';
  ctx.fillRect(0, 0, size, size);

  for (let ty = 0; ty < count; ty += 1) {
    for (let tx = 0; tx < count; tx += 1) {
      const x = tx * panel + 4;
      const y = ty * panel + 4;
      const w = panel - 8;
      const h = panel - 8;
      const base = ctx.createLinearGradient(x, y, x + w, y + h);
      base.addColorStop(0, '#edf1f2');
      base.addColorStop(0.5, '#dfe4e6');
      base.addColorStop(1, '#d7dcde');
      ctx.fillStyle = base;
      ctx.fillRect(x, y, w, h);

      // Brushed aluminium striations.
      for (let i = 0; i < 140; i += 1) {
        const yy = y + rng() * h;
        ctx.strokeStyle = rng() > 0.5 ? 'rgba(255,255,255,0.055)' : 'rgba(80,90,94,0.045)';
        ctx.lineWidth = 0.5 + rng();
        ctx.beginPath();
        ctx.moveTo(x, yy);
        ctx.lineTo(x + w, yy + (rng() - 0.5) * 2);
        ctx.stroke();
      }

      // Perforation hint along the panel edge.
      for (let i = 0; i < 14; i += 1) {
        ctx.fillStyle = 'rgba(78,88,92,0.13)';
        ctx.beginPath();
        ctx.arc(x + 8 + (i / 13) * (w - 16), y + h - 7, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.42)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    }
  }
  addGrain(ctx, size, size, rng, 4);
  return canvas;
}

/* --- Brushed stainless ------------------------------------------- */

function steelCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  const base = ctx.createLinearGradient(0, 0, 0, size);
  base.addColorStop(0, '#d3d9dc');
  base.addColorStop(0.45, '#bfc6c9');
  base.addColorStop(1, '#ccd2d5');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 3000; i += 1) {
    const y = rng() * size;
    const length = 8 + rng() * 150;
    const x = rng() * size;
    ctx.strokeStyle = rng() > 0.5
      ? `rgba(255,255,255,${0.02 + rng() * 0.07})`
      : `rgba(63,74,78,${0.015 + rng() * 0.045})`;
    ctx.lineWidth = 0.5 + rng() * 1.1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(Math.min(size, x + length), y + (rng() - 0.5) * 0.8);
    ctx.stroke();
  }

  // Faint long polishing streaks.
  for (let i = 0; i < 40; i += 1) {
    const y = rng() * size;
    ctx.strokeStyle = rng() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(80,92,96,0.035)';
    ctx.lineWidth = 1.5 + rng() * 4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (rng() - 0.5) * 3);
    ctx.stroke();
  }
  addGrain(ctx, size, size, rng, 4);
  return canvas;
}

/* --- Galvanised duct with crystalline spangle -------------------- */

function galvanizedCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#b4bbbe';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 120; i += 1) {
    const cx = rng() * size;
    const cy = rng() * size;
    const r = 8 + rng() * 34;
    const points = 5 + Math.floor(rng() * 4);
    ctx.beginPath();
    for (let p = 0; p < points; p += 1) {
      const angle = (p / points) * Math.PI * 2;
      const radius = r * (0.55 + rng() * 0.5);
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;
      if (p === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = rng() > 0.5 ? 'rgba(246,250,251,0.13)' : 'rgba(88,100,104,0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(230,238,240,0.08)';
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }

  for (let i = 0; i < 1200; i += 1) {
    ctx.fillStyle = rng() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(60,72,76,0.04)';
    ctx.fillRect(rng() * size, rng() * size, 1 + rng() * 2, 0.6);
  }
  addGrain(ctx, size, size, rng, 5);
  return canvas;
}

/* --- Vestibule finishes ------------------------------------------ */

function warmPlasterCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#eadfce';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 110; i += 1) {
    const radius = 30 + rng() * 120;
    const gradient = ctx.createRadialGradient(rng() * size, rng() * size, 0, rng() * size, rng() * size, radius);
    gradient.addColorStop(0, rng() > 0.45 ? 'rgba(255,250,240,0.06)' : 'rgba(174,155,130,0.05)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  for (let i = 0; i < 1800; i += 1) {
    ctx.fillStyle = rng() > 0.5 ? 'rgba(255,252,246,0.12)' : 'rgba(150,132,108,0.08)';
    ctx.beginPath();
    ctx.arc(rng() * size, rng() * size, 0.4 + rng(), 0, Math.PI * 2);
    ctx.fill();
  }
  addGrain(ctx, size, size, rng, 4);
  return canvas;
}

function darkWoodCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#705039';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 180; i += 1) {
    const x = rng() * size;
    const width = 0.7 + rng() * 2.6;
    ctx.strokeStyle = rng() > 0.4
      ? `rgba(52,34,22,${0.035 + rng() * 0.08})`
      : `rgba(212,181,146,${0.025 + rng() * 0.06})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    for (let y = 0; y <= size; y += 28) {
      ctx.lineTo(x + Math.sin(y * 0.014 + i) * (2 + rng() * 3), y);
    }
    ctx.stroke();
  }
  addGrain(ctx, size, size, rng, 5);
  return canvas;
}

/* --- Light / shadow helper maps ---------------------------------- */

function radialCanvas(size, stops) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  for (const [at, color] of stops) gradient.addColorStop(at, color);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

function environmentCanvas() {
  const width = 512;
  const height = 256;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#ffffff');
  sky.addColorStop(0.18, '#eaf4fb');
  sky.addColorStop(0.46, '#c8d5dc');
  sky.addColorStop(0.72, '#98a5ac');
  sky.addColorStop(1, '#5a666c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // Cool ceiling panels act as long strip lights in the reflections.
  for (const x of [0.16, 0.42, 0.7, 0.92]) {
    const glow = ctx.createRadialGradient(width * x, 20, 2, width * x, 20, 70);
    glow.addColorStop(0, 'rgba(255,255,255,0.95)');
    glow.addColorStop(0.3, 'rgba(232,245,255,0.5)');
    glow.addColorStop(1, 'rgba(232,245,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, 110);
  }

  // Vertical dark bays keep stainless from reading as a flat mirror.
  for (const x of [0.08, 0.34, 0.62, 0.88]) {
    ctx.fillStyle = 'rgba(35,45,50,0.2)';
    ctx.fillRect(width * x, height * 0.18, 10, height * 0.55);
  }

  // A faint warm strip at eye level hints at the pass-through corridor.
  const warm = ctx.createLinearGradient(0, height * 0.42, 0, height * 0.52);
  warm.addColorStop(0, 'rgba(255,196,128,0)');
  warm.addColorStop(0.5, 'rgba(255,196,128,0.2)');
  warm.addColorStop(1, 'rgba(255,196,128,0)');
  ctx.fillStyle = warm;
  ctx.fillRect(width * 0.02, height * 0.42, width * 0.22, height * 0.1);
  return canvas;
}

/* --- Abstract surveillance feeds --------------------------------- */

function drawScanlines(ctx, width, height, strength = 0.16) {
  for (let y = 0; y < height; y += 3) {
    ctx.fillStyle = `rgba(0, 0, 0, ${strength})`;
    ctx.fillRect(0, y, width, 1);
  }
  for (let y = 0; y < height; y += 11) {
    ctx.fillStyle = 'rgba(205,255,214,0.035)';
    ctx.fillRect(0, y, width, 1);
  }
}

function drawVignette(ctx, width, height) {
  const gradient = ctx.createRadialGradient(width / 2, height / 2, height * 0.18, width / 2, height / 2, height * 0.82);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.7, 'rgba(0,8,3,0.18)');
  gradient.addColorStop(1, 'rgba(0,5,2,0.62)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawKitchenView(ctx, x, y, width, height, rng, variant) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();

  // Room shell in phosphor grey-green.
  ctx.fillStyle = '#0b1a11';
  ctx.fillRect(x, y, width, height);
  const back = ctx.createLinearGradient(x, y, x, y + height);
  back.addColorStop(0, '#355144');
  back.addColorStop(0.55, '#182d22');
  back.addColorStop(1, '#0a1710');
  ctx.fillStyle = back;
  ctx.fillRect(x, y, width, height);

  ctx.filter = 'blur(4px)';
  // Ceiling panels.
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = 'rgba(190,232,199,0.22)';
    ctx.fillRect(x + width * (0.12 + i * 0.28), y + height * 0.05, width * 0.19, height * 0.06);
  }

  if (variant === 0) {
    // Central island and a hood silhouette.
    ctx.fillStyle = 'rgba(13, 25, 18, 0.92)';
    ctx.beginPath();
    ctx.moveTo(x + width * 0.22, y + height * 0.2);
    ctx.lineTo(x + width * 0.78, y + height * 0.2);
    ctx.lineTo(x + width * 0.68, y + height * 0.42);
    ctx.lineTo(x + width * 0.32, y + height * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(168,206,178,0.2)';
    ctx.fillRect(x + width * 0.16, y + height * 0.56, width * 0.68, height * 0.06);
    ctx.fillStyle = 'rgba(151,192,162,0.16)';
    ctx.fillRect(x + width * 0.16, y + height * 0.62, width * 0.68, height * 0.22);
    // Pots / bowls on the pass.
    for (let i = 0; i < 4; i += 1) {
      ctx.fillStyle = 'rgba(206,243,211,0.22)';
      ctx.beginPath();
      ctx.ellipse(x + width * (0.28 + i * 0.15), y + height * 0.58, width * 0.045, height * 0.022, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(225,255,231,0.18)';
    ctx.fillRect(x + width * 0.04, y + height * 0.3, width * 0.1, height * 0.44);
  } else {
    // Sink run, drainboards and a tall oven.
    ctx.fillStyle = 'rgba(172,214,181,0.17)';
    ctx.fillRect(x + width * 0.08, y + height * 0.5, width * 0.55, height * 0.12);
    ctx.fillStyle = 'rgba(7,18,11,0.7)';
    for (let i = 0; i < 3; i += 1) {
      ctx.fillRect(x + width * (0.14 + i * 0.16), y + height * 0.55, width * 0.11, height * 0.15);
    }
    ctx.fillStyle = 'rgba(14,27,19,0.94)';
    ctx.fillRect(x + width * 0.7, y + height * 0.22, width * 0.2, height * 0.5);
    ctx.fillStyle = 'rgba(210,250,217,0.18)';
    ctx.fillRect(x + width * 0.73, y + height * 0.28, width * 0.14, height * 0.22);
    ctx.fillStyle = 'rgba(198,241,205,0.18)';
    ctx.fillRect(x + width * 0.74, y + height * 0.56, width * 0.04, height * 0.28);
  }

  // Soft doorway glow.
  const glow = ctx.createRadialGradient(
    x + width * 0.84,
    y + height * 0.44,
    2,
    x + width * 0.84,
    y + height * 0.44,
    width * 0.3,
  );
  glow.addColorStop(0, 'rgba(194,240,203,0.2)');
  glow.addColorStop(1, 'rgba(194,240,203,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, width, height);
  ctx.filter = 'none';

  // Sensor noise and a slow horizontal roll bar.
  for (let i = 0; i < 1600; i += 1) {
    ctx.fillStyle = rng() > 0.5 ? 'rgba(210,255,218,0.045)' : 'rgba(0,0,0,0.09)';
    ctx.fillRect(x + rng() * width, y + rng() * height, 1 + rng() * 1.6, 1);
  }
  ctx.fillStyle = 'rgba(195,255,205,0.03)';
  ctx.fillRect(x, y + height * 0.52, width, height * 0.06);
  ctx.restore();
}

function cctvCanvas(width, height, split) {
  const rng = mulberry32(split ? 0x71c0de : 0x4b1e77);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#050b07';
  ctx.fillRect(0, 0, width, height);

  if (split) {
    drawKitchenView(ctx, 4, 4, width / 2 - 6, height - 8, rng, 0);
    drawKitchenView(ctx, width / 2 + 2, 4, width / 2 - 6, height - 8, rng, 1);
    ctx.fillStyle = 'rgba(175,225,183,0.4)';
    ctx.fillRect(width / 2 - 1, 0, 2, height);
    ctx.fillStyle = 'rgba(175,225,183,0.16)';
    ctx.fillRect(4, 4, width / 2 - 6, 1.5);
    ctx.fillRect(width / 2 + 2, 4, width / 2 - 6, 1.5);
  } else {
    drawKitchenView(ctx, 0, 0, width, height, rng, 0);
  }

  drawScanlines(ctx, width, height, split ? 0.14 : 0.18);
  drawVignette(ctx, width, height);
  return canvas;
}

function scanBandCanvas() {
  const canvas = createCanvas(64, 32);
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 32);
  gradient.addColorStop(0, 'rgba(225,255,230,0)');
  gradient.addColorStop(0.42, 'rgba(225,255,230,0.02)');
  gradient.addColorStop(0.5, 'rgba(225,255,230,0.55)');
  gradient.addColorStop(0.58, 'rgba(225,255,230,0.02)');
  gradient.addColorStop(1, 'rgba(225,255,230,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 32);
  return canvas;
}

export function createTextureSet(maxAnisotropy = 8) {
  const anisotropy = Math.min(8, maxAnisotropy || 8);
  const rng = mulberry32(0x4b17c0);

  const wallTile = makeTexture(wallTileCanvas(512, rng), { anisotropy });
  const floorTile = makeTexture(floorTileCanvas(512, rng), { anisotropy });
  const ceilingPanel = makeTexture(ceilingCanvas(512, rng), { anisotropy });
  const steel = makeTexture(steelCanvas(512, rng), { anisotropy });
  const galvanized = makeTexture(galvanizedCanvas(512, rng), { anisotropy });
  const warmPlaster = makeTexture(warmPlasterCanvas(512, rng), { anisotropy });
  const darkWood = makeTexture(darkWoodCanvas(512, rng), { anisotropy });

  const contactShadow = new THREE.CanvasTexture(
    radialCanvas(128, [
      [0, 'rgba(3, 8, 9, 0.52)'],
      [0.42, 'rgba(3, 8, 9, 0.3)'],
      [0.74, 'rgba(3, 8, 9, 0.1)'],
      [1, 'rgba(3, 8, 9, 0)'],
    ]),
  );
  contactShadow.colorSpace = THREE.NoColorSpace;
  contactShadow.needsUpdate = true;

  const glow = new THREE.CanvasTexture(
    radialCanvas(256, [
      [0, 'rgba(244, 251, 255, 0.92)'],
      [0.2, 'rgba(230, 246, 255, 0.5)'],
      [0.55, 'rgba(216, 240, 255, 0.16)'],
      [1, 'rgba(210, 238, 255, 0)'],
    ]),
  );
  glow.colorSpace = THREE.SRGBColorSpace;
  glow.needsUpdate = true;

  const environment = new THREE.CanvasTexture(environmentCanvas());
  environment.mapping = THREE.EquirectangularReflectionMapping;
  environment.colorSpace = THREE.SRGBColorSpace;
  environment.needsUpdate = true;

  const cctvWall = makeTexture(cctvCanvas(512, 384, false), {
    srgb: true,
    anisotropy,
    wrap: false,
  });
  const cctvSplit = makeTexture(cctvCanvas(512, 384, true), {
    srgb: true,
    anisotropy,
    wrap: false,
  });
  const scanBand = makeTexture(scanBandCanvas(), {
    srgb: false,
    anisotropy: 2,
    wrap: false,
  });

  return {
    wallTile,
    floorTile,
    ceilingPanel,
    steel,
    galvanized,
    warmPlaster,
    darkWood,
    contactShadow,
    glow,
    environment,
    cctvWall,
    cctvSplit,
    scanBand,
  };
}
