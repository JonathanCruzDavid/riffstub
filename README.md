# Riffstub

A full-stack concert-tracking web app — log shows you've been to, build a feed, and pull in event/artist data from Ticketmaster, SeatGeek, and Spotify. Live at [riffstub.com](https://riffstub.com).

Built solo, end to end: database schema, auth, moderation, and production deployment.

> Shared for portfolio purposes — not licensed for reuse.

## Features

- **Concert logging & feed** — log concerts you've attended, browse a feed of activity, and view other users' profiles (`/u/[username]`).
- **Third-party data** — pulls event and artist data from the Ticketmaster and SeatGeek APIs, plus Spotify for artist/track info, with rate limiting on outbound calls.
- **Auth with 2FA** — email/password login and optional TOTP two-factor authentication via Supabase Auth, including a proper step-up flow for password resets on 2FA-protected accounts.
- **Row-Level Security** — Supabase/PostgreSQL RLS policies restrict each user's data access at the database level, not just in application code.
- **Admin moderation** — a dashboard for reviewing reports, removing posts, and banning or unbanning accounts (bans sign the user out everywhere and hide their content).
- **User safety** — report and block on posts and accounts, private accounts with follow requests, self-serve account deletion (in-app and at `/delete-account`), required Terms acceptance at signup, and a published child safety standards page.
- **Mobile-first UI** — a phone tab bar, app-style viewport and keyboard handling, and fast logged-in navigation (JWTs verified locally with `getClaims()`).
- **Contact form** — sends email via Gmail SMTP.
- **Logging** — structured logging to Logflare.

## Android app

A native Android client — Kotlin + Jetpack Compose — lives in its own repo: [riffstub-android](https://github.com/JonathanCruzDavid/riffstub-android). It talks to the same Supabase project, so every RLS policy and security-definer function here applies to it unchanged.

The API routes it uses keep third-party keys on the server:

| Route | Purpose |
| --- | --- |
| `/api/ticketmaster/attractions`, `/tour-dates`, `/nearby` | Artist search, tour dates, and shows near a location (Ticketmaster + SeatGeek) |
| `/api/spotify/search-artists`, `/search-tracks` | Spotify catalog search |
| `/api/artist-catalog` | An artist's Spotify top tracks and albums |
| `/api/spotify/nearby-matches` | Shows near you by artists you like — accepts the cookie session or a Supabase access token as `Authorization: Bearer` |
| `/api/geocode` | ZIP code → coordinates |

`/.well-known/assetlinks.json` (driven by `ANDROID_PACKAGE_NAME` / `ANDROID_CERT_SHA256`) verifies the app's signing keys for the domain.

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

Next.js (App Router), TypeScript, Tailwind CSS, Supabase (Postgres, Auth, Row-Level Security, Storage), deployed on Vercel. Android: Kotlin, Jetpack Compose, supabase-kt.
