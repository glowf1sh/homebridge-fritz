# Fritz!Box Device List API Fix

## Problem
Die Geräteliste konnte nicht abgerufen werden nach erfolgreichem Login:
- ✅ Login funktionierte (`getSessionID` erfolgreich)
- ❌ `getDeviceList` schlug fehl mit "Could not get devices from FRITZ!Box"

## Ursache
Zwei kritische Unterschiede zur originalen fritzapi:

1. **Case-Sensitivity**: Der API-Parameter muss `getDeviceListInfos` (CamelCase) sein, nicht `getdevicelistinfos`
2. **XML-Parsing**: Mit `explicitRoot: false` entfernt der Parser das Root-Element `<devicelist>`, sodass die Devices direkt unter `data.device` liegen

## Lösung
1. **API-Parameter korrigiert**: 
   ```javascript
   switchcmd: 'getDeviceListInfos'  // Vorher: 'getdevicelistinfos'
   ```

2. **XML-Parsing angepasst**: 
   - Primär nach `data.device` suchen (Standard mit `explicitRoot: false`)
   - Fallback zu `data.devicelist.device` für andere Parser-Konfigurationen

## Verifizierung
- Alle Unit-Tests laufen erfolgreich durch
- Der Debug-Script `/opt/homebridge-fritz/test/debug-devicelist.js` kann zum Testen verwendet werden:
  ```bash
  node test/debug-devicelist.js "" "password"
  ```

## Wichtige Hinweise für Fritz!Box API
- **Berechtigungen**: Der Benutzer muss "Smart Home" Berechtigung haben
- **Session-Handling**: Bei ungültiger Session wird auf Login-Seite umgeleitet
- **API-Endpoint**: `/webservices/homeautoswitch.lua` ist korrekt für FRITZ!OS 7.59