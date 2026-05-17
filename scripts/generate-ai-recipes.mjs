#!/usr/bin/env node
/**
 * Generates ~150 diverse AI seed recipes using Claude Haiku and saves them as
 * static TypeScript data. Run once; commit the output file.
 *
 * Usage:
 *   node --env-file=.env.local scripts/generate-ai-recipes.mjs
 *   ANTHROPIC_API_KEY=sk-ant-... node scripts/generate-ai-recipes.mjs
 */

import Anthropic from '@anthropic-ai/sdk';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '../src/data/recipes-ai-seed.ts');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const THEMES = ['tomato', 'mustard', 'sage', 'ocean', 'rose', 'berry', 'forest', 'peach'];

// 30 batches × 5 recipes = ~150 recipes
const BATCHES = [
  { label: 'Thai dinner',        prompt: 'Thai dinner dishes: pad see ew, massaman curry, larb gai, tom kha gai, panang curry',           mealType: 'dinner' },
  { label: 'Mexican dinner',     prompt: 'Mexican dinner dishes: cochinita pibil, chiles en nogada, chile verde, tinga, sopa de lima',    mealType: 'dinner' },
  { label: 'Indian dinner',      prompt: 'Indian dinner dishes: saag gosht, rajma, chicken korma, lamb rogan josh, aloo gobi',            mealType: 'dinner' },
  { label: 'Japanese',           prompt: 'Japanese dishes: oyakodon, nikujaga, tonkotsu ramen, agedashi tofu, yaki udon',                 mealType: 'dinner' },
  { label: 'Italian pasta',      prompt: 'Italian pasta: pasta alla norma, spaghetti alle vongole, pasta e fagioli, gnocchi sorrentina, pappardelle al cinghiale', mealType: 'dinner' },
  { label: 'Korean',             prompt: 'Korean dishes: sundubu jjigae, samgyeopsal, doenjang jjigae, galbitang, haemul pajeon',        mealType: 'dinner' },
  { label: 'Mediterranean',      prompt: 'Mediterranean dishes: Greek moussaka, Turkish İmam bayıldı, Cypriot kleftiko, Israeli sabich bowl, Levantine kibbeh', mealType: 'dinner' },
  { label: 'Chinese',            prompt: 'Chinese dishes: hong shao rou, dan dan noodles, fish-fragrant eggplant, steamed sea bass, wonton soup', mealType: 'dinner' },
  { label: 'Vietnamese',         prompt: 'Vietnamese dishes: bò kho, bún bò huế, cơm tấm, canh chua, thịt kho trứng',                    mealType: 'dinner' },
  { label: 'French',             prompt: 'French dishes: pot-au-feu, bouillabaisse, poulet rôti avec jus, gratin dauphinois, blanquette de veau', mealType: 'dinner' },
  { label: 'Spanish',            prompt: 'Spanish dishes: cocido madrileño, gambas al ajillo, arroz negro, merluza en salsa verde, fabada asturiana', mealType: 'dinner' },
  { label: 'Middle Eastern',     prompt: 'Middle Eastern dishes: Persian ghormeh sabzi, Lebanese kibbeh bil sanieh, Egyptian koshari, Moroccan harira, Jordanian mansaf', mealType: 'dinner' },
  { label: 'American comfort',   prompt: 'American comfort food: Texas brisket chili, New England clam chowder, Nashville hot chicken, Louisiana red beans and rice, Cincinnati chili', mealType: 'dinner' },
  { label: 'Latin American',     prompt: 'Latin American dishes: Peruvian ceviche, Argentine chimichurri steak, Colombian bandeja paisa, Cuban ropa vieja, Brazilian moqueca', mealType: 'dinner' },
  { label: 'British',            prompt: 'British dishes: Lancashire hotpot, Scotch broth, Welsh cawl, Irish beef and Guinness stew, proper chicken pie', mealType: 'dinner' },
  { label: 'Vegetarian dinner',  prompt: '5 vegetarian dinner dishes from different cuisines: Indian paneer tikka masala, Italian eggplant caponata, Thai basil tofu, Greek stuffed peppers, Mexican lentil soup', mealType: 'dinner' },
  { label: 'Vegan dinner',       prompt: '5 vegan dinner dishes: Ethiopian misir wot, Jamaican ackee and plantain bowl, Indian chhole bhature, Thai green curry with tofu, Moroccan chickpea tagine', mealType: 'dinner' },
  { label: 'Gluten-free',        prompt: '5 naturally gluten-free dinner dishes: Mexican pozole, Thai som tum with rice noodles, Greek souvlaki bowl, Indian butter chicken with rice, Japanese teriyaki chicken rice bowl', mealType: 'dinner' },
  { label: 'Quick weeknight',    prompt: '5 quick weeknight dinners (15-20 min): prawn stir-fry, smash burger, halloumi wrap bowl, sausage pasta, tuna poke bowl', mealType: 'dinner' },
  { label: 'Slow cooker',        prompt: '5 slow cooker recipes: pulled pork shoulder, Tuscan white bean soup, Korean short rib stew, chicken mole, French cassoulet', mealType: 'dinner' },
  { label: 'Breakfast global',   prompt: '5 global breakfast dishes: Turkish menemen, Japanese tamagoyaki rice bowl, Indian masala omelette, Egyptian ful medames, Huevos rancheros', mealType: 'breakfast' },
  { label: 'Brunch',             prompt: '5 brunch dishes: Dutch baby pancake, croque madame, shakshuka verde, smashed potato hash, ricotta toast with honey', mealType: 'breakfast' },
  { label: 'Lunch bowls',        prompt: '5 hearty lunch bowls: Korean bibimbap, grain bowl with roasted veg, bánh mì bowl, falafel bowl with pickled veg, Thai larb salad bowl', mealType: 'lunch' },
  { label: 'Soups',              prompt: '5 hearty soups: Tuscan ribollita, spiced carrot lentil soup, pho-style noodle broth, Mexican tortilla soup, Hungarian goulash', mealType: 'lunch' },
  { label: 'Seafood',            prompt: '5 seafood dinner dishes: Thai green prawn curry, Sicilian pasta con le sarde, Spanish bacalao a la vizcaína, Korean spicy squid, French bouillabaisse-style stew', mealType: 'dinner' },
  { label: 'Grilling & BBQ',    prompt: '5 grill and BBQ recipes: Peruvian pollo a la brasa, Korean galbi, Middle Eastern lamb kofta, jerk pork chops, smash burgers with special sauce', mealType: 'dinner' },
  { label: 'Air fryer',          prompt: '5 air fryer recipes: crispy panko chicken tenders, whole roasted cauliflower, salt and pepper prawns, falafel, Korean honey garlic chicken', mealType: 'dinner' },
  { label: 'African',            prompt: '5 African dishes: Ghanaian jollof rice, Ethiopian doro wat, Moroccan lamb tagine with prunes, South African bobotie, Nigerian egusi soup', mealType: 'dinner' },
  { label: 'Desserts',           prompt: '5 dessert recipes: Japanese mochi ice cream, Basque burnt cheesecake, Colombian tres leches, Persian saffron rice pudding, churros con chocolate', mealType: 'dessert' },
  { label: 'Snacks & sides',    prompt: '5 snack and side dishes: elote (Mexican street corn), Vietnamese summer rolls, Greek tiropita, Spanish croquetas, Indian samosa chaat', mealType: 'snack' },
];

