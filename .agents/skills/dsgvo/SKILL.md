---
name: dsgvo
description: Prüft den Habit Tracker auf technische DSGVO- und TDDDG-Anforderungen, dokumentiert belegte Datenschutzlücken und benennt offene Nachweise des Betreibers.
---

# Datenschutzprüfung des Habit Trackers

1. Lies den [DSGVO-Prüfleitfaden](../../../docs/DSGVO.md) und das
   [Sicherheitsmodell](../../../SECURITY.md). Prüfe standardmäßig das gesamte
   Repo. Wenn die Anfrage einen konkreten Diff oder ein Feature nennt, prüfe
   dessen Auswirkungen entlang aller betroffenen Datenflüsse.
2. Verfolge die Datenflüsse vom Eingabefeld über Persistenz bis zu Ausgabe,
   Weitergabe und Löschung. Gleiche Dokumentation mit Code, Konfiguration und
   Tests ab. Untersuche Netzverkehr und Endgerätezugriffe, falls die App lokal
   ausgeführt werden kann. Teste Export, Löschung und Verhalten in mehreren Tabs
   mit synthetischen Daten in einem frischen Browserprofil. Kennzeichne,
   wo die Prüfung auf Codelektüre beschränkt blieb.
3. Ordne die Befunde den einschlägigen Anforderungen zu und verifiziere die
   Rechtsquellen. Prüfe insbesondere, was die App selbst verarbeitet und
   welche Daten bei Hosting, externen Diensten oder einer Handlung der
   Nutzenden anfallen. Leite aus der lokalen Speicherung weder die
   Anwendbarkeit noch die Erfüllung aller Pflichten ab. Führe fehlende
   Betreiberangaben als offene Nachweise auf.
4. Gib den Bericht standardmäßig im Chat aus. Nenne Prüfstand und Umfang,
   geprüfte Datenflüsse, Befunde nach Priorität und offene Betreiberfragen.
   Nenne pro Befund Anforderung, Beleg mit Dateipfad und Zeile oder
   Testbeobachtung, Auswirkung und konkreten nächsten Schritt. Weise je
   Prüfpunkt aus, ob er belegt erfüllt, lückenhaft, offen oder begründet
   nicht anwendbar ist. Begrenze das Fazit auf den belegten Prüfumfang.

Bei einer reinen Prüfung dokumentierst du mögliche Korrekturen im Bericht.
