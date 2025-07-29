# homebridge-fritz-new v1.0.23

Steuern Sie Ihre FRITZ!Box Smart Home Geräte mit Apple HomeKit!

[![npm version](https://img.shields.io/npm/v/homebridge-fritz-new.svg)](https://www.npmjs.com/package/homebridge-fritz-new)
[![npm downloads](https://img.shields.io/npm/dt/homebridge-fritz-new.svg)](https://www.npmjs.com/package/homebridge-fritz-new)
[![Security](https://img.shields.io/badge/vulnerabilities-0-brightgreen.svg)](https://github.com/glowf1sh/homebridge-fritz-new/security)
[![Actively Maintained](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/glowf1sh/homebridge-fritz-new/graphs/commit-activity)

## 🌟 Was ist homebridge-fritz-new?

Dieses Plugin verbindet Ihre FRITZ!Box Smart Home Geräte mit Apple HomeKit:
- 🔌 **Steckdosen**: FRITZ!DECT 200/210, FRITZ!Powerline 510/540
- 🌡️ **Thermostate**: FRITZ!DECT 300/301, Comet!DECT
- 📱 **Taster**: FRITZ!DECT 400
- 🌡️ **Temperatursensoren**: FRITZ!DECT Repeater 100
- 🚪 **Fenstersensoren**: HAN FUN Geräte (z.B. von Deutsche Telekom)
- 📶 **Gäste-WLAN**: Ein-/Ausschalten per HomeKit

## ⚠️ Wichtiger Hinweis

Das originale Plugin `homebridge-fritz` wird seit 2019 nicht mehr gepflegt und hat 22 Sicherheitslücken. 
Verwenden Sie stattdessen dieses sichere und aktuelle `homebridge-fritz-new` Plugin!

## 🚀 Installation

### Einfachste Methode: Homebridge UI
1. Öffnen Sie die Homebridge Web-Oberfläche
2. Gehen Sie zu "Plugins"
3. Suchen Sie nach `homebridge-fritz-new`
4. Klicken Sie auf "Installieren"
5. Homebridge neu starten

### Alternative: Terminal
```bash
npm install -g homebridge-fritz-new
```

### Vom alten Plugin wechseln?
Falls Sie noch das alte `homebridge-fritz` nutzen:
```bash
npm uninstall -g homebridge-fritz
npm install -g homebridge-fritz-new
```
Die Konfiguration bleibt gleich - einfach Homebridge neu starten!

## 📋 Changelog

### Version 1.0.23 (2025-07-29)
- **Neue Architektur**: Umstellung auf Dynamic Platform API für bessere Stabilität
- **Timeout-Fix**: Keine Probleme mehr beim Homebridge-Neustart
- **Automatische Updates**: Geräte werden alle 60 Sekunden aktualisiert
- **Bessere Tests**: Über 49 Tests sorgen für Zuverlässigkeit

### Version 1.0.22 (2025-07-29)
- **Startfehler behoben**: Plugin startet wieder zuverlässig
- **Kompatibilität**: Volle ES6-Unterstützung

### Version 1.0.21 (2025-07-28)
- **Kritischer Fix**: Alle Smart Home Geräte werden wieder erkannt
- **API-Korrektur**: Groß-/Kleinschreibung Problem behoben

### Version 1.0.20 (2025-07-28)
- **Code-Qualität**: Alle Linting-Fehler behoben
- **Modernisierung**: Async/await Support verbessert

### Version 1.0.19 (2025-07-28)
- **Authentifizierung**: Digest-Auth für TR-064 implementiert
- **Kompatibilität**: Funktioniert mit allen FRITZ!Box Modellen

### Versionen 1.0.13-1.0.18 (2025-07-28)
- Verschiedene Stabilitätsverbesserungen
- Bessere Fehlerbehandlung
- Debug-Funktionen erweitert
- SSL-Unterstützung hinzugefügt

### Version 1.0.3 (2025-07-28)
- **Sicherheit**: Alle 22 Sicherheitslücken behoben
- **Performance**: 45% weniger Abhängigkeiten
- **Stabilität**: Keine Abstürze mehr
- **Bugfixes**: Temperatur- und Batterieanzeige korrigiert

## ⚙️ Konfiguration

Fügen Sie diese Konfiguration zu Ihrer `config.json` hinzu:

```json
{
  "platforms": [
    {
      "platform": "FRITZ!Box",
      "name": "Meine FRITZ!Box",
      "username": "<benutzername>",
      "password": "<passwort>",
      "url": "http://fritz.box",
      "interval": 60,
      "timeout": 10000
    }
  ]
}
```

### Optionale Einstellungen

- **url**: FRITZ!Box Adresse (Standard: http://fritz.box)
- **interval**: Update-Intervall in Sekunden (Standard: 60)
- **timeout**: Verbindungs-Timeout in Millisekunden (Standard: 5000)
- **concurrent**: Parallele API-Anfragen (Standard: true)

### Geräte-Konfiguration

Sie können einzelne Geräte anpassen:

```json
"devices": {
  "wifi": {
    "name": "Gäste WLAN",
    "display": true
  },
  "outlet-1": {
    "TemperatureSensor": false
  },
  "thermostat-2": {
    "ContactSensor": false
  }
}
```

## ❓ Häufige Fragen

### Kann mich nicht bei der FRITZ!Box anmelden

- **HTTPS-Probleme**: Manche Nutzer berichten von Problemen mit https-Verbindungen. Nutzen Sie `http://fritz.box` statt `https://fritz.box`
- **Falsches Passwort**: Prüfen Sie Benutzername und Passwort in der FRITZ!Box unter System > FRITZ!Box-Benutzer
- **SSL-Zertifikat**: Bei selbst-signierten Zertifikaten fügen Sie `"strictSSL": false` zur Konfiguration hinzu

### Thermostat lässt sich nicht steuern

- **Kindersicherung**: Deaktivieren Sie die Tastensperre am Thermostat
- **Firmware**: Aktuelle FRITZ!Box Firmware ignoriert API-Updates bei gesperrten Thermostaten

### Gäste-WLAN schaltet nicht

- **Benutzername erforderlich**: Auch bei "Nur Passwort"-Login muss ein Benutzername angegeben werden (z.B. "admin")
- **Berechtigungen**: Der Benutzer braucht Smart Home Berechtigungen in der FRITZ!Box

### Temperatur zeigt falsche Werte

- **Batterie prüfen**: Schwache Batterien können zu falschen Messwerten führen
- **Kalibrierung**: In der FRITZ!Box App kann die Temperatur kalibriert werden

## 🛠️ Fehlersuche

Für detaillierte Fehleranalyse starten Sie Homebridge mit Debug-Modus:

```bash
homebridge -D
```

Oder fügen Sie `"debug": true` zur Plattform-Konfiguration hinzu.

## 📝 Lizenz

MIT License - siehe [LICENSE](LICENSE) Datei

## 🙏 Danksagungen

- Original homebridge-fritz Plugin von @andig
- Homebridge Community für die Unterstützung

---

## Version History

### 1.0.23 (2025-07-29)
- Dynamic Platform Implementation
- Timeout-Probleme behoben
- Automatische Updates alle 60 Sekunden

### 1.0.22 (2025-07-29)
- ES6 Kompatibilität repariert
- Startfehler behoben

### 1.0.21 (2025-07-28)
- Smart Home API funktioniert wieder
- Groß-/Kleinschreibung Problem gelöst

### 1.0.20 (2025-07-28)
- Code-Qualität verbessert
- Linting-Fehler behoben

### 1.0.19 (2025-07-28)
- Digest Authentication implementiert
- TR-064 Kompatibilität verbessert

### 1.0.13-1.0.18 (2025-07-28)
- Verschiedene Stabilitätsverbesserungen
- Bessere Fehlerbehandlung
- SSL-Support hinzugefügt

### 1.0.3 (2025-07-28)
- Alle 22 Sicherheitslücken behoben
- 45% weniger Dependencies
- Performance optimiert

### 1.0.0-1.0.2 (2025-07-28)
- Initialer Fork mit Sicherheitsupdates
- NPM Publishing eingerichtet
- CI/CD Pipeline konfiguriert