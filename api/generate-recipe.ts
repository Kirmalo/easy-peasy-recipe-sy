import Anthropic from '@anthropic-ai/sdk';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { corsHeaders, json, originAllowed, clientIp, hasRedis } from './_lib/http';
import { sanitizeRecipe, AI_ID_BASE } from '../src/lib/recipeValidation';
import type { ThemeName } from '../src/types';

// Override with ANTHROPIC_MODEL. Before switching to a newer Haiku, check that forced
// tool_choice is still accepted with that model's default thinking settings.
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
const PER_IP_DAILY = Number(process.env.AI_DAILY_LIMIT_PER_IP) || 5;
const GLOBAL_DAILY = Number(process.env.AI_DAILY_LIMIT_GLOBAL) || 500;

const redis = hasRedis() ? Redis.fromEnv() : null;

// Only initialise if env vars are present — allows local dev without Upstash.
const ipLimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(PER_IP_DAILY, '24 h'), prefix: 'ep:recipe', analytics: false })
  : null;
// Cost backstop: caps total generations across all users.
const globalLimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(GLOBAL_DAILY, '24 h'), prefix: 'ep:recipe-global', analytics: false })
  : null;

function pickTheme(mealType: string, ingredients: string[]): ThemeName {
  const ings = ingredients.join(' ');
  if (/salmon|fish|shrimp|prawn|crab|lobster|tuna/.test(ings))  return 'ocean';
  if (/spinach|kale|pesto|herb|broccoli|courgette/.test(ings))  return 'forest';
  if (/tomato|pepper|chili|beef|steak/.test(ings))              return 'tomato';
  if (/mushroom|sage|thyme|lentil|chickpea/.test(ings))         return 'sage';
  if (/chocolate|cake|brownie|cookie|cream/.test(ings))         return 'berry';
  if (/egg|bacon|pancake|waffle|oat/.test(ings))                return 'peach';
  if (/chicken|turkey|mustard|turmeric/.test(ings))             return 'mustard';
  const byMeal: Record<string, ThemeName> = {
    breakfast: 'peach', dessert: 'berry', snack: 'sage', lunch: 'mustard', dinner: 'tomato',
  };
  return byMeal[mealType] ?? 'tomato';
}

/** Unique id for an AI recipe: a Redis counter when available, otherwise a random id in a disjoint range. */
async function nextRecipeId(): Promise<number> {
  if (redis) {
    try { return AI_ID_BASE + (await redis.incr('ep:community:nextId')); } catch { /* fall through */ }
  }
  return 3_000_000_000_000_000 + Math.floor(Math.random() * 5_000_000_000_000_000);
}

