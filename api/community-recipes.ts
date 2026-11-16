import { Redis } from '@upstash/redis';
import { corsHeaders, json, originAllowed, hasRedis } from './_lib/http';
import { sanitizeRecipes } from '../src/lib/recipeValidation';

export default async function handler(request: Request): Promise<Response> {
  const headers = corsHeaders(request, 'GET');

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405, headers);
  if (!originAllowed(request)) return json({ error: 'Origin not allowed' }, 403, headers);
  if (!hasRedis()) return json([], 200, headers);

  try {
    const redis = Redis.fromEnv();
    const raw = await redis.lrange<unknown>('ep:community:recipes', 0, 99);
    const parsed = raw.map((item) => {
      try { return typeof item === 'string' ? JSON.parse(item) : item; }
      catch { return null; }
    });
    // Never trust stored data shape — drop anything malformed.
    return json(sanitizeRecipes(parsed), 200, headers, {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    });
  } catch (err) {
    console.error('community-recipes failed', err);
    return json({ error: 'Could not load community recipes' }, 500, headers);
  }
}
