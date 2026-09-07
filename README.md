# Time Capsule

A static, mobile-first cultural snapshot of the year you were born, starting with Kerala. It uses pre-generated JSON so the deployed site has no runtime backend or exposed API keys.

## Run locally

```sh
npm install
npm run generate:data
npm run dev
```

The pipeline intentionally starts with three hand-curated sample years. Add verified Kerala content to `data/curated/kerala.json`, then run `npm run generate:data` to publish static year files.

## Publishing

This project is ready for GitHub Pages or Cloudflare Pages. For Cloudflare Pages, use build command `npm run build` and output directory `dist`.
