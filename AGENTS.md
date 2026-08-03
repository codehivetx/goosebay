# AGENTS.md

## Project
- Single-package JS CLI: `@codehivetx/goosebay` — syncs [Time Warrior](https://timewarrior.net) exports → QuickBooks Time Tracking (NOT TSheets).
- Entry: `bin/goosebay` → `lib/cli.js` → `lib/goosebay.js` (core logic). `lib/main.js` re-exports `Cli` + `GooseBay`.
- Config: uses `conf` package, stored per OS per the env-paths docs. Override with `-K altconfig`.

## Commands
| Purpose | Command |
|---|---|
| lint | `npm run lint` |
| test | `npm test` |
| all (CI order) | `npm run lint` → `npm test` |

- ESLint: 4-space indent, unix linebreaks, single quotes, always semi. License header required (see `resources/license-header.js`).
- Tests: `tap tests/*_test.js`. No special setup needed.

## Architecture notes
- `lib/goosebay.js:22` — `GooseBay` class; owns OAuth lifecycle, QBO API calls, and `import()`.
- `lib/cli.js:14` — `Cli.opts` defines short flags (`-K`, `-D`, `-P`, `-I`, `-X`, `-G`, `-E`).
- `lib/config.js:8` — thin wrapper around `Conf`; every new CLI session creates a fresh `Conf` instance.
- `lib/tw_to_iso.js` and `lib/seconds_to_hm.js` — pure utility functions.

## Import workflow (non-obvious)
1. `timew export … | goosebay --import` — dry-run (prints candidates, touches nothing).
2. `timew export … | env GOOSE_BAY_COMMIT=1 goosebay --import` — actually commits to QBO.
3. Import can also take a file: `goosebay --import input.json`.

## OAuth & config (quirks)
- `--greet` (`-G`) does a login+company check; must paste callback URL from browser back into the CLI.
- `employee_id` and `employee_name` are resolved by name via `QBO findEmployees`; use `--employee=Name` to set them.
- `tag2rate`, `tag2customer`, `tag2item` all require a prior `--greet` (they call `greet()` which triggers `login()`).
- `clientenvironment` config is `sandbox` or `production` (not `true`/`false`).

## File conventions
- All source files: `lib/` and `tests/`. No monorepo.
- Generated/ephemeral dirs to ignore: `node_modules/`, `.nyc_output/`, `logs/oAuthClient-log.log`, `local-*`.
- CI matrix: Node 16.x and 17.x on all branches.
- Conventional commit scopes (VS Code hint): `deps`, `import`, `qbott`.
