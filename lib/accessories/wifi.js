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
        
        // Enhanced debug logging for TR-064 authentication
        this.platform.log.debug("=== TR-064 Authentication Debug Info ===");
        this.platform.log.debug("TR-064 connection options:", {
            host: options.host,
            port: options.port,
            ssl: options.ssl,
            user: options.user,
            userLength: options.user ? options.user.length : 0,
            hasPassword: !!options.password,
            passwordLength: options.password ? options.password.length : 0
        });
        this.platform.log.debug("Note: TR-064 will try multiple auth methods if needed");
        this.platform.log.debug("Auth methods: 1) Configured user, 2) Empty user, 3) 'admin'");
        this.platform.log.debug("=======================================");

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
            self.platform.log.error("=== TR-064 INITIALIZATION FAILED ===");
            self.platform.log.error("Error:", err.message || err);
            self.platform.log.error("This might be due to:");
            self.platform.log.error("1. Wrong username format (try empty or 'admin')");
            self.platform.log.error("2. User lacks TR-064 permissions");
            self.platform.log.error("3. TR-064 service disabled on FRITZ!Box");
            self.platform.log.error("4. Network connectivity issues");
            if (err.stack) {
                self.platform.log.debug("Stack trace:", err.stack);
            }
            self.platform.log.error("===================================");
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
    this.platform.log.debug("Calling SetEnable with payload:", payload);
    
    this.tr64service.actions.SetEnable(payload).then(res => {
        this.platform.log.debug("< %s %s", "tr64.SetEnable", JSON.stringify(res));
        this.platform.log("WiFi state change successful");
        // TODO: check GetInfo to see if successful
    }).catch(err => {
        this.platform.log.error("SetEnable action failed:", err.message || err);
        this.platform.log.error("Please check the debug logs above for authentication details");
    });

    callback();
};

FritzWifiAccessory.prototype.queryOn = function() {
    if (!this.tr64service) { // tr64 is still not initialized
        return;
    }

    this.platform.log.debug("Querying WiFi state via TR-064 GetInfo action...");
    this.tr64service.actions.GetInfo().then(res => {
        this.platform.log.debug("< %s %s", "tr64.GetInfo", JSON.stringify(res));

        const service = this.services.Switch;
        service.fritzState = +res.NewEnable;
        service.getCharacteristic(Characteristic.On).updateValue(service.fritzState);
    }).catch((err) => {
        this.platform.log.error("GetInfo action failed:", err.message || err);
        this.platform.log.error("Please check the debug logs above for authentication details");
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
