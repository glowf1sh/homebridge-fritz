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
    constructor(platform, ain, index, name) {
        super(platform, ain, "button");

    this.index = index; // button index of device
    this.name = name; // button name for index

    Object.assign(this.services, {
        Switch: new Service.Switch(this.name)
    });

    this.services.Switch.getCharacteristic(Characteristic.On)
        .on('get', this.getButtonState.bind(this))
    ;

    setInterval(this.update.bind(this), this.platform.interval);
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
    }.bind(this));
    }

    update() {
    this.platform.log.debug(`Updating ${this.type} ${this.ain}`);

    // Switch
    this.getButtonState(function(foo, state) {
        this.services.Switch.getCharacteristic(Characteristic.On).setValue(foo, undefined, FritzPlatform.Context);
    }.bind(this));
    }
}

    return FritzButtonAccessory;
};