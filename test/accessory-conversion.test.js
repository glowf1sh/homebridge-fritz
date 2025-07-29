/**
 * Tests for Accessory Conversion to Dynamic Platform
 */

const assert = require('assert');
const path = require('path');

// Mock homebridge API
const mockHomebridge = {
    hap: {
        uuid: {
            generate: (data) => 'mock-uuid-' + data
        },
        Service: {
            AccessoryInformation: {},
            Outlet: {},
            TemperatureSensor: {},
            Thermostat: {},
            BatteryService: {},
            ContactSensor: {},
            Switch: {}
        },
        Characteristic: {
            On: {},
            OutletInUse: {},
            CurrentTemperature: {},
            CurrentHeatingCoolingState: {},
            TargetHeatingCoolingState: {},
            TargetTemperature: {},
            TemperatureDisplayUnits: {},
            BatteryLevel: {},
            ChargingState: {},
            StatusLowBattery: {
                BATTERY_LEVEL_NORMAL: 0,
                BATTERY_LEVEL_LOW: 1
            },
            ContactSensorState: {
                CONTACT_DETECTED: 0,
                CONTACT_NOT_DETECTED: 1
            },
            Formats: {
                FLOAT: 'float'
            },
            Perms: {
                READ: 'read',
                NOTIFY: 'notify'
            }
        }
    },
    platformAccessory: class MockPlatformAccessory {
        constructor(displayName, uuid) {
            this.displayName = displayName;
            this.UUID = uuid;
            this.context = {};
            this.services = [];
        }
        
        getService(service) {
            return this.services.find(s => s.type === service);
        }
        
        addService(service, name) {
            // Check if service already exists
            let existingService = this.getService(service);
            if (existingService) {
                return existingService;
            }
            
            const mockService = {
                type: service,
                name: name,
                characteristics: {},
                getCharacteristic: function(char) {
                    if (!this.characteristics[char]) {
                        this.characteristics[char] = {
                            value: null,
                            props: {},
                            listeners: { get: [], set: [] },
                            on: function(event, handler) {
                                this.listeners[event] = this.listeners[event] || [];
                                this.listeners[event].push(handler);
                                return this;
                            },
                            setProps: function(props) {
                                this.props = props;
                                return this;
                            },
                            updateValue: function(value) {
                                this.value = value;
                                return this;
                            }
                        };
                    }
                    return this.characteristics[char];
                },
                setCharacteristic: function(char, value) {
                    this.getCharacteristic(char).value = value;
                    return this;
                }
            };
            this.services.push(mockService);
            return mockService;
        }
        
        removeService(service) {
            const idx = this.services.indexOf(service);
            if (idx !== -1) {
                this.services.splice(idx, 1);
            }
        }
    }
};

// Mock platform
const mockPlatform = {
    log: {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {}
    },
    api: {
        hap: mockHomebridge.hap,
        platformAccessory: mockHomebridge.platformAccessory
    },
    interval: 60000,
    getName: (ain) => `Device ${ain}`,
    getDevice: (ain) => ({
        identifier: ain,
        name: `Device ${ain}`,
        manufacturer: 'AVM',
        productname: 'FRITZ!DECT 200',
        fwversion: '1.0.0'
    }),
    deviceConfig: (key, defaultValue) => defaultValue,
    fritz: () => Promise.resolve()
};

