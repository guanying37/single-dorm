import * as THREE from 'three';
import { mulberry32 } from '../../dining/src/utils.js';

/* ------------------------------------------------------------------ *
 * Procedural storage-room surfaces.
 *
 * Raw concrete, old galvanised steel, rusty pipe, worn wood, kraft
 * board, jute sacking, faded cloth, rope, yellowed paper, chipped door
 * paint, a blank label, the louvre light comb and the reflection
 * environment. Everything is drawn in the browser: no bitmaps, no
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

function addGrain(ctx, width, height, rng, amount = 5) {
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

function blotches(ctx, width, height, rng, count, colors, minR, maxR, alpha) {
  for (let i = 0; i < count; i += 1) {
    const x = rng() * width;
    const y = rng() * height;
    const radius = minR + rng() * (maxR - minR);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const color = colors[Math.floor(rng() * colors.length)];
    gradient.addColorStop(0, `rgba(${color},${alpha * (0.5 + rng() * 0.5)})`);
    gradient.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
}

function crack(ctx, x, y, rng, length, color = 'rgba(54,50,44,0.5)', width = 1) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  let px = x;
  let py = y;
  const steps = 5 + Math.floor(rng() * 5);
  for (let i = 0; i < steps; i += 1) {
    px += (rng() - 0.5) * length * 0.5;
    py += length / steps;
    ctx.lineTo(px, py);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  // A hairline highlight on one side keeps cracks from reading as ink.
  ctx.beginPath();
  ctx.moveTo(x + 0.7, y);
  for (let i = 0; i < steps; i += 1) {
    ctx.lineTo(px + 0.7, py);
  }
  ctx.strokeStyle = 'rgba(236,230,218,0.22)';
  ctx.lineWidth = 0.7;
  ctx.stroke();
}

/* --- Raw board-formed concrete wall (one 2.4 m module) ------------- */

function wallConcreteCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#9e9a93';
  ctx.fillRect(0, 0, size, size);

  // Broad trowel clouds, slightly cooler than the light.
  blotches(ctx, size, size, rng, 38, ['104,101,95', '190,186,178', '137,133,126', '84,82,77', '118,116,107'], size * 0.07, size * 0.32, 0.12);

  // Smoothed cement sweeps.
  ctx.lineCap = 'round';
  for (let i = 0; i < 46; i += 1) {
    const x = rng() * size;
    const y = rng() * size;
    const w = size * (0.12 + rng() * 0.36);
    const h = size * (0.05 + rng() * 0.18);
    ctx.strokeStyle = rng() > 0.5 ? 'rgba(218,214,205,0.06)' : 'rgba(78,76,72,0.06)';
    ctx.lineWidth = 6 + rng() * 22;
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, rng() * Math.PI, 0, Math.PI * (0.8 + rng() * 0.8));
    ctx.stroke();
  }

  // Board-formed horizontals every 0.30 m and panel joints every 0.60 m.
  for (let i = 1; i < Math.round(size / 64); i += 1) {
    const y = i * 64;
    ctx.fillStyle = 'rgba(66,64,60,0.12)';
    ctx.fillRect(0, y, size, 1.3);
    ctx.fillStyle = 'rgba(224,220,211,0.1)';
    ctx.fillRect(0, y + 1.3, size, 0.9);
    // A little grout squeeze-out along some board joints.
    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(134,130,120,0.18)';
      ctx.fillRect(0, y + 2.2, size, 1.6);
    }
  }
  for (let i = 1; i < Math.round(size / 128); i += 1) {
    const x = i * 128;
    ctx.fillStyle = 'rgba(58,56,52,0.16)';
    ctx.fillRect(x, 0, 1.6, size);
    ctx.fillStyle = 'rgba(228,224,215,0.12)';
    ctx.fillRect(x + 1.6, 0, 1, size);
  }

  // Formwork tie holes with rust weeping below them.
  for (const x of [size * 0.25, size * 0.75]) {
    for (const y of [size * 0.25, size * 0.5, size * 0.75]) {
      ctx.fillStyle = 'rgba(42,40,36,0.42)';
      ctx.beginPath();
      ctx.arc(x, y, 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(118,84,52,0.35)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(x, y, 5.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(230,226,216,0.14)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(x - 1, y - 1, 4, Math.PI, Math.PI * 1.6);
      ctx.stroke();
      const weep = ctx.createLinearGradient(0, y + 4, 0, y + 34);
      weep.addColorStop(0, 'rgba(116,82,52,0.22)');
      weep.addColorStop(1, 'rgba(116,82,52,0)');
      ctx.fillStyle = weep;
      ctx.fillRect(x - 3, y + 4, 6, 30);
    }
  }

  // Damp patches climbing up from the floor and rain streaks from above.
  for (let i = 0; i < 6; i += 1) {
    const x = rng() * size;
    const w = 24 + rng() * 80;
    const h = size * (0.16 + rng() * 0.5);
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, 'rgba(68,66,60,0.18)');
    gradient.addColorStop(0.55, 'rgba(72,70,62,0.07)');
    gradient.addColorStop(1, 'rgba(72,70,62,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, 0, w, h);
  }
  const floorDamp = ctx.createLinearGradient(0, size, 0, size * 0.74);
  floorDamp.addColorStop(0, 'rgba(52,51,46,0.3)');
  floorDamp.addColorStop(0.5, 'rgba(58,57,51,0.12)');
  floorDamp.addColorStop(1, 'rgba(58,57,51,0)');
  ctx.fillStyle = floorDamp;
  ctx.fillRect(0, size * 0.74, size, size * 0.26);

  // Cracks, chipped corners and a few old paint flecks.
  crack(ctx, size * (0.08 + rng() * 0.2), size * 0.38, rng, 130);
  crack(ctx, size * (0.56 + rng() * 0.2), size * 0.6, rng, 100, 'rgba(50,48,44,0.4)');
  crack(ctx, size * 0.82, size * 0.08, rng, 80, 'rgba(50,48,44,0.34)', 0.8);
  for (let i = 0; i < 16; i += 1) {
    const x = rng() * size;
    const y = size * (0.72 + rng() * 0.28);
    ctx.fillStyle = `rgba(62,60,54,${0.05 + rng() * 0.1})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 3 + rng() * 12, 2 + rng() * 5, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 9; i += 1) {
    const x = rng() * size;
    const y = size * (0.62 + rng() * 0.34);
    ctx.fillStyle = rng() > 0.5 ? 'rgba(196,198,184,0.16)' : 'rgba(122,146,124,0.12)';
    ctx.beginPath();
    ctx.ellipse(x, y, 2 + rng() * 5, 1 + rng() * 3, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Aggregate pinholes: tiny dark pits with a light lower edge.
  for (let i = 0; i < 420; i += 1) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 0.5 + rng() * 1.6;
    ctx.fillStyle = `rgba(60,58,53,${0.08 + rng() * 0.18})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(220,216,207,0.1)';
    ctx.fillRect(x - r, y + r, r * 1.6, 0.6);
  }

  addGrain(ctx, size, size, rng, 6);
  return canvas;
}

/* --- Stained concrete floor (covers the whole 2.4 × 4.8 m room) ---- */

function floorConcreteCanvas(width, height, rng) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#817e78';
  ctx.fillRect(0, 0, width, height);

  blotches(ctx, width, height, rng, 54, ['92,89,83', '156,152,143', '108,102,92', '64,62,57', '126,114,96'], 18, 160, 0.15);

  // Oil, water and old paint stains.
  for (let i = 0; i < 12; i += 1) {
    const x = rng() * width;
    const y = rng() * height;
    const r = 20 + rng() * 100;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    const dark = rng() > 0.4;
    gradient.addColorStop(0, dark ? 'rgba(40,38,33,0.26)' : 'rgba(78,68,54,0.14)');
    gradient.addColorStop(0.7, dark ? 'rgba(46,43,38,0.1)' : 'rgba(84,76,60,0.06)');
    gradient.addColorStop(1, 'rgba(50,48,42,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.5 + rng() * 0.5), rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  // A wide old water ring and a dark oil stain near the middle.
  ctx.strokeStyle = 'rgba(70,66,58,0.18)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(width * 0.4, height * 0.52, width * 0.16, height * 0.06, 0.2, 0, Math.PI * 1.7);
  ctx.stroke();
  const oil = ctx.createRadialGradient(width * 0.58, height * 0.46, 2, width * 0.58, height * 0.46, width * 0.22);
  oil.addColorStop(0, 'rgba(34,32,28,0.34)');
  oil.addColorStop(0.55, 'rgba(38,36,31,0.16)');
  oil.addColorStop(1, 'rgba(38,36,31,0)');
  ctx.fillStyle = oil;
  ctx.fillRect(0, 0, width, height);

  // Mop swirls, boot scuffs and paint drips.
  for (let i = 0; i < 46; i += 1) {
    ctx.strokeStyle = rng() > 0.5 ? 'rgba(206,202,192,0.035)' : 'rgba(58,56,50,0.045)';
    ctx.lineWidth = 2 + rng() * 11;
    ctx.beginPath();
    const x = rng() * width;
    const y = rng() * height;
    ctx.arc(x, y, 10 + rng() * 52, rng() * Math.PI, rng() * Math.PI + 0.9);
    ctx.stroke();
  }
  for (let i = 0; i < 60; i += 1) {
    ctx.fillStyle = `rgba(48,46,41,${0.03 + rng() * 0.06})`;
    ctx.fillRect(rng() * width, rng() * height, 2 + rng() * 16, 1 + rng() * 3);
  }
  for (let i = 0; i < 12; i += 1) {
    const x = rng() * width;
    const y = rng() * height;
    ctx.fillStyle = rng() > 0.5 ? 'rgba(186,186,172,0.12)' : 'rgba(122,140,124,0.1)';
    ctx.beginPath();
    ctx.ellipse(x, y, 3 + rng() * 9, 2 + rng() * 5, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cracks with a few branches.
  crack(ctx, width * 0.18, height * 0.12, rng, 170, 'rgba(42,40,35,0.5)');
  crack(ctx, width * 0.72, height * 0.55, rng, 140, 'rgba(42,40,35,0.44)');
  crack(ctx, width * 0.42, height * 0.78, rng, 100, 'rgba(42,40,35,0.38)', 0.8);
  crack(ctx, width * 0.62, height * 0.2, rng, 80, 'rgba(42,40,35,0.32)', 0.7);
  // A long expansion joint.
  ctx.strokeStyle = 'rgba(52,50,44,0.3)';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.72);
  ctx.lineTo(width, height * 0.705);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(214,210,200,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.723);
  ctx.lineTo(width, height * 0.708);
  ctx.stroke();

  // Settled dust along the edges and in the corners.
  const edge = ctx.createLinearGradient(0, 0, width, 0);
  edge.addColorStop(0, 'rgba(66,62,54,0.28)');
  edge.addColorStop(0.12, 'rgba(66,62,54,0)');
  edge.addColorStop(0.88, 'rgba(66,62,54,0)');
  edge.addColorStop(1, 'rgba(66,62,54,0.26)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, width, height);
  const topBottom = ctx.createLinearGradient(0, 0, 0, height);
  topBottom.addColorStop(0, 'rgba(58,55,48,0.24)');
  topBottom.addColorStop(0.08, 'rgba(58,55,48,0)');
  topBottom.addColorStop(0.92, 'rgba(58,55,48,0)');
  topBottom.addColorStop(1, 'rgba(58,55,48,0.22)');
  ctx.fillStyle = topBottom;
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 320; i += 1) {
    ctx.fillStyle = rng() > 0.5 ? 'rgba(66,62,52,0.14)' : 'rgba(206,200,186,0.1)';
    ctx.fillRect(rng() * width, rng() * height, 1 + rng() * 3, 1 + rng() * 2);
  }

  addGrain(ctx, width, height, rng, 7);
  return canvas;
}

/* --- Exposed slab ceiling (board-formed, water-stained) ------------ */

function ceilingConcreteCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#8b8881';
  ctx.fillRect(0, 0, size, size);

  blotches(ctx, size, size, rng, 30, ['96,93,86', '172,168,158', '118,112,102', '70,68,63'], size * 0.08, size * 0.4, 0.14);

  // Board marks on the soffit, plus tie holes.
  for (let i = 1; i < 8; i += 1) {
    const y = (size / 8) * i;
    ctx.fillStyle = 'rgba(58,56,51,0.18)';
    ctx.fillRect(0, y, size, 1.5);
    ctx.fillStyle = 'rgba(208,204,194,0.1)';
    ctx.fillRect(0, y + 1.5, size, 0.8);
  }
  for (let i = 1; i < 4; i += 1) {
    const x = (size / 4) * i;
    ctx.fillStyle = 'rgba(58,56,51,0.12)';
    ctx.fillRect(x, 0, 1.2, size);
  }
  for (const x of [size * 0.25, size * 0.75]) {
    for (const y of [size * 0.25, size * 0.75]) {
      ctx.fillStyle = 'rgba(38,36,32,0.5)';
      ctx.beginPath();
      ctx.arc(x, y, 3.6, 0, Math.PI * 2);
      ctx.fill();
      const weep = ctx.createRadialGradient(x, y, 2, x, y, 22);
      weep.addColorStop(0, 'rgba(106,76,50,0.28)');
      weep.addColorStop(1, 'rgba(106,76,50,0)');
      ctx.fillStyle = weep;
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Long water stains and a couple of hairline cracks.
  for (let i = 0; i < 5; i += 1) {
    const x = rng() * size;
    const w = 20 + rng() * 90;
    const gradient = ctx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, 'rgba(56,54,48,0.2)');
    gradient.addColorStop(0.6, 'rgba(62,60,52,0.08)');
    gradient.addColorStop(1, 'rgba(62,60,52,0.02)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, 0, w, size);
  }
  crack(ctx, size * 0.2, size * 0.1, rng, 160, 'rgba(40,38,34,0.4)');
  crack(ctx, size * 0.68, size * 0.5, rng, 130, 'rgba(40,38,34,0.36)');
  for (let i = 0; i < 6; i += 1) {
    ctx.fillStyle = `rgba(50,48,43,${0.05 + rng() * 0.08})`;
    ctx.beginPath();
    ctx.ellipse(rng() * size, rng() * size, 12 + rng() * 40, 5 + rng() * 20, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  // Pitted aggregate.
  for (let i = 0; i < 320; i += 1) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 0.5 + rng() * 1.4;
    ctx.fillStyle = `rgba(52,50,46,${0.08 + rng() * 0.14})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  addGrain(ctx, size, size, rng, 6);
  return canvas;
}

/* --- Old galvanised steel ------------------------------------------ */

function steelCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  const base = ctx.createLinearGradient(0, 0, size, size * 0.4);
  base.addColorStop(0, '#a8adaa');
  base.addColorStop(0.5, '#979c99');
  base.addColorStop(1, '#8c918e');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // Zinc spangle: large pale polygons.
  for (let i = 0; i < 26; i += 1) {
    const x = rng() * size;
    const y = rng() * size;
    const r = size * (0.04 + rng() * 0.12);
    ctx.beginPath();
    for (let k = 0; k < 6; k += 1) {
      const angle = (k / 6) * Math.PI * 2;
      const rr = r * (0.6 + rng() * 0.5);
      const px = x + Math.cos(angle) * rr;
      const py = y + Math.sin(angle) * rr;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = rng() > 0.5 ? 'rgba(232,236,232,0.06)' : 'rgba(96,102,100,0.05)';
    ctx.fill();
  }

  // Brushed handling marks and scratches.
  for (let i = 0; i < 220; i += 1) {
    ctx.strokeStyle = rng() > 0.5 ? 'rgba(236,240,236,0.16)' : 'rgba(66,72,70,0.12)';
    ctx.lineWidth = 0.5 + rng() * 1.1;
    const y = rng() * size;
    const x = rng() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + size * (0.05 + rng() * 0.4), y + (rng() - 0.5) * 2);
    ctx.stroke();
  }
  // Rust freckles and grime in the crevices.
  for (let i = 0; i < 70; i += 1) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 0.7 + rng() * 3.2;
    ctx.fillStyle = `rgba(${128 + rng() * 40},${74 + rng() * 24},${44 + rng() * 16},${0.12 + rng() * 0.28})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 40; i += 1) {
    ctx.strokeStyle = 'rgba(50,54,52,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rng() * size, rng() * size);
    ctx.lineTo(rng() * size, rng() * size);
    ctx.stroke();
  }
  addGrain(ctx, size, size, rng, 5);
  return canvas;
}

/* --- Rust ---------------------------------------------------------- */

function rustCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#7d5338';
  ctx.fillRect(0, 0, size, size);
  blotches(ctx, size, size, rng, 44, ['58,34,22', '176,104,58', '116,66,40', '204,138,82'], 4, 34, 0.34);
  for (let i = 0; i < 90; i += 1) {
    ctx.fillStyle = rng() > 0.5 ? 'rgba(48,30,20,0.28)' : 'rgba(196,128,74,0.26)';
    ctx.beginPath();
    ctx.ellipse(rng() * size, rng() * size, 0.6 + rng() * 2.4, 0.6 + rng() * 1.6, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  addGrain(ctx, size, size, rng, 10);
  return canvas;
}

/* --- Old wood ------------------------------------------------------ */

function woodCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#94754f';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 160; i += 1) {
    const x = rng() * size;
    const width = 0.5 + rng() * 2.6;
    ctx.strokeStyle = rng() > 0.55
      ? `rgba(66,46,30,${0.04 + rng() * 0.12})`
      : `rgba(216,190,150,${0.03 + rng() * 0.1})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + (rng() - 0.5) * 16, size * 0.33, x + (rng() - 0.5) * 18, size * 0.66, x + (rng() - 0.5) * 10, size);
    ctx.stroke();
  }
  // Two knots.
  for (let i = 0; i < 2; i += 1) {
    const x = rng() * size;
    const y = size * (0.2 + rng() * 0.6);
    for (let k = 0; k < 6; k += 1) {
      ctx.strokeStyle = `rgba(58,40,26,${0.1 + k * 0.03})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.ellipse(x, y, 4 + k * 3.4, 2.4 + k * 2.2, 0.3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  for (let i = 0; i < 30; i += 1) {
    ctx.strokeStyle = 'rgba(64,48,32,0.16)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(rng() * size, rng() * size);
    ctx.lineTo(rng() * size, rng() * size);
    ctx.stroke();
  }
  addGrain(ctx, size, size, rng, 6);
  return canvas;
}

/* --- Kraft board --------------------------------------------------- */

function cardboardCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#b8966c';
  ctx.fillRect(0, 0, size, size);

  // Corrugation ridges read through the liner.
  for (let y = 0; y < size; y += 7) {
    ctx.fillStyle = y % 14 === 0 ? 'rgba(146,112,74,0.14)' : 'rgba(226,200,160,0.12)';
    ctx.fillRect(0, y, size, 1.4);
  }
  for (let i = 0; i < 60; i += 1) {
    ctx.strokeStyle = `rgba(120,90,58,${0.05 + rng() * 0.1})`;
    ctx.lineWidth = 0.6 + rng();
    ctx.beginPath();
    const y = rng() * size;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(size * 0.3, y + (rng() - 0.5) * 10, size * 0.7, y + (rng() - 0.5) * 10, size, y + (rng() - 0.5) * 5);
    ctx.stroke();
  }
  // Packing tape.
  ctx.fillStyle = 'rgba(214,192,152,0.55)';
  ctx.fillRect(0, size * 0.44, size, size * 0.07);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(0, size * 0.44, size, 1.5);
  // Abstract stamped block, no characters.
  ctx.strokeStyle = 'rgba(58,74,92,0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(size * 0.62, size * 0.66, size * 0.18, size * 0.1);
  ctx.fillStyle = 'rgba(58,74,92,0.3)';
  ctx.fillRect(size * 0.64, size * 0.69, size * 0.09, 2);
  ctx.fillRect(size * 0.64, size * 0.72, size * 0.13, 1.5);
  // Scuffs and stains.
  for (let i = 0; i < 26; i += 1) {
    ctx.fillStyle = `rgba(92,70,46,${0.04 + rng() * 0.08})`;
    ctx.beginPath();
    ctx.ellipse(rng() * size, rng() * size, 3 + rng() * 12, 2 + rng() * 7, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  addGrain(ctx, size, size, rng, 7);
  return canvas;
}

/* --- Jute sacking -------------------------------------------------- */

function burlapCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#b29a72';
  ctx.fillRect(0, 0, size, size);

  // Woven weft and warp.
  for (let y = 0; y < size; y += 3) {
    ctx.fillStyle = y % 6 === 0 ? 'rgba(84,66,42,0.12)' : 'rgba(226,204,166,0.08)';
    ctx.fillRect(0, y, size, 1.4);
  }
  for (let x = 0; x < size; x += 3) {
    ctx.fillStyle = x % 6 === 0 ? 'rgba(88,70,46,0.1)' : 'rgba(230,208,170,0.07)';
    ctx.fillRect(x, 0, 1.3, size);
  }
  // Loose fibres and slubs.
  for (let i = 0; i < 300; i += 1) {
    ctx.strokeStyle = rng() > 0.5 ? 'rgba(224,202,164,0.16)' : 'rgba(84,66,42,0.16)';
    ctx.lineWidth = 0.6 + rng() * 1.1;
    const x = rng() * size;
    const y = rng() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rng() - 0.5) * 7, y + (rng() - 0.5) * 7);
    ctx.stroke();
  }
  // Faded stripe and a damp stain; no printed block that would tile oddly.
  ctx.fillStyle = 'rgba(142,52,44,0.16)';
  ctx.fillRect(size * 0.08, size * 0.72, size * 0.26, 3);
  const stain = ctx.createRadialGradient(size * 0.3, size * 0.62, 2, size * 0.3, size * 0.62, size * 0.26);
  stain.addColorStop(0, 'rgba(66,52,34,0.22)');
  stain.addColorStop(1, 'rgba(66,52,34,0)');
  ctx.fillStyle = stain;
  ctx.fillRect(0, 0, size, size);
  addGrain(ctx, size, size, rng, 5);
  return canvas;
}

/* --- Faded cloth --------------------------------------------------- */

function clothCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#b3ab9b';
  ctx.fillRect(0, 0, size, size);

  // Tight plain weave.
  for (let y = 0; y < size; y += 3) {
    ctx.fillStyle = y % 6 === 0 ? 'rgba(70,64,54,0.06)' : 'rgba(236,230,218,0.05)';
    ctx.fillRect(0, y, size, 1);
  }
  for (let x = 0; x < size; x += 3) {
    ctx.fillStyle = x % 6 === 0 ? 'rgba(70,64,54,0.045)' : 'rgba(236,230,218,0.04)';
    ctx.fillRect(x, 0, 1, size);
  }
  // Soft folds: paired light and dark bands.
  for (let i = 0; i < 12; i += 1) {
    const x = rng() * size;
    const y = rng() * size;
    const w = size * (0.2 + rng() * 0.5);
    ctx.strokeStyle = 'rgba(52,48,42,0.07)';
    ctx.lineWidth = 3 + rng() * 7;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + w * 0.3, y - 18, x + w * 0.7, y + 20, x + w, y - 4);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(236,230,218,0.09)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - 3);
    ctx.bezierCurveTo(x + w * 0.3, y - 21, x + w * 0.7, y + 17, x + w, y - 7);
    ctx.stroke();
  }
  // Seams, wear and a couple of stains.
  for (let i = 0; i < 4; i += 1) {
    ctx.strokeStyle = 'rgba(76,70,60,0.12)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 3]);
    const y = rng() * size;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  for (let i = 0; i < 8; i += 1) {
    ctx.fillStyle = `rgba(74,66,52,${0.04 + rng() * 0.06})`;
    ctx.beginPath();
    ctx.ellipse(rng() * size, rng() * size, 6 + rng() * 24, 4 + rng() * 14, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  addGrain(ctx, size, size, rng, 5);
  return canvas;
}

/* --- Rope ---------------------------------------------------------- */

function ropeCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#b69a6c';
  ctx.fillRect(0, 0, size, size);
  // Three-strand twist, diagonal in the tube's UV space.
  for (let x = -size; x < size * 2; x += 9) {
    ctx.save();
    ctx.translate(x, 0);
    ctx.rotate(0.6);
    ctx.fillStyle = 'rgba(78,60,38,0.35)';
    ctx.fillRect(0, -size, 3.2, size * 3);
    ctx.fillStyle = 'rgba(238,216,174,0.22)';
    ctx.fillRect(3.2, -size, 2, size * 3);
    ctx.restore();
  }
  for (let i = 0; i < 70; i += 1) {
    ctx.strokeStyle = rng() > 0.5 ? 'rgba(244,224,184,0.2)' : 'rgba(76,58,36,0.24)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(rng() * size, rng() * size);
    ctx.lineTo(rng() * size, rng() * size);
    ctx.stroke();
  }
  addGrain(ctx, size, size, rng, 6);
  return canvas;
}

/* --- Yellowed paper ------------------------------------------------ */

function paperCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#d2c9b5';
  ctx.fillRect(0, 0, size, size);
  blotches(ctx, size, size, rng, 18, ['176,162,136', '238,232,218', '148,134,110'], 8, 70, 0.12);
  // Fold creases.
  ctx.strokeStyle = 'rgba(120,110,92,0.18)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(0, (size / 4) * i);
    ctx.lineTo(size, (size / 4) * i + (rng() - 0.5) * 3);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(size * 0.5, 0);
  ctx.lineTo(size * 0.51, size);
  ctx.stroke();
  // Edge foxing.
  const edge = ctx.createRadialGradient(size / 2, size / 2, size * 0.3, size / 2, size / 2, size * 0.75);
  edge.addColorStop(0, 'rgba(140,120,88,0)');
  edge.addColorStop(1, 'rgba(140,120,88,0.22)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, size, size);
  // Abstract column blocks: a bundle of old print, deliberately unreadable.
  ctx.fillStyle = 'rgba(96,90,78,0.1)';
  for (let i = 0; i < 5; i += 1) {
    ctx.fillRect(size * (0.12 + i * 0.16), size * 0.16, size * 0.1, size * 0.5);
  }
  addGrain(ctx, size, size, rng, 5);
  return canvas;
}

/* --- Chipped door paint ------------------------------------------- */

function doorPaintCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#6c7768';
  ctx.fillRect(0, 0, size, size);
  blotches(ctx, size, size, rng, 26, ['64,72,64', '132,140,126', '92,98,88'], 10, 80, 0.16);
  // Brush direction: horizontal on the leaf.
  for (let i = 0; i < 180; i += 1) {
    ctx.strokeStyle = rng() > 0.5 ? 'rgba(218,224,208,0.06)' : 'rgba(46,52,46,0.07)';
    ctx.lineWidth = 0.7 + rng() * 1.6;
    const y = rng() * size;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (rng() - 0.5) * 2);
    ctx.stroke();
  }
  // Chipped paint at the stiles and bottom rail, with rust beneath.
  const chip = (x, y, r) => {
    ctx.beginPath();
    const points = 5 + Math.floor(rng() * 4);
    for (let i = 0; i < points; i += 1) {
      const angle = (i / points) * Math.PI * 2;
      const rr = r * (0.45 + rng() * 0.7);
      const px = x + Math.cos(angle) * rr;
      const py = y + Math.sin(angle) * rr * 0.8;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = `rgba(96,66,44,${0.5 + rng() * 0.3})`;
    ctx.fill();
    ctx.strokeStyle = 'rgba(174,150,120,0.22)';
    ctx.lineWidth = 1;
    ctx.stroke();
  };
  for (let i = 0; i < 22; i += 1) {
    const edgeX = rng() > 0.5 ? rng() * size * 0.08 : size - rng() * size * 0.08;
    chip(edgeX, rng() * size, 2 + rng() * 7);
  }
  for (let i = 0; i < 18; i += 1) {
    chip(rng() * size, size * (0.84 + rng() * 0.15), 2 + rng() * 8);
  }
  for (let i = 0; i < 9; i += 1) {
    chip(rng() * size, rng() * size, 1 + rng() * 4);
  }
  // Grime creeping up from the floor.
  const grime = ctx.createLinearGradient(0, size, 0, size * 0.6);
  grime.addColorStop(0, 'rgba(38,34,28,0.4)');
  grime.addColorStop(1, 'rgba(38,34,28,0)');
  ctx.fillStyle = grime;
  ctx.fillRect(0, size * 0.6, size, size * 0.4);
  // Screw holes and a shadowed panel edge.
  for (const [x, y] of [[size * 0.12, size * 0.18], [size * 0.88, size * 0.18]]) {
    ctx.fillStyle = 'rgba(30,28,24,0.6)';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  addGrain(ctx, size, size, rng, 6);
  return canvas;
}

/* --- Blank adhesive label ----------------------------------------- */

function labelCanvas(size, rng) {
  const canvas = createCanvas(size, size * 0.72);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e8e4d6';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(150,146,132,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
  ctx.fillStyle = 'rgba(52,84,104,0.75)';
  ctx.fillRect(canvas.width * 0.08, canvas.height * 0.12, canvas.width * 0.72, 3);
  ctx.fillStyle = 'rgba(160,64,54,0.7)';
  ctx.fillRect(canvas.width * 0.08, canvas.height * 0.34, canvas.width * 0.34, 2);
  ctx.fillStyle = 'rgba(68,72,68,0.55)';
  ctx.fillRect(canvas.width * 0.08, canvas.height * 0.5, canvas.width * 0.58, 1.6);
  ctx.fillRect(canvas.width * 0.08, canvas.height * 0.62, canvas.width * 0.44, 1.6);
  ctx.fillRect(canvas.width * 0.08, canvas.height * 0.74, canvas.width * 0.5, 1.6);
  for (let i = 0; i < 8; i += 1) {
    ctx.fillStyle = i % 2 ? 'rgba(60,64,60,0.5)' : 'rgba(232,228,216,1)';
    ctx.fillRect(canvas.width * (0.1 + i * 0.024), canvas.height * 0.84, canvas.width * 0.012, canvas.height * 0.08);
  }
  addGrain(ctx, canvas.width, canvas.height, rng, 3);
  return canvas;
}

/* --- Louvred light comb (additive floor decal) -------------------- */

function louverLightCanvas(width, height) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);
  const bands = 9;
  for (let i = 0; i < bands; i += 1) {
    const y = ((i + 0.5) / bands) * height;
    const bandHeight = height / bands * 0.52;
    const gradient = ctx.createLinearGradient(0, y - bandHeight / 2, 0, y + bandHeight / 2);
    gradient.addColorStop(0, 'rgba(226,242,248,0)');
    gradient.addColorStop(0.5, 'rgba(226,242,248,0.62)');
    gradient.addColorStop(1, 'rgba(226,242,248,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, y - bandHeight / 2, width, bandHeight);
  }
  // Vary the intensity along the comb so it doesn't read as a printed pattern.
  const along = ctx.createLinearGradient(0, 0, width, 0);
  along.addColorStop(0, 'rgba(0,0,0,0.08)');
  along.addColorStop(0.35, 'rgba(0,0,0,0.85)');
  along.addColorStop(0.7, 'rgba(0,0,0,0.9)');
  along.addColorStop(1, 'rgba(0,0,0,0.1)');
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = along;
  ctx.fillRect(0, 0, width, height);
  // Soft falloff away from the door.
  const fade = ctx.createLinearGradient(0, 0, 0, height);
  fade.addColorStop(0, 'rgba(0,0,0,0.25)');
  fade.addColorStop(0.4, 'rgba(0,0,0,1)');
  fade.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';
  return canvas;
}

/* --- Light and shadow helper maps --------------------------------- */

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

function dustCanvas(size) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  for (const [x, y, r, a] of [
    [size * 0.5, size * 0.5, size * 0.3, 0.9],
    [size * 0.42, size * 0.56, size * 0.19, 0.5],
    [size * 0.58, size * 0.44, size * 0.14, 0.45],
  ]) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, `rgba(255,246,226,${a})`);
    gradient.addColorStop(0.5, `rgba(255,242,218,${a * 0.3})`);
    gradient.addColorStop(1, 'rgba(255,238,210,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  return canvas;
}

function environmentCanvas() {
  const width = 512;
  const height = 256;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const wall = ctx.createLinearGradient(0, 0, 0, height);
  wall.addColorStop(0, '#2e2a24');
  wall.addColorStop(0.35, '#423d34');
  wall.addColorStop(0.62, '#39352d');
  wall.addColorStop(1, '#171512');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, width, height);

  // The bare bulb: a small warm sun above the middle of the room.
  const bulb = ctx.createRadialGradient(width * 0.56, height * 0.14, 2, width * 0.56, height * 0.14, 70);
  bulb.addColorStop(0, 'rgba(255,236,190,0.95)');
  bulb.addColorStop(0.2, 'rgba(255,214,146,0.42)');
  bulb.addColorStop(1, 'rgba(255,196,120,0)');
  ctx.fillStyle = bulb;
  ctx.fillRect(0, 0, width, height * 0.4);

  // The louvre door: a narrow cool stripe low on one side.
  const vent = ctx.createLinearGradient(width * 0.18, 0, width * 0.27, 0);
  vent.addColorStop(0, 'rgba(198,222,230,0)');
  vent.addColorStop(0.5, 'rgba(214,234,240,0.5)');
  vent.addColorStop(1, 'rgba(198,222,230,0)');
  ctx.fillStyle = vent;
  ctx.fillRect(width * 0.16, height * 0.36, width * 0.13, height * 0.2);
  // A few dark masses so the metal picks up irregular shapes.
  for (const [x, w] of [[0.06, 0.1], [0.42, 0.08], [0.78, 0.12], [0.93, 0.07]]) {
    ctx.fillStyle = 'rgba(14,13,11,0.45)';
    ctx.fillRect(width * x, height * 0.34, width * w, height * 0.36);
  }
  // Floor bounce.
  const floor = ctx.createLinearGradient(0, height * 0.74, 0, height);
  floor.addColorStop(0, 'rgba(92,80,62,0)');
  floor.addColorStop(1, 'rgba(120,104,80,0.22)');
  ctx.fillStyle = floor;
  ctx.fillRect(0, height * 0.74, width, height * 0.26);
  return canvas;
}

