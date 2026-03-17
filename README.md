This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

**Run all commands from this folder (`healthcare-app`).** If you open the parent folder in your editor, run the dev server from here:

```bash
cd healthcare-app
npm run dev
```

If you see **404 on http://localhost:3000/**:
1. Confirm you're in the `healthcare-app` directory (where `package.json` and `src/app` live).
2. Clear the build cache: `npm run clean` then `npm run dev`.

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Supabase (multi-tenant healthcare)

1. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. In the [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor, run the migration in `supabase/migrations/20240315000000_healthcare_schema.sql` to create:
   - **clinics** – id, name, timezone, location_lat/lng, status (open/closed)
   - **daily_financials** – clinic_id, date, revenue/expense fields, manager_notes
   - **staff_check_ins** – profile_id, clinic_id, check_in/out times, mood_score (1–5)
   - **operational_alerts** – clinic_id, severity (low/high/critical), message, resolved
3. Realtime is enabled on `daily_financials` and `operational_alerts` (subscribe via `supabase.channel().on('postgres_changes', ...)`).

Types live in `src/types/database.ts`; Zod form schemas in `src/lib/validations/schemas.ts`. Use `createClient()` from `@/lib/supabase/client` (browser) or `createClient()` from `@/lib/supabase/server` (server components/route handlers).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
