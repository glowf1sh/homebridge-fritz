/**
 * Zukunftssicherer Ansatz für Fritz!Box Geräte-Erkennung
 */

// Mapping von XML-Elementen zu HomeKit-Services
const ELEMENT_TO_SERVICE_MAP = {
    'switch': 'Outlet',
    'temperature': 'TemperatureSensor',
    'hkr': 'Thermostat',
    'humidity': 'HumiditySensor',
    'powermeter': 'PowerMeter',
    'alert': 'ContactSensor',
    'button': 'StatelessProgrammableSwitch',
    'simpleonoff': 'Switch',
    'levelcontrol': 'Lightbulb',
    'colorcontrol': 'Lightbulb',
    'blind': 'WindowCovering'
};

// Mapping von switchcmd zu XML-Element
const COMMAND_TO_ELEMENT_MAP = {
    'getswitchstate': 'switch',
    'gettemperature': 'temperature',
    'gethkrtsoll': 'hkr',
    'gethumidity': 'humidity',
    'getswitchpower': 'powermeter',
    'getbatterycharge': 'battery',  // Sonderfall
    'getwindspeed': 'weather',      // Hypothetisch
    'getrainfall': 'weather'        // Hypothetisch
};

/**
 * Analysiert ein Gerät basierend auf seinen XML-Elementen
 * NICHT auf der Bitmask!
 */
function analyzeDeviceCapabilities(device) {
    const capabilities = {
        elements: {},      // Vorhandene XML-Elemente
        services: [],      // Mögliche HomeKit-Services
        commands: [],      // Unterstützte API-Commands
        values: {}         // Aktuelle Werte
    };
    
    // Durchsuche ALLE Eigenschaften des Geräts
    for (const [key, value] of Object.entries(device)) {
        // Skip Meta-Daten
        if (['identifier', 'id', 'name', 'functionbitmask', 'fwversion', 
             'manufacturer', 'productname', 'present'].includes(key)) {
            continue;
        }
        
        // Element gefunden!
        if (value && typeof value === 'object') {
            capabilities.elements[key] = true;
            
            // Zugehöriger HomeKit-Service
            if (ELEMENT_TO_SERVICE_MAP[key]) {
                capabilities.services.push(ELEMENT_TO_SERVICE_MAP[key]);
            }
            
            // Extrahiere Werte
            capabilities.values[key] = extractValues(key, value);
        }
    }
    
    // Bestimme unterstützte Commands basierend auf Elementen
    for (const [cmd, element] of Object.entries(COMMAND_TO_ELEMENT_MAP)) {
        if (capabilities.elements[element]) {
            capabilities.commands.push(cmd);
        }
    }
    
    // Sonderbehandlung für Battery
    if (device.battery || (device.hkr && device.hkr.battery)) {
        capabilities.elements.battery = true;
        capabilities.values.battery = device.battery || device.hkr.battery;
        if (device.present === '1') {  // Nur wenn erreichbar
            capabilities.commands.push('getbatterycharge');
        }
    }
    
    return capabilities;
}

/**
 * Extrahiert Werte aus XML-Elementen
 */
function extractValues(elementName, element) {
    const values = {};
    
    switch(elementName) {
        case 'temperature':
            if (element.celsius) values.celsius = parseInt(element.celsius) / 10;
            if (element.offset) values.offset = parseInt(element.offset) / 10;
            break;
            
        case 'hkr':
            if (element.tist) values.currentTemp = parseInt(element.tist) / 2;
            if (element.tsoll) values.targetTemp = parseInt(element.tsoll) / 2;
            if (element.battery) values.battery = parseInt(element.battery);
            if (element.valve) values.valve = parseInt(element.valve);
            break;
            
        case 'humidity':
            if (element.rel_humidity) values.humidity = parseInt(element.rel_humidity);
            break;
            
        case 'powermeter':
            if (element.power) values.power = parseInt(element.power) / 1000;
            if (element.energy) values.energy = parseInt(element.energy);
            if (element.voltage) values.voltage = parseInt(element.voltage) / 1000;
            break;
            
        // Neue Elemente werden automatisch erfasst!
        default:
            // Generisch: Alle numerischen Werte parsen
            for (const [k, v] of Object.entries(element)) {
                if (!isNaN(v)) {
                    values[k] = parseFloat(v);
                } else {
                    values[k] = v;
                }
            }
    }
    
    return values;
}

/**
 * Beispiel: Fritz!DECT 440 (Taster mit Temperatur + Luftfeuchtigkeit)
 */
const dect440Example = {
    identifier: "11934 0123456",
    name: "Wohnzimmer Taster",
    functionbitmask: "33088",  // Ignorieren wir!
    present: "1",
    
    // Die wichtigen Daten:
    temperature: {
        celsius: "215",
        offset: "0"
    },
    humidity: {
        rel_humidity: "65"
    },
    button: [
        { id: "1", name: "Oben Links", lastpressedtimestamp: "1234567890" },
        { id: "2", name: "Oben Rechts", lastpressedtimestamp: "1234567890" }
    ]
};

// Analysiere
const capabilities = analyzeDeviceCapabilities(dect440Example);
console.log('Erkannte Capabilities:', capabilities);

/**
 * Zukunftssicherer Ansatz für neue Geräte
 */
function handleUnknownDevice(device) {
    console.log(`\nUnbekanntes Gerät: ${device.name}`);
    console.log('Gefundene Elemente:');
    
    const caps = analyzeDeviceCapabilities(device);
    
    // Zeige alle gefundenen Elemente
    for (const element of Object.keys(caps.elements)) {
        console.log(`  - ${element}:`, caps.values[element]);
    }
    
    // Selbst wenn wir das Element nicht kennen, 
    // können wir die Daten trotzdem anzeigen!
    if (device.weather) {  // Hypothetische Wetterstation
        console.log('  - Wetter-Daten gefunden:', device.weather);
    }
    
    return caps;
}

// Export für Tests
module.exports = { analyzeDeviceCapabilities, handleUnknownDevice };