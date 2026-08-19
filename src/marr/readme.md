# The Johnny Marr Collection

An interactive, scroll-driven web experience showcasing the Johnny Marr guitar
collection. Guitars start as a circle, then orbit into a focus view (one large
hero guitar with the others arcing off the left of the screen) with catalogue
details for each instrument.

## Stack

- **Vite 8** + **React 19** (plain JavaScript / JSX)
- CSS Modules for styling — no UI framework
- Custom Arizona typefaces (`public/fonts`)
- A single `requestAnimationFrame` loop drives all scroll-linked motion

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
```

## Build

```bash
npm run build    # outputs static site to dist/
npm run preview  # serve the built output locally
```

## Deploy

`.github/workflows/build-and-deploy-marr.yml` builds this folder and uploads
`dist/` to Azure Storage — staging on push to `marr-sale`, production on push
to `main`. Only changes under `src/marr/**` trigger it.

`railway.json` and the `npm start` script are carried over from the original
standalone repo and are not used by the Actions pipeline.

## Project layout

```
src/
  Experience.jsx        scroll experience + all layout math
  experience.module.css styling for the experience
  guitars.js            catalogue data (title / maker / estimate per guitar)
  index.css             global styles + @font-face
public/
  images/  guitar cut-outs (transparent PNGs)
  fonts/   Arizona family
  icons/   UI glyphs
  videos/  hero.mp4
```

## SEO / sharing

`index.html` carries the full head: canonical + Open Graph + Twitter card
pointing at https://experience.christies.com/marr/, a 1200×630 `og-image.jpg`
built from the wordmark and the ES-355, Christie's favicons, and JSON-LD
(WebPage + ItemList of the 13 lots, names verbatim from `guitars.js` — update
both together if lots change).

`public/robots.txt` and `sitemap.xml` deploy under /marr/, and robots.txt only
has authority at the domain root — the root robots.txt on
experience.christies.com currently 403s, which crawlers treat as "no
restrictions", so the site is indexable. Submit
https://experience.christies.com/marr/sitemap.xml in Search Console; it cannot
be auto-discovered from a root robots.txt we don't control.

Assets are referenced with root-absolute paths (`/images/…`), so `base` is left
at the Vite default. If this site is ever served from a sub-path, those paths
need to move to `import.meta.env.BASE_URL` first.
