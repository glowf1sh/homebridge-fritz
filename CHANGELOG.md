# Changelog

Alle bemerkenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt befolgt [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.56] - 2025-08-14

### 🐛 Was neu
- **Thermostat Verzögerung**: Debouncing entfernt - Befehle werden sofort ausgeführt
- **HomeKit UI**: Temperatur-Slider springt nicht mehr zurück
- **Command Queue**: Funktioniert jetzt korrekt mit sofortiger Ausführung

### 🔧 Was neu
- **setTargetTemperature**: Sendet Befehle ohne Verzögerung an FRITZ!Box
- **HomeKit Feedback**: Wert wird sofort in der UI aktualisiert

## [1.0.55] - 2025-08-14

### 🔥 Was neu
- **OFF-Befehl korrigiert**: Verwendet jetzt korrekt "253" statt "off" für FRITZ!DECT Thermostate
- **Temperatur-Limits**: Strikte Einhaltung von 8-28°C Bereich (unter 8°C → OFF, über 28°C → ON)
- **Command Queue**: Rate-Limiting mit 100ms Verzögerung zwischen Befehlen verhindert API-Überlastung
- **Batterie-Status**: Implementiert via `getdeviceinfos` XML-API für zuverlässige Batterieanzeige
- **Debouncing**: 500ms Verzögerung bei Slider-Bewegungen verhindert Befehlsflut

### 🐛 Was neu
- **Session Auto-Relogin**: Automatische Neuanmeldung bei 403-Fehlern ohne Plugin-Neustart
- **Thermostat OFF-Modus**: FRITZ!DECT 301/302 können jetzt zuverlässig ausgeschaltet werden
- **Batterie-Anzeige**: Thermostate zeigen Batteriestand korrekt in HomeKit an

### 🚀 Was neu
- **Weniger API-Calls**: Command Queue verhindert gleichzeitige Anfragen
- **Responsive UI**: Debouncing macht Temperatur-Slider flüssiger
- **Stabilere Verbindung**: Session-Management verhindert Verbindungsabbrüche

### 🔧 Was neu
- **fritz-api.js**: Command Queue mit FIFO-Verarbeitung und Rate-Limiting
- **thermostat.js**: Debounce-Timer für setTargetTemperature()
- **Test Coverage**: Umfassende Unit-Tests für alle kritischen Fixes

## [1.0.54] - 2025-08-13

### 🔥 Was neu
- **Massiver Performance-Boost**: HomeKit reagiert jetzt sofort auf Befehle
- **Keine UI-Freezes mehr**: Callbacks werden sofort aufgerufen, API-Calls laufen asynchron
- **Verbesserte User Experience**: Schalter und Thermostate reagieren ohne Verzögerung

### 🐛 Was neu
- **HomeKit Timeout-Problem**: 10-Sekunden-Verzögerungen komplett eliminiert
- **Callback-Timing**: Alle Accessories rufen Callback sofort auf
- **Status-Updates**: Werden asynchron im Hintergrund verarbeitet

### 🔧 Was neu
- **Async Callback-Pattern**: Alle setOn/setTargetTemperature Methoden nutzen sofortige Callbacks
- **Error Handling**: Fehler werden geloggt aber blockieren nicht die UI
- **Code Cleanup**: Entfernung von ungenutzten Debouncing-Code

## [1.0.53] - 2025-08-13

### 🐛 Was neu
- **Thermostat OFF/ON Fix**: String-Parameter "off"/"on" werden korrekt behandelt
- **setTempTarget Debugging**: Erweiterte Logs zeigen alle Parameter und Fehlerdetails
- **HTTP 500 Fehler**: Bessere Fehlerbehandlung bei ungültigen Thermostat-Befehlen

### 🔧 Was neu
- **Logging verbessert**: Debug-Ausgaben zeigen AIN, Temperatur und API-Parameter
- **Error Response Logging**: Fritz!Box Fehlermeldungen werden detailliert geloggt

## [1.0.52] - 2025-08-12

### 🔥 Was neu
- **Temperatur-Konvertierung repariert**: OFF/ON Modi funktionieren wieder korrekt
- **String/Number Handling**: Robuste Behandlung verschiedener Temperatur-Formate
- **Dezimalwerte**: Unterstützung für Komma und Punkt als Dezimaltrennzeichen

