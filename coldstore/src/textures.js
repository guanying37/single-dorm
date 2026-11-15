import * as THREE from 'three';
import { mulberry32 } from '../../dining/src/utils.js';

/* ------------------------------------------------------------------ *
 * Procedural cold-store surfaces.
 *
 * Everything is drawn in-browser: white brushed insulation panel skins,
 * PU ceiling panels, an aluminium anti-slip deck, brushed stainless,
 * cardboard, raw meat, produce, cling film, condensation frost, blank
 * labels, a phosphor CCTV feed, a cold mist sprite and the reflection
 * environment. No bitmaps, no network requests, no readable text.
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

/* --- White brushed insulation panel skin -------------------------- *
 * One map covers a 0.9 m panel module. The vertical grain reads as
 * brushed steel under the cold ceiling light; the faint edge gradients
 * give the flat sandwich core a little curvature. */

function wallPanelCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#eef1f0';
  ctx.fillRect(0, 0, size, size);

  // Soft broad sheen so a flat panel does not read as paper.
  const sheen = ctx.createLinearGradient(0, 0, size, size * 0.45);
  sheen.addColorStop(0, 'rgba(255,255,255,0.5)');
  sheen.addColorStop(0.4, 'rgba(246,249,248,0.12)');
  sheen.addColorStop(0.75, 'rgba(214,222,221,0.1)');
  sheen.addColorStop(1, 'rgba(255,255,255,0.3)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, size, size);

  // Vertical brushing.
  for (let i = 0; i < 900; i += 1) {
    const x = rng() * size;
    const length = size * (0.15 + rng() * 0.85);
    const y = rng() * size;
    const light = rng() > 0.5;
    ctx.strokeStyle = light
      ? `rgba(255,255,255,${0.05 + rng() * 0.12})`
      : `rgba(174,184,183,${0.03 + rng() * 0.08})`;
    ctx.lineWidth = 0.6 + rng() * 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rng() - 0.5) * 2.2, y + length);
    ctx.stroke();
  }

  // Sparse handling scuffs near the panel edges.
  for (let i = 0; i < 26; i += 1) {
    const x = rng() < 0.5 ? 4 + rng() * 18 : size - 4 - rng() * 22;
    const y = rng() * size;
    ctx.strokeStyle = `rgba(160,170,170,${0.05 + rng() * 0.1})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rng() - 0.5) * 10, y + 8 + rng() * 44);
    ctx.stroke();
  }

  // Very soft edge falloff: the skin folds over the core at the joint.
  const edge = ctx.createLinearGradient(0, 0, 8, 0);
  edge.addColorStop(0, 'rgba(150,161,161,0.1)');
  edge.addColorStop(1, 'rgba(150,161,161,0)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, 10, size);
  const edgeR = ctx.createLinearGradient(size, 0, size - 8, 0);
  edgeR.addColorStop(0, 'rgba(150,161,161,0.08)');
  edgeR.addColorStop(1, 'rgba(150,161,161,0)');
  ctx.fillStyle = edgeR;
  ctx.fillRect(size - 10, 0, 10, size);

  addGrain(ctx, size, size, rng, 3);
  return canvas;
}

/* --- PU ceiling panel skin ---------------------------------------- */

function ceilingPanelCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f1f2ec';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 2400; i += 1) {
    const x = rng() * size;
    const y = rng() * size;
    const radius = 0.6 + rng() * 2.2;
    ctx.fillStyle = rng() > 0.5 ? 'rgba(255,255,255,0.16)' : 'rgba(198,203,195,0.12)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Panel edge fold shadow, one 1.2 m module per map.
  ctx.fillStyle = 'rgba(176,182,174,0.18)';
  ctx.fillRect(0, 0, 5, size);
  ctx.fillRect(0, 0, size, 5);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(5, 5, 2, size - 5);
  ctx.fillRect(5, 5, size - 5, 2);
  addGrain(ctx, size, size, rng, 3);
  return canvas;
}

/* --- Aluminium anti-slip deck (five-bar) --------------------------- *
 * One map = 0.6 × 0.6 m. Elongated ribs run in two directions so the
 * cast ceiling shadows catch them at every camera angle. */

function floorPlateCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');

  const base = ctx.createLinearGradient(0, 0, size, size);
  base.addColorStop(0, '#b7bec0');
  base.addColorStop(0.5, '#a7aeb1');
  base.addColorStop(1, '#9aa2a5');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, size - 2, size - 2);

  const cell = size / 4;
  const rib = (cx, cy, angle, length, width) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    // Shadow side.
    ctx.fillStyle = 'rgba(74,82,85,0.42)';
    ctx.fillRect(-length / 2, -width / 2, length, width);
    // Raised face.
    const face = ctx.createLinearGradient(0, -width / 2, 0, width / 2);
    face.addColorStop(0, 'rgba(247,251,252,0.95)');
    face.addColorStop(0.55, 'rgba(219,226,228,0.9)');
    face.addColorStop(1, 'rgba(150,159,162,0.75)');
    ctx.fillStyle = face;
    ctx.fillRect(-length / 2 + 1.5, -width / 2 + 1.5, length - 3, width - 3);
    ctx.restore();
  };

  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const cx = col * cell + cell / 2;
      const cy = row * cell + cell / 2;
      const angle = (row + col) % 2 === 0 ? -Math.PI / 4 : Math.PI / 4;
      rib(cx, cy - cell * 0.2, angle, cell * 0.52, cell * 0.11);
      rib(cx, cy + cell * 0.2, angle, cell * 0.52, cell * 0.11);
    }
  }

  // Cleaning swirls, boot scuffs and a few shallow dents.
  for (let i = 0; i < 60; i += 1) {
    ctx.strokeStyle = rng() > 0.5 ? 'rgba(255,255,255,0.1)' : 'rgba(92,101,104,0.12)';
    ctx.lineWidth = 0.7 + rng() * 1.6;
    ctx.beginPath();
    const x = rng() * size;
    const y = rng() * size;
    ctx.arc(x, y, 8 + rng() * 42, rng() * Math.PI, rng() * Math.PI + 0.8);
    ctx.stroke();
  }
  for (let i = 0; i < 90; i += 1) {
    ctx.fillStyle = `rgba(74,82,85,${0.02 + rng() * 0.06})`;
    ctx.fillRect(rng() * size, rng() * size, 1 + rng() * 5, 1 + rng() * 3);
  }
  addGrain(ctx, size, size, rng, 6);
  return canvas;
}

/* --- Brushed stainless -------------------------------------------- */

function steelCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  const base = ctx.createLinearGradient(0, 0, 0, size);
  base.addColorStop(0, '#e9eef0');
  base.addColorStop(0.5, '#dfe5e8');
  base.addColorStop(1, '#e6ebee');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 2600; i += 1) {
    const y = rng() * size;
    const length = size * (0.08 + rng() * 0.7);
    const x = rng() * size;
    ctx.strokeStyle = rng() > 0.48
      ? `rgba(255,255,255,${0.04 + rng() * 0.16})`
      : `rgba(150,161,166,${0.03 + rng() * 0.12})`;
    ctx.lineWidth = 0.5 + rng() * 1.3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + length, y + (rng() - 0.5) * 1.5);
    ctx.stroke();
  }
  addGrain(ctx, size, size, rng, 4);
  return canvas;
}

/* --- Kraft cardboard ---------------------------------------------- */

function cardboardCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#c2a075';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 70; i += 1) {
    ctx.strokeStyle = `rgba(150,116,78,${0.05 + rng() * 0.12})`;
    ctx.lineWidth = 0.6 + rng() * 1.2;
    ctx.beginPath();
    const y = rng() * size;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(size * 0.3, y + (rng() - 0.5) * 8, size * 0.7, y + (rng() - 0.5) * 8, size, y + (rng() - 0.5) * 4);
    ctx.stroke();
  }
  for (let i = 0; i < 900; i += 1) {
    ctx.fillStyle = rng() > 0.5 ? 'rgba(255,244,226,0.18)' : 'rgba(126,98,66,0.16)';
    ctx.fillRect(rng() * size, rng() * size, 1.4, 1.4);
  }
  // Tape strip across the lid fold.
  ctx.fillStyle = 'rgba(206,180,132,0.55)';
  ctx.fillRect(0, size * 0.46, size, size * 0.08);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(0, size * 0.46, size, 2);
  addGrain(ctx, size, size, rng, 8);
  return canvas;
}

/* --- Raw meat ------------------------------------------------------ */

function meatCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#72211f';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 55; i += 1) {
    const x = rng() * size;
    const y = rng() * size;
    const radius = size * (0.05 + rng() * 0.14);
    const blob = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const dark = rng() > 0.42;
    blob.addColorStop(0, dark ? 'rgba(66,20,22,0.6)' : 'rgba(150,62,52,0.55)');
    blob.addColorStop(1, 'rgba(100,34,32,0)');
    ctx.fillStyle = blob;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  // Fine intramuscular fat: thin, low contrast, never reading as noodles.
  for (let i = 0; i < 90; i += 1) {
    ctx.strokeStyle = `rgba(226,204,190,${0.05 + rng() * 0.12})`;
    ctx.lineWidth = 0.5 + rng() * 1.1;
    ctx.beginPath();
    const x = rng() * size;
    const y = rng() * size;
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(
      x + (rng() - 0.5) * 26,
      y + (rng() - 0.5) * 26,
      x + (rng() - 0.5) * 44,
      y + (rng() - 0.5) * 40,
      x + (rng() - 0.5) * 60,
      y + (rng() - 0.5) * 34,
    );
    ctx.stroke();
  }
  // Small fat flecks and a wet sheen.
  for (let i = 0; i < 40; i += 1) {
    ctx.fillStyle = `rgba(232,214,200,${0.12 + rng() * 0.2})`;
    ctx.beginPath();
    ctx.arc(rng() * size, rng() * size, 0.8 + rng() * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  const sheen = ctx.createLinearGradient(0, 0, size, size);
  sheen.addColorStop(0, 'rgba(255,240,235,0.12)');
  sheen.addColorStop(0.45, 'rgba(255,240,235,0)');
  sheen.addColorStop(1, 'rgba(30,8,8,0.18)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, size, size);
  addGrain(ctx, size, size, rng, 6);
  return canvas;
}

/* --- Produce: greens, carrots, pale roots -------------------------- */

function produceCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#4d6740';
  ctx.fillRect(0, 0, size, size);

  // Broad cabbage / lettuce wedges.
  const leaf = (cx, cy, radius, light) => {
    ctx.beginPath();
    for (let i = 0; i <= 12; i += 1) {
      const angle = (i / 12) * Math.PI * 2;
      const r = radius * (0.66 + rng() * 0.4);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r * 0.82;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = light
      ? `rgba(${132 + rng() * 30}, ${172 + rng() * 30}, ${104 + rng() * 26},0.95)`
      : `rgba(${72 + rng() * 26}, ${110 + rng() * 34}, ${58 + rng() * 22},0.95)`;
    ctx.fill();
    // Pale vein through the wedge.
    ctx.strokeStyle = 'rgba(226,238,204,0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + radius * 0.7, cy - radius * 0.2);
    ctx.stroke();
  };
  for (let i = 0; i < 16; i += 1) {
    leaf(rng() * size, rng() * size, size * (0.08 + rng() * 0.1), rng() > 0.45);
  }

  // Carrot sticks and batons.
  for (let i = 0; i < 10; i += 1) {
    ctx.save();
    ctx.translate(rng() * size, rng() * size);
    ctx.rotate(rng() * Math.PI);
    const w = size * (0.13 + rng() * 0.1);
    const h = size * (0.032 + rng() * 0.02);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(246,158,58,1)');
    grad.addColorStop(1, 'rgba(196,102,32,1)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  // Pale onion / daikon discs.
  for (let i = 0; i < 9; i += 1) {
    const x = rng() * size;
    const y = rng() * size;
    const r = size * (0.045 + rng() * 0.03);
    const disc = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
    disc.addColorStop(0, 'rgba(247,244,226,1)');
    disc.addColorStop(0.7, 'rgba(233,228,202,0.95)');
    disc.addColorStop(1, 'rgba(206,200,172,0.9)');
    ctx.fillStyle = disc;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(196,190,160,0.5)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.6, 0, Math.PI * 2);
    ctx.stroke();
  }
  // A few dark pepper strips.
  for (let i = 0; i < 7; i += 1) {
    ctx.save();
    ctx.translate(rng() * size, rng() * size);
    ctx.rotate(rng() * Math.PI);
    ctx.fillStyle = 'rgba(42,84,44,0.95)';
    ctx.fillRect(0, 0, size * (0.1 + rng() * 0.06), size * 0.024);
    ctx.restore();
  }
  addGrain(ctx, size, size, rng, 4);
  return canvas;
}

/* --- Cling film ---------------------------------------------------- */

function filmCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  for (let i = 0; i < 90; i += 1) {
    ctx.strokeStyle = rng() > 0.45
      ? `rgba(255,255,255,${0.5 + rng() * 0.5})`
      : `rgba(196,214,218,${0.2 + rng() * 0.26})`;
    ctx.lineWidth = 0.8 + rng() * 2.6;
    ctx.beginPath();
    const x = rng() * size;
    const y = rng() * size;
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(
      x + (rng() - 0.5) * size * 0.4,
      y + (rng() - 0.5) * size * 0.2,
      x + (rng() - 0.5) * size * 0.5,
      y + (rng() - 0.5) * size * 0.45,
      x + (rng() - 0.3) * size * 0.7,
      y + (rng() - 0.5) * size * 0.3,
    );
    ctx.stroke();
  }
  return canvas;
}

/* --- Condensation frost / droplets --------------------------------- */

function frostCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  // Fine ice crystal haze.
  for (let i = 0; i < 700; i += 1) {
    ctx.fillStyle = `rgba(255,255,255,${0.02 + rng() * 0.08})`;
    ctx.fillRect(rng() * size, rng() * size, 1 + rng() * 2.4, 1 + rng() * 1.6);
  }
  // Droplets: bright rim, dim centre, tiny shadow underneath.
  for (let i = 0; i < 130; i += 1) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 1.4 + rng() * 4.6;
    const drop = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, 0, x, y, r);
    drop.addColorStop(0, 'rgba(255,255,255,0.92)');
    drop.addColorStop(0.45, 'rgba(232,244,248,0.4)');
    drop.addColorStop(1, 'rgba(206,224,230,0.05)');
    ctx.fillStyle = drop;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(120,140,148,0.14)';
    ctx.beginPath();
    ctx.arc(x + r * 0.25, y + r * 0.35, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
  // Frost creeping in from one corner.
  for (let i = 0; i < 26; i += 1) {
    const x = rng() * size * 0.45;
    const y = rng() * size * 0.45;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 0.6;
    for (let k = 0; k < 5; k += 1) {
      const angle = (k / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * (3 + rng() * 8), y + Math.sin(angle) * (3 + rng() * 8));
      ctx.stroke();
    }
  }
  return canvas;
}

/* --- Blank food label ---------------------------------------------- */

function labelCanvas(size, rng) {
  const canvas = createCanvas(size, size * 0.6);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f7f5ee';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(168,168,158,0.6)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
  // Abstract bars and a colour block: deliberately no letters or numerals.
  ctx.fillStyle = 'rgba(58,66,70,0.82)';
  ctx.fillRect(canvas.width * 0.1, canvas.height * 0.22, canvas.width * 0.42, 2.2);
  ctx.fillRect(canvas.width * 0.1, canvas.height * 0.42, canvas.width * 0.58, 1.6);
  ctx.fillRect(canvas.width * 0.1, canvas.height * 0.6, canvas.width * 0.3, 1.6);
  ctx.fillStyle = 'rgba(180,64,56,0.85)';
  ctx.fillRect(canvas.width * 0.62, canvas.height * 0.18, canvas.width * 0.1, canvas.height * 0.16);
  ctx.fillStyle = 'rgba(56,96,132,0.85)';
  ctx.fillRect(canvas.width * 0.75, canvas.height * 0.18, canvas.width * 0.08, canvas.height * 0.16);
  for (let i = 0; i < 8; i += 1) {
    ctx.fillStyle = i % 2 ? 'rgba(60,68,72,0.7)' : 'rgba(247,245,238,1)';
    ctx.fillRect(canvas.width * (0.12 + i * 0.022), canvas.height * 0.72, canvas.width * 0.012, canvas.height * 0.16);
  }
  addGrain(ctx, canvas.width, canvas.height, rng, 3);
  return canvas;
}

/* --- Light / shadow helper maps ------------------------------------ */

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
  const shell = ctx.createLinearGradient(0, 0, 0, height);
  shell.addColorStop(0, '#f4fbff');
  shell.addColorStop(0.2, '#dbe9ef');
  shell.addColorStop(0.5, '#aebfc6');
  shell.addColorStop(0.76, '#7d8d94');
  shell.addColorStop(1, '#48545a');
  ctx.fillStyle = shell;
  ctx.fillRect(0, 0, width, height);

  // Two hard cold led strips on the ceiling.
  for (const x of [0.3, 0.72]) {
    const strip = ctx.createLinearGradient(width * x - 40, 0, width * x + 40, 0);
    strip.addColorStop(0, 'rgba(255,255,255,0)');
    strip.addColorStop(0.5, 'rgba(255,255,255,0.95)');
    strip.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = strip;
    ctx.fillRect(width * x - 42, 10, 84, 16);
  }
  // Dark shelf bays either side.
  for (const x of [0.06, 0.94]) {
    ctx.fillStyle = 'rgba(34,44,48,0.35)';
    ctx.fillRect(width * x - 26, height * 0.2, 52, height * 0.6);
  }
  // Phosphor green spill from the wall monitor, low and to one side.
  const green = ctx.createRadialGradient(width * 0.16, height * 0.68, 2, width * 0.16, height * 0.68, 90);
  green.addColorStop(0, 'rgba(120,255,170,0.16)');
  green.addColorStop(1, 'rgba(120,255,170,0)');
  ctx.fillStyle = green;
  ctx.fillRect(0, height * 0.3, width * 0.4, height * 0.7);
  // Warm heater line by the door.
  const warm = ctx.createLinearGradient(width * 0.86, 0, width * 0.98, 0);
  warm.addColorStop(0, 'rgba(255,168,96,0)');
  warm.addColorStop(0.5, 'rgba(255,168,96,0.2)');
  warm.addColorStop(1, 'rgba(255,168,96,0)');
  ctx.fillStyle = warm;
  ctx.fillRect(width * 0.84, height * 0.34, width * 0.16, height * 0.4);
  return canvas;
}

/* --- Abstract CCTV feed -------------------------------------------- */

function drawScanlines(ctx, width, height, strength = 0.18) {
  for (let y = 0; y < height; y += 3) {
    ctx.fillStyle = `rgba(0, 0, 0, ${strength})`;
    ctx.fillRect(0, y, width, 1);
  }
  for (let y = 0; y < height; y += 11) {
    ctx.fillStyle = 'rgba(205,255,214,0.04)';
    ctx.fillRect(0, y, width, 1);
  }
}

function drawVignette(ctx, width, height) {
  const gradient = ctx.createRadialGradient(width / 2, height / 2, height * 0.16, width / 2, height / 2, height * 0.86);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.68, 'rgba(0,8,3,0.2)');
  gradient.addColorStop(1, 'rgba(0,5,2,0.66)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/* An analogue dial drawn without numerals: coloured arc, tick marks and
 * a needle. Used for the temperature / humidity gauges on the feed. */
function drawDial(ctx, cx, cy, radius, rng, hue, value) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(8,24,14,0.9)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(168,232,182,0.5)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  const start = Math.PI * 0.8;
  const end = Math.PI * 2.2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.78, start, start + (end - start) * 0.62);
  ctx.strokeStyle = hue;
  ctx.lineWidth = radius * 0.16;
  ctx.stroke();

  for (let i = 0; i <= 10; i += 1) {
    const angle = start + ((end - start) * i) / 10;
    const inner = radius * (i % 5 === 0 ? 0.58 : 0.66);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * radius * 0.74, cy + Math.sin(angle) * radius * 0.74);
    ctx.strokeStyle = 'rgba(198,248,208,0.55)';
    ctx.lineWidth = i % 5 === 0 ? 1.6 : 0.9;
    ctx.stroke();
  }

  const needle = start + (end - start) * value;
  ctx.beginPath();
  ctx.moveTo(cx - Math.cos(needle) * radius * 0.16, cy - Math.sin(needle) * radius * 0.16);
  ctx.lineTo(cx + Math.cos(needle) * radius * 0.66, cy + Math.sin(needle) * radius * 0.66);
  ctx.strokeStyle = 'rgba(255,236,190,0.92)';
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.09, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,236,190,0.95)';
  ctx.fill();
  ctx.restore();
  void rng;
}

function coldView(ctx, x, y, width, height, rng, variant) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();

  ctx.fillStyle = '#07130c';
  ctx.fillRect(x, y, width, height);
  const back = ctx.createLinearGradient(x, y, x, y + height);
  back.addColorStop(0, '#486b57');
  back.addColorStop(0.5, '#243b2e');
  back.addColorStop(1, '#0d1c13');
  ctx.fillStyle = back;
  ctx.fillRect(x, y, width, height);

  ctx.filter = 'blur(3.4px)';
  // Two bright ceiling lamps.
  for (let i = 0; i < 2; i += 1) {
    ctx.fillStyle = 'rgba(205,242,214,0.34)';
    ctx.fillRect(x + width * (0.3 + i * 0.34), y + height * 0.06, width * 0.1, height * 0.05);
  }

  if (variant === 0) {
    // Inside view: shelf runs converging on the far end, trays on tiers.
    for (const side of [-1, 1]) {
      const inner = side < 0 ? x + width * 0.06 : x + width * 0.94;
      ctx.fillStyle = 'rgba(10,22,15,0.9)';
      ctx.fillRect(inner - width * 0.11, y + height * 0.18, width * 0.22, height * 0.7);
      for (let tier = 0; tier < 4; tier += 1) {
        const ty = y + height * (0.26 + tier * 0.17);
        ctx.fillStyle = 'rgba(168,214,178,0.34)';
        ctx.fillRect(inner - width * 0.1, ty, width * 0.2, height * 0.02);
        ctx.fillStyle = 'rgba(202,240,210,0.28)';
        for (let item = 0; item < 3; item += 1) {
          ctx.fillRect(inner - width * 0.08 + item * width * 0.055, ty - height * 0.045, width * 0.04, height * 0.045);
        }
      }
    }
    // Evaporator silhouette and the aisle deck.
    ctx.fillStyle = 'rgba(8,20,13,0.94)';
    ctx.fillRect(x + width * 0.2, y + height * 0.12, width * 0.26, height * 0.14);
    ctx.fillStyle = 'rgba(184,226,194,0.3)';
    ctx.fillRect(x + width * 0.18, y + height * 0.82, width * 0.64, height * 0.12);
  } else {
    // Door view: the insulated leaf with the warm heater frame.
    ctx.fillStyle = 'rgba(14,26,19,0.95)';
    ctx.fillRect(x + width * 0.2, y + height * 0.16, width * 0.6, height * 0.74);
    ctx.fillStyle = 'rgba(196,240,204,0.22)';
    ctx.fillRect(x + width * 0.23, y + height * 0.2, width * 0.54, height * 0.05);
    ctx.fillStyle = 'rgba(255,178,110,0.24)';
    ctx.fillRect(x + width * 0.18, y + height * 0.16, width * 0.02, height * 0.74);
    ctx.fillRect(x + width * 0.8, y + height * 0.16, width * 0.02, height * 0.74);
    ctx.fillStyle = 'rgba(212,250,219,0.2)';
    ctx.fillRect(x + width * 0.17, y + height * 0.9, width * 0.66, height * 0.05);
  }

  // Sensor noise and a soft phosphor glow.
  for (let i = 0; i < 1500; i += 1) {
    ctx.fillStyle = rng() > 0.5 ? 'rgba(210,255,218,0.05)' : 'rgba(0,0,0,0.1)';
    ctx.fillRect(x + rng() * width, y + rng() * height, 1, 1 + rng() * 1.4);
  }
  const glow = ctx.createRadialGradient(
    x + width * 0.5,
    y + height * 0.4,
    2,
    x + width * 0.5,
    y + height * 0.4,
    width * 0.62,
  );
  glow.addColorStop(0, 'rgba(186,240,198,0.16)');
  glow.addColorStop(1, 'rgba(186,240,198,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, width, height);
  ctx.filter = 'none';
  ctx.restore();
}

function cctvCanvas(width, height) {
  const rng = mulberry32(0x2c0d57);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#040a06';
  ctx.fillRect(0, 0, width, height);

  // Split feed: cold-room camera on the left, door camera on the right.
  coldView(ctx, 3, 3, width / 2 - 5, height * 0.62, rng, 0);
  coldView(ctx, width / 2 + 2, 3, width / 2 - 5, height * 0.62, rng, 1);
  ctx.fillStyle = 'rgba(175,225,183,0.32)';
  ctx.fillRect(width / 2 - 1, 0, 2, height);

  // Two analogue gauges along the bottom (temperature, humidity).
  drawDial(ctx, width * 0.28, height * 0.8, height * 0.13, rng, 'rgba(120,196,255,0.55)', 0.26);
  drawDial(ctx, width * 0.72, height * 0.8, height * 0.13, rng, 'rgba(255,150,120,0.55)', 0.42);

  // A blank status strip with three indicator lamps, no characters.
  ctx.fillStyle = 'rgba(5,14,8,0.9)';
  ctx.fillRect(width * 0.42, height * 0.72, width * 0.16, height * 0.06);
  ctx.fillStyle = 'rgba(150,232,166,0.75)';
  ctx.fillRect(width * 0.44, height * 0.742, 3, 3);
  ctx.fillStyle = 'rgba(255,196,120,0.7)';
  ctx.fillRect(width * 0.47, height * 0.742, 3, 3);
  ctx.fillStyle = 'rgba(150,232,166,0.4)';
  ctx.fillRect(width * 0.5, height * 0.742, 3, 3);

  drawScanlines(ctx, width, height, 0.2);
  drawVignette(ctx, width, height);
  return canvas;
}

function scanBandCanvas() {
  const canvas = createCanvas(64, 32);
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 32);
  gradient.addColorStop(0, 'rgba(225,255,230,0)');
  gradient.addColorStop(0.42, 'rgba(225,255,230,0.02)');
  gradient.addColorStop(0.5, 'rgba(225,255,230,0.5)');
  gradient.addColorStop(0.58, 'rgba(225,255,230,0.02)');
  gradient.addColorStop(1, 'rgba(225,255,230,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 32);
  return canvas;
}

export function createTextureSet(maxAnisotropy = 8) {
  const anisotropy = Math.min(8, maxAnisotropy || 8);
  const rng = mulberry32(0x1cec01d);

  const wallPanel = makeTexture(wallPanelCanvas(512, rng), { anisotropy });
  const ceilingPanel = makeTexture(ceilingPanelCanvas(512, rng), { anisotropy });
  const floorPlate = makeTexture(floorPlateCanvas(512, rng), { anisotropy });
  const steel = makeTexture(steelCanvas(512, rng), { anisotropy });
  const cardboard = makeTexture(cardboardCanvas(256, rng), { anisotropy });
  const meat = makeTexture(meatCanvas(256, rng), { anisotropy });
  const produce = makeTexture(produceCanvas(256, rng), { anisotropy });
  const film = makeTexture(filmCanvas(256, rng), { anisotropy });
  const frost = makeTexture(frostCanvas(256, rng), { anisotropy });
  const label = makeTexture(labelCanvas(128, rng), { anisotropy: 2 });

  const contactShadow = new THREE.CanvasTexture(
    radialCanvas(128, [
      [0, 'rgba(4, 9, 10, 0.5)'],
      [0.42, 'rgba(4, 9, 10, 0.28)'],
      [0.74, 'rgba(4, 9, 10, 0.09)'],
      [1, 'rgba(4, 9, 10, 0)'],
    ]),
  );
  contactShadow.colorSpace = THREE.NoColorSpace;
  contactShadow.needsUpdate = true;

  const glow = new THREE.CanvasTexture(
    radialCanvas(256, [
      [0, 'rgba(246, 254, 255, 0.95)'],
      [0.2, 'rgba(230, 248, 255, 0.52)'],
      [0.55, 'rgba(214, 240, 255, 0.16)'],
      [1, 'rgba(210, 238, 255, 0)'],
    ]),
  );
  glow.colorSpace = THREE.SRGBColorSpace;
  glow.needsUpdate = true;

  const mist = new THREE.CanvasTexture(
    radialCanvas(64, [
      [0, 'rgba(255, 255, 255, 0.85)'],
      [0.35, 'rgba(240, 250, 255, 0.35)'],
      [0.7, 'rgba(226, 244, 252, 0.08)'],
      [1, 'rgba(226, 244, 252, 0)'],
    ]),
  );
  mist.colorSpace = THREE.SRGBColorSpace;
  mist.needsUpdate = true;

  const environment = new THREE.CanvasTexture(environmentCanvas());
  environment.mapping = THREE.EquirectangularReflectionMapping;
  environment.colorSpace = THREE.SRGBColorSpace;
  environment.needsUpdate = true;

  const cctv = makeTexture(cctvCanvas(512, 384), { srgb: true, anisotropy, wrap: false });
  const scanBand = makeTexture(scanBandCanvas(), { srgb: false, anisotropy: 2, wrap: false });

  return {
    wallPanel,
    ceilingPanel,
    floorPlate,
    steel,
    cardboard,
    meat,
    produce,
    film,
    frost,
    label,
    contactShadow,
    glow,
    mist,
    environment,
    cctv,
    scanBand,
  };
}
