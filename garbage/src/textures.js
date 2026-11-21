import * as THREE from 'three';
import { mulberry32 } from '../../dining/src/utils.js';

/* ------------------------------------------------------------------ *
 * Procedural garbage-processing-room surfaces.
 *
 * Dirty white plaster, stained cement, yellowed ceiling paint, a torn
 * no-smoking sign, the four-quadrant CRT feed, black bin-liner plastic,
 * the dark liquid decal, old galvanised steel, rust, worn wood, kraft
 * board, jute, faded cloth, rope, yellowed paper, a blank label, the
 * contact-shadow / glow / dust sprites and the reflection environment.
 * Everything is drawn in the browser: no bitmaps, no network requests,
 * no readable text.
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

/* --- Dirty painted plaster wall (one 2.4 m module) ---------------- */

function wallPaintCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');

  // Yellowed white emulsion over plaster, laid on thick.
  ctx.fillStyle = '#d3cdbe';
  ctx.fillRect(0, 0, size, size);

  // Roller mottle, drawn nine times so the module tiles without a seam.
  const cloud = (x, y, radius, color, alpha, squash) => {
    for (let ox = -1; ox <= 1; ox += 1) {
      for (let oy = -1; oy <= 1; oy += 1) {
        const px = x + ox * size;
        const py = y + oy * size;
        const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);
        gradient.addColorStop(0, `rgba(${color},${alpha})`);
        gradient.addColorStop(0.6, `rgba(${color},${alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(${color},0)`);
        ctx.save();
        ctx.translate(px, py);
        ctx.scale(1, squash);
        ctx.translate(-px, -py);
        ctx.fillStyle = gradient;
        ctx.fillRect(px - radius, py - radius, radius * 2, radius * 2);
        ctx.restore();
      }
    }
  };
  for (let i = 0; i < 34; i += 1) {
    const palette = ['196,190,176', '214,208,194', '172,166,152', '188,178,158', '150,146,134'];
    cloud(
      rng() * size,
      rng() * size,
      size * (0.1 + rng() * 0.3),
      palette[Math.floor(rng() * palette.length)],
      0.06 + rng() * 0.06,
      0.55 + rng() * 0.8,
    );
  }

  // Roller laps: barely-there vertical bands of uneven paint.
  for (let i = 0; i < 9; i += 1) {
    const x = rng() * size;
    const w = 12 + rng() * 46;
    ctx.fillStyle = rng() > 0.5 ? 'rgba(226,220,206,0.004)' : 'rgba(128,122,108,0.005)';
    ctx.fillRect(x, 0, w, size);
  }
  // Yellow-brown water streaks from the slab above.
  for (let i = 0; i < 8; i += 1) {
    const x = rng() * size;
    const w = 14 + rng() * 66;
    const h = size * (0.24 + rng() * 0.6);
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, 'rgba(128,102,62,0.13)');
    gradient.addColorStop(0.45, 'rgba(128,102,62,0.06)');
    gradient.addColorStop(1, 'rgba(128,102,62,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + w, 0);
    ctx.lineTo(x + w - 6, h);
    ctx.lineTo(x + 8, h * 0.92);
    ctx.closePath();
    ctx.fill();
  }

  // Grime rising from the floor and a scuffed kick zone.
  const grime = ctx.createLinearGradient(0, size, 0, size * 0.7);
  grime.addColorStop(0, 'rgba(63,58,48,0.42)');
  grime.addColorStop(0.35, 'rgba(69,63,52,0.2)');
  grime.addColorStop(1, 'rgba(69,63,52,0)');
  ctx.fillStyle = grime;
  ctx.fillRect(0, size * 0.7, size, size * 0.3);
  for (let i = 0; i < 26; i += 1) {
    const x = rng() * size;
    const y = size * (0.74 + rng() * 0.26);
    ctx.strokeStyle = rng() > 0.45 ? 'rgba(48,44,37,0.13)' : 'rgba(210,204,190,0.1)';
    ctx.lineWidth = 1 + rng() * 4;
    ctx.beginPath();
    ctx.moveTo(x - 12, y);
    ctx.lineTo(x + 18 + rng() * 40, y + (rng() - 0.5) * 5);
    ctx.stroke();
  }

  // Splashes of something dark, concentrated near the skirting.
  for (let i = 0; i < 10; i += 1) {
    const x = rng() * size;
    const y = size * (0.58 + rng() * 0.4);
    ctx.fillStyle = `rgba(46,42,34,${0.03 + rng() * 0.06})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 1.4 + rng() * 7, 1 + rng() * 4, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Paint failures: a handful of soft, low-contrast patches. They read as
  // rubbed-through plaster rather than as leaves stuck to the wall.
  for (let i = 0; i < 4; i += 1) {
    const cx = rng() * size;
    const cy = size * (0.34 + rng() * 0.56);
    const radius = 5 + rng() * 9;
    const points = 5 + Math.floor(rng() * 4);
    ctx.beginPath();
    for (let p = 0; p < points; p += 1) {
      const angle = (p / points) * Math.PI * 2;
      const r = radius * (0.55 + rng() * 0.7);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r * 0.8;
      if (p === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(134,128,114,0.2)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(108,102,88,0.14)';
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }

  // Hairline cracks and old fixing holes with rust weeping.
  crack(ctx, size * 0.2, size * 0.14, rng, 120, 'rgba(102,94,78,0.14)', 0.7);
  crack(ctx, size * 0.66, size * 0.42, rng, 90, 'rgba(102,94,78,0.12)', 0.6);
  crack(ctx, size * 0.82, size * 0.72, rng, 70, 'rgba(102,94,78,0.1)', 0.6);
  // A couple of old fixing holes, no rust weeping.
  for (let i = 0; i < 2; i += 1) {
    const x = size * (0.2 + rng() * 0.6);
    const y = size * (0.25 + rng() * 0.5);
    ctx.fillStyle = 'rgba(52,48,40,0.24)';
    ctx.beginPath();
    ctx.arc(x, y, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fine plaster grain and a soft vignette so walls never read flat.
  addGrain(ctx, size, size, rng, 5);
  return canvas;
}

/* --- Painted ceiling: yellowed white, water-stained, sooty --------- */

function ceilingPaintCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#bdb6a6';
  ctx.fillRect(0, 0, size, size);
  blotches(ctx, size, size, rng, 30, ['154,148,132', '204,198,182', '128,122,108', '174,166,146'], size * 0.09, size * 0.34, 0.1);

  // Roller laps and a slight sag between joists.
  for (let i = 0; i < 7; i += 1) {
    const y = (size / 7) * i + rng() * 6;
    ctx.fillStyle = 'rgba(92,86,74,0.05)';
    ctx.fillRect(0, y, size, 1.4);
    ctx.fillStyle = 'rgba(226,220,206,0.05)';
    ctx.fillRect(0, y + 1.4, size, 0.9);
  }

  // Three old leaks: soft brown tide rings with a dark centre.
  for (let i = 0; i < 3; i += 1) {
    const x = size * (0.16 + rng() * 0.68);
    const y = size * (0.16 + rng() * 0.68);
    const radius = size * (0.09 + rng() * 0.12);
    const gradient = ctx.createRadialGradient(x, y, radius * 0.1, x, y, radius);
    gradient.addColorStop(0, 'rgba(74,62,44,0.2)');
    gradient.addColorStop(0.55, 'rgba(120,96,60,0.1)');
    gradient.addColorStop(0.9, 'rgba(134,108,70,0.14)');
    gradient.addColorStop(1, 'rgba(134,108,70,0)');
    ctx.save();
    ctx.filter = 'blur(5px)';
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * (0.72 + rng() * 0.4), rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Soot halo where the old fittings cooked the paint.
  for (const [x, y] of [
    [size * 0.34, size * 0.36],
    [size * 0.68, size * 0.7],
    [size * 0.18, size * 0.78],
  ]) {
    const gradient = ctx.createRadialGradient(x, y, 2, x, y, size * 0.14);
    gradient.addColorStop(0, 'rgba(38,34,28,0.26)');
    gradient.addColorStop(1, 'rgba(38,34,28,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - size * 0.14, y - size * 0.14, size * 0.28, size * 0.28);
  }

  // Peeling paint and cracks.
  for (let i = 0; i < 8; i += 1) {
    const x = rng() * size;
    const y = rng() * size;
    ctx.fillStyle = 'rgba(150,144,128,0.4)';
    ctx.beginPath();
    ctx.ellipse(x, y, 4 + rng() * 14, 2 + rng() * 7, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  crack(ctx, size * 0.12, size * 0.3, rng, 130, 'rgba(66,60,50,0.4)');
  crack(ctx, size * 0.62, size * 0.12, rng, 110, 'rgba(66,60,50,0.34)');

  // Cobweb-ish dust streaks in the corners of every tile.
  for (let i = 0; i < 18; i += 1) {
    const x = rng() * size;
    const y = rng() * size;
    ctx.strokeStyle = `rgba(70,66,56,${0.03 + rng() * 0.05})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rng() - 0.5) * 60, y + (rng() - 0.5) * 60);
    ctx.stroke();
  }

  addGrain(ctx, size, size, rng, 5);
  return canvas;
}