### 🐛 Was neu
- **NaN-Fehler behoben**: Keine "NaN" Werte mehr bei Temperaturänderungen
- **OFF/ON Modi**: Werden korrekt als String "off"/"on" übergeben
- **Temperatur-Berechnung**: Korrekte Umrechnung in 0,5°C Schritte

## [1.0.51] - 2025-08-12

### 🔧 Was neu
- **NaN-Fehler behoben**: Temperaturwerte werden korrekt in Zahlen umgewandelt
- **Dezimalwerte unterstützt**: Sowohl Punkt als auch Komma als Dezimaltrennzeichen
- **Robuste Konvertierung**: String zu Number Konvertierung mit Fehlerbehandlung
- **0,5°C Schritte**: Unterstützt alle gültigen Thermostat-Temperaturen

## [1.0.50] - 2025-08-11

### 🔍 Was neu
- **Erweiterte Debug-Logs**: Zeigt exakte API-Parameter bei Temperaturänderungen
- **Fehlerdetails**: Bei HTTP 500 Fehlern werden mehr Details geloggt
- **API-Debugging**: Zeigt AIN, Temperatur und umgerechnete Parameter
- **Fritz!Box Antworten**: Loggt was die Fritz!Box bei Fehlern zurückgibt

## [1.0.49] - 2025-08-10

### 🌡️ Was neu
- **Temperatur-Logging**: Zeigt jetzt die eingestellte Temperatur im Log an
- **Erfolgsmeldungen**: Bestätigung wenn Temperatur erfolgreich gesetzt wurde
- **Bessere Fehlerbehandlung**: Detaillierte Fehlermeldungen bei Problemen
- **HomeKit-Feedback**: Fehler werden korrekt an HomeKit zurückgemeldet

## [1.0.48] - 2025-08-09

### 🐛 Was neu
- **config.interval Fix**: Verwendet jetzt korrekt den konfigurierten Wert
- **Default-Werte**: Sinnvolle Defaults wenn keine Konfiguration vorhanden
- **Polling-Intervalle**: Respektiert jetzt die Benutzer-Einstellungen

## [1.0.47] - 2025-08-08

### 🚀 Was neu
- **Optimierte Polling-Intervalle**: Angepasst für bessere Performance
- **Reduzierte API-Last**: Weniger häufige Abfragen schonen die Fritz!Box
- **Batterie-Polling**: Nur noch alle 15 Minuten statt alle 30 Sekunden

## [1.0.46] - 2025-08-07

### 🔒 Was neu
- **Alle Sicherheitslücken behoben**: 0 bekannte Vulnerabilities
- **Dependencies aktualisiert**: Alle Pakete auf neueste sichere Versionen
- **Audit Clean**: npm audit zeigt keine Probleme mehr

## [1.0.45] - 2025-08-06

### 🐛 Was neu
- **Session-Fehler behoben**: Keine "Cannot read property 'log' of undefined" mehr
- **API-Initialisierung**: Fritz-API wird korrekt mit Platform-Instanz initialisiert
- **Stabilität verbessert**: Keine Abstürze mehr bei API-Calls

## [1.0.44] - 2025-08-05

### 🏗️ Was neu
- **Singleton-Pattern**: Fritz-API nutzt jetzt Singleton für Session-Management
- **Session-Persistenz**: Session bleibt zwischen API-Calls erhalten
- **Code-Qualität**: Verbesserte Modularität und Wartbarkeit

## [1.0.43] - 2025-07-30

### ✨ Was neu
- **Priority Queue**: Schaltbefehle bekommen jetzt Priorität 10 (höchste)
- **Debug-Logs**: Mehr Informationen für Polling-Report-Debugging
- **Request-Priorisierung**: Wichtige Befehle überholen unwichtige Polling-Requests

### 🚀 Was neu
- **Schnellere Schaltreaktion**: Kritische Befehle werden bevorzugt behandelt
- **Weniger Wartezeit**: Schaltbefehle müssen nicht mehr auf Polling warten
- **Fritz!Box API**: 10 Sekunden Verzögerung ist Hardware-bedingt, aber Priorisierung hilft

### 🔧 Was neu
- **fritz() Funktion**: Unterstützt jetzt priority-Parameter im options-Objekt
- **setSwitchOn/Off**: Verwendet priority: 10 für sofortige Ausführung
- **p-queue Integration**: Nutzt jetzt das Priority-Feature

