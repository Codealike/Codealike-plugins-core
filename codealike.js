'use strict';

var configuration = require('./configuration');
var logger = require('./logger/logger').Logger;
var recorder = require('./recorder/recorder').Recorder;
var activityType = require('./types/activityType').ActivityType;
var api = require('./api/codealikeApi.js').Api;
var fs = require('fs');
var path = require('path');
const uuidv1 = require('uuid/v1');
const os = require('os');
const moment = require('moment');
const hostNameHelpers = require('./hostNameHelper');

var Codealike = {
    isInitialized: false,
    isTracking: false,
    flushInterval: null,
    idleCheckInterval: null,
    instanceId: '',
    hostFQDN: null,

    /* 
     *  stateBeforeIdle:
     *  In case of going idle, we have to save the current state
     *  so when leaving iddle state, we can resume last known state.
     */
    stateBeforeIdle: null,

    /*
     *  currentProject:
     *  CurrentProject has the information about the current project being tracked
     *  by codealike. It should at least have a registered projectId.
     *  The desirable structure is :
     *  { projectId: <UUID>, projectName: <string> }
     */
    currentProject: null,

    /*
     *  initialize:
     *  Initialize process should configure api and recorder instances
     *  to be prepared to connect and start tracking if required.
     *  Api initialization requires a 'cliendId' to identificate requests 
     *  in name of 'client' and 'clientVersion'.
     */
    initialize: function(clientId, clientVersion) {
        if (!clientId)
            throw new Error("Codealike initialization requires a client Id'");

        if (!clientVersion)
            throw new Error("Codealike initialization requires a client Version");

        // initialize instance value as new timestamp
        let instanceId = moment().unix().toString();

        // initialize codealike configuration and load global settings
        configuration.initialize(clientId, clientVersion, instanceId);
        configuration.loadGlobalSettings();

        // initialize logger
        logger.initialize(configuration.instancePath);

        // initialize api
        api.initialize(clientId);

        // initialize recorder
        recorder.initialize();

        // get the host name for currrent running environment
        // try to get full name, if failed got for os hostname
        hostNameHelpers.getHostFQDN().then(
            (hostname) => {
                Codealike.hostFQDN = hostname;

                 // log host fqdn obtained for recording activities
                logger.info('Codealike initialized with host name ' + Codealike.hostFQDN);
            },
            (error) => {
                // host name will default to os.hostname()
                Codealike.hostFQDN = os.hostname();

                // log host fqdn obtained for recording activities
                logger.info('Codealike initialized with host name ' + Codealike.hostFQDN);
            }
        );

        // set initialized flag as true
        this.isInitialized = true;

        logger.info('Codealike initialized with instance id ' + instanceId);
    },

    hasUserToken: function() {
        return (configuration.globalSettings.userToken != null);
    },

    getUserToken: function() {
        return configuration.getUserToken();
    },

    setUserToken: function(userToken) {
        configuration.setUserToken(userToken);
        configuration.savelGlobalSettings();
        logger.info(`Codealike user token set to ${userToken}`);
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
        this.isConfigured = false;

        logger.info(`Codealike disposed`);    

        // dispose logger
        logger.dispose();
    },

    /*
     *  connect:
     *  Connect process should try to authenticate user with given token
     *  If authenticated, api should be configured to be able to perform
     *  further requests in users name (by keeping user authentication info).
     */
    connect() {
        if (!this.isInitialized)
            throw new Error("Codealike should be initialized before used");

        logger.info(`Codealike is connecting`);    

        return api.authenticate(configuration.globalSettings.userToken);
    },

    /*
     *  getProfile:
     *  GetProfile process should return authenticated user profile information.
     *  It requires api to be already connected and configured with valid token,
     *  client and user id.
     */
    getProfile() {
        if (!this.isInitialized)
            throw new Error("Codealike should be initialized before used");

        return api.getProfile();
    },

    /*
     *  disconnect:
     *  Disconnect process should stop tracking (if already doing that)
     *  and disconnect api.
     *  Codealike instance should be safe for disposing after this mathod.
     */
    disconnect() {
        if (!this.isInitialized)
            throw new Error("Codealike should be initialized before used");

        // if tracking, stop doing that
        this.stopTracking();

        // clear api connection data
        api.disconnect();

        logger.info(`Codealike is disconnected`);    
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
        if (!this.isInitialized)
            throw new Error("Codealike should be initialized before used");

        return new Promise(function(resolve, reject) {
            // generate codealike json configuration file path
            let codealikeProjectFile = path.join(projectFolderPath, 'codealike.json');

            // try to get project configuration from file
            let existingConfiguration = null;
            if (fs.existsSync(codealikeProjectFile)) {
                existingConfiguration = JSON.parse(fs.readFileSync(codealikeProjectFile, 'utf8'));
            }
            
            // if no configuration was retrieved
            // we have to assign a project id and create configuration file for project
            if (existingConfiguration == null || !existingConfiguration.projectId) {
                // create unique id
                let projectId = uuidv1();
                let projectName = path.basename(projectFolderPath);

                // register project
                api.registerProjectContext(projectId, projectName)
                    .then(
                        (result) => {
                            // create project configuration
                            let configuration = { projectId: projectId, projectName: projectName };

                            // convert object to string
                            let jsonString = JSON.stringify(configuration);

                            // if registered, save configuration file
                            // have to save configuration file
                            fs.writeFile(codealikeProjectFile, jsonString, 'utf8',
                                function(error) {
                                    if (error) {
                                        reject('Could not save project configuration file.');
                                    }
                                    resolve(configuration);
                                });
                        },
                        (error) => {
                            reject('Could not register project in codealike server.');
                        }
                    )
            }
            else {
                resolve(existingConfiguration);
            }
        });
    },

    /*
     *  startTracking:
     *  StartTracking activates all required functionalities to start
     *  tracking events and state changes in a given project.
     *  It must receive the project configuration of the project being tracked
     */
    startTracking: function(projectConfiguration, workspaceStartTime = new Date()) {
        if (!this.isInitialized)
            throw new Error("Codealike should be initialized before used");

        if (!projectConfiguration)
            throw new Error("Codealike project configuration is required to start tracking");

        // sets internal state to indicate tracking is in progress
        this.isTracking = true;

        // saves current project reference for tracking purposes
        this.currentProject = projectConfiguration;

        // tracks system state and open solution events
        this.trackSystemState(workspaceStartTime);
        this.trackOpenSolutionEvent(workspaceStartTime);

        this.flushInterval = setInterval(this.flushData, configuration.globalSettings.flushInterval);
        this.idleCheckInterval = setInterval(this.checkIdle, configuration.globalSettings.idleCheckInterval);

        // verify if there are local files to send
        this.flushPendingFiles();

        logger.info('Codealike started tracking');
    },

    stopTracking: function() {
        if (!this.isInitialized)
            throw new Error("Codealike should be initialized before used");

        if (this.isTracking) {
            clearInterval(this.flushInterval);
            clearInterval(this.idleCheckInterval);

            this.checkIdle();
            this.flushData(true);
        }

        this.isTracking = false;
        logger.info('Codealike stoped tracking');
    },

    checkIdle: function() {
        if (!recorder.lastState)
            return;

        // if last state was idle, it seems to be still idle
        if (recorder.lastState.type === activityType.Idle) {
            recorder.updateLastState();
        }
        else {
            var currentTime = new Date();
            var elapsedFromLastEventInSeconds = (currentTime - recorder.lastEventTime);
            if (elapsedFromLastEventInSeconds >= configuration.globalSettings.idleMaxPeriod) {
                
                // if state was coding before going iddle
                // all the time between last event and idle should be coding
                if (recorder.lastState.type === activityType.Coding) {
                    recorder.lastState.end = new Date();
                }

                // save last state type before going iddle
                Codealike.stateBeforeIdle = recorder.lastState.type;

                // record idle state
                recorder.recordState({
                    type: activityType.Idle,
                    start: currentTime
                });
            }
        }
    },

    getDataToFlush: function() {
        if (!recorder.isInitialized)
            return null;

        // gets data to be sent to the server
        var dataToSend = recorder.getLastBatch();

        if (dataToSend.events.length === 0) {
            logger.info('No tracked data to send is available');
            return null;
        }

        // generate data package to be sent to the server
        let data = {
            machine: Codealike.hostFQDN,
            client: configuration.instanceSettings.clientId,
            solutionId: Codealike.currentProject.projectId,
            batchId: uuidv1(),
            extension: configuration.instanceSettings.clientVersion,
            instance: configuration.instanceSettings.instanceId,
            projects: [
                { 
                    projectId: Codealike.currentProject.projectId,
                    name: Codealike.currentProject.projectName
                }
            ],
            states: dataToSend.states.map(state => {
                let startTime = moment(state.start).format();
                let endTime = moment(state.end).format();
                let duration = moment.utc(moment(state.end).diff(moment(state.start))).format("HH:mm:ss.SSS");
                
                return {
                    parentId: state.projectId,
                    type: state.type,
                    start: startTime,
                    end: endTime,
                    duration: duration,
                };
            }),
            events: dataToSend.events.map(event => {
                let startTime = moment(event.start).format();
                let endTime = moment(event.end).format();
                let duration = moment.utc(moment(event.end).diff(moment(event.start))).format("HH:mm:ss.SSS");

                return {
                    parentId: event.projectId,
                    type: event.type,
                    start: startTime,
                    end: endTime,
                    duration: duration,
                    context: {
                        member : event.member || '',
                        namespace : event.namespace || '',
                        projectId : event.projectId,
                        file : event.file,
                        class : event.className || '',
                        line: event.line
                    }
                };
            })
        }

        return data;
    },

    saveLocalCache: function(data) {
        // if there is data to flush, save it to disk
        let flushFilePath = path.join(configuration.cachePath, configuration.instanceSettings.clientId + '-' + moment().format('YYYYMMDDhhmmss') + '.json');
        fs.writeFile(flushFilePath, JSON.stringify(data), 'utf8',
        function(error) {
            if (error) {
                throw new Error('Could not save local cache file.');
            }
        });
    },

    sendDataToCodealike: function(data, saveLocalIfFailed = true) {
        return new Promise(
            function(resolve,reject) {
                // try to send data to server
                api.postActivity(data).then(
                    (result) => {
                        // data sent
                        logger.trace("Data successfully sent to server");

                        resolve();
                    },
                    (error) => {
                        // if failed, save data local to be sent next opportunity
                        if (saveLocalIfFailed) { 
                            Codealike.saveLocalCache(data);
                        }

                        logger.trace("Data not sent to server", error);

                        reject(error);
                    }
                );
            }
        );
    },

    flushPendingFiles: function() {
        fs.readdir(configuration.cachePath, function(err, filenames) {
            if (err) {
                //throw new Error('Could not load local cache path.');
                return;
            }

            // process files and mark them to be removed
            filenames.forEach(function(filename) {
                Codealike.flushLocalFile(filename);
            });
        });
    },

    flushLocalFile: function(fileName) {
        if (!fileName)
            return;

        fs.readFile(path.join(configuration.cachePath, fileName), 'utf-8', function(err, content) {
            logger.trace(fileName + ' picked to be flushed');

            if (err) {
                logger.log('File picked to be flushed not available anymore', fileName);
                return;
            }

            // if content is empty, nothing to do
            if (!content)
                return;

            // parse data as json
            let data = "";
            try {
                data = JSON.parse(content);
            }
            catch(error) {
                logger.log("File " + fileName + " content is corrupt");
            }

            // try to send data to server
            Codealike.sendDataToCodealike(data, false).then(
                () => {
                    // if finished ok, move the file to history
                    // remove the file (it will be created again if sending fails)
                    fs.rename(path.join(configuration.cachePath, fileName), path.join(configuration.historyPath, fileName), (err) => {
                        if (err) {
                            logger.log("Error moving " + fileName + " to history folder");
                        }

                        logger.log("File " + fileName + " succesfully moved to history folder");
                    });
                },
                (error) => {
                    logger.trace("Could not send " + fileName + " information to server", error);
                }
            );
        });
    },

    flushData: function(localOnly = false) {
        logger.info('Codealike is sending data');

        // get data pending to be flushed
        let data = Codealike.getDataToFlush();

        // if no data found to flush, just return
        if (!data) {
            // nothing else to do here
            return;
        }

        if (localOnly) {
            // if local only, just save cache to disk
            Codealike.saveLocalCache(data);
        }
        else {
            // try to send data to server
            Codealike.sendDataToCodealike(data, true);
        }
    },

    updateOrChangeStateOnEvent: function(proposedNewState) {
        var newState = proposedNewState;

        // if there is an state before idle, it means 
        // we left idle state with current event and 
        // we have to resume that state
        if (this.stateBeforeIdle != null) {
            newState = this.stateBeforeIdle;
            this.stateBeforeIdle = null;
        }
        else {
            // verify if status should be updated or changed
            // this is because when debugging, focus or coding
            // events must not change the current status.
            // So, if last state was debugging, state should be
            // just updated.
            if (proposedNewState === activityType.Coding &&
                recorder.lastState.type === activityType.Debugging) {
                newState = activityType.Debugging;
            }
        }

        // record status
        recorder.recordState({
            projectId: this.currentProject.projectId,
            type: newState,
            start: new Date()
        });
    },

    trackFocusEvent: function(context) {
        if (!this.isInitialized)
            throw new Error("Codealike should be initialized before used");

        if (!this.isTracking)
            return;

        // completes event information
        context.projectId = this.currentProject.projectId;
        context.type = activityType.DocumentFocus;
        context.start = new Date();

        // check whether or not state should be changed or updated
        this.updateOrChangeStateOnEvent(activityType.Coding);

        // record current event
        recorder.recordEvent(context);

        logger.info('Codealike Tracked Focus', context);
    },

    trackCodingEvent: function(context) {
        if (!this.isInitialized)
            throw new Error("Codealike should be initialized before used");

        if (!this.isTracking)
            return;

        // completes event information
        context.projectId = this.currentProject.projectId;
        context.type = activityType.DocumentEdit;
        context.start = new Date();

        // check whether or not state should be changed or updated
        this.updateOrChangeStateOnEvent(activityType.Coding);

        // record current event
        recorder.recordEvent(context);

        logger.info('Codealike Tracked Event', context);
    },

    trackSystemState: function(start) {
        if (!this.isInitialized)
            throw new Error("Codealike should be initialized before used");

        if (!this.isTracking)
            return;

        // generate state context
        let context = {
            projectId: this.currentProject.projectId,
            type: activityType.System,
            start: start
        };

        // record system state, started when workspace started
        recorder.recordState(context);

        logger.info('Codealike Tracked System state', context);
    },

    trackOpenSolutionEvent: function(start) {
        if (!this.isInitialized)
            throw new Error("Codealike should be initialized before used");

        if (!this.isTracking)
            return;

        // generate event context
        let context = {
            projectId: this.currentProject.projectId,
            type: activityType.OpenSolution,
            start: start
        };

        // record open solution event, started when workspace started
        recorder.recordEvent(context);

        logger.info('Codealike Tracked Open Solution', context);
    },

    trackDebuggingState: function() {
        if (!this.isInitialized)
            throw new Error("Codealike should be initialized before used");

        if (!this.isTracking)
            return;

        // when state is reported, state before idle should be cleaned up
        this.stateBeforeIdle = null;

        // generate event context
        let context = {
            projectId: this.currentProject.projectId,
            type: activityType.Debugging,
            start: new Date()
        };

        // record open solution event, started when workspace started
        recorder.recordState(context);

        logger.info('Codealike Tracked Debugging state', context);
    },

    trackCodingState: function() {
        if (!this.isInitialized)
            throw new Error("Codealike should be initialized before used");

        if (!this.isTracking)
            return;

        // when state is reported, state before idle should be cleaned up
        this.stateBeforeIdle = null;

        // generate event context
        let context = {
            projectId: this.currentProject.projectId,
            type: activityType.Coding,
            start: new Date()
        };

        // record open solution event, started when workspace started
        recorder.recordState(context);

        logger.info('Codealike Tracked Coding state', context);
    }
};

module.exports = { Codealike };