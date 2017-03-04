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

    it('Update event duration', function() {
        this.clock = sinon.useFakeTimers();

        recorder.initialize();

        var event = {
            file: 'f1.js',
            line: 12,
            start: new Date(),
        };

        recorder.recordEvent(event);

        this.clock.tick(2000);

        recorder.recordEvent(event);

        assert.equal(1, recorder.currentSession.events.length, 'Recorder should updated last event and not created a new one');
        assert.equal(recorder.lastEvent, recorder.currentSession.events[0], 'Recorder last event should be equal to last event in session');
        assert.equal(2000, recorder.lastEvent.end - recorder.lastEvent.start, 'Last event should have been updated by time elapsed');

        this.clock.restore();
    });
});