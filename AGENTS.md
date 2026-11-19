# AGENTS.md

Local-first habit tracker: Nuxt 4 SPA (`ssr: false`), Pinia, Dexie/IndexedDB, Zod. No backend.
UI texts are English. Use Node 22 (`.nvmrc`).

## Gates (all green before a commit)
```bash
npm run lint && npm run typecheck && npm test        # ~20 s
PORT=3110 E2E_PORT=3110 npm run test:e2e             # ~45 s, builds and serves the app
```
Stop hook `gates-on-stop` runs lint and unit tests at the end of a turn with changes; red blocks.
Dev server: `PORT=3110 npm run dev`. Unit tests in `tests/` (Node), rendered components in
`tests/nuxt/`, user flows in `e2e/specs/` with the builders from `e2e/support/data.ts`.

## Architecture map
- `app/pages/app/*` – screens (today, habits, review, insights, settings); `app/components/` – shared UI
- `app/stores/` – Pinia: habits, entries, coach, settings; single source of truth
- `app/composables/` – cross-cutting: persistence, lifecycle, cross-tab sync, clock, demo data
- `app/utils/domain/` – pure logic: date, stats, weekdays, coaching rules (no Vue, no storage)
- `app/utils/persistence/` – Zod schema, migrations, Dexie adapter, merge, backup
- `app/types/app-data.ts` – persisted data model (`AppData`, `schemaVersion`)
- `app/plugins/bootstrap.client.ts` – load → validate/migrate → hydrate → debounced save
- `docs/architecture.md` – diagrams of the flows above
- `specs/` – feature specs and verification reports, written by the skills in `.claude/skills/`

## Hard rules
- Schema changes are never silent. Any change to `app/types/app-data.ts` or the Zod schema
  needs a new ADR and must keep old data and old backups loading (ADR-0006, ADR-0022).
- UI features do not need the storage layer. Read from the stores, compute in
  `app/utils/domain/`, render in a component.
- Never use port 3000, neither for dev nor for e2e (the Playwright default is 3000).
- Never weaken, skip or delete a test to get a gate green.

## ADRs
Decisions live in `docs/adr/` (index: `docs/adr/README.md`). Read the matching ADR before
you touch persistence, the data schema, auth, sync or a core dependency. Accepted ADRs are
settled: a structural change needs a new ADR, never an edit of an old one.
