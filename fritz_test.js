#!/usr/bin/env node

/**
 * Fritz!Box API Test Script
 * 
 * Testet die Fritz!Box API-Kommunikation und identifiziert Probleme
 * Kann auf WSL oder jedem System im gleichen Netzwerk ausgeführt werden
 */

const axios = require('axios');
const crypto = require('crypto');
const xml2js = require('xml2js');
const https = require('https');

// Konfiguration - BITTE ANPASSEN!
const CONFIG = {
    url: 'http://fritz.box',  // oder https://fritz.box oder IP-Adresse
    username: '',              // Fritz!Box Benutzername (oft leer)
    password: 'YOUR_PASSWORD', // Fritz!Box Passwort
    timeout: 15000,           // 15 Sekunden Timeout
    testDevice: ''            // Optional: AIN eines bekannten Geräts zum Testen
};

// Parser für XML-Antworten
const parser = new xml2js.Parser({
    explicitArray: false,
    mergeAttrs: true,
    normalizeTags: true,
    explicitRoot: false
});

// HTTPS Agent für selbstsignierte Zertifikate
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

// MD5 Hash Funktion
function md5(value) {
    return crypto.createHash('md5').update(value, 'utf16le').digest('hex');
}

// Session-ID abrufen
async function getSessionID() {
    console.log('\n=== LOGIN TEST ===');
    console.log(`URL: ${CONFIG.url}`);
    console.log(`Timeout: ${CONFIG.timeout}ms`);
    
    try {
        const axiosConfig = {
            timeout: CONFIG.timeout
        };
        
        if (CONFIG.url.startsWith('https://')) {
            axiosConfig.httpsAgent = httpsAgent;
        }
        
        // Schritt 1: Challenge holen
        console.log('\n1. Hole Challenge...');
        const startTime = Date.now();
        const challengeResponse = await axios.get(`${CONFIG.url}/login_sid.lua`, axiosConfig);
        const challengeTime = Date.now() - startTime;
        console.log(`   ✓ Challenge erhalten in ${challengeTime}ms`);
        
        const challengeData = await parser.parseStringPromise(challengeResponse.data);
        
        if (challengeData.sid && challengeData.sid !== '0000000000000000') {
            console.log('   ✓ Bereits eingeloggt!');
            return challengeData.sid;
        }
        
        const challenge = challengeData.challenge;
        console.log(`   Challenge: ${challenge}`);
        
        // Schritt 2: Response berechnen
        const responseHash = md5(`${challenge}-${CONFIG.password}`);
        const response = `${challenge}-${responseHash}`;
        
        // Schritt 3: Mit Response einloggen
        console.log('\n2. Login mit Response...');
        const loginStart = Date.now();
        const loginResponse = await axios.get(`${CONFIG.url}/login_sid.lua`, {
            ...axiosConfig,
            params: {
                username: CONFIG.username || '',
                response: response
            }
        });
        const loginTime = Date.now() - loginStart;
        console.log(`   ✓ Login-Response in ${loginTime}ms`);
        
        const loginData = await parser.parseStringPromise(loginResponse.data);
        
        if (!loginData.sid || loginData.sid === '0000000000000000') {
            throw new Error('Login fehlgeschlagen - falsche Zugangsdaten?');
        }
        
        console.log(`   ✓ Session ID: ${loginData.sid.substring(0, 8)}...`);
        return loginData.sid;
        
    } catch (error) {
        console.error('   ✗ Login fehlgeschlagen:', error.message);
        if (error.code) console.error(`   Error Code: ${error.code}`);
        throw error;
    }
}

// API-Call durchführen
async function apiCall(sid, command, ain = null) {
    const params = {
        sid: sid,
        switchcmd: command
    };
    
    if (ain) {
        params.ain = ain;
    }
    
    const axiosConfig = {
        params: params,
        timeout: CONFIG.timeout
    };
    
    if (CONFIG.url.startsWith('https://')) {
        axiosConfig.httpsAgent = httpsAgent;
    }
    
    const response = await axios.get(`${CONFIG.url}/webservices/homeautoswitch.lua`, axiosConfig);
    return response.data;
}

// Test einzelner API-Call
async function testSingleCall(sid) {
    console.log('\n=== EINZELNER API-CALL TEST ===');
    
    try {
        console.log('Hole Geräteliste...');
        const startTime = Date.now();
        const response = await apiCall(sid, 'getdevicelistinfos');
        const duration = Date.now() - startTime;
        
        console.log(`✓ Antwort in ${duration}ms erhalten`);
        
        // Parse XML
        const devices = await parser.parseStringPromise(response);
        const deviceList = devices.device ? (Array.isArray(devices.device) ? devices.device : [devices.device]) : [];
        
        console.log(`✓ ${deviceList.length} Geräte gefunden`);
        
        // Zeige Geräte
        deviceList.forEach(device => {
            console.log(`  - ${device.name} (${device.identifier})`);
            if (device.switch) console.log('    → Steckdose');
            if (device.temperature) console.log('    → Temperatursensor');
            if (device.hkr) console.log('    → Thermostat');
        });
        
        return deviceList;
        
    } catch (error) {
        console.error('✗ API-Call fehlgeschlagen:', error.message);
        throw error;
    }
}

