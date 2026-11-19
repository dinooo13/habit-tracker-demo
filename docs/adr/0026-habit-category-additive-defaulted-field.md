# 26. Habit category as an additive defaulted field (no schemaVersion bump)

- **Status:** Accepted
- **Date:** 2026-11-16

## Context

Users want to group habits (Health, Learning, Work, Other) and filter the Habits list and
the Today queue by that group. This needs a new persisted field, `Habit.category`.

ADR-0006 / ADR-0010 say a persisted shape change bumps the versioned envelope and adds a
migration. But a bump is a one-way door (no down-migration, older tabs/backups cannot read
V3), and this field has an unambiguous neutral default (`other`), so the cost of a bump
buys nothing. Issue #8 already set the precedent: `lastExportedAt` /
`backupNudgeSnoozedUntil` were added to `AppSettings` as defaulted fields without a bump.

## Decision

- `Habit.category: HabitCategory` with the fixed set `HABIT_CATEGORIES = ['health',
  'learning', 'work', 'other']` and `DEFAULT_HABIT_CATEGORY = 'other'`
  (`app/types/app-data.ts`). Custom categories are out of scope.
- **No `schemaVersion` bump** — the envelope stays `AppDataV2`. The strict and lenient
  Zod schemas share `HabitCategorySchema = z.enum(HABIT_CATEGORIES).catch('other')`, so a
  missing or unknown value (old payloads, old backups, hand-edited imports) becomes
  `'other'` instead of failing validation or quarantining the payload.
- `migrateToV2` also sets `category: 'other'`; no new registry step is added.
- Filtering is in-memory only (page-local state synced to `?category=`), so there is no
  Dexie store/index change and the filter itself is not persisted.
- The cross-tab merge treats `category` as a habit field (`habitsEqualIgnoringId`).

## Consequences

- Old data and backups load unchanged and get `other`; no migration UI or data loss.
- Rolling back the app after habits were categorised is safe: the unknown field is stripped
  by older Zod schemas and the data stays otherwise valid.
- This is an explicit, narrow **exception to ADR-0006**: purely additive fields with a
  safe default may skip a version bump. Any change that must reinterpret or remove existing
  data still requires a bump and a registry step (ADR-0022).
