# Cloudflare Pages Configuration

## Build Settings

Configure your Cloudflare Pages project with these settings:

- **Framework preset**: None (or Next.js - Static HTML Export)
- **Build command**: `npm run build`
- **Build output directory**: `out`
- **Environment variables**:
  - `NODE_ENV=production`
  - `SKIP_ENV_VALIDATION=true` (if needed)

## How it works

This project uses Next.js static export mode (`output: "export"`), which generates a fully static site in the `out` directory. All pages are client-side rendered, which works perfectly with Cloudflare Pages.

## Local Testing

To test the production build locally:

```bash
npm run build
npx serve out
```

This will serve the static files from the `out` directory, similar to how Cloudflare Pages will serve them.
