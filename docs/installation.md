# Installation Guide

Follow these steps to set up the Mafia Nightfall Protocol development environment.

## Prerequisites

- **Node.js:** v18 or higher (Recommended: v20 LTS)
- **NPM:** v9 or higher
- **Docker & Docker Compose:** Required for running the full stack (PostgreSQL, Redis)
- **Git:** For version control

## Local Development Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/manthan-bt/mafia.git
   cd mafia
   ```

2. **Install Dependencies:**
   From the root directory, run:
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Copy the example environment file and update the values:
   ```bash
   cp .env.example .env
   ```
   *Note: Ensure you set a strong `AUTH_SECRET` and correct database credentials.*

4. **Initialize the Database:**
   Generate the Prisma client:
   ```bash
   npm run prisma:generate
   ```
   If running locally without Docker, ensure PostgreSQL is running and perform migrations:
   ```bash
   npm run prisma:migrate -w @mafia/server
   ```

5. **Start Development Servers:**
   Open two terminals or use root scripts:
   ```bash
   # Terminal 1: Start Backend
   npm run dev:server

   # Terminal 2: Start Web Client
   npm run dev:web
   ```

## Mobile Development (Expo)

1. Navigate to the mobile directory:
   ```bash
   cd apps/mobile
   ```
2. Start the Expo development server:
   ```bash
   npm start
   ```
3. Use the Expo Go app on your physical device or an emulator to run the app.

## Desktop Development (Electron)

1. Navigate to the desktop directory:
   ```bash
   cd apps/desktop
   ```
2. Start the Electron app:
   ```bash
   npm start
   ```

## Production Deployment (Docker)

To run the entire stack in a production-like environment:
```bash
npm run docker:up
```
This will build and start:
- **Server:** Accessible at `http://localhost:3005`
- **Web Client:** Accessible at `http://localhost:80`
- **PostgreSQL:** Port 5432
- **Redis:** Port 6379
