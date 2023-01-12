const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// this function returns the base common request
// configuration required to hit the api
function getRequestConfig(requestMethod, clientId, identity, token, model) {
    // create request configuration for requested method
    let config = {
        headers: {
            'Content-Type': 'application/json',
            'X-Eauth-Client': clientId,
            'X-Api-Identity': identity,
            'X-Api-Token': token
        },
        method: requestMethod
    };

    // attach model to request body if defined
    if (model) {
        config.body = JSON.stringify(model);
    }

    return config;
}

// this function handles api response checking
// if response if succesfull or not
function handleResponse(response) {
    if (response.ok) {
        return response.clone().json().catch(function() {
            return response.text();
        });
    } else {
        var error = new Error(response.statusText);
        error.response = response;
        throw error;
    }
}

var RestClient = {
    clientId: null,
    apiUrl: null,

    initialize: (clientId, apiUrl) => {
        this.clientId = clientId;
        this.apiUrl = apiUrl;
    },

    executeAnonymousGet: (url) => {
        return new Promise(
            function(resolve, reject) {
                fetch(url, {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    method: 'GET'
                })
                .then(r => handleResponse(r))
                .then(
                    result => resolve(result), 
                    error => reject(error)
                )
                .catch(error => reject(error));
        });
    },

    executeGet: (clientId, route, userId, userToken) => {
        let url = `${this.apiUrl}/${route}`;
        let config = getRequestConfig('GET', clientId, userId, userToken);
        
        return new Promise(
            function(resolve, reject) {
            fetch(url, config)
                .then(r => handleResponse(r))
                .then(
                    result => resolve(result), 
                    error => reject(error)
                )
                .catch(error => reject(error));
        });
    },
    executePost: (clientId, route, userId, userToken, body) => {
        let url = `${this.apiUrl}/${route}`;
        let config = getRequestConfig('POST', clientId, userId, userToken, body);
        
        return new Promise(
            function(resolve, reject) {
            fetch(url, config)
                .then(r => handleResponse(r))
                .then(
                    (result) => resolve(result), 
                    (error) => reject(error)
                )
                .catch(error => reject(error));
        });
    }
}

module.exports = { RestClient };