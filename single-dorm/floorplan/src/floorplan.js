/* Concept floor plans drawn with Canvas 2D. No external assets. */

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
  ctx.fillStyle = 'rgba(247, 240, 228, 0.65)';
  ctx.fillRect(0, 0, width, height);
}

function grid(ctx, width, height, step = 26) {
  ctx.save();
  ctx.strokeStyle = 'rgba(70, 61, 48, 0.07)';
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

function hatch(ctx, t, x, z, w, d, color = '#b7ad9d', spacing = 9) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(t.X(x), t.Y(z), t.W(w), t.W(d));
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
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
    padX = 5,
    padY = 3,
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
  label(ctx, x, y, title, { size: 13, weight: 700, color, bg: 'rgba(247,240,228,0.86)' });
  if (sub) label(ctx, x, y + 17, sub, { size: 8, weight: 500, color: MUTED, bg: 'rgba(247,240,228,0.8)' });
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
  ctx.moveTo(0, -16 * scale);
  ctx.lineTo(0, 18 * scale);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -22 * scale);
  ctx.lineTo(-5 * scale, -11 * scale);
  ctx.lineTo(5 * scale, -11 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.font = `700 ${9 * scale}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('N', 0, -28 * scale);
  ctx.restore();
}

function scaleBar(ctx, t, x, y, steps = 4, stepMeters = 5) {
  const length = t.W(steps * stepMeters);
  const seg = length / steps;
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x, y, length, 6);
  for (let i = 0; i < steps; i += 1) {
    if (i % 2 === 0) {
      ctx.fillStyle = INK;
      ctx.fillRect(x + i * seg, y, seg, 6);
    }
  }
  ctx.fillStyle = MUTED;
  ctx.font = `500 8px ${FONT}`;
  ctx.textAlign = 'center';
  for (let i = 0; i <= steps; i += 1) {
    ctx.fillText(String(i * stepMeters), x + i * seg, y - 5);
  }
  ctx.textAlign = 'left';
  ctx.fillText('m', x + length + 6, y + 6);
  ctx.restore();
}

function windowMark(ctx, t, x, z, length, horizontal = true) {
  ctx.save();
  ctx.strokeStyle = WINDOW;
  ctx.lineWidth = 3;
  const px = t.X(x);
  const py = t.Y(z);
  if (horizontal) {
    line(ctx, t, x, z, x + length, z, PAPER, 6);
    line(ctx, t, x, z, x + length, z, WINDOW, 2.2);
    line(ctx, t, x, z + 0.09, x + length, z + 0.09, WINDOW, 1.2);
  } else {
    line(ctx, t, x, z, x, z + length, PAPER, 6);
    line(ctx, t, x, z, x, z + length, WINDOW, 2.2);
    line(ctx, t, x + 0.09, z, x + 0.09, z + length, WINDOW, 1.2);
  }
  ctx.restore();
}

function door(ctx, t, x, z, size = 1, orientation = 'h', swing = 1) {
  const px = t.X(x);
  const py = t.Y(z);
  const radius = t.W(size);
  ctx.save();
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 1.4;
  if (orientation === 'h') {
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + radius, py);
    ctx.stroke();
  } else if (orientation === 'v') {
    ctx.beginPath();
    ctx.arc(px, py, radius, Math.PI / 2, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px, py + radius * swing);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI);
    ctx.stroke();
  }
  ctx.restore();
}

function bed(ctx, t, x, z, w = 1.2, d = 2.0) {
  fillRect(ctx, t, x, z, w, d, '#e8ddc9');
  strokeRect(ctx, t, x, z, w, d, '#8f7758', 1.3);
  fillRect(ctx, t, x + 0.12, z + 0.12, w - 0.24, 0.32, '#f8f0e2');
  strokeRect(ctx, t, x + 0.12, z + 0.12, w - 0.24, 0.32, '#b7a78f', 1);
  line(ctx, t, x + 0.12, z + d * 0.62, x + w - 0.12, z + d * 0.62, '#b7a78f', 1);
}

function desk(ctx, t, x, z, w = 0.8, d = 0.5, color = FURNITURE) {
  fillRect(ctx, t, x, z, w, d, color);
  strokeRect(ctx, t, x, z, w, d, '#725738', 1.2);
}

function chair(ctx, t, x, z, r = 0.2) {
  ctx.save();
  ctx.fillStyle = '#9e7d51';
  ctx.strokeStyle = '#6d5335';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(t.X(x), t.Y(z), t.W(r), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function sofa(ctx, t, x, z, w = 2.2, d = 0.85) {
  fillRect(ctx, t, x, z, w, d, '#8fa18a');
  strokeRect(ctx, t, x, z, w, d, '#4f614b', 1.4);
  fillRect(ctx, t, x + 0.12, z + 0.12, w - 0.24, d * 0.28, '#a7b59e');
}

function plant(ctx, t, x, z, r = 0.28) {
  ctx.save();
  ctx.fillStyle = '#6f8664';
  ctx.strokeStyle = '#4e6348';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(t.X(x), t.Y(z), t.W(r), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawOuter(ctx, t, width, depth, fill = PAPER) {
  fillRect(ctx, t, 0, 0, width, depth, fill);
  strokeRect(ctx, t, 0, 0, width, depth, WALL, 4.5);
}

function drawOverall() {
  const canvas = document.getElementById('overviewCanvas');
  const { ctx, width, height } = initCanvas(canvas);
  paper(ctx, width, height);
  grid(ctx, width, height, 22);

  ctx.save();
  ctx.fillStyle = MUTED;
  ctx.font = `600 9px ${FONT}`;
  ctx.letterSpacing = '0.16em';
  ctx.fillText('HOPE\'S PEAK · 1F + 2F', 58, 30);
  ctx.fillStyle = INK;
  ctx.font = `500 22px "Iowan Old Style", "Songti SC", serif`;
  ctx.fillText('整体骨架 / 中央礼堂', 58, 54);
  ctx.restore();

  const t = makeTransform(width, height, 44, 30, 58, 28);

  // Corridor ring.
  fillRect(ctx, t, 14, 5, 3, 20, CORRIDOR);
  fillRect(ctx, t, 27, 5, 3, 20, CORRIDOR);
  fillRect(ctx, t, 14, 5, 16, 3, CORRIDOR);
  fillRect(ctx, t, 14, 22, 16, 3, CORRIDOR);

  // Four corner blocks.
  fillRect(ctx, t, 2, 2, 12, 10, '#fbf4e7');
  fillRect(ctx, t, 30, 2, 12, 10, '#fbf4e7');
  fillRect(ctx, t, 2, 18, 12, 10, '#fbf4e7');
  fillRect(ctx, t, 30, 18, 12, 10, '#fbf4e7');

  // Hall.
  fillRect(ctx, t, 17, 8, 10, 14, 'rgba(164,50,63,0.08)');
  strokeRect(ctx, t, 17, 8, 10, 14, HALL, 2.6, [7, 5]);
  fillRect(ctx, t, 18, 8.6, 8, 1.9, 'rgba(164,50,63,0.2)');
  label(ctx, t.X(22), t.Y(9.7), '舞台', { size: 10, weight: 700, color: HALL, align: 'center' });

  // Seats.
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      if (col === 2 || col === 3) continue;
      const x = 18.2 + col * 1.25;
      const z = 11.4 + row * 1.55;
      fillRect(ctx, t, x, z, 0.65, 0.55, row % 2 ? '#d9c7b4' : '#cfbba7');
    }
  }
  label(ctx, t.X(22), t.Y(20.2), '座席区', { size: 9, weight: 600, color: MUTED, align: 'center' });

  // Unopened hatch.
  hatch(ctx, t, 30, 2, 12, 10);

  // Outer and room walls.
  strokeRect(ctx, t, 0, 0, 44, 30, WALL, 4.5);
  strokeRect(ctx, t, 2, 2, 12, 10, WALL, 3);
  strokeRect(ctx, t, 30, 2, 12, 10, WALL, 3);
  strokeRect(ctx, t, 2, 18, 12, 10, WALL, 3);
  strokeRect(ctx, t, 30, 18, 12, 10, WALL, 3);

  // Doors from rooms to corridor.
  door(ctx, t, 14, 7, 1.1, 'v', -1);
  door(ctx, t, 30, 7, 1.1, 'v', 1);
  door(ctx, t, 14, 22.8, 1.1, 'v', 1);
  door(ctx, t, 30, 22.8, 1.1, 'v', -1);
  door(ctx, t, 22, 8, 1.2, 'h', 1);
  door(ctx, t, 22, 22, 1.2, 'h', -1);

  // Vertical core to 3F.
  fillRect(ctx, t, 20, 25, 4, 4, '#e4d6bf');
  strokeRect(ctx, t, 20, 25, 4, 4, WALL, 2.5);
  for (let i = 0; i < 6; i += 1) {
    line(ctx, t, 20.4, 25.5 + i * 0.55, 23.6, 25.5 + i * 0.55, '#8c7c65', 1.1);
  }
  label(ctx, t.X(22), t.Y(27.4), '3F', { size: 12, weight: 700, align: 'center', bg: PAPER });
  arrow(ctx, t.X(22), t.Y(29.2), t.X(22), t.Y(30.5), ACCENT, 1.6);

  // Labels.
  roomLabel(ctx, t.X(3.2), t.Y(4.2), '宿舍区', 'DORM · 12 × 10 m', DORM);
  roomLabel(ctx, t.X(31.2), t.Y(4.2), '未开放区', '不制作 · 只留轮廓', CLOSED);
  roomLabel(ctx, t.X(3.2), t.Y(20.2), '休憩区', 'LOUNGE · 12 × 10 m', REST);
  roomLabel(ctx, t.X(31.2), t.Y(20.2), '研究教室区', 'RESEARCH · 12 × 10 m', RESEARCH);
  label(ctx, t.X(22), t.Y(6.4), '中央礼堂', { size: 17, weight: 700, color: HALL, align: 'center', bg: PAPER });
  label(ctx, t.X(22), t.Y(7.1), 'AUDITORIUM · 10 × 14 m', { size: 8, weight: 500, color: MUTED, align: 'center', bg: PAPER });
  label(ctx, t.X(15.5), t.Y(16), '走廊', { size: 8, weight: 600, color: MUTED, align: 'center' });
  label(ctx, t.X(28.5), t.Y(16), '走廊', { size: 8, weight: 600, color: MUTED, align: 'center' });

  // Dimensions.
  ctx.save();
  ctx.strokeStyle = MUTED;
  ctx.fillStyle = MUTED;
  ctx.lineWidth = 1;
  ctx.font = `500 9px ${FONT}`;
  const topY = t.Y(0) - 15;
  ctx.beginPath();
  ctx.moveTo(t.X(0), topY);
  ctx.lineTo(t.X(44), topY);
  ctx.stroke();
  ctx.fillText('44 m', t.X(21.2), topY - 5);
  const leftX = t.X(0) - 15;
  ctx.beginPath();
  ctx.moveTo(leftX, t.Y(0));
  ctx.lineTo(leftX, t.Y(30));
  ctx.stroke();
  ctx.save();
  ctx.translate(leftX - 5, t.Y(15));
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('30 m', 0, 0);
  ctx.restore();
  ctx.restore();

  north(ctx, width - 55, 105, 1.1);
  scaleBar(ctx, t, 58, height - 34, 4, 5);

  label(ctx, width - 58, height - 30, '概念图 · 非施工图', {
    size: 8,
    weight: 500,
    color: MUTED,
    align: 'right',
  });
}

function cardShell(ctx, width, height, roomW, roomD, margin = 54) {
  const t = makeTransform(width, height, roomW, roomD, margin, 0);
  drawOuter(ctx, t, roomW, roomD, '#fbf4e7');
  return t;
}

function cardMeta(ctx, width, height, roomW, roomD) {
  label(ctx, 54, 26, `${roomW} × ${roomD} m`, { size: 10, weight: 600, color: MUTED });
  label(ctx, width - 54, 26, '概念布置', { size: 8, weight: 500, color: MUTED, align: 'right' });
  north(ctx, width - 54, 62, 0.75);
}

function drawDorm() {
  const canvas = document.getElementById('dormCanvas');
  const { ctx, width, height } = initCanvas(canvas);
  paper(ctx, width, height);
  grid(ctx, width, height, 20);
  cardMeta(ctx, width, height, 12, 10);

  const t = cardShell(ctx, width, height, 12, 10);

  // Corridor.
  fillRect(ctx, t, 0.25, 4.15, 11.5, 1.7, CORRIDOR);
  line(ctx, t, 0.25, 4.15, 11.75, 4.15, WALL, 2);
  line(ctx, t, 0.25, 5.85, 11.75, 5.85, WALL, 2);

  // Four bedrooms.
  const rooms = [
    { x: 0.3, z: 0.3, w: 5.35, d: 3.55, id: '01' },
    { x: 6.35, z: 0.3, w: 5.35, d: 3.55, id: '02' },
    { x: 0.3, z: 6.15, w: 5.35, d: 3.55, id: '03' },
    { x: 6.35, z: 6.15, w: 2.55, d: 3.55, id: '04' },
  ];
  for (const room of rooms) {
    fillRect(ctx, t, room.x, room.z, room.w, room.d, '#fdf7ec');
    strokeRect(ctx, t, room.x, room.z, room.w, room.d, WALL, 2.2);
    label(ctx, t.X(room.x + 0.25), t.Y(room.z + 0.32), `寝室 ${room.id}`, {
      size: 10,
      weight: 700,
      color: DORM,
      bg: 'rgba(253,247,236,0.9)',
    });
  }

  // Shared bath.
  fillRect(ctx, t, 9.1, 6.15, 2.6, 3.55, '#eef2ef');
  strokeRect(ctx, t, 9.1, 6.15, 2.6, 3.55, WALL, 2);
  label(ctx, t.X(9.25), t.Y(6.5), '共享卫浴', { size: 7, weight: 700, color: '#5d7a73' });
  fillRect(ctx, t, 9.35, 6.95, 0.75, 0.65, '#c9d8d2');
  fillRect(ctx, t, 10.35, 6.95, 0.75, 0.65, '#c9d8d2');
  fillRect(ctx, t, 9.35, 8.05, 1.55, 0.55, '#c9d8d2');
  ctx.save();
  ctx.strokeStyle = '#6f8983';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(t.X(10.7), t.Y(8.55), 0.23 * t.scale, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Beds and desks.
  for (const room of rooms) {
    bed(ctx, t, room.x + 0.28, room.z + 0.95, 1.15, 1.95);
    desk(ctx, t, room.x + room.w - 1.15, room.z + 0.9, 0.78, 0.45);
    fillRect(ctx, t, room.x + room.w - 0.72, room.z + 2.75, 0.55, 0.45, '#9b7a50');
    strokeRect(ctx, t, room.x + room.w - 0.72, room.z + 2.75, 0.55, 0.45, '#725738', 1);
  }

  // Doors: bedrooms to corridor + entry.
  door(ctx, t, 2.8, 4.15, 0.9, 'h', 1);
  door(ctx, t, 8.8, 4.15, 0.9, 'h', -1);
  door(ctx, t, 2.8, 6.15, 0.9, 'h', -1);
  door(ctx, t, 8.8, 6.15, 0.9, 'h', 1);
  door(ctx, t, 12, 5.0, 1.0, 'v', 1);

  // Windows on outer north/west.
  windowMark(ctx, t, 1.2, 0, 4.2, true);
  windowMark(ctx, t, 7.2, 0, 4.0, true);
  windowMark(ctx, t, 0, 1.0, 2.8, false);

  // Labels.
  label(ctx, t.X(1.1), t.Y(5.0), '共享走廊', { size: 8, weight: 600, color: MUTED, bg: 'rgba(233,222,203,0.9)' });
  label(ctx, t.X(10.8), t.Y(9.5), '洗衣 / 盥洗', { size: 7, weight: 500, color: MUTED, align: 'right' });
  scaleBar(ctx, t, 54, height - 28, 2, 2);
}

function drawRest() {
  const canvas = document.getElementById('restCanvas');
  const { ctx, width, height } = initCanvas(canvas);
  paper(ctx, width, height);
  grid(ctx, width, height, 20);
  cardMeta(ctx, width, height, 12, 10);
  const t = cardShell(ctx, width, height, 12, 10);

  // Zones, no internal walls.
  fillRect(ctx, t, 0.5, 0.5, 4.3, 3.0, 'rgba(143,161,138,0.18)');
  fillRect(ctx, t, 5.7, 0.5, 5.8, 1.1, 'rgba(164,50,63,0.08)');
  fillRect(ctx, t, 7.4, 6.8, 4.1, 2.7, 'rgba(79,111,120,0.12)');

  // Sofa / coffee table / rug.
  sofa(ctx, t, 0.9, 1.0, 2.5, 0.85);
  sofa(ctx, t, 0.9, 2.0, 1.9, 0.85);
  fillRect(ctx, t, 1.4, 3.4, 2.2, 1.3, '#d9c5a5');
  strokeRect(ctx, t, 1.4, 3.4, 2.2, 1.3, '#9d825b', 1.2);
  label(ctx, t.X(2.5), t.Y(4.05), '茶几', { size: 7, weight: 600, color: MUTED, align: 'center' });

  // TV console.
  fillRect(ctx, t, 5.9, 0.55, 3.5, 0.55, '#7b6a55');
  strokeRect(ctx, t, 5.9, 0.55, 3.5, 0.55, '#4f4234', 1.2);
  label(ctx, t.X(7.65), t.Y(1.35), '影音 / 展示', { size: 7, weight: 600, color: MUTED, align: 'center' });

  // Game table.
  ctx.save();
  ctx.fillStyle = '#9dbbae';
  ctx.strokeStyle = '#587a6e';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(t.X(9.2), t.Y(7.6), 0.9 * t.scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 4; i += 1) {
    chair(ctx, t, 9.2 + Math.cos((i * Math.PI) / 2) * 1.3, 7.6 + Math.sin((i * Math.PI) / 2) * 1.3, 0.2);
  }

  // Vending.
  fillRect(ctx, t, 10.5, 3.0, 0.55, 1.6, '#b45b5f');
  strokeRect(ctx, t, 10.5, 3.0, 0.55, 1.6, '#76383b', 1.2);
  label(ctx, t.X(10.77), t.Y(4.9), '自动贩卖', { size: 6.5, weight: 600, color: MUTED, align: 'center' });

  // Planters.
  plant(ctx, t, 11.2, 9.2, 0.3);
  plant(ctx, t, 0.7, 9.1, 0.3);
  plant(ctx, t, 6.1, 2.7, 0.25);

  // Windows / entry.
  windowMark(ctx, t, 1.4, 0, 4.8, true);
  windowMark(ctx, t, 6.7, 0, 4.2, true);
  door(ctx, t, 12, 5.0, 1.0, 'v', 1);

  label(ctx, t.X(1.4), t.Y(7.4), '休憩 / 交流', { size: 16, weight: 700, color: REST, bg: 'rgba(251,244,231,0.82)' });
  label(ctx, t.X(1.4), t.Y(7.9), 'LOUNGE', { size: 8, weight: 600, color: MUTED, bg: 'rgba(251,244,231,0.75)' });
  scaleBar(ctx, t, 54, height - 28, 2, 2);
}

function drawResearch() {
  const canvas = document.getElementById('researchCanvas');
  const { ctx, width, height } = initCanvas(canvas);
  paper(ctx, width, height);
  grid(ctx, width, height, 20);
  cardMeta(ctx, width, height, 12, 10);
  const t = cardShell(ctx, width, height, 12, 10);

  // Central corridor.
  fillRect(ctx, t, 5.5, 0.25, 1.0, 9.5, CORRIDOR);
  line(ctx, t, 5.5, 0.25, 5.5, 9.75, WALL, 2);
  line(ctx, t, 6.5, 0.25, 6.5, 9.75, WALL, 2);

  // Two labs.
  fillRect(ctx, t, 0.3, 0.3, 5.0, 9.4, '#fdf7ec');
  fillRect(ctx, t, 6.7, 0.3, 5.0, 9.4, '#fdf7ec');
  strokeRect(ctx, t, 0.3, 0.3, 5.0, 9.4, WALL, 2.2);
  strokeRect(ctx, t, 6.7, 0.3, 5.0, 9.4, WALL, 2.2);

  // Lab benches.
  for (const baseX of [1.0, 7.4]) {
    for (let row = 0; row < 3; row += 1) {
      fillRect(ctx, t, baseX, 1.4 + row * 1.7, 3.4, 0.55, '#c9b18a');
      strokeRect(ctx, t, baseX, 1.4 + row * 1.7, 3.4, 0.55, '#8a704b', 1);
      for (let i = 0; i < 3; i += 1) {
        ctx.save();
        ctx.fillStyle = '#e6d9c3';
        ctx.strokeStyle = '#9c8462';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(t.X(baseX + 0.7 + i * 1.0), t.Y(1.4 + row * 1.7 + 0.28), 0.13 * t.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // Shelves / prep.
  fillRect(ctx, t, 0.55, 7.4, 3.8, 0.55, '#8d7a5e');
  strokeRect(ctx, t, 0.55, 7.4, 3.8, 0.55, '#5c4b35', 1.2);
  fillRect(ctx, t, 7.4, 7.4, 3.8, 0.55, '#8d7a5e');
  strokeRect(ctx, t, 7.4, 7.4, 3.8, 0.55, '#5c4b35', 1.2);
  label(ctx, t.X(2.4), t.Y(8.3), '准备 / 储藏', { size: 7, weight: 600, color: MUTED, align: 'center' });
  label(ctx, t.X(9.3), t.Y(8.3), '器材柜', { size: 7, weight: 600, color: MUTED, align: 'center' });

  // Doors.
  door(ctx, t, 5.5, 3.0, 0.9, 'v', 1);
  door(ctx, t, 6.5, 6.8, 0.9, 'v', -1);
  door(ctx, t, 6.0, 10, 1.0, 'h', -1);

  // Windows.
  windowMark(ctx, t, 1.0, 0, 4.0, true);
  windowMark(ctx, t, 7.0, 0, 4.0, true);

  label(ctx, t.X(0.55), t.Y(0.7), '研究教室 A', { size: 11, weight: 700, color: RESEARCH, bg: 'rgba(253,247,236,0.88)' });
  label(ctx, t.X(6.95), t.Y(0.7), '研究教室 B', { size: 11, weight: 700, color: RESEARCH, bg: 'rgba(253,247,236,0.88)' });
  label(ctx, t.X(5.98), t.Y(5.1), '走廊', { size: 7, weight: 600, color: MUTED, align: 'center', bg: 'rgba(233,222,203,0.86)' });
  scaleBar(ctx, t, 54, height - 28, 2, 2);
}

function drawHall() {
  const canvas = document.getElementById('hallCanvas');
  const { ctx, width, height } = initCanvas(canvas);
  paper(ctx, width, height);
  grid(ctx, width, height, 22);
  cardMeta(ctx, width, height, 10, 14);
  const t = makeTransform(width, height, 10, 14, 56, 0);

  // Dashed boundary, as in the sketch.
  fillRect(ctx, t, 0, 0, 10, 14, 'rgba(164,50,63,0.06)');
  strokeRect(ctx, t, 0, 0, 10, 14, HALL, 3.2, [9, 6]);

  // Stage.
  fillRect(ctx, t, 0.4, 0.4, 9.2, 2.6, 'rgba(164,50,63,0.2)');
  strokeRect(ctx, t, 0.4, 0.4, 9.2, 2.6, HALL, 2.2);
  label(ctx, t.X(5), t.Y(1.7), '舞台', { size: 15, weight: 700, color: HALL, align: 'center' });
  label(ctx, t.X(5), t.Y(2.3), 'STAGE', { size: 7, weight: 600, color: MUTED, align: 'center' });

  // Side aisles.
  fillRect(ctx, t, 0.4, 3.4, 0.8, 9.4, '#efe5d5');
  fillRect(ctx, t, 8.8, 3.4, 0.8, 9.4, '#efe5d5');
  // Center aisle.
  fillRect(ctx, t, 4.55, 3.4, 0.9, 9.4, '#efe5d5');

  // Seats.
  for (let row = 0; row < 6; row += 1) {
    for (let side = 0; side < 2; side += 1) {
      for (let col = 0; col < 3; col += 1) {
        const x = side === 0 ? 1.55 + col * 0.95 : 5.65 + col * 0.95;
        const z = 3.9 + row * 1.35;
        fillRect(ctx, t, x, z, 0.62, 0.52, row % 2 ? '#d8c4b0' : '#cdb69f');
        strokeRect(ctx, t, x, z, 0.62, 0.52, '#a48a70', 0.7);
      }
    }
  }
  label(ctx, t.X(5), t.Y(12.0), '座席 6 排 × 6', { size: 8, weight: 600, color: MUTED, align: 'center' });

  // Control / entrance.
  fillRect(ctx, t, 0.5, 12.5, 2.6, 1.1, '#d9c9b3');
  strokeRect(ctx, t, 0.5, 12.5, 2.6, 1.1, WALL, 1.6);
  label(ctx, t.X(1.8), t.Y(13.05), '控制', { size: 7, weight: 600, color: MUTED, align: 'center' });
  door(ctx, t, 8.7, 14, 1.2, 'h', -1);
  door(ctx, t, 1.3, 14, 1.0, 'h', -1);

  // Curtains.
  for (let i = 0; i < 5; i += 1) {
    line(ctx, t, 0.8 + i * 1.9, 0.55, 0.8 + i * 1.9, 2.85, 'rgba(164,50,63,0.3)', 0.8);
  }

  label(ctx, t.X(0.55), t.Y(3.05), '中央礼堂', { size: 13, weight: 700, color: HALL, bg: 'rgba(251,244,231,0.86)' });
  label(ctx, t.X(0.55), t.Y(3.45), 'AUDITORIUM · 10 × 14 m', { size: 7, weight: 500, color: MUTED, bg: 'rgba(251,244,231,0.75)' });

  north(ctx, width - 55, 58, 0.75);
  scaleBar(ctx, t, 56, height - 28, 2, 2);
}

function drawClosed() {
  const canvas = document.getElementById('closedCanvas');
  const { ctx, width, height } = initCanvas(canvas);
  paper(ctx, width, height);
  grid(ctx, width, height, 20);
  cardMeta(ctx, width, height, 12, 10);
  const t = cardShell(ctx, width, height, 12, 10);

  fillRect(ctx, t, 0.2, 0.2, 11.6, 9.6, '#ece4d7');
  hatch(ctx, t, 0.2, 0.2, 11.6, 9.6, '#b6ac9c', 10);
  strokeRect(ctx, t, 0, 0, 12, 10, WALL, 4.5);

  // Sealed door.
  ctx.save();
  ctx.strokeStyle = CLOSED;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(t.X(10.9), t.Y(4.3));
  ctx.lineTo(t.X(12), t.Y(4.3));
  ctx.moveTo(t.X(11.4), t.Y(3.8));
  ctx.lineTo(t.X(11.4), t.Y(5.8));
  ctx.stroke();
  ctx.restore();

  label(ctx, t.X(6), t.Y(4.7), '未开放', { size: 24, weight: 700, color: CLOSED, align: 'center', bg: 'rgba(247,240,228,0.9)' });
  label(ctx, t.X(6), t.Y(5.35), '不制作 · 只留结构轮廓', { size: 10, weight: 600, color: MUTED, align: 'center', bg: 'rgba(247,240,228,0.85)' });
  label(ctx, t.X(6), t.Y(6.0), '封堵门洞', { size: 8, weight: 500, color: MUTED, align: 'center', bg: 'rgba(247,240,228,0.8)' });
  scaleBar(ctx, t, 54, height - 28, 2, 2);
}

function drawAll() {
  drawOverall();
  drawDorm();
  drawRest();
  drawResearch();
  drawHall();
  drawClosed();
}

function downloadOverview() {
  const canvas = document.getElementById('overviewCanvas');
  const link = document.createElement('a');
  link.download = 'hopes-peak-1f-2f-overview.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

document.getElementById('downloadOverview')?.addEventListener('click', downloadOverview);
document.getElementById('printPage')?.addEventListener('click', () => window.print());

drawAll();
