import type { Recipe } from '../types';

// ← Replace with your Amazon Associates tracking ID once approved
export const AMAZON_TAG = 'crispypettus-20';

export function amazonShopUrl(items: string[]): string {
  const query = items.slice(0, 8).join(' ');
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&i=amazonfresh&tag=${AMAZON_TAG}`;
}

export function amazonItemUrl(item: string): string {
  return `https://www.amazon.com/s?k=${encodeURIComponent(item)}&i=amazonfresh&tag=${AMAZON_TAG}`;
}

export interface EquipmentItem {
  name: string;
  emoji: string;
  query: string;
}

const SETS: Record<string, EquipmentItem[]> = {
  pasta:   [{ name: 'Pasta Pot', emoji: '🍲', query: 'large pasta pot with strainer lid' }, { name: 'Pasta Tongs', emoji: '🥢', query: 'stainless steel pasta tongs' }],
  beef:    [{ name: 'Cast Iron Skillet', emoji: '🍳', query: 'cast iron skillet 12 inch' }, { name: 'Meat Thermometer', emoji: '🌡️', query: 'instant read meat thermometer' }],
  chicken: [{ name: 'Roasting Pan', emoji: '🍗', query: 'roasting pan with rack' }, { name: 'Meat Thermometer', emoji: '🌡️', query: 'instant read meat thermometer' }],
  seafood: [{ name: 'Fish Spatula', emoji: '🐟', query: 'flexible fish spatula' }, { name: 'Non-stick Pan', emoji: '🍳', query: 'non-stick frying pan 10 inch' }],
  soup:    [{ name: 'Dutch Oven', emoji: '🫕', query: 'dutch oven cast iron 5 quart' }, { name: 'Immersion Blender', emoji: '🥤', query: 'immersion blender stick' }],
  salad:   [{ name: 'Salad Spinner', emoji: '🥗', query: 'salad spinner large' }, { name: 'Mandoline Slicer', emoji: '🔪', query: 'mandoline slicer vegetables' }],
  breakfast: [{ name: 'Non-stick Pan', emoji: '🍳', query: 'non-stick frying pan 10 inch' }, { name: 'Silicone Spatula', emoji: '🥄', query: 'silicone spatula set' }],
  dessert: [{ name: 'Mixing Bowls', emoji: '🥣', query: 'stainless steel mixing bowls set' }, { name: 'Baking Sheet', emoji: '🫓', query: 'half sheet baking pan nonstick' }],
  default: [{ name: "Chef's Knife", emoji: '🔪', query: "chef knife 8 inch" }, { name: 'Cutting Board', emoji: '🪵', query: 'wood cutting board large' }],
};

export function getEquipmentSuggestions(recipe: Recipe): EquipmentItem[] {
  const n = recipe.name.toLowerCase();
  if (n.includes('pasta') || n.includes('risotto') || n.includes('noodle') || n.includes('spaghetti')) return SETS.pasta;
  if (n.includes('steak') || n.includes('beef') || n.includes('burger') || n.includes('mince')) return SETS.beef;
  if (n.includes('chicken') || n.includes('turkey') || n.includes('poultry')) return SETS.chicken;
  if (n.includes('salmon') || n.includes('fish') || n.includes('shrimp') || n.includes('prawn') || n.includes('seafood')) return SETS.seafood;
  if (n.includes('soup') || n.includes('stew') || n.includes('chili') || n.includes('chilli') || n.includes('dal') || n.includes('curry')) return SETS.soup;
  if (n.includes('salad') || n.includes('slaw') || n.includes('bruschetta')) return SETS.salad;
  if (recipe.mealType === 'breakfast') return SETS.breakfast;
  if (recipe.mealType === 'dessert') return SETS.dessert;
  return SETS.default;
}
