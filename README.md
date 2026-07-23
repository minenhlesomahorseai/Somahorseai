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
- Accepting a proposal prepares one idempotent project and a Paddle deposit
  transaction in the client's supported checkout currency.
- A verified `transaction.completed` event activates the project, reserves still-available talent, writes payment and notification records, and sends client, talent, and admin email alerts.
- Client billing, talent assignments, and the admin project control room all read from the same project record.

## Paddle setup

Create a Paddle notification destination pointing to:

```text
https://YOUR_DOMAIN/api/paddle/webhook
```

Subscribe it to `transaction.completed`, `transaction.payment_failed`, and `transaction.past_due`. Put its endpoint secret in `PADDLE_WEBHOOK_SECRET_KEY`, and use credentials from the same Paddle environment for `PADDLE_API_KEY` and `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`.

Project values and the 60/40 allocation remain in canonical ZAR. Before a
deposit or milestone checkout is created, Paddle previews the equivalent amount
in the client's saved currency and that amount, rate, source, and timestamp are
stored immutably. If Paddle does not support the saved currency, checkout uses
USD while the true currency preference remains on the profile. Invoice links
are requested from Paddle when opened, so expired URLs are not stored.

In Paddle, open **Business account → Currencies** and enable the payment
currencies you want to accept. Paddle supports a defined payment-currency list,
not every ISO currency.

## Currency and cross-border ledger

1. Apply `015_currency_payment_ledger.sql`.
2. Set the server-only `OPEN_EXCHANGE_RATES_APP_ID`. It is used for public
   regional estimates and for locking a talent payout in currencies such as
   NGN or BWP.
3. A client or talent selects their currency at signup. Hosting country headers
   quietly choose the initial option for anonymous visitors; no IP address is
   stored.
4. Client checkout stores both the canonical ZAR value and the exact
   presentment amount in minor units.
5. Talent earnings stay in canonical ZAR until a real payout is made. Marking a
   payout paid requires its external reference and stores the converted payout
   amount, rate, source, and quote time.
6. Never sum amounts from different presentment currencies. Admin accounting
   totals use the canonical ledger; client and talent histories show their
   immutable external amounts.

## Transactional email setup

Follow-up email uses a durable Supabase outbox. Every onboarding event gets a
stable dedupe key, an immediate delivery attempt, retry timing, and an audit
status in the admin certification console.

1. In Resend, add and verify the domain used by Somahorse.ai.
2. Set `EMAIL_FROM` to an address on that verified domain, for example
   `Somahorse.ai <onboarding@your-company-domain.com>`.
3. Set `EMAIL_REPLY_TO`, `NEXT_PUBLIC_SITE_URL`, and a long random
   `CRON_SECRET`.
4. Apply migrations `013_reliable_email_interviews.sql`,
   `014_email_interview_grants.sql`, and
   `015_currency_payment_ledger.sql`.
5. Configure the hosting scheduler to call `GET /api/email/process` every five
   minutes with `Authorization: Bearer YOUR_CRON_SECRET`.

The Resend test sender (`onboarding@resend.dev`) is intentionally not used as a
production fallback because it can only send to restricted recipients. If the
sending domain is missing, messages remain visible in the queue instead of
being silently dropped.

## Talent certification email sequence

- Talent account welcome → complete the experience profile.
- Completed profile → application received.
- Profile approval → private assessment link.
- Assessment submission → assessment received.
- Assessment pass → open interview scheduling.
- Either participant proposes, declines, counters, or accepts a time within
  seven days.
- Accepted time → final email, `.ics` calendar file, and Google Calendar link.
- Interview pass → certification complete and talent dashboard access.
- Rejection at any review gate → stage-specific outcome email.
- Verified deposit/milestone/monthly payment → client receipt, talent earnings
  notice, and admin control-room alert.
- Recorded talent payout → talent payout receipt and admin confirmation.

Admins can inspect copy, recipients, status, attempts, provider errors, and
targeted retries at `/admin/emails`.

## Verification

```bash
npm run lint
npx tsc --noEmit
npm run build
```
