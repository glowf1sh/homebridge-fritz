# Changelog

Alle bemerkenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt befolgt [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.39] - 2025-07-30

### 🐛 Fixed
- **Target Temperature null-Fehler**: HomeKit Warnungen "characteristic was supplied illegal value: null" behoben
- **Offline-Geräte**: Behalten jetzt ihre letzten bekannten Werte statt null zu setzen

### 🔧 Changed
- **queryTargetTemperature()**: Ignoriert null-Antworten und behält letzte Werte
- **queryCurrentTemperature()**: Ignoriert null-Antworten und behält letzte Werte
- **Besseres Logging**: Debug-Meldungen zeigen wenn Geräte offline sind

## [1.0.38] - 2025-07-30

### ✨ Added
- **SimpleOnOff Element Support**: Nutzt simpleonoff als primäre Statusquelle für moderne Geräte
- **Voltage Characteristic**: Zeigt Netzspannung bei Steckdosen an (Eve-kompatibel)
- **Window-Open Detection**: Thermostate erkennen offene Fenster und zeigen Status korrekt an
- **Boost Mode Support**: Thermostate zeigen aktiven Boost-Modus im HomeKit an
- **DeviceOfflineError**: Neue Error-Klasse für saubere Offline-Behandlung
- **Test Coverage**: Umfassende Tests für Offline-Handling

### 🔧 Changed
- **normalizeDevice()**: Erweitert um simpleonoff, voltage, und HKR-Features
- **calculateCurrentHeatingCoolingState()**: Berücksichtigt windowopenactive und boostactive
- **update() Methoden**: Akzeptieren jetzt device-Parameter für Live-Updates
- **TDD-Ansatz**: Alle neuen Features test-getrieben entwickelt

### 🚀 Performance
- **Robusteres Offline-Handling**: Keine unnötigen API-Calls bei offline Geräten
- **Effizientere Status-Updates**: Direkte Updates über device-Objekt

## [1.0.37] - 2025-07-29

### 🐛 Fixed
- **"inval" Fehlerbehandlung korrigiert**: "inval" Antworten werden nicht mehr als Session-Fehler behandelt
- **Unnötige Re-Authentifizierungen vermieden**: Fritz!Box antwortet mit "inval" wenn ein Gerät einen Befehl nicht unterstützt
- **Stabilere API-Kommunikation**: Gerätespezifische Fehler führen nicht mehr zu Session-Erneuerungen

### 🔧 Changed
- **apiCall()**: Nur noch leere Antworten und "0000000000000000" gelten als Session-Fehler
- **getTemperature()**: Gibt null zurück bei "inval" statt Fehler zu werfen
- **getTempTarget()**: Gibt null zurück bei "inval" statt Fehler zu werfen
- **getBatteryCharge()**: Fängt "inval" Fehler ab und gibt Standard-Wert zurück

## [1.0.36] - 2025-07-29

### ✨ Added
- **XML-First Feature-Erkennung**: Features werden aus tatsächlichen XML-Elementen erkannt
- **Zukunftssichere Architektur**: Unbekannte XML-Elemente werden automatisch erkannt
- **Generische Wert-Extraktion**: extractAllValues() extrahiert Werte auch von unbekannten Elementen
- **Erweiterte Feature-Flags**: Unterstützung für humidity, colorcontrol, levelcontrol, blind
- **SimpleOnOff Element**: Unterstützung für das neu entdeckte simpleonoff Element in FRITZ!Smart Energy Geräten

### 🔧 Changed
- **parseDeviceFeatures()**: Nutzt jetzt XML-Elemente statt nur Bitmask
- **processDevicesByFunctionBitmask()**: Prüft XML-Elemente für Gerätetyp-Erkennung
- **Logging verbessert**: Unbekannte Elemente werden geloggt für zukünftige Unterstützung

### 🚀 Performance
- **Zuverlässigere Erkennung**: Keine Abhängigkeit mehr von fehlerhaften Bitmasks
- **Automatische Unterstützung**: Neue Fritz!Box Geräte werden automatisch erkannt

## [1.0.35] - 2025-07-29

### 🐛 Fixed
- **Feature-basierte API-Calls**: Keine falschen API-Befehle mehr auf unpassenden Gerätetypen
- **HTTP 400/500 Fehler behoben**: getBatteryCharge und getTempTarget nur noch bei passenden Geräten
- **Functionbitmask korrekt interpretiert**: Bit 13 (8192) für Thermostate statt Bit 8