/* ------------------------------------------------------------------ */

export function createTextureSet(maxAnisotropy = 8) {
  const anisotropy = Math.min(8, maxAnisotropy || 8);
  const rng = mulberry32(0x570a9e);

  const wallConcrete = makeTexture(wallConcreteCanvas(512, rng), { anisotropy });
  const ceilingConcrete = makeTexture(ceilingConcreteCanvas(512, rng), { anisotropy });
  const floorConcrete = makeTexture(floorConcreteCanvas(512, 1024, rng), { anisotropy, wrap: false });
  // The whole-room floor map must not repeat, but the corridor slice needs
  // a tiling version; clone the canvas-backed texture and re-enable wrap.
  const floorConcreteTile = floorConcrete.clone();
  floorConcreteTile.wrapS = THREE.RepeatWrapping;
  floorConcreteTile.wrapT = THREE.RepeatWrapping;
  floorConcreteTile.repeat.set(1, 1);
  floorConcreteTile.needsUpdate = true;
  const steel = makeTexture(steelCanvas(256, rng), { anisotropy });
  const rust = makeTexture(rustCanvas(128, rng), { anisotropy });
  const wood = makeTexture(woodCanvas(256, rng), { anisotropy });
  const cardboard = makeTexture(cardboardCanvas(256, rng), { anisotropy });
  const burlap = makeTexture(burlapCanvas(256, rng), { anisotropy });
  const cloth = makeTexture(clothCanvas(256, rng), { anisotropy });
  const rope = makeTexture(ropeCanvas(128, rng), { anisotropy: 4 });
  const paper = makeTexture(paperCanvas(256, rng), { anisotropy });
  const doorPaint = makeTexture(doorPaintCanvas(256, rng), { anisotropy });
  const label = makeTexture(labelCanvas(128, rng), { anisotropy: 2, wrap: false });
  const louverLight = makeTexture(louverLightCanvas(128, 256), { srgb: true, anisotropy: 2, wrap: false });

  const contactShadow = new THREE.CanvasTexture(
    radialCanvas(128, [
      [0, 'rgba(3, 4, 3, 0.55)'],
      [0.4, 'rgba(3, 4, 3, 0.3)'],
      [0.72, 'rgba(3, 4, 3, 0.1)'],
      [1, 'rgba(3, 4, 3, 0)'],
    ]),
  );
  contactShadow.colorSpace = THREE.NoColorSpace;
  contactShadow.needsUpdate = true;

  const glow = new THREE.CanvasTexture(
    radialCanvas(256, [
      [0, 'rgba(255, 246, 220, 0.95)'],
      [0.18, 'rgba(255, 228, 176, 0.5)'],
      [0.5, 'rgba(255, 210, 148, 0.14)'],
      [1, 'rgba(255, 200, 130, 0)'],
    ]),
  );
  glow.colorSpace = THREE.SRGBColorSpace;
  glow.needsUpdate = true;

  const dust = new THREE.CanvasTexture(dustCanvas(64));
  dust.colorSpace = THREE.SRGBColorSpace;
  dust.needsUpdate = true;

  const environment = new THREE.CanvasTexture(environmentCanvas());
  environment.mapping = THREE.EquirectangularReflectionMapping;
  environment.colorSpace = THREE.SRGBColorSpace;
  environment.needsUpdate = true;

  return {
    wallConcrete,
    ceilingConcrete,
    floorConcrete,
    floorConcreteTile,
    steel,
    rust,
    wood,
    cardboard,
    burlap,
    cloth,
    rope,
    paper,
    doorPaint,
    label,
    louverLight,
    contactShadow,
    glow,
    dust,
    environment,
  };
}
