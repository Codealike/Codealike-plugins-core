'use strict';

var assert = require('chai').assert;
var expect = require('chai').expect;
var sinon = require('sinon');
var recorder = require('../recorder/recorder').Recorder
var configuration = require('../configuration');
var activityType = require('../types/activityType').ActivityType;

describe('Codealike Recorder', function() {

    it('Initialization error thrown', function() {
        expect(() => recorder.getLastBatch()).to.throw('Recorder should be initialized before used');
        expect(() => recorder.recordEvent()).to.throw('Recorder should be initialized before used');
        expect(() => recorder.recordState()).to.throw('Recorder should be initialized before used');
    });

    it('State after flushing should be consistent', function() {
        this.clock = sinon.useFakeTimers();

        configuration.initialize('testClient', '0', '0');
        recorder.initialize(configuration);

        const firstEventStart = new Date();
        recorder.recordState({
            type: activityType.Coding
        });
        recorder.recordEvent({
            file: 'f1.js',
            line: 12,
            start: firstEventStart,
        });

        this.clock.tick(2000);

        recorder.recordEvent({
            file: 'f1.js',
            line: 12,
            start: new Date(),
        });

        this.clock.tick(6000);

        // perform a get last batch 
        let firstBatch = recorder.getLastBatch();
        assert.equal(firstBatch.states[firstBatch.states.length-1].type, recorder.lastState.type, 'After 1st batching results, last state should be kept');
        //assert.equal(firstBatch.states[firstBatch.states.length-1].end, recorder.lastState.start, 'After 1st batching results, last state should be kept with right timing');
        assert.equal(firstBatch.events[firstBatch.events.length-1].type, recorder.lastEvent.type, 'After 1st batching results, last event should be kept');
        //assert.equal(firstBatch.events[firstBatch.events.length-1].end, recorder.lastEvent.start, 'After 1st batching results, last event should be kept with right timing');

        recorder.recordEvent({
            file: 'f2.js',
            line: 1,
            start: new Date(),
        });

        this.clock.tick(4000);

        recorder.recordEvent({
            file: 'f3.js',
            line: 2,
            start: new Date(),
        });

        let secondBatch = recorder.getLastBatch();
        assert.equal(secondBatch.states[secondBatch.states.length-1].type, recorder.lastState.type, 'After 2nd batching results, last state should be kept');
        //assert.equal(secondBatch.states[secondBatch.states.length-1].end, recorder.lastState.start, 'After 2nd batching results, last state should be kept with right timing');
        assert.equal(secondBatch.events[secondBatch.events.length-1].type, recorder.lastEvent.type, 'After 2nd batching results, last event should be kept');
        //assert.equal(secondBatch.events[secondBatch.events.length-1].end, recorder.lastEvent.start, 'After 2nd batching results, last event should be kept with right timing');

        this.clock.restore();
    });

    it('Update event duration', function() {
        this.clock = sinon.useFakeTimers();

        configuration.initialize('testClient', '0', '0');
        recorder.initialize(configuration);

        const firstEventStart = new Date();
        recorder.recordEvent({
            file: 'f1.js',
            line: 12,
            start: firstEventStart,
        });

        this.clock.tick(2000);

        recorder.recordEvent({
            file: 'f1.js',
            line: 12,
            start: new Date(),
        });

        this.clock.tick(6000);

        recorder.recordEvent({
            file: 'f2.js',
            line: 1,
            start: new Date(),
        });

        this.clock.tick(4000);

        recorder.recordEvent({
            file: 'f3.js',
            line: 2,
            start: new Date(),
        });

        assert.equal(3, recorder.currentSession.events.length, 'Recorder should updated last event and not created a new one');
        assert.equal(recorder.lastEvent, recorder.currentSession.events[2], 'Recorder last event should be equal to last event in session');
        assert.equal(8000, (recorder.currentSession.events[0].end - recorder.currentSession.events[0].start), 'First event should been updated for threshold as second event happened');
        assert.equal(4000, (recorder.currentSession.events[1].end - recorder.currentSession.events[1].start), 'Last event should have been updated by time elapsed');

        this.clock.restore();
    });

    it('Update state duration', function() {
        this.clock = sinon.useFakeTimers();

        configuration.initialize('testClient', '0', '0');
        recorder.initialize(configuration);

        var state = {
            activityType: activityType.System,
            start: new Date()
        };

        recorder.recordState(state);

        this.clock.tick(2000);

        recorder.recordState(state);

        assert.equal(1, recorder.currentSession.states.length, 'Recorder should updated last state and not created a new one');
        assert.equal(recorder.lastState, recorder.currentSession.states[0], 'Recorder last state should be equal to last state in session');
        assert.equal(2000, recorder.lastState.end - recorder.lastState.start, 'Last state should have been updated by time elapsed');

        this.clock.restore();
    });

    it('Update event duration after idle period', function() {
        this.clock = sinon.useFakeTimers();

        configuration.initialize('testClient', '0', '0');
        recorder.initialize(configuration);

        const firstEventStart = new Date();
        recorder.recordEvent({
            file: 'f1.js',
            line: 12,
            start: firstEventStart,
        });

        this.clock.tick(20000);

        recorder.recordEvent({
            file: 'f1.js',
            line: 12,
            start: new Date(),
        });

        this.clock.tick(configuration.pluginSettings.idleCheckInterval+1000);

        recorder.recordEvent({
            file: 'f2.js',
            line: 1,
            start: new Date(),
        });

        assert.equal(2, recorder.currentSession.events.length, 'Recorder should have recorded only two events');
        assert.equal(recorder.lastEvent, recorder.currentSession.events[1], 'Recorder last event should be equal to last event in session');
        assert.equal(50000, (recorder.currentSession.events[0].end - recorder.currentSession.events[0].start), 'First event should been updated for threshold as second event happened');
        assert.equal(51000, (recorder.currentSession.events[1].start - firstEventStart), 'Last event should have started at right time');

        this.clock.restore();
    });
});