import type { Recipe } from '../types';

export interface CuisineDef {
  id: string;
  label: string;
  flag: string;
}

export const CUISINES: CuisineDef[] = [
  { id: 'italian',       label: 'Italian',        flag: '🇮🇹' },
  { id: 'indian',        label: 'Indian',         flag: '🇮🇳' },
  { id: 'thai',          label: 'Thai',           flag: '🇹🇭' },
  { id: 'chinese',       label: 'Chinese',        flag: '🇨🇳' },
  { id: 'japanese',      label: 'Japanese',       flag: '🇯🇵' },
  { id: 'korean',        label: 'Korean',         flag: '🇰🇷' },
  { id: 'mexican',       label: 'Mexican',        flag: '🇲🇽' },
  { id: 'mediterranean', label: 'Mediterranean',  flag: '🌊' },
  { id: 'middle-eastern',label: 'Middle Eastern', flag: '🌙' },
  { id: 'french',        label: 'French',         flag: '🇫🇷' },
  { id: 'spanish',       label: 'Spanish',        flag: '🇪🇸' },
  { id: 'american',      label: 'American',       flag: '🇺🇸' },
  { id: 'british',       label: 'British',        flag: '🇬🇧' },
  { id: 'african',       label: 'African',        flag: '🌍' },
  { id: 'vietnamese',    label: 'Vietnamese',     flag: '🇻🇳' },
];

// Keywords checked against the recipe name (lowercased). Order matters — more
// specific entries take priority over broader ones placed later in the map.
const KEYWORDS: Record<string, string[]> = {
  thai: [
    'pad thai', 'pad see ew', 'pad kra pao', 'massaman', 'panang', 'larb',
    'som tum', 'tom kha', 'tom yum', 'khao pad', 'mango sticky', 'thai basil',
    'thai green', 'thai red', 'thai curry', 'thai fried', 'thai', 'satay',
  ],
  indian: [
    'butter chicken', 'tikka masala', 'chicken tikka', 'biryani', 'korma',
    'vindaloo', 'rogan josh', 'dal makhani', 'palak paneer', 'saag', 'paneer',
    'chana masala', 'chole', 'rajma', 'aloo gobi', 'tandoori', 'paratha',
    'dosa', 'idli', 'sambar', 'indian', 'masala dosa', 'lamb curry', 'chicken curry',
    'mutter', 'bhaji', 'pakora', 'biryani', 'dum', 'keema',
  ],
  japanese: [
    'ramen', 'tonkotsu', 'miso soup', 'teriyaki', 'yakitori', 'katsu',
    'udon', 'soba', 'gyoza', 'sushi', 'onigiri', 'oyakodon', 'nikujaga',
    'sukiyaki', 'shabu', 'takoyaki', 'okonomiyaki', 'japanese', 'dashi',
    'tamagoyaki', 'karaage', 'tempura', 'agedashi',
  ],
  korean: [
    'bulgogi', 'bibimbap', 'kimchi', 'japchae', 'galbi', 'galbitang',
    'sundubu', 'doenjang', 'jjigae', 'tteok', 'korean', 'gochujang',
    'haemul pajeon', 'samgyeopsal', 'dakgalbi', 'bossam',
  ],
  chinese: [
    'kung pao', 'mapo tofu', 'wonton', 'dim sum', 'fried rice', 'chow mein',
    'sweet and sour', 'dan dan', 'hong shao', 'char siu', 'peking duck',
    'congee', 'ma po', 'lemon chicken', 'chinese', 'lion\'s head',
    'spring roll', 'dumplings', 'hot pot', 'szechuan', 'sichuan',
  ],
  italian: [
    'pasta', 'risotto', 'carbonara', 'pesto', 'bruschetta', 'lasagna',
    'lasagne', 'gnocchi', 'ossobuco', 'tiramisu', 'amatriciana', 'puttanesca',
    'vongole', 'arrabbiata', 'cacio e pepe', 'alla norma', 'bolognese',
    'pizza', 'minestrone', 'ribollita', 'caponata', 'saltimbocca', 'italian',
    'linguine', 'spaghetti', 'fettuccine', 'pappardelle', 'ravioli', 'tortellini',
  ],
  mexican: [
    'taco', 'enchilada', 'quesadilla', 'mole', 'guacamole', 'tamale',
    'pozole', 'carnitas', 'chiles rellenos', 'chile verde', 'sopa de',
    'cochinita', 'tinga', 'mexican', 'burrito', 'fajita', 'elote',
    'salsa verde', 'huevos rancheros',
  ],
  mediterranean: [
    'hummus', 'falafel', 'shakshuka', 'tzatziki', 'moussaka', 'spanakopita',
    'greek salad', 'greek', 'souvlaki', 'kleftiko', 'imam bayildi',
    'tiropita', 'cypriot', 'sabich',
  ],
  'middle-eastern': [
    'shawarma', 'kofta', 'köfte', 'tagine', 'couscous', 'moroccan',
    'persian', 'lebanese', 'turkish', 'harira', 'kibbeh', 'ghormeh',
    'mansaf', 'koshari', 'ful medames', 'baba ganoush', 'tabbouleh',
    'za\'atar', 'adana kebab', 'kebab',
  ],
  french: [
    'coq au vin', 'bouillabaisse', 'ratatouille', 'croque', 'boeuf bourguignon',
    'cassoulet', 'pot-au-feu', 'gratin dauphinois', 'quiche', 'crepe', 'crêpe',
    'blanquette', 'poulet', 'french onion', 'french', 'vichyssoise', 'soufflé',
    'tarte tatin', 'duck confit',
  ],
  spanish: [
    'paella', 'gazpacho', 'albondigas', 'patatas bravas', 'gambas al ajillo',
    'croquetas', 'tortilla española', 'fabada', 'cocido', 'merluza',
    'arroz negro', 'spanish', 'tapas',
  ],
  american: [
    'mac and cheese', 'clam chowder', 'buffalo wing', 'pulled pork',
    'bbq brisket', 'texas brisket', 'nashville', 'cornbread', 'american',
    'smash burger', 'hot dog', 'new england', 'louisiana', 'cincinnati chili',
    'red beans and rice',
  ],
  british: [
    'cottage pie', 'shepherd\'s pie', 'bangers and mash', 'scotch broth',
    'lancashire hotpot', 'welsh cawl', 'beef wellington', 'chicken pie',
    'toad in the hole', 'british', 'english', 'irish stew', 'guinness stew',
  ],
  african: [
    'jollof', 'egusi', 'injera', 'bobotie', 'suya', 'doro wat',
    'groundnut soup', 'moqueca', 'african', 'west african', 'ethiopian',
    'nigerian', 'ghanaian', 'south african', 'misir wot',
  ],
  vietnamese: [
    'pho', 'bánh mì', 'banh mi', 'bún bò', 'bun bo', 'vietnamese',
    'bò kho', 'bo kho', 'com tam', 'canh chua', 'nuoc cham',
    'lemongrass chicken', 'summer roll',
  ],
};

// Build a flat list of [cuisineId, keyword] pairs sorted by keyword length
// descending so longer (more specific) keywords match first.
const SORTED_PAIRS: Array<[string, string]> = Object.entries(KEYWORDS)
  .flatMap(([id, kws]) => kws.map((kw): [string, string] => [id, kw]))
  .sort((a, b) => b[1].length - a[1].length);

export function inferCuisine(recipe: Recipe): string | null {
  const haystack = `${recipe.name} ${recipe.description}`.toLowerCase();
  for (const [id, kw] of SORTED_PAIRS) {
    if (haystack.includes(kw)) return id;
  }
  return null;
}
