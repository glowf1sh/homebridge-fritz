/**
 * FritzAccessory - Base class for dynamic platform accessories
 *
 * @url https://github.com/glowf1sh/homebridge-fritz-new
 * @original author Andreas Götz
 * @new author Glowf1sh <https://twitch.tv/glowf1sh>
 * @license MIT
 */

/* jslint node: true, laxcomma: true, esversion: 6 */
"use strict";

const { parseTemperature } = require('./utils');

let Service, Characteristic, FritzPlatform;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    FritzPlatform = require('./platform')(homebridge);

    return FritzAccessory;
};

class FritzAccessory {
    constructor(platform, ain, type, platformAccessory) {
        // Support flexible constructor signatures for backward compatibility
        if (typeof ain === 'string' && typeof type === 'object' && !platformAccessory) {
            // New signature: constructor(platform, ain, platformAccessory)
            platformAccessory = type;
            type = platformAccessory.context.type || 'generic';
        } else if (typeof ain === 'object' && !type && !platformAccessory) {
            // New signature: constructor(platform, platformAccessory)
            platformAccessory = ain;
            ain = platformAccessory.context.ain;
            type = platformAccessory.context.type || 'generic';
        }
        
        this.platform = platform;
        this.ain = ain;
        this.type = type;
        this.platformAccessory = platformAccessory;
        this.accessory = platformAccessory; // For child classes

        // fix duplicate UUID (https://github.com/glowf1sh/homebridge-fritz-new/issues/27)
        this.uuid_base = type + ain;

        this.name = this.platform.getName(this.ain);
        this.device = this.platform.getDevice(this.ain);

        // Initialize services object for backward compatibility
        this.services = {};
    }

    // Dynamic platform doesn't use getServices
    getServices() {
        // Not needed for dynamic platform - services are managed by PlatformAccessory
        return [];
    }

    getCurrentTemperature(callback) {
        this.platform.log.debug(`Getting ${this.type} ${this.ain} temperature`);

        // characteristic CurrentTemperature is part of multiple services
        const service = this.services.Thermostat || this.services.TemperatureSensor;
        callback(null, service.fritzCurrentTemperature);
    }

    queryCurrentTemperature() {
        const service = this.services.Thermostat || this.services.TemperatureSensor;
        if (service === undefined) {
            return; // called accidentally, ignoring request
        }

        this.platform.fritz('getTemperature', this.ain).then(temperatureFromApi => {
            // Die Fritz!Box API liefert bereits Temperaturen in Celsius
            const validTemperature = parseTemperature(temperatureFromApi);
            
            service.fritzCurrentTemperature = validTemperature;
            service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(validTemperature);
        }).catch(err => {
            this.platform.log.error(`Error getting temperature for ${this.name}:`, err);
        });
    }
    
    // Cleanup method for when accessory is removed
    cleanup() {
        // Override in subclasses to clean up timers, intervals, etc.
    }
}