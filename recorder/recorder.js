'use strict';

var activityType = require('../types/activityType').ActivityType;
var _ = require('lodash');
var moment = require('moment');

var Recorder = {
    isInitialized: false,
    currentSession: null,
    lastEvent: null,
    lastState: null,
    lastEventTime: null,
    configuration: null,

    initialize: function(configuration) {
        // configuration instance should be provided
        if (!configuration)
            throw new Error('Codealike recorder initialization requires a configuration object');

        this.configuration = configuration;
        this.isInitialized = true;

        this.lastEvent = null;
        this.lastState = null;
        this.currentSession = {
            states: [],
            events: []
        };
    },

    dispose: function() {
        this.isInitialized = false;
        this.lastEvent = null;
        this.lastState = null;
        this.currentSession = null;
    },

    getLastBatch: function() {
        if (!this.isInitialized)
            throw new Error("Recorder should be initialized before used");

        // if last state is null or last event is null
        // something is wrong, but nothing to do at this point
        // but to warn
        if (this.lastState === null 
            || this.lastEvent === null) {
            console.log("Opppssss.", this.lastEvent, this.lastState);
            return null;
        }

        let currentTime = new Date();
        
        // closes both types of events
        this.updateEndableEntityAsOfNowIfRequired(this.lastState);
        this.updateEndableEntityAsOfNowIfRequired(this.lastEvent);

        // creates a copy of the current session
        this.lastEvent = _.clone(this.lastEvent);
        this.lastState = _.clone(this.lastState);
        var sessionToFlush = _.clone(this.currentSession);

        // update last state and last event
        // given they will be starting over again now
        this.lastState.start = currentTime;
        this.lastState.end = null;
        
        this.lastEvent.start = currentTime;
        this.lastEvent.end = null;
        
        // initializes an empty session for further tracking
        this.currentSession = {
          states: [ this.lastState ],
          events: [ this.lastEvent ]
        };

        return sessionToFlush;
    },

    /*
     *  isLastEventPropagating:
     *  This method checks if provided event is continuation
     *  of the last event recorded by the system.
     */
    isLastEventPropagating: function(event) {
        return (
            this.lastEvent !== null && 
            event.type === this.lastEvent.type && 
            event.file === this.lastEvent.file && 
            event.line === this.lastEvent.line
        );
    },

    /*
     *  isLastStatePropagating:
     *  This method checks if provided state is continuation
     *  of the last state recorded by the system
     */
    isLastStatePropagating: function(state) {
        return (
            this.lastState !== null && 
            state.type === this.lastState.type
        );
    },

    /*
     *  updateEndableEntityAsOfNowIfRequired:
     *  This method checks if last event/state should be provided
     *  with some spare time given a change. We expect an event
     *  to be a continuous stream of items, if possible without 
     *  blank periods of time in between.
     */
    updateEndableEntityAsOfNowIfRequired: function(endableEntity) {
        // if entity is null, nothing to do here
        if (!endableEntity)
            return;
       
        // get idle max interval in milliseconds
        var idleMinIntervalInMillisecons = this.configuration.pluginSettings.idleCheckInterval;

        var currentTime = new Date();
        var entityBaseEnd = endableEntity.end || endableEntity.start;
        var elapsedPeriodBetweenLastEventAndNow = (currentTime - entityBaseEnd);

        // finally, end of entity was no so long ago
        // let's give it a change to be wild!!!
        if (elapsedPeriodBetweenLastEventAndNow <= idleMinIntervalInMillisecons) {
            endableEntity.end = currentTime;
        }
        else {
            // if event/state type is system related we track
            // whatever it is (no exceptions or checks about duration)
            if (endableEntity.type === activityType.System
                || endableEntity.type === activityType.OpenSolution) {
                endableEntity.end = currentTime;
            }
            else {
                // else, we ensure it does not have inconsistent time
                endableEntity.end = moment(entityBaseEnd).add(idleMinIntervalInMillisecons);
            }
        }
    },

    /*
     * 
     */
    recordEvent: function(event) {
        if (!this.isInitialized)
            throw new Error("Recorder should be initialized before used");

        if (this.isLastEventPropagating(event)) {
            this.updateLastEvent(event);
        }
        else {
            // set the finalization of the last event
            this.updateEndableEntityAsOfNowIfRequired(this.lastEvent);

            // adds the event to the current session
            this.currentSession.events.push(event);

            // sets event as last event
            this.lastEvent = event;
        }

        // saves time from last event
        this.lastEventTime = new Date();
    },

    /*
     * 
     */
    recordState: function(state) {
        if (!this.isInitialized)
            throw new Error("Recorder should be initialized before used");

        if (this.isLastStatePropagating(state)) {
            this.updateLastState();
        }
        else {
            // set the finalization of the last state
            this.updateEndableEntityAsOfNowIfRequired(this.lastState);

            // if state changed, last event is finished for sure
            this.updateEndableEntityAsOfNowIfRequired(this.lastEvent);

            // adds the state to the current session
            this.currentSession.states.push(state);

            // sets state as last state
            this.lastState = state;
        }
    },

    updateLastEvent: function(event) {
        if (this.lastEvent) {
            // when updating an event, we also
            // update context information as 
            // the last event should be the most complete
            this.lastEvent.member = event.member;
            this.lastEvent.className = event.className;
            this.lastEvent.namespace = event.namespace;

            // also update last finishing time as of now
            this.updateEndableEntityAsOfNowIfRequired(this.lastEvent);
        }
    },

    updateLastState: function() {
        if (this.lastState) {
            this.updateEndableEntityAsOfNowIfRequired(this.lastState);
        }
    }
};

module.exports = { Recorder };