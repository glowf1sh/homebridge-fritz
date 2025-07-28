/**
 * FRITZ!Box Platform Plugin for HomeBridge (https://github.com/nfarina/homebridge)
 *
 * @url https://github.com/glowf1sh/homebridge-fritz-new
 * @author Andreas Götz <cpuidle@gmx.de>
 * @license MIT
 */

/* jslint node: true, laxcomma: true, esversion: 6 */
"use strict";

module.exports = function(homebridge) {
    let FritzPlatform = require('./lib/platform')(homebridge);
    homebridge.registerPlatform("homebridge-fritz-new", "FRITZ!Box", FritzPlatform);
};