### ✨ Added
- **Feature-Erkennung**: parseDeviceFeatures() analysiert die functionbitmask
- **Feature-Flags**: Jedes Accessory speichert seine Features (hasTemperature, hasBattery, etc.)
- **Intelligente API-Calls**: pollBatteryStatus prüft features.hasBattery statt Gerätetyp

### 🔧 Changed
- **Verbesserte Geräte-Erkennung**: Thermostate werden über Bit 13 statt Bit 8 erkannt
- **Feature-basierte Logik**: Alle API-Calls prüfen jetzt die tatsächlichen Geräte-Features

## [1.0.34] - 2025-07-29

### 🐛 Fixed
- **Request-Overload behoben**: Parallele API-Anfragen überfordern nicht mehr die Fritz!Box
- **Request-Queue implementiert**: Nur noch eine API-Anfrage gleichzeitig (p-queue mit concurrency=1)
- **Device-List Caching**: 10-Sekunden Cache verhindert redundante Gerätelisten-Abfragen

### ✨ Added
- **p-queue Dependency**: Request-Queue für kontrollierte API-Kommunikation
- **Request-Throttling**: 200ms Intervall zwischen Anfragen verhindert API-Überlastung
- **Device-Cache**: Intelligentes Caching der Geräteliste reduziert API-Calls

### 🚀 Performance
- **Drastisch reduzierte API-Last**: Von hunderten parallelen Anfragen auf kontrollierte sequenzielle Verarbeitung
- **Stabilere Fritz!Box Kommunikation**: Keine Überlastung der Fritz!Box mehr

## [1.0.33] - 2025-07-29

### 🐛 Fixed
- **Timeout-Optionen korrekt propagiert**: fritz() Methode übergibt jetzt Timeout-Einstellungen an alle API-Calls
- **Konsistente Timeout-Behandlung**: Alle API-Operationen nutzen jetzt das konfigurierte 15-Sekunden Timeout

### 🔧 Changed
- **Verbesserte Options-Vererbung**: Platform-Optionen werden korrekt an alle API-Ebenen weitergegeben

## [1.0.32] - 2025-07-29

### 🐛 Fixed
- **Timeout erhöht**: Von 5 auf 15 Sekunden für stabilere API-Kommunikation
- **Retry-Flag korrigiert**: isRetry wird jetzt korrekt an API-Calls übergeben um Endlos-Schleifen zu verhindern

### 🔧 Changed
- **Längere Timeouts**: Bessere Unterstützung für langsame Fritz!Box Antworten
- **Retry-Logik verbessert**: Verhindert unendliche Retry-Loops bei Session-Fehlern

## [1.0.31] - 2025-07-29

### 🐛 Fixed
- **UnhandledPromiseRejections behoben**: Keine unbehandelten Promise-Fehler mehr in der gesamten Codebasis
- **Session-Management verbessert**: Timeout-Fehler (ETIMEDOUT, ESOCKETTIMEDOUT) werden jetzt korrekt als Session-Fehler erkannt
- **Login-Concurrency-Schutz implementiert**: Verhindert Race-Conditions bei parallelen Login-Versuchen durch Mutex-Pattern
- **Promise-Fehlerbehandlung**: Jeder API-Call hat jetzt robuste Error-Handler mit korrekter Fehler-Propagierung

### 🔧 Changed
- **Async/Await Migration**: Alle Accessories nutzen jetzt moderne async/await Syntax für konsistente Fehlerbehandlung
- **Race-Condition Prevention**: Login-Prozess ist jetzt thread-safe mit einem Login-in-Progress Flag
- **Verbesserte Fehler-Erkennung**: makeRequest() erkennt jetzt auch Timeout-Fehler als Session-Probleme

### ✨ Added
- **Login Concurrency Control**: Neue Logik verhindert mehrere gleichzeitige Login-Versuche
- **Erweiterte Fehlerbehandlung**: Alle Accessories haben jetzt try-catch Blöcke für alle asynchronen Operationen

### 🚀 Performance
- **Stabilität erhöht**: Homebridge bleibt auch bei API-Fehlern oder Netzwerkproblemen stabil
- **Bessere Fehler-Recovery**: Automatische Session-Erneuerung bei allen erkannten Session-Fehlern

## [1.0.8] - 2025-07-28

### ⚠️ Breaking Changes
- **Node.js 22+ Requirement**: Mindestanforderung von Node.js 18.0.0 auf 22.0.0 erhöht
  - Grund: Kompatibilität mit Homebridge 2.x
  - Migration: Node.js auf Version 22 oder höher aktualisieren

