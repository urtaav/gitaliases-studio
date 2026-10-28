// Takes headless-browser screenshots of the built app at desktop and phone width.
// Usage: npm run build && npm run screenshot -- / /studio/aliases
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'node:net';

const routes = process.argv.slice(2).length ? process.argv.slice(2) : ['/'];
const widths = [1280, 360];
const outDir = resolve('screenshots');
mkdirSync(outDir, { recursive: true });

const candidates = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
];
const browser = candidates.find((p) => existsSync(p));
if (!browser) {
  console.error('No Chrome, Edge or Chromium found.');
  process.exit(1);
}

const port = await new Promise((done) => {
  const srv = createServer().listen(0, () => {
    const { port } = srv.address();
    srv.close(() => done(port));
  });
});

const preview = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], {
  shell: true,
  stdio: 'ignore',
});
await new Promise((r) => setTimeout(r, 2500));

const run = (args) =>
  new Promise((done) => {
    const p = spawn(browser, args, { stdio: 'ignore' });
    p.on('exit', done);
  });

for (const route of routes) {
  for (const width of widths) {
    const name = (route === '/' ? 'landing' : route.replace(/\W+/g, '-').replace(/^-|-$/g, '')) + `-${width}.png`;
    const url = `http://localhost:${port}/gitaliases-studio/#${route}`;
    await run([
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      `--window-size=${width},2200`,
      '--virtual-time-budget=3000',
      `--screenshot=${resolve(outDir, name)}`,
      url,
    ]);
    console.log('saved', name);
  }
}

preview.kill();
process.exit(0);
