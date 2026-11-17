#!/usr/bin/env node
// Verifies every /api route can be loaded by Node's ES-module loader, the way Vercel runs
// them (no bundling): compiles api/ + its shared src/ imports to a temp dir and imports each.
// Catches extensionless relative imports, which work in Vite but crash serverless functions.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const out = mkdtempSync(join(tmpdir(), 'api-check-'));
const routes = readdirSync(join(root, 'api')).filter((f) => f.endsWith('.ts'));
const libs = readdirSync(join(root, 'api/_lib')).filter((f) => f.endsWith('.ts')).map((f) => `api/_lib/${f}`);

let failed = 0;
try {
  execFileSync('npx', ['tsc', ...routes.map((f) => `api/${f}`), ...libs, '--ignoreConfig', '--outDir', out,
    '--module', 'esnext', '--target', 'es2022', '--moduleResolution', 'bundler', '--skipLibCheck',
    '--rootDir', '.', '--types', 'node'], { cwd: root, stdio: 'inherit' });
  writeFileSync(join(out, 'package.json'), '{"type":"module"}');
  symlinkSync(join(root, 'node_modules'), join(out, 'node_modules'), 'dir');

  for (const f of routes) {
    try {
      const mod = await import(pathToFileURL(join(out, 'api', f.replace(/\.ts$/, '.js'))).href);
      if (typeof mod.default !== 'function') throw new Error('no default export handler');
      console.log(`ok    api/${f}`);
    } catch (err) {
      failed++;
      console.error(`FAIL  api/${f}: ${String(err.message).split('\n')[0].replaceAll(out, '')}`);
    }
  }
} finally {
  rmSync(out, { recursive: true, force: true });
}
if (failed) {
  console.error(`\n${failed} API route(s) would crash on load. Relative imports reachable from api/ need a .js extension.`);
  process.exit(1);
}
