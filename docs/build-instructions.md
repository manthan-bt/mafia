# Build Instructions

This document provides detailed information on how to build the various components of the Mafia Nightfall Protocol.

## Monorepo Build Scripts

The root `package.json` contains aggregate build scripts for convenience:

```bash
# Build all packages and apps (shared, server, web)
npm run build
```

## Component-Specific Builds

### 1. Shared Logic (@mafia/shared)
Compiles TypeScript to JavaScript and generates type declarations.
```bash
npm run build -w @mafia/shared
```
Output: `packages/shared/dist/`

### 2. Backend (@mafia/server)
Compiles the Express server and prepares the Prisma client.
```bash
# Generate Prisma Client
npm run prisma:generate -w @mafia/server

# Compile Server
npm run build -w @mafia/server
```
Output: `apps/server/dist/`

### 3. Web Client (@mafia/web)
Builds the React application for production using Vite.
```bash
npm run build -w @mafia/web
```
Output: `apps/web/dist/`

### 4. Desktop Client (@mafia/desktop)
Packages the Electron application for distribution.
```bash
cd apps/desktop

# Create a local build for current OS
npm run pack

# Create distributable installers
npm run dist
```
Output: `apps/desktop/dist/`

## Docker Builds

Docker builds use the root directory as the context to ensure the shared package is accessible.

### Server Image:
```bash
docker build -t mafia-server -f apps/server/Dockerfile .
```

### Web Client Image:
```bash
docker build -t mafia-web -f apps/web/Dockerfile .
```

## Continuous Integration (CI)

The project uses GitHub Actions to verify builds on every push. The workflow (`.github/workflows/ci.yml`) performs the following:
1. Installs dependencies using `npm ci`.
2. Lints the codebase.
3. Compiles `@mafia/shared`.
4. Runs automated tests.
5. Verifies Docker builds for Server and Web.
