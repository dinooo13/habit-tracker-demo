# DSGVO-Prüfleitfaden für den Habit Tracker

Dieser Leitfaden dient der Datenschutzprüfung des Übungsrepos. Für eine Bewertung
des tatsächlichen Betriebs braucht es zusätzlich Angaben zur Bereitstellung, zum
Betreiber und zu den beteiligten Diensten. Der [DSGVO-Skill](../.agents/skills/dsgvo/SKILL.md)
führt die Prüfung durch.

## Datenflüsse im Repo

| Bereich | Ausgangspunkte für die Prüfung |
| --- | --- |
| Habit-Daten | [Datenmodell](../app/types/app-data.ts), [Zod-Schema](../app/utils/persistence/storage-schema.ts) und [Dexie-Adapter](../app/utils/persistence/dexie-persistence-adapter.ts). Habit-Namen, Ziele und Reflexionsnotizen können je nach Inhalt personenbezogene Informationen oder Gesundheitsdaten enthalten. |
| Speicherung und Abruf | [Architektur](architecture.md) und [Sicherheitsmodell](../SECURITY.md). Prüfe IndexedDB, lokale Demo-Sitzung, Altdatenmigration, Service-Worker-Cache, Wiederherstellung und Synchronisierung zwischen Tabs. |
| Aktionen der Nutzenden | [Einstellungen](../app/pages/app/settings.vue) und [Prompt-Erzeugung](../app/utils/domain/ai-prompts.ts). Prüfe Backup, Import, Löschen, lokale Benachrichtigungen und das Kopieren eines aus Habit-Daten erzeugten KI-Prompts in die Zwischenablage. Erfasse eine spätere Weitergabe an einen KI-Dienst als eigenen Schritt. |
| Bereitstellung | [Nuxt-Konfiguration](../nuxt.config.ts), [Apache-Vorlage](../public/.htaccess.tpl) und [CI-Konfiguration](../.github/workflows/ci.yml). Prüfe externe Ressourcen und Netzwerkaufrufe sowie mögliche Hosting- oder CDN-Protokolle. |

## Prüffragen

- **Anwendbarkeit und Zuständigkeit.** Kläre Nutzungsszenario, Verantwortliche,
  Empfänger und beteiligte Dienstleister. Beurteile App-Daten und Hosting-Daten
  anhand ihrer jeweiligen Verarbeitung.
- **Zwecke und Rechtsgrundlagen.** Erfasse pro Verarbeitung Zweck, Datenkategorien,
  Rechtsgrundlage, Empfänger und Speicherdauer. Prüfe Datenminimierung und
  Löschfristen nach Art. 5–6 DSGVO. Prüfe Art. 9 zusätzlich, wenn besondere
  Kategorien personenbezogener Daten verarbeitet werden.
- **Endgerätezugriffe.** Prüfe bei deutschem Anwendungsbereich pro Speicher- oder
  Zugriffsvorgang, ob eine Einwilligung nach § 25 TDDDG nötig ist oder eine
  Ausnahme greift. Prüfe die Verarbeitung personenbezogener Daten nach DSGVO
  eigenständig.
- **Transparenz und Rechte.** Prüfe die Informationen für Nutzende nach Art. 12–14
  sowie die einschlägigen Rechte nach Art. 15–22 DSGVO. Prüfe mit synthetischen
  Daten, welche Daten sich einsehen, berichtigen, exportieren und löschen lassen.
  Berücksichtige
  weitere offene Tabs, Wiederherstellungsdaten und bereits heruntergeladene Backups.
- **Schutzmaßnahmen.** Prüfe datenschutzfreundliche Voreinstellungen,
  Zugriffsmöglichkeiten auf gemeinsam genutzten Browserprofilen, den Inhalt von
  Logs und Benachrichtigungen sowie Transport- und Hosting-Schutzmaßnahmen
  nach Art. 25 und 32 DSGVO.
- **Betrieb.** Prüfe die einschlägigen Betreiberpflichten, etwa Auftragsverarbeitung
  (Art. 28), Verzeichnis von Verarbeitungstätigkeiten (Art. 30),
  Datenschutzverletzungen (Art. 33–34), Datenschutz-Folgenabschätzung bei
  voraussichtlich hohem Risiko (Art. 35) und Drittlandübermittlungen (Art. 44 ff.).
  Halte fest, welche Nachweise der Betreiber liefern muss.

## Rechtsquellen

- [Verordnung (EU) 2016/679 im Amtsblatt der EU](https://eur-lex.europa.eu/eli/reg/2016/679/oj/deu/pdf)
- [§ 25 TDDDG zu Speicherung und Zugriff auf Endeinrichtungen](https://www.gesetze-im-internet.de/ttdsg/__25.html)
