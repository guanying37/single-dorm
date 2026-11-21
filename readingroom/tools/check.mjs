import fs from 'node:fs/promises';

/* Load, registration, interaction and scene-switch check for the reading
 * room. Runs against the combined preview page through the exposed API. */

const port = process.env.CDP_PORT ?? '9223';
const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const target = list.find((entry) => entry.type === 'page');
if (!target) process.exit(2);
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));
let id = 1;
const pending = new Map();
const events = [];
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
    events.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  }
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
    events.push(message.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' '));
  }
});
const call = (method, params = {}) => {
  const rid = id++;
  ws.send(JSON.stringify({ id: rid, method, params }));
  return new Promise((resolve, reject) => pending.set(rid, { resolve, reject }));
};
const evaluate = async (expression) => {
  const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await call('Runtime.enable');
await call('Page.enable');
await call('Network.enable');
await call('Network.setCacheDisabled', { cacheDisabled: true });
await call('Network.clearBrowserCache');
await call('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
await call('Page.bringToFront');
events.length = 0;
await call('Page.navigate', { url: `http://127.0.0.1:8123/?scene=readingroom&v=${Date.now()}` });

let ready = false;
for (let attempt = 0; attempt < 80; attempt += 1) {
  await sleep(500);
  ready = await evaluate('Boolean(window.__PREVIEW_READY__)').catch(() => false);
  if (ready) break;
}
if (!ready) {
  console.error('preview not ready', events);
  process.exit(3);
}
await sleep(1200);

const page = await evaluate(`(() => {
  const p = window.__PREVIEW__;
  return {
    scene: p.getScene(),
    readingroomReady: Boolean(window.__READINGROOM_READY__),
    title: document.getElementById('sceneTitle')?.textContent,
    eyebrow: document.getElementById('sceneEyebrow')?.textContent,
    tabs: Array.from(document.querySelectorAll('.scene-tab')).map((tab) => ({ id: tab.dataset.scene, text: tab.textContent, active: tab.classList.contains('is-active') })),
    controlsVisible: Array.from(document.querySelectorAll('.control-strip')).filter((el) => !el.classList.contains('is-hidden')).map((el) => el.id),
    loaderHidden: document.getElementById('loader')?.classList.contains('is-hidden'),
    view: p.getView(),
    stats: p.readingroom.getStats(),
    interactives: p.getInteractives(),
    camera: { near: p.camera.near, far: p.camera.far, fov: p.camera.fov },
  };
})()`);
console.log('PAGE', JSON.stringify(page, null, 2));

const interactions = await evaluate(`(() => {
  const p = window.__PREVIEW__;
  const scene = p.readingroom;
  const out = {};
  const settle = (frames = 120) => { for (let i = 0; i < frames; i += 1) scene.update(1 / 60, i / 60); };

  const door = scene.toggleInteractive('door.readingroom');
  out.door = { id: door.id, locked: door.locked, open: door.open, sceneId: door.sceneId };

  scene.setInteractive('ladder', true);
  settle(1);
  out.ladderOpen = {
    open: scene.ladderItem.open,
    front: Number(scene.shelves.ladder.front.rotation.z.toFixed(3)),
    back: Number(scene.shelves.ladder.back.rotation.z.toFixed(3)),
  };
  scene.setInteractive('ladder', false);
  settle(1);
  out.ladderClosed = {
    open: scene.ladderItem.open,
    front: Number(scene.shelves.ladder.front.rotation.z.toFixed(3)),
    back: Number(scene.shelves.ladder.back.rotation.z.toFixed(3)),
  };

  scene.setInteractive('light.switch', false);
  settle(180);
  out.pendantOff = {
    on: scene.lightOn,
    level: Number(scene.lightLevel.toFixed(4)),
    pendant: Number(scene.lights.pendants[0].intensity.toFixed(3)),
    key: Number(scene.lights.key.intensity.toFixed(3)),
  };
  scene.setInteractive('light.switch', true);
  settle(180);
  out.pendantOn = { on: scene.lightOn, level: Number(scene.lightLevel.toFixed(3)) };

  scene.setInteractive('lamp.tables', false);
  settle(180);
  out.tableLampsOff = {
    on: scene.tableLampsOn,
    level: Number(scene.tableLevel.toFixed(4)),
    point: Number(scene.lights.bankers[0].intensity.toFixed(3)),
    glass: Number(scene.materials.greenGlass.emissiveIntensity.toFixed(3)),
  };
  scene.setInteractive('lamp.tables', true);
  settle(180);
  out.tableLampsOn = { on: scene.tableLampsOn, level: Number(scene.tableLevel.toFixed(3)) };

  p.setView({ x: -1.45, z: 4.3, yaw: -0.08, pitch: -0.03 });
  out.final = p.getView();
  out.state = scene.getInteractiveState();
  return out;
})()`);
console.log('INTERACTIONS', JSON.stringify(interactions, null, 2));

const switching = await evaluate(`(async () => {
  const p = window.__PREVIEW__;
  const log = [];
  for (const name of ['dining', 'kitchen', 'coldstore', 'storage', 'garbage', 'lounge', 'dorm', 'readingroom']) {
    p.setScene(name);
    await new Promise((r) => setTimeout(r, 300));
    log.push({ wanted: name, got: p.getScene(), view: p.getView(), tabs: document.querySelectorAll('.scene-tab.is-active').length });
  }
  return log;
})()`);
console.log('SWITCH', JSON.stringify(switching, null, 2));

const perf = await evaluate(`(() => {
  const p = window.__PREVIEW__;
  const s = p.getStats();
  const gl = p.renderer.getContext();
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  return {
    gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'n/a',
    calls: s.renderer.calls,
    triangles: s.renderer.triangles,
    textures: s.memory.textures,
    geometries: s.memory.geometries,
    quality: s.quality,
    fps: Math.round(s.fps),
    fpsLabel: document.getElementById('fpsValue')?.textContent,
    readingroom: s.readingroom,
  };
})()`);
console.log('PERF', JSON.stringify(perf, null, 2));
console.log('EVENTS', JSON.stringify(events));

const report = {
  generatedAt: new Date().toISOString(),
  page,
  interactions,
  switching,
  perf,
  events,
};
await fs.mkdir(new URL('../preview/', import.meta.url), { recursive: true });
await fs.writeFile(new URL('../preview/check-report.json', import.meta.url), JSON.stringify(report, null, 2));
ws.close();
