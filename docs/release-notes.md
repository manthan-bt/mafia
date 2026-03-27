# Release Notes

## [1.0.0-PRO] - 2026-03-27

### Initial Professional Release

This release marks the transformation of the Mafia Nightfall Protocol from a high-fidelity prototype into a production-ready, scalable application.

### Key Features
- **Modern Monorepo Architecture:** Reorganized into a clean `apps/` and `packages/` structure using NPM workspaces.
- **Scalable Real-time Core:** Integrated Redis Adapter for Socket.io, allowing the game to scale across multiple server instances.
- **Persistent Storage:** Full integration with PostgreSQL via Prisma ORM for user accounts, MMR tracking, and match history.
- **Professional UI/UX:** Refactored web and mobile clients with cinematic "Cyber-Noir" aesthetics, skeleton loaders, and enhanced accessibility (WCAG compliant).
- **Advanced Bot AI:** Sophisticated automated players with personality models, suspicion maps, and human-like interaction delays.
- **Enterprise-Grade Security:**
    - PBKDF2 password hashing with per-user salting.
    - HMAC-signed session tokens with absolute expiration.
    - Server-side anti-cheat validation for all game actions.
    - Production code obfuscation for the web client.
    - Infrastructure hardening with Helmet and Rate Limiting.

### Technical Improvements
- **CI/CD Pipeline:** Automated testing and Docker build verification via GitHub Actions.
- **Containerization:** Production-ready Docker Compose orchestration for the full stack.
- **Code Quality:** Strictly typed TypeScript interfaces shared across all platforms.
- **Modular Design:** Extracted game logic into a dedicated `@mafia/shared` package.

### Infrastructure
- Added `docker-compose.yaml` for PostgreSQL and Redis orchestration.
- Implemented multi-stage Docker builds for optimized container images.
- Standardized environment variable management via `.env.example`.

---

## [0.5.0-BETA] - 2026-03-20

### Early Access Prototype
- Initial real-time socket implementation.
- Basic role assignment (Mafia, Doctor, Police, Villager).
- Concept UI for web and mobile.
- In-memory lobby management.
