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
  label(ctx, t.X(x + 0.2), t.Y(z + 0.35), 'WC', { size: 7, weight: 700, color: '#4f6f69' });
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
  label(ctx, t.X(20.6), t.Y(4.7), '→ 现有餐厅', { size: 6, weight: 600, color: ACCENT, align: 'right' });

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

  fillRect(ctx, t, 1.0, 7.0, 20.0, 2.0, CORRIDOR);
  line(ctx, t, 1.0, 7.0, 21.0, 7.0, WALL, 1.8);
  line(ctx, t, 1.0, 9.0, 21.0, 9.0, WALL, 1.8);

  const rooms = [
    { x: 1, z: 1, w: 9, d: 5.6, id: '01' },
    { x: 12, z: 1, w: 9, d: 5.6, id: '02' },
    { x: 1, z: 9.4, w: 9, d: 5.6, id: '03' },
    { x: 12, z: 9.4, w: 5, d: 5.6, id: '04' },
  ];
  for (const room of rooms) {
    fillRect(ctx, t, room.x, room.z, room.w, room.d, '#fdf7ec');
    strokeRect(ctx, t, room.x, room.z, room.w, room.d, WALL, 1.8);
    label(ctx, t.X(room.x + 0.2), t.Y(room.z + 0.3), `寝室 ${room.id}`, { size: 7, weight: 700, color: DORM, bg: 'rgba(253,247,236,0.9)' });
  }

  for (const room of rooms) {
    bed(ctx, t, room.x + 0.3, room.z + 0.8, 1.05, 1.9);
    desk(ctx, t, room.x + room.w - 1.0, room.z + 0.8, 0.7, 0.4);
    fillRect(ctx, t, room.x + room.w - 0.7, room.z + 2.6, 0.5, 0.4, '#9b7a50');
    strokeRect(ctx, t, room.x + room.w - 0.7, room.z + 2.6, 0.5, 0.4, '#725738', 0.8);
  }

  fillRect(ctx, t, 12, 9.4, 9, 5.6, '#eef2ef');
  strokeRect(ctx, t, 12, 9.4, 9, 5.6, WALL, 1.8);
  label(ctx, t.X(12.25), t.Y(9.8), '共享卫浴 / 洗衣', { size: 6.5, weight: 700, color: '#5d7a73' });
  wc(ctx, t, 17.8, 9.4, 3.2, 5.6);
  label(ctx, t.X(19.4), t.Y(14.7), '厕所', { size: 6, weight: 700, color: '#4f6f69', align: 'center' });
  fillRect(ctx, t, 12.3, 10.0, 2.0, 1.0, '#c7d9d3');
  fillRect(ctx, t, 14.5, 10.0, 2.0, 1.0, '#c7d9d3');
  label(ctx, t.X(13.3), t.Y(11.5), '洗衣', { size: 6, weight: 600, color: MUTED });
  label(ctx, t.X(15.5), t.Y(11.5), '盥洗', { size: 6, weight: 600, color: MUTED });

  door(ctx, t, 2.8, 7.0, 0.8, 'h', 1);
  door(ctx, t, 8.5, 7.0, 0.8, 'h', -1);
  door(ctx, t, 2.8, 9.0, 0.8, 'h', -1);
  door(ctx, t, 13.8, 9.0, 0.8, 'h', 1);
  door(ctx, t, 14.2, 9.4, 0.8, 'v', -1);

  windowMark(ctx, t, 1.5, 0, 6.0, true);
  windowMark(ctx, t, 12.5, 0, 6.0, true);
  label(ctx, t.X(1.3), t.Y(8.0), '2F 走廊', { size: 6.5, weight: 600, color: MUTED, bg: 'rgba(233,222,203,0.9)' });
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
  label(ctx, t.X(8.8), t.Y(10.5), '更衣 / 厕所', { size: 6.3, weight: 700, color: '#4f6f69' });
  wc(ctx, t, 11.2, 10, 2.3, 5);

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
  wc(ctx, t, 18.2, 9.4, 2.8, 5.6);
  label(ctx, t.X(19.6), t.Y(14.7), '厕所', { size: 6, weight: 700, color: '#4f6f69', align: 'center' });

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

  fillRect(ctx, t, 17.5, 11.5, 3.8, 4.0, '#e7ece9');
  hatch(ctx, t, 17.5, 11.5, 3.8, 4.0, '#a8bbb5', 8);
  label(ctx, t.X(19.4), t.Y(13.5), 'WC 封堵', { size: 6.5, weight: 700, color: '#4f6f69', align: 'center', bg: 'rgba(247,240,228,0.85)' });

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

  wc(ctx, t, 26.3, 17.2, 2.2, 3.8);
  label(ctx, t.X(27.4), t.Y(21.5), '厕所', { size: 5.8, weight: 700, color: '#4f6f69', align: 'center' });
  wc(ctx, t, 9.0, 17.2, 2.2, 3.8);
  label(ctx, t.X(10.1), t.Y(21.5), '厕所', { size: 5.8, weight: 700, color: '#4f6f69', align: 'center' });

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
  label(ctx, 58, 80, '四个翼楼均为两层；礼堂独占 3F；每区设厕所', { size: 8, weight: 500, color: MUTED });

  const t = makeTransform(width, height, 72, 56, 58, 30);

  // Wing fill.
  fillRect(ctx, t, 2, 2, 22, 16, '#fbf4e7');
  fillRect(ctx, t, 48, 2, 22, 16, '#fbf4e7');
  fillRect(ctx, t, 2, 38, 22, 16, '#fbf4e7');
  fillRect(ctx, t, 48, 38, 22, 16, '#fbf4e7');

  // Corridors.
  fillRect(ctx, t, 24, 18, 2, 20, CORRIDOR);
  fillRect(ctx, t, 46, 18, 2, 20, CORRIDOR);
  fillRect(ctx, t, 24, 18, 24, 2, CORRIDOR);
  fillRect(ctx, t, 24, 36, 24, 2, CORRIDOR);

  // Atrium.
  fillRect(ctx, t, 26, 20, 20, 16, '#efe5d4');
  strokeRect(ctx, t, 26, 20, 20, 16, '#b7a68e', 1.2, [5, 4]);

  // 3F hall projection.
  strokeRect(ctx, t, 20, 17, 32, 22, HALL, 2.5, [10, 7]);
  fillRect(ctx, t, 20, 17, 32, 22, 'rgba(164,50,63,0.035)');
  label(ctx, t.X(36), t.Y(16.1), '3F 礼堂投影', { size: 8, weight: 700, color: HALL, align: 'center', bg: PAPER });
  label(ctx, t.X(36), t.Y(16.6), '32 × 22 m · 最上层', { size: 6.5, weight: 500, color: MUTED, align: 'center', bg: PAPER });

  // Unopened hatch.
  hatch(ctx, t, 48, 2, 22, 16, '#b6ac9c', 10);

  // Wing walls.
  strokeRect(ctx, t, 2, 2, 22, 16, WALL, 3);
  strokeRect(ctx, t, 48, 2, 22, 16, WALL, 3);
  strokeRect(ctx, t, 2, 38, 22, 16, WALL, 3);
  strokeRect(ctx, t, 48, 38, 22, 16, WALL, 3);
  strokeRect(ctx, t, 0, 0, 72, 56, WALL, 4.5);

  // Grand stair in atrium.
  stairs(ctx, t, 30, 23, 5.0, 10.0, 'up');
  stairs(ctx, t, 37, 23, 5.0, 10.0, 'up');
  label(ctx, t.X(36), t.Y(34.2), '大楼梯：1F → 2F → 3F 礼堂', { size: 7, weight: 700, color: ACCENT, align: 'center', bg: 'rgba(239,229,212,0.9)' });

  // Small WC markers in wings.
  for (const [x, z] of [[2.8, 14.6], [48.8, 14.6], [2.8, 50.6], [48.8, 50.6]]) {
    fillRect(ctx, t, x, z, 2.2, 2.0, '#dce9e6');
    strokeRect(ctx, t, x, z, 2.2, 2.0, '#7c9893', 0.8);
    label(ctx, t.X(x + 1.1), t.Y(z + 1.0), 'WC', { size: 5, weight: 700, color: '#4f6f69', align: 'center' });
  }

  // Doors to corridors.
  door(ctx, t, 24, 8, 1.2, 'v', -1);
  door(ctx, t, 46, 8, 1.2, 'v', 1);
  door(ctx, t, 24, 44, 1.2, 'v', 1);
  door(ctx, t, 46, 44, 1.2, 'v', -1);
  door(ctx, t, 36, 20, 1.5, 'h', 1);
  door(ctx, t, 36, 36, 1.5, 'h', -1);

  roomLabel(ctx, t.X(3.0), t.Y(4.0), '生活区', '1F 厨房/后厨 · 2F 寝室 · WC', DORM);
  roomLabel(ctx, t.X(49.0), t.Y(4.0), '未开放区', '1F/2F · 不制作', CLOSED);
  roomLabel(ctx, t.X(3.0), t.Y(40.0), '休憩区', '锻炼 · 乒乓球 · 杂物 · WC', REST);
  roomLabel(ctx, t.X(49.0), t.Y(40.0), '研究教室区', '10 间教室 · WC', RESEARCH);
  label(ctx, t.X(36), t.Y(21.0), '中庭 / 大楼梯', { size: 9, weight: 700, color: MUTED, align: 'center', bg: 'rgba(239,229,212,0.9)' });

  // Dimensions.
  ctx.save();
  ctx.strokeStyle = MUTED;
  ctx.fillStyle = MUTED;
  ctx.lineWidth = 1;
  ctx.font = `500 8px ${FONT}`;
  const topY = t.Y(0) - 14;
  ctx.beginPath();
  ctx.moveTo(t.X(0), topY);
  ctx.lineTo(t.X(72), topY);
  ctx.stroke();
  ctx.fillText('72 m', t.X(35), topY - 5);
  const leftX = t.X(0) - 14;
  ctx.beginPath();
  ctx.moveTo(leftX, t.Y(0));
  ctx.lineTo(leftX, t.Y(56));
  ctx.stroke();
  ctx.save();
  ctx.translate(leftX - 5, t.Y(28));
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('56 m', 0, 0);
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

drawAll();
