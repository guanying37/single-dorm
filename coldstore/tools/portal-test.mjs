/* Bidirectional portal test: cold store <-> restaurant kitchen.
 * Clicks the real door in the 3D view and waits for the black fade. */

const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const target = list.find((entry) => entry.type === 'page' && entry.url.includes('127.0.0.1:8123'));
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
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clickCenter = async () => {
  const center = await evaluate('({ x: innerWidth / 2, y: innerHeight / 2 })');
  await call('Input.dispatchMouseEvent', { type: 'mousePressed', x: center.x, y: center.y, button: 'left', clickCount: 1 });
  await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: center.x, y: center.y, button: 'left', clickCount: 1 });
};

await call('Runtime.enable');
await call('Page.enable');
await call('Network.enable');
await call('Network.setCacheDisabled', { cacheDisabled: true });
await call('Network.clearBrowserCache');
await call('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
await call('Page.bringToFront');
await call('Page.navigate', { url: `http://127.0.0.1:8123/?scene=coldstore&v=${Date.now()}` });
for (let attempt = 0; attempt < 50; attempt += 1) {
  await sleep(700);
  const ok = await evaluate('Boolean(window.__PREVIEW_READY__)').catch(() => false);
  if (ok) break;
}

const results = { events };

// --- 1. Cold store door -> kitchen ---------------------------------
await evaluate("window.__PREVIEW__.setScene('coldstore')");
await sleep(500);
await evaluate('window.__PREVIEW__.setView({x:0.3,z:1.45,yaw:Math.PI,pitch:0})');
await sleep(700);
await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 800, y: 450 });
await sleep(500);
results.promptCold = await evaluate('document.getElementById("interactionText")?.textContent ?? ""');
results.badgeCold = await evaluate('document.getElementById("interactionBadge")?.className ?? ""');
await clickCenter();
await sleep(260);
results.fadeActive = await evaluate('document.getElementById("sceneTransition")?.className ?? ""');
results.fadeTitle = await evaluate('document.getElementById("sceneTransitionTitle")?.textContent ?? ""');
await sleep(2200);
results.afterColdDoor = await evaluate('({ scene: window.__PREVIEW__.getScene(), view: window.__PREVIEW__.getView() })');

// --- 2. Kitchen cold door -> cold store ----------------------------
await evaluate('window.__PREVIEW__.setView({x:4.6,z:-9.55,yaw:0,pitch:0.02})');
await sleep(700);
await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 800, y: 450 });
await sleep(500);
results.promptKitchen = await evaluate('document.getElementById("interactionText")?.textContent ?? ""');
results.kitchenHovered = await evaluate('(() => { const b = document.getElementById("interactionBadge"); return b ? b.classList.contains("visible") : null; })()');
await clickCenter();
await sleep(260);
results.fadeTitleReverse = await evaluate('document.getElementById("sceneTransitionTitle")?.textContent ?? ""');
await sleep(2200);
results.afterKitchenDoor = await evaluate('({ scene: window.__PREVIEW__.getScene(), view: window.__PREVIEW__.getView() })');

// --- 3. Kitchen cold door still visible from a distance -----------
await evaluate("window.__PREVIEW__.setScene('kitchen')");
await sleep(500);
await evaluate('window.__PREVIEW__.setView({x:3.0,z:-8.4,yaw:0.12,pitch:0.04})');
await sleep(1200);
results.kitchenStats = await evaluate('window.__PREVIEW__.getStats().renderer');

console.log(JSON.stringify(results, null, 2));
ws.close();
