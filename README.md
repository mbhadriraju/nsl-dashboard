# Nobaglagi Soccer League

A responsive Next.js 16 / React 19 / TypeScript league hub, with Tailwind CSS 4, Supabase PostgreSQL, Google OAuth, RLS, and realtime updates. All league data is read from Supabase. The original supplied logos are served unchanged from `public/logos`.

## Run locally

Requires Node.js 22 or newer.

```sh
npm ci
cp .env.example .env.local
# Fill both values with your Supabase project URL and publishable key.
npm run dev
```

Open http://localhost:3000. The current workspace already has `.env.local` configured for the connected NSL project. No service-role key is used by the app.

## Deploy

Import this repository into Vercel or another Next.js-compatible Node host. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (a Supabase publishable key is supported). Build with `npm run build`; a Node host runs `npm start`.

In Supabase Authentication → URL Configuration, set the production Site URL and allow:

- `http://localhost:3000/auth/callback`
- `https://YOUR-DOMAIN/auth/callback`

Google OAuth is already enabled in the connected project. In a new project, configure the Google provider with Google Cloud OAuth credentials and register `https://PROJECT.supabase.co/auth/v1/callback` as Google's authorized redirect URI. See [Supabase's Google OAuth guide](https://supabase.com/docs/guides/auth/social-login/auth-google).

OAuth uses PKCE with automatic browser-side code exchange. Supabase Auth persists/refreshes the browser session; all protected operations are authorized again by database policies or RPC checks. There are no authenticated server-rendered pages or shared server sessions.

## Database

The migrations and exact seed have already been applied to the connected Supabase project through MCP. For a fresh project, apply files in `supabase/migrations` in filename order, then run `supabase/seed.sql`. Do not reapply migrations to the current project. Seed inserts are idempotent and do not overwrite later league results or trades.

Schema includes teams, players, normalized playstyles, private profiles, validated reservations, versioned trades, immutable trade-player snapshots, and permanent trade history. Public users can read league records. Profile emails are readable only by their owner and admins.

`madhbhad@gmail.com` receives admin access after its first verified sign-in. This one-time allowlist is stored in a non-exposed `private` schema and consumed on promotion. For another deployment, change the bootstrap email before applying the admin migration.

Admins use **Captain Dashboard → Members & Captains** to assign signed-in members to a team/player and a role. Captains must be linked to a player on their team; accounts cannot assign their own role. Admins can edit official standings and team OVR from the same dashboard. Members appear only after their first sign-in.

## League workflows

- **Schedule:** month, week, and list views; team practice or two-team game bookings; detail, edit, and delete dialogs. Reservation times use America/Chicago. Games cannot have identical teams; end time must follow start time. Captains can create for their club and manage games involving their club.
- **Ratings:** current-team captains and admins can edit 1–99 ratings, IR status, and comma-separated playstyles. A review step precedes saving. Goalkeepers display GK OVR.
- **Trades:** multi-player proposals, counter versions, accept, decline, cancel, and history. Submitting a version records the proposing side's approval. The current responder accepting that version completes all transfers in one locked transaction. Pending/countered offers never move players. Stale or duplicate acceptance fails safely. Historical player names, ratings, and directions remain unchanged after future transfers.
- **Captain protection:** a roster's designated captain cannot be included in a trade; an admin must assign another captain first. This prevents a trade from silently transferring team-management authority.
- **Realtime:** public data subscriptions refresh standings, ratings, reservations, and trade activity. Current `players.team_id` always decides captain editing permissions. There is no individual-player permission list.
- **Media:** a clearly labeled button opens the supplied Google Drive archive in a new tab.

Initial Week 1 values intentionally match the brief, including its unconventional games and points totals. The app does not recompute standings or team ratings from player averages. Admins maintain these official values explicitly. No fixtures or trades are fabricated.

## Verify

```sh
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser checks use live read-only league data and test desktop/mobile routes, exact seed displays, roster selection, calendar views, access gates, overflow, logos, media links, and Google PKCE initiation. Run against an unchanged initial seed; update seed-specific expectations once the league advances.

`supabase/verify.sql` runs transaction-scoped integration checks against PostgreSQL, covering team permissions, raw-request role spoofing, booking constraints, trade counters, atomic completion, history, and edit access following transfer. Every test mutation is rolled back. It requires a database-owner connection or the Supabase SQL editor; never expose that access to clients.

Google's interactive consent screen requires the real account holder and is not automated by these checks.

## Design and accessibility

Dark stadium-inspired surfaces, locally hosted Barlow Condensed display typography, club-colored accents, and original logos. Responsive tables scroll inside their panels; mobile navigation exposes every page. Radix dialogs provide focus trapping, keyboard dismissal, and accessible headings. Visible focus, reduced motion/transparency, increased contrast, inline error messages, and loading skeletons are included. PWA metadata and app icons are provided; offline caching is intentionally absent so stale league data is not presented as current.
