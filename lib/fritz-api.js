/**
 * Fritz!Box API Implementation
 * 
 * Modern replacement for fritzapi using axios
 * Implements only the methods actually used by homebridge-fritz-new
 */

const axios = require('axios');
const crypto = require('crypto');
const xml2js = require('xml2js');
const querystring = require('querystring');
const https = require('https');

class FritzApi {
    constructor(log) {
        this.log = log || console.log.bind(console);
        this.parser = new xml2js.Parser({
            explicitArray: false,
            mergeAttrs: true,
            normalizeTags: true,
            explicitRoot: false
        });
    }

    /**
     * Calculate MD5 hash
     */
    md5(value) {
        return crypto.createHash('md5').update(value, 'utf16le').digest('hex');
    }

    /**
     * Get a new session ID
     */
    async getSessionID(username, password, options = {}) {
        const url = options.url || 'http://fritz.box';
        
        // Configure axios for HTTPS with self-signed certificates
        const axiosConfig = {
            timeout: options.timeout || 5000
        };
        
        if (url.startsWith('https://')) {
            axiosConfig.httpsAgent = new https.Agent({
                rejectUnauthorized: false
            });
        }
        
        try {
            // Step 1: Get challenge
            const challengeResponse = await axios.get(`${url}/login_sid.lua`, axiosConfig);
            
            const challengeData = await this.parser.parseStringPromise(challengeResponse.data);
            
            if (challengeData.sid && challengeData.sid !== '0000000000000000') {
                return challengeData.sid;
            }
            
            const challenge = challengeData.challenge;
            
            // Step 2: Calculate response
            const responseHash = this.md5(`${challenge}-${password}`);
            const response = `${challenge}-${responseHash}`;
            
            // Step 3: Login with response
            const loginResponse = await axios.get(`${url}/login_sid.lua`, {
                ...axiosConfig,
                params: {
                    username: username || '',
                    response: response
                }
            });
            
            const loginData = await this.parser.parseStringPromise(loginResponse.data);
            
            if (!loginData.sid || loginData.sid === '0000000000000000') {
                throw new Error('Invalid credentials');
            }
            
            return loginData.sid;
        } catch (error) {
            if (error.response) {
                error.response.statusCode = error.response.status;
            }
            throw error;
        }
    }

    /**
     * Make an authenticated API call
     */
    async apiCall(sid, path, params = {}, options = {}) {
        const url = options.url || 'http://fritz.box';
        const fullUrl = `${url}${path}`;
        const requestParams = {
            sid: sid,
            ...params
        };
        
        // Configure axios request options
        const axiosConfig = {
            params: requestParams,
            timeout: options.timeout || 5000
        };
        
        // Add HTTPS agent for self-signed certificates if using HTTPS
        if (fullUrl.startsWith('https://')) {
            axiosConfig.httpsAgent = new https.Agent({
                rejectUnauthorized: false
            });
        }
        
        try {
            const response = await axios.get(fullUrl, axiosConfig);
            
            // Check if we got redirected (indicates invalid session)
            if (response.request && response.request.res && response.request.res.responseUrl) {
                const finalUrl = response.request.res.responseUrl;
                if (finalUrl.includes('login_sid.lua') || finalUrl.includes('login.lua')) {
                    throw new Error('Session invalid - authentication required');
                }
            }
            
            return response.data;
        } catch (error) {
            if (error.response) {
                error.response.statusCode = error.response.status;
            }
            throw error;
        }
    }

