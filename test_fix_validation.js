#!/usr/bin/env node

/**
 * Test-Script zur Validierung der Fixes
 * Prüft ob die Feature-Erkennung und API-Calls korrekt funktionieren
 */

const axios = require('axios');
const crypto = require('crypto');
const xml2js = require('xml2js');
const https = require('https');

// Konfiguration - BITTE ANPASSEN!
const CONFIG = {
    url: 'http://fritz.box',
    username: '',
    password: 'YOUR_PASSWORD',
    timeout: 15000
};

const parser = new xml2js.Parser({
    explicitArray: false,
    mergeAttrs: true,
    normalizeTags: true,
    explicitRoot: false
});

const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

function md5(value) {
    return crypto.createHash('md5').update(value, 'utf16le').digest('hex');
}

// Nachbau der parseDeviceFeatures mit Fix
function parseDeviceFeatures(bitmask, device) {
    const features = {
        hasAlarm:          (bitmask & 64)    !== 0,
        hasTemperature:    (bitmask & 256)   !== 0,
        hasSwitch:         (bitmask & 512)   !== 0,
        hasDimmer:         (bitmask & 1024)  !== 0,
        hasPowermeter:     (bitmask & 2048)  !== 0,
        hasThermostat:     (bitmask & 8192)  !== 0,
        hasBlind:          (bitmask & 16384) !== 0,
        hasHANFUN:         (bitmask & 32768) !== 0
    };

    // FIX: Fritz!Smart Thermo 301 meldet sich mit falscher Bitmask!
    if (!features.hasThermostat && device && device.hkr) {
        features.hasThermostat = true;
    }

    // FIX: Thermostate haben Batterie - aber nur wenn erreichbar
    features.hasBattery = features.hasThermostat && device && device.present === '1';

    return features;
}

async function getSessionID() {
    try {
        const axiosConfig = { timeout: CONFIG.timeout };
        if (CONFIG.url.startsWith('https://')) {
            axiosConfig.httpsAgent = httpsAgent;
        }
        
        const challengeResponse = await axios.get(`${CONFIG.url}/login_sid.lua`, axiosConfig);
        const challengeData = await parser.parseStringPromise(challengeResponse.data);
        
        if (challengeData.sid && challengeData.sid !== '0000000000000000') {
            return challengeData.sid;
        }
        
        const challenge = challengeData.challenge;
        const responseHash = md5(`${challenge}-${CONFIG.password}`);
        const response = `${challenge}-${responseHash}`;
        
        const loginResponse = await axios.get(`${CONFIG.url}/login_sid.lua`, {
            ...axiosConfig,
            params: {
                username: CONFIG.username || '',
                response: response
            }
        });
        
        const loginData = await parser.parseStringPromise(loginResponse.data);
        
        if (!loginData.sid || loginData.sid === '0000000000000000') {
            throw new Error('Login fehlgeschlagen');
        }
        
        return loginData.sid;
        
    } catch (error) {
        console.error('Login fehlgeschlagen:', error.message);
        throw error;
    }
}

async function getDeviceList(sid) {
    const axiosConfig = {
        params: {
            sid: sid,
            switchcmd: 'getdevicelistinfos'
        },
        timeout: CONFIG.timeout
    };
    
    if (CONFIG.url.startsWith('https://')) {
        axiosConfig.httpsAgent = httpsAgent;
    }
    
    const response = await axios.get(`${CONFIG.url}/webservices/homeautoswitch.lua`, axiosConfig);
    const devices = await parser.parseStringPromise(response.data);
    
    return devices.device ? (Array.isArray(devices.device) ? devices.device : [devices.device]) : [];
}

async function testAPICall(sid, cmd, ain) {
    try {
        const axiosConfig = {
            params: {
                sid: sid,
                switchcmd: cmd,
                ain: ain
            },
            timeout: CONFIG.timeout
        };
        
        if (CONFIG.url.startsWith('https://')) {
            axiosConfig.httpsAgent = httpsAgent;
        }
        
        const response = await axios.get(`${CONFIG.url}/webservices/homeautoswitch.lua`, axiosConfig);
        return { success: true, data: response.data.toString().trim() };
    } catch (error) {
        return { success: false, error: error.response ? error.response.status : error.message };
    }
}

// Simuliere getBatteryCharge mit Fix
async function getBatteryChargeFixed(sid, ain, device) {
    // Wenn nicht erreichbar, gar nicht erst versuchen
    if (device.present !== '1') {
        return { skipped: true, reason: 'Gerät nicht erreichbar' };
    }
    
    // Versuche Battery aus HKR zu lesen (wie im Fix)
    if (device.hkr && device.hkr.battery !== undefined) {
        return { success: true, data: device.hkr.battery, source: 'HKR-Element' };
    }
    
    // Fallback: API-Call
    const result = await testAPICall(sid, 'getbatterycharge', ain);
    if (result.success) {
        return { success: true, data: result.data, source: 'API-Call' };
    }
    
    return { success: false, error: result.error };
}

