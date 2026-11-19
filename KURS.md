# Kurs: Spec-Driven Development mit KI-Coding-Agenten

Der SDD-Workflow `spec` → `code` → `verify` entsteht hier Stufe für Stufe am Issue #1
(Kategorien für Habits mit Filter). Jede Stufe ist ein Branch, der auf der vorherigen
aufbaut: `git switch stufe/03-code`. Die Skills liegen unter `.claude/skills/`.

Auf `uebung/habit-tracker` werden die Kursstufen der Reihe nach eingebunden.
Wähle in der Codex-Desktop-App `/spec` und gib eine Issue-Nummer oder
Aufgabenbeschreibung ein. In der CLI und der IDE-Erweiterung kannst du
`$spec Kategorien für Habits` verwenden.

Die Diff-Befehle nutzen `origin/`, damit sie in einem frischen Clone ohne lokale
Stufen-Branches funktionieren.

| Branch | Was dazukommt | Diff zur Vorstufe |
| --- | --- | --- |
| `main` | Ausgangsprojekt: Nuxt 4, Pinia, Dexie, Zod, Tests | – |
| `stufe/01-spec-starter` | Minimaler, generischer `spec`-Skill | `git diff origin/main origin/stufe/01-spec-starter` |
| `stufe/02-spec-voll` | Voller `spec`-Skill (Issue per `gh`, Recherche per Subagent, ADRs, Rückfragen, Stopp, Freigabe über `Status:` und `Approved-by:`), `AGENTS.md` und die Ticket-Vorlage mit Pflichtfeld Akzeptanzkriterien; Ergebnis `specs/kategorien.md` (`Status: draft`) | `git diff origin/stufe/01-spec-starter origin/stufe/02-spec-voll` |
| `stufe/03-code` | `code`-Skill (TDD, kleine Commits, Gates); Spec freigegeben (`Status: approved`); Ergebnis: Feature #1 in kleinen Commits | `git diff origin/stufe/02-spec-voll origin/stufe/03-code` |
| `stufe/04-verify-gates` | `verify` v1: Lint, Typecheck, Unit-Tests, Bericht `specs/kategorien.verification.md` | `git diff origin/stufe/03-code origin/stufe/04-verify-gates` |
| `stufe/05-verify-e2e` | `verify` v2: plus E2E-Tests mit Playwright auf Port 3110 | `git diff origin/stufe/04-verify-gates origin/stufe/05-verify-e2e` |
| `stufe/06-verify-spec-abgleich` | `verify` v3: plus Beleg für jedes Akzeptanzkriterium | `git diff origin/stufe/05-verify-e2e origin/stufe/06-verify-spec-abgleich` |
| `stufe/07-verify-review` | `verify` v4: plus Review durch frischen Subagenten `reviewer` | `git diff origin/stufe/06-verify-spec-abgleich origin/stufe/07-verify-review` |
| `stufe/08-verify-browser` | `verify` v5: plus Browser-Check mit `playwright-cli` | `git diff origin/stufe/07-verify-review origin/stufe/08-verify-browser` |
| `stufe/09-verify-hook` | Hook `schema-guard` und Skill `schema-change`: Schema-Tests laufen deterministisch nach jeder Schema-Änderung. Dazu der allgemeine Stop-Hook `gates-on-stop`: Lint und Unit-Tests am Turn-Ende, bei Rot arbeitet der Agent weiter | `git diff origin/stufe/08-verify-browser origin/stufe/09-verify-hook` |
| `stufe/10-verify-pr` | `verify` v6: mit `--pr` ein Draft-PR, der auf das Issue verweist (`Refs #`, auch in der PR-Vorlage) | `git diff origin/stufe/09-verify-hook origin/stufe/10-verify-pr` |

Nur eine Datei ansehen:
`git diff origin/stufe/04-verify-gates origin/stufe/05-verify-e2e -- .claude/skills/verify/SKILL.md`.
Nur die Übersicht: `--stat` anhängen.

Gates: `npm run lint`, `npm run typecheck`, `npm test`,
`PORT=3110 E2E_PORT=3110 npm run test:e2e`. Nie Port 3000.

