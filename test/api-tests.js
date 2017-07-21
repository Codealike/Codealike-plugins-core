'use strict';

var assert = require('chai').assert;
var expect = require('chai').expect;
var sinon = require('sinon');
var codealikeApi = require('../api/codealikeApi').Api
var logger = require('../logger/logger').Logger;

describe('Codealike initialization', function() {
    it('Initialization configuration', function() {
        expect(() => codealikeApi.initialize())
            .to.throw('Codealike api initialization requires a client Id');
    });
});


describe('Authentication', function() {
    it('Succesfully authenticate', done => {
        codealikeApi.initialize('testClient');

        codealikeApi
            .authenticate('weak-9396226521/2f0928f1-5df7-43ca-be4f-e54ff99285f6')
            .then(result => { logger.trace("Authenticate success", result); done(); })
            .catch(error => { throw new Error("Athentication shouldn't fail");  done(); });

        codealikeApi.dispose();
    });

    it('fail by parameter', done => {
        codealikeApi.initialize('testClient');

        codealikeApi
            .authenticate('invalidtoken')
            .then(result => { throw new Error("Should throw an error"); done(); })
            .catch(error => { logger.trace("Authenticate failed", error); done(); });

        codealikeApi.dispose();
    });

    it('not authenticate', done => {
        codealikeApi.initialize('testClient');

        codealikeApi
            .authenticate('weak-9396226521/2f0928f1-5df7-43ca-be4f-e54ff99285f0')
            .then(result => { throw new Error("Invalid token should not authenticate"); done(); })
            .catch(error => { done(); });

        codealikeApi.dispose();
    });
});

describe('Get profile', function() {
    it('Succesfully get profile', done => {
        codealikeApi.initialize('testClient');

        codealikeApi
            .authenticate('weak-9396226521/2f0928f1-5df7-43ca-be4f-e54ff99285f6')
            .then(result => { 
                codealikeApi.getProfile().then(
                    profileResult => {
                        logger.trace("Get profile", profileResult);
                        done(); 
                    },
                    profileError => {
                        throw new Error("Profile obtention shouldn't fail");
                        done(); 
                    }
                )
            })
            .catch(error => { throw new Error("Athentication shouldn't fail");  done(); });

        codealikeApi.dispose();
    });

    it('Not authenticated', done => {
        codealikeApi.initialize('testClient');

        codealikeApi
            .getProfile()
            .then(result => { throw new Error("Should throw an error"); done(); })
            .catch(error => { done(); });

        codealikeApi.dispose();
    });
});