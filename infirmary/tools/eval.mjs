const expression = process.argv.slice(2).join(' ');
const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const target = list.find((entry) => entry.type === 'page');
if (!target) process.exit(2);
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
await call('Runtime.enable');
const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
if (result.exceptionDetails) {
  console.error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  process.exit(1);
}
console.log(JSON.stringify(result.result.value, null, 2));
ws.close();
