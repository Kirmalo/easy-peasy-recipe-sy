# Easy Peasy Recipe-sy

A swipe-to-cook recipe discovery app. Add what's in your kitchen, get matched recipes one card at a time — swipe right to cook, left to skip, bookmark to save. Can't find a match? Generate one from your pantry with AI.

Installable as a PWA on iOS and Android.

## Stack

- **Vite 8** + **React 19** + **TypeScript**
- **Tailwind CSS v4** (design tokens in `src/styles/tokens.css`)
- **Framer Motion** — swipe card and sheet animations
- **Zustand** — app state, persisted to `localStorage`
- **lucide-react** — icons
- **Vercel functions** (`api/`) — AI recipe generation (Claude), community recipe pool and image proxy, backed by **Upstash Redis**
- **Vitest** — unit tests

## Local dev

```bash
npm install
npm run dev          # http://localhost:5173 — front end only; /api routes need `vercel dev`
npm run typecheck
npm run lint
npm test             # vitest run (npm run test:watch for watch mode)
npm run build        # outputs to dist/
npm run preview      # serve the built dist/ locally
```

To exercise the API routes locally, use the Vercel CLI: `vercel dev` (reads env vars from `.env.local`).

CI (`.github/workflows/ci.yml`) runs typecheck, lint, tests and build on every pull request.

## Environment variables

All are optional — without them the app still works, minus the feature that needs them.

| Variable | Used by | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | `api/generate-recipe` | Enables "Generate a recipe from my pantry" |
| `ANTHROPIC_MODEL` | `api/generate-recipe` | Override the model (default `claude-haiku-4-5-20251001`). The route uses forced `tool_choice`; check that a newer model still accepts it before switching. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | `api/*` | Rate limiting, recipe ids and the shared community recipe pool |
| `AI_DAILY_LIMIT_PER_IP` | `api/generate-recipe` | Generations per IP per 24 h (default 5) |
| `AI_DAILY_LIMIT_GLOBAL` | `api/generate-recipe` | Total generations per 24 h across everyone (default 500) — cost backstop |
| `ALLOWED_ORIGINS` | `api/*` | Extra comma-separated origins allowed to call the API from a browser (same-origin is always allowed) |
| `PIXABAY_API_KEY` | `api/recipe-image` | Fallback food photos. Server-side only (the old `VITE_PIXABAY_API_KEY` name is still read, but no longer shipped to the browser). |

## Deployment

The repo is set up for **Vercel**: connect it, keep the build command `npm run build` and output directory `dist`. `vercel.json` rewrites client routes (`/discover`, `/recipe/123`, `/cook/123`, …) to `index.html` so deep links work.

On another static host, serve `dist/` with an SPA fallback to `index.html`; the `/api` features won't be available. If the app lives under a subpath (e.g. `example.com/recipes/`), set `base` in `vite.config.ts` — the router honours it.

## Project structure

```
api/
  generate-recipe.ts      # POST — Claude recipe from pantry; rate limited, validated, moderated
  community-recipes.ts    # GET — latest community AI recipes (re-validated on read)
  recipe-image.ts         # GET ?q= — Pixabay search, streamed from our origin and CDN-cached
  _lib/http.ts            # CORS allow-list, JSON helpers, client IP (not deployed as a route)
src/
  App.tsx                 # layout, routing between tabs and overlays
  store/appStore.ts       # Zustand store: all user state + actions, versioned persistence
  context/                # RecipesProvider — built-in catalog (lazy) + AI recipes, lookup hooks
  data/
    recipes.ts            # 25 curated recipes (bundled) + loadAllRecipes() for the full catalog
    recipes-extended.ts   # ~600 TheMealDB recipes (generated; own chunk)
    recipes-ai-seed.ts    # 150 AI seed recipes (generated; own chunk)
    themes.ts, staples.ts, commonIngredients.ts, defaults.ts
  lib/
    matching.ts           # whole-word ingredient matching, synonyms, staples, scoring
    recipeValidation.ts   # sanitizeRecipe() — shared by client and API
    moderation.ts         # blocklist + pantry-grounding screen for AI recipes
    router.ts             # URL ⇄ route mapping
    timer.ts, scaleAmount.ts, parseSpeech.ts, cuisine.ts, affiliate.ts, api.ts (images)
  hooks/                  # useRoute, useDialog, useWakeLock, useRecipeImage, useSpeechRecognition
  components/             # SwipeCard, GridCard, RecipeDetail, sheets, BottomNav, …
  views/                  # Kitchen, Discover, Cookbook, Cooking, CookingSteps
scripts/
  fetch-meals.mjs         # npm run fetch-recipes — regenerate recipes-extended.ts
  generate-ai-recipes.mjs # npm run generate-ai-recipes — regenerate recipes-ai-seed.ts
```

## Routes

| Path | Screen |
|---|---|
| `/` | Kitchen (pantry entry) |
| `/discover` | Swipe deck |
| `/cookbook` | Saved recipes |
| `/cooking` | Queue + previously cooked |
| `/recipe/:id` | Recipe detail overlay (shareable) |
| `/cook/:id` | Step-by-step cooking mode |

Overlays are history entries, so the browser / Android Back button closes them.

## Data persistence

User state lives in one `localStorage` key, `recipesy-state`, written by the Zustand `persist` middleware with a schema version (`STORE_VERSION` in `src/store/appStore.ts`). Everything read back is validated, so a corrupt or older value can't break the app. Data from the pre-store per-field keys (`pantry`, `cookbook`, …) is migrated automatically on first load. Open tabs stay in sync through the `storage` event.

Persisted: pantry, appliances, filters, cookbook, cooking queue, passed recipes, cooked history, ratings, notes and the AI recipes you generated.

## Improvement roadmap

Remaining work is tracked in [`ROADMAP.md`](./ROADMAP.md).