    /**
     * Get device list
     */
    async getDeviceList(sid, options = {}) {
        if (options.log) {
            options.log.debug('> getDeviceList called with sid:', sid ? sid.substring(0, 8) + '...' : 'undefined');
        }
        try {
            const response = await this.apiCall(sid, '/webservices/homeautoswitch.lua', {
                switchcmd: 'getDeviceListInfos'  // FIX: Case-sensitive - must be camelCase
            }, options);
            
            // Check if response is an error page or redirect
            if (typeof response === 'string') {
                if (response.includes('<!DOCTYPE') || response.includes('<html')) {
                    throw new Error('Invalid response - received HTML instead of device list XML');
                }
                
                if (response.includes('0000000000000000')) {
                    throw new Error('Invalid session - authentication required');
                }
            }
            
            const data = await this.parser.parseStringPromise(response);
            
            // Try different possible data structures
            let devices = [];
            
            // With explicitRoot: false, the parser removes the root element
            // So <devicelist><device>...</device></devicelist> becomes { device: ... }
            // Check for data.device (this is the normal case with explicitRoot: false)
            if (data && data.device) {
                devices = Array.isArray(data.device) ? data.device : [data.device];
            }
            // FALLBACK: Check for devicelist.device (in case explicitRoot is true)
            else if (data && data.devicelist && data.devicelist.device) {
                devices = Array.isArray(data.devicelist.device) ? data.devicelist.device : [data.devicelist.device];
            }
            // EDGE CASE: Empty device list - data will just have version attribute
            else if (data && data.version && !data.device) {
                devices = [];
            }
            else {
                // Unexpected structure, return empty array
                devices = [];
            }
            
            return devices.map(device => this.normalizeDevice(device));
        } catch (error) {
            // Create more descriptive error
            const detailedError = new Error(
                `getDeviceList failed: ${error.message || 'Unknown error'}` +
                (error.response ? ` (HTTP ${error.response.status})` : '')
            );
            detailedError.originalError = error;
            throw detailedError;
        }
    }

    /**
     * Get filtered device list
     */
    async getDeviceListFiltered(sid, filter = {}, options = {}) {
        const devices = await this.getDeviceList(sid, options);
        
        if (filter.identifier) {
            const ain = filter.identifier.replace(/\s/g, '');
            return devices.filter(device => 
                device.identifier.replace(/\s/g, '') === ain
            );
        }
        
        return devices;
    }

    /**
     * Get list of switches/outlets
     */
    async getSwitchList(sid, options = {}) {
        const devices = await this.getDeviceList(sid, options);
        return devices
            .filter(device => device.switch)
            .map(device => device.identifier.replace(/\s/g, ''));
    }

    /**
     * Get list of thermostats
     */
    async getThermostatList(sid, options = {}) {
        const devices = await this.getDeviceList(sid, options);
        return devices
            .filter(device => device.hkr)
            .map(device => device.identifier.replace(/\s/g, ''));
    }

    /**
     * Get switch state
     */
    async getSwitchState(sid, ain, options = {}) {
        const response = await this.apiCall(sid, '/webservices/homeautoswitch.lua', {
            ain: ain,
            switchcmd: 'getswitchstate'
        }, options);
        
        return response.toString().trim() === '1';
    }

    /**
     * Turn switch on
     */
    async setSwitchOn(sid, ain, options = {}) {
        const response = await this.apiCall(sid, '/webservices/homeautoswitch.lua', {
            ain: ain,
            switchcmd: 'setswitchon'
        }, options);
        
        return response.toString().trim() === '1';
    }

    /**
     * Turn switch off
     */
    async setSwitchOff(sid, ain, options = {}) {
        const response = await this.apiCall(sid, '/webservices/homeautoswitch.lua', {
            ain: ain,
            switchcmd: 'setswitchoff'
        }, options);
        
        return response.toString().trim() === '1';
    }

    /**
     * Get switch power consumption
     */
    async getSwitchPower(sid, ain, options = {}) {
        const response = await this.apiCall(sid, '/webservices/homeautoswitch.lua', {
            ain: ain,
            switchcmd: 'getswitchpower'
        }, options);
        
        const power = parseInt(response.toString().trim());
        return isNaN(power) ? 0 : power / 1000; // Convert mW to W
    }

