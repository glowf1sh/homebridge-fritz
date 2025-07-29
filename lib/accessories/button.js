/**
 * FritzButtonAccessory
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

    class FritzButtonAccessory extends FritzAccessory {
        constructor(platform, ain, type, device) {
            // Handle special button constructor with index and name
            let index, buttonName;
            if (typeof type === 'number') {
                // Old signature: constructor(platform, ain, index, name)
                index = type;
                buttonName = device;
                type = 'button';
                device = null;
            } else if (device && device.context && device.context.index !== undefined) {
                // Existing accessory with index in context
                index = device.context.index;
                buttonName = device.context.buttonName || device.displayName;
            }
            
            super(platform, ain, type, device);
            
            if (device) {
                // Existing accessory from cache
                this.accessory = device;
                this.accessory.context.ain = ain;
                this.accessory.context.type = type;
                this.accessory.context.index = index;
                this.accessory.context.buttonName = buttonName;
            } else {
                // New accessory
                const name = buttonName || this.name;
                const uuid = this.platform.api.hap.uuid.generate(`${ain}-${index}`);
                this.accessory = new this.platform.api.platformAccessory(name, uuid);
                this.accessory.context.ain = ain;
                this.accessory.context.type = type;
                this.accessory.context.index = index;
                this.accessory.context.buttonName = buttonName;
            }

            this.index = index || this.accessory.context.index;
            this.name = buttonName || this.accessory.context.buttonName || this.name;

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

            // Setup Switch service
            let switchService = this.accessory.getService(Service.Switch);
            if (!switchService) {
                switchService = this.accessory.addService(Service.Switch, this.name);
            }

            switchService.getCharacteristic(Characteristic.On)
                .on('get', this.getButtonState.bind(this));

            // Store references to services for quick access
            this.services = {
                AccessoryInformation: this.accessory.getService(Service.AccessoryInformation),
                Switch: switchService
            };

            this.pollInterval = this.platform.interval;
            this.startPolling();
        }

        // Override getServices to work with dynamic platform
        getServices() {
            // Not needed for dynamic platform - services are managed by PlatformAccessory
            return [];
        }

    getButtonState(callback) {
    this.platform.log.debug(`Getting ${this.type} ${this.ain} button state`);

    let service = this.services.Switch;
    callback(null, service.fritzButtonState);

    this.platform.fritz('getDeviceListFiltered', { identifier: this.ain }).then(function(devices) {
        let lastPressed = +devices[0].button[this.index].lastpressedtimestamp;

        let pressDetected;
        if (this.lastPressed === undefined) {
            pressDetected = Date.now() - lastPressed * 1000 < this.platform.interval;
        } else {
            pressDetected = this.lastPressed != lastPressed;
        }

        if (this.lastPressed !== undefined && this.lastPressed != lastPressed) {
            service.getCharacteristic(Characteristic.On).setValue(true);
            setTimeout(function() {
                service.getCharacteristic(Characteristic.On).setValue(false);
            }, 1000);
        }

        this.lastPressed = lastPressed;
    }.bind(this)).catch(error => {
        this.platform.log.error(`Failed to get button state for ${this.name}:`, error);
    });
    }

    update() {
        this.platform.log.debug(`Updating ${this.type} ${this.ain}`);

        // Switch
        this.getButtonState(function(foo, state) {
            this.services.Switch.getCharacteristic(Characteristic.On).setValue(foo, undefined, FritzPlatform.Context);
        }.bind(this));
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

    return FritzButtonAccessory;
};