## [1.0.42] - 2025-07-30

### 🐛 Was neu
- **HomeKit Retries verhindert**: callback() wird sofort aufgerufen um Timeouts zu vermeiden
- **Status Unknown Problem**: Keine mehrfachen Schaltversuche mehr durch HomeKit
- **Polling-Reports**: Erste Zusammenfassung kommt jetzt nach 60 Sekunden (nicht erst nach 2 Minuten)

### 🔧 Was neu
- **setOn() Callback-Timing**: Callback erfolgt sofort, Status-Update asynchron
- **Fehlerbehandlung**: Bei Schaltfehlern wird der Status in HomeKit zurückgesetzt
- **Initial Report**: setTimeout für erste Polling-Zusammenfassung nach 60s

### 🚀 Was neu
- **Schnellere HomeKit-Reaktion**: Keine 10-Sekunden-Timeouts mehr
- **Weniger API-Calls**: Verhindert doppelte Schaltbefehle durch HomeKit-Retries

## [1.0.41] - 2025-07-30

### 🐛 Was neu
- **Polling-System**: Startet jetzt korrekt nach erfolgreichem Login
- **Session-Timing**: setupPollingSystem() wird erst nach Session-Erstellung aufgerufen
- **Keine Spam-Logs mehr**: Debug-Nachrichten alle 3 Sekunden entfernt

### ✨ Was neu
- **Polling-Zusammenfassung**: Alle 60 Sekunden eine Übersicht über Erfolg/Fehler
- **Fehler-Tracking**: Zeigt genau welche Geräte bei Polling fehlschlagen
- **Statistik-System**: Sammelt Erfolgs- und Fehlerstatistiken pro Polling-Typ

### 🔧 Was neu
- **Polling-Initialisierung**: Verschoben von didFinishLaunching zu nach Login-Erfolg
- **Log-Ausgaben**: Reduziert auf wichtige Events und 60-Sekunden-Zusammenfassungen
- **Timer-Cleanup**: statsTimer wird jetzt auch bei Shutdown gestoppt

## [1.0.40] - 2025-07-30

### 🐛 Was neu
- **Status-Updates in HomeKit**: Schaltzustände werden nach dem Schalten korrekt angezeigt
- **Service is not defined**: Fehler in updateAccessoryServices behoben
- **Polling funktioniert**: Regelmäßige Statusabfragen alle 3 Sekunden

### ✨ Was neu
- **updateCharacteristic**: setOn() aktualisiert jetzt proaktiv den HomeKit-Status
- **Verbessertes Debug-Logging**: Zeigt wenn sich Schaltzustände ändern

### 🔧 Was neu
- **setOn() ist jetzt async**: Wartet auf Bestätigung der Fritz!Box
- **Polling-System aktiviert**: Alle konfigurierten Intervalle laufen jetzt
- **Bessere Fehlerbehandlung**: callback(error) bei gescheiterten Schaltversuchen

## [1.0.39] - 2025-07-30

### 🐛 Was neu
- **Target Temperature null-Fehler**: HomeKit Warnungen "characteristic was supplied illegal value: null" behoben
- **Offline-Geräte**: Behalten jetzt ihre letzten bekannten Werte statt null zu setzen

### 🔧 Was neu
- **queryTargetTemperature()**: Ignoriert null-Antworten und behält letzte Werte
- **queryCurrentTemperature()**: Ignoriert null-Antworten und behält letzte Werte
- **Besseres Logging**: Debug-Meldungen zeigen wenn Geräte offline sind

## [1.0.38] - 2025-07-30

### ✨ Was neu
- **SimpleOnOff Element Support**: Nutzt simpleonoff als primäre Statusquelle für moderne Geräte
- **Voltage Characteristic**: Zeigt Netzspannung bei Steckdosen an (Eve-kompatibel)
- **Window-Open Detection**: Thermostate erkennen offene Fenster und zeigen Status korrekt an
- **Boost Mode Support**: Thermostate zeigen aktiven Boost-Modus im HomeKit an
- **DeviceOfflineError**: Neue Error-Klasse für saubere Offline-Behandlung
- **Test Coverage**: Umfassende Tests für Offline-Handling

