# League — Premium Bowling App

## Overview
A premium mobile bowling app built with Expo (React Native) backed by a real Express + PostgreSQL API. Features skill-based money challenges, a social Moments feed, score tracking with AI verification, league discovery, and a RevenueCat Pro subscription.

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
- **Backend**: Express 5 + Drizzle ORM + PostgreSQL (artifacts/api-server)
- **API contract**: OpenAPI-first with Orval codegen (lib/api-spec)
- **Subscriptions**: RevenueCat (`react-native-purchases`)
- **Tabs**: NativeTabs (iOS 26 liquid glass) + ClassicTabs fallback
- **Auth**: Demo user (id=1) — no login required; demoUserMiddleware sets req.userId = 1

## App Structure
```
artifacts/league/
  app/
    _layout.tsx          ← Root layout (fonts, providers, RevenueCat init)
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
  context/
    AppContext.tsx        ← App-wide state — fetches from real API on mount
  lib/
    api.ts               ← Lightweight fetch wrapper (api.get/post/patch/delete)
    revenuecat.tsx       ← RevenueCat integration (SubscriptionProvider, useSubscription)

artifacts/api-server/
  src/
    app.ts               ← Express app (pinoHttp, cors, demoUserMiddleware)
    routes/
      health.ts          ← GET /healthz
      users.ts           ← GET/PATCH /users/me
      games.ts           ← GET/POST /games
      challenges.ts      ← GET /challenges, GET /challenges/my, POST /challenges, POST /challenges/:id/accept
      moments.ts         ← GET/POST /moments, POST/DELETE /moments/:id/like
      leagues.ts         ← GET /leagues, POST /leagues/:id/join
    middlewares/
      demoUser.ts        ← Sets req.userId = 1, auto-creates demo user if missing
    lib/
      logger.ts          ← pino logger
      timeAgo.ts         ← Relative time helper

lib/api-spec/openapi.yaml   ← Single source of truth for all API contracts
lib/api-zod/                ← Generated Zod validators (from codegen)
lib/api-client-react/       ← Generated React Query hooks (from codegen)
lib/db/src/schema/          ← Drizzle table definitions
  users.ts, games.ts, challenges.ts, moments.ts, leagues.ts

scripts/src/
  seedLeague.ts        ← Seeds demo user, NPC users, challenges, moments, leagues
  seedRevenueCat.ts    ← Seeds RC entities
```

## Backend API Endpoints
All routes are under `/api`:
- `GET /healthz` — health check
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
- `POST /leagues/:id/join` — join (or request to join) a league

## Database Commands
```bash
# Push schema changes to DB
pnpm --filter @workspace/db run push

# Re-seed the database
pnpm --filter @workspace/scripts run seed:league

# Regenerate Zod validators + React Query hooks after spec changes
pnpm --filter @workspace/api-spec run codegen
```

## RevenueCat Setup
- **Project**: League (`proj0ba05017`)
- **Entitlement**: `pro`
- **Product**: `league_pro_monthly` ($4.99/month)
- **Offering**: `default`
- **Package**: `$rc_monthly`
- Run seed: `pnpm --filter @workspace/scripts run seed:revenuecat`

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned)
- `SESSION_SECRET` — session secret
- `EXPO_PUBLIC_REVENUECAT_TEST_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- `REVENUECAT_PROJECT_ID`

## Rank System
Rookie → Amateur → Intermediate → Advanced → Expert → Elite → Diamond IV–I → Platinum II–I → Legend → Kingpin

## Key Features
1. **Challenges**: Post/accept skill-based money matches with stake selection
2. **Moments**: Social feed with like/comment, type filters (games, challenges, advice)
3. **Score Log**: Log games with oil pattern, ball, alley. AI verification animation
4. **Leagues**: Discover public/private leagues by skill level. Join/request flow
5. **Profile**: XP bar, career stats, rank display, team card, Pro upgrade paywall
