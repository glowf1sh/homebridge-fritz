#!/usr/bin/env node

/**
 * Test-Script um die functionbitmask und Features zu prüfen
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

function parseDeviceFeatures(bitmask) {
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
    
    // Thermostate haben immer eine Batterie
    features.hasBattery = features.hasThermostat;
    
    return features;
}

async function getSessionID() {
    try {
        const axiosConfig = {
            timeout: CONFIG.timeout
        };
        
        if (CONFIG.url.startsWith('https://')) {
            axiosConfig.httpsAgent = httpsAgent;
        }
        
        // Challenge holen
        const challengeResponse = await axios.get(`${CONFIG.url}/login_sid.lua`, axiosConfig);
        const challengeData = await parser.parseStringPromise(challengeResponse.data);
        
        if (challengeData.sid && challengeData.sid !== '0000000000000000') {
            return challengeData.sid;
        }
        
        const challenge = challengeData.challenge;
        const responseHash = md5(`${challenge}-${CONFIG.password}`);
        const response = `${challenge}-${responseHash}`;
        
        // Login
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

async function main() {
    console.log('Fritz!Box Feature Test\n');
    
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
        console.log(`${devices.length} Geräte gefunden:\n`);
        
        // Für jedes Gerät
        for (const device of devices) {
            const bitmask = parseInt(device.functionbitmask) || 0;
            const features = parseDeviceFeatures(bitmask);
            const ain = device.identifier;
            
            console.log(`\n=== ${device.name} (${ain}) ===`);
            console.log(`Bitmask: ${bitmask} (0x${bitmask.toString(16)})`);
            console.log('Features:');
            Object.entries(features).forEach(([key, value]) => {
                if (value) console.log(`  ✓ ${key}`);
            });
            
            // API-Tests basierend auf Features
            console.log('\nAPI-Tests:');
            
            // Temperatur
            if (features.hasTemperature) {
                const result = await testAPICall(sid, 'gettemperature', ain);
                console.log(`  gettemperature: ${result.success ? `✓ ${result.data}` : `✗ ${result.error}`}`);
            }
            
            // Schalter
            if (features.hasSwitch) {
                const result = await testAPICall(sid, 'getswitchstate', ain);
                console.log(`  getswitchstate: ${result.success ? `✓ ${result.data}` : `✗ ${result.error}`}`);
            }
            
            // Thermostat
            if (features.hasThermostat) {
                const result = await testAPICall(sid, 'gethkrtsoll', ain);
                console.log(`  gethkrtsoll: ${result.success ? `✓ ${result.data}` : `✗ ${result.error}`}`);
            }
            
            // Batterie (nur wenn Thermostat)
            if (features.hasBattery) {
                const result = await testAPICall(sid, 'getbatterycharge', ain);
                console.log(`  getbatterycharge: ${result.success ? `✓ ${result.data}` : `✗ ${result.error}`}`);
            }
            
            // Teste FALSCHE Befehle
            console.log('\nTest falscher Befehle:');
            
            // Thermostat-Befehl auf Nicht-Thermostat
            if (!features.hasThermostat) {
                const result = await testAPICall(sid, 'gethkrtsoll', ain);
                console.log(`  gethkrtsoll (sollte fehlschlagen): ${result.success ? `✗ Erfolg! ${result.data}` : `✓ Fehler ${result.error}`}`);
            }
            
            // Batterie-Befehl auf Gerät ohne Batterie
            if (!features.hasBattery) {
                const result = await testAPICall(sid, 'getbatterycharge', ain);
                console.log(`  getbatterycharge (sollte fehlschlagen): ${result.success ? `✗ Erfolg! ${result.data}` : `✓ Fehler ${result.error}`}`);
            }
        }
        
    } catch (error) {
        console.error('FEHLER:', error.message);
    }
}

main();