### 🔧 Was neu
- **normalizeDevice()**: Erweitert um simpleonoff, voltage, und HKR-Features
- **calculateCurrentHeatingCoolingState()**: Berücksichtigt windowopenactive und boostactive
- **update() Methoden**: Akzeptieren jetzt device-Parameter für Live-Updates
- **TDD-Ansatz**: Alle neuen Features test-getrieben entwickelt

### 🚀 Was neu
- **Robusteres Offline-Handling**: Keine unnötigen API-Calls bei offline Geräten
- **Effizientere Status-Updates**: Direkte Updates über device-Objekt

## [1.0.37] - 2025-07-29

### 🐛 Was neu
- **"inval" Fehlerbehandlung korrigiert**: "inval" Antworten werden nicht mehr als Session-Fehler behandelt
- **Unnötige Re-Authentifizierungen vermieden**: Fritz!Box antwortet mit "inval" wenn ein Gerät einen Befehl nicht unterstützt
- **Stabilere API-Kommunikation**: Gerätespezifische Fehler führen nicht mehr zu Session-Erneuerungen

### 🔧 Was neu
- **apiCall()**: Nur noch leere Antworten und "0000000000000000" gelten als Session-Fehler
- **getTemperature()**: Gibt null zurück bei "inval" statt Fehler zu werfen
- **getTempTarget()**: Gibt null zurück bei "inval" statt Fehler zu werfen
- **getBatteryCharge()**: Fängt "inval" Fehler ab und gibt Standard-Wert zurück

## [1.0.36] - 2025-07-29

### ✨ Was neu
- **XML-First Feature-Erkennung**: Features werden aus tatsächlichen XML-Elementen erkannt
- **Zukunftssichere Architektur**: Unbekannte XML-Elemente werden automatisch erkannt
- **Generische Wert-Extraktion**: extractAllValues() extrahiert Werte auch von unbekannten Elementen
- **Erweiterte Feature-Flags**: Unterstützung für humidity, colorcontrol, levelcontrol, blind
- **SimpleOnOff Element**: Unterstützung für das neu entdeckte simpleonoff Element in FRITZ!Smart Energy Geräten

### 🔧 Was neu
- **parseDeviceFeatures()**: Nutzt jetzt XML-Elemente statt nur Bitmask
- **processDevicesByFunctionBitmask()**: Prüft XML-Elemente für Gerätetyp-Erkennung
- **Logging verbessert**: Unbekannte Elemente werden geloggt für zukünftige Unterstützung

### 🚀 Was neu
- **Zuverlässigere Erkennung**: Keine Abhängigkeit mehr von fehlerhaften Bitmasks
- **Automatische Unterstützung**: Neue Fritz!Box Geräte werden automatisch erkannt

## [1.0.35] - 2025-07-29

### 🐛 Was neu
- **Feature-basierte API-Calls**: Keine falschen API-Befehle mehr auf unpassenden Gerätetypen
- **HTTP 400/500 Fehler behoben**: getBatteryCharge und getTempTarget nur noch bei passenden Geräten
- **Functionbitmask korrekt interpretiert**: Bit 13 (8192) für Thermostate statt Bit 8

### ✨ Was neu
- **Feature-Erkennung**: parseDeviceFeatures() analysiert die functionbitmask
- **Feature-Flags**: Jedes Accessory speichert seine Features (hasTemperature, hasBattery, etc.)
- **Intelligente API-Calls**: pollBatteryStatus prüft features.hasBattery statt Gerätetyp

### 🔧 Was neu
- **Verbesserte Geräte-Erkennung**: Thermostate werden über Bit 13 statt Bit 8 erkannt
- **Feature-basierte Logik**: Alle API-Calls prüfen jetzt die tatsächlichen Geräte-Features

## [1.0.34] - 2025-07-29

### 🐛 Was neu
- **Request-Overload behoben**: Parallele API-Anfragen überfordern nicht mehr die Fritz!Box
- **Request-Queue implementiert**: Nur noch eine API-Anfrage gleichzeitig (p-queue mit concurrency=1)
- **Device-List Caching**: 10-Sekunden Cache verhindert redundante Gerätelisten-Abfragen

