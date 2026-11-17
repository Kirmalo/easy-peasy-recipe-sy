#!/usr/bin/env node
// Verifies every /api route works the way Vercel runs it (Node runtime, no bundling):
// compiles api/ + its shared src/ imports to a temp dir, imports each route, and calls each
// exported HTTP-method handler with a fetch Request. Catches two production crashes:
//  - extensionless relative imports (fine in Vite, ERR_MODULE_NOT_FOUND in Node ESM)
//  - a default-export handler, which Vercel calls Node-style with (req, res), not a Request
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const out = mkdtempSync(join(tmpdir(), 'api-check-'));
const routes = readdirSync(join(root, 'api')).filter((f) => f.endsWith('.ts'));
const libs = readdirSync(join(root, 'api/_lib')).filter((f) => f.endsWith('.ts')).map((f) => `api/_lib/${f}`);

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
// Run without real credentials so handlers take their "not configured" paths.
for (const k of ['ANTHROPIC_API_KEY', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'PIXABAY_API_KEY', 'VITE_PIXABAY_API_KEY']) delete process.env[k];

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
      if ('default' in mod) throw new Error('has a default export — Vercel would call it with (req, res); export GET/POST/… instead');
      const methods = METHODS.filter((m) => typeof mod[m] === 'function');
      if (!methods.length) throw new Error('no GET/POST/PUT/DELETE/OPTIONS export');
      for (const m of methods) {
        const res = await mod[m](new Request(`https://check.test/api/${f.replace(/\.ts$/, '')}`, { method: m }));
        if (!(res instanceof Response)) throw new Error(`${m} did not return a Response`);
      }
      console.log(`ok    api/${f} (${methods.join(', ')})`);
    } catch (err) {
      failed++;
      console.error(`FAIL  api/${f}: ${String(err.message).split('\n')[0].replaceAll(out, '')}`);
    }
  }
} finally {
  rmSync(out, { recursive: true, force: true });
}
if (failed) {
  console.error(`\n${failed} API route(s) would fail on Vercel (see messages above).`);
  process.exit(1);
}
