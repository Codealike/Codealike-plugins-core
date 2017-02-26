'use strict';

var _ = require('lodash-node');

var Recorder = {
    isInitialized: false,
    currentSession: null,

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

    recordEvent: function(event) {
        if (!this.isInitialized)
            throw new Error("Recorder should be initialized before used");

        // adds the event to the current session
        this.currentSession.events.push(event);
    },

    recordState: function(state) {
        if (!this.isInitialized)
            throw new Error("Recorder should be initialized before used");

        // adds the state to the current session
        this.currentSession.states.push(state);
    },
};

module.exports = { Recorder };