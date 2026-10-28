// Takes headless-browser screenshots of the built app at desktop and phone width.
// Usage: npm run build && npm run screenshot -- / /studio/aliases
// (In Git Bash, prefix with MSYS_NO_PATHCONV=1 so "/" routes are not turned into paths.)
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'node:net';

const routes = process.argv.slice(2).length ? process.argv.slice(2) : ['/'];
const widths = [1280, 360];
const outDir = resolve('screenshots');
const framePath = resolve('dist/__frame.html');
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
    const appUrl = `http://localhost:${port}/gitaliases-studio/#${route}`;
    let url = appUrl;
    // Headless Chrome won't shrink a window below ~500px, so narrow widths render inside an iframe.
    if (width < 500) {
      writeFileSync(
        framePath,
        `<!doctype html><body style="margin:0"><iframe src="${appUrl}" style="width:${width}px;height:2200px;border:0"></iframe>`,
      );
      url = `http://localhost:${port}/gitaliases-studio/__frame.html`;
    }
    await run([
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      `--window-size=${Math.max(width, 500)},2200`,
      '--virtual-time-budget=3000',
      `--screenshot=${resolve(outDir, name)}`,
      url,
    ]);
    console.log('saved', name);
  }
}

rmSync(framePath, { force: true });
preview.kill();
process.exit(0);
