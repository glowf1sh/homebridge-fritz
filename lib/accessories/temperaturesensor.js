/**
 * FritzTemperatureSensorAccessory
 *
 * @url https://github.com/glowf1sh/homebridge-fritz-new
 * @original author Andreas Götz
 * @new author Glowf1sh <https://twitch.tv/glowf1sh>
 * @license MIT
 */

/* jslint node: true, laxcomma: true, esversion: 8 */
"use strict";

let Service, Characteristic, FritzPlatform, FritzAccessory;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    FritzPlatform = require('../platform')(homebridge);
    FritzAccessory = require('../accessory')(homebridge);

    class FritzTemperatureSensorAccessory extends FritzAccessory {
        constructor(platform, ain, type, device) {
            super(platform, ain, type, device);
            
            if (device) {
                // Existing accessory from cache
                this.accessory = device;
                this.accessory.context.ain = ain;
                this.accessory.context.type = type;
            } else {
                // New accessory
                const name = this.name;
                const uuid = this.platform.api.hap.uuid.generate(ain);
                this.accessory = new this.platform.api.platformAccessory(name, uuid);
                this.accessory.context.ain = ain;
                this.accessory.context.type = type;
            }

            // Setup AccessoryInformation service
            if (!this.accessory.getService(Service.AccessoryInformation)) {
                this.accessory.addService(Service.AccessoryInformation);
            }
            
            const infoService = this.accessory.getService(Service.AccessoryInformation);
            infoService.setCharacteristic(Characteristic.SerialNumber, this.ain);
            
            if (this.device.manufacturer) {
                infoService.setCharacteristic(Characteristic.Manufacturer, this.device.manufacturer);
            }
            if (this.device.productname) {
                infoService.setCharacteristic(Characteristic.Model, this.device.productname);
            }
            if (this.device.fwversion) {
                infoService.setCharacteristic(Characteristic.FirmwareRevision, this.device.fwversion);
            }

            // Setup TemperatureSensor service
            let tempService = this.accessory.getService(Service.TemperatureSensor);
            if (!tempService) {
                tempService = this.accessory.addService(Service.TemperatureSensor, this.name);
            }

            tempService.getCharacteristic(Characteristic.CurrentTemperature)
                .setProps({minValue: -50})
                .on('get', this.getCurrentTemperature.bind(this));

            // Store references to services for quick access
            this.services = {
                AccessoryInformation: this.accessory.getService(Service.AccessoryInformation),
                TemperatureSensor: tempService
            };

            // Initialize state
            this.services.TemperatureSensor.fritzCurrentTemperature = 20;

            this.pollInterval = this.platform.interval;
            this.startPolling();
        }

        // Override getServices to work with dynamic platform
        getServices() {
            // Not needed for dynamic platform - services are managed by PlatformAccessory
            return [];
        }

    update() {
        this.platform.log.debug(`Updating ${this.type} ${this.ain}`);
        this.queryCurrentTemperature();
    }

    startPolling() {
        const poll = async () => {
            await this.update();
            this.pollTimeout = setTimeout(poll, this.pollInterval);
        };

        poll();
    }

    cleanup() {
        if (this.pollTimeout) {
            clearTimeout(this.pollTimeout);
            this.pollTimeout = null;
        }
    }
}

    return FritzTemperatureSensorAccessory;
};