async function main() {
    console.log('=== Fritz!Box Fix Validation Test ===\n');
    
    if (CONFIG.password === 'YOUR_PASSWORD') {
        console.error('FEHLER: Bitte Passwort in CONFIG eintragen!');
        process.exit(1);
    }
    
    try {
        // Login
        const sid = await getSessionID();
        console.log('✓ Login erfolgreich\n');
        
        // Geräteliste holen
        const devices = await getDeviceList(sid);
        
        // Statistiken
        let stats = {
            totalDevices: 0,
            thermostatsWithWrongBitmask: 0,
            fixedThermostats: 0,
            batterySkipped: 0,
            batteryFromHKR: 0,
            errors: []
        };
        
        console.log('=== GERÄTE-ANALYSE ===\n');
        
        for (const device of devices) {
            const bitmask = parseInt(device.functionbitmask) || 0;
            const ain = device.identifier;
            
            // Feature-Erkennung OHNE Fix
            const featuresOld = {
                hasThermostat: (bitmask & 8192) !== 0,
                hasBattery: (bitmask & 8192) !== 0
            };
            
            // Feature-Erkennung MIT Fix
            const featuresNew = parseDeviceFeatures(bitmask, device);
            
            // Nur interessante Geräte zeigen
            if (featuresOld.hasThermostat !== featuresNew.hasThermostat || 
                device.hkr || 
                ain.startsWith('09995')) {
                
                console.log(`\n${device.name} (${ain})`);
                console.log(`Bitmask: ${bitmask} | Erreichbar: ${device.present === '1' ? 'JA' : 'NEIN'}`);
                
                if (device.hkr) {
                    stats.totalDevices++;
                    
                    // War es ein falsch gemeldetes Thermostat?
                    if (!featuresOld.hasThermostat && featuresNew.hasThermostat) {
                        console.log('⚠️  FALSCHE BITMASK! Thermostat nicht in Bitmask erkannt');
                        console.log('✅  FIX: HKR-Element gefunden → als Thermostat erkannt');
                        stats.thermostatsWithWrongBitmask++;
                        stats.fixedThermostats++;
                    }
                    
                    // Battery-Test
                    console.log('\nBattery-Handling:');
                    console.log(`  ALT: hasBattery = ${featuresOld.hasBattery}`);
                    console.log(`  NEU: hasBattery = ${featuresNew.hasBattery}`);
                    
                    if (featuresNew.hasBattery) {
                        const batteryResult = await getBatteryChargeFixed(sid, ain, device);
                        
                        if (batteryResult.skipped) {
                            console.log(`  → Battery-Abfrage übersprungen: ${batteryResult.reason}`);
                            stats.batterySkipped++;
                        } else if (batteryResult.success) {
                            console.log(`  ✓ Battery: ${batteryResult.data}% (aus ${batteryResult.source})`);
                            if (batteryResult.source === 'HKR-Element') {
                                stats.batteryFromHKR++;
                            }
                        } else {
                            console.log(`  ✗ Battery-Fehler: ${batteryResult.error}`);
                            stats.errors.push(`${ain}: ${batteryResult.error}`);
                        }
                    } else {
                        console.log('  → Keine Battery-Abfrage (Gerät nicht erreichbar)');
                        stats.batterySkipped++;
                    }
                }
            }
        }
        
        console.log('\n\n=== ZUSAMMENFASSUNG ===\n');
        console.log(`Thermostate mit falscher Bitmask: ${stats.thermostatsWithWrongBitmask}`);
        console.log(`Davon durch HKR-Fix erkannt: ${stats.fixedThermostats}`);
        console.log(`Battery-Abfragen übersprungen: ${stats.batterySkipped}`);
        console.log(`Battery aus HKR gelesen: ${stats.batteryFromHKR}`);
        
        if (stats.errors.length > 0) {
            console.log(`\nFehler: ${stats.errors.length}`);
            stats.errors.forEach(err => console.log(`  - ${err}`));
        }
        
        console.log('\n✅ ERWARTETES ERGEBNIS:');
        console.log('- Alle Fritz!Smart Thermo 301 werden trotz Bitmask 320 erkannt');
        console.log('- Battery nur bei erreichbaren Thermostaten abgefragt');
        console.log('- Battery-Werte kommen aus HKR-Element');
        console.log('- Keine HTTP 400/500 Fehler mehr');
        
    } catch (error) {
        console.error('FEHLER:', error.message);
    }
}

main();