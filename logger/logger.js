'use strict'

var Logger = {
    getTimedMessage: function(message) {
        return new Date().toISOString() + ' - ' + message;
    },
    info: function(message) {
        console.info(this.getTimedMessage(message));
    },
    log: function(message, params) {
        console.log(this.getTimedMessage(message), params);
    },
    error: function(message) {
        console.error(this.getTimedMessage(message));
    },
    trace: function(message, params) {
        console.trace(this.getTimedMessage(message), params);
    },
}

module.exports = { Logger };