/* --- Yellowed no-smoking sign, torn at the edges ------------------- */

function warningSignCanvas(width, height, rng) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // The plate itself, with a ragged silhouette and a missing bottom-right
  // corner. Everything outside the path stays transparent.
  const w = width;
  const h = height;
  const plate = () => {
    ctx.beginPath();
    ctx.moveTo(w * 0.06, h * 0.04);
    ctx.lineTo(w * 0.94, h * 0.03);
    ctx.lineTo(w * 0.96, h * 0.4);
    ctx.lineTo(w * 0.9, h * 0.7);
    ctx.lineTo(w * 0.93, h * 0.93);
    ctx.lineTo(w * 0.66, h * 0.975);
    ctx.lineTo(w * 0.5, h * 0.95);
    ctx.lineTo(w * 0.34, h * 0.98);
    ctx.lineTo(w * 0.12, h * 0.95);
    ctx.lineTo(w * 0.04, h * 0.7);
    ctx.lineTo(w * 0.07, h * 0.36);
    ctx.closePath();
  };
  ctx.save();
  plate();
  ctx.clip();
  const base = ctx.createLinearGradient(0, 0, w, h);
  base.addColorStop(0, '#d9cba7');
  base.addColorStop(0.5, '#cbbb95');
  base.addColorStop(1, '#b9a67e');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // Age: tide marks, grime fringe, rust bleed around the fixing holes.
  for (let i = 0; i < 14; i += 1) {
    const x = rng() * w;
    const y = rng() * h;
    const r = 6 + rng() * 34;
    const gradient = ctx.createRadialGradient(x, y, 1, x, y, r);
    gradient.addColorStop(0, 'rgba(110,88,54,0.16)');
    gradient.addColorStop(1, 'rgba(110,88,54,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (const [x, y] of [
    [w * 0.16, h * 0.1],
    [w * 0.84, h * 0.08],
    [w * 0.14, h * 0.88],
  ]) {
    ctx.fillStyle = 'rgba(74,58,38,0.5)';
    ctx.beginPath();
    ctx.arc(x, y, 2.6, 0, Math.PI * 2);
    ctx.fill();
    const bleed = ctx.createLinearGradient(0, y, 0, y + 22);
    bleed.addColorStop(0, 'rgba(128,78,38,0.3)');
    bleed.addColorStop(1, 'rgba(128,78,38,0)');
    ctx.fillStyle = bleed;
    ctx.fillRect(x - 2, y, 4, 22);
  }
  const edge = ctx.createLinearGradient(0, 0, 0, h);
  edge.addColorStop(0, 'rgba(60,50,36,0.22)');
  edge.addColorStop(0.16, 'rgba(60,50,36,0)');
  edge.addColorStop(0.8, 'rgba(60,50,36,0)');
  edge.addColorStop(1, 'rgba(60,50,36,0.3)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, w, h);

  // The pictogram: red ring, slash and a cigarette. No letters, no words.
  const cx = w * 0.5;
  const cy = h * 0.42;
  const r = w * 0.27;
  ctx.strokeStyle = 'rgba(150,44,36,0.92)';
  ctx.lineWidth = w * 0.075;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 4);
  ctx.fillStyle = 'rgba(150,44,36,0.92)';
  ctx.fillRect(-r * 0.78, -w * 0.035, r * 1.56, w * 0.07);
  ctx.restore();

  // Cigarette: paper body, filter band, ember, a curl of smoke. It lies
  // flat across the ring; the red slash is drawn on top below.
  ctx.save();
  ctx.translate(cx, cy + h * 0.01);
  ctx.fillStyle = 'rgba(56,50,42,0.86)';
  ctx.fillRect(-r * 0.62, -h * 0.022, r * 0.82, h * 0.044);
  ctx.fillStyle = 'rgba(132,116,90,0.86)';
  ctx.fillRect(r * 0.22, -h * 0.022, r * 0.24, h * 0.044);
  ctx.fillStyle = 'rgba(186,96,42,0.95)';
  ctx.fillRect(-r * 0.66, -h * 0.023, r * 0.07, h * 0.046);
  ctx.strokeStyle = 'rgba(70,62,50,0.55)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-r * 0.68, -h * 0.026);
  ctx.bezierCurveTo(-r * 0.86, -h * 0.1, -r * 0.5, -h * 0.14, -r * 0.68, -h * 0.2);
  ctx.stroke();
  ctx.restore();

  // The slash sits on top of the cigarette, as on a real prohibition sign.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 4);
  ctx.fillStyle = 'rgba(150,44,36,0.94)';
  ctx.fillRect(-r * 0.78, -w * 0.032, r * 1.56, w * 0.064);
  ctx.restore();

  // Torn fibres and a scuffed corner, still inside the plate silhouette.
  for (let i = 0; i < 26; i += 1) {
    const x = rng() * w;
    const y = h * (0.9 + rng() * 0.1);
    ctx.strokeStyle = `rgba(180,168,140,${0.2 + rng() * 0.4})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rng() - 0.5) * 8, y + rng() * 6);
    ctx.stroke();
  }
  const scuff = ctx.createLinearGradient(w * 0.6, h, w, h * 0.6);
  scuff.addColorStop(0, 'rgba(70,58,40,0.35)');
  scuff.addColorStop(1, 'rgba(70,58,40,0)');
  ctx.fillStyle = scuff;
  ctx.fillRect(w * 0.55, h * 0.55, w * 0.45, h * 0.45);

  ctx.restore();
  addGrain(ctx, width, height, rng, 7);
  return canvas;
}

/* --- Small hazard triangle for the bin front (pictogram only) ------ */

function hazardStickerCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  const triangle = (inset, fill) => {
    ctx.beginPath();
    ctx.moveTo(size / 2, size * inset);
    ctx.lineTo(size * (1 - inset * 0.9), size * (1 - inset));
    ctx.lineTo(size * (inset * 0.9), size * (1 - inset));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  triangle(0.06, '#b39a44');
  triangle(0.13, '#20211d');
  triangle(0.17, '#b39a44');
  // Exclamation bar and dot: a pictogram, not a character.
  ctx.fillStyle = '#20211d';
  ctx.fillRect(size * 0.475, size * 0.36, size * 0.05, size * 0.3);
  ctx.beginPath();
  ctx.arc(size * 0.5, size * 0.75, size * 0.032, 0, Math.PI * 2);
  ctx.fill();
  // Wear: scuffs, edge nicks and glue residue.
  for (let i = 0; i < 14; i += 1) {
    ctx.fillStyle = `rgba(40,36,28,${0.06 + rng() * 0.12})`;
    ctx.beginPath();
    ctx.ellipse(rng() * size, rng() * size, 1 + rng() * 5, 1 + rng() * 3, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 9; i += 1) {
    ctx.beginPath();
    ctx.arc(rng() * size, rng() * size, 1 + rng() * 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  return canvas;
}

/* --- CCTV quad feed (four abstract views, no text) ----------------- */

function crtFeedCanvas(width, height, rng) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0d1410';
  ctx.fillRect(0, 0, width, height);

  const cellW = width / 2;
  const cellH = height / 2;
  for (let q = 0; q < 4; q += 1) {
    const x0 = (q % 2) * cellW;
    const y0 = Math.floor(q / 2) * cellH;
    const view = ctx.createLinearGradient(x0, y0, x0, y0 + cellH);
    view.addColorStop(0, '#2c3a31');
    view.addColorStop(0.45, '#1d2a22');
    view.addColorStop(1, '#121a15');
    ctx.fillStyle = view;
    ctx.fillRect(x0, y0, cellW, cellH);

    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, y0, cellW, cellH);
    ctx.clip();
    const horizon = y0 + cellH * (0.52 + rng() * 0.1);
    // Aisle perspective lines.
    ctx.strokeStyle = 'rgba(120,146,126,0.22)';
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x0 + cellW * 0.5 + i * cellW * 0.12, y0 + cellH * 0.08);
      ctx.lineTo(x0 + cellW * 0.5 + i * cellW * 0.42, y0 + cellH);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(138,164,140,0.16)';
    ctx.fillRect(x0 + cellW * 0.06, horizon, cellW * 0.88, cellH * 0.06);

    // Blocky furniture silhouettes: bin, rack, door, camera corner.
    const blocks = [
      { x: 0.1, y: 0.58, w: 0.2, h: 0.3 },
      { x: 0.36, y: 0.44, w: 0.24, h: 0.42 },
      { x: 0.66, y: 0.52, w: 0.14, h: 0.36 },
      { x: 0.76, y: 0.66, w: 0.2, h: 0.24 },
    ];
    for (const block of blocks) {
      ctx.fillStyle = `rgba(96,120,102,${0.1 + rng() * 0.12})`;
      ctx.fillRect(x0 + block.x * cellW, y0 + block.y * cellH, block.w * cellW, block.h * cellH);
      ctx.strokeStyle = 'rgba(160,190,164,0.12)';
      ctx.strokeRect(x0 + block.x * cellW, y0 + block.y * cellH, block.w * cellW, block.h * cellH);
    }

    // Static bands and film grain.
    for (let i = 0; i < 26; i += 1) {
      const y = y0 + rng() * cellH;
      ctx.fillStyle = `rgba(190,220,196,${0.015 + rng() * 0.03})`;
      ctx.fillRect(x0, y, cellW, 1);
    }
    for (let i = 0; i < 160; i += 1) {
      ctx.fillStyle = `rgba(190,220,196,${0.02 + rng() * 0.07})`;
      ctx.fillRect(x0 + rng() * cellW, y0 + rng() * cellH, 1, 1);
    }
    // Scanlines.
    for (let y = 0; y < cellH; y += 3) {
      ctx.fillStyle = 'rgba(4,10,6,0.16)';
      ctx.fillRect(x0, y0 + y, cellW, 1);
    }
    // Vignette and a tiny red tally dot.
    const vignette = ctx.createRadialGradient(x0 + cellW / 2, y0 + cellH / 2, cellH * 0.2, x0 + cellW / 2, y0 + cellH / 2, cellH * 0.8);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vignette;
    ctx.fillRect(x0, y0, cellW, cellH);
    ctx.fillStyle = 'rgba(210,58,42,0.9)';
    ctx.beginPath();
    ctx.arc(x0 + cellW * 0.08, y0 + cellH * 0.09, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(150,170,152,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x0 + 0.5, y0 + 0.5, cellW - 1, cellH - 1);
  }

  // Interlacing and a soft phosphor bloom, baked in.
  for (let y = 0; y < height; y += 2) {
    ctx.fillStyle = 'rgba(2,6,3,0.12)';
    ctx.fillRect(0, y, width, 1);
  }
  return canvas;
}

/* --- The dark puddle (colour + alpha in one map) ------------------- */

function puddleCanvas(width, height, rng) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);

  const blob = (cx, cy, rx, ry, points, wobble) => {
    const list = [];
    for (let i = 0; i < points; i += 1) {
      const angle = (i / points) * Math.PI * 2;
      const r = 1 + (rng() - 0.5) * wobble;
      list.push([cx + Math.cos(angle) * rx * r, cy + Math.sin(angle) * ry * r]);
    }
    return list;
  };
  const path = (list) => {
    ctx.beginPath();
    list.forEach(([x, y], index) => (index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
  };

  const main = blob(width * 0.48, height * 0.5, width * 0.38, height * 0.36, 40, 0.16);
  path(main);
  const liquid = ctx.createRadialGradient(width * 0.46, height * 0.46, 4, width * 0.48, height * 0.5, width * 0.4);
  liquid.addColorStop(0, '#241f1a');
  liquid.addColorStop(0.55, '#2b2720');
  liquid.addColorStop(1, '#353027');
  ctx.save();
  ctx.filter = 'blur(2px)';
  ctx.fillStyle = liquid;
  ctx.fill();
  ctx.restore();

  // A thin, darker tide ring where the liquid has soaked in.
  ctx.save();
  ctx.filter = 'blur(2px)';
  ctx.strokeStyle = 'rgba(42,36,27,0.48)';
  ctx.lineWidth = width * 0.03;
  ctx.stroke();
  ctx.restore();

  // The tail toward the drain: a couple of overlapping lobes.
  for (const [cx, cy, rx, ry] of [
    [width * 0.7, height * 0.72, width * 0.22, height * 0.16],
    [width * 0.82, height * 0.8, width * 0.12, height * 0.09],
  ]) {
    path(blob(cx, cy, rx, ry, 24, 0.2));
    const tail = ctx.createRadialGradient(cx, cy, 2, cx, cy, rx);
    tail.addColorStop(0, '#2a251f');
    tail.addColorStop(1, 'rgba(50,45,37,0.92)');
    ctx.save();
    ctx.filter = 'blur(2px)';
    ctx.fillStyle = tail;
    ctx.fill();
    ctx.strokeStyle = 'rgba(42,36,27,0.38)';
    ctx.lineWidth = width * 0.02;
    ctx.stroke();
    ctx.restore();
  }

  // Soft sky reflection across the upper edge of the liquid.
  ctx.save();
  ctx.filter = 'blur(4px)';
  const sheen = ctx.createLinearGradient(0, height * 0.18, 0, height * 0.55);
  sheen.addColorStop(0, 'rgba(170,176,160,0)');
  sheen.addColorStop(0.55, 'rgba(170,176,160,0.12)');
  sheen.addColorStop(1, 'rgba(170,176,160,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(width * 0.18, height * 0.18, width * 0.56, height * 0.4);
  ctx.restore();
  // Two broad oil sheen bands, no drawn lines.
  for (const [cy, alpha] of [
    [height * 0.38, 0.05],
    [height * 0.5, 0.04],
  ]) {
    ctx.save();
    ctx.filter = 'blur(3px)';
    const band = ctx.createLinearGradient(0, cy - height * 0.04, 0, cy + height * 0.04);
    band.addColorStop(0, 'rgba(150,156,140,0)');
    band.addColorStop(0.5, `rgba(150,156,140,${alpha})`);
    band.addColorStop(1, 'rgba(150,156,140,0)');
    ctx.fillStyle = band;
    ctx.fillRect(width * 0.2, cy - height * 0.05, width * 0.5, height * 0.1);
    ctx.restore();
  }
  for (let i = 0; i < 9; i += 1) {
    ctx.fillStyle = `rgba(140,154,136,${0.08 + rng() * 0.1})`;
    ctx.beginPath();
    ctx.arc(width * (0.2 + rng() * 0.5), height * (0.3 + rng() * 0.4), 1 + rng() * 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  return canvas;
}

/* --- Glossy black bin-liner plastic ------------------------------- */

function bagPlasticCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1c2023';
  ctx.fillRect(0, 0, size, size);

  // Broad stretch folds.
  for (let i = 0; i < 30; i += 1) {
    const x = rng() * size;
    const y = rng() * size;
    const length = size * (0.15 + rng() * 0.5);
    const angle = rng() * Math.PI;
    ctx.strokeStyle = rng() > 0.5 ? 'rgba(82,92,98,0.4)' : 'rgba(4,5,6,0.5)';
    ctx.lineWidth = 1.5 + rng() * 4.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + Math.cos(angle) * length * 0.5 + (rng() - 0.5) * 24,
      y + Math.sin(angle) * length * 0.5 + (rng() - 0.5) * 24,
      x + Math.cos(angle) * length,
      y + Math.sin(angle) * length,
    );
    ctx.stroke();
    // A hard specular crease beside the fold.
    ctx.strokeStyle = 'rgba(160,176,184,0.22)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 2);
    ctx.quadraticCurveTo(
      x + Math.cos(angle) * length * 0.5 + 6,
      y + Math.sin(angle) * length * 0.5 + 6,
      x + Math.cos(angle) * length + 3,
      y + Math.sin(angle) * length + 3,
    );
    ctx.stroke();
  }
  // Crushed highlights.
  for (let i = 0; i < 46; i += 1) {
    ctx.fillStyle = `rgba(170,186,194,${0.06 + rng() * 0.12})`;
    ctx.beginPath();
    ctx.ellipse(rng() * size, rng() * size, 1 + rng() * 6, 0.6 + rng() * 2, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  addGrain(ctx, size, size, rng, 4);
  return canvas;
}

/* --- Stained concrete floor (covers the whole 4.32 × 5.40 m room) -- */

function floorConcreteCanvas(width, height, rng) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#817e78';
  ctx.fillRect(0, 0, width, height);

  blotches(ctx, width, height, rng, 54, ['92,89,83', '132,128,119', '108,102,92', '64,62,57', '126,114,96'], 18, 160, 0.1);

  // Oil, water and old paint stains.
  for (let i = 0; i < 18; i += 1) {
    const x = rng() * width;
    const y = rng() * height;
    const r = 20 + rng() * 110;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    const dark = rng() > 0.35;
    gradient.addColorStop(0, dark ? 'rgba(36,34,29,0.34)' : 'rgba(78,68,54,0.18)');
    gradient.addColorStop(0.7, dark ? 'rgba(42,39,34,0.14)' : 'rgba(84,76,60,0.08)');
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

  // The monitor stack: a weak green bloom high in one corner.
  const monitor = ctx.createRadialGradient(width * 0.1, height * 0.3, 2, width * 0.1, height * 0.3, 46);
  monitor.addColorStop(0, 'rgba(126,196,150,0.45)');
  monitor.addColorStop(0.45, 'rgba(96,164,120,0.16)');
  monitor.addColorStop(1, 'rgba(96,164,120,0)');
  ctx.fillStyle = monitor;
  ctx.fillRect(0, height * 0.12, width * 0.3, height * 0.4);

  // The strip under the door: a narrow cool line low on one side.
  const strip = ctx.createLinearGradient(width * 0.3, 0, width * 0.5, 0);
  strip.addColorStop(0, 'rgba(198,222,220,0)');
  strip.addColorStop(0.5, 'rgba(214,234,230,0.4)');
  strip.addColorStop(1, 'rgba(198,222,220,0)');
  ctx.fillStyle = strip;
  ctx.fillRect(width * 0.3, height * 0.84, width * 0.2, height * 0.05);
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

  const wallPaint = makeTexture(wallPaintCanvas(512, rng), { anisotropy });
  const ceilingPaint = makeTexture(ceilingPaintCanvas(512, rng), { anisotropy });
  // One non-repeating map across the whole 4.32 × 5.40 m slab.
  const floorConcrete = makeTexture(floorConcreteCanvas(512, 640, rng), { anisotropy, wrap: false });
  const warningSign = makeTexture(warningSignCanvas(256, 312, rng), { anisotropy: 4, wrap: false });
  const hazardSticker = makeTexture(hazardStickerCanvas(128, rng), { anisotropy: 2, wrap: false });
  const crtFeed = makeTexture(crtFeedCanvas(512, 384, rng), { anisotropy: 2, wrap: false });
  const puddle = makeTexture(puddleCanvas(256, 192, rng), { anisotropy: 4, wrap: false });
  const bagPlastic = makeTexture(bagPlasticCanvas(256, rng), { anisotropy });
  const steel = makeTexture(steelCanvas(256, rng), { anisotropy });
  const rust = makeTexture(rustCanvas(256, rng), { anisotropy });
  const wood = makeTexture(woodCanvas(256, rng), { anisotropy });
  const cardboard = makeTexture(cardboardCanvas(256, rng), { anisotropy });
  const burlap = makeTexture(burlapCanvas(256, rng), { anisotropy });
  const cloth = makeTexture(clothCanvas(256, rng), { anisotropy });
  const rope = makeTexture(ropeCanvas(128, rng), { anisotropy: 4 });
  const paper = makeTexture(paperCanvas(256, rng), { anisotropy });
  const label = makeTexture(labelCanvas(128, rng), { anisotropy: 2, wrap: false });

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
    wallPaint,
    ceilingPaint,
    floorConcrete,
    warningSign,
    hazardSticker,
    crtFeed,
    puddle,
    bagPlastic,
    steel,
    rust,
    wood,
    cardboard,
    burlap,
    cloth,
    rope,
    paper,
    label,
    contactShadow,
    glow,
    dust,
    environment,
  };
}
