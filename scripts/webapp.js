/***********************************************************************
 * webapp.js
 * Hosts the application in a simple server implementation
 ***********************************************************************/
const path = require('path');
const express = require('express');
const webbuild = require('./webbuild.js');
const webFunctions = require('../functions/webFunctions.js');

// Settings
const serverPort = 8080;

// Start Server
if (require.main === module) {
	const args = process.argv.slice(2);
	const debugMode = args.indexOf('-debug') > -1;
	(async function () {
		try {
			//build
			if (!debugMode) {
				await webbuild.build(true);
				console.log('');
			}
			
			//start server
			start(debugMode);
			
		} catch (err) {
			console.log('Failed to start server...');
			console.log(err);
		}
	})();
}

// Server Startup
function start(debugMode) {
	console.log('Starting server...');
	let app = express();
	
	//serve all build/source files
	app.use(express.static(debugMode ? webbuild.appSourcePath : webbuild.appBuildPath));
	
	//web functions
	app.get('/meta/data/:id', async function(req, res) {
		let metadata = await webFunctions.getMetadata(req.params.id, req.query);
		if(!metadata.errorText) {
			res.contentType('application/json');
			res.send(JSON.stringify(metadata)); 
		} else {
			res.status(500).send(metadata.errorText);
		}
	});
	app.get('/meta/image/:id', async function(req, res) {
		let imageData = await webFunctions.getStandardImage(req.params.id, req.query.index, req.query.color);
		if(!imageData.errorText) {
			res.contentType('image/png');
			res.end(imageData, 'binary');
		} else {
			res.status(500).send(imageData.errorText);
		}
	});
	app.get('/meta/image_multi/:ids', async function(req, res) {
		let imageData = await webFunctions.getMultiImage(req.params.ids.split(','), req.query.color);
		if(!imageData.errorText) {
			res.contentType('image/png');
			res.end(imageData, 'binary');
		} else {
			res.status(500).send(imageData.errorText);
		}
	});
	
	//default page
	app.get('*', async function (req, res) {
		//serve the contract files
		if (debugMode) {
			let contractsServePath = webbuild.appContractsBuildPath.substring(webbuild.appBuildPath.length + 1, webbuild.appContractsBuildPath.length);
			for (let i = 0; i < webbuild.appContracts.length; i++) {
				let contractFileServePath = '/' + contractsServePath + '/' + path.basename(webbuild.appContracts[i]);
				if (contractFileServePath == req.url) {
					res.sendFile(webbuild.appContracts[i]);
					return;
				}
			}
		}
		
		//unrecognized file
		let requestPath = req.originalUrl;
		if(requestPath.lastIndexOf('.') > -1 && ((requestPath.length - requestPath.lastIndexOf('.')) == 4 || (requestPath.length - requestPath.lastIndexOf('.')) == 5)) {
			res.sendStatus(404);
			return;
		}
		
		//return main page html with customized tag data
		let plainHTMLPath = req.protocol + '://' + req.get('host') + '/index.html';
		let pageHTML = await webFunctions.getTagDataHTML(requestPath, plainHTMLPath);
		if(!pageHTML.errorText) {
			res.set('Content-Type', 'text/html');
			res.send(Buffer.from(pageHTML));
		} else {
			res.status(500).send(pageHTML.errorText);
		}
	});

	//start express app server
	app.listen(serverPort);
	console.log('Hosting on port ' + serverPort);
}

// Utils
function resolvePath(p) {
	let paths = [path.join(__dirname, '..')];
	paths = paths.concat(p.split('/'));
	return path.join.apply(null, paths);
}

// Export functions
module.exports = {
    start: start
}
