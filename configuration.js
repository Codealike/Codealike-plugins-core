'use strict'

var fs = require('fs');
var path = require('path');
const os = require('os');

var Configuration = {
    codealikeBasePath: null,

    settings: {
        userToken: null,
        projectId: null,
        projectName: null,
        clientId: 'defaultClient',
        clientVersion: '0.0.0.1',
        apiUrl: 'https://codealike.com/api/v2',
        idleCheckInterval: 30000, // in milliseconds
        idleMaxPeriod: 60000, // in milliseconds
        flushInterval: 300000 // in milliseconds
    },

    initialize: function(userHomePath) {
        // sets the codealike base path for logging and user settings and profile
        let basePath = userHomePath || path.join(os.homedir(), '.codealike');

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
    loadCodealikeSettings: function() {
        return new Promise(function(resolve, reject) {
            let codealikeSettingsFile = path.join(this.codealikeBasePath, 'user.json');

            if (fs.existsSync(codealikeSettingsFile)) {
                let existingConfiguration = JSON.parse(fs.readFileSync(codealikeSettingsFile, 'utf8'));
            
                if (existingConfiguration) {
                    this.userToken = existingConfiguration.userToken;
                }
            }

            if (this.userToken) {
                resolve(this.userToken)
            }
            else {
                reject();
            }
        });
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

    merge: function(configuration) {
        // merge operation should apply new configuration
        // existing base settings
        return Object.assign({}, this.settings, configuration);
    }
}

module.exports = Configuration;