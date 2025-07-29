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
    constructor(platform, ain) {
        super(platform, ain, "alarm sensor");

    Object.assign(this.services, {
        ContactSensor: new Service.ContactSensor(this.name)
    });

    this.services.ContactSensor.getCharacteristic(Characteristic.ContactSensorState)
        .on('get', this.getSensorState.bind(this))
    ;

    this.update(); // execute immediately to get first initial values as fast as possible
    setInterval(this.update.bind(this), this.platform.interval);
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
}

    return FritzAlarmSensorAccessory;
};