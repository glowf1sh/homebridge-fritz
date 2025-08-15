# VERSIONSHISTORIE - GELERNTE LEKTIONEN

## v1.0.70 - Priority für Thermostate
**Problem**: Thermostate warteten 2+ Minuten, Schalter reagierten sofort
**Lösung**: `{ priority: 10 }` für alle Thermostat-Commands
**Lektion**: Konsistenz! Wenn Outlets Priority haben, brauchen Thermostate das auch

## v1.0.69 - Performance-Optimierung  
**Problem**: 2-3 Minuten Verzögerung bei Temperaturänderungen
**Lösung**: Queue-Delays von 300ms auf 75ms reduziert (4x schneller)
**Lektion**: Performance-Parameter sind kritisch für User Experience

## v1.0.68 - OFF Mode korrekt
**Problem**: OFF zeigte 253 oder letzte Temperatur
**Lösung**: Bei OFF wird Temperaturwert NICHT aktualisiert
**Lektion**: HomeKit erwartet normale Temperaturwerte, keine API-Werte

## v1.0.65-67 - OFF Mode Versuche
**Problem**: User wollte bei OFF keine Temperatur sehen
**Versuche**: 8°C, letzte Temperatur, 253
**Lektion**: Mehrere Iterationen nötig um richtige Lösung zu finden

## v1.0.64 - Batterie-Fix
**Problem**: Nicht alle Thermostate zeigten Batterie
**Lösung**: Batterie aus XML statt API (Thermostate unterstützen getBatteryCharge nicht)
**Lektion**: Nicht alle Geräte unterstützen alle API-Calls

## WICHTIGSTE ERKENNTNISSE

1. **Test first**: Immer erst testen was wirklich passiert
2. **Priority matters**: User-Actions müssen Vorrang vor Polling haben  
3. **Performance**: Jede ms zählt bei User-Interaktionen
4. **API != HomeKit**: API-Werte nicht direkt an HomeKit durchreichen
5. **Device-Spezifika**: Verschiedene Gerätetypen haben unterschiedliche Fähigkeiten