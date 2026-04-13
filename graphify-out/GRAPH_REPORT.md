# Graph Report - .  (2026-04-13)

## Corpus Check
- Corpus is ~33,864 words - fits in a single context window. You may not need a graph.

## Summary
- 256 nodes · 270 edges · 53 communities detected
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `GameSocketHandler` - 19 edges
2. `LobbyManager` - 8 edges
3. `AudioManager` - 8 edges
4. `AuthService` - 7 edges
5. `BotManager` - 6 edges
6. `SocketManager` - 6 edges
7. `MatchmakingService` - 5 edges
8. `BotEngine` - 5 edges
9. `GameEngine` - 5 edges
10. `Apps/Packages Monorepo Pattern` - 5 edges

## Surprising Connections (you probably didn't know these)
- `apps/server (Node.js/Express)` --conceptually_related_to--> `Backend Architecture Stack`  [INFERRED]
  README.md → docs/architecture.md
- `apps/web (React/Vite)` --conceptually_related_to--> `Frontend Architecture Stack`  [INFERRED]
  README.md → docs/architecture.md
- `Continuous Integration Pipeline` --cites--> `[1.0.0-PRO] Release`  [INFERRED]
  docs/build-instructions.md → docs/release-notes.md

## Hyperedges (group relationships)
- **Monorepo Core Components** — readme_apps_server, readme_apps_web, readme_apps_mobile, readme_packages_shared [EXTRACTED 1.00]
- **Real-time Scalability Architecture** — arch_backend_stack, arch_scalability, rel_1_0_0_pro [INFERRED 0.90]

## Communities

### Community 0 - "Frontend Component Lifecycle"
Cohesion: 0.05
Nodes (4): fetchData(), promoteUser(), App(), useMafiaSocket()

### Community 1 - "Game State & Phase Management"
Cohesion: 0.18
Nodes (1): GameSocketHandler

### Community 2 - "Authentication & User Logic"
Cohesion: 0.23
Nodes (10): generateSalt(), hashPassword(), issueToken(), loginUser(), promoteToSuperUser(), registerUser(), signPayload(), timingSafeEqual() (+2 more)

### Community 3 - "Lobby & Session Handling"
Cohesion: 0.25
Nodes (1): LobbyManager

### Community 4 - "Store & Monetization UI"
Cohesion: 0.25
Nodes (2): fetchProfile(), handlePurchase()

### Community 5 - "Authentication Services"
Cohesion: 0.43
Nodes (1): AuthService

### Community 6 - "Audio Management System"
Cohesion: 0.39
Nodes (1): AudioManager

### Community 7 - "System Architecture Overview"
Cohesion: 0.29
Nodes (8): Backend Architecture Stack, Frontend Architecture Stack, apps/mobile (React Native/Expo), apps/server (Node.js/Express), apps/web (React/Vite), Mafia: Nightfall Protocol, Apps/Packages Monorepo Pattern, packages/shared (Core Logic)

### Community 8 - "Bot Simulation Logic"
Cohesion: 0.33
Nodes (1): BotManager

### Community 9 - "Socket Infrastructure"
Cohesion: 0.33
Nodes (1): SocketManager

### Community 10 - "Community 10"
Cohesion: 0.4
Nodes (2): buildOTPEmail(), sendOTPEmail()

### Community 11 - "Community 11"
Cohesion: 0.4
Nodes (1): MatchmakingService

### Community 12 - "Community 12"
Cohesion: 0.4
Nodes (1): BotEngine

### Community 13 - "Community 13"
Cohesion: 0.4
Nodes (1): GameEngine

### Community 14 - "Community 14"
Cohesion: 0.5
Nodes (1): SubscriptionService

### Community 15 - "Community 15"
Cohesion: 0.5
Nodes (2): handleRecovery(), sha256Hex()

### Community 16 - "Community 16"
Cohesion: 0.4
Nodes (1): EncryptionService

### Community 17 - "Community 17"
Cohesion: 0.5
Nodes (1): AccountService

### Community 18 - "Community 18"
Cohesion: 0.67
Nodes (1): AntiCheatService

### Community 19 - "Community 19"
Cohesion: 0.5
Nodes (1): LeaderboardService

### Community 20 - "Community 20"
Cohesion: 0.5
Nodes (1): ProfileService

### Community 21 - "Community 21"
Cohesion: 0.5
Nodes (1): RateLimiter

### Community 22 - "Community 22"
Cohesion: 0.5
Nodes (1): SeasonService

### Community 23 - "Community 23"
Cohesion: 0.5
Nodes (1): MMRService

### Community 24 - "Community 24"
Cohesion: 0.5
Nodes (1): ModerationService

### Community 25 - "Community 25"
Cohesion: 0.67
Nodes (1): MonetizationService

### Community 26 - "Community 26"
Cohesion: 0.67
Nodes (1): TournamentService

### Community 27 - "Community 27"
Cohesion: 0.67
Nodes (3): Continuous Integration Pipeline, [1.0.0-PRO] Release, Production Readiness Rationale

### Community 28 - "Community 28"
Cohesion: 0.67
Nodes (2): Isometric Cube Logo, Pixel Art Style

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (2): Monorepo Overview, Monorepo Rationale

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (2): System Scalability, Scalability Rationale

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (2): Default Expo App Icon, Expo Placeholder Design

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (2): Expo Default Design, Mobile Splash Icon

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (1): Project Vision

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (1): Expo Adaptive Icon Placeholder

## Knowledge Gaps
- **17 isolated node(s):** `Mafia: Nightfall Protocol`, `packages/shared (Core Logic)`, `Project Vision`, `Monorepo Overview`, `Monorepo Rationale` (+12 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 29`** (2 nodes): `user-controller.ts`, `authenticate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (2 nodes): `AdContainer.tsx`, `AdContainer()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (2 nodes): `Voting.tsx`, `handleConfirm()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (2 nodes): `Monorepo Overview`, `Monorepo Rationale`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (2 nodes): `System Scalability`, `Scalability Rationale`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (2 nodes): `Default Expo App Icon`, `Expo Placeholder Design`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (2 nodes): `Expo Default Design`, `Mobile Splash Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `preload.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `auth-controller.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `prisma.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (1 nodes): `auth-service.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (1 nodes): `tailwind.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `vite.config.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `CardReveal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `PremiumReveal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `navigation.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `api.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `ast_extract.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `cache_check.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `game-engine.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (1 nodes): `Project Vision`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `Expo Adaptive Icon Placeholder`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AudioManager` connect `Audio Management System` to `Frontend Component Lifecycle`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `Mafia: Nightfall Protocol`, `packages/shared (Core Logic)`, `Project Vision` to the rest of the system?**
  _17 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend Component Lifecycle` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._