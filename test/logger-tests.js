'use strict';

var assert = require('chai').assert;
var expect = require('chai').expect;
var sinon = require('sinon');
var logger = require('../logger/logger').Logger;

describe('Codealike Logger', function() {

    it('Initialization error thrown', function() {
        expect(() => logger.initialize()).to.throw('Codealike logger initialization requires a configuration object');
    });

    it('Should exist a logger if configuration logLevel > 0', function() {
        const configuration = {
            instancePath: 'pathForLogs',
            globalSettings: {
                logLevel: 1
            },
            ensurePathExists: sinon.spy()
        };

        logger.initialize(configuration);

        assert.notEqual(null, logger.wlogger, 'wlogger should be not null if log level > 0');
        assert.equal(true, configuration.ensurePathExists.calledOnce, "logger should ensured log path exists");
        
        logger.dispose();
    });

    it('Should not exist a logger if configuration logLevel = 0', function() {
        const configuration = {
            instancePath: 'pathForLogs',
            globalSettings: {
                logLevel: 0
            },
            ensurePathExists: sinon.spy()
        };

        logger.initialize(configuration);

        assert.equal(null, logger.wlogger, 'wlogger should be null if log level = 0');
        assert.equal(0, configuration.ensurePathExists.callCount, "logger should not ensured path exists");

        logger.dispose();
    });
});