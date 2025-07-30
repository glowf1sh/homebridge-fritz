# Fritz!Box Geräte-Analyse Zusammenfassung

Analyse durchgeführt am: 2025-07-30T00:03:01.036Z  
Fritz!Box URL: http://fritz.box

## 1. Gefundene Gerätetypen und deren Eigenschaften

### 1.1 FRITZ!Smart Energy 200 (Schaltbare Steckdose mit Energiemessung)
- **Hersteller**: AVM
- **Firmware**: 04.27
- **Functionbitmask**: 35712 (0x8b80)
- **Anzahl gefunden**: 11 Geräte

**Eigenschaften:**
- Schaltfunktion (ein/aus)
- Energiemessung (Spannung, Leistung, Verbrauch)
- Temperaturmessung
- Modi: manuell, auto
- Lock-Funktionen (devicelock, lock)

### 1.2 FRITZ!Smart Thermo 301 (Heizkörperthermostat)
- **Hersteller**: AVM
- **Firmware**: 05.21 oder 05.23
- **Functionbitmask**: 320 (0x140)
- **Anzahl gefunden**: 9 Geräte (5 offline, 4 online)

**Eigenschaften:**
- Heizkörperregelung (HKR)
- Temperaturmessung
- Batteriebetrieben (mit Batteriestand)
- Modi: Sommer, Urlaub, Adaptive Heizung
- Zeitprogramme (nextchange)
- Fenster-offen-Erkennung
- Boost-Funktion
- Komfort- und Absenktemperatur

### 1.3 FRITZ!DECT Repeater 100
- **Hersteller**: AVM
- **Firmware**: 04.25
- **Functionbitmask**: 1280 (0x500)
- **Anzahl gefunden**: 1 Gerät

**Eigenschaften:**
- Nur Temperaturmessung
- Kein Schalten oder andere Funktionen

### 1.4 Heizungsgruppe
- **Identifier**: grp7546BE-3E79EB17B
- **Functionbitmask**: 4160 (0x1040)
- **Mitglieder**: 9 Thermostate (IDs: 28,26,29,30,31,32,33,34,35)

## 2. XML-Elemente pro Gerätetyp

### FRITZ!Smart Energy 200:
- `switch` - Schaltzustand und Modi
- `simpleonoff` - Vereinfachte Ein/Aus-Funktion
- `powermeter` - Energiemesswerte
- `temperature` - Temperaturwerte

### FRITZ!Smart Thermo 301:
- `temperature` - Aktuelle Temperatur
- `hkr` - Heizkörperregler-Einstellungen

### FRITZ!DECT Repeater 100:
- `temperature` - Nur Temperaturmessung

## 3. Funktionierende Commands

### Für FRITZ!Smart Energy 200:
- ✅ `getswitchstate` - Schaltzustand abrufen (0/1)
- ✅ `getswitchmode` - Modus abrufen (0=auto, 1=manuell)
- ✅ `getswitchpower` - Aktuelle Leistung in mW
- ✅ `getswitchenergy` - Gesamtverbrauch in Wh
- ✅ `gettemperature` - Temperatur in 0,1°C
- ✅ `getbasicdevicestats` - Detaillierte Statistiken

### Für FRITZ!Smart Thermo 301 (online):
- ✅ `gettemperature` - Aktuelle Raumtemperatur
- ✅ `gethkrtsoll` - Soll-Temperatur
- ✅ `gethkrkomfort` - Komforttemperatur
- ✅ `gethkrabsenk` - Absenktemperatur
- ✅ `getbasicdevicestats` - Temperaturverlauf

### Für FRITZ!Smart Thermo 301 (offline):
- ❌ Alle Commands liefern "inval" zurück

### Für FRITZ!DECT Repeater 100:
- ✅ `gettemperature` - Temperatur
- ✅ `getbasicdevicestats` - Temperaturstatistiken

## 4. Besonderheiten und Unterschiede

### Temperatur-Offsets:
- Die meisten Geräte haben offset="0"
- Ausnahmen:
  - "3D Drucker OBEN": offset="-25"
  - "Hermitenzimmer": offset="-50"

### Switch-Modi:
- Die meisten FRITZ!Smart Energy 200 sind im "manuell" Modus
- Nur "Waschmaschine / Trockner" und "Küche UNTEN / Spülmaschine" sind im "auto" Modus

### Device Lock Status:
- Viele Geräte haben `devicelock="1"` - sind also gesperrt
- Einige haben zusätzlich `lock="1"` im switch-Element

### Batteriestatus bei Thermostaten:
- Online-Geräte zeigen Batteriestand (70-90%)
- Offline-Geräte zeigen battery="1" oder "90" aber sind nicht erreichbar

### Heizkörperthermostate Status:
- Alle aktiven Thermostate sind im Sommermodus (`summeractive="1"`)
- Adaptive Heizung ist aktiviert (`adaptiveheatingactive="1"`)
- Einige zeigen errorcode="1" (Hermitenzimmer, Badezimmer UNTEN)

## 5. Functionbitmask Erkenntnisse

Die Functionbitmask codiert die Gerätefähigkeiten als Bitfeld:

### 35712 (0x8b80) - FRITZ!Smart Energy 200:
```
Bit 7  (128):   Temperaturmessung
Bit 9  (512):   Schaltsteckdose
Bit 10 (1024):  SimpleOnOff
Bit 13 (8192):  Powermeter/Energiemessung
Bit 15 (32768): Unbekannt
```

### 320 (0x140) - FRITZ!Smart Thermo 301:
```
Bit 6 (64):  Heizkörperregler (HKR)
Bit 8 (256): Temperaturmessung
```

### 1280 (0x500) - FRITZ!DECT Repeater 100:
```
Bit 8 (256):  Temperaturmessung  
Bit 10 (1024): Unbekannt
```

### 4160 (0x1040) - Heizungsgruppe:
```
Bit 6 (64):   Heizkörperregler
Bit 12 (4096): Gruppe
```

## 6. Neue/unbekannte Features für Homebridge-Fritz

### Bereits unterstützt:
- Schalten (Ein/Aus)
- Energiemessung
- Temperaturmessung
- Heizkörpersteuerung

### Potentiell neue Features:

1. **Erweiterte Statistiken** (`getbasicdevicestats`):
   - Detaillierte Verlaufsdaten für Temperatur, Spannung, Leistung, Energie
   - Verschiedene Zeitintervalle (grid-Parameter)

2. **Switch-Modi**:
   - Unterscheidung zwischen "manuell" und "auto" Modus
   - Lock-Status (devicelock, lock)

3. **Thermostat-Features**:
   - Adaptive Heizung
   - Fenster-offen-Erkennung
   - Boost-Funktion
   - Zeitprogramme (nextchange)
   - Sommer-/Urlaubsmodus
   - Fehlercodes

4. **Gruppensteuerung**:
   - Heizungsgruppen mit mehreren Thermostaten
   - Synchronisierte Steuerung

5. **Batteriestatus**:
   - Prozentuale Batterieladung
   - Batterie-Warnung (batterylow)

6. **Erweiterte Geräteinformationen**:
   - txbusy-Status
   - Firmware-Versionen
   - Hersteller/Produktname

### Empfehlungen für homebridge-fritz:

1. **Batteriestatus** für Thermostate implementieren
2. **Erweiterte Statistiken** als optionales Feature anbieten
3. **Auto-Modus** für Steckdosen unterstützen
4. **Gruppensteuerung** für Thermostate implementieren
5. **Fehlercodes** auswerten und melden
6. **Adaptive Heizung** Status anzeigen
7. **Fenster-offen-Erkennung** in HomeKit integrieren