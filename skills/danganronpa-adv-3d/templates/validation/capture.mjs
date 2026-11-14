#!/usr/bin/env node
/**
 * Capture a page through an already-running CDP browser.
 *
 * Start a browser with remote debugging first, for example:
 *   msedge.exe --remote-debugging-port=9333 --user-data-dir=%TEMP%\adv-cdp
 *
 * Then:
 *   node capture.mjs http://127.0.0.1:8123/#dining out.png 1600 900 window.__PREVIEW_READY__
 *
 * The script does not launch a browser; it only talks to CDP.
 */

import { writeFileSync } from 'node:fs';

const [url, out, widthArg, heightArg, waitExprArg, timeoutArg, delayArg] = process.argv.slice(2);
if (!url || !out) {
  console.error('usage: node capture.mjs <url> <out.png> [width] [height] [waitExpression] [timeoutMs] [delayMs]');
  process.exit(2);
}

const width = Number(widthArg || 1600);
const height = Number(heightArg || 900);
const waitExpr = waitExprArg || 'document.readyState === "complete"';
const timeout = Number(timeoutArg || 120000);
const delay = Number(delayArg || 800);
const port = Number(process.env.CDP_PORT || 9333);

const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const page = targets.find((target) => target.type === 'page');
if (!page) throw new Error('No CDP page target found');

const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
const logs = [];
let nextId = 0;

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const request = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) request.reject(new Error(JSON.stringify(message.error)));
    else request.resolve(message.result);
    return;
  }
  if (message.method === 'Runtime.exceptionThrown') {
    logs.push(`exception: ${message.params.exceptionDetails.text}`);
  }
  if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params.type)) {
    logs.push(`${message.params.type}: ${message.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' ')}`);
  }
});

await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result?.value;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

try {
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Network.clearBrowserCache');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await send('Page.navigate', { url });
  const deadline = Date.now() + timeout;
  let ready = false;
  while (Date.now() < deadline) {
    try {
      ready = Boolean(await evaluate(waitExpr));
    } catch {
      ready = false;
    }
    if (ready) break;
    await sleep(400);
  }
  if (!ready) {
    const state = await evaluate('({ href: location.href, ready: document.readyState, body: document.body.className })').catch(() => null);
    throw new Error(`Timed out waiting for: ${waitExpr}\nlogs: ${JSON.stringify(logs)}\nstate: ${JSON.stringify(state)}`);
  }

  await sleep(delay);
  const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  writeFileSync(out, Buffer.from(shot.data, 'base64'));
  console.log(JSON.stringify({ ok: true, url, out, width, height, logs }, null, 2));
  if (logs.some((line) => line.startsWith('exception:') || line.startsWith('error:'))) process.exitCode = 1;
} finally {
  socket.close();
}
