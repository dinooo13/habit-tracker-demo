# DSGVO-Prüfbericht

**Prüfstand** · 18. November 2026, Branch `stufe/01-spec-starter`, Commit `33e9797`.

Geprüft wurden Quellcode, Konfiguration und Datenflüsse des Habit Trackers sowie
ein lokal erzeugter Produktionsbuild in einem frischen Chromium-Profil mit
synthetischen Daten und zwei Tabs. Die Prüfung des Live-Hostings und der
Betreiberprozesse steht aus. Die Rechtsgrundlagen für die Prüfkriterien stehen
im [DSGVO-Prüfleitfaden](DSGVO.md).

## Befunde

| Priorität | Status | Befund, Auswirkung und nächster Schritt |
| --- | --- | --- |
| Hoch | Lückenhaft | **Unvollständige Löschung.** Nach „Delete all data“ verschwanden die aktiven Habits in beiden Tabs und blieben nach dem Neuladen gelöscht. Der separat hinterlegte synthetische Wiederherstellungsdatensatz blieb in IndexedDB. Der [Löschdialog](../app/pages/app/settings.vue#L301) speichert einen leeren aktiven Zustand, während die [Speicherroutine](../app/utils/persistence/dexie-persistence-adapter.ts#L81) die Quarantänetabelle ausspart. Die Quarantäne in derselben Transaktion löschen und den Fall mit zwei Tabs absichern. Maßstab sind Art. 5 und 17 DSGVO, soweit anwendbar. |
| Hoch | Lokal belegt, live offen | **Externer Symbolabruf vor dem Login.** Der lokale Build rief `api.iconify.design` für die Symbole Apple, Chrome und Login auf. Der Dienst antwortete mit HTTP 200. Synthetische Habit-Inhalte tauchten in den beobachteten Anfragen nicht auf. Beim Abruf fallen Verbindungsdaten wie die IP-Adresse an. Symbole lokal bündeln und den API-Fallback deaktivieren. Die [Apache-Vorlage](../public/.htaccess.tpl#L20) beschränkt `connect-src` auf den eigenen Ursprung. Die Wirksamkeit auf dem Live-Host wurde nicht geprüft. |
| Mittel | Lückenhaft | **KI-Prompt mit potenziell sensiblen Angaben.** Der Kopierbutton übergibt Habit-Namen und Identitätsaussagen an die Zwischenablage. Eine Weitergabe an einen KI-Dienst erfolgt, wenn Nutzende dort den Prompt einfügen. Vor dem Kopieren eine Vorschau mit gezieltem Entfernen sensibler Felder anbieten. [Prompt-Erzeugung](../app/utils/domain/ai-prompts.ts#L64) |
| Mittel | Offen | **Endgerätezugriffe und Transparenz.** Vor dem Login waren der Farbschema-Schlüssel in localStorage, die IndexedDB-Datenbank und der Service-Worker-Cache vorhanden. Der Test beobachtete keine Cookies. Für den deutschen Anwendungsbereich je Zugriff die Erforderlichkeit oder Einwilligung nach § 25 TDDDG klären. Eine auf den konkreten Betreiber zugeschnittene Datenschutzinformation nach Art. 12–14 DSGVO fehlt im Repo. |

## Weitere Prüfergebnisse

- **Im Browser bestätigt.** Ein Habit ließ sich anlegen, nach Neuladen einsehen,
  berichtigen und als JSON exportieren. Der reguläre Export enthält den aktiven
  Datenbestand. Die vollständige technische Löschung bleibt wegen der Quarantäne
  lückenhaft.
- **Im Code bestätigt.** Der Demo-Login trennt keine Nutzerdaten innerhalb eines
  gemeinsam genutzten Browserprofils. Lokale Erinnerungen sind standardmäßig
  deaktiviert. Bei Aktivierung kann der Benachrichtigungstext den Habit-Namen und
  die Identitätsaussage enthalten. [Sicherheitsmodell](../SECURITY.md#L15) ·
  [Benachrichtigungen](../app/composables/use-reminder-engine.ts#L163)

## Offene Betreiberfragen

Für die Bewertung des Betriebs fehlen der Verantwortliche und Einsatzzweck,
Hosting- und CDN-Dienste samt Protokollen, Empfängern und Löschfristen, die
Rechtsgrundlagen je Verarbeitung sowie die tatsächlichen Verfahren für
Betroffenenrechte und Datenschutzvorfälle. Ob Art. 9 DSGVO einschlägig ist,
hängt davon ab, ob im konkreten Betrieb etwa Gesundheitsdaten verarbeitet
werden. Der Bericht bewertet den geprüften Repository-Stand und den lokalen
Testlauf. Die DSGVO-Konformität des Betriebs bleibt offen.

Rechtsquellen · [DSGVO im Amtsblatt der EU](https://eur-lex.europa.eu/eli/reg/2016/679/oj/deu/pdf)
und [§ 25 TDDDG](https://www.gesetze-im-internet.de/ttdsg/__25.html).
