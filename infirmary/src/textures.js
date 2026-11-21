import * as THREE from 'three';
import { mulberry32 } from '../../dining/src/utils.js';

/* ------------------------------------------------------------------ *
 * Procedural infirmary surfaces.
 *
 * Clean white plaster, 600 mm white floor tiles, brushed stainless,
 * pale-blue curtain weave, light oak, painted white door, a blank
 * medicine label, medical-waste symbol, the wall display feed and the
 * reflection environment. Everything is drawn in the browser: no
 * bitmaps, no network requests, no readable text.
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

function addGrain(ctx, width, height, rng, amount = 4) {
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

function softBlotches(ctx, width, height, rng, count, colors, minR, maxR, alpha) {
  for (let i = 0; i < count; i += 1) {
    const x = rng() * width;
    const y = rng() * height;
    const radius = minR + rng() * (maxR - minR);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const color = colors[Math.floor(rng() * colors.length)];
    gradient.addColorStop(0, `rgba(${color},${alpha * (0.4 + rng() * 0.6)})`);
    gradient.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
}

/* --- White painted plaster wall (2.0 m module) -------------------- */

function wallCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#eef1ef';
  ctx.fillRect(0, 0, size, size);

  // Roller clouds and a faint cool shadow toward the floor edge.
  softBlotches(ctx, size, size, rng, 46, ['224,229,226', '243,246,243', '212,219,216', '251,252,250'], size * 0.06, size * 0.26, 0.11);
  const lower = ctx.createLinearGradient(0, size * 0.55, 0, size);
  lower.addColorStop(0, 'rgba(190,199,196,0)');
  lower.addColorStop(1, 'rgba(174,185,182,0.12)');
  ctx.fillStyle = lower;
  ctx.fillRect(0, size * 0.55, size, size * 0.45);

  // Very light roller striping, barely visible at standing distance.
  for (let i = 0; i < 42; i += 1) {
    ctx.strokeStyle = rng() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(186,194,191,0.035)';
    ctx.lineWidth = 2 + rng() * 7;
    const x = rng() * size;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (rng() - 0.5) * 22, size);
    ctx.stroke();
  }

  // A few pin holes and one hairline settlement crack, kept subtle.
  for (let i = 0; i < 120; i += 1) {
    ctx.fillStyle = `rgba(160,168,165,${0.04 + rng() * 0.08})`;
    ctx.beginPath();
    ctx.arc(rng() * size, rng() * size, 0.5 + rng() * 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(168,176,173,0.18)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  let x = size * 0.72;
  let y = size * 0.08;
  ctx.moveTo(x, y);
  for (let i = 0; i < 8; i += 1) {
    x += (rng() - 0.5) * 7;
    y += size * 0.045;
    ctx.lineTo(x, y);
  }
  ctx.stroke();

  addGrain(ctx, size, size, rng, 3);
  return canvas;
}

/* --- White 600 mm floor tiles (2 × 2 per map) --------------------- */

function floorCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  const tile = size / 2;
  ctx.fillStyle = '#dfe4e2';
  ctx.fillRect(0, 0, size, size);

  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 2; col += 1) {
      const x = col * tile;
      const y = row * tile;
      const shade = 242 + Math.floor(rng() * 7);
      ctx.fillStyle = `rgb(${shade},${shade + 3},${shade + 2})`;
      ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);

      // Faint cloudy polish and a soft diagonal sheen.
      const sheen = ctx.createLinearGradient(x, y, x + tile, y + tile);
      sheen.addColorStop(0, 'rgba(255,255,255,0.16)');
      sheen.addColorStop(0.42, 'rgba(255,255,255,0.02)');
      sheen.addColorStop(1, 'rgba(208,218,215,0.09)');
      ctx.fillStyle = sheen;
      ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);

      for (let i = 0; i < 10; i += 1) {
        const bx = x + 12 + rng() * (tile - 24);
        const by = y + 12 + rng() * (tile - 24);
        const radius = 3 + rng() * 16;
        const spot = ctx.createRadialGradient(bx, by, 0, bx, by, radius);
        spot.addColorStop(0, `rgba(196,207,203,${0.02 + rng() * 0.05})`);
        spot.addColorStop(1, 'rgba(196,207,203,0)');
        ctx.fillStyle = spot;
        ctx.fillRect(bx - radius, by - radius, radius * 2, radius * 2);
      }

      // A few microscopic grey specks in the glaze.
      for (let i = 0; i < 26; i += 1) {
        ctx.fillStyle = `rgba(150,160,157,${0.05 + rng() * 0.09})`;
        ctx.fillRect(x + 4 + rng() * (tile - 8), y + 4 + rng() * (tile - 8), 1, 1);
      }
    }
  }

  // Grout lines, crisp but slightly softened at the edges.
  ctx.strokeStyle = 'rgba(174,184,181,0.9)';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, size, size);
  ctx.beginPath();
  ctx.moveTo(tile, 0);
  ctx.lineTo(tile, size);
  ctx.moveTo(0, tile);
  ctx.lineTo(size, tile);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(246,249,247,0.55)';
  ctx.lineWidth = 1;
  ctx.strokeRect(3, 3, size - 6, size - 6);

  addGrain(ctx, size, size, rng, 2);
  return canvas;
}

