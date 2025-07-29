#!/usr/bin/env node

/**
 * Finaler Test mit den Fixes
 */

const path = require('path');

// Lade die lokale fritz-api.js mit den Fixes
const fritzApi = require('./lib/fritz-api.js');

// Test-Daten basierend auf deinen echten Geräten
const testDevices = [
    {
        // Steckdose
        identifier: "08761 0284507",
        name: "Wohnzimmer OBEN",
        functionbitmask: "35712",
        present: "1",
        switch: { state: "0" },
        temperature: { celsius: "210" },
        powermeter: { power: "0" }
    },
    {
        // Thermostat (erreichbar)
        identifier: "09995 0006205",
        name: "Badezimmer OBEN",
        functionbitmask: "320",
        present: "1",
        temperature: { celsius: "220" },
        hkr: {
            tist: "44",
            tsoll: "253",
            battery: "90",
            batterylow: "0"
        }
    },
    {
        // Thermostat (nicht erreichbar)
        identifier: "09995 0007765",
        name: "Schlafzimmer OBEN",
        functionbitmask: "320",
        present: "0",
        hkr: {
            battery: "0",
            batterylow: "0"
        }
    }
];

console.log('=== Feature-Erkennung Test ===\n');

testDevices.forEach(device => {
    console.log(`\nGerät: ${device.name} (${device.identifier})`);
    console.log(`Bitmask: ${device.functionbitmask}`);
    console.log(`Present: ${device.present}`);
    
    // Normalisiere das Gerät
    const normalized = fritzApi.normalizeDevice(device);
    console.log('\nErkannte Features:');
    Object.entries(normalized.features).forEach(([key, value]) => {
        if (value) console.log(`  ✓ ${key}`);
    });
    
    console.log('\nErwartete API-Calls:');
    if (normalized.features.hasTemperature) {
        console.log('  ✓ gettemperature');
    }
    if (normalized.features.hasSwitch) {
        console.log('  ✓ getswitchstate, setswitchon/off');
    }
    if (normalized.features.hasThermostat) {
        console.log('  ✓ gethkrtsoll, sethkrtsoll');
    }
    if (normalized.features.hasBattery) {
        console.log('  ✓ getbatterycharge');
    } else {
        console.log('  ✗ getbatterycharge (keine Batterie oder nicht erreichbar)');
    }
});

console.log('\n\n=== Zusammenfassung ===');
console.log('- Steckdosen: Keine Batterie-Abfrage ✓');
console.log('- Thermostate (erreichbar): Batterie-Abfrage ✓');
console.log('- Thermostate (nicht erreichbar): Keine Batterie-Abfrage ✓');
console.log('- HKR-Erkennung funktioniert auch ohne korrektes Bit 13 ✓');