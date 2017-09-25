'use strict';

var assert = require('chai').assert;
var expect = require('chai').expect;
var sinon = require('sinon');
var codealike = require('../codealike').Codealike
var activityType = require('../types/activityType').ActivityType;
var recorder = require('../recorder/recorder').Recorder;
var api = require('../api/codealikeApi').Api;
var fs = require('fs');
var path = require('path');

const scriptToRun = [
    { "secondsElapsed": 0, "eventType": activityType.DocumentFocus, context: { "file": "file1", "line": 1 } },
    { "secondsElapsed": 20, "eventType": activityType.DocumentEdit, context: { "file": "file1", "line": 1 } },
    { "secondsElapsed": 1, "eventType": activityType.DocumentEdit, context: { "file": "file1", "line": 1 } },
    { "secondsElapsed": 1, "eventType": activityType.DocumentEdit, context: { "file": "file1", "line": 1 } },
    { "secondsElapsed": 1, "eventType": activityType.DocumentEdit, context: { "file": "file1", "line": 1 } },
    { "secondsElapsed": 1, "eventType": activityType.DocumentEdit, context: { "file": "file1", "line": 1 } },
    { "secondsElapsed": 1, "eventType": activityType.DocumentEdit, context: { "file": "file1", "line": 1 } },
    { "secondsElapsed": 1, "eventType": activityType.DocumentEdit, context: { "file": "file1", "line": 1 } },
    { "secondsElapsed": 1, "eventType": activityType.DocumentEdit, context: { "file": "file1", "line": 1 } },
    { "secondsElapsed": 3, "eventType": activityType.DocumentEdit, context: { "file": "file1", "line": 1 } },
    { "secondsElapsed": 2, "eventType": activityType.DocumentEdit, context: { "file": "file1", "line": 1 } },
    { "secondsElapsed": 180, "eventType": activityType.DocumentFocus, context: { "file": "file1", "line": 1 } },
    { "secondsElapsed": 20, "eventType": activityType.DocumentEdit, context: { "file": "file1", "line": 1 } },
    
    //{ "secondsElapsed": 0, "eventType": activityType.DocumentFocus, context: { "file": "file1", "line": 1 } },
    //{ "secondsElapsed": 59, "eventType": activityType.DocumentFocus, context: { "file": "file1", "line": 1 } },
    //{ "secondsElapsed": 59, "eventType": activityType.DocumentFocus, context: { "file": "file1", "line": 1 } },
    //{ "secondsElapsed": 63, "eventType": activityType.DocumentFocus, context: { "file": "file1", "line": 1 } },
];

describe('Codealike tracking', function() {
    beforeEach('Mock console routines', function() {
        codealike.initialize('testClient', '0.0.1');
    });

    afterEach('Dispose codealike', function() {
        codealike.dispose();
    });

    it('Does not loses last state when flushing', function() {
        this.clock = sinon.useFakeTimers();

        codealike.startTracking({ projectId: 'test-project'});

        // tracks one event
        codealike.trackFocusEvent({
            file: 'f1.js',
            line: 12
        });

        this.clock.tick(2000);

        var batch = recorder.getLastBatch();

        assert.equal(batch.states.length, 2, "Should have recorded one state");
        assert.equal(batch.events.length, 2, "Should have recorded one event");
        assert.equal(recorder.lastState.type, activityType.Coding, "After flush, last state should be conserved");
        assert.equal(recorder.lastEvent.type, activityType.DocumentFocus, "After flush, last event should be conserved");

        var secondBatch = recorder.getLastBatch();
        assert.equal(secondBatch.states.length, 1, "Should have recorded one state");
        assert.equal(secondBatch.events.length, 1, "Should have recorded one event");
        assert.equal(recorder.lastState.type, activityType.Coding, "After second flush, last state should be conserved");
        assert.equal(recorder.lastEvent.type, activityType.DocumentFocus, "After second flush, last event should be conserved");

        codealike.trackCodingEvent({
            file: 'f1.js',
            line: 12
        });

        var thirdBatch = recorder.getLastBatch();
        assert.equal(thirdBatch.states.length, 1, "Should have recorded one state");
        assert.equal(thirdBatch.events.length, 2, "Should have recorded two events");
        assert.equal(recorder.lastState.type, activityType.Coding, "After second flush, last state should be conserved");
        assert.equal(recorder.lastEvent.type, activityType.DocumentEdit, "After second flush, last event should be conserved");

        this.clock.restore();
    });

    it('Tracks activities for less than one second interactions', function() {
        this.clock = sinon.useFakeTimers();

        codealike.startTracking({ projectId: 'test-project'});
        codealike.trackCodingEvent({ "file": "file1", "line": 1 });
        this.clock.tick(600);
        
        let data = codealike.getDataToFlush();

        assert.equal('00:00:00.600', data.events[1].duration, 'Events duration should be rounded up');
        assert.equal('00:00:00.600', data.states[1].duration, 'States duration should be rounded up');

        this.clock.restore();
    });

    it('Tracking activity script should reflect expected log', done => {
        codealike.flushData = sinon.spy();

        this.clock = sinon.useFakeTimers();
        codealike.startTracking({ projectId: 'test-project'});
        scriptToRun.forEach(function(event) {
            // move the clock to expected position
            this.clock.tick(event.secondsElapsed*1000);

            var eventContext = Object.assign({}, event.context);
            switch(event.eventType) {
                case activityType.Coding:
                    codealike.trackCodingState();
                    break;
                case activityType.Debugging:
                    codealike.trackDebuggingState();
                    break;
                case activityType.DocumentEdit:
                    codealike.trackCodingEvent(eventContext);
                    break;
                case activityType.DocumentFocus:
                    codealike.trackFocusEvent(eventContext);
                    break;
                case activityType.Idle:
                    // do nothing!
                    break;
            }

        }, this);
        this.clock.restore();
        
        const batchResult = recorder.getLastBatch();
        assert.isNotNull(batchResult, "Batch result should reflect execution");

        // convert object to string
        let jsonString = JSON.stringify({
            scriptRunned: scriptToRun,
            resultingBatch: batchResult
        });

        // save data to file to check information
        let outputFilePath = path.resolve(__dirname, 'trackingTestResult.txt');
        fs.writeFile(outputFilePath, jsonString, 'utf8', function (err) {
            assert.isNull(err, "File should be saved");
            done();
        });
    });
});
