# Repository Guidelines

## Project Structure & Module Organization
The app is a Vite + React + TypeScript frontend at repository root. Core entry files are `index.tsx`, `App.tsx`, and `index.css`. Place UI screens and reusable UI blocks in `components/` (for example, `Dashboard.tsx`, `AnalysisWizard.tsx`). Keep API/model interaction logic in `services/` (for example, `geminiService.ts`). Put shared helpers in `utils/` (for example, `themeUtils.ts`, `translations.ts`). Shared types belong in `types.ts`. Build and compiler behavior is configured in `vite.config.ts` and `tsconfig.json`.

## Build, Test, and Development Commands
- `npm install`: Install dependencies.
- `npm run dev`: Start local dev server (Vite, configured for port `3000`).
- `npm run build`: Create production bundle in `dist/`; run this before opening a PR.
- `npm run preview`: Serve the built bundle locally for final verification.

## Coding Style & Naming Conventions
Use TypeScript and React functional components. Follow existing formatting: 2-space indentation, semicolons, and clear typed props/interfaces. Use:
- PascalCase for component/type names (`AnalysisResultView`, `GlobalSettings`)
- camelCase for functions/variables (`analyzeSupplierOffers`, `searchQuery`)
- descriptive file names matching exported components (`Settings.tsx`, `Suppliers.tsx`)

Prefer keeping external service calls inside `services/` and UI state/rendering inside `components/`. Use relative imports or the configured `@/` alias consistently.

## Testing Guidelines
Automated tests are not configured yet. Until a test runner is introduced, every contribution must include:
- `npm run build` passing with no errors
- Manual smoke checks for key flows: login, create analysis, dashboard/history navigation, and settings updates

When adding automated tests later, use `*.test.ts` / `*.test.tsx` naming and colocate tests with related modules.

## Commit & Pull Request Guidelines
Follow Conventional Commits (for example: `feat: add supplier filter`, `fix: handle empty offer list`). Keep commit subjects imperative and focused. PRs should include:
- concise summary of behavior changes
- linked issue/ticket (if available)
- validation evidence (`npm run build` and manual QA steps)
- screenshots/GIFs for UI updates

## Security & Configuration Tips
Store secrets only in `.env.local`. The app expects `GEMINI_API_KEY`. Never commit API keys or environment files containing credentials.
