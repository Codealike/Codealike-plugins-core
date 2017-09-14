var os = require('os');
var dns = require('dns');

const hostNameHelpers = {
    getHostFQDN: function() {
        return new Promise(function(resolve, reject) {
            var hostName = os.hostname();

            dns.lookup(hostName, { hints: dns.ADDRCONFIG }, function(err, ip) {
                dns.lookupService(ip, 0, function (err, hostname, service) {
                    if (err) {
                        reject(err);
                    }
                    resolve(hostname);
                });
            });
        });
    }
}

module.exports = hostNameHelpers;