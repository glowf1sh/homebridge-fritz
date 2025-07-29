/**
 * FritzPlatform - Dynamic Platform Implementation
 *
 * @url https://github.com/glowf1sh/homebridge-fritz-new
 * @original author Andreas Götz
 * @new author Glowf1sh <https://twitch.tv/glowf1sh>
 * @license MIT
 */

/* jslint node: true, laxcomma: true, esversion: 6 */
"use strict";

const get = require('lodash.get');
const fritz = require('./fritz-api');
const isWebUri = require('valid-url').isWebUri;
const { inherits } = require('util');
let Characteristic, Homebridge, PlatformAccessory;

module.exports = function(homebridge) {
    Homebridge = homebridge;
    Characteristic = homebridge.hap.Characteristic;
    PlatformAccessory = homebridge.platformAccessory;

    // Define custom characteristics before inheriting
    FritzPlatform.PowerUsage = function() {
        if (Characteristic && Characteristic.call) {
            Characteristic.call(this, 'Power Usage', 'AE48F447-E065-4B31-8050-8FB06DB9E087');

            this.setProps({
                format: Characteristic.Formats.FLOAT,
                unit: 'W',
                perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
            });

            this.value = this.getDefaultValue();
        }
    };

    FritzPlatform.EnergyConsumption = function() {
        if (Characteristic && Characteristic.call) {
            Characteristic.call(this, 'Energy Consumption', 'C4805C5B-45B7-4E5B-BFCB-FE43E0FBC1E5');

            this.setProps({
                format: Characteristic.Formats.FLOAT,
                unit: 'kWh',
                perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
            });

            this.value = this.getDefaultValue();
        }
    };

    // Only inherit if Characteristic is properly initialized
    if (Characteristic && Characteristic.prototype) {
        inherits(FritzPlatform.PowerUsage, Characteristic);
        inherits(FritzPlatform.EnergyConsumption, Characteristic);
    }

    return FritzPlatform;
};

function FritzPlatform(log, config, api) {
    this.log = log;
    this.config = config;
    this.api = api;
    
    // Log version information on startup
    const packageInfo = require('../package.json');
    this.log("[FritzBox] homebridge-fritz-new v" + packageInfo.version + " starting up");

    // Validate configuration
    if (!config) {
        throw new Error('Missing configuration');
    }

    // Validate credentials
    if (!config.username || !config.password) {
        throw new Error('Username and password are required in configuration');
    }

    this.options = this.config.options || {};
    this.options.log = log; // Pass log to fritz API calls
    
    // Set timeout from config, default to 5000ms
    this.options.timeout = this.config.timeout || 5000;
    this.interval = 1000 * (this.config.interval || 60);  // 1 minute

    this.pending = 0; // pending requests

    // device configuration
    this.config.devices = this.config.devices || {};

    // fritz url
    const url = this.config.url || 'http://fritz.box';
    if (!isWebUri(url)) {
        throw new Error("Invalid FRITZ!Box url - must start with http:// or https://");
    }
    // trailing slash
    if (url.substr(-1) == "/") url = url.slice(0, -1);
    this.options.url = url;

    this.promise = null;

    // Dynamic platform properties
    this.accessories = []; // Array to store restored accessories
    this.deviceList = []; // Current device list from Fritz!Box
    
    // For Homebridge v1.0+ compatibility
    if (api) {
        this.api = api;
        
        // Listen for the event that all cached accessories have been restored
        this.api.on('didFinishLaunching', () => {
            this.log("Homebridge finished launching");
            this.discoverDevices();
            
            // Setup interval to update accessories every 60 seconds
            this.updateInterval = setInterval(() => {
                this.updateAccessories();
            }, this.interval);
        });
    }
}

