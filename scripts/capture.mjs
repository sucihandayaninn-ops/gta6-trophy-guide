import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const root = fileURLToPath(new URL('../', import.meta.url));
const origin = process.env.GUIDE_ORIGIN ?? 'http://localhost:8080';
const chrome = process.env.GUIDE_CHROME ?? '/root/.hermes/tools/chromium-1208/chrome-linux64/chrome';
const shots = JSON.parse(await readFile(resolve(root, 'shots.json'), 'utf8'));
const limit = 256 * 1024;

export async function startBrowser() {
  const scratch = resolve(root, '.work');
  await mkdir(scratch, { recursive: true });
  const profile = await mkdtemp(resolve(scratch, 'chrome-'));
  const processHandle = spawn(chrome, [
    '--headless', '--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking',
    '--disable-component-update', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${profile}`, `--disk-cache-dir=${profile}`, 'about:blank'
  ], { cwd: root, env: { ...process.env, TMPDIR: profile }, stdio: 'ignore' });
  let launchError;
  processHandle.on('error', error => { launchError = error; });
  const exited = new Promise(resolveExit => processHandle.once('close', resolveExit));
  async function stop() {
    processHandle.kill();
    await exited;
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
  try {
    for (let retry = 0; retry < 100; retry++) {
      if (launchError) throw launchError;
      if (processHandle.exitCode !== null) throw new Error(`Chrome exited (${processHandle.exitCode}).`);
      const activePort = await readFile(resolve(profile, 'DevToolsActivePort'), 'utf8').catch(() => '');
      if (activePort) return { endpoint: `http://127.0.0.1:${activePort.split('\n')[0]}`, stop };
      await delay(50);
    }
    throw new Error('Timed out waiting for Chrome DevTools.');
  } catch (error) {
    await stop();
    throw error;
  }
}

export async function connect(endpoint) {
  const response = await fetch(`${endpoint}/json/new?about:blank`, { method: 'PUT' });
  if (!response.ok) throw new Error('Could not open a Chrome tab.');
  const { webSocketDebuggerUrl } = await response.json();
  const socket = new WebSocket(webSocketDebuggerUrl);
  await new Promise((resolveOpen, reject) => {
    socket.addEventListener('open', resolveOpen, { once: true });
    socket.addEventListener('error', () => reject(new Error('Chrome WebSocket failed.')), { once: true });
  });
  const pending = new Map();
  let id = 0;
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    clearTimeout(request.timer);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });
  function call(method, params = {}) {
    return new Promise((resolveCall, reject) => {
      const requestId = ++id;
      const timer = setTimeout(() => {
        pending.delete(requestId);
        reject(new Error(`Chrome command timed out: ${method}`));
      }, 8000);
      pending.set(requestId, { resolve: resolveCall, reject, timer });
      socket.send(JSON.stringify({ id: requestId, method, params }));
    });
  }
  async function evaluate(expression) {
    const evaluation = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (evaluation.exceptionDetails) throw new Error(evaluation.exceptionDetails.exception?.description ?? evaluation.exceptionDetails.text);
    return evaluation.result.value;
  }
  return { call, evaluate, close: () => socket.close() };
}

function verifyJpeg(data, viewport) {
  if (data[0] !== 0xff || data[1] !== 0xd8 || data.at(-2) !== 0xff || data.at(-1) !== 0xd9) {
    throw new Error('Chrome did not return a complete JPEG.');
  }
  for (let offset = 2; offset < data.length - 9;) {
    if (data[offset++] !== 0xff) break;
    const marker = data[offset++];
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      const height = data.readUInt16BE(offset + 3);
      const width = data.readUInt16BE(offset + 5);
      if (width === viewport.width && height === viewport.height) return;
      throw new Error(`Unexpected JPEG dimensions: ${width}×${height}.`);
    }
    if (marker === 0xda) break;
    offset += data.readUInt16BE(offset);
  }
  throw new Error('JPEG dimensions were not found.');
}

async function captureShot(tab, shot) {
  const { call, evaluate } = tab;
  const url = new URL(shot.path, origin);
  url.searchParams.set('demo', '1');
  for (const key of ['grade', 'guide', 'view', 'spoilers']) {
    if (shot[key]) url.searchParams.set(key, shot[key]);
  }
  const { width, height } = shot.viewport;
  await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  const result = await call('Page.navigate', { url: url.href });
  if (result.errorText) throw new Error(result.errorText);
  let ready = false;
  for (let retry = 0; retry < 100; retry++) {
    ready = await evaluate(`location.href === ${JSON.stringify(url.href)} && document.documentElement.dataset.ready === 'true'`).catch(() => false);
    if (ready) break;
    await delay(50);
  }
  if (!ready) throw new Error(`App did not render at ${url.href}.`);
  const scroll = shot.scroll ?? 0;
  const actualScroll = await evaluate(`(async () => {
    await document.fonts.ready;
    window.scrollTo(0, ${scroll});
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return window.scrollY;
  })()`);
  if (actualScroll !== scroll) throw new Error(`Expected scroll ${scroll} and got ${actualScroll}.`);

  for (const quality of [89, 83, 77, 70, 60, 50]) {
    const { data } = await call('Page.captureScreenshot', { format: 'jpeg', quality, fromSurface: true });
    const image = Buffer.from(data, 'base64');
    if (image.length >= limit) continue;
    verifyJpeg(image, shot.viewport);
    await writeFile(resolve(root, 'screenshots', shot.file), image);
    console.log(`${shot.file}: ${width}×${height}, ${image.length} bytes`);
    return;
  }
  throw new Error(`Could not fit ${shot.file} under 256 KiB.`);
}

async function captureAll() {
  const health = await fetch(origin).catch(() => null);
  if (!health?.ok || !(await health.text()).includes('Leonida Ledger')) {
    throw new Error(`Start this guide with node serve.ts and point GUIDE_ORIGIN at its address (${origin}).`);
  }
  await mkdir(resolve(root, 'screenshots'), { recursive: true });
  const browser = await startBrowser();
  try {
    const tab = await connect(browser.endpoint);
    try {
      for (const shot of shots) await captureShot(tab, shot);
    } finally {
      tab.close();
    }
  } finally {
    await browser.stop();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await captureAll();
