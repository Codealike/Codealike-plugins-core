'use strict'

var logger = require('../logger/logger').Logger;
var configuration = require('../configuration').Configuration;
var client = require('./restClient/fetchClient').RestClient;

var Api = {
    clientId: null,
    isInitialized: false,

    initialize: function(clientId = null) {
        // client identificator should be provided to configure codealike instance
        if (clientId === null)
            throw new Error('Codealike api initialization requires a client Id');
        
        // stores client identificator for api calls
        this.clientId = clientId;

        // set initialized flag as true
        this.isInitialized = true;

        logger.info('Codealike api initialized');
    },

    dispose: () => {
        this.isInitialized = false;
        logger.info('Codealike api disposed');
    },

    authenticate: function(userToken) {
        if (!this.isInitialized)
            throw new Error("Codealike Api should be initialized before used");

        let clientId = this.clientId;

        return new Promise(
            function(resolve, reject) {
                var tokenArray = userToken.split('/');

                // token structure requires at least two elements
                if (tokenArray.length != 2)
                    reject("Invalid token provided");

                // execute request to authenticate the user
                client.executeGet(clientId, `account/${tokenArray[0]}/authorized`, tokenArray[0], tokenArray[1])
                    .then((result) => { 
                        logger.log("Request success", result);
                        resolve(result) 
                    }, 
                    (error) => { 
                        logger.log('Request failed', error);
                        reject(error) 
                    });
            }
        );
    },

    getProfile: function(userName) {
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
    }
}

module.exports = { Api };