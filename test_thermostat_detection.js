#!/usr/bin/env node

/**
 * Test für Thermostat-Erkennung
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

async function getDeviceDetails(sid) {
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
    return response.data;
}

async function main() {
    console.log('Fritz!Box Thermostat Detection Test\n');
    
    if (CONFIG.password === 'YOUR_PASSWORD') {
        console.error('FEHLER: Bitte Passwort in CONFIG eintragen!');
        process.exit(1);
    }
    
    try {
        const sid = await getSessionID();
        console.log('✓ Login erfolgreich\n');
        
        // Hole RAW XML Daten
        console.log('Hole Device Details als XML...\n');
        const xmlData = await getDeviceDetails(sid);
        
        // Parse XML
        const devices = await parser.parseStringPromise(xmlData);
        const deviceList = devices.device ? (Array.isArray(devices.device) ? devices.device : [devices.device]) : [];
        
        console.log('=== THERMOSTAT-ANALYSE ===\n');
        
        // Analysiere alle Geräte mit Bitmask 320
        const suspectedThermostats = deviceList.filter(d => {
            const bitmask = parseInt(d.functionbitmask) || 0;
            return bitmask === 320 || (d.identifier && d.identifier.startsWith('09995'));
        });
        
        console.log(`Gefundene verdächtige Thermostate: ${suspectedThermostats.length}\n`);
        
        for (const device of suspectedThermostats) {
            console.log(`\nGerät: ${device.name} (${device.identifier})`);
            console.log(`Bitmask: ${device.functionbitmask}`);
            console.log(`Manufacturer: ${device.manufacturer || 'nicht angegeben'}`);
            console.log(`Productname: ${device.productname || 'nicht angegeben'}`);
            console.log(`Firmware: ${device.fwversion || 'nicht angegeben'}`);
            
            // Prüfe auf HKR-Eigenschaften
            if (device.hkr) {
                console.log('\n✓ HAT HKR-EIGENSCHAFTEN:');
                console.log(`  - tist: ${device.hkr.tist || 'n/a'}`);
                console.log(`  - tsoll: ${device.hkr.tsoll || 'n/a'}`);
                console.log(`  - battery: ${device.hkr.battery || 'n/a'}`);
                console.log(`  - batterylow: ${device.hkr.batterylow || 'n/a'}`);
            } else {
                console.log('\n✗ KEINE HKR-EIGENSCHAFTEN GEFUNDEN');
            }
            
            // Zeige vollständige Device-Struktur
            console.log('\nVollständige Struktur:');
            console.log(JSON.stringify(device, null, 2));
        }
        
        // Zeige auch normale Thermostate zum Vergleich
        console.log('\n\n=== VERGLEICH MIT ANDEREN GERÄTEN ===\n');
        
        const normalThermostats = deviceList.filter(d => {
            const bitmask = parseInt(d.functionbitmask) || 0;
            return (bitmask & 8192) !== 0; // Bit 13 gesetzt
        });
        
        if (normalThermostats.length > 0) {
            console.log(`Geräte mit korrektem Thermostat-Bit: ${normalThermostats.length}`);
            for (const device of normalThermostats) {
                console.log(`\n${device.name} (${device.identifier})`);
                console.log(`Bitmask: ${device.functionbitmask} (enthält Bit 13)`);
            }
        } else {
            console.log('Keine Geräte mit gesetztem Thermostat-Bit (8192) gefunden!');
        }
        
    } catch (error) {
        console.error('FEHLER:', error.message);
    }
}

main();