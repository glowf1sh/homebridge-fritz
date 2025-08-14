#!/usr/bin/env node

/**
 * Diagnostic script for FRITZ!Box thermostat battery status in Homebridge
 * This script checks why some thermostats don't show battery in HomeKit
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { parseString } = require('xml2js');
const crypto = require('crypto');

// Configuration
const CONFIG = {
    username: 'Username',
    password: 'Password', 
    url: 'http://fritz.box',
    homebridgePath: '/var/lib/homebridge'
};

// ANSI color codes for output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = '') {
    console.log(color + message + colors.reset);
}

function header(message) {
    console.log('\n' + colors.bright + colors.blue + '=' .repeat(60) + colors.reset);
    console.log(colors.bright + colors.blue + message + colors.reset);
    console.log(colors.bright + colors.blue + '=' .repeat(60) + colors.reset);
}

// FRITZ!Box API functions
async function getSessionID() {
    try {
        const response = await axios.get(`${CONFIG.url}/login_sid.lua`);
        const loginXML = response.data;
        
        return new Promise((resolve, reject) => {
            parseString(loginXML, (err, result) => {
                if (err) return reject(err);
                const challenge = result.SessionInfo.Challenge[0];
                const challengeResponse = challenge + '-' + crypto.createHash('md5')
                    .update(Buffer.from(challenge + '-' + CONFIG.password, 'utf16le'))
                    .digest('hex');
                
                axios.get(`${CONFIG.url}/login_sid.lua?username=${CONFIG.username}&response=${challengeResponse}`)
                    .then(response => {
                        parseString(response.data, (err, result) => {
                            if (err) return reject(err);
                            const sid = result.SessionInfo.SID[0];
                            if (sid === '0000000000000000') {
                                reject(new Error('Login failed - check credentials'));
                            } else {
                                resolve(sid);
                            }
                        });
                    })
                    .catch(reject);
            });
        });
    } catch (error) {
        throw new Error(`Failed to connect to FRITZ!Box: ${error.message}`);
    }
}

async function getDeviceListInfos(sid) {
    const response = await axios.get(`${CONFIG.url}/webservices/homeautoswitch.lua?switchcmd=getdevicelistinfos&sid=${sid}`);
    
    return new Promise((resolve, reject) => {
        parseString(response.data, { explicitArray: false }, (err, result) => {
            if (err) return reject(err);
            
            let devices = result.devicelist?.device || [];
            if (!Array.isArray(devices)) {
                devices = [devices];
            }
            
            resolve(devices);
        });
    });
}

async function getBatteryCharge(sid, ain) {
    try {
        const response = await axios.get(`${CONFIG.url}/webservices/homeautoswitch.lua?ain=${ain}&switchcmd=getbatterycharge&sid=${sid}`);
        const data = response.data.toString().trim();
        
        if (data === 'inval' || data === '') {
            return null;
        }
        
        const battery = parseInt(data);
        return isNaN(battery) ? null : battery;
    } catch (error) {
        return null;
    }
}

// Homebridge cache functions
function getHomebridgeCachedAccessories() {
    const cacheFile = path.join(CONFIG.homebridgePath, 'persist/cachedAccessories');
    
    if (!fs.existsSync(cacheFile)) {
        return [];
    }
    
    try {
        const data = fs.readFileSync(cacheFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        log(`Error reading Homebridge cache: ${error.message}`, colors.red);
        return [];
    }
}

// Main diagnostic function
async function runDiagnostics() {
    header('FRITZ!Box Thermostat Battery Diagnostics');
    
    try {
        // Step 1: Connect to FRITZ!Box
        log('\n1. Connecting to FRITZ!Box...', colors.cyan);
        const sid = await getSessionID();
        log('✓ Connected successfully', colors.green);
        
        // Step 2: Get all devices
        log('\n2. Fetching device list...', colors.cyan);
        const devices = await getDeviceListInfos(sid);
        
        // Filter thermostats
        const thermostats = devices.filter(d => {
            const functionbitmask = parseInt(d.$?.functionbitmask || 0);
            return (functionbitmask & 8192) !== 0 || // Bit 13 for thermostats
                   (d.hkr && d.hkr.tist) ||
                   (d.$?.productname && d.$?.productname.includes('301'));
        });
        
        log(`✓ Found ${thermostats.length} thermostats`, colors.green);
        
        // Step 3: Check battery info for each thermostat
        header('Thermostat Battery Information from FRITZ!Box');
        
        const thermostatInfo = [];
        
        for (const device of thermostats) {
            const ain = device.$?.id || device.id;
            const name = device.name || 'Unknown';
            const productname = device.$?.productname || 'Unknown';
            
            log(`\n${colors.bright}${name}${colors.reset} (${productname})`);
            log(`  AIN: ${ain}`, colors.gray);
            
            // Check battery in XML structure
            let batteryInXML = null;
            if (device.battery) {
                batteryInXML = device.battery;
                log(`  Battery in XML: ${batteryInXML}%`, colors.green);
            } else if (device.hkr?.battery) {
                batteryInXML = device.hkr.battery;
                log(`  Battery in HKR: ${batteryInXML}%`, colors.green);
            } else {
                log(`  Battery in XML: Not found`, colors.yellow);
            }
            
            // Check battery via API
            const batteryViaAPI = await getBatteryCharge(sid, ain);
            if (batteryViaAPI !== null) {
                log(`  Battery via API: ${batteryViaAPI}%`, colors.green);
            } else {
                log(`  Battery via API: Not available`, colors.yellow);
            }
            
            // Check battery low status
            const batteryLow = device.batterylow || device.hkr?.batterylow || '0';
            log(`  Battery Low: ${batteryLow === '1' ? 'YES' : 'NO'}`, 
                batteryLow === '1' ? colors.red : colors.green);
            
            thermostatInfo.push({
                ain,
                name,
                productname,
                batteryInXML,
                batteryViaAPI,
                batteryLow,
                hasBatteryInfo: batteryInXML !== null || batteryViaAPI !== null
            });
        }
        
        // Step 4: Check Homebridge cached accessories
        header('Homebridge Cached Accessories');
        
        const cachedAccessories = getHomebridgeCachedAccessories();
        log(`Found ${cachedAccessories.length} cached accessories\n`);
        
        // Match thermostats with cached accessories
        for (const info of thermostatInfo) {
            const cached = cachedAccessories.find(acc => 
                acc.context?.ain === info.ain || 
                acc.displayName === info.name
            );
            
            if (cached) {
                log(`${colors.bright}${info.name}${colors.reset}`);
                
                // Check if BatteryService exists
                const hasBatteryService = cached.services?.some(s => 
                    s.UUID === '00000096-0000-1000-8000-0026BB765291' || // BatteryService UUID
                    s.displayName?.includes('Battery')
                );
                
                log(`  Cached: YES`, colors.green);
                log(`  Has BatteryService: ${hasBatteryService ? 'YES' : 'NO'}`, 
                    hasBatteryService ? colors.green : colors.red);
                
                if (!hasBatteryService && info.hasBatteryInfo) {
                    log(`  ⚠️  PROBLEM: Device has battery info but no BatteryService!`, colors.red);
                }
                
                // List all services
                if (cached.services) {
                    log(`  Services: ${cached.services.map(s => s.displayName || s.UUID).join(', ')}`);
                }
            } else {
                log(`${colors.bright}${info.name}${colors.reset}`);
                log(`  Cached: NO - Will be added on next Homebridge restart`, colors.yellow);
            }
        }
        
        // Step 5: Summary
        header('Summary');
        
        const problemDevices = thermostatInfo.filter(info => {
            const cached = cachedAccessories.find(acc => 
                acc.context?.ain === info.ain || acc.displayName === info.name
            );
            if (!cached) return false;
            
            const hasBatteryService = cached.services?.some(s => 
                s.UUID === '00000096-0000-1000-8000-0026BB765291'
            );
            
            return info.hasBatteryInfo && !hasBatteryService;
        });
        
        if (problemDevices.length > 0) {
            log(`\n⚠️  Found ${problemDevices.length} thermostats with battery info but no BatteryService:`, colors.red);
            problemDevices.forEach(d => {
                log(`   - ${d.name} (${d.ain})`, colors.red);
            });
            
            log(`\n${colors.bright}Recommended Solution:${colors.reset}`);
            log('1. Stop Homebridge', colors.yellow);
            log('2. Delete the cached accessories file:', colors.yellow);
            log(`   rm ${path.join(CONFIG.homebridgePath, 'persist/cachedAccessories')}`, colors.cyan);
            log('3. Start Homebridge - all accessories will be re-created with proper services', colors.yellow);
        } else {
            log('\n✓ All thermostats with battery info have BatteryService', colors.green);
        }
        
    } catch (error) {
        log(`\n❌ Error: ${error.message}`, colors.red);
        if (error.stack) {
            log(error.stack, colors.gray);
        }
    }
}

// Run diagnostics
runDiagnostics().then(() => {
    log('\nDiagnostics complete.', colors.green);
}).catch(error => {
    log(`\nFatal error: ${error.message}`, colors.red);
    process.exit(1);
});