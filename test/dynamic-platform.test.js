/**
 * Tests for Dynamic Platform Implementation
 */

const assert = require('assert');
const EventEmitter = require('events');

// Mock Homebridge API
class MockAPI extends EventEmitter {
    constructor() {
        super();
        this.accessories = [];
        this.hap = {
            uuid: {
                generate: (data) => {
                    // Simple UUID generation mock - ensure consistent format
                    return 'mock-uuid-' + data.replace(/[^a-zA-Z0-9]/g, '-');
                }
            },
            Characteristic: {
                Manufacturer: 'Manufacturer',
                Model: 'Model',
                SerialNumber: 'SerialNumber',
                FirmwareRevision: 'FirmwareRevision',
                On: 'On',
                OutletInUse: 'OutletInUse',
                CurrentTemperature: 'CurrentTemperature',
                TargetTemperature: 'TargetTemperature',
                CurrentHeatingCoolingState: 'CurrentHeatingCoolingState',
                TargetHeatingCoolingState: 'TargetHeatingCoolingState',
                TemperatureDisplayUnits: 'TemperatureDisplayUnits',
                ContactSensorState: 'ContactSensorState',
                StatusActive: 'StatusActive',
                StatusFault: 'StatusFault',
                Formats: {
                    BOOL: 'bool',
                    INT: 'int',
                    FLOAT: 'float',
                    STRING: 'string',
                    UINT8: 'uint8',
                    UINT16: 'uint16',
                    UINT32: 'uint32',
                    UINT64: 'uint64',
                    DATA: 'data',
                    TLV8: 'tlv8'
                },
                Perms: {
                    READ: 'pr',
                    WRITE: 'pw',
                    NOTIFY: 'ev',
                    PAIRED_READ: 'aa',
                    PAIRED_WRITE: 'aa',
                    HIDDEN: 'hd',
                    ADDITIONAL_AUTHORIZATION: 'aa',
                    TIMED_WRITE: 'tw',
                    WRITE_RESPONSE: 'wr'
                }
            },
            Service: {
                AccessoryInformation: MockService,
                Outlet: MockService,
                Thermostat: MockService,
                TemperatureSensor: MockService,
                ContactSensor: MockService,
                StatelessProgrammableSwitch: MockService,
                Switch: MockService
            },
            Categories: {
                OUTLET: 7,
                THERMOSTAT: 9,
                SENSOR: 10,
                SWITCH: 8
            }
        };
    }

    registerPlatformAccessories(pluginIdentifier, platformName, accessories) {
        this.accessories.push(...accessories);
    }

    unregisterPlatformAccessories(pluginIdentifier, platformName, accessories) {
        accessories.forEach(acc => {
            const idx = this.accessories.findIndex(a => a.UUID === acc.UUID);
            if (idx !== -1) {
                this.accessories.splice(idx, 1);
            }
        });
    }

    updatePlatformAccessories(accessories) {
        // Mock update
    }
}

// Mock Service
class MockService {
    constructor(name) {
        this.name = name;
        this.characteristics = [];
    }

    getCharacteristic(characteristic) {
        let char = this.characteristics.find(c => c.name === characteristic);
        if (!char) {
            char = new MockCharacteristic(characteristic);
            this.characteristics.push(char);
        }
        return char;
    }

    setCharacteristic(characteristic, value) {
        const char = this.getCharacteristic(characteristic);
        char.value = value;
        return this;
    }
}

// Mock Characteristic
class MockCharacteristic {
    constructor(name) {
        this.name = name;
        this.value = null;
        this.listeners = {};
    }

    on(event, handler) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(handler);
        return this;
    }

    setValue(value) {
        this.value = value;
        return this;
    }

    updateValue(value) {
        this.value = value;
        return this;
    }
}

// Mock PlatformAccessory
class MockPlatformAccessory {
    constructor(displayName, uuid, category) {
        this.displayName = displayName;
        this.UUID = uuid;
        this.category = category;
        this.context = {};
        this.reachable = true;
        this.services = [];
        
        // Add AccessoryInformation service by default
        const infoService = new MockService('AccessoryInformation');
        this.services.push(infoService);
    }

    getService(service) {
        if (typeof service === 'string') {
            return this.services.find(s => s.name === service);
        }
        return this.services.find(s => s === service || s.constructor === service);
    }

    addService(service) {
        if (typeof service === 'function') {
            service = new MockService(service.name || 'Service');
        }
        this.services.push(service);
        return service;
    }

    removeService(service) {
        const idx = this.services.indexOf(service);
        if (idx !== -1) {
            this.services.splice(idx, 1);
        }
    }
}

