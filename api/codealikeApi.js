'use strict'

const X_EAUTH_CLIENT_HEADER = "X-Eauth-Client";
const X_EAUTH_TOKEN_HEADER = "X-Api-Token";
const X_EAUTH_IDENTITY_HEADER = "X-Api-Identity";
const MAX_RETRIES = 5;

var api = {
    identity: null,
    token: null,

    initialize: function(identity, token) {
        this.identity = identity;
        this.token = token;
    },

    authenticate: function() {
        // /api/v2/account/weak-9396226521/authorized
        // https://codealike.com/api/v2/account/weak-9396226521/authorized

        /*
        invocationBuilder.header(X_EAUTH_IDENTITY_HEADER, this.identity);
		invocationBuilder.header(X_EAUTH_TOKEN_HEADER, this.token);
		invocationBuilder.header(X_EAUTH_CLIENT_HEADER, "intellij");
         */
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

module.exports = { api };