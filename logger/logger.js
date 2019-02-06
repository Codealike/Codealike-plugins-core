'use strict'
var winston = require('winston');
var path = require('path');

var Logger = {
    // configuration instance, null by default
    configuration: null,

    // logger instance, null by default
    wlogger: null,

    initialize: function(configuration) {
        // sets expected log level
        this.configuration = configuration;

        // while testing, log only to file, leaving stdout free for unit test status messages
        if (this.configuration.logLevel > 0) {
            // ensure instance path folder exists
            this.configuration.ensurePathExists(configuration.instancePath);

            // creates the logger
            this.wlogger = new (winston.Logger)({
                transports: [
                    new (winston.transports.File)({ filename: path.join(configuration.instancePath, 'codealike.log') })
                ]
            });
        }

        this.info('Codealike logger started');
    },

    dispose: function() {
        // prevent issues when logger was not initialized
        if (this.wlogger)
            this.wlogger.info('Codealike logger finished');
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