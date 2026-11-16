import { Redis } from '@upstash/redis';
import { corsHeaders, json, originAllowed, hasRedis, VOTES_KEY, REPORTS_KEY } from './_lib/http';
import { sanitizeRecipes } from '../src/lib/recipeValidation';
import { moderateRecipe } from '../src/lib/moderation';

/** Recipes with this many reports are hidden from everyone. */
const HIDE_AFTER_REPORTS = 3;

export default async function handler(request: Request): Promise<Response> {
  const headers = corsHeaders(request, 'GET');

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405, headers);
  if (!originAllowed(request)) return json({ error: 'Origin not allowed' }, 403, headers);
  if (!hasRedis()) return json({ recipes: [], upvotes: {} }, 200, headers);

  try {
    const redis = Redis.fromEnv();
    const [raw, upvotesRaw, reportsRaw] = await Promise.all([
      redis.lrange<unknown>('ep:community:recipes', 0, 99),
      redis.hgetall<Record<string, number>>(VOTES_KEY),
      redis.hgetall<Record<string, number>>(REPORTS_KEY),
    ]);
    const reports = reportsRaw ?? {};
    const parsed = raw.map((item) => {
      try { return typeof item === 'string' ? JSON.parse(item) : item; }
      catch { return null; }
    });
    // Never trust stored data shape — drop anything malformed.
    // Re-screen on read so tightening the rules also cleans recipes already stored.
    const recipes = sanitizeRecipes(parsed)
      .filter((r) => moderateRecipe(r).ok)
      .filter((r) => Number(reports[r.id] ?? 0) < HIDE_AFTER_REPORTS);
    const visible = new Set(recipes.map((r) => String(r.id)));
    const upvotes = Object.fromEntries(
      Object.entries(upvotesRaw ?? {}).filter(([id]) => visible.has(id)).map(([id, n]) => [id, Number(n) || 0]),
    );
    return json({ recipes, upvotes }, 200, headers, {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    });
  } catch (err) {
    console.error('community-recipes failed', err);
    return json({ error: 'Could not load community recipes' }, 500, headers);
  }
}
