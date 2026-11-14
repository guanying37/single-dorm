/* Special-school concept plans. Canvas 2D only, no external assets. */

const PAPER = '#f7f0e4';
const INK = '#2c2822';
const MUTED = '#7b7163';
const WALL = '#383229';
const CORRIDOR = '#e9decb';
const HALL = '#a4323f';
const DORM = '#b08a4f';
const REST = '#70856a';
const RESEARCH = '#4f6f78';
const CLOSED = '#8b8478';
const FURNITURE = '#b58c58';
const WINDOW = '#8da6a2';
const WC = '#dce9e6';
const ACCENT = '#a4323f';
const FONT = '"Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif';

function initCanvas(canvas) {
  const logicalW = canvas.width;
  const logicalH = canvas.height;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(logicalW * dpr);
  canvas.height = Math.round(logicalH * dpr);
  canvas.style.aspectRatio = `${logicalW} / ${logicalH}`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width: logicalW, height: logicalH };
}

function paper(ctx, width, height) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, width, height);
}

function grid(ctx, width, height, step = 26) {
  ctx.save();
  ctx.strokeStyle = 'rgba(70, 61, 48, 0.065)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

function makeTransform(width, height, roomW, roomD, margin = 54, topReserve = 0) {
  const availW = width - margin * 2;
  const availH = height - margin * 2 - topReserve;
  const scale = Math.min(availW / roomW, availH / roomD);
  const ox = (width - roomW * scale) / 2;
  const oy = margin + topReserve + (availH - roomD * scale) / 2;
  return {
    scale,
    ox,
    oy,
    X: (x) => ox + x * scale,
    Y: (z) => oy + z * scale,
    W: (w) => w * scale,
  };
}

function fillRect(ctx, t, x, z, w, d, color) {
  ctx.fillStyle = color;
  ctx.fillRect(t.X(x), t.Y(z), t.W(w), t.W(d));
}

function strokeRect(ctx, t, x, z, w, d, color = WALL, line = 2.4, dash = null) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = line;
  if (dash) ctx.setLineDash(dash);
  ctx.strokeRect(t.X(x), t.Y(z), t.W(w), t.W(d));
  ctx.restore();
}

function line(ctx, t, x1, z1, x2, z2, color = WALL, width = 2.4, dash = null) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(t.X(x1), t.Y(z1));
  ctx.lineTo(t.X(x2), t.Y(z2));
  ctx.stroke();
  ctx.restore();
}

function rawLine(ctx, x1, y1, x2, y2, color = WALL, width = 1.2) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function hatch(ctx, t, x, z, w, d, color = '#b7ad9d', spacing = 9) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(t.X(x), t.Y(z), t.W(w), t.W(d));
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.15;
  const px = t.X(x);
  const py = t.Y(z);
  const pw = t.W(w);
  const ph = t.W(d);
  for (let offset = -ph; offset < pw + ph; offset += spacing) {
    ctx.beginPath();
    ctx.moveTo(px + offset, py + ph);
    ctx.lineTo(px + offset + ph, py);
    ctx.stroke();
  }
  ctx.restore();
}

