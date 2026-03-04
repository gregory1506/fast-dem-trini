# Deployment (Free Tier Options)

This project is a static Vite app and can be hosted on any static host.

## Option A: GitHub Pages (recommended)
Use the official GitHub Actions flow for Vite.

1. Set the base path in `vite.config.ts` (only if the site is hosted at a repo subpath):\n   Example: `base: '/REPO_NAME/'`.\n2. Add the GitHub Pages workflow (see below).\n3. Push to `main` and enable Pages:\n   - Repo Settings → Pages\n   - Source: **GitHub Actions**\n4. Your site will be published at:\n   - `https://<username>.github.io/<repo>/`\n
### GitHub Actions workflow
Create `.github/workflows/pages.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ "main" ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## Option B: Cloudflare Pages (free)
- Build command: `npm run build`
- Output directory: `dist`

## Option C: Netlify (free)
- Build command: `npm run build`
- Output directory: `dist`

## Option D: Vercel (free)
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

## Notes
- If the app uses a MapTiler key, keep it in an env var and load it at build time.
- If using a subpath, set `base` in `vite.config.ts` (e.g., `/repo-name/`).
- Confirm all assets are relative to the base.
