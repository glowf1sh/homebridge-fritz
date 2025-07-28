# Installation Guide - homebridge-fritz-new

## ⚠️ Wichtiger Hinweis: Warum homebridge-fritz-new?

Das originale NPM-Paket `homebridge-fritz` von @andig wird seit 2019 nicht mehr gepflegt:
- Letzte Veröffentlichung: 2019
- 22 bekannte Sicherheitslücken (4 kritisch!)
- Keine Reaktion auf Issues oder Pull Requests
- Inkompatibel mit aktuellen Node.js Versionen

`homebridge-fritz-new` ist der aktiv gewartete Nachfolger mit allen Sicherheitsproblemen behoben.

## 🚀 Installationsmethoden

### Methode 1: NPM Installation (Empfohlen)

```bash
# Global für Homebridge
npm install -g homebridge-fritz-new

# Für Docker/lokale Installation
npm install homebridge-fritz-new
```

### Methode 2: Homebridge Config UI X

1. Öffnen Sie die Homebridge Web-Oberfläche
2. Navigieren Sie zu "Plugins"
3. Deinstallieren Sie ggf. das alte `homebridge-fritz`
4. Suchen Sie nach `homebridge-fritz-new`
5. Klicken Sie auf "Install"
7. Klicken Sie "Install"
8. Starten Sie Homebridge neu

### Methode 3: Git Clone (Entwicklung/Testing)

#### Für Standard-NPM:
```bash
# In Homebridge node_modules Verzeichnis wechseln
cd /var/lib/homebridge/node_modules

# Repository klonen
git clone https://github.com/glowf1sh/homebridge-fritz-new.git
cd homebridge-fritz-new

# Dependencies installieren
npm install

# Package erstellen und installieren
npm pack
npm install -g ./homebridge-fritz-new-*.tgz
```

#### Für Homebridge-Service:
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

# In Homebridge installieren
npm --prefix "/var/lib/homebridge" install ./homebridge-fritz-new-*.tgz

# Homebridge neustarten
sudo systemctl restart homebridge
```

#### Für hb-service:
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

# Mit hb-service installieren
hb-service add ./homebridge-fritz-new-*.tgz
```

### Methode 4: Package.json Dependency

Fügen Sie zu Ihrer `package.json` hinzu:

```json
{
  "dependencies": {
    "homebridge-fritz-new": "^1.0.0"
  }
}
```

Dann:
```bash
npm install
```

## 🔄 Migration vom alten Paket

### Schritt 1: Altes Paket entfernen

```bash
# Global installiert
npm uninstall -g homebridge-fritz

# Lokal installiert
npm uninstall homebridge-fritz

# Cache leeren (optional)
npm cache clean --force
```

### Schritt 2: Fork installieren

Wählen Sie eine der oben genannten Methoden.

### Schritt 3: Homebridge neustarten

```bash
# Systemd
sudo systemctl restart homebridge

# Oder direkt
homebridge
```

## 🐳 Docker Installation

### Docker Compose

```yaml
version: '3'
services:
  homebridge:
    image: homebridge/homebridge:latest
    volumes:
      - ./homebridge:/homebridge
    environment:
      - PACKAGES=homebridge-fritz-new
```

### Dockerfile

```dockerfile
FROM homebridge/homebridge:latest
RUN npm install -g homebridge-fritz-new
```

## 🔧 Troubleshooting

### Problem: "Cannot find module homebridge-fritz"

**Lösung:**
```bash
# Cache leeren
npm cache clean --force

# Neu installieren
npm install -g homebridge-fritz-new
```

### Problem: "Permission denied"

**Lösung:**
```bash
# Mit sudo (nicht empfohlen)
sudo npm install -g homebridge-fritz-new

# Besser: NPM prefix ändern
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
npm install -g homebridge-fritz-new
```

### Problem: Alte Version wird noch verwendet

**Lösung:**
```bash
# Prüfen welche Version läuft
npm list -g homebridge-fritz

# Pfad zur Installation finden
npm root -g

# Manuell entfernen falls nötig
rm -rf $(npm root -g)/homebridge-fritz

# Neu installieren
npm install -g homebridge-fritz-new
```

## ✅ Verifikation

Nach der Installation prüfen:

```bash
# Version prüfen
npm list homebridge-fritz

# Sollte zeigen:
# └── homebridge-fritz-new@1.0.0

# Homebridge Config prüfen
homebridge -D
```

## 📝 Konfiguration

Die Konfiguration bleibt identisch zum Original. Siehe [README.md](README.md#configuration) für Details.

## 🆘 Hilfe

Bei Problemen:
1. [Issues auf GitHub](https://github.com/glowf1sh/homebridge-fritz-new/issues)
2. [Homebridge Discord](https://discord.gg/homebridge)
3. Debug-Log erstellen: `homebridge -D`