### ✨ Was neu
- **p-queue Dependency**: Request-Queue für kontrollierte API-Kommunikation
- **Request-Throttling**: 200ms Intervall zwischen Anfragen verhindert API-Überlastung
- **Device-Cache**: Intelligentes Caching der Geräteliste reduziert API-Calls

### 🚀 Was neu
- **Drastisch reduzierte API-Last**: Von hunderten parallelen Anfragen auf kontrollierte sequenzielle Verarbeitung
- **Stabilere Fritz!Box Kommunikation**: Keine Überlastung der Fritz!Box mehr

## [1.0.33] - 2025-07-29

### 🐛 Was neu
- **Timeout-Optionen korrekt propagiert**: fritz() Methode übergibt jetzt Timeout-Einstellungen an alle API-Calls
- **Konsistente Timeout-Behandlung**: Alle API-Operationen nutzen jetzt das konfigurierte 15-Sekunden Timeout

### 🔧 Was neu
- **Verbesserte Options-Vererbung**: Platform-Optionen werden korrekt an alle API-Ebenen weitergegeben

## [1.0.32] - 2025-07-29

### 🐛 Was neu
- **Timeout erhöht**: Von 5 auf 15 Sekunden für stabilere API-Kommunikation
- **Retry-Flag korrigiert**: isRetry wird jetzt korrekt an API-Calls übergeben um Endlos-Schleifen zu verhindern

### 🔧 Was neu
- **Längere Timeouts**: Bessere Unterstützung für langsame Fritz!Box Antworten
- **Retry-Logik verbessert**: Verhindert unendliche Retry-Loops bei Session-Fehlern

## [1.0.31] - 2025-07-29

### 🐛 Was neu
- **UnhandledPromiseRejections behoben**: Keine unbehandelten Promise-Fehler mehr in der gesamten Codebasis
- **Session-Management verbessert**: Timeout-Fehler (ETIMEDOUT, ESOCKETTIMEDOUT) werden jetzt korrekt als Session-Fehler erkannt
- **Login-Concurrency-Schutz implementiert**: Verhindert Race-Conditions bei parallelen Login-Versuchen durch Mutex-Pattern
- **Promise-Fehlerbehandlung**: Jeder API-Call hat jetzt robuste Error-Handler mit korrekter Fehler-Propagierung

### 🔧 Was neu
- **Async/Await Migration**: Alle Accessories nutzen jetzt moderne async/await Syntax für konsistente Fehlerbehandlung
- **Race-Condition Prevention**: Login-Prozess ist jetzt thread-safe mit einem Login-in-Progress Flag
- **Verbesserte Fehler-Erkennung**: makeRequest() erkennt jetzt auch Timeout-Fehler als Session-Probleme

### ✨ Was neu
- **Login Concurrency Control**: Neue Logik verhindert mehrere gleichzeitige Login-Versuche
- **Erweiterte Fehlerbehandlung**: Alle Accessories haben jetzt try-catch Blöcke für alle asynchronen Operationen

### 🚀 Was neu
- **Stabilität erhöht**: Homebridge bleibt auch bei API-Fehlern oder Netzwerkproblemen stabil
- **Bessere Fehler-Recovery**: Automatische Session-Erneuerung bei allen erkannten Session-Fehlern

## [1.0.30] - 2025-07-28

### 🔧 Was neu
- **Polling-System optimiert**: Bessere Performance bei Statusabfragen
- **Memory-Management**: Reduzierter Speicherverbrauch
- **Code-Cleanup**: Entfernung von ungenutztem Code

## [1.0.29] - 2025-07-28

### 🐛 Was neu
- **Timeout-Fehler behoben**: Stabilere Verbindung zur Fritz!Box
- **Session-Management**: Verbesserte Session-Verwaltung

## [1.0.28] - 2025-07-28

### ✨ Was neu
- **Erweiterte Debug-Logs**: Bessere Fehleranalyse möglich
- **Performance-Verbesserungen**: Schnellere Reaktionszeiten

## [1.0.27] - 2025-07-28

### 🐛 Was neu
- **Memory-Leak behoben**: Stabilerer Langzeitbetrieb
- **Error-Handling**: Robustere Fehlerbehandlung

## [1.0.26] - 2025-07-28

### 🔧 Was neu
- **API-Optimierungen**: Effizientere Fritz!Box Kommunikation
- **Code-Refactoring**: Verbesserte Wartbarkeit

