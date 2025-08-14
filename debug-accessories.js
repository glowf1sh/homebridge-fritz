// Debug script to check which thermostats have battery service

const fs = require('fs');
const path = require('path');

// Path to Homebridge persist directory
const persistPath = '/var/lib/homebridge/persist';
const accessoriesFile = path.join(persistPath, 'AccessoryInfo.CC223DE3CE30.json');

console.log('Checking cached accessories...\n');

try {
    if (fs.existsSync(accessoriesFile)) {
        const data = fs.readFileSync(accessoriesFile, 'utf8');
        const accessories = JSON.parse(data);
        
        console.log(`Found ${Object.keys(accessories).length} cached accessories\n`);
        
        // Look for thermostats
        for (const [uuid, accessory] of Object.entries(accessories)) {
            if (accessory.displayName && accessory.displayName.includes('Thermostat')) {
                console.log(`\nThermostat: ${accessory.displayName}`);
                console.log(`  UUID: ${uuid}`);
                console.log(`  Category: ${accessory.category}`);
                
                // Check services
                if (accessory.services) {
                    const hasBattery = accessory.services.some(s => 
                        s.type === "00000096-0000-1000-8000-0026BB765291" || // BatteryService UUID
                        s.displayName === "Battery"
                    );
                    console.log(`  Has Battery Service: ${hasBattery ? 'YES' : 'NO'}`);
                }
            }
        }
    } else {
        console.log('No accessories cache file found');
    }
} catch (error) {
    console.error('Error reading cache:', error);
}

// Also check running Homebridge
console.log('\n\nChecking Homebridge config...\n');

try {
    const configFile = '/var/lib/homebridge/config.json';
    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    
    const fritzPlatform = config.platforms.find(p => p.platform === 'Fritz!Platform');
    if (fritzPlatform) {
        console.log('Fritz!Platform config found');
        console.log(`  Username: ${fritzPlatform.username}`);
        console.log(`  URL: ${fritzPlatform.url}`);
    }
} catch (error) {
    console.error('Error reading config:', error);
}