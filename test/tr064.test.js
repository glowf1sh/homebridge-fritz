/**
 * Tests for TR-064 implementation
 */

const assert = require('assert');
const nock = require('nock');
const { Fritzbox } = require('../lib/tr064');

describe('TR-064', function() {
    let tr064;
    
    beforeEach(function() {
        tr064 = new Fritzbox({
            host: 'fritz.box',
            port: 49443,
            ssl: true,
            user: 'testuser',
            password: 'testpass'
        });
    });
    
    afterEach(function() {
        nock.cleanAll();
    });
    
    describe('initialization', function() {
        it('should create instance with default options', function() {
            const client = new Fritzbox();
            assert.strictEqual(client.host, 'fritz.box');
            assert.strictEqual(client.port, 49443);
            assert.strictEqual(client.ssl, true);
        });
        
        it('should accept custom options', function() {
            const client = new Fritzbox({
                host: '192.168.1.1',
                port: 49000,
                ssl: false,
                user: 'admin',
                password: 'secret'
            });
            assert.strictEqual(client.host, '192.168.1.1');
            assert.strictEqual(client.port, 49000);
            assert.strictEqual(client.ssl, false);
            assert.strictEqual(client.user, 'admin');
            assert.strictEqual(client.password, 'secret');
        });
    });
    
    describe('initTR064Device', function() {
        it('should fetch and parse device description', async function() {
            const deviceXml = `<?xml version="1.0"?>
                <root xmlns="urn:dslforum-org:device-1-0">
                    <device>
                        <serviceList>
                            <service>
                                <serviceType>urn:dslforum-org:service:WLANConfiguration:3</serviceType>
                                <controlURL>/upnp/control/wlanconfig3</controlURL>
                            </service>
                        </serviceList>
                    </device>
                </root>`;
            
            nock('https://fritz.box:49443')
                .get('/tr64desc.xml')
                .reply(200, deviceXml, { 'Content-Type': 'text/xml' });
            
            await tr064.initTR064Device();
            
            assert(tr064.services['urn:dslforum-org:service:WLANConfiguration:3']);
            assert(tr064.services['urn:dslforum-org:service:WLANConfiguration:3'].actions.SetEnable);
            assert(tr064.services['urn:dslforum-org:service:WLANConfiguration:3'].actions.GetInfo);
        });
        
        it('should handle multiple WLAN configurations', async function() {
            const deviceXml = `<?xml version="1.0"?>
                <root xmlns="urn:dslforum-org:device-1-0">
                    <device>
                        <serviceList>
                            <service>
                                <serviceType>urn:dslforum-org:service:WLANConfiguration:2</serviceType>
                                <controlURL>/upnp/control/wlanconfig2</controlURL>
                            </service>
                            <service>
                                <serviceType>urn:dslforum-org:service:WLANConfiguration:3</serviceType>
                                <controlURL>/upnp/control/wlanconfig3</controlURL>
                            </service>
                        </serviceList>
                    </device>
                </root>`;
            
            nock('https://fritz.box:49443')
                .get('/tr64desc.xml')
                .reply(200, deviceXml, { 'Content-Type': 'text/xml' });
            
            await tr064.initTR064Device();
            
            assert(tr064.services['urn:dslforum-org:service:WLANConfiguration:2']);
            assert(tr064.services['urn:dslforum-org:service:WLANConfiguration:3']);
        });
        
        it('should handle network errors', async function() {
            nock('https://fritz.box:49443')
                .get('/tr64desc.xml')
                .replyWithError('Network error');
            
            try {
                await tr064.initTR064Device();
                assert.fail('Should have thrown error');
            } catch (error) {
                assert(error.message.includes('Failed to initialize TR-064 device'));
            }
        });
    });
    
    describe('callAction', function() {
        beforeEach(async function() {
            // Mock device initialization
            const deviceXml = `<?xml version="1.0"?>
                <root xmlns="urn:dslforum-org:device-1-0">
                    <device>
                        <serviceList>
                            <service>
                                <serviceType>urn:dslforum-org:service:WLANConfiguration:3</serviceType>
                                <controlURL>/upnp/control/wlanconfig3</controlURL>
                            </service>
                        </serviceList>
                    </device>
                </root>`;
            
            nock('https://fritz.box:49443')
                .get('/tr64desc.xml')
                .reply(200, deviceXml, { 'Content-Type': 'text/xml' });
            
            await tr064.initTR064Device();
        });
        
        it('should call SetEnable action', async function() {
            const responseXml = `<?xml version="1.0"?>
                <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                    <soap:Body>
                        <u:SetEnableResponse xmlns:u="urn:dslforum-org:service:WLANConfiguration:3">
                        </u:SetEnableResponse>
                    </soap:Body>
                </soap:Envelope>`;
            
            nock('https://fritz.box:49443')
                .post('/upnp/control/wlanconfig3')
                .basicAuth({ user: 'testuser', pass: 'testpass' })
                .reply(200, responseXml, { 'Content-Type': 'text/xml' });
            
            const service = tr064.services['urn:dslforum-org:service:WLANConfiguration:3'];
            const result = await service.actions.SetEnable({ NewEnable: '1' });
            
            assert(typeof result === 'object');
        });
        
        it('should call GetInfo action', async function() {
            const responseXml = `<?xml version="1.0"?>
                <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                    <soap:Body>
                        <u:GetInfoResponse xmlns:u="urn:dslforum-org:service:WLANConfiguration:3">
                            <NewEnable>1</NewEnable>
                            <NewSSID>GuestWLAN</NewSSID>
                        </u:GetInfoResponse>
                    </soap:Body>
                </soap:Envelope>`;
            
            nock('https://fritz.box:49443')
                .post('/upnp/control/wlanconfig3')
                .basicAuth({ user: 'testuser', pass: 'testpass' })
                .reply(200, responseXml, { 'Content-Type': 'text/xml' });
            
            const service = tr064.services['urn:dslforum-org:service:WLANConfiguration:3'];
            const result = await service.actions.GetInfo();
            
            assert.strictEqual(result.NewEnable, '1');
            assert.strictEqual(result.NewSSID, 'GuestWLAN');
        });
        
        it('should handle authentication errors', async function() {
            nock('https://fritz.box:49443')
                .post('/upnp/control/wlanconfig3')
                .basicAuth({ user: 'testuser', pass: 'testpass' })
                .reply(401, 'Unauthorized');
            
            const service = tr064.services['urn:dslforum-org:service:WLANConfiguration:3'];
            
            try {
                await service.actions.GetInfo();
                assert.fail('Should have thrown error');
            } catch (error) {
                assert(error.message.includes('Authentication failed'));
            }
        });
    });
});