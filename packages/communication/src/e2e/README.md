# Communication end-to-end tests

These tests use the real Octane communication stack against a disposable Polaris instance and MariaDB schema. They cover three user-visible paths:

1. initial login and authenticated transport;
2. room entry plus automatic reconnect after Polaris drops the active transport;
3. the authoritative inventory lifecycle: load, place in room, pick up and reload from the server.

They are integration tests, not browser UI tests. The connection, packet parsers, room session manager, emulator handlers and persistence layer are real; only the fixture identity and room are deterministic.

## Prerequisites

- Node.js 22 with Corepack
- the companion Polaris repository with JDK 25, Maven and MariaDB
- the environment and running runtime described in the emulator `e2e/README.md`

Install dependencies once:

```bash
corepack yarn install --immutable
```

## Run locally

Start the companion emulator after preparing its isolated database. Then run either suite:

```bash
yarn test:e2e:login-reconnect
yarn test:e2e:inventory
```

`test:e2e:login-reconnect` verifies login, room entry, an emulator-forced disconnect and authenticated reconnection. `test:e2e:inventory` verifies the initial authoritative snapshot, placement/removal events, pickup invalidation, a final authoritative snapshot and identity stability for item `900004`.

After the inventory suite, run the emulator-side persistence verifier:

```powershell
../emulatore/e2e/verify-inventory-state.ps1
```

or on Linux:

```bash
bash ../emulatore/e2e/verify-inventory-state.sh
```

## Required variables

The test process reads:

- `E2E_WS_URL`
- `E2E_PROBE_URL`
- `E2E_SSO_TICKET`
- `E2E_USER_ID`
- `E2E_ROOM_ID`

The emulator startup uses the matching database and port variables documented in its `e2e/README.md`. Keep the same ticket, user, room and ports in both processes.

## GitHub Actions

- `.github/workflows/e2e-login-reconnect.yml` runs the login, room-entry and reconnect path.
- `.github/workflows/e2e-inventory.yml` runs the inventory lifecycle and verifies its final database state.

Each workflow starts a fresh MariaDB service, resolves a companion `*-emulator` branch when the renderer branch ends in `-renderer`, builds Polaris with Java 25 and always stops the PID written below `E2E_RUNTIME_DIR`. On failure, the inventory workflow uploads Polaris logs.

## Troubleshooting

- A connection timeout usually means Polaris did not become ready, the three E2E ports are occupied or the renderer and emulator variables do not match.
- An authentication timeout usually means the SSO ticket in the renderer process differs from the seeded ticket.
- A room-entry timeout usually means user `900001` or room `900002` was not seeded into the selected schema.
- An inventory timeout prints a packet timeline. Compare the last transition with the Polaris logs to determine whether the request was rejected, no event was emitted or persistence did not complete.
- Never point these scripts at a production database. Re-run database preparation to restore a deterministic fixture after a failed or interrupted scenario.
