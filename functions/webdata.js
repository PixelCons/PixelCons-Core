/***********************************************************************
 * webdata.js
 * Provides functions for fetching data from the web
 ***********************************************************************/
const http = require('http');
const https = require('https');

// Settings
const requestTimeout = 2000;

// Performs a POST request
function doPOST(url, data) {
    return new Promise(function(resolve, reject) {
		let urlObject = new URL(url);
		let options = {
			method: 'POST',
			hostname: urlObject.hostname,
			port: urlObject.port,
			path: urlObject.pathname,
			timeout: requestTimeout,
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': data.length
			}
		};
		let protocol = url.indexOf('https') == 0 ? https : http;
        let req = protocol.request(options, res => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error('statusCode=' + res.statusCode));
            }
            let body = [];
            res.on('data', function(chunk) {
                body.push(chunk);
            });
            res.on('end', function() {
                resolve(Buffer.concat(body).toString());
            });
        });
        req.on('error', function(err) {
            reject(err);
        });
		req.on('timeout', function() {
			req.abort();
		});
        req.write(data);
        req.end();
    });
}

// Performs a GET request
function doGET(url) {
    return new Promise(function(resolve, reject) {
		let urlObject = new URL(url);
		let options = {
			method: 'GET',
			hostname: urlObject.hostname,
			port: urlObject.port,
			path: urlObject.pathname,
			timeout: requestTimeout
		};
		let protocol = url.indexOf('https') == 0 ? https : http;
        let req = protocol.request(options, res => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error('statusCode=' + res.statusCode));
            }
            let body = [];
            res.on('data', function(chunk) {
                body.push(chunk);
            });
            res.on('end', function() {
                resolve(Buffer.concat(body).toString());
            });
        });
        req.on('error', function(err) {
            reject(err);
        });
		req.on('timeout', function() {
			req.abort();
		});
        req.end();
    });
}

// Export
module.exports = {
    doPOST: doPOST,
	doGET: doGET
}
