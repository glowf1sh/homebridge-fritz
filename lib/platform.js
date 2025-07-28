/**
 * FritzPlatform
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
let Characteristic, Homebridge;

module.exports = function(homebridge) {
    Homebridge = homebridge;
    Characteristic = homebridge.hap.Characteristic;

    inherits(FritzPlatform.PowerUsage, Characteristic);
    inherits(FritzPlatform.EnergyConsumption, Characteristic);

    return FritzPlatform;
};

function FritzPlatform(log, config) {
    this.log = log;
    this.config = config;
    
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
}

FritzPlatform.PowerUsage = function() {
    Characteristic.call(this, 'Power Usage', 'AE48F447-E065-4B31-8050-8FB06DB9E087');

    this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'W',
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });

    this.value = this.getDefaultValue();
};

FritzPlatform.EnergyConsumption = function() {
    Characteristic.call(this, 'Energy Consumption', 'C4805C5B-45B7-4E5B-BFCB-FE43E0FBC1E5');

    this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kWh',
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });

    this.value = this.getDefaultValue();
};

FritzPlatform.prototype = {
    accessories: function(callback) {
        const accessories = [];
        const self = this;

        // Wrap entire promise chain to ensure all errors are caught
        const accessoryPromise = fritz.getSessionID(this.config.username, this.config.password, this.options).then(function(sid) {
            self.log("FRITZ!Box platform login successful");
            self.sid = sid;
            
            self.log("Discovering accessories");

            // wifi
            if (self.deviceConfig("wifi.display", true)) {
                let FritzWifiAccessory = require('./accessories/wifi')(Homebridge);
                accessories.push(new FritzWifiAccessory(self));
            }

            // Return the promise from updateDeviceList to properly chain the promises
            return self.updateDeviceList();
        })
        .then(function(devices) {
            const jobs = [];

            // outlets
            jobs.push(
                self.fritz("getSwitchList")
                    .then(function(ains) {
                        self.log("Outlets found: %s", self.getArrayString(ains));
                        let FritzOutletAccessory = require('./accessories/outlet')(Homebridge);

                        ains.forEach(function(ain) {
                            if (self.deviceConfig(`${ain}.display`, true)) {
                                accessories.push(new FritzOutletAccessory(self, ain));
                            }
                        });
                    })
                    .catch(function(error) {
                        self.log.error("getSwitchList failed:", error);
                        // Return undefined to continue with other accessories
                        return undefined;
                    })
            );

            // thermostats
            jobs.push(
                self.fritz('getThermostatList')
                    .then(function(ains) {
                        self.log("Thermostats found: %s", self.getArrayString(ains));
                        let FritzThermostatAccessory = require('./accessories/thermostat')(Homebridge);

                        ains.forEach(function(ain) {
                            if (self.deviceConfig(`${ain}.display`, true)) {
                                accessories.push(new FritzThermostatAccessory(self, ain));
                            }
                        });

                        // add remaining non-api devices that support temperature, e.g. FRITZ!DECT 100 repeater
                        const sensors = [];
                        devices.forEach(function(device) {
                            if (device.temperature) {
                                const ain = device.identifier.replace(/\s/g, '');
                                if (!accessories.find(function(accessory) {
                                    return accessory.ain && accessory.ain == ain;
                                })) {
                                    sensors.push(ain);
                                }
                            }
                        });

                        if (sensors.length) {
                            let FritzTemperatureSensorAccessory = require('./accessories/temperaturesensor')(Homebridge);

                            sensors.forEach(function(ain) {
                                if (self.deviceConfig(`${ain}.display`, true) &&
                                    self.deviceConfig(`${ain}.TemperatureSensor`, true)
                                ) {
                                    accessories.push(new FritzTemperatureSensorAccessory(self, ain));
                                }
                            });
                        }
                        self.log("Sensors found: %s", self.getArrayString(sensors));
                    })
                    .catch(function(error) {
                        self.log.error("getThermostatList failed:", error);
                        // Return undefined to continue with other accessories
                        return undefined;
                    })
            );

            // alarm sensors
            const alarms = [];
            devices.forEach(function(device) {
                // @TODO deduplicate alarms similar to temp sensors
                if (device.alert) {
                    alarms.push(device.identifier);
                }
            });

            if (alarms.length) {
                let FritzAlarmSensorAccessory = require('./accessories/alarmsensor')(Homebridge);

                alarms.forEach(function(ain) {
                    if (self.deviceConfig(`${ain}.display`, true) &&
                        self.deviceConfig(`${ain}.ContactSensor`, true)
                    ) {
                        accessories.push(new FritzAlarmSensorAccessory(self, ain));
                    }
                });
            }
            self.log("Alarm sensors found: %s", self.getArrayString(alarms));

            // buttons
            const buttons = [];
            devices.forEach(function (device) {
                let FritzButtonAccessory = require('./accessories/button')(Homebridge);

                if (device.button) {
                    const ain = device.identifier.replace(/\s/g, '');
                    if (!accessories.find(function (accessory) {
                        return accessory.ain && accessory.ain == ain;
                    })) {
                        buttons.push(ain);

                        if (self.deviceConfig(`${ain}.display`, true)) {
                            device.button.forEach(function(button, index) {
                                accessories.push(new FritzButtonAccessory(self, ain, index, button.name));
                            });
                        }
                    }
                }
            });
            self.log("Buttons found: %s", self.getArrayString(buttons));

            Promise.all(jobs).then(function() {
                callback(accessories);
            }).catch(function(jobError) {
                self.log.error("Error in Promise.all jobs:", jobError);
                // Still call callback with whatever accessories we have
                callback(accessories);
            });
        })
        .catch(function(error) {
            self.log.error("FRITZ!Box API Error Details:");
            self.log.error("Error message:", error ? error.message || error.toString() : 'Unknown error');
            if (error && error.response) {
                self.log.error("Response status:", error.response.status);
                self.log.error("Response data:", error.response.data);
            }
            if (error && error.originalError) {
                self.log.error("Original error:", error.originalError);
            }
            self.log.debug("Full error:", error);
            self.log.error("Could not get devices from FRITZ!Box. Please check if device supports the smart home API and user has sufficient privileges.");
            callback(accessories);
        });
        
        // Add a catch handler for the entire promise chain to prevent UnhandledPromiseRejection
        accessoryPromise.catch(function(error) {
            self.log.error("Unhandled error in accessories promise chain:", error);
            // Ensure callback is always called even if there's an error
            if (callback && typeof callback === 'function') {
                callback(accessories);
            }
        });
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
