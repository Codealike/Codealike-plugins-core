'use strict'
var winston = require('winston');
var path = require('path');

var Logger = {
    // logLevel for future use
    logLevel: 0,

    // logger instance, null by default
    wlogger: null,

    initialize: function(configuration) {
        // configuration instance should be provided
        if (!configuration)
            throw new Error('Codealike logger initialization requires a configuration object');

        // sets expected log level
        this.logLevel = configuration.globalSettings.logLevel;

        // while testing, log only to file, leaving stdout free for unit test status messages
        if (this.logLevel > 0) {
            // ensure instance path folder exists
            configuration.ensureLogPathExists();

            // creates the logger
            this.wlogger = new (winston.Logger)({
                transports: [
                    new (winston.transports.File)({ filename: path.join(configuration.instancePath, 'codealike.log') })
                ]
            });
        } else {
            this.wlogger = null;
        }

        this.info('Codealike logger started');
    },

    dispose: function() {
        // prevent issues when logger was not initialized
        if (this.wlogger)
            this.wlogger.info('Codealike logger finished');
        
        this.wlogger = null;
    },

    info: function(message) {
        if (this.wlogger)
            this.wlogger.log('info', message);
    },

    log: function(message, params) {
        if (this.wlogger)
            this.wlogger.log('info', message, params);
    },

    error: function(message) {
        if (this.wlogger)
            this.wlogger.log('info', message);
    },

    trace: function(message, params) {
        if (this.wlogger)
            this.wlogger.log('info', message, params);
    },
}

module.exports = { Logger };