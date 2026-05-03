# League — Premium Bowling App

## Overview
A premium mobile bowling app built with Expo (React Native). Features skill-based money challenges, a social Moments feed, score tracking with AI verification, league discovery, and a RevenueCat Pro subscription.

## Design System
- **Background**: `#f0f0e8` (warm off-white)
- **Accent/Primary**: `#9fe870` (lime green)
- **Text**: `#0e0f0c` (near-black)
- **Card**: `#e8e8de`
- **Font**: Inter (400/500/600/700)
- **Radius**: 24px
- **Dark card**: `#1a1a16` (for rank/hero cards)

## Architecture
- **Framework**: Expo SDK 54, expo-router v6 (file-based routing)
- **State**: React Context + AsyncStorage (no backend)
- **Subscriptions**: RevenueCat (`react-native-purchases`)
- **Tabs**: NativeTabs (iOS 26 liquid glass) + ClassicTabs fallback

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
    AppContext.tsx        ← App-wide state (user, games, challenges, moments)
  lib/
    revenuecat.tsx       ← RevenueCat integration (SubscriptionProvider, useSubscription)
  constants/
    colors.ts            ← Design tokens
  assets/images/
    icon.png             ← AI-generated app icon
    hero_bowling.png     ← Content images
    strike_moment.png
    scorecard.png
scripts/
  src/
    revenueCatClient.ts  ← RevenueCat OAuth client
    seedRevenueCat.ts    ← Seed script for RC entities
```

## RevenueCat Setup
- **Project**: League (`proj0ba05017`)
- **Entitlement**: `pro`
- **Product**: `league_pro_monthly` ($4.99/month)
- **Offering**: `default`
- **Package**: `$rc_monthly`
- Run seed script: `pnpm --filter @workspace/scripts run seed:revenuecat`

## Environment Variables
- `EXPO_PUBLIC_REVENUECAT_TEST_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- `REVENUECAT_PROJECT_ID`
- `REVENUECAT_TEST_STORE_APP_ID`
- `REVENUECAT_APPLE_APP_STORE_APP_ID`
- `REVENUECAT_GOOGLE_PLAY_STORE_APP_ID`

## Rank System
Rookie → Amateur → Intermediate → Advanced → Expert → Elite → Diamond IV–I → Platinum II–I → Legend → Kingpin

## Key Features
1. **Challenges**: Post/accept skill-based money matches with stake selection
2. **Moments**: Social feed with like/comment, type filters (games, challenges, advice)
3. **Score Log**: Log games with oil pattern, ball, alley. AI verification animation
4. **Leagues**: Discover public/private leagues by skill level. Join/request flow
5. **Profile**: XP bar, career stats, rank display, team card, Pro upgrade paywall
