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
    constructor(platform, ain) {
        super(platform, ain, "thermostat");

    Object.assign(this.services, {
        Thermostat: new Service.Thermostat(this.name),
        BatteryService: new Service.BatteryService(this.name)
    });

    // Thermostat
    this.services.Thermostat.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
        .setProps({validValues: [0, 1]})
        .on('get', this.getCurrentHeatingCoolingState.bind(this))
    ;
    this.services.Thermostat.getCharacteristic(Characteristic.TargetHeatingCoolingState)
        .setProps({validValues: [0, 1]}) // only support "off" and "heating"
        .on('get', this.getTargetHeatingCoolingState.bind(this))
        .on('set', this.setTargetHeatingCoolingState.bind(this))
    ;
    this.services.Thermostat.getCharacteristic(Characteristic.CurrentTemperature)
        .setProps({minValue: -50})
        .on('get', this.getCurrentTemperature.bind(this))
    ;
    this.services.Thermostat.getCharacteristic(Characteristic.TargetTemperature)
        .setProps({validValueRanges: [8, 28], minValue: 8, maxValue: 28}) // supported temperature range of fritz thermostat
        .on('get', this.getTargetTemperature.bind(this))
        .on('set', this.setTargetTemperature.bind(this))
    ;
    this.services.Thermostat.getCharacteristic(Characteristic.TemperatureDisplayUnits)
        .on('get', this.getTemperatureDisplayUnits.bind(this))
    ;

    // BatteryService
    this.services.BatteryService.getCharacteristic(Characteristic.BatteryLevel)
        .on('get', this.getBatteryLevel.bind(this))
    ;
    this.services.BatteryService.getCharacteristic(Characteristic.ChargingState)
        .on('get', this.getChargingState.bind(this))
    ;
    this.services.BatteryService.getCharacteristic(Characteristic.StatusLowBattery)
        .on('get', this.getStatusLowBattery.bind(this))
    ;

    // init some default values until the first update response arrives
    this.services.Thermostat.fritzCurrentTemperature = 20;
    this.services.BatteryService.fritzBatteryLevel = 100;
    this.services.BatteryService.fritzStatusLowBattery = Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;
    this.services.Thermostat.fritzCurrentHeatingCoolingState = Characteristic.CurrentHeatingCoolingState.OFF;
    this.services.Thermostat.fritzTargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;
    this.services.Thermostat.fritzTargetTemperature = 20;

    this.update(); // execute immediately to get first initial values as fast as possible
    setInterval(this.update.bind(this), this.platform.interval);
    }

    getCurrentHeatingCoolingState(callback) {
    this.platform.log.debug(`Getting ${this.type} ${this.ain} current heating state`);

    // current state gets queried in getTargetTemperature
    callback(null, this.services.Thermostat.fritzCurrentHeatingCoolingState);
    }

    getTargetHeatingCoolingState(callback) {
    this.platform.log.debug(`Getting ${this.type} ${this.ain} target heating state`);

    // target state gets queried in getTargetTemperature
    callback(null, this.services.Thermostat.fritzTargetHeatingCoolingState);
    }

    setTargetHeatingCoolingState(state, callback) {
    this.platform.log.debug(`Setting ${this.type} ${this.ain} heating state`);

    const service = this.services.Thermostat;

    service.fritzTargetHeatingCoolingState = state;

    let currentState;
    if (state === Characteristic.TargetHeatingCoolingState.OFF) {
        this.platform.fritz("setTempTarget", this.ain, "off");
        currentState = Characteristic.CurrentHeatingCoolingState.OFF;
    } else if (state === Characteristic.TargetHeatingCoolingState.HEAT) {
        this.platform.fritz("setTempTarget", this.ain, service.fritzTargetTemperature);
        currentState = this.calculateCurrentHeatingCoolingState();
    }

    service.fritzCurrentHeatingCoolingState = currentState;
    service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(currentState);

    callback();
    }

    getTargetTemperature(callback) {
    this.platform.log.debug(`Getting ${this.type} ${this.ain} target temperature`);

    callback(null, this.services.Thermostat.fritzTargetTemperature);

    this.queryTargetTemperature(); // send query to fritz box; this will also update target/current heating cooling states
    }

    setTargetTemperature(temperature, callback) {
    this.platform.log(`Setting ${this.type} ${this.ain} target temperature`);

    const service = this.services.Thermostat;

    service.fritzTargetTemperature = temperature;
    service.fritzTargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.HEAT;
    service.fritzCurrentHeatingCoolingState = this.calculateCurrentHeatingCoolingState();

    service.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(service.fritzTargetHeatingCoolingState);
    service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(service.fritzCurrentHeatingCoolingState);

    this.platform.fritz('setTempTarget', this.ain, temperature);

    callback();
    }

    getTemperatureDisplayUnits(callback) {
    callback(null, Characteristic.TemperatureDisplayUnits.CELSIUS);
    }

    queryTargetTemperature() {
    this.platform.fritz('getTempTarget', this.ain).then(temperature => {
        const service = this.services.Thermostat;

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
    });
    }

    calculateCurrentHeatingCoolingState() {
    const service = this.services.Thermostat;

    // getCurrentTemperature was probably executed before (see #update); so it's enough to use the cached value
    const currentTemperature = service.fritzCurrentTemperature;
    return currentTemperature <= service.fritzTargetTemperature ? Characteristic.CurrentHeatingCoolingState.HEAT : Characteristic.CurrentHeatingCoolingState.OFF; // we are guessing the current state of the valve
    }

    getBatteryLevel(callback) {
    this.platform.log.debug(`Getting ${this.type} ${this.ain} battery level`);

    const service = this.services.BatteryService;
    callback(null, service.fritzBatteryLevel);
    }

    getChargingState(callback) {
    callback(null, Characteristic.ChargingState.NOT_CHARGEABLE);
    }

    getStatusLowBattery(callback) {
    this.platform.log.debug(`Getting ${this.type} ${this.ain} battery status`);

    const service = this.services.BatteryService;
    callback(null, service.fritzStatusLowBattery);
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

    update() {
    this.platform.log.debug(`Updating ${this.type} ${this.ain}`);

    this.queryCurrentTemperature();
    this.queryTargetTemperature();
    this.queryBatteryLevel();
    }
}

    return FritzThermostatAccessory;
};