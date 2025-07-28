# NPM Publishing Guide für homebridge-fritz-new

## Vorbereitung

### 1. NPM Account erstellen (falls noch nicht vorhanden)
```bash
npm adduser
# Oder wenn bereits registriert:
npm login
```

### 2. Sicherstellen dass Sie eingeloggt sind
```bash
npm whoami
```

## Vor dem Publishing

### 1. Tests ausführen
```bash
npm test
```

### 2. Sicherstellen dass keine Sicherheitslücken existieren
```bash
npm audit
# Falls Probleme gefunden werden:
npm audit fix
```

### 3. Version prüfen
Stellen Sie sicher, dass die Version in `package.json` korrekt ist:
- Aktuell: `1.0.0`
- Für Updates: `npm version patch` (1.0.1), `npm version minor` (1.1.0), oder `npm version major` (2.0.0)

### 4. Dry-Run durchführen
Prüfen Sie, welche Dateien veröffentlicht werden:
```bash
npm pack --dry-run
```

Die Ausgabe sollte nur die in `package.json` unter `files` angegebenen Dateien zeigen.

## Publishing

### 1. Erstmaliges Publishing
```bash
npm publish
```

### 2. Updates veröffentlichen
```bash
# Version erhöhen (z.B. patch für Bugfixes)
npm version patch

# Veröffentlichen
npm publish
```

### 3. Beta/Pre-Release Versionen
```bash
# Beta Version setzen
npm version 1.0.1-beta.0

# Mit Beta-Tag veröffentlichen
npm publish --tag beta
```

## Nach dem Publishing

### 1. Überprüfen auf npmjs.com
Besuchen Sie: https://www.npmjs.com/package/homebridge-fritz-new

### 2. Installation testen
```bash
# In einem anderen Verzeichnis:
npm install -g homebridge-fritz-new
```

### 3. GitHub Release erstellen
1. Gehen Sie zu: https://github.com/glowf1sh/homebridge-fritz-new/releases
2. Klicken Sie auf "Create a new release"
3. Tag: `v1.0.0` (oder aktuelle Version)
4. Titel: `v1.0.0 - Major Security Update`
5. Beschreibung: Highlights aus dem Changelog

## Wichtige Hinweise

### Versionierung
Folgen Sie Semantic Versioning (semver):
- **MAJOR** (1.0.0 → 2.0.0): Breaking Changes
- **MINOR** (1.0.0 → 1.1.0): Neue Features (rückwärtskompatibel)
- **PATCH** (1.0.0 → 1.0.1): Bugfixes

### NPM Tags
- `latest`: Standard-Tag für stabile Releases (automatisch)
- `beta`: Für Beta-Versionen
- `next`: Für Entwicklungsversionen

### Scoped Packages
Falls Sie das Paket unter einem Scope veröffentlichen möchten:
```bash
# In package.json:
"name": "@username/homebridge-fritz-new"

# Publishing:
npm publish --access public
```

## Troubleshooting

### "403 Forbidden" Fehler
- Paketname bereits vergeben
- Nicht eingeloggt (`npm login`)
- Keine Berechtigung für Scope

### "402 Payment Required"
- Bei Scoped Packages: `--access public` vergessen

### Dateien fehlen im veröffentlichten Paket
- Prüfen Sie `.npmignore` und `files` in `package.json`
- Führen Sie `npm pack` aus und inspizieren Sie das .tgz Archiv

## Best Practices

1. **Immer Tests vor Publishing ausführen**
2. **README.md aktuell halten** - wird auf npmjs.com angezeigt
3. **CHANGELOG führen** für Nutzer
4. **Git Tag erstellen** für jede Version:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
5. **Keine sensiblen Daten** in veröffentlichten Dateien
6. **Deprecation Warnings** für Breaking Changes in zukünftigen Versionen