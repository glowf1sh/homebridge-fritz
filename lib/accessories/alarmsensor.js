/**
 * FritzAlarmSensorAccessory
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

    class FritzAlarmSensorAccessory extends FritzAccessory {
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

            // Setup ContactSensor service
            let contactService = this.accessory.getService(Service.ContactSensor);
            if (!contactService) {
                contactService = this.accessory.addService(Service.ContactSensor, this.name);
            }

            contactService.getCharacteristic(Characteristic.ContactSensorState)
                .on('get', this.getSensorState.bind(this));

            // Store references to services for quick access
            this.services = {
                AccessoryInformation: this.accessory.getService(Service.AccessoryInformation),
                ContactSensor: contactService
            };

            this.pollInterval = this.platform.interval;
            this.startPolling();
        }

        // Override getServices to work with dynamic platform
        getServices() {
            // Not needed for dynamic platform - services are managed by PlatformAccessory
            return [];
        }

    getSensorState(callback) {
    this.platform.log.debug(`Getting ${this.type} ${this.ain} alarm state`);

    callback(null, this.services.ContactSensor.fritzAlarmState);
    this.querySensorState();
    }

    querySensorState() {
    this.platform.fritz('getDeviceListFiltered', { identifier: this.ain }).then(function (devices) {
        const service = this.services.ContactSensor;
        let state = +devices[0].alert.state ? Characteristic.ContactSensorState.CONTACT_NOT_DETECTED : Characteristic.ContactSensorState.CONTACT_DETECTED;

        // invert if enabled
        state = this.platform.deviceConfig(`${this.ain}.invert`, false) ? 1-state : state;

        service.fritzAlarmState = state;
        service.getCharacteristic(Characteristic.ContactSensorState).updateValue(state);
    }.bind(this));
    }

    update() {
        this.platform.log.debug(`Updating ${this.type} ${this.ain}`);
        this.querySensorState();
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
        }
    }
}

    return FritzAlarmSensorAccessory;
};