# Migration Guide - Homebridge 2.x Readiness

## ⚠️ Breaking Change: Node.js 22+ erforderlich

Ab Version 1.0.8 benötigt homebridge-fritz-new mindestens **Node.js 22.0.0** für volle Kompatibilität mit Homebridge 2.x.

### Warum diese Änderung?

1. **Homebridge 2.x Kompatibilität**: Die kommende Homebridge v2 wird Node.js 22+ voraussetzen
2. **Sicherheit**: Nur aktuelle Node.js Versionen erhalten Sicherheitsupdates
3. **Performance**: Moderne V8 Engine bietet bessere Performance
4. **Features**: Neueste JavaScript Features nativ verfügbar

### Überprüfen Sie Ihre Node.js Version

```bash
node --version
```

Die Ausgabe sollte v22.0.0 oder höher sein.

### Node.js aktualisieren

#### Option 1: Mit Node Version Manager (nvm) - Empfohlen

```bash
# nvm installieren (falls noch nicht vorhanden)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Terminal neu starten oder source ausführen
source ~/.bashrc

# Node.js 22 installieren
nvm install 22
nvm use 22
nvm alias default 22
```

#### Option 2: Über Paketmanager

**Ubuntu/Debian:**
```bash
# NodeSource Repository hinzufügen
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**macOS mit Homebrew:**
```bash
brew update
brew upgrade node
# oder falls noch nicht installiert:
brew install node
```

**Windows:**
- Download von [nodejs.org](https://nodejs.org/)
- Installer ausführen
- System neustarten

### Plugin aktualisieren

Nach dem Node.js Update:

```bash
# Global installiert
npm update -g homebridge-fritz-new

# Oder neu installieren
npm uninstall -g homebridge-fritz-new
npm install -g homebridge-fritz-new
```

### Homebridge neustarten

```bash
# Systemd Service
sudo systemctl restart homebridge

# Oder manuell
homebridge
```

### Troubleshooting

#### Problem: "Unsupported engine" Fehler

```
npm ERR! Unsupported engine {
npm ERR!   required: { node: '>=22.0.0' },
npm ERR!   current: { node: 'v18.x.x' }
npm ERR! }
```

**Lösung**: Node.js auf Version 22 oder höher aktualisieren (siehe oben).

#### Problem: Homebridge startet nicht nach Update

1. Logs prüfen:
   ```bash
   sudo journalctl -u homebridge -n 100
   ```

2. Cache löschen:
   ```bash
   rm -rf ~/.homebridge/persist
   rm -rf ~/.homebridge/accessories
   ```

3. Homebridge neu starten

#### Problem: Andere Plugins funktionieren nicht mehr

Einige ältere Plugins könnten mit Node.js 22 inkompatibel sein. Optionen:

1. Plugin-Updates prüfen
2. Plugin-Entwickler kontaktieren
3. Temporär bei Node.js 20 bleiben (nicht empfohlen)

### Rollback (falls nötig)

Falls Sie zu Version 1.x zurückkehren müssen:

```bash
# Mit nvm zu Node.js 18 wechseln
nvm use 18

# Plugin downgraden
npm install -g homebridge-fritz-new@1.0.7
```

### Support

Bei Problemen:
- [GitHub Issues](https://github.com/glowf1sh/homebridge-fritz-new/issues)
- Homebridge Discord Community
- Plugin-Dokumentation

### Vorteile des Updates

- ✅ Bereit für Homebridge 2.x
- ✅ Bessere Performance
- ✅ Aktuelle Sicherheitspatches
- ✅ Moderne JavaScript Features
- ✅ Längerfristiger Support