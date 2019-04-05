'use strict';

var assert = require('chai').assert;
var moment = require('moment');

describe('Time Calculations', function() {

    it('Calculate correct event duration', function() {
        var start = "2017-09-07T09:45:26-03:00";
        var end = "2017-09-07T09:45:32-03:00";
        var duration = moment.utc(moment(end).diff(moment(start))).format("HH:mm:ss");
        assert.equal(duration, '00:00:06', 'Duration should be 6 secs.');
    });
});