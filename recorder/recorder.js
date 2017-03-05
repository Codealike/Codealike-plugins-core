'use strict';

var _ = require('lodash-node');

var Recorder = {
    isInitialized: false,
    currentSession: null,
    lastEvent: null,
    lastState: null,
    lastEventTime: null,

    initialize: function() {
        this.isInitialized = true;

        this.currentSession = {
            states: [],
            events: []
        };
    },

    dispose: function() {
        this.isInitialized = false;
        this.currentSession = null;
    },

    getLastBatch: function() {
        if (!this.isInitialized)
            throw new Error("Recorder should be initialized before used");

        // creates a copy of the current session
        var sessionToFlush = _.clone(this.currentSession);

        // initializes an empty session for further tracking
        this.currentSession = {
          states: [],
          events: []
        };

        return sessionToFlush;
    },

    isLastEventPropagating: function(event) {
        return (
            this.lastEvent !== null
            && event.activityType === this.lastEvent.activityType
            && event.file === this.lastEvent.file
            && event.line === this.lastEvent.line
        );
    },

    isLastStatePropagating: function(state) {
        return (
            this.lastState !== null
            && state.activityType === this.lastState.activityType
        )
    },

    recordEvent: function(event) {
        if (!this.isInitialized)
            throw new Error("Recorder should be initialized before used");

        if (this.isLastEventPropagating(event)) {
            this.updateLastEvent();
        }
        else {
            // set the finalization of the last event
            if (this.lastEvent) {
                this.lastEvent.end = new Date();
            }

            // adds the event to the current session
            this.currentSession.events.push(event);

            // sets event as last event
            this.lastEvent = event;
        }

        // saves time from last event
        this.lastEventTime = new Date();
    },

    recordState: function(state) {
        if (!this.isInitialized)
            throw new Error("Recorder should be initialized before used");

        if (this.isLastStatePropagating(state)) {
            this.updateLastState();
        }
        else {
            // set the finalization of the last state
            if (this.lastState) {
                this.lastState.end = new Date();
            }

            // adds the state to the current session
            this.currentSession.states.push(state);

            // sets state as last state
            this.lastState = state;
        }
    },

    updateLastEvent: function() {
        this.lastEvent.end = new Date();
    },

    updateLastState: function() {
        this.lastState.end = new Date();
    }
};

module.exports = { Recorder };