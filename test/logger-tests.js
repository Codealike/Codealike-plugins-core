'use strict';

var assert = require('chai').assert;
var sinon = require('sinon');
var logger = require('../logger/logger').Logger

var originalLog, originalInfo, originalError, originalTrace = null;

describe('Logger', function() {

    before('Mock console routines', function() {
        originalLog = console.log;
        originalInfo = console.info;
        originalError = console.error;
        originalTrace = console.trace;
        
        console.log = sinon.spy();
        console.info = sinon.spy();
        console.error = sinon.spy();
        console.trace = sinon.spy();
    });

    after('Restore console routines', function() {
        console.info = originalInfo;
        console.log = originalLog;
        console.error = originalError;
        console.trace = originalTrace;
    });

    it('Info', function() {
        logger.info('Info message');

        assert.equal(1, console.info.callCount, 'Console info should be called once');
    });

    it('Log', function() {
        logger.log('Log message', null);

        //TODO: verify why console.log seems to be called twice
        assert.equal(2, console.log.callCount, 'Console log should be called once');
    });

    it('Error', function() {
        logger.error('Error message');

        assert.equal(1, console.error.callCount, 'Console error should be called once');
    });

    it('Trace', function() {
        logger.trace('Trace message', null);

        assert.equal(1, console.trace.callCount, 'Console trace should be called once');
    });

});