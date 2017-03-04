'use strict';

var assert = require('chai').assert;
var expect = require('chai').expect;
var sinon = require('sinon');
var codealike = require('../codealike').Codealike
var activityType = require('../types/activityType').ActivityType;
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

    beforeEach(function() {
        codealike.initialize();
    });

    afterEach(function() {
        codealike.dispose();
    });

    it('Initialization', function() {
        assert.equal(true, codealike.isInitialized, 'Codealike should be initialized before used');
        assert.equal(true, recorder.isInitialized, 'Recorder should be initialized before used');
    });

    it('Initialization error thrown', function() {
        codealike.dispose();

        expect(() => codealike.startTracking()).to.throw('Codealike should be initialized before used');
        expect(() => codealike.stopTracking()).to.throw('Codealike should be initialized before used');
        expect(() => codealike.trackCodingEvent()).to.throw('Codealike should be initialized before used');
        expect(() => codealike.trackFocusEvent()).to.throw('Codealike should be initialized before used');
        expect(() => codealike.trackSystemState()).to.throw('Codealike should be initialized before used');
    });

    it('Tracking Events', function() {
        codealike.startTracking();

        codealike.trackCodingEvent({ file: 'f1.js '});
        codealike.trackFocusEvent({ file: 'f1.js' });
        codealike.trackSystemState({ file: 'f1.js' });

        assert.equal(1, recorder.currentSession.states.length, 'Should recorded 1 state');
        assert.equal(2, recorder.currentSession.events.length, 'Should recorder 2 events');
    });

    it('Not tracking', function() {
        codealike.stopTracking();

        var trackEvent = recorder.recordEvent,
            trackState = recorder.recordState;

        recorder.recordEvent = sinon.spy();
        recorder.recordState = sinon.spy();

        codealike.trackCodingEvent({ file: 'f1.js '});
        codealike.trackFocusEvent({ file: 'f1.js' });
        codealike.trackSystemState({ file: 'f1.js' });

        assert.equal(0, recorder.recordEvent.callCount, 'Record event should not be called if tracking is disabled');
        assert.equal(0, recorder.recordState.callCount, 'Record state should not be called if tracking is disabled');
    
        recorder.recordEvent = trackEvent;
        recorder.recordState = trackState;
    });

    it('Flush interval', function() {
        this.clock = sinon.useFakeTimers();
        codealike.flushData = sinon.spy();
        
        codealike.startTracking();

        this.clock.tick(20000);

        assert.equal(2, codealike.flushData.callCount, 'Flush data should be called twice');
        this.clock.restore();
    });

    it('Flush data', function() {
        this.clock = sinon.useFakeTimers();
        codealike.startTracking();

        codealike.trackCodingEvent({ file: 'f1.js '});
        codealike.trackFocusEvent({ file: 'f1.js' });
        codealike.trackSystemState({ file: 'f1.js' });
        codealike.trackSystemState({ file: 'f1.js' });

        var recordedBatch = recorder.getLastBatch();
        assert.equal(2, recordedBatch.states.length, 'Should recorded 2 state');
        assert.equal(2, recordedBatch.events.length, 'Should recorder 2 events');

        this.clock.restore();
    });
});