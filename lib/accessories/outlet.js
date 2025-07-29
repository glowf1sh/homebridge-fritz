/**
 * FritzOutletAccessory
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

    class FritzOutletAccessory extends FritzAccessory {
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
            
            this.platformAccessory = this.accessory; // For backward compatibility

            // Setup services
            if (!this.platformAccessory.getService(Service.AccessoryInformation)) {
                this.platformAccessory.addService(Service.AccessoryInformation);
            }
            
            // Update accessory information
            const infoService = this.platformAccessory.getService(Service.AccessoryInformation);
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

            // Setup Outlet service
            let outletService = this.platformAccessory.getService(Service.Outlet);
            if (!outletService) {
                outletService = this.platformAccessory.addService(Service.Outlet, this.name);
            }

            // Outlet characteristics
            outletService.getCharacteristic(Characteristic.On)
                .on('get', this.getOn.bind(this))
                .on('set', this.setOn.bind(this));

            outletService.getCharacteristic(Characteristic.OutletInUse)
                .on('get', this.getInUse.bind(this));

            // Add PowerUsage characteristic if not exists
            // Check using characteristics array to avoid auto-adding by getCharacteristic
            const hasPowerUsage = outletService.characteristics.some(c => 
                c.UUID === FritzPlatform.PowerUsage.UUID || 
                (c.constructor && c.constructor.UUID === FritzPlatform.PowerUsage.UUID)
            );
            if (!hasPowerUsage) {
                outletService.addCharacteristic(FritzPlatform.PowerUsage);
            }
            outletService.getCharacteristic(FritzPlatform.PowerUsage)
                .on('get', this.getPowerUsage.bind(this));

            // Add EnergyConsumption characteristic if not exists
            const hasEnergyConsumption = outletService.characteristics.some(c => 
                c.UUID === FritzPlatform.EnergyConsumption.UUID || 
                (c.constructor && c.constructor.UUID === FritzPlatform.EnergyConsumption.UUID)
            );
            if (!hasEnergyConsumption) {
                outletService.addCharacteristic(FritzPlatform.EnergyConsumption);
            }
            outletService.getCharacteristic(FritzPlatform.EnergyConsumption)
                .on('get', this.getEnergyConsumption.bind(this));

            // TemperatureSensor - add only if device supports it (check functionbitmask)
            const functionbitmask = this.accessory.context.functionbitmask || 0;
            const hasTemperature = (functionbitmask & 32) !== 0;
            
            if (hasTemperature && 
                this.platform.deviceConfig(`${ain}.TemperatureSensor`, true)
            ) {
                let tempService = this.platformAccessory.getService(Service.TemperatureSensor);
                if (!tempService) {
                    tempService = this.platformAccessory.addService(Service.TemperatureSensor, this.name);
                }

                tempService.getCharacteristic(Characteristic.CurrentTemperature)
                    .setProps({minValue: -50})
                    .on('get', this.getCurrentTemperature.bind(this));
            } else {
                // Remove temperature service if it exists but device no longer supports it
                const tempService = this.platformAccessory.getService(Service.TemperatureSensor);
                if (tempService) {
                    this.platformAccessory.removeService(tempService);
                }
            }

            // Store references to services for quick access
            this.services = {
                AccessoryInformation: infoService,
                Outlet: outletService
            };
            
            if (hasTemperature && this.platform.deviceConfig(`${ain}.TemperatureSensor`, true)) {
                this.services.TemperatureSensor = this.platformAccessory.getService(Service.TemperatureSensor);
            }

            // Initialize state
            this.services.Outlet.fritzState = false;
            this.services.Outlet.fritzInUse = false;
            this.services.Outlet.fritzPowerUsage = 0;
            this.services.Outlet.fritzEnergyConsumption = 0;
            
            if (this.services.TemperatureSensor) {
                this.services.TemperatureSensor.fritzCurrentTemperature = 20;
            }
            
            // Check for power meter capability
            const hasPowerMeter = (functionbitmask & 65536) !== 0;
            if (hasPowerMeter) {
                // Power meter characteristics are already added in constructor
                this.platform.log.debug(`Outlet ${ain} has power meter capability`);
            }

            // Polling is now handled centrally by platform
            // Initial update
            this.update();
        }

        // Override getServices to work with dynamic platform
        getServices() {
            // Not needed for dynamic platform - services are managed by PlatformAccessory
            return [];
        }

        getOn(callback) {
            this.platform.log.debug(`Getting ${this.type} ${this.ain} state`);

            callback(null, this.services.Outlet.fritzState);

            this.queryOn();
        }

        setOn(state, callback) {
            this.platform.log(`Switching ${this.type} ${this.ain} to ` + state);

            this.services.Outlet.fritzState = state;
            this.platform.fritz(state ? 'setSwitchOn' : 'setSwitchOff', this.ain);

            callback();
        }

        queryOn() {
            this.platform.fritz('getSwitchState', this.ain).then(state => {
                const service = this.services.Outlet;
                service.fritzState = state;
                service.getCharacteristic(Characteristic.On).updateValue(state);
            }).catch(error => {
                this.platform.log.debug(`Failed to query switch state for ${this.ain}:`, error.message);
            });
        }

        getInUse(callback) {
            this.platform.log.debug(`Getting ${this.type} ${this.ain} in use`);

            callback(null, this.services.Outlet.fritzInUse);
            this.queryPowerUsage();
        }

        getPowerUsage(callback) {
            this.platform.log.debug(`Getting ${this.type} ${this.ain} power usage`);

            callback(null, this.services.Outlet.fritzPowerUsage);
            this.queryPowerUsage();
        }

        queryPowerUsage() {
            this.platform.fritz('getSwitchPower', this.ain).then(power => {
                const service = this.services.Outlet;

                service.fritzInUse = power > 0;
                service.fritzPowerUsage = power;

                service.getCharacteristic(Characteristic.OutletInUse).updateValue(service.fritzInUse);
                service.getCharacteristic(FritzPlatform.PowerUsage).updateValue(power);
            }).catch(error => {
                this.platform.log.debug(`Failed to query power usage for ${this.ain}:`, error.message);
            });
        }

        getEnergyConsumption(callback) {
            this.platform.log.debug(`Getting ${this.type} ${this.ain} energy consumption`);

            callback(null, this.services.Outlet.fritzEnergyConsumption);
            this.queryEnergyConsumption();
        }

        queryEnergyConsumption() {
            this.platform.fritz('getSwitchEnergy', this.ain).then(energy => {
                const service = this.services.Outlet;

                energy = energy / 1000.0;
                service.fritzEnergyConsumption = energy;
                service.getCharacteristic(FritzPlatform.EnergyConsumption).updateValue(energy);
            }).catch(error => {
                this.platform.log.debug(`Failed to query energy consumption for ${this.ain}:`, error.message);
            });
        }

        async update() {
            this.platform.log.debug(`Updating ${this.type} ${this.ain}`);

            // Outlet
            this.queryOn();
            this.queryPowerUsage();
            this.queryEnergyConsumption();

            // TemperatureSensor
            if (this.services.TemperatureSensor) {
                this.queryCurrentTemperature();
            }
        }

        cleanup() {
            // Cleanup handled by platform
        }
    }

    return FritzOutletAccessory;
};