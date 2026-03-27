# Mafia: Nightfall Protocol - System Architecture

This document describes the high-level architecture of the Mafia Nightfall Protocol project.

## Monorepo Overview

The project is structured as a modern TypeScript monorepo using NPM Workspaces. This allows for strict separation of concerns while enabling seamless code sharing between different platforms.

### Directory Structure

```text
.
├── apps/
│   ├── server/      # Node.js backend (Express + Socket.io)
│   ├── web/         # React frontend (Vite)
│   ├── mobile/      # React Native app (Expo)
│   └── desktop/     # Desktop wrapper (Electron)
├── packages/
│   └── shared/      # Core game engine and shared logic
├── docs/            # Project documentation
└── .github/         # CI/CD workflows
```

## Core Components

### 1. Backend (@mafia/server)
- **Framework:** Express.js
- **Real-time:** Socket.io with Redis Adapter for horizontal scaling.
- **ORM:** Prisma with PostgreSQL.
- **Authentication:** Custom PBKDF2 hashing with HMAC-signed session tokens.
- **Structure:** Modularized into Controllers, Services, Managers, and Sockets.

### 2. Frontend (@mafia/web)
- **Framework:** React with Vite.
- **Styling:** Tailwind CSS.
- **Animation:** Framer Motion.
- **State:** React Context API for Socket.io management.

### 3. Mobile (@mafia/mobile)
- **Framework:** React Native with Expo.
- **Features:** Shared logic with the web client, native performance, and cinematic animations.

### 4. Shared Logic (@mafia/shared)
- **Game Engine:** State machine handling roles, phases (Night, Discussion, Voting), and win conditions.
- **Bot AI:** Logic for automated players including suspicion maps and personality models.
- **Utilities:** Encryption services and common constants.

## Data Flow

1. **Authentication:** Clients authenticate via REST API (`/api/auth`).
2. **Game Connection:** Upon successful auth, clients establish a persistent WebSocket connection.
3. **Lobby Management:** Sockets manage joining/creating rooms stored in memory (synced via Redis).
4. **Game Loop:** The server-side `GameSocketHandler` orchestrates the game state transitions using the `@mafia/shared` engine.
5. **Persistence:** Match results and user stats are saved to PostgreSQL via Prisma.

## Scalability

The system is designed to be horizontally scalable:
- **Stateless API:** The Express server can be load-balanced.
- **Socket Scaling:** Socket.io uses Redis to broadcast events across multiple server instances.
- **Database:** PostgreSQL handles persistent user data and match history.
