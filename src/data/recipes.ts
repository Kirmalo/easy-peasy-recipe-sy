import type { Recipe } from '../types';
import { EXTENDED_RECIPES } from './recipes-extended';
import { AI_SEED_RECIPES } from './recipes-ai-seed';

export const CUISINE_LABELS: Record<string, string> = {
  easy: 'Easy', medium: 'Medium', hard: 'Hard',
  breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack', dessert: 'Dessert',
};

const CURATED_RECIPES: Recipe[] = [
  {
    id: 1, name: 'Garlic Butter Pasta', emoji: '🍝', theme: 'mustard',
    description: 'Silky pasta tossed in a glossy, garlicky butter sauce.',
    ingredients: ['pasta', 'garlic', 'butter', 'parmesan', 'parsley', 'olive oil', 'salt', 'pepper'],
    amounts:     ['200g',  '4 cloves', '3 tbsp', '50g grated', 'handful', '1 tbsp', 'to taste', 'to taste'],
    cookTime: 15, difficulty: 'easy', mealType: 'dinner', dietary: ['vegetarian'], servings: 2,
    steps: [
      'Bring a large pot of salted water to a boil.',
      'Cook pasta until al dente. Reserve 1/2 cup pasta water before draining.',
      'Melt butter in a wide pan over medium heat. Add minced garlic and cook 1 min.',
      'Toss in pasta with a splash of pasta water and grated parmesan.',
      'Finish with chopped parsley, salt, pepper, and a drizzle of olive oil.',
    ],
  },
  {
    id: 2, name: 'Tomato Basil Bruschetta', emoji: '🍅', theme: 'tomato',
    description: 'Toasty bread piled high with sweet tomatoes and torn basil.',
    ingredients: ['bread', 'tomatoes', 'basil', 'garlic', 'olive oil', 'balsamic', 'salt'],
    amounts:     ['½ baguette', '4 ripe', 'large handful', '1 clove', '3 tbsp', '1 tbsp', 'to taste'],
    cookTime: 10, difficulty: 'easy', mealType: 'snack', dietary: ['vegetarian', 'vegan'], servings: 4,
    steps: [
      'Dice tomatoes; toss with torn basil, olive oil, balsamic, and salt.',
      'Slice bread, brush with oil, and toast until golden.',
      'Rub warm toasts with a halved garlic clove.',
      'Spoon tomato mixture onto each toast just before serving.',
    ],
  },
  {
    id: 3, name: 'Lemon Herb Chicken', emoji: '🍗', theme: 'sage',
    description: 'Juicy chicken with bright lemon and fresh herbs.',
    ingredients: ['chicken', 'lemon', 'garlic', 'olive oil', 'thyme', 'rosemary', 'salt', 'pepper'],
    amounts:     ['4 thighs', '1', '4 cloves', '2 tbsp', '4 sprigs', '2 sprigs', 'generous', 'to taste'],
    cookTime: 30, difficulty: 'easy', mealType: 'dinner', dietary: ['gluten-free'], servings: 4,
    steps: [
      'Pat chicken dry; season generously with salt and pepper.',
      'Sear in olive oil, skin-side down, until golden (about 5 min).',
      'Flip, add garlic, lemon slices, thyme, and rosemary.',
      'Transfer to a 400°F oven for 18-22 min until cooked through.',
      'Rest 5 min, then squeeze over more fresh lemon.',
    ],
  },
  {
    id: 4, name: 'Rainbow Veggie Stir-Fry', emoji: '🥢', theme: 'forest',
    description: 'Crisp-tender veggies in a glossy soy-ginger glaze.',
    ingredients: ['broccoli', 'bell pepper', 'carrots', 'soy sauce', 'garlic', 'ginger', 'sesame oil', 'rice'],
    amounts:     ['1 head', '2', '2 large', '3 tbsp', '3 cloves', '1 tsp grated', '1 tbsp', '1 cup dry'],
    cookTime: 20, difficulty: 'easy', mealType: 'dinner', dietary: ['vegetarian', 'vegan'], servings: 3,
    steps: [
      'Cook rice according to package instructions.',
      'Heat sesame oil in a wok over high heat.',
      'Add garlic and ginger; stir for 30 seconds.',
      'Toss in vegetables, hardest first. Stir-fry 4-6 min.',
      'Splash with soy sauce and serve over rice.',
    ],
  },
  {
    id: 5, name: 'Classic Grilled Cheese', emoji: '🧀', theme: 'mustard',
    description: 'Crispy, golden, melty perfection.',
    ingredients: ['bread', 'cheese', 'butter'],
    amounts:     ['2 thick slices', '2 slices', '2 tbsp'],
    cookTime: 8, difficulty: 'easy', mealType: 'lunch', dietary: ['vegetarian'], servings: 1,
    steps: [
      'Butter one side of each bread slice.',
      'Place buttered-side down in a cold skillet.',
      'Layer cheese and top with second slice, buttered-side up.',
      'Cook over medium-low until deeply golden, flip, repeat.',
    ],
  },
  {
    id: 6, name: 'Mushroom Risotto', emoji: '🍄', theme: 'peach',
    description: 'Creamy, slow-stirred rice with deeply savory mushrooms.',
    ingredients: ['rice', 'mushrooms', 'butter', 'parmesan', 'onion', 'garlic', 'white wine', 'broth'],
    amounts:     ['300g arborio', '300g sliced', '4 tbsp', '80g grated', '1 medium', '3 cloves', '100ml', '1L warm'],
    cookTime: 45, difficulty: 'medium', mealType: 'dinner', dietary: ['vegetarian'], servings: 4,
    steps: [
      'Sauté sliced mushrooms in butter until deep brown. Set aside.',
      'Soften diced onion and garlic in more butter.',
      'Add arborio rice; toast 1 min. Pour in white wine; stir until absorbed.',
      'Add warm broth one ladle at a time, stirring constantly, 18-22 min.',
      'Finish with parmesan, mushrooms, and a final knob of butter.',
    ],
  },
  {
    id: 7, name: 'Avocado Toast Deluxe', emoji: '🥑', theme: 'sage',
    description: 'Smashed avocado, lemon, chili crunch — the brunch classic.',
    ingredients: ['bread', 'avocado', 'lemon', 'chili flakes', 'salt', 'olive oil'],
    amounts:     ['2 slices', '1 ripe', '½', 'pinch', 'to taste', '1 tsp'],
    cookTime: 5, difficulty: 'easy', mealType: 'breakfast', dietary: ['vegetarian', 'vegan'], servings: 1,
    steps: [
      'Toast bread until deeply golden.',
      'Mash avocado with lemon juice and a pinch of salt.',
      'Spread thickly on toast.',
      'Drizzle with olive oil and shower with chili flakes.',
    ],
  },
  {
    id: 8, name: 'Egg Fried Rice', emoji: '🍚', theme: 'mustard',
    description: 'Fluffy day-old rice, fragrant eggs, scallions.',
    ingredients: ['rice', 'eggs', 'soy sauce', 'green onion', 'garlic', 'sesame oil', 'peas'],
    amounts:     ['2 cups cold', '3 large', '2 tbsp', '3 stalks', '2 cloves', '1 tsp', 'handful'],
    cookTime: 15, difficulty: 'easy', mealType: 'dinner', dietary: ['vegetarian'], servings: 2,
    steps: [
      'Push cold rice to one side of a screaming-hot wok.',
      'Scramble eggs in the cleared space until just set.',
      'Toss everything together with peas and minced garlic.',
      'Splash with soy and sesame oil. Finish with sliced scallions.',
    ],
  },
  {
    id: 9, name: 'Caprese Salad', emoji: '🥗', theme: 'tomato',
    description: 'Mozzarella, tomatoes, basil — barely a recipe, mostly perfect.',
    ingredients: ['tomatoes', 'mozzarella', 'basil', 'olive oil', 'balsamic', 'salt'],
    amounts:     ['3 ripe', '250g fresh', 'large handful', '3 tbsp', '1 tbsp', 'flaky'],
    cookTime: 5, difficulty: 'easy', mealType: 'lunch', dietary: ['vegetarian', 'gluten-free'], servings: 2,
    steps: [
      'Slice ripe tomatoes and fresh mozzarella into thick rounds.',
      'Layer on a platter, alternating with whole basil leaves.',
      'Drizzle generously with olive oil and a touch of balsamic.',
      'Finish with flaky salt.',
    ],
  },
  {
    id: 10, name: 'Coconut Chickpea Curry', emoji: '🍛', theme: 'peach',
    description: 'Cozy, fragrant, ready in under 30.',
    ingredients: ['chickpeas', 'tomatoes', 'onion', 'garlic', 'ginger', 'coconut milk', 'curry powder', 'rice'],
    amounts:     ['2 cans (400g)', '1 can (400g)', '1 large', '4 cloves', '1 tsp grated', '400ml', '2 tsp', '1½ cups dry'],
    cookTime: 25, difficulty: 'easy', mealType: 'dinner', dietary: ['vegan', 'gluten-free'], servings: 4,
    steps: [
      'Sauté diced onion until soft. Add garlic, ginger, curry powder.',
      'Stir in tomatoes; cook until jammy, about 5 min.',
      'Pour in coconut milk and chickpeas; simmer 15 min.',
      'Season to taste. Serve over rice with fresh cilantro.',
    ],
  },
  {
    id: 11, name: 'Fluffy Banana Pancakes', emoji: '🥞', theme: 'mustard',
    description: 'Tall, golden, with bananas folded right in.',
    ingredients: ['bananas', 'eggs', 'flour', 'milk', 'baking powder', 'butter', 'salt'],
    amounts:     ['2 ripe', '2 large', '1 cup', '¾ cup', '1½ tsp', '2 tbsp', 'pinch'],
    cookTime: 20, difficulty: 'easy', mealType: 'breakfast', dietary: ['vegetarian'], servings: 4,
    steps: [
      'Mash 2 ripe bananas in a bowl.',
      'Whisk in eggs, milk, then flour, baking powder, and salt.',
      'Rest batter 5 min. Heat buttered skillet over medium-low.',
      'Cook 1/4-cup portions until bubbles set, then flip.',
    ],
  },
  {
    id: 12, name: 'Tuna Melt', emoji: '🥪', theme: 'ocean',
    description: 'Crispy outside, creamy melty inside.',
    ingredients: ['bread', 'tuna', 'mayo', 'cheese', 'butter', 'onion', 'celery'],
    amounts:     ['4 slices', '2 cans (140g)', '3 tbsp', '4 slices', '2 tbsp', '¼', '1 stalk'],
    cookTime: 12, difficulty: 'easy', mealType: 'lunch', dietary: [], servings: 2,
    steps: [
      'Mix tuna with mayo, finely diced onion and celery.',
      'Pile onto bread, top with cheese and second slice.',
      'Butter outsides; cook in a skillet over medium-low.',
      'Flip when deeply golden; press gently until cheese melts.',
    ],
  },
  {
    id: 13, name: 'Pesto Pasta', emoji: '🌿', theme: 'forest',
    description: 'Vibrant basil pesto clinging to every twist of pasta.',
    ingredients: ['pasta', 'basil', 'pine nuts', 'garlic', 'parmesan', 'olive oil', 'lemon'],
    amounts:     ['400g', '2 big handfuls', '2 tbsp', '1 clove', '50g grated', '80ml', '½'],
    cookTime: 20, difficulty: 'easy', mealType: 'dinner', dietary: ['vegetarian'], servings: 4,
    steps: [
      'Blitz basil, pine nuts, garlic, and parmesan in a food processor.',
      'Stream in olive oil until smooth. Squeeze in lemon.',
      'Cook pasta; reserve some pasta water.',
      'Toss pasta with pesto, loosening with pasta water as needed.',
    ],
  },
  {
    id: 14, name: 'Sheet Pan Veggies', emoji: '🥕', theme: 'peach',
    description: 'Caramelized, herby, hands-off magic.',
    ingredients: ['carrots', 'broccoli', 'potatoes', 'olive oil', 'garlic', 'thyme', 'salt', 'pepper'],
    amounts:     ['3 large', '1 head', '4 medium', '3 tbsp', '4 cloves', '6 sprigs', 'to taste', 'to taste'],
    cookTime: 35, difficulty: 'easy', mealType: 'dinner', dietary: ['vegetarian', 'vegan', 'gluten-free'], servings: 4,
    steps: [
      'Heat oven to 425°F.',
      'Chop veggies into similar-sized pieces.',
      'Toss with olive oil, smashed garlic, thyme, salt, pepper.',
      'Spread on a sheet pan; roast 25-30 min, flipping once.',
    ],
  },
  {
    id: 15, name: 'Hearty Lentil Soup', emoji: '🍲', theme: 'tomato',
    description: 'Stick-to-your-ribs comfort in a bowl.',
    ingredients: ['lentils', 'carrots', 'onion', 'celery', 'garlic', 'tomatoes', 'broth', 'cumin'],
    amounts:     ['1½ cups dry', '2', '1 large', '2 stalks', '3 cloves', '1 can (400g)', '1.5L', '1 tsp'],
    cookTime: 40, difficulty: 'easy', mealType: 'dinner', dietary: ['vegetarian', 'vegan', 'gluten-free'], servings: 6,
    steps: [
      'Sauté diced onion, carrots, and celery until soft.',
      'Add garlic and cumin; cook 1 min until fragrant.',
      'Stir in lentils, tomatoes, and broth.',
      'Simmer 25-30 min until lentils are tender. Season well.',
    ],
  },
  {
    id: 16, name: 'Greek Salad', emoji: '🫒', theme: 'ocean',
    description: 'Crunchy, briny, sun-on-a-plate.',
    ingredients: ['cucumber', 'tomatoes', 'feta', 'olives', 'onion', 'olive oil', 'oregano', 'lemon'],
    amounts:     ['1 large', '3', '200g', 'handful', '½ red', '4 tbsp', '1 tsp dried', '½'],
    cookTime: 10, difficulty: 'easy', mealType: 'lunch', dietary: ['vegetarian', 'gluten-free'], servings: 4,
    steps: [
      'Chop cucumber and tomatoes into rough chunks.',
      'Slice red onion thinly. Add to a bowl with olives.',
      'Crumble in feta. Dress with olive oil, lemon, oregano.',
      'Toss gently and let sit 5 min before serving.',
    ],
  },
  {
    id: 17, name: 'Weeknight Beef Tacos', emoji: '🌮', theme: 'berry',
    description: 'Quick, savory, customizable with whatever\'s in the fridge.',
    ingredients: ['ground beef', 'tortillas', 'cheese', 'lettuce', 'tomatoes', 'onion', 'cumin', 'chili powder'],
    amounts:     ['500g', '8 small', 'grated, to taste', 'shredded', '2', '1', '1 tsp', '1 tsp'],
    cookTime: 20, difficulty: 'easy', mealType: 'dinner', dietary: [], servings: 4,
    steps: [
      'Brown ground beef with diced onion; drain excess fat.',
      'Stir in cumin, chili powder, salt, and a splash of water.',
      'Warm tortillas in a dry skillet.',
      'Build tacos with beef, cheese, lettuce, and tomatoes.',
    ],
  },
  {
    id: 18, name: 'Cilantro Chimichurri Steak', emoji: '🥩', theme: 'forest',
    description: 'Seared steak under a vibrant herb-and-garlic shower.',
    ingredients: ['steak', 'cilantro', 'parsley', 'garlic', 'olive oil', 'red wine vinegar', 'chili flakes', 'salt'],
    amounts:     ['2 × 200g', 'large handful', 'small handful', '3 cloves', '60ml', '2 tbsp', 'pinch', 'generous'],
    cookTime: 20, difficulty: 'medium', mealType: 'dinner', dietary: ['gluten-free'], servings: 2,
    steps: [
      'Finely chop cilantro, parsley, and garlic; mix with oil, vinegar, chili flakes, salt. Rest 10 min.',
      'Pat steak dry; season heavily with salt and pepper.',
      'Sear in a screaming-hot pan, 3-4 min per side for medium-rare.',
      'Rest 5 min, slice against the grain.',
      'Spoon chimichurri generously over the top.',
    ],
  },
  {
    id: 19, name: 'Caprese Sandwich', emoji: '🥖', theme: 'rose',
    description: 'Crusty bread, ripe tomato, oozy mozzarella, basil.',
    ingredients: ['bread', 'tomatoes', 'mozzarella', 'basil', 'olive oil', 'balsamic', 'salt'],
    amounts:     ['2 crusty rolls', '2 ripe', '150g fresh', 'handful', '2 tbsp', '1 tsp', 'flaky'],
    cookTime: 8, difficulty: 'easy', mealType: 'lunch', dietary: ['vegetarian'], servings: 2,
    steps: [
      'Split a crusty roll; drizzle insides with olive oil.',
      'Layer with sliced mozzarella, tomato, basil leaves.',
      'Sprinkle with salt and a few drops of balsamic.',
      'Press lightly. Optionally grill until cheese softens.',
    ],
  },
  {
    id: 20, name: 'Veggie Omelette', emoji: '🍳', theme: 'mustard',
    description: 'Fluffy eggs folded around whatever\'s in your crisper.',
    ingredients: ['eggs', 'cheese', 'bell pepper', 'onion', 'mushrooms', 'butter', 'salt', 'pepper'],
    amounts:     ['3 large', 'handful grated', '½', '¼', '3', '1 tbsp', 'to taste', 'to taste'],
    cookTime: 10, difficulty: 'easy', mealType: 'breakfast', dietary: ['vegetarian', 'gluten-free'], servings: 1,
    steps: [
      'Sauté diced veggies in butter until soft; remove.',
      'Whisk eggs with salt and pepper.',
      'Pour into the buttered pan; gently push edges to center.',
      'When mostly set, add veggies and cheese; fold and slide onto a plate.',
    ],
  },
  {
    id: 21, name: 'Creamy Tomato Soup', emoji: '🥣', theme: 'tomato',
    description: 'Velvety, deeply tomato-y, made for dunking.',
    ingredients: ['tomatoes', 'onion', 'garlic', 'basil', 'cream', 'butter', 'broth'],
    amounts:     ['2 cans (800g)', '1 large', '3 cloves', 'handful', '100ml', '2 tbsp', '500ml'],
    cookTime: 30, difficulty: 'easy', mealType: 'lunch', dietary: ['vegetarian', 'gluten-free'], servings: 4,
    steps: [
      'Sauté onion and garlic in butter until soft.',
      'Add tomatoes and broth; simmer 15 min.',
      'Blend until completely smooth.',
      'Stir in cream and torn basil. Salt to taste.',
    ],
  },
  {
    id: 22, name: 'Garlic Butter Shrimp', emoji: '🦐', theme: 'rose',
    description: 'Plump shrimp swimming in lemony garlic butter.',
    ingredients: ['shrimp', 'garlic', 'butter', 'lemon', 'parsley', 'chili flakes', 'olive oil'],
    amounts:     ['400g peeled', '4 cloves', '3 tbsp', '1', 'handful', 'pinch', '1 tbsp'],
    cookTime: 12, difficulty: 'easy', mealType: 'dinner', dietary: ['gluten-free'], servings: 3,
    steps: [
      'Pat shrimp dry; season with salt.',
      'Sauté garlic in butter and olive oil until just golden.',
      'Add shrimp; cook 2 min per side until pink.',
      'Off heat: squeeze in lemon, scatter parsley and chili flakes.',
    ],
  },
  {
    id: 23, name: 'Crispy Quesadillas', emoji: '🫓', theme: 'mustard',
    description: 'Buttery, golden, oozing with cheese.',
    ingredients: ['tortillas', 'cheese', 'butter', 'onion', 'bell pepper'],
    amounts:     ['4 large', '200g grated', '2 tbsp', '1', '1'],
    cookTime: 10, difficulty: 'easy', mealType: 'lunch', dietary: ['vegetarian'], servings: 2,
    steps: [
      'Sauté diced peppers and onion until soft (optional).',
      'Butter one side of each tortilla.',
      'In a hot pan: tortilla butter-down, cheese, veggies, cheese, tortilla.',
      'Cook until golden, flip, repeat. Slice into wedges.',
    ],
  },
  {
    id: 24, name: 'Honey Garlic Salmon', emoji: '🐟', theme: 'rose',
    description: 'Glossy, sticky-sweet, ready in 15.',
    ingredients: ['salmon', 'honey', 'garlic', 'soy sauce', 'lemon', 'butter', 'olive oil'],
    amounts:     ['2 fillets', '2 tbsp', '3 cloves', '2 tbsp', '1', '1 tbsp', '1 tbsp'],
    cookTime: 15, difficulty: 'medium', mealType: 'dinner', dietary: ['gluten-free'], servings: 2,
    steps: [
      'Whisk honey, soy sauce, minced garlic, and lemon juice.',
      'Sear salmon skin-down in oil until crispy, 4 min.',
      'Flip, pour in sauce, add butter; baste constantly 2-3 min.',
      'Spoon glaze over fillets to serve.',
    ],
  },
  {
    id: 25, name: 'Chocolate Mug Cake', emoji: '🍫', theme: 'berry',
    description: 'Rich, gooey, ready before your tea cools.',
    ingredients: ['flour', 'cocoa powder', 'sugar', 'milk', 'butter', 'vanilla', 'chocolate chips'],
    amounts:     ['4 tbsp', '2 tbsp', '3 tbsp', '3 tbsp', '2 tbsp melted', 'splash', '2 tbsp'],
    cookTime: 5, difficulty: 'easy', mealType: 'dessert', dietary: ['vegetarian'], servings: 1,
    steps: [
      'In a large mug, whisk 4 tbsp flour, 3 tbsp sugar, 2 tbsp cocoa.',
      'Stir in 3 tbsp milk, 2 tbsp melted butter, splash of vanilla.',
      'Top with chocolate chips.',
      'Microwave 60-90 seconds. Eat with a spoon.',
    ],
  },
];

export const RECIPES: Recipe[] = [...CURATED_RECIPES, ...EXTENDED_RECIPES, ...AI_SEED_RECIPES];

if (import.meta.env.DEV) {
  CURATED_RECIPES.forEach((r) => {
    if (r.amounts.length !== r.ingredients.length) {
      console.warn(
        `Recipe "${r.name}" (id ${r.id}): amounts.length (${r.amounts.length}) !== ingredients.length (${r.ingredients.length})`,
      );
    }
  });
}
