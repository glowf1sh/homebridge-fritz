const axios = require('axios');
const parseString = require('xml2js').parseString;

const config = {
  username: 'Helmut',
  password: 'an!Kuh!15',
  url: 'http://192.168.178.1',
  strictSSL: false
};

async function getSessionID() {
  const response = await axios.get(`${config.url}/login_sid.lua`);
  const loginXML = response.data;
  
  return new Promise((resolve, reject) => {
    parseString(loginXML, (err, result) => {
      if (err) return reject(err);
      const challenge = result.SessionInfo.Challenge[0];
      const challengeResponse = challenge + '-' + require('crypto').createHash('md5').update(Buffer.from(challenge + '-' + config.password, 'utf16le')).digest('hex');
      
      axios.get(`${config.url}/login_sid.lua?username=${config.username}&response=${challengeResponse}`)
        .then(response => {
          parseString(response.data, (err, result) => {
            if (err) return reject(err);
            resolve(result.SessionInfo.SID[0]);
          });
        })
        .catch(reject);
    });
  });
}

async function getDeviceListInfos(sid) {
  const response = await axios.get(`${config.url}/webservices/homeautoswitch.lua?switchcmd=getdevicelistinfos&sid=${sid}`);
  
  return new Promise((resolve, reject) => {
    parseString(response.data, { explicitArray: false }, (err, result) => {
      if (err) return reject(err);
      
      // Normalize to array
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
    const response = await axios.get(`${config.url}/webservices/homeautoswitch.lua?ain=${ain}&switchcmd=getbatterycharge&sid=${sid}`);
    const battery = parseInt(response.data.trim());
    return isNaN(battery) ? null : battery;
  } catch (error) {
    return null;
  }
}

async function getDeviceInfos(sid, ain) {
  try {
    const response = await axios.get(`${config.url}/webservices/homeautoswitch.lua?ain=${ain}&switchcmd=getdeviceinfos&sid=${sid}`);
    
    return new Promise((resolve, reject) => {
      parseString(response.data, { explicitArray: false }, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  } catch (error) {
    return null;
  }
}

async function checkDevices() {
  console.log('Checking battery status for all thermostats...\n');
  
  try {
    const sid = await getSessionID();
    console.log('Logged in successfully\n');
    
    const devices = await getDeviceListInfos(sid);
    
    // Filter for thermostats
    const thermostats = devices.filter(d => {
      const functionbitmask = parseInt(d.$.functionbitmask || 0);
      return (functionbitmask & 8192) !== 0 || // Bit 13 for thermostats
             (d.hkr && d.hkr.tist) || // Has HKR element with temperature
             (d.$.productname && (d.$.productname.includes('301') || d.$.productname.includes('302') || d.$.productname.includes('Thermostat')));
    });
    
    console.log(`Found ${thermostats.length} thermostats:\n`);
    
    for (const device of thermostats) {
      const functionbitmask = parseInt(device.$.functionbitmask || 0);
      console.log(`======================================`);
      console.log(`Device: ${device.name}`);
      console.log(`  Product: ${device.$.productname || 'Unknown'}`);
      console.log(`  AIN: ${device.$.id}`);
      console.log(`  Functionbitmask: ${functionbitmask} (binary: ${functionbitmask.toString(2)})`);
      
      // Check battery in device structure
      console.log('\n  Battery info in device structure:');
      if (device.battery) {
        console.log(`    device.battery: ${device.battery}%`);
      }
      if (device.batterylow !== undefined) {
        console.log(`    device.batterylow: ${device.batterylow}`);
      }
      if (device.hkr && device.hkr.battery) {
        console.log(`    device.hkr.battery: ${device.hkr.battery}%`);
      }
      if (device.hkr && device.hkr.batterylow !== undefined) {
        console.log(`    device.hkr.batterylow: ${device.hkr.batterylow}`);
      }
      
      // Try to get battery via API
      console.log('\n  Battery via API calls:');
      const battery = await getBatteryCharge(sid, device.$.id);
      if (battery !== null) {
        console.log(`    getBatteryCharge: ${battery}%`);
      } else {
        console.log(`    getBatteryCharge: No response or error`);
      }
      
      // Try deviceinfos
      const deviceInfo = await getDeviceInfos(sid, device.$.id);
      if (deviceInfo && deviceInfo.device) {
        console.log(`    getDeviceInfos battery: ${deviceInfo.device.battery || 'Not found'}`);
        console.log(`    getDeviceInfos batterylow: ${deviceInfo.device.batterylow || 'Not found'}`);
      } else {
        console.log(`    getDeviceInfos: No response or error`);
      }
      
      console.log('');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDevices();