import * as THREE from 'three';
import { mulberry32 } from './utils.js';
import { CARPET_STRIPE } from './config.js';

/* ------------------------------------------------------------------ *
 * 程序化材质贴图。
 *
 * 不随包任何位图：灰泥、木纹、地毯、桌布、亚麻、沙发布、石材全部
 * 由 Canvas 在浏览器内生成，可无缝平铺；无外部请求、无字体。
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

function plasterCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f3ede1';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 80; i += 1) {
    const radius = 40 + rng() * 160;
    const gradient = ctx.createRadialGradient(
      rng() * size,
      rng() * size,
      0,
      rng() * size,
      rng() * size,
      radius,
    );
    const light = rng() > 0.45;
    gradient.addColorStop(0, light ? 'rgba(255,251,240,0.05)' : 'rgba(198,184,162,0.045)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  for (let i = 0; i < 2200; i += 1) {
    const light = rng() > 0.5;
    ctx.fillStyle = light ? 'rgba(255,252,245,0.16)' : 'rgba(152,138,118,0.1)';
    ctx.beginPath();
    ctx.arc(rng() * size, rng() * size, 0.4 + rng() * 1.0, 0, Math.PI * 2);
    ctx.fill();
  }

  addGrain(ctx, size, size, rng, 4);
  return canvas;
}

function ceilingCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size * 0.5, size * 0.5, 8, size * 0.5, size * 0.5, size * 0.72);
  gradient.addColorStop(0, '#fdfaf4');
  gradient.addColorStop(0.6, '#f8f3e9');
  gradient.addColorStop(1, '#efe8da');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1200; i += 1) {
    ctx.fillStyle = rng() > 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(150,138,118,0.025)';
    ctx.fillRect(rng() * size, rng() * size, 1 + rng() * 2, 1 + rng() * 2);
  }
  return canvas;
}

function woodCanvas(size, rng, { base = '#c4a17a', dark = [92, 66, 40], light = [244, 230, 208] } = {}) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // 直纹为主，少量山纹，贴图沿 U 方向平铺。
  for (let i = 0; i < 160; i += 1) {
    const y = rng() * size;
    const width = 0.6 + rng() * 2.4;
    const alpha = 0.02 + rng() * 0.07;
    const useDark = rng() > 0.3;
    ctx.strokeStyle = useDark
      ? `rgba(${dark[0]},${dark[1]},${dark[2]},${alpha})`
      : `rgba(${light[0]},${light[1]},${light[2]},${alpha})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= size; x += 24) {
      ctx.lineTo(x, y + Math.sin(x * 0.016 + i * 1.7) * (2 + rng() * 2.4));
    }
    ctx.stroke();
  }

  for (let i = 0; i < 3; i += 1) {
    const x = rng() * size;
    const y = rng() * size;
    ctx.strokeStyle = 'rgba(86,62,40,0.12)';
    ctx.lineWidth = 1.2;
    for (let r = 2; r < 11; r += 3) {
      ctx.beginPath();
      ctx.ellipse(x, y, r * 2.0, r, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  addGrain(ctx, size, size, rng, 5);
  return canvas;
}

function carpetCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  const stripeEvery = size / (2.0 / CARPET_STRIPE.spacing); // 每张 2 m，0.5 m 一条 → 4 条
  const stripeWidth = (CARPET_STRIPE.width / 2.0) * size;

  // 底色：深紫红，带大块明暗，避免平涂。
  ctx.fillStyle = '#511a27';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 70; i += 1) {
    const radius = 30 + rng() * 150;
    const gradient = ctx.createRadialGradient(rng() * size, rng() * size, 0, rng() * size, rng() * size, radius);
    gradient.addColorStop(0, rng() > 0.5 ? 'rgba(96,30,46,0.09)' : 'rgba(36,8,16,0.09)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  // 提花菱格：低对比，近看有织纹，远看是一块整毯。
  ctx.strokeStyle = 'rgba(118,40,58,0.16)';
  ctx.lineWidth = 1.1;
  const cell = size / 8;
  for (let y = -1; y < 9; y += 1) {
    for (let x = -1; x < 9; x += 1) {
      const cx = x * cell + (y % 2 ? cell / 2 : 0);
      const cy = y * cell;
      ctx.beginPath();
      ctx.moveTo(cx, cy - cell * 0.28);
      ctx.lineTo(cx + cell * 0.2, cy);
      ctx.lineTo(cx, cy + cell * 0.28);
      ctx.lineTo(cx - cell * 0.2, cy);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // 细密绒面颗粒。
  for (let i = 0; i < 9000; i += 1) {
    const value = rng();
    ctx.fillStyle = value > 0.5 ? 'rgba(255,210,190,0.03)' : 'rgba(20,4,10,0.045)';
    ctx.fillRect(rng() * size, rng() * size, 1 + rng() * 1.6, 1 + rng() * 1.6);
  }

  // 黄色条纹：贴在贴图边界上，平铺后 2 m 一道、连续不断。
  const drawStripe = (y) => {
    const gradient = ctx.createLinearGradient(0, y - stripeWidth / 2, 0, y + stripeWidth / 2);
    gradient.addColorStop(0, 'rgba(198,160,74,0.0)');
    gradient.addColorStop(0.3, 'rgba(206,169,80,0.62)');
    gradient.addColorStop(0.7, 'rgba(206,169,80,0.62)');
    gradient.addColorStop(1, 'rgba(198,160,74,0.0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, y - stripeWidth / 2, size, stripeWidth);
    ctx.fillStyle = 'rgba(70,44,16,0.18)';
    ctx.fillRect(0, y + stripeWidth / 2 - 0.8, size, 1.6);
  };
  for (let y = 0; y <= size; y += stripeEvery) drawStripe(y);
  drawStripe(size);

  addGrain(ctx, size, size, rng, 3);
  return canvas;
}

function weaveCanvas(size, rng, { base, line, shade, step = 2 }) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 260; i += 1) {
    ctx.fillStyle = rng() > 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.03)';
    ctx.fillRect(rng() * size, rng() * size, 1 + rng() * size * 0.2, 1 + rng() * 2);
  }
  for (let i = 0; i < size; i += step) {
    ctx.fillStyle = line;
    ctx.fillRect(0, i, size, 1);
    ctx.fillStyle = shade;
    ctx.fillRect(i, 0, 1, size);
  }
  addGrain(ctx, size, size, rng, 3);
  return canvas;
}

function stoneCanvas(size, rng) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e6ddcd';
  ctx.fillRect(0, 0, size, size);
  // 水磨石骨料。
  for (let i = 0; i < 2600; i += 1) {
    const tone = rng();
    ctx.fillStyle = tone > 0.72
      ? 'rgba(150,131,108,0.55)'
      : tone > 0.42
        ? 'rgba(190,170,146,0.6)'
        : 'rgba(250,244,232,0.75)';
    const r = 0.6 + rng() * 2.4;
    ctx.beginPath();
    ctx.ellipse(rng() * size, rng() * size, r, r * (0.6 + rng() * 0.7), rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  // 600 模数细缝（一张贴图 1.2 m，2 格）。
  const tile = size / 2;
  ctx.strokeStyle = 'rgba(126,110,90,0.32)';
  ctx.lineWidth = 1.6;
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
  addGrain(ctx, size, size, rng, 5);
  return canvas;
}

function braidCanvas(size) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#b8923f';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(244,214,138,0.55)';
  ctx.lineWidth = 2;
  for (let i = -size; i < size * 2; i += 8) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + size, size);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(88,60,20,0.28)';
  ctx.lineWidth = 1;
  for (let i = -size; i < size * 2; i += 8) {
    ctx.beginPath();
    ctx.moveTo(i + 3, 0);
    ctx.lineTo(i + 3 + size, size);
    ctx.stroke();
  }
  return canvas;
}

function environmentCanvas() {
  const width = 512;
  const height = 256;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#fff6e4');
  sky.addColorStop(0.3, '#f1e3cb');
  sky.addColorStop(0.62, '#c3b099');
  sky.addColorStop(1, '#4c3728');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // 天花灯槽的暖光带：让黄铜、水晶、瓷面有可信反射。
  const bands = [0.12, 0.32, 0.52, 0.72, 0.92];
  bands.forEach((u) => {
    const x = width * u;
    const glow = ctx.createRadialGradient(x, height * 0.08, 2, x, height * 0.08, width * 0.2);
    glow.addColorStop(0, 'rgba(255,247,226,0.9)');
    glow.addColorStop(0.4, 'rgba(255,238,206,0.28)');
    glow.addColorStop(1, 'rgba(255,236,204,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height * 0.5);
  });

  ctx.fillStyle = 'rgba(96,40,46,0.12)';
  ctx.fillRect(0, height * 0.62, width, height * 0.4);
  ctx.fillStyle = 'rgba(70,50,34,0.16)';
  [0.05, 0.28, 0.55, 0.78, 0.96].forEach((u) => ctx.fillRect(width * u, height * 0.3, 5, height * 0.55));
  return canvas;
}

function contactShadowCanvas(size) {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');
  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, 'rgba(24,8,12,0.5)');
  gradient.addColorStop(0.45, 'rgba(24,8,12,0.3)');
  gradient.addColorStop(0.76, 'rgba(24,8,12,0.1)');
  gradient.addColorStop(1, 'rgba(24,8,12,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

export function createTextureSet(maxAnisotropy = 8) {
  const rng = mulberry32(0x10a9e5);
  const anisotropy = Math.min(8, maxAnisotropy || 8);

  const plaster = makeTexture(plasterCanvas(512, rng), { anisotropy });
  const ceiling = makeTexture(ceilingCanvas(512, rng), { anisotropy });
  const oak = makeTexture(woodCanvas(512, rng, { base: '#c9a97f', dark: [96, 68, 40], light: [246, 232, 208] }), { anisotropy });
  const walnut = makeTexture(woodCanvas(512, rng, { base: '#8a6144', dark: [52, 32, 20], light: [206, 168, 130] }), { anisotropy });

  // 地毯：一张贴图 2 × 2 m，条纹 0.5 m 一道。
  const carpet = makeTexture(carpetCanvas(512, rng), { anisotropy });

  const braid = makeTexture(braidCanvas(64), { anisotropy });
  braid.repeat.set(2, 1);

  const clothBlack = makeTexture(
    weaveCanvas(256, rng, { base: '#191a1d', line: 'rgba(255,255,255,0.03)', shade: 'rgba(0,0,0,0.10)', step: 2 }),
    { anisotropy },
  );
  const linen = makeTexture(
    weaveCanvas(256, rng, { base: '#e9dfc9', line: 'rgba(255,252,242,0.16)', shade: 'rgba(122,104,78,0.06)', step: 3 }),
    { anisotropy },
  );
  const sofa = makeTexture(
    weaveCanvas(256, rng, { base: '#8e8c87', line: 'rgba(255,255,255,0.05)', shade: 'rgba(36,36,34,0.07)', step: 2 }),
    { anisotropy },
  );
  const stone = makeTexture(stoneCanvas(512, rng), { anisotropy });

  const contactShadow = new THREE.CanvasTexture(contactShadowCanvas(128));
  contactShadow.colorSpace = THREE.NoColorSpace;
  contactShadow.needsUpdate = true;

  const environment = new THREE.CanvasTexture(environmentCanvas());
  environment.mapping = THREE.EquirectangularReflectionMapping;
  environment.colorSpace = THREE.SRGBColorSpace;
  environment.needsUpdate = true;

  return {
    plaster,
    ceiling,
    oak,
    walnut,
    carpet,
    braid,
    clothBlack,
    linen,
    sofa,
    stone,
    contactShadow,
    environment,
  };
}
