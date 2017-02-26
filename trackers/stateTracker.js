'use strict';

var recorder = require('../recorder/recorder').Recorder;

var StateTracker = {
    trackSystem: function(context) {
        recorder.recordState(context);
    }
};

module.exports = { StateTracker };