import fs from 'node:fs/promises';

/* Real-GPU HUD screenshot and FPS readout from the visible Edge window. */
const PORT = process.argv[2] ?? '9223';
const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const target = list.find((entry) => entry.type === 'page');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));
let id = 1;
const pending = new Map();
ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
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
await call('Network.setCacheDisabled', { cacheDisabled: true });
await call('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
await call('Page.bringToFront');
await call('Page.navigate', { url: `http://127.0.0.1:8123/?scene=storage&v=${Date.now()}` });
for (let i = 0; i < 60; i += 1) {
  await sleep(500);
  if (await evaluate('Boolean(window.__PREVIEW_READY__)').catch(() => false)) break;
}
await sleep(7000);
const info = await evaluate(`(() => {
  const s = window.__PREVIEW__.getStats();
  return {
    scene: window.__PREVIEW__.getScene(),
    fpsLabel: document.getElementById('fpsValue')?.textContent,
    smoothFps: Math.round(s.fps),
    calls: s.renderer.calls,
    triangles: s.renderer.triangles,
    textures: s.memory.textures,
    quality: s.quality,
    title: document.getElementById('sceneTitle')?.textContent,
    tabs: Array.from(document.querySelectorAll('.scene-tab')).map((t) => t.textContent),
    gpu: (() => { const gl = window.__PREVIEW__.renderer.getContext(); const ext = gl.getExtension('WEBGL_debug_renderer_info'); return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'n/a'; })(),
  };
})()`);
console.log('GPU', info);
const shot = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
await fs.mkdir(new URL('../preview/final/', import.meta.url), { recursive: true });
await fs.writeFile(new URL('../preview/final/hero-ui.png', import.meta.url), Buffer.from(shot.data, 'base64'));
await fs.writeFile(new URL('../preview/final/fps.json', import.meta.url), JSON.stringify(info, null, 2));
ws.close();
