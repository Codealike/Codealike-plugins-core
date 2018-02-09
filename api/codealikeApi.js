'use strict'

var configuration = require('../configuration');
var logger = require('../logger/logger').Logger;
var client = require('./restClient/fetchClient').RestClient;

var Api = {

    /*
     *  clientId:
     *  Client Id identifies the client using the api { atom / vscode / others... }
     */
    clientId: null,

    userId: null,
    token: null,
    isAuthenticated: false,
    isInitialized: false,

    /*
     * connectionState:
     * Every time the plugin performs a network related operation
     * this internal state tracking will be modified and external
     * subscribers will be notified about the change.
     */
    connectionState: null,
    stateSubscribers: [],

    initialize: function(clientId) {
        // client identificator should be provided to configure codealike instance
        if (!clientId)
            throw new Error('Codealike api initialization requires a client Id');
        
        // stores client identificator for api calls
        this.clientId = clientId;

        // initializes client with server url
        client.initialize(clientId, configuration.globalSettings.apiUrl);

        // set initialized flag as true
        this.isInitialized = true;

        logger.info('Codealike api initialized');
    },

    dispose: function() {
        this.isInitialized = false;
        this.clientId = null;
        this.stateSubscribers = [];
        
        logger.info('Codealike api disposed');
    },

    disconnect: function() {
        // clean up session information
        this.clientId = null;
        this.userId = null;
        this.token = null;
        this.isAuthenticated = false;

        // set status to offline
        Api.setOffLine();
    },

    setOnLine: function() { Api.setConnectionState({ networkStatus: 'OnLine' }); },
    setOffLine: function() { Api.setConnectionState({ networkStatus: 'OffLine' }); },

    setConnectionState: function(newState) {
        this.connectionState = newState;
 
        this.stateSubscribers.forEach(callback => {
            callback(Object.assign({}, { isAuthenticated: Api.isAuthenticated }, newState));
        });
     },
 
    getConnectionState: function() {
        return this.connectionState;
    },

    registerConnectionStateSubscriber: function(subscriber) {
        return (this.stateSubscribers.push(subscriber)-1);
    },

    unregisterConnectionStateSubscriber: function(position) {
        this.stateSubscribers.splice(position, 1);
    },

    getPluginConfiguration: function() {
        // save reference for inner execution
        let that = this;

        return new Promise(
            function(resolve, reject) {
                client.executeAnonymousGet('https://codealike.com/api/v2/public/PluginsConfiguration')
                    .then((result) => { 
                        // if execute get worked, we are online
                        that.setOnLine();

                        resolve(result);
                    })
                    .catch((error) => { 
                        // if execute get did not worked, we are offline
                        that.setOffLine();

                        reject(error);
                    });
            }
        );
    },

    authenticate: function(userToken) {
        if (!this.isInitialized)
            throw new Error("Codealike Api should be initialized before used");

        // save reference for inner execution
        let that = this;

        // ensure old connection params are clean
        that.userId = null;
        that.token = null;

        // return authentication promise
        return new Promise(
            function(resolve, reject) {
                var tokenArray = userToken.split('/');
                
                // token structure requires at least two elements
                if (tokenArray.length != 2) {
                    reject("Invalid token provided");
                }
                else {
                    // save data internally in api
                    let tempUserId = tokenArray[0];
                    let tempToken = tokenArray[1];

                    // execute request to authenticate the user
                    client.executeGet(that.clientId, `account/${tempUserId}/authorized`, tempUserId, tempToken)
                        .then((result) => { 
                            // set api as authenticated and resolve
                            that.isAuthenticated = true;
                            that.userId = tempUserId;
                            that.token = tempToken;

                            // if execute get worked, we are online
                            that.setOnLine();

                            resolve(result);
                        })
                        .catch((error) => { 
                            // if authentication was unsuccesful 
                            // but we still can authenticate local
                            that.isAuthenticated = true;
                            that.userId = tokenArray[0];
                            that.token = tokenArray[1];

                            // if execute get did not worked, we are offline
                            that.setOffLine();

                            resolve();
                        });
                }
            }
        );
    },

    getProfile: function() {
        if (!this.isInitialized)
            throw new Error("Codealike Api should be initialized before used");

        if (!this.isAuthenticated)
            throw new Error("User should authenticate before being able to ask for profile information");

        //apiTarget.path("account").path(username).path("profile") GET
        /* 
        	private String identity;
            private String fullName;
            private String displayName;
            private String address;
            private String state;
            private String country;
            private String avatarUri;
            private String email;
        */
        // save reference for inner execution
        let that = this;

        // return authentication promise
        return new Promise(
            function(resolve, reject) {
                // execute request to authenticate the user
                client.executeGet(that.clientId, `account/${that.userId}/profile`, that.userId, that.token)
                    .then(
                        (result) => { 
                            // if execute get worked, we are online
                            that.setOnLine();

                            resolve(result);
                        },
                        (error) => {
                            // if execute get did not worked, we are offline
                            that.setOffLine();

                            reject(error);
                        }
                    );
            }
        );
    },

    getUserConfiguration: function(userName) {
        //apiTarget.path("account").path(username).path("config") GET
        /*
            Constants.TrackActivity
        */
    },

    registerProjectContext: function(projectId, projectName) {
        //apiTarget.path("solution"); POST
        //body: SolutionContextInfo
        /*
            private UUID solutionId;
            private String name;
            private DateTime creationTime;
        */
        // save reference for inner execution
        let that = this;

        // create request body
        let requestBody = {
            solutionId: projectId,
            name: projectName,
            createTime: new Date()
        }

        // return authentication promise
        return new Promise(
            function(resolve, reject) {
                // execute request to authenticate the user
                client.executePost(that.clientId, `solution`, that.userId, that.token, requestBody)
                    .then((result) => { 
                        // if execute get worked, we are online
                        that.setOnLine();

                        resolve(result);
                    })
                    .catch((error) => { 
                        // if execute get did not worked, we are offline
                        that.setOffLine();

                        reject(error);
                     });
            }
        );
    },

    getSolutionContext: function(projectId) {
        //apiTarget.path("solution").path(projectId.toString()) GET
    },

    postActivity: function(activityInfo) {
        //apiTarget.path("activity") POST
        //body: ActivityInfo
        /* 
            private String machine;
            private String client;
            private String extension;
            private List<ProjectContextInfo> projects;
                    private UUID projectId;
                    private String name;
            private List<ActivityEntryInfo> states;
                private UUID parentId;
                private DateTime start;
                private DateTime end;
                private ActivityType type; //defined at constants
                private Period duration;
                private CodeContextInfo context;
                    private String member;
                    private String className;
                    private String namespace;
                    private UUID projectId;
                    private String file;
            private List<ActivityEntryInfo> events;
                private UUID parentId;
                private DateTime start;
                private DateTime end;
                private ActivityType type; //defined at constants
                private Period duration;
                private CodeContextInfo context;
                    private String member;
                    private String className;
                    private String namespace;
                    private UUID projectId;
                    private String file;
            private String instance;
            private UUID solutionId;
            private UUID batchId;
            private DateTime batchStart;
            private DateTime batchEnd;
        */
        // save reference for inner execution
        let that = this;

        // return authentication promise
        return new Promise(
            function(resolve, reject) {
                // execute request to authenticate the user
                client.executePost(that.clientId, `activity`, that.userId, that.token, activityInfo)
                    .then((result) => { 
                        // if execute post worked, we are online
                        that.setOnLine();

                        resolve(result);
                    })
                    .catch((error) => { 
                        // if execute post did not worked, we are offline
                        that.setOffLine();

                        reject(error);
                     });
            }
        );
    }
}

module.exports = { Api };