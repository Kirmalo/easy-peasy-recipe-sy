// POST { id, vote: 'up' | 'report' } — one vote per recipe per client IP.
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { corsHeaders, json, originAllowed, clientIp, hasRedis, VOTES_KEY, REPORTS_KEY } from './_lib/http.js';
import { AI_ID_BASE } from '../src/lib/recipeValidation.js';

const redis = hasRedis() ? Redis.fromEnv() : null;
const limiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(40, '24 h'), prefix: 'ep:vote-rl', analytics: false })
  : null;

async function hashIp(ip: string): Promise<string> {
  const salt = process.env.VOTE_SALT ?? 'recipesy';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${ip}`));
  return [...new Uint8Array(digest)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function handler(request: Request): Promise<Response> {
  const headers = corsHeaders(request, 'POST');
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, headers);
  if (!originAllowed(request)) return json({ error: 'Origin not allowed' }, 403, headers);
  if (!redis || !limiter) return json({ error: 'Voting is not available' }, 503, headers);

  let body: { id?: unknown; vote?: unknown };
  try { body = await request.json() as typeof body; } catch { return json({ error: 'Invalid request body' }, 400, headers); }
  const id = Number(body.id);
  const vote = body.vote;
  if (!Number.isSafeInteger(id) || id < AI_ID_BASE || (vote !== 'up' && vote !== 'report')) {
    return json({ error: 'Invalid vote' }, 400, headers);
  }

  const ip = clientIp(request);
  if (!(await limiter.limit(ip)).success) return json({ error: 'Too many votes today' }, 429, headers);

  try {
    // NX: only the first vote from this client on this recipe counts.
    const fresh = await redis.set(`ep:vote:${id}:${await hashIp(ip)}`, vote, { nx: true, ex: 60 * 60 * 24 * 90 });
    if (!fresh) return json({ ok: true, duplicate: true }, 409, headers);
    await redis.hincrby(vote === 'up' ? VOTES_KEY : REPORTS_KEY, String(id), 1);
    return json({ ok: true }, 200, headers);
  } catch (err) {
    console.error('community-vote failed', err);
    return json({ error: 'Could not record vote' }, 500, headers);
  }
}

// Vercel's web-standard signature: one named export per HTTP method, each receiving a
// fetch Request. (A default-export function is called Node-style with (req, res).)
export const POST = handler;
export const OPTIONS = handler;
