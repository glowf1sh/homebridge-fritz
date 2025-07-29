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
    constructor(platform, ain) {
        super(platform, ain, "temperature sensor");

    Object.assign(this.services, {
        TemperatureSensor: new Service.TemperatureSensor(this.name)
    });

    this.services.TemperatureSensor.getCharacteristic(Characteristic.CurrentTemperature)
        .setProps({minValue: -50})
        .on('get', this.getCurrentTemperature.bind(this))
    ;

    this.services.TemperatureSensor.fritzCurrentTemperature = 20;

    this.update(); // execute immediately to get first initial values as fast as possible
    setInterval(this.update.bind(this), this.platform.interval);
    }

    update() {
    this.platform.log.debug(`Updating ${this.type} ${this.ain}`);
    this.queryCurrentTemperature();
    }
}

    return FritzTemperatureSensorAccessory;
};