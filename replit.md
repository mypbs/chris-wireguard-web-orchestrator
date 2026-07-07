# Chris's WireGuard Web Orchestrator

A self-hosted web dashboard for managing WireGuard VPN exit nodes from a central control plane. Manages SSH connections to VPS nodes, installs/configures WireGuard remotely, and generates client configs with QR codes.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `SESSION_SECRET` — secret for express-session cookie signing

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + express-session + bcrypt
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + Tailwind + Wouter
- SSH: `ssh2` library
- QR codes: `qrcode` library

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/index.ts` — DB schema (users, nodes, clients tables)
- `artifacts/api-server/src/routes/` — all API route handlers
- `artifacts/api-server/src/lib/ssh.ts` — SSH connection and command runner
- `artifacts/api-server/src/lib/wireguard.ts` — WireGuard install/config/key gen helpers
- `artifacts/wg-manager/src/` — React frontend

## Architecture decisions

- SSH passwords are base64-encoded in the DB (not plaintext, not heavily encrypted — this is a self-hosted tool and the DB itself is the security boundary)
- WireGuard keys are generated ON the remote node using the `wg` CLI to avoid shipping private keys over the wire after generation
- Client IPs are allocated sequentially from the subnet (e.g. 10.0.0.2/32, 10.0.0.3/32...)
- Session auth via express-session + bcrypt; first-run setup flow creates the single admin account
- Default WireGuard port: 44221 (non-standard, as requested)

## Product

- Dashboard with live node status overview (total nodes, running WireGuard, total clients)
- Add VPS nodes via SSH credentials
- Test SSH connectivity before WireGuard setup
- Install + configure WireGuard on any node via SSH
- Add/delete WireGuard clients per node — generates keys on the node, returns .conf + QR code
- Start/stop/restart/uninstall WireGuard controls per node
- Login-protected with bcrypt password auth and persistent sessions

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change — it also runs `typecheck:libs`
- SSH commands are run with `sudo bash -c '...'` — the SSH user needs passwordless sudo for `apt`, `wg`, `systemctl`, `iptables` (configure via visudo)
- WireGuard setup command can take 60-120s (apt-get install) — the API has a 120s SSH timeout for setup
- `pnpm run typecheck:libs` must be run before leaf artifact typechecks when DB schema changes

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
