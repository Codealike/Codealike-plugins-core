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

    afterEach('Restore console routines', function() {
        codealike.dispose();
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
