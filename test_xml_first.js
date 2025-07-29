#!/usr/bin/env node

/**
 * Test für XML-First Implementierung
 */

const axios = require('axios');
const crypto = require('crypto');
const xml2js = require('xml2js');
const https = require('https');

// Konfiguration
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

// Nachbau der neuen parseDeviceFeatures Funktion
function parseDeviceFeatures(bitmask, device) {
    const features = {};
    
    if (device) {
        // Standard features based on XML elements
        features.hasTemperature = !!device.temperature;
        features.hasSwitch = !!device.switch;
        features.hasPowermeter = !!device.powermeter;
        features.hasThermostat = !!device.hkr;
        features.hasAlarm = !!device.alert;
        features.hasButton = !!device.button;
        features.hasHumidity = !!device.humidity;
        
        // Color/Level control for lights
        features.hasColorControl = !!device.colorcontrol;
        features.hasLevelControl = !!device.levelcontrol;
        features.hasDimmer = features.hasLevelControl || features.hasColorControl;
        
        // Blind/Shutter control
        features.hasBlind = !!device.blind;
        
        // Battery detection
        features.hasBattery = false;
        if (device.battery && device.present === '1') {
            features.hasBattery = true;
        } else if (device.hkr && device.hkr.battery !== undefined && device.present === '1') {
            features.hasBattery = true;
        }
        
        // Find unknown elements
        features.unknownElements = [];
        const knownElements = ['identifier', 'id', 'functionbitmask', 'fwversion', 
                             'manufacturer', 'productname', 'present', 'name', 
                             'txbusy', 'battery', 'batterylow',
                             'temperature', 'switch', 'powermeter', 'hkr', 
                             'alert', 'button', 'humidity', 'colorcontrol', 
                             'levelcontrol', 'blind'];
        
        Object.keys(device).forEach(key => {
            if (!knownElements.includes(key) && typeof device[key] === 'object') {
                features.unknownElements.push(key);
                features[`has${key.charAt(0).toUpperCase() + key.slice(1)}`] = true;
            }
        });
    }
    
    return features;
}

// Generische Wert-Extraktion
function extractAllValues(device) {
    const values = {};
    
    const extractors = {
        temperature: (elem) => ({
            celsius: elem.celsius ? parseInt(elem.celsius) / 10 : null,
            offset: elem.offset ? parseInt(elem.offset) / 10 : 0
        }),
        humidity: (elem) => ({
            percent: elem.rel_humidity ? parseInt(elem.rel_humidity) : null
        }),
        hkr: (elem) => ({
            currentTemp: elem.tist ? parseInt(elem.tist) / 2 : null,
            targetTemp: elem.tsoll ? parseInt(elem.tsoll) / 2 : null,
            battery: elem.battery ? parseInt(elem.battery) : null
        })
    };
    
    Object.keys(device).forEach(key => {
        const element = device[key];
        
        if (typeof element !== 'object' || !element) return;
        
        if (extractors[key]) {
            values[key] = extractors[key](element);
        } else if (!['identifier', 'id', 'functionbitmask', 'fwversion', 
                   'manufacturer', 'productname', 'present', 'name', 
                   'txbusy', 'battery', 'batterylow'].includes(key)) {
            // Generic extraction
            values[key] = {};
            Object.entries(element).forEach(([subKey, subValue]) => {
                if (!isNaN(subValue)) {
                    values[key][subKey] = parseFloat(subValue);
                } else {
                    values[key][subKey] = subValue;
                }
            });
        }
    });
    
    return values;
}

async function getSessionID() {
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

async function main() {
    console.log('=== XML-First Feature Detection Test ===\n');
    
    if (CONFIG.password === 'YOUR_PASSWORD') {
        console.error('FEHLER: Bitte Passwort in CONFIG eintragen!');
        process.exit(1);
    }
    
    try {
        const sid = await getSessionID();
        console.log('✓ Login erfolgreich\n');
        
        const devices = await getDeviceList(sid);
        console.log(`${devices.length} Geräte gefunden\n`);
        
        // Statistiken
        const stats = {
            totalDevices: devices.length,
            devicesWithUnknownElements: 0,
            thermostatsDetected: 0,
            batteriesDetected: 0,
            xmlVsBitmaskMismatches: 0
        };
        
        devices.forEach(device => {
            const bitmask = parseInt(device.functionbitmask) || 0;
            const features = parseDeviceFeatures(bitmask, device);
            const values = extractAllValues(device);
            
            console.log(`\n=== ${device.name} (${device.identifier}) ===`);
            console.log(`Manufacturer: ${device.manufacturer || 'n/a'} | Product: ${device.productname || 'n/a'}`);
            console.log(`Bitmask: ${bitmask} (0x${bitmask.toString(16)}) | Present: ${device.present === '1' ? 'JA' : 'NEIN'}`);
            
            // Features
            console.log('\nErkannte Features (XML-basiert):');
            Object.entries(features).forEach(([key, value]) => {
                if (key !== 'unknownElements' && value === true) {
                    console.log(`  ✓ ${key}`);
                }
            });
            
            // Unbekannte Elemente
            if (features.unknownElements.length > 0) {
                console.log(`\n⚠️  Unbekannte Elemente: ${features.unknownElements.join(', ')}`);
                stats.devicesWithUnknownElements++;
            }
            
            // Werte
            console.log('\nExtrahierte Werte:');
            Object.entries(values).forEach(([element, data]) => {
                console.log(`  ${element}:`, JSON.stringify(data));
            });
            
            // Statistiken
            if (features.hasThermostat) stats.thermostatsDetected++;
            if (features.hasBattery) stats.batteriesDetected++;
            
            // Vergleich mit Bitmask (Legacy)
            const bitmaskHasThermostat = (bitmask & 8192) !== 0;
            if (features.hasThermostat !== bitmaskHasThermostat) {
                console.log(`\n⚠️  XML vs Bitmask Mismatch: Thermostat=${features.hasThermostat} vs Bitmask=${bitmaskHasThermostat}`);
                stats.xmlVsBitmaskMismatches++;
            }
        });
        
        console.log('\n\n=== STATISTIKEN ===');
        console.log(`Geräte gesamt: ${stats.totalDevices}`);
        console.log(`Thermostate erkannt: ${stats.thermostatsDetected}`);
        console.log(`Geräte mit Batterie: ${stats.batteriesDetected}`);
        console.log(`Geräte mit unbekannten Elementen: ${stats.devicesWithUnknownElements}`);
        console.log(`XML vs Bitmask Mismatches: ${stats.xmlVsBitmaskMismatches}`);
        
        console.log('\n✅ XML-First Ansatz:');
        console.log('- Erkennt Features basierend auf tatsächlichen XML-Elementen');
        console.log('- Extrahiert Werte auch von unbekannten Elementen');
        console.log('- Zukunftssicher für neue Fritz!Box Geräte');
        
    } catch (error) {
        console.error('FEHLER:', error.message);
    }
}

main();