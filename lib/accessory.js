/**
 * FritzAccessory
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
    constructor(platform, ain, type) {
        this.platform = platform;
        this.ain = ain;
        this.type = type;

        // fix duplicate UUID (https://github.com/glowf1sh/homebridge-fritz-new/issues/27)
        this.uuid_base = type + ain;

        this.name = this.platform.getName(this.ain);
        this.device = this.platform.getDevice(this.ain);

        this.services = {
            AccessoryInformation: new Service.AccessoryInformation()
                .setCharacteristic(Characteristic.SerialNumber, this.ain)
        };

        // these characteristics will not be present for e.g. device groups
        if (this.device.manufacturer) {
            this.services.AccessoryInformation
                .setCharacteristic(Characteristic.Manufacturer, this.device.manufacturer);
        }
        if (this.device.productname) {
            this.services.AccessoryInformation
                .setCharacteristic(Characteristic.Model, this.device.productname);
        }
        if (this.device.fwversion) {
            this.services.AccessoryInformation
                .setCharacteristic(Characteristic.FirmwareRevision, this.device.fwversion);
        }
    }

    getServices() {
        return Object.keys(this.services).map(key => this.services[key]);
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
}