const TOOL_DEF = {
  name: 'add_recipes',
  description: 'Return an array of exactly 5 recipe objects',
  input_schema: {
    type: 'object',
    required: ['recipes'],
    properties: {
      recipes: {
        type: 'array',
        minItems: 5,
        maxItems: 5,
        items: {
          type: 'object',
          required: ['name', 'emoji', 'theme', 'description', 'ingredients', 'amounts', 'cookTime', 'difficulty', 'mealType', 'dietary', 'servings', 'steps', 'appliances'],
          properties: {
            name: { type: 'string', description: 'Recipe name (3-6 words)' },
            emoji: { type: 'string', description: 'Single most relevant emoji' },
            theme: { type: 'string', enum: THEMES, description: 'Color theme that suits the dish visually' },
            description: { type: 'string', description: 'Appetising 1-2 sentence description, max 120 chars, no generic phrases' },
            ingredients: { type: 'array', items: { type: 'string' }, description: 'Ingredient names, lowercase singular, 5-14 items' },
            amounts: { type: 'array', items: { type: 'string' }, description: 'Corresponding amounts (must match ingredients array length)' },
            cookTime: { type: 'number', description: 'Total cook time in minutes (prep + cook)' },
            difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
            mealType: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'] },
            dietary: { type: 'array', items: { type: 'string', enum: ['vegetarian', 'vegan', 'gluten-free'] }, description: 'Only genuinely applicable tags' },
            servings: { type: 'number', description: 'Typical servings (2-6)' },
            steps: { type: 'array', items: { type: 'string' }, description: '4-8 clear steps, each 25-100 words, actionable and specific' },
            appliances: { type: 'array', items: { type: 'string', enum: ['oven', 'air-fryer', 'grill', 'slow-cooker', 'microwave', 'blender'] }, description: 'Only required special appliances; omit standard stovetop/knife/pan' },
          },
        },
      },
    },
  },
};