describe('Dynamic Platform', function() {
    let api;
    let platform;
    let FritzPlatform;
    let homebridge;
    let log;

    beforeEach(function() {
        // Reset modules
        delete require.cache[require.resolve('../lib/platform')];
        delete require.cache[require.resolve('../lib/fritz-api')];
        
        // Setup mocks
        api = new MockAPI();
        log = function(message) {
            // Default log function
        };
        log.info = () => {};
        log.debug = () => {};
        log.warn = () => {};
        log.error = () => {};

        homebridge = {
            hap: api.hap,
            platformAccessory: MockPlatformAccessory,
            registerPlatform: (pluginName, platformName, platformConstructor) => {
                FritzPlatform = platformConstructor;
            }
        };

        // Load platform
        FritzPlatform = require('../lib/platform')(homebridge);
    });
    
    afterEach(function() {
        // Clean up any timers
        if (platform && platform.updateInterval) {
            clearInterval(platform.updateInterval);
        }
    });

    describe('Platform Initialization', function() {
        it('should initialize with api parameter', function() {
            const config = {
                username: 'test',
                password: 'test',
                url: 'http://fritz.box'
            };

            platform = new FritzPlatform(log, config, api);
            
            assert.strictEqual(platform.api, api);
            assert.strictEqual(platform.log, log);
            assert.strictEqual(platform.config, config);
        });

        it('should implement configureAccessory method', function() {
            const config = {
                username: 'test',
                password: 'test'
            };

            platform = new FritzPlatform(log, config, api);
            
            assert.strictEqual(typeof platform.configureAccessory, 'function');
        });

        it('should register for didFinishLaunching event', function(done) {
            const config = {
                username: 'test',
                password: 'test'
            };

            // Track if event listener was registered
            let listenerRegistered = false;
            const originalOn = api.on;
            api.on = function(event, listener) {
                if (event === 'didFinishLaunching') {
                    listenerRegistered = true;
                }
                return originalOn.call(this, event, listener);
            };

            platform = new FritzPlatform(log, config, api);
            
            assert.strictEqual(listenerRegistered, true);
            done();
        });
    });

    describe('Accessory Management', function() {
        beforeEach(function() {
            platform = new FritzPlatform(log, {
                username: 'test',
                password: 'test',
                url: 'http://fritz.box',
                devices: {
                    'wifi.display': false  // Disable WiFi accessory for these tests
                }
            }, api);
        });

        it('should restore accessories through configureAccessory', function() {
            const accessory = new MockPlatformAccessory('Test Device', 'mock-uuid-test', api.hap.Categories.OUTLET);
            accessory.context.ain = '123456789012';
            
            platform.configureAccessory(accessory);
            
            assert.strictEqual(platform.accessories.length, 1);
            assert.strictEqual(platform.accessories[0].context.ain, '123456789012');
        });

        it('should discover new accessories after didFinishLaunching', function(done) {
            // Mock getSessionID to prevent real API call
            const originalFritzApi = platform.fritzApi();
            originalFritzApi.getSessionID = function() {
                return Promise.resolve('mock-session-id');
            };
            
            // Mock Fritz API responses
            platform.fritz = function(command) {
                if (command === 'getDeviceList') {
                    return Promise.resolve([
                        {
                            identifier: '123456789012',
                            name: 'Test Outlet',
                            switch: { state: 1 }
                        }
                    ]);
                } else if (command === 'getSwitchList') {
                    return Promise.resolve(['123456789012']);
                } else if (command === 'getThermostatList') {
                    return Promise.resolve([]);
                }
                return Promise.resolve([]);
            };

            let accessoriesAdded = false;
            const originalRegister = api.registerPlatformAccessories.bind(api);
            api.registerPlatformAccessories = function(pluginIdentifier, platformName, accessories) {
                accessoriesAdded = true;
                originalRegister.apply(this, arguments);
            };

            // Wait for updateAccessories to complete
            const originalUpdateAccessories = platform.updateAccessories.bind(platform);
            platform.updateAccessories = function() {
                return originalUpdateAccessories.apply(this, arguments).then(() => {
                    assert.strictEqual(accessoriesAdded, true);
                    assert.strictEqual(api.accessories.length > 0, true);
                    done();
                }).catch(done);
            };

            // Trigger didFinishLaunching
            api.emit('didFinishLaunching');
        });

        it('should update existing accessories instead of creating duplicates', function(done) {
            // Mock getSessionID to prevent real API call
            const originalFritzApi = platform.fritzApi();
            originalFritzApi.getSessionID = function() {
                return Promise.resolve('mock-session-id');
            };
            
            // Add existing accessory
            const expectedUUID = api.hap.uuid.generate('outlet-123456789012');
            const existingAccessory = new MockPlatformAccessory('Test Device', expectedUUID, api.hap.Categories.OUTLET);
            existingAccessory.context.ain = '123456789012';
            existingAccessory.context.type = 'outlet';
            platform.configureAccessory(existingAccessory);

            // Mock Fritz API responses
            platform.fritz = function(command) {
                if (command === 'getDeviceList') {
                    return Promise.resolve([
                        {
                            identifier: '123456789012',
                            name: 'Test Outlet Updated',
                            switch: { state: 1 }
                        }
                    ]);
                } else if (command === 'getSwitchList') {
                    return Promise.resolve(['123456789012']);
                } else if (command === 'getThermostatList') {
                    return Promise.resolve([]);
                }
                return Promise.resolve([]);
            };

            let registerCalled = false;
            const originalRegister = api.registerPlatformAccessories.bind(api);
            api.registerPlatformAccessories = function() {
                registerCalled = true;
                originalRegister.apply(this, arguments);
            };
            
            // Mock the accessory setup to prevent errors
            platform.setupOutletAccessory = function(accessory) {
                // Mock setup
            };

            // Wait for updateAccessories to complete
            const originalUpdateAccessories = platform.updateAccessories.bind(platform);
            platform.updateAccessories = function() {
                return originalUpdateAccessories.apply(this, arguments).then(() => {
                    // Should not register new accessory for existing device
                    assert.strictEqual(registerCalled, false);
                    assert.strictEqual(platform.accessories.length, 1);
                    // Note: displayName is set to device.name in the platform code
                    assert.strictEqual(platform.accessories[0].displayName, 'Test Outlet Updated');
                    done();
                }).catch(done);
            };

            // Trigger didFinishLaunching
            api.emit('didFinishLaunching');
        });

        it('should remove accessories that no longer exist', function(done) {
            // Mock getSessionID to prevent real API call
            const originalFritzApi = platform.fritzApi();
            originalFritzApi.getSessionID = function() {
                return Promise.resolve('mock-session-id');
            };
            
            // Add existing accessory
            const expectedUUID = api.hap.uuid.generate('outlet-123456789012');
            const existingAccessory = new MockPlatformAccessory('Test Device', expectedUUID, api.hap.Categories.OUTLET);
            existingAccessory.context.ain = '123456789012';
            existingAccessory.context.type = 'outlet';
            platform.configureAccessory(existingAccessory);

            // Mock Fritz API responses - device no longer exists
            platform.fritz = function(command) {
                if (command === 'getDeviceList') {
                    return Promise.resolve([]);
                } else if (command === 'getSwitchList') {
                    return Promise.resolve([]);
                } else if (command === 'getThermostatList') {
                    return Promise.resolve([]);
                }
                return Promise.resolve([]);
            };

            // Mock the accessory setup to prevent errors
            platform.setupOutletAccessory = function(accessory) {
                // Mock setup
            };
            
            let unregisterCalled = false;
            const originalUnregister = api.unregisterPlatformAccessories.bind(api);
            api.unregisterPlatformAccessories = function(pluginIdentifier, platformName, accessories) {
                unregisterCalled = true;
                assert.strictEqual(accessories.length, 1);
                assert.strictEqual(accessories[0].context.ain, '123456789012');
                // Remove from platform accessories array
                accessories.forEach(acc => {
                    const idx = platform.accessories.findIndex(a => a.UUID === acc.UUID);
                    if (idx !== -1) {
                        platform.accessories.splice(idx, 1);
                    }
                });
                originalUnregister.apply(this, arguments);
            };

            // Wait for updateAccessories to complete
            const originalUpdateAccessories = platform.updateAccessories.bind(platform);
            platform.updateAccessories = function() {
                return originalUpdateAccessories.apply(this, arguments).then(() => {
                    assert.strictEqual(unregisterCalled, true);
                    done();
                }).catch(done);
            };

            // Trigger didFinishLaunching
            api.emit('didFinishLaunching');
        });

        it('should update accessories every 60 seconds', function(done) {
            this.timeout(5000);
            
            // Mock getSessionID to prevent real API call
            const originalFritzApi = platform.fritzApi();
            originalFritzApi.getSessionID = function() {
                return Promise.resolve('mock-session-id');
            };
            
            // Mock Fritz API responses
            platform.fritz = function(command) {
                if (command === 'getDeviceList') {
                    return Promise.resolve([]);
                } else if (command === 'getSwitchList') {
                    return Promise.resolve([]);
                } else if (command === 'getThermostatList') {
                    return Promise.resolve([]);
                }
                return Promise.resolve([]);
            };
            
            let updateCount = 0;
            const originalUpdateAccessories = platform.updateAccessories.bind(platform);
            platform.updateAccessories = function() {
                return originalUpdateAccessories.apply(this, arguments).then(() => {
                    updateCount++;
                    if (updateCount === 2) {
                        // Second update means interval is working
                        clearInterval(platform.updateInterval);
                        done();
                    }
                }).catch(done);
            };

            // Set short interval for testing
            platform.interval = 100; // 100ms for testing
            
            // Trigger didFinishLaunching
            api.emit('didFinishLaunching');
        });
    });

    describe('Accessory Context', function() {
        beforeEach(function() {
            platform = new FritzPlatform(log, {
                username: 'test',
                password: 'test',
                url: 'http://fritz.box',
                devices: {
                    'wifi.display': false  // Disable WiFi accessory for these tests
                }
            }, api);
        });

        it('should store device metadata in accessory context', function(done) {
            // Mock getSessionID to prevent real API call
            const originalFritzApi = platform.fritzApi();
            originalFritzApi.getSessionID = function() {
                return Promise.resolve('mock-session-id');
            };
            
            // Mock Fritz API responses
            platform.fritz = function(command) {
                if (command === 'getDeviceList') {
                    return Promise.resolve([
                        {
                            identifier: '123456789012',
                            name: 'Test Outlet',
                            manufacturer: 'AVM',
                            productname: 'FRITZ!DECT 200',
                            fwversion: '1.2.3',
                            switch: { state: 1 }
                        }
                    ]);
                } else if (command === 'getSwitchList') {
                    return Promise.resolve(['123456789012']);
                } else if (command === 'getThermostatList') {
                    return Promise.resolve([]);
                }
                return Promise.resolve([]);
            };

            // Mock the accessory setup to prevent errors
            platform.setupOutletAccessory = function(accessory) {
                // Mock setup
            };
            
            let registerCalled = false;
            api.registerPlatformAccessories = function(pluginIdentifier, platformName, accessories) {
                registerCalled = true;
                assert.strictEqual(accessories.length, 1);
                const accessory = accessories[0];
                assert.strictEqual(accessory.context.ain, '123456789012');
                assert.strictEqual(accessory.context.manufacturer, 'AVM');
                assert.strictEqual(accessory.context.productname, 'FRITZ!DECT 200');
                assert.strictEqual(accessory.context.fwversion, '1.2.3');
            };
            
            // Wait for updateAccessories to complete
            const originalUpdateAccessories = platform.updateAccessories.bind(platform);
            platform.updateAccessories = function() {
                return originalUpdateAccessories.apply(this, arguments).then(() => {
                    assert.strictEqual(registerCalled, true);
                    done();
                }).catch(done);
            };

            // Trigger didFinishLaunching
            api.emit('didFinishLaunching');
        });
    });

    describe('Error Handling', function() {
        beforeEach(function() {
            platform = new FritzPlatform(log, {
                username: 'test',
                password: 'test',
                url: 'http://fritz.box',
                devices: {
                    'wifi.display': false  // Disable WiFi accessory for these tests
                }
            }, api);
        });

        it('should handle API errors gracefully', function(done) {
            // Mock getSessionID to prevent real API call
            const originalFritzApi = platform.fritzApi();
            originalFritzApi.getSessionID = function() {
                return Promise.reject(new Error('Login failed'));
            };
            
            let errorLogged = false;
            platform.log.error = function() {
                errorLogged = true;
            };

            // Check error after a small delay to allow promise to settle
            setTimeout(() => {
                assert.strictEqual(errorLogged, true);
                done();
            }, 100);

            // Trigger didFinishLaunching
            api.emit('didFinishLaunching');
        });

        it('should mark accessories as unreachable on error', function(done) {
            // Mock getSessionID to prevent real API call
            const originalFritzApi = platform.fritzApi();
            originalFritzApi.getSessionID = function() {
                return Promise.resolve('mock-session-id');
            };
            
            // Add existing accessory
            const expectedUUID = api.hap.uuid.generate('outlet-123456789012');
            const existingAccessory = new MockPlatformAccessory('Test Device', expectedUUID, api.hap.Categories.OUTLET);
            existingAccessory.context.ain = '123456789012';
            existingAccessory.context.type = 'outlet';
            platform.configureAccessory(existingAccessory);

            // Mock Fritz API error
            platform.fritz = function() {
                return Promise.reject(new Error('API Error'));
            };

            // Mock the accessory setup to prevent errors
            platform.setupOutletAccessory = function(accessory) {
                // Mock setup
            };
            
            // Wait for updateAccessories to complete
            const originalUpdateAccessories = platform.updateAccessories.bind(platform);
            platform.updateAccessories = function() {
                return originalUpdateAccessories.apply(this, arguments).catch(() => {
                    // Error expected, check that accessory is marked unreachable
                    assert.strictEqual(platform.accessories[0].reachable, false);
                    done();
                });
            };

            // Trigger didFinishLaunching
            api.emit('didFinishLaunching');
        });
    });
});