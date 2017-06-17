'use strict';

var assert = require('chai').assert;
var expect = require('chai').expect;
var sinon = require('sinon');
var codealike = require('../codealike').Codealike
var activityType = require('../types/activityType').ActivityType;
var recorder = require('../recorder/recorder').Recorder

var originalLog, originalInfo = null;

describe('Codealike Tracker', function() {
    beforeEach('Mock console routines', function() {
        originalLog = console.log;
        originalInfo = console.info;
        console.log = sinon.spy();
        console.info = sinon.spy();

        codealike.initialize();
    });

    afterEach('Restore console routines', function() {
        codealike.dispose();

        console.info = originalInfo;
        console.log = originalLog;
    });

    it('Initialization', function() {
        assert.equal(true, codealike.isInitialized, 'Codealike should be initialized before used');
        assert.equal(true, recorder.isInitialized, 'Recorder should be initialized before used');
        assert.notEqual(null, codealike.configuration.identity, 'Codealike should receive valid configuration identity before used');
        assert.notEqual(null, codealike.configuration.token, 'Codealike should receive valid configuration token before used');
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

        assert.equal(4, recorder.currentSession.states.length, 'Should recorded 1 state');
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

    it('Iddle interval', function() {
        this.clock = sinon.useFakeTimers();
        var checkIdleSpy = sinon.spy(codealike, "checkIdle");
        
        codealike.startTracking();

        this.clock.tick(60000);

        assert.equal(2, checkIdleSpy.callCount, 'Idle verification should be called twice');

        codealike.stopTracking();
        
        codealike.checkIdle.restore();
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

        assert.equal(4, recordedBatch.states.length, 'Should recorded 1 state');
        assert.equal(2, recordedBatch.events.length, 'Should recorder 2 events');

        codealike.stopTracking();
        this.clock.restore();
    });

    it('Idle verification', function() {
        this.clock = sinon.useFakeTimers();

        var checkIdleSpy = sinon.spy(codealike, "checkIdle");
        codealike.startTracking();

        assert.equal(activityType.System, recorder.lastState.activityType, 
            'When tracking starts System state should be present');

        // Timer: 0
        codealike.trackCodingEvent({ file: 'f1.js', line: 12 });
        assert.equal(activityType.Coding, recorder.lastState.activityType, 
            'After coding event, Coding state should be present');
        
        // Timer: 2 - 2 secs inactive
        this.clock.tick(2000);
        codealike.trackCodingEvent({ file: 'f1.js', line: 12 });

        // Timer: 30 - 28 secs inactive
        this.clock.tick(28000);
        assert.equal(1, checkIdleSpy.callCount, 'Idle verification should be called');
        assert.equal(activityType.Coding, recorder.lastState.activityType, 
            'After 28 secs of inactivity (30 secs total - 1st idle check) Coding state should prevail');

        // Timer: 60 - 58 secs inactive
        this.clock.tick(30000);
        assert.equal(2, checkIdleSpy.callCount, 'Idle verification should be called');
        assert.equal(activityType.Coding, recorder.lastState.activityType, 
            'After 58 secs of inactivity (60 secs total - 2nd. idle check) Coding state should prevail');

        // Timer: 90 - 88 secs inactive
        this.clock.tick(30000);
        assert.equal(3, checkIdleSpy.callCount, 'Idle verification should be called');
        assert.equal(activityType.Idle, recorder.lastState.activityType, 
            'After 88 secs of inactivity (90 secs total - 3rd. idle check) System state should change to Idle');
        
        // Timer: 120 - 118 secs inactive
        this.clock.tick(30000);
        assert.equal(activityType.Idle, recorder.lastState.activityType, 
            'After 118 secs of inactivity (120 secs total - 4th. idle check) System state should steel be Idle');

        // Timer 122 - 120 secs inactive
        this.clock.tick(2000);
        codealike.trackCodingEvent({ file: 'f1.js', line: 12 });
        assert.equal(activityType.Coding, recorder.lastState.activityType, 
            'After 118 secs of inactivity (120 secs total - 4th. idle check) Coding state should steel be Idle');

        var recordedBatch = recorder.getLastBatch();
        assert.equal(4, recordedBatch.states.length, 'Should recorded 2 state');
        assert.equal(1, recordedBatch.events.length, 'Should recorder 1 events');

        codealike.stopTracking();

        codealike.checkIdle.restore();
        this.clock.restore();
    });
});