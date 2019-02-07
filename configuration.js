'use strict'

var fs = require('fs');
var path = require('path');
const os = require('os');

var baseGlobalSettings = {
    userToken: null,
    apiUrl: 'https://codealike.com/api/v2',
    pluginConfigurationEndPoint: 'https://codealike.com/api/v2/public/PluginsConfiguration',
    logLevel: 0
};

var basePluginSettings = {
    idleCheckInterval: 30000, // in milliseconds
    idleMaxPeriod: 60000, // in milliseconds
    flushInterval: 300000 // in milliseconds
};

var Configuration = {
    codealikeBasePath: null,
    clientPath: null,
    instancePath: null, // path where current running instance related stuff is saved
    cachePath: null,
    historyPath: null,

    globalSettings: {
        userToken: null,
        apiUrl: 'https://codealike.com/api/v2',
        pluginConfigurationEndPoint: 'https://codealike.com/api/v2/public/PluginsConfiguration',
        logLevel: 0
    },

    pluginSettings: {
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
        // store current instance settings
        this.instanceSettings.clientId = clientId;
        this.instanceSettings.clientVersion = clientVersion;
        this.instanceSettings.instanceId = instanceId;

        // generates required paths information
        this.codealikeBasePath = path.join(os.homedir(), '.codealike');
        this.clientPath = path.join(this.codealikeBasePath, clientId);
        this.instancePath = path.join(this.clientPath, instanceId);
        this.cachePath = path.join(this.codealikeBasePath, 'cache');
        this.historyPath = path.join(this.codealikeBasePath, 'history');
    },

    // plugin settings can be injected from outside
    loadPluginSettings: function(settings) {
        Configuration.pluginSettings = Object.assign({}, basePluginSettings, settings);
    },

    /*
     *  loadCodealikeSettings:
     *  This method loads user settings stored in codealike user folder
     *  After this method call userToken and user profile information 
     *  should been loaded
     */
    loadGlobalSettings: function() {
        // ensure required global path exists
        this.ensurePathExists(this.codealikeBasePath);

        // then try to load global settings
        let codealikeSettingsFile = path.join(this.codealikeBasePath, 'user.json');

        // if settings file exists, load it
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
        // ensure required global path exists
        this.ensurePathExists(this.codealikeBasePath);

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

    ensureLogPathExists() {
        this.ensurePathExists(this.codealikeBasePath);
        this.ensurePathExists(this.clientPath);
        this.ensurePathExists(this.instancePath);
    },

    ensureCachePathExists() {
        this.ensurePathExists(this.codealikeBasePath);
        this.ensurePathExists(this.cachePath);
    },

    ensureHistoryPathExists() {
        this.ensurePathExists(this.codealikeBasePath);
        this.ensurePathExists(this.historyPath);
    },

    ensurePathExists: function(path) {
        // ensure log and trace paths exists
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
    }
}

module.exports = Configuration;