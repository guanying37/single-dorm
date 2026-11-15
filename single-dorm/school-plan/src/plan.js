/* Special-school concept plans: 1F/2F wings + 3F auditorium ring. Canvas 2D only. */

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
const WC = '#dce9e6';
const ACCENT = '#a4323f';
const FONT = '"Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif';

function initCanvas(canvas) {
  const w = canvas.width, h = canvas.height;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  canvas.style.aspectRatio = `${w} / ${h}`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width: w, height: h };
}
const paper = (ctx, w, h) => { ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h); };
function grid(ctx, w, h, step = 26) {
  ctx.save(); ctx.strokeStyle = 'rgba(70,61,48,.065)'; ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += step) { ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, h); ctx.stroke(); }
  for (let y = 0; y <= h; y += step) { ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(w, y + .5); ctx.stroke(); }
  ctx.restore();
}
function makeTransform(w, h, rw, rd, margin = 40, top = 0) {
  const aw = w - margin * 2, ah = h - margin * 2 - top;
  const s = Math.min(aw / rw, ah / rd);
  const ox = (w - rw * s) / 2, oy = margin + top + (ah - rd * s) / 2;
  return { s, X: x => ox + x * s, Y: z => oy + z * s, W: v => v * s };
}
const fillRect = (ctx, t, x, z, w, d, color) => { ctx.fillStyle = color; ctx.fillRect(t.X(x), t.Y(z), t.W(w), t.W(d)); };
function strokeRect(ctx, t, x, z, w, d, color = WALL, line = 2, dash = null) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = line; if (dash) ctx.setLineDash(dash);
  ctx.strokeRect(t.X(x), t.Y(z), t.W(w), t.W(d)); ctx.restore();
}
function line(ctx, t, x1, z1, x2, z2, color = WALL, width = 2, dash = null) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(t.X(x1), t.Y(z1)); ctx.lineTo(t.X(x2), t.Y(z2)); ctx.stroke(); ctx.restore();
}
function rawLine(ctx, x1, y1, x2, y2, color = WALL, width = 1.2) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}
function hatch(ctx, t, x, z, w, d, color = '#b7ad9d', spacing = 9) {
  ctx.save(); ctx.beginPath(); ctx.rect(t.X(x), t.Y(z), t.W(w), t.W(d)); ctx.clip();
  ctx.strokeStyle = color; ctx.lineWidth = 1.1;
  const px = t.X(x), py = t.Y(z), pw = t.W(w), ph = t.W(d);
  for (let o = -ph; o < pw + ph; o += spacing) { ctx.beginPath(); ctx.moveTo(px + o, py + ph); ctx.lineTo(px + o + ph, py); ctx.stroke(); }
  ctx.restore();
}
function label(ctx, x, y, text, o = {}) {
  const size = o.size ?? 11, weight = o.weight ?? 600, color = o.color ?? INK, align = o.align ?? 'left', bg = o.bg ?? null;
  ctx.save(); ctx.font = `${weight} ${size}px ${FONT}`;
  if (bg) {
    const m = ctx.measureText(text), w = m.width + 8, h = size + 4;
    let left = x - 4;
    if (align === 'center') left = x - w / 2;
    if (align === 'right') left = x - w + 4;
    ctx.fillStyle = bg; ctx.fillRect(left, y - h / 2, w, h);
  }
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y); ctx.restore();
}
function roomLabel(ctx, x, y, title, sub, color = INK) {
  label(ctx, x, y, title, { size: 11, weight: 700, color, bg: 'rgba(247,240,228,.9)' });
  if (sub) label(ctx, x, y + 14, sub, { size: 7, weight: 500, color: MUTED, bg: 'rgba(247,240,228,.84)' });
}
function arrow(ctx, x1, y1, x2, y2, color = ACCENT, width = 1.4) {
  ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1), h = 7;
  ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - h * Math.cos(a - .42), y2 - h * Math.sin(a - .42)); ctx.lineTo(x2 - h * Math.cos(a + .42), y2 - h * Math.sin(a + .42)); ctx.closePath(); ctx.fill(); ctx.restore();
}
function north(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = MUTED; ctx.fillStyle = INK; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(0, -14 * s); ctx.lineTo(0, 16 * s); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -20 * s); ctx.lineTo(-4.5 * s, -10 * s); ctx.lineTo(4.5 * s, -10 * s); ctx.closePath(); ctx.fill();
  ctx.font = `700 ${8 * s}px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('N', 0, -25 * s); ctx.restore();
}
function scaleBar(ctx, t, x, y, steps = 3, stepM = 5) {
  const len = t.W(steps * stepM), seg = len / steps;
  ctx.save(); ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineWidth = 1.1; ctx.strokeRect(x, y, len, 5);
  for (let i = 0; i < steps; i++) if (i % 2 === 0) ctx.fillRect(x + i * seg, y, seg, 5);
  ctx.fillStyle = MUTED; ctx.font = `500 7px ${FONT}`; ctx.textAlign = 'center';
  for (let i = 0; i <= steps; i++) ctx.fillText(String(i * stepM), x + i * seg, y - 4);
  ctx.textAlign = 'left'; ctx.fillText('m', x + len + 5, y + 5); ctx.restore();
}
function windowMark(ctx, t, x, z, len, horizontal = true) {
  ctx.save(); ctx.strokeStyle = '#8da6a2'; ctx.lineWidth = 2;
  if (horizontal) {
    line(ctx, t, x, z, x + len, z, PAPER, 5); line(ctx, t, x, z, x + len, z, '#8da6a2', 1.8);
    line(ctx, t, x, z + .06, x + len, z + .06, '#8da6a2', .8);
  } else {
    line(ctx, t, x, z, x, z + len, PAPER, 5); line(ctx, t, x, z, x, z + len, '#8da6a2', 1.8);
    line(ctx, t, x + .06, z, x + .06, z + len, '#8da6a2', .8);
  }
  ctx.restore();
}
function door(ctx, t, x, z, size = 1, orient = 'h', swing = 1) {
  const px = t.X(x), py = t.Y(z), r = t.W(size);
  ctx.save(); ctx.strokeStyle = ACCENT; ctx.lineWidth = 1.2;
  if (orient === 'h') {
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + r, py); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(px, py, r, Math.PI / 2, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + r * swing); ctx.stroke();
  }
  ctx.restore();
}
function bed(ctx, t, x, z, w = .95, d = 1.8) {
  fillRect(ctx, t, x, z, w, d, '#e8ddc9'); strokeRect(ctx, t, x, z, w, d, '#8f7758', 1);
  fillRect(ctx, t, x + .08, z + .08, w - .16, .25, '#f8f0e2');
  line(ctx, t, x + .08, z + d * .6, x + w - .08, z + d * .6, '#b7a78f', .8);
}
function desk(ctx, t, x, z, w = .6, d = .35) { fillRect(ctx, t, x, z, w, d, '#b58c58'); strokeRect(ctx, t, x, z, w, d, '#725738', .9); }
function chair(ctx, t, x, z, r = .16) {
  ctx.save(); ctx.fillStyle = '#9e7d51'; ctx.strokeStyle = '#6d5335'; ctx.lineWidth = .8;
  ctx.beginPath(); ctx.arc(t.X(x), t.Y(z), t.W(r), 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
}
function wc(ctx, t, x, z, w = 3, d = 3) {
  fillRect(ctx, t, x, z, w, d, WC); strokeRect(ctx, t, x, z, w, d, '#6f8983', 1.1);
  fillRect(ctx, t, x + .2, z + .7, .45, .55, '#c7d9d3');
  fillRect(ctx, t, x + .8, z + .7, .45, .55, '#c7d9d3');
  fillRect(ctx, t, x + .2, z + 1.5, .8, .35, '#c7d9d3');
}
function stairs(ctx, t, x, z, w, d, dir = 'up') {
  fillRect(ctx, t, x, z, w, d, '#e5d6bf'); strokeRect(ctx, t, x, z, w, d, WALL, 1.1);
  for (let i = 1; i < 6; i++) line(ctx, t, x, z + (d / 6) * i, x + w, z + (d / 6) * i, '#9b886d', .8);
  const cx = t.X(x + w / 2);
  if (dir === 'up') arrow(ctx, cx, t.Y(z + d * .8), cx, t.Y(z + d * .2), ACCENT, 1.1);
  else arrow(ctx, cx, t.Y(z + d * .2), cx, t.Y(z + d * .8), ACCENT, 1.1);
}
function elevator(ctx, t, x, z, w, d, id) {
  fillRect(ctx, t, x, z, w, d, '#efe5d4'); strokeRect(ctx, t, x, z, w, d, WALL, 1.3);
  line(ctx, t, x + .18, z + .35, x + w - .18, z + .35, '#8f7e66', .8);
  label(ctx, t.X(x + w / 2), t.Y(z + d / 2), id, { size: 6, weight: 700, color: ACCENT, align: 'center' });
}
function shell(canvas, name, level, rw, rd, dims) {
  const { ctx, width, height } = initCanvas(canvas);
  paper(ctx, width, height); grid(ctx, width, height, 20);
  label(ctx, 30, 20, `${name} · ${level}`, { size: 10, weight: 700 });
  label(ctx, width - 30, 20, dims, { size: 7, weight: 500, color: MUTED, align: 'right' });
  const t = makeTransform(width, height, rw, rd, 30, 8);
  fillRect(ctx, t, 0, 0, rw, rd, '#fbf4e7'); strokeRect(ctx, t, 0, 0, rw, rd, WALL, 3.5);
  return { ctx, width, height, t };
}
function footer(ctx, t, width, height) {
  north(ctx, width - 28, 58, .55); scaleBar(ctx, t, 30, height - 20, 2, 5);
}

/* ---------------- Life 1F ---------------- */
function drawLife1F() {
  const { ctx, width, height, t } = shell(document.getElementById('life1f'), '生活区', '1F', 52, 20, '52 × 20 m');
  fillRect(ctx, t, 1, 1, 18, 14, '#f7efe2'); strokeRect(ctx, t, 1, 1, 18, 14, WALL, 2);
  label(ctx, t.X(2), t.Y(2.2), '后厨 18 × 14', { size: 9, weight: 700, color: DORM, bg: 'rgba(247,239,226,.9)' });
  fillRect(ctx, t, 19.5, 1, 30.5, 14, '#fdf7ec'); strokeRect(ctx, t, 19.5, 1, 30.5, 14, WALL, 2);
  label(ctx, t.X(21), t.Y(2.3), '餐厅进食区', { size: 10, weight: 700, color: DORM, bg: 'rgba(253,247,236,.9)' });

  let n = 0;
  for (const z of [4.6, 9.8]) for (const x of [23, 28, 33, 38]) {
    if (n >= 8) break;
    fillRect(ctx, t, x, z, 2.0, 1.0, '#c9b18a'); strokeRect(ctx, t, x, z, 2.0, 1.0, '#8a704b', 1);
    for (const [dx, dz] of [[.4, -.35], [1, -.35], [1.6, -.35], [.4, 1.35], [1, 1.35], [1.6, 1.35]]) chair(ctx, t, x + dx, z + dz, .15);
    n++;
  }

  fillRect(ctx, t, 1.4, 1.4, 6, 3, '#eadcc6'); label(ctx, t.X(1.7), t.Y(2.0), '灶台/烟罩', { size: 5.7, weight: 600, color: MUTED });
  fillRect(ctx, t, 14.2, 1.4, 4.2, 3, '#dfe9e7'); label(ctx, t.X(14.4), t.Y(2.0), '冷库', { size: 5.7, weight: 700, color: '#4f6f69' });
  fillRect(ctx, t, 1.4, 11.5, 6, 3, '#dfe9e7'); label(ctx, t.X(1.7), t.Y(12.1), '清洗/洗碗', { size: 5.7, weight: 600, color: '#4f6f69' });
  fillRect(ctx, t, 8.4, 7, 3, 1.2, '#c9b18a'); label(ctx, t.X(9.9), t.Y(8.5), '操作岛台', { size: 5.4, weight: 600, color: MUTED, align: 'center' });
  fillRect(ctx, t, .3, 8.2, .7, 2, '#c2b6a4'); label(ctx, t.X(.9), t.Y(9.2), '货梯', { size: 5.2, weight: 600, color: MUTED, align: 'center' });

  fillRect(ctx, t, 18.95, 4.4, .2, 2, PAPER); arrow(ctx, t.X(19.1), t.Y(5.4), t.X(21.2), t.Y(5.4), ACCENT, 1.2);
  label(ctx, t.X(19.3), t.Y(3.9), '传菜口', { size: 5.6, weight: 700, color: ACCENT, bg: PAPER });

  const z0 = 15.3, d0 = 3.8;
  const services = [
    { x: 1, w: 6, name: '配套厕所', color: '#eef2ef', wc: true },
    { x: 7.4, w: 8, name: '医务室', color: '#f4ebde' },
    { x: 15.8, w: 8, name: '洗衣房', color: '#eef2ef' },
    { x: 24.2, w: 8, name: '杂物室 / 被铺', color: '#eee5d6' },
  ];
  for (const s of services) {
    fillRect(ctx, t, s.x, z0, s.w, d0, s.color); strokeRect(ctx, t, s.x, z0, s.w, d0, WALL, 1.1);
    label(ctx, t.X(s.x + .25), t.Y(z0 + .55), s.name, { size: 6, weight: 700, color: MUTED });
    if (s.wc) wc(ctx, t, s.x + 3.1, z0 + .2, 2.5, 3.3);
    if (s.name.includes('医务')) { fillRect(ctx, t, s.x + 1, z0 + 1.3, 2, .7, '#d9c9b3'); fillRect(ctx, t, s.x + 4.4, z0 + 1.3, 1.6, .7, '#d9c9b3'); }
    if (s.name.includes('洗衣')) for (let i = 0; i < 3; i++) fillRect(ctx, t, s.x + .6 + i * 2, z0 + 1.4, 1.2, 1.2, '#c7d9d3');
    if (s.name.includes('杂物')) for (let i = 0; i < 3; i++) fillRect(ctx, t, s.x + .4, z0 + 1.2 + i * .7, 6.8, .3, '#b9a688');
  }
  fillRect(ctx, t, 32.8, z0, 4.8, d0, '#e5d6bf'); strokeRect(ctx, t, 32.8, z0, 4.8, d0, WALL, 1.1);
  stairs(ctx, t, 33, z0 + .2, 4.4, d0 - .4, 'up'); label(ctx, t.X(35.2), t.Y(z0 - .3), '楼梯间', { size: 5.6, weight: 700, color: MUTED, align: 'center' });
  elevator(ctx, t, 38.2, z0, 4.2, d0, 'EL'); label(ctx, t.X(40.3), t.Y(z0 - .3), '电梯预留', { size: 5.4, weight: 700, color: ACCENT, align: 'center' });

  door(ctx, t, 51.9, 10, 1.6, 'v', -1); door(ctx, t, 4, z0, .9, 'h', 1); door(ctx, t, 9, z0, .9, 'h', 1); door(ctx, t, 17, z0, .9, 'h', 1); door(ctx, t, 26, z0, .9, 'h', 1);
  windowMark(ctx, t, 21, 0, 7, true); windowMark(ctx, t, 31, 0, 7, true); windowMark(ctx, t, 41, 0, 7, true);
  footer(ctx, t, width, height);
}

/* ---------------- Life 2F ---------------- */
function drawLife2F() {
  const { ctx, width, height, t } = shell(document.getElementById('life2f'), '生活区', '2F', 52, 20, '52 × 20 m');
  fillRect(ctx, t, .8, 7, 50.4, 2.4, CORRIDOR);
  line(ctx, t, .8, 7, 51.2, 7, WALL, 1.5); line(ctx, t, .8, 9.4, 51.2, 9.4, WALL, 1.5);

  for (let i = 0; i < 10; i++) {
    const x = 1 + i * 4.2;
    fillRect(ctx, t, x, 1, 4, 6, '#fdf7ec'); strokeRect(ctx, t, x, 1, 4, 6, WALL, 1.1);
    label(ctx, t.X(x + .15), t.Y(1.3), `B${String(i + 1).padStart(2, '0')}`, { size: 5.6, weight: 700, color: DORM, bg: 'rgba(253,247,236,.9)' });
    bed(ctx, t, x + .2, 2, .9, 1.7); desk(ctx, t, x + 3.1, 2, .6, .35);
    door(ctx, t, x + 2, 7, .55, 'h', 1);
  }

  fillRect(ctx, t, 43.2, 1, 4.2, 6, '#eef2ef'); strokeRect(ctx, t, 43.2, 1, 4.2, 6, WALL, 1.1);
  label(ctx, t.X(43.4), t.Y(1.3), '男洗浴', { size: 5.8, weight: 700, color: '#4f6f69' });
  fillRect(ctx, t, 47.7, 1, 3.8, 6, '#eef2ef'); strokeRect(ctx, t, 47.7, 1, 3.8, 6, WALL, 1.1);
  label(ctx, t.X(47.9), t.Y(1.3), '女洗浴', { size: 5.8, weight: 700, color: '#4f6f69' });
  wc(ctx, t, 43.6, 2.2, 3.4, 3.4); wc(ctx, t, 48, 2.2, 3.2, 3.4);
  label(ctx, t.X(45.3), t.Y(6.4), '男生厕所由此进入', { size: 4.8, weight: 600, color: MUTED, align: 'center' });

  for (let i = 0; i < 8; i++) {
    const x = 1 + i * 4.2;
    fillRect(ctx, t, x, 9.8, 4, 9.0, '#fdf7ec'); strokeRect(ctx, t, x, 9.8, 4, 9.0, WALL, 1.1);
    label(ctx, t.X(x + .15), t.Y(10.1), `G${String(i + 1).padStart(2, '0')}`, { size: 5.6, weight: 700, color: REST, bg: 'rgba(253,247,236,.9)' });
    bed(ctx, t, x + .2, 10.8, .9, 1.7); desk(ctx, t, x + 3.1, 10.8, .6, .35);
    fillRect(ctx, t, x + 3.0, 16.6, .6, .6, '#9b7a50');
    door(ctx, t, x + 2, 9.4, .55, 'h', -1);
  }

  wc(ctx, t, 35.2, 9.8, 3.6, 4); label(ctx, t.X(37), t.Y(14.5), '女生独立厕所', { size: 5.2, weight: 700, color: '#4f6f69', align: 'center' });
  label(ctx, t.X(37), t.Y(15.1), '无窗', { size: 5.5, weight: 700, color: ACCENT, align: 'center' });
  fillRect(ctx, t, 35.2, 14.2, 3.6, 4.6, '#eee5d6'); strokeRect(ctx, t, 35.2, 14.2, 3.6, 4.6, WALL, 1);
  label(ctx, t.X(37), t.Y(16.3), '女生储藏', { size: 5, weight: 600, color: MUTED, align: 'center' });
  stairs(ctx, t, 39.6, 9.8, 4.2, 4, 'down'); label(ctx, t.X(41.7), t.Y(14.4), '楼梯', { size: 5, weight: 600, color: MUTED, align: 'center' });
  elevator(ctx, t, 44.4, 9.8, 4, 4, 'EL');
  fillRect(ctx, t, 48.8, 9.8, 2.4, 4, '#eee5d6'); label(ctx, t.X(50), t.Y(11.8), '储藏', { size: 5, weight: 600, color: MUTED, align: 'center' });
  fillRect(ctx, t, 39.6, 14.2, 4.2, 4.6, '#eef2ef'); strokeRect(ctx, t, 39.6, 14.2, 4.2, 4.6, WALL, 1);
  label(ctx, t.X(41.7), t.Y(16.4), '女生洗衣', { size: 5, weight: 600, color: MUTED, align: 'center' });
  for (let i = 0; i < 2; i++) fillRect(ctx, t, 40.2 + i * 1.8, 17.0, 1.2, 1.2, '#c7d9d3');

  for (let i = 0; i < 10; i++) windowMark(ctx, t, 1.4 + i * 4.2, 0, 2, true);
  windowMark(ctx, t, 43.6, 0, 6.8, true);
  label(ctx, t.X(18), t.Y(19.3), '女生宿舍区：无窗', { size: 6, weight: 700, color: ACCENT, align: 'center', bg: 'rgba(251,244,231,.85)' });
  footer(ctx, t, width, height);
}

/* ---------------- Recreation ---------------- */
function drawRec1F() {
  const { ctx, width, height, t } = shell(document.getElementById('rec1f'), '休憩区', '1F', 52, 18, '52 × 18 m');
  fillRect(ctx, t, 1, 1, 26, 11, '#e6eadf'); strokeRect(ctx, t, 1, 1, 26, 11, '#7f9277', 1.3);
  label(ctx, t.X(1.4), t.Y(1.6), '综合运动区', { size: 9, weight: 700, color: REST });
  fillRect(ctx, t, 2, 3, 10, 7, '#d2dcc8'); fillRect(ctx, t, 14, 3, 10, 7, '#d2dcc8');
  label(ctx, t.X(8), t.Y(6.5), '垫上 / 体能', { size: 6, weight: 500, color: MUTED, align: 'center' });

  fillRect(ctx, t, 28, 1, 12, 8, '#eee5d6'); strokeRect(ctx, t, 28, 1, 12, 8, WALL, 1.1);
  label(ctx, t.X(28.4), t.Y(1.6), '器材室', { size: 6.5, weight: 700, color: MUTED });
  for (let i = 0; i < 4; i++) fillRect(ctx, t, 28.5, 2.8 + i * 1.1, 8, .3, '#b9a688');

  fillRect(ctx, t, 41, 1, 10, 8, '#eef0e8'); strokeRect(ctx, t, 41, 1, 10, 8, '#7f9277', 1.1);
  label(ctx, t.X(41.4), t.Y(1.6), '乒乓球', { size: 6.5, weight: 700, color: REST });
  fillRect(ctx, t, 42, 3.2, 2.5, 1.4, '#d8c7a5'); strokeRect(ctx, t, 42, 3.2, 2.5, 1.4, '#725c3e', 1.2);
  fillRect(ctx, t, 46.5, 3.2, 2.5, 1.4, '#d8c7a5'); strokeRect(ctx, t, 46.5, 3.2, 2.5, 1.4, '#725c3e', 1.2);

  fillRect(ctx, t, 28, 10, 10, 7, '#eef2ef'); strokeRect(ctx, t, 28, 10, 10, 7, '#7c9893', 1.1);
  label(ctx, t.X(28.4), t.Y(10.6), '更衣 / 卫生间', { size: 5.8, weight: 700, color: '#4f6f69' });
  wc(ctx, t, 34, 10.4, 3.2, 4.4);

  fillRect(ctx, t, 39, 10, 12, 7, '#f4ebde'); strokeRect(ctx, t, 39, 10, 12, 7, WALL, 1.1);
  label(ctx, t.X(39.4), t.Y(10.6), '休息 / 饮水', { size: 6, weight: 600, color: MUTED });
  fillRect(ctx, t, 40, 12, 4, 1.4, '#d9c5a5');
  door(ctx, t, 51.9, 9, 1.4, 'v', -1);
  footer(ctx, t, width, height);
}

function drawRec2F() {
  const { ctx, width, height, t } = shell(document.getElementById('rec2f'), '休憩区', '2F', 52, 18, '52 × 18 m');
  const rooms = [{ x: 1, w: 15, name: '画室 A' }, { x: 17, w: 15, name: '画室 B' }, { x: 33, w: 16, name: '画室 C' }];
  for (const r of rooms) {
    fillRect(ctx, t, r.x, 1, r.w, 9.5, '#fdf7ec'); strokeRect(ctx, t, r.x, 1, r.w, 9.5, WALL, 1.2);
    label(ctx, t.X(r.x + .3), t.Y(1.6), r.name, { size: 6.5, weight: 700, color: RESEARCH });
    for (let i = 0; i < 4; i++) {
      fillRect(ctx, t, r.x + 1.2 + i * 3.2, 4, 2.2, .6, '#c9b18a');
      fillRect(ctx, t, r.x + 1.2 + i * 3.2, 15, 2.2, .6, '#c9b18a');
    }
    for (let i = 0; i < 3; i++) {
      ctx.save(); ctx.strokeStyle = '#8a704b'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(t.X(r.x + 2.2 + i * 4), t.Y(6)); ctx.lineTo(t.X(r.x + 2.8 + i * 4), t.Y(8)); ctx.lineTo(t.X(r.x + 2 + i * 4), t.Y(8)); ctx.closePath(); ctx.stroke(); ctx.restore();
    }
  }
  fillRect(ctx, t, 1, 11, 12, 6, '#eee5d6'); strokeRect(ctx, t, 1, 11, 12, 6, WALL, 1.1);
  label(ctx, t.X(1.4), t.Y(11.7), '画材储藏', { size: 6, weight: 700, color: MUTED });
  for (let i = 0; i < 3; i++) fillRect(ctx, t, 1.5, 12.4 + i * 1.1, 8, .3, '#b9a688');
  fillRect(ctx, t, 14, 11, 18, 6, '#f4ebde'); strokeRect(ctx, t, 14, 11, 18, 6, WALL, 1.1);
  label(ctx, t.X(14.4), t.Y(11.7), '展示 / 休息', { size: 6, weight: 600, color: MUTED });
  fillRect(ctx, t, 15, 13, 5, 1.6, '#d9c5a5'); fillRect(ctx, t, 22, 13, 5, 1.6, '#d9c5a5');
  stairs(ctx, t, 42, 11.2, 4, 3.8, 'down'); elevator(ctx, t, 47, 11.2, 3.2, 3.8, 'EL');
  door(ctx, t, 51.9, 9, 1.4, 'v', -1);
  footer(ctx, t, width, height);
}

/* ---------------- Research 20 × 18 ---------------- */
function drawResearch(level) {
  const { ctx, width, height, t } = shell(document.getElementById(level === 1 ? 'research1f' : 'research2f'), '研究教室区', `${level}F`, 20, 18, '20 × 18 m');
  const off = level === 1 ? 1 : 6;
  fillRect(ctx, t, .8, 7.6, 18.4, 2.2, CORRIDOR);
  line(ctx, t, .8, 7.6, 19.2, 7.6, WALL, 1.4); line(ctx, t, .8, 9.8, 19.2, 9.8, WALL, 1.4);
  const rooms = [{ x: 1, z: 1 }, { x: 7.1, z: 1 }, { x: 13.2, z: 1 }, { x: 1, z: 10.2 }, { x: 7.1, z: 10.2 }];
  rooms.forEach((r, i) => {
    fillRect(ctx, t, r.x, r.z, 5.8, 6.4, '#fdf7ec'); strokeRect(ctx, t, r.x, r.z, 5.8, 6.4, WALL, 1.2);
    label(ctx, t.X(r.x + .2), t.Y(r.z + .3), `研 ${String(off + i).padStart(2, '0')}`, { size: 5.6, weight: 700, color: RESEARCH, bg: 'rgba(253,247,236,.9)' });
    for (let row = 0; row < 2; row++) {
      fillRect(ctx, t, r.x + .35, r.z + 1.2 + row * 1.5, 5.1, .3, '#c9b18a');
      fillRect(ctx, t, r.x + .35, r.z + 2 + row * 1.5, 5.1, .3, '#c9b18a');
    }
  });
  fillRect(ctx, t, 13.2, 10.2, 2.8, 6.4, '#eef2ef'); strokeRect(ctx, t, 13.2, 10.2, 2.8, 6.4, WALL, 1);
  label(ctx, t.X(13.4), t.Y(10.6), level === 1 ? '准备室' : '储藏', { size: 5, weight: 700, color: '#4f6f69' });
  if (level === 1) { wc(ctx, t, 16.2, 10.2, 2.8, 6.4); label(ctx, t.X(17.6), t.Y(16.2), '卫生间', { size: 4.8, weight: 700, color: '#4f6f69', align: 'center' }); }
  else { fillRect(ctx, t, 16.2, 10.2, 2.8, 6.4, '#eee5d6'); strokeRect(ctx, t, 16.2, 10.2, 2.8, 6.4, WALL, 1); for (let i = 0; i < 3; i++) fillRect(ctx, t, 16.4, 11 + i * 1.2, 2.3, .3, '#b9a688'); }
  for (const x of [3.8, 10, 16]) door(ctx, t, x, 7.6, .7, 'h', 1);
  for (const x of [3.8, 10]) door(ctx, t, x, 9.8, .7, 'h', -1);
  stairs(ctx, t, 17, 7.8, 2, 1.8, level === 1 ? 'up' : 'down');
  windowMark(ctx, t, 1.4, 0, 4, true); windowMark(ctx, t, 7.5, 0, 4, true); windowMark(ctx, t, 13.6, 0, 4, true);
  footer(ctx, t, width, height);
}

/* ---------------- Closed 20 × 18 ---------------- */
function drawClosed(level) {
  const { ctx, width, height, t } = shell(document.getElementById(level === 1 ? 'closed1f' : 'closed2f'), '未开放区', `${level}F`, 20, 18, '20 × 18 m');
  fillRect(ctx, t, .3, .3, 19.4, 17.4, '#ece4d7'); hatch(ctx, t, .3, .3, 19.4, 17.4, '#b6ac9c', 10);
  strokeRect(ctx, t, 0, 0, 20, 18, WALL, 3.5);
  label(ctx, t.X(10), t.Y(8.2), '未开放', { size: 16, weight: 700, color: CLOSED, align: 'center', bg: 'rgba(247,240,228,.9)' });
  label(ctx, t.X(10), t.Y(9), '不制作 · 封堵门洞', { size: 6.2, weight: 500, color: MUTED, align: 'center', bg: 'rgba(247,240,228,.85)' });
  footer(ctx, t, width, height);
}

/* ---------------- Hall 3F ---------------- */
function drawHall3F() {
  const { ctx, width, height } = initCanvas(document.getElementById('hall3f'));
  paper(ctx, width, height); grid(ctx, width, height, 24);
  label(ctx, 34, 22, '3F · 中央礼堂 + 环形走廊', { size: 12, weight: 700, color: HALL });
  label(ctx, width - 34, 22, '36 × 26 m · 四角 4 部客梯', { size: 8, weight: 500, color: MUTED, align: 'right' });
  const t = makeTransform(width, height, 36, 26, 42, 10);
  fillRect(ctx, t, 0, 0, 36, 26, '#efe5d4'); strokeRect(ctx, t, 0, 0, 36, 26, WALL, 3.2);
  fillRect(ctx, t, 4, 4, 28, 18, '#fdf7ec'); strokeRect(ctx, t, 4, 4, 28, 18, HALL, 2.2);
  label(ctx, t.X(18), t.Y(2), '环形走廊', { size: 7, weight: 700, color: MUTED, align: 'center', bg: 'rgba(239,229,212,.9)' });
  label(ctx, t.X(18), t.Y(24), '环形走廊', { size: 7, weight: 700, color: MUTED, align: 'center', bg: 'rgba(239,229,212,.9)' });

  fillRect(ctx, t, 4.5, 4.5, 27, 4, 'rgba(164,50,63,.18)'); strokeRect(ctx, t, 4.5, 4.5, 27, 4, HALL, 1.4);
  label(ctx, t.X(18), t.Y(6.5), '舞台', { size: 12, weight: 700, color: HALL, align: 'center' });
  for (let row = 0; row < 6; row++) for (let col = 0; col < 8; col++) {
    if (col === 3 || col === 4) continue;
    fillRect(ctx, t, 6.2 + col * 3, 9.4 + row * 1.6, 1.6, .55, row % 2 ? '#d8c4b0' : '#cdb69f');
  }
  label(ctx, t.X(18), t.Y(20), '座席 / 门厅', { size: 6.5, weight: 600, color: MUTED, align: 'center' });
  wc(ctx, t, 27.8, 18.2, 3.2, 2.8);
  label(ctx, t.X(29.4), t.Y(21.3), '卫生间', { size: 5.2, weight: 700, color: '#4f6f69', align: 'center', bg: 'rgba(253,247,236,.85)' });

  const cs = [{ id: 'EL-1', x: .6, z: .6 }, { id: 'EL-2', x: 31.4, z: .6 }, { id: 'EL-3', x: .6, z: 21.4 }, { id: 'EL-4', x: 31.4, z: 21.4 }];
  for (const c of cs) {
    elevator(ctx, t, c.x, c.z, 4, 4, c.id);
    label(ctx, t.X(c.x + 2), t.Y(c.z + 4.5), `${c.id} 出口`, { size: 5, weight: 700, color: ACCENT, align: 'center', bg: 'rgba(239,229,212,.9)' });
    const sx = c.x < 18 ? c.x + 4.2 : c.x - 3;
    stairs(ctx, t, sx, c.z, 2.8, 4, c.z < 13 ? 'down' : 'up');
  }
  door(ctx, t, 18, 4, 2.4, 'h', 1); door(ctx, t, 18, 22, 2.4, 'h', -1);
  door(ctx, t, 4, 13, 2, 'v', -1); door(ctx, t, 32, 13, 2, 'v', 1);
  label(ctx, t.X(18), t.Y(12.3), '中央礼堂', { size: 16, weight: 700, color: HALL, align: 'center', bg: 'rgba(253,247,236,.9)' });
  label(ctx, t.X(18), t.Y(13.1), '环廊四角：4 部客梯 + 楼梯间', { size: 7, weight: 500, color: MUTED, align: 'center', bg: 'rgba(253,247,236,.8)' });
  north(ctx, width - 42, 62, .65); scaleBar(ctx, t, 42, height - 22, 3, 5);
}

/* ---------------- Overall ---------------- */
function drawOverall() {
  const { ctx, width, height } = initCanvas(document.getElementById('overviewCanvas'));
  paper(ctx, width, height); grid(ctx, width, height, 26);
  label(ctx, 58, 30, "HOPE'S PEAK · SPECIAL SCHOOL", { size: 8, weight: 600, color: MUTED });
  label(ctx, 58, 58, '整体骨架 / 四翼贴主走廊 + 3F 礼堂环廊', { size: 20, weight: 500 });
  label(ctx, 58, 80, '房间互相接触；仅保留主走廊；3F 环廊四角 4 部客梯', { size: 8, weight: 500, color: MUTED });

  const t = makeTransform(width, height, 78, 44, 58, 30);
  fillRect(ctx, t, 2, 2, 52, 20, '#fbf4e7');
  fillRect(ctx, t, 58, 2, 20, 20, '#fbf4e7');
  fillRect(ctx, t, 2, 26, 52, 18, '#fbf4e7');
  fillRect(ctx, t, 58, 26, 20, 18, '#fbf4e7');

  fillRect(ctx, t, 54, 2, 4, 42, CORRIDOR);
  fillRect(ctx, t, 2, 22, 76, 4, CORRIDOR);
  label(ctx, t.X(56), t.Y(7), '主走廊', { size: 6, weight: 700, color: MUTED, align: 'center', bg: 'rgba(233,222,203,.9)' });
  label(ctx, t.X(56), t.Y(38), '主走廊', { size: 6, weight: 700, color: MUTED, align: 'center', bg: 'rgba(233,222,203,.9)' });

  fillRect(ctx, t, 20, 8, 36, 26, 'rgba(164,50,63,.04)');
  strokeRect(ctx, t, 20, 8, 36, 26, HALL, 2.2, [10, 7]);
  strokeRect(ctx, t, 24, 12, 28, 18, HALL, 1.1, [6, 5]);
  label(ctx, t.X(38), t.Y(7.1), '3F 礼堂 + 环形走廊', { size: 7, weight: 700, color: HALL, align: 'center', bg: PAPER });

  const cs = [{ id: 'EL-1', x: 20.4, z: 8.4 }, { id: 'EL-2', x: 51.6, z: 8.4 }, { id: 'EL-3', x: 20.4, z: 29.6 }, { id: 'EL-4', x: 51.6, z: 29.6 }];
  for (const c of cs) {
    elevator(ctx, t, c.x, c.z, 4, 4, c.id);
    label(ctx, t.X(c.x + 2), t.Y(c.z + 4.5), c.id, { size: 5, weight: 700, color: ACCENT, align: 'center', bg: PAPER });
  }

  hatch(ctx, t, 58, 2, 20, 20, '#b6ac9c', 10);
  strokeRect(ctx, t, 2, 2, 52, 20, WALL, 2.4);
  strokeRect(ctx, t, 58, 2, 20, 20, WALL, 2.4);
  strokeRect(ctx, t, 2, 26, 52, 18, WALL, 2.4);
  strokeRect(ctx, t, 58, 26, 20, 18, WALL, 2.4);
  strokeRect(ctx, t, 0, 0, 78, 44, WALL, 4);

  door(ctx, t, 54, 7, 1.2, 'v', -1); door(ctx, t, 54, 15, 1.2, 'v', 1);
  door(ctx, t, 54, 34, 1.2, 'v', 1); door(ctx, t, 58, 34, 1.2, 'v', -1);
  door(ctx, t, 20, 22, 1.3, 'h', 1); door(ctx, t, 44, 22, 1.3, 'h', 1);
  door(ctx, t, 20, 26, 1.3, 'h', -1); door(ctx, t, 44, 26, 1.3, 'h', -1);

  roomLabel(ctx, t.X(3), t.Y(4), '生活区', '1F 餐厅/后厨/医务/洗衣/杂物 · 2F 18 宿舍', DORM);
  roomLabel(ctx, t.X(59), t.Y(4), '未开放区', '1F/2F · 不制作', CLOSED);
  roomLabel(ctx, t.X(3), t.Y(28), '休憩区', '1F 运动/器材 · 2F 画室', REST);
  roomLabel(ctx, t.X(59), t.Y(28), '研究教室区', '10 间 · 2 层', RESEARCH);

  ctx.save(); ctx.strokeStyle = MUTED; ctx.fillStyle = MUTED; ctx.lineWidth = 1; ctx.font = `500 8px ${FONT}`;
  const topY = t.Y(0) - 14;
  ctx.beginPath(); ctx.moveTo(t.X(0), topY); ctx.lineTo(t.X(78), topY); ctx.stroke();
  ctx.fillText('78 m', t.X(38), topY - 5);
  const leftX = t.X(0) - 14;
  ctx.beginPath(); ctx.moveTo(leftX, t.Y(0)); ctx.lineTo(leftX, t.Y(44)); ctx.stroke();
  ctx.save(); ctx.translate(leftX - 5, t.Y(22)); ctx.rotate(-Math.PI / 2); ctx.fillText('44 m', 0, 0); ctx.restore();
  ctx.restore();
  north(ctx, width - 58, 108, 1); scaleBar(ctx, t, 58, height - 32, 4, 5);
}

/* ---------------- Section ---------------- */
function drawSection() {
  const { ctx, width, height } = initCanvas(document.getElementById('sectionCanvas'));
  paper(ctx, width, height); grid(ctx, width, height, 24);
  const ground = height - 38, l1 = ground - 40, l2 = l1 - 46, l3 = l2 - 52;
  rawLine(ctx, 40, ground, width - 40, ground, '#8f806b', 1.4);
  const slab = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); ctx.strokeStyle = WALL; ctx.lineWidth = 1.3; ctx.strokeRect(x, y, w, h); };
  slab(100, l1, 380, 40, '#fbf4e7'); slab(100, l2, 380, 46, '#fbf4e7');
  slab(730, l1, 380, 40, '#fbf4e7'); slab(730, l2, 380, 46, '#fbf4e7');
  label(ctx, 112, l1 + 20, '1F 生活 / 休憩 / 研究 / 未开放', { size: 7, weight: 600, color: MUTED });
  label(ctx, 112, l2 + 23, '2F 生活 / 休憩 / 研究 / 未开放', { size: 7, weight: 600, color: MUTED });
  label(ctx, 742, l1 + 20, '1F 翼楼', { size: 7, weight: 600, color: MUTED });
  label(ctx, 742, l2 + 23, '2F 翼楼', { size: 7, weight: 600, color: MUTED });

  slab(370, l3, 470, 52, 'rgba(164,50,63,.14)');
  ctx.strokeStyle = HALL; ctx.lineWidth = 2; ctx.strokeRect(370, l3, 470, 52);
  ctx.fillStyle = 'rgba(247,240,228,.8)'; ctx.fillRect(420, l3 + 8, 370, 36);
  label(ctx, 600, l3 + 20, '3F 中央礼堂', { size: 14, weight: 700, color: HALL, align: 'center' });
  label(ctx, 600, l3 + 37, '四周环形走廊 · 四角 4 部客梯', { size: 7, weight: 500, color: MUTED, align: 'center' });

  const sx = 470;
  ctx.save(); ctx.strokeStyle = ACCENT; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(sx, l2); ctx.lineTo(sx + 45, l2); ctx.lineTo(sx + 45, l2 - 22); ctx.lineTo(sx + 90, l2 - 22); ctx.lineTo(sx + 90, l3 + 52); ctx.lineTo(600, l3 + 52); ctx.stroke();
  for (let i = 0; i < 7; i++) rawLine(ctx, sx + 45 + i * 7, l2, sx + 45 + i * 7, l2 - 22, ACCENT, .8);
  ctx.restore();
  label(ctx, 520, l2 - 30, '大楼梯 → 3F 环廊', { size: 6.5, weight: 700, color: ACCENT, bg: PAPER });

  for (const x of [660, 700]) {
    ctx.save(); ctx.strokeStyle = WALL; ctx.lineWidth = 1.2; ctx.strokeRect(x, l3 + 52, 30, ground - (l3 + 52));
    ctx.fillStyle = 'rgba(226,211,188,.8)'; ctx.fillRect(x + 5, l2 + 10, 20, 24);
    ctx.fillStyle = ACCENT; ctx.font = `700 6px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('EL', x + 15, l2 + 26); ctx.restore();
  }
  label(ctx, 680, l3 + 44, 'EL ×4 每层停靠', { size: 6.5, weight: 700, color: ACCENT, align: 'center', bg: PAPER });
  label(ctx, 40, ground + 18, '±0.000 · 1F', { size: 7, weight: 500, color: MUTED });
  scaleBar(ctx, { W: v => v * 12 }, 980, height - 22, 2, 5);
}

