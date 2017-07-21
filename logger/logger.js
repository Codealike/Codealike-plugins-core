'use strict'
var winston = require('winston');

    // while testing, log only to file, leaving stdout free for unit test status messages
const wlogger = new (winston.Logger)({
    transports: [
        new (winston.transports.File)({ filename: 'codealike.log' })
    ],
    level: 'debug'
});

var Logger = {
    info: function(message) {
        wlogger.log('info', message);
    },
    log: function(message, params) {
        wlogger.log('verbose', message, params);
    },
    error: function(message) {
        wlogger.log('error', message);
    },
    trace: function(message, params) {
        wlogger.log('debug', message, params);
    },
}

module.exports = { Logger };