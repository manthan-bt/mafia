# Mafia: Nightfall Protocol

A professional, production-ready, real-time multiplayer social deduction game built with a modern TypeScript monorepo architecture.

## 🚀 Architecture Overview

- **Frontend:** React (TypeScript), TailwindCSS, Socket.io-client.
- **Backend:** Node.js (Express), Socket.io, Prisma (PostgreSQL), Redis.
- **Shared Logic:** A dedicated package for game engine and bot AI logic, shared between server and client.
- **Infrastructure:** Fully Dockerized stack with CI/CD via GitHub Actions.

## 🛠 Features

- **Real-time Gameplay:** Smooth state transitions with Socket.io.
- **Persistent Progress:** User accounts, MMR, and coin tracking using PostgreSQL.
- **Scalable Real-time:** Redis-backed socket scaling for multiple server instances.
- **Sophisticated AI:** Bots with personalities, suspicion maps, and contextual chat generation.
- **Security:** PBKDF2 hashing, HMAC sessions, and IP-based rate limiting.
- **CI/CD:** Automated testing and Docker build checks.

## 🚦 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+

### Setup
1. Clone the repository.
2. `cp .env.example .env` and configure your variables.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Generate Prisma Client:
   ```bash
   npm run prisma:generate
   ```

### Running the App
**Development (Local):**
```bash
# Start server
npm run dev:server
# Start web client
npm run dev:web
```

**Production (Docker):**
```bash
npm run docker:up
```

## 🧪 Testing
Run the suite across the monorepo:
```bash
npm test
```

## 🗺 Roadmap
- [x] Persistent database storage.
- [x] Socket scaling with Redis.
- [x] Dockerization.
- [x] CI/CD pipeline.
- [ ] Stripe integration for monetization.
- [ ] Global Tournament system.
