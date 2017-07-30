'use strict'

var Configuration = {
    settings: {
        clientId: 'defaultClient',
        clientVersion: '0.0.0.1',
        apiUrl: 'https://codealike.com/api/v2',
        idleCheckInterval: 30000, // in milliseconds
        idleMaxPeriod: 60000, // in milliseconds
        flushInterval: 300000 // in milliseconds
    },

    merge: function(configuration) {
        // merge operation should apply new configuration
        // existing base settings
        return Object.assign({}, this.settings, configuration);
    }
}

module.exports = Configuration;