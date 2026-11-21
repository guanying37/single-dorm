import fs from 'node:fs/promises';

/* Clean performance measurement at the hero view.
 * Usage: node tools/perf.mjs [port] */

const port = process.argv[2] ?? '9335';
const list = await (await fetch(`http://localhost:${port}/json/list`)).json();
const target = list.find((entry) => entry.type === 'page' && entry.url.includes('garbage/standalone.html'));
if (!target) process.exit(2);
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
  setTimeout(() => reject(new Error('ws timeout')), 8000);
});
let id = 1;
const pending = new Map();
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
    return;
  }
  if (message.method === 'Page.screencastFrame') {
    // Keep the headless compositor producing BeginFrames so rAF runs at
    // its normal cadence during the measurement.
    ws.send(JSON.stringify({ id: 100000 + message.params.sessionId, method: 'Page.screencastFrameAck', params: { sessionId: message.params.sessionId } }));
  }
};
const call = (method, params = {}) => {
  const rid = id++;
  ws.send(JSON.stringify({ id: rid, method, params }));
  return new Promise((resolve, reject) => {
    pending.set(rid, { resolve, reject });
    setTimeout(() => {
      if (!pending.has(rid)) return;
      pending.delete(rid);
      reject(new Error(`${method} timeout`));
    }, 60000);
  });
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
await call('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
await call('Page.reload', { ignoreCache: true });
for (let attempt = 0; attempt < 80; attempt += 1) {
  await sleep(500);
  if (await evaluate('Boolean(window.__GARBAGE_READY__)').catch(() => false)) break;
}
await sleep(8000);
const result = await evaluate(`(async () => {
  const p = window.__GARBAGE_PREVIEW__;
  p.setView({ x: -1.7, z: -2.2, yaw: -2.3038, pitch: -0.1047 });
  for (let i = 0; i < 40; i += 1) p.renderer.render(p.scene.scene, p.camera);
  await new Promise((r) => setTimeout(r, 2500));
  const samples = [];
  for (let run = 0; run < 3; run += 1) {
    samples.push(await new Promise((resolve) => {
      let frames = 0;
      const start = performance.now();
      const tick = () => {
        frames += 1;
        const span = performance.now() - start;
        if (span < 3000) requestAnimationFrame(tick);
        else resolve(Number((frames / (span / 1000)).toFixed(1)));
      };
      requestAnimationFrame(tick);
    }));
  }
  const s = p.scene.getStats();
  return {
    fpsSamples: samples,
    fps: Math.min(...samples),
    stats: s,
    render: { ...p.renderer.info.render },
    pixelRatio: p.renderer.getPixelRatio(),
    viewport: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio },
    quality: window.__PREVIEW_QUALITY__ ?? null,
  };
})()`);
await fs.writeFile(new URL('../preview/fps.json', import.meta.url), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
ws.close();
process.exit(0);
