# Installation Guide - homebridge-fritz Fork

## ⚠️ Wichtiger Hinweis

Das offizielle NPM-Paket `homebridge-fritz` wird seit Jahren nicht mehr gepflegt und enthält 22 Sicherheitslücken. Dieser Fork behebt alle Sicherheitsprobleme und wird aktiv gewartet.

## 🚀 Installationsmethoden

### Methode 1: NPM direkt von GitHub (Empfohlen)

```bash
# Global für Homebridge
npm install -g glowf1sh/homebridge-fritz

# Oder mit vollem URL
npm install -g https://github.com/glowf1sh/homebridge-fritz

# Für Docker/lokale Installation
npm install glowf1sh/homebridge-fritz
```

### Methode 2: Homebridge Config UI X

1. Öffnen Sie die Homebridge Web-Oberfläche
2. Navigieren Sie zu "Plugins"
3. Deinstallieren Sie ggf. das alte `homebridge-fritz`
4. Klicken Sie auf das Zahnrad-Symbol (⚙️)
5. Wählen Sie "Install Plugin from GitHub URL"
6. Geben Sie ein: `glowf1sh/homebridge-fritz`
7. Klicken Sie "Install"
8. Starten Sie Homebridge neu

### Methode 3: Git Clone

```bash
# Repository klonen
git clone https://github.com/glowf1sh/homebridge-fritz.git
cd homebridge-fritz

# Dependencies installieren
npm install

# Global verfügbar machen
npm link
```

### Methode 4: Package.json Dependency

Fügen Sie zu Ihrer `package.json` hinzu:

```json
{
  "dependencies": {
    "homebridge-fritz": "glowf1sh/homebridge-fritz"
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
      - PACKAGES=glowf1sh/homebridge-fritz
```

### Dockerfile

```dockerfile
FROM homebridge/homebridge:latest
RUN npm install -g glowf1sh/homebridge-fritz
```

## 🔧 Troubleshooting

### Problem: "Cannot find module homebridge-fritz"

**Lösung:**
```bash
# Cache leeren
npm cache clean --force

# Neu installieren
npm install -g glowf1sh/homebridge-fritz
```

### Problem: "Permission denied"

**Lösung:**
```bash
# Mit sudo (nicht empfohlen)
sudo npm install -g glowf1sh/homebridge-fritz

# Besser: NPM prefix ändern
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
npm install -g glowf1sh/homebridge-fritz
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
npm install -g glowf1sh/homebridge-fritz
```

## ✅ Verifikation

Nach der Installation prüfen:

```bash
# Version prüfen
npm list homebridge-fritz

# Sollte zeigen:
# └── homebridge-fritz@1.0.0 (git+https://github.com/glowf1sh/homebridge-fritz.git)

# Homebridge Config prüfen
homebridge -D
```

## 📝 Konfiguration

Die Konfiguration bleibt identisch zum Original. Siehe [README.md](README.md#configuration) für Details.

## 🆘 Hilfe

Bei Problemen:
1. [Issues auf GitHub](https://github.com/glowf1sh/homebridge-fritz/issues)
2. [Homebridge Discord](https://discord.gg/homebridge)
3. Debug-Log erstellen: `homebridge -D`