# 180 Capital Flow — Solar Loan Payment Portal

A customer-facing payment portal for 180 Degree Solar that lets solar customers log in, view their loan details, and make monthly payments via Stripe.

## Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Database:** PostgreSQL + Prisma ORM
- **Payments:** Stripe (Payment Intents + Webhooks)
- **Auth:** NextAuth.js v5 (credentials-based)
- **Styling:** Tailwind CSS

## Features

### Customer Portal
- Secure login
- Dashboard showing all loans, remaining balances, and progress
- Loan detail page with full payment history
- Stripe-powered payment form (credit card, ACH, etc.)

### Admin Dashboard
- Overview stats (customers, active loans, total collected)
- Create customers with temporary passwords
- Create loans (auto-calculates monthly payment via amortization formula)
- View all loans and payment status

## Setup

### 1. Environment

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `STRIPE_SECRET_KEY` — from Stripe Dashboard → Developers → API Keys
- `STRIPE_PUBLISHABLE_KEY` — same location
- `STRIPE_WEBHOOK_SECRET` — from Stripe Dashboard → Webhooks
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — same as publishable key

### 2. Database

```bash
npx prisma db push     # create tables
npm run db:seed        # seed demo admin + customer
```

### 3. Stripe Webhook

In development, use the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

Copy the `whsec_...` signing secret into `STRIPE_WEBHOOK_SECRET`.

In production, add `https://yourdomain.com/api/webhook/stripe` in the Stripe Dashboard.

### 4. Run

```bash
npm run dev
```

## Demo Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@180degreesolar.com | admin123! |
| Customer | john@example.com | customer123! |

## Project Structure

```
src/
  app/
    api/
      auth/[...nextauth]/   NextAuth handler
      loans/                Customer loan API
      payments/intent/      Stripe PaymentIntent creation
      webhook/stripe/        Stripe webhook handler
      admin/customers/      Admin: create/list customers
      admin/loans/          Admin: create/list loans
    dashboard/              Customer portal
    admin/                  Admin dashboard
    login/                  Login page
  lib/
    auth.ts                 NextAuth config
    prisma.ts               Prisma client singleton
    stripe.ts               Stripe client
    loan-utils.ts           Amortization math + formatters
  middleware.ts             Route protection
prisma/
  schema.prisma             DB schema
  seed.ts                   Demo data seed
```
