import Anthropic from '@anthropic-ai/sdk';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// Only initialise if env vars are present — allows local dev without Upstash.
const ratelimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(5, '24 h'),
        prefix: 'ep:recipe',
        analytics: false,
      })
    : null;

type ThemeName = 'tomato' | 'sage' | 'mustard' | 'berry' | 'peach' | 'ocean' | 'forest' | 'rose';

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

function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: CORS_HEADERS });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }), { status: 500, headers: CORS_HEADERS });
  }

  // Rate limit before parsing the body or calling the AI.
  if (ratelimit) {
    const ip = getClientIp(request);
    const { success, limit, remaining, reset } = await ratelimit.limit(ip);
    if (!success) {
      const retryAfterSecs = Math.ceil((reset - Date.now()) / 1000);
      return new Response(
        JSON.stringify({ error: `Too many requests — you can generate ${limit} recipes per day. Try again in ${Math.ceil(retryAfterSecs / 3600)} hour(s).` }),
        {
          status: 429,
          headers: {
            ...CORS_HEADERS,
            'Retry-After': String(retryAfterSecs),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(reset),
          },
        },
      );
    }
  }

  let body: { pantry?: string[]; appliances?: string[]; servings?: number };
  try {
    body = await request.json() as typeof body;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400, headers: CORS_HEADERS });
  }

  const { pantry = [], appliances = [], servings = 4 } = body;

  if (pantry.length === 0) {
    return new Response(JSON.stringify({ error: 'Pantry is empty — add ingredients first' }), { status: 400, headers: CORS_HEADERS });
  }

  // Sanitise inputs — cap sizes to limit prompt injection surface.
  const safePantry = pantry.slice(0, 30).map((s) => String(s).slice(0, 60));
  const safeAppliances = appliances.slice(0, 10).map((s) => String(s).slice(0, 40));
  const safeServings = Math.max(1, Math.min(12, Number(servings) || 4));

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
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

    const toolBlock = message.content.find((b) => b.type === 'tool_use');
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      return new Response(JSON.stringify({ error: 'No recipe returned' }), { status: 500, headers: CORS_HEADERS });
    }

    const data = toolBlock.input as {
      name: string; emoji: string; description: string;
      ingredients: string[]; amounts: string[]; cookTime: number;
      difficulty: string; mealType: string; dietary: string[];
      servings: number; steps: string[];
    };

    const recipe = {
      ...data,
      id: Date.now(),
      theme: pickTheme(data.mealType, data.ingredients),
    };

    // Persist to community pool — fire and forget, never block the response.
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const { Redis } = await import('@upstash/redis');
      const redis = Redis.fromEnv();
      redis.lpush('ep:community:recipes', JSON.stringify(recipe))
        .then(() => redis.ltrim('ep:community:recipes', 0, 499))
        .catch(() => { /* non-fatal */ });
    }

    return new Response(JSON.stringify(recipe), { status: 200, headers: CORS_HEADERS });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: CORS_HEADERS });
  }
}
