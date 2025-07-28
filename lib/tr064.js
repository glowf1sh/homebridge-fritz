/**
 * TR-064 Implementation for FRITZ!Box
 * 
 * Lightweight replacement for tr-064-async library
 * Uses axios for HTTP requests and implements only required functionality
 */

const axios = require('axios');
const crypto = require('crypto');
const xml2js = require('xml2js');
const https = require('https');

class TR064Service {
    constructor(serviceType, controlURL, client) {
        this.serviceType = serviceType;
        this.controlURL = controlURL;
        this.client = client;
        this.actions = {};
    }

    /**
     * Add an action to this service
     */
    addAction(actionName) {
        this.actions[actionName] = (params = {}) => {
            return this.client.callAction(this.serviceType, actionName, params);
        };
    }
}

class TR064Client {
    constructor(options = {}) {
        this.host = options.host || 'fritz.box';
        this.port = options.port || 49443;
        this.ssl = options.ssl !== false;
        this.user = options.user || options.username;
        this.password = options.password;
        this.services = {};
        
        // XML parser configuration
        this.parser = new xml2js.Parser({
            explicitArray: false,
            tagNameProcessors: [xml2js.processors.stripPrefix],
            ignoreAttrs: true
        });
        
        this.builder = new xml2js.Builder({
            renderOpts: { pretty: false },
            headless: true
        });
        
        // Axios configuration
        const protocol = this.ssl ? 'https:' : 'http:';
        this.baseURL = `${protocol}//${this.host}:${this.port}`;
        
        this.axiosConfig = {
            timeout: 10000,
            headers: {
                'User-Agent': 'homebridge-fritz-new',
                'Content-Type': 'text/xml; charset="utf-8"'
            }
        };
        
        // Disable SSL verification if needed
        if (this.ssl && options.strictSSL === false) {
            this.axiosConfig.httpsAgent = new https.Agent({
                rejectUnauthorized: false
            });
        }
    }

    /**
     * Initialize TR-064 device and discover services
     */
    async initTR064Device() {
        try {
            // Get device description
            const descUrl = `${this.baseURL}/tr64desc.xml`;
            const response = await axios.get(descUrl, this.axiosConfig);
            
            const deviceDesc = await this.parser.parseStringPromise(response.data);
            
            // Extract services
            if (deviceDesc.root && deviceDesc.root.device) {
                await this.parseDevice(deviceDesc.root.device);
            }
            
            return this;
        } catch (error) {
            throw new Error(`Failed to initialize TR-064 device: ${error.message}`);
        }
    }

    /**
     * Parse device description and extract services
     */
    async parseDevice(device) {
        const services = device.serviceList?.service || [];
        
        for (const service of Array.isArray(services) ? services : [services]) {
            const serviceType = service.serviceType;
            const controlURL = service.controlURL;
            
            if (serviceType && controlURL) {
                // Create service instance
                const tr064Service = new TR064Service(serviceType, controlURL, this);
                
                // For WiFi configuration, we need SetEnable and GetInfo actions
                if (serviceType.includes('WLANConfiguration')) {
                    tr064Service.addAction('SetEnable');
                    tr064Service.addAction('GetInfo');
                    
                    // Store service with version suffix
                    const version = serviceType.split(':').pop();
                    this.services[`${serviceType.split(':').slice(0, -1).join(':')}:${version}`] = tr064Service;
                }
            }
        }
        
        // Parse embedded devices
        if (device.deviceList?.device) {
            const devices = Array.isArray(device.deviceList.device) 
                ? device.deviceList.device 
                : [device.deviceList.device];
                
            for (const embeddedDevice of devices) {
                await this.parseDevice(embeddedDevice);
            }
        }
    }

    /**
     * Call a TR-064 action
     */
    async callAction(serviceType, actionName, params = {}) {
        try {
            // Build SOAP envelope
            const soapBody = {
                'soap:Envelope': {
                    $: {
                        'xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
                        'soap:encodingStyle': 'http://schemas.xmlsoap.org/soap/encoding/'
                    },
                    'soap:Body': {
                        [`u:${actionName}`]: {
                            $: {
                                'xmlns:u': serviceType
                            },
                            ...params
                        }
                    }
                }
            };
            
            const xml = this.builder.buildObject(soapBody);
            
            // Find the service to get control URL
            const service = Object.values(this.services).find(s => s.serviceType === serviceType);
            if (!service) {
                throw new Error(`Service ${serviceType} not found`);
            }
            
            // Make SOAP request
            const config = {
                ...this.axiosConfig,
                headers: {
                    ...this.axiosConfig.headers,
                    'SOAPAction': `${serviceType}#${actionName}`
                },
                auth: {
                    username: this.user,
                    password: this.password
                }
            };
            
            const response = await axios.post(
                `${this.baseURL}${service.controlURL}`,
                xml,
                config
            );
            
            // Parse response
            const result = await this.parser.parseStringPromise(response.data);
            
            // Extract response values
            const envelope = result['soap:Envelope'] || result['Envelope'];
            const body = envelope?.['soap:Body'] || envelope?.['Body'];
            
            // Find the response element
            let actionResponse = null;
            for (const [key, value] of Object.entries(body || {})) {
                if (key.includes(`${actionName}Response`)) {
                    actionResponse = value;
                    break;
                }
            }
            
            if (!actionResponse) {
                return {};
            }
            
            // Remove namespace prefixes from response
            const cleanResponse = {};
            for (const [key, value] of Object.entries(actionResponse)) {
                if (!key.startsWith('$') && !key.startsWith('xmlns')) {
                    cleanResponse[key] = value;
                }
            }
            
            return cleanResponse;
            
        } catch (error) {
            if (error.response?.status === 401) {
                throw new Error('Authentication failed - check username and password');
            }
            throw new Error(`TR-064 action failed: ${error.message}`);
        }
    }
}

// Export with same interface as tr-064-async
module.exports = {
    Fritzbox: TR064Client
};