// Test parallele Requests (simuliert das Problem)
async function testParallelRequests(sid, count = 20) {
    console.log(`\n=== PARALLELE REQUESTS TEST (${count} gleichzeitig) ===`);
    
    const requests = [];
    const results = {
        success: 0,
        failed: 0,
        errors: {}
    };
    
    // Starte alle Requests gleichzeitig
    console.log(`Starte ${count} parallele Requests...`);
    const startTime = Date.now();
    
    for (let i = 0; i < count; i++) {
        requests.push(
            apiCall(sid, 'getdevicelistinfos')
                .then(() => {
                    results.success++;
                })
                .catch(error => {
                    results.failed++;
                    const errorKey = error.code || error.message;
                    results.errors[errorKey] = (results.errors[errorKey] || 0) + 1;
                })
        );
    }
    
    await Promise.all(requests);
    const duration = Date.now() - startTime;
    
    console.log(`\nErgebnisse nach ${duration}ms:`);
    console.log(`  ✓ Erfolgreich: ${results.success}`);
    console.log(`  ✗ Fehlgeschlagen: ${results.failed}`);
    
    if (Object.keys(results.errors).length > 0) {
        console.log('\nFehlertypen:');
        for (const [error, count] of Object.entries(results.errors)) {
            console.log(`  - ${error}: ${count}x`);
        }
    }
    
    return results;
}

// Test Session-Gültigkeit über Zeit
async function testSessionValidity(sid) {
    console.log('\n=== SESSION-GÜLTIGKEITS-TEST ===');
    
    const testMinutes = 2;
    const interval = 30; // Sekunden
    
    console.log(`Teste Session-Gültigkeit über ${testMinutes} Minuten...`);
    console.log(`Test alle ${interval} Sekunden\n`);
    
    for (let i = 0; i <= testMinutes * 60; i += interval) {
        try {
            const startTime = Date.now();
            const response = await apiCall(sid, 'getswitchlist');
            const duration = Date.now() - startTime;
            
            const timestamp = new Date().toLocaleTimeString();
            console.log(`[${timestamp}] ✓ Session gültig (${duration}ms)`);
            
            if (i < testMinutes * 60) {
                await new Promise(resolve => setTimeout(resolve, interval * 1000));
            }
        } catch (error) {
            console.error(`[${new Date().toLocaleTimeString()}] ✗ Session ungültig:`, error.message);
            return false;
        }
    }
    
    return true;
}

// Test spezifisches Gerät
async function testDeviceCommands(sid, ain) {
    console.log(`\n=== GERÄTE-KOMMANDO TEST (${ain}) ===`);
    
    const commands = [
        'getswitchstate',
        'getswitchpower',
        'gettemperature',
        'gethkrtsoll',
        'getbatterycharge'
    ];
    
    for (const cmd of commands) {
        try {
            const startTime = Date.now();
            const response = await apiCall(sid, cmd, ain);
            const duration = Date.now() - startTime;
            
            console.log(`✓ ${cmd}: ${response.toString().trim()} (${duration}ms)`);
        } catch (error) {
            console.log(`✗ ${cmd}: ${error.message}`);
        }
    }
}

// Hauptfunktion
async function main() {
    console.log('Fritz!Box API Test Script');
    console.log('========================\n');
    
    if (CONFIG.password === 'YOUR_PASSWORD') {
        console.error('FEHLER: Bitte Passwort in CONFIG eintragen!');
        process.exit(1);
    }
    
    try {
        // Login
        const sid = await getSessionID();
        
        // Einzelner Call
        const devices = await testSingleCall(sid);
        
        // Parallele Requests testen
        await testParallelRequests(sid, 20);
        
        // Session-Gültigkeit testen
        await testSessionValidity(sid);
        
        // Gerät testen falls vorhanden
        if (CONFIG.testDevice) {
            await testDeviceCommands(sid, CONFIG.testDevice);
        } else if (devices.length > 0) {
            // Teste erstes Gerät
            await testDeviceCommands(sid, devices[0].identifier);
        }
        
        console.log('\n=== TESTS ABGESCHLOSSEN ===');
        
    } catch (error) {
        console.error('\nFEHLER:', error.message);
        process.exit(1);
    }
}

// Script ausführen
main();