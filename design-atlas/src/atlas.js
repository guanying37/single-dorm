/* =====================================================================
 * SPECIAL SCHOOL · DESIGN ATLAS
 * Canvas 2D floor plans rebuilt from six hand sketches and the existing
 * 3D models. All geometry is metric. Plans are drawn at 1:150, the
 * section at 1:200, on an A2 landscape sheet.
 * ===================================================================== */

(() => {
  'use strict';

  /* ---------- sheet + palette ---------- */
  const W = 1800;
  const H = 1273;
  const MM = W / 594;                 // A2 landscape: 594 x 420 mm
  const PXM = (denom) => (1000 / denom) * MM;
  const S150 = PXM(150);
  const S200 = PXM(200);

  const PLAN = { x: 55, y: 118, w: 1265, h: 782 };
  const NOTES = { x: 55, y: 946, w: 1262, h: 270 };
  const TITLE = { x: 1335, y: 946, w: 430, h: 270 };

  const C = {
    paper: '#f6efe3',
    paper2: '#fbf6ec',
    paper3: '#ece2d1',
    ink: '#2a261f',
    ink2: '#4d4539',
    muted: '#7c7060',
    faint: '#a39784',
    wall: '#36312a',
    line: 'rgba(62,52,39,.30)',
    lineSoft: 'rgba(62,52,39,.14)',
    grid: 'rgba(62,52,39,.045)',
    grid5: 'rgba(62,52,39,.075)',
    red: '#a4323f',
    red2: '#c15a63',
    redSoft: 'rgba(164,50,63,.12)',
    gold: '#a67c3d',
    goldSoft: 'rgba(166,124,61,.13)',
    blue: '#4f6f78',
    blueSoft: '#dfeaec',
    green: '#657a5f',
    greenSoft: '#e8eee2',
    water: '#cfe4ea',
    tan: '#e9dec9',
    tan2: '#ddcdb3',
    rose: '#f1dfd9',
    rose2: '#e6c9c2',
    dorm: '#fbf5e9',
    service: '#f0e6d5',
    wet: '#e4efec',
    public: '#f4ecdd',
    dark: '#211e19',
  };

  const FONT = '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", "Segoe UI", sans-serif';
  const MONO = '"Cascadia Mono", "SFMono-Regular", Consolas, monospace';

  /* ---------- tiny helpers ---------- */
  const n = (v) => Number(v.toFixed(2));
  const fmt = (v, d = 2) => Number(v).toFixed(d);
  const area = (w, h) => w * h;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function rr(ctx, x, y, w, h, r = 0) {
    const k = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + k, y);
    ctx.arcTo(x + w, y, x + w, y + h, k);
    ctx.arcTo(x + w, y + h, x, y + h, k);
    ctx.arcTo(x, y + h, x, y, k);
    ctx.arcTo(x, y, x + w, y, k);
    ctx.closePath();
  }

  function line(ctx, x1, y1, x2, y2, color = C.ink, width = 1, dash = null) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function rect(ctx, x, y, w, h, fill = null, stroke = null, lw = 1, dash = null, r = 0) {
    ctx.save();
    if (fill) {
      ctx.fillStyle = fill;
      if (r) { rr(ctx, x, y, w, h, r); ctx.fill(); } else ctx.fillRect(x, y, w, h);
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw;
      if (dash) ctx.setLineDash(dash);
      if (r) { rr(ctx, x, y, w, h, r); ctx.stroke(); } else ctx.strokeRect(x, y, w, h);
    }
    ctx.restore();
  }

  function text(ctx, str, x, y, o = {}) {
    const size = o.size ?? 11;
    const weight = o.weight ?? 400;
    const color = o.color ?? C.ink;
    const align = o.align ?? 'left';
    const base = o.base ?? 'middle';
    ctx.save();
    ctx.font = `${weight} ${size}px ${o.mono ? MONO : FONT}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = base;
    if (o.bg) {
      const m = ctx.measureText(str).width;
      let bx = x - 3;
      if (align === 'center') bx = x - m / 2 - 3;
      if (align === 'right') bx = x - m - 3;
      ctx.fillStyle = o.bg;
      ctx.fillRect(bx, y - size * .72, m + 6, size * 1.35);
      ctx.fillStyle = color;
    }
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  function wrap(ctx, str, x, y, maxW, lineH, o = {}) {
    const size = o.size ?? 10;
    const weight = o.weight ?? 400;
    const color = o.color ?? C.ink2;
    ctx.save();
    ctx.font = `${weight} ${size}px ${o.mono ? MONO : FONT}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const chars = [...str];
    let line = '';
    let yy = y;
    for (let i = 0; i < chars.length; i++) {
      const test = line + chars[i];
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, yy);
        line = chars[i];
        yy += lineH;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, yy);
    ctx.restore();
    return yy + lineH;
  }

  /* ---------- canvas ---------- */
  function prepare(canvas) {
    const forced = window.__ATLAS_FORCE_SCALE__;
    const dpr = forced || (window.__ATLAS_EXPORT__ ? 1 : Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.aspectRatio = `${W} / ${H}`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function paper(ctx) {
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, W, H);

    // Very light drafting grid.
    ctx.save();
    ctx.strokeStyle = 'rgba(62,52,39,.028)';
    ctx.lineWidth = .6;
    for (let x = 0; x < W; x += 22) {
      ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 22) {
      ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); ctx.stroke();
    }
    ctx.restore();

    // Vignette / paper warmth.
    const g = ctx.createRadialGradient(W * .22, H * .1, 40, W * .45, H * .42, W * .9);
    g.addColorStop(0, 'rgba(255,252,245,.38)');
    g.addColorStop(.55, 'rgba(255,252,245,.04)');
    g.addColorStop(1, 'rgba(96,78,56,.055)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function frame(ctx, meta) {
    // Double sheet border.
    ctx.save();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.35;
    ctx.strokeRect(18.5, 18.5, W - 37, H - 37);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = .7;
    ctx.strokeRect(27.5, 27.5, W - 55, H - 55);
    ctx.restore();

    // Corner registration ticks.
    ctx.save();
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 1.2;
    const k = 10;
    for (const [x, y, sx, sy] of [[28, 28, 1, 1], [W - 28, 28, -1, 1], [28, H - 28, 1, -1], [W - 28, H - 28, -1, -1]]) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sx * k, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + sy * k); ctx.stroke();
    }
    ctx.restore();

    // Sheet badge.
    rect(ctx, 50, 36, 60, 60, C.red);
    text(ctx, meta.num, 80, 62, { size: 17, weight: 700, color: C.paper2, align: 'center', mono: true });
    text(ctx, meta.level || 'PLAN', 80, 81, { size: 7, weight: 600, color: 'rgba(251,246,236,.8)', align: 'center', mono: true });

    text(ctx, meta.title, 126, 53, { size: 27, weight: 500, color: C.ink });
    text(ctx, meta.subtitle, 128, 80, { size: 10, weight: 500, color: C.muted });

    text(ctx, `出图比例 ${meta.scale} · 单位 m · 北向上`, 1746, 50, { size: 9, weight: 500, color: C.muted, align: 'right', mono: true });
    text(ctx, meta.rev || 'REV A · 2026.11.20', 1746, 70, { size: 9, weight: 500, color: C.muted, align: 'right', mono: true });
    text(ctx, 'SPECIAL SCHOOL / DESIGN ATLAS', 1746, 88, { size: 7.5, weight: 600, color: C.faint, align: 'right', mono: true });

    line(ctx, 50, 106, 1746, 106, C.ink, 1.1);
    line(ctx, 50, 110, 1746, 110, C.line, .6);
  }

  /* ---------- title block, notes, legend ---------- */
  function titleBlock(ctx, meta) {
    const { x, y, w, h } = TITLE;
    rect(ctx, x, y, w, h, 'rgba(251,246,236,.58)', C.ink, 1);
    rect(ctx, x + 6, y + 6, w - 12, h - 12, null, C.line, .6);

    text(ctx, 'PROJECT', x + 16, y + 25, { size: 7, weight: 700, color: C.red, mono: true });
    text(ctx, '特殊学园 · 方案设计图集', x + 16, y + 43, { size: 13, weight: 600, color: C.ink });
    text(ctx, "HOPE'S PEAK SPECIAL SCHOOL", x + 16, y + 58, { size: 7, weight: 500, color: C.muted, mono: true });

    line(ctx, x + 14, y + 70, x + w - 14, y + 70, C.line, .7);

    const rows = [
      ['图号', meta.num],
      ['图名', meta.title],
      ['比例', meta.scale],
      ['日期', '2026.11.20'],
      ['绘制', 'ATLAS / DSH'],
      ['复核', 'SELF-CHECK'],
    ];
    let yy = y + 86;
    for (const [k, v] of rows) {
      text(ctx, k, x + 16, yy, { size: 7.2, weight: 500, color: C.muted, mono: true });
      text(ctx, v, x + 62, yy, { size: 9.2, weight: 600, color: C.ink });
      line(ctx, x + 14, yy + 9, x + w - 14, yy + 9, C.lineSoft, .5);
      yy += 21;
    }

    text(ctx, '依据：手绘草图 1–6 + 已建 3D 模型', x + 16, y + 219, { size: 7.2, weight: 500, color: C.muted });
    text(ctx, '尺寸单位 m；面积 ㎡；未注门宽见说明。', x + 16, y + 233, { size: 7.2, weight: 500, color: C.muted });

    // Revision stamp.
    ctx.save();
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 1.3;
    ctx.strokeRect(x + w - 92, y + 198, 76, 38);
    ctx.globalAlpha = .12;
    ctx.fillStyle = C.red;
    ctx.fillRect(x + w - 92, y + 198, 76, 38);
    ctx.restore();
    text(ctx, 'REV A', x + w - 54, y + 211, { size: 9, weight: 700, color: C.red, align: 'center', mono: true });
    text(ctx, '已自检', x + w - 54, y + 226, { size: 7, weight: 600, color: C.red, align: 'center' });
  }

  function legend(ctx, x, y) {
    const items = [
      ['wall', '外墙 / 内墙'],
      ['door', '门（90°开启）'],
      ['window', '窗'],
      ['stair', '楼梯（箭头向下/上）'],
      ['lift', '电梯'],
      ['existing', '已建 3D 模型'],
      ['new', '本次补齐'],
      ['section', '剖切符号'],
    ];
    items.forEach(([kind, label], i) => {
      const xx = x + (i % 4) * 305;
      const yy = y + Math.floor(i / 4) * 25;
      drawLegendSymbol(ctx, xx, yy, kind);
      text(ctx, label, xx + 29, yy + 1, { size: 8.0, weight: 500, color: C.muted });
    });
  }

  function drawLegendSymbol(ctx, x, y, kind) {
    ctx.save();
    if (kind === 'wall') {
      ctx.fillStyle = C.wall; ctx.fillRect(x, y - 5, 18, 5);
      ctx.fillStyle = C.paper3; ctx.fillRect(x, y - 1, 18, 2);
    } else if (kind === 'door') {
      ctx.strokeStyle = C.red; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x + 3, y, 11, 0, Math.PI / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 3, y); ctx.lineTo(x + 3, y + 11); ctx.stroke();
      ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 18, y); ctx.stroke();
    } else if (kind === 'window') {
      ctx.strokeStyle = C.blue; ctx.lineWidth = 1;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x, y + i * 2); ctx.lineTo(x + 18, y + i * 2); ctx.stroke(); }
    } else if (kind === 'stair') {
      ctx.strokeStyle = C.ink; ctx.lineWidth = .8;
      ctx.strokeRect(x, y - 6, 18, 12);
      for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x + i * 3.6, y - 6); ctx.lineTo(x + i * 3.6, y + 6); ctx.stroke(); }
    } else if (kind === 'lift') {
      ctx.strokeStyle = C.ink; ctx.lineWidth = .8; ctx.strokeRect(x, y - 6, 18, 12);
      ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x + 18, y + 6); ctx.moveTo(x + 18, y - 6); ctx.lineTo(x, y + 6); ctx.stroke();
    } else if (kind === 'existing') {
      ctx.strokeStyle = C.gold; ctx.setLineDash([3, 2]); ctx.lineWidth = 1.1; ctx.strokeRect(x, y - 5, 18, 10);
    } else if (kind === 'new') {
      ctx.strokeStyle = C.red; ctx.setLineDash([2, 2]); ctx.lineWidth = 1.1; ctx.strokeRect(x, y - 5, 18, 10);
    } else if (kind === 'section') {
      ctx.strokeStyle = C.red; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 18, y); ctx.stroke();
      ctx.fillStyle = C.red;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 5, y - 3); ctx.lineTo(x + 5, y + 3); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + 18, y); ctx.lineTo(x + 13, y - 3); ctx.lineTo(x + 13, y + 3); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function notesPanel(ctx, meta) {
    const { x, y, w, h } = NOTES;
    rect(ctx, x, y, w, h, 'rgba(251,246,236,.45)', C.line, .8);
    text(ctx, '设计校核 / DESIGN CHECK', x + 15, y + 17, { size: 8.0, weight: 700, color: C.red, mono: true });
    text(ctx, '每一条都对应图中的真实修改', x + w - 15, y + 17, { size: 7.4, weight: 500, color: C.faint, align: 'right' });
    line(ctx, x + 14, y + 27, x + w - 14, y + 27, C.lineSoft, .6);

    const cols = [
      { x: x + 15, w: 590 },
      { x: x + 640, w: 600 },
    ];
    const half = Math.ceil(meta.notes.length / 2);
    meta.notes.forEach((item, i) => {
      const col = cols[i < half ? 0 : 1];
      const row = i % half;
      const yy = y + 45 + row * 36;
      ctx.save();
      ctx.fillStyle = C.red;
      ctx.beginPath();
      ctx.arc(col.x + 3, yy - 2, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      text(ctx, item[0], col.x + 12, yy - 2, { size: 8.1, weight: 700, color: C.ink });
      wrap(ctx, item[1], col.x + 12, yy + 11, col.w - 15, 11.6, { size: 7.2, weight: 400, color: C.muted });
    });

    line(ctx, x + 14, y + 194, x + w - 14, y + 194, C.lineSoft, .6);
    legend(ctx, x + 15, y + 210);
    if (meta.stats) {
      text(ctx, meta.stats, x + 15, y + 257, { size: 7.3, weight: 500, color: C.muted });
    }
  }

  /* ---------- plan transform ---------- */
  function planT(mw, mh, denom = 150) {
    const s = PXM(denom);
    const ox = PLAN.x + (PLAN.w - mw * s) / 2;
    const oy = PLAN.y + (PLAN.h - mh * s) / 2;
    return {
      s,
      ox,
      oy,
      X: (x) => ox + x * s,
      Y: (y) => oy + y * s,
      W: (v) => v * s,
      denom,
      mw,
      mh,
    };
  }

  function pxRect(ctx, t, x, y, w, h, fill, stroke, lw = 0, dash = null) {
    const X = t.X(x);
    const Y = t.Y(y);
    const Wp = t.W(w);
    const Hp = t.W(h);
    rect(ctx, X, Y, Wp, Hp, fill, stroke, lw, dash);
  }

  function meterGrid(ctx, t, mw, mh) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(t.X(0), t.Y(0), t.W(mw), t.W(mh));
    ctx.clip();
    for (let x = 0; x <= mw; x += 1) {
      ctx.strokeStyle = (x % 5 === 0) ? C.grid5 : C.grid;
      ctx.lineWidth = (x % 5 === 0) ? .8 : .45;
      ctx.beginPath(); ctx.moveTo(t.X(x), t.Y(0)); ctx.lineTo(t.X(x), t.Y(mh)); ctx.stroke();
    }
    for (let y = 0; y <= mh; y += 1) {
      ctx.strokeStyle = (y % 5 === 0) ? C.grid5 : C.grid;
      ctx.lineWidth = (y % 5 === 0) ? .8 : .45;
      ctx.beginPath(); ctx.moveTo(t.X(0), t.Y(y)); ctx.lineTo(t.X(mw), t.Y(y)); ctx.stroke();
    }
    ctx.restore();
  }

  /* ---------- walls / openings ---------- */
  function wallSet(ctx, t) {
    const segs = [];
    const opens = [];

    const h = (x1, x2, y, th = .30) => segs.push({ x: Math.min(x1, x2), y: y - th / 2, w: Math.abs(x2 - x1), h: th });
    const v = (x, y1, y2, th = .30) => segs.push({ x: x - th / 2, y: Math.min(y1, y2), w: th, h: Math.abs(y2 - y1) });

    const cutH = (x, w, y, th) => opens.push({ kind: 'cutH', x, w, y, th });
    const cutV = (x, y, d, th) => opens.push({ kind: 'cutV', x, y, d, th });

    function doorH(x, y, w, o = {}) {
      const th = o.th ?? .12;
      cutH(x, w, y, th);
      opens.push({ kind: 'doorH', x, w, y, th, hinge: o.hinge || 'left', swing: o.swing ?? 1, double: !!o.double, color: o.color || C.red });
    }
    function doorV(x, y, d, o = {}) {
      const th = o.th ?? .12;
      cutV(x, y, d, th);
      opens.push({ kind: 'doorV', x, y, d, th, hinge: o.hinge || 'top', swing: o.swing ?? 1, double: !!o.double, color: o.color || C.red });
    }
    function windowH(x, y, w, o = {}) {
      const th = o.th ?? .30;
      cutH(x, w, y, th);
      opens.push({ kind: 'windowH', x, w, y, th, color: o.color || C.blue });
    }
    function windowV(x, y, d, o = {}) {
      const th = o.th ?? .30;
      cutV(x, y, d, th);
      opens.push({ kind: 'windowV', x, y, d, th, color: o.color || C.blue });
    }
    function arcH(x, y, w, hinge, swing, color) {
      const r = t.W(w);
      const hy = t.Y(y);
      const hx = hinge === 'left' ? t.X(x) : t.X(x + w);
      let a0, a1;
      if (hinge === 'left') {
        a0 = swing > 0 ? 0 : -Math.PI / 2;
        a1 = swing > 0 ? Math.PI / 2 : 0;
      } else {
        a0 = swing > 0 ? Math.PI / 2 : Math.PI;
        a1 = swing > 0 ? Math.PI : Math.PI * 1.5;
      }
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      ctx.arc(hx, hy, r, a0, a1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + r * Math.cos(a1), hy + r * Math.sin(a1));
      ctx.stroke();
      // hinge dot
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(hx, hy, 1.4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    function arcV(x, y, d, hinge, swing, color) {
      const r = t.W(d);
      const hx = t.X(x);
      const hy = hinge === 'top' ? t.Y(y) : t.Y(y + d);
      let a0, a1;
      if (hinge === 'top') {
        a0 = swing > 0 ? 0 : Math.PI / 2;
        a1 = swing > 0 ? Math.PI / 2 : Math.PI;
        // closed along +y; open toward +x (east) or -x (west)
        if (swing > 0) { a0 = 0; a1 = Math.PI / 2; } else { a0 = Math.PI / 2; a1 = Math.PI; }
      } else {
        if (swing > 0) { a0 = -Math.PI / 2; a1 = 0; } else { a0 = Math.PI; a1 = Math.PI * 1.5; }
      }
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      ctx.arc(hx, hy, r, a0, a1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + r * Math.cos(a1), hy + r * Math.sin(a1));
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(hx, hy, 1.4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    function drawOpen(o) {
      if (o.kind === 'cutH' || o.kind === 'windowH') {
        ctx.fillStyle = C.paper;
        ctx.fillRect(t.X(o.x), t.Y(o.y) - t.W(o.th) / 2 - .5, t.W(o.w), t.W(o.th) + 1);
        if (o.kind === 'windowH') {
          ctx.save();
          ctx.strokeStyle = o.color;
          ctx.lineWidth = .95;
          for (const off of [-.06, 0, .06]) {
            line(ctx, t.X(o.x), t.Y(o.y + off), t.X(o.x + o.w), t.Y(o.y + off), o.color, off === 0 ? 1.25 : .7);
          }
          for (const xx of [o.x, o.x + o.w]) {
            line(ctx, t.X(xx), t.Y(o.y - .12), t.X(xx), t.Y(o.y + .12), o.color, .7);
          }
          ctx.restore();
        }
      } else if (o.kind === 'cutV' || o.kind === 'windowV') {
        ctx.fillStyle = C.paper;
        ctx.fillRect(t.X(o.x) - t.W(o.th) / 2 - .5, t.Y(o.y), t.W(o.th) + 1, t.W(o.d));
        if (o.kind === 'windowV') {
          for (const off of [-.06, 0, .06]) {
            line(ctx, t.X(o.x + off), t.Y(o.y), t.X(o.x + off), t.Y(o.y + o.d), o.color, off === 0 ? 1.25 : .7);
          }
          for (const yy of [o.y, o.y + o.d]) {
            line(ctx, t.X(o.x - .12), t.Y(yy), t.X(o.x + .12), t.Y(yy), o.color, .7);
          }
        }
      } else if (o.kind === 'doorH') {
        if (o.double) {
          const half = o.w / 2;
          arcH(o.x, o.y, half, 'left', o.swing, o.color);
          arcH(o.x + half, o.y, half, 'right', o.swing, o.color);
        } else {
          arcH(o.x, o.y, o.w, o.hinge, o.swing, o.color);
        }
      } else if (o.kind === 'doorV') {
        if (o.double) {
          const half = o.d / 2;
          arcV(o.x, o.y, half, 'top', o.swing, o.color);
          arcV(o.x, o.y + half, half, 'bottom', o.swing, o.color);
        } else {
          arcV(o.x, o.y, o.d, o.hinge, o.swing, o.color);
        }
      }
    }

    function draw() {
      ctx.save();
      ctx.fillStyle = C.wall;
      for (const s of segs) ctx.fillRect(t.X(s.x), t.Y(s.y), t.W(s.w), Math.max(1.1, t.W(s.h)));
      ctx.restore();
      for (const o of opens) drawOpen(o);
    }

    return { h, v, doorH, doorV, windowH, windowV, draw };
  }

  /* ---------- room labels ---------- */
  function badge(ctx, x, y, letter, o = {}) {
    const s = o.size ?? 20;
    const color = o.color || C.red;
    ctx.save();
    ctx.fillStyle = C.paper2;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.15;
    rr(ctx, x, y, s, s, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = `700 ${s * .52}px ${MONO}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, x + s / 2, y + s / 2 + .5);
    ctx.restore();
  }

  function roomTag(ctx, t, room) {
    const { x, y, w, h, letter, name, sub, color = C.ink, compact = false, noArea = false, align = 'left', badgeColor = C.red } = room;
    const X = t.X(x);
    const Y = t.Y(y);
    const Wp = t.W(w);
    const Hp = t.W(h);
    if (compact || Wp < 92 || Hp < 68) {
      const bx = align === 'center' ? X + Wp / 2 - 8 : X + 6;
      const by = Y + 6;
      badge(ctx, bx, by, letter, { size: 16, color: badgeColor });
      text(ctx, name, bx + 21, by + 7, { size: 8.8, weight: 700, color, bg: C.paper2 });
      if (!noArea) text(ctx, `${fmt(area(w, h), 1)} ㎡`, bx + 21, by + 19, { size: 6.7, weight: 500, color: C.muted, mono: true, bg: C.paper2 });
      return;
    }
    const bx = X + 9;
    const by = Y + 9;
    badge(ctx, bx, by, letter, { size: 18, color: badgeColor });
    text(ctx, name, bx + 24, by + 7, { size: 11.5, weight: 700, color, bg: C.paper2 });
    if (sub) text(ctx, sub, bx + 24, by + 21, { size: 7.2, weight: 500, color: C.muted, bg: C.paper2 });
    if (!noArea) {
      const areaY = by + (sub ? 32 : 22);
      text(ctx, `${fmt(area(w, h), 1)} ㎡`, bx + 24, areaY, { size: 7.0, weight: 500, color: C.muted, mono: true, bg: C.paper2 });
    }
  }

  function smallLabel(ctx, t, x, y, str, o = {}) {
    text(ctx, str, t.X(x), t.Y(y), {
      size: o.size ?? 6.8,
      weight: o.weight ?? 600,
      color: o.color ?? C.muted,
      align: o.align ?? 'left',
      bg: o.bg === false ? null : C.paper2,
    });
  }

  /* ---------- dimensions / north / scale ---------- */
  function tick(ctx, x, y, vertical = false) {
    ctx.save();
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = .8;
    ctx.beginPath();
    if (vertical) { ctx.moveTo(x - 3, y + 3); ctx.lineTo(x + 3, y - 3); }
    else { ctx.moveTo(x - 3, y + 3); ctx.lineTo(x + 3, y - 3); }
    ctx.stroke();
    ctx.restore();
  }

  function dimH(ctx, t, x1, x2, y, label, o = {}) {
    const yy = t.Y(y);
    const a = t.X(x1);
    const b = t.X(x2);
    const color = o.color || C.muted;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = .65;
    ctx.beginPath(); ctx.moveTo(a, yy); ctx.lineTo(b, yy); ctx.stroke();
    tick(ctx, a, yy); tick(ctx, b, yy);
    // extension ticks
    if (o.ext !== false) {
      ctx.setLineDash([2, 2]);
      ctx.globalAlpha = .5;
      ctx.beginPath(); ctx.moveTo(a, yy - 7); ctx.lineTo(a, yy + 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(b, yy - 7); ctx.lineTo(b, yy + 7); ctx.stroke();
    }
    ctx.restore();
    text(ctx, label, (a + b) / 2, yy - 8, { size: o.size ?? 7.6, weight: 600, color, align: 'center', mono: true, bg: C.paper });
  }

  function dimV(ctx, t, y1, y2, x, label, o = {}) {
    const xx = t.X(x);
    const a = t.Y(y1);
    const b = t.Y(y2);
    const color = o.color || C.muted;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = .65;
    ctx.beginPath(); ctx.moveTo(xx, a); ctx.lineTo(xx, b); ctx.stroke();
    tick(ctx, xx, a, true); tick(ctx, xx, b, true);
    ctx.restore();
    ctx.save();
    ctx.translate(xx - 8, (a + b) / 2);
    ctx.rotate(-Math.PI / 2);
    text(ctx, label, 0, 0, { size: o.size ?? 7.6, weight: 600, color, align: 'center', mono: true, bg: C.paper });
    ctx.restore();
  }

  function north(ctx, x, y, s = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = C.ink;
    ctx.fillStyle = C.ink;
    ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.arc(0, 0, 17 * s, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -15 * s);
    ctx.lineTo(-5 * s, 10 * s);
    ctx.lineTo(0, 6 * s);
    ctx.closePath();
    ctx.fillStyle = C.red;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -15 * s);
    ctx.lineTo(5 * s, 10 * s);
    ctx.lineTo(0, 6 * s);
    ctx.closePath();
    ctx.fillStyle = C.ink;
    ctx.fill();
    text(ctx, 'N', 0, -26 * s, { size: 9 * s, weight: 700, color: C.ink, align: 'center', mono: true });
    ctx.restore();
  }

  function scaleBar(ctx, t, x, y, steps = 5, stepM = 5) {
    const len = t.W(steps * stepM);
    const seg = len / steps;
    ctx.save();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = .8;
    for (let i = 0; i < steps; i++) {
      ctx.fillStyle = i % 2 === 0 ? C.ink : C.paper2;
      ctx.fillRect(x + i * seg, y, seg, 5.5);
      ctx.strokeRect(x + i * seg, y, seg, 5.5);
    }
    ctx.fillStyle = C.muted;
    ctx.font = `500 6.8px ${MONO}`;
    ctx.textAlign = 'center';
    for (let i = 0; i <= steps; i++) {
      ctx.fillText(String(i * stepM), x + i * seg, y - 4);
    }
    ctx.textAlign = 'left';
    ctx.fillText('m', x + len + 6, y + 5);
    ctx.restore();
    text(ctx, `1:${t.denom}`, x, y + 17, { size: 7.2, weight: 600, color: C.muted, mono: true });
  }

  function sectionMarkH(ctx, t, y, label = 'A') {
    const yy = t.Y(y);
    ctx.save();
    ctx.strokeStyle = C.red;
    ctx.lineWidth = .9;
    ctx.setLineDash([8, 5]);
    ctx.beginPath(); ctx.moveTo(t.X(-1.2), yy); ctx.lineTo(t.X(t.mw + 1.2), yy); ctx.stroke();
    ctx.setLineDash([]);
    for (const x of [-1.2, t.mw + 1.2]) {
      ctx.fillStyle = C.red;
      ctx.beginPath(); ctx.arc(t.X(x), yy, 9, 0, Math.PI * 2); ctx.fill();
      text(ctx, label, t.X(x), yy + .5, { size: 7.5, weight: 700, color: C.paper2, align: 'center', mono: true });
    }
    ctx.restore();
  }

  function sectionMarkV(ctx, t, x, label = 'A') {
    const xx = t.X(x);
    ctx.save();
    ctx.strokeStyle = C.red;
    ctx.lineWidth = .9;
    ctx.setLineDash([8, 5]);
    ctx.beginPath(); ctx.moveTo(xx, t.Y(-1.2)); ctx.lineTo(xx, t.Y(t.mh + 1.2)); ctx.stroke();
    ctx.setLineDash([]);
    for (const y of [-1.2, t.mh + 1.2]) {
      ctx.fillStyle = C.red;
      ctx.beginPath(); ctx.arc(xx, t.Y(y), 9, 0, Math.PI * 2); ctx.fill();
      text(ctx, label, xx, t.Y(y) + .5, { size: 7.5, weight: 700, color: C.paper2, align: 'center', mono: true });
    }
    ctx.restore();
  }

  function hatchRect(ctx, t, x, y, w, h, color = 'rgba(124,112,96,.32)', spacing = 8) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(t.X(x), t.Y(y), t.W(w), t.W(h));
    ctx.clip();
    ctx.strokeStyle = color;
    ctx.lineWidth = .6;
    const px = t.X(x);
    const py = t.Y(y);
    const pw = t.W(w);
    const ph = t.W(h);
    for (let o = -ph; o < pw + ph; o += spacing) {
      ctx.beginPath();
      ctx.moveTo(px + o, py + ph);
      ctx.lineTo(px + o + ph, py);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ---------- furniture ---------- */
  function bed(ctx, t, x, y, o = {}) {
    const w = o.w ?? 1.0;
    const d = o.d ?? 2.0;
    pxRect(ctx, t, x, y, w, d, '#efe4d1', '#9c8566', .8);
    pxRect(ctx, t, x + .08, y + .08, w - .16, .34, '#fbf5e9', '#b8a58b', .6);
    line(ctx, t.X(x + .08), t.Y(y + d * .55), t.X(x + w - .08), t.Y(y + d * .55), '#c2b096', .7);
    line(ctx, t.X(x + .08), t.Y(y + d * .78), t.X(x + w - .08), t.Y(y + d * .78), '#d8c7af', .5);
  }

  function desk(ctx, t, x, y, w = .65, d = 1.15) {
    pxRect(ctx, t, x, y, w, d, '#c7a577', '#80653f', .7);
    pxRect(ctx, t, x + .08, y + .08, .28, .35, '#e7d7bd', null, 0);
  }

  function chair(ctx, t, x, y, r = .18) {
    ctx.save();
    ctx.fillStyle = '#a98657';
    ctx.strokeStyle = '#705432';
    ctx.lineWidth = .6;
    ctx.beginPath(); ctx.arc(t.X(x), t.Y(y), t.W(r), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function wardrobe(ctx, t, x, y, w = .6, d = 1.8) {
    pxRect(ctx, t, x, y, w, d, '#d9c6a9', '#8f7655', .7);
    line(ctx, t.X(x + w / 2), t.Y(y + .08), t.X(x + w / 2), t.Y(y + d - .08), '#8f7655', .5);
    for (const yy of [.4, .9, 1.4]) line(ctx, t.X(x + .1), t.Y(y + yy), t.X(x + w - .1), t.Y(y + yy), '#b39a78', .4);
  }

  function table(ctx, t, x, y, w = 1.8, d = 1.0, chairs = 6) {
    pxRect(ctx, t, x, y, w, d, '#c9ad84', '#7f633f', .8);
    if (chairs === 0) return;
    if (chairs >= 6) {
      for (const dx of [.3, w / 2, w - .3]) {
        chair(ctx, t, x + dx, y - .25, .16);
        chair(ctx, t, x + dx, y + d + .25, .16);
      }
    } else {
      for (const dx of [.35, w - .35]) {
        chair(ctx, t, x + dx, y - .25, .16);
        chair(ctx, t, x + dx, y + d + .25, .16);
      }
    }
  }

  function bench(ctx, t, x, y, w = 2.4, d = .45) {
    pxRect(ctx, t, x, y, w, d, '#c9ad84', '#7f633f', .6);
    for (let i = 1; i < Math.round(w / .6); i++) {
      line(ctx, t.X(x + i * .6), t.Y(y + .05), t.X(x + i * .6), t.Y(y + d - .05), '#9c815c', .4);
    }
  }

  function sofa(ctx, t, x, y, w = 2.0, d = .8, vertical = false) {
    if (vertical) [w, d] = [d, w];
    pxRect(ctx, t, x, y, w, d, '#c9b391', '#836b4b', .7);
    // back + arms
    pxRect(ctx, t, x + .06, y + .06, w - .12, .16, '#b89d78', null, 0);
    pxRect(ctx, t, x + .06, y + .06, .14, d - .12, '#b89d78', null, 0);
    pxRect(ctx, t, x + w - .20, y + .06, .14, d - .12, '#b89d78', null, 0);
    // seat cushions
    const n = Math.max(2, Math.round(w / .65));
    for (let i = 1; i < n; i++) {
      line(ctx, t.X(x + i * w / n), t.Y(y + .24), t.X(x + i * w / n), t.Y(y + d - .08), '#a98d68', .45);
    }
    line(ctx, t.X(x + .22), t.Y(y + d * .32), t.X(x + w - .22), t.Y(y + d * .32), '#d8c4a6', .4);
  }

  function shelf(ctx, t, x, y, w, d, rows = 3) {
    pxRect(ctx, t, x, y, w, d, '#e4d6c0', '#8d7658', .6);
    for (let i = 1; i <= rows; i++) {
      line(ctx, t.X(x + .05), t.Y(y + d * i / (rows + 1)), t.X(x + w - .05), t.Y(y + d * i / (rows + 1)), '#a88f6e', .4);
    }
  }

  function toilet(ctx, t, x, y, rot = 0) {
    ctx.save();
    ctx.translate(t.X(x), t.Y(y));
    ctx.rotate(rot);
    ctx.fillStyle = '#dfeae7';
    ctx.strokeStyle = '#5f7772';
    ctx.lineWidth = .6;
    ctx.beginPath(); ctx.ellipse(0, 2, 3.5, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f6fbfa';
    ctx.beginPath(); ctx.ellipse(0, 2, 2.1, 3.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#cbdcd7';
    ctx.fillRect(-3, -5, 6, 2.4);
    ctx.restore();
  }

  function sink(ctx, t, x, y, w = .55, d = .4) {
    pxRect(ctx, t, x, y, w, d, '#e6f0ed', '#5f7772', .6);
    ctx.save();
    ctx.strokeStyle = '#5f7772';
    ctx.lineWidth = .5;
    ctx.beginPath(); ctx.arc(t.X(x + w / 2), t.Y(y + d / 2), t.W(.12), 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  function shower(ctx, t, x, y, w = 1.0, d = 1.0) {
    pxRect(ctx, t, x, y, w, d, '#dcebe8', '#5f7772', .6);
    ctx.save();
    ctx.strokeStyle = '#5f7772';
    ctx.lineWidth = .5;
    ctx.beginPath(); ctx.arc(t.X(x + w / 2), t.Y(y + d / 2), t.W(.06), 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(t.X(x + w * .72), t.Y(y + d * .12)); ctx.lineTo(t.X(x + w * .72), t.Y(y + d * .3)); ctx.stroke();
    ctx.restore();
  }

  function stairs(ctx, t, x, y, w, d, dir = 'up', flights = 2) {
    pxRect(ctx, t, x, y, w, d, '#e9dcc6', '#6f5c44', .8);
    const steps = 10;
    if (flights === 2) {
      const half = w / 2;
      for (const [ox, up] of [[0, true], [half, false]]) {
        for (let i = 1; i < steps; i++) {
          const yy = y + d * i / steps;
          line(ctx, t.X(x + ox + .05), t.Y(yy), t.X(x + ox + half - .05), t.Y(yy), '#9e8768', .45);
        }
        const cx = t.X(x + ox + half / 2);
        ctx.save();
        ctx.strokeStyle = C.red;
        ctx.lineWidth = .8;
        ctx.beginPath();
        if (up) { ctx.moveTo(cx, t.Y(y + d * .82)); ctx.lineTo(cx, t.Y(y + d * .18)); }
        else { ctx.moveTo(cx, t.Y(y + d * .18)); ctx.lineTo(cx, t.Y(y + d * .82)); }
        ctx.stroke();
        const ey = up ? t.Y(y + d * .18) : t.Y(y + d * .82);
        const py = up ? t.Y(y + d * .3) : t.Y(y + d * .7);
        ctx.beginPath(); ctx.moveTo(cx, ey); ctx.lineTo(cx - 3, py); ctx.lineTo(cx + 3, py); ctx.closePath(); ctx.fillStyle = C.red; ctx.fill();
        ctx.restore();
      }
      line(ctx, t.X(x + half), t.Y(y + .08), t.X(x + half), t.Y(y + d - .08), '#6f5c44', .7);
      text(ctx, dir === 'up' ? 'UP' : 'DN', t.X(x + w - .35), t.Y(y + d - .3), { size: 5.8, weight: 700, color: C.red, align: 'right', mono: true });
    } else {
      for (let i = 1; i < steps; i++) {
        line(ctx, t.X(x + .05), t.Y(y + d * i / steps), t.X(x + w - .05), t.Y(y + d * i / steps), '#9e8768', .45);
      }
      const cx = t.X(x + w / 2);
      ctx.save();
      ctx.strokeStyle = C.red; ctx.lineWidth = .8;
      ctx.beginPath();
      if (dir === 'up') { ctx.moveTo(cx, t.Y(y + d * .85)); ctx.lineTo(cx, t.Y(y + d * .15)); }
      else { ctx.moveTo(cx, t.Y(y + d * .15)); ctx.lineTo(cx, t.Y(y + d * .85)); }
      ctx.stroke();
      ctx.restore();
    }
  }

  function elevator(ctx, t, x, y, w, d, id = 'EL', o = {}) {
    pxRect(ctx, t, x, y, w, d, '#eadfc9', '#6f5c44', .8);
    pxRect(ctx, t, x + .18, y + .18, w - .36, d - .36, null, '#8e795e', .6);
    line(ctx, t.X(x + .18), t.Y(y + .18), t.X(x + w - .18), t.Y(y + d - .18), '#8e795e', .55);
    line(ctx, t.X(x + w - .18), t.Y(y + .18), t.X(x + .18), t.Y(y + d - .18), '#8e795e', .55);
    const doorW = o.door ?? 1.0;
    if (o.doorSide === 'south') {
      pxRect(ctx, t, x + w / 2 - doorW / 2, y + d - .12, doorW, .12, C.paper, null, 0);
    } else if (o.doorSide === 'north') {
      pxRect(ctx, t, x + w / 2 - doorW / 2, y, doorW, .12, C.paper, null, 0);
    } else if (o.doorSide === 'west') {
      pxRect(ctx, t, x, y + d / 2 - doorW / 2, .12, doorW, C.paper, null, 0);
    } else if (o.doorSide === 'east') {
      pxRect(ctx, t, x + w - .12, y + d / 2 - doorW / 2, .12, doorW, C.paper, null, 0);
    }
    text(ctx, id, t.X(x + w / 2), t.Y(y + d / 2 + .12), { size: 6.4, weight: 700, color: C.red, align: 'center', mono: true });
  }

  function court(ctx, t, x, y, w, d, o = {}) {
    ctx.save();
    ctx.strokeStyle = o.color || C.green;
    ctx.lineWidth = .85;
    ctx.strokeRect(t.X(x), t.Y(y), t.W(w), t.W(d));
    line(ctx, t.X(x + w / 2), t.Y(y), t.X(x + w / 2), t.Y(y + d), o.color || C.green, .7);
    ctx.beginPath();
    ctx.arc(t.X(x + w / 2), t.Y(y + d / 2), t.W(Math.min(w, d) * .12), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function pool(ctx, t, x, y, w, d) {
    pxRect(ctx, t, x, y, w, d, C.water, C.blue, .9);
    for (let i = 1; i < 6; i++) {
      line(ctx, t.X(x + .1), t.Y(y + d * i / 6), t.X(x + w - .1), t.Y(y + d * i / 6), 'rgba(79,111,120,.28)', .5);
    }
    for (const yy of [y + .35, y + d - .35]) {
      ctx.save();
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = .6;
      ctx.beginPath(); ctx.arc(t.X(x + w - .3), t.Y(yy), t.W(.18), 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
  }

  function gymEquip(ctx, t, x, y, kind = 'treadmill') {
    if (kind === 'treadmill') {
      pxRect(ctx, t, x, y, .8, 1.8, '#b8c3b2', '#5f6f5b', .6);
      pxRect(ctx, t, x + .1, y + .1, .6, .5, '#dbe2d7', null, 0);
    } else if (kind === 'weights') {
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.strokeStyle = '#5f6f5b'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(t.X(x + .25), t.Y(y + .25 + i * .45), t.W(.22), 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
    } else {
      pxRect(ctx, t, x, y, 1.6, 1.0, '#c8d2c0', '#5f6f5b', .6);
    }
  }

  function arcade(ctx, t, x, y, w = .8, d = .6) {
    pxRect(ctx, t, x, y, w, d, '#5f596d', '#37323f', .6);
    pxRect(ctx, t, x + .08, y + .1, w - .16, d * .35, '#9fb4c8', null, 0);
  }

  function gateV(ctx, t, x, y1, y2, label = '刷卡铁门') {
    ctx.save();
    ctx.strokeStyle = C.ink2;
    ctx.lineWidth = 1.0;
    line(ctx, t.X(x), t.Y(y1), t.X(x), t.Y(y2), C.ink2, 1.1);
    for (let y = y1 + .12; y < y2; y += .22) {
      line(ctx, t.X(x - .08), t.Y(y), t.X(x + .08), t.Y(y), C.ink2, .55);
    }
    ctx.fillStyle = C.red;
    ctx.fillRect(t.X(x - .16), t.Y(y1 - .18), t.W(.32), t.W(.32));
    ctx.fillStyle = C.paper2;
    ctx.font = `700 4.5px ${MONO}`;
    ctx.textAlign = 'center';
    ctx.fillText('CARD', t.X(x), t.Y(y1 - .02));
    ctx.restore();
    text(ctx, label, t.X(x + .2), t.Y((y1 + y2) / 2), { size: 5.6, weight: 600, color: C.red, bg: C.paper2 });
  }

  function gateH(ctx, t, x1, x2, y, label = '刷卡铁门') {
    ctx.save();
    ctx.strokeStyle = C.ink2;
    ctx.lineWidth = 1.0;
    line(ctx, t.X(x1), t.Y(y), t.X(x2), t.Y(y), C.ink2, 1.1);
    for (let x = x1 + .12; x < x2; x += .22) {
      line(ctx, t.X(x), t.Y(y - .08), t.X(x), t.Y(y + .08), C.ink2, .55);
    }
    ctx.fillStyle = C.red;
    ctx.fillRect(t.X(x1 - .18), t.Y(y - .16), t.W(.32), t.W(.32));
    ctx.fillStyle = C.paper2;
    ctx.font = `700 4.5px ${MONO}`;
    ctx.textAlign = 'center';
    ctx.fillText('CARD', t.X(x1), t.Y(y));
    ctx.restore();
    text(ctx, label, t.X((x1 + x2) / 2), t.Y(y - .28), { size: 5.6, weight: 600, color: C.red, bg: C.paper2 });
  }

  function plant(ctx, t, x, y, r = .25) {
    ctx.save();
    ctx.fillStyle = '#7f9173';
    ctx.beginPath(); ctx.arc(t.X(x), t.Y(y), t.W(r), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9e7150';
    ctx.beginPath(); ctx.arc(t.X(x), t.Y(y + r * .65), t.W(r * .4), 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /* ---------- sheet chrome wrapper ---------- */
  function sheet(canvas, meta) {
    const ctx = prepare(canvas);
    paper(ctx);
    frame(ctx, meta);
    titleBlock(ctx, meta);
    notesPanel(ctx, meta);
    if (!meta.noNorth) north(ctx, 1290, 155, 1.0);
    return ctx;
  }

  function planFooter(ctx, t, meta) {
    scaleBar(ctx, t, PLAN.x + 15, 904, 5, 5);
    text(ctx, '1 m 网格 · 外墙 300 / 内墙 120', PLAN.x + 15, 932, { size: 6.2, weight: 500, color: C.faint, mono: true });
    text(ctx, meta.footer || '', PLAN.x + PLAN.w - 10, 932, { size: 6.4, weight: 500, color: C.faint, align: 'right' });
  }

  /* ===================================================================
   * A-01 · LIVING WING · LEVEL 1
   * =================================================================== */
  function drawA01(canvas) {
    const meta = {
      num: 'A-01',
      level: 'PLAN 1F',
      title: '生活区 1F 平面',
      subtitle: 'LIVING WING · LEVEL 1 · A–J · 1:150',
      scale: '1:150',
      notes: [
        ['外轮廓', '12.00 后厨 + 36.00 餐厅 + 2.40 东走廊 + 5.16 东侧房间；外轮廓 56.40 × 30.40 m。'],
        ['已建模型', 'D 餐厅 36.0 × 22.0、C 后厨 12.0 × 22.0、C 内冷库 2.7 × 5.6，均按模型实际尺寸。'],
        ['走廊', '北侧主走廊净宽 2.40 m；东侧纵向走廊净宽 2.40 m，连接 I/J 与北门厅。'],
        ['服务动线', 'B 为收货冷藏库，C 内另设已建冷库；C↔D 设 2.40 m 传菜口，后厨日常动线不穿公共走廊。'],
        ['补齐', '北门厅东侧补 3.00 × 2.40 m 无障碍卫生间；A 西墙保留铁栏门与外部垃圾车接口。'],
        ['门宽', '宿舍/房间 0.90 m，普通房间 1.20 m，公共门 1.80–2.40 m；传菜口为无门洞口。'],
        ['结构', '2F 宿舍 4.80 m 开间在餐厅上方采用转换梁；1F 餐厅 36 m 跨内不落柱。'],
        ['比例', '本图 1:150；图中所有尺寸为净尺寸，墙体另计。'],
      ],
      stats: '主要面积：C 后厨 264.0 ㎡ · D 餐厅 792.0 ㎡ · E 医务 55.7 ㎡ · F 阅览 83.6 ㎡ · 北门厅 66.7 ㎡ · 1F 建筑面积约 1 715 ㎡。',
      footer: 'A-01 · 生活区 1F · 1:150 · 尺寸单位 m',
    };

    const ctx = sheet(canvas, meta);
    const t = planT(56.4, 30.4, 150);
    meterGrid(ctx, t, 56.4, 30.4);

    /* ---- floor fills ---- */
    pxRect(ctx, t, 0.3, 0.3, 5.4, 5.4, '#e8dfd0');                     // A yard
    hatchRect(ctx, t, 0.3, 0.3, 5.4, 5.4, 'rgba(124,112,96,.20)', 7);
    pxRect(ctx, t, 5.82, 0.3, 6.48, 5.4, C.blueSoft);                 // B
    pxRect(ctx, t, 12.42, 0.3, 10.32, 5.4, '#f1e8da');                // E
    pxRect(ctx, t, 22.86, 0.3, 15.48, 5.4, '#f6eddf');                // F
    pxRect(ctx, t, 38.46, 0.3, 12.36, 5.4, C.public);                 // lobby
    pxRect(ctx, t, 47.82, 0.3, 3.0, 2.4, C.wet);                      // WC
    pxRect(ctx, t, 50.94, 0.3, 5.16, 5.4, '#eef2ec');                 // G
    pxRect(ctx, t, 0.3, 5.7, 56.1, 2.4, '#eee3d1');                   // north corridor
    pxRect(ctx, t, 0.3, 8.1, 12.0, 22.0, '#f4e9d7');                  // C
    pxRect(ctx, t, 12.42, 8.1, 36.0, 22.0, '#fbf2e1');                // D
    pxRect(ctx, t, 48.42, 8.1, 2.4, 22.0, '#eee3d1');                 // east corridor
    pxRect(ctx, t, 50.94, 8.1, 5.16, 7.8, '#efe5d4');                 // H
    pxRect(ctx, t, 50.94, 16.02, 5.16, 4.2, '#eadfc9');               // J
    pxRect(ctx, t, 50.94, 20.34, 5.16, 9.76, '#e9dcc6');              // I
    pxRect(ctx, t, 0.3, 8.1, 2.7, 5.6, '#dcebe8');                    // cold room
    pxRect(ctx, t, 5.0, 15.2, 3.0, 1.0, '#d8c29e');                   // island
    pxRect(ctx, t, 5.0, 18.6, 3.0, 1.0, '#d8c29e');                   // island
    pxRect(ctx, t, 5.0, 22.0, 3.0, 1.0, '#d8c29e');                   // island

    /* ---- walls ---- */
    const w = wallSet(ctx, t);
    // external perimeter
    w.h(0, 56.4, 0, .30);
    w.h(0, 56.4, 30.4, .30);
    w.v(0, 0, 30.4, .30);
    w.v(56.4, 0, 30.4, .30);

    // north row partitions
    w.v(5.76, .3, 5.7, .12);
    w.v(12.36, .3, 5.7, .12);
    w.v(22.80, .3, 5.7, .12);
    w.v(38.40, .3, 5.7, .12);
    w.v(50.88, .3, 5.7, .12);
    w.h(.3, 48.42, 5.7, .12);
    w.h(50.94, 56.1, 5.7, .12);
    w.h(.3, 48.42, 8.1, .12);
    w.h(50.94, 56.1, 8.1, .12);

    // C / D / east corridor
    w.v(12.36, 8.1, 30.1, .12);
    w.v(48.42, 8.1, 30.1, .12);
    w.v(50.82, 8.1, 30.1, .12);
    w.h(50.82, 56.1, 15.90, .12);
    w.h(50.82, 56.1, 20.22, .12);

    // cold room in C
    w.v(3.0, 8.1, 13.7, .12);
    w.h(.3, 3.0, 13.7, .12);

    // WC in lobby
    w.v(47.82, .3, 2.7, .12);
    w.h(47.82, 50.82, 2.7, .12);

    // doors
    w.doorV(0, 2.4, 1.2, { th: .30, hinge: 'top', swing: 1 });         // A iron gate
    w.doorH(9.6, 5.7, .9, { hinge: 'left', swing: -1 });               // B
    w.doorH(16.4, 5.7, 1.2, { hinge: 'left', swing: -1 });             // E
    w.doorH(30.0, 5.7, 1.2, { hinge: 'left', swing: -1 });             // F
    w.doorH(44.0, 5.7, 2.4, { double: true, swing: -1 });              // lobby / corridor
    w.doorH(44.0, 8.1, 1.8, { double: true, swing: 1 });               // lobby / D
    w.doorH(52.6, 5.7, .9, { hinge: 'right', swing: -1 });             // G
    w.doorV(50.82, 10.4, .9, { th: .12, hinge: 'top', swing: 1 });     // H
    w.doorV(50.82, 22.0, 1.2, { th: .12, hinge: 'top', swing: 1 });    // I
    w.doorH(2.0, 8.1, 1.2, { swing: 1 });                              // C staff
    w.doorV(12.36, 12.7, 1.2, { hinge: 'top', swing: 1 });             // C / D service
    w.doorV(12.36, 9.8, 2.4, { double: true, hinge: 'top', swing: 1, color: C.gold }); // pass
    w.doorH(20.0, 8.1, 1.8, { double: true, swing: 1 });               // D north 1
    w.doorH(35.0, 8.1, 1.8, { double: true, swing: 1 });               // D north 2
    w.doorV(48.42, 24.0, 1.8, { double: true, hinge: 'top', swing: 1 });// D east
    w.doorH(48.9, 2.7, .9, { hinge: 'left', swing: -1 });              // WC
    w.doorV(3.0, 11.0, .9, { hinge: 'top', swing: -1 });                // cold room

    // windows
    w.windowH(7.8, 0, 2.4);                                            // B high window
    w.windowH(13.6, 0, 1.6); w.windowH(17.0, 0, 1.6); w.windowH(20.4, 0, 1.6);
    w.windowH(24.0, 0, 2.2); w.windowH(28.0, 0, 2.2); w.windowH(32.0, 0, 2.2); w.windowH(36.0, 0, 2.2);
    w.windowH(52.2, 0, 2.0);
    w.windowV(0, 10.0, 2.4); w.windowV(0, 15.0, 2.4); w.windowV(0, 20.0, 2.4);
    w.windowH(4.0, 30.4, 2.4); w.windowH(8.0, 30.4, 2.4);
    w.windowH(16.0, 30.4, 3.0); w.windowH(23.0, 30.4, 3.0); w.windowH(30.0, 30.4, 3.0); w.windowH(37.0, 30.4, 3.0); w.windowH(44.0, 30.4, 3.0);
    w.windowV(56.4, 10.0, 1.8);
    w.windowV(56.4, 22.0, 2.4);

    w.draw();

    // Iron bars on A gate.
    ctx.save();
    ctx.strokeStyle = C.ink2;
    ctx.lineWidth = .8;
    for (let i = 0; i < 6; i++) {
      const y = 2.45 + i * .2;
      line(ctx, t.X(-.04), t.Y(y), t.X(.12), t.Y(y), C.ink2, .7);
    }
    ctx.restore();

    // Elevator door (sliding, no swing arc).
    pxRect(ctx, t, 50.76, 17.8, .12, 1.2, C.paper, null, 0);
    line(ctx, t.X(50.82), t.Y(17.8), t.X(50.82), t.Y(19.0), C.blue, 1.1);
    line(ctx, t.X(50.82), t.Y(17.8), t.X(51.2), t.Y(17.8), C.blue, .7);
    line(ctx, t.X(50.82), t.Y(19.0), t.X(51.2), t.Y(19.0), C.blue, .7);

    // Serving pass counter.
    pxRect(ctx, t, 12.18, 9.8, .36, 2.4, '#c9ad84', '#7f633f', .7);

    /* ---- furniture ---- */
    // A dumpsters
    for (const [x, y] of [[1.2, 1.2], [3.3, 1.2], [1.2, 3.5]]) {
      pxRect(ctx, t, x, y, 1.55, 1.05, '#8b8a7f', '#4f5149', .8);
      line(ctx, t.X(x + .2), t.Y(y + .2), t.X(x + 1.35), t.Y(y + .85), '#5f6158', .5);
    }
    // B shelves
    shelf(ctx, t, 6.05, 1.25, 3.8, .45, 3);
    shelf(ctx, t, 6.05, 2.55, 3.8, .45, 3);
    shelf(ctx, t, 10.35, 1.25, 1.85, .45, 3);
    shelf(ctx, t, 10.35, 2.55, 1.85, .45, 3);
    // C cold room shelving
    shelf(ctx, t, .55, 8.5, .55, 4.5, 4);
    shelf(ctx, t, 2.3, 8.5, .5, 4.5, 4);
    // C west prep line, interrupted by the freight lift
    pxRect(ctx, t, .45, 14.2, .95, 9.6, '#d6c1a0', '#856b47', .7);
    pxRect(ctx, t, .45, 26.2, .95, 2.6, '#d6c1a0', '#856b47', .7);
    for (const yy of [15.2, 18.0, 21.0, 27.0]) {
      pxRect(ctx, t, .55, yy, .75, .55, '#c7d5d2', '#5f7772', .5);
      sink(ctx, t, .62, yy + .05, .55, .4);
    }
    // C cooking line (east wall), islands, sinks
    pxRect(ctx, t, 10.9, 14.1, 1.2, 5.8, '#d6c1a0', '#856b47', .7);
    ctx.save();
    ctx.strokeStyle = 'rgba(124,112,96,.4)';
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(t.X(10.65), t.Y(13.75), t.W(1.65), t.W(6.5));
    ctx.restore();
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.strokeStyle = '#6d5a3f'; ctx.lineWidth = .8;
      ctx.beginPath(); ctx.arc(t.X(11.5), t.Y(15.0 + i * 1.35), t.W(.22), 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    pxRect(ctx, t, 10.9, 22.2, 1.2, 2.0, '#c7d5d2', '#5f7772', .7);
    sink(ctx, t, 11.0, 22.4, .9, .5);
    sink(ctx, t, 11.0, 23.3, .9, .5);
    // C south dish / prep run
    pxRect(ctx, t, 3.8, 28.5, 6.2, 1.25, '#d6c1a0', '#856b47', .7);
    pxRect(ctx, t, 4.2, 28.75, 1.5, .7, '#c7d5d2', '#5f7772', .5);
    pxRect(ctx, t, 6.4, 28.75, 1.5, .7, '#c7d5d2', '#5f7772', .5);
    pxRect(ctx, t, 8.4, 28.75, 1.2, .7, '#c7d5d2', '#5f7772', .5);
    // C freight lift + lockers
    pxRect(ctx, t, .4, 24.0, 1.6, 2.0, '#cbb99e', '#6f5c44', .7);
    smallLabel(ctx, t, .55, 24.45, '货梯', { size: 5.4, color: C.red });
    for (let i = 0; i < 4; i++) pxRect(ctx, t, 3.5 + i * .55, 26.9, .45, 1.0, '#cbb99e', '#8d7658', .5);
    // C pass table
    pxRect(ctx, t, 11.4, 9.9, 1.1, 2.2, '#d6c1a0', '#856b47', .7);
    // C prep table
    pxRect(ctx, t, 5.0, 24.6, 3.4, 1.1, '#d6c1a0', '#856b47', .7);
    pxRect(ctx, t, 8.8, 24.6, 1.6, 1.1, '#c7d5d2', '#5f7772', .6);
    // D tables: 5 x 2, six seats each
    for (const y of [15.6, 22.6]) {
      for (const x of [15.6, 22.6, 29.6, 36.6, 43.6]) table(ctx, t, x, y, 1.8, 1.0, 6);
    }
    // D sideboard east
    pxRect(ctx, t, 47.4, 11.0, .55, 8.0, '#cdb188', '#826745', .7);
    // E infirmary
    bed(ctx, t, 21.1, .9, { w: 1.0, d: 2.0 });
    bed(ctx, t, 21.1, 3.15, { w: 1.0, d: 2.0 });
    desk(ctx, t, 13.0, 3.6, .65, 1.2);
    chair(ctx, t, 14.0, 4.1, .18);
    chair(ctx, t, 15.0, 4.1, .18);
    // F reading room
    shelf(ctx, t, 23.1, 1.05, 14.5, .42, 2);
    shelf(ctx, t, 23.1, 4.4, 6.5, .42, 2);
    for (const x of [25.4, 31.8, 35.2]) {
      table(ctx, t, x, 2.8, 2.0, 1.0, 4);
    }
    chair(ctx, t, 23.8, 2.3, .18);
    chair(ctx, t, 23.8, 3.4, .18);
    // Lobby reception + sofa
    pxRect(ctx, t, 39.2, 3.4, 2.8, .8, '#c9ad84', '#7f633f', .7);
    chair(ctx, t, 40.1, 4.5, .18);
    chair(ctx, t, 41.1, 4.5, .18);
    sofa(ctx, t, 43.0, 4.4, 2.4, .75);
    plant(ctx, t, 46.0, 4.8, .28);
    // G shop
    shelf(ctx, t, 51.2, 2.1, 4.3, .45, 3);
    shelf(ctx, t, 51.2, 3.3, 2.0, .45, 2);
    pxRect(ctx, t, 51.2, 4.5, 2.8, .7, '#c9ad84', '#7f633f', .6);
    // H shelving
    for (let i = 0; i < 3; i++) shelf(ctx, t, 51.2, 9.15 + i * 1.5, 4.3, .45, 2);
    // J elevator
    elevator(ctx, t, 51.0, 17.0, 4.3, 2.9, 'J', { doorSide: 'east' });
    // I stair
    stairs(ctx, t, 51.1, 24.0, 4.7, 6.0, 'up', 2);
    pxRect(ctx, t, 51.1, 21.0, 4.7, 2.2, '#ded0ba', null, 0);
    smallLabel(ctx, t, 51.25, 21.55, '楼梯前室', { size: 5.4, color: C.faint });
    // WC fixtures
    toilet(ctx, t, 48.5, 1.25, 0);
    sink(ctx, t, 49.7, .65, .6, .4);
    line(ctx, t.X(48.4), t.Y(2.15), t.X(50.5), t.Y(2.15), '#5f7772', .5);
    // Plants / waiting
    plant(ctx, t, 39.0, 1.0, .22);
    plant(ctx, t, 47.2, 4.8, .22);

    /* ---- labels ---- */
    roomTag(ctx, t, { x: .3, y: .3, w: 5.4, h: 5.4, letter: 'A', name: '垃圾场', sub: '铁栏封死', badgeColor: C.ink2 });
    roomTag(ctx, t, { x: 5.82, y: .3, w: 6.48, h: 5.4, letter: 'B', name: '冷藏库', sub: '收货 / 暂存', badgeColor: C.blue });
    roomTag(ctx, t, { x: 12.42, y: .3, w: 10.32, h: 5.4, letter: 'E', name: '医务室', sub: '2 床 + 诊台', badgeColor: C.blue });
    roomTag(ctx, t, { x: 22.86, y: .3, w: 15.48, h: 5.4, letter: 'F', name: '阅览室', sub: '书架 + 3 阅读桌', badgeColor: C.blue });
    roomTag(ctx, t, { x: 38.46, y: .3, w: 9.3, h: 5.4, letter: '门', name: '北门厅', sub: '入口 / 接待', noArea: true, badgeColor: C.red });
    roomTag(ctx, t, { x: 47.82, y: .3, w: 3.0, h: 2.4, letter: 'WC', name: '无障碍', compact: true, badgeColor: C.blue });
    roomTag(ctx, t, { x: 50.94, y: .3, w: 5.16, h: 5.4, letter: 'G', name: '便利店', sub: '超市', badgeColor: C.green, compact: true });
    badge(ctx, t.X(3.45), t.Y(8.55), 'C', { size: 18, color: C.gold });
    text(ctx, '后厨', t.X(3.45) + 24, t.Y(8.55) + 7, { size: 10.6, weight: 700, color: C.ink, bg: C.paper2 });
    text(ctx, '264.0 ㎡ · 12.0 × 22.0', t.X(3.45) + 24, t.Y(8.55) + 21, { size: 6.7, weight: 500, color: C.muted, mono: true, bg: C.paper2 });
    roomTag(ctx, t, { x: 12.42, y: 8.1, w: 36.0, h: 22.0, letter: 'D', name: '学生餐厅', sub: '已建模型 36.0 × 22.0 · 10 桌 60 座', badgeColor: C.gold });
    roomTag(ctx, t, { x: 50.94, y: 8.1, w: 5.16, h: 7.8, letter: 'H', name: '杂物间', badgeColor: C.ink2, compact: true });
    roomTag(ctx, t, { x: 50.94, y: 16.02, w: 5.16, h: 4.2, letter: 'J', name: '电梯间', badgeColor: C.red, compact: true });
    roomTag(ctx, t, { x: 50.94, y: 20.34, w: 5.16, h: 9.76, letter: 'I', name: '楼梯间', sub: '上 2F', badgeColor: C.ink2, compact: true });

    // small annotations
    smallLabel(ctx, t, 0.5, 8.85, '冷库 2.7×5.6', { size: 5.2, color: C.blue });
    smallLabel(ctx, t, 12.55, 9.95, '传菜口 2.40', { size: 5.8, color: C.gold });
    smallLabel(ctx, t, 48.55, 6.1, '东走廊 2.40', { size: 5.8, color: C.muted });
    smallLabel(ctx, t, 39.1, 1.9, '入口', { size: 6.2, color: C.red });
    text(ctx, '已建后厨 12.0 × 22.0 / 净高 3.25', t.X(3.8), t.Y(27.15), { size: 6.6, weight: 600, color: C.gold, bg: C.paper2 });
    text(ctx, '已建餐厅 36.0 × 22.0 / 净高 4.20', t.X(13.0), t.Y(29.55), { size: 6.6, weight: 600, color: C.gold, bg: C.paper2 });

    // title note
    text(ctx, 'LIVING WING · LEVEL 1', t.X(0.3), t.Y(-3.2), { size: 7, weight: 700, color: C.faint, mono: true });

    /* ---- dimensions ---- */
    dimH(ctx, t, 0, 56.4, -2.4, '56.40', { size: 8.2 });
    dimH(ctx, t, 0, 5.7, -1.35, '5.40', { size: 6.0 });
    dimH(ctx, t, 5.7, 12.3, -1.35, '6.48', { size: 6.0 });
    dimH(ctx, t, 12.3, 22.74, -1.35, '10.32', { size: 6.0 });
    dimH(ctx, t, 22.74, 38.34, -1.35, '15.48', { size: 6.0 });
    dimH(ctx, t, 38.34, 50.82, -1.35, '12.36', { size: 6.0 });
    dimH(ctx, t, 50.82, 56.1, -1.35, '5.16', { size: 6.0 });
    dimV(ctx, t, 0, 30.4, -2.0, '30.40', { size: 8.2 });
    dimV(ctx, t, 0, 5.7, -1.05, '5.40', { size: 6.0 });
    dimV(ctx, t, 5.7, 8.1, -1.05, '2.40', { size: 6.0 });
    dimV(ctx, t, 8.1, 30.1, -1.05, '22.00', { size: 6.0 });

    planFooter(ctx, t, meta);
  }

  /* ===================================================================
   * A-02 · RESIDENCE · LEVEL 2
   * =================================================================== */
  function drawA02(canvas) {
    const meta = {
      num: 'A-02',
      level: 'PLAN 2F',
      title: '住宿区 2F 平面',
      subtitle: 'RESIDENCE WING · LEVEL 2 · A–Z · 1:150',
      scale: '1:150',
      notes: [
        ['宿舍模数', '男生 A–J 十间沿北墙，每间 4.80 × 5.60 m；女生 O–V 八间沿南墙，同尺寸。'],
        ['竖向对齐', 'W 楼梯、X 电梯与 1F 的 I 楼梯、J 电梯同轴；东侧 2.40 m 走廊贯通南北。'],
        ['集中卫浴', 'K 男淋浴 / L 女淋浴 / Y 男厕 / Z 女厕集中在 2F 西侧，不在每间宿舍重复设置。'],
        ['无窗设定', 'O–V 女生宿舍南墙按原图设定不开窗；图中以红色“无窗”括号标注，不补窗。'],
        ['安全门', '北、南走道各设一道刷卡铁门：外侧刷卡，内侧单独释放；铁栏杆与阻隔挡板按原注记保留。'],
        ['补齐', '东侧 1F 屋面以上补设备平台（不上人）；2F 东南角补女生储物，均从东走廊检修门进入。'],
        ['结构', '宿舍 4.80 m 开间与 1F 餐厅上方转换梁对齐；2F 楼板在餐厅 36 m 跨内由转换梁承托。'],
        ['比例', '本图 1:150；宿舍面积按净尺寸 4.80 × 5.60 = 26.88 ㎡ 计。'],
      ],
      stats: '主要面积：男宿 10 × 26.9 = 268.8 ㎡ · 女宿 8 × 26.9 = 215.0 ㎡ · M 宿舍大厅约 550 ㎡ · K/L 各 33.6 ㎡ · 2F 建筑面积约 1 715 ㎡。',
      footer: 'A-02 · 住宿区 2F · 1:150 · 尺寸单位 m',
    };

    const ctx = sheet(canvas, meta);
    const t = planT(56.4, 30.4, 150);
    meterGrid(ctx, t, 56.4, 30.4);

    /* ---- fills ---- */
    pxRect(ctx, t, 0.3, 0.3, 49.08, 5.6, C.dorm);                       // boys strip
    pxRect(ctx, t, 51.9, 0.3, 4.2, 5.6, '#efe5d4');                     // N
    pxRect(ctx, t, 0.3, 5.9, 56.1, 2.4, '#eee3d1');                     // north corridor
    pxRect(ctx, t, 0.3, 8.3, 49.08, 13.8, '#f6eddf');                   // M + services
    pxRect(ctx, t, 0.3, 8.3, 6.0, 13.8, C.wet);                         // K/L/laundry
    pxRect(ctx, t, 6.42, 8.3, 3.0, 5.9, C.wet);                         // Y/Z
    pxRect(ctx, t, 49.5, 5.9, 2.4, 18.6, '#eee3d1');                    // east corridor
    pxRect(ctx, t, 51.9, 5.9, 4.2, 18.6, '#e7ddcc');                    // roof terrace
    hatchRect(ctx, t, 51.9, 5.9, 4.2, 18.6, 'rgba(124,112,96,.16)', 9);
    pxRect(ctx, t, 0.3, 22.1, 51.9, 2.4, '#eee3d1');                    // south corridor
    pxRect(ctx, t, 0.3, 24.5, 39.24, 5.6, C.dorm);                      // girls strip
    pxRect(ctx, t, 39.66, 24.5, 4.8, 5.6, '#e9dcc6');                   // W
    pxRect(ctx, t, 44.58, 24.5, 4.8, 5.6, '#eadfc9');                   // X
    pxRect(ctx, t, 49.5, 24.5, 6.6, 5.6, '#efe5d4');                    // SE storage

    // M hall lounge rugs / zones
    pxRect(ctx, t, 10.2, 9.6, 8.2, 5.0, '#ece0cc');
    pxRect(ctx, t, 10.4, 16.8, 8.0, 4.0, '#ece0cc');
    pxRect(ctx, t, 30.0, 17.2, 6.0, 3.2, '#e7dcc9');

    /* ---- walls ---- */
    const w = wallSet(ctx, t);
    w.h(0, 56.4, 0, .30);
    w.h(0, 56.4, 30.4, .30);
    w.v(0, 0, 30.4, .30);
    w.v(56.4, 0, 30.4, .30);

    // north dorm partitions
    for (let i = 1; i < 10; i++) w.v(0.3 + i * 4.92 - .06, .3, 5.9, .12);
    w.h(.3, 49.38, 5.9, .12);
    w.h(51.9, 56.1, 5.9, .12);

    // east corridor / N
    w.v(49.44, 8.3, 22.1, .12);
    w.v(51.9, .3, 5.9, .12);
    w.v(51.9, 5.9, 24.5, .12);
    w.h(.3, 49.44, 8.3, .12);
    w.h(.3, 49.44, 22.1, .12);
    w.h(.3, 49.44, 24.5, .12);
    w.h(49.5, 56.1, 24.5, .12);

    // K / L / laundry
    w.v(6.36, 8.3, 22.1, .12);
    w.h(.3, 6.36, 13.9, .12);
    w.h(.3, 6.36, 19.62, .12);

    // Y / Z
    w.v(9.42, 8.3, 14.22, .12);
    w.h(6.42, 9.42, 11.2, .12);
    w.h(6.42, 9.42, 14.22, .12);

    // south dorm partitions
    for (let i = 1; i < 8; i++) w.v(0.3 + i * 4.92 - .06, 24.5, 30.1, .12);
    w.v(39.6, 24.5, 30.1, .12);
    w.v(44.52, 24.5, 30.1, .12);
    w.v(49.44, 24.5, 30.1, .12);

    // doors: boys
    for (let i = 0; i < 10; i++) {
      w.doorH(0.3 + i * 4.92 + 2.3, 5.9, .9, { hinge: 'left', swing: -1 });
    }
    // doors: girls
    for (let i = 0; i < 8; i++) {
      w.doorH(0.3 + i * 4.92 + 2.3, 24.5, .9, { hinge: 'left', swing: 1 });
    }
    // K/L/laundry
    w.doorV(6.36, 9.8, 1.0, { hinge: 'top', swing: -1 });
    w.doorV(6.36, 15.8, 1.0, { hinge: 'top', swing: -1 });
    w.doorV(6.36, 20.4, .9, { hinge: 'top', swing: -1 });
    // Y/Z
    w.doorV(9.42, 9.2, .9, { hinge: 'top', swing: -1 });
    w.doorV(9.42, 12.4, .9, { hinge: 'top', swing: -1 });
    // N / platform / SE storage
    w.doorV(51.9, 2.6, .9, { hinge: 'top', swing: 1 });
    w.doorV(51.9, 14.8, .9, { hinge: 'top', swing: 1 });
    w.doorH(50.2, 24.5, 1.0, { hinge: 'left', swing: 1 });
    // W / X
    w.doorH(41.2, 24.5, 1.4, { hinge: 'left', swing: 1 });
    // windows: boys north
    for (let i = 0; i < 10; i++) w.windowH(0.3 + i * 4.92 + 1.35, 0, 2.1);
    w.windowV(56.1, 2.0, 1.5);
    // high windows at baths
    w.windowV(0, 9.4, 1.4);
    w.windowV(0, 15.2, 1.4);
    // no windows on girls' south wall (by design)
    w.draw();

    // X elevator sliding door on north wall.
    pxRect(ctx, t, 46.3, 24.44, 1.4, .12, C.paper, null, 0);
    line(ctx, t.X(46.3), t.Y(24.5), t.X(47.7), t.Y(24.5), C.blue, 1.1);
    line(ctx, t.X(46.3), t.Y(24.5), t.X(46.3), t.Y(24.18), C.blue, .7);
    line(ctx, t.X(47.7), t.Y(24.5), t.X(47.7), t.Y(24.18), C.blue, .7);

    // Security gates.
    gateV(ctx, t, 49.44, 5.9, 8.3, '刷卡铁门');
    gateV(ctx, t, 39.6, 22.1, 24.5, '刷卡铁门');

    /* ---- furniture ---- */
    // 10 boys + 8 girls
    for (let i = 0; i < 10; i++) {
      const x = 0.3 + i * 4.92;
      bed(ctx, t, x + .25, .3 + 1.05, { w: 1.0, d: 2.0 });
      desk(ctx, t, x + 3.65, .55, .6, 1.15);
      chair(ctx, t, x + 3.35, 1.1, .17);
      wardrobe(ctx, t, x + 3.6, 3.35, .62, 1.75);
      plant(ctx, t, x + 4.3, 4.9, .16);
    }
    for (let i = 0; i < 8; i++) {
      const x = 0.3 + i * 4.92;
      bed(ctx, t, x + .25, 24.5 + 1.05, { w: 1.0, d: 2.0 });
      desk(ctx, t, x + 3.65, 24.5 + .55, .6, 1.15);
      chair(ctx, t, x + 3.35, 24.5 + 1.1, .17);
      wardrobe(ctx, t, x + 3.6, 24.5 + 3.35, .62, 1.75);
      plant(ctx, t, x + 4.3, 29.7, .16);
    }
    // K male bath
    for (let i = 0; i < 4; i++) shower(ctx, t, .55, 9.45 + i * 1.08, .95, 1.0);
    for (let i = 0; i < 3; i++) sink(ctx, t, 5.4, 8.8 + i * .82, .55, .4);
    for (let i = 0; i < 3; i++) pxRect(ctx, t, 3.2, 11.0 + i * .52, .8, .38, '#cbb99e', '#8d7658', .4);
    pxRect(ctx, t, 3.0, 12.95, 2.6, .5, '#cbb99e', '#8d7658', .5);
    // L female bath
    for (let i = 0; i < 4; i++) shower(ctx, t, .55, 15.2 + i * 1.08, .95, 1.0);
    for (let i = 0; i < 3; i++) sink(ctx, t, 5.4, 14.5 + i * .82, .55, .4);
    for (let i = 0; i < 3; i++) pxRect(ctx, t, 3.2, 16.7 + i * .52, .8, .38, '#cbb99e', '#8d7658', .4);
    pxRect(ctx, t, 3.0, 18.65, 2.6, .5, '#cbb99e', '#8d7658', .5);
    // Laundry
    for (let i = 0; i < 4; i++) {
      const x = 0.55 + i * 1.45;
      pxRect(ctx, t, x, 19.9, 1.1, 1.0, '#dfe8e6', '#5f7772', .6);
      ctx.save(); ctx.strokeStyle = '#5f7772'; ctx.lineWidth = .5;
      ctx.beginPath(); ctx.arc(t.X(x + .55), t.Y(20.4), t.W(.28), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    pxRect(ctx, t, 3.8, 21.0, 2.2, .6, '#cbb99e', '#8d7658', .5);
    // Y male WC
    for (let i = 0; i < 3; i++) toilet(ctx, t, 8.95, 9.25 + i * .68, 0);
    for (let i = 0; i < 2; i++) pxRect(ctx, t, 6.7, 9.3 + i * .7, .35, .55, '#dfeae7', '#5f7772', .5);
    sink(ctx, t, 7.3, 8.65, .55, .4);
    // Z female WC
    for (let i = 0; i < 4; i++) toilet(ctx, t, 8.95, 11.95 + i * .55, 0);
    sink(ctx, t, 6.7, 11.55, .55, .4);
    sink(ctx, t, 6.7, 12.45, .55, .4);
    // M hall furniture
    sofa(ctx, t, 10.8, 9.9, 3.0, .85);
    sofa(ctx, t, 10.8, 13.0, 3.0, .85);
    pxRect(ctx, t, 14.6, 11.2, 2.2, 1.2, '#c9ad84', '#7f633f', .7);
    chair(ctx, t, 15.0, 10.7, .18); chair(ctx, t, 16.3, 10.7, .18);
    chair(ctx, t, 15.0, 12.8, .18); chair(ctx, t, 16.3, 12.8, .18);
    for (const [x, y] of [[21.2, 10.2], [25.8, 10.2], [30.4, 10.2], [35.0, 10.2]]) {
      table(ctx, t, x, y, 2.4, 1.0, 4);
    }
    pxRect(ctx, t, 10.4, 18.2, 10.2, 4.5, '#ece0cc');
    sofa(ctx, t, 11.0, 18.9, 3.2, .85);
    sofa(ctx, t, 18.6, 18.9, 3.2, .85);
    pxRect(ctx, t, 15.0, 19.6, 2.8, 1.1, '#c9ad84', '#7f633f', .6);
    // table tennis in the hall
    pxRect(ctx, t, 10.8, 15.4, 2.6, 1.4, '#5f7a6b', '#394f43', .7);
    line(ctx, t.X(12.1), t.Y(15.4), t.X(12.1), t.Y(16.8), '#dce8d9', .6);
    // lower study cluster
    pxRect(ctx, t, 22.0, 17.0, 12.0, 4.2, '#ece0cc');
    for (const x of [22.6, 26.6, 30.6]) table(ctx, t, x, 18.0, 2.2, 1.0, 4);
    // bookshelf / vending / games
    pxRect(ctx, t, 14.5, 8.45, 6.2, .42, '#d8c6aa', '#8d7658', .6);
    for (const y of [8.65, 9.55, 10.45]) {
      pxRect(ctx, t, 47.7, y, .7, .75, '#6d6a74', '#37323f', .5);
      pxRect(ctx, t, 47.8, y + .1, .5, .28, '#aebfc9', null, 0);
    }
    // pool table
    pxRect(ctx, t, 37.2, 17.7, 2.7, 1.4, '#5f7a6b', '#394f43', .8);
    for (const [dx, dy] of [[.3, .3], [.3, 1.1], [2.4, .3], [2.4, 1.1]]) {
      ctx.save(); ctx.fillStyle = '#d8c4a2'; ctx.beginPath(); ctx.arc(t.X(37.2 + dx), t.Y(17.7 + dy), t.W(.12), 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    // terrace condensers
    for (let i = 0; i < 3; i++) {
      pxRect(ctx, t, 52.4, 7.2 + i * 2.2, 2.4, 1.4, '#cfd2c9', '#6f746c', .6);
      for (let j = 0; j < 4; j++) line(ctx, t.X(52.55), t.Y(7.45 + i * 2.2 + j * .3), t.X(53.7), t.Y(7.45 + i * 2.2 + j * .3), '#8b9087', .4);
    }
    // plants / columns
    for (const [x, y] of [[10.1, 8.7], [20.0, 21.5], [29.0, 21.5], [38.0, 21.5], [48.4, 9.0]]) plant(ctx, t, x, y, .22);
    // N storage
    for (let i = 0; i < 2; i++) shelf(ctx, t, 52.2, .65 + i * 1.05, 3.6, .45, 2);
    // W stair
    stairs(ctx, t, 39.85, 25.4, 4.4, 4.5, 'down', 2);
    // X elevator
    elevator(ctx, t, 44.8, 25.2, 4.4, 4.4, 'X', { doorSide: 'north' });
    // SE storage
    for (let i = 0; i < 2; i++) shelf(ctx, t, 49.8, 25.7 + i * 1.7, 5.8, .45, 2);

    /* ---- labels ---- */
    const boys = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    boys.forEach((id, i) => {
      roomTag(ctx, t, {
        x: 0.3 + i * 4.92, y: .3, w: 4.8, h: 5.6, letter: id,
        name: '男生宿舍', sub: '4.80 × 5.60', badgeColor: C.gold,
      });
    });
    const girls = ['O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V'];
    girls.forEach((id, i) => {
      roomTag(ctx, t, {
        x: 0.3 + i * 4.92, y: 24.5, w: 4.8, h: 5.6, letter: id,
        name: '女生宿舍', sub: '4.80 × 5.60', badgeColor: C.green,
      });
    });
    roomTag(ctx, t, { x: .3, y: 8.3, w: 6.0, h: 5.6, letter: 'K', name: '男生淋浴室', badgeColor: C.blue });
    roomTag(ctx, t, { x: .3, y: 14.02, w: 6.0, h: 5.6, letter: 'L', name: '女生淋浴室', badgeColor: C.blue });
    roomTag(ctx, t, { x: .3, y: 19.74, w: 6.0, h: 2.36, letter: '洗', name: '洗衣房', badgeColor: C.blue, compact: true });
    roomTag(ctx, t, { x: 6.42, y: 8.3, w: 3.0, h: 2.9, letter: 'Y', name: '男厕所', badgeColor: C.blue, compact: true });
    roomTag(ctx, t, { x: 6.42, y: 11.32, w: 3.0, h: 2.9, letter: 'Z', name: '女厕所', badgeColor: C.blue, compact: true });
    roomTag(ctx, t, { x: 9.54, y: 8.3, w: 39.84, h: 13.8, letter: 'M', name: '宿舍大厅', sub: '客厅 / 自习 / 活动', badgeColor: C.red });
    roomTag(ctx, t, { x: 51.9, y: .3, w: 4.2, h: 5.6, letter: 'N', name: '杂物间', badgeColor: C.ink2, compact: true });
    roomTag(ctx, t, { x: 39.66, y: 24.5, w: 4.8, h: 5.6, letter: 'W', name: '楼梯间', sub: '下至 1F', badgeColor: C.ink2 });
    roomTag(ctx, t, { x: 44.58, y: 24.5, w: 4.8, h: 5.6, letter: 'X', name: '电梯间', badgeColor: C.red });
    roomTag(ctx, t, { x: 49.5, y: 24.5, w: 6.6, h: 5.6, letter: '储', name: '女生储物', badgeColor: C.ink2, compact: true });

    // zone labels
    text(ctx, '公共客厅', t.X(11.6), t.Y(11.8), { size: 6.6, weight: 600, color: C.faint, bg: C.paper2 });
    text(ctx, '自习区', t.X(22.2), t.Y(9.55), { size: 6.6, weight: 600, color: C.faint, bg: C.paper2 });
    text(ctx, '活动区', t.X(38.0), t.Y(16.8), { size: 6.6, weight: 600, color: C.faint, bg: C.paper2 });
    text(ctx, '设备平台（不上人）', t.X(52.0), t.Y(15.0), { size: 5.8, weight: 600, color: C.faint, bg: C.paper2 });

    // existing model callout
    text(ctx, '已建单人宿舍 4.80 × 5.60 / 净高 2.80', t.X(1.1), t.Y(23.55), { size: 6.4, weight: 600, color: C.gold, bg: C.paper2 });

    // no-window bracket on girls' south wall
    ctx.save();
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(t.X(1.0), t.Y(30.65));
    ctx.lineTo(t.X(1.0), t.Y(30.9));
    ctx.lineTo(t.X(38.8), t.Y(30.9));
    ctx.lineTo(t.X(38.8), t.Y(30.65));
    ctx.stroke();
    ctx.restore();
    text(ctx, 'O–V 女生宿舍南墙无窗（原图设定）', t.X(19.9), t.Y(31.15), { size: 6.8, weight: 700, color: C.red, align: 'center', bg: C.paper2 });

    /* ---- dimensions ---- */
    dimH(ctx, t, 0, 56.4, -2.4, '56.40', { size: 8.2 });
    dimH(ctx, t, .3, 49.38, -1.35, '10 × 4.80 = 48.00', { size: 6.2 });
    dimH(ctx, t, 49.38, 51.9, -1.35, '2.40', { size: 6.0 });
    dimH(ctx, t, 51.9, 56.1, -1.35, '4.20', { size: 6.0 });
    dimV(ctx, t, 0, 30.4, -2.0, '30.40', { size: 8.2 });
    dimV(ctx, t, 0, 5.9, -1.05, '5.60', { size: 6.0 });
    dimV(ctx, t, 5.9, 8.3, -1.05, '2.40', { size: 6.0 });
    dimV(ctx, t, 8.3, 22.1, -1.05, '13.80', { size: 6.0 });
    dimV(ctx, t, 22.1, 24.5, -1.05, '2.40', { size: 6.0 });
    dimV(ctx, t, 24.5, 30.1, -1.05, '5.60', { size: 6.0 });

    planFooter(ctx, t, meta);
  }

  /* ===================================================================
   * A-03 · RECREATION · LEVEL 1
   * =================================================================== */
  function drawA03(canvas) {
    const meta = {
      num: 'A-03',
      level: 'PLAN 1F',
      title: '休憩区 1F 平面',
      subtitle: 'RECREATION WING · LEVEL 1 · A–I · 1:150',
      scale: '1:150',
      notes: [
        ['场馆尺度', 'A 篮球训练半场 12×7、B 排球/网球 12×7、C 羽毛球 2 片 + 乒乓球 1 台；均为训练级，不是比赛标准场。'],
        ['游泳馆', 'E 训练池 11×6 m，池边共 1.2 m 宽；设 4 道泳道、上下水扶梯与防滑池边。'],
        ['结构', 'A/B/C 与 D/E/F 之间为 2.40 m 中央走廊；G/H 核心筒与 2F 的 D/E 同轴。'],
        ['补齐', '东侧入口补 2.40 m 门厅与 3.00×2.40 m 公共卫生间；I 器材室南端补 3.0×3.0 m 更衣角。'],
        ['疏散', 'A/B/C 各自开向中央走廊的双开门；D/E/F/I 向北开门；东门厅为第二疏散口。'],
        ['声学', 'A/B 馆墙设吸音板，C 馆设弹性地胶；泳池厅独立排风，避免氯气进入健身区。'],
        ['比例', '本图 1:150；场馆净尺寸按墙内边计，设备区另留 1.0 m 安全通道。'],
        ['对齐', '1F G 楼梯 / H 电梯与 2F D 楼梯 / E 电梯上下同轴，见 A-04。'],
      ],
      stats: '主要面积：A 138.2 ㎡ · B 138.2 ㎡ · C 92.2 ㎡ · D 150.5 ㎡ · E 171.0 ㎡ · F 143.6 ㎡ · I 98.5 ㎡ · 1F 建筑面积约 1 210 ㎡。',
      footer: 'A-03 · 休憩区 1F · 1:150 · 尺寸单位 m',
    };

    const ctx = sheet(canvas, meta);
    const t = planT(50.4, 24.0, 150);
    meterGrid(ctx, t, 50.4, 24.0);

    /* ---- fills ---- */
    pxRect(ctx, t, .3, .3, 14.4, 9.6, C.greenSoft);
    pxRect(ctx, t, 14.82, .3, 14.4, 9.6, C.greenSoft);
    pxRect(ctx, t, 29.34, .3, 9.6, 9.6, C.greenSoft);
    pxRect(ctx, t, 39.06, .3, 5.4, 9.6, '#e9dcc6');
    pxRect(ctx, t, 44.58, .3, 5.52, 9.6, '#eadfc9');
    pxRect(ctx, t, .3, 9.9, 50.1, 2.4, '#eee3d1');
    pxRect(ctx, t, .3, 12.3, 13.2, 11.4, C.greenSoft);
    pxRect(ctx, t, 13.62, 12.3, 15.0, 11.4, C.blueSoft);
    pxRect(ctx, t, 28.74, 12.3, 12.6, 11.4, C.greenSoft);
    pxRect(ctx, t, 41.46, 12.3, 8.64, 11.4, '#efe5d4');
    pxRect(ctx, t, 13.9, 14.4, 11.0, 6.0, C.water);
    pxRect(ctx, t, 47.1, 7.5, 3.0, 2.4, C.wet);

    /* ---- walls ---- */
    const w = wallSet(ctx, t);
    w.h(0, 50.4, 0, .30);
    w.h(0, 50.4, 24.0, .30);
    w.v(0, 0, 24.0, .30);
    w.v(50.4, 0, 24.0, .30);

    w.v(14.76, .3, 9.9, .12);
    w.v(29.28, .3, 9.9, .12);
    w.v(39.0, .3, 9.9, .12);
    w.v(44.52, .3, 9.9, .12);
    w.h(.3, 44.46, 9.9, .12);
    w.h(44.46, 50.1, 9.9, .12);

    w.v(13.56, 12.3, 23.7, .12);
    w.v(28.68, 12.3, 23.7, .12);
    w.v(41.4, 12.3, 23.7, .12);
    w.h(.3, 50.1, 12.3, .12);

    // H core partitions
    w.v(47.1, 7.5, 9.9, .12);
    w.h(47.1, 50.1, 7.5, .12);

    // doors north row
    w.doorH(7.0, 9.9, 2.4, { double: true, swing: 1 });
    w.doorH(21.6, 9.9, 2.4, { double: true, swing: 1 });
    w.doorH(34.0, 9.9, 1.8, { double: true, swing: 1 });
    w.doorH(41.5, 9.9, 1.4, { hinge: 'left', swing: -1 });              // G
    w.doorH(45.6, 9.9, 1.1, { hinge: 'left', swing: 1 });               // H lobby
    w.doorH(48.0, 9.9, .9, { hinge: 'left', swing: -1 });               // WC
    // south row
    w.doorH(6.8, 12.3, 2.4, { double: true, swing: 1 });
    w.doorH(21.0, 12.3, 2.4, { double: true, swing: 1 });
    w.doorH(35.0, 12.3, 1.8, { double: true, swing: 1 });
    w.doorH(45.5, 12.3, 1.8, { double: true, swing: 1 });
    // east entrance
    w.doorV(50.4, 10.2, 2.0, { th: .30, double: true, hinge: 'top', swing: -1 });

    // windows
    w.windowH(2.2, 0, 2.8); w.windowH(8.0, 0, 2.8); w.windowH(12.0, 0, 1.8);
    w.windowH(17.0, 0, 2.8); w.windowH(22.0, 0, 2.8); w.windowH(26.0, 0, 2.2);
    w.windowH(31.0, 0, 2.2); w.windowH(35.5, 0, 2.2);
    w.windowH(2.2, 24.0, 3.0); w.windowH(6.8, 24.0, 3.0); w.windowH(11.0, 24.0, 1.8);
    w.windowH(15.0, 24.0, 3.0); w.windowH(20.0, 24.0, 3.0); w.windowH(25.0, 24.0, 3.0);
    w.windowH(30.5, 24.0, 3.0); w.windowH(35.0, 24.0, 3.0); w.windowH(39.0, 24.0, 2.0);
    w.windowH(43.5, 24.0, 2.0); w.windowH(47.5, 24.0, 2.0);
    w.windowV(0, 3.0, 3.0); w.windowV(0, 14.0, 3.0);
    w.windowV(50.4, 3.0, 2.0);
    w.draw();

    // H elevator + sliding door
    elevator(ctx, t, 44.9, 1.25, 2.2, 2.4, 'H', { doorSide: 'south' });
    pxRect(ctx, t, 45.4, 3.59, 1.2, .12, C.paper, null, 0);
    line(ctx, t.X(45.4), t.Y(3.65), t.X(46.6), t.Y(3.65), C.blue, 1.1);
    // H WC fixtures
    toilet(ctx, t, 49.4, 8.0, 0);
    sink(ctx, t, 47.4, 8.6, .55, .4);
    // G stair
    stairs(ctx, t, 39.3, 1.35, 4.9, 7.6, 'up', 2);

    /* ---- courts ---- */
    // A basketball half court
    pxRect(ctx, t, 1.1, 1.1, 12.0, 7.0, '#dfe8d8', '#6f8667', .9);
    line(ctx, t.X(1.1), t.Y(4.6), t.X(7.1), t.Y(4.6), '#6f8667', .7);
    ctx.save();
    ctx.strokeStyle = '#6f8667'; ctx.lineWidth = .8;
    ctx.beginPath(); ctx.arc(t.X(1.5), t.Y(4.6), t.W(1.4), -Math.PI / 2, Math.PI / 2); ctx.stroke();
    ctx.strokeRect(t.X(1.2), t.Y(3.4), t.W(2.8), t.W(2.4));
    ctx.beginPath(); ctx.arc(t.X(7.4), t.Y(4.6), t.W(2.2), Math.PI / 2, Math.PI * 1.5); ctx.stroke();
    ctx.restore();
    pxRect(ctx, t, 1.05, 4.1, .18, 1.0, '#d8c4a2', '#6d5a3f', .6);
    ctx.save(); ctx.strokeStyle = '#6d5a3f'; ctx.lineWidth = .7; ctx.beginPath(); ctx.arc(t.X(1.7), t.Y(4.6), t.W(.28), 0, Math.PI * 2); ctx.stroke(); ctx.restore();

    // B volleyball / tennis
    pxRect(ctx, t, 15.9, 1.2, 12.0, 7.0, '#dfe8d8', '#6f8667', .9);
    line(ctx, t.X(21.9), t.Y(1.2), t.X(21.9), t.Y(8.2), '#6f8667', .8);
    line(ctx, t.X(15.9), t.Y(4.7), t.X(27.9), t.Y(4.7), '#6f8667', .5);
    pxRect(ctx, t, 21.85, 1.2, .1, 7.0, '#8d7658', null, 0);
    ctx.save(); ctx.fillStyle = '#8d7658';
    for (const y of [1.2, 8.2]) ctx.fillRect(t.X(21.8), t.Y(y - .12), t.W(.2), t.W(.24));
    ctx.restore();

    // C badminton + table tennis
    for (const [yy, label] of [[1.2, '1'], [5.2, '2']]) {
      pxRect(ctx, t, 30.0, yy, 6.1, 3.05, '#dfe8d8', '#6f8667', .8);
      line(ctx, t.X(33.05), t.Y(yy), t.X(33.05), t.Y(yy + 3.05), '#6f8667', .6);
      line(ctx, t.X(30.0), t.Y(yy + 1.525), t.X(36.1), t.Y(yy + 1.525), '#6f8667', .45);
    }
    // one table tennis table
    pxRect(ctx, t, 36.6, 3.3, 2.3, 1.25, '#5f7a6b', '#394f43', .7);
    line(ctx, t.X(37.75), t.Y(3.3), t.X(37.75), t.Y(4.55), '#dce8d9', .7);

    // D five-a-side football
    pxRect(ctx, t, 1.0, 13.3, 12.0, 7.2, '#dfe8d8', '#6f8667', .9);
    line(ctx, t.X(7.0), t.Y(13.3), t.X(7.0), t.Y(20.5), '#6f8667', .5);
    ctx.save(); ctx.strokeStyle = '#6f8667'; ctx.lineWidth = .7;
    ctx.beginPath(); ctx.arc(t.X(7.0), t.Y(16.9), t.W(1.4), 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    pxRect(ctx, t, 1.0, 15.4, .35, 3.0, '#d8c4a2', '#6d5a3f', .6);
    pxRect(ctx, t, 12.65, 15.4, .35, 3.0, '#d8c4a2', '#6d5a3f', .6);

    // E pool
    pool(ctx, t, 14.0, 14.4, 11.0, 6.0);
    for (let i = 1; i < 4; i++) line(ctx, t.X(14.0 + i * 11 / 4), t.Y(14.4), t.X(14.0 + i * 11 / 4), t.Y(20.4), 'rgba(79,111,120,.35)', .5);

    // F gym
    gymEquip(ctx, t, 29.6, 14.0, 'treadmill');
    gymEquip(ctx, t, 31.0, 14.0, 'treadmill');
    gymEquip(ctx, t, 29.8, 17.2, 'weights');
    gymEquip(ctx, t, 31.6, 17.2, 'weights');
    pxRect(ctx, t, 34.0, 19.5, 5.8, 2.6, '#d3ddcc', '#6f8667', .6);
    for (let i = 0; i < 4; i++) pxRect(ctx, t, 34.3 + i * 1.3, 19.8, 1.0, .7, '#b7c3b0', null, 0);

    // I equipment
    shelf(ctx, t, 41.7, 12.8, 7.9, .5, 3);
    shelf(ctx, t, 41.7, 14.2, 3.2, .5, 2);
    shelf(ctx, t, 48.9, 15.0, .75, 4.2, 4);
    for (let i = 0; i < 3; i++) {
      ctx.save(); ctx.strokeStyle = '#8d7658'; ctx.lineWidth = .7;
      ctx.beginPath(); ctx.arc(t.X(46.8), t.Y(13.3 + i * .55), t.W(.25), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    // mats / ball bins / service desk
    for (let i = 0; i < 4; i++) pxRect(ctx, t, 42.0 + i * .9, 17.2, .7, 1.8, i % 2 ? '#c7d5c2' : '#b8c8b4', '#6f8667', .5);
    for (let i = 0; i < 3; i++) {
      ctx.save(); ctx.strokeStyle = '#8d7658'; ctx.lineWidth = .8;
      ctx.beginPath(); ctx.arc(t.X(42.4 + i * .75), t.Y(20.4), t.W(.3), 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(t.X(42.4 + i * .75), t.Y(20.4), t.W(.12), 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    pxRect(ctx, t, 41.9, 22.4, 3.0, .7, '#c9ad84', '#7f633f', .6);
    // changing corner in I
    pxRect(ctx, t, 47.2, 20.2, 2.7, 3.1, '#e3ece8', '#5f7772', .7);
    smallLabel(ctx, t, 47.4, 20.7, '更衣 3.0×3.0', { size: 5.6, color: C.blue });
    pxRect(ctx, t, 48.9, 21.0, .6, 1.6, '#cbb99e', '#8d7658', .5);

    /* ---- labels ---- */
    roomTag(ctx, t, { x: .3, y: .3, w: 14.4, h: 9.6, letter: 'A', name: '篮球馆', sub: '训练半场 12×7', badgeColor: C.green });
    roomTag(ctx, t, { x: 14.82, y: .3, w: 14.4, h: 9.6, letter: 'B', name: '排球 / 网球馆', sub: '12×7 训练场', badgeColor: C.green });
    roomTag(ctx, t, { x: 29.34, y: .3, w: 9.6, h: 9.6, letter: 'C', name: '羽毛球 / 乒乓球', sub: '2 片 + 1 台', badgeColor: C.green });
    roomTag(ctx, t, { x: 39.06, y: .3, w: 5.4, h: 9.6, letter: 'G', name: '楼梯间', sub: '上 2F', badgeColor: C.ink2 });
    badge(ctx, t.X(47.35), t.Y(.55), 'H', { size: 15, color: C.red });
    text(ctx, '电梯间', t.X(47.35) + 19, t.Y(.55) + 6, { size: 7.2, weight: 700, color: C.ink, bg: C.paper2 });
    text(ctx, '前室', t.X(45.0), t.Y(4.25), { size: 6.2, weight: 600, color: C.faint, bg: C.paper2 });
    roomTag(ctx, t, { x: 47.1, y: 7.5, w: 3.0, h: 2.4, letter: 'WC', name: '公共卫生间', badgeColor: C.blue, compact: true });
    roomTag(ctx, t, { x: .3, y: 12.3, w: 13.2, h: 11.4, letter: 'D', name: '小足球场', sub: '五人制 12×7', badgeColor: C.green });
    roomTag(ctx, t, { x: 13.62, y: 12.3, w: 15.0, h: 11.4, letter: 'E', name: '游泳馆', sub: '训练池 11×6', badgeColor: C.blue });
    roomTag(ctx, t, { x: 28.74, y: 12.3, w: 12.6, h: 11.4, letter: 'F', name: '健身房', sub: '有氧 + 力量', badgeColor: C.green });
    roomTag(ctx, t, { x: 41.46, y: 12.3, w: 8.64, h: 11.4, letter: 'I', name: '器材室', sub: '含更衣角', badgeColor: C.ink2 });

    // annotations
    smallLabel(ctx, t, 45.2, 4.2, '电梯', { size: 5.8, color: C.red });
    smallLabel(ctx, t, 45.0, 10.4, '东门厅', { size: 6.0, color: C.red });
    text(ctx, '中央走廊 2.40 m', t.X(1.0), t.Y(11.1), { size: 6.8, weight: 600, color: C.muted, bg: C.paper2 });
    text(ctx, '训练池 11×6 / 水深 1.2–1.6', t.X(14.2), t.Y(21.2), { size: 6.2, weight: 600, color: C.blue, bg: C.paper2 });

    /* ---- dimensions ---- */
    dimH(ctx, t, 0, 50.4, -2.4, '50.40', { size: 8.2 });
    dimH(ctx, t, .3, 14.7, -1.35, '14.40', { size: 6.2 });
    dimH(ctx, t, 14.82, 29.22, -1.35, '14.40', { size: 6.2 });
    dimH(ctx, t, 29.34, 38.94, -1.35, '9.60', { size: 6.2 });
    dimH(ctx, t, 39.06, 44.46, -1.35, '5.40', { size: 6.2 });
    dimH(ctx, t, 44.58, 50.1, -1.35, '5.52', { size: 6.2 });
    dimV(ctx, t, 0, 24.0, -2.0, '24.00', { size: 8.2 });
    dimV(ctx, t, 0, 9.9, -1.05, '9.60', { size: 6.0 });
    dimV(ctx, t, 9.9, 12.3, -1.05, '2.40', { size: 6.0 });
    dimV(ctx, t, 12.3, 23.7, -1.05, '11.40', { size: 6.0 });

    planFooter(ctx, t, meta);
  }

  /* ===================================================================
   * A-04 · RECREATION · LEVEL 2
   * =================================================================== */
  function drawA04(canvas) {
    const meta = {
      num: 'A-04',
      level: 'PLAN 2F',
      title: '休憩区 2F 平面',
      subtitle: 'RECREATION WING · LEVEL 2 · A–K · 1:150',
      scale: '1:150',
      notes: [
        ['功能带', '北侧 A 美术 / B 音乐美术 / C 信息；南侧 H 器材 / I 美术馆 / J 多功能 / K 游戏机房。'],
        ['J 补注', '原手绘图 J 房间存在但未注功能；本图暂定 J 多功能教室，家具可逆，便于改为社团活动室。'],
        ['竖向核心', 'D 楼梯 / E 电梯与 1F G 楼梯 / H 电梯同轴；F/G 男女厕所贴核心布置，管线集中。'],
        ['采光', 'A/B/C 北向高窗；H/I/J/K 南向窗；K 东端高窗；厕所靠机械排风，不设外窗。'],
        ['声学', 'B 音乐美术教室做双层隔声墙与吸音顶；K 游戏机房做吸音墙面，避免影响 I 美术馆。'],
        ['疏散', 'D 楼梯为 2F 主疏散口；东侧核心筒作为第二出口；走廊净宽 2.40 m。'],
        ['比例', '本图 1:150；教室按 1.0 m/座预留，美术教室按 1.8 ㎡/人控制。'],
        ['对齐', '2F D/E 与 1F G/H 完全同轴，见 A-03 与 A-05 的核心筒关系。'],
      ],
      stats: '主要面积：A 138.2 ㎡ · B 138.2 ㎡ · C 92.2 ㎡ · H 122.1 ㎡ · I 122.1 ㎡ · J 122.1 ㎡ · K 108.3 ㎡ · 2F 建筑面积约 1 210 ㎡。',
      footer: 'A-04 · 休憩区 2F · 1:150 · 尺寸单位 m',
    };

    const ctx = sheet(canvas, meta);
    const t = planT(50.4, 24.0, 150);
    meterGrid(ctx, t, 50.4, 24.0);

    /* ---- fills ---- */
    pxRect(ctx, t, .3, .3, 14.4, 9.6, '#f4ecde');
    pxRect(ctx, t, 14.82, .3, 14.4, 9.6, '#f4ecde');
    pxRect(ctx, t, 29.34, .3, 9.6, 9.6, '#eef1ea');
    pxRect(ctx, t, 39.06, .3, 5.4, 9.6, '#e9dcc6');
    pxRect(ctx, t, 44.58, .3, 2.52, 9.6, '#eadfc9');
    pxRect(ctx, t, 47.22, .3, 2.88, 9.6, '#eee3d1');
    pxRect(ctx, t, .3, 9.9, 50.1, 2.4, '#eee3d1');
    pxRect(ctx, t, .3, 12.3, 12.72, 11.4, '#efe5d4');
    pxRect(ctx, t, 13.14, 12.3, 12.72, 11.4, '#f5ecdf');
    pxRect(ctx, t, 25.98, 12.3, 12.72, 11.4, '#f4ecde');
    pxRect(ctx, t, 38.82, 12.3, 11.28, 11.4, '#ece3d2');
    pxRect(ctx, t, 44.58, 3.42, 2.52, 3.24, C.wet);
    pxRect(ctx, t, 44.58, 6.78, 2.52, 3.12, C.wet);

    /* ---- walls ---- */
    const w = wallSet(ctx, t);
    w.h(0, 50.4, 0, .30);
    w.h(0, 50.4, 24.0, .30);
    w.v(0, 0, 24.0, .30);
    w.v(50.4, 0, 24.0, .30);

    w.v(14.76, .3, 9.9, .12);
    w.v(29.28, .3, 9.9, .12);
    w.v(39.0, .3, 9.9, .12);
    w.v(44.52, .3, 9.9, .12);
    w.v(47.1, .3, 9.9, .12);
    w.h(.3, 44.46, 9.9, .12);
    w.h(47.1, 50.1, 9.9, .12);
    w.h(44.58, 47.1, 3.3, .12);
    w.h(44.58, 47.1, 6.66, .12);

    w.v(13.08, 12.3, 23.7, .12);
    w.v(25.92, 12.3, 23.7, .12);
    w.v(38.76, 12.3, 23.7, .12);
    w.h(.3, 50.1, 12.3, .12);

    // north rooms
    w.doorH(7.0, 9.9, 2.4, { double: true, swing: 1 });
    w.doorH(21.6, 9.9, 2.4, { double: true, swing: 1 });
    w.doorH(34.0, 9.9, 1.8, { double: true, swing: 1 });
    w.doorH(41.5, 9.9, 1.4, { hinge: 'left', swing: -1 });              // D
    w.doorH(47.6, 9.9, 1.2, { hinge: 'left', swing: -1 });              // east lobby
    // E/F/G doors from lobby
    w.doorV(47.1, 1.55, 1.0, { hinge: 'top', swing: 1 });
    w.doorV(47.1, 4.75, .9, { hinge: 'top', swing: 1 });
    w.doorV(47.1, 8.1, .9, { hinge: 'top', swing: 1 });
    // south rooms
    w.doorH(6.2, 12.3, 2.4, { double: true, swing: 1 });
    w.doorH(19.4, 12.3, 2.4, { double: true, swing: 1 });
    w.doorH(31.8, 12.3, 2.4, { double: true, swing: 1 });
    w.doorH(44.2, 12.3, 2.0, { double: true, swing: 1 });

    // windows
    w.windowH(2.4, 0, 3.0); w.windowH(8.0, 0, 3.0); w.windowH(12.2, 0, 1.8);
    w.windowH(17.2, 0, 3.0); w.windowH(22.2, 0, 3.0); w.windowH(26.2, 0, 2.2);
    w.windowH(31.2, 0, 2.4); w.windowH(35.5, 0, 2.2);
    w.windowH(2.4, 24.0, 3.0); w.windowH(7.0, 24.0, 3.0); w.windowH(11.4, 24.0, 1.8);
    w.windowH(15.2, 24.0, 3.0); w.windowH(20.2, 24.0, 3.0); w.windowH(24.0, 24.0, 1.8);
    w.windowH(27.8, 24.0, 3.0); w.windowH(32.5, 24.0, 3.0); w.windowH(36.3, 24.0, 1.8);
    w.windowH(40.0, 24.0, 3.0); w.windowH(45.0, 24.0, 3.0);
    w.windowV(50.4, 4.0, 2.0);
    w.windowV(0, 3.0, 3.0); w.windowV(0, 14.0, 3.0);
    w.draw();

    // E elevator car
    elevator(ctx, t, 44.8, .65, 2.1, 2.35, 'E', { doorSide: 'east' });
    pxRect(ctx, t, 47.04, 1.45, .12, 1.0, C.paper, null, 0);
    line(ctx, t.X(47.1), t.Y(1.45), t.X(47.1), t.Y(2.45), C.blue, 1.0);
    // D stair
    stairs(ctx, t, 39.3, 1.35, 4.9, 7.6, 'down', 2);

    // F male WC
    for (let i = 0; i < 3; i++) toilet(ctx, t, 45.0, 4.0 + i * .72, 0);
    for (let i = 0; i < 2; i++) pxRect(ctx, t, 46.2, 3.85 + i * .7, .35, .55, '#dfeae7', '#5f7772', .5);
    sink(ctx, t, 44.75, 6.1, .55, .4);
    // G female WC
    for (let i = 0; i < 4; i++) toilet(ctx, t, 45.0, 7.1 + i * .6, 0);
    sink(ctx, t, 44.75, 9.35, .55, .4);

    // A art studio
    for (let i = 0; i < 6; i++) {
      const x = 1.4 + (i % 3) * 4.2;
      const y = 1.5 + Math.floor(i / 3) * 4.0;
      ctx.save();
      ctx.strokeStyle = '#8d7658'; ctx.lineWidth = .7;
      ctx.beginPath();
      ctx.moveTo(t.X(x), t.Y(y + .9)); ctx.lineTo(t.X(x + .45), t.Y(y)); ctx.lineTo(t.X(x + .9), t.Y(y + .9)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(t.X(x + .15), t.Y(y + .55)); ctx.lineTo(t.X(x + .75), t.Y(y + .55)); ctx.stroke();
      ctx.restore();
    }
    table(ctx, t, 1.5, 7.0, 3.0, 1.2, 0);
    table(ctx, t, 8.0, 7.0, 3.0, 1.2, 0);
    pxRect(ctx, t, 12.9, 1.0, .9, 1.8, '#c7d5d2', '#5f7772', .6);
    sink(ctx, t, 13.0, 1.2, .6, .5);

    // B music/art studio
    pxRect(ctx, t, 17.5, 5.2, 2.6, 1.4, '#5c4b3d', '#2f261f', .8);
    for (let i = 0; i < 3; i++) pxRect(ctx, t, 17.7 + i * .8, 5.35, .6, .25, '#e7dcc9', null, 0);
    for (let i = 0; i < 8; i++) {
      const x = 16.0 + (i % 4) * 2.9;
      const y = 1.4 + Math.floor(i / 4) * 2.0;
      line(ctx, t.X(x), t.Y(y + .55), t.X(x), t.Y(y), '#6d5a3f', .8);
      line(ctx, t.X(x - .18), t.Y(y - .28), t.X(x + .18), t.Y(y - .28), '#6d5a3f', .6);
    }
    table(ctx, t, 24.5, 6.8, 2.8, 1.2, 0);
    table(ctx, t, 19.0, 8.0, 2.8, 1.2, 0);

    // C computer room
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const x = 30.0 + c * 2.15;
        const y = 1.2 + r * 2.2;
        pxRect(ctx, t, x, y, 1.5, .65, '#c9ad84', '#7f633f', .5);
        pxRect(ctx, t, x + .45, y + .1, .6, .3, '#5f6f78', null, 0);
        chair(ctx, t, x + .75, y + .95, .15);
      }
    }
    pxRect(ctx, t, 37.8, 1.0, .8, 1.8, '#5f596d', '#37323f', .6);

    // H materials
    for (let i = 0; i < 3; i++) shelf(ctx, t, 1.0, 13.0 + i * 1.5, 10.5, .45, 2);
    for (let i = 0; i < 4; i++) pxRect(ctx, t, 1.0 + i * 1.3, 21.5, 1.0, .7, '#cbb99e', '#8d7658', .5);

    // I gallery
    pxRect(ctx, t, 14.0, 14.0, .2, 6.0, '#8d7658', null, 0);
    pxRect(ctx, t, 20.5, 13.0, .2, 5.0, '#8d7658', null, 0);
    for (const [x, y] of [[15.0, 14.5], [18.0, 17.0], [22.0, 14.0], [24.0, 18.0]]) {
      pxRect(ctx, t, x, y, .7, .7, '#d8c4a2', '#8d7658', .6);
    }
    for (const [x, y] of [[14.3, 15.0], [14.3, 17.0], [20.8, 14.5], [20.8, 16.5]]) {
      pxRect(ctx, t, x, y, .06, 1.0, '#5f4a3a', null, 0);
    }
    bench(ctx, t, 16.0, 20.0, 3.0, .45);

    // J multipurpose
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) table(ctx, t, 26.5 + c * 3.6, 14.0 + r * 4.5, 2.4, 1.1, 4);
    pxRect(ctx, t, 26.5, 12.6, 10.0, .12, '#5f596d', null, 0);

    // K game room
    for (let i = 0; i < 5; i++) arcade(ctx, t, 39.3 + i * 1.2, 12.8, .9, 1.4);
    for (let i = 0; i < 3; i++) arcade(ctx, t, 39.3 + i * 1.2, 21.5, .9, 1.4);
    pxRect(ctx, t, 46.0, 16.2, 2.6, 1.4, '#5f7a6b', '#394f43', .8);
    for (const [dx, dy] of [[.3, .3], [.3, 1.1], [2.3, .3], [2.3, 1.1]]) {
      ctx.save(); ctx.fillStyle = '#d8c4a2'; ctx.beginPath(); ctx.arc(t.X(46.0 + dx), t.Y(16.2 + dy), t.W(.12), 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }

    /* ---- labels ---- */
    roomTag(ctx, t, { x: .3, y: .3, w: 14.4, h: 9.6, letter: 'A', name: '美术教室', sub: '6 画架 + 2 工作台', badgeColor: C.gold });
    roomTag(ctx, t, { x: 14.82, y: .3, w: 14.4, h: 9.6, letter: 'B', name: '音乐 / 美术教室', sub: '钢琴 + 8 谱架', badgeColor: C.gold });
    roomTag(ctx, t, { x: 29.34, y: .3, w: 9.6, h: 9.6, letter: 'C', name: '信息教室', sub: '12 机位 + 机柜', badgeColor: C.blue });
    roomTag(ctx, t, { x: 39.06, y: .3, w: 5.4, h: 9.6, letter: 'D', name: '楼梯间', sub: '下至 1F', badgeColor: C.ink2 });
    badge(ctx, t.X(47.35), t.Y(.55), 'E', { size: 15, color: C.red });
    text(ctx, '电梯间', t.X(47.35) + 19, t.Y(.55) + 6, { size: 7.2, weight: 700, color: C.ink, bg: C.paper2 });
    badge(ctx, t.X(44.68), t.Y(3.5), 'F', { size: 15, color: C.blue });
    line(ctx, t.X(44.95), t.Y(3.62), t.X(47.15), t.Y(3.62), C.blue, .5);
    text(ctx, '男厕所', t.X(47.25), t.Y(3.62), { size: 7.0, weight: 700, color: C.blue, bg: C.paper2 });
    badge(ctx, t.X(44.68), t.Y(6.85), 'G', { size: 15, color: C.blue });
    line(ctx, t.X(44.95), t.Y(6.97), t.X(47.15), t.Y(6.97), C.blue, .5);
    text(ctx, '女厕所', t.X(47.25), t.Y(6.97), { size: 7.0, weight: 700, color: C.blue, bg: C.paper2 });
    roomTag(ctx, t, { x: .3, y: 12.3, w: 12.72, h: 11.4, letter: 'H', name: '音乐 / 美术器材室', badgeColor: C.ink2 });
    roomTag(ctx, t, { x: 13.14, y: 12.3, w: 12.72, h: 11.4, letter: 'I', name: '美术馆', sub: '展墙 + 4 展台', badgeColor: C.gold });
    roomTag(ctx, t, { x: 25.98, y: 12.3, w: 12.72, h: 11.4, letter: 'J', name: '多功能教室', sub: '原图 J 未注 · 补齐', badgeColor: C.red });
    roomTag(ctx, t, { x: 38.82, y: 12.3, w: 11.28, h: 11.4, letter: 'K', name: '游戏机房', sub: '街机 + 台球', badgeColor: C.green });

    text(ctx, '二层走廊 2.40 m', t.X(1.0), t.Y(11.1), { size: 6.8, weight: 600, color: C.muted, bg: C.paper2 });
    text(ctx, '核心筒上下对齐：2F D/E ↔ 1F G/H', t.X(30.2), t.Y(10.9), { size: 6.4, weight: 600, color: C.faint, bg: C.paper2 });

    /* ---- dimensions ---- */
    dimH(ctx, t, 0, 50.4, -2.4, '50.40', { size: 8.2 });
    dimH(ctx, t, .3, 14.7, -1.35, '14.40', { size: 6.2 });
    dimH(ctx, t, 14.82, 29.22, -1.35, '14.40', { size: 6.2 });
    dimH(ctx, t, 29.34, 38.94, -1.35, '9.60', { size: 6.2 });
    dimH(ctx, t, 39.06, 44.46, -1.35, '5.40', { size: 6.2 });
    dimH(ctx, t, 44.58, 50.1, -1.35, '5.52', { size: 6.2 });
    dimV(ctx, t, 0, 24.0, -2.0, '24.00', { size: 8.2 });
    dimV(ctx, t, 0, 9.9, -1.05, '9.60', { size: 6.0 });
    dimV(ctx, t, 9.9, 12.3, -1.05, '2.40', { size: 6.0 });
    dimV(ctx, t, 12.3, 23.7, -1.05, '11.40', { size: 6.0 });

    planFooter(ctx, t, meta);
  }

  /* ===================================================================
   * A-05 · AUDITORIUM · LEVEL 3
   * =================================================================== */
  function drawA05(canvas) {
    const meta = {
      num: 'A-05',
      level: 'PLAN 3F',
      title: '礼堂 3F 平面',
      subtitle: 'AUDITORIUM · LEVEL 3 · A–N · 1:150',
      scale: '1:150',
      notes: [
        ['主厅', 'F 礼堂 35.40 × 23.40 m，10 排 × 44 座 = 440 座；中央 1.60 m 走道，两侧 1.20 m 走道。'],
        ['舞台', '舞台 14.00 × 5.00 m，台口 14.00 m；B/C 准备室分列两侧，A 电力调控 / D 舞台总控在后区。'],
        ['环廊', '四周 3.00 m 环形走廊连续；外侧墙无门、窗全部封死，仅通过四角电梯 / 楼梯进入环廊。'],
        ['四角核心', 'K/L/M/N 为客梯，G/H/I/J 为楼梯；楼梯只向下、无向上，符合原图“向下层，无向上”注记。'],
        ['补齐', '原图无座席与卫生间：补 440 座、后区无障碍座、男女卫生间、后台准备室与舞台飞塔。'],
        ['结构', '礼堂楼板由 9.0 m 柱网 + 600×900 楼面梁承托；舞台飞塔独立落柱，见 A-06 剖面。'],
        ['疏散', '440 座按 0.5 m/座控制；4 个出口即四角核心筒，环廊净宽 3.00 m，满足 3F 独立疏散。'],
        ['比例', '本图 1:150；座席为方案排布，施工图阶段按消防性能化复核。'],
      ],
      stats: '主要面积：F 礼堂 828.4 ㎡ · 舞台 70.0 ㎡ · B/C 准备室各 30.0 ㎡ · 环廊约 330 ㎡ · 3F 建筑面积约 1 400 ㎡（含四角核心）。',
      footer: 'A-05 · 礼堂 3F · 1:150 · 尺寸单位 m',
    };

    const ctx = sheet(canvas, meta);
    const t = planT(50.0, 38.0, 150);
    meterGrid(ctx, t, 50.0, 38.0);

    /* ---- fills ---- */
    pxRect(ctx, t, 4, 4, 42, 30, '#efe4d5');                       // main block
    pxRect(ctx, t, 7.3, 7.3, 35.4, 23.4, '#fbf3e5');               // hall
    pxRect(ctx, t, 7.3, 7.3, 35.4, 3.0, '#f6e3dd');                // north ring / backstage
    pxRect(ctx, t, 7.3, 30.7, 35.4, 3.0, '#f6e3dd');               // south ring / lobby
    pxRect(ctx, t, 18, 7.3, 14, 5.0, C.rose2);                     // stage
    pxRect(ctx, t, 12, 7.3, 6, 5.0, '#f2e7da');                    // B
    pxRect(ctx, t, 32, 7.3, 6, 5.0, '#f2e7da');                    // C
    pxRect(ctx, t, 7.3, 7.3, 4.7, 3.0, '#f4ecdd');                 // A
    pxRect(ctx, t, 38, 7.3, 4.7, 3.0, '#f4ecdd');                  // D
    pxRect(ctx, t, 7.3, 27.8, 3.0, 2.5, C.wet);                    // WC west
    pxRect(ctx, t, 39.7, 27.8, 3.0, 2.5, C.wet);                   // WC east

    // corner cores
    for (const [x, y] of [[0, 0], [44, 0], [0, 32], [44, 32]]) {
      pxRect(ctx, t, x, y, 6, 6, '#e9dcc6');
      hatchRect(ctx, t, x, y, 6, 6, 'rgba(124,112,96,.06)', 14);
    }

    /* ---- walls ---- */
    const w = wallSet(ctx, t);
    // main shell
    w.h(4, 46, 4, .40);
    w.h(4, 46, 34, .40);
    w.v(4, 4, 34, .40);
    w.v(46, 4, 34, .40);

    // ring / hall boundary
    w.h(7.3, 42.7, 7.3, .20);
    w.h(7.3, 42.7, 30.7, .20);
    w.v(7.3, 7.3, 30.7, .20);
    w.v(42.7, 7.3, 30.7, .20);

    // stage / prep
    w.h(12, 38, 12.3, .18);
    w.v(12, 7.3, 12.3, .18);
    w.v(18, 7.3, 12.3, .18);
    w.v(32, 7.3, 12.3, .18);
    w.v(38, 7.3, 12.3, .18);
    w.h(7.3, 12, 10.3, .18);
    w.h(38, 42.7, 10.3, .18);

    // WCs
    w.h(7.3, 10.3, 27.8, .15);
    w.v(10.3, 27.8, 30.3, .15);
    w.h(39.7, 42.7, 27.8, .15);
    w.v(39.7, 27.8, 30.3, .15);

    // core outer walls (simplified, four sides)
    for (const [x, y] of [[0, 0], [44, 0], [0, 32], [44, 32]]) {
      w.h(x, x + 6, y, .30);
      w.h(x, x + 6, y + 6, .30);
      w.v(x, y, y + 6, .30);
      w.v(x + 6, y, y + 6, .30);
    }

    // outer ring wall: solid, no doors, windows sealed
    // ring to hall doors
    w.doorV(7.3, 16.0, 2.0, { th: .20, double: true, hinge: 'top', swing: 1 });
    w.doorV(42.7, 16.0, 2.0, { th: .20, double: true, hinge: 'top', swing: -1 });
    w.doorH(12.0, 30.7, 2.0, { th: .20, double: true, swing: -1 });
    w.doorH(36.0, 30.7, 2.0, { th: .20, double: true, swing: -1 });

    // stage / prep doors
    w.doorH(22.0, 12.3, 2.6, { double: true, swing: 1 });            // stage front
    w.doorV(18, 9.8, 1.2, { hinge: 'top', swing: 1 });               // stage to B
    w.doorV(32, 9.8, 1.2, { hinge: 'top', swing: -1 });              // stage to C
    w.doorH(14.0, 7.3, 1.2, { hinge: 'left', swing: 1 });            // B to north ring
    w.doorH(36.0, 7.3, 1.2, { hinge: 'right', swing: 1 });           // C to north ring
    w.doorH(8.2, 7.3, 1.0, { hinge: 'left', swing: 1 });             // A
    w.doorH(40.8, 7.3, 1.0, { hinge: 'right', swing: 1 });           // D
    // WCs
    w.doorH(8.2, 27.8, .9, { hinge: 'left', swing: -1 });
    w.doorH(40.8, 27.8, .9, { hinge: 'left', swing: -1 });

    // core doors to ring (1.2 m each at inner corner)
    w.doorH(5.0, 6.0, 1.2, { th: .30, hinge: 'left', swing: 1 });
    w.doorH(44.0, 6.0, 1.2, { th: .30, hinge: 'right', swing: 1 });
    w.doorH(5.0, 32.0, 1.2, { th: .30, hinge: 'left', swing: -1 });
    w.doorH(44.0, 32.0, 1.2, { th: .30, hinge: 'right', swing: -1 });

    w.draw();

    // stage steps at center front
    for (let i = 0; i < 3; i++) {
      pxRect(ctx, t, 23.2 + i * .1, 12.3 + i * .28, 3.6 - i * .2, .28, '#d9c6a9', '#8d7658', .5);
    }

    /* ---- seating ---- */
    const rows = 10;
    const seatW = .58;
    const seatD = .48;
    for (let r = 0; r < rows; r++) {
      const y = 13.4 + r * .95 + (r >= 5 ? 1.2 : 0);
      const blocks = [
        { x: 11.5, n: 22 },
        { x: 25.8, n: 22 },
      ];
      for (const b of blocks) {
        for (let c = 0; c < b.n; c++) {
          const x = b.x + c * seatW;
          pxRect(ctx, t, x, y, .46, seatD, r % 2 ? '#d9c3ad' : '#ceb59f', '#b49a80', .35, null);
        }
      }
    }
    // side technical platforms / aisles
    for (const [x, label] of [[8.0, '侧廊'], [39.9, '侧廊']]) {
      pxRect(ctx, t, x, 12.9, 2.4, 10.8, null, C.lineSoft, .6, [3, 3]);
      ctx.save(); ctx.translate(t.X(x + 1.2), t.Y(18.2)); ctx.rotate(-Math.PI / 2);
      text(ctx, label, 0, 0, { size: 5.4, weight: 500, color: C.faint, align: 'center', bg: C.paper2 });
      ctx.restore();
    }
    // aisle label
    ctx.save(); ctx.translate(t.X(24.7), t.Y(19.4)); ctx.rotate(-Math.PI / 2);
    text(ctx, '1.50', 0, 0, { size: 5.6, weight: 600, color: C.faint, align: 'center', mono: true, bg: C.paper2 });
    ctx.restore();
    // rear wheelchair spaces
    for (const x of [8.0, 16.0, 34.0, 41.8]) {
      pxRect(ctx, t, x, 26.2, 1.0, 1.0, '#e7d6c2', C.blue, .6);
      text(ctx, '轮椅', t.X(x + .5), t.Y(26.7), { size: 4.4, weight: 700, color: C.blue, align: 'center' });
    }

    /* ---- core stairs / lifts ---- */
    // NW: G stair + K lift
    stairs(ctx, t, 2.94, .45, 2.4, 5.1, 'down', 1);
    elevator(ctx, t, .45, .55, 2.2, 2.2, 'K', { doorSide: 'south' });
    // NE: H stair + L lift
    stairs(ctx, t, 44.55, .45, 2.4, 5.1, 'down', 1);
    elevator(ctx, t, 47.35, .55, 2.2, 2.2, 'L', { doorSide: 'south' });
    // SW: I stair + M lift
    stairs(ctx, t, 2.94, 32.45, 2.4, 5.1, 'down', 1);
    elevator(ctx, t, .45, 35.25, 2.2, 2.2, 'M', { doorSide: 'north' });
    // SE: J stair + N lift
    stairs(ctx, t, 44.55, 32.45, 2.4, 5.1, 'down', 1);
    elevator(ctx, t, 47.35, 35.25, 2.2, 2.2, 'N', { doorSide: 'north' });

    // WC fixtures
    toilet(ctx, t, 8.0, 29.4, 0);
    sink(ctx, t, 9.4, 28.2, .55, .4);
    toilet(ctx, t, 41.0, 29.4, 0);
    sink(ctx, t, 40.2, 28.2, .55, .4);

    /* ---- labels ---- */
    badge(ctx, t.X(23.0), t.Y(28.7), 'F', { size: 20, color: C.red });
    text(ctx, '礼堂', t.X(23.0) + 26, t.Y(28.7) + 7, { size: 12, weight: 700, color: C.ink, bg: C.paper2 });
    text(ctx, '10 排 × 44 座 = 440 座', t.X(23.0) + 26, t.Y(28.7) + 21, { size: 6.8, weight: 500, color: C.muted, bg: C.paper2 });
    roomTag(ctx, t, { x: 18, y: 7.3, w: 14, h: 5, letter: '舞', name: '舞台', sub: '14.0 × 5.0', badgeColor: C.ink2 });
    roomTag(ctx, t, { x: 12, y: 7.3, w: 6, h: 5, letter: 'B', name: '准备室', badgeColor: C.ink2, compact: true });
    roomTag(ctx, t, { x: 32, y: 7.3, w: 6, h: 5, letter: 'C', name: '准备室', badgeColor: C.ink2, compact: true });
    roomTag(ctx, t, { x: 7.3, y: 7.3, w: 4.7, h: 3, letter: 'A', name: '电力调控房', badgeColor: C.blue, compact: true });
    roomTag(ctx, t, { x: 38, y: 7.3, w: 4.7, h: 3, letter: 'D', name: '舞台总控室', badgeColor: C.blue, compact: true });
    roomTag(ctx, t, { x: 7.3, y: 27.8, w: 3.0, h: 2.5, letter: 'WC', name: '男卫', badgeColor: C.blue, compact: true });
    roomTag(ctx, t, { x: 39.7, y: 27.8, w: 3.0, h: 2.5, letter: 'WC', name: '女卫', badgeColor: C.blue, compact: true });

    // core labels
    for (const [x1, x2, y1, y2, s, e] of [
      [3.6, 1.55, 5.55, 3.15, 'G 楼梯', 'K 电梯'],
      [45.1, 48.45, 5.55, 3.15, 'H 楼梯', 'L 电梯'],
      [3.6, 1.55, 32.1, 34.65, 'I 楼梯', 'M 电梯'],
      [45.1, 48.45, 32.1, 34.65, 'J 楼梯', 'N 电梯'],
    ]) {
      text(ctx, s, t.X(x1), t.Y(y1), { size: 5.6, weight: 700, color: C.red, bg: C.paper2 });
      text(ctx, e, t.X(x2), t.Y(y2), { size: 5.4, weight: 600, color: C.muted, bg: C.paper2 });
    }

    // ring labels
    text(ctx, '环形走廊 3.00', t.X(24.8), t.Y(5.6), { size: 6.8, weight: 600, color: C.muted, align: 'center', bg: C.paper2 });
    text(ctx, '环形走廊 3.00', t.X(24.8), t.Y(32.4), { size: 6.8, weight: 600, color: C.muted, align: 'center', bg: C.paper2 });
    ctx.save(); ctx.translate(t.X(5.7), t.Y(19.0)); ctx.rotate(-Math.PI / 2);
    text(ctx, '环形走廊 3.00', 0, 0, { size: 6.8, weight: 600, color: C.muted, align: 'center', bg: C.paper2 });
    ctx.restore();
    ctx.save(); ctx.translate(t.X(44.3), t.Y(19.0)); ctx.rotate(-Math.PI / 2);
    text(ctx, '环形走廊 3.00', 0, 0, { size: 6.8, weight: 600, color: C.muted, align: 'center', bg: C.paper2 });
    ctx.restore();

    text(ctx, '环廊外墙：无门 · 窗全部封死', t.X(25.0), t.Y(35.1), { size: 6.8, weight: 700, color: C.red, align: 'center', bg: C.paper2 });
    text(ctx, '后台 / 舞台飞塔', t.X(25.0), t.Y(6.1), { size: 6.2, weight: 600, color: C.faint, align: 'center', bg: C.paper2 });

    // section mark
    sectionMarkH(ctx, t, 19.0, 'A');

    /* ---- dimensions ---- */
    dimH(ctx, t, 0, 50.0, -2.8, '50.00', { size: 8.2 });
    dimH(ctx, t, 4, 46, -1.9, '42.00', { size: 6.4 });
    dimH(ctx, t, 7.3, 42.7, -1.2, '35.40', { size: 6.4 });
    dimV(ctx, t, 0, 38.0, -2.6, '38.00', { size: 8.2 });
    dimV(ctx, t, 4, 34, -1.7, '30.00', { size: 6.4 });
    dimV(ctx, t, 7.3, 30.7, -1.0, '23.40', { size: 6.4 });
    dimV(ctx, t, 7.3, 12.3, 47.0, '5.00', { size: 6.0 });

    planFooter(ctx, t, meta);
  }

  /* ===================================================================
   * A-06 · SOUTH ELEVATION / 礼堂南面视图
   * Per the user's explanation of hand sketch 4:
   *  - the 3F hall is a large square volume above an otherwise EMPTY space;
   *  - only five columns stand below it: four small 1x1 columns near the
   *    four corners, one 2x2 center column (4x area);
   *  - a hidden lift sits inside the center column, marked but not built;
   *  - the two side stairs belong to recreation / teaching, with their
   *    lifts shown beside the stairs;
   *  - the ring corridor around the hall has a solid outer wall: no doors,
   *    windows sealed.
   * =================================================================== */
  function drawA06(canvas) {
    const meta = {
      num: 'A-06',
      level: 'SOUTH VIEW',
      title: '礼堂南面视图',
      subtitle: 'SOUTH ELEVATION · 3F HALL ON FIVE COLUMNS · 1:150',
      scale: '1:150',
      noNorth: true,
      notes: [
        ['空腔', '礼堂下方除五根支撑柱外无任何物品：无楼板、无墙体、无设备；南面视图直接看到柱子之间的空腔。'],
        ['支撑柱', '四根 1.00×1.00 m 小柱靠近礼堂大正方形的四角；正中心一根 2.00×2.00 m 大柱，面积正好为小柱的 4 倍。'],
        ['隐藏电梯', '中心大柱下方藏一部电梯，仅在柱内用虚线标出；不制作，也不在礼堂上层地板标注，后续另行说明。'],
        ['两侧楼梯', '左右楼梯分别属于休闲区与教学区；每侧楼梯立面 8 格，下 4 格为 1F、上 4 格为 2F，中间楼板分层。'],
        ['电梯位置', '按其他图纸修正：电梯在楼梯间旁边，不再画在楼梯正后方；每侧楼梯旁各设一部电梯。'],
        ['环廊', '礼堂四周一圈环廊，是生活区 / 休闲区 / 教学区 / 损毁区四区 1F/2F 的分界；环廊外侧墙无门、窗全部封死。'],
        ['比例', '南面视图 1:150；右下支撑柱示意图与四区索引为关系图，不按比例。'],
        ['说明', '图中“隐藏电梯”仅示意位置，不进入 3D 模型；礼堂上层平面不重复表达。'],
      ],
      stats: '控制尺寸：礼堂大正方形 50.00 × 38.00 m · 柱距 34.00 m · 小柱 1.00×1.00 · 中柱 2.00×2.00 · 环廊高 3.00 m。',
      footer: 'A-06 · 礼堂南面视图 · 1:150 · 尺寸单位 m',
    };

    const ctx = sheet(canvas, meta);
    const S = PXM(150);
    const OX = 90;
    const OY = 820;
    const X = (x) => OX + x * S;
    const Y = (y) => OY - y * S;
    const L = (v) => v * S;

    // light 2m grid behind elevation
    ctx.save();
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = .45;
    for (let x = 0; x <= 50; x += 2) {
      ctx.beginPath(); ctx.moveTo(X(x), Y(0)); ctx.lineTo(X(x), Y(20)); ctx.stroke();
    }
    for (let y = 0; y <= 20; y += 2) {
      ctx.beginPath(); ctx.moveTo(X(0), Y(y)); ctx.lineTo(X(50), Y(y)); ctx.stroke();
    }
    ctx.restore();

    // ground / foundation
    rect(ctx, X(-1), Y(0), L(52), L(.55), '#ddd2c1', C.ink, .8);
    ctx.save();
    ctx.strokeStyle = 'rgba(124,112,96,.25)';
    ctx.lineWidth = .6;
    for (let x = -1; x < 51; x += 1.2) {
      ctx.beginPath(); ctx.moveTo(X(x), Y(0)); ctx.lineTo(X(x) + 14, Y(-1.2)); ctx.stroke();
    }
    ctx.restore();

    const srect = (x, y, w, h, fill = null, stroke = C.wall, lw = .8, dash = null) => {
      rect(ctx, X(x), Y(y + h), L(w), L(h), fill, stroke, lw, dash);
    };
    const sline = (x1, y1, x2, y2, color = C.wall, lw = .8, dash = null) => {
      line(ctx, X(x1), Y(y1), X(x2), Y(y2), color, lw, dash);
    };
    const column = (x, y0, y1, w, h = w, dash = null) => {
      srect(x - w / 2, y0, w, y1 - y0, '#cdbda7', dash ? C.red : C.wall, .9, dash);
      hatchRect(ctx, { X, Y, W: L }, x - w / 2, y0, w, y1 - y0, 'rgba(90,78,62,.28)', 7);
    };

    // empty space under the hall (paper only; no floor, no wall)
    srect(8, 0, 34, 9.0, null, null, 0);

    /* ---- four small columns + one large centre column ---- */
    // front pair visible (solid); rear pair dashed behind
    column(11.0, 0, 9.0, 1.0);
    column(39.0, 0, 9.0, 1.0);
    column(13.0, 0, 9.0, 1.0, 1.0, [5, 4]);
    column(37.0, 0, 9.0, 1.0, 1.0, [5, 4]);
    // centre 2x2 column
    column(25.0, 0, 9.0, 2.0, 2.0);
    // hidden lift inside centre column
    srect(24.35, 0.15, 1.3, 8.7, null, C.red, .85, [5, 4]);
    sline(24.35, 4.8, 25.65, 4.8, C.red, .6);
    text(ctx, '隐藏电梯', X(25.0), Y(5.35), { size: 5.2, weight: 700, color: C.red, align: 'center', bg: C.paper2 });
    text(ctx, '不制作', X(25.0), Y(4.65), { size: 5.0, weight: 600, color: C.red, align: 'center', bg: C.paper2 });

    // labels for columns
    text(ctx, '四角小柱 1×1', X(9.3), Y(2.1), { size: 5.8, weight: 700, color: C.red, bg: C.paper2 });
    text(ctx, '中柱 2×2（4 倍面积）', X(25.0), Y(1.2), { size: 5.8, weight: 700, color: C.red, align: 'center', bg: C.paper2 });
    text(ctx, '礼堂下方净空 / 除柱外无物', X(25.0), Y(7.7), { size: 6.2, weight: 700, color: C.muted, align: 'center', bg: C.paper2 });

    /* ---- 3F ring corridor ---- */
    srect(8, 9.0, 34, .4, '#ded2bf', C.wall, .9);
    srect(8, 9.4, 34, 3.0, '#e7d9c6', C.wall, .9);
    // solid panel joints, no windows or doors
    for (let i = 1; i < 12; i++) sline(8 + i * 34 / 12, 9.5, 8 + i * 34 / 12, 12.3, 'rgba(90,78,62,.35)', .45);
    sline(8.1, 10.9, 41.9, 10.9, 'rgba(90,78,62,.35)', .45);
    sline(8.1, 11.9, 41.9, 11.9, 'rgba(90,78,62,.35)', .45);
    // side returns of the ring
    srect(7.0, 9.0, 1.0, 3.4, '#d8cbb8', C.wall, .8);
    srect(42.0, 9.0, 1.0, 3.4, '#d8cbb8', C.wall, .8);

    /* ---- hall facade above ring ---- */
    srect(8, 12.4, 34, 5.0, '#f1e3d5', C.wall, .9);
    for (let i = 1; i < 10; i++) sline(8 + i * 34 / 10, 12.55, 8 + i * 34 / 10, 17.3, 'rgba(90,78,62,.22)', .5);
    sline(8.1, 15.0, 41.9, 15.0, 'rgba(90,78,62,.22)', .5);
    // roof + parapet
    srect(7.4, 17.4, 35.2, .5, '#d6c9b6', C.wall, .9);
    srect(7.4, 17.9, 35.2, .2, '#c8b9a2', C.wall, .5);

    // hall label
    text(ctx, '3F 礼堂', X(25.0), Y(15.9), { size: 13, weight: 700, color: C.red, align: 'center', bg: C.paper2 });
    text(ctx, '大正方形 50.00 × 38.00', X(25.0), Y(14.9), { size: 6.4, weight: 600, color: C.muted, align: 'center', bg: C.paper2 });

    /* ---- ring corridor annotation ---- */
    text(ctx, '环形走廊', X(25.0), Y(11.35), { size: 8.0, weight: 700, color: C.ink2, align: 'center', bg: C.paper2 });
    text(ctx, '外侧墙无门 · 窗全部封死', X(25.0), Y(10.45), { size: 6.0, weight: 700, color: C.red, align: 'center', bg: C.paper2 });
    text(ctx, '四区 1F/2F 分界', X(25.0), Y(9.7), { size: 5.6, weight: 500, color: C.faint, align: 'center', bg: C.paper2 });

    /* ---- two side stairs + adjacent lifts ---- */
    // side core walls
    for (const [x0, x1] of [[0, 8], [42, 50]]) {
      srect(x0, 0, .4, 9.0, '#d8cbb8', C.wall, .8);
      srect(x1 - .4, 0, .4, 9.0, '#d8cbb8', C.wall, .8);
      srect(x0, 8.6, 8, .4, '#d6c9b6', C.wall, .8);
    }
    // left recreation stair: 2 x 4 cells, lower 4 / upper 4
    drawStairElevation(ctx, X, Y, L, 0.8, 4.0, 0.0, 9.0);
    // right teaching stair
    drawStairElevation(ctx, X, Y, L, 45.4, 4.0, 0.0, 9.0);
    // lifts beside stairs (left: 5.2..7.4; right: 42.6..44.8)
    drawLiftElevation(ctx, X, Y, L, 5.2, 2.2, 9.0, 0.0);
    drawLiftElevation(ctx, X, Y, L, 42.6, 2.2, 9.0, 0.0);

    // stair / lift labels
    text(ctx, '休闲区楼梯', X(2.9), Y(9.35), { size: 6.0, weight: 700, color: C.ink2, align: 'center', bg: C.paper2 });
    text(ctx, '教学区楼梯', X(47.1), Y(9.35), { size: 6.0, weight: 700, color: C.ink2, align: 'center', bg: C.paper2 });
    text(ctx, '下四格 1F', X(2.9), Y(3.1), { size: 4.8, weight: 600, color: C.faint, align: 'center', bg: C.paper2 });
    text(ctx, '上四格 2F', X(2.9), Y(6.9), { size: 4.8, weight: 600, color: C.faint, align: 'center', bg: C.paper2 });
    text(ctx, '电梯', X(6.3), Y(3.6), { size: 5.4, weight: 700, color: C.red, align: 'center', bg: C.paper2 });
    text(ctx, '电梯', X(43.7), Y(3.6), { size: 5.4, weight: 700, color: C.red, align: 'center', bg: C.paper2 });

    // level lines + labels
    for (const [yy, label] of [[0, '±0.000'], [4.8, '+4.800'], [9.0, '+9.000'], [12.4, '+12.400'], [17.4, '+17.400'], [17.9, '+17.900']]) {
      sline(-1.0, yy, 51.0, yy, C.lineSoft, .55, [4, 4]);
      text(ctx, label, X(-1.2), Y(yy) - 8, { size: 6.2, weight: 600, color: C.muted, align: 'right', mono: true, bg: C.paper });
    }

    /* ---- level table ---- */
    const lx = 100, ly = 148;
    rect(ctx, lx, ly, 348, 202, 'rgba(251,246,236,.55)', C.line, .7);
    text(ctx, '竖向标高 / LEVELS', lx + 14, ly + 17, { size: 7.8, weight: 700, color: C.red, mono: true });
    line(ctx, lx + 13, ly + 28, lx + 335, ly + 28, C.lineSoft, .6);
    const levels = [
      ['+17.900', '礼堂女儿墙'],
      ['+17.400', '礼堂屋面'],
      ['+12.400', '环廊顶'],
      ['+9.000', '3F 环廊 / 礼堂楼面'],
      ['+4.800', '2F 楼面'],
      ['±0.000', '1F 地面'],
    ];
    levels.forEach(([lv, name], i) => {
      const yy = ly + 44 + i * 25;
      text(ctx, lv, lx + 14, yy, { size: 7.8, weight: 700, color: C.ink, mono: true });
      text(ctx, name, lx + 110, yy, { size: 6.6, weight: 500, color: C.muted });
      line(ctx, lx + 13, yy + 11, lx + 335, yy + 11, C.lineSoft, .5);
    });

    /* ---- four-zone key plan ---- */
    const kx = 1120, ky = 140, kw = 190, kh = 158;
    rect(ctx, kx, ky, kw, kh, 'rgba(251,246,236,.55)', C.line, .7);
    text(ctx, '四区关系索引 / 非按比例', kx + 7, ky + 13, { size: 5.8, weight: 700, color: C.red });
    rect(ctx, kx + 60, ky + 48, 70, 60, C.rose, C.red, .7);
    text(ctx, '礼堂', kx + 95, ky + 78, { size: 7.2, weight: 700, color: C.red, align: 'center' });
    rect(ctx, kx + 7, ky + 28, 45, 28, C.tan, C.line, .5);
    text(ctx, '生活区', kx + 29, ky + 42, { size: 5.4, weight: 600, color: C.ink2, align: 'center' });
    rect(ctx, kx + 138, ky + 28, 45, 28, '#e7e0d4', C.line, .5, [3, 2]);
    text(ctx, '损毁区', kx + 160, ky + 42, { size: 5.4, weight: 600, color: C.muted, align: 'center' });
    rect(ctx, kx + 7, ky + 104, 45, 28, C.greenSoft, C.line, .5);
    text(ctx, '休闲区', kx + 29, ky + 118, { size: 5.4, weight: 600, color: C.ink2, align: 'center' });
    rect(ctx, kx + 138, ky + 104, 45, 28, C.blueSoft, C.line, .5);
    text(ctx, '教学区', kx + 160, ky + 118, { size: 5.4, weight: 600, color: C.ink2, align: 'center' });
    text(ctx, 'N ↑', kx + 168, ky + 15, { size: 6.2, weight: 700, color: C.red, mono: true });

    /* ---- support-column diagram: 4 small + 1 large centre ---- */
    const sx = 1120, sy = 310, sw = 190, sh = 206;
    rect(ctx, sx, sy, sw, sh, 'rgba(251,246,236,.55)', C.line, .7);
    text(ctx, '支撑柱示意图 / 非按比例', sx + 7, sy + 13, { size: 5.8, weight: 700, color: C.red });
    // hall square in inset
    const hx = sx + 25, hy = sy + 32, hw = 140, hh = 142;
    ctx.save(); ctx.strokeStyle = C.ink2; ctx.lineWidth = .8; ctx.strokeRect(hx, hy, hw, hh);
    ctx.strokeStyle = C.red; ctx.setLineDash([4, 3]); ctx.lineWidth = .6;
    ctx.strokeRect(hx + 12, hy + 12, hw - 24, hh - 24); ctx.restore();
    // four small 1x1 columns near corners
    for (const [cx, cy] of [[hx + 16, hy + 16], [hx + hw - 16, hy + 16], [hx + 16, hy + hh - 16], [hx + hw - 16, hy + hh - 16]]) {
      rect(ctx, cx - 5, cy - 5, 10, 10, C.ink2);
    }
    // central 2x2 column (twice the width, four times the area)
    const ccx = hx + hw / 2, ccy = hy + hh / 2;
    rect(ctx, ccx - 10, ccy - 10, 20, 20, C.ink2);
    // hidden lift dashed inside
    ctx.save(); ctx.strokeStyle = C.red; ctx.setLineDash([3, 2]); ctx.lineWidth = .7;
    ctx.strokeRect(ccx - 4, ccy - 4, 8, 8); ctx.restore();
    text(ctx, '隐藏电梯', ccx, ccy + 16, { size: 4.8, weight: 700, color: C.red, align: 'center', bg: C.paper2 });
    text(ctx, '小柱 1×1', hx + 18, hy + hh - 8, { size: 4.8, weight: 600, color: C.muted, bg: C.paper2 });
    text(ctx, '中柱 2×2 / 4 倍面积', ccx, hy + hh + 8, { size: 4.8, weight: 600, color: C.muted, align: 'center', bg: C.paper2 });
    text(ctx, '礼堂大正方形', ccx, sy + 26, { size: 4.8, weight: 600, color: C.faint, align: 'center', bg: C.paper2 });

    /* ---- dimensions ---- */
    const dimY = -2.2;
    sline(0, dimY, 50, dimY, C.muted, .6);
    for (const xx of [0, 8, 42, 50]) sline(xx, dimY - .5, xx, dimY + .5, C.muted, .6);
    text(ctx, '50.00', X(25), Y(dimY) + 12, { size: 7.6, weight: 600, color: C.muted, align: 'center', mono: true, bg: C.paper });
    text(ctx, '8.00', X(4), Y(dimY) + 26, { size: 6.2, weight: 600, color: C.muted, align: 'center', mono: true, bg: C.paper });
    text(ctx, '34.00', X(25), Y(dimY) + 26, { size: 6.6, weight: 600, color: C.muted, align: 'center', mono: true, bg: C.paper });
    text(ctx, '8.00', X(46), Y(dimY) + 26, { size: 6.2, weight: 600, color: C.muted, align: 'center', mono: true, bg: C.paper });

    // vertical dimension at right
    const dimX = 51.6;
    sline(dimX, 0, dimX, 17.9, C.muted, .6);
    for (const yy of [0, 4.8, 9.0, 12.4, 17.4, 17.9]) sline(dimX - .4, yy, dimX + .4, yy, C.muted, .6);
    for (const [a, b, label] of [[0, 4.8, '4.80'], [4.8, 9.0, '4.20'], [9.0, 12.4, '3.40'], [12.4, 17.4, '5.00']]) {
      ctx.save(); ctx.translate(X(dimX) + 12, (Y(a) + Y(b)) / 2); ctx.rotate(-Math.PI / 2);
      text(ctx, label, 0, 0, { size: 6.0, weight: 600, color: C.muted, align: 'center', mono: true, bg: C.paper });
      ctx.restore();
    }

    text(ctx, '南', X(-1.6), Y(19.4), { size: 10, weight: 700, color: C.red, align: 'center' });

    const t = { W: L, denom: 150, mw: 50, mh: 18, X, Y };
    planFooter(ctx, t, meta);
  }

  /* 8-cell stair elevation: lower 4 / upper 4, split at mid-floor. */
  function drawStairElevation(ctx, X, Y, L, x, w, y0, y1) {
    rect(ctx, X(x), Y(y1), L(w), L(y1 - y0), '#e7dcc9', C.wall, .7);
    const mid = (y0 + y1) / 2;
    const cols = 2, rows = 4;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cw = w / cols, ch = (y1 - y0) / rows;
        const cx = x + c * cw, cy = y0 + r * ch;
        rect(ctx, X(cx + .12), Y(cy + ch - .12), L(cw - .24), L(ch - .24), r < 2 ? '#d6e4e1' : '#efe5d4', C.ink2, .45);
        // stair zig-zag behind each opening
        const midY = cy + ch / 2;
        for (let k = 0; k < 3; k++) {
          line(ctx, X(cx + .2 + k * (cw - .4) / 3), Y(midY), X(cx + .2 + (k + 1) * (cw - .4) / 3), Y(midY), 'rgba(90,78,62,.28)', .4);
        }
      }
    }
    // floor split line
    line(ctx, X(x), Y(mid), X(x + w), Y(mid), C.red, 1.0);
    text(ctx, '1F', X(x + w + .2), Y(y0 + (y1 - y0) * .25), { size: 4.6, weight: 700, color: C.faint, mono: true, bg: C.paper2 });
    text(ctx, '2F', X(x + w + .2), Y(y0 + (y1 - y0) * .78), { size: 4.6, weight: 700, color: C.faint, mono: true, bg: C.paper2 });
  }

  /* Adjacent lift elevation with doors on both floors. */
  function drawLiftElevation(ctx, X, Y, L, x, w, yTop, yBot) {
    rect(ctx, X(x), Y(yTop), L(w), L(yTop - yBot), '#eadfc9', C.wall, .7);
    // doors at each floor
    for (const [d0, d1] of [[0.6, 4.1], [5.3, 8.4]]) {
      rect(ctx, X(x + .3), Y(d1), L(w - .6), L(d1 - d0), '#d9e6e3', C.blue, .55);
      line(ctx, X(x + w / 2), Y(d1), X(x + w / 2), Y(d0), C.blue, .7);
      line(ctx, X(x + .3), Y((d0 + d1) / 2), X(x + w - .3), Y((d0 + d1) / 2), C.blue, .4);
    }
    // shaft top
    rect(ctx, X(x), Y(yTop), L(w), L(.35), '#c8b9a2', C.wall, .5);
  }

  /* ---------- registry ---------- */
  const SHEETS = {
    a01: drawA01,
    a02: drawA02,
    a03: drawA03,
    a04: drawA04,
    a05: drawA05,
    a06: drawA06,
  };

  function drawSheet(id, targetCanvas = null, forcedScale = null) {
    const canvas = targetCanvas || document.getElementById(id);
    if (!canvas || !SHEETS[id]) return null;
    if (forcedScale) {
      const prev = window.__ATLAS_FORCE_SCALE__;
      window.__ATLAS_FORCE_SCALE__ = forcedScale;
      SHEETS[id](canvas);
      window.__ATLAS_FORCE_SCALE__ = prev;
    } else {
      SHEETS[id](canvas);
    }
    return canvas;
  }

  function drawAll() {
    Object.keys(SHEETS).forEach((id) => drawSheet(id));
  }

  /* ---------- downloads ---------- */
  function downloadCanvas(id) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = `special-school-${id}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  }

  function toast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 1800);
  }

  /* ---------- lightbox ---------- */
  function initLightbox() {
    const lb = document.getElementById('lightbox');
    const stage = document.getElementById('lightboxStage');
    const zoomCanvas = document.getElementById('lightboxCanvas');
    const title = document.getElementById('lightboxTitle');
    const zl = document.getElementById('zoomLevel');
    if (!lb || !stage || !zoomCanvas) return;

    let zoom = 1, panX = 0, panY = 0, dragging = false, start = null;
    const RENDER_SCALE = 4;

    const apply = () => {
      zoomCanvas.style.transform = `translate(${panX}px,${panY}px) scale(${zoom})`;
      if (zl) zl.textContent = `${Math.round(zoom * 100)}%`;
    };
    const setZoom = (v) => { zoom = clamp(v, .4, 4); apply(); };
    const reset = () => { zoom = 1; panX = 0; panY = 0; apply(); };

    window.__openAtlasLightbox = (id) => {
      const source = document.getElementById(id);
      if (!source) return;
      drawSheet(id, zoomCanvas, RENDER_SCALE);
      if (title) title.textContent = `${id.toUpperCase()} · 4× 高清 · ${source.getAttribute('aria-label') || ''}`;
      reset();
      lb.hidden = false;
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    const close = () => {
      lb.hidden = true;
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      dragging = false;
      start = null;
      stage.classList.remove('is-dragging');
      // Release the 4x bitmap while the lightbox is closed.
      zoomCanvas.width = 1800;
      zoomCanvas.height = 1273;
    };

    document.getElementById('lightboxClose')?.addEventListener('click', close);
    document.getElementById('zoomIn')?.addEventListener('click', () => setZoom(zoom * 1.2));
    document.getElementById('zoomOut')?.addEventListener('click', () => setZoom(zoom / 1.2));
    document.getElementById('zoomReset')?.addEventListener('click', reset);
    stage.addEventListener('wheel', (e) => {
      e.preventDefault();
      setZoom(zoom * (e.deltaY < 0 ? 1.12 : .9));
    }, { passive: false });
    stage.addEventListener('pointerdown', (e) => {
      if (e.target !== zoomCanvas) return;
      dragging = true;
      start = { x: e.clientX - panX, y: e.clientY - panY };
      stage.classList.add('is-dragging');
      stage.setPointerCapture?.(e.pointerId);
    });
    stage.addEventListener('pointermove', (e) => {
      if (!dragging || !start) return;
      panX = e.clientX - start.x;
      panY = e.clientY - start.y;
      apply();
    });
    const end = () => { dragging = false; start = null; stage.classList.remove('is-dragging'); };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    zoomCanvas.addEventListener('dblclick', () => setZoom(zoom > 1.4 ? 1 : 2));
    lb.addEventListener('click', (e) => { if (e.target === stage) close(); });
    window.addEventListener('keydown', (e) => {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === '+' || e.key === '=') setZoom(zoom * 1.2);
      if (e.key === '-') setZoom(zoom / 1.2);
      if (e.key === '0') reset();
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    drawAll();
    initLightbox();

    document.querySelectorAll('[data-zoom]').forEach((btn) => {
      btn.addEventListener('click', () => window.__openAtlasLightbox?.(btn.dataset.zoom));
    });
    document.querySelectorAll('.sheet-card canvas').forEach((canvas) => {
      canvas.addEventListener('click', () => window.__openAtlasLightbox?.(canvas.id));
    });
    document.querySelectorAll('[data-download]').forEach((btn) => {
      btn.addEventListener('click', () => { downloadCanvas(btn.dataset.download); toast('PNG 已生成'); });
    });
    document.getElementById('downloadAll')?.addEventListener('click', () => {
      const ids = Object.keys(SHEETS);
      ids.forEach((id, i) => setTimeout(() => downloadCanvas(id), i * 260));
      toast('正在依次下载 6 张图纸');
    });
    document.getElementById('printAtlas')?.addEventListener('click', () => window.print());
  }

  window.__ATLAS__ = { drawSheet, drawAll, SHEETS, downloadCanvas };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
