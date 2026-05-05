# League — Premium Bowling App

## Overview
A premium mobile bowling app built with Expo (React Native) backed by a real Express 5 API + Supabase (PostgreSQL + Auth + Realtime + RLS). Features skill-based money challenges, a social Moments feed, score tracking, league discovery, a leaderboard, friends system, and a RevenueCat Pro subscription ($4.99/mo).

## Design System
- **Background**: `#f0f0e8` (warm off-white)
- **Accent/Primary**: `#9fe870` (lime green)
- **Text**: `#0e0f0c` (near-black)
- **Card**: `#e8e8de`
- **Font**: Inter (400/500/600/700)
- **Radius**: 24px
- **Dark card**: `#1a1a16` (for rank/hero cards)

## Architecture
- **Mobile**: Expo SDK 54, expo-router v6 (file-based routing)
- **Backend**: Express 5 API server — all DB access via `supabaseAdmin` REST client (no direct PG connection; Replit network blocks Supabase pooler)
- **Database**: Supabase PostgreSQL (`wtgphatzheodjsqznedg`) with RLS enabled on all tables
- **Auth**: Supabase Auth (email/password) — JWT Bearer tokens verified by `supabaseAuthMiddleware`
- **Realtime**: Supabase Realtime on `moments` table (live feed updates)
- **Subscriptions**: RevenueCat (`react-native-purchases`)

## App Structure
```
artifacts/league/
  app/
    _layout.tsx          ← Root layout: AuthProvider + AuthGate + SubscriptionProvider
    auth/
      sign-in.tsx        ← Supabase email/password sign-in
      sign-up.tsx        ← Supabase sign-up with bowler tag
    (tabs)/
      _layout.tsx        ← 6-tab navigation
      index.tsx          ← Challenges feed
      moments.tsx        ← Social feed (search, hashtags, dislike, save to lists, post composer)
      log.tsx            ← Score logger with AI verify animation
      leaderboard.tsx    ← Global / Friends / Team leaderboard with search
      leagues.tsx        ← League discovery
      profile.tsx        ← Profile + Pro upgrade paywall + Friends/Saved links
    moment/
      [id].tsx           ← Moment detail: full comment thread + action bar
    friends.tsx          ← Friends / Requests / Find People tabs
    user/
      [id].tsx           ← Public user profile view
  components/
    ChallengeCard.tsx    ← Challenge feed card
    RankBadge.tsx        ← Rank display pill
    StakeModal.tsx       ← Stake selector
    ErrorBoundary.tsx    ← Error boundary wrapper
  context/
    AuthContext.tsx       ← Supabase session state (signIn, signUp, signOut)
    AppContext.tsx        ← App-wide state + Supabase Realtime for moments
  lib/
    api.ts               ← Fetch wrapper — injects Supabase Bearer token on every request
    supabase.ts          ← Supabase client (AsyncStorage session persistence)
    revenuecat.tsx       ← RevenueCat integration (SubscriptionProvider, useSubscription)

artifacts/api-server/
  src/
    app.ts               ← Express app (pinoHttp, cors, supabaseAuthMiddleware on /api)
    routes/
      health.ts          ← GET /healthz (skips auth)
      users.ts           ← GET/PATCH /users/me
      games.ts           ← GET/POST /games
      challenges.ts      ← GET /challenges, GET /challenges/my, POST /challenges, POST /challenges/:id/accept
      moments.ts         ← GET/POST /moments, GET /moments/search, POST/DELETE /moments/:id/like
      leagues.ts         ← GET /leagues, POST /leagues/:id/join
      friends.ts         ← GET/POST/DELETE /friends, GET /friends/requests, POST /friends/request, GET /users/search
      leaderboard.ts     ← GET /leaderboard (global/friends/team/search filters)
      comments.ts        ← GET /moments/:id/comments, POST /moments/:id/comments, DELETE /comments/:id
      saves.ts           ← POST/DELETE /moments/:id/save, GET /saves, GET /save-lists, POST /save-lists
      dislikes.ts        ← POST/DELETE /moments/:id/dislike
    middlewares/
      supabaseAuth.ts    ← Verifies JWT, auto-creates user row on first login
    lib/
      supabase.ts        ← supabaseAdmin client (service role key)
      logger.ts          ← pino logger
      timeAgo.ts         ← Relative time helper

lib/api-spec/openapi.yaml   ← Single source of truth for all API contracts
lib/api-zod/                ← Generated Zod validators (from codegen)
lib/db/src/schema/          ← Drizzle table definitions (reference only; DB managed via Supabase REST)

scripts/src/
  seedSupabase.ts      ← Seeds NPC users, challenges, moments, leagues into Supabase
  seedRevenueCat.ts    ← Seeds RC entities
```

## Backend API Endpoints
All routes are under `/api` and require `Authorization: Bearer <supabase_jwt>`:

### Core
- `GET /healthz` — health check (no auth required)
- `GET /users/me` — current user profile
- `PATCH /users/me` — update profile / isPro flag

### Games
- `GET /games` — list user's games (newest first)
- `POST /games` — log game; auto-updates careerAvg, highGame, totalGames, XP

### Challenges
- `GET /challenges` — open challenges from other players
- `GET /challenges/my` — current user's posted challenges
- `POST /challenges` — post a new challenge
- `POST /challenges/:id/accept` — accept a challenge (sets status → active)

