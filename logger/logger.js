'use strict'
var winston = require('winston');
var path = require('path');

var Logger = {
    wlogger: null,
    initialize: function(logPath) {
        // while testing, log only to file, leaving stdout free for unit test status messages
        this.wlogger = new (winston.Logger)({
            transports: [
                new (winston.transports.File)({ filename: path.join(logPath, 'codealike.log') })
            ]
        });

        this.wlogger.info('Codealike logger started');
    },
    dispose: function() {
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