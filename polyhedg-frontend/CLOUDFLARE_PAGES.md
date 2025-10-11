# Cloudflare Pages Configuration

## Build Settings

Configure your Cloudflare Pages project with these settings:

- **Framework preset**: Next.js
- **Build command**: `npm run build`
- **Build output directory**: `.vercel/output/static`
- **Environment variables**:
  - `NODE_ENV=production`
  - `SKIP_ENV_VALIDATION=true` (if needed)

## How it works

This project uses `@cloudflare/next-on-pages` adapter to convert the Next.js build into a format compatible with Cloudflare Pages. The adapter:

1. Runs `next build` to create the production build
2. Converts the output to work with Cloudflare Workers
3. Outputs to `.vercel/output/static` directory

This allows dynamic routes like `/[hedgeName]` to work properly on Cloudflare Pages.

## Local Testing

To test the production build locally:

```bash
npm run build
npx wrangler pages dev .vercel/output/static
```

## Notes

- The adapter is deprecated in favor of OpenNext, but still works for this use case
- Dynamic routes are fully supported
- All client-side features (sessionStorage, API calls) work as expected
