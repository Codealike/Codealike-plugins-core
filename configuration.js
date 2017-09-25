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
    instancePath: null, // path where current running instance related stuff is saved
    cachePath: null,
    historyPath: null,

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

    initialize: function(clientId, clientVersion, instanceId) {
        // verify required folder structure exists
        this.createRequiredPaths(clientId, instanceId);

        // store current instance settings
        this.instanceSettings.clientId = clientId;
        this.instanceSettings.clientVersion = clientVersion;
        this.instanceSettings.instanceId = instanceId;
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

    /*
     *  saveCodealikeGlobalSettings
     *  This method saves user settings configured in current configuration instance
     *  to the codealike user folder
     */
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

    getUserToken: function() {
        return this.globalSettings.userToken;
    },

    ensurePathExists: function(path) {
        // ensure log and trace paths exists
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
    },

    createRequiredPaths: function(clientId, instanceId) {
        this.codealikeBasePath = path.join(os.homedir(), '.codealike');
        this.ensurePathExists(this.codealikeBasePath);

        let clientPath = path.join(this.codealikeBasePath, clientId);
        this.ensurePathExists(clientPath);

        this.instancePath = path.join(clientPath, instanceId);
        this.ensurePathExists(this.instancePath);

        this.cachePath = path.join(this.codealikeBasePath, 'cache');
        this.ensurePathExists(this.cachePath);

        this.historyPath = path.join(this.codealikeBasePath, 'history');
        this.ensurePathExists(this.historyPath);
    }
}

module.exports = Configuration;