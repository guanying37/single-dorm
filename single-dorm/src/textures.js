import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 * Every surface in this scene is generated at runtime. There are no
 * image downloads, no fonts, and no drawable text anywhere in the 3D
 * world. The canvas work below is deliberately cheap: a small set of
 * power-of-two maps reused across many meshes.
 * ------------------------------------------------------------------ */

function canvas(width, height) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  return c;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function finishTexture(source, { anisotropy = 8, srgb = true, wrap = THREE.ClampToEdgeWrapping } = {}) {
  const texture = new THREE.CanvasTexture(source);
  texture.wrapS = wrap;
  texture.wrapT = wrap;
  texture.anisotropy = anisotropy;
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function paperNoise(ctx, width, height, random, opacity = 0.032, count = 4200) {
  for (let i = 0; i < count; i += 1) {
    const light = random() > 0.52;
    ctx.fillStyle = light
      ? `rgba(255, 249, 227, ${opacity * (0.35 + random() * 0.65)})`
      : `rgba(83, 58, 21, ${opacity * (0.22 + random() * 0.5)})`;
    const r = 0.35 + random() * 1.6;
    ctx.beginPath();
    ctx.arc(random() * width, random() * height, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ------------------------------------------------------------------ *
 * Yellow wallpaper: a seamless 1.2 m tile with a subtle trellis and
 * hand-painted floral sprigs. The motifs sit inside 128 px cells so the
 * tile edges stay perfectly continuous.
 * ------------------------------------------------------------------ */

function drawLeaf(ctx, x, y, angle, length, width, fill, stroke) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(width, -length * 0.35, 0, -length);
  ctx.quadraticCurveTo(-width, -length * 0.35, 0, 0);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.quadraticCurveTo(width * 0.15, -length * 0.5, 0, -length * 0.86);
  ctx.strokeStyle = stroke || fill;
  ctx.lineWidth = 0.7;
  ctx.stroke();
  ctx.restore();
}

function drawWallSprig(ctx, cx, cy, flip, random) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(flip ? Math.PI : 0);

  const olive = 'rgba(134, 117, 66, 0.30)';
  const oliveDark = 'rgba(111, 95, 52, 0.28)';
  const cream = 'rgba(251, 239, 196, 0.62)';
  const gold = 'rgba(177, 145, 72, 0.36)';

  // Fine central stem.
  ctx.strokeStyle = oliveDark;
  ctx.lineWidth = 1.35;
  ctx.beginPath();
  ctx.moveTo(-1, 45);
  ctx.bezierCurveTo(7, 24, -7, 4, 1, -38);
  ctx.stroke();

  // Side tendrils.
  ctx.lineWidth = 1.05;
  ctx.strokeStyle = olive;
  ctx.beginPath();
  ctx.moveTo(0, 22);
  ctx.quadraticCurveTo(-24, 19, -34, 5);
  ctx.moveTo(0, 2);
  ctx.quadraticCurveTo(21, -2, 29, -15);
  ctx.stroke();

  // Leaves, alternating either side of the stem.
  const leaves = [
    [-3, 27, -0.95, 25, 8.5],
    [3, 18, 1.12, 22, 7.5],
    [-2, 7, -1.05, 22, 7.8],
    [4, -4, 1.02, 20, 7.0],
    [-4, -17, -0.9, 17, 6.1],
    [27, -8, 0.56, 13, 5.0],
    [-35, 4, -0.44, 12, 4.8],
  ];
  for (const [x, y, angle, length, width] of leaves) {
    drawLeaf(ctx, x, y, angle, length, width, olive, oliveDark);
  }

  // Blossom with five soft petals.
  const flowerX = 1;
  const flowerY = -38;
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    ctx.save();
    ctx.translate(flowerX + Math.cos(angle) * 7, flowerY + Math.sin(angle) * 7);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, 7.5, 4.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = cream;
    ctx.fill();
    ctx.strokeStyle = gold;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(flowerX, flowerY, 3.4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(168, 129, 52, 0.58)';
  ctx.fill();

  // Two tiny bud dots for a hand-printed rhythm.
  ctx.beginPath();
  ctx.arc(-8, -16, 2.0, 0, Math.PI * 2);
  ctx.arc(9, 34, 1.7, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(168, 129, 52, 0.4)';
  ctx.fill();

  // Very faint pearl dot in the leaf gaps.
  if (random() > 0.38) {
    ctx.beginPath();
    ctx.arc(-25, -25, 1.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(250, 238, 200, 0.4)';
    ctx.fill();
  }
  ctx.restore();
}

function makeWallpaperTexture(anisotropy) {
  const size = 512;
  const c = canvas(size, size);
  const ctx = c.getContext('2d');
  const random = mulberry32(0xA17E5);

  ctx.fillStyle = '#e3c776';
  ctx.fillRect(0, 0, size, size);

  // Faint bands, wide enough not to shimmer once repeated.
  for (let x = 0; x < size; x += 128) {
    const gradient = ctx.createLinearGradient(x, 0, x + 128, 0);
    gradient.addColorStop(0, 'rgba(255, 241, 191, 0.055)');
    gradient.addColorStop(0.46, 'rgba(255, 241, 191, 0.015)');
    gradient.addColorStop(1, 'rgba(107, 84, 33, 0.028)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, 0, 128, size);
  }

  // A quiet trellis.
  ctx.save();
  ctx.strokeStyle = 'rgba(129, 109, 56, 0.085)';
  ctx.lineWidth = 1;
  for (let i = -size; i < size * 2; i += 128) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + size, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i, size);
    ctx.lineTo(i + size, 0);
    ctx.stroke();
  }
  ctx.restore();

  // A grid of small floral sprigs. Each cell is fully self-contained so
  // the repeat seam remains invisible.
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      drawWallSprig(ctx, 64 + col * 128, 64 + row * 128, (row + col) % 2 === 1, random);
    }
  }

  // Sparse pin dots at cell corners.
  ctx.fillStyle = 'rgba(238, 218, 161, 0.34)';
  for (let y = 0; y < size; y += 128) {
    for (let x = 64; x < size; x += 128) {
      ctx.beginPath();
      ctx.arc(x, y, 1.15, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  paperNoise(ctx, size, size, random, 0.022, 3000);

  return finishTexture(c, { anisotropy, wrap: THREE.RepeatWrapping });
}

/* ------------------------------------------------------------------ *
 * Honey-oak plank floor. One large map covers the room, so there is no
 * obvious repeating pattern underfoot. Planks run north/south.
 * ------------------------------------------------------------------ */

function grainStroke(ctx, x, y0, y1, drift, width, color) {
  ctx.beginPath();
  ctx.moveTo(x, y0);
  ctx.bezierCurveTo(
    x + drift * 0.5, y0 + (y1 - y0) * 0.3,
    x - drift * 0.3, y0 + (y1 - y0) * 0.68,
    x + drift, y1,
  );
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function makeFloorTexture(anisotropy) {
  const size = 1024;
  const c = canvas(size, size);
  const ctx = c.getContext('2d');
  const random = mulberry32(0xF1002);
  const plankCount = 24;
  const plankW = size / plankCount;

  ctx.fillStyle = '#a87345';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < plankCount; i += 1) {
    const x = i * plankW;
    // Randomly staggered butt joints along the length of each plank.
    const joints = [0];
    let y = 90 + random() * 210;
    while (y < size - 90) {
      joints.push(Math.round(y));
      y += 240 + random() * 260;
    }
    joints.push(size);

    for (let j = 0; j < joints.length - 1; j += 1) {
      const y0 = joints[j];
      const y1 = joints[j + 1];
      const hue = 29 + random() * 6;
      const sat = 35 + random() * 12;
      const light = 42 + random() * 10;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y0, plankW, y1 - y0);
      ctx.clip();

      // Base board colour.
      ctx.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;
      ctx.fillRect(x, y0, plankW, y1 - y0);

      // Broad light and shadow tongues in the grain.
      const wash = ctx.createLinearGradient(x, 0, x + plankW, 0);
      wash.addColorStop(0, 'rgba(71, 37, 16, 0.09)');
      wash.addColorStop(0.18, 'rgba(255, 227, 175, 0.08)');
      wash.addColorStop(0.5, 'rgba(255, 235, 189, 0.03)');
      wash.addColorStop(0.82, 'rgba(82, 44, 20, 0.06)');
      wash.addColorStop(1, 'rgba(55, 29, 13, 0.13)');
      ctx.fillStyle = wash;
      ctx.fillRect(x, y0, plankW, y1 - y0);

      // Fine, wandering grain.
      const grainCount = 7 + Math.floor(random() * 4);
      for (let g = 0; g < grainCount; g += 1) {
        const gx = x + 3 + random() * (plankW - 6);
        const drift = (random() - 0.5) * 11;
        const alpha = 0.055 + random() * 0.12;
        grainStroke(
          ctx, gx, y0 - 8, y1 + 8, drift,
          0.65 + random() * 1.15,
          random() > 0.22 ? `rgba(71, 40, 21, ${alpha})` : `rgba(255, 231, 187, ${alpha * 0.7})`,
        );
      }

      // Occasional tiny knot.
      if (random() > 0.68) {
        const kx = x + 9 + random() * (plankW - 18);
        const ky = y0 + 35 + random() * Math.max(20, (y1 - y0) - 70);
        ctx.save();
        ctx.translate(kx, ky);
        ctx.rotate((random() - 0.5) * 0.45);
        for (let r = 0; r < 3; r += 1) {
          ctx.beginPath();
          ctx.ellipse(0, 0, 3.2 + r * 3.4, 1.3 + r * 1.5, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(63, 34, 16, ${0.13 - r * 0.028})`;
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Butt-joint shadow and a highlight along the upper edge.
      if (j > 0) {
        ctx.fillStyle = 'rgba(55, 28, 12, 0.28)';
        ctx.fillRect(x, y0, plankW, 2);
        ctx.fillStyle = 'rgba(255, 224, 174, 0.12)';
        ctx.fillRect(x, y0 + 2, plankW, 1);
      }
      ctx.restore();

      // Dark seam at the left edge of each board.
      ctx.fillStyle = 'rgba(52, 27, 12, 0.22)';
      ctx.fillRect(x, y0, 1.2, y1 - y0);
      ctx.fillStyle = 'rgba(255, 228, 178, 0.10)';
      ctx.fillRect(x + 1.2, y0, 0.9, y1 - y0);
    }
  }

  // Fine overall surface noise to keep the clear finish from looking flat.
  paperNoise(ctx, size, size, random, 0.018, 3800);

  return finishTexture(c, { anisotropy, wrap: THREE.ClampToEdgeWrapping });
}

/* ------------------------------------------------------------------ *
 * Two general furniture woods. These use RepeatWrapping because box
 * UVs are authored per face by Three.js.
 * ------------------------------------------------------------------ */

function makeWoodTexture(anisotropy, { base, dark, light, seed, knots = true }) {
  const size = 512;
  const c = canvas(size, size);
  const ctx = c.getContext('2d');
  const random = mulberry32(seed);

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  const broad = ctx.createLinearGradient(0, 0, size, 0);
  broad.addColorStop(0, 'rgba(255, 231, 193, 0.045)');
  broad.addColorStop(0.4, 'rgba(255, 222, 173, 0.05)');
  broad.addColorStop(0.75, 'rgba(42, 23, 15, 0.04)');
  broad.addColorStop(1, 'rgba(30, 18, 10, 0.08)');
  ctx.fillStyle = broad;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 160; i += 1) {
    const x = random() * size;
    const bend = (random() - 0.5) * 8;
    ctx.beginPath();
    ctx.moveTo(x, -10);
    ctx.bezierCurveTo(x + bend, size * 0.28, x - bend * 0.65, size * 0.68, x + bend * 0.25, size + 10);
    const useDark = random() > 0.3;
    ctx.strokeStyle = useDark ? dark : light;
    ctx.globalAlpha = useDark ? 0.05 + random() * 0.14 : 0.04 + random() * 0.11;
    ctx.lineWidth = 0.45 + random() * 1.35;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  if (knots) {
    for (let k = 0; k < 4; k += 1) {
      const kx = 40 + random() * (size - 80);
      const ky = 60 + random() * (size - 120);
      ctx.save();
      ctx.translate(kx, ky);
      ctx.rotate(random() * Math.PI);
      for (let ring = 0; ring < 4; ring += 1) {
        ctx.beginPath();
        ctx.ellipse(0, 0, 4 + ring * 3.8, 2.1 + ring * 1.8, 0, 0, Math.PI * 2);
        ctx.strokeStyle = dark;
        ctx.globalAlpha = 0.14 - ring * 0.022;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  // A few soft pore flecks.
  for (let i = 0; i < 900; i += 1) {
    ctx.fillStyle = `rgba(45, 25, 14, ${0.02 + random() * 0.05})`;
    ctx.fillRect(random() * size, random() * size, 0.6 + random(), 2 + random() * 5);
  }

  return finishTexture(c, { anisotropy, wrap: THREE.RepeatWrapping });
}

/* ------------------------------------------------------------------ *
 * Woven red entry rug. Symmetrical, slightly faded, no letters.
 * ------------------------------------------------------------------ */

function drawDiamond(ctx, x, y, w, h, fill, stroke, lineWidth = 2) {
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x - w, y);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function makeRugTexture(anisotropy) {
  const w = 640;
  const h = 480;
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  const random = mulberry32(0xC4A7E);

  const ground = ctx.createRadialGradient(w * 0.46, h * 0.48, 40, w / 2, h / 2, w * 0.65);
  ground.addColorStop(0, '#8f2f31');
  ground.addColorStop(0.55, '#792526');
  ground.addColorStop(1, '#4d1518');
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, w, h);

  // Outer border bands.
  ctx.strokeStyle = '#d5ae68';
  ctx.lineWidth = 5;
  ctx.strokeRect(17, 17, w - 34, h - 34);
  ctx.strokeStyle = 'rgba(241, 213, 155, 0.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, w - 60, h - 60);
  ctx.strokeStyle = '#55191b';
  ctx.lineWidth = 16;
  ctx.strokeRect(44, 44, w - 88, h - 88);
  ctx.strokeStyle = 'rgba(212, 172, 101, 0.62)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(55, 55, w - 110, h - 110);

  // Flower/diamond border motifs.
  const motif = '#b98453';
  for (let x = 78; x < w - 60; x += 52) {
    drawDiamond(ctx, x, 37, 6, 9, motif, null);
    drawDiamond(ctx, x, h - 37, 6, 9, motif, null);
  }
  for (let y = 88; y < h - 70; y += 52) {
    drawDiamond(ctx, 37, y, 6, 9, motif, null);
    drawDiamond(ctx, w - 37, y, 6, 9, motif, null);
  }

  // A long central medallion composed of nested geometric shapes.
  ctx.save();
  ctx.translate(w / 2, h / 2);
  drawDiamond(ctx, 0, 0, 165, 142, 'rgba(51, 15, 18, 0.44)', 'rgba(215, 175, 105, 0.72)', 2.5);
  drawDiamond(ctx, 0, 0, 139, 118, null, 'rgba(215, 175, 105, 0.5)', 1.4);
  drawDiamond(ctx, 0, 0, 94, 85, '#7a2627', 'rgba(231, 196, 128, 0.76)', 2.2);
  drawDiamond(ctx, 0, 0, 68, 62, 'rgba(39, 13, 17, 0.38)', null);
  drawDiamond(ctx, 0, 0, 38, 37, '#b98754', null);

  // Eight small radial buds around the medallion.
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    ctx.save();
    ctx.rotate(a);
    ctx.translate(0, -168);
    drawDiamond(ctx, 0, 0, 10, 19, 'rgba(185, 132, 83, 0.76)', null);
    ctx.beginPath();
    ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(79, 24, 26, 0.76)';
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Corner flourishes, kept behind the border.
  const corner = (cx, cy, sx, sy) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(sx, sy);
    ctx.strokeStyle = 'rgba(199, 156, 92, 0.44)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(48, 7, 87, 42, 96, 92);
    ctx.stroke();
    for (let i = 1; i < 4; i += 1) {
      ctx.beginPath();
      ctx.arc(15 + i * 17, 15 + i * 17, 9 + i * 2.5, 0, Math.PI * 1.6);
      ctx.stroke();
    }
    ctx.restore();
  };
  corner(72, 72, 1, 1);
  corner(w - 72, 72, -1, 1);
  corner(72, h - 72, 1, -1);
  corner(w - 72, h - 72, -1, -1);

  // Woven texture: offset dots and tiny threads.
  for (let y = 0; y < h; y += 4) {
    for (let x = (y / 4) % 2 === 0 ? 0 : 2; x < w; x += 4) {
      ctx.fillStyle = `rgba(36, 12, 13, ${0.035 + random() * 0.04})`;
      ctx.fillRect(x, y, 1.2, 1.2);
    }
  }
  for (let y = 0; y < h; y += 3) {
    ctx.fillStyle = `rgba(253, 210, 160, ${0.01 + random() * 0.025})`;
    ctx.fillRect(0, y, w, 0.6);
  }

  paperNoise(ctx, w, h, random, 0.018, 2000);

  return finishTexture(c, { anisotropy });
}

/* ------------------------------------------------------------------ *
 * The two required portraits. Both are original geometric homages,
 * painted without any text or downloaded artwork.
 * ------------------------------------------------------------------ */

function goldStar(ctx, x, y, points, outer, inner, rotation = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rotation + (i / (points * 2)) * Math.PI * 2;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function makeEmblemArt(anisotropy) {
  const w = 512;
  const h = 400;
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  const random = mulberry32(0x40A1);

  // Printed matte shows around the dark crest print.
  ctx.fillStyle = '#efe5cd';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#1a2942';
  ctx.fillRect(22, 22, w - 44, h - 44);

  const halo = ctx.createRadialGradient(w / 2, 176, 12, w / 2, 176, 220);
  halo.addColorStop(0, 'rgba(71, 96, 126, 0.34)');
  halo.addColorStop(0.62, 'rgba(36, 53, 81, 0.16)');
  halo.addColorStop(1, 'rgba(9, 15, 27, 0.16)');
  ctx.fillStyle = halo;
  ctx.fillRect(22, 22, w - 44, h - 44);

  // Inner gold keyline.
  ctx.strokeStyle = 'rgba(217, 184, 110, 0.66)';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(38, 38, w - 76, h - 76);

  const cx = w / 2;
  const cy = 170;
  const gold = '#d8b568';
  const paleGold = '#f4df9e';
  const deepGold = '#9d7738';

  ctx.save();
  ctx.translate(cx, cy);

  // Wings: layered feather fans.
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    for (let i = 0; i < 7; i += 1) {
      const y = 24 - i * 13;
      const len = 66 + i * 13;
      ctx.beginPath();
      ctx.moveTo(42, y + 9);
      ctx.quadraticCurveTo(42 + len * 0.58, y - 13 - i * 1.5, 42 + len, y - 8 + i * 2.2);
      ctx.quadraticCurveTo(42 + len * 0.55, y + 5 + i * 2, 42, y + 9);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(216, 181, 104, 0.96)' : 'rgba(173, 134, 66, 0.92)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(82, 58, 27, 0.7)';
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(54, y + 2);
      ctx.quadraticCurveTo(96 + i * 7, y - 3 - i * 1.2, 128 + i * 5, y - 4 + i * 1.1);
      ctx.strokeStyle = 'rgba(255, 236, 174, 0.48)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  // Outer crest ring.
  ctx.beginPath();
  ctx.arc(0, 0, 114, 0, Math.PI * 2);
  ctx.fillStyle = '#1d2d48';
  ctx.fill();
  ctx.strokeStyle = gold;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 102, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(238, 211, 144, 0.82)';
  ctx.lineWidth = 1.3;
  ctx.stroke();

  // Tick ring, an old academy seal detail.
  for (let i = 0; i < 32; i += 1) {
    const a = (i / 32) * Math.PI * 2;
    const long = i % 4 === 0;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 105, Math.sin(a) * 105);
    ctx.lineTo(Math.cos(a) * (long ? 112 : 109), Math.sin(a) * (long ? 112 : 109));
    ctx.strokeStyle = long ? paleGold : 'rgba(216, 181, 104, 0.62)';
    ctx.lineWidth = long ? 2.2 : 1.1;
    ctx.stroke();
  }

  // A rising-sun crest behind a heraldic shield.
  for (let i = 0; i < 20; i += 1) {
    const a = -Math.PI + (i / 19) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 48, Math.sin(a) * 48 - 19);
    ctx.lineTo(Math.cos(a) * (i % 2 === 0 ? 88 : 74), Math.sin(a) * (i % 2 === 0 ? 88 : 74) - 19);
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(238, 211, 144, 0.82)' : 'rgba(216, 181, 104, 0.44)';
    ctx.lineWidth = i % 2 === 0 ? 2.3 : 1.4;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, -19, 37, 0, Math.PI * 2);
  ctx.fillStyle = gold;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-8, -26, 18, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(250, 231, 170, 0.55)';
  ctx.fill();

  // Shield.
  ctx.beginPath();
  ctx.moveTo(-63, -2);
  ctx.lineTo(63, -2);
  ctx.lineTo(58, 45);
  ctx.quadraticCurveTo(40, 85, 0, 108);
  ctx.quadraticCurveTo(-40, 85, -58, 45);
  ctx.closePath();
  ctx.fillStyle = '#f0e1bb';
  ctx.fill();
  ctx.strokeStyle = deepGold;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 250, 228, 0.8)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Three ascending chevrons inside the shield.
  for (let i = 0; i < 3; i += 1) {
    const y = 22 + i * 22;
    ctx.beginPath();
    ctx.moveTo(-33, y + 15);
    ctx.lineTo(0, y - 7);
    ctx.lineTo(33, y + 15);
    ctx.lineTo(33, y + 25);
    ctx.lineTo(0, y + 3);
    ctx.lineTo(-33, y + 25);
    ctx.closePath();
    ctx.fillStyle = i === 0 ? '#294262' : i === 1 ? '#8b6e3c' : '#294262';
    ctx.fill();
  }

  // Star at the crest.
  goldStar(ctx, 0, -96, 5, 13, 4.8);
  ctx.fillStyle = paleGold;
  ctx.fill();
  ctx.strokeStyle = 'rgba(94, 66, 28, 0.7)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Laurel flourishes under the shield.
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.beginPath();
    ctx.moveTo(-5, 100);
    ctx.bezierCurveTo(34, 112, 76, 99, 99, 68);
    ctx.strokeStyle = gold;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    for (let i = 0; i < 5; i += 1) {
      const x = 22 + i * 16;
      const y = 105 - i * 7;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.35 - i * 0.14);
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(216, 181, 104, 0.9)' : 'rgba(167, 131, 67, 0.9)';
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  // Blank ribbon.
  ctx.beginPath();
  ctx.moveTo(-80, 139);
  ctx.quadraticCurveTo(-38, 151, 0, 143);
  ctx.quadraticCurveTo(38, 151, 80, 139);
  ctx.lineTo(67, 166);
  ctx.quadraticCurveTo(28, 176, 0, 167);
  ctx.quadraticCurveTo(-28, 176, -67, 166);
  ctx.closePath();
  ctx.fillStyle = '#d9b568';
  ctx.fill();
  ctx.strokeStyle = '#8e6d38';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-49, 150);
  ctx.quadraticCurveTo(0, 161, 49, 150);
  ctx.strokeStyle = 'rgba(255, 243, 196, 0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();

  // Tiny specks of age.
  for (let i = 0; i < 650; i += 1) {
    ctx.fillStyle = `rgba(241, 225, 184, ${random() * 0.035})`;
    ctx.fillRect(22 + random() * (w - 44), 22 + random() * (h - 44), 0.8, 0.8);
  }

  return finishTexture(c, { anisotropy });
}

function jaggedPath(ctx, cx, cy, outerRadius, innerRadius, points, rotation = 0) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outerRadius * (0.78 + Math.random() * 0.32) : innerRadius;
    const a = rotation + (i / (points * 2)) * Math.PI * 2;
    const x = cx + Math.cos(a) * radius;
    const y = cy + Math.sin(a) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function makeMonokumaArt(anisotropy) {
  const w = 512;
  const h = 400;
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  const random = mulberry32(0xB0B0);

  // Aged, sickly mint studio backdrop.
  const backdrop = ctx.createRadialGradient(w * 0.48, h * 0.4, 20, w * 0.5, h * 0.5, w * 0.72);
  backdrop.addColorStop(0, '#aab9aa');
  backdrop.addColorStop(0.62, '#87998e');
  backdrop.addColorStop(1, '#5a6c65');
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, w, h);

  // Halftone dots, like a cheaply printed school poster.
  for (let y = 15; y < h; y += 14) {
    for (let x = 20 + ((y / 14) % 2) * 7; x < w - 10; x += 14) {
      ctx.beginPath();
      ctx.arc(x, y, 1.25, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(238, 244, 222, ${0.035 + random() * 0.025})`;
      ctx.fill();
    }
  }

  // Cream paper border and fine red keyline.
  ctx.strokeStyle = 'rgba(239, 231, 200, 0.9)';
  ctx.lineWidth = 18;
  ctx.strokeRect(9, 9, w - 18, h - 18);
  ctx.strokeStyle = '#7c2028';
  ctx.lineWidth = 2.2;
  ctx.strokeRect(26, 26, w - 52, h - 52);
  ctx.strokeStyle = 'rgba(33, 37, 32, 0.45)';
  ctx.lineWidth = 1;
  ctx.strokeRect(31, 31, w - 62, h - 62);

  // Subtle paint splatter.
  for (let i = 0; i < 900; i += 1) {
    ctx.fillStyle = `rgba(35, 42, 36, ${random() * 0.06})`;
    ctx.fillRect(30 + random() * (w - 60), 30 + random() * (h - 60), 0.9, 0.9);
  }

  const cx = w / 2;
  const cy = 190;
  const headR = 134;

  // Soft drop shadow separating the head from the backdrop.
  ctx.save();
  ctx.translate(cx + 7, cy + 13);
  ctx.scale(1.02, 1);
  ctx.beginPath();
  ctx.arc(0, 0, headR + 20, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(20, 26, 23, 0.23)';
  ctx.fill();
  ctx.restore();

  // Ears.
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(cx + side * 104, cy - 105, 53, 0, Math.PI * 2);
    ctx.fillStyle = side < 0 ? '#f1eee2' : '#171a1b';
    ctx.fill();
    ctx.strokeStyle = '#0c0e0f';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + side * 104, cy - 105, 27, 0, Math.PI * 2);
    ctx.fillStyle = side < 0 ? '#d6d3c8' : '#3b3d3b';
    ctx.fill();
  }

  // Head silhouette: left bone-white, right pitch-black.
  ctx.beginPath();
  ctx.arc(cx, cy, headR, 0, Math.PI * 2);
  ctx.fillStyle = '#f1eee2';
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.rect(cx, cy - headR, headR + 10, headR * 2);
  ctx.clip();
  ctx.beginPath();
  ctx.arc(cx, cy, headR, 0, Math.PI * 2);
  ctx.fillStyle = '#171a1b';
  ctx.fill();
  ctx.restore();

  // Crisp black outline and centre seam.
  ctx.beginPath();
  ctx.arc(cx, cy, headR, 0, Math.PI * 2);
  ctx.strokeStyle = '#0b0d0e';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 1, cy - headR + 8);
  ctx.bezierCurveTo(cx - 8, cy - 48, cx + 7, cy + 47, cx + 1, cy + headR - 7);
  ctx.strokeStyle = 'rgba(9, 10, 11, 0.64)';
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // White-side glossy black eye.
  ctx.save();
  ctx.translate(cx - 58, cy - 19);
  ctx.rotate(-0.09);
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 33, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#111314';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-7, -11, 6, 8, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 248, 0.92)';
  ctx.fill();
  ctx.restore();

  // Black-side glowing red, jagged eye.
  ctx.save();
  ctx.translate(cx + 58, cy - 18);
  ctx.shadowColor = 'rgba(226, 45, 50, 0.75)';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#db2938';
  jaggedPath(ctx, 0, 0, 31, 15, 7, -0.22);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255, 116, 112, 0.8)';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(2, 2, 7, 13, 0.18, 0, Math.PI * 2);
  ctx.fillStyle = '#150e11';
  ctx.fill();
  ctx.restore();

  // Nose.
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy + 33);
  ctx.quadraticCurveTo(cx, cy + 24, cx + 14, cy + 33);
  ctx.quadraticCurveTo(cx + 5, cy + 48, cx, cy + 50);
  ctx.quadraticCurveTo(cx - 5, cy + 48, cx - 14, cy + 33);
  ctx.closePath();
  ctx.fillStyle = '#111314';
  ctx.fill();

  // Wide grin with jagged teeth.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - 103, cy + 50);
  ctx.quadraticCurveTo(cx - 58, cy + 38, cx - 22, cy + 55);
  ctx.quadraticCurveTo(cx, cy + 65, cx + 22, cy + 55);
  ctx.quadraticCurveTo(cx + 58, cy + 38, cx + 103, cy + 50);
  ctx.quadraticCurveTo(cx + 82, cy + 102, cx + 31, cy + 111);
  ctx.quadraticCurveTo(cx, cy + 117, cx - 31, cy + 111);
  ctx.quadraticCurveTo(cx - 82, cy + 102, cx - 103, cy + 50);
  ctx.closePath();
  ctx.fillStyle = '#111314';
  ctx.fill();
  ctx.strokeStyle = 'rgba(247, 243, 225, 0.75)';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Teeth as alternating triangles across the upper and lower lips.
  const left = cx - 90;
  const right = cx + 90;
  const toothCount = 12;
  for (let i = 0; i < toothCount; i += 1) {
    const t0 = i / toothCount;
    const t1 = (i + 0.5) / toothCount;
    const t2 = (i + 1) / toothCount;
    const x0 = left + (right - left) * t0;
    const x1 = left + (right - left) * t1;
    const x2 = left + (right - left) * t2;
    ctx.beginPath();
    ctx.moveTo(x0, cy + 56 + Math.sin(t0 * Math.PI) * 3);
    ctx.lineTo(x1, cy + 83 - Math.sin(t1 * Math.PI) * 6);
    ctx.lineTo(x2, cy + 56 + Math.sin(t2 * Math.PI) * 3);
    ctx.closePath();
    ctx.fillStyle = '#f2eddc';
    ctx.fill();
  }
  for (let i = 0; i < toothCount - 1; i += 1) {
    const t0 = (i + 0.5) / toothCount;
    const t1 = (i + 1) / toothCount;
    const t2 = (i + 1.5) / toothCount;
    const x0 = left + (right - left) * t0;
    const x1 = left + (right - left) * t1;
    const x2 = left + (right - left) * t2;
    ctx.beginPath();
    ctx.moveTo(x0, cy + 103 - Math.sin(t0 * Math.PI) * 2);
    ctx.lineTo(x1, cy + 82 + Math.sin(t1 * Math.PI) * 4);
    ctx.lineTo(x2, cy + 103 - Math.sin(t2 * Math.PI) * 2);
    ctx.closePath();
    ctx.fillStyle = '#e7e0ce';
    ctx.fill();
  }
  ctx.restore();

  // Scratchy comic highlights.
  ctx.beginPath();
  ctx.arc(cx - 72, cy - 79, 37, Math.PI * 1.12, Math.PI * 1.72);
  ctx.strokeStyle = 'rgba(255, 255, 246, 0.33)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // A small red stamp-like circle in the lower corner, no glyphs.
  ctx.beginPath();
  ctx.arc(w - 70, h - 66, 18, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(119, 30, 36, 0.65)';
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w - 80, h - 66);
  ctx.lineTo(w - 60, h - 66);
  ctx.moveTo(w - 70, h - 76);
  ctx.lineTo(w - 70, h - 56);
  ctx.strokeStyle = 'rgba(119, 30, 36, 0.48)';
  ctx.lineWidth = 1.1;
  ctx.stroke();

  return finishTexture(c, { anisotropy });
}

/* ------------------------------------------------------------------ *
 * An old surveillance CRT feed. Still, scanned and deliberately low-fi.
 * ------------------------------------------------------------------ */

function makeCrtTexture(anisotropy) {
  const w = 320;
  const h = 240;
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  const random = mulberry32(0x5EC0);

  const bg = ctx.createRadialGradient(w * 0.5, h * 0.45, 10, w * 0.5, h * 0.5, w * 0.68);
  bg.addColorStop(0, '#c1cbb9');
  bg.addColorStop(0.54, '#849485');
  bg.addColorStop(1, '#26392f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Perspective hallway.
  ctx.save();
  const horizon = 96;
  ctx.strokeStyle = 'rgba(30, 47, 38, 0.55)';
  ctx.lineWidth = 1.4;
  for (let i = -4; i <= 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(w / 2 + i * 17, horizon);
    ctx.lineTo(w / 2 + i * 60, h + 20);
    ctx.stroke();
  }
  for (let i = 0; i < 7; i += 1) {
    const y = horizon + i * i * 2.8 + i * 7;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.strokeStyle = `rgba(37, 52, 42, ${0.22 - i * 0.018})`;
    ctx.stroke();
  }
  ctx.restore();

  // Far door, slightly off-centre.
  const dx = 196;
  const dy = 112;
  const dw = 74;
  const dh = 118;
  ctx.fillStyle = 'rgba(56, 67, 57, 0.65)';
  ctx.fillRect(dx, dy, dw, dh);
  ctx.strokeStyle = 'rgba(214, 224, 202, 0.28)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(dx + 2, dy + 2, dw - 4, dh - 4);
  ctx.fillStyle = 'rgba(211, 220, 198, 0.18)';
  ctx.fillRect(dx + 8, dy + 13, dw - 16, 34);
  ctx.fillRect(dx + 8, dy + 55, dw - 16, 46);
  ctx.fillStyle = 'rgba(228, 234, 215, 0.6)';
  ctx.beginPath();
  ctx.arc(dx + dw - 12, dy + 64, 2.1, 0, Math.PI * 2);
  ctx.fill();

  // Ceiling light band.
  const light = ctx.createLinearGradient(0, 42, 0, 62);
  light.addColorStop(0, 'rgba(241, 246, 226, 0)');
  light.addColorStop(0.45, 'rgba(245, 247, 222, 0.46)');
  light.addColorStop(1, 'rgba(230, 239, 214, 0)');
  ctx.fillStyle = light;
  ctx.fillRect(112, 42, 92, 20);

  // Dark furniture shape to sell the hallway.
  ctx.fillStyle = 'rgba(31, 43, 35, 0.62)';
  ctx.fillRect(21, 132, 57, 108);
  ctx.fillRect(255, 143, 65, 97);
  ctx.fillStyle = 'rgba(170, 187, 158, 0.14)';
  ctx.fillRect(28, 141, 43, 6);

  // Vignette.
  const vignette = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, 212);
  vignette.addColorStop(0, 'rgba(6, 11, 9, 0)');
  vignette.addColorStop(0.7, 'rgba(6, 11, 9, 0.14)');
  vignette.addColorStop(1, 'rgba(2, 6, 4, 0.74)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  // Blown-out CRT bloom and rolling interference.
  const bloom = ctx.createRadialGradient(164, 112, 0, 164, 112, 150);
  bloom.addColorStop(0, 'rgba(239, 248, 225, 0.2)');
  bloom.addColorStop(0.4, 'rgba(217, 234, 207, 0.05)');
  bloom.addColorStop(1, 'rgba(217, 234, 207, 0)');
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(218, 236, 213, 0.06)';
  ctx.fillRect(0, 137, w, 19);

  // Scanlines and static.
  ctx.fillStyle = 'rgba(0, 8, 4, 0.2)';
  for (let y = 0; y < h; y += 2) ctx.fillRect(0, y, w, 1);
  for (let i = 0; i < 2400; i += 1) {
    const bright = random() > 0.4;
    ctx.fillStyle = bright
      ? `rgba(238, 246, 225, ${random() * 0.16})`
      : `rgba(10, 17, 11, ${random() * 0.2})`;
    ctx.fillRect(random() * w, random() * h, 0.7 + random() * 1.5, 0.6 + random());
  }

  // Corner camera brackets, no characters.
  ctx.strokeStyle = 'rgba(225, 239, 215, 0.38)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(14, 28);
  ctx.lineTo(14, 14);
  ctx.lineTo(28, 14);
  ctx.moveTo(w - 14, 28);
  ctx.lineTo(w - 14, 14);
  ctx.lineTo(w - 28, 14);
  ctx.moveTo(14, h - 28);
  ctx.lineTo(14, h - 14);
  ctx.lineTo(28, h - 14);
  ctx.moveTo(w - 14, h - 28);
  ctx.lineTo(w - 14, h - 14);
  ctx.lineTo(w - 28, h - 14);
  ctx.stroke();

  return finishTexture(c, { anisotropy });
}

/* ------------------------------------------------------------------ *
 * Small wooden pen cup: natural bird-and-flower painting on smooth
 * turned maple. Deliberately shows no writing.
 * ------------------------------------------------------------------ */

function makePenCupTexture(anisotropy) {
  const w = 512;
  const h = 256;
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  const random = mulberry32(0xB1DD);

  const base = ctx.createLinearGradient(0, 0, 0, h);
  base.addColorStop(0, '#d8bc91');
  base.addColorStop(0.5, '#ceb082');
  base.addColorStop(1, '#bf9d6c');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // Fine maple grain.
  for (let i = 0; i < 62; i += 1) {
    const y = random() * h;
    ctx.beginPath();
    ctx.moveTo(-10, y);
    ctx.bezierCurveTo(w * 0.22, y + (random() - 0.5) * 15, w * 0.68, y + (random() - 0.5) * 14, w + 10, y + (random() - 0.5) * 9);
    ctx.strokeStyle = `rgba(83, 54, 26, ${0.025 + random() * 0.06})`;
    ctx.lineWidth = 0.6 + random() * 1.2;
    ctx.stroke();
  }

  // Painted branch winding the whole circumference.
  ctx.strokeStyle = 'rgba(74, 46, 25, 0.78)';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-5, 183);
  ctx.bezierCurveTo(80, 166, 110, 90, 178, 92);
  ctx.bezierCurveTo(237, 94, 267, 159, 339, 145);
  ctx.bezierCurveTo(402, 133, 421, 92, 480, 88);
  ctx.stroke();

  ctx.lineWidth = 1.3;
  ctx.strokeStyle = 'rgba(78, 51, 28, 0.62)';
  ctx.beginPath();
  ctx.moveTo(145, 117);
  ctx.bezierCurveTo(135, 71, 178, 49, 204, 63);
  ctx.moveTo(314, 139);
  ctx.bezierCurveTo(346, 186, 379, 184, 401, 155);
  ctx.stroke();

  // Leaves.
  const leaves = [
    [76, 160, -0.6, 29, 10], [109, 123, 0.8, 25, 8], [162, 94, -0.4, 20, 7],
    [236, 103, 0.7, 24, 8], [285, 134, -0.8, 22, 7], [340, 147, 0.6, 25, 8],
    [400, 122, -0.7, 22, 7], [449, 92, 0.25, 20, 6],
  ];
  for (const [x, y, a, len, wid] of leaves) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(wid, -len * 0.52, 0, -len);
    ctx.quadraticCurveTo(-wid * 0.82, -len * 0.48, 0, 0);
    ctx.fillStyle = 'rgba(87, 111, 68, 0.72)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(55, 65, 33, 0.48)';
    ctx.lineWidth = 0.9;
    ctx.stroke();
    ctx.restore();
  }

  // Coral blossoms.
  const blossom = (x, y, scale, rotation) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2;
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, -8 * scale, 7 * scale, 10 * scale, 0, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(206, 112, 94, 0.9)' : 'rgba(222, 145, 125, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(128, 55, 44, 0.45)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 3.3 * scale, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(199, 158, 64, 0.9)';
    ctx.fill();
    ctx.restore();
  };
  blossom(194, 64, 1.2, 0.2);
  blossom(366, 175, 1.0, -0.4);
  blossom(472, 72, 0.85, 0.65);

  // A small blue bird perched mid-branch.
  ctx.save();
  ctx.translate(273, 100);
  ctx.rotate(-0.08);
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 12, -0.25, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(73, 112, 119, 0.95)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(15, -6, 8, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(64, 100, 108, 0.98)';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(22, -7);
  ctx.lineTo(31, -4);
  ctx.lineTo(22, -2);
  ctx.closePath();
  ctx.fillStyle = 'rgba(187, 139, 70, 0.95)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(18, -8, 1.2, 0, Math.PI * 2);
  ctx.fillStyle = '#1b1c18';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-14, 7);
  ctx.quadraticCurveTo(-26, 20, -33, 15);
  ctx.quadraticCurveTo(-24, 6, -14, 4);
  ctx.fillStyle = 'rgba(50, 82, 90, 0.9)';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-3, 4, 9, 4.5, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(188, 196, 171, 0.75)';
  ctx.fill();
  ctx.restore();

  // A few seed dots and a soft edge darkening for the round form.
  ctx.fillStyle = 'rgba(108, 73, 37, 0.28)';
  for (let i = 0; i < 18; i += 1) {
    ctx.beginPath();
    ctx.arc(random() * w, 45 + random() * 160, 0.8 + random() * 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
  const edge = ctx.createLinearGradient(0, 0, 0, h);
  edge.addColorStop(0, 'rgba(72, 44, 19, 0.14)');
  edge.addColorStop(0.2, 'rgba(72, 44, 19, 0)');
  edge.addColorStop(0.85, 'rgba(72, 44, 19, 0)');
  edge.addColorStop(1, 'rgba(72, 44, 19, 0.2)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, w, h);

  return finishTexture(c, { anisotropy, wrap: THREE.RepeatWrapping });
}

/* ------------------------------------------------------------------ *
 * Sprites and floor-contact gradients.
 * ------------------------------------------------------------------ */

function makeGlowTexture(anisotropy) {
  const size = 128;
  const c = canvas(size, size);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255, 246, 206, 0.9)');
  g.addColorStop(0.16, 'rgba(255, 217, 135, 0.48)');
  g.addColorStop(0.46, 'rgba(255, 190, 92, 0.14)');
  g.addColorStop(1, 'rgba(255, 177, 70, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return finishTexture(c, { anisotropy, srgb: true });
}

function makeContactShadowTexture(anisotropy) {
  const size = 256;
  const c = canvas(size, size);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(0, 0, 0, 0.58)');
  g.addColorStop(0.42, 'rgba(0, 0, 0, 0.31)');
  g.addColorStop(0.72, 'rgba(0, 0, 0, 0.1)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return finishTexture(c, { anisotropy, srgb: true });
}

function makeCrtGlowTexture(anisotropy) {
  const size = 128;
  const c = canvas(size, size);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(189, 228, 203, 0.5)');
  g.addColorStop(0.32, 'rgba(133, 190, 163, 0.16)');
  g.addColorStop(1, 'rgba(85, 145, 121, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return finishTexture(c, { anisotropy, srgb: true });
}



/* ------------------------------------------------------------------ *
 * Soft, warm equirectangular environment used for PBR reflections.
 * Deliberately low contrast; the room's real lights do the storytelling.
 * ------------------------------------------------------------------ */

function makeEnvironmentTexture(anisotropy) {
  const w = 512;
  const h = 256;
  const c = canvas(w, h);
  const ctx = c.getContext('2d');

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#fff9e9');
  sky.addColorStop(0.34, '#f3e2b9');
  sky.addColorStop(0.52, '#cfa969');
  sky.addColorStop(0.54, '#755438');
  sky.addColorStop(0.78, '#4d3527');
  sky.addColorStop(1, '#211813');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Warm broad panels, as though the wallpaper bounces the pendant light.
  const warmPanel = ctx.createRadialGradient(w * 0.32, h * 0.43, 10, w * 0.32, h * 0.43, 160);
  warmPanel.addColorStop(0, 'rgba(255, 232, 177, 0.65)');
  warmPanel.addColorStop(0.55, 'rgba(225, 188, 117, 0.18)');
  warmPanel.addColorStop(1, 'rgba(225, 188, 117, 0)');
  ctx.fillStyle = warmPanel;
  ctx.fillRect(0, 0, w, h);

  // A cool, bright window-like rectangle creates believable highlights.
  ctx.save();
  const win = ctx.createLinearGradient(w * 0.7, 0, w * 0.7, h);
  win.addColorStop(0, 'rgba(235, 244, 236, 0.9)');
  win.addColorStop(0.6, 'rgba(177, 199, 195, 0.34)');
  win.addColorStop(1, 'rgba(130, 153, 150, 0)');
  ctx.fillStyle = win;
  ctx.fillRect(w * 0.64, h * 0.25, w * 0.16, h * 0.47);
  ctx.restore();

  // Warm ceiling hotspot.
  const hotspot = ctx.createRadialGradient(w * 0.47, h * 0.08, 4, w * 0.47, h * 0.08, 86);
  hotspot.addColorStop(0, 'rgba(255, 249, 223, 1)');
  hotspot.addColorStop(0.38, 'rgba(255, 225, 162, 0.45)');
  hotspot.addColorStop(1, 'rgba(255, 211, 128, 0)');
  ctx.fillStyle = hotspot;
  ctx.fillRect(0, 0, w, h);

  const texture = finishTexture(c, { anisotropy });
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}



function makeDustTexture(anisotropy) {
  const size = 32;
  const c = canvas(size, size);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 15);
  g.addColorStop(0, 'rgba(255, 246, 219, 0.95)');
  g.addColorStop(0.28, 'rgba(255, 236, 195, 0.55)');
  g.addColorStop(0.65, 'rgba(255, 224, 166, 0.12)');
  g.addColorStop(1, 'rgba(255, 215, 150, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return finishTexture(c, { anisotropy, srgb: true });
}



/* ------------------------------------------------------------------ *
 * Rough, sun-greyed pine for the boards nailed over the window.
 * Grain runs horizontally so it follows the board's long axis.
 * ------------------------------------------------------------------ */

function makeWeatheredPlankTexture(anisotropy) {
  const w = 512;
  const h = 256;
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  const random = mulberry32(0xB0A2D);

  const base = ctx.createLinearGradient(0, 0, 0, h);
  base.addColorStop(0, '#9a8267');
  base.addColorStop(0.45, '#8d7459');
  base.addColorStop(1, '#766049');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // Broad tonal streaks along the board.
  for (let i = 0; i < 18; i += 1) {
    const y = random() * h;
    const thickness = 2 + random() * 14;
    const grad = ctx.createLinearGradient(0, y, w, y + (random() - 0.5) * 18);
    const dark = random() > 0.38;
    grad.addColorStop(0, 'rgba(58, 44, 31, 0)');
    grad.addColorStop(0.25 + random() * 0.2, dark ? 'rgba(58, 44, 31, 0.18)' : 'rgba(232, 218, 190, 0.12)');
    grad.addColorStop(0.8, dark ? 'rgba(58, 44, 31, 0.08)' : 'rgba(232, 218, 190, 0.04)');
    grad.addColorStop(1, 'rgba(58, 44, 31, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y - thickness / 2, w, thickness);
  }

  // Fine grain, gently wandering across the plank.
  for (let i = 0; i < 120; i += 1) {
    const y = random() * h;
    const amp = 1.5 + random() * 9;
    const freq = 1 + Math.floor(random() * 4);
    const dark = random() > 0.3;
    ctx.beginPath();
    ctx.moveTo(-10, y);
    for (let x = 0; x <= w + 10; x += 32) {
      const gy = y + Math.sin((x / w) * Math.PI * 2 * freq + i) * amp + (random() - 0.5) * 1.2;
      ctx.lineTo(x, gy);
    }
    const alpha = 0.05 + random() * 0.15;
    ctx.strokeStyle = dark
      ? 'rgba(49, 35, 24, ' + alpha.toFixed(3) + ')'
      : 'rgba(239, 223, 193, ' + (alpha * 0.6).toFixed(3) + ')';
    ctx.lineWidth = 0.5 + random() * 1.3;
    ctx.stroke();
  }

  // A handful of darker splits and knots.
  for (let i = 0; i < 7; i += 1) {
    const x = 40 + random() * (w - 80);
    const y = 20 + random() * (h - 40);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((random() - 0.5) * 0.12);
    ctx.beginPath();
    ctx.ellipse(0, 0, 5 + random() * 7, 2.2 + random() * 3.2, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(48, 34, 22, ' + (0.2 + random() * 0.22).toFixed(3) + ')';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(4 + 20 + random() * 60, (random() - 0.5) * 6);
    ctx.strokeStyle = 'rgba(46, 32, 21, 0.18)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
  }

  // Worn, chalky patches.
  for (let i = 0; i < 16; i += 1) {
    const x = random() * w;
    const y = random() * h;
    const r = 8 + random() * 36;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(214, 198, 170, ' + (0.05 + random() * 0.08).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(214, 198, 170, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Weathered board ends and top/bottom edges.
  const edges = ctx.createLinearGradient(0, 0, w, 0);
  edges.addColorStop(0, 'rgba(49, 34, 21, 0.26)');
  edges.addColorStop(0.09, 'rgba(49, 34, 21, 0)');
  edges.addColorStop(0.91, 'rgba(49, 34, 21, 0)');
  edges.addColorStop(1, 'rgba(49, 34, 21, 0.3)');
  ctx.fillStyle = edges;
  ctx.fillRect(0, 0, w, h);
  const topBot = ctx.createLinearGradient(0, 0, 0, h);
  topBot.addColorStop(0, 'rgba(44, 31, 20, 0.18)');
  topBot.addColorStop(0.12, 'rgba(44, 31, 20, 0)');
  topBot.addColorStop(0.88, 'rgba(44, 31, 20, 0)');
  topBot.addColorStop(1, 'rgba(44, 31, 20, 0.22)');
  ctx.fillStyle = topBot;
  ctx.fillRect(0, 0, w, h);

  paperNoise(ctx, w, h, random, 0.022, 1800);

  return finishTexture(c, { anisotropy, wrap: THREE.RepeatWrapping });
}

/* ------------------------------------------------------------------ *
 * User-supplied artwork references
 *
 * These two local images are the only non-canvas assets in the scene.
 * They are deliberately packed as small WebP files and passed in from
 * the loader; the procedural portraits remain as graceful fallbacks.
 * ------------------------------------------------------------------ */

function makeReferenceTexture(image, anisotropy) {
  const width = image.naturalWidth || image.width || 512;
  const height = image.naturalHeight || image.height || 512;
  const c = canvas(width, height);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, width, height);
  return finishTexture(c, { anisotropy, wrap: THREE.ClampToEdgeWrapping });
}

/* ------------------------------------------------------------------ *
 * Public factory
 * ------------------------------------------------------------------ */

export function createTextureSet(maxAnisotropy = 8, referenceArt = null) {
  const anisotropy = Math.min(8, maxAnisotropy || 8);
  const refs = referenceArt || {};
  return {
    wallpaper: makeWallpaperTexture(anisotropy),
    floor: makeFloorTexture(anisotropy),
    oak: makeWoodTexture(anisotropy, {
      base: '#c49a6d', dark: 'rgba(82, 46, 22, 1)', light: 'rgba(255, 226, 176, 1)', seed: 0x0A4,
    }),
    walnut: makeWoodTexture(anisotropy, {
      base: '#5f3c27', dark: 'rgba(31, 17, 9, 1)', light: 'rgba(157, 112, 74, 1)', seed: 0x77A1,
    }),
    rug: makeRugTexture(anisotropy),
    emblem: refs.crestImage ? makeReferenceTexture(refs.crestImage, anisotropy) : makeEmblemArt(anisotropy),
    monokuma: refs.monokumaImage ? makeReferenceTexture(refs.monokumaImage, anisotropy) : makeMonokumaArt(anisotropy),
    crt: makeCrtTexture(anisotropy),
    penCup: makePenCupTexture(anisotropy),
    glow: makeGlowTexture(anisotropy),
    crtGlow: makeCrtGlowTexture(anisotropy),
    contactShadow: makeContactShadowTexture(anisotropy),
    environment: makeEnvironmentTexture(anisotropy),
    dust: makeDustTexture(anisotropy),
    weatheredPlank: makeWeatheredPlankTexture(anisotropy),
  };
}
