// Device sync without accounts. A random code is the only key to a snapshot of the user's data.
//   POST   { data }                    → { code, updatedAt }   create a new sync code
//   GET    ?code=XXXX-XXXX-XXXX        → { data, updatedAt }
//   PUT    { code, data, updatedAt }   → { updatedAt }         last write wins
//   DELETE ?code=…                     → { ok }
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { corsHeaders, json, originAllowed, clientIp, hasRedis, errorBody } from './_lib/http.js';
import { sanitizePersisted } from '../src/store/persisted.js';
import { normalizeSyncCode } from '../src/lib/syncCode.js';

const TTL_SECONDS = 60 * 60 * 24 * 180; // refreshed on every write
const MAX_BYTES = 256 * 1024;
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I/L

const redis = hasRedis() ? Redis.fromEnv() : null;
// Generous for normal use, tight enough that guessing 60-bit codes is hopeless.
const limiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(120, '1 h'), prefix: 'ep:sync-rl', analytics: false })
  : null;

const key = (code: string) => `ep:sync:${code}`;

function newCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const chars = [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join('');
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

interface Snapshot { data: unknown; updatedAt: number }

async function handler(request: Request): Promise<Response> {
  const headers = { ...corsHeaders(request, 'GET, POST, PUT, DELETE'), 'Cache-Control': 'no-store' };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!originAllowed(request)) return json({ error: 'Origin not allowed' }, 403, headers);
  if (!redis || !limiter) return json({ error: 'Sync is not available' }, 503, headers);
  if (!(await limiter.limit(clientIp(request))).success) return json({ error: 'Too many sync requests — try again later' }, 429, headers);

  try {
    if (request.method === 'GET' || request.method === 'DELETE') {
      const code = normalizeSyncCode(new URL(request.url).searchParams.get('code') ?? '');
      if (!code) return json({ error: 'Invalid sync code' }, 400, headers);
      if (request.method === 'DELETE') {
        await redis.del(key(code));
        return json({ ok: true }, 200, headers);
      }
      const snap = await redis.get<Snapshot>(key(code));
      if (!snap) return json({ error: 'Sync code not found' }, 404, headers);
      return json({ data: sanitizePersisted(snap.data), updatedAt: snap.updatedAt }, 200, headers);
    }

    if (request.method !== 'POST' && request.method !== 'PUT') return json({ error: 'Method not allowed' }, 405, headers);

    const text = await request.text();
    if (text.length > MAX_BYTES) return json({ error: 'Sync data too large' }, 413, headers);
    let body: { code?: unknown; data?: unknown; updatedAt?: unknown };
    try { body = JSON.parse(text) as typeof body; } catch { return json({ error: 'Invalid request body' }, 400, headers); }

    const data = { ...sanitizePersisted(body.data), syncCode: null }; // never store the code inside the snapshot
    const updatedAt = Date.now();

    if (request.method === 'POST') {
      for (let attempt = 0; attempt < 3; attempt++) {
        const code = newCode();
        const ok = await redis.set(key(code), { data, updatedAt }, { nx: true, ex: TTL_SECONDS });
        if (ok) return json({ code, updatedAt }, 201, headers);
      }
      return json({ error: 'Could not create a sync code' }, 500, headers);
    }

    const code = normalizeSyncCode(String(body.code ?? ''));
    if (!code) return json({ error: 'Invalid sync code' }, 400, headers);
    const existing = await redis.get<Snapshot>(key(code));
    if (!existing) return json({ error: 'Sync code not found' }, 404, headers);
    // Reject a write based on stale data so a slow device can't clobber newer changes.
    const base = Number(body.updatedAt);
    if (Number.isFinite(base) && base < existing.updatedAt) {
      return json({ error: 'Out of date', data: sanitizePersisted(existing.data), updatedAt: existing.updatedAt }, 409, headers);
    }
    await redis.set(key(code), { data, updatedAt }, { ex: TTL_SECONDS });
    return json({ updatedAt }, 200, headers);
  } catch (err) {
    console.error('sync failed', err);
    return json(errorBody('Sync failed', err), 500, headers);
  }
}

// Vercel's web-standard signature: one named export per HTTP method, each receiving a
// fetch Request. (A default-export function is called Node-style with (req, res).)
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const OPTIONS = handler;
