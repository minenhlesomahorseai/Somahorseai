# Backend Handoff

## What is already done

- Supabase auth is wired for signup, login, protected dashboards, roles, onboarding, admin checks, and RLS policies.
- Database migrations already create profiles, client/talent onboarding, assessments, intake chats, projects, payments, assignments, notifications, and helper RPCs.
- Project intake works through `/api/projects/intake`, saves chat messages, uses Gemini when configured, and keeps a fallback flow.
- Developer matching works through `/api/projects/match`, using available certified talent from Supabase.
- Paddle checkout is wired for localized project deposits and milestones,
  immutable presentment-currency snapshots, invoice lookup, payment status
  polling, and webhook-based project activation.
- Transactional email uses a durable Supabase outbox with dedupe keys, retries,
  branded HTML plus plain text, attachments, and admin delivery health.
- Talent certification includes complete lifecycle email coverage and a
  two-sided seven-day interview negotiation flow with Google Calendar links.

## Required production setup

- Apply all migrations through `015_currency_payment_ledger.sql`.
- Verify a Resend sending domain and set `EMAIL_FROM`; the test sender is not a
  production fallback.
- Configure a five-minute scheduler for `GET /api/email/process` using the
  `CRON_SECRET` bearer token.
- Set `OPEN_EXCHANGE_RATES_APP_ID` for marketing estimates and talent payouts
  in currencies beyond Paddle's supported checkout list.

## Next 3 Backend Tasks

### 1. Add a backend setup checklist

Create a simple checklist for setting up Supabase, Paddle, Gemini, Resend, and admin emails locally.

Start with: `README.md`, `.env.example`, `supabase/migrations/`

Done when: a new developer can follow the checklist, add env vars, run migrations, and know which services are optional vs required.

### 2. Test the payment webhook flow

Manually test that a completed Paddle transaction changes a project from pending to paid/active and writes payment records.

Start with: `src/app/api/paddle/webhook/route.ts`, `src/lib/projects/activation.ts`, `supabase/migrations/010_project_intake_checkout.sql`

Done when: there is a short note showing the webhook event tested, the database rows that changed, and any error seen.

### 3. Add simple backend smoke tests

Add lightweight checks for the main API routes: unauthenticated users get blocked, bad input returns clear errors, and happy paths do not crash.

Start with: `src/app/api/projects/intake/route.ts`, `src/app/api/projects/match/route.ts`, `src/app/api/paddle/status/route.ts`

Done when: `npm run lint`, `npx tsc --noEmit`, and the new smoke checks pass.
