import Anthropic from '@anthropic-ai/sdk';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

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

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
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

Pantry: ${pantry.join(', ')}
Appliances: ${appliances.length ? appliances.join(', ') : 'stovetop'}
Servings: ${servings}

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

    return new Response(JSON.stringify(recipe), { status: 200, headers: CORS_HEADERS });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: CORS_HEADERS });
  }
}