FritzPlatform.prototype = {
    // Called when homebridge restores cached accessories from disk at startup
    configureAccessory: function(accessory) {
        this.log("Configuring cached accessory: " + accessory.displayName);
        
        // Mark as not reachable until we confirm it exists
        accessory.reachable = false;
        
        // Add to our accessory array
        this.accessories.push(accessory);
        
        // Re-setup event handlers
        this.setupAccessoryHandlers(accessory);
    },

    // Initial device discovery after homebridge has finished launching
    discoverDevices: function() {
        const self = this;
        
        fritz.getSessionID(this.config.username, this.config.password, this.options).then(function(sid) {
            self.log("FRITZ!Box platform login successful");
            self.sid = sid;
            
            self.log("Discovering accessories");
            
            // Update device list and accessories
            return self.updateAccessories();
        })
        .catch(function(error) {
            self.log.error("FRITZ!Box login failed:", error ? error.message || error.toString() : 'Unknown error');
        });
    },

    // Update accessories - called initially and every 60 seconds
    updateAccessories: function() {
        const self = this;
        
        // First update the device list
        return this.updateDeviceList().then(function(devices) {
            // Handle WiFi accessory
            if (self.deviceConfig("wifi.display", true)) {
                self.addOrUpdateWifiAccessory();
            }
            
            // Get all device types
            const jobs = [];
            
            // Outlets
            jobs.push(
                self.fritz("getSwitchList")
                    .then(function(ains) {
                        self.log.debug("Outlets found: %s", self.getArrayString(ains));
                        ains.forEach(function(ain) {
                            if (self.deviceConfig(`${ain}.display`, true)) {
                                self.addOrUpdateOutletAccessory(ain);
                            }
                        });
                    })
                    .catch(function(error) {
                        self.log.error("getSwitchList failed:", error);
                    })
            );
            
            // Thermostats
            jobs.push(
                self.fritz('getThermostatList')
                    .then(function(ains) {
                        self.log.debug("Thermostats found: %s", self.getArrayString(ains));
                        ains.forEach(function(ain) {
                            if (self.deviceConfig(`${ain}.display`, true)) {
                                self.addOrUpdateThermostatAccessory(ain);
                            }
                        });
                        
                        // Temperature sensors
                        const sensors = [];
                        devices.forEach(function(device) {
                            if (device.temperature) {
                                const ain = device.identifier.replace(/\s/g, '');
                                const isAlreadyAdded = self.accessories.find(function(accessory) {
                                    return accessory.context.ain === ain;
                                });
                                
                                if (!isAlreadyAdded) {
                                    sensors.push(ain);
                                }
                            }
                        });
                        
                        if (sensors.length) {
                            sensors.forEach(function(ain) {
                                if (self.deviceConfig(`${ain}.display`, true) &&
                                    self.deviceConfig(`${ain}.TemperatureSensor`, true)
                                ) {
                                    self.addOrUpdateTemperatureSensorAccessory(ain);
                                }
                            });
                        }
                        self.log.debug("Sensors found: %s", self.getArrayString(sensors));
                    })
                    .catch(function(error) {
                        self.log.error("getThermostatList failed:", error);
                    })
            );
            
            // Alarm sensors
            const alarms = [];
            devices.forEach(function(device) {
                if (device.alert) {
                    alarms.push(device.identifier);
                }
            });
            
            if (alarms.length) {
                alarms.forEach(function(ain) {
                    if (self.deviceConfig(`${ain}.display`, true) &&
                        self.deviceConfig(`${ain}.ContactSensor`, true)
                    ) {
                        self.addOrUpdateAlarmSensorAccessory(ain);
                    }
                });
            }
            self.log.debug("Alarm sensors found: %s", self.getArrayString(alarms));
            
            // Buttons
            const buttons = [];
            devices.forEach(function(device) {
                if (device.button) {
                    const ain = device.identifier.replace(/\s/g, '');
                    buttons.push(ain);
                    
                    if (self.deviceConfig(`${ain}.display`, true)) {
                        device.button.forEach(function(button, index) {
                            self.addOrUpdateButtonAccessory(ain, index, button.name);
                        });
                    }
                }
            });
            self.log.debug("Buttons found: %s", self.getArrayString(buttons));
            
            return Promise.all(jobs).then(function() {
                // Remove accessories that no longer exist
                self.removeStaleAccessories();
            });
        })
        .catch(function(error) {
            self.log.error("Error updating accessories:", error);
            // Mark all accessories as unreachable on error
            self.accessories.forEach(function(accessory) {
                accessory.reachable = false;
            });
            // Re-throw the error to maintain the promise chain
            throw error;
        });
    },

    // Add or update WiFi accessory
    addOrUpdateWifiAccessory: function() {
        const uuid = Homebridge.hap.uuid.generate('wifi');
        let accessory = this.accessories.find(acc => acc.UUID === uuid);
        
        if (!accessory) {
            // Create new accessory
            accessory = new PlatformAccessory('Guest WLAN', uuid, Homebridge.hap.Categories.SWITCH);
            accessory.context.type = 'wifi';
            
            this.setupWifiAccessory(accessory);
            this.api.registerPlatformAccessories("homebridge-fritz-new", "FRITZ!Box", [accessory]);
            this.accessories.push(accessory);
            this.log("Added WiFi accessory");
        } else {
            // Update existing
            accessory.reachable = true;
            this.api.updatePlatformAccessories([accessory]);
        }
    },

    // Add or update outlet accessory
    addOrUpdateOutletAccessory: function(ain) {
        const device = this.getDevice(ain);
        const uuid = Homebridge.hap.uuid.generate('outlet-' + ain);
        let accessory = this.accessories.find(acc => acc.UUID === uuid);
        
        if (!accessory) {
            // Create new accessory
            const name = device.name || ain;
            accessory = new PlatformAccessory(name, uuid, Homebridge.hap.Categories.OUTLET);
            accessory.context.ain = ain;
            accessory.context.type = 'outlet';
            
            // Store device info in context
            if (device.manufacturer) accessory.context.manufacturer = device.manufacturer;
            if (device.productname) accessory.context.productname = device.productname;
            if (device.fwversion) accessory.context.fwversion = device.fwversion;
            
            this.setupOutletAccessory(accessory);
            this.api.registerPlatformAccessories("homebridge-fritz-new", "FRITZ!Box", [accessory]);
            this.accessories.push(accessory);
            this.log("Added outlet accessory: " + name);
        } else {
            // Update existing
            accessory.reachable = true;
            accessory.displayName = device.name || ain;
            
            // Update device info in context
            if (device.manufacturer) accessory.context.manufacturer = device.manufacturer;
            if (device.productname) accessory.context.productname = device.productname;
            if (device.fwversion) accessory.context.fwversion = device.fwversion;
            
            this.api.updatePlatformAccessories([accessory]);
        }
    },

    // Add or update thermostat accessory
    addOrUpdateThermostatAccessory: function(ain) {
        const device = this.getDevice(ain);
        const uuid = Homebridge.hap.uuid.generate('thermostat-' + ain);
        let accessory = this.accessories.find(acc => acc.UUID === uuid);
        
        if (!accessory) {
            // Create new accessory
            const name = device.name || ain;
            accessory = new PlatformAccessory(name, uuid, Homebridge.hap.Categories.THERMOSTAT);
            accessory.context.ain = ain;
            accessory.context.type = 'thermostat';
            
            // Store device info in context
            if (device.manufacturer) accessory.context.manufacturer = device.manufacturer;
            if (device.productname) accessory.context.productname = device.productname;
            if (device.fwversion) accessory.context.fwversion = device.fwversion;
            
            this.setupThermostatAccessory(accessory);
            this.api.registerPlatformAccessories("homebridge-fritz-new", "FRITZ!Box", [accessory]);
            this.accessories.push(accessory);
            this.log("Added thermostat accessory: " + name);
        } else {
            // Update existing
            accessory.reachable = true;
            accessory.displayName = device.name || ain;
            
            // Update device info in context
            if (device.manufacturer) accessory.context.manufacturer = device.manufacturer;
            if (device.productname) accessory.context.productname = device.productname;
            if (device.fwversion) accessory.context.fwversion = device.fwversion;
            
            this.api.updatePlatformAccessories([accessory]);
        }
    },

    // Add or update temperature sensor accessory
    addOrUpdateTemperatureSensorAccessory: function(ain) {
        const device = this.getDevice(ain);
        const uuid = Homebridge.hap.uuid.generate('temperaturesensor-' + ain);
        let accessory = this.accessories.find(acc => acc.UUID === uuid);
        
        if (!accessory) {
            // Create new accessory
            const name = device.name || ain;
            accessory = new PlatformAccessory(name, uuid, Homebridge.hap.Categories.SENSOR);
            accessory.context.ain = ain;
            accessory.context.type = 'temperaturesensor';
            
            // Store device info in context
            if (device.manufacturer) accessory.context.manufacturer = device.manufacturer;
            if (device.productname) accessory.context.productname = device.productname;
            if (device.fwversion) accessory.context.fwversion = device.fwversion;
            
            this.setupTemperatureSensorAccessory(accessory);
            this.api.registerPlatformAccessories("homebridge-fritz-new", "FRITZ!Box", [accessory]);
            this.accessories.push(accessory);
            this.log("Added temperature sensor accessory: " + name);
        } else {
            // Update existing
            accessory.reachable = true;
            accessory.displayName = device.name || ain;
            
            // Update device info in context
            if (device.manufacturer) accessory.context.manufacturer = device.manufacturer;
            if (device.productname) accessory.context.productname = device.productname;
            if (device.fwversion) accessory.context.fwversion = device.fwversion;
            
            this.api.updatePlatformAccessories([accessory]);
        }
    },

    // Add or update alarm sensor accessory
    addOrUpdateAlarmSensorAccessory: function(ain) {
        const device = this.getDevice(ain);
        const uuid = Homebridge.hap.uuid.generate('alarmsensor-' + ain);
        let accessory = this.accessories.find(acc => acc.UUID === uuid);
        
        if (!accessory) {
            // Create new accessory
            const name = device.name || ain;
            accessory = new PlatformAccessory(name, uuid, Homebridge.hap.Categories.SENSOR);
            accessory.context.ain = ain;
            accessory.context.type = 'alarmsensor';
            
            // Store device info in context
            if (device.manufacturer) accessory.context.manufacturer = device.manufacturer;
            if (device.productname) accessory.context.productname = device.productname;
            if (device.fwversion) accessory.context.fwversion = device.fwversion;
            
            this.setupAlarmSensorAccessory(accessory);
            this.api.registerPlatformAccessories("homebridge-fritz-new", "FRITZ!Box", [accessory]);
            this.accessories.push(accessory);
            this.log("Added alarm sensor accessory: " + name);
        } else {
            // Update existing
            accessory.reachable = true;
            accessory.displayName = device.name || ain;
            
            // Update device info in context
            if (device.manufacturer) accessory.context.manufacturer = device.manufacturer;
            if (device.productname) accessory.context.productname = device.productname;
            if (device.fwversion) accessory.context.fwversion = device.fwversion;
            
            this.api.updatePlatformAccessories([accessory]);
        }
    },

    // Add or update button accessory
    addOrUpdateButtonAccessory: function(ain, index, buttonName) {
        const device = this.getDevice(ain);
        const uuid = Homebridge.hap.uuid.generate('button-' + ain + '-' + index);
        let accessory = this.accessories.find(acc => acc.UUID === uuid);
        
        if (!accessory) {
            // Create new accessory
            const name = buttonName || `${device.name || ain} Button ${index + 1}`;
            accessory = new PlatformAccessory(name, uuid, Homebridge.hap.Categories.SWITCH);
            accessory.context.ain = ain;
            accessory.context.type = 'button';
            accessory.context.index = index;
            
            // Store device info in context
            if (device.manufacturer) accessory.context.manufacturer = device.manufacturer;
            if (device.productname) accessory.context.productname = device.productname;
            if (device.fwversion) accessory.context.fwversion = device.fwversion;
            
            this.setupButtonAccessory(accessory);
            this.api.registerPlatformAccessories("homebridge-fritz-new", "FRITZ!Box", [accessory]);
            this.accessories.push(accessory);
            this.log("Added button accessory: " + name);
        } else {
            // Update existing
            accessory.reachable = true;
            accessory.displayName = buttonName || `${device.name || ain} Button ${index + 1}`;
            
            // Update device info in context
            if (device.manufacturer) accessory.context.manufacturer = device.manufacturer;
            if (device.productname) accessory.context.productname = device.productname;
            if (device.fwversion) accessory.context.fwversion = device.fwversion;
            
            this.api.updatePlatformAccessories([accessory]);
        }
    },

    // Remove accessories that no longer exist
    removeStaleAccessories: function() {
        const self = this;
        const staleAccessories = [];
        
        this.accessories.forEach(function(accessory) {
            let shouldRemove = false;
            
            if (accessory.context.type === 'wifi') {
                // Check if WiFi should still be displayed
                shouldRemove = !self.deviceConfig("wifi.display", true);
            } else if (accessory.context.ain) {
                // Check if device still exists
                const device = self.getDevice(accessory.context.ain);
                if (!device || !device.identifier) {
                    shouldRemove = true;
                } else {
                    // Check if device should still be displayed
                    shouldRemove = !self.deviceConfig(`${accessory.context.ain}.display`, true);
                }
            }
            
            if (shouldRemove) {
                staleAccessories.push(accessory);
            }
        });
        
        if (staleAccessories.length > 0) {
            this.log("Removing " + staleAccessories.length + " stale accessories");
            this.api.unregisterPlatformAccessories("homebridge-fritz-new", "FRITZ!Box", staleAccessories);
            
            staleAccessories.forEach(function(accessory) {
                const index = self.accessories.indexOf(accessory);
                if (index > -1) {
                    self.accessories.splice(index, 1);
                }
            });
        }
    },

    // Setup handlers for restored accessories
    setupAccessoryHandlers: function(accessory) {
        // Based on accessory type, setup appropriate handlers
        switch (accessory.context.type) {
            case 'wifi':
                this.setupWifiAccessory(accessory);
                break;
            case 'outlet':
                this.setupOutletAccessory(accessory);
                break;
            case 'thermostat':
                this.setupThermostatAccessory(accessory);
                break;
            case 'temperaturesensor':
                this.setupTemperatureSensorAccessory(accessory);
                break;
            case 'alarmsensor':
                this.setupAlarmSensorAccessory(accessory);
                break;
            case 'button':
                this.setupButtonAccessory(accessory);
                break;
        }
    },

    // Setup WiFi accessory
    setupWifiAccessory: function(accessory) {
        const FritzWifiAccessory = require('./accessories/wifi')(Homebridge);
        const wifiAccessory = new FritzWifiAccessory(this, accessory);
        // Store reference for cleanup
        accessory.context.accessoryInstance = wifiAccessory;
    },

    // Setup outlet accessory
    setupOutletAccessory: function(accessory) {
        const FritzOutletAccessory = require('./accessories/outlet')(Homebridge);
        const outletAccessory = new FritzOutletAccessory(this, accessory.context.ain, 'outlet', accessory);
        // Store reference for cleanup
        accessory.context.accessoryInstance = outletAccessory;
    },

    // Setup thermostat accessory
    setupThermostatAccessory: function(accessory) {
        const FritzThermostatAccessory = require('./accessories/thermostat')(Homebridge);
        const thermostatAccessory = new FritzThermostatAccessory(this, accessory.context.ain, 'thermostat', accessory);
        // Store reference for cleanup
        accessory.context.accessoryInstance = thermostatAccessory;
    },

    // Setup temperature sensor accessory
    setupTemperatureSensorAccessory: function(accessory) {
        const FritzTemperatureSensorAccessory = require('./accessories/temperaturesensor')(Homebridge);
        const sensorAccessory = new FritzTemperatureSensorAccessory(this, accessory.context.ain, 'temperature sensor', accessory);
        // Store reference for cleanup
        accessory.context.accessoryInstance = sensorAccessory;
    },

    // Setup alarm sensor accessory
    setupAlarmSensorAccessory: function(accessory) {
        const FritzAlarmSensorAccessory = require('./accessories/alarmsensor')(Homebridge);
        const alarmAccessory = new FritzAlarmSensorAccessory(this, accessory.context.ain, 'alarm sensor', accessory);
        // Store reference for cleanup
        accessory.context.accessoryInstance = alarmAccessory;
    },

    // Setup button accessory
    setupButtonAccessory: function(accessory) {
        const FritzButtonAccessory = require('./accessories/button')(Homebridge);
        const buttonAccessory = new FritzButtonAccessory(this, accessory.context.ain, 'button', accessory);
        // Store reference for cleanup
        accessory.context.accessoryInstance = buttonAccessory;
    },

    deviceConfig: function(key, defaultValue) {
        return get(this.config.devices, key, defaultValue)
    },

    getArrayString: function(array) {
        return array.toString() || "none";
    },

    updateDeviceList: function() {
        this.log.debug("updateDeviceList: Starting device list update");
        return this.fritz("getDeviceList")
            .then(function(devices) {
                this.log.debug("updateDeviceList: Received devices:", devices);
                this.log("Found " + (devices ? devices.length : 0) + " smart home devices");
                // cache list of devices in options for reuse by non-API functions
                this.deviceList = devices || [];
                return devices || [];
            }.bind(this))
            .catch(function(error) {
                this.log.error("getDeviceList failed:", error ? error.message || error.toString() : 'Unknown error');
                if (error && error.originalError) {
                    this.log.debug("Original error:", error.originalError);
                }
                // Don't re-throw, return empty device list instead
                this.deviceList = [];
                return [];
            }.bind(this));
    },

    getDevice: function(ain) {
        const device = this.deviceList.find(function(device) {
            return device.identifier.replace(/\s/g, '') == ain;
        });
        return device || {}; // safeguard
    },

    getName: function(ain) {
        const dev = this.getDevice(ain);
        return dev.name || ain;
    },

    fritz: function(func) {
        const args = Array.prototype.slice.call(arguments, 1);
        const self = this;

        // api call tracking
        if (self.config.concurrent !== false) {
            this.promise = null;
            this.promiseState = 'resolved';
        }
        else if (!this.promise || this.promiseState !== 'pending') {
            // Promise is not pending, create new one
        }
        else {
            // Promise is still pending
            this.pending++;
            this.log.debug('%s pending api calls', this.pending);
        }

        // Create a new promise that always resolves (like .reflect() did)
        const previousPromise = this.promise || Promise.resolve();
        this.promiseState = 'pending';
        
        this.promise = previousPromise.then(
            () => {}, // fulfilled handler
            () => {}  // rejected handler - catch errors to ensure promise always resolves
        ).then(function() {
            self.pending = Math.max(self.pending-1, 0);

            const fritzFunc = fritz[func];
            let funcArgs = [self.sid].concat(args).concat(self.options);

            self.log.debug("> %s (%s)", func, JSON.stringify(funcArgs.slice(0,-1)).slice(1,-1));

            return fritzFunc.apply(self, funcArgs).catch(function(error) {
                if (error.response && error.response.statusCode == 403) {
                    return fritz.getSessionID(self.config.username, self.config.password, self.options).then(function(sid) {
                        self.log("FRITZ!Box session renewed");
                        self.log("renewed:"+sid);
                        self.sid = sid;

                        funcArgs = [self.sid].concat(args).concat(self.options);
                        self.log("renewed, now calling:"+funcArgs.toString());
                        return fritzFunc.apply(self, funcArgs);
                    })
                    .catch(function(error) {
                        self.log.warn("FRITZ!Box session renewal failed");
                        /* jshint laxbreak:true */
                        throw error === "0000000000000000"
                            ? "Invalid session id"
                            : error;
                    });
                }

                throw error;
            });
        })
        .then(function(result) {
            // Promise fulfilled - update state
            self.promiseState = 'resolved';
            return result;
        })
        .catch(function(error) {
            self.log.debug(error);
            self.log.error("< %s failed", func);
            self.promise = null;
            self.promiseState = 'resolved';

            return Promise.reject(func + " failed");
        });

        // debug result
        this.promise.then(function(res) {
            self.log.debug("< %s %s", func, JSON.stringify(res));
            return res;
        }).catch(function() {
            // Catch any errors to prevent UnhandledPromiseRejection
            // Errors are already handled above, this is just for the debug chain
        });

        return this.promise;
    },

    fritzApi: function() {
        return fritz;
    }
};