# League — Premium Bowling App

## Overview
A premium mobile bowling app built with Expo (React Native) backed by a real Express 5 API + Supabase (PostgreSQL + Auth + Realtime + RLS). Features skill-based money challenges, a social Moments feed, score tracking, league discovery, and a RevenueCat Pro subscription.

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
- **Realtime**: Supabase Realtime on `moments` and `challenges` tables
- **Subscriptions**: RevenueCat (`react-native-purchases`)
- **Tabs**: NativeTabs (iOS 26 liquid glass) + ClassicTabs fallback

## App Structure
```
artifacts/league/
  app/
    _layout.tsx          ← Root layout: AuthProvider + AuthGate + SubscriptionProvider
    auth/
      sign-in.tsx        ← Supabase email/password sign-in
      sign-up.tsx        ← Supabase sign-up with bowler tag
    (tabs)/
      _layout.tsx        ← 5-tab navigation
      index.tsx          ← Challenges feed
      moments.tsx        ← Social feed
      log.tsx            ← Score logger with AI verify animation
      leagues.tsx        ← League discovery
      profile.tsx        ← Profile + Pro upgrade paywall
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
      moments.ts         ← GET/POST /moments, POST/DELETE /moments/:id/like
      leagues.ts         ← GET /leagues, POST /leagues/:id/join
    middlewares/
      supabaseAuth.ts    ← Verifies JWT, auto-creates user row on first login
    lib/
      supabase.ts        ← supabaseAdmin client (service role key)
      logger.ts          ← pino logger
      timeAgo.ts         ← Relative time helper

lib/api-spec/openapi.yaml   ← Single source of truth for all API contracts
lib/api-zod/                ← Generated Zod validators (from codegen)
lib/db/src/schema/          ← Drizzle table definitions (kept for reference / future migrations)

scripts/src/
  seedSupabase.ts      ← Seeds NPC users, challenges, moments, leagues into Supabase
  seedRevenueCat.ts    ← Seeds RC entities
```

## Backend API Endpoints
All routes are under `/api` and require `Authorization: Bearer <supabase_jwt>`:
- `GET /healthz` — health check (no auth required)
- `GET /users/me` — current user profile
- `PATCH /users/me` — update profile / isPro flag
- `GET /games` — list user's games (newest first)
- `POST /games` — log game; auto-updates careerAvg, highGame, totalGames, XP
- `GET /challenges` — open challenges from other players
- `GET /challenges/my` — current user's posted challenges
- `POST /challenges` — post a new challenge
- `POST /challenges/:id/accept` — accept a challenge (sets status → active)
- `GET /moments` — social feed with liked status
- `POST /moments` — create a moment post
- `POST /moments/:id/like` — like a moment
- `DELETE /moments/:id/like` — unlike a moment
- `GET /leagues` — all leagues with joined status
- `POST /leagues/:id/join` — join a league

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
- **Tables**: `users`, `games`, `challenges`, `moments`, `moment_likes`, `leagues`, `league_memberships`
- **RLS**: Enabled on all tables. Service role bypasses all policies. Authenticated users have scoped access.
- **Realtime**: `moments` and `challenges` tables added to `supabase_realtime` publication
- **Note**: Direct PostgreSQL connections are blocked by Replit's network. All DB access goes through the Supabase REST API via `@supabase/supabase-js`.

## RevenueCat Setup
- **Project**: League (`proj0ba05017`)
- **Entitlement**: `pro`
- **Product**: `league_pro_monthly` ($4.99/month)
- **Offering**: `default`
- **Package**: `$rc_monthly`
- Run seed: `pnpm --filter @workspace/scripts run seed:revenuecat`

## Environment Variables
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — Supabase anon key (server)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server, bypasses RLS)
- `SUPABASE_ACCESS_TOKEN` — Supabase personal access token (for Management API / migrations)
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
1. **Auth**: Supabase email/password sign-up/sign-in. JWT auto-injected into every API request.
2. **Challenges**: Post/accept skill-based money matches with stake selection
3. **Moments**: Social feed with live Realtime updates, like/comment, type filters
4. **Score Log**: Log games with oil pattern, ball, alley. AI verification animation
5. **Leagues**: Discover public/private leagues by skill level. Join/request flow
6. **Profile**: XP bar, career stats, rank display, team card, Pro upgrade paywall
