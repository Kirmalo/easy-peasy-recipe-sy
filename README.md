# Easy Peasy Recipe-sy

A swipe-to-cook recipe discovery app. Add ingredients, get matched recipes one card at a time — swipe right to cook, left to skip, bookmark to save.

## Stack

- **Vite 8** + **React 19** + **TypeScript**
- **Tailwind CSS v4** (design tokens in `src/styles/tokens.css`)
- **Framer Motion** — swipe card animations
- **lucide-react** — icons
- Storage: `localStorage` (no backend, single-user)

## Local dev

```bash
npm install
npm run dev        # http://localhost:5173
```

## Production build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the built dist/ locally
```

The `dist/` folder is a self-contained static site — no server needed.

## Deployment

Upload the contents of `dist/` to your host. If the app lives under a subpath (e.g. `christopherpettus.com/recipes/`), set the `base` option in `vite.config.ts` before building:

```ts
export default defineConfig({
  base: '/recipes/',
  plugins: [tailwindcss(), react()],
})
```

For Netlify or Vercel, connect the repo and set the build command to `npm run build` and the output directory to `dist`.

## Project structure

```
src/
  App.tsx                 # root component, all persisted state lives here
  types/index.ts          # shared TypeScript types (Recipe, Filters, etc.)
  data/
    recipes.ts            # 25 seed recipes + CUISINE_LABELS
    themes.ts             # 8 per-recipe color palettes
    staples.ts            # common pantry staples list
    commonIngredients.ts  # quick-add chip categories
  lib/
    matching.ts           # ingredient fuzzy matching + scoring
    parseSpeech.ts        # spoken text → ingredient list
    api.ts                # TheMealDB image fetcher (module-level cache)
  hooks/
    useStorage.ts         # localStorage-backed state (drop-in for future backend)
    useRecipeImage.ts     # cached recipe photo hook
    useSpeechRecognition.ts  # Web Speech API wrapper
  components/
    SwipeCard.tsx         # hero swipeable card (Framer Motion drag)
    GridCard.tsx          # grid tile + RecipeGrid layout
    RecipeDetail.tsx      # full-screen recipe view
    FilterSheet.tsx       # bottom-sheet filter panel
    BottomNav.tsx         # tab bar
    Pill.tsx / IconButton.tsx  # small reusable bits
  views/
    KitchenView.tsx       # ingredient entry (type + voice)
    DiscoverView.tsx      # swipe deck
    CookbookView.tsx      # saved recipes
    CookingView.tsx       # "currently making" list
  styles/
    tokens.css            # CSS custom properties (design system)
    index.css             # Tailwind v4 entry + tokens import
```

## Data persistence

All state is stored in `localStorage` under these keys:
- `pantry` — ingredients the user has added
- `filters` — active filter settings
- `cookbook` — saved recipe IDs
- `making` — "I'm making this" recipe IDs
- `passed` — swiped-left recipe IDs (excluded from deck)

To add a backend later, swap `useStorage` to hit an API; the rest of the app is unchanged.

## Roadmap (post-port)

1. More recipes (target 100-200; TheMealDB API has plenty)
2. "Surprise me" button — random match
3. Shopping list from Cooking recipes
4. Step-by-step cooking mode with timers
5. PWA manifest + service worker for installability