    /**
     * Get switch energy consumption
     */
    async getSwitchEnergy(sid, ain, options = {}) {
        const response = await this.apiCall(sid, '/webservices/homeautoswitch.lua', {
            ain: ain,
            switchcmd: 'getswitchenergy'
        }, options);
        
        const energy = parseInt(response.toString().trim());
        return isNaN(energy) ? 0 : energy / 1000; // Convert Wh to kWh
    }

    /**
     * Get temperature
     */
    async getTemperature(sid, ain, options = {}) {
        const response = await this.apiCall(sid, '/webservices/homeautoswitch.lua', {
            ain: ain,
            switchcmd: 'gettemperature'
        }, options);
        
        const temp = parseInt(response.toString().trim());
        return isNaN(temp) ? null : temp / 10; // Convert to degrees Celsius
    }

    /**
     * Get target temperature
     */
    async getTempTarget(sid, ain, options = {}) {
        const response = await this.apiCall(sid, '/webservices/homeautoswitch.lua', {
            ain: ain,
            switchcmd: 'gethkrtsoll'
        }, options);
        
        const temp = parseInt(response.toString().trim());
        if (isNaN(temp) || temp === 253) return 'off';
        if (temp === 254) return 'on';
        
        return temp / 2; // Convert 0.5°C units to °C
    }

    /**
     * Set target temperature
     */
    async setTempTarget(sid, ain, temperature, options = {}) {
        let param;
        
        if (temperature === 'on' || temperature === 'off') {
            param = temperature;
        } else {
            // Convert °C to 0.5°C units
            param = Math.round(temperature * 2);
        }
        
        const response = await this.apiCall(sid, '/webservices/homeautoswitch.lua', {
            ain: ain,
            switchcmd: 'sethkrtsoll',
            param: param
        }, options);
        
        return response;
    }

    /**
     * Get battery charge
     */
    async getBatteryCharge(sid, ain, options = {}) {
        const devices = await this.getDeviceListFiltered(sid, { identifier: ain }, options);
        
        if (devices.length > 0 && devices[0].battery) {
            return parseInt(devices[0].battery) || 0;
        }
        
        return 100; // Default if no battery info
    }

    /**
     * Get OS version
     */
    async getOSVersion(sid, options = {}) {
        // This requires TR-064, for now return a placeholder
        // In a full implementation, this would use TR-064 GetInfo action
        return 'FRITZ!OS';
    }

    /**
     * Get guest WLAN status
     */
    async getGuestWlan(sid, options = {}) {
        const url = options.url || 'http://fritz.box';
        
        // Configure axios for HTTPS with self-signed certificates
        const axiosConfig = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: options.timeout || 5000
        };
        
        if (url.startsWith('https://')) {
            axiosConfig.httpsAgent = new https.Agent({
                rejectUnauthorized: false
            });
        }
        
