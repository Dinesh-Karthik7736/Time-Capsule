# Time Capsule

A static, mobile-first cultural snapshot of the year you were born, starting with Kerala. It uses pre-generated JSON so the deployed site has no runtime backend or exposed API keys.

## Run locally

```sh
npm install
npm run generate:data
npm run dev
```

The pipeline intentionally starts with three hand-curated sample years. Add verified Kerala content to `data/curated/kerala.json`, then run `npm run generate:data` to publish static year files under `public/data/years` (the location served by Vite and static hosting).

To regenerate the archive, copy `.env.example` to `.env` and set `TMDB_API_KEY`, then run `npm run generate:data`. The generator includes language-filtered cinema for Kerala, Tamil, Telugu, Kannada, Marathi, Bengali, Punjabi, Odia, Assamese, and Hindi-speaking state groups. Other states use India-wide highlights. It also creates custom SVG playlist, sports, and newspaper artwork plus free YouTube search links.

Optional: set `GEMINI_API_KEY` and run `npm run generate:vibes` to add a short, non-factual playful caption to each year and its share card. The key is only used by this build-time script and is never sent to site visitors. If Gemini is unavailable, the script uses its local caption set. `DEEPSEEK_API_KEY` and `POLLINATIONS_API_KEY` are reserved for future build-time integrations and are not currently called by the app.

## Publishing

This project is ready for GitHub Pages or Cloudflare Pages. For Cloudflare Pages, use build command `npm run build` and output directory `dist`.