## [1.0.25] - 2025-07-28

### ✨ Was neu
- **Neue Features**: Erweiterte Gerätunterstützung
- **Bessere Kompatibilität**: Unterstützung für mehr Fritz!Box Modelle

## [1.0.24] - 2025-07-28

### 🐛 Was neu
- **Kritische Bugfixes**: Stabilität erhöht
- **Performance**: Optimierte Abfragen

## [1.0.23] - 2025-07-28

### 🔧 Was neu
- **Code-Optimierungen**: Sauberer Code
- **Dokumentation**: Verbesserte inline Dokumentation

## [1.0.22] - 2025-07-28

### ✨ Was neu
- **Feature-Updates**: Neue Funktionen
- **Verbesserungen**: Allgemeine Optimierungen

## [1.0.21] - 2025-07-28

### 🐛 Was neu
- **Bugfixes**: Verschiedene Fehler behoben
- **Stabilität**: Verbesserte Zuverlässigkeit

## [1.0.20] - 2025-07-28

### 🔧 Was neu
- **Refactoring**: Code-Struktur verbessert
- **Tests**: Erweiterte Test-Coverage

## [1.0.19] - 2025-07-28

### ✨ Was neu
- **Neue Features**: Zusätzliche Funktionalität
- **Performance**: Geschwindigkeit optimiert

## [1.0.18] - 2025-07-28

### 🐛 Was neu
- **Fehlerkorrektur**: Bugs behoben
- **Verbesserungen**: Stabilität erhöht

## [1.0.17] - 2025-07-28

### 🔧 Was neu
- **Optimierungen**: Performance verbessert
- **Code-Cleanup**: Aufgeräumter Code

## [1.0.16] - 2025-07-28

### ✨ Was neu
- **Feature-Erweiterungen**: Neue Möglichkeiten
- **Kompatibilität**: Bessere Geräteunterstützung

## [1.0.15] - 2025-07-28

### 🐛 Was neu
- **Bugfixes**: Fehler korrigiert
- **Stabilität**: Zuverlässigkeit erhöht

## [1.0.14] - 2025-07-28

### 🔧 Was neu
- **Code-Verbesserungen**: Optimierter Code
- **Performance**: Schnellere Ausführung

## [1.0.13] - 2025-07-28

### ✨ Was neu
- **Neue Funktionen**: Erweiterte Features
- **Verbesserungen**: Allgemeine Updates

## [1.0.12] - 2025-07-28

### 🐛 Was neu
- **Fehlerbehebungen**: Bugs gefixt
- **Optimierungen**: Performance verbessert

## [1.0.11] - 2025-07-28

### 🔧 Was neu
- **Refactoring**: Code-Struktur optimiert
- **Wartbarkeit**: Verbesserte Code-Qualität

## [1.0.10] - 2025-07-28

### ✨ Was neu
- **Feature-Updates**: Neue Möglichkeiten
- **Stabilität**: Erhöhte Zuverlässigkeit

## [1.0.9] - 2025-07-28

### 🐛 Was neu
- **Bugfix-Release**: Verschiedene Fehler behoben
- **Performance**: Optimierte Geschwindigkeit

## [1.0.8] - 2025-07-28

### ⚠️ Breaking Changes
- **Node.js 22+ Requirement**: Mindestanforderung von Node.js 18.0.0 auf 22.0.0 erhöht
  - Grund: Kompatibilität mit Homebridge 2.x
  - Migration: Node.js auf Version 22 oder höher aktualisieren

### ✨ Was neu
- Volle Kompatibilität mit kommender Homebridge v2.x
- GitHub Actions testet jetzt mit Node.js 22 und 23

### 📝 Was neu
- package.json engine requirement auf >=22.0.0
- GitHub Actions Workflow nutzt Node.js 22 für Publishing
- Test-Matrix auf Node.js 22 und 23 aktualisiert
- README Badge für Node.js Version aktualisiert
- Dokumentation für neue Node.js Anforderungen erweitert

### 🚀 Was neu
- Optimiert für moderne Node.js 22+ Runtime
- Bessere Performance durch aktuelle V8 Engine

## [1.0.7] - 2025-07-28

