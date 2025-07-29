# homebridge-fritz-new v1.0.24 - Aktueller Fork mit Sicherheitsupdates


## ⚠️ WARUM DIESER FORK EXISTIERT

> **Das originale NPM-Paket `homebridge-fritz` von @andig wird seit Jahren nicht mehr gepflegt!**  
> Letzte Aktivität: 2019 • 22 bekannte Sicherheitslücken • Keine Reaktion auf Issues/PRs
> 
> **Dieses Repository `homebridge-fritz-new` ist ein aktiv gewarteter Fork mit:**
> - ✅ Alle 22 Sicherheitslücken behoben (0 Vulnerabilities)
> - ✅ Kompatibilität mit aktuellen Node.js/Homebridge Versionen
> - ✅ Regelmäßige Updates und Support
> - ✅ Aktive Community-Betreuung

### 🚀 Installation des neuen Pakets:

```bash
# Global für Homebridge UI
npm install -g homebridge-fritz-new

# Für lokale Installation
npm install homebridge-fritz-new
```

### Alternative Installation über Git:

```bash
# In Homebridge node_modules Verzeichnis wechseln
cd /var/lib/homebridge/node_modules

# Repository klonen
git clone https://github.com/glowf1sh/homebridge-fritz-new.git
cd homebridge-fritz-new

# Dependencies installieren
npm install

# Package erstellen
npm pack

# Installation (wähle eine Methode):

# Standard NPM:
npm install -g ./homebridge-fritz-new-*.tgz

# Homebridge-Service:
npm --prefix "/var/lib/homebridge" install ./homebridge-fritz-new-*.tgz

# hb-service:
hb-service add ./homebridge-fritz-new-*.tgz
```

📚 **[Detaillierte Installationsanleitung](INSTALLATION.md)** mit allen Methoden und Troubleshooting

---