Zwei Branches neben der Kette: `kurs/live-start` ist die Basis für den Live-Lauf `/spec 1` → `/code` (`stufe/02-spec-voll` ohne `specs/kategorien.md`, plus `code`-Skill), `kurs/gitlab-jira` zeigt auf Basis von `stufe/10-verify-pr`, welche Zeilen ihr für GitLab und Jira tauscht: `git diff origin/stufe/10-verify-pr origin/kurs/gitlab-jira`.

## Verify fängt einen Fehler: `kurs/verify-rot`

Alle Berichte auf den Stufen sagen Pass. Der Branch `kurs/verify-rot` zeigt den anderen
Fall. Er baut auf `stufe/08-verify-browser` auf und enthält wieder den Leerzustand-Fehler
aus dem freien Prompt: Bei aktivem Kategorie-Filter behauptet der Open-Tab „Everything
due today has already been reviewed“, obwohl Habits anderer Kategorien offen sind.
`/verify` hat den Fehler gefunden. Der Bericht mit Verdict „Issues found“ liegt in
`specs/kategorien.verification.md`, der Fix geht zurück an `/code`.

- Der eingebaute Fehler: `git diff origin/stufe/08-verify-browser origin/kurs/verify-rot -- app/`
- Der Bericht: `git show origin/kurs/verify-rot:specs/kategorien.verification.md`

## Weitere Branches

Neben der Stufen-Kette gibt es weitere Branches im Repo. Ihr braucht sie für die Hausaufgabe nicht.

| Branch | Wofür |
| --- | --- |
| `kurs/live-start` | Basis für die Live-Läufe im Kurs |
| `kurs/verify-rot` | Verify mit Befund (siehe oben) |
| `kurs/gitlab-jira` | Skills für GitLab und Jira |

**Ältere Probeläufe aus der Vorbereitung.** Sie sind nicht Teil des Kurses und bleiben nur als Altlast stehen:

- `kurs/sdd-skills`
- `kurs/kategorien-prompt`: freier Prompt ohne Workflow, für den Vergleich mit `kurs/kategorien-sdd`
- `kurs/kategorien-sdd`
- `kurs/harness`
- `kurs/agents-md`
- `kurs/csv-export`

**Draft-PR #5 (CSV-Export, Issue #3).** Eine Beispiel-Lösung aus der Vorbereitung. Wer die
Hausaufgabe selbst machen will, schaut ihn erst danach an.

## Hausaufgabe

Baut Issue #3 (CSV-Export der Check-ins) und Issue #4 (Heatmap pro Habit) mit dem fertigen
Workflow von `stufe/10-verify-pr`.

0. **Repo forken.** In das Kurs-Repo könnt ihr nicht pushen, `/verify … --pr` scheitert
   dort. Arbeitet in eurem Fork:

   ```bash
   gh repo fork dinooo13/habit-tracker-demo --clone
   cd habit-tracker-demo
   git switch -c feat/3-csv-export origin/stufe/10-verify-pr
   npm install    # Node 22, siehe .nvmrc
   ```

   `gh` liest die Issues danach aus dem Kurs-Repo (`upstream`). Vor dem Schritt mit
   `--pr` stellt ihr `gh` auf euren Fork um, damit der Draft-PR dort landet und nicht im
   Kurs-Repo:

   ```bash
   gh repo set-default <euer-github-name>/habit-tracker-demo
   ```

1. `/spec 3`, Rückfragen beantworten, Spec freigeben: `Status: approved` und
   `Approved-by: <Name>, <Datum>` setzen und committen.
2. Neue Session: `/code specs/<slug>.md`.
3. Neue Session: `/verify specs/<slug>.md --pr`.

Für Issue #4 dasselbe auf einem neuen Branch, z. B. `feat/4-heatmap`. Vor `/spec 4`
stellt ihr `gh` zurück auf das Kurs-Repo: `gh repo set-default dinooo13/habit-tracker-demo`.

Vergleicht eure Spec und euren Bericht danach mit denen eurer Kolleginnen und Kollegen.