        try {
            const response = await axios.post(`${url}/data.lua`, 
                querystring.stringify({
                    sid: sid,
                    page: 'wGuest',
                    xhr: 1
                }), 
                axiosConfig
            );
            
            const data = response.data;
            return data && data.data && data.data.active === '1';
        } catch (error) {
            if (error.response) {
                error.response.statusCode = error.response.status;
            }
            throw error;
        }
    }

    /**
     * Set guest WLAN status
     */
    async setGuestWlan(sid, enable, options = {}) {
        const url = options.url || 'http://fritz.box';
        
        // Configure axios for HTTPS with self-signed certificates
        const axiosConfig = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: options.timeout || 5000
        };
        
        if (url.startsWith('https://')) {
            axiosConfig.httpsAgent = new https.Agent({
                rejectUnauthorized: false
            });
        }
        
        try {
            const response = await axios.post(`${url}/data.lua`, 
                querystring.stringify({
                    sid: sid,
                    page: 'wGuest',
                    active: enable ? '1' : '0',
                    xhr: 1,
                    apply: ''
                }), 
                axiosConfig
            );
            
            return true;
        } catch (error) {
            if (error.response) {
                error.response.statusCode = error.response.status;
            }
            throw error;
        }
    }

    /**
     * Normalize device structure
     */
    normalizeDevice(device) {
        const normalized = {
            identifier: device.identifier || '',
            id: device.id || '',
            fwversion: device.fwversion || '',
            manufacturer: device.manufacturer || '',
            productname: device.productname || '',
            present: device.present === '1',
            name: device.name || ''
        };

        // Temperature sensor
        if (device.temperature) {
            normalized.temperature = {
                celsius: parseInt(device.temperature.celsius) / 10 || 0,
                offset: parseInt(device.temperature.offset) / 10 || 0
            };
        }

        // Switch
        if (device.switch) {
            normalized.switch = {
                state: device.switch.state === '1',
                mode: device.switch.mode || '',
                lock: device.switch.lock === '1',
                devicelock: device.switch.devicelock === '1'
            };
        }

        // Power meter
        if (device.powermeter) {
            normalized.powermeter = {
                power: parseInt(device.powermeter.power) / 1000 || 0,
                energy: parseInt(device.powermeter.energy) || 0
            };
        }

        // Thermostat (HKR)
        if (device.hkr) {
            normalized.hkr = {
                tist: parseInt(device.hkr.tist) / 2 || 0,
                tsoll: parseInt(device.hkr.tsoll) / 2 || 0,
                absenk: parseInt(device.hkr.absenk) / 2 || 0,
                komfort: parseInt(device.hkr.komfort) / 2 || 0,
                lock: device.hkr.lock === '1',
                devicelock: device.hkr.devicelock === '1',
                battery: parseInt(device.hkr.battery) || 0,
                batterylow: device.hkr.batterylow === '1'
            };
        }

        // Battery
        if (device.battery) {
            normalized.battery = parseInt(device.battery) || 0;
            normalized.batterylow = device.batterylow === '1';
        }

        // Alert sensor
        if (device.alert) {
            normalized.alert = {
                state: device.alert.state === '1'
            };
        }

        // Button
        if (device.button) {
            const buttons = Array.isArray(device.button) ? device.button : [device.button];
            normalized.button = buttons.map(btn => ({
                id: btn.id || '',
                name: btn.name || '',
                lastpressedtimestamp: btn.lastpressedtimestamp || '0'
            }));
        }

        return normalized;
    }
}

// Export singleton instance with same interface as original fritzapi
const api = new FritzApi();

module.exports = {
    getSessionID: (username, password, options) => api.getSessionID(username, password, options),
    getDeviceList: (sid, options) => api.getDeviceList(sid, options),
    getDeviceListFiltered: (sid, filter, options) => api.getDeviceListFiltered(sid, filter, options),
    getSwitchList: (sid, options) => api.getSwitchList(sid, options),
    getThermostatList: (sid, options) => api.getThermostatList(sid, options),
    getSwitchState: (sid, ain, options) => api.getSwitchState(sid, ain, options),
    setSwitchOn: (sid, ain, options) => api.setSwitchOn(sid, ain, options),
    setSwitchOff: (sid, ain, options) => api.setSwitchOff(sid, ain, options),
    getSwitchPower: (sid, ain, options) => api.getSwitchPower(sid, ain, options),
    getSwitchEnergy: (sid, ain, options) => api.getSwitchEnergy(sid, ain, options),
    getTemperature: (sid, ain, options) => api.getTemperature(sid, ain, options),
    getTempTarget: (sid, ain, options) => api.getTempTarget(sid, ain, options),
    setTempTarget: (sid, ain, temperature, options) => api.setTempTarget(sid, ain, temperature, options),
    getBatteryCharge: (sid, ain, options) => api.getBatteryCharge(sid, ain, options),
    getOSVersion: (sid, options) => api.getOSVersion(sid, options),
    getGuestWlan: (sid, options) => api.getGuestWlan(sid, options),
    setGuestWlan: (sid, enable, options) => api.setGuestWlan(sid, enable, options)
};