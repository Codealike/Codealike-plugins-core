'use strict';

var assert = require('chai').assert;
var expect = require('chai').expect;
var sinon = require('sinon');
var recorder = require('../recorder/recorder').Recorder
var activityType = require('../types/activityType').ActivityType;

describe('Codealike Recorder', function() {

    beforeEach('Mock console routines', function() {
    });

    afterEach('Restore console routines', function() {
    });

    it('Initialization error thrown', function() {
        expect(() => recorder.getLastBatch()).to.throw('Recorder should be initialized before used');
        expect(() => recorder.recordEvent()).to.throw('Recorder should be initialized before used');
        expect(() => recorder.recordState()).to.throw('Recorder should be initialized before used');
    });

    it('Update event duration', function() {
        this.clock = sinon.useFakeTimers();

        recorder.initialize();

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

        recorder.initialize();

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
});