describe('Accessory Conversion to Dynamic Platform', function() {
    describe('FritzOutletAccessory', function() {
        it('should accept 4 parameters: platform, ain, type, device', function() {
            const FritzOutletAccessory = require('../lib/accessories/outlet')(mockHomebridge);
            
            // Test new accessory creation
            const newAccessory = new FritzOutletAccessory(mockPlatform, '123456789012', 'outlet', null);
            assert.strictEqual(newAccessory.ain, '123456789012');
            assert.strictEqual(newAccessory.type, 'outlet');
            assert.strictEqual(newAccessory.accessory.context.ain, '123456789012');
            assert.strictEqual(newAccessory.accessory.context.type, 'outlet');
            
            // Test existing accessory
            const existingPlatformAccessory = new mockHomebridge.platformAccessory('Test Device', 'mock-uuid');
            existingPlatformAccessory.context.ain = '123456789012';
            existingPlatformAccessory.context.type = 'outlet';
            
            const existingAccessory = new FritzOutletAccessory(mockPlatform, '123456789012', 'outlet', existingPlatformAccessory);
            assert.strictEqual(existingAccessory.accessory, existingPlatformAccessory);
        });
        
        it('should have cleanup method', function() {
            const FritzOutletAccessory = require('../lib/accessories/outlet')(mockHomebridge);
            const accessory = new FritzOutletAccessory(mockPlatform, '123456789012', 'outlet', null);
            
            assert.strictEqual(typeof accessory.cleanup, 'function');
            assert.strictEqual(typeof accessory.startPolling, 'function');
        });
    });
    
    describe('FritzThermostatAccessory', function() {
        it('should accept 4 parameters: platform, ain, type, device', function() {
            const FritzThermostatAccessory = require('../lib/accessories/thermostat')(mockHomebridge);
            
            // Test new accessory creation
            const newAccessory = new FritzThermostatAccessory(mockPlatform, '123456789012', 'thermostat', null);
            assert.strictEqual(newAccessory.ain, '123456789012');
            assert.strictEqual(newAccessory.type, 'thermostat');
            assert.strictEqual(newAccessory.accessory.context.ain, '123456789012');
            assert.strictEqual(newAccessory.accessory.context.type, 'thermostat');
            
            // Check services
            assert.ok(newAccessory.services.Thermostat);
            assert.ok(newAccessory.services.BatteryService);
        });
        
        it('should have cleanup method', function() {
            const FritzThermostatAccessory = require('../lib/accessories/thermostat')(mockHomebridge);
            const accessory = new FritzThermostatAccessory(mockPlatform, '123456789012', 'thermostat', null);
            
            assert.strictEqual(typeof accessory.cleanup, 'function');
            assert.strictEqual(typeof accessory.startPolling, 'function');
        });
    });
    
    describe('FritzButtonAccessory', function() {
        it('should accept 4 parameters: platform, ain, type, device', function() {
            const FritzButtonAccessory = require('../lib/accessories/button')(mockHomebridge);
            
            // Test new accessory creation
            const newAccessory = new FritzButtonAccessory(mockPlatform, '123456789012', 'button', null);
            assert.strictEqual(newAccessory.ain, '123456789012');
            assert.strictEqual(newAccessory.type, 'button');
            assert.strictEqual(newAccessory.accessory.context.ain, '123456789012');
            assert.strictEqual(newAccessory.accessory.context.type, 'button');
        });
        
        it('should handle legacy constructor with index and name', function() {
            const FritzButtonAccessory = require('../lib/accessories/button')(mockHomebridge);
            
            // Test legacy constructor: platform, ain, index, name
            const accessory = new FritzButtonAccessory(mockPlatform, '123456789012', 0, 'Button 1');
            assert.strictEqual(accessory.index, 0);
            assert.strictEqual(accessory.name, 'Button 1');
            assert.strictEqual(accessory.accessory.context.index, 0);
            assert.strictEqual(accessory.accessory.context.buttonName, 'Button 1');
        });
        
        it('should have cleanup method', function() {
            const FritzButtonAccessory = require('../lib/accessories/button')(mockHomebridge);
            const accessory = new FritzButtonAccessory(mockPlatform, '123456789012', 'button', null);
            
            assert.strictEqual(typeof accessory.cleanup, 'function');
            assert.strictEqual(typeof accessory.startPolling, 'function');
        });
    });
    
    describe('FritzAlarmSensorAccessory', function() {
        it('should accept 4 parameters: platform, ain, type, device', function() {
            const FritzAlarmSensorAccessory = require('../lib/accessories/alarmsensor')(mockHomebridge);
            
            // Test new accessory creation
            const newAccessory = new FritzAlarmSensorAccessory(mockPlatform, '123456789012', 'alarm sensor', null);
            assert.strictEqual(newAccessory.ain, '123456789012');
            assert.strictEqual(newAccessory.type, 'alarm sensor');
            assert.strictEqual(newAccessory.accessory.context.ain, '123456789012');
            assert.strictEqual(newAccessory.accessory.context.type, 'alarm sensor');
            
            // Check services
            assert.ok(newAccessory.services.ContactSensor);
        });
        
        it('should have cleanup method', function() {
            const FritzAlarmSensorAccessory = require('../lib/accessories/alarmsensor')(mockHomebridge);
            const accessory = new FritzAlarmSensorAccessory(mockPlatform, '123456789012', 'alarm sensor', null);
            
            assert.strictEqual(typeof accessory.cleanup, 'function');
            assert.strictEqual(typeof accessory.startPolling, 'function');
        });
    });
    
    describe('FritzTemperatureSensorAccessory', function() {
        it('should accept 4 parameters: platform, ain, type, device', function() {
            const FritzTemperatureSensorAccessory = require('../lib/accessories/temperaturesensor')(mockHomebridge);
            
            // Test new accessory creation
            const newAccessory = new FritzTemperatureSensorAccessory(mockPlatform, '123456789012', 'temperature sensor', null);
            assert.strictEqual(newAccessory.ain, '123456789012');
            assert.strictEqual(newAccessory.type, 'temperature sensor');
            assert.strictEqual(newAccessory.accessory.context.ain, '123456789012');
            assert.strictEqual(newAccessory.accessory.context.type, 'temperature sensor');
            
            // Check services
            assert.ok(newAccessory.services.TemperatureSensor);
        });
        
        it('should have cleanup method', function() {
            const FritzTemperatureSensorAccessory = require('../lib/accessories/temperaturesensor')(mockHomebridge);
            const accessory = new FritzTemperatureSensorAccessory(mockPlatform, '123456789012', 'temperature sensor', null);
            
            assert.strictEqual(typeof accessory.cleanup, 'function');
            assert.strictEqual(typeof accessory.startPolling, 'function');
        });
    });
});