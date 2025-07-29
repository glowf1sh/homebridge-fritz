/**
 * Tests for Fritz API Implementation
 */

const assert = require('assert');
const nock = require('nock');
const fritz = require('../lib/fritz-api');

describe('Fritz API', function() {
    const testUrl = 'http://fritz.box';
    const testUsername = 'testuser';
    const testPassword = 'testpass';
    const testSid = '1234567890abcdef';
    const testAin = '087610000161';

    beforeEach(function() {
        nock.cleanAll();
    });

    describe('Authentication', function() {
        it('should get session ID with valid credentials', async function() {
            // Mock challenge request
            nock(testUrl)
                .get('/login_sid.lua')
                .reply(200, `<?xml version="1.0" encoding="utf-8"?>
                    <SessionInfo>
                        <SID>0000000000000000</SID>
                        <Challenge>1234567890abcdef</Challenge>
                        <BlockTime>0</BlockTime>
                        <Rights></Rights>
                    </SessionInfo>`);

            // Mock login request
            nock(testUrl)
                .get('/login_sid.lua')
                .query(true)
                .reply(200, `<?xml version="1.0" encoding="utf-8"?>
                    <SessionInfo>
                        <SID>${testSid}</SID>
                        <Challenge>1234567890abcdef</Challenge>
                        <BlockTime>0</BlockTime>
                        <Rights>
                            <Name>Dial</Name>
                            <Access>2</Access>
                        </Rights>
                    </SessionInfo>`);

            const sid = await fritz.getSessionID(testUsername, testPassword, { url: testUrl });
            assert.strictEqual(sid, testSid);
        });

        it('should throw error with invalid credentials', async function() {
            // Mock challenge request
            nock(testUrl)
                .get('/login_sid.lua')
                .reply(200, `<?xml version="1.0" encoding="utf-8"?>
                    <SessionInfo>
                        <SID>0000000000000000</SID>
                        <Challenge>1234567890abcdef</Challenge>
                        <BlockTime>0</BlockTime>
                        <Rights></Rights>
                    </SessionInfo>`);

            // Mock failed login request
            nock(testUrl)
                .get('/login_sid.lua')
                .query(true)
                .reply(200, `<?xml version="1.0" encoding="utf-8"?>
                    <SessionInfo>
                        <SID>0000000000000000</SID>
                        <Challenge>1234567890abcdef</Challenge>
                        <BlockTime>0</BlockTime>
                        <Rights></Rights>
                    </SessionInfo>`);

            await assert.rejects(
                fritz.getSessionID(testUsername, 'wrongpassword', { url: testUrl }),
                /Invalid credentials/
            );
        });
        
        it('should handle HTTPS URLs with self-signed certificates', async function() {
            const httpsUrl = 'https://fritz.box';
            
            // Mock challenge request
            nock(httpsUrl)
                .get('/login_sid.lua')
                .reply(200, `<?xml version="1.0" encoding="utf-8"?>
                    <SessionInfo>
                        <SID>0000000000000000</SID>
                        <Challenge>1234567890abcdef</Challenge>
                        <BlockTime>0</BlockTime>
                        <Rights></Rights>
                    </SessionInfo>`);

            // Mock login request
            nock(httpsUrl)
                .get('/login_sid.lua')
                .query(true)
                .reply(200, `<?xml version="1.0" encoding="utf-8"?>
                    <SessionInfo>
                        <SID>${testSid}</SID>
                        <Challenge>1234567890abcdef</Challenge>
                        <BlockTime>0</BlockTime>
                        <Rights>
                            <Name>Dial</Name>
                            <Access>2</Access>
                        </Rights>
                    </SessionInfo>`);

            const sid = await fritz.getSessionID(testUsername, testPassword, { url: httpsUrl });
            assert.strictEqual(sid, testSid);
        });
    });

    describe('Device List', function() {
        it('should get device list', async function() {
            nock(testUrl)
                .get('/webservices/homeautoswitch.lua')
                .query({ sid: testSid, switchcmd: 'getdevicelistinfos' })
                .reply(200, `<?xml version="1.0" encoding="utf-8"?>
                    <devicelist version="1">
                        <device identifier="${testAin}" id="17" functionbitmask="896" fwversion="03.33" manufacturer="AVM" productname="FRITZ!DECT 200">
                            <present>1</present>
                            <name>Test Switch</name>
                            <switch>
                                <state>1</state>
                                <mode>manuell</mode>
                                <lock>0</lock>
                                <devicelock>0</devicelock>
                            </switch>
                            <powermeter>
                                <power>1500</power>
                                <energy>12345</energy>
                            </powermeter>
                            <temperature>
                                <celsius>230</celsius>
                                <offset>0</offset>
                            </temperature>
                        </device>
                    </devicelist>`);

            const devices = await fritz.getDeviceList(testSid, { url: testUrl });
            assert(Array.isArray(devices));
            assert.strictEqual(devices.length, 1);
            assert.strictEqual(devices[0].identifier, testAin);
            assert.strictEqual(devices[0].name, 'Test Switch');
            assert.strictEqual(devices[0].switch.state, true);
            assert.strictEqual(devices[0].powermeter.power, 1.5);
            assert.strictEqual(devices[0].temperature.celsius, 23);
        });
        
        it('should throw descriptive error when receiving HTML instead of XML (invalid session)', async function() {
            const htmlLoginPage = `<!DOCTYPE html>
                <html>
                <head><title>FRITZ!Box Login</title></head>
                <body>
                    <h1>Please login</h1>
                    <form action="/login_sid.lua" method="post">
                        <input type="text" name="username">
                        <input type="password" name="password">
                    </form>
                </body>
                </html>`;
            
            nock(testUrl)
                .get('/webservices/homeautoswitch.lua')
                .query({ sid: testSid, switchcmd: 'getdevicelistinfos' })
                .reply(200, htmlLoginPage, { 'Content-Type': 'text/html' });

            await assert.rejects(
                fritz.getDeviceList(testSid, { url: testUrl }),
                /Invalid response - received HTML instead of device list XML/
            );
        });
        
        it('should throw descriptive error when session is invalid (0000000000000000)', async function() {
            const invalidSessionResponse = `<?xml version="1.0" encoding="utf-8"?>
                <SessionInfo>
                    <SID>0000000000000000</SID>
                </SessionInfo>`;
            
            nock(testUrl)
                .get('/webservices/homeautoswitch.lua')
                .query({ sid: testSid, switchcmd: 'getdevicelistinfos' })
                .reply(200, invalidSessionResponse);

            await assert.rejects(
                fritz.getDeviceList(testSid, { url: testUrl }),
                /Invalid session - authentication required/
            );
        });
        
        it('should handle empty device list gracefully', async function() {
            nock(testUrl)
                .get('/webservices/homeautoswitch.lua')
                .query({ sid: testSid, switchcmd: 'getdevicelistinfos' })
                .reply(200, `<?xml version="1.0" encoding="utf-8"?>
                    <devicelist version="1">
                    </devicelist>`);

            const devices = await fritz.getDeviceList(testSid, { url: testUrl });
            assert(Array.isArray(devices));
            assert.strictEqual(devices.length, 0);
        });
        
        it('should provide detailed error message on network failure', async function() {
            nock(testUrl)
                .get('/webservices/homeautoswitch.lua')
                .query({ sid: testSid, switchcmd: 'getdevicelistinfos' })
                .replyWithError('ECONNREFUSED');

            await assert.rejects(
                fritz.getDeviceList(testSid, { url: testUrl }),
                (err) => {
                    assert(err.message.includes('getDeviceList failed'));
                    assert(err.originalError);
                    return true;
                }
            );
        });

        it('should get filtered device list', async function() {
            nock(testUrl)
                .get('/webservices/homeautoswitch.lua')
                .query({ sid: testSid, switchcmd: 'getdevicelistinfos' })
                .reply(200, `<?xml version="1.0" encoding="utf-8"?>
                    <devicelist version="1">
                        <device identifier="${testAin}" id="17" functionbitmask="896" fwversion="03.33" manufacturer="AVM" productname="FRITZ!DECT 200">
                            <present>1</present>
                            <name>Test Switch</name>
                        </device>
                        <device identifier="087610000162" id="18" functionbitmask="896" fwversion="03.33" manufacturer="AVM" productname="FRITZ!DECT 200">
                            <present>1</present>
                            <name>Other Switch</name>
                        </device>
                    </devicelist>`);

            const devices = await fritz.getDeviceListFiltered(testSid, { identifier: testAin }, { url: testUrl });
            assert.strictEqual(devices.length, 1);
            assert.strictEqual(devices[0].identifier, testAin);
        });
    });

    describe('Switch Functions', function() {
        it('should get switch state', async function() {
            nock(testUrl)
                .get('/webservices/homeautoswitch.lua')
                .query({ sid: testSid, ain: testAin, switchcmd: 'getswitchstate' })
                .reply(200, '1\n');

            const state = await fritz.getSwitchState(testSid, testAin, { url: testUrl });
            assert.strictEqual(state, true);
        });

        it('should turn switch on', async function() {
            nock(testUrl)
                .get('/webservices/homeautoswitch.lua')
                .query({ sid: testSid, ain: testAin, switchcmd: 'setswitchon' })
                .reply(200, '1\n');

            const result = await fritz.setSwitchOn(testSid, testAin, { url: testUrl });
            assert.strictEqual(result, true);
        });

        it('should turn switch off', async function() {
            nock(testUrl)
                .get('/webservices/homeautoswitch.lua')
                .query({ sid: testSid, ain: testAin, switchcmd: 'setswitchoff' })
                .reply(200, '1\n');

            const result = await fritz.setSwitchOff(testSid, testAin, { url: testUrl });
            assert.strictEqual(result, true);
        });

        it('should get switch power', async function() {
            nock(testUrl)
                .get('/webservices/homeautoswitch.lua')
                .query({ sid: testSid, ain: testAin, switchcmd: 'getswitchpower' })
                .reply(200, '1500\n');

            const power = await fritz.getSwitchPower(testSid, testAin, { url: testUrl });
            assert.strictEqual(power, 1.5); // 1500 mW = 1.5 W
        });

        it('should get switch energy', async function() {
            nock(testUrl)
                .get('/webservices/homeautoswitch.lua')
                .query({ sid: testSid, ain: testAin, switchcmd: 'getswitchenergy' })
                .reply(200, '12345\n');

            const energy = await fritz.getSwitchEnergy(testSid, testAin, { url: testUrl });
            assert.strictEqual(energy, 12.345); // 12345 Wh = 12.345 kWh
        });
    });

    describe('Temperature Functions', function() {
        it('should get temperature', async function() {
            nock(testUrl)
                .get('/webservices/homeautoswitch.lua')
                .query({ sid: testSid, ain: testAin, switchcmd: 'gettemperature' })
                .reply(200, '235\n');

            const temp = await fritz.getTemperature(testSid, testAin, { url: testUrl });
            assert.strictEqual(temp, 23.5);
        });

        it('should get target temperature', async function() {
            nock(testUrl)
                .get('/webservices/homeautoswitch.lua')
                .query({ sid: testSid, ain: testAin, switchcmd: 'gethkrtsoll' })
                .reply(200, '44\n');

            const temp = await fritz.getTempTarget(testSid, testAin, { url: testUrl });
            assert.strictEqual(temp, 22); // 44 * 0.5 = 22°C
        });

        it('should return off for target temperature', async function() {
            nock(testUrl)
                .get('/webservices/homeautoswitch.lua')
                .query({ sid: testSid, ain: testAin, switchcmd: 'gethkrtsoll' })
                .reply(200, '253\n');

            const temp = await fritz.getTempTarget(testSid, testAin, { url: testUrl });
            assert.strictEqual(temp, 'off');
        });

        it('should set target temperature', async function() {
            nock(testUrl)
                .get('/webservices/homeautoswitch.lua')
                .query({ sid: testSid, ain: testAin, switchcmd: 'sethkrtsoll', param: '44' })
                .reply(200, '44\n');

            await fritz.setTempTarget(testSid, testAin, 22, { url: testUrl });
        });

        it('should set target temperature to off', async function() {
            nock(testUrl)
                .get('/webservices/homeautoswitch.lua')
                .query({ sid: testSid, ain: testAin, switchcmd: 'sethkrtsoll', param: 'off' })
                .reply(200, '253\n');

            await fritz.setTempTarget(testSid, testAin, 'off', { url: testUrl });
        });
    });

    describe('Guest WLAN', function() {
        it('should get guest WLAN status', async function() {
            nock(testUrl)
                .post('/data.lua')
                .reply(200, {
                    data: {
                        active: '1'
                    }
                });

            const status = await fritz.getGuestWlan(testSid, { url: testUrl });
            assert.strictEqual(status, true);
        });

        it('should set guest WLAN on', async function() {
            nock(testUrl)
                .post('/data.lua')
                .reply(200, {});

            const result = await fritz.setGuestWlan(testSid, true, { url: testUrl });
            assert.strictEqual(result, true);
        });
    });
});