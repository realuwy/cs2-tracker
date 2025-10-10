# CS2 Inventory Tracker — Starter

A minimal Next.js (App Router) + Tailwind + TanStack Table starter for a CS2 inventory tracker:
- Import public Steam inventory (API route stubbed).
- Add manual "storage" items.
- Show price columns (mocked for now) and % change pills.
- Guest portfolio persisted in localStorage.
- Ready to deploy on Vercel.

## Getting started

```bash
npm i
npm run dev
```

Visit http://localhost:3000

## Project structure
- `src/app` — Next.js App Router pages
  - `/` landing with import bar
  - `/app/market` demo market table
  - `/app/portfolio` guest portfolio with add-item dialog
- `src/app/api/*` — API route placeholders
- `src/components/*` — UI components
- `src/lib/*` — types, mock data, local storage

## Next steps (what to wire next)
1. **Steam public inventory fetch** in `src/app/api/inventory/route.ts` (server-side) using the public community endpoint.
2. **Skinport pricing** in `src/app/api/prices/skinport/route.ts` with server-side caching (5–10 min).
3. **Snapshots & deltas**: create a cron job (Vercel Cron) that writes hourly buckets in a DB (Supabase recommended).
4. **Auth & cloud save**: add Supabase for email/password auth; migrate guest portfolios to an account on signup.

## Deployment
- Click "Deploy" to Vercel or run `vercel` CLI if installed.
- Ensure `.env.local` exists (auto-created on postinstall).

## Notes
- Images domains are whitelisted in `next.config.js`.
- This is a slim starter intended for iteration, not production.
