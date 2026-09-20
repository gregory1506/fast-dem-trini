# Deployment

The repository already has `.github/workflows/deploy.yml`. It runs `npm ci` and
`npm run check`, then publishes `dist/` to GitHub Pages on pushes to `main` or
manual dispatch. The workflow reads the Node version from `.nvmrc`.

1. In the repository settings, enable Pages with GitHub Actions as the source.
2. Keep `base: '/fast-dem-trini/'` in `vite.config.ts` for this repository's Pages URL.
   For a renamed fork use `/<repo-name>/`; for root hosting use `/`.
3. Run `npm run check` and `npm run preview`. Open the printed URL with its base path.
4. Verify satellite/terrain, the three GeoJSON layers, and wind source labeling.
5. Merge an approved change to `main` to trigger the existing deployment workflow.

The separate `ci.yml` workflow checks pull requests but does not publish them.
Required status checks and merge permissions must be configured in GitHub settings.

This is a static client-side app: the browser must reach the external tile and
wind services. `?demo=1` replaces wind data only. No credentials are needed by the
current app. Do not add secrets to Vite client environment variables.
