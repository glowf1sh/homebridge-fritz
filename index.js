/**
 * FRITZ!Box Platform Plugin for HomeBridge (https://github.com/nfarina/homebridge)
 *
 * @url https://github.com/glowf1sh/homebridge-fritz-new
 * @original author Andreas Götz
 * @new author Glowf1sh <https://twitch.tv/glowf1sh>
 * @license MIT
 */

/* jslint node: true, laxcomma: true, esversion: 6 */
"use strict";

module.exports = function(homebridge) {
    let FritzPlatform = require('./lib/platform')(homebridge);
    homebridge.registerPlatform("homebridge-fritz-new", "FRITZ!Box", FritzPlatform);
};
