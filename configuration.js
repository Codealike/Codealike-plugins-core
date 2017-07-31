'use strict'

var fs = require('fs');
var path = require('path');
const os = require('os');

var baseGlobalSettings = {
    userToken: null,
    apiUrl: 'https://codealike.com/api/v2',
    idleCheckInterval: 30000, // in milliseconds
    idleMaxPeriod: 60000, // in milliseconds
    flushInterval: 300000 // in milliseconds
};

var Configuration = {
    codealikeBasePath: null,

    globalSettings: {
        userToken: null,
        apiUrl: 'https://codealike.com/api/v2',
        idleCheckInterval: 30000, // in milliseconds
        idleMaxPeriod: 60000, // in milliseconds
        flushInterval: 300000 // in milliseconds
    },

    instanceSettings: {
        clientId: 'defaultClient',
        clientVersion: '0.0.0.1',
        instanceId: 0
    },

    projectSettings: {
        projectId: null,
        projectName: null,
    },

    initialize: function(clientId, clientVersion, instanceId) {
        // sets the codealike base path for logging and user settings and profile
        let basePath = path.join(os.homedir(), '.codealike');

        // store current instance settings
        this.instanceSettings.clientId = clientId;
        this.instanceSettings.clientVersion = clientVersion;
        this.instanceSettings.instanceId = instanceId;

        // ensure codealike base path exists
        if (!fs.existsSync(basePath)) {
            fs.mkdirSync(basePath);
        }

        // sets path for aplication usage
        this.codealikeBasePath = basePath;
    },

    /*
     *  loadCodealikeSettings:
     *  This method loads user settings stored in codealike user folder
     *  After this method call userToken and user profile information 
     *  should been loaded
     */
    loadGlobalSettings: function() {
        let codealikeSettingsFile = path.join(this.codealikeBasePath, 'user.json');

        if (fs.existsSync(codealikeSettingsFile)) {
            let existingConfiguration = JSON.parse(fs.readFileSync(codealikeSettingsFile, 'utf8'));
        
            if (existingConfiguration) {
                this.globalSettings = Object.assign({}, baseGlobalSettings, existingConfiguration);
            }
            else {
                this.globalSettings = Object.assign({}, baseGlobalSettings);
            }
        }
    },

    savelGlobalSettings: function(settings) {
        let codealikeSettingsFile = path.join(this.codealikeBasePath, 'user.json');

        // convert object to string
        let jsonString = JSON.stringify(this.globalSettings);

        // if registered, save configuration file
        // have to save configuration file
        fs.writeFile(codealikeSettingsFile, jsonString, 'utf8',
            function(error) {
                if (error) {
                    throw new Error('Could not save global settings file.');
                }
            });
    },

    setUserToken: function(userToken) {
        this.globalSettings.userToken = userToken;
    },

    loadProjectSettings: function(projectFolderPath) {
        let codealikeProjectFile = path.join(projectFolderPath, 'codealike.json');

        if (fs.existsSync(codealikeProjectFile)) {
            let existingConfiguration = JSON.parse(fs.readFileSync(codealikeProjectFile, 'utf8'));

            if (existingConfiguration && existingConfiguration.projectId) {
                this.settings.projectId = existingConfiguration.projectId;
                this.settings.projectName = existingConfiguration.projectName;
            }
        }
    },
}

module.exports = Configuration;