### Moments
- `GET /moments` — social feed with liked/disliked/saved status; supports `?tag=` filter
- `GET /moments/search` — search moments by content or hashtag (`?q=` or `?tag=`)
- `POST /moments` — create a moment post (hashtags auto-extracted from content)
- `POST /moments/:id/like` — like a moment
- `DELETE /moments/:id/like` — unlike a moment
- `GET /moments/:id/comments` — fetch comment thread
- `POST /moments/:id/comments` — post a comment
- `DELETE /comments/:id` — delete own comment
- `POST /moments/:id/dislike` — dislike a moment
- `DELETE /moments/:id/dislike` — remove dislike
- `POST /moments/:id/save` — save moment to a list
- `DELETE /moments/:id/save` — unsave moment

### Save Lists
- `GET /saves` — all saved moments for current user
- `GET /save-lists` — all save lists for current user
- `POST /save-lists` — create a new save list

### Friends
- `GET /friends` — current user's friends
- `GET /friends/requests` — incoming friend requests
- `POST /friends/request` — send a friend request
- `POST /friends/:userId/accept` — accept a friend request
- `DELETE /friends/:userId` — remove friend
- `GET /users/search` — search users by username

### Leaderboard
- `GET /leaderboard` — ranked user list; supports `?filter=global|friends|team&q=` filters

### Leagues
- `GET /leagues` — all leagues with joined status
- `POST /leagues/:id/join` — join a league

## Supabase Database Tables
- `users` — user profiles (auth_id links to auth.users)
- `games` — score log entries
- `challenges` — money challenges
- `moments` — social feed posts (has tags[], dislike_count, comment_count, save_count)
- `moment_likes` — like junction
- `moment_dislikes` — dislike junction
- `moment_saves` — save junction
- `comments` — comments on moments
- `save_lists` — user-created save lists
- `leagues` — league definitions
- `league_memberships` — join table
- `friends` — friend relationships (with status: pending/accepted)

## Codegen
The OpenAPI spec drives all Zod validators and React Query hooks:
```bash
# Regenerate after any openapi.yaml change
pnpm --filter @workspace/api-spec run codegen
```
The codegen script forces the correct `lib/api-zod/src/index.ts` barrel after orval runs (orval's split-mode barrel included a stale `api.schemas` reference).

## Testing
```bash
# Run API unit + integration tests
pnpm --filter @workspace/api-server run test

# Run with coverage
pnpm --filter @workspace/api-server run test:coverage
```

### Test structure (`artifacts/api-server/src/__tests__/`)
- `timeAgo.test.ts` — unit tests for the timeAgo utility
- `health.test.ts` — GET /api/healthz
- `auth.test.ts` — supabaseAuthMiddleware (real middleware, Supabase mocked)
- `users.test.ts` — GET/PATCH /api/users/me
- `games.test.ts` — GET/POST /api/games
- `challenges.test.ts` — GET/POST challenges + accept flow
- `moments.test.ts` — GET/POST moments + like/unlike
- `leagues.test.ts` — GET leagues + join flow

### Mock strategy
- `setup.ts` mocks `../lib/supabase` → `supabaseAdmin.from` as `vi.fn()` (configurable per-test)
- Each route test file mocks `../middlewares/supabaseAuth` inline (sets `req.userId = 1`)
- E2e test credentials: `e2etest@league.app` / `TestLeague2024!`

## Database Commands
```bash
# Re-seed Supabase with NPC data
pnpm --filter @workspace/scripts run seed:supabase

# Regenerate Zod validators + React Query hooks after spec changes
pnpm --filter @workspace/api-spec run codegen
```

## Supabase Setup
- **Project ref**: `wtgphatzheodjsqznedg`
- **URL**: `https://wtgphatzheodjsqznedg.supabase.co`
- **RLS**: Enabled on all tables. Service role bypasses all policies.
- **Realtime**: `moments` table in `supabase_realtime` publication
- **Note**: Direct PostgreSQL connections are blocked by Replit's network. All DB access goes through the Supabase REST API via `@supabase/supabase-js`.

## RevenueCat Setup
- **Project**: League (`proj0ba05017`)
- **Entitlement**: `pro`
- **Product**: `league_pro_monthly` ($4.99/month)
- **Offering**: `default`
- **Package**: `$rc_monthly`
- Run seed: `pnpm --filter @workspace/scripts run seed:revenuecat`

## Environment Variables
- `SUPABASE_URL` — Supabase project URL (server)
- `SUPABASE_ANON_KEY` — Supabase anon key (server)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server, bypasses RLS)
- `SUPABASE_ACCESS_TOKEN` — Supabase personal access token (Management API)
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase URL for Expo client
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key for Expo client
- `SESSION_SECRET` — session secret
- `EXPO_PUBLIC_REVENUECAT_TEST_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- `REVENUECAT_PROJECT_ID`

## Rank System
Rookie → Amateur → Intermediate → Advanced → Expert → Elite → Diamond IV–I → Platinum II–I → Legend → Kingpin

## Key Features
1. **Auth**: Supabase email/password sign-up/sign-in. JWT auto-injected into every API request. Auto-creates user row on first login.
2. **Challenges**: Post/accept skill-based money matches with stake selection
3. **Moments**: Social feed with live Realtime updates, like/dislike/save to lists, hashtag filtering, post composer with `#tag` support, full comment threads on detail view
4. **Leaderboard**: Global, Friends, and Team filters with username search
5. **Friends**: Send/accept/remove friends, browse incoming requests, search for users
6. **Score Log**: Log games with oil pattern, ball, alley. AI verification animation. Auto-updates stats + XP.
7. **Leagues**: Discover public/private leagues by skill level. Join/request flow.
8. **Profile**: XP bar, career stats, rank display, team card, Pro upgrade paywall, links to Friends & Saved Posts
