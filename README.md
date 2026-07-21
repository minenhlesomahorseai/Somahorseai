# Somahorse.ai

Somahorse.ai turns an agricultural operating problem into a scoped, priced, staffed, and funded delivery project.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and add the environment credentials.

3. Apply the Supabase migrations in `supabase/migrations` to the linked project:

   ```bash
   npx supabase db push
   ```

4. Start the application:

   ```bash
   npm run dev
   ```

The local app is available at [http://localhost:3000](http://localhost:3000).

## Project intake workflow

- Each user and assistant turn is written to Supabase as it happens.
- Gemini maintains a structured intake state and prepares a proposal in at most ten questions. A deterministic fallback keeps the intake moving if the AI provider is temporarily unavailable.
- Matching only considers certified talent marked available with no active assignment.
- Accepting a proposal prepares one idempotent project and a Paddle deposit transaction.
- A verified `transaction.completed` event activates the project, reserves still-available talent, writes payment and notification records, and sends client, talent, and admin email alerts.
- Client billing, talent assignments, and the admin project control room all read from the same project record.

## Paddle setup

Create a Paddle notification destination pointing to:

```text
https://YOUR_DOMAIN/api/paddle/webhook
```

Subscribe it to `transaction.completed`, `transaction.payment_failed`, and `transaction.past_due`. Put its endpoint secret in `PADDLE_WEBHOOK_SECRET_KEY`, and use credentials from the same Paddle environment for `PADDLE_API_KEY` and `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`.

The project deposit is collected as a one-time ZAR transaction. Invoice links are requested from Paddle when the client or an admin opens them, so expired invoice URLs are not stored.

## Verification

```bash
npm run lint
npx tsc --noEmit
npm run build
```