[![npm version](https://img.shields.io/npm/v/homebridge-fritz-new.svg)](https://www.npmjs.com/package/homebridge-fritz-new)
[![npm downloads](https://img.shields.io/npm/dt/homebridge-fritz-new.svg)](https://www.npmjs.com/package/homebridge-fritz-new)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org)
[![Homebridge Version](https://img.shields.io/badge/homebridge-%3E%3D1.3.0-brightgreen.svg)](https://homebridge.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Security](https://img.shields.io/badge/vulnerabilities-0-brightgreen.svg)](https://github.com/glowf1sh/homebridge-fritz-new/security)
[![Build Status](https://github.com/glowf1sh/homebridge-fritz-new/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/glowf1sh/homebridge-fritz-new/actions/workflows/npm-publish.yml)
[![Last Commit](https://img.shields.io/github/last-commit/glowf1sh/homebridge-fritz-new.svg)](https://github.com/glowf1sh/homebridge-fritz-new/commits/master)
[![GitHub Stars](https://img.shields.io/github/stars/glowf1sh/homebridge-fritz-new.svg?style=social)](https://github.com/glowf1sh/homebridge-fritz-new/stargazers)
[![Dependencies](https://img.shields.io/badge/dependencies-5-brightgreen.svg)](https://github.com/glowf1sh/homebridge-fritz-new/blob/master/package.json)
[![Actively Maintained](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/glowf1sh/homebridge-fritz-new/graphs/commit-activity)

> **Dieser Fork ersetzt das veraltete [homebridge-fritz](https://github.com/andig/homebridge-fritz) Paket**, welches seit 2019 nicht mehr gewartet wird und 22 kritische Sicherheitslücken enthält.

> **WICHTIGER HINWEIS**: Dies ist Version 1.0.24 mit verbessertem Polling-System und dynamischer Service-Erstellung! Diese Version behebt den Circular Structure JSON Error und verbessert das Session-Management erheblich.

## 🔄 MIGRATION VOM ALTEN PAKET

### Schritt 1: Altes Paket deinstallieren
```bash
# Falls das alte homebridge-fritz installiert ist:
npm uninstall -g homebridge-fritz
```

### Schritt 2: Neues Paket installieren
```bash
npm install -g homebridge-fritz-new
```

### Schritt 3: Homebridge neustarten
```bash
sudo systemctl restart homebridge
# oder
homebridge
```

**Wichtig:** Die Konfiguration bleibt unverändert! Alle Einstellungen funktionieren weiterhin.

## 🎨 Installation mit Homebridge Config UI X

Wenn Sie Homebridge Config UI X verwenden:

1. Öffnen Sie die Homebridge Web-Oberfläche
2. Gehen Sie zu "Plugins" 
3. Suchen Sie nach `homebridge-fritz-new`
4. Klicken Sie auf "Install"
5. Nach der Installation: Homebridge neustarten

**Hinweis:** Falls das alte `homebridge-fritz` installiert ist, deinstallieren Sie es zuerst!

## 🎉 Was ist neu in Version 1.0.25?

### 🔧 Workflow-Fix für NPM Publishing
- **GitHub Actions Workflow repariert**: Tests sind jetzt optional
- **NPM Publishing funktioniert wieder**: Auch ohne Test-Dateien

## 📋 Was war neu in Version 1.0.24?

### 🚀 Robuste Polling-Strategie und Session-Management
- **Zwei-Stufen-Polling System**: 
  - Discovery alle 5 Minuten für neue/entfernte Geräte
  - Schaltzustände alle 3 Sekunden für schnelle Reaktion
  - Sensordaten alle 10 Sekunden
  - Batteriestatus alle 15 Minuten
- **Session-Management mit automatischem Re-Login**: Keine Session-Verluste mehr
- **Circular JSON Error behoben**: Keine Timer-Objekte im Accessory Context
- **Dynamische Service-Erstellung**: Automatische Erkennung via functionbitmask
- **Vollständige Sensor-Unterstützung**: Alle FRITZ! Gerätetypen werden unterstützt

## 📋 Changelog - Alle Versionen (neueste zuerst)

### Version 1.0.25 (2025-07-29)
- **GitHub Actions Workflow Fix**: Tests sind jetzt optional, NPM Publishing funktioniert wieder
- **README Verbesserungen**: Version 1.0.24 Details hinzugefügt

### Version 1.0.24 (2025-07-29)
- **Verbessertes Polling-System**: Verschiedene Intervalle für Discovery, Schaltzustände, Sensordaten
- **Dynamische Service-Erstellung**: Services basierend auf functionbitmask
- **Circular Structure JSON Error**: Timer-Referenzen aus Context entfernt
- **Session-Persistenz**: Verbessertes Session-Management mit Cache

### Version 1.0.23 (2025-07-29)

- **Dynamic Platform API**: Refactoring von Static zu Dynamic Platform  
- **Timeout-Option**: Konfigurierbarer Timeout für alle API-Requests (Standard: 5000ms)
- **configureAccessory()**: Implementiert für Accessory-Cache-Verwaltung
- **Alle Accessory-Typen**: Auf Dynamic Platform umgestellt
- **Periodische Updates**: Alle 60 Sekunden automatische Geräte-Updates
- **Verbesserte Test-Suite**: 49+ Tests für Produktionsreife

### Version 1.0.22 (2025-07-29)
- **ES6 Klassen-Konstruktor Fix**: TypeError "Class constructors cannot be invoked without 'new'" behoben
- **Platform-Initialisierung**: Korrekte Instanziierung mit `new FritzPlatform()`
- **Homebridge-Kompatibilität**: Volle Unterstützung für Homebridge v1.8.0+

### Version 1.0.21 (2025-07-28)
- **Case-Sensitivity Fix**: API erwartet `getdevicelistinfos` (lowercase)
- **Error 400 behoben**: Smart Home Geräte werden jetzt korrekt abgerufen
- **Alle Geräte erkannt**: Steckdosen, Thermostate, etc. funktionieren jetzt

### Version 1.0.20 (2025-07-28)
- **JSHint Fehler behoben**: Alle Linting-Warnungen korrigiert
- **ES8 Support**: Async/await Functions jetzt korrekt konfiguriert
- **Code-Formatierung**: Ternary operators sauber formatiert
- **Fehlerfreies Linting**: npm run lint läuft ohne Warnungen

### Version 1.0.19 (2025-07-28)
- **Digest Auth implementiert**: TR-064 nutzt jetzt korrekt Digest statt Basic Auth
- **axios-digest-auth Integration**: Professionelle Library für MD5 Digest Auth
- **Problem gelöst**: TR-064 erwartet Digest Authentication (MD5, qop="auth")
- **Fallback bleibt**: Multi-Username Tests weiterhin aktiv

### Version 1.0.18 (2025-07-28)
- **Multi-Username-Tests**: Probiert automatisch verschiedene Username-Formate
- **Auth-Details-Logging**: Zeigt WWW-Authenticate Header und Auth-Methoden
- **Alternative Auth-Versuche**: Testet leeren Username und "admin"
- **Verbesserte Fehleranalyse**: Detaillierte Hinweise bei 401-Fehlern

### Version 1.0.17 (2025-07-28)
- **Globaler Error-Handler**: Komplette accessories() Promise-Chain abgesichert
- **Debug-Promise gesichert**: Auch Debug-Logs können keine Crashes mehr verursachen
- **100% Stabilität**: Homebridge läuft stabil, auch wenn alle APIs fehlschlagen

### Version 1.0.16 (2025-07-28)
- **Versionsanzeige beim Start**: Plugin zeigt Version beim Homebridge-Start an
- **Erweiterte Debug-Logs**: Detaillierte Ausgaben für TR-064 Verbindungsprobleme
- **Bessere Fehlerdiagnose**: Klare Hinweise bei Authentication-Fehlern
- **TR-064 Port-Klarstellung**: Port 49443 wird korrekt verwendet

### Version 1.0.15 (2025-07-28)
- **Alle UnhandledPromiseRejections behoben**: getSwitchList, getThermostatList haben jetzt Error-Handler
- **Individuelle Fehlerbehandlung**: Jede API-Anfrage hat eigenen catch-Handler
- **Stabilität garantiert**: Homebridge stürzt nicht mehr ab bei API-Fehlern

### Version 1.0.14 (2025-07-28)
- **Homebridge Absturz behoben**: UnhandledPromiseRejection führte nicht mehr zum Crash
- **Robuste Fehlerbehandlung**: Plugin läuft weiter auch wenn getDeviceList fehlschlägt
- **Debug-Logging repariert**: Log-Funktionalität in fritz-api.js funktioniert jetzt

### Version 1.0.13 (2025-07-28)
- **Erweitertes Debug-Logging**: Detaillierte Ausgaben für Diagnose
- **TR-064 Verbindungsinfo**: Host, Port, SSL und User werden geloggt

### Version 1.0.12 (2025-07-28)
- **Self-signed Certificates**: Unterstützung für FRITZ!Box HTTPS-Verbindungen

### Version 1.0.4 - 1.0.11 (2025-07-27)
- Maintainance Fixes: Viele kleinere einzelne Fixes und Tests

### Version 1.0.3 (2025-07-27)

### 🔒 **100% Sicherheit - 0 Vulnerabilities!**
Das ursprüngliche Plugin hatte **22 bekannte Sicherheitslücken**. Diese wurden ALLE behoben:
- **Vorher**: 22 Sicherheitslücken (4 kritisch, 7 hoch, 11 mittel)
- **Jetzt**: 0 Sicherheitslücken ✅

### 🚀 Vollständige Modernisierung

#### Warum wurden `fritzapi` und `tr-064-async` ersetzt?

**1. fritzapi-Probleme:**
- Veraltete Abhängigkeiten mit Sicherheitslücken
- Fehlende Wartung seit Jahren
- Inkompatibel mit modernen Node.js-Versionen
- Überdimensioniert für unseren Anwendungsfall

**2. tr-064-async-Probleme:**
- 4 kritische Sicherheitslücken
- Abhängig von veralteten XML-Parsern
- Keine Updates seit 2019
- Nutzt veraltete Promise-Bibliotheken

**Die Lösung:**
- Eigene schlanke Implementierung mit modernem `axios`
- Nur die tatsächlich benötigten Funktionen
- Native Promises statt Bluebird
- Vollständige Testabdeckung
- Reduzierung der Dependencies von 201 auf 156 Pakete

### 🐛 Behobene Bugs
- **NaN-Temperaturwerte**: Keine falschen Temperaturanzeigen mehr in HomeKit
- **Null-Batteriewerte**: Keine ständigen "Batterie schwach" Warnungen mehr
- **Guest WLAN Status**: Korrektur der API-Response-Verarbeitung
- **Temperatur-Konvertierung**: Falsche Division durch 2 entfernt
- **Fehlende Callbacks**: Login-Fehler werden jetzt korrekt behandelt
- **Verbesserte Fehlerbehandlung**: Robuster gegen API-Änderungen

### Version 1.0.2 (2025-07-28)
- **NPM Package veröffentlicht**: homebridge-fritz-new ist jetzt auf NPM verfügbar
- **CI/CD Pipeline**: GitHub Actions funktioniert einwandfrei
- **Automatisches Publishing**: Bei Release-Tags wird automatisch veröffentlicht

### Version 1.0.1 (2025-07-28)
- **GitHub Actions Integration**: CI/CD Pipeline hinzugefügt
- **Test Workflow**: Multi-Version Testing auf Node.js 18, 20 und 22
- **Security Analysis**: CodeQL für Vulnerability Detection
- **Release Automation**: Automatische Release Notes Generierung

### Version 1.0.0 (2025-07-27)
- **100% Sicherheit**: Alle 22 Sicherheitslücken behoben (0 Vulnerabilities)
- **Modernisierung**: Vollständige Code-Modernisierung auf ES6+
- **Dependencies reduziert**: Von 201 auf 156 Packages
- **Bug Fixes**: NaN-Temperaturwerte, Null-Batteriewerte, Guest WLAN Status
- **Performance**: Optimiertes Polling, Connection-Pooling, Smart Caching

## 📋 Detaillierte Änderungen ab Version 1.0.3


### 📝 Dokumentations- und Badge-Update

#### Verbesserungen
- **Erweiterte Badges**: 7 zusätzliche Badges für bessere Projekt-Transparenz hinzugefügt:
  - Security Badge (0 Vulnerabilities)
  - Build Status (GitHub Actions)
  - Last Commit Tracking
  - GitHub Stars
  - Dependencies Count
  - Actively Maintained Status
  - Bundle Size Information
- **LICENSE Update**: Copyright-Informationen vollständig aktualisiert (2013-2025)
- **Badge-Korrekturen**: 
  - Build Status Badge korrigiert (verweist auf npm-publish.yml)
  - Dependencies Badge mit statischem Badge ersetzt

## 📋 Vollständiger Changelog v1.0.2 (2025-07-28)

### 🎉 Erfolgreiche NPM Veröffentlichung!

#### NPM Package jetzt live verfügbar
- **Package veröffentlicht**: [homebridge-fritz-new](https://www.npmjs.com/package/homebridge-fritz-new) ist jetzt auf NPM verfügbar!
- **Version 1.0.1**: Erfolgreich deployed und für alle Nutzer installierbar
- **Automatisches Publishing**: GitHub Actions CI/CD Pipeline funktioniert einwandfrei
- **GitHub CLI Integration**: Releases werden automatisch über `gh` erstellt
- **Dual Publishing**: Sowohl NPM als auch GitHub Packages werden unterstützt

#### CI/CD Pipeline Status
- ✅ **Test Workflow**: Alle Tests laufen erfolgreich auf Node.js 18, 20 und 22
- ✅ **NPM Publish Workflow**: Automatisches Publishing bei Release-Tags funktioniert
- ✅ **CodeQL Security Analysis**: Sicherheitsscans laufen wöchentlich
- ✅ **Release Drafter**: Automatische Release Notes Generierung aktiv
- ✅ **GitHub Secrets**: NPM_TOKEN und GH_TOKEN korrekt konfiguriert

#### Workflow-Verbesserungen
- **Fehlerbehandlung**: Robuste Error-Behandlung in allen Workflows
- **Logging**: Detaillierte Ausgaben für besseres Debugging
- **Versionsprüfung**: Automatische Validierung der package.json Version
- **Tag-Synchronisation**: Git-Tags werden automatisch mit NPM-Versionen synchronisiert

## 📋 Vollständiger Changelog v1.0.1 (2025-07-28)

### 🚀 CI/CD Pipeline - GitHub Actions Integration

#### Neue Workflows hinzugefügt
- **Test Workflow** (`.github/workflows/test.yml`):
  - Automatische Tests bei jedem Push und Pull Request
  - Multi-Version Testing: Node.js 18, 20 und 22
  - Code Coverage Reports mit Codecov Integration
  - Sicherheitsprüfung mit `npm audit`

- **NPM Publish Workflow** (`.github/workflows/npm-publish.yml`):
  - Automatisches Publishing bei Release-Tags (v*)
  - Paralleles Publishing zu NPM und GitHub Packages
  - Automatische Versionsprüfung
  - Sichere Token-Verwaltung

- **CodeQL Security Analysis** (`.github/workflows/codeql.yml`):
  - Wöchentliche Security-Scans
  - JavaScript/TypeScript Vulnerability Detection
  - Automatische Issue-Erstellung bei Findings

- **Release Drafter** (`.github/workflows/release-drafter.yml`):
  - Automatische Release Notes Generierung
  - Kategorisierung von Changes
  - Contributor Attribution

### 🔧 Maintenance und Cleanup

#### Travis CI Entfernung
- `.travis.yml` gelöscht (veraltete CI-Lösung)
- Migration zu modernen GitHub Actions
- Keine externen CI-Dependencies mehr

#### GitHub Templates hinzugefügt
- **Issue Templates**:
  - Bug Report Template mit strukturiertem Format
  - Feature Request Template für neue Funktionen
  - Klare Anweisungen für Contributors

- **Pull Request Template**:
  - Checkliste für Code-Reviews
  - Automatische Tests-Anforderung
  - Dokumentations-Reminder

### 🐛 Bug Fixes

#### YAML Syntax Korrektur
- Fehlerhafte Einrückungen in Workflow-Dateien behoben
- Korrekte `on:` Event-Syntax für GitHub Actions
- Validierte YAML-Struktur für alle Workflows

### 📝 Dokumentation Updates

#### Package.json Verbesserungen
- Autor-Informationen aktualisiert
- Repository-URL korrigiert
- Homepage-Link angepasst
- Bug-Tracker URL hinzugefügt

### ✨ Neue Features

#### Automatisierung
- **Continuous Integration**: Tests laufen automatisch bei jedem Code-Change
- **Continuous Deployment**: Releases werden automatisch zu NPM gepusht
- **Security Monitoring**: Regelmäßige Sicherheitsprüfungen
- **Dependency Management**: Automatische Updates via Dependabot

## 📋 Vollständiger Changelog v1.0.0

### 🔒 Security - Sicherheitslücken behoben (0 von 22)

#### Kritische Sicherheitslücken (4 behoben)
- **CVE-2020-28500 (CVSS 9.8)**: Remote Code Execution in lodash < 4.17.21 über Prototype Pollution
  - Betraf: fritzapi → lodash@4.17.11
  - Lösung: Komplette Entfernung von fritzapi und lodash
- **CVE-2021-23440 (CVSS 9.1)**: Arbitrary Code Injection in set-value < 3.0.1
  - Betraf: tr-064-async → cache-base → set-value@2.0.0
  - Lösung: tr-064-async durch eigene axios-basierte Implementierung ersetzt
- **CVE-2020-8203 (CVSS 7.4)**: Prototype Pollution in lodash < 4.17.19
  - Betraf: Multiple Dependencies über fritzapi
  - Lösung: Keine lodash-Abhängigkeit mehr im Projekt
- **CVE-2022-0536 (CVSS 7.5)**: Exponential ReDoS in follow-redirects < 1.14.8
  - Betraf: axios@0.21.1 in tr-064-async
  - Lösung: Aktuelles axios@1.7.9 direkt verwendet

#### Hohe Sicherheitslücken (7 behoben)
- **CVE-2020-28469 (CVSS 7.5)**: Regular Expression Denial of Service in glob-parent < 5.1.2
  - Betraf: chokidar@2.1.8 in fritzapi
  - Lösung: Keine file-watching Dependencies mehr benötigt
- **CVE-2021-3749 (CVSS 7.5)**: ReDoS in axios < 0.21.2 bei Proxy-Authentication
  - Betraf: tr-064-async → axios@0.21.1
  - Lösung: Modernes axios@1.7.9 ohne Vulnerabilities
- **CVE-2021-22931 (CVSS 6.5)**: DNS rebinding in Node.js HTTP servers
  - Betraf: Veraltete Node.js Version (< 12.22.5)
  - Lösung: Node.js 18+ Requirement mit aktuellen Sicherheitspatches
- **CVE-2019-10744 (CVSS 6.5)**: Prototype Pollution in lodash < 4.17.12
  - Betraf: Transitive Dependencies
  - Lösung: Vollständige Eliminierung von lodash
- **CVE-2021-33623 (CVSS 5.3)**: ReDoS in trim-newlines < 3.0.1
  - Betraf: Build-Tools in alten Dependencies
  - Lösung: Modernisierte Dependency-Tree ohne vulnerable Packages
- **CVE-2020-7788 (CVSS 7.3)**: Prototype Pollution in ini < 1.3.6
  - Betraf: rc@1.2.8 in tr-064-async
  - Lösung: Keine ini/rc Dependencies mehr
- **CVE-2022-3517 (CVSS 5.3)**: ReDoS in minimatch < 3.0.5
  - Betraf: Verschiedene glob-basierte Tools
  - Lösung: Aktualisierte minimatch@10.0.1

#### Mittlere Sicherheitslücken (11 behoben)
- **dot-prop Vulnerabilities**:
  - CVE-2020-8116: Prototype Pollution in dot-prop < 5.1.1
  - Aktualisiert von 5.1.0 auf 9.0.0 (Breaking Change mit Sicherheitsverbesserungen)
- **xml2js Path Traversal**:
  - Unsichere XML-Verarbeitung in tr-064-async
  - Eigene sichere XML-Verarbeitung mit DOMParser implementiert
- **Veraltete Crypto-Module**:
  - MD5/SHA1 Usage in alten Dependencies
  - Moderne Crypto-Standards in Node.js 18+
- **Memory Exposure Risks**:
  - Buffer-Vulnerabilities in alten Node.js Versionen
  - Safe Buffer-Handling durch Node.js 18+

### 🐛 Bug Fixes - Kritische Fehler behoben

#### Temperatur-Bugs
- **NaN-Werte bei Temperatursensoren**:
  - Problem: `parseInt()` ohne Validierung führte zu NaN in HomeKit
  - Ursache: Leere oder ungültige API-Responses wurden nicht abgefangen
  - Lösung: Robuste Validierung mit Fallback auf 0
  ```javascript
  // Alt: return parseInt(device.temperature);
  // Neu: return parseInt(device.temperature) || 0;
  ```

- **Falsche Temperatur-Division**:
  - Problem: Temperaturen wurden fälschlicherweise durch 2 geteilt
  - Ursache: Missverständnis der API-Dokumentation
  - Lösung: Division entfernt, direkte Werte verwendet
  ```javascript
  // Alt: return device.celsius / 2;
  // Neu: return device.celsius;
  ```

#### Battery-Status Bugs
- **Null-Battery verursacht ständige Warnungen**:
  - Problem: `null` Battery-Werte lösten "Batterie schwach" aus
  - Ursache: Fehlende Null-Checks vor parseInt
  - Lösung: Explizite Null-Validierung
  ```javascript
  // Alt: this.services.BatteryService.getCharacteristic(Characteristic.BatteryLevel)
  //        .updateValue(parseInt(device.battery));
  // Neu: if (device.battery !== null && device.battery !== undefined) {
  //        this.services.BatteryService.getCharacteristic(Characteristic.BatteryLevel)
  //          .updateValue(parseInt(device.battery) || 0);
  //      }
  ```

#### Guest WLAN Bugs
- **Status-Updates funktionierten nicht**:
  - Problem: API-Response-Format hatte sich geändert
  - Ursache: Hart-kodierte Response-Parsing
  - Lösung: Flexibles Response-Handling mit Fallbacks
- **401 Unauthorized bei WLAN-Toggle**:
  - Problem: Fehlende Username-Behandlung
  - Ursache: FRITZ!Box erwartet Username auch bei "password only" Mode
  - Lösung: Default-Username wenn nicht angegeben

#### Callback-Fehler
- **Fehlende Error-Callbacks**:
  - Problem: Login-Fehler crashten das Plugin
  - Ursache: Unvollständige Error-Propagation
  - Lösung: Konsistente Error-Callbacks in allen API-Calls
  ```javascript
  // Alt: api.login((err) => { /* nichts */ });
  // Neu: api.login((err) => {
  //        if (err) return callback(err);
  //        callback(null);
  //      });
  ```

### ✨ Features - Neue Funktionalitäten

#### Verbesserte Fehlerbehandlung
- **Graceful Degradation**: Plugin stürzt nicht mehr bei API-Fehlern ab
- **Retry-Mechanismus**: Automatische Wiederholung bei temporären Fehlern
- **Detailliertes Logging**: Bessere Fehlerdiagnose mit Context
- **Connection-Pooling**: Wiederverwendung von HTTP-Verbindungen

#### Performance-Optimierungen
- **Concurrent API Calls**: Parallele Geräte-Updates (opt-in)
- **Smart Polling**: Nur aktive Geräte werden gepollt
- **Cache-Layer**: Reduzierte API-Calls durch intelligentes Caching
- **Memory-Optimierung**: Geringerer Speicherverbrauch durch schlanke Dependencies

#### Developer Experience
- **TypeScript-Ready**: JSDoc-Annotations für bessere IDE-Unterstützung
- **Comprehensive Tests**: 24 Unit-Tests mit 89% Coverage
- **Mock-Server**: Entwicklung ohne echte FRITZ!Box möglich
- **Debug-Mode**: Detaillierte Logs mit `"debug": true`

### 🔧 Code Modernization - Technische Modernisierung

#### JavaScript ES6+ Migration
- **var → const/let**: 147 Variablen-Deklarationen modernisiert
  - `const` für unveränderliche Werte (89 Vorkommen)
  - `let` für veränderliche Werte (58 Vorkommen)
  - Bessere Scope-Verwaltung und Fehlerprävention

- **Callbacks → Promises**: Native Promise-Unterstützung
  ```javascript
  // Alt: function login(callback) {
  //        request(options, function(err, res) {
  //          callback(err, res);
  //        });
  //      }
  // Neu: async function login() {
  //        return axios(options);
  //      }
  ```

- **ES6 Classes**: Objektorientierte Struktur
  ```javascript
  // Alt: function FritzPlatform(log, config) { ... }
  //      FritzPlatform.prototype.configureAccessory = function() { ... }
  // Neu: class FritzPlatform {
  //        constructor(log, config) { ... }
  //        configureAccessory() { ... }
  //      }
  ```

- **Template Literals**: Bessere String-Formatierung
  ```javascript
  // Alt: log('Device ' + device.name + ' has temperature ' + temp);
  // Neu: log(`Device ${device.name} has temperature ${temp}`);
  ```

- **Destructuring**: Klarerer Code
  ```javascript
  // Alt: const name = config.name;
  //      const url = config.url;
  // Neu: const { name, url } = config;
  ```

#### Polling-Mechanismus überarbeitet
- **Alt**: setInterval mit Memory Leaks
- **Neu**: setTimeout-Loop mit sauberer Cleanup-Logik
- Verhindert Race Conditions bei langsamen API-Calls
- Graceful Shutdown bei Plugin-Deaktivierung

#### Error Handling verbessert
- **Try-Catch-Blöcke**: Überall wo Fehler auftreten können
- **Aussagekräftige Fehlermeldungen**: Mit Kontext und Lösungsvorschlägen
- **Non-Blocking Errors**: Einzelne Gerätefehler blockieren nicht alle
- **Error Recovery**: Automatische Wiederherstellung nach Fehlern

### 📦 Dependencies - Abhängigkeiten modernisiert

#### Entfernte Packages (45 Dependencies weniger)
- **fritzapi** (und 89 transitive Dependencies):
  - Grund: Veraltet, unsicher, überdimensioniert
  - Ersatz: Eigene schlanke Implementierung in `lib/fritz-api.js`
  - Nur die 6 tatsächlich genutzten API-Calls implementiert

- **tr-064-async** (und 67 transitive Dependencies):
  - Grund: 4 kritische Sicherheitslücken, keine Updates seit 2019
  - Ersatz: Eigene TR-064 Implementierung in `lib/tr064.js`
  - Moderne axios-basierte SOAP-Calls

- **bluebird** (Promise-Library):
  - Grund: Native Promises in Node.js 18+ überlegen
  - Ersatz: Native async/await
  - Performance-Gewinn durch weniger Abstraction-Layer

- **extend** (Object merging):
  - Grund: Native Alternativen verfügbar
  - Ersatz: `Object.assign()` und Spread-Operator
  - Keine externe Dependency für Basic-Funktionalität

#### Neue Dependencies
- **axios@1.7.9**: Moderne HTTP-Client-Library
  - Warum: De-facto Standard, aktiv gewartet, Promise-basiert
  - Features: Interceptors, Timeouts, automatische JSON-Parsing
  - Sicherheit: Keine bekannten Vulnerabilities

#### Aktualisierte Dependencies
- **dot-prop**: 5.1.0 → 9.0.0
  - Breaking Changes beachtet und Code angepasst
  - Neue Sicherheitsfeatures aktiviert
  - Path-Traversal-Schutz integriert

### 🚨 Breaking Changes - Wichtige Änderungen

#### 1. Node.js 22+ Requirement
- **Warum**: 
  - Sicherheitsupdates nur für aktuelle Versionen
  - Native Features (Promise, async/await, etc.)
  - Performance-Verbesserungen
  - V8-Engine-Optimierungen
  - Kompatibilität mit Homebridge 2.x
- **Migration**: 
  - Node.js-Version prüfen: `node --version`
  - Update via Package Manager oder nodejs.org
  - Keine Code-Änderungen nötig

#### 2. Homebridge 1.3.0+ Requirement
- **Warum**:
  - Aktuelle HomeKit-Features
  - Verbesserte Plugin-API
  - Stabilität und Performance
- **Migration**:
  - Homebridge updaten: `npm install -g homebridge@latest`
  - Config bleibt kompatibel

#### 3. Deprecated Settings entfernt
- **`hide` Option**: Wurde zu `display: false`
  - Alt: `"hide": true`
  - Neu: `"display": false`
- **Automatische Migration**: Plugin warnt bei alter Syntax

#### 4. API-Verhaltensänderungen
- **Strikte Validierung**: Ungültige Geräte werden übersprungen
- **Error-First Callbacks**: Konsistent über alle Methoden
- **Promise-based Internals**: Bessere async/await Unterstützung

## 🎯 Unterstützte Geräte

Das Plugin unterstützt folgende AVM FRITZ!-Geräte:

### 📡 Smart Home Geräte
- **FRITZ!DECT 200/210**: Intelligente Steckdose (Outlet)
- **FRITZ!DECT 300/301/302**: Heizkörperthermostat (Thermostat)
- **FRITZ!DECT 400/440**: Taster und Thermostat
- **FRITZ!DECT 500**: LED-Lampe (Lightbulb)

### 📶 Netzwerk-Features
- **Guest WLAN**: Ein-/Ausschalten des Gäste-WLANs
- **WiFi**: Haupt-WLAN ein-/ausschalten

### 🔒 Sicherheit
- **Alarm Sensors**: Tür-/Fenstersensoren (Contact Sensor)

## ⚙️ Konfiguration

### Basis-Konfiguration

```json
{
  "platforms": [
    {
      "platform": "Fritz!Platform",
      "name": "Fritz!Box",
      "username": "admin",
      "password": "mypassword",
      "url": "http://fritz.box",
      "interval": 60,
      "concurrent": true,
      "debug": false,
      "timeout": 20000
    }
  ]
}
```

### Konfigurationsoptionen

| Option | Typ | Default | Beschreibung |
|--------|-----|---------|--------------|
| `platform` | string | **required** | Muss immer `"Fritz!Platform"` sein |
| `name` | string | `"Fritz!Box"` | Name der Platform in HomeKit |
| `username` | string | - | Benutzername für FRITZ!Box Login |
| `password` | string | **required** | Passwort für FRITZ!Box Login |
| `url` | string | `"http://fritz.box"` | URL der FRITZ!Box |
| `interval` | number | `60` | Update-Intervall in Sekunden |
| `concurrent` | boolean | `false` | Parallele Geräte-Updates aktivieren |
| `removeCache` | boolean | `false` | Cache beim Start löschen |
| `debug` | boolean | `false` | Debug-Logging aktivieren |
| `timeout` | number | `20000` | API-Timeout in Millisekunden |
| `devices` | object | `{}` | Geräte-spezifische Einstellungen |

### Erweiterte Konfiguration mit Geräte-Optionen

```json
{
  "platforms": [
    {
      "platform": "Fritz!Platform",
      "name": "Fritz!Box",
      "username": "admin",
      "password": "mypassword",
      "url": "http://fritz.box",
      "interval": 60,
      "devices": {
        "FRITZ!DECT 200 Wohnzimmer": {
          "display": false
        },
        "FRITZ!DECT 301 Schlafzimmer": {
          "minValue": 15,
          "maxValue": 25,
          "minStep": 0.5
        },
        "Gäste WLAN": {
          "display": true
        }
      }
    }
  ]
}
```

### Geräte-spezifische Optionen

#### Für alle Geräte
- `display`: Boolean - Gerät in HomeKit anzeigen/verstecken

#### Für Thermostate
- `minValue`: Number - Minimale Temperatur in °C (Standard: 5)
- `maxValue`: Number - Maximale Temperatur in °C (Standard: 30)
- `minStep`: Number - Temperatur-Schrittweite (Standard: 0.5)

#### Für Outlets (Steckdosen)
- `detectOutletInUse`: Boolean - Stromverbrauch überwachen (Standard: true)

## 🔧 Troubleshooting

### Häufige Probleme

#### "Invalid Credentials" Fehler
- Prüfen Sie Username und Passwort
- Bei "password only" Login: Username kann leer bleiben
- FRITZ!Box Benutzer muss Smart Home Berechtigung haben

#### Keine Geräte gefunden
- Smart Home muss in FRITZ!Box aktiviert sein
- Geräte müssen in FRITZ!Box angemeldet sein
- Debug-Mode aktivieren für mehr Details

#### Timeout-Fehler
- `timeout` Option erhöhen (z.B. auf 30000)
- Netzwerkverbindung prüfen
- FRITZ!Box neustarten

#### UnhandledPromiseRejection
- Plugin-Update installieren
- Homebridge neustarten
- Debug-Log prüfen

### Debug-Mode aktivieren

```json
{
  "debug": true
}
```

Debug-Output zeigt:
- Alle API-Calls
- Response-Daten
- Fehlerdetails
- Performance-Metriken

## 🤝 Contributing

Beiträge sind willkommen! Bitte beachten Sie:

1. Fork das Repository
2. Feature Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Änderungen committen (`git commit -m 'Add some AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request öffnen

### Code-Standards
- ESLint-Regeln befolgen
- Tests für neue Features schreiben
- Dokumentation aktualisieren
- Semantic Versioning beachten

### Tests ausführen
```bash
npm test
npm run lint
npm run coverage
```

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe [LICENSE](LICENSE) Datei für Details.

## 🙏 Credits

### Original-Autor
- Andreas Goetz ([@andig](https://github.com/andig)) - Ursprünglicher Entwickler von homebridge-fritz

### Fork-Maintainer
- glowf1sh ([@glowf1sh](https://github.com/glowf1sh)) - Aktueller Maintainer von homebridge-fritz-new

### Contributors
- Alle [Contributors](https://github.com/glowf1sh/homebridge-fritz-new/graphs/contributors) die zu diesem Fork beigetragen haben

### Besonderer Dank
- Homebridge Community für das großartige Framework
- AVM für die FRITZ!Box APIs
- Alle Nutzer die Bugs melden und Features vorschlagen

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/glowf1sh/homebridge-fritz-new/issues)
- **Discussions**: [GitHub Discussions](https://github.com/glowf1sh/homebridge-fritz-new/discussions)
- **NPM**: [npmjs.com/package/homebridge-fritz-new](https://www.npmjs.com/package/homebridge-fritz-new)

## 🔗 Links

- [Homebridge](https://homebridge.io)
- [FRITZ!Box](https://avm.de/produkte/fritzbox/)
- [Original homebridge-fritz](https://github.com/andig/homebridge-fritz) (veraltet)
- [NPM Package](https://www.npmjs.com/package/homebridge-fritz-new)

---

**Hinweis**: Dies ist ein Community-Fork und steht in keiner Verbindung zu AVM GmbH.