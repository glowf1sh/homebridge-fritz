# Changelog 

Alle bemerkenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt befolgt [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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