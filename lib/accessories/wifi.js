/**
 * FritzWifiAccessory
 *
 * @url https://github.com/glowf1sh/homebridge-fritz-new
 * @original author Andreas Götz
 * @new author Glowf1sh <https://twitch.tv/glowf1sh>
 * @license MIT
 */

/* jslint node: true, laxcomma: true, esversion: 6 */
"use strict";

const url = require("url");
const TR064 = require("../tr064").Fritzbox;

let Service, Characteristic, FritzPlatform;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    FritzPlatform = require('../platform')(homebridge);

    return FritzWifiAccessory;
};

function FritzWifiAccessory(platform) {
    this.platform = platform;
    this.name = this.platform.deviceConfig("wifi.name", "Guest WLAN");

    this.services = {
        AccessoryInformation: new Service.AccessoryInformation(),
        Switch: new Service.Switch(this.name)
    };

    this.services.AccessoryInformation
        .setCharacteristic(Characteristic.Manufacturer, "AVM");
    this.services.AccessoryInformation
        .setCharacteristic(Characteristic.Model, "FRITZ!Box");

    this.platform.fritz('getOSVersion').then(function(version) {
        this.services.AccessoryInformation
            .setCharacteristic(Characteristic.FirmwareRevision, version);
    }.bind(this));

    if (this.platform.deviceConfig("wifi.tr64Fallback", false)) {
        this.fallback = true;
        // fritzapi screen scraping
        this.services.Switch.getCharacteristic(Characteristic.On)
            .on('get', this.getOnFallback.bind(this))
            .on('set', this.setOnFallback.bind(this))
        ;

        this.update(); // execute immediately to get first initial values as fast as possible
    } else {
        this.platform.log("Using tr64 api for guest Wifi");

        const box = url.parse(this.platform.options.url);

        const options = {
            host: box.host || 'fritz.box',
            port: this.platform.deviceConfig("wifi.tr64Port", 49443),
            ssl: this.platform.deviceConfig("wifi.tr64Ssl", true),
            user: this.platform.config.username,
            password: this.platform.config.password,
            log: this.platform.log  // Pass log to TR064 client
        };
        
        // Debug: Log TR-064 connection info (without password)
        this.platform.log.debug("TR-064 options:", {
            host: options.host,
            port: options.port,
            ssl: options.ssl,
            user: options.user,
            hasPassword: !!options.password
        });

        const tr64 = new TR064(options);
        const self = this;

        tr64.initTR064Device().then(() => {
            self.platform.log("TR-064 device initialized successfully");
            // remember service
            let wifiService = "urn:dslforum-org:service:WLANConfiguration";
            self.tr64service = tr64.services[wifiService + ":3"] || tr64.services[wifiService + ":2"];
            
            if (!self.tr64service) {
                self.platform.log.error("No WLANConfiguration service found!");
                self.platform.log.debug("Available services:", Object.keys(tr64.services));
            } else {
                self.platform.log("Using TR-064 service:", self.tr64service.serviceType);
            }

            self.services.Switch.getCharacteristic(Characteristic.On)
                .on('get', self.getOn.bind(self))
                .on('set', self.setOn.bind(self))
            ;

            this.update(); // execute immediately to get first initial values as fast as possible
        }).catch((err) => {
            self.platform.log.error("TR-064 initialization failed:", err.message || err);
            if (err.stack) {
                self.platform.log.debug("Stack trace:", err.stack);
            }
        });
    }

    this.services.Switch.fritzState = false;

    setInterval(this.update.bind(this), this.platform.interval);
}

FritzWifiAccessory.prototype.getServices = function() {
    return [this.services.AccessoryInformation, this.services.Switch];
};

FritzWifiAccessory.prototype.getOn = function(callback) {
    this.platform.log.debug("Getting guest WLAN state");

    callback(null, this.services.Switch.fritzState);
    this.queryOn();
};

FritzWifiAccessory.prototype.setOn = function(on, callback) {
    this.platform.log("Switching guest WLAN to " + on);

    const payload = {'NewEnable':on ? '1' : '0'};
    this.tr64service.actions.SetEnable(payload).then(res => {
        this.platform.log.debug("< %s %s", "tr64.SetEnable", JSON.stringify(res));
        // TODO: check GetInfo to see if successful
    }).catch(err => {
        this.platform.log.error(err);
    });

    callback();
};

FritzWifiAccessory.prototype.queryOn = function() {
    if (!this.tr64service) { // tr64 is still not initialized
        return;
    }

    this.tr64service.actions.GetInfo().then(res => {
        this.platform.log.debug("< %s %s", "tr64.GetInfo", JSON.stringify(res));

        const service = this.services.Switch;
        service.fritzState = +res.NewEnable;
        service.getCharacteristic(Characteristic.On).updateValue(service.fritzState);
    }).catch((err) => {
        this.platform.log.error(err);
    });
};

FritzWifiAccessory.prototype.getOnFallback = function(callback) {
    this.platform.log.debug("Getting guest WLAN state");

    callback(null, this.services.Switch.fritzState);
    this.queryOnFallback();
};

FritzWifiAccessory.prototype.setOnFallback = function(on, callback) {
    this.platform.log.debug("Switching guest WLAN to " + on);

    this.platform.fritz('setGuestWlan', !!on);
    callback();
};

FritzWifiAccessory.prototype.queryOnFallback = function() {
    this.platform.fritz('getGuestWlan').then(res => {
        const service = this.services.Switch;
        service.fritzState = res;
        service.getCharacteristic(Characteristic.On).updateValue(res);
    });
};

FritzWifiAccessory.prototype.update = function() {
    this.platform.log.debug("Updating guest WLAN");

    if (this.fallback) {
        this.queryOnFallback();
    } else {
        this.queryOn();
    }
};