function label(ctx, x, y, text, options = {}) {
  const {
    size = 12,
    weight = 600,
    color = INK,
    align = 'left',
    baseline = 'middle',
    bg = null,
    padX = 4,
    padY = 2,
  } = options;
  ctx.save();
  ctx.font = `${weight} ${size}px ${FONT}`;
  const metrics = ctx.measureText(text);
  if (bg) {
    const width = metrics.width + padX * 2;
    const height = size + padY * 2;
    let left = x - padX;
    if (align === 'center') left = x - width / 2;
    if (align === 'right') left = x - width + padX;
    ctx.fillStyle = bg;
    ctx.fillRect(left, y - height / 2, width, height);
  }
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function roomLabel(ctx, x, y, title, sub, color = INK) {
  label(ctx, x, y, title, { size: 11, weight: 700, color, bg: 'rgba(247,240,228,0.88)' });
  if (sub) label(ctx, x, y + 14, sub, { size: 7, weight: 500, color: MUTED, bg: 'rgba(247,240,228,0.8)' });
}

function arrow(ctx, x1, y1, x2, y2, color = ACCENT, width = 1.6) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = 7;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(angle - 0.42), y2 - head * Math.sin(angle - 0.42));
  ctx.lineTo(x2 - head * Math.cos(angle + 0.42), y2 - head * Math.sin(angle + 0.42));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function north(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = MUTED;
  ctx.fillStyle = INK;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -14 * scale);
  ctx.lineTo(0, 16 * scale);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -20 * scale);
  ctx.lineTo(-4.5 * scale, -10 * scale);
  ctx.lineTo(4.5 * scale, -10 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.font = `700 ${8 * scale}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('N', 0, -25 * scale);
  ctx.restore();
}

function scaleBar(ctx, t, x, y, steps = 3, stepMeters = 2) {
  const length = t.W(steps * stepMeters);
  const seg = length / steps;
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.fillStyle = INK;
  ctx.lineWidth = 1.1;
  ctx.strokeRect(x, y, length, 5);
  for (let i = 0; i < steps; i += 1) {
    if (i % 2 === 0) ctx.fillRect(x + i * seg, y, seg, 5);
  }
  ctx.fillStyle = MUTED;
  ctx.font = `500 7px ${FONT}`;
  ctx.textAlign = 'center';
  for (let i = 0; i <= steps; i += 1) {
    ctx.fillText(String(i * stepMeters), x + i * seg, y - 4);
  }
  ctx.textAlign = 'left';
  ctx.fillText('m', x + length + 5, y + 5);
  ctx.restore();
}

function windowMark(ctx, t, x, z, length, horizontal = true) {
  ctx.save();
  ctx.strokeStyle = WINDOW;
  ctx.lineWidth = 2.2;
  if (horizontal) {
    line(ctx, t, x, z, x + length, z, PAPER, 5);
    line(ctx, t, x, z, x + length, z, WINDOW, 1.8);
    line(ctx, t, x, z + 0.07, x + length, z + 0.07, WINDOW, 0.9);
  } else {
    line(ctx, t, x, z, x, z + length, PAPER, 5);
    line(ctx, t, x, z, x, z + length, WINDOW, 1.8);
    line(ctx, t, x + 0.07, z, x + 0.07, z + length, WINDOW, 0.9);
  }
  ctx.restore();
}

function door(ctx, t, x, z, size = 1, orientation = 'h', swing = 1) {
  const px = t.X(x);
  const py = t.Y(z);
  const radius = t.W(size);
  ctx.save();
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 1.2;
  if (orientation === 'h') {
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + radius, py);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(px, py, radius, Math.PI / 2, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px, py + radius * swing);
    ctx.stroke();
  }
  ctx.restore();
}

function bed(ctx, t, x, z, w = 1.05, d = 1.9) {
  fillRect(ctx, t, x, z, w, d, '#e8ddc9');
  strokeRect(ctx, t, x, z, w, d, '#8f7758', 1.1);
  fillRect(ctx, t, x + 0.1, z + 0.1, w - 0.2, 0.28, '#f8f0e2');
  line(ctx, t, x + 0.1, z + d * 0.62, x + w - 0.1, z + d * 0.62, '#b7a78f', 0.9);
}

function desk(ctx, t, x, z, w = 0.7, d = 0.4, color = FURNITURE) {
  fillRect(ctx, t, x, z, w, d, color);
  strokeRect(ctx, t, x, z, w, d, '#725738', 1);
}

function chair(ctx, t, x, z, r = 0.18) {
  ctx.save();
  ctx.fillStyle = '#9e7d51';
  ctx.strokeStyle = '#6d5335';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(t.X(x), t.Y(z), t.W(r), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function sofa(ctx, t, x, z, w = 2.0, d = 0.75) {
  fillRect(ctx, t, x, z, w, d, '#8fa18a');
  strokeRect(ctx, t, x, z, w, d, '#4f614b', 1.2);
  fillRect(ctx, t, x + 0.1, z + 0.1, w - 0.2, d * 0.26, '#a7b59e');
}

function plant(ctx, t, x, z, r = 0.24) {
  ctx.save();
  ctx.fillStyle = '#6f8664';
  ctx.strokeStyle = '#4e6348';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(t.X(x), t.Y(z), t.W(r), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function pingPong(ctx, t, x, z, rotate = false) {
  const w = rotate ? 1.525 : 2.74;
  const d = rotate ? 2.74 : 1.525;
  fillRect(ctx, t, x, z, w, d, '#d8c7a5');
  strokeRect(ctx, t, x, z, w, d, '#725c3e', 1.6);
  line(ctx, t, rotate ? x + w / 2 : x, rotate ? z : z + d / 2, rotate ? x + w / 2 : x + w, rotate ? z + d : z + d / 2, '#5f4d36', 1.6);
  fillRect(ctx, t, rotate ? x + w / 2 - 0.04 : x + w / 2 - 0.04, rotate ? z + d / 2 : z + d / 2 - 0.04, 0.08, 0.08, '#f7f0e4');
}

function wc(ctx, t, x, z, w = 3, d = 3, color = WC) {
  fillRect(ctx, t, x, z, w, d, color);
  strokeRect(ctx, t, x, z, w, d, '#6f8983', 1.1);
  fillRect(ctx, t, x + 0.25, z + 0.8, 0.5, 0.55, '#c7d9d3');
  fillRect(ctx, t, x + 0.95, z + 0.8, 0.5, 0.55, '#c7d9d3');
  fillRect(ctx, t, x + 0.25, z + 1.75, 0.9, 0.45, '#c7d9d3');
}

function stairs(ctx, t, x, z, w, d, direction = 'up') {
  fillRect(ctx, t, x, z, w, d, '#e5d6bf');
  strokeRect(ctx, t, x, z, w, d, WALL, 1.2);
  const count = 7;
  for (let i = 1; i < count; i += 1) {
    line(ctx, t, x, z + (d / count) * i, x + w, z + (d / count) * i, '#9b886d', 0.8);
  }
  const cx = t.X(x + w / 2);
  if (direction === 'up') arrow(ctx, t.X(x + w / 2), t.Y(z + d * 0.8), cx, t.Y(z + d * 0.2), ACCENT, 1.2);
  if (direction === 'down') arrow(ctx, cx, t.Y(z + d * 0.2), cx, t.Y(z + d * 0.8), ACCENT, 1.2);
}

function miniHeader(ctx, width, name, level) {
  label(ctx, 28, 18, `${name} · ${level}`, { size: 10, weight: 700, color: INK });
  label(ctx, width - 28, 18, '22 × 16 m', { size: 7, weight: 500, color: MUTED, align: 'right' });
}

function miniShell(ctx, width, height, name, level) {
  paper(ctx, width, height);
  grid(ctx, width, height, 18);
  miniHeader(ctx, width, name, level);
  const t = makeTransform(width, height, 22, 16, 28, 10);
  fillRect(ctx, t, 0, 0, 22, 16, '#fbf4e7');
  strokeRect(ctx, t, 0, 0, 22, 16, WALL, 4);
  return t;
}

function miniFooter(ctx, t, width, height) {
  north(ctx, width - 26, 58, 0.55);
  scaleBar(ctx, t, 28, height - 20, 2, 2);
}

function drawDiningEat() {
  const canvas = document.getElementById('diningEat');
  if (!canvas) return;
  const { ctx, width, height } = initCanvas(canvas);
  paper(ctx, width, height);
  grid(ctx, width, height, 24);
  label(ctx, 40, 25, '生活区 · 餐厅进食区', { size: 12, weight: 700, color: DORM });
  label(ctx, width - 40, 25, '现有餐厅 36 × 22 m · 6 人桌', { size: 8, weight: 500, color: MUTED, align: 'right' });
  const t = makeTransform(width, height, 36, 22, 48, 10);

  fillRect(ctx, t, 0, 0, 36, 22, '#fbf4e7');
  strokeRect(ctx, t, 0, 0, 36, 22, WALL, 4.5);

  // 8 six-seat tables.
  const tableW = 2.2;
  const tableD = 1.15;
  const xs = [7.5, 14.0, 24.0, 30.0];
  const zs = [5.5, 11.0, 16.5];
  let count = 0;
  for (const z of zs) {
    for (const x of xs) {
      if (count >= 8) break;
      fillRect(ctx, t, x, z, tableW, tableD, '#c9b18a');
      strokeRect(ctx, t, x, z, tableW, tableD, '#8a704b', 1.1);
      const seats = [
        [x + 0.45, z - 0.35],
        [x + 1.1, z - 0.35],
        [x + 1.75, z - 0.35],
        [x + 0.45, z + tableD + 0.35],
        [x + 1.1, z + tableD + 0.35],
        [x + 1.75, z + tableD + 0.35],
      ];
      for (const [sx, sz] of seats) chair(ctx, t, sx, sz, 0.17);
      count += 1;
    }
  }

  // Kitchen pass west.
  fillRect(ctx, t, 0.2, 9.5, 0.8, 3.0, '#e5d6bf');
  strokeRect(ctx, t, 0.2, 9.5, 0.8, 3.0, WALL, 1);
  arrow(ctx, t.X(1.2), t.Y(11.0), t.X(4.0), t.Y(11.0), ACCENT, 1.4);
  label(ctx, t.X(1.0), t.Y(9.0), '传菜口 ← 厨房', { size: 7, weight: 700, color: ACCENT, bg: PAPER });

  // Entry east / foyer.
  door(ctx, t, 36, 11, 1.5, 'v', -1);
  label(ctx, t.X(34.2), t.Y(9.9), '入口', { size: 7, weight: 600, color: MUTED, align: 'right', bg: PAPER });

  windowMark(ctx, t, 4, 0, 7.0, true);
  windowMark(ctx, t, 19, 0, 6.0, true);
  windowMark(ctx, t, 5, 22, 6.0, true);
  windowMark(ctx, t, 22, 22, 6.0, true);

  label(ctx, t.X(18), t.Y(2.4), '进食区 / 公共餐桌', { size: 13, weight: 700, color: DORM, align: 'center', bg: 'rgba(251,244,231,0.86)' });
  label(ctx, t.X(18), t.Y(2.9), 'DINING · EXISTING HALL', { size: 7, weight: 500, color: MUTED, align: 'center', bg: 'rgba(251,244,231,0.8)' });
  label(ctx, t.X(18), t.Y(20.2), '西接厨房 · 东侧入口 · 作为生活区 1F 进食区', { size: 7, weight: 500, color: MUTED, align: 'center' });

  north(ctx, width - 42, 62, 0.65);
  scaleBar(ctx, t, 48, height - 22, 3, 5);
}

function drawLife1F() {
  const canvas = document.getElementById('life1f');
  const { ctx, width, height } = initCanvas(canvas);
  const t = miniShell(ctx, width, height, '生活区', '1F');

  // Existing kitchen 18 × 14, placed 1 m from the wing edge.
  fillRect(ctx, t, 1, 1, 18, 14, '#f7efe2');
  strokeRect(ctx, t, 1, 1, 18, 14, WALL, 2.4);

  // Cooking north / wash south / cold room / island.
  fillRect(ctx, t, 1.4, 1.4, 6.4, 3.0, '#eadcc6');
  strokeRect(ctx, t, 1.4, 1.4, 6.4, 3.0, '#9a805f', 1);
  label(ctx, t.X(1.7), t.Y(2.0), '灶台 / 烟罩', { size: 6.5, weight: 600, color: MUTED });
  fillRect(ctx, t, 15.1, 1.4, 3.4, 3.0, '#dfe9e7');
  strokeRect(ctx, t, 15.1, 1.4, 3.4, 3.0, '#7c9893', 1.1);
  label(ctx, t.X(15.35), t.Y(2.0), '冷库', { size: 6.5, weight: 700, color: '#4f6f69' });

  fillRect(ctx, t, 1.4, 11.6, 6.2, 2.9, '#dfe9e7');
  strokeRect(ctx, t, 1.4, 11.6, 6.2, 2.9, '#7c9893', 1.1);
  label(ctx, t.X(1.7), t.Y(12.2), '清洗 / 洗碗', { size: 6.5, weight: 600, color: '#4f6f69' });
  for (let i = 0; i < 3; i += 1) {
    fillRect(ctx, t, 1.7 + i * 1.2, 12.8, 0.9, 0.8, '#c7d9d3');
  }

  fillRect(ctx, t, 9.4, 7.0, 3.0, 1.2, '#c9b18a');
  strokeRect(ctx, t, 9.4, 7.0, 3.0, 1.2, '#8a704b', 1);
  label(ctx, t.X(10.9), t.Y(8.5), '操作岛台', { size: 6.5, weight: 600, color: MUTED, align: 'center' });

  // Freight lift west, pass east to existing dining.
  fillRect(ctx, t, 0.3, 8.3, 0.7, 2.0, '#c2b6a4');
  strokeRect(ctx, t, 0.3, 8.3, 0.7, 2.0, WALL, 1);
  label(ctx, t.X(0.8), t.Y(9.3), '货梯', { size: 6, weight: 600, color: MUTED, align: 'center' });
  fillRect(ctx, t, 18.95, 3.1, 0.2, 2.0, PAPER);
  arrow(ctx, t.X(19.1), t.Y(4.1), t.X(20.7), t.Y(4.1), ACCENT, 1.2);
  label(ctx, t.X(19.35), t.Y(3.4), '传菜口', { size: 6, weight: 700, color: ACCENT, bg: PAPER });
  label(ctx, t.X(20.6), t.Y(4.7), '→ 餐厅进食区', { size: 6, weight: 600, color: ACCENT, align: 'right' });

  // Toilets in the remaining east strip.
  wc(ctx, t, 19.4, 9.4, 2.3, 5.2);
  label(ctx, t.X(20.55), t.Y(14.9), '厕所', { size: 6, weight: 700, color: '#4f6f69', align: 'center' });
  door(ctx, t, 19.4, 10.4, 0.8, 'v', 1);

  // Service corridor + kitchen door.
  fillRect(ctx, t, 19.2, 1.0, 2.5, 8.2, CORRIDOR);
  door(ctx, t, 19.0, 6.8, 0.9, 'v', -1);
  label(ctx, t.X(3.0), t.Y(4.3), '厨房 / 后厨', { size: 11, weight: 700, color: DORM, bg: 'rgba(247,239,226,0.9)' });
  label(ctx, t.X(3.0), t.Y(4.75), '现有模型 18 × 14 m', { size: 6.5, weight: 500, color: MUTED, bg: 'rgba(247,239,226,0.8)' });
  label(ctx, t.X(20.1), t.Y(7.2), '服务廊', { size: 5.8, weight: 600, color: MUTED, align: 'center' });
  label(ctx, t.X(20.1), t.Y(1.9), '后勤 / 更衣', { size: 5.8, weight: 600, color: MUTED, align: 'center' });

  windowMark(ctx, t, 2.0, 0, 5.0, true);
  miniFooter(ctx, t, width, height);
}

function drawLife2F() {
  const canvas = document.getElementById('life2f');
  const { ctx, width, height } = initCanvas(canvas);
  const t = miniShell(ctx, width, height, '生活区', '2F');

  // Cross corridor serving 16 compact rooms.
  fillRect(ctx, t, 0.8, 6.8, 20.2, 1.4, CORRIDOR);
  fillRect(ctx, t, 9.4, 0.8, 1.4, 14.4, CORRIDOR);

  const columns = [
    { x: 1.0, w: 4.0 },
    { x: 5.3, w: 3.7 },
    { x: 11.1, w: 3.7 },
    { x: 15.0, w: 3.7 },
  ];
  const rows = [
    { z: 1.0, d: 2.5 },
    { z: 3.8, d: 2.5 },
    { z: 8.6, d: 2.5 },
    { z: 11.5, d: 2.5 },
  ];

  let index = 1;
  for (const row of rows) {
    for (const col of columns) {
      fillRect(ctx, t, col.x, row.z, col.w, row.d, '#fdf7ec');
      strokeRect(ctx, t, col.x, row.z, col.w, row.d, WALL, 1.2);
      label(ctx, t.X(col.x + 0.15), t.Y(row.z + 0.22), String(index).padStart(2, '0'), {
        size: 5.8,
        weight: 700,
        color: DORM,
        bg: 'rgba(253,247,236,0.9)',
      });
      bed(ctx, t, col.x + 0.2, row.z + 0.65, 0.85, 1.55);
      desk(ctx, t, col.x + col.w - 0.72, row.z + 0.55, 0.55, 0.34);
      fillRect(ctx, t, col.x + col.w - 0.55, row.z + 1.72, 0.38, 0.32, '#9b7a50');
      index += 1;
    }
  }

  // Only vertical access here; the area's single WC core is on 1F.
  stairs(ctx, t, 19.4, 9.6, 2.0, 4.8, 'down');
  label(ctx, t.X(20.4), t.Y(9.9), '下 1F / WC', { size: 5.2, weight: 700, color: MUTED, align: 'center', bg: 'rgba(233,222,203,0.9)' });
  label(ctx, t.X(20.4), t.Y(14.7), '卫生间核心在 1F', { size: 5, weight: 600, color: MUTED, align: 'center' });

  // Minimal door marks where rooms meet the cross corridor.
  for (const col of columns) {
    door(ctx, t, col.x + col.w / 2, 6.8, 0.55, 'h', 1);
    door(ctx, t, col.x + col.w / 2, 8.2, 0.55, 'h', -1);
  }

  windowMark(ctx, t, 1.4, 0, 6.0, true);
  windowMark(ctx, t, 11.5, 0, 6.0, true);
  label(ctx, t.X(1.2), t.Y(7.5), '2F 内走廊 · 16 间寝室', { size: 5.8, weight: 600, color: MUTED, bg: 'rgba(233,222,203,0.9)' });
  label(ctx, t.X(1.2), t.Y(6.3), '楼梯 / 客梯至 1F、3F 礼堂', { size: 5.2, weight: 500, color: MUTED, bg: 'rgba(233,222,203,0.8)' });
  miniFooter(ctx, t, width, height);
}

function drawRec1F() {
  const canvas = document.getElementById('rec1f');
  const { ctx, width, height } = initCanvas(canvas);
  const t = miniShell(ctx, width, height, '休憩区', '1F');

  fillRect(ctx, t, 1, 1, 9, 8, '#e6eadf');
  strokeRect(ctx, t, 1, 1, 9, 8, '#7f9277', 1.4);
  label(ctx, t.X(1.3), t.Y(1.5), '综合锻炼', { size: 7, weight: 700, color: REST });
  fillRect(ctx, t, 1.5, 3.0, 4.2, 4.4, '#d2dcc8');
  fillRect(ctx, t, 6.3, 2.0, 3.0, 1.1, '#b8c4ab');
  fillRect(ctx, t, 6.3, 4.2, 3.0, 1.1, '#b8c4ab');
  label(ctx, t.X(3.6), t.Y(5.2), '垫上训练', { size: 6, weight: 500, color: MUTED, align: 'center' });

  fillRect(ctx, t, 12, 1, 9, 8, '#eef0e8');
  strokeRect(ctx, t, 12, 1, 9, 8, '#7f9277', 1.4);
  label(ctx, t.X(12.3), t.Y(1.5), '乒乓球', { size: 7, weight: 700, color: REST });
  pingPong(ctx, t, 12.8, 3.2);
  pingPong(ctx, t, 16.5, 3.2);

  fillRect(ctx, t, 1, 10, 7, 5, '#eee5d6');
  strokeRect(ctx, t, 1, 10, 7, 5, WALL, 1.4);
  label(ctx, t.X(1.3), t.Y(10.5), '运动杂物间', { size: 6.5, weight: 700, color: MUTED });
  for (let i = 0; i < 3; i += 1) {
    fillRect(ctx, t, 1.4, 11.3 + i * 0.9, 4.0, 0.35, '#b9a688');
  }
  label(ctx, t.X(5.6), t.Y(13.7), '球/网/器材', { size: 5.8, weight: 500, color: MUTED, align: 'right' });

  fillRect(ctx, t, 8.5, 10, 5.0, 5, '#eef2ef');
  strokeRect(ctx, t, 8.5, 10, 5.0, 5, '#7c9893', 1.3);
  label(ctx, t.X(8.8), t.Y(10.5), '更衣', { size: 6.5, weight: 700, color: '#4f6f69' });
  wc(ctx, t, 11.2, 10, 2.3, 5);
  fillRect(ctx, t, 8.8, 11.2, 1.7, 0.8, '#c7d9d3');
  label(ctx, t.X(9.6), t.Y(12.5), '淋浴', { size: 5.8, weight: 500, color: MUTED, align: 'center' });

  fillRect(ctx, t, 14, 10, 7, 5, '#f4ebde');
  strokeRect(ctx, t, 14, 10, 7, 5, WALL, 1.3);
  sofa(ctx, t, 14.4, 10.4, 2.1, 0.7);
  sofa(ctx, t, 14.4, 12.9, 2.1, 0.7);
  fillRect(ctx, t, 17.0, 11.0, 2.5, 1.6, '#d9c5a5');
  strokeRect(ctx, t, 17.0, 11.0, 2.5, 1.6, '#9d825b', 1);
  plant(ctx, t, 20.4, 13.8, 0.24);
  label(ctx, t.X(17.2), t.Y(14.5), '休息 / 饮水', { size: 6, weight: 600, color: MUTED, align: 'center' });

  door(ctx, t, 22, 5.2, 1.0, 'v', 1);
  label(ctx, t.X(2.0), t.Y(9.1), '1F：运动 + 杂物 + 更衣', { size: 7, weight: 600, color: REST, bg: 'rgba(251,244,231,0.85)' });
  miniFooter(ctx, t, width, height);
}

function drawRec2F() {
  const canvas = document.getElementById('rec2f');
  const { ctx, width, height } = initCanvas(canvas);
  const t = miniShell(ctx, width, height, '休憩区', '2F');

  fillRect(ctx, t, 1, 1, 9, 8, '#e6eadf');
  strokeRect(ctx, t, 1, 1, 9, 8, '#7f9277', 1.4);
  label(ctx, t.X(1.3), t.Y(1.5), '健身房', { size: 7, weight: 700, color: REST });
  for (let i = 0; i < 3; i += 1) {
    fillRect(ctx, t, 1.5 + i * 2.1, 2.4, 1.4, 0.8, '#b8c4ab');
    strokeRect(ctx, t, 1.5 + i * 2.1, 2.4, 1.4, 0.8, '#6f8169', 0.8);
  }
  fillRect(ctx, t, 1.5, 4.0, 3.0, 2.6, '#d2dcc8');
  fillRect(ctx, t, 5.2, 4.0, 4.0, 1.0, '#b8c4ab');
  label(ctx, t.X(3.0), t.Y(5.4), '自由重量', { size: 6, weight: 500, color: MUTED, align: 'center' });

  fillRect(ctx, t, 12, 1, 9, 8, '#eef0e8');
  strokeRect(ctx, t, 12, 1, 9, 8, '#7f9277', 1.4);
  label(ctx, t.X(12.3), t.Y(1.5), '乒乓球', { size: 7, weight: 700, color: REST });
  pingPong(ctx, t, 12.8, 3.2);
  pingPong(ctx, t, 16.5, 3.2);

  fillRect(ctx, t, 1, 10, 7, 5, '#eee5d6');
  strokeRect(ctx, t, 1, 10, 7, 5, WALL, 1.4);
  label(ctx, t.X(1.3), t.Y(10.5), '器材储藏', { size: 6.5, weight: 700, color: MUTED });
  for (let i = 0; i < 3; i += 1) fillRect(ctx, t, 1.4, 11.3 + i * 0.9, 4.2, 0.35, '#b9a688');

  fillRect(ctx, t, 8.5, 10, 5.0, 5, '#eef2ef');
  strokeRect(ctx, t, 8.5, 10, 5.0, 5, '#7c9893', 1.3);
  label(ctx, t.X(8.8), t.Y(10.5), '更衣 / 淋浴', { size: 6.3, weight: 700, color: '#4f6f69' });
  fillRect(ctx, t, 11.2, 10.4, 1.8, 0.8, '#c7d9d3');
  fillRect(ctx, t, 11.2, 12.1, 1.8, 0.8, '#c7d9d3');
  label(ctx, t.X(10.8), t.Y(14.3), 'WC 在 1F', { size: 5.2, weight: 600, color: MUTED, align: 'center' });

  fillRect(ctx, t, 14, 10, 7, 5, '#f4ebde');
  strokeRect(ctx, t, 14, 10, 7, 5, WALL, 1.3);
  sofa(ctx, t, 14.4, 10.4, 2.1, 0.7);
  sofa(ctx, t, 14.4, 12.9, 2.1, 0.7);
  fillRect(ctx, t, 17.0, 11.0, 2.5, 1.6, '#d9c5a5');
  strokeRect(ctx, t, 17.0, 11.0, 2.5, 1.6, '#9d825b', 1);
  plant(ctx, t, 20.4, 13.8, 0.24);
  label(ctx, t.X(17.2), t.Y(14.5), '休息 / 拉伸', { size: 6, weight: 600, color: MUTED, align: 'center' });

  door(ctx, t, 22, 5.2, 1.0, 'v', 1);
  stairs(ctx, t, 19.2, 10.2, 2.0, 4.2, 'down');
  label(ctx, t.X(20.2), t.Y(15.0), '下 1F', { size: 5.8, weight: 600, color: MUTED, align: 'center' });

  label(ctx, t.X(2.0), t.Y(9.1), '2F：健身 + 乒乓球 + 储藏', { size: 7, weight: 600, color: REST, bg: 'rgba(251,244,231,0.85)' });
  miniFooter(ctx, t, width, height);
}

function drawResearch(level) {
  const canvas = document.getElementById(level === 1 ? 'research1f' : 'research2f');
  const { ctx, width, height } = initCanvas(canvas);
  const t = miniShell(ctx, width, height, '研究教室区', `${level}F`);
  const offset = level === 1 ? 1 : 6;

  fillRect(ctx, t, 1.0, 7.0, 20.0, 2.0, CORRIDOR);
  line(ctx, t, 1.0, 7.0, 21.0, 7.0, WALL, 1.8);
  line(ctx, t, 1.0, 9.0, 21.0, 9.0, WALL, 1.8);

  const north = [
    { x: 1, z: 1, w: 6, d: 5.6 },
    { x: 8, z: 1, w: 6, d: 5.6 },
    { x: 15, z: 1, w: 6, d: 5.6 },
  ];
  const south = [
    { x: 1, z: 9.4, w: 6, d: 5.6 },
    { x: 8, z: 9.4, w: 6, d: 5.6 },
  ];
  const rooms = north.concat(south);

  rooms.forEach((room, index) => {
    fillRect(ctx, t, room.x, room.z, room.w, room.d, '#fdf7ec');
    strokeRect(ctx, t, room.x, room.z, room.w, room.d, WALL, 1.7);
    label(ctx, t.X(room.x + 0.2), t.Y(room.z + 0.3), `研 ${String(offset + index).padStart(2, '0')}`, {
      size: 6.8,
      weight: 700,
      color: RESEARCH,
      bg: 'rgba(253,247,236,0.9)',
    });
    for (let row = 0; row < 2; row += 1) {
      fillRect(ctx, t, room.x + 0.45, room.z + 1.0 + row * 1.6, room.w - 0.9, 0.38, '#c9b18a');
      strokeRect(ctx, t, room.x + 0.45, room.z + 1.0 + row * 1.6, room.w - 0.9, 0.38, '#8a704b', 0.7);
    }
    for (let i = 0; i < 3; i += 1) {
      chair(ctx, t, room.x + 1.0 + i * 1.3, room.z + 1.65 + 0.6, 0.14);
    }
  });

  fillRect(ctx, t, 15, 9.4, 3.0, 5.6, '#eef2ef');
  strokeRect(ctx, t, 15, 9.4, 3.0, 5.6, '#7c9893', 1.2);
  label(ctx, t.X(15.25), t.Y(9.75), level === 1 ? '准备室' : '储藏', { size: 6, weight: 700, color: '#4f6f69' });
  if (level === 1) {
    wc(ctx, t, 18.2, 9.4, 2.8, 5.6);
    label(ctx, t.X(19.6), t.Y(14.7), '卫生间核心', { size: 5.4, weight: 700, color: '#4f6f69', align: 'center' });
  } else {
    fillRect(ctx, t, 18.2, 9.4, 2.8, 5.6, '#eee5d6');
    strokeRect(ctx, t, 18.2, 9.4, 2.8, 5.6, WALL, 1.1);
    for (let i = 0; i < 3; i += 1) fillRect(ctx, t, 18.4, 10.0 + i * 1.2, 2.1, 0.32, '#b9a688');
    label(ctx, t.X(19.6), t.Y(14.7), 'WC 在 1F', { size: 5.2, weight: 600, color: MUTED, align: 'center' });
  }

  door(ctx, t, 3.8, 7.0, 0.8, 'h', 1);
  door(ctx, t, 10.8, 7.0, 0.8, 'h', 1);
  door(ctx, t, 17.8, 7.0, 0.8, 'h', 1);
  door(ctx, t, 3.8, 9.0, 0.8, 'h', -1);
  door(ctx, t, 10.8, 9.0, 0.8, 'h', -1);
  door(ctx, t, 15.6, 9.4, 0.7, 'v', 1);

  windowMark(ctx, t, 1.5, 0, 5.0, true);
  windowMark(ctx, t, 8.5, 0, 5.0, true);
  windowMark(ctx, t, 15.5, 0, 5.0, true);

  stairs(ctx, t, 18.5, 7.1, 2.2, 1.8, level === 1 ? 'up' : 'down');
  label(ctx, t.X(1.3), t.Y(8.0), `${level}F 走廊 · 共 10 间研究教室`, { size: 6.3, weight: 600, color: MUTED, bg: 'rgba(233,222,203,0.9)' });
  miniFooter(ctx, t, width, height);
}

function drawClosed(level) {
  const canvas = document.getElementById(level === 1 ? 'closed1f' : 'closed2f');
  const { ctx, width, height } = initCanvas(canvas);
  const t = miniShell(ctx, width, height, '未开放区', `${level}F`);

  fillRect(ctx, t, 0.3, 0.3, 21.4, 15.4, '#ece4d7');
  hatch(ctx, t, 0.3, 0.3, 21.4, 15.4, '#b6ac9c', 10);
  strokeRect(ctx, t, 0, 0, 22, 16, WALL, 4);

  if (level === 1) {
    fillRect(ctx, t, 17.5, 11.5, 3.8, 4.0, '#e7ece9');
    hatch(ctx, t, 17.5, 11.5, 3.8, 4.0, '#a8bbb5', 8);
    label(ctx, t.X(19.4), t.Y(13.5), 'WC 封堵', { size: 6.5, weight: 700, color: '#4f6f69', align: 'center', bg: 'rgba(247,240,228,0.85)' });
  } else {
    label(ctx, t.X(19.4), t.Y(13.5), 'WC 核心仅 1F', { size: 5.6, weight: 600, color: MUTED, align: 'center', bg: 'rgba(247,240,228,0.85)' });
  }

  ctx.save();
  ctx.strokeStyle = CLOSED;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(t.X(20.4), t.Y(7.4));
  ctx.lineTo(t.X(22), t.Y(7.4));
  ctx.moveTo(t.X(21.2), t.Y(6.7));
  ctx.lineTo(t.X(21.2), t.Y(8.1));
  ctx.stroke();
  ctx.restore();

  label(ctx, t.X(10.8), t.Y(7.4), '未开放', { size: 18, weight: 700, color: CLOSED, align: 'center', bg: 'rgba(247,240,228,0.9)' });
  label(ctx, t.X(10.8), t.Y(8.0), '不制作 · 保留结构与厕所核心', { size: 7.5, weight: 500, color: MUTED, align: 'center', bg: 'rgba(247,240,228,0.86)' });
  label(ctx, t.X(10.8), t.Y(8.6), `${level}F · 封堵门洞`, { size: 6, weight: 500, color: MUTED, align: 'center', bg: 'rgba(247,240,228,0.8)' });
  miniFooter(ctx, t, width, height);
}

function drawHall3F() {
  const canvas = document.getElementById('hall3f');
  const { ctx, width, height } = initCanvas(canvas);
  paper(ctx, width, height);
  grid(ctx, width, height, 24);
  label(ctx, 34, 22, '3F · 中央礼堂', { size: 12, weight: 700, color: HALL });
  label(ctx, width - 34, 22, '32 × 22 m · 最上层', { size: 8, weight: 500, color: MUTED, align: 'right' });
  const t = makeTransform(width, height, 32, 22, 52, 10);

  fillRect(ctx, t, 0, 0, 32, 22, 'rgba(164,50,63,0.06)');
  strokeRect(ctx, t, 0, 0, 32, 22, HALL, 3.2, [10, 6]);

  // Stage.
  fillRect(ctx, t, 0.5, 0.5, 31, 4.2, 'rgba(164,50,63,0.2)');
  strokeRect(ctx, t, 0.5, 0.5, 31, 4.2, HALL, 2.2);
  label(ctx, t.X(16), t.Y(2.3), '舞台', { size: 17, weight: 700, color: HALL, align: 'center' });
  label(ctx, t.X(16), t.Y(3.1), 'STAGE', { size: 8, weight: 600, color: MUTED, align: 'center' });
  for (let i = 0; i < 8; i += 1) line(ctx, t, 1.2 + i * 3.9, 0.7, 1.2 + i * 3.9, 4.6, 'rgba(164,50,63,0.25)', 0.9);

  // Aisles.
  fillRect(ctx, t, 0.5, 5.2, 1.2, 11.2, '#efe5d5');
  fillRect(ctx, t, 30.3, 5.2, 1.2, 11.2, '#efe5d5');
  fillRect(ctx, t, 14.3, 5.2, 1.4, 11.2, '#efe5d5');

  // Seats: 8 rows × 8 (4 per side).
  for (let row = 0; row < 8; row += 1) {
    for (let side = 0; side < 2; side += 1) {
      for (let col = 0; col < 4; col += 1) {
        const x = side === 0 ? 2.2 + col * 2.9 : 16.4 + col * 2.9;
        const z = 5.7 + row * 1.25;
        fillRect(ctx, t, x, z, 1.7, 0.55, row % 2 ? '#d8c4b0' : '#cdb69f');
        strokeRect(ctx, t, x, z, 1.7, 0.55, '#a48a70', 0.6);
      }
    }
  }
  label(ctx, t.X(16), t.Y(16.6), '座席 8 排 × 8', { size: 8, weight: 600, color: MUTED, align: 'center' });

  // Foyer / control / toilets / stair arrival.
  fillRect(ctx, t, 3.0, 17.0, 26.0, 4.2, '#f4ebde');
  strokeRect(ctx, t, 3.0, 17.0, 26.0, 4.2, WALL, 1.5);
  label(ctx, t.X(4.0), t.Y(18.0), '门厅', { size: 7, weight: 700, color: MUTED });

  fillRect(ctx, t, 4.0, 19.0, 4.2, 1.8, '#d9c9b3');
  strokeRect(ctx, t, 4.0, 19.0, 4.2, 1.8, WALL, 1.2);
  label(ctx, t.X(6.1), t.Y(19.9), '控制室', { size: 6.2, weight: 600, color: MUTED, align: 'center' });

  wc(ctx, t, 25.2, 17.2, 4.2, 3.8);
  label(ctx, t.X(27.3), t.Y(21.5), '卫生间核心', { size: 5.8, weight: 700, color: '#4f6f69', align: 'center' });

  // Elevator arrival beside the stair.
  fillRect(ctx, t, 9.2, 17.4, 2.6, 3.4, '#e2d3bc');
  strokeRect(ctx, t, 9.2, 17.4, 2.6, 3.4, WALL, 1.3);
  label(ctx, t.X(10.5), t.Y(18.3), 'EL 3F', { size: 6.5, weight: 700, color: ACCENT, align: 'center' });
  label(ctx, t.X(10.5), t.Y(19.0), '客梯', { size: 5.4, weight: 600, color: MUTED, align: 'center' });

  // Grand stair arrival at south center.
  fillRect(ctx, t, 13.4, 17.2, 5.2, 4.0, '#e5d6bf');
  strokeRect(ctx, t, 13.4, 17.2, 5.2, 4.0, WALL, 1.4);
  for (let i = 1; i < 7; i += 1) line(ctx, t, 13.6, 17.2 + i * 0.55, 18.4, 17.2 + i * 0.55, '#9b886d', 0.8);
  arrow(ctx, t.X(16), t.Y(21.4), t.X(16), t.Y(17.6), ACCENT, 1.5);
  label(ctx, t.X(16), t.Y(16.9), '2F 大楼梯 → 3F 礼堂', { size: 6.5, weight: 700, color: ACCENT, align: 'center', bg: 'rgba(247,240,228,0.85)' });

  door(ctx, t, 16, 22, 2.0, 'h', -1);
  door(ctx, t, 4.8, 22, 1.4, 'h', -1);
  door(ctx, t, 27.2, 22, 1.4, 'h', 1);

  label(ctx, t.X(1.0), t.Y(5.0), '中央礼堂', { size: 14, weight: 700, color: HALL, bg: 'rgba(247,240,228,0.86)' });
  label(ctx, t.X(1.0), t.Y(5.45), 'AUDITORIUM · 3F · 32 × 22 m', { size: 7, weight: 500, color: MUTED, bg: 'rgba(247,240,228,0.8)' });
  north(ctx, width - 44, 58, 0.65);
  scaleBar(ctx, t, 52, height - 22, 2, 5);
}

function drawOverall() {
  const canvas = document.getElementById('overviewCanvas');
  const { ctx, width, height } = initCanvas(canvas);
  paper(ctx, width, height);
  grid(ctx, width, height, 26);

  label(ctx, 58, 30, "HOPE'S PEAK · SPECIAL SCHOOL", { size: 8, weight: 600, color: MUTED });
  label(ctx, 58, 58, '整体骨架 / 1F·2F 翼楼 + 3F 礼堂', { size: 20, weight: 500, color: INK });
  label(ctx, 58, 80, '四翼贴主走廊布置；礼堂独占 3F；每区一个集中卫生间核心', { size: 8, weight: 500, color: MUTED });

  const t = makeTransform(width, height, 52, 40, 58, 30);

  // Four wings touching the main corridor, no empty atrium.
  fillRect(ctx, t, 2, 2, 22, 16, '#fbf4e7');
  fillRect(ctx, t, 28, 2, 22, 16, '#fbf4e7');
  fillRect(ctx, t, 2, 22, 22, 16, '#fbf4e7');
  fillRect(ctx, t, 28, 22, 22, 16, '#fbf4e7');

  // Single main corridor cross, 4 m wide.
  fillRect(ctx, t, 24, 2, 4, 36, CORRIDOR);
  fillRect(ctx, t, 2, 18, 48, 4, CORRIDOR);
  label(ctx, t.X(26), t.Y(6.0), '主走廊', { size: 6.5, weight: 700, color: MUTED, align: 'center', bg: 'rgba(233,222,203,0.9)' });
  label(ctx, t.X(26), t.Y(34.0), '主走廊', { size: 6.5, weight: 700, color: MUTED, align: 'center', bg: 'rgba(233,222,203,0.9)' });

  // 3F hall projection.
  strokeRect(ctx, t, 10, 9, 32, 22, HALL, 2.4, [10, 7]);
  fillRect(ctx, t, 10, 9, 32, 22, 'rgba(164,50,63,0.035)');
  label(ctx, t.X(26), t.Y(8.0), '3F 礼堂投影', { size: 8, weight: 700, color: HALL, align: 'center', bg: PAPER });
  label(ctx, t.X(26), t.Y(8.5), '32 × 22 m · 最上层', { size: 6.2, weight: 500, color: MUTED, align: 'center', bg: PAPER });

  // Unopened hatch.
  hatch(ctx, t, 28, 2, 22, 16, '#b6ac9c', 10);

  // Wing walls.
  strokeRect(ctx, t, 2, 2, 22, 16, WALL, 3);
  strokeRect(ctx, t, 28, 2, 22, 16, WALL, 3);
  strokeRect(ctx, t, 2, 22, 22, 16, WALL, 3);
  strokeRect(ctx, t, 28, 22, 22, 16, WALL, 3);
  strokeRect(ctx, t, 0, 0, 52, 40, WALL, 4.5);

  // Central stair + elevator core (cuts into the four corners, no blank space).
  fillRect(ctx, t, 22, 16, 8, 8, '#e2d3bc');
  strokeRect(ctx, t, 22, 16, 8, 8, WALL, 1.8);
  stairs(ctx, t, 22.4, 16.4, 3.6, 3.4, 'up');
  stairs(ctx, t, 22.4, 20.2, 3.6, 3.4, 'up');
  fillRect(ctx, t, 26.8, 16.4, 2.8, 3.0, '#efe5d4');
  strokeRect(ctx, t, 26.8, 16.4, 2.8, 3.0, WALL, 1.2);
  line(ctx, t, 27.0, 16.8, 29.4, 16.8, '#8f7e66', 0.8);
  label(ctx, t.X(28.2), t.Y(20.0), 'EL', { size: 6.5, weight: 700, color: ACCENT, align: 'center' });
  label(ctx, t.X(28.2), t.Y(20.5), '1F/2F/3F', { size: 5.2, weight: 600, color: MUTED, align: 'center' });
  label(ctx, t.X(24.2), t.Y(24.2), '大楼梯 → 3F 礼堂', { size: 6.2, weight: 700, color: ACCENT, align: 'center', bg: 'rgba(226,211,188,0.9)' });

  // Doors from wings directly onto the main corridor.
  door(ctx, t, 24, 8, 1.2, 'v', -1);
  door(ctx, t, 28, 8, 1.2, 'v', 1);
  door(ctx, t, 24, 30, 1.2, 'v', 1);
  door(ctx, t, 28, 30, 1.2, 'v', -1);
  door(ctx, t, 12, 18, 1.5, 'h', 1);
  door(ctx, t, 40, 18, 1.5, 'h', -1);
  door(ctx, t, 12, 22, 1.5, 'h', -1);
  door(ctx, t, 40, 22, 1.5, 'h', 1);

  roomLabel(ctx, t.X(3.0), t.Y(4.0), '生活区', '1F 厨房/后厨 + 进食区 · 2F 16 间寝室', DORM);
  roomLabel(ctx, t.X(29.0), t.Y(4.0), '未开放区', '1F/2F · 不制作', CLOSED);
  roomLabel(ctx, t.X(3.0), t.Y(24.0), '休憩区', '锻炼 · 乒乓球 · 杂物', REST);
  roomLabel(ctx, t.X(29.0), t.Y(24.0), '研究教室区', '10 间教室 · 准备/储藏', RESEARCH);
  label(ctx, t.X(26), t.Y(18.2), '主走廊 / 楼梯 / 客梯', { size: 7, weight: 700, color: MUTED, align: 'center', bg: 'rgba(233,222,203,0.9)' });

  // Dimensions.
  ctx.save();
  ctx.strokeStyle = MUTED;
  ctx.fillStyle = MUTED;
  ctx.lineWidth = 1;
  ctx.font = `500 8px ${FONT}`;
  const topY = t.Y(0) - 14;
  ctx.beginPath();
  ctx.moveTo(t.X(0), topY);
  ctx.lineTo(t.X(52), topY);
  ctx.stroke();
  ctx.fillText('52 m', t.X(25), topY - 5);
  const leftX = t.X(0) - 14;
  ctx.beginPath();
  ctx.moveTo(leftX, t.Y(0));
  ctx.lineTo(leftX, t.Y(40));
  ctx.stroke();
  ctx.save();
  ctx.translate(leftX - 5, t.Y(20));
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('40 m', 0, 0);
  ctx.restore();
  ctx.restore();

  north(ctx, width - 58, 108, 1.0);
  scaleBar(ctx, t, 58, height - 32, 4, 5);
  label(ctx, width - 58, height - 30, '概念图 · 非施工图', { size: 7, weight: 500, color: MUTED, align: 'right' });
}

function drawSection() {
  const canvas = document.getElementById('sectionCanvas');
  const { ctx, width, height } = initCanvas(canvas);
  paper(ctx, width, height);
  grid(ctx, width, height, 24);

  const ground = height - 42;
  const level1 = ground - 42;
  const level2 = level1 - 48;
  const level3 = level2 - 52;

  // Ground.
  rawLine(ctx, 40, ground, width - 40, ground, '#8f806b', 1.4);

  // Wing slabs.
  const fill = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = WALL;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(x, y, w, h);
  };

  fill(110, level1, 300, 42, '#fbf4e7');
  fill(110, level2, 300, 48, '#fbf4e7');
  fill(790, level1, 300, 42, '#fbf4e7');
  fill(790, level2, 300, 48, '#fbf4e7');

  label(ctx, 124, level1 + 21, '1F 生活 / 休憩 / 研究 / 未开放', { size: 8, weight: 600, color: MUTED });
  label(ctx, 124, level2 + 24, '2F 生活 / 休憩 / 研究 / 未开放', { size: 8, weight: 600, color: MUTED });
  label(ctx, 804, level1 + 21, '1F 翼楼', { size: 8, weight: 600, color: MUTED });
  label(ctx, 804, level2 + 24, '2F 翼楼', { size: 8, weight: 600, color: MUTED });

  // Hall on top.
  fill(370, level3, 460, 52, 'rgba(164,50,63,0.14)');
  ctx.strokeStyle = HALL;
  ctx.lineWidth = 2;
  ctx.strokeRect(370, level3, 460, 52);
  label(ctx, 600, level3 + 20, '3F 中央礼堂', { size: 15, weight: 700, color: HALL, align: 'center' });
  label(ctx, 600, level3 + 37, '舞台 / 座席 / 门厅 / 厕所', { size: 7, weight: 500, color: MUTED, align: 'center' });

  // Vertical supports.
  for (const x of [140, 380, 820, 1060]) rawLine(ctx, x, level1 + 42, x, ground, '#9a8a73', 1);
  for (const x of [140, 380, 820, 1060]) rawLine(ctx, x, level2 + 48, x, level1, '#9a8a73', 1);

  // Grand stair 2F -> 3F.
  const sx = 450;
  const sy = level2;
  const ex = 600;
  const ey = level3 + 52;
  ctx.save();
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx + 50, sy);
  ctx.lineTo(sx + 50, sy - 22);
  ctx.lineTo(sx + 100, sy - 22);
  ctx.lineTo(sx + 100, ey);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  for (let i = 0; i < 8; i += 1) {
    rawLine(ctx, sx + 50 + i * 7, sy, sx + 50 + i * 7, sy - 22, ACCENT, 0.8);
  }
  arrow(ctx, sx + 70, sy - 26, sx + 70, sy - 52, ACCENT, 1.4);
  ctx.restore();
  label(ctx, 510, sy - 32, '通往 3F 礼堂的大楼梯', { size: 7, weight: 700, color: ACCENT, bg: PAPER });

  // Passenger elevator shaft, 1F–3F.
  const ex1 = 640;
  const ex2 = 680;
  ctx.save();
  ctx.strokeStyle = WALL;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(ex1, level3 + 52, ex2 - ex1, ground - (level3 + 52));
  ctx.fillStyle = 'rgba(226,211,188,0.75)';
  ctx.fillRect(ex1 + 6, level2 + 10, ex2 - ex1 - 12, 26);
  ctx.fillStyle = ACCENT;
  ctx.font = `700 7px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('EL', (ex1 + ex2) / 2, level2 + 27);
  ctx.restore();
  label(ctx, (ex1 + ex2) / 2, level3 + 44, '客梯 1F/2F/3F', { size: 6.5, weight: 700, color: ACCENT, align: 'center', bg: PAPER });
  label(ctx, ex1 - 6, level1 + 21, 'EL 1F', { size: 5.5, weight: 700, color: MUTED, align: 'right', bg: PAPER });
  label(ctx, ex1 - 6, level2 + 24, 'EL 2F', { size: 5.5, weight: 700, color: MUTED, align: 'right', bg: PAPER });
  label(ctx, ex1 - 6, level3 + 26, 'EL 3F', { size: 5.5, weight: 700, color: MUTED, align: 'right', bg: PAPER });

  // Ground label.
  label(ctx, 40, ground + 18, '±0.000 · 1F', { size: 8, weight: 500, color: MUTED });
  label(ctx, 40, level2 + 24, '2F', { size: 9, weight: 700, color: MUTED });
  label(ctx, 40, level3 + 26, '3F', { size: 9, weight: 700, color: MUTED });
  scaleBar(ctx, { W: (v) => v * 12, X: (v) => v, Y: (v) => v, scale: 12 }, 980, height - 22, 2, 5);
}

