'use strict';

var recorder = require('../recorder/recorder').Recorder;

var EventTracker = {
    trackCoding: function(context) {
        recorder.recordEvent(context);
    },
    
    trackFocus: function(context) {
        recorder.recordEvent(context);
    }
};


module.exports = { EventTracker };