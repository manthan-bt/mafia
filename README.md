# Mafia: Nightfall Protocol

A professional, production-ready, real-time multiplayer social deduction game built with a modern TypeScript monorepo architecture.

## 🚀 Architecture

The project follows an industry-standard **Apps/Packages** monorepo pattern:

- **`apps/server`**: Node.js (Express) + Socket.io + Prisma (PostgreSQL).
- **`apps/web`**: React (Vite) + Framer Motion + TailwindCSS.
- **`apps/mobile`**: React Native (Expo) mobile client.
- **`packages/shared`**: Core game engine, Bot AI, types, and logic shared across all clients.

## 🛠 Features

- **Distributed Real-time**: Redis-backed Socket.io scaling.
- **Advanced Bot AI**: Cinematic suspicion maps and personality models.
- **Security**: PBKDF2 hashing, HMAC sessions, and code obfuscation.
- **CI/CD**: Automated GitHub Actions for testing and Docker verification.

## 📖 Documentation

Detailed documentation is available in the [docs/](./docs/) directory:
- [Architecture](./docs/architecture.md)
- [Installation Guide](./docs/installation.md)
- [Build Instructions](./docs/build-instructions.md)
- [Release Notes](./docs/release-notes.md)

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

### Development
```bash
# Start server
npm run dev:server
# Start web client
npm run dev:web
```

### Production (Docker)
```bash
npm run docker:up
```

## 🧪 Testing
```bash
npm test
```

## 🗺 Roadmap
See [ROADMAP.md](./ROADMAP.md) for future milestones.
