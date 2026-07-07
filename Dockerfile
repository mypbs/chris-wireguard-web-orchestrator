
# =============================================================================
# Stage 1: Builder
# Installs all dependencies, builds the frontend and API server.
# =============================================================================
FROM node:24 AS builder
WORKDIR /workspace

# Build tools required to compile native modules (bcrypt)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install exact pnpm version via npm — deterministic, no corepack version drift
RUN npm install -g pnpm@11.10.0

# Copy workspace manifests first (maximises Docker layer cache)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json tsconfig.json ./

# Copy all workspace packages
COPY lib/       ./lib/
COPY scripts/   ./scripts/
COPY artifacts/api-server/     ./artifacts/api-server/
COPY artifacts/wg-manager/     ./artifacts/wg-manager/
COPY artifacts/mockup-sandbox/ ./artifacts/mockup-sandbox/

# Install all workspace dependencies.
# --ignore-scripts: bypass ERR_PNPM_IGNORED_BUILDS entirely — pnpm 11 workspace
# mode ignores onlyBuiltDependencies config; --ignore-scripts skips all lifecycle
# scripts so the error cannot fire.
# --no-frozen-lockfile: allows pnpm 11 to upgrade the lockfile format (v9→v10).
RUN pnpm install --no-frozen-lockfile --ignore-scripts

# Explicitly compile the native packages that need binary build steps.
# These would normally run automatically but were skipped by --ignore-scripts.
RUN pnpm rebuild bcrypt ssh2 cpu-features esbuild

# Generate typed API client hooks from the OpenAPI spec
RUN pnpm --filter @workspace/api-spec run codegen

# Build the React frontend (served at / in Docker)
RUN BASE_PATH=/ PORT=3000 pnpm --filter @workspace/wg-manager run build

# Bundle the API server with esbuild
RUN NODE_ENV=production pnpm --filter @workspace/api-server run build

# Create a self-contained production deployment directory.
# pnpm deploy copies the production node_modules (including pre-compiled
# bcrypt native binary) — no recompilation needed in the runtime stage.
RUN pnpm --filter @workspace/api-server deploy --prod --legacy --ignore-scripts /deploy

# Add the built bundles into the deploy directory
RUN cp -r artifacts/api-server/dist  /deploy/dist && \
    cp -r artifacts/wg-manager/dist/public /deploy/public

# =============================================================================
# Stage 2: Runtime
# Minimal image — no build tools, no source code, no dev dependencies.
# =============================================================================
FROM node:24-slim AS runtime
WORKDIR /app

# Copy the self-contained bundle from the builder
COPY --from=builder /deploy .

EXPOSE 3000

ENV NODE_ENV=production \
    PORT=3000

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
