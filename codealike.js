'use strict';

var logger = require('./logger/logger').Logger;
var recorder = require('./recorder/recorder').Recorder;
var activityType = require('./types/activityType').ActivityType;
var api = require('./api/codealikeApi.js').Api;
var fs = require('fs');
var path = require('path');
const uuidv1 = require('uuid/v1');

var Codealike = {
    isInitialized: false,
    isTracking: false,
    flushInterval: null,
    idleCheckInterval: null,
    isConnected: false,

    /*
     *  initialize:
     *  Initialize process should configure api and recorder instances
     *  to be prepared to connect and start tracking if required.
     *  Api initialization requires a 'cliendId' to identificate requests 
     *  in name of 'client'
     */
    initialize: function(clientId) {
        // client identificator should be provided to configure codealike instance
        if (clientId == null)
            throw new Error('Codealike configuration should contain a client Id');

        // initialize api
        api.initialize(clientId);

        // initialize recorder
        recorder.initialize();

        // set initialized flag as true
        this.isInitialized = true;
        
        // log initialized finished
        logger.info('Codealike initialized');
    },

    /*
     *  dispose:
     *  Dispose process should dispose api and recorder instances
     *  If tracking, should stop tracking before releasing recorder and api
     */
    dispose: function() {
        // if tracking, stop it
        if (this.isTracking)
            this.stopTracking();

        // dispose recorder
        recorder.dispose();

        // dispose api
        api.dispose();

        // set initialized as false
        this.isInitialized = false;

        // log disposed finished
        logger.info('Codealike disposed');
    },

    /*
     *  connect:
     *  Connect process should try to authenticate user with given token
     *  If authenticated, api should be configured to be able to perform
     *  further requests in users name (by keeping user authentication info).
     */
    connect(userToken) {
        return api.authenticate(userToken);
    },

    /*
     *  getProfile:
     *  GetProfile process should return authenticated user profile information.
     *  It requires api to be already connected and configured with valid token,
     *  client and user id.
     */
    getProfile() {
        return api.getProfile();
    },

    /*
     *  disconnect:
     *  Disconnect process should stop tracking (if already doing that)
     *  and disconnect api.
     *  Codealike instance should be safe for disposing after this mathod.
     */
    disconnect() {
        // if tracking, stop doing that
        this.stopTracking();

        // clear api connection data
        api.disconnect();
    },

    /*
     *  configure:
     *  Configure proces consists in 
     *  1- verify if codelike configuration file exists for project
     *  2- if there, get project id from file
     *  3- if not, generate a new id and register on codealike server
     *  4- if registered save to configuration file
     */
    configure(projectFolderPath) {
        return new Promise(function(resolve, reject) {
            // generate codealike json configuration file path
            let codealikeProjectFile = path.join(projectFolderPath, 'codealike.json');

            // try to get project configuration from file
            let configuration = null;
            if (fs.existsSync(codealikeProjectFile)) {
                configuration = JSON.parse(fs.readFileSync(codealikeProjectFile, 'utf8'));
            }
            
            // if no configuration was retrieved
            // we have to assign a project id and create configuration file for project
            if (configuration == null || !configuration.projectId) {
                // create unique id
                let projectId = uuidv1();
                let projectName = path.basename(projectFolderPath);

                // register project
                api.registerProjectContext(projectId, projectName)
                    .then(
                        (result) => {
                            // convert object to string
                            let jsonString = JSON.stringify({ projectId: projectId });

                            // if registered, save configuration file
                            // have to save configuration file
                            fs.writeFile(codealikeProjectFile, jsonString, 'utf8',
                                function(error) {
                                    if (error) {
                                        reject('Could not save project configuration file.');
                                    }
                                    resolve(projectId);
                                });
                        },
                        (error) => {
                            reject('Could not register project in codealike server.');
                        }
                    )
            }
            else {
                resolve(configuration.projectId);
            }
        });
    },

    startTracking: function(projectFolderPath) {
        if (!this.isInitialized)
            throw new Error("Codealike should be initialized before used");

        if (projectFolderPath == null)
            throw new Error("Codealike requires a folder path to start tracking");

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

        logger.info('Codealike Tracked Focus', context);
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

        logger.info('Codealike Tracked Event', context);
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