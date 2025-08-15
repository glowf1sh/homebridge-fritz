# NÜTZLICHE DEBUG-BEFEHLE FÜR HOMEBRIDGE-FRITZ

## 1. FRITZ!BOX API DIREKT TESTEN

```bash
# Session ID holen
curl -s "http://fritz.box/login_sid.lua" | grep -o '<SID>[^<]*</SID>'

# Mit Credentials einloggen
CHALLENGE=$(curl -s "http://fritz.box/login_sid.lua" | grep -o '<Challenge>[^<]*</Challenge>' | sed 's/<[^>]*>//g')
RESPONSE=$(echo -n "$CHALLENGE-deinpasswort" | iconv -t UTF-16LE | md5sum | cut -d' ' -f1)
SID=$(curl -s "http://fritz.box/login_sid.lua?username=&response=$CHALLENGE-$RESPONSE" | grep -o '<SID>[^<]*</SID>' | sed 's/<[^>]*>//g')

# Alle Geräte abrufen
curl -s "http://fritz.box/webservices/homeautoswitch.lua?sid=$SID&switchcmd=getdevicelistinfos" | xmllint --format -

# Thermostat-Temperatur abfragen
curl -s "http://fritz.box/webservices/homeautoswitch.lua?sid=$SID&switchcmd=gethkrtsoll&ain=09995%200006205"

# Temperatur setzen (z.B. 21°C = 42)
curl -s "http://fritz.box/webservices/homeautoswitch.lua?sid=$SID&switchcmd=sethkrtsoll&ain=09995%200006205&param=42"
```

## 2. HOMEBRIDGE LOGS

```bash
# Live logs
sudo journalctl -fu homebridge

# Nur Errors
sudo journalctl -fu homebridge | grep -E "(error|Error|ERROR)"

# Nur FRITZ!Box Plugin
sudo journalctl -fu homebridge | grep "FRITZ"

# Mit Timestamps
sudo journalctl -fu homebridge -o short-precise
```

## 3. NPM UND VERSIONEN

```bash
# Aktuelle Version prüfen
npm list homebridge-fritz-new

# Global installierte Version
npm list -g homebridge-fritz-new

# Update installieren
npm update -g homebridge-fritz-new

# Cache löschen bei Problemen
npm cache clean --force
```

## 4. HOMEBRIDGE CONFIG

```bash
# Config anzeigen
cat /var/lib/homebridge/config.json | jq '.platforms[] | select(.platform == "FRITZ!Box")'

# Config validieren
node -e "console.log(JSON.parse(require('fs').readFileSync('/var/lib/homebridge/config.json')))"

# Backup erstellen
cp /var/lib/homebridge/config.json /var/lib/homebridge/config.json.backup.$(date +%Y%m%d_%H%M%S)
```

## 5. QUICK TEST SCRIPTS

### Batterie-Status aller Thermostate
```javascript
const devices = await fritz('getdevicelistinfos');
devices.device.filter(d => d.hkr).forEach(d => {
    console.log(`${d.name}: Battery ${d.battery}% ${d.batterylow === '1' ? 'LOW!' : 'OK'}`);
});
```

### Performance Test
```javascript
console.time('API Call');
await fritz('gethkrtsoll', ain);
console.timeEnd('API Call');
```

### Offline Geräte finden
```javascript
const devices = await fritz('getdevicelistinfos');
devices.device.filter(d => d.present !== '1').forEach(d => {
    console.log(`OFFLINE: ${d.name} (${d.identifier})`);
});
```

## 6. HOMEKIT CACHE LÖSCHEN

```bash
# Homebridge stoppen
sudo systemctl stop homebridge

# Cache löschen
rm -rf /var/lib/homebridge/persist
rm -rf /var/lib/homebridge/accessories

# Homebridge starten
sudo systemctl start homebridge
```

## 7. GIT WORKFLOW

```bash
# Sauberer Commit ohne KI-Referenzen
git add .
git commit -m "Version X.Y.Z: Beschreibung

- Feature 1
- Feature 2"

# Tag erstellen
git tag vX.Y.Z

# NPM publish
npm version patch  # oder minor/major
npm publish

# GitHub Release
gh release create vX.Y.Z --title "Version X.Y.Z: Titel" --notes "Beschreibung"
```

## 8. PROBLEM-DIAGNOSE

### Thermostat reagiert nicht
1. Check ob online: `present === '1'`
2. Check AIN Format: Mit Leerzeichen!
3. Check Batterie: `battery` < 20%
4. Check API Response

### Verzögerungen
1. Check platform.js: `interval` setting
2. Check fritz-api.js: `queueDelay`
3. Check Netzwerk-Latenz zur FRITZ!Box

### HomeKit zeigt Service nicht
1. Initial values gesetzt?
2. Service korrekt registriert?
3. Cache löschen und neu pairen