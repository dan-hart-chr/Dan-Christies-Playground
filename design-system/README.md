Design System — Microsites

Purpose: centralised colour and typographic tokens plus guidance for Figma parity.

Quick start (per-project)

1. Install Tailwind in the project if not present:

```
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```

2. Use the shared Tailwind preset from this folder. Prefer the TypeScript preset when your project supports it.

JS usage (project `tailwind.config.cjs`):

```
// in your project's tailwind.config.cjs
module.exports = require('./design-system/tailwind.preset.ts');
```

TypeScript usage (project `tailwind.config.ts`):

```
import preset from './design-system/tailwind.preset';
export default {
	content: [
		'./**/*.html',
		'./**/*.js',
	],
	...preset,
};
```

3. Import tokens.json where needed (component libraries, style utilities) to keep JS-driven styling consistent.

Figma parity
- Follow `FIGMA_MAPPING.md` for naming and export conventions.
- Keep `tokens.json` and Figma token exports in sync; treat them as a single source of truth.

Preset notes
- `tailwind.preset.ts` is a superset of the token values and utility extensions we use across microsites. Projects can import it directly or merge/extend it as needed.
- If your project needs fewer utilities, import the preset and override `theme.extend` locally.

Local validation
- A validator script compares `tokens.json` against a Figma Atoms export at `atoms.tokens.json` and writes `token-mismatch-report.json`.
- Run locally (from repo root):

```bash
# Node 18+
node projects/christies-digital-microsites/design-system/scripts/validateTokens.js
```

The script prints `::warning::` annotations for GitHub and always exits successfully (workflow is set to WARN by default).

Updating tokens
- Edit `tokens.json` and run a visual audit in Figma. Tag the change in the commit message with `design-tokens:`.

Questions or changes: open an issue and tag `design-system`.