/* --- White ceiling tile ------------------------------------------- */

function ceilingCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f3f5f4';
  ctx.fillRect(0, 0, size, size);
  softBlotches(ctx, size, size, rng, 26, ['232,236,234', '249,250,249', '223,228,226'], 20, 100, 0.08);
  for (let i = 0; i < 900; i += 1) {
    ctx.fillStyle = `rgba(168,176,173,${0.02 + rng() * 0.05})`;
    ctx.beginPath();
    ctx.arc(rng() * size, rng() * size, 0.4 + rng() * 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  addGrain(ctx, size, size, rng, 2);
  return canvas;
}

/* --- Brushed stainless -------------------------------------------- */

function steelCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  const base = ctx.createLinearGradient(0, 0, 0, size);
  base.addColorStop(0, '#c9cdcb');
  base.addColorStop(0.45, '#e1e4e2');
  base.addColorStop(0.7, '#b9bebc');
  base.addColorStop(1, '#d7dbd9');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 420; i += 1) {
    const y = rng() * size;
    ctx.strokeStyle = rng() > 0.5 ? `rgba(255,255,255,${0.03 + rng() * 0.09})` : `rgba(90,98,96,${0.025 + rng() * 0.06})`;
    ctx.lineWidth = 0.5 + rng() * 1.2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (rng() - 0.5) * 1.2);
    ctx.stroke();
  }
  // A couple of faint wipe marks, not grime.
  for (let i = 0; i < 7; i += 1) {
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 4 + rng() * 10;
    ctx.beginPath();
    ctx.moveTo(rng() * size, 0);
    ctx.lineTo(rng() * size, size);
    ctx.stroke();
  }
  addGrain(ctx, size, size, rng, 2);
  return canvas;
}

/* --- Light oak / beech, vertical grain ---------------------------- */

function woodCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#c8a678';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 46; i += 1) {
    const x = rng() * size;
    const width = 1 + rng() * 6;
    ctx.fillStyle = rng() > 0.45
      ? `rgba(146,112,70,${0.05 + rng() * 0.12})`
      : `rgba(236,211,170,${0.04 + rng() * 0.11})`;
    ctx.fillRect(x, 0, width, size);
  }
  // Annual rings as long, slightly wandering vertical curves.
  for (let i = 0; i < 13; i += 1) {
    ctx.strokeStyle = `rgba(128,96,58,${0.05 + rng() * 0.09})`;
    ctx.lineWidth = 0.7 + rng() * 1.5;
    ctx.beginPath();
    let x = rng() * size;
    ctx.moveTo(x, 0);
    for (let y = 0; y <= size; y += size / 10) {
      x += (rng() - 0.5) * 5;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // A few small knots, kept near the edges.
  for (let i = 0; i < 3; i += 1) {
    const x = rng() * size;
    const y = rng() * size;
    for (let r = 9; r > 1; r -= 2.2) {
      ctx.strokeStyle = `rgba(118,88,52,${0.08 + rng() * 0.1})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.55, r, 0.2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  addGrain(ctx, size, size, rng, 4);
  return canvas;
}

/* --- Painted white door ------------------------------------------- */

function doorCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f1f2ef';
  ctx.fillRect(0, 0, size, size);
  softBlotches(ctx, size, size, rng, 20, ['230,234,231', '249,250,248', '218,224,221'], 18, 90, 0.08);
  // Faint brush drag marks along the vertical stiles.
  for (let i = 0; i < 60; i += 1) {
    ctx.strokeStyle = rng() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(180,188,185,0.035)';
    ctx.lineWidth = 1 + rng() * 3;
    const x = rng() * size;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (rng() - 0.5) * 6, size);
    ctx.stroke();
  }
  addGrain(ctx, size, size, rng, 2);
  return canvas;
}

/* --- Pale-blue curtain weave -------------------------------------- */

function fabricCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#c2dcea';
  ctx.fillRect(0, 0, size, size);
  // A quiet woven grid plus soft vertical light bands.
  for (let i = 0; i < size; i += 4) {
    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    ctx.fillRect(i, 0, 1, size);
    ctx.fillStyle = 'rgba(110,150,170,0.03)';
    ctx.fillRect(0, i, size, 1);
  }
  for (let i = 0; i < 18; i += 1) {
    const x = rng() * size;
    const width = 8 + rng() * 34;
    const gradient = ctx.createLinearGradient(x, 0, x + width, 0);
    gradient.addColorStop(0, 'rgba(226,242,250,0)');
    gradient.addColorStop(0.5, 'rgba(232,246,252,0.1)');
    gradient.addColorStop(1, 'rgba(226,242,250,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, 0, width, size);
  }
  for (let i = 0; i < 900; i += 1) {
    ctx.fillStyle = `rgba(255,255,255,${0.02 + rng() * 0.05})`;
    ctx.fillRect(rng() * size, rng() * size, 1, 1 + rng() * 4);
  }
  addGrain(ctx, size, size, rng, 3);
  return canvas;
}

/* --- White tile splashback (5 × 5 small tiles) -------------------- */

function splashCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ccd5d2';
  ctx.fillRect(0, 0, size, size);
  const tile = size / 5;
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      const shade = 238 + Math.floor(rng() * 9);
      ctx.fillStyle = `rgb(${shade},${shade + 3},${shade + 2})`;
      ctx.fillRect(col * tile + 1, row * tile + 1, tile - 2, tile - 2);
      const sheen = ctx.createLinearGradient(col * tile, row * tile, (col + 1) * tile, (row + 1) * tile);
      sheen.addColorStop(0, 'rgba(255,255,255,0.2)');
      sheen.addColorStop(0.6, 'rgba(255,255,255,0.02)');
      sheen.addColorStop(1, 'rgba(202,214,210,0.08)');
      ctx.fillStyle = sheen;
      ctx.fillRect(col * tile + 1, row * tile + 1, tile - 2, tile - 2);
    }
  }
  addGrain(ctx, size, size, rng, 2);
  return canvas;
}

/* --- Blank medicine label ----------------------------------------- */

function labelCanvas(size, rng) {
  const canvas = createCanvas(size, Math.round(size * 0.72));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f4f2e9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(150,154,146,0.45)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
  // Abstract label bars only: no letters, no numbers.
  ctx.fillStyle = 'rgba(48,92,120,0.78)';
  ctx.fillRect(canvas.width * 0.08, canvas.height * 0.13, canvas.width * 0.66, 4);
  ctx.fillStyle = 'rgba(170,66,56,0.7)';
  ctx.fillRect(canvas.width * 0.08, canvas.height * 0.36, canvas.width * 0.3, 2.4);
  ctx.fillStyle = 'rgba(70,78,74,0.55)';
  for (let i = 0; i < 3; i += 1) {
    ctx.fillRect(canvas.width * 0.08, canvas.height * (0.52 + i * 0.11), canvas.width * (0.56 - i * 0.08), 1.6);
  }
  for (let i = 0; i < 8; i += 1) {
    ctx.fillStyle = i % 2 ? 'rgba(58,64,60,0.45)' : 'rgba(244,242,233,1)';
    ctx.fillRect(canvas.width * (0.1 + i * 0.024), canvas.height * 0.84, canvas.width * 0.012, canvas.height * 0.08);
  }
  addGrain(ctx, canvas.width, canvas.height, rng, 2);
  return canvas;
}

/* --- Medical-waste symbol (trefoil, no text) ---------------------- */

function wasteSymbolCanvas(size) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;
  ctx.translate(cx, cy);
  ctx.fillStyle = 'rgba(28,28,26,0.92)';
  // Three open lobes built from thick arcs, with a solid centre.
  for (let i = 0; i < 3; i += 1) {
    ctx.save();
    ctx.rotate((i / 3) * Math.PI * 2);
    ctx.beginPath();
    ctx.arc(0, -size * 0.18, size * 0.17, Math.PI * 0.12, Math.PI * 0.88);
    ctx.arc(size * 0.06, -size * 0.23, size * 0.11, Math.PI * 1.0, Math.PI * 1.9, true);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.045, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(236,206,82,1)';
  ctx.fill();
  return canvas;
}

/* --- Wall display: abstract camera feed --------------------------- */

function displayCanvas(width, height, rng) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const base = ctx.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, '#46504f');
  base.addColorStop(0.55, '#69726f');
  base.addColorStop(1, '#2b3231');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  // A wide-angle view of a white room: floor, beds on the left, cabinet
  // on the right. Abstract shapes only; no text.
  ctx.fillStyle = 'rgba(196,204,200,0.75)';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.62);
  ctx.lineTo(width, height * 0.56);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(225,231,228,0.65)';
  for (let i = 0; i < 5; i += 1) {
    const x = width * (0.04 + i * 0.14);
    ctx.fillRect(x, height * (0.56 + i * 0.004), width * 0.1, height * 0.2);
    ctx.fillStyle = 'rgba(150,190,208,0.4)';
    ctx.fillRect(x - width * 0.01, height * (0.43 + i * 0.004), width * 0.12, height * 0.06);
    ctx.fillStyle = 'rgba(225,231,228,0.65)';
  }
  ctx.fillStyle = 'rgba(236,240,238,0.6)';
  ctx.fillRect(width * 0.72, height * 0.22, width * 0.22, height * 0.36);
  ctx.fillStyle = 'rgba(90,104,102,0.5)';
  ctx.fillRect(width * 0.74, height * 0.28, width * 0.18, height * 0.02);
  ctx.fillRect(width * 0.74, height * 0.36, width * 0.18, height * 0.02);

  // Lens vignette, scan lines and a recording dot.
  const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.15, width / 2, height / 2, width * 0.7);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(4,8,8,0.68)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(255,255,255,0.035)';
  for (let y = 0; y < height; y += 3) ctx.fillRect(0, y, width, 1);
  ctx.fillStyle = 'rgba(255,70,54,0.95)';
  ctx.beginPath();
  ctx.arc(width - 12, 12, 4, 0, Math.PI * 2);
  ctx.fill();
  addGrain(ctx, width, height, rng, 9);
  return canvas;
}

/* --- Reflection environment --------------------------------------- */

function environmentCanvas() {
  const width = 512;
  const height = 256;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const wall = ctx.createLinearGradient(0, 0, 0, height);
  wall.addColorStop(0, '#f4f7f6');
  wall.addColorStop(0.34, '#e3e9e8');
  wall.addColorStop(0.62, '#cfd8d6');
  wall.addColorStop(1, '#eef2f0');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, width, height);

  // Cool ceiling panels overhead.
  for (const [x, w] of [[0.18, 0.16], [0.48, 0.18], [0.78, 0.14]]) {
    const light = ctx.createLinearGradient(width * x, 0, width * (x + w), 0);
    light.addColorStop(0, 'rgba(246,250,255,0)');
    light.addColorStop(0.5, 'rgba(250,252,255,0.95)');
    light.addColorStop(1, 'rgba(246,250,255,0)');
    ctx.fillStyle = light;
    ctx.fillRect(width * x, height * 0.04, width * w, height * 0.08);
  }
  // A soft blue curtain mass and a dark floor band.
  ctx.fillStyle = 'rgba(160,196,214,0.5)';
  ctx.fillRect(width * 0.08, height * 0.34, width * 0.2, height * 0.3);
  ctx.fillStyle = 'rgba(148,160,158,0.4)';
  ctx.fillRect(0, height * 0.66, width, height * 0.34);
  const bounce = ctx.createLinearGradient(0, height * 0.58, 0, height);
  bounce.addColorStop(0, 'rgba(255,255,255,0)');
  bounce.addColorStop(1, 'rgba(190,206,202,0.25)');
  ctx.fillStyle = bounce;
  ctx.fillRect(0, height * 0.58, width, height * 0.42);
  return canvas;
}

/* --- Light / shadow helper maps ----------------------------------- */

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

/* ------------------------------------------------------------------ */

export function createTextureSet(maxAnisotropy = 8) {
  const anisotropy = Math.min(8, maxAnisotropy || 8);
  const rng = mulberry32(0x1a4f11);

  const wall = makeTexture(wallCanvas(512, rng), { anisotropy });
  const ceiling = makeTexture(ceilingCanvas(512, rng), { anisotropy });
  const floor = makeTexture(floorCanvas(1024, rng), { anisotropy });
  const steel = makeTexture(steelCanvas(256, rng), { anisotropy });
  const wood = makeTexture(woodCanvas(256, rng), { anisotropy });
  const doorPaint = makeTexture(doorCanvas(256, rng), { anisotropy });
  const fabric = makeTexture(fabricCanvas(256, rng), { anisotropy });
  const splash = makeTexture(splashCanvas(512, rng), { anisotropy });
  const label = makeTexture(labelCanvas(128, rng), { anisotropy: 2, wrap: false });
  const wasteSymbol = makeTexture(wasteSymbolCanvas(128), { anisotropy: 2, wrap: false, srgb: true });
  const display = makeTexture(displayCanvas(320, 200, rng), { anisotropy: 2, wrap: false });
  const contactShadow = new THREE.CanvasTexture(
    radialCanvas(128, [
      [0, 'rgba(18, 26, 26, 0.5)'],
      [0.45, 'rgba(18, 26, 26, 0.26)'],
      [0.74, 'rgba(18, 26, 26, 0.08)'],
      [1, 'rgba(18, 26, 26, 0)'],
    ]),
  );
  contactShadow.colorSpace = THREE.NoColorSpace;
  contactShadow.needsUpdate = true;

  const glow = new THREE.CanvasTexture(
    radialCanvas(128, [
      [0, 'rgba(255, 252, 242, 1)'],
      [0.22, 'rgba(242, 248, 255, 0.55)'],
      [0.55, 'rgba(226, 240, 255, 0.15)'],
      [1, 'rgba(220, 236, 255, 0)'],
    ]),
  );
  glow.colorSpace = THREE.SRGBColorSpace;
  glow.needsUpdate = true;

  const environment = new THREE.CanvasTexture(environmentCanvas());
  environment.mapping = THREE.EquirectangularReflectionMapping;
  environment.colorSpace = THREE.SRGBColorSpace;
  environment.needsUpdate = true;

  return {
    wall,
    ceiling,
    floor,
    steel,
    wood,
    doorPaint,
    fabric,
    splash,
    label,
    wasteSymbol,
    display,
    contactShadow,
    glow,
    environment,
  };
}
