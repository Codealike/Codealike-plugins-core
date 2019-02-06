'use strict';

var assert = require('chai').assert;
var expect = require('chai').expect;
var sinon = require('sinon');
var codealikeApi = require('../api/codealikeApi').Api;
var configuration = require('../configuration');
var logger = require('../logger/logger').Logger;

describe('Codealike api initialization', function() {
    it('Initialization configuration', function() {
        expect(() => codealikeApi.initialize())
            .to.throw('Codealike api initialization requires a configuration object');
    });
});


describe('Authentication', function() {
    it('Succesfully authenticate', done => {
        configuration.initialize('testClient', '0', '0');
        logger.initialize(configuration);
        codealikeApi.initialize(configuration, logger);

        codealikeApi
            .authenticate('weak-9396226521/2f0928f1-5df7-43ca-be4f-e54ff99285f6')
            .then(result => { 
                assert.isNotNull(codealikeApi.userId, "Api should have a valid user id after a successfull authentication");
                assert.isNotNull(codealikeApi.token, "Api should have a valid user token after a successfull authentication");
                done(); })
            .catch(error => { throw new Error("Athentication shouldn't fail");  done(); });

        codealikeApi.dispose();
    });

    it('Succesfully get plugin settings', done => {
        configuration.initialize('testClient', '0', '0');
        logger.initialize(configuration);
        codealikeApi.initialize(configuration, logger);

        codealikeApi
            .getPluginConfiguration()
            .then(result => { 
                assert.isNotNull(result.idleCheckInterval, "Plugin settings should include idle check interval parameter");
                assert.isNotNull(result.idleMaxPeriod, "Plugin settings should include idle max period parameter");
                assert.isNotNull(result.flushInterval, "Plugin settings should include flush interval parameter");
                done(); })
            .catch(error => { throw new Error("Retrieving plugin configuration should not fail");  done(); });

        codealikeApi.dispose();
    });

    it('Fail by parameter', done => {
        configuration.initialize('testClient', '0', '0');
        logger.initialize(configuration);
        codealikeApi.initialize(configuration, logger);

        codealikeApi
            .authenticate('invalidtoken')
            .then(
                (result) => { 
                    throw new Error("Should throw an error"); 
                    done(); 
                },
                (error) => { 
                    assert.equal(error, "Invalid token provided", "Api should reject with token error if token is invalid");
                    assert.isNull(codealikeApi.userId, "Api should clean user id after a invalid authentication");
                    assert.isNull(codealikeApi.token, "Api should clean user token after a invalid authentication");
                    done(); 
                }
            );

        codealikeApi.dispose();
    });

    it('Not authenticate', done => {
        configuration.initialize('testClient', '0', '0');
        logger.initialize(configuration);
        codealikeApi.initialize(configuration, logger);

        codealikeApi
            .authenticate('weak-9396226521/2f0928f1-5df7-43ca-be4f-e54ff99285f0')
            .then(
                (result) => { 
                    assert.ok("Invalid token should authenticate if well formatted"); 
                    done();
                },
                (error) => { 
                    assert.isNull(codealikeApi.userId, "Api should clean user id after a invalid authentication");
                    assert.isNull(codealikeApi.token, "Api should clean user token after a invalid authentication");
                    done(); 
                }
            );

        codealikeApi.dispose();
    });

    it('Notifies connection state changes', done => {
        let subscriber = sinon.spy();
        let subscriber2 = sinon.spy();

        configuration.initialize('testClient', '0', '0');
        logger.initialize(configuration);
        codealikeApi.initialize(configuration, logger);

        let position = codealikeApi.registerConnectionStateSubscriber(subscriber);

        codealikeApi.setConnectionState({ state: 'connected' });
        assert.equal(1, subscriber.callCount, "Subscribed function for connection state should be called on state change");

        codealikeApi.unregisterConnectionStateSubscriber(position);

        codealikeApi.setConnectionState({ state: 'disconnected' });
        assert.equal(1, subscriber.callCount, "Unsubscribed function for connection state should not be called after unregistered");

        codealikeApi.dispose();

        done();
    });
});

describe('Get profile', function() {
    it('Succesfully get profile', done => {
        configuration.initialize('testClient', '0', '0');
        logger.initialize(configuration);
        codealikeApi.initialize(configuration, logger);

        // manually configure valid authentication information
        codealikeApi.isAuthenticated = true;
        codealikeApi.userId = 'weak-9396226521';
        codealikeApi.token = '2f0928f1-5df7-43ca-be4f-e54ff99285f6'

        codealikeApi.getProfile().then(
            (res) => {
                logger.trace("Get profile", res);
                done(); 
            },
            (err) => {
                throw new Error("Profile obtention shouldn't fail");
                done(); 
            }
        );

        codealikeApi.dispose();
    });

    it('Not authenticated', done => {
        configuration.initialize('testClient', '0', '0');
        logger.initialize(configuration);
        codealikeApi.initialize(configuration, logger);

        codealikeApi
            .getProfile()
            .then(result => { throw new Error("Should throw an error"); done(); })
            .catch(error => { done(); });

        codealikeApi.dispose();
    });
});