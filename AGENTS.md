# AGENTS.md

## Projektkontext

- Lies `README.md` für Einrichtung und Projektstruktur.
- Nutze Node 22 (`.nvmrc`) und npm. App-Texte bleiben auf Englisch.

## Dokumentenindex

- [README](README.md) – Projektübersicht, Einrichtung und Befehle.
- [Dokumentationsübersicht](docs/README.md) – Einstieg in die Projektdokumentation.
- [Architektur](docs/architecture.md) und [ADR-Index](docs/adr/README.md) – Aufbau und Architekturentscheidungen.
- [Glossar](docs/glossary.md) – Fachbegriffe des Habit Trackers.
- [Tests](docs/TESTING.md) und [Playwright](docs/e2e-testing.md) – Testaufbau und Browserprüfungen.
- [Sicherheit](SECURITY.md) und [DSGVO](docs/DSGVO.md) – Sicherheitsmodell und Datenschutzprüfung.
- [DSGVO-Prüfbericht](docs/DSGVO-PRUEFBERICHT.md) – Befunde und offene Betreiberfragen vom 18. November 2026.
- [Kurs](KURS.md) – Übungen, Branches und Arbeitsabläufe.
- [Seminarbonus Ü0–Ü2](docs/SEMINAR-BONUS-UE0-UE2.md) – Ergebnisse der Vergleichsläufe und Browserprüfung.
- [Spezifikation für Habit-Kategorien](specs/kategorien.md) – freigegebener Umfang für Issue #1.
- [Spezifikation für parallele Aufgaben im Code-Skill](specs/code-skill-parallel-tasks.md) – freigegebener Umfang für die Delegation an Subagenten.
- [Spec-Skill für Codex](.agents/skills/spec/SKILL.md) – Spezifikationen erarbeiten.
- [Code-Skill für Codex](.agents/skills/code/SKILL.md) – freigegebene Spezifikationen testgetrieben umsetzen.
- [DSGVO-Skill](.agents/skills/dsgvo/SKILL.md) – Datenschutzprüfung im Repo durchführen.
- GitHub-Vorlagen für [Pull Requests](.github/PULL_REQUEST_TEMPLATE.md), [Features](.github/ISSUE_TEMPLATE/feature_request.yml) und [Bugs](.github/ISSUE_TEMPLATE/bug_report.md).

Pflege den Index in derselben Änderung, wenn Dokumente hinzukommen, umbenannt,
verschoben oder entfernt werden. Prüfe relative Links. Einzelne ADRs gehören in den ADR-Index.

## Skills pflegen

- Codex ist die Zielplattform. Pflege die Skills unter `.agents/skills/`.
- `.claude/skills/` bleibt als Artefakt für die Übungen erhalten. Spiegle Änderungen
  an dort vorhandenen Übungsskills in derselben Änderung unter demselben relativen
  Pfad. Übertrage auch Umbenennungen und Löschungen.
- Prüfe die Kopien auf Bytegleichheit. Eigenständige Codex-Skills wie `dsgvo` bleiben in `.agents/skills/`.

## Architektur

- Clientseitige Nuxt-4-PWA (`ssr: false`). App-Daten bleiben im Browser.
- UI in `app/pages` und `app/components`, Zustand in `app/stores` (Pinia),
  Speicherung über `PersistenceAdapter`. Reine Logik liegt in `app/utils/domain`.
- Lies bei UI-Änderungen zuerst Seite, Komponente und Tests. Ohne Daten- oder Schnittstellenänderung reicht dieser Einstieg.
- Lies den passenden ADR vor Änderungen an Persistenz, Datenmodell, Auth,
  Tab-Synchronisierung oder zentralen Abhängigkeiten. Erfasse strukturelle
  Änderungen in einem neuen ADR.
- Nutze `useHabitActions()` für storeübergreifende Habit-Änderungen und `useClock()` für das reaktive lokale Datum.
- Änderungen am persistierten Datenmodell in `app/types/app-data.ts` oder am
  Zod-Schema brauchen einen neuen ADR. Stelle sicher, dass sich bestehende
  Daten und JSON-Backups weiterhin laden lassen.

## Änderungen prüfen

Vor Implementierungscommits (Bash)

```bash
npm run lint && npm run typecheck && npm test
PORT=3110 E2E_PORT=3110 npm run test:e2e
```

Dev läuft auf Port 3110. Nutze Vitest `unit` für Logik, `nuxt` für Komponenten
und die E2E-Builder aus `e2e/support/data.ts`. Bei URL-Filtern prüfe Reload,
Leerzustände und offene Habits außerhalb des Filters. Berichte die Prüfergebnisse.
