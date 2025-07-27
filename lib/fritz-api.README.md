# Fritz!Box API Implementation

Diese moderne Implementierung ersetzt die veraltete `fritzapi` Bibliothek und nutzt `axios` statt der deprecated `request` Library.

## Features

- Vollständige Kompatibilität mit der bestehenden API
- Moderne Implementierung mit axios
- Keine Sicherheitslücken durch veraltete Dependencies
- Vollständige Test-Abdeckung
- Async/Await Syntax

## Verwendete Methoden

### Authentifizierung
- `getSessionID(username, password, options)` - Session-basierte Authentifizierung

### Gerätelisten
- `getDeviceList(sid, options)` - Alle Smart Home Geräte abrufen
- `getDeviceListFiltered(sid, filter, options)` - Gefilterte Geräteliste
- `getSwitchList(sid, options)` - Alle Schalter/Steckdosen
- `getThermostatList(sid, options)` - Alle Thermostate

### Schalter/Steckdosen
- `getSwitchState(sid, ain, options)` - Schaltzustand abfragen
- `setSwitchOn(sid, ain, options)` - Einschalten
- `setSwitchOff(sid, ain, options)` - Ausschalten
- `getSwitchPower(sid, ain, options)` - Aktuelle Leistung (W)
- `getSwitchEnergy(sid, ain, options)` - Energieverbrauch (kWh)

### Temperatur/Thermostat
- `getTemperature(sid, ain, options)` - Aktuelle Temperatur
- `getTempTarget(sid, ain, options)` - Zieltemperatur
- `setTempTarget(sid, ain, temperature, options)` - Zieltemperatur setzen
- `getBatteryCharge(sid, ain, options)` - Batteriestand

### System/WiFi
- `getOSVersion(sid, options)` - OS Version (Placeholder)
- `getGuestWlan(sid, options)` - Gäste-WLAN Status
- `setGuestWlan(sid, enable, options)` - Gäste-WLAN ein/ausschalten

## Tests

```bash
npm run test:api
```

## Migration

Die API ist 100% kompatibel mit der Original `fritzapi` Library. Einfach den Import ändern:

```javascript
// Alt:
var fritz = require('fritzapi');

// Neu:
var fritz = require('./fritz-api');
```

## Technische Details

- MD5-Challenge-Response Authentifizierung
- XML-Parsing mit xml2js
- Fehlerbehandlung mit korrekten HTTP Status Codes
- Timeout-Unterstützung
- Normalisierte Geräte-Datenstrukturen