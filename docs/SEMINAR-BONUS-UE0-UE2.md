# Seminarbonus Ü0 bis Ü2

Stand 18. November 2026 auf `uebung/habit-tracker`. Aufgabenquelle ist das
Markdown-Übungsheft aus `origin/seminar/uebungen` (`d0fc43f`). Wir arbeiten
mit Weg B im Demo-Fork.

## Ü0 · Schnelltest und Ticket

- **E2E.** Der vorhandene Lauf für den aktuellen Anwendungsstand `a180deb`
  auf Port 3110 ergab 117 bestandene Tests. Der reine Mobiltest wurde im
  Desktop-Projekt planmäßig übersprungen. Seit dem Lauf änderten sich nur
  Skills und Dokumentation.
- **Ticket.** Erste Rückfrage zu [Issue #1](https://github.com/dinooo13/habit-tracker-demo/issues/1):
  „Sind Gesundheit, Lernen und Arbeit eine feste Auswahl, und sollen Habits
  ohne Zuordnung über einen eigenen Filter auffindbar sein?“ Das Ticket erlaubt
  eine leere Zuordnung, lässt aber diese beiden Produktentscheidungen offen.
- **Kursausblick.** In `origin/stufe/10-verify-pr:KURS.md` führt die Kette von
  `spec` über `code` und `verify` bis zum Draft-PR. Nach den Grundprüfungen
  kommen E2E, Belege je Akzeptanzkriterium, Review, Browserprüfung und Hooks.

## Ü1 · Freier Prompt und Review

Zwei frische Codex-Sitzungen erhielten denselben Wortlaut „Füge Kategorien für
Habits hinzu, mit Filter“ in getrennten Kopien von `origin/main`. Die
Ausführungsrichtlinie blockierte den Datei- und Shellzugriff. Die Sitzungen
lieferten keine Implementierung, deshalb lässt sich ihre Übereinstimmung beim
Implementieren nicht bewerten. Der zusätzliche Vergleich mit einem Firmenrepo
gehört zu Weg A.

Den Rückfall-Stand `origin/kurs/kategorien-prompt` (`8c9579b`) habe ich im
Browser geprüft. Beide Kategorie-E2E-Fälle bestanden auf Port 3110. Ich
erweiterte den zweiten Fall ausschließlich in einer isolierten Kopie um
Beobachtungen zu URL, Reload und dem Open-Tab. Er bestätigte zwei Lücken:
Beim Filtern wird kein `category`-Parameter gesetzt und nach dem Reload
steht der Filter wieder auf „All“. Wenn nur die sichtbare Kategorie erledigt
ist, während eine andere noch offen ist, erscheint trotzdem die globale
Erledigt-Meldung.

**Prüfungen am Rückfall-Stand.** Lint und Typecheck waren grün. Vitest
bestand alle 368 Unit-Tests. Die 16 Nuxt-Suites konnten in der temporären
Installation mit verlinkten Abhängigkeiten den Nuxt-Testeinstieg nicht laden.

| Was der freie Lauf klären oder berücksichtigen musste | Datei oder Regel |
| --- | --- |
| Feste Kategorien und Verhalten bei leerer Zuordnung abstimmen. Der Lauf entschied sich eigenständig für `Other`. | Issue #1 und `app/types/app-data.ts` |
| Teilbare Filter über die URL statt nur im Ansichtsstatus speichern. | `app/pages/app/index.vue`, `app/pages/app/habits/index.vue` |
| Fällige und offene Habits im gefilterten Bereich getrennt betrachten. | Open-Tab in `app/pages/app/index.vue` und Akzeptanzkriterien von Issue #1 |
| Die Kompatibilität des neuen Felds mit gespeicherten Daten und Backups prüfen und dokumentieren. Der Lauf ergänzte einen Default, aber keinen ADR. | `app/utils/persistence/storage-schema.ts`, ADR-0006 und ADR-0022 |
| Prüfen, ob der Habits-Prompt das neue Feld beim Export zur Weiterverarbeitung erhalten soll. | `app/utils/domain/ai-prompts.ts` |
| Tests für Reload, teilbare Links und offene Habits außerhalb des Filters ergänzen. | `e2e/specs/categories.spec.ts` |

**Geschätzter Teamaufwand.** Etwa 45–60 Minuten Review in zwei Runden.
Die erste deckt Browserabläufe, Datenformat und Tests ab. Die zweite prüft
die Korrekturen an URL und Leerzustand sowie die ergänzten Nachweise.

**Für den nächsten Coding-Lauf.** [AC5 in der Spec](../specs/kategorien.md)
nennt jetzt den konkreten Fall mit zwei Health-Habits und einem offenen
Learning-Habit. E4 prüft den kategoriespezifischen Leerzustand, das Ausbleiben
der globalen Abschlussmeldung, Reload und Rücksetzen des Filters. Die
Stufenumsetzung deckt den Fall bereits ab.

## Ü2 · Kontext und Skill-Auswahl

Für den Vergleich liefen frische, schreibgeschützte Sitzungen mit demselben
minimalen Spec-Skill, Ticket, denselben README- und Architekturauszügen sowie
identischen vorgegebenen Antworten. Der jeweilige Kontext kam per
Standardeingabe in die Sitzung. Jeder Lauf gab Rückfragen und einen
Markdown-Entwurf aus.

| Kontext | Beobachtung |
| --- | --- |
| Mit vollständiger `AGENTS.md` | Sieben Rückfragen, darunter Mehrfachfilter, Habits ohne Zuordnung, Ansichtswechsel und Today-Leerzustände. Der Entwurf verwendete englische UI-Labels und verlangte einen ADR zur Schemaänderung. |
| Ohne `AGENTS.md` | Vier Rückfragen, darunter eine zur URL-Speicherung, die das Ticket schon festlegt. Der Entwurf enthielt auch deutsche UI-Texte und verlangte keinen neuen ADR. |
| Mit gekürzter `AGENTS.md` | Vier Rückfragen. Englische App-Texte und der erforderliche ADR blieben im Entwurf erhalten. Die ergänzende Beschreibung des Standardadapters war dafür entbehrlich und wurde im Übungsbranch gestrichen. |

Die Unterschiede stammen aus je einem Lauf. Sie zeigen beobachtete
Unterschiede, ohne die Zahl der Rückfragen kausal der Kontextdatei
zuzuschreiben.

**Implizite Auswahl.** Die neue Skill-Beschreibung nennt einen natürlich
formulierten Planungsauftrag. Auf „Plane mir das Feature Habit-Kategorien
mit Filter“ versuchte Codex ohne expliziten Skill-Aufruf,
`.agents/skills/spec/SKILL.md` zu öffnen. Die Richtlinie blockierte das
Lesen. Damit ist die Auswahl beobachtet, der vollständige automatische
Skill-Lauf bleibt offen. Der generische Entwurf anschließend war keine
belastbare Spezifikation zu Issue #1.

**Nachweis der Hauptübung.** Eine frische Sitzung führte den minimalen
`spec`-Skill aus `stufe/01-spec-starter` in einer isolierten Kopie aus.
Sie las Issue #1 und erzeugte `specs/kategorien.md` sowie
`specs/kategorien.brainstorming.md` mit sieben Fragen in zwei Runden.
Die bereits festgehaltenen Seminarentscheidungen dienten als Antworten.
Neue Annahmen sind im Entwurf gekennzeichnet. Beide Dateien bleiben als
Ü2-Artefakte in der isolierten Kopie. Der Übungsbranch führt den späteren
Spec-Skill und eine auf 60 Zeilen verdichtete `AGENTS.md`.

Die gemeinsame Skill-Quelle bleibt `.claude/skills/`. Änderungen werden
pfadgleich in derselben Änderung nach `.agents/skills/` gespiegelt.
Die Regel steht in der [AGENTS.md](../AGENTS.md).

## Debrief · Philip Rekers

**Ü2**

> Unsere wichtigste Regel: Wenn sich das gespeicherte Datenmodell oder das
> Zod-Schema ändert, braucht es einen neuen ADR. Alte Browserdaten und
> JSON-Backups müssen weiterhin laden. Die Details zum Kategorienfilter stehen
> in der Spec. Meine Frage: Welche Teile dieser Regel würdet ihr in CI prüfen,
> und welche gehören ins Review?

**BMad-Bonus aus Ü3**

Verglichen wurde die freigegebene [eigene Spec](../specs/kategorien.md) mit
der fertigen BMad-Spec aus `origin/bmad/03-spec-bereit`, wie im Übungsheft
für die Variante ohne Installation vorgesehen.

| Punkt | Eigene Spec | BMad-Spec |
| --- | --- | --- |
| Fehlende Kategorie | `Other` | `null` |
| Unbekannter URL-Wert | Alle Kategorien anzeigen | Leerer Trefferzustand mit Reset |
| Randfall in Today | AC5 und E4 sichern den Fall einer erledigten Auswahl mit offenen Habits in einer anderen Kategorie ab | Die Edge-Case-Matrix und die Akzeptanzkriterien beschreiben denselben Fall |
| Zusätzliche Code-Stelle | `ai-prompts.ts` für die Weitergabe des Kategoriefelds im Prompt | Die Code Map enthält dazu keinen Eintrag |
| Freigabe | `Approved-by` mit Name und Datum im Spec-Commit | `ready-for-dev` im Frontmatter |

Aus dem fertigen BMad-Artefakt geht nicht hervor, wie viele Rückfragen
Build gestellt hat.

> Die BMad-Matrix macht den Today-Randfall schnell sichtbar. Unsere Spec
> verknüpft ihn mit E4 und hält die Freigabe mit Namen und Datum im Commit fest.
> Bei Produktdetails kamen wir zu unterschiedlichen Ergebnissen: Unsere Spec
> verwendet `Other` und zeigt bei einem unbekannten URL-Wert alle Kategorien.
> Die BMad-Spec verwendet `null` und zeigt bei einem unbekannten URL-Wert
> einen leeren Trefferzustand mit Reset. Meine Frage: Welche dieser
> Entscheidungen sollte der Agent vor der Freigabe ausdrücklich zur Wahl stellen?
