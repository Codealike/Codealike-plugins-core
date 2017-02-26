'use strict';

var logger = require('./logger/logger').Logger;
var recorder = require('./recorder/recorder').Recorder;
var eventTracker = require('./trackers/eventTracker').EventTracker;
var stateTracker = require('./trackers/stateTracker').StateTracker;

var Codealike = {
    isInitialized: false,
    isTracking: false,
    flushInterval: null,

    initialize: function() {
        recorder.initialize();
        this.isInitialized = true;        
        logger.info('Codealike initialized');
    },

    dispose: function() {
        recorder.dispose();

        if (this.isTracking) {
            this.stopTracking();
        }

        this.isInitialized = false;
        logger.info('Codealike disposed');
    },

    startTracking: function() {
        if (!this.isInitialized)
            throw new Error("Codealike should be initialized before used");

        this.isTracking = true;

        this.flushInterval = setInterval(this.flushData, 10000);

        logger.info('Codealike started tracking');
    },

    stopTracking: function() {
        if (!this.isInitialized)
            throw new Error("Codealike should be initialized before used");

        if (this.isTracking) {
            clearInterval(this.flushInterval);
        }

        this.isTracking = false;
        logger.info('Codealike stoped tracking');
    },

    flushData: function() {
        logger.info('Codealike is sending data');

        // gets data to be sent to the server
        var dataToSend = recorder.getLastBatch();
    },

    trackFocusEvent: function(context) {
        if (!this.isInitialized)
            throw new Error("Codealike should be initialized before used");

        if (!this.isTracking)
            return;

        eventTracker.trackFocus(context);
    },

    trackCodingEvent: function(context) {
        if (!this.isInitialized)
            throw new Error("Codealike should be initialized before used");

        if (!this.isTracking)
            return;

        eventTracker.trackCoding(context);
    },

    trackSystemState: function(context) {
        if (!this.isInitialized)
            throw new Error("Codealike should be initialized before used");

        if (!this.isTracking)
            return;

        stateTracker.trackSystem(context);
    }
};

module.exports = { Codealike };