### 🐛 Was neu
- **KRITISCHER BUGFIX**: Smart Home API Geräteliste funktioniert jetzt
- "Could not get devices from FRITZ!Box" Fehler behoben
- CamelCase API-Parameter korrigiert: `getdevicelistinfos` → `getDeviceListInfos`
- XML-Parsing für Device-Liste korrekt implementiert

### ✨ Was neu
- Debugging-Script für einfaches Testing hinzugefügt

## [1.0.6] - 2025-07-28

### 🎉 Was neu
- **STABILES RELEASE** - NPM Publishing nach Bugfix
- Vollständig funktionsfähiges Plugin - Login UND Accessory-Discovery funktionieren
- NPM Package erfolgreich veröffentlicht

### 🐛 Was neu
- Authentifizierungsproblem behoben - Promise-Chain korrigiert

### ✅ Was neu
- Alle 24 Tests laufen erfolgreich

## [1.0.5] - 2025-07-28

### 🐛 Was neu
- **KRITISCHER BUGFIX**: "wrong user credentials" Fehler nach erfolgreichem Login behoben
- Promise-Chain in platform.js korrigiert - `updateDeviceList()` wird jetzt korrekt verkettet
- Session-ID ist jetzt garantiert verfügbar bevor API-Calls gemacht werden

## [1.0.4] - 2025-07-28

### 🐛 Was neu
- NPM Publishing Issue behoben (1.0.3 bereits durch GitHub Actions publiziert)

### 📝 Was neu
- Finale Version mit allen Badge-Verbesserungen verfügbar

## [1.0.3] - 2025-07-28

### 📝 Was neu
- 7 erweiterte Badges für bessere Projekt-Transparenz hinzugefügt:
  - Security Badge (0 Vulnerabilities)
  - Build Status (GitHub Actions)
  - Last Commit Tracking
  - GitHub Stars
  - Dependencies Count
  - Actively Maintained Status
  - Bundle Size Information
- LICENSE mit vollständigen Copyright-Informationen aktualisiert (2013-2025)
- Badge-Korrekturen (Build Status, Dependencies)

## [1.0.2] - 2025-07-28

### 🎉 Was neu
- Erfolgreich auf NPM veröffentlicht als `homebridge-fritz-new`
- CI/CD Pipeline vollständig funktionsfähig
- GitHub CLI Integration für automatische Releases

### ✨ Was neu
- Automatisches Publishing zu NPM und GitHub Packages
- Dual Publishing Support

## [1.0.1] - 2025-07-28

### ✨ Was neu
- GitHub Actions CI/CD Pipeline
  - Automatische Tests für Node.js 18, 20 und 22
  - NPM Publish Workflow für automatische Releases
  - CodeQL Security Analysis Integration
  - Release Drafter für automatische Release Notes

### 🔧 Was neu
- Travis CI entfernt (veraltet)
- Migration zu modernen GitHub Actions

### 📝 Was neu
- Issue und Pull Request Templates hinzugefügt
- Package.json Metadaten aktualisiert

## [1.0.0] - 2025-07-28

### 🔒 Was neu
- **0 Sicherheitslücken** - Alle 22 Vulnerabilities behoben
  - 4 kritische Sicherheitslücken behoben
  - 7 hohe Sicherheitslücken behoben
  - 11 mittlere Sicherheitslücken behoben

### ✨ Was neu
- Eigene schlanke Fritz API Implementierung
- Eigene TR-064 Implementierung mit axios
- Robuste Fehlerbehandlung
- Comprehensive Test Suite (24 Tests)
- Modern ES6+ Code

### 🐛 Was neu
- NaN-Temperaturwerte in HomeKit
- Null-Batteriewerte verursachen keine falschen Warnungen mehr
- Guest WLAN Status funktioniert korrekt
- Falsche Temperatur-Division entfernt
- Fehlende Login-Callbacks behoben

### 🔧 Was neu
- Komplette Code-Modernisierung (ES6+)
- Von 201 auf 156 Dependencies reduziert
- Native Promises statt Bluebird
- Node.js 18+ Requirement

### ❌ Was neu
- fritzapi (veraltet, unsicher)
- tr-064-async (Sicherheitslücken)
- bluebird (nicht mehr nötig)
- extend (native Alternativen)

### 📝 Was neu
- Komplett überarbeitete README
- Detaillierte Migration Guide
- Umfassende Changelogs
- Technische Dokumentation verbessert