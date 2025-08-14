// Einfacher Test um zu sehen welche Thermostate Batterie-Info haben

const platform = {
  log: {
    info: console.log,
    error: console.error,
    debug: console.log,
    warn: console.warn
  },
  config: {
    username: 'Helmut',
    password: 'an!Kuh!15',
    url: 'http://fritz.box',
    interval: 30,
    concurrent: 1,
    polling: {
      init: 30000,
      discovery: 60000,
      switchStates: 3000,
      sensorData: 10000,
      batteryStatus: 900000
    }
  },
  interval: 30,
  concurrent: 1,
  options: {
    strictSSL: false
  }
};

const FritzApi = require('./lib/fritz-api');
FritzApi.init(platform);

async function test() {
  try {
    console.log('Getting device list...\n');
    
    // Use the platform's fritz method
    const devices = await platform.fritz('getDeviceListInfos');
    
    // Filter thermostats
    const thermostats = devices.filter(d => {
      return d.functionbitmask & 8192 || // Bit 13
             (d.hkr && d.hkr.tist) ||
             (d.productname && d.productname.includes('301'));
    });
    
    console.log(`Found ${thermostats.length} thermostats:\n`);
    
    for (const device of thermostats) {
      console.log(`\n========== ${device.name} ==========`);
      console.log(`AIN: ${device.id}`);
      console.log(`Product: ${device.productname || 'Unknown'}`);
      
      // Check if battery info exists in device structure
      console.log('\nBattery in device structure:');
      console.log(`  device.battery: ${device.battery || 'Not found'}`);
      console.log(`  device.batterylow: ${device.batterylow !== undefined ? device.batterylow : 'Not found'}`);
      
      if (device.hkr) {
        console.log(`  device.hkr.battery: ${device.hkr.battery || 'Not found'}`);
        console.log(`  device.hkr.batterylow: ${device.hkr.batterylow !== undefined ? device.hkr.batterylow : 'Not found'}`);
      }
      
      // Try API call
      try {
        const battery = await platform.fritz('getBatteryCharge', device.id);
        console.log(`\nBattery via API: ${battery}%`);
      } catch (err) {
        console.log(`\nBattery via API: Error - ${err.message}`);
      }
      
      // Check if this thermostat has battery service in HomeKit
      const hasBatteryInHomeKit = device.battery || (device.hkr && device.hkr.battery);
      console.log(`\nShould show battery in HomeKit: ${hasBatteryInHomeKit ? 'YES' : 'NO'}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

test();