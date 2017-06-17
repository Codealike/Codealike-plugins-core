'use strict'

var Constants = {
    ActivityType: {
        None: -1,
        Idle: 0,
        System: 1,
        Coding: 2,
        Debugging: 3,
        Navigating: 4,
        Building: 5,
        
        Event: 1000,

        DocumentFocus: 1001,
        DocumentEdit: 1002,

        OpenSolution: 1003,
        CloseSolution: 1004,
        BuildSolutionFailed: 1005,
        BuildSolutionSucceded: 1006,
        BuildSolutionCancelled: 1007,

        BuildProject: 1008,
        BuildProjectFailed: 1009,
        BuildProjectSucceeded: 1010,
        BuildProjectCancelled: 1011
    },
    TrackActivity: {
        Always = 0,
        AskEveryTime = 1,
        Never = 2
    }
}

module.exports = { Constants };