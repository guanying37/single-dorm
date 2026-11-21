import fs from 'node:fs/promises';

/* 休息厅移动 / 碰撞 / 交互验收。
 *
 * 软件渲染下 rAF 可能只有 1–3 FPS，不能靠“真的等 3 秒”来测走动，
 * 因此这里用固定步长直接推进控制器与场景（60 Hz × N 步），碰撞与
 * 门扇动画都走真实代码路径；键盘链路另外用 CDP 键入 + 步进验证。
 *
 * 用法：node tools/motion-test.mjs [cdpPort]
 */

const cdpPort = process.argv[2] ?? process.env.CDP_PORT ?? '9222';

const list = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
const target = list.find((entry) => entry.type === 'page' && entry.url.includes('127.0.0.1:8123'));
if (!target) {
  console.error('No 127.0.0.1:8123 page found');
  process.exit(2);
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));
let id = 1;
const pending = new Map();
const errors = [];
ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
    return;
  }
  if (message.method === 'Runtime.exceptionThrown') {
    errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  }
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
    errors.push(message.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' '));
  }
});
const call = (method, params = {}) => {
  const rid = id++;
  ws.send(JSON.stringify({ id: rid, method, params }));
  return new Promise((resolve, reject) => pending.set(rid, { resolve, reject }));
};
const evaluate = async (expression) => {
  const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await call('Runtime.enable');
await call('Page.enable');
await call('Network.enable');
await call('Network.setCacheDisabled', { cacheDisabled: true });
await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
errors.length = 0;
await call('Page.navigate', {
  url: `http://127.0.0.1:8123/lounge/standalone.html?capture=1&hud=0&v=${Date.now()}`,
});

let ready = false;
for (let attempt = 0; attempt < 60; attempt += 1) {
  await sleep(500);
  ready = await evaluate('Boolean(window.__LOUNGE_READY__)').catch(() => false);
  if (ready) break;
}
if (!ready) {
  console.error('preview did not become ready', errors);
  process.exit(3);
}
await sleep(800);

/* 以 60 Hz 固定步长推进场景（含门扇阻尼与动态碰撞）。 */
async function step(seconds) {
  const steps = Math.max(1, Math.round(seconds * 60));
  await evaluate(`(() => {
    const A = window.__LOUNGE__;
    const dt = 1 / 60;
    for (let i = 0; i < ${steps}; i += 1) {
      A.loungeControls.update(dt);
      A.lounge.update(dt, A.lounge.elapsed + dt);
    }
    return true;
  })()`);
}

async function view() {
  return evaluate('(() => { const v = window.__LOUNGE__.getView(); return { x: v.x, z: v.z, yaw: v.yaw, pitch: v.pitch, y: v.y }; })()');
}

async function setView(v) {
  await evaluate(`(() => { window.__LOUNGE__.setView(${JSON.stringify(v)}); return true; })()`);
  await sleep(60);
}

async function hold(keys, seconds) {
  await evaluate(`(() => {
    const A = window.__LOUNGE__;
    A.loungeControls.keys.clear();
    ${JSON.stringify(keys)}.forEach((k) => A.loungeControls.keys.add(k));
    const dt = 1 / 60;
    for (let i = 0; i < ${Math.round(seconds * 60)}; i += 1) {
      A.loungeControls.update(dt);
      A.lounge.update(dt, A.lounge.elapsed + dt);
    }
    A.loungeControls.keys.clear();
    return true;
  })()`);
  return view();
}

const results = [];
const start = await view();

/* --- 1. 8 方向行走：不穿墙、不越界 ---------------------------------- */
const spawn = { x: -10.6, z: 0.7, yaw: -Math.PI / 2, pitch: 0 };
const directions = [
  ['east', ['KeyW'], { ...spawn }],
  ['west', ['KeyW'], { x: -10.6, z: 0.7, yaw: Math.PI / 2, pitch: 0 }],
  ['north', ['KeyW'], { x: -10.6, z: 0.7, yaw: 0, pitch: 0 }],
  ['south', ['KeyW'], { x: -10.6, z: 0.7, yaw: Math.PI, pitch: 0 }],
  ['ne', ['KeyW', 'KeyD'], { x: -10.6, z: 0.7, yaw: -Math.PI / 2, pitch: 0 }],
  ['nw', ['KeyW', 'KeyA'], { x: -10.6, z: 0.7, yaw: -Math.PI / 2, pitch: 0 }],
  ['se', ['KeyW', 'KeyD'], { x: -10.6, z: 0.7, yaw: Math.PI / 2, pitch: 0 }],
  ['sw', ['KeyW', 'KeyA'], { x: -10.6, z: 0.7, yaw: Math.PI / 2, pitch: 0 }],
];
for (const [name, keys, direction] of directions) {
  await setView(direction);
  const after = await hold(keys, 4.0);
  const inside = after.x > -18.9 && after.x < 16.0 && after.z > -5.05 && after.z < 5.05;
  results.push({ test: `walk-${name}`, from: { x: direction.x, z: direction.z }, to: { x: +after.x.toFixed(2), z: +after.z.toFixed(2) }, inside });
}

/* --- 2. 圆桌 / 关闭的大门阻挡 -------------------------------------- */
await setView({ x: -6.5, z: 0.0, yaw: -Math.PI / 2, pitch: 0 });
let after = await hold(['KeyW'], 3.0);
results.push({ test: 'table-blocks', to: { x: +after.x.toFixed(2), z: +after.z.toFixed(2) }, stoppedBeforeTable: after.x < -2.6 });

await setView({ x: -13.0, z: 0.0, yaw: Math.PI / 2, pitch: 0 });
after = await hold(['KeyW'], 3.0);
results.push({ test: 'closed-door-blocks', to: { x: +after.x.toFixed(2), z: +after.z.toFixed(2) }, blocked: after.x > -16.0 });

/* --- 3. 大门开合与楼梯厅 -------------------------------------------- */
const doorBefore = await evaluate("window.__LOUNGE__.lounge.getInteractiveState().find((i) => i.id === 'door.main')");
await evaluate("(() => { window.__LOUNGE__.toggle('door.main'); return true; })()");
await step(1.6);
const doorOpen = await evaluate("(() => { const i = window.__LOUNGE__.lounge.getInteractiveState().find((x) => x.id === 'door.main'); return { open: i.open, value: i.value }; })()");
await setView({ x: -13.0, z: 0.0, yaw: Math.PI / 2, pitch: 0 });
after = await hold(['KeyW'], 4.0);
const inLanding = after.x < -16.11;
results.push({ test: 'door-open-enter-landing', before: doorBefore, open: doorOpen, to: { x: +after.x.toFixed(2), z: +after.z.toFixed(2) }, inLanding });

await evaluate("(() => { window.__LOUNGE__.toggle('door.main'); return true; })()");
await step(1.6);
await setView({ x: -13.0, z: 0.0, yaw: Math.PI / 2, pitch: 0 });
after = await hold(['KeyW'], 2.4);
results.push({ test: 'door-closed-again', to: { x: +after.x.toFixed(2), z: +after.z.toFixed(2) }, blocked: after.x > -16.0 });

/* --- 4. 宿管门与检测机 ---------------------------------------------- */
const supervisor = await evaluate("(() => { const r = window.__LOUNGE__.toggle('door.supervisor.male'); return { locked: !!r.locked, message: r.message }; })()");
const reader = await evaluate("(() => { const r = window.__LOUNGE__.toggle('reader.male'); return { locked: !!r.locked, message: r.message }; })()");
results.push({ test: 'supervisor-locked', supervisor, reader });

/* --- 5. 挂钟可调 ---------------------------------------------------- */
await evaluate("(() => { window.__LOUNGE__.setClock(3, 45, 10); return true; })()");
const clock1 = await evaluate('window.__LOUNGE__.getClock()');
await step(1.2);
const clock2 = await evaluate('window.__LOUNGE__.getClock()');
results.push({ test: 'clock', set: clock1, later: clock2, secondsAdvanced: clock2.second > clock1.second + 0.5 });

/* --- 6. 键盘输入链路 ------------------------------------------------ */
await setView({ x: -9.0, z: 0.7, yaw: -Math.PI / 2, pitch: 0 });
const beforeKey = await view();
await call('Input.dispatchKeyEvent', { type: 'rawKeyDown', code: 'KeyW', key: 'w', windowsVirtualKeyCode: 87 });
await step(0.8);
await call('Input.dispatchKeyEvent', { type: 'keyUp', code: 'KeyW', key: 'w', windowsVirtualKeyCode: 87 });
const afterKey = await view();
results.push({ test: 'keyboard-input', moved: Math.hypot(afterKey.x - beforeKey.x, afterKey.z - beforeKey.z) > 0.5, movedBy: +Math.hypot(afterKey.x - beforeKey.x, afterKey.z - beforeKey.z).toFixed(2) });

/* 截图由 capture-hub.mjs 统一输出 JPG，这里只保留数据。 */
const stats = await evaluate(`(() => {
  const s = window.__LOUNGE__.getStats();
  return { calls: s.renderer.calls, triangles: s.renderer.triangles, textures: s.memory.textures, fps: Math.round(s.fps) };
})()`);

console.log('START', start);
console.log(JSON.stringify({ results, stats, errors }, null, 2));

const failures = results.filter((r) => {
  if (r.test.startsWith('walk-')) return !r.inside;
  if (r.test === 'table-blocks') return !r.stoppedBeforeTable;
  if (r.test === 'closed-door-blocks') return !r.blocked;
  if (r.test === 'door-open-enter-landing') return !r.inLanding;
  if (r.test === 'door-closed-again') return !r.blocked;
  if (r.test === 'clock') return !r.secondsAdvanced;
  if (r.test === 'keyboard-input') return !r.moved;
  return false;
});
await fs.writeFile(new URL('../preview/motion-report.json', import.meta.url), JSON.stringify({ results, stats, errors }, null, 2));
ws.close();
process.exit(failures.length === 0 && errors.length === 0 ? 0 : 1);