function drawAll() {
  drawOverall(); drawSection();
  drawLife1F(); drawLife2F();
  drawRec1F(); drawRec2F();
  drawResearch(1); drawResearch(2);
  drawClosed(1); drawClosed(2);
  drawHall3F();
}

function downloadOverview() {
  const c = document.getElementById('overviewCanvas');
  const a = document.createElement('a'); a.download = 'special-school-overview.png'; a.href = c.toDataURL('image/png'); a.click();
}
document.getElementById('downloadOverview')?.addEventListener('click', downloadOverview);
document.getElementById('printPage')?.addEventListener('click', () => window.print());

/* Lightbox */
const lb = document.getElementById('lightbox'), stage = document.getElementById('lightboxStage');
const img = document.getElementById('lightboxImage'), title = document.getElementById('lightboxTitle'), zl = document.getElementById('zoomLevel');
let zoom = 1, panX = 0, panY = 0, dragging = false, start = null;
function apply() { if (!img) return; img.style.transform = `translate(${panX}px,${panY}px) scale(${zoom})`; if (zl) zl.textContent = `${Math.round(zoom * 100)}%`; }
function setZoom(v) { zoom = Math.max(.5, Math.min(5, v)); apply(); }
function reset() { zoom = 1; panX = 0; panY = 0; apply(); }
function openLB(c) {
  if (!lb || !img || !c) return;
  img.src = c.toDataURL('image/png'); img.alt = c.getAttribute('aria-label') || '图纸';
  if (title) title.textContent = c.getAttribute('aria-label') || '图纸';
  reset(); lb.hidden = false; lb.setAttribute('aria-hidden', 'false'); document.body.classList.add('lightbox-open');
  document.getElementById('lightboxClose')?.focus();
}
function closeLB() { if (!lb) return; lb.hidden = true; lb.setAttribute('aria-hidden', 'true'); document.body.classList.remove('lightbox-open'); dragging = false; stage?.classList.remove('is-dragging'); }
document.querySelectorAll('canvas').forEach(c => { c.title = '点击放大'; c.addEventListener('click', () => openLB(c)); });
document.getElementById('lightboxClose')?.addEventListener('click', closeLB);
document.getElementById('zoomIn')?.addEventListener('click', () => setZoom(zoom * 1.2));
document.getElementById('zoomOut')?.addEventListener('click', () => setZoom(zoom / 1.2));
document.getElementById('zoomReset')?.addEventListener('click', reset);
stage?.addEventListener('wheel', e => { e.preventDefault(); setZoom(zoom * (e.deltaY < 0 ? 1.12 : .9)); }, { passive: false });
stage?.addEventListener('pointerdown', e => { if (e.target !== img) return; dragging = true; start = { x: e.clientX - panX, y: e.clientY - panY }; stage.classList.add('is-dragging'); stage.setPointerCapture?.(e.pointerId); });
stage?.addEventListener('pointermove', e => { if (!dragging || !start) return; panX = e.clientX - start.x; panY = e.clientY - start.y; apply(); });
function endDrag() { dragging = false; start = null; stage?.classList.remove('is-dragging'); }
stage?.addEventListener('pointerup', endDrag); stage?.addEventListener('pointercancel', endDrag);
img?.addEventListener('dblclick', () => setZoom(zoom > 1.4 ? 1 : 2));
lb?.addEventListener('click', e => { if (e.target === stage) closeLB(); });
window.addEventListener('keydown', e => { if (!lb || lb.hidden) return; if (e.key === 'Escape') closeLB(); if (e.key === '+' || e.key === '=') setZoom(zoom * 1.2); if (e.key === '-') setZoom(zoom / 1.2); if (e.key === '0') reset(); });

drawAll();
