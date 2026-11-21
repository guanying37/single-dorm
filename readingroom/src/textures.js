import * as THREE from 'three';
import { mulberry32 } from '../../dining/src/utils.js';

/* ------------------------------------------------------------------ *
 * 阅览室程序化贴图。
 *
 * 砖墙、木地板、木板天花、胡桃木、旧纸、绒布、书脊布、CRT 监控画面、
 * 窗外天光与地面光斑。全部在浏览器里画出来：没有位图、没有网络请求、
 * 没有可读文字。
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

function wrappedBlob(ctx, size, x, y, radius, colors, alpha, rng) {
  const gradient = () => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const color = colors[Math.floor(rng() * colors.length)];
    g.addColorStop(0, `rgba(${color},${alpha})`);
    g.addColorStop(1, `rgba(${color},0)`);
    return g;
  };
  ctx.fillStyle = gradient();
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  // Wrap copies so a tiling wall has no visible blob seams.
  for (const [dx, dy] of [
    [size, 0],
    [-size, 0],
    [0, size],
    [0, -size],
  ]) {
    if (x + dx + radius < 0 || x + dx - radius > size) continue;
    if (y + dy + radius < 0 || y + dy - radius > size) continue;
    const copyX = x + dx;
    const copyY = y + dy;
    const g = ctx.createRadialGradient(copyX, copyY, 0, copyX, copyY, radius);
    const color = colors[Math.floor(rng() * colors.length)];
    g.addColorStop(0, `rgba(${color},${alpha})`);
    g.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(copyX - radius, copyY - radius, radius * 2, radius * 2);
  }
}

/* --- 砖墙：2.4 m 见方，10 列 × 30 行，错缝 --------------------------------- */

function brickCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  const columns = 10;
  const rows = 30;
  const joint = 0.012;
  const colW = size / columns;
  const rowH = size / rows;
  const brickW = colW - (joint / 2.4) * size;
  const brickH = rowH - (joint / 2.4) * size;

  // Mortar bed, slightly warm grey.
  ctx.fillStyle = '#a89986';
  ctx.fillRect(0, 0, size, size);
  const mortarNoise = ctx.getImageData(0, 0, size, size);
  const mortarData = mortarNoise.data;
  for (let i = 0; i < mortarData.length; i += 4) {
    const d = (rng() - 0.5) * 16;
    mortarData[i] += d;
    mortarData[i + 1] += d * 0.95;
    mortarData[i + 2] += d * 0.9;
  }
  ctx.putImageData(mortarNoise, 0, 0);

  const palette = [
    [126, 74, 56],
    [138, 82, 62],
    [114, 66, 50],
    [146, 92, 70],
    [104, 62, 48],
    [122, 78, 60],
    [132, 76, 58],
    [118, 70, 52],
  ];
  const set = (value) => Math.max(0, Math.min(255, value));

  for (let row = 0; row < rows; row += 1) {
    const offset = row % 2 === 0 ? 0 : -colW / 2;
    for (let col = -1; col <= columns; col += 1) {
      const x = col * colW + offset + joint * 0.5 * size;
      const y = row * rowH + joint * 0.5 * size;
      const base = palette[Math.floor(rng() * palette.length)];
      const shade = 0.86 + rng() * 0.24;
      const r = set(base[0] * shade + (rng() - 0.5) * 12);
      const g = set(base[1] * shade + (rng() - 0.5) * 10);
      const b = set(base[2] * shade + (rng() - 0.5) * 9);
      // A few darker, over-fired headers.
      const dark = rng() < 0.09 ? 0.58 : 1;
      const jitterX = (rng() - 0.5) * 1.2;
      const jitterY = (rng() - 0.5) * 1.0;
      ctx.fillStyle = `rgb(${set(r * dark)},${set(g * dark)},${set(b * dark)})`;
      ctx.beginPath();
      ctx.roundRect(x + jitterX, y + jitterY, brickW - 0.6, brickH - 0.6, 1.4);
      ctx.fill();

      // Each brick gets a soft light top-left and shadowed bottom-right,
      // so the mortar reads as a recess instead of a flat line.
      const light = ctx.createLinearGradient(x, y, x, y + brickH);
      light.addColorStop(0, 'rgba(255,232,206,0.1)');
      light.addColorStop(0.24, 'rgba(255,232,206,0.015)');
      light.addColorStop(0.8, 'rgba(28,16,10,0.045)');
      light.addColorStop(1, 'rgba(22,12,8,0.14)');
      ctx.fillStyle = light;
      ctx.fillRect(x + 1, y + 1, brickW - 2.2, brickH - 2);

      // Pits, chips and burnt flecks.
      for (let i = 0; i < 5; i += 1) {
        const px = x + 2 + rng() * (brickW - 5);
        const py = y + 2 + rng() * (brickH - 5);
        ctx.fillStyle = `rgba(38,24,17,${0.05 + rng() * 0.14})`;
        ctx.beginPath();
        ctx.ellipse(px, py, 0.6 + rng() * 1.7, 0.4 + rng() * 1, rng() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      // Occasional spalled corner.
      if (rng() < 0.06) {
        ctx.fillStyle = 'rgba(120,109,92,0.42)';
        const cornerX = rng() < 0.5 ? x + 1 : x + brickW - 6;
        const cornerY = rng() < 0.5 ? y + 1 : y + brickH - 5;
        ctx.beginPath();
        ctx.moveTo(cornerX, cornerY);
        ctx.lineTo(cornerX + 3 + rng() * 3, cornerY + 1);
        ctx.lineTo(cornerX + 1, cornerY + 3 + rng() * 3);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // Soot, damp and lime wash blooms across the wall.
  for (let i = 0; i < 26; i += 1) {
    wrappedBlob(
      ctx,
      size,
      rng() * size,
      rng() * size,
      size * (0.05 + rng() * 0.16),
      ['62,48,38', '88,68,52', '176,166,148', '52,40,32'],
      0.05 + rng() * 0.07,
      rng,
    );
  }
  // A pale repaired patch and a couple of old anchor holes.
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = '#cbbda5';
  ctx.fillRect(size * 0.58, size * 0.36, size * 0.16, size * 0.1);
  ctx.restore();
  for (let i = 0; i < 4; i += 1) {
    const x = rng() * size;
    const y = rng() * size;
    ctx.fillStyle = 'rgba(40,28,20,0.42)';
    ctx.beginPath();
    ctx.arc(x, y, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(196,182,160,0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 3.6, Math.PI * 0.9, Math.PI * 1.9);
    ctx.stroke();
  }

  // Fine grit.
  for (let i = 0; i < 1600; i += 1) {
    const x = rng() * size;
    const y = rng() * size;
    ctx.fillStyle = rng() > 0.5 ? 'rgba(236,226,208,0.16)' : 'rgba(46,32,24,0.16)';
    ctx.fillRect(x, y, 1, 1);
  }
  addGrain(ctx, size, size, rng, 4);
  return canvas;
}

/* --- 木地板：1.6 m 见方，8 条拼板，错缝 ---------------------------------- */

function floorWoodCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  const planks = 8;
  const plankW = size / planks;
  ctx.fillStyle = '#3e2a1d';
  ctx.fillRect(0, 0, size, size);

  const tones = [
    [94, 62, 40],
    [104, 70, 46],
    [84, 55, 36],
    [112, 78, 52],
    [90, 60, 40],
    [98, 66, 44],
  ];

  for (let i = 0; i < planks; i += 1) {
    const x = i * plankW;
    const tone = tones[Math.floor(rng() * tones.length)];
    const shade = 0.9 + rng() * 0.2;
    ctx.fillStyle = `rgb(${tone[0] * shade},${tone[1] * shade},${tone[2] * shade})`;
    ctx.fillRect(x + 1, -2, plankW - 2, size + 4);

    // Grain: long, slightly wandering lines.
    ctx.lineWidth = 1;
    for (let g = 0; g < 22; g += 1) {
      const gx = x + 3 + rng() * (plankW - 6);
      ctx.strokeStyle = rng() > 0.45 ? `rgba(52,30,18,${0.05 + rng() * 0.1})` : `rgba(196,152,108,${0.05 + rng() * 0.09})`;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      let px = gx;
      for (let y = 0; y <= size; y += 26) {
        px += (rng() - 0.5) * 3.2;
        ctx.lineTo(px, y);
      }
      ctx.stroke();
    }

    // Flat-sawn cathedral figure.
    if (rng() < 0.7) {
      const cx = x + plankW * (0.3 + rng() * 0.4);
      const cy = rng() * size;
      ctx.strokeStyle = 'rgba(60,34,20,0.13)';
      for (let k = 0; k < 5; k += 1) {
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(cx, cy, plankW * (0.16 + k * 0.05), 26 + k * 13, 0.2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Knots and nail heads.
    if (rng() < 0.4) {
      const kx = x + plankW * (0.3 + rng() * 0.4);
      const ky = rng() * size;
      const kr = 2 + rng() * 4;
      ctx.fillStyle = 'rgba(44,24,12,0.5)';
      ctx.beginPath();
      ctx.ellipse(kx, ky, kr, kr * (1.4 + rng() * 0.8), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(30,18,10,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(kx, ky, kr + 2.2, kr * 1.8 + 2.4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const ny of [size * 0.12, size * 0.88]) {
      if (rng() < 0.5) continue;
      ctx.fillStyle = 'rgba(24,18,14,0.55)';
      ctx.beginPath();
      ctx.arc(x + 5 + rng() * 4, ny + (rng() - 0.5) * 20, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Plank gap: dark seam, then a light wear line to the right.
    ctx.fillStyle = 'rgba(18,11,7,0.72)';
    ctx.fillRect(x, 0, 1.6, size);
    ctx.fillStyle = 'rgba(196,160,122,0.14)';
    ctx.fillRect(x + 1.6, 0, 1, size);

    // Staggered end joints every 1.3 m-ish, with a dark gap.
    const jointY = rng() * size;
    ctx.fillStyle = 'rgba(16,10,6,0.7)';
    ctx.fillRect(x, jointY, plankW, 1.7);
    ctx.fillStyle = 'rgba(200,168,128,0.12)';
    ctx.fillRect(x, jointY + 1.7, plankW, 0.9);
  }

  // Wax sheen: broad warm and cool streaks along the planks.
  for (let i = 0; i < 26; i += 1) {
    const x = rng() * size;
    const w = size * (0.03 + rng() * 0.1);
    const gradient = ctx.createLinearGradient(x, 0, x + w, 0);
    gradient.addColorStop(0, 'rgba(240,204,152,0)');
    gradient.addColorStop(0.5, `rgba(240,204,152,${0.02 + rng() * 0.035})`);
    gradient.addColorStop(1, 'rgba(240,204,152,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, 0, w, size);
  }
  // Wear where feet and chairs scuff.
  for (let i = 0; i < 16; i += 1) {
    wrappedBlob(ctx, size, rng() * size, rng() * size, size * (0.02 + rng() * 0.06), ['196,170,136', '52,36,24'], 0.05, rng);
  }
  addGrain(ctx, size, size, rng, 5);
  return canvas;
}

/* --- 木板天花：2 m × 1 m，12 条板 ---------------------------------------- */

function ceilingWoodCanvas(width, height, rng) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const planks = 12;
  const plankH = height / planks;
  ctx.fillStyle = '#2c1d13';
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < planks; i += 1) {
    const y = i * plankH;
    const shade = 0.82 + rng() * 0.24;
    const r = Math.round(88 * shade);
    const g = Math.round(58 * shade);
    const b = Math.round(38 * shade);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, y + 1, width, plankH - 2);

    // Long grain along the plank (X).
    for (let k = 0; k < 16; k += 1) {
      const gy = y + 2 + rng() * (plankH - 4);
      ctx.strokeStyle = rng() > 0.5 ? 'rgba(38,22,13,0.12)' : 'rgba(176,132,92,0.1)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      let py = gy;
      for (let x = 0; x <= width; x += 40) {
        py += (rng() - 0.5) * 1.8;
        ctx.lineTo(x, py);
      }
      ctx.stroke();
    }
    // End joints, staggered.
    for (const jx of [width * (0.2 + rng() * 0.2), width * (0.68 + rng() * 0.2)]) {
      ctx.fillStyle = 'rgba(18,10,6,0.65)';
      ctx.fillRect(jx, y, 1.8, plankH);
      ctx.fillStyle = 'rgba(188,150,108,0.1)';
      ctx.fillRect(jx + 1.8, y, 1, plankH);
    }
    // Dark seam between planks.
    ctx.fillStyle = 'rgba(14,8,5,0.78)';
    ctx.fillRect(0, y, width, 1.7);
    ctx.fillStyle = 'rgba(178,138,96,0.1)';
    ctx.fillRect(0, y + 1.7, width, 0.9);
  }

  // Nicotine stain and beam-shadow patches.
  for (let i = 0; i < 18; i += 1) {
    const x = rng() * width;
    const y = rng() * height;
    const radius = width * (0.03 + rng() * 0.12);
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, `rgba(38,24,14,${0.05 + rng() * 0.08})`);
    g.addColorStop(1, 'rgba(38,24,14,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  addGrain(ctx, width, height, rng, 5);
  return canvas;
}

/* --- 封窗用的生木板：浅色、粗糙，和家具的深胡桃木区分 ------------------ */

function rawPlankCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#c0ad90';
  ctx.fillRect(0, 0, size, size);

  // 横向长纹。
  for (let i = 0; i < 90; i += 1) {
    const y = rng() * size;
    ctx.strokeStyle = rng() > 0.5 ? `rgba(94,74,52,${0.05 + rng() * 0.1})` : `rgba(246,238,222,${0.06 + rng() * 0.12})`;
    ctx.lineWidth = 0.6 + rng() * 1.2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    let py = y;
    for (let x = 0; x <= size; x += 24) {
      py += (rng() - 0.5) * 2.0;
      ctx.lineTo(x, py);
    }
    ctx.stroke();
  }
  // 节疤与钉孔周围的锈迹。
  for (let i = 0; i < 5; i += 1) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 3 + rng() * 7;
    ctx.strokeStyle = 'rgba(82,62,42,0.35)';
    for (let ring = 0; ring < 3; ring += 1) {
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(x, y, r * (1 + ring * 0.7), r * (0.6 + ring * 0.4), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(62,46,30,0.5)';
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.35, r * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // 风化的灰白斑与边角磨损。
  for (let i = 0; i < 16; i += 1) {
    const x = rng() * size;
    const y = rng() * size;
    const radius = size * (0.03 + rng() * 0.12);
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, `rgba(236,228,212,${0.05 + rng() * 0.08})`);
    g.addColorStop(1, 'rgba(236,228,212,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  for (let i = 0; i < 280; i += 1) {
    ctx.fillStyle = rng() > 0.5 ? 'rgba(86,66,44,0.12)' : 'rgba(248,242,230,0.14)';
    ctx.fillRect(rng() * size, rng() * size, 1 + rng() * 3, 1);
  }
  addGrain(ctx, size, size, rng, 5);
  return canvas;
}

/* --- 通用胡桃木纹：512²，纵向，供书架/桌椅/画框调色 ---------------------- */

function woodCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#7a5a3d';
  ctx.fillRect(0, 0, size, size);

  // Broad tonal bands.
  for (let i = 0; i < 9; i += 1) {
    const x = (i / 9) * size + (rng() - 0.5) * 20;
    const w = size * (0.06 + rng() * 0.16);
    const gradient = ctx.createLinearGradient(x, 0, x + w, 0);
    gradient.addColorStop(0, 'rgba(54,34,20,0)');
    gradient.addColorStop(0.5, rng() > 0.5 ? 'rgba(54,34,20,0.16)' : 'rgba(214,176,128,0.1)');
    gradient.addColorStop(1, 'rgba(54,34,20,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, 0, w, size);
  }

  // Long grain.
  for (let i = 0; i < 220; i += 1) {
    const x = rng() * size;
    ctx.strokeStyle = rng() > 0.5 ? `rgba(48,28,15,${0.04 + rng() * 0.09})` : `rgba(206,166,118,${0.03 + rng() * 0.07})`;
    ctx.lineWidth = 0.6 + rng() * 1.1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    let px = x;
    for (let y = 0; y <= size; y += 32) {
      px += (rng() - 0.5) * 2.4;
      ctx.lineTo(px, y);
    }
    ctx.stroke();
  }

  // A couple of knots with swirling grain.
  for (let k = 0; k < 2; k += 1) {
    const kx = rng() * size;
    const ky = rng() * size;
    const kr = 8 + rng() * 14;
    ctx.strokeStyle = 'rgba(54,30,16,0.32)';
    for (let ring = 0; ring < 5; ring += 1) {
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(kx, ky, kr * (1 + ring * 0.55), kr * (1.7 + ring * 0.7), 0.1, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(40,22,12,0.55)';
    ctx.beginPath();
    ctx.ellipse(kx, ky, kr * 0.55, kr * 1.1, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Pores and flecks.
  for (let i = 0; i < 700; i += 1) {
    ctx.fillStyle = `rgba(44,26,14,${0.05 + rng() * 0.12})`;
    ctx.fillRect(rng() * size, rng() * size, 1, 1 + rng() * 2);
  }
  addGrain(ctx, size, size, rng, 4);
  return canvas;
}

/* --- 旧纸：256² ---------------------------------------------------------- */

function paperCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e7dcc4';
  ctx.fillRect(0, 0, size, size);

  // Fibres and pulp flecks.
  for (let i = 0; i < 900; i += 1) {
    const x = rng() * size;
    const y = rng() * size;
    ctx.fillStyle = rng() > 0.5 ? `rgba(120,98,70,${0.04 + rng() * 0.1})` : `rgba(252,248,238,${0.2 + rng() * 0.3})`;
    ctx.fillRect(x, y, 1 + rng() * 2, 1);
  }
  // Foxing.
  for (let i = 0; i < 22; i += 1) {
    const x = rng() * size;
    const y = rng() * size;
    const radius = 1.5 + rng() * 5;
    ctx.fillStyle = `rgba(142,106,64,${0.05 + rng() * 0.1})`;
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * 0.7, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  // A faint fold.
  ctx.strokeStyle = 'rgba(126,100,70,0.14)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(size * 0.52, 0);
  ctx.lineTo(size * 0.48, size);
  ctx.stroke();
  addGrain(ctx, size, size, rng, 6);
  return canvas;
}

/* --- 绒布 / 书脊布：256² -------------------------------------------------- */

function clothCanvas(size, rng, base = [208, 203, 188]) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
  ctx.fillRect(0, 0, size, size);
  // Weave: alternating fine warp and weft lines. A light base lets the
  // material colour tint the fabric instead of multiplying it to black.
  for (let i = 0; i < size; i += 2) {
    ctx.fillStyle = `rgba(255,255,255,${0.05 + rng() * 0.06})`;
    ctx.fillRect(0, i, size, 1);
    ctx.fillStyle = `rgba(0,0,0,${0.03 + rng() * 0.03})`;
    ctx.fillRect(i, 0, 1, size);
  }
  for (let i = 0; i < 320; i += 1) {
    ctx.fillStyle = rng() > 0.5 ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(rng() * size, rng() * size, 1 + rng() * 3, 1);
  }
  // Soft slub / wear patches.
  for (let i = 0; i < 14; i += 1) {
    const x = rng() * size;
    const y = rng() * size;
    const radius = size * (0.04 + rng() * 0.12);
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, `rgba(60,52,40,${0.04 + rng() * 0.05})`);
    g.addColorStop(1, 'rgba(60,52,40,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  addGrain(ctx, size, size, rng, 5);
  return canvas;
}

/* --- CRT 监控画面：512 × 384，暖灰，无文字 -------------------------------- */

function cctvCanvas(width, height, rng) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#2b2a25');
  bg.addColorStop(0.45, '#46443b');
  bg.addColorStop(1, '#1c1b17');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Far shelves: vertical stacks of pale spines.
  for (const [x, w, top] of [
    [width * 0.06, width * 0.2, height * 0.12],
    [width * 0.62, width * 0.28, height * 0.08],
  ]) {
    ctx.fillStyle = 'rgba(28,26,21,0.85)';
    ctx.fillRect(x, top, w, height * 0.7);
    for (let row = 0; row < 4; row += 1) {
      const y = top + height * 0.06 + row * height * 0.16;
      ctx.fillStyle = 'rgba(150,140,118,0.22)';
      ctx.fillRect(x + w * 0.08, y, w * 0.84, height * 0.02);
      for (let b = 0; b < 12; b += 1) {
        const bw = w * 0.055;
        const bh = height * (0.05 + rng() * 0.07);
        ctx.fillStyle = `rgba(${140 + rng() * 60},${120 + rng() * 50},${96 + rng() * 40},${0.25 + rng() * 0.2})`;
        ctx.fillRect(x + w * 0.08 + b * (w * 0.067), y - bh, bw, bh);
      }
    }
  }

  // Two tables and pendant light pools.
  for (const [x, y, w, h] of [
    [width * 0.3, height * 0.62, width * 0.34, height * 0.1],
    [width * 0.3, height * 0.8, width * 0.34, height * 0.08],
  ]) {
    ctx.fillStyle = 'rgba(122,102,72,0.42)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(210,190,144,0.12)';
    ctx.fillRect(x, y, w, 2);
  }
  for (const [x, y] of [
    [width * 0.4, height * 0.18],
    [width * 0.48, height * 0.18],
    [width * 0.56, height * 0.18],
  ]) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, height * 0.26);
    g.addColorStop(0, 'rgba(255,244,214,0.55)');
    g.addColorStop(0.3, 'rgba(255,232,184,0.2)');
    g.addColorStop(1, 'rgba(255,226,170,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - height * 0.3, y - height * 0.3, height * 0.6, height * 0.6);
  }

  // Window band, blown out.
  ctx.fillStyle = 'rgba(216,226,226,0.5)';
  ctx.fillRect(width * 0.08, height * 0.18, width * 0.16, height * 0.22);

  // Heavy grey noise.
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const d = (rng() - 0.5) * 34;
    data[i] = Math.max(0, Math.min(255, data[i] + d));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + d));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + d * 0.9));
  }
  ctx.putImageData(image, 0, 0);

  // Horizontal scanlines and a vignette.
  for (let y = 0; y < height; y += 3) {
    ctx.fillStyle = 'rgba(10,10,8,0.16)';
    ctx.fillRect(0, y, width, 1);
  }
  const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.2, width / 2, height / 2, height * 0.85);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.62)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
  return canvas;
}

/* --- 光斑 / 影子 / 尘埃 --------------------------------------------------- */

function radialCanvas(size, stops) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

function dustCanvas(size) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,240,206,0.9)');
  g.addColorStop(0.4, 'rgba(255,228,176,0.28)');
  g.addColorStop(1, 'rgba(255,220,160,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  return canvas;
}

/* --- 环境反射：暖色旧阅览室 ---------------------------------------------- */

function environmentCanvas(width = 512, height = 256) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const wall = ctx.createLinearGradient(0, 0, 0, height);
  wall.addColorStop(0, '#3a2a1d');
  wall.addColorStop(0.4, '#5b432c');
  wall.addColorStop(0.62, '#4a3523');
  wall.addColorStop(1, '#221812');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, width, height);

  // The window wall: three pale patches.
  for (const x of [0.18, 0.5, 0.82]) {
    const g = ctx.createLinearGradient(width * x, 0, width * x, height * 0.62);
    g.addColorStop(0, 'rgba(228,232,226,0.5)');
    g.addColorStop(1, 'rgba(228,232,226,0)');
    ctx.fillStyle = g;
    ctx.fillRect(width * (x - 0.05), height * 0.16, width * 0.1, height * 0.46);
  }

  // Three warm pendant pools across the ceiling.
  for (const x of [0.3, 0.5, 0.7]) {
    const g = ctx.createRadialGradient(width * x, height * 0.08, 2, width * x, height * 0.08, height * 0.24);
    g.addColorStop(0, 'rgba(255,230,180,0.9)');
    g.addColorStop(0.35, 'rgba(255,204,138,0.3)');
    g.addColorStop(1, 'rgba(255,196,120,0)');
    ctx.fillStyle = g;
    ctx.fillRect(width * (x - 0.22), 0, width * 0.44, height * 0.4);
  }

  // Bookcase masses along both sides.
  for (const x of [0.04, 0.96]) {
    ctx.fillStyle = 'rgba(18,12,8,0.55)';
    ctx.fillRect(width * (x - 0.035), height * 0.3, width * 0.07, height * 0.5);
  }

  // A little green from the reading lamps.
  const green = ctx.createRadialGradient(width * 0.5, height * 0.52, 2, width * 0.5, height * 0.52, width * 0.3);
  green.addColorStop(0, 'rgba(156,208,166,0.16)');
  green.addColorStop(1, 'rgba(156,208,166,0)');
  ctx.fillStyle = green;
  ctx.fillRect(0, height * 0.3, width, height * 0.5);
  return canvas;
}

/* ------------------------------------------------------------------ */

export function createTextureSet(maxAnisotropy = 8) {
  const anisotropy = Math.min(8, maxAnisotropy || 8);
  const rng = mulberry32(0x1b0a2e);

  const brick = makeTexture(brickCanvas(1024, rng), { anisotropy });
  // 地板与天花控制在 768 级别，把整套程序化贴图压在 16 MB 以内。
  const floorWood = makeTexture(floorWoodCanvas(768, rng), { anisotropy });
  const ceilingWood = makeTexture(ceilingWoodCanvas(512, 256, rng), { anisotropy });
  const wood = makeTexture(woodCanvas(512, rng), { anisotropy });
  const rawPlank = makeTexture(rawPlankCanvas(256, rng), { anisotropy });
  const paper = makeTexture(paperCanvas(256, rng), { anisotropy });
  const cloth = makeTexture(clothCanvas(256, rng, [208, 203, 188]), { anisotropy });
  const bookCloth = makeTexture(clothCanvas(256, rng, [196, 190, 176]), { anisotropy });
  const cctv = makeTexture(cctvCanvas(512, 384, rng), { srgb: true, anisotropy: 2, wrap: false });

  const scanBandCanvas = createCanvas(8, 64);
  const scanCtx = scanBandCanvas.getContext('2d');
  const scanGradient = scanCtx.createLinearGradient(0, 0, 0, 64);
  scanGradient.addColorStop(0, 'rgba(232,255,238,0)');
  scanGradient.addColorStop(0.42, 'rgba(232,255,238,0.05)');
  scanGradient.addColorStop(0.5, 'rgba(238,255,242,0.8)');
  scanGradient.addColorStop(0.58, 'rgba(232,255,238,0.05)');
  scanGradient.addColorStop(1, 'rgba(232,255,238,0)');
  scanCtx.fillStyle = scanGradient;
  scanCtx.fillRect(0, 0, 8, 64);
  const scanBand = new THREE.CanvasTexture(scanBandCanvas);
  scanBand.wrapS = THREE.ClampToEdgeWrapping;
  scanBand.wrapT = THREE.ClampToEdgeWrapping;
  scanBand.colorSpace = THREE.SRGBColorSpace;
  scanBand.needsUpdate = true;

  const glow = new THREE.CanvasTexture(
    radialCanvas(256, [
      [0, 'rgba(255,246,220,0.95)'],
      [0.18, 'rgba(255,226,174,0.46)'],
      [0.5, 'rgba(255,208,146,0.12)'],
      [1, 'rgba(255,198,128,0)'],
    ]),
  );
  glow.colorSpace = THREE.SRGBColorSpace;
  glow.needsUpdate = true;

  const greenGlow = new THREE.CanvasTexture(
    radialCanvas(256, [
      [0, 'rgba(214,255,214,0.9)'],
      [0.22, 'rgba(160,232,168,0.42)'],
      [0.55, 'rgba(120,204,140,0.12)'],
      [1, 'rgba(100,190,120,0)'],
    ]),
  );
  greenGlow.colorSpace = THREE.SRGBColorSpace;
  greenGlow.needsUpdate = true;

  const contactShadow = new THREE.CanvasTexture(
    radialCanvas(128, [
      [0, 'rgba(3, 3, 2, 0.6)'],
      [0.42, 'rgba(3, 3, 2, 0.3)'],
      [0.75, 'rgba(3, 3, 2, 0.1)'],
      [1, 'rgba(3, 3, 2, 0)'],
    ]),
  );
  contactShadow.colorSpace = THREE.NoColorSpace;
  contactShadow.needsUpdate = true;

  const dust = new THREE.CanvasTexture(dustCanvas(64));
  dust.colorSpace = THREE.SRGBColorSpace;
  dust.needsUpdate = true;

  const environment = new THREE.CanvasTexture(environmentCanvas());
  environment.mapping = THREE.EquirectangularReflectionMapping;
  environment.colorSpace = THREE.SRGBColorSpace;
  environment.needsUpdate = true;

  return {
    brick,
    floorWood,
    ceilingWood,
    wood,
    rawPlank,
    paper,
    cloth,
    bookCloth,
    cctv,
    scanBand,
    glow,
    greenGlow,
    contactShadow,
    dust,
    environment,
  };
}


