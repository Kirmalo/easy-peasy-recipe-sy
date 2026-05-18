export type ViewId = 'kitchen' | 'discover' | 'cookbook' | 'making';
export type ThemeName = 'tomato' | 'sage' | 'mustard' | 'berry' | 'peach' | 'ocean' | 'forest' | 'rose';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';
export type DietaryTag = 'vegetarian' | 'vegan' | 'gluten-free';
export type ApplianceTag = 'stovetop' | 'oven' | 'air-fryer' | 'grill' | 'slow-cooker' | 'microwave' | 'blender';
export type IngredientMode = 'all' | 'strict' | 'flex1' | 'flex2' | 'flex3';
export type SwipeDirection = 'left' | 'right';

export interface Theme {
  from: string;
  to: string;
  dark: string;
  soft: string;
}

export interface Recipe {
  id: number;
  name: string;
  emoji: string;
  theme: ThemeName;
  description: string;
  ingredients: string[];
  amounts: string[];
  cookTime: number;
  difficulty: Difficulty;
  mealType: MealType;
  dietary: DietaryTag[];
  servings: number;
  steps: string[];
  appliances?: ApplianceTag[];
}

export interface Filters {
  cookTime: number | null;
  difficulty: Difficulty | null;
  mealType: MealType | null;
  dietary: DietaryTag[];
  ingredientMode: IngredientMode;
  cuisine: string | null;
}

export interface MatchResult {
  score: number;
  have: number;
  need: number;
  missing: string[];
}