export default async function handler(request: Request): Promise<Response> {
  const headers = corsHeaders(request, 'POST');

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, headers);
  if (!originAllowed(request)) return json({ error: 'Origin not allowed' }, 403, headers);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('generate-recipe: ANTHROPIC_API_KEY not set');
    return json({ error: 'Recipe generation is not available right now.' }, 503, headers);
  }

  // Rate limit before parsing the body or calling the AI.
  if (ipLimit && globalLimit) {
    const ip = await ipLimit.limit(clientIp(request));
    if (!ip.success) {
      const retryAfterSecs = Math.max(1, Math.ceil((ip.reset - Date.now()) / 1000));
      return json(
        { error: `Too many requests — you can generate ${ip.limit} recipes per day. Try again in ${Math.ceil(retryAfterSecs / 3600)} hour(s).` },
        429, headers,
        { 'Retry-After': String(retryAfterSecs), 'X-RateLimit-Limit': String(ip.limit), 'X-RateLimit-Remaining': String(ip.remaining), 'X-RateLimit-Reset': String(ip.reset) },
      );
    }
    const global = await globalLimit.limit('all');
    if (!global.success) {
      return json({ error: 'Recipe generation is busy today — please try again tomorrow.' }, 429, headers,
        { 'Retry-After': String(Math.max(1, Math.ceil((global.reset - Date.now()) / 1000))) });
    }
  }

  let body: { pantry?: unknown; appliances?: unknown; servings?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return json({ error: 'Invalid request body' }, 400, headers);
  }

  const pantry = Array.isArray(body.pantry) ? body.pantry : [];
  const appliances = Array.isArray(body.appliances) ? body.appliances : [];

  // Sanitise inputs — cap sizes and strip control characters to limit prompt injection surface.
  const clean = (v: unknown, max: number) =>
    [...String(v)].map((c) => (c.charCodeAt(0) < 32 || '<>{}'.includes(c) ? ' ' : c)).join('').trim().slice(0, max);
  const safePantry = pantry.slice(0, 30).map((s) => clean(s, 60)).filter(Boolean);
  const safeAppliances = appliances.slice(0, 10).map((s) => clean(s, 40)).filter(Boolean);
  const safeServings = Math.max(1, Math.min(12, Number(body.servings) || 4));

  if (safePantry.length === 0) {
    return json({ error: 'Pantry is empty — add ingredients first' }, 400, headers);
  }

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      tools: [{
        name: 'create_recipe',
        description: 'Generate a complete, achievable recipe from the provided pantry.',
        input_schema: {
          type: 'object' as const,
          required: ['name', 'emoji', 'description', 'ingredients', 'amounts', 'cookTime', 'difficulty', 'mealType', 'dietary', 'servings', 'steps'],
          properties: {
            name:        { type: 'string', description: 'Short, appealing dish name' },
            emoji:       { type: 'string', description: 'Single most-fitting emoji for the dish' },
            description: { type: 'string', description: 'One sentence that makes the dish sound delicious' },
            ingredients: { type: 'array', items: { type: 'string' }, description: 'Ingredient names in lowercase, singular' },
            amounts:     { type: 'array', items: { type: 'string' }, description: 'Amount for each ingredient in the same order, e.g. "2 tbsp"' },
            cookTime:    { type: 'number', description: 'Total cook + prep time in minutes' },
            difficulty:  { type: 'string', enum: ['easy', 'medium', 'hard'] },
            mealType:    { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'] },
            dietary:     { type: 'array', items: { type: 'string', enum: ['vegetarian', 'vegan', 'gluten-free'] }, description: 'Only include tags that are genuinely accurate' },
            servings:    { type: 'number' },
            steps:       { type: 'array', items: { type: 'string' }, description: '4–8 clear, actionable cooking steps' },
          },
        },
      }],
      tool_choice: { type: 'tool', name: 'create_recipe' },
      messages: [{
        role: 'user',
        content: `Create a recipe I can make right now.

Pantry: ${safePantry.join(', ')}
Appliances: ${safeAppliances.length ? safeAppliances.join(', ') : 'stovetop'}
Servings: ${safeServings}

Use only the pantry ingredients plus basic staples (salt, pepper, oil, butter, garlic, onion, water). Be creative but realistic.`,
      }],
    });

    if (message.stop_reason === 'refusal') {
      return json({ error: "Couldn't create a recipe from those ingredients." }, 422, headers);
    }

    const toolBlock = message.content.find((b) => b.type === 'tool_use');
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      return json({ error: 'No recipe returned — please try again.' }, 502, headers);
    }

    const input = toolBlock.input as Record<string, unknown>;
    const ingredients = Array.isArray(input.ingredients) ? input.ingredients.map(String) : [];
    const recipe = sanitizeRecipe({
      ...input,
      id: await nextRecipeId(),
      theme: pickTheme(String(input.mealType ?? ''), ingredients) satisfies ThemeName,
    });
    if (!recipe) {
      return json({ error: 'The generated recipe was incomplete — please try again.' }, 502, headers);
    }

    // Persist to community pool — never block the response on it.
    if (redis) {
      redis.lpush('ep:community:recipes', JSON.stringify(recipe))
        .then(() => redis.ltrim('ep:community:recipes', 0, 499))
        .catch((e) => console.error('community push failed', e));
    }

    return json(recipe, 200, headers);
  } catch (err) {
    console.error('generate-recipe failed', err);
    return json({ error: 'Recipe generation failed — please try again.' }, 502, headers);
  }
}
