# AudiTRACK — AUSG Asset Reservation Tracker

Internal web application for the Adamson University Student Government Auditor.

## What this app does

- Tracks physical borrower's forms submitted by RSOs
- Monitors paperwork signing status (Secretary, Auditor, President)
- Manages the AUSG asset inventory (Excel upload)
- Shows approved reservations in a monthly calendar
- Generates monthly borrowing reports for physical reporting

## Tech stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** (dark theme, purple accents)
- **Supabase** (Auth, PostgreSQL, Storage)
- **XLSX** for Excel inventory parsing

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Get your credentials from: **Supabase Dashboard → Project Settings → API**

```
NEXT_PUBLIC_SUPABASE_URL=https://ashplhwkjwxwubfhqmrg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_yVZjXnrFOmhdcdL3M2U0Xw_LFR1jQPt
SUPABASE_SERVICE_ROLE_KEY=sb_secret_qLHcdMNjPtcfX_3MOVonhA_CcmSaGDy
```

### 3. Set up the database

Run the migration SQL in your Supabase project:

1. Open **Supabase Dashboard → SQL Editor**
2. Click **New Query**
3. Paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Click **Run**

### 4. Create a Supabase Storage bucket

1. Open **Supabase Dashboard → Storage**
2. Create a new bucket named `documents`
3. Set it to **Private** (the app uses signed URLs)

### 5. Create your first Auditor account

1. Open **Supabase Dashboard → Authentication → Users**
2. Click **Add User** and create an account with your email
3. The profile row is created automatically by the database trigger
4. The default role is `auditor` — no extra setup needed

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in.

## Deployment (Vercel)

1. Push this repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add the three environment variables in Vercel project settings
4. Deploy

## Project structure

```
src/
  app/           — Next.js pages (App Router)
  components/    — Reusable UI components
  lib/supabase/  — Supabase client helpers
  services/      — All database operations (one file per feature)
  types/         — TypeScript interfaces
  utils/         — Formatting, constants, helpers
supabase/
  migrations/    — SQL schema files
```

## Sidebar pages

| Page      | Route        | Purpose                              |
|-----------|--------------|--------------------------------------|
| Dashboard | /dashboard   | Summary cards + recent requests      |
| Requests  | /requests    | Log and manage borrower's forms      |
| Assets    | /assets      | AUSG inventory + Excel import        |
| Calendar  | /calendar    | Monthly view of approved requests    |
| Reports   | /reports     | Monthly borrowing report + PDF export|