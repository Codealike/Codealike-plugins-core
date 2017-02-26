'use strict';

var assert = require('chai').assert;
var sinon = require('sinon');
var codealike = require('../codealike').Codealike
var recorder = require('../recorder/recorder').Recorder

var originalLog, originalInfo = null;

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

describe('Codealike Tracker', function() {
    beforeEach(function() {
        codealike.initialize();
    });

    afterEach(function() {
        codealike.dispose();
    });

    it('Initialization', function() {
        assert.equal(true, codealike.isInitialized, "Codealike should be initialized beforeEach used");
        assert.equal(true, recorder.isInitialized, "Recorder should be initialized beforeEach used");
    });

    it('Tracking Events', function() {
        codealike.startTracking();

        codealike.trackCodingEvent({ file: 'f1.js '});
        codealike.trackFocusEvent({ file: 'f1.js' });
        codealike.trackSystemState({ file: 'f1.js' });

        assert.equal(1, recorder.currentSession.states.length, "Should recorded 1 state");
        assert.equal(2, recorder.currentSession.events.length, "Should recorder 2 events");
    });

    it('Flush interval', function() {
        this.clock = sinon.useFakeTimers();
        codealike.flushData = sinon.spy();
        
        codealike.startTracking();

        this.clock.tick(20000);

        assert.equal(2, codealike.flushData.callCount, "Flush data should be called twice");
        this.clock.restore();
    });
});