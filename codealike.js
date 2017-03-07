'use strict';

var logger = require('./logger/logger').Logger;
var recorder = require('./recorder/recorder').Recorder;
var activityType = require('./types/activityType').ActivityType;

var Codealike = {
    isInitialized: false,
    isTracking: false,
    flushInterval: null,
    idleCheckInterval: null,

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

        this.trackSystemState({});

        this.flushInterval = setInterval(this.flushData, 10000);
        this.idleCheckInterval = setInterval(this.checkIdle, 30000);

        logger.info('Codealike started tracking');
    },

    stopTracking: function() {
        if (!this.isInitialized)
            throw new Error("Codealike should be initialized before used");

        if (this.isTracking) {
            clearInterval(this.flushInterval);
            clearInterval(this.idleCheckInterval);

            this.checkIdle();
            this.flushData();
        }

        this.isTracking = false;
        logger.info('Codealike stoped tracking');
    },

    checkIdle: function() {
        if (!recorder.lastState)
            return;

        // if last state was idle, it seems to be still idle
        if (recorder.lastState.activityType === activityType.Idle) {
            recorder.updateLastState();
        }
        else {
            var currentTime = new Date();
            var elapsedFromLastEventInSeconds = (currentTime - recorder.lastEventTime);
            if (elapsedFromLastEventInSeconds >= 60000) {
                recorder.recordState({
                    activityType: activityType.Idle,
                    start: currentTime
                });
            }
        }
    },

    flushData: function() {
        logger.info('Codealike is sending data');

        if (!recorder.isInitialized)
            return;

        // gets data to be sent to the server
        var dataToSend = recorder.getLastBatch();
    },

    trackFocusEvent: function(context) {
        if (!this.isInitialized)
            throw new Error("Codealike should be initialized before used");

        if (!this.isTracking)
            return;

        // completes event information
        context.activityType = activityType.DocumentFocus;
        context.start = new Date();

        recorder.recordState({
            activityType: activityType.Navigating,
            start: new Date()
        });

        recorder.recordEvent(context);
    },

    trackCodingEvent: function(context) {
        if (!this.isInitialized)
            throw new Error("Codealike should be initialized before used");

        if (!this.isTracking)
            return;

        // completes event information
        context.activityType = activityType.DocumentEdit;
        context.start = new Date();

        recorder.recordState({
            activityType: activityType.Coding,
            start: new Date()
        });

        recorder.recordEvent(context);
    },

    trackSystemState: function(context) {
        if (!this.isInitialized)
            throw new Error("Codealike should be initialized before used");

        if (!this.isTracking)
            return;

        // set event type
        context.activityType = activityType.System;
        context.start = new Date();

        recorder.recordState(context);
    }
};

module.exports = { Codealike };