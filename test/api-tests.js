'use strict';

var assert = require('chai').assert;
var expect = require('chai').expect;
var sinon = require('sinon');
var codealikeApi = require('../api/codealikeApi').Api
var logger = require('../logger/logger').Logger;

describe('Codealike api initialization', function() {
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
            .then(result => { 
                assert.isNotNull(codealikeApi.userId, "Api should have a valid user id after a successfull authentication");
                assert.isNotNull(codealikeApi.token, "Api should have a valid user token after a successfull authentication");
                done(); })
            .catch(error => { throw new Error("Athentication shouldn't fail");  done(); });

        codealikeApi.dispose();
    });

    it('fail by parameter', done => {
        codealikeApi.initialize('testClient');

        codealikeApi
            .authenticate('invalidtoken')
            .then(
                (result) => { 
                    throw new Error("Should throw an error"); 
                    done(); 
                },
                (error) => { 
                    assert.equal(error, "Invalid token provided", "Api should reject with token error if token is invalid");
                    assert.isNull(codealikeApi.userId, "Api should clean user id after a invalid authentication");
                    assert.isNull(codealikeApi.token, "Api should clean user token after a invalid authentication");
                    done(); 
                }
            );

        codealikeApi.dispose();
    });

    it('not authenticate', done => {
        codealikeApi.initialize('testClient');

        codealikeApi
            .authenticate('weak-9396226521/2f0928f1-5df7-43ca-be4f-e54ff99285f0')
            .then(
                (result) => { 
                    throw new Error("Invalid token should not authenticate"); 
                    done(); 
                },
                (error) => { 
                    assert.isNull(codealikeApi.userId, "Api should clean user id after a invalid authentication");
                    assert.isNull(codealikeApi.token, "Api should clean user token after a invalid authentication");
                    done(); 
                }
            );

        codealikeApi.dispose();
    });
});

describe('Get profile', function() {
    it('Succesfully get profile', done => {
        codealikeApi.initialize('testClient');

        // manually configure valid authentication information
        codealikeApi.isAuthenticated = true;
        codealikeApi.userId = 'weak-9396226521';
        codealikeApi.token = '2f0928f1-5df7-43ca-be4f-e54ff99285f6'

        codealikeApi.getProfile().then(
            (res) => {
                logger.trace("Get profile", res);
                done(); 
            },
            (err) => {
                throw new Error("Profile obtention shouldn't fail");
                done(); 
            }
        );

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