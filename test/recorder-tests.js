'use strict';

var assert = require('chai').assert;
var expect = require('chai').expect;
var sinon = require('sinon');
var recorder = require('../recorder/recorder').Recorder

var originalLog, originalInfo = null;

describe('Codealike Tracker', function() {
    before('Mock console routines', function() {
        originalLog = console.log;
        originalInfo = console.info;
        console.log = sinon.spy();
        console.info = sinon.spy();
    });

    after('Restore console routines', function() {
        console.info = originalInfo;
        console.log = originalLog;
    });

    it('Initialization error thrown', function() {
        expect(() => recorder.getLastBatch()).to.throw('Recorder should be initialized before used');
        expect(() => recorder.recordEvent()).to.throw('Recorder should be initialized before used');
        expect(() => recorder.recordState()).to.throw('Recorder should be initialized before used');
    });
});