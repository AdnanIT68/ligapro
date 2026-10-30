# LigaPro

Schedules, results, standings and top scorers for amateur leagues and tournaments
(futsal, basketball, company leagues). Organizers manage everything from their phone;
players and fans follow the league through one public link, without an account.

**Live demo:** [ligapro-three.vercel.app/l/prva-liga-fbih-2026-27](https://ligapro-three.vercel.app/l/prva-liga-fbih-2026-27) (real First League of FBiH results)

**Status:** MVP live: sign-in, leagues and schedules, results and standings, full-season fixtures with kickoff times, public page, PWA.

## Stack

- Next.js 16 (App Router, Server Actions, Proxy) + TypeScript + Tailwind CSS 4
- Supabase: Postgres, Row Level Security, passwordless e-mail sign-in
- Hosted on Vercel (auto-deploy from `main`)

## Getting started

1. Create a Supabase project and run `supabase/migrations/0001_initial_schema.sql` in the SQL editor.
2. In Supabase → Authentication → URL Configuration, add `http://localhost:3000/auth/callback`
   as a redirect URL.
3. Copy `.env.example` to `.env.local` and fill in the project URL and anon key.
4. Run:

```bash
npm install
npm run dev
npm test
```

## Database

| Table | Purpose |
|---|---|
| `competitions` | a league or tournament, owned by one organizer |
| `teams`, `players` | teams in a competition and their players |
| `matches` | fixtures by round, with status and score |
| `match_events` | goals, own goals, yellow and red cards |

`standings` and `top_scorers` are views, so the table is always computed from results and can't drift.
Row Level Security makes every competition public to read and writable only by its owner.

## Roadmap

1. ✅ Setup, schema, sign-in
2. ✅ Create a league, add teams, generate the round-robin schedule (`src/lib/schedule.ts`, tested)
3. ✅ Enter results, scorers and cards; live standings
4. ✅ Public league page and PWA; deploy to Vercel
5. Pilot with a real league organizer; then subscriptions (Stripe) and sponsor slots

## Demo data

`supabase/seed/prva-liga-fbih-2026-27.csv` holds the real results of rounds 1–11 of the 2026/27
First League of FBiH (Prva liga FBiH), taken from the public results on
[sportdc.net](https://sportdc.net/league/6400-prva-liga-fbih). The standings LigaPro computes from them match
the official table exactly. `prva-liga-fbih-2026-27.sql` loads them for the organizer account it names, and
`prva-liga-fbih-2026-27-fixtures.sql` adds the remaining 152 fixtures (rounds 12–30) with kickoff times.
