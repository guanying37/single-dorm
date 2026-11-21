import * as THREE from 'three';
import { mulberry32 } from './utils.js';

/* ------------------------------------------------------------------ *
 * 程序化材质贴图。
 *
 * 不随包任何位图：棕色墙纸、黑色大理石、深胡桃木、深色天花、监控
 * 画面、噪点、污渍、环境反射全部由 Canvas 在浏览器内生成，可无缝
 * 平铺；无外部请求、无字体。
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

function addGrain(ctx, width, height, rng, amount = 8) {
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

/* --- 棕色墙纸 ------------------------------------------------------ */

function wallpaperCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');

  const base = ctx.createLinearGradient(0, 0, 0, size);
  base.addColorStop(0, '#5c4029');
  base.addColorStop(0.45, '#4a3323');
  base.addColorStop(1, '#38261a');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // 大块明暗，避免平涂。
  for (let i = 0; i < 46; i += 1) {
    const radius = 60 + rng() * 220;
    const x = rng() * size;
    const y = rng() * size;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, rng() > 0.5 ? 'rgba(118,84,54,0.08)' : 'rgba(20,10,5,0.1)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  // 细竖纹（墙纸的丝光方向）。
  for (let x = 0; x < size; x += 9) {
    ctx.fillStyle = x % 18 === 0 ? 'rgba(255,224,186,0.022)' : 'rgba(0,0,0,0.045)';
    ctx.fillRect(x, 0, 1.4, size);
  }

  // 大马士革式菱格花纹：低对比，近看有图案，远看是暖棕墙面。
  const cell = size / 4;
  for (let row = -1; row < 5; row += 1) {
    for (let col = -1; col < 5; col += 1) {
      const cx = col * cell + (row % 2 ? cell / 2 : 0);
      const cy = row * cell;
      const w = cell * 0.36;
      const h = cell * 0.52;
      const petal = (scale, stroke, lineWidth) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy - h * scale);
        ctx.bezierCurveTo(cx + w * scale, cy - h * scale * 0.45, cx + w * scale * 0.55, cy + h * scale * 0.28, cx, cy + h * scale);
        ctx.bezierCurveTo(cx - w * scale * 0.55, cy + h * scale * 0.28, cx - w * scale, cy - h * scale * 0.45, cx, cy - h * scale);
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      };
      petal(1.0, 'rgba(12,6,3,0.26)', 2.2);
      petal(0.94, 'rgba(188,146,100,0.15)', 1.1);
      petal(0.58, 'rgba(12,6,3,0.18)', 1.4);
      petal(0.5, 'rgba(196,156,110,0.12)', 0.8);

      // 菱形轮廓。
      ctx.beginPath();
      ctx.moveTo(cx, cy - h * 1.02);
      ctx.lineTo(cx + w * 0.92, cy);
      ctx.lineTo(cx, cy + h * 1.02);
      ctx.lineTo(cx - w * 0.92, cy);
      ctx.closePath();
      ctx.strokeStyle = 'rgba(150,112,74,0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 中心小花与四角圆点。
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.045, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(198,158,110,0.16)';
      ctx.fill();
      for (const [dx, dy] of [[0, -h], [0, h], [-w * 0.92, 0], [w * 0.92, 0]]) {
        ctx.beginPath();
        ctx.arc(cx + dx, cy + dy, cell * 0.018, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(214,174,124,0.18)';
        ctx.fill();
      }
    }
  }

  // 墙纸拼缝：每 1/2 幅一条。
  for (const x of [size * 0.5]) {
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(x - 0.8, 0, 1.6, size);
    ctx.fillStyle = 'rgba(214,178,132,0.05)';
    ctx.fillRect(x + 0.8, 0, 1, size);
  }

  // 局部水渍与擦痕。
  for (let i = 0; i < 3; i += 1) {
    const x = rng() * size;
    const y = size * (0.62 + rng() * 0.3);
    const radius = 26 + rng() * 44;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(18,9,4,0.16)');
    gradient.addColorStop(0.7, 'rgba(18,9,4,0.07)');
    gradient.addColorStop(1, 'rgba(18,9,4,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  addGrain(ctx, size, size, rng, 5);
  return canvas;
}

/* --- 黑色大理石 ---------------------------------------------------- */

function marbleCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');

  const base = ctx.createLinearGradient(0, 0, size, size);
  base.addColorStop(0, '#0a0b0d');
  base.addColorStop(0.5, '#101216');
  base.addColorStop(1, '#07080a');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // 石面云翳。
  for (let i = 0; i < 60; i += 1) {
    const radius = 30 + rng() * 170;
    const x = rng() * size;
    const y = rng() * size;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const light = rng() > 0.55;
    gradient.addColorStop(0, light ? 'rgba(96,104,116,0.06)' : 'rgba(0,0,0,0.16)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  // 主脉：宽晕 + 细亮线 + 分叉。
  const vein = (startX, startY, angle, length, width, bright) => {
    const points = [];
    let x = startX;
    let y = startY;
    let a = angle;
    const segments = 14;
    for (let i = 0; i < segments; i += 1) {
      points.push([x, y]);
      a += (rng() - 0.5) * 0.55;
      x += Math.cos(a) * (length / segments);
      y += Math.sin(a) * (length / segments);
    }
    points.push([x, y]);
    const stroke = (lineWidth, color) => {
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length - 1; i += 1) {
        const cx = (points[i][0] + points[i + 1][0]) / 2;
        const cy = (points[i][1] + points[i + 1][1]) / 2;
        ctx.quadraticCurveTo(points[i][0], points[i][1], cx, cy);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
    };
    stroke(width * 3.4, 'rgba(120,126,138,0.07)');
    stroke(width * 1.6, 'rgba(150,154,160,0.1)');
    stroke(width * 0.7, bright ? 'rgba(205,206,202,0.22)' : 'rgba(170,172,172,0.15)');
    if (rng() > 0.3) {
      const branchStart = 3 + Math.floor(rng() * 7);
      const bx = points[branchStart][0];
      const by = points[branchStart][1];
      stroke(width * 0.5, 'rgba(188,190,190,0.14)');
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + 22, by - 16, bx + 44 + rng() * 30, by + (rng() - 0.5) * 30);
      ctx.lineWidth = width * 0.5;
      ctx.strokeStyle = 'rgba(196,196,192,0.16)';
      ctx.stroke();
    }
  };

  for (let i = 0; i < 7; i += 1) {
    vein(rng() * size, rng() * size, rng() * Math.PI * 2, 120 + rng() * 260, 1.6 + rng() * 1.8, rng() > 0.45);
  }

  // 两条极淡的金色石英脉。
  ctx.strokeStyle = 'rgba(150,118,72,0.18)';
  for (let i = 0; i < 2; i += 1) {
    ctx.beginPath();
    let x = rng() * size;
    let y = rng() * size;
    ctx.moveTo(x, y);
    for (let k = 0; k < 8; k += 1) {
      x += (rng() - 0.4) * 30;
      y += (rng() - 0.5) * 42;
      ctx.lineTo(x, y);
    }
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // 细碎晶体。
  for (let i = 0; i < 1600; i += 1) {
    const tone = rng();
    ctx.fillStyle = tone > 0.7
      ? 'rgba(210,210,205,0.4)'
      : tone > 0.4
        ? 'rgba(120,124,132,0.32)'
        : 'rgba(0,0,0,0.4)';
    const r = 0.3 + rng() * 1.1;
    ctx.beginPath();
    ctx.arc(rng() * size, rng() * size, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 板材拼缝：贴图边界 = 1.2 m 板缝。
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, size, 3);
  ctx.fillRect(0, 0, 3, size);
  ctx.fillStyle = 'rgba(150,152,156,0.15)';
  ctx.fillRect(0, 3, size, 1);
  ctx.fillRect(3, 0, 1, size);

  addGrain(ctx, size, size, rng, 3);
  return canvas;
}

/* --- 深胡桃木 ------------------------------------------------------ */

function woodCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#2c1a0f';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 200; i += 1) {
    const y = rng() * size;
    const width = 0.6 + rng() * 2.6;
    const alpha = 0.03 + rng() * 0.09;
    const dark = rng() > 0.28;
    ctx.strokeStyle = dark
      ? `rgba(9,4,2,${alpha + 0.03})`
      : `rgba(122,84,48,${alpha})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= size; x += 20) {
      ctx.lineTo(x, y + Math.sin(x * 0.018 + i * 1.4) * (1.6 + rng() * 2.6));
    }
    ctx.stroke();
  }

  for (let i = 0; i < 2; i += 1) {
    const x = rng() * size;
    const y = rng() * size;
    ctx.strokeStyle = 'rgba(8,4,2,0.2)';
    for (let r = 3; r < 14; r += 3) {
      ctx.beginPath();
      ctx.ellipse(x, y, r * 2.4, r, 0.2, 0, Math.PI * 2);
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }
  }

  addGrain(ctx, size, size, rng, 4);
  return canvas;
}

/* --- 深色天花 ------------------------------------------------------ */

function ceilingCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size * 0.5, size * 0.5, 10, size * 0.5, size * 0.5, size * 0.75);
  gradient.addColorStop(0, '#4a4137');
  gradient.addColorStop(0.6, '#3c352d');
  gradient.addColorStop(1, '#2a251f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 90; i += 1) {
    const radius = 16 + rng() * 60;
    const x = rng() * size;
    const y = rng() * size;
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, rng() > 0.5 ? 'rgba(90,80,68,0.04)' : 'rgba(0,0,0,0.09)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  // 抹灰刮痕。
  for (let i = 0; i < 40; i += 1) {
    ctx.strokeStyle = 'rgba(12,10,8,0.12)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    const x = rng() * size;
    const y = rng() * size;
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 20, y + 8, x + 46, y - 4);
    ctx.stroke();
  }

  addGrain(ctx, size, size, rng, 4);
  return canvas;
}

/* --- 监控画面 ------------------------------------------------------ */

function feedCanvas(size, rng, { mirror = false, warm = '#ffd9a0' } = {}) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  const s = size;
  const vx = s * 0.5;
  const vy = s * 0.43;
  const half = s * 0.305;

  ctx.fillStyle = '#07090a';
  ctx.fillRect(0, 0, s, s);

  // 天花与地面。
  const ceiling = ctx.createLinearGradient(0, 0, 0, vy);
  ceiling.addColorStop(0, '#121212');
  ceiling.addColorStop(1, '#080808');
  ctx.fillStyle = ceiling;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(s, 0);
  ctx.lineTo(vx + half, vy);
  ctx.lineTo(vx - half, vy);
  ctx.closePath();
  ctx.fill();

  const floor = ctx.createLinearGradient(0, vy, 0, s);
  floor.addColorStop(0, '#0b0d0e');
  floor.addColorStop(1, '#202225');
  ctx.fillStyle = floor;
  ctx.beginPath();
  ctx.moveTo(vx - half, vy);
  ctx.lineTo(vx + half, vy);
  ctx.lineTo(s, s);
  ctx.lineTo(0, s);
  ctx.closePath();
  ctx.fill();

  // 两侧墙。
  const wallGradient = (x0) => {
    const g = ctx.createLinearGradient(x0, 0, vx, vy);
    g.addColorStop(0, '#2a2019');
    g.addColorStop(1, '#0b0907');
    return g;
  };
  ctx.fillStyle = wallGradient(0);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(vx - half, vy);
  ctx.lineTo(0, s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = wallGradient(s);
  ctx.beginPath();
  ctx.moveTo(s, 0);
  ctx.lineTo(vx + half, vy);
  ctx.lineTo(s, s);
  ctx.closePath();
  ctx.fill();

  // 透视房间线。
  ctx.strokeStyle = 'rgba(190,180,160,0.16)';
  ctx.lineWidth = 1;
  for (const t of [0.06, 0.16, 0.28, 0.42]) {
    const yTop = vy - (vy) * t;
    const yBottom = vy + (s - vy) * t;
    ctx.beginPath();
    ctx.moveTo(s * t, yTop);
    ctx.lineTo(s * t, yBottom);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * (1 - t), yTop);
    ctx.lineTo(s * (1 - t), yBottom);
    ctx.stroke();
  }

  // 天花灯带：尽头一团暖光。
  const glow = ctx.createRadialGradient(vx, vy - 7, 1, vx, vy - 7, s * 0.24);
  glow.addColorStop(0, 'rgba(255,232,190,0.95)');
  glow.addColorStop(0.18, 'rgba(255,214,158,0.55)');
  glow.addColorStop(0.55, 'rgba(255,196,130,0.16)');
  glow.addColorStop(1, 'rgba(255,190,120,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, s, s * 0.7);

  ctx.fillStyle = warm;
  ctx.fillRect(vx - s * 0.09, vy - 8, s * 0.18, 3);

  // 地面反光。
  const reflect = ctx.createLinearGradient(0, vy, 0, s);
  reflect.addColorStop(0, 'rgba(255,224,180,0.2)');
  reflect.addColorStop(0.5, 'rgba(255,214,168,0.06)');
  reflect.addColorStop(1, 'rgba(255,210,160,0)');
  ctx.fillStyle = reflect;
  ctx.beginPath();
  ctx.moveTo(vx - s * 0.05, vy);
  ctx.lineTo(vx + s * 0.05, vy);
  ctx.lineTo(vx + s * 0.19, s);
  ctx.lineTo(vx - s * 0.19, s);
  ctx.closePath();
  ctx.fill();

  // 右侧的门：由近及远四扇。
  const doorSide = mirror ? -1 : 1;
  for (let i = 0; i < 4; i += 1) {
    const t = 0.12 + i * 0.17;
    const xFar = vx + doorSide * half;
    const xNear = doorSide > 0 ? s * (1 - t) : s * t;
    const x = xFar + (xNear - xFar) * 0.12;
    const w = Math.abs(xNear - xFar) * 0.36;
    const top = vy - (vy * t) * 0.72;
    const bottom = vy + (s - vy) * t * 0.9;
    ctx.fillStyle = 'rgba(38,26,18,0.85)';
    ctx.fillRect(x - (doorSide > 0 ? 0 : w), top, w, bottom - top);
    ctx.strokeStyle = 'rgba(176,148,108,0.22)';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x - (doorSide > 0 ? 0 : w), top, w, bottom - top);
  }

  // 左墙的三块监控屏幕。
  const screenSide = mirror ? 1 : -1;
  for (let i = 0; i < 3; i += 1) {
    const t = 0.28 + i * 0.19;
    const xFar = vx + screenSide * half;
    const xNear = screenSide > 0 ? s * (1 - t) : s * t;
    const y = vy - 12 - i * 8 + t * 18;
    const w = Math.max(3, Math.abs(xNear - xFar) * 0.14);
    ctx.fillStyle = 'rgba(150,240,220,0.55)';
    ctx.fillRect(xNear - (screenSide > 0 ? w : 0), y, w, w * 0.62);
    ctx.fillStyle = 'rgba(150,240,220,0.1)';
    ctx.fillRect(xNear - (screenSide > 0 ? w * 2.2 : 0), y - 4, w * 2.2, w * 1.4);
  }

  // 扫描线 + 噪点。
  ctx.fillStyle = 'rgba(0,0,0,0.26)';
  for (let y = 0; y < s; y += 3) ctx.fillRect(0, y, s, 1);
  const image = ctx.getImageData(0, 0, s, s);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (rng() - 0.5) * 26;
    data[i] = Math.max(0, Math.min(255, data[i] + n * 0.8));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n * 0.9));
  }
  ctx.putImageData(image, 0, 0);

  // 暗角。
  const vignette = ctx.createRadialGradient(vx, vy, s * 0.28, vx, vy, s * 0.66);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, s, s);

  // 录像红点。
  ctx.fillStyle = '#ff3a2a';
  ctx.beginPath();
  ctx.arc(s - 18, 18, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(12, s - 18, 34, 2);
  return canvas;
}

function staticCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(size, size);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const value = 18 + rng() * 110;
    data[i] = value * 0.9;
    data[i + 1] = value;
    data[i + 2] = value * 0.94;
    data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);

  // 横向撕裂带。
  for (let i = 0; i < 5; i += 1) {
    const y = rng() * size;
    const height = 2 + rng() * 8;
    ctx.fillStyle = `rgba(0,0,0,${0.25 + rng() * 0.35})`;
    ctx.fillRect(0, y, size, height);
    ctx.fillStyle = 'rgba(220,240,235,0.12)';
    ctx.fillRect(0, y + height, size, 1);
  }

  // 无信号白条 + 暗角。
  ctx.fillStyle = 'rgba(235,245,242,0.8)';
  ctx.fillRect(size * 0.16, size * 0.52, size * 0.68, 2);
  const vignette = ctx.createRadialGradient(size / 2, size / 2, size * 0.2, size / 2, size / 2, size * 0.72);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.82)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

function darkScreenCanvas(size) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#111614');
  gradient.addColorStop(0.55, '#080a09');
  gradient.addColorStop(1, '#141816');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const sheen = ctx.createLinearGradient(0, 0, size, size);
  sheen.addColorStop(0, 'rgba(180,210,200,0.1)');
  sheen.addColorStop(0.28, 'rgba(180,210,200,0.015)');
  sheen.addColorStop(0.5, 'rgba(0,0,0,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  for (let y = 0; y < size; y += 4) ctx.fillRect(0, y, size, 1);
  return canvas;
}

/* --- 污渍 / 光晕 / 接触影 ------------------------------------------ */

function stainCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  for (let i = 0; i < 7; i += 1) {
    const x = size * (0.25 + rng() * 0.5);
    const y = size * (0.3 + rng() * 0.45);
    const radius = size * (0.08 + rng() * 0.2);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(30,18,9,0.34)');
    gradient.addColorStop(0.55, 'rgba(30,18,9,0.16)');
    gradient.addColorStop(1, 'rgba(30,18,9,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  return canvas;
}

function glowCanvas(size) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, 'rgba(255,255,255,0.95)');
  gradient.addColorStop(0.28, 'rgba(255,255,255,0.4)');
  gradient.addColorStop(0.62, 'rgba(255,255,255,0.1)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

function contactShadowCanvas(size) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, 'rgba(0,0,0,0.55)');
  gradient.addColorStop(0.5, 'rgba(0,0,0,0.28)');
  gradient.addColorStop(0.8, 'rgba(0,0,0,0.08)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
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
  sky.addColorStop(0, '#221c17');
  sky.addColorStop(0.32, '#171310');
  sky.addColorStop(0.55, '#0e0c0a');
  sky.addColorStop(0.78, '#090807');
  sky.addColorStop(1, '#050505');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // 天花灯带：给大理石与金属一点可反射的暖光。
  for (const u of [0.08, 0.24, 0.4, 0.56, 0.72, 0.88]) {
    const x = width * u;
    const glow = ctx.createRadialGradient(x, height * 0.2, 2, x, height * 0.2, width * 0.09);
    glow.addColorStop(0, 'rgba(255,232,196,0.72)');
    glow.addColorStop(0.4, 'rgba(255,214,162,0.2)');
    glow.addColorStop(1, 'rgba(255,208,150,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height * 0.55);
  }

  // 监控屏的青绿色反光。
  for (const [u, v] of [[0.16, 0.44], [0.47, 0.46], [0.79, 0.43]]) {
    const glow = ctx.createRadialGradient(width * u, height * v, 1, width * u, height * v, width * 0.045);
    glow.addColorStop(0, 'rgba(150,240,220,0.5)');
    glow.addColorStop(1, 'rgba(150,240,220,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, height * 0.6, width, height * 0.4);
  return canvas;
}

/* ------------------------------------------------------------------ */

export function createTextureSet(maxAnisotropy = 8) {
  const rng = mulberry32(0x2f17c1);
  const anisotropy = Math.min(8, maxAnisotropy || 8);

  const wallpaper = makeTexture(wallpaperCanvas(512, rng), { anisotropy });
  const marble = makeTexture(marbleCanvas(512, rng), { anisotropy });
  const wood = makeTexture(woodCanvas(512, rng), { anisotropy });
  const ceiling = makeTexture(ceilingCanvas(512, rng), { anisotropy });

  const feedA = makeTexture(feedCanvas(256, rng), { anisotropy });
  const feedB = makeTexture(feedCanvas(256, rng, { mirror: true, warm: '#ffe6b8' }), { anisotropy });
  const staticFeed = makeTexture(staticCanvas(256, rng), { anisotropy });
  const darkFeed = makeTexture(darkScreenCanvas(256), { anisotropy });

  const stain = makeTexture(stainCanvas(128, rng), { anisotropy });
  stain.wrapS = THREE.ClampToEdgeWrapping;
  stain.wrapT = THREE.ClampToEdgeWrapping;

  const glow = new THREE.CanvasTexture(glowCanvas(128));
  glow.colorSpace = THREE.SRGBColorSpace;
  glow.needsUpdate = true;

  const contactShadow = new THREE.CanvasTexture(contactShadowCanvas(128));
  contactShadow.colorSpace = THREE.NoColorSpace;
  contactShadow.needsUpdate = true;

  const environment = new THREE.CanvasTexture(environmentCanvas());
  environment.mapping = THREE.EquirectangularReflectionMapping;
  environment.colorSpace = THREE.SRGBColorSpace;
  environment.needsUpdate = true;

  return {
    wallpaper,
    marble,
    wood,
    ceiling,
    feedA,
    feedB,
    staticFeed,
    darkFeed,
    stain,
    glow,
    contactShadow,
    environment,
  };
}
