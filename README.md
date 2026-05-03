# League — Premium Bowling App

A full-stack mobile bowling app for serious players. Post skill-based money challenges, track scores with AI verification, follow the social Moments feed, and discover leagues — all backed by a real Express + PostgreSQL API.

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | Expo SDK 54, Expo Router v6, React Native |
| Backend | Express 5, Drizzle ORM, PostgreSQL |
| API contract | OpenAPI-first, Orval codegen (Zod + React Query) |
| Subscriptions | RevenueCat (`react-native-purchases`) |
| Monorepo | pnpm workspaces |

## Features

- **Challenges** — Post and accept skill-based money matches with a stake selector ($10–$200). Funds held in escrow until the match resolves.
- **Moments** — Social feed with likes, type filters (games / challenges / advice), and relative timestamps.
- **Score Log** — Log games with oil pattern, ball, and alley. AI verification animation updates your career avg, high game, and XP in real time.
- **Leagues** — Discover public and private leagues by skill level. Join instantly or request access.
- **Profile** — XP progress bar, rank badge (Rookie → Kingpin), career stats, and RevenueCat Pro paywall ($4.99/month).

## Design System

| Token | Value |
|---|---|
| Background | `#f0f0e8` warm off-white |
| Accent | `#9fe870` lime green |
| Text | `#0e0f0c` near-black |
| Card | `#e8e8de` |
| Dark card | `#1a1a16` |
| Font | Inter 400/500/600/700 |
| Radius | 24px |

## Project Structure

```
artifacts/
  league/           # Expo mobile app
  api-server/       # Express 5 REST API
  mockup-sandbox/   # Component preview server (design tooling)

lib/
  api-spec/         # openapi.yaml — single source of truth
  api-zod/          # Generated Zod validators
  api-client-react/ # Generated React Query hooks
  db/               # Drizzle schema + migrations

scripts/
  src/seedLeague.ts      # Demo data: users, challenges, moments, leagues
  src/seedRevenueCat.ts  # RevenueCat product/entitlement setup
```

## API Endpoints

All routes are under `/api`:

| Method | Path | Description |
|---|---|---|
| GET | `/healthz` | Health check |
| GET | `/users/me` | Current user profile |
| PATCH | `/users/me` | Update profile / isPro flag |
| GET | `/games` | List user's games |
| POST | `/games` | Log a game (updates stats + XP) |
| GET | `/challenges` | Open challenges from other players |
| GET | `/challenges/my` | User's posted challenges |
| POST | `/challenges` | Post a new challenge |
| POST | `/challenges/:id/accept` | Accept a challenge |
| GET | `/moments` | Social feed with liked status |
| POST | `/moments` | Create a moment |
| POST | `/moments/:id/like` | Like a moment |
| DELETE | `/moments/:id/like` | Unlike a moment |
| GET | `/leagues` | All leagues with joined status |
| POST | `/leagues/:id/join` | Join / request to join a league |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL database (or use Replit's auto-provisioned DB)

### Install

```bash
pnpm install
```

### Environment Variables

```env
DATABASE_URL=                           # PostgreSQL connection string
SESSION_SECRET=                         # Session secret
EXPO_PUBLIC_REVENUECAT_TEST_API_KEY=    # RevenueCat test key
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=     # RevenueCat iOS key
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY= # RevenueCat Android key
REVENUECAT_PROJECT_ID=                  # RevenueCat project ID
```

### Database Setup

```bash
# Push schema to database
pnpm --filter @workspace/db run push

# Seed demo data
pnpm --filter @workspace/scripts run seed:league
```

### Run (Development)

```bash
# API server
pnpm --filter @workspace/api-server run dev

# Expo mobile app
pnpm --filter @workspace/league run dev
```

### Regenerate API Client

After editing `lib/api-spec/openapi.yaml`:

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Rank System

`Rookie → Amateur → Intermediate → Advanced → Expert → Elite → Diamond IV–I → Platinum II–I → Legend → Kingpin`

## RevenueCat

- **Project**: League (`proj0ba05017`)
- **Entitlement**: `pro`
- **Product**: `league_pro_monthly` — $4.99/month
- **Offering**: `default` / `$rc_monthly`
