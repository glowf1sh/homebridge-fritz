#!/usr/bin/env node

/**
 * Debug script to test Fritz!Box device list API
 * Usage: node test/debug-devicelist.js [username] [password] [url]
 */

const fritz = require('../lib/fritz-api');

async function testDeviceList() {
    const username = process.argv[2] || '';
    const password = process.argv[3] || '';
    const url = process.argv[4] || 'http://fritz.box';
    
    if (!password) {
        console.error('Usage: node test/debug-devicelist.js [username] password [url]');
        console.error('Example: node test/debug-devicelist.js "" mypassword');
        process.exit(1);
    }
    
    console.log('=== Fritz!Box Device List Debug Test ===');
    console.log(`URL: ${url}`);
    console.log(`Username: ${username || '(empty)'}`);
    console.log('');
    
    try {
        // Step 1: Get Session ID
        console.log('Step 1: Getting Session ID...');
        const sid = await fritz.getSessionID(username, password, { url });
        console.log(`✓ Session ID obtained: ${sid}`);
        console.log('');
        
        // Step 2: Test direct API call
        console.log('Step 2: Testing direct API call...');
        const apiUrl = `${url}/webservices/homeautoswitch.lua?sid=${sid}&switchcmd=getdevicelistinfos`;
        console.log(`Direct API URL: ${apiUrl}`);
        console.log('');
        
        // Step 3: Get device list
        console.log('Step 3: Getting device list...');
        const devices = await fritz.getDeviceList(sid, { url });
        
        console.log(`✓ Successfully retrieved ${devices.length} devices`);
        console.log('');
        
        if (devices.length > 0) {
            console.log('Device details:');
            devices.forEach((device, index) => {
                console.log(`\nDevice ${index + 1}:`);
                console.log(`  Name: ${device.name}`);
                console.log(`  Identifier (AIN): ${device.identifier}`);
                console.log(`  Manufacturer: ${device.manufacturer}`);
                console.log(`  Product: ${device.productname}`);
                console.log(`  Present: ${device.present}`);
                
                if (device.switch) {
                    console.log(`  Type: Switch/Outlet`);
                    console.log(`  State: ${device.switch.state ? 'ON' : 'OFF'}`);
                }
                if (device.hkr) {
                    console.log(`  Type: Thermostat`);
                    console.log(`  Current temp: ${device.hkr.tist}°C`);
                    console.log(`  Target temp: ${device.hkr.tsoll}°C`);
                }
                if (device.temperature) {
                    console.log(`  Temperature sensor: ${device.temperature.celsius}°C`);
                }
            });
        } else {
            console.log('No devices found. This could mean:');
            console.log('1. No smart home devices are paired with the Fritz!Box');
            console.log('2. The user lacks Smart Home permissions');
            console.log('3. The API response format has changed');
        }
        
    } catch (error) {
        console.error('\n❌ Error occurred:');
        console.error(`Message: ${error.message}`);
        
        if (error.response) {
            console.error(`HTTP Status: ${error.response.status} ${error.response.statusText}`);
            if (error.response.data) {
                console.error('Response data:', error.response.data.substring(0, 500));
            }
        }
        
        console.error('\nFull error:', error);
        
        console.log('\n=== Troubleshooting Tips ===');
        console.log('1. Check Fritz!Box user permissions:');
        console.log('   - Log into Fritz!Box web interface');
        console.log('   - Go to System > FRITZ!Box Users');
        console.log('   - Edit the user and ensure "Smart Home" permission is enabled');
        console.log('');
        console.log('2. Test the API directly in browser:');
        console.log('   - Get a fresh SID from Fritz!Box web interface URL');
        console.log('   - Open: ' + url + '/webservices/homeautoswitch.lua?sid=YOUR_SID&switchcmd=getdevicelistinfos');
        console.log('');
        console.log('3. Check for pending confirmations:');
        console.log('   - Check Fritz!Box event log for access requests');
        console.log('   - Look for blinking Info LED on the device');
        
        process.exit(1);
    }
}

// Run the test
testDeviceList();