function drawAll() {
  drawOverall();
  drawSection();
  drawLife1F();
  drawLife2F();
  drawDiningEat();
  drawRec1F();
  drawRec2F();
  drawResearch(1);
  drawResearch(2);
  drawClosed(1);
  drawClosed(2);
  drawHall3F();
}

function downloadOverview() {
  const canvas = document.getElementById('overviewCanvas');
  const link = document.createElement('a');
  link.download = 'special-school-1f-2f-3f-overview.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

document.getElementById('downloadOverview')?.addEventListener('click', downloadOverview);
document.getElementById('printPage')?.addEventListener('click', () => window.print());

/* ------------------------------------------------------------------ *
 * Canvas lightbox: click any plan to enlarge, wheel/buttons zoom, drag pan.
 * ------------------------------------------------------------------ */

const lightbox = document.getElementById('lightbox');
const lightboxStage = document.getElementById('lightboxStage');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxTitle = document.getElementById('lightboxTitle');
const zoomLevel = document.getElementById('zoomLevel');
let zoom = 1;
let panX = 0;
let panY = 0;
let dragging = false;
let dragStart = null;

function applyLightboxTransform() {
  if (!lightboxImage) return;
  lightboxImage.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
  if (zoomLevel) zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
}

function setZoom(next) {
  zoom = Math.max(0.5, Math.min(5, next));
  applyLightboxTransform();
}

function resetLightbox() {
  zoom = 1;
  panX = 0;
  panY = 0;
  applyLightboxTransform();
}

function openLightbox(canvas) {
  if (!lightbox || !lightboxImage || !canvas) return;
  lightboxImage.src = canvas.toDataURL('image/png');
  lightboxImage.alt = canvas.getAttribute('aria-label') || '图纸';
  if (lightboxTitle) lightboxTitle.textContent = canvas.getAttribute('aria-label') || '图纸';
  resetLightbox();
  lightbox.hidden = false;
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.classList.add('lightbox-open');
  document.getElementById('lightboxClose')?.focus();
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.hidden = true;
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('lightbox-open');
  dragging = false;
  if (lightboxStage) lightboxStage.classList.remove('is-dragging');
}

document.querySelectorAll('canvas').forEach((canvas) => {
  canvas.title = '点击放大';
  canvas.addEventListener('click', () => openLightbox(canvas));
});

document.getElementById('lightboxClose')?.addEventListener('click', closeLightbox);
document.getElementById('zoomIn')?.addEventListener('click', () => setZoom(zoom * 1.2));
document.getElementById('zoomOut')?.addEventListener('click', () => setZoom(zoom / 1.2));
document.getElementById('zoomReset')?.addEventListener('click', resetLightbox);

lightboxStage?.addEventListener('wheel', (event) => {
  event.preventDefault();
  setZoom(zoom * (event.deltaY < 0 ? 1.12 : 0.9));
}, { passive: false });

lightboxStage?.addEventListener('pointerdown', (event) => {
  if (event.target !== lightboxImage) return;
  dragging = true;
  dragStart = { x: event.clientX - panX, y: event.clientY - panY };
  lightboxStage.classList.add('is-dragging');
  lightboxStage.setPointerCapture?.(event.pointerId);
});

lightboxStage?.addEventListener('pointermove', (event) => {
  if (!dragging || !dragStart) return;
  panX = event.clientX - dragStart.x;
  panY = event.clientY - dragStart.y;
  applyLightboxTransform();
});

function endLightboxDrag() {
  dragging = false;
  dragStart = null;
  lightboxStage?.classList.remove('is-dragging');
}

lightboxStage?.addEventListener('pointerup', endLightboxDrag);
lightboxStage?.addEventListener('pointercancel', endLightboxDrag);

lightboxImage?.addEventListener('dblclick', () => {
  setZoom(zoom > 1.4 ? 1 : 2);
});

lightbox?.addEventListener('click', (event) => {
  if (event.target === lightboxStage) closeLightbox();
});

window.addEventListener('keydown', (event) => {
  if (!lightbox || lightbox.hidden) return;
  if (event.key === 'Escape') closeLightbox();
  if (event.key === '+' || event.key === '=') setZoom(zoom * 1.2);
  if (event.key === '-') setZoom(zoom / 1.2);
  if (event.key === '0') resetLightbox();
});

drawAll();
