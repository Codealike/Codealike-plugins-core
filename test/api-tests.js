'use strict';

var assert = require('chai').assert;
var expect = require('chai').expect;
var sinon = require('sinon');
var codealikeApi = require('../api/codealikeApi').Api

describe('Codealike initialization', function() {
    it('Initialization configuration', function() {
        expect(() => codealikeApi.initialize())
            .to.throw('Codealike api initialization requires a client Id');
    });
});


describe('Authentication', function() {
    it('Succesfully authenticate', function() {
        codealikeApi.initialize('testClient');

        codealikeApi.authenticate('weak-9396226521/2f0928f1-5df7-43ca-be4f-e54ff99285f6');
    });
});
