# Threat Model

## Project Overview

League is a production mobile bowling app built with Expo/React Native and an Express 5 API backed by Supabase Auth and Supabase PostgreSQL. Users authenticate with Supabase JWT bearer tokens, then access social, leaderboard, league, challenge, game-log, and subscription features. The backend uses the Supabase service-role key for all database access, so API route logic is the primary enforcement point for authorization.

## Assets

- **User accounts and authenticated sessions** — Supabase identities, bearer tokens, and the server-side mapping from `auth.users` to local `users` rows. Compromise enables account takeover and impersonation.
- **User profile and bowling data** — profile fields, bowling specs, team affiliation, stats, wins/losses, BSR, save lists, and social graph data. This is user-private or user-scoped business data.
- **Social content and inbox data** — moments, comments, reactions, likes/dislikes, saves, and notifications. Unauthorized reads or writes would expose private activity or allow abuse/spam.
- **Challenge and league integrity** — challenge acceptance/completion state, BSR changes, win/loss records, and league memberships. Tampering affects competition fairness and trust.
- **Subscription state** — RevenueCat entitlement state and the app’s `users.is_pro` flag. Incorrect writes can grant paid features without purchase.
- **Application secrets** — `SUPABASE_SERVICE_ROLE_KEY`, Supabase access tokens, RevenueCat keys, and other environment secrets. Exposure would permit broad backend compromise.

## Trust Boundaries

- **Mobile client to API** — all app requests cross this boundary. The client is untrusted and can call any authenticated endpoint directly.
- **API to Supabase Auth** — the API validates bearer tokens by calling Supabase Auth. Token verification must happen before protected route logic.
- **API to Supabase data plane** — the API uses `supabaseAdmin` with the service-role key, bypassing RLS. Every route must enforce per-user authorization itself.
- **Authenticated to unauthenticated** — `/api/healthz` is public; all other `/api` routes are meant to require auth.
- **API to third parties** — the client talks to RevenueCat for subscription purchases/restores; the backend depends on Supabase-managed services. Third-party state must not be blindly replaced by client claims.
- **Production to dev-only surfaces** — `artifacts/mockup-sandbox/` is assumed non-production unless proven reachable and should normally be ignored during production scans.

## Scan Anchors

- **Production entry points:** `artifacts/api-server/src/index.ts`, `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/*.ts`, `artifacts/api-server/src/middlewares/supabaseAuth.ts`
- **Highest-risk code areas:** `routes/users.ts`, `routes/moments.ts`, `routes/comments.ts`, `routes/saves.ts`, `routes/friends.ts`, `routes/challenges.ts`, `routes/leagues.ts`, `routes/inbox.ts`
- **Public vs authenticated surfaces:** only `/api/healthz` is public; all other `/api` routes are authenticated; no admin-only surface is currently modeled
- **Dev-only areas:** `artifacts/mockup-sandbox/`, test files, seed scripts, generated client code unless it changes server-relevant behavior

## Threat Categories

### Spoofing

The API must accept only valid Supabase bearer tokens and must bind every request to the correct internal `users.id`. Automatic first-login provisioning in `supabaseAuthMiddleware` must not let one user act as another or create conflicting local identities.

### Tampering

Because the backend uses the Supabase service-role key and bypasses RLS, all user-scoped writes must be constrained by `req.userId` server-side. The client must never be trusted to set privileged flags, ownership fields, list targets, rankings, challenge outcomes, or other state that affects another user’s data or paid access. Social features that write notifications, save metadata, or league membership must enforce those boundaries on the server rather than relying on mobile UI restrictions.

### Information Disclosure

Authenticated users should only receive the data needed for each social, profile, inbox, friends, and leaderboard view. API responses and logs must not leak secrets, tokens, or user-private records outside the caller’s scope.

### Denial of Service

Authenticated endpoints that create notifications, comments, saves, reactions, friend requests, or search results can be abused for spam or high-cardinality reads if input size and request frequency are unconstrained. Production should assume a hostile authenticated client, not just the shipped mobile UI.

### Elevation of Privilege

Regular users must not be able to grant themselves Pro access, manipulate competition state outside their own role, act on another user’s resources by guessing IDs, or exploit service-role-backed route bugs to bypass intended data ownership boundaries. Private leagues must require server-enforced approval semantics, and any paid or invite-only capability must be derived from trusted backend state rather than caller-controlled request fields.

## Assumptions

- `NODE_ENV` is `production` in deployed environments.
- Replit-managed TLS protects traffic in production.
- `artifacts/mockup-sandbox/` is not deployed to production.
- Findings should focus on vulnerabilities that are reachable in production.