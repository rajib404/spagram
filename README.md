# Sparina

A full-stack massage therapy booking platform built with Next.js 14. Clients can browse therapist profiles, book sessions, and leave reviews. Therapists manage their availability, accept/decline bookings, track earnings, and respond to reviews.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma v5
- **Auth**: NextAuth.js (credentials + Google OAuth)
- **Payments**: Stripe (manual-capture PaymentIntents, saved cards, webhooks)
- **File Uploads**: Local (served via API route)
- **Email**: Resend
- **Styling**: Tailwind CSS
- **State**: React Query v5

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Stripe account

- Resend account (for transactional email)
- Google OAuth credentials (optional)

### Setup

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Copy the environment file and fill in your values:

```bash
cp .env.example .env
```

3. Set up the database:

```bash
npx prisma migrate dev
npx prisma generate
```

4. (Optional) Seed the database:

```bash
npx prisma db seed
```

5. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
  app/
    (public)/          # Public pages (home, therapist listings/profiles)
    (auth)/            # Login, register
    (dashboard)/
      user/            # Client dashboard (bookings, reviews, favorites, settings)
      therapist/       # Therapist dashboard (bookings, profile, availability, earnings, reviews)
    api/               # API routes
  components/          # Shared and feature-specific components
  lib/                 # Utilities (auth, db, stripe, email, logger, validations)
  types/               # Shared TypeScript types
prisma/
  schema.prisma        # Database schema
```

## Key Features

- **Therapist Profiles**: Public profiles with photos, services, pricing, availability
- **Booking Flow**: Date/time selection, Stripe payment hold, email notifications
- **Accept/Decline**: Therapists accept or decline via dashboard or email links
- **Reviews**: Clients leave reviews after completed sessions; therapists can respond
- **Earnings Dashboard**: Revenue tracking with monthly breakdowns
- **Payment Methods**: Saved cards via Stripe SetupIntents
- **SEO**: Dynamic metadata, sitemap, robots.txt, JSON-LD structured data

## Environment Variables

See `.env.example` for all required variables.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
