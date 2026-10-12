# Riffstub

A full-stack concert-tracking web app — log shows you've been to, build a feed, and pull in event/artist data from Ticketmaster, SeatGeek, and Spotify. Live at [riffstub.com](https://riffstub.com).

Built solo, end to end: database schema, auth, moderation, and production deployment.

> Shared for portfolio purposes — not licensed for reuse.

## Features

- **Concert logging & feed** — log concerts you've attended, browse a feed of activity, and view other users' profiles (`/u/[username]`).
- **Third-party data** — pulls event and artist data from the Ticketmaster and SeatGeek APIs, plus Spotify for artist/track info, with rate limiting on outbound calls.
- **Auth with 2FA** — email/password login and optional TOTP two-factor authentication via Supabase Auth, including a proper step-up flow for password resets on 2FA-protected accounts.
- **Row-Level Security** — Supabase/PostgreSQL RLS policies restrict each user's data access at the database level, not just in application code.
- **Admin moderation** — a dashboard for reviewing and moderating user-submitted content.
- **Contact form** — sends email via Gmail SMTP.
- **Logging** — structured logging to Logflare.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.local.example` to `.env.local` and fill in a Supabase project's URL/anon key, plus API credentials for Ticketmaster, Spotify, SeatGeek, Gmail (for the contact form), and Logflare (for logging) as needed.
3. Run the dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000).

## Tech stack

Next.js (App Router), TypeScript, Tailwind CSS, Supabase (Postgres, Auth, Row-Level Security), deployed on Vercel.
