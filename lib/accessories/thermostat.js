/**
 * FritzThermostatAccessory
 *
 * @url https://github.com/glowf1sh/homebridge-fritz-new
 * @original author Andreas Götz
 * @new author Glowf1sh <https://twitch.tv/glowf1sh>
 * @license MIT
 */

/* jslint node: true, laxcomma: true, esversion: 8 */
"use strict";

const { parseBatteryLevel } = require('../utils');

let Service, Characteristic, FritzPlatform, FritzAccessory;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    FritzPlatform = require('../platform')(homebridge);
    FritzAccessory = require('../accessory')(homebridge);

    class FritzThermostatAccessory extends FritzAccessory {
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

            // Setup Thermostat service
            let thermostatService = this.accessory.getService(Service.Thermostat);
            if (!thermostatService) {
                thermostatService = this.accessory.addService(Service.Thermostat, this.name);
            }

            // Thermostat characteristics
            thermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
                .setProps({validValues: [0, 1]})
                .onGet(async () => {
                    try {
                        return await this.getCurrentHeatingCoolingState();
                    } catch (error) {
                        this.platform.log.error(`[${this.name}] Failed to get current heating cooling state:`, error);
                        throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
                    }
                });
            
            thermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
                .setProps({validValues: [0, 1]}) // only support "off" and "heating"
                .onGet(async () => {
                    try {
                        return await this.getTargetHeatingCoolingState();
                    } catch (error) {
                        this.platform.log.error(`[${this.name}] Failed to get target heating cooling state:`, error);
                        throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
                    }
                })
                .onSet(async (state) => {
                    try {
                        await this.setTargetHeatingCoolingState(state);
                    } catch (error) {
                        this.platform.log.error(`[${this.name}] Failed to set target heating cooling state:`, error);
                        throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
                    }
                });
            
            thermostatService.getCharacteristic(Characteristic.CurrentTemperature)
                .setProps({minValue: -50})
                .onGet(async () => {
                    try {
                        return await this.getCurrentTemperature();
                    } catch (error) {
                        this.platform.log.error(`[${this.name}] Failed to get current temperature:`, error);
                        throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
                    }
                });
            
            thermostatService.getCharacteristic(Characteristic.TargetTemperature)
                .setProps({validValueRanges: [8, 28], minValue: 8, maxValue: 28}) // supported temperature range of fritz thermostat
                .onGet(async () => {
                    try {
                        return await this.getTargetTemperature();
                    } catch (error) {
                        this.platform.log.error(`[${this.name}] Failed to get target temperature:`, error);
                        throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
                    }
                })
                .onSet(async (temperature) => {
                    try {
                        await this.setTargetTemperature(temperature);
                    } catch (error) {
                        this.platform.log.error(`[${this.name}] Failed to set target temperature:`, error);
                        throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
                    }
                });
            
            thermostatService.getCharacteristic(Characteristic.TemperatureDisplayUnits)
                .onGet(async () => {
                    try {
                        return await this.getTemperatureDisplayUnits();
                    } catch (error) {
                        this.platform.log.error(`[${this.name}] Failed to get temperature display units:`, error);
                        throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
                    }
                });

            // Setup BatteryService
            let batteryService = this.accessory.getService(Service.BatteryService);
            if (!batteryService) {
                batteryService = this.accessory.addService(Service.BatteryService, this.name);
            }

            // BatteryService characteristics
            batteryService.getCharacteristic(Characteristic.BatteryLevel)
                .onGet(async () => {
                    try {
                        return await this.getBatteryLevel();
                    } catch (error) {
                        this.platform.log.error(`[${this.name}] Failed to get battery level:`, error);
                        throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
                    }
                });
            
            batteryService.getCharacteristic(Characteristic.ChargingState)
                .onGet(async () => {
                    try {
                        return await this.getChargingState();
                    } catch (error) {
                        this.platform.log.error(`[${this.name}] Failed to get charging state:`, error);
                        throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
                    }
                });
            
            batteryService.getCharacteristic(Characteristic.StatusLowBattery)
                .onGet(async () => {
                    try {
                        return await this.getStatusLowBattery();
                    } catch (error) {
                        this.platform.log.error(`[${this.name}] Failed to get low battery status:`, error);
                        throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
                    }
                });

            // Store references to services for quick access
            this.services = {
                AccessoryInformation: infoService,
                Thermostat: thermostatService,
                BatteryService: batteryService
            };

            // Initialize state
            this.services.Thermostat.fritzCurrentTemperature = 20;
            this.services.BatteryService.fritzBatteryLevel = 100;
            this.services.BatteryService.fritzStatusLowBattery = Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;
            this.services.Thermostat.fritzCurrentHeatingCoolingState = Characteristic.CurrentHeatingCoolingState.OFF;
            this.services.Thermostat.fritzTargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;
            this.services.Thermostat.fritzTargetTemperature = 20;

            this.pollInterval = this.platform.interval;
            this.startPolling();
        }

        // Override getServices to work with dynamic platform
        getServices() {
            // Not needed for dynamic platform - services are managed by PlatformAccessory
            return [];
        }

    async getCurrentHeatingCoolingState() {
        this.platform.log.debug(`Getting ${this.type} ${this.ain} current heating state`);

        // current state gets queried in getTargetTemperature
        return this.services.Thermostat.fritzCurrentHeatingCoolingState;
    }

    async getTargetHeatingCoolingState() {
        this.platform.log.debug(`Getting ${this.type} ${this.ain} target heating state`);

        // target state gets queried in getTargetTemperature
        return this.services.Thermostat.fritzTargetHeatingCoolingState;
    }

    async setTargetHeatingCoolingState(state) {
        this.platform.log.debug(`Setting ${this.type} ${this.ain} heating state`);

        const service = this.services.Thermostat;

        service.fritzTargetHeatingCoolingState = state;

        let currentState;
        if (state === Characteristic.TargetHeatingCoolingState.OFF) {
            await this.platform.fritz("setTempTarget", this.ain, "off");
            currentState = Characteristic.CurrentHeatingCoolingState.OFF;
        } else if (state === Characteristic.TargetHeatingCoolingState.HEAT) {
            await this.platform.fritz("setTempTarget", this.ain, service.fritzTargetTemperature);
            currentState = this.calculateCurrentHeatingCoolingState();
        }

        service.fritzCurrentHeatingCoolingState = currentState;
        service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(currentState);
    }

    async getTargetTemperature() {
        this.platform.log.debug(`Getting ${this.type} ${this.ain} target temperature`);

        // send query to fritz box; this will also update target/current heating cooling states
        this.queryTargetTemperature();

        return this.services.Thermostat.fritzTargetTemperature;
    }

    async setTargetTemperature(temperature) {
        this.platform.log.info(`Setting ${this.type} ${this.ain} target temperature to ${temperature}°C`);

        const service = this.services.Thermostat;

        service.fritzTargetTemperature = temperature;
        service.fritzTargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.HEAT;
        service.fritzCurrentHeatingCoolingState = this.calculateCurrentHeatingCoolingState();

        service.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(service.fritzTargetHeatingCoolingState);
        service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(service.fritzCurrentHeatingCoolingState);

        try {
            await this.platform.fritz('setTempTarget', this.ain, temperature);
            this.platform.log.debug(`Successfully set ${this.name} to ${temperature}°C`);
        } catch (error) {
            this.platform.log.error(`Failed to set temperature for ${this.name}: ${error.message}`);
            throw error; // Re-throw to let HomeKit know it failed
        }
    }

    async getTemperatureDisplayUnits() {
        return Characteristic.TemperatureDisplayUnits.CELSIUS;
    }

    queryTargetTemperature() {
    this.platform.fritz('getTempTarget', this.ain).then(temperature => {
        const service = this.services.Thermostat;
        
        // Handle null/undefined responses (offline devices)
        if (temperature === null || temperature === undefined) {
            this.platform.log.debug(`[${this.name}] Device offline or not responding, keeping last known values`);
            return; // Don't update anything, keep last known values
        }

        let targetTemperature = temperature;
        let currentHeatingCoolingState;
        let targetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.HEAT;

        if (temperature === "on") { // change to hap representable value if thermostat is set to on permanently
            targetTemperature = service.getCharacteristic(Characteristic.TargetTemperature).props.maxValue;
        }

        if (temperature === "off") {
            targetTemperature = service.fritzTargetTemperature;
            currentHeatingCoolingState = Characteristic.CurrentHeatingCoolingState.OFF;
            targetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;
        } else {
            currentHeatingCoolingState = this.calculateCurrentHeatingCoolingState();
        }

        service.fritzTargetTemperature = targetTemperature;
        service.fritzCurrentHeatingCoolingState = currentHeatingCoolingState;
        service.fritzTargetHeatingCoolingState = targetHeatingCoolingState;

        service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(currentHeatingCoolingState);
        service.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(targetHeatingCoolingState);
        service.getCharacteristic(Characteristic.TargetTemperature).updateValue(targetTemperature);
    }).catch(error => {
        this.platform.log.debug(`Error getting target temperature for ${this.ain}:`, error.message);
        // Keep using last known values on error
    });
    }

    calculateCurrentHeatingCoolingState() {
        const service = this.services.Thermostat;
        
        // Check for window open state first (highest priority)
        if (this.device && this.device.hkr && this.device.hkr.windowopenactive) {
            this.platform.log.debug(`[${this.name}] Window open detected, thermostat is OFF`);
            return Characteristic.CurrentHeatingCoolingState.OFF;
        }
        
        // Check if thermostat is set to OFF (tsoll <= 8°C)
        if (service.fritzTargetTemperature <= 8) {
            return Characteristic.CurrentHeatingCoolingState.OFF;
        }
        
        // Check for boost mode
        if (this.device && this.device.hkr && this.device.hkr.boostactive) {
            this.platform.log.debug(`[${this.name}] Boost mode active, thermostat is HEATING`);
            return Characteristic.CurrentHeatingCoolingState.HEAT;
        }
        
        // Normal operation: compare current vs target temperature
        const currentTemperature = service.fritzCurrentTemperature;
        return currentTemperature <= service.fritzTargetTemperature ? 
            Characteristic.CurrentHeatingCoolingState.HEAT : 
            Characteristic.CurrentHeatingCoolingState.OFF;
    }

    async getBatteryLevel() {
        this.platform.log.debug(`Getting ${this.type} ${this.ain} battery level`);

        const service = this.services.BatteryService;
        return service.fritzBatteryLevel;
    }

    async getChargingState() {
        return Characteristic.ChargingState.NOT_CHARGEABLE;
    }

    async getStatusLowBattery() {
        this.platform.log.debug(`Getting ${this.type} ${this.ain} battery status`);

        const service = this.services.BatteryService;
        return service.fritzStatusLowBattery;
    }

    async getCurrentTemperature() {
        this.platform.log.debug(`Getting ${this.type} ${this.ain} temperature`);

        // characteristic CurrentTemperature is part of multiple services
        const service = this.services.Thermostat || this.services.TemperatureSensor;
        return service.fritzCurrentTemperature;
    }

    queryBatteryLevel() {
    this.platform.fritz('getBatteryCharge', this.ain).then(batteryLevelFromApi => {
        const service = this.services.BatteryService;
        const validBatteryLevel = parseBatteryLevel(batteryLevelFromApi);

        service.fritzBatteryLevel = validBatteryLevel;
        service.fritzStatusLowBattery = validBatteryLevel < 20 ? Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW : Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;

        // update internal value; event get only sent when value changes
        service.getCharacteristic(Characteristic.BatteryLevel).updateValue(service.fritzBatteryLevel);
        service.getCharacteristic(Characteristic.StatusLowBattery).updateValue(service.fritzStatusLowBattery);
    }).catch(err => {
        this.platform.log.error(`Error getting battery level for ${this.name}:`, err);
    });
    }

    update(device) {
        this.platform.log.debug(`Updating ${this.type} ${this.ain}`);
        
        // Update device data if provided
        if (device) {
            this.device = device;
            
            // Update heating state based on new device data
            const service = this.services.Thermostat;
            const newState = this.calculateCurrentHeatingCoolingState();
            if (service.fritzCurrentHeatingCoolingState !== newState) {
                service.fritzCurrentHeatingCoolingState = newState;
                service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(newState);
            }
        }

        this.queryCurrentTemperature();
        this.queryTargetTemperature();
        this.queryBatteryLevel();
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

    return FritzThermostatAccessory;
};