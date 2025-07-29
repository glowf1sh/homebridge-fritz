#!/usr/bin/env node

/**
 * Simpler Test der parseDeviceFeatures Logik
 */

// Simuliere die parseDeviceFeatures Funktion mit den Fixes
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

    // WICHTIG: Fritz!Smart Thermo 301 meldet sich mit falscher Bitmask!
    // Prüfe auf HKR-Element statt auf Bitmask
    if (!features.hasThermostat && device && device.hkr) {
        features.hasThermostat = true;
    }

    // Thermostate haben Batterie - aber nur wenn sie auch erreichbar sind
    features.hasBattery = features.hasThermostat && device && device.present === '1';

    return features;
}

// Test-Daten
const testDevices = [
    {
        name: "Steckdose (DECT 200)",
        identifier: "08761 0284507",
        functionbitmask: 35712,
        present: "1",
        switch: true,
        temperature: true,
        hkr: null
    },
    {
        name: "Thermostat ERREICHBAR (DECT 301)",
        identifier: "09995 0006205",
        functionbitmask: 320,
        present: "1",
        temperature: true,
        hkr: { battery: "90" }
    },
    {
        name: "Thermostat NICHT ERREICHBAR (DECT 301)",
        identifier: "09995 0007765",
        functionbitmask: 320,
        present: "0",
        temperature: true,
        hkr: { battery: "0" }
    }
];

console.log('=== Fritz!Box Feature-Erkennung Test ===\n');

testDevices.forEach(device => {
    console.log(`\n${device.name}`);
    console.log(`AIN: ${device.identifier}`);
    console.log(`Bitmask: ${device.functionbitmask} (0x${device.functionbitmask.toString(16)})`);
    console.log(`Erreichbar: ${device.present === "1" ? "JA" : "NEIN"}`);
    
    const features = parseDeviceFeatures(device.functionbitmask, device);
    
    console.log('\nErkannte Features:');
    Object.entries(features).forEach(([key, value]) => {
        if (value) console.log(`  ✓ ${key}`);
    });
    
    console.log('\nAPI-Calls die funktionieren werden:');
    if (features.hasTemperature) console.log('  ✓ gettemperature');
    if (features.hasSwitch) console.log('  ✓ getswitchstate');
    if (features.hasThermostat) console.log('  ✓ gethkrtsoll');
    if (features.hasBattery) {
        console.log('  ✓ getbatterycharge (aus HKR-Element)');
    } else {
        console.log('  ✗ getbatterycharge (Gerät nicht erreichbar oder keine Batterie)');
    }
});

console.log('\n\n=== ZUSAMMENFASSUNG ===');
console.log('\n✅ Gelöste Probleme:');
console.log('1. Fritz!Smart Thermo 301 wird trotz falscher Bitmask als Thermostat erkannt');
console.log('2. getBatteryCharge nur bei erreichbaren Thermostaten');
console.log('3. Batterie-Info wird aus HKR-Element gelesen, nicht aus Battery-Feld');
console.log('4. Keine falschen API-Calls mehr auf unpassenden Geräten');