async function generateBatch({ label, prompt, mealType }) {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    tools: [TOOL_DEF],
    tool_choice: { type: 'any' },
    messages: [
      {
        role: 'user',
        content: `Generate exactly 5 authentic, delicious recipes for: ${prompt}.

Key requirements:
- Each recipe must be a genuinely distinct dish with a unique name
- Ingredients are realistic home-cook quantities (grams, cups, tbsp — not just "some" or "to taste")
- Steps are specific and actionable, not vague (include timings, temperatures, visual cues)
- mealType should be "${mealType}" unless the dish clearly belongs elsewhere
- Only mark dietary tags that are 100% true for the dish as written
- Descriptions are vivid and specific — avoid "full of flavour", "classic", or "easy to put together"
- amounts array length MUST exactly match ingredients array length`,
      },
    ],
  });

  const tool = msg.content.find((b) => b.type === 'tool_use');
  if (!tool) throw new Error(`No tool_use in response`);
  const recipes = tool.input.recipes;
  // Validate lengths match
  for (const r of recipes) {
    if (r.ingredients.length !== r.amounts.length) {
      throw new Error(`${r.name}: ingredients(${r.ingredients.length}) ≠ amounts(${r.amounts.length})`);
    }
  }
  return recipes;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY not set.');
    console.error('Run: node --env-file=.env.local scripts/generate-ai-recipes.mjs');
    process.exit(1);
  }

  console.log(`Generating ${BATCHES.length * 5} recipes across ${BATCHES.length} cuisines/categories...\n`);

  const allRecipes = [];
  let nextId = 9_000_001;
  let failed = 0;

  for (const batch of BATCHES) {
    process.stdout.write(`  ${batch.label.padEnd(22)}`);
    try {
      const recipes = await generateBatch(batch);
      for (const r of recipes) allRecipes.push({ id: nextId++, ...r });
      console.log(`✓  ${recipes.length} recipes`);
    } catch (err) {
      console.log(`✗  ${err.message}`);
      failed++;
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`\n${allRecipes.length} recipes generated (${failed} batches failed).`);

  const ts = `// AUTO-GENERATED — do not edit manually.
// Regenerate with: node --env-file=.env.local scripts/generate-ai-recipes.mjs
// Last generated: ${new Date().toISOString().slice(0, 10)}
// Count: ${allRecipes.length} recipes

import type { Recipe } from '../types';

export const AI_SEED_RECIPES: Recipe[] = ${JSON.stringify(allRecipes, null, 2)};
`;

  writeFileSync(OUT_PATH, ts, 'utf8');
  console.log(`\nWritten → ${OUT_PATH}`);
  console.log('Next: git add src/data/recipes-ai-seed.ts && git commit && git push');
}

main().catch((err) => { console.error(err); process.exit(1); });
