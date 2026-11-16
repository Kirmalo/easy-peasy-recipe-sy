# Improvement Roadmap

Working list from the full-repo review (2026-11-16). Tick items off as they land; delete this file once every item is done.

## Phase 1 — Correctness & safety

- [x] Bug 1: AI-generated recipes persist and appear in Cookbook / Cooking / Shopping list (single recipe lookup)
- [x] Bug 2: Whole-word ingredient matching (no "egg" ↔ "eggplant", "ice" ↔ "rice")
- [x] Bug 3: `RecipeDetail` calls a hook after an early return
- [x] Bug 6: `CookingStepsView` crashes when the recipe id is unknown
- [x] Bug 7: Empty pantry gives every recipe score 0.5 (arbitrary deck order)
- [x] `npm audit fix`; removed unused `react-router-dom`, `@types/react-router-dom`, `autoprefixer`, `postcss` (0 prod vulns; 4 moderate remain in build-only workbox tooling, need upstream fix)
- [x] Lock CORS on API routes to own origin
- [x] Validate AI output on write and community recipes on read
- [x] Collision-free ids for AI recipes
- [x] Stop leaking raw error messages from API routes
- [x] Rate limit: use platform IP header + global daily cap
- [x] Model id configurable via `ANTHROPIC_MODEL` (default stays Haiku 4.5; Haiku 5.5 needs a check of forced tool_choice vs. its default thinking)

## Phase 2 — Quality gates

- [x] Bug 4: Cooking timer based on wall-clock end time (no drift when backgrounded)
- [x] Bug 5: `FilterSheet` defines a component during render
- [x] Fix all remaining lint errors
- [x] Unit tests (Vitest): matching, scaleAmount, parseSpeech, inferCuisine, timer, validation, moderation (72 tests)
- [x] Moderation for the community recipe pool (blocklist + pantry-grounding check on write and read; reporting/upvotes in Phase 4)
- [x] GitHub Actions CI: typecheck, lint, test, build

## Phase 3 — Performance & architecture

- [x] Move recipe data out of the main JS bundle (lazy chunks; main JS 1.67 MB → 410 KB, 474 → 129 KB gzip)
- [x] Code-split overlays (RecipeDetail, CookingSteps, Filter/Pantry sheets)
- [x] Set-based lookups + precomputed cuisine in the deck
- [x] Clean up image cache in-flight map; don't permanently cache misses
- [x] Routing: `/recipe/:id`, `/cook/:id`, back button closes overlays, shareable links
- [x] Central store instead of prop drilling from `App.tsx`
- [x] Versioned storage + cross-tab sync
- [x] Screen wake lock during cooking
- [x] Pixabay lookups via serverless proxy (no key in the client bundle)
- [x] Affiliate link disclosure
- [x] Accessibility: dialog roles, focus trap, Escape to close, labels, reduced motion, AA text contrast
- [x] Undo last swipe-left
- [x] README refresh (env vars, architecture, real recipe counts)

## Phase 4 — Features

- [x] Ingredient substitutions
- [x] Metric / imperial toggle + amount normalisation
- [x] Pantry upkeep: expiry dates, "use it up" sort, deduct on cook
- [x] Weekly meal plan feeding the shopping list
- [x] Optional device sync (private sync code + QR, no accounts)
- [x] Community pool: upvotes, reporting, surface best AI recipes in Discover
- [x] Allergen info + verified diet tags (nutrition numbers intentionally out of scope)
- [x] Hands-free voice commands in cooking mode