### ✨ Added
- Volle Kompatibilität mit kommender Homebridge v2.x
- GitHub Actions testet jetzt mit Node.js 22 und 23

### 📝 Changed
- package.json engine requirement auf >=22.0.0
- GitHub Actions Workflow nutzt Node.js 22 für Publishing
- Test-Matrix auf Node.js 22 und 23 aktualisiert
- README Badge für Node.js Version aktualisiert
- Dokumentation für neue Node.js Anforderungen erweitert

### 🚀 Performance
- Optimiert für moderne Node.js 22+ Runtime
- Bessere Performance durch aktuelle V8 Engine

## [1.0.7] - 2025-07-28

### 🐛 Fixed
- **KRITISCHER BUGFIX**: Smart Home API Geräteliste funktioniert jetzt
- "Could not get devices from FRITZ!Box" Fehler behoben
- CamelCase API-Parameter korrigiert: `getdevicelistinfos` → `getDeviceListInfos`
- XML-Parsing für Device-Liste korrekt implementiert

### ✨ Added
- Debugging-Script für einfaches Testing hinzugefügt

## [1.0.6] - 2025-07-28

### 🎉 Released
- **STABILES RELEASE** - NPM Publishing nach Bugfix
- Vollständig funktionsfähiges Plugin - Login UND Accessory-Discovery funktionieren
- NPM Package erfolgreich veröffentlicht

### 🐛 Fixed
- Authentifizierungsproblem behoben - Promise-Chain korrigiert

### ✅ Testing
- Alle 24 Tests laufen erfolgreich

## [1.0.5] - 2025-07-28

### 🐛 Fixed
- **KRITISCHER BUGFIX**: "wrong user credentials" Fehler nach erfolgreichem Login behoben
- Promise-Chain in platform.js korrigiert - `updateDeviceList()` wird jetzt korrekt verkettet
- Session-ID ist jetzt garantiert verfügbar bevor API-Calls gemacht werden

## [1.0.4] - 2025-07-28

### 🐛 Fixed
- NPM Publishing Issue behoben (1.0.3 bereits durch GitHub Actions publiziert)

### 📝 Documentation
- Finale Version mit allen Badge-Verbesserungen verfügbar

## [1.0.3] - 2025-07-28

### 📝 Documentation
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

### 🎉 Released
- Erfolgreich auf NPM veröffentlicht als `homebridge-fritz-new`
- CI/CD Pipeline vollständig funktionsfähig
- GitHub CLI Integration für automatische Releases

### ✨ Added
- Automatisches Publishing zu NPM und GitHub Packages
- Dual Publishing Support

## [1.0.1] - 2025-07-28

### ✨ Added
- GitHub Actions CI/CD Pipeline
  - Automatische Tests für Node.js 18, 20 und 22
  - NPM Publish Workflow für automatische Releases
  - CodeQL Security Analysis Integration
  - Release Drafter für automatische Release Notes

### 🔧 Changed
- Travis CI entfernt (veraltet)
- Migration zu modernen GitHub Actions

### 📝 Documentation
- Issue und Pull Request Templates hinzugefügt
- Package.json Metadaten aktualisiert

## [1.0.0] - 2025-07-28

### 🔒 Security
- **0 Sicherheitslücken** - Alle 22 Vulnerabilities behoben
  - 4 kritische Sicherheitslücken behoben
  - 7 hohe Sicherheitslücken behoben
  - 11 mittlere Sicherheitslücken behoben

### ✨ Added
- Eigene schlanke Fritz API Implementierung
- Eigene TR-064 Implementierung mit axios
- Robuste Fehlerbehandlung
- Comprehensive Test Suite (24 Tests)
- Modern ES6+ Code

### 🐛 Fixed
- NaN-Temperaturwerte in HomeKit
- Null-Batteriewerte verursachen keine falschen Warnungen mehr
- Guest WLAN Status funktioniert korrekt
- Falsche Temperatur-Division entfernt
- Fehlende Login-Callbacks behoben

### 🔧 Changed
- Komplette Code-Modernisierung (ES6+)
- Von 201 auf 156 Dependencies reduziert
- Native Promises statt Bluebird
- Node.js 18+ Requirement

### ❌ Removed
- fritzapi (veraltet, unsicher)
- tr-064-async (Sicherheitslücken)
- bluebird (nicht mehr nötig)
- extend (native Alternativen)

### 📝 Documentation
- Komplett überarbeitete README
- Detaillierte Migration Guide
- Umfassende Changelogs
- Technische Dokumentation verbessert