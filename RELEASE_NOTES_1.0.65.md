# Release 1.0.65 - HomeKit Temperatur-Feedback Fix

## Behobene Probleme

### 1. OFF Mode Anzeige
- **Problem**: Bei OFF zeigte HomeKit weiterhin die alte Temperatur (z.B. 21°C) statt 8°C
- **Lösung**: `queryTargetTemperature()` setzt jetzt bei "off" die Temperatur korrekt auf 8°C

### 2. Rädchen dreht ewig
- **Problem**: Nach Temperaturänderung in Apple Home drehte sich das Rädchen endlos
- **Ursache**: `getTargetTemperature()` rief `queryTargetTemperature()` auf und überschrieb den gerade gesetzten Wert
- **Lösung**: `getTargetTemperature()` gibt jetzt nur noch den gecachten Wert zurück

## Technische Details

### Geänderte Dateien
- `lib/accessories/thermostat.js`

### Code-Änderungen

1. **OFF Mode Fix** (Zeile 340-343):
```javascript
// Alt:
if (temperature === "off") {
    targetTemperature = service.fritzTargetTemperature; // Behielt alten Wert
    ...
}

// Neu:
if (temperature === "off") {
    targetTemperature = 8; // OFF = 8°C in HomeKit
    ...
}
```

2. **Feedback Fix** (Zeile 273-279):
```javascript
// Alt:
async getTargetTemperature() {
    this.queryTargetTemperature(); // Überschrieb gesetzten Wert
    return this.services.Thermostat.fritzTargetTemperature;
}

// Neu:
async getTargetTemperature() {
    // Nur gecachten Wert zurückgeben
    return this.services.Thermostat.fritzTargetTemperature;
}
```

## Update-Empfehlung

**Dringend empfohlen** für alle Nutzer mit FRITZ!DECT Thermostaten.

### Installation
```bash
npm update homebridge-fritz-new
```

### Homebridge neu starten
Nach dem Update Homebridge neu starten für die Änderungen.

## Bekannte Einschränkungen

- Die FRITZ!Box API benötigt 1-2 Sekunden um Änderungen zu bestätigen
- Bei sehr schnellen aufeinanderfolgenden Änderungen kann es zu Verzögerungen kommen

## Nächste Schritte

Falls weiterhin Probleme auftreten:
1. Homebridge Logs prüfen
2. Cache löschen in Homebridge UI
3. Issue auf GitHub erstellen mit Debug-Logs