/**
 * FritzOutletAccessory
 *
 * @url https://github.com/glowf1sh/homebridge-fritz-new
 * @original author Andreas Götz
 * @new author Glowf1sh <https://twitch.tv/glowf1sh>
 * @license MIT
 */

/* jslint node: true, laxcomma: true, esversion: 6 */
"use strict";

let Service, Characteristic, FritzPlatform, FritzAccessory;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    FritzPlatform = require('../platform')(homebridge);
    FritzAccessory = require('../accessory')(homebridge);

    return FritzOutletAccessory;
};

class FritzOutletAccessory extends FritzAccessory {
    constructor(platform, ain) {
        super(platform, ain, "outlet");

        Object.assign(this.services, {
            Outlet: new Service.Outlet(this.name)
        });

        // Outlet
        this.services.Outlet.getCharacteristic(Characteristic.On)
            .on('get', this.getOn.bind(this))
            .on('set', this.setOn.bind(this))
        ;

        this.services.Outlet.getCharacteristic(Characteristic.OutletInUse)
            .on('getInUse', this.getInUse.bind(this))
        ;

        this.services.Outlet.addCharacteristic(FritzPlatform.PowerUsage)
            .on('get', this.getPowerUsage.bind(this))
        ;

        this.services.Outlet.addCharacteristic(FritzPlatform.EnergyConsumption)
            .on('get', this.getEnergyConsumption.bind(this))
        ;

        // TemperatureSensor - add only of device supports it
        if (this.device.temperature && 
            this.platform.deviceConfig(`${ain}.TemperatureSensor`, true)
        ) {
            Object.assign(this.services, {
                TemperatureSensor: new Service.TemperatureSensor(this.name)
            });

            this.services.TemperatureSensor.getCharacteristic(Characteristic.CurrentTemperature)
                .setProps({minValue: -50})
                .on('get', this.getCurrentTemperature.bind(this))
            ;

            this.services.TemperatureSensor.fritzCurrentTemperature = 20;
        }

        this.services.Outlet.fritzState = false;
        this.services.Outlet.fritzInUse = false;
        this.services.Outlet.fritzPowerUsage = 0;
        this.services.Outlet.fritzEnergyConsumption = 0;

        this.pollInterval = this.platform.interval